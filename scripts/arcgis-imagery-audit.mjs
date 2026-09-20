import { writeFile } from "node:fs/promises";
import { build } from "esbuild";

const ARCGIS = "https://www.arcgis.com/sharing/rest";
const DISCOVERY_TYPES = new Set([
  "WMTS", "Map Service", "Image Service", "Web Map", "Web Mapping Application",
  "Experience Builder", "Hub Site Application", "Dashboard", "StoryMap",
]);
const IMAGERY_PATTERN = /\b(aerial|aerials|airphoto|air photo|eagleview|imagery|image service|nearmap|ortho|orthophoto|orthophotography|photo|pictometry|wmts)\b/i;
const APP_PATTERN = /(web map|web mapping application|experience builder|hub site application|dashboard|storymap)/i;
const SECRET_PATTERN = /^(token|access_token|api_?key|key|signature|sig|client_secret)$/i;
const auditedAt = new Date().toISOString().slice(0, 10);
const write = process.argv.includes("--write");
const itemCache = new Map();
const orgCache = new Map();
const searchCache = new Map();

const counties = await loadCounties();
const existing = await loadExistingSources();
const discovery = await mapConcurrent(counties, 8, discoverCounty);
const officialOrgIds = [...new Set(discovery.flatMap((entry) => entry.organizations.map((org) => org.id)))];
const orgItems = new Map((await mapConcurrent(officialOrgIds, 6, async (orgId) => [orgId, await searchAll(`orgid:${orgId} AND access:public`)])));
const standaloneOwners = [...new Set(discovery.flatMap((entry) => entry.officialStandaloneOwners))];
const ownerItems = new Map((await mapConcurrent(standaloneOwners, 8, async (owner) => [owner, await searchAll(`owner:${JSON.stringify(owner)} AND access:public`)])));

const countyResults = await mapConcurrent(discovery, 5, async (entry) => inspectCounty(entry, orgItems, ownerItems));
const report = {
  schemaVersion: 1,
  auditedAt,
  methodology: {
    discovery: "ArcGIS REST search plus official organization metadata; no ArcGIS website search UI was used.",
    enumeration: "All public items in every matched official ArcGIS Online organization and every official standalone owner referenced by the checked-in county source registry were paged through the REST search API.",
    inspection: "Relevant service items and every public Web Map, Web Mapping Application, Experience Builder app, Hub site, Dashboard, and StoryMap were checked through their item metadata and /data response. Referenced item IDs and service URLs were followed.",
    safety: "Credential-bearing URLs were redacted and not requested. Vendor services are evidence only unless published terms allow embedding.",
  },
  totals: summarize(countyResults),
  counties: countyResults,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (write) {
  await writeFile("docs/minnesota-county-arcgis-imagery-audit.json", serialized);
  await writeFile("docs/minnesota-county-arcgis-imagery-audit.md", markdown(report));
}
console.log(JSON.stringify(report.totals, null, 2));

async function discoverCounty(county) {
  const phrase = `${county.name} County`;
  const queries = [
    `\"${phrase}\" AND (imagery OR aerial OR ortho OR orthophoto OR pictometry OR eagleview OR WMTS)`,
    `\"${phrase}\" AND (type:\"Web Map\" OR type:\"Web Mapping Application\" OR type:\"Experience Builder\" OR type:\"Hub Site Application\")`,
    `\"${phrase}\" AND Minnesota`,
  ];
  const searchedResults = dedupeById((await Promise.all(queries.map(searchAll))).flat());
  const searched = (await mapConcurrent(searchedResults, 12, (item) => getItem(item.id))).filter(Boolean);
  const knownItems = await knownItemsForCounty(county.name);
  const candidates = dedupeById([...searched, ...knownItems]);
  const orgIds = [...new Set(candidates.map((item) => item.orgId).filter(Boolean))];
  const orgs = await mapConcurrent(orgIds, 8, getOrganization);
  const organizations = orgs.filter((org) => org && isOfficialCountyOrg(org, county, candidates.filter((item) => item.orgId === org.id)));
  const officialIds = new Set(organizations.map((org) => org.id));
  const seedItems = candidates.filter((item) => officialIds.has(item.orgId));
  const officialStandaloneOwners = [...new Set(knownItems.filter((item) => !officialIds.has(item.orgId)).map((item) => item.owner).filter(Boolean))];
  return { ...county, organizations, officialStandaloneOwners, seedItems };
}

async function inspectCounty(entry, orgItems, ownerItems) {
  const officialItems = dedupeById([
    ...entry.organizations.flatMap((org) => orgItems.get(org.id) ?? []),
    ...entry.officialStandaloneOwners.flatMap((owner) => ownerItems.get(owner) ?? []),
  ]);
  const inspectable = officialItems.filter((item) => DISCOVERY_TYPES.has(item.type) || IMAGERY_PATTERN.test(itemText(item)));
  const itemDetails = await mapConcurrent(inspectable, 10, async (item) => {
    const data = needsData(item) ? await getJson(`${ARCGIS}/content/items/${item.id}/data?f=json`) : null;
    return { item, data };
  });
  const references = collectReferences(itemDetails);
  const referencedItems = await mapConcurrent(references.itemIds, 10, getItem);
  const allItems = dedupeById([...inspectable, ...referencedItems.filter(Boolean)]);
  const serviceUrls = [...new Set([
    ...allItems.map((item) => item.url),
    ...references.urls,
  ].filter(Boolean).map(sanitizeUrl).filter(Boolean))];
  const services = await mapConcurrent(serviceUrls.filter(isRelevantService), 6, (url) => inspectService(url, entry.bounds));
  const imageryItems = allItems.filter((item) => item.type === "WMTS" || /\/(MapServer|ImageServer)(?:\/\d+)?(?:\?|$)/i.test(item.url ?? "") || IMAGERY_PATTERN.test(itemText(item)));
  const owners = [...new Set(officialItems.map((item) => item.owner).filter(Boolean))].sort();
  const configured = existing.filter((source) => source.county === entry.name);
  return {
    county: entry.name,
    fips: entry.fips,
    officialOrganizations: entry.organizations.map(({ id, name, urlKey, description }) => ({ id, name, urlKey, description: plain(description) })),
    officialOwners: [...new Set([...owners, ...entry.officialStandaloneOwners])].sort(),
    publicItemCount: officialItems.length,
    inspectedItemCount: inspectable.length,
    imageryItems: imageryItems.map(compactItem),
    services: services.filter((service) => service && (service.kind === "WMTS" || service.imageryLikely)),
    configuredSources: configured,
    notes: entry.organizations.length || entry.officialStandaloneOwners.length ? [] : ["No ArcGIS Online organization or standalone owner whose public metadata identifies this Minnesota county was found by the REST discovery queries; county Enterprise services and existing official source records remain authoritative where present."],
  };
}

async function inspectService(input, countyBounds) {
  if (!input || hasSecret(input)) return { url: redact(input), status: "skipped-credential-bearing-url" };
  const url = new URL(input);
  try {
    if (/\/wmts\/?$/i.test(url.pathname) || /service=wmts/i.test(url.search)) return await inspectWmts(url, countyBounds);
    const match = url.pathname.match(/\/(MapServer|ImageServer)(?:\/\d+)?\/?$/i);
    if (!match) return null;
    url.search = "";
    url.searchParams.set("f", "json");
    const response = await fetch(url, { headers: { Origin: "https://mnmapping.example" }, signal: AbortSignal.timeout(20_000) });
    const body = await response.text();
    if (!body.trim()) throw new Error(`${response.status} empty response`);
    const metadata = JSON.parse(body);
    if (metadata.error) throw new Error(metadata.error.message ?? "ArcGIS error");
    const base = new URL(url); base.search = "";
    const isImage = /ImageServer/i.test(match[1]);
    const operation = new URL(`${base.toString().replace(/\/$/, "")}/${isImage ? "exportImage" : "export"}`);
    operation.searchParams.set("bbox", [countyBounds.west, countyBounds.south, countyBounds.east, countyBounds.north].join(","));
    operation.searchParams.set("bboxSR", "4326");
    operation.searchParams.set("imageSR", "4326");
    operation.searchParams.set("size", "256,256");
    operation.searchParams.set("format", "jpg");
    operation.searchParams.set("f", "image");
    if (!isImage) operation.searchParams.set("transparent", "false");
    const image = await fetch(operation, { headers: { Origin: "https://mnmapping.example" }, signal: AbortSignal.timeout(25_000) });
    const imageryLikely = IMAGERY_PATTERN.test(`${base} ${metadata.mapName ?? ""} ${metadata.name ?? ""} ${metadata.description ?? ""} ${metadata.copyrightText ?? ""} ${(metadata.layers ?? []).map((layer) => layer.name).join(" ")}`);
    return {
      kind: match[1], url: base.toString(), title: metadata.mapName ?? metadata.name ?? "",
      bounds: extent(metadata.fullExtent ?? metadata.extent), tileMatrixSet: metadata.tileInfo?.spatialReference?.latestWkid ?? metadata.tileInfo?.spatialReference?.wkid ?? null,
      format: metadata.tileInfo?.format ?? "export image", fees: null, accessConstraints: metadata.copyrightText || null,
      cors: image.headers.get("access-control-allow-origin"), anonymousContentVerified: image.ok && /^image\//i.test(image.headers.get("content-type") ?? ""),
      verificationStatus: image.ok ? `${image.status} ${image.headers.get("content-type") ?? ""}`.trim() : `${image.status} ${image.statusText}`,
      imageryLikely,
    };
  } catch (error) {
    return { url: redact(input), status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

async function inspectWmts(input, countyBounds) {
  const url = new URL(input); url.search = "";
  url.searchParams.set("SERVICE", "WMTS"); url.searchParams.set("REQUEST", "GetCapabilities"); url.searchParams.set("VERSION", "1.0.0");
  const response = await fetch(url, { headers: { Origin: "https://mnmapping.example" }, signal: AbortSignal.timeout(25_000) });
  const xml = await response.text();
  if (!response.ok || !/<(?:\w+:)?Capabilities\b/i.test(xml)) throw new Error(`${response.status} ${response.statusText}`);
  const fees = tag(xml, "Fees");
  const accessConstraints = tag(xml, "AccessConstraints");
  const layers = blocks(xml, "Layer").map((block) => {
    const identifier = tag(block, "Identifier");
    const bounds = wmtsBounds(block);
    return {
      identifier, title: tag(block, "Title"), bounds,
      tileMatrixSet: tag(block, "TileMatrixSet"), formats: tags(block, "Format"),
      resourceTemplate: redact(attribute(block, "ResourceURL", "template")),
      acquisitionYear: yearFrom(`${identifier} ${tag(block, "Title")}`),
    };
  }).filter((layer) => layer.identifier && intersects(layer.bounds, countyBounds));
  let tile = null;
  const candidate = layers.toSorted((a, b) => (b.acquisitionYear ?? 0) - (a.acquisitionYear ?? 0))[0];
  if (candidate) tile = await verifyWmtsTile(input, candidate, countyBounds);
  return {
    kind: "WMTS", url: url.toString(), fees, accessConstraints,
    cors: response.headers.get("access-control-allow-origin"), layers,
    anonymousContentVerified: Boolean(tile?.ok), verificationStatus: tile?.status ?? "capabilities-only",
  };
}

async function verifyWmtsTile(baseUrl, layer, countyBounds) {
  if (hasSecret(baseUrl)) return { ok: false, status: "credential-bearing URL skipped" };
  const center = { lon: (countyBounds.west + countyBounds.east) / 2, lat: (countyBounds.south + countyBounds.north) / 2 };
  const zoom = 10;
  const scale = 2 ** zoom;
  const col = Math.floor((center.lon + 180) / 360 * scale);
  const row = Math.floor((1 - Math.asinh(Math.tan(center.lat * Math.PI / 180)) / Math.PI) / 2 * scale);
  const url = new URL(baseUrl); url.search = "";
  for (const [key, value] of Object.entries({ SERVICE: "WMTS", REQUEST: "GetTile", VERSION: "1.0.0", LAYER: layer.identifier, STYLE: "default", TILEMATRIXSET: layer.tileMatrixSet, TILEMATRIX: String(zoom), TILEROW: String(row), TILECOL: String(col), FORMAT: layer.formats[0] ?? "image/png" })) url.searchParams.set(key, value);
  try {
    const response = await fetch(url, { headers: { Origin: "https://mnmapping.example" }, signal: AbortSignal.timeout(25_000) });
    const type = response.headers.get("content-type") ?? "";
    return { ok: response.ok && /^image\//i.test(type), status: `${response.status} ${type} CORS=${response.headers.get("access-control-allow-origin") ?? "none"}` };
  } catch (error) { return { ok: false, status: error instanceof Error ? error.message : String(error) }; }
}

function collectReferences(details) {
  const itemIds = new Set(); const urls = new Set();
  for (const { data } of details) {
    const text = JSON.stringify(data ?? {});
    for (const match of text.matchAll(/\b[0-9a-f]{32}\b/gi)) itemIds.add(match[0].toLowerCase());
    for (const match of text.matchAll(/https?:\\?\/\\?\/[^"'<>\s}]+/gi)) {
      const candidate = match[0].replaceAll("\\/", "/").replace(/[),.;]+$/, "");
      if (isRelevantService(candidate)) urls.add(candidate);
    }
  }
  return { itemIds: [...itemIds], urls: [...urls] };
}

async function knownItemsForCounty(county) {
  const ids = existing.filter((entry) => entry.county === county).flatMap((entry) => [...String(entry.url ?? "").matchAll(/\b[0-9a-f]{32}\b/gi)].map((match) => match[0]));
  return (await mapConcurrent([...new Set(ids)], 8, getItem)).filter(Boolean);
}

async function searchAll(query) {
  if (searchCache.has(query)) return searchCache.get(query);
  const promise = searchAllUncached(query);
  searchCache.set(query, promise);
  return promise;
}
async function searchAllUncached(query) {
  const results = []; let start = 1;
  do {
    const url = new URL(`${ARCGIS}/search`); url.searchParams.set("q", query); url.searchParams.set("num", "100"); url.searchParams.set("start", String(start)); url.searchParams.set("f", "json");
    const page = await getJson(url);
    if (page.error) break;
    results.push(...(page.results ?? [])); start = page.nextStart;
  } while (start && start !== -1 && results.length < 10_000);
  return results;
}

async function getItem(id) {
  if (!itemCache.has(id)) itemCache.set(id, getJson(`${ARCGIS}/content/items/${id}?f=json`).then((value) => value?.id ? value : null));
  return itemCache.get(id);
}
async function getOrganization(id) {
  if (!orgCache.has(id)) orgCache.set(id, getJson(`${ARCGIS}/portals/${id}?f=json`).then((value) => value?.id ? {
    id: value.id,
    name: value.name ?? "",
    urlKey: value.urlKey ?? "",
    description: value.description ?? "",
    authorizedCrossOriginDomains: value.authorizedCrossOriginDomains ?? [],
  } : null));
  return orgCache.get(id);
}
async function getJson(input) {
  try { const response = await fetch(input, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) }); return response.ok ? await response.json() : {}; }
  catch { return {}; }
}

async function loadCounties() {
  return loadTsJson(`import { countyRegistry } from "./src/config/counties"; console.log(JSON.stringify(countyRegistry.map(({name,fips,bounds})=>({name,fips,bounds}))));`);
}
async function loadExistingSources() {
  return loadTsJson(`
    import { countyRegistry } from "./src/config/counties";
    import { restrictedImagerySources } from "./src/config/restrictedImagery";
    import { imageryResearchLeads } from "./src/config/imageryResearchLeads";
    const layers=countyRegistry.flatMap(c=>c.layers.filter(l=>l.category==="imagery").map(l=>({county:c.name,kind:"configured",id:l.id,year:l.year,url:l.sourceUrl??l.url})));
    console.log(JSON.stringify([...layers,...restrictedImagerySources.map(s=>({...s,kind:"external"})),...imageryResearchLeads.map(s=>({...s,kind:"lead"}))]));
  `);
}
async function loadTsJson(contents) {
  const output = await build({ stdin: { contents, resolveDir: process.cwd(), sourcefile: "arcgis-audit-entry.ts", loader: "ts" }, bundle: true, platform: "node", format: "esm", write: false, tsconfig: "tsconfig.json" });
  let value = ""; const log = console.log; console.log = (message) => { value = String(message); };
  await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`); console.log = log;
  return JSON.parse(value);
}

function isOfficialCountyOrg(org, county, seedItems) {
  const haystack = plain(`${org.name} ${org.description} ${org.urlKey}`).toLowerCase();
  const words = county.name.toLowerCase().replaceAll(".", "").split(/\s+/).filter((word) => word !== "of" && word !== "the");
  const countyMatch = words.every((word) => haystack.includes(word)) && /county|co\b/.test(haystack);
  const stateEvidence = /minnesota|\bmn\b/.test(haystack)
    || (org.authorizedCrossOriginDomains ?? []).some(isMinnesotaGovernmentUrl)
    || seedItems.some((item) => /minnesota|\bmn\b/i.test(itemText(item)) || isMinnesotaGovernmentUrl(item.url));
  return countyMatch && stateEvidence;
}
function needsData(item) { return APP_PATTERN.test(item.type ?? "") || item.type === "Web Map" || item.type === "WMTS" || IMAGERY_PATTERN.test(itemText(item)); }
function itemText(item) { return plain(`${item.title ?? ""} ${item.snippet ?? ""} ${item.description ?? ""} ${(item.tags ?? []).join(" ")}`); }
function compactItem(item) { return { id: item.id, owner: item.owner, orgId: item.orgId, title: item.title, type: item.type, url: redact(item.url), bounds: item.extent ?? null, accessInformation: plain(item.accessInformation), licenseInfo: plain(item.licenseInfo) }; }
function isRelevantService(url) { return /\/wmts(?:\?|\/?$)|\/(?:MapServer|ImageServer)(?:\/\d+)?(?:\?|\/?$)/i.test(url ?? ""); }
function hasSecret(input) { try { return [...new URL(input).searchParams.keys()].some((key) => SECRET_PATTERN.test(key)); } catch { return false; } }
function sanitizeUrl(input) { try { const url = new URL(input); for (const key of [...url.searchParams.keys()]) if (SECRET_PATTERN.test(key)) url.searchParams.set(key, "REDACTED"); return url.toString(); } catch { return null; } }
function redact(input) { return input ? sanitizeUrl(input) ?? input : null; }
function extent(value) { if (!value) return null; return { west: value.xmin, south: value.ymin, east: value.xmax, north: value.ymax, spatialReference: value.spatialReference?.latestWkid ?? value.spatialReference?.wkid ?? null }; }
function plain(value) { return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
function dedupeById(items) { return [...new Map(items.filter((item) => item?.id).map((item) => [item.id, item])).values()]; }
function yearFrom(value) { const years = [...String(value).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map((match) => Number(match[1])); return years.length ? Math.max(...years) : null; }
function tag(xml, name) { return plain(xml.match(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "i"))?.[1]); }
function tags(xml, name) { return [...xml.matchAll(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "gi"))].map((match) => plain(match[1])); }
function blocks(xml, name) { return [...xml.matchAll(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>[\\s\\S]*?<\\/(?:\\w+:)?${name}>`, "gi"))].map((match) => match[0]); }
function attribute(xml, name, attributeName) { return xml.match(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*\\b${attributeName}=["']([^"']+)["']`, "i"))?.[1] ?? null; }
function wmtsBounds(block) { const text = tag(block, "WGS84BoundingBox"); const lower = tag(text, "LowerCorner").split(/\s+/).map(Number); const upper = tag(text, "UpperCorner").split(/\s+/).map(Number); return lower.length === 2 && upper.length === 2 && lower.every(Number.isFinite) && upper.every(Number.isFinite) ? { west: lower[0], south: lower[1], east: upper[0], north: upper[1] } : null; }
function intersects(a, b) { return !a || (a.west <= b.east && a.east >= b.west && a.south <= b.north && a.north >= b.south); }
function isMinnesotaGovernmentUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host.endsWith(".mn.us") || host.endsWith(".mn.gov") || host.includes("minnesota");
  } catch { return false; }
}
async function mapConcurrent(items, limit, task) { const results = new Array(items.length); let next = 0; await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (next < items.length) { const index = next++; results[index] = await task(items[index], index); } })); return results; }

function summarize(results) {
  const organizations = new Set(results.flatMap((county) => county.officialOrganizations.map((org) => org.id)));
  const owners = new Set(results.flatMap((county) => county.officialOwners));
  return {
    countiesAudited: results.length,
    countiesWithOfficialArcGisOnlineOrg: results.filter((county) => county.officialOrganizations.length).length,
    officialOrganizations: organizations.size,
    officialOwners: owners.size,
    publicItemsEnumerated: results.reduce((sum, county) => sum + county.publicItemCount, 0),
    itemsInspected: results.reduce((sum, county) => sum + county.inspectedItemCount, 0),
    servicesInspected: results.reduce((sum, county) => sum + county.services.length, 0),
    wmtsLayersFound: results.reduce((sum, county) => sum + county.services.filter((service) => service.kind === "WMTS").reduce((count, service) => count + service.layers.length, 0), 0),
    anonymouslyVerifiedServices: results.reduce((sum, county) => sum + county.services.filter((service) => service.anonymousContentVerified).length, 0),
  };
}

function markdown(report) {
  const lines = [
    "# Minnesota county ArcGIS imagery audit", "", `Verified ${report.auditedAt}. The machine-readable evidence is in \`minnesota-county-arcgis-imagery-audit.json\`.`, "",
    "This audit uses ArcGIS REST search, public organization metadata, full paginated organization item enumeration, item `/data` documents, referenced items, and live service requests. ArcGIS modified dates are never used as acquisition years. URLs carrying token-like query parameters are redacted and skipped.", "",
    "## Statewide summary", "",
    ...Object.entries(report.totals).map(([key, value]) => `- ${key}: ${value}`), "", "## County census", "",
    "| County | Official ArcGIS organizations | Relevant owners | Public items | Inspected | Imagery/service findings |", "| --- | --- | --- | ---: | ---: | ---: |",
    ...report.counties.map((county) => `| ${county.county} | ${county.officialOrganizations.map((org) => `${org.name} (${org.id})`).join("; ") || "None identified"} | ${county.officialOwners.join(", ") || "None identified"} | ${county.publicItemCount} | ${county.inspectedItemCount} | ${county.imageryItems.length}/${county.services.length} |`),
    "", "## Interpretation", "", "An organization match is accepted only when the public ArcGIS organization name/description identifies both the county and Minnesota. `None identified` does not mean the county lacks GIS; it means the audit did not find a qualifying ArcGIS Online organization. Official county Enterprise services and county-controlled external viewers remain recorded elsewhere in the registry.", "",
  ];
  return `${lines.join("\n")}\n`;
}
