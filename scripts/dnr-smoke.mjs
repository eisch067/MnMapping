import { build } from "esbuild";

// Live check of every DNR Recreation layer, made anonymously against DNR's own services. It runs
// on a schedule (.github/workflows/dnr-smoke.yml) and on demand, never per pull request, so a
// change in DNR's services cannot block unrelated work.

// Feature counts DNR reported on 2026-09-23. A layer far from its snapshot has probably been
// replaced or emptied, which a person should look at before the layer keeps drawing.
const expectedCounts = {
  "mndnr-deer-permit-areas": 130,
  "mndnr-bear-permit-areas": 17,
  "mndnr-turkey-permit-areas": 12,
  "mndnr-cwd-zones": 130,
  "mndnr-cwd-sampling-sites": 133,
  "mndnr-walk-in-access-sites": 224,
  "mndnr-hunter-walking-trails": 304,
  "mndnr-public-water-access": 3025,
  "mndnr-fishing-sites": 463,
  "mndnr-migratory-waterfowl-areas": 46,
  "mndnr-walk-in-access-trails": 23,
  "mndnr-state-forest-roads": 1634,
  "mndnr-state-forest-campgrounds": 61,
  "mndnr-listed-infested-waters": 1688,
  "mndnr-ruffed-grouse-management-areas": 48,
  "mndnr-state-water-trails": 155,
  "mndnr-state-trails": 978,
  "mndnr-snowmobile-trails": 275,
  "mndnr-ohv-trails": 8044,
  "mndnr-lakes-lakefinder": 21989,
  "mndnr-national-wetlands-inventory": 2372223,
  "mndnr-buffer-protection-lines": 36598,
  "mndnr-buffer-protection-basins": 14492,
};
const geometryTypes = {
  "mndnr-deer-permit-areas": "esriGeometryPolygon",
  "mndnr-bear-permit-areas": "esriGeometryPolygon",
  "mndnr-turkey-permit-areas": "esriGeometryPolygon",
  "mndnr-cwd-zones": "esriGeometryPolygon",
  "mndnr-cwd-sampling-sites": "esriGeometryPoint",
  "mndnr-walk-in-access-sites": "esriGeometryPolygon",
  "mndnr-hunter-walking-trails": "esriGeometryPolyline",
  "mndnr-public-water-access": "esriGeometryPoint",
  "mndnr-fishing-sites": "esriGeometryPoint",
  "mndnr-migratory-waterfowl-areas": "esriGeometryPolygon",
  "mndnr-walk-in-access-trails": "esriGeometryPolyline",
  "mndnr-state-forest-roads": "esriGeometryPolyline",
  "mndnr-state-forest-campgrounds": "esriGeometryPoint",
  "mndnr-listed-infested-waters": "esriGeometryPolygon",
  "mndnr-ruffed-grouse-management-areas": "esriGeometryPolygon",
  "mndnr-state-water-trails": "esriGeometryPolyline",
  "mndnr-state-trails": "esriGeometryPolyline",
  "mndnr-snowmobile-trails": "esriGeometryPolyline",
  "mndnr-ohv-trails": "esriGeometryPolyline",
  "mndnr-lakes-lakefinder": "esriGeometryPolygon",
};
// Bathymetry outline and contour records DNR reported on 2026-09-23, and the layers the map draws.
const referenceMapChecks = {
  "mndnr-national-wetlands-inventory": {
    id: 0,
    name: "Statewide NWI",
    geometry: "esriGeometryPolygon",
    fields: ["attribute", "wetland_type", "acres", "hgm_desc", "spcc_desc", "cow_class1", "circ39_class"],
  },
  "mndnr-buffer-protection-lines": {
    id: 1,
    name: "Pw Watercourse Public Ditches Combined",
    geometry: "esriGeometryPolyline",
    fields: ["description", "buffer_ft", "dnr_sl_cla", "field_review", "potential_trout_delisting"],
  },
  "mndnr-buffer-protection-basins": {
    id: 2,
    name: "Pw Basins For Buffer Map",
    geometry: "esriGeometryPolygon",
    fields: ["pw_basin_name", "buffer_ft", "dnr_sl_class", "dow_lake_number"],
  },
};
const depthMapChecks = [
  // The fields are the ones identify reads (src/lib/dnr/lakeDepth.ts).
  {
    id: 1,
    name: "Lake Bathymetric Outline",
    expected: 7499,
    fields: ["dowlknum", "lake_name", "cty_name", "acres", "island"],
  },
  {
    id: 0,
    name: "Lake Bathymetric Contours",
    expected: 46306,
    fields: ["dowlknum", "lake_name", "abs_depth"],
  },
  { id: 3, name: "Lake Bathymetric Elevation Model" },
];
// A lake DNR has surveyed, used to check that LakeFinder still answers in the shape the app reads.
const knownLake = { dow: "04013500", name: "Beltrami" };
// One query returns at most this many records, so a layer that grows past it must gain a zoom gate.
const recordLimit = 2_000;
const dayInMilliseconds = 24 * 60 * 60 * 1_000;
const configuredSeasonWarningDays = 30;
const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const layers = await loadLayers();
const lakeModules = await loadBundle(`
  export { parseLakeFinder } from "./src/lib/dnr/lakefinder";
  export { lakeMapPath } from "./src/lib/dnr/lakeMap";
`);
const results = await Promise.all([...layers.map(checkLayer), checkLakeFinder()]);
const failed = results.filter((result) => result.problems.length > 0);
const linkResults = await checkLinks(layers);
const failedLinks = linkResults.filter((result) => !result.ok && !result.expectedUnavailable);
const expectedUnavailableLinks = linkResults.filter((result) => result.expectedUnavailable);

console.log(`DNR live smoke: ${results.length - failed.length}/${results.length} layers passed (${new Date().toISOString().slice(0, 10)}).`);
for (const result of results) {
  console.log(`${result.problems.length === 0 ? "PASS" : "FAIL"} ${result.name}${result.count === undefined ? "" : ` (${result.count} features)`}`);
  for (const problem of result.problems) console.log(`  - ${problem}`);
}
console.log(`DNR link check: ${linkResults.length - failedLinks.length}/${linkResults.length} configured links passed; ${expectedUnavailableLinks.length} known RGMA PDFs remain unavailable.`);
for (const result of failedLinks) console.log(`FAIL ${result.url} (${result.status ?? result.error})`);
if (failed.length > 0 || failedLinks.length > 0) process.exitCode = 1;

async function loadBundle(contents) {
  const built = await build({
    stdin: {
      contents,
      resolveDir: process.cwd(),
      sourcefile: "dnr-smoke-lake-entry.ts",
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    tsconfig: "tsconfig.json",
  });
  return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
}

async function loadLayers() {
  const built = await build({
    stdin: {
      contents: `
        import { dnrRecreationLayers } from "./src/config/layers/dnrRecreation";
        console.log(JSON.stringify(dnrRecreationLayers));
      `,
      resolveDir: process.cwd(),
      sourcefile: "dnr-smoke-entry.ts",
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    tsconfig: "tsconfig.json",
  });
  let serialized = "";
  const originalLog = console.log;
  console.log = (value) => { serialized = String(value); };
  await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
  console.log = originalLog;
  return JSON.parse(serialized);
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store", headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url.pathname}`);
  const body = await response.json();
  if (body.error) throw new Error(`${body.error.message ?? "ArcGIS error"} from ${url.pathname}`);
  return body;
}

function queryUrl(layer, params) {
  const url = new URL(`${layer.sourceUrl}/query`);
  for (const [key, value] of Object.entries({ f: "json", ...params })) url.searchParams.set(key, value);
  return url;
}

// Every attribute a result can show, so a renamed field is caught here rather than in the field.
function requestedFields(layer) {
  return String(layer.options.outFields).split(",");
}

async function checkLayer(layer) {
  if (referenceMapChecks[layer.id]) return checkReferenceMap(layer);
  if (layer.sourceType === "arcgis-mapserver") return checkDepthMap(layer);
  const problems = [];
  let count;
  try {
    const metadata = await getJson(new URL(`${layer.sourceUrl}?f=json`));
    problems.push(...checkMetadata(layer, metadata));
    count = (await getJson(queryUrl(layer, { where: layer.options?.where ?? "1=1", returnCountOnly: "true" }))).count;
    problems.push(...checkCount(layer, count));
    problems.push(...(await checkSample(layer)));
    problems.push(...(await checkSeason(layer)));
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  return { name: layer.name, count, problems };
}

async function checkLinks(layers) {
  const configured = layers.flatMap(staticLinksFor);
  const dynamic = (await Promise.all(layers.map(dynamicLinksFor))).flat();
  const unique = new Map();
  for (const link of [...configured, ...dynamic]) {
    const previous = unique.get(link.url);
    unique.set(link.url, {
      url: link.url,
      expectedUnavailable: Boolean(previous?.expectedUnavailable || link.expectedUnavailable),
    });
  }
  return Promise.all([...unique.values()].map(checkHttpLink));
}

function staticLinksFor(layer) {
  const dnr = layer.dnr;
  return [
    { url: dnr.verifyUrl },
    ...(dnr.links ?? []).map(({ href }) => ({ url: href })),
    ...(dnr.nameLinks ?? []).flatMap(({ pages }) =>
      Object.values(pages).map((url) => ({ url }))),
  ];
}

async function dynamicLinksFor(layer) {
  if (layer.sourceType !== "arcgis-featureserver") return [];
  const fields = layer.dnr.linkFields ?? [];
  const groups = await Promise.all(fields.map(async (field) => {
    const response = await getJson(queryUrl(layer, {
      where: "1=1",
      outFields: field.field,
      returnDistinctValues: "true",
      returnGeometry: "false",
    }));
    return (response.features ?? []).flatMap(({ attributes }) => {
      const value = String(attributes?.[field.field] ?? "").trim();
      if (!value) return [];
      const url = field.baseUrl ? `${field.baseUrl}${encodeURIComponent(value)}` : value;
      return [{ url, expectedUnavailable: field.excludedValues?.includes(value) ?? false }];
    });
  }));
  return groups.flat();
}

async function checkHttpLink(link) {
  try {
    const response = await fetch(link.url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    if (link.expectedUnavailable) {
      return {
        ...link,
        ok: response.status === 404,
        expectedUnavailable: response.status === 404,
        status: response.status,
      };
    }
    return { ...link, ok: response.ok, status: response.status };
  } catch (error) {
    return { ...link, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function checkMetadata(layer, metadata) {
  const problems = [];
  const present = new Set((metadata.fields ?? []).map((field) => field.name));
  const missing = requestedFields(layer).filter((field) => !present.has(field));
  if (missing.length > 0) problems.push(`the service no longer has the fields ${missing.join(", ")}`);
  if (metadata.geometryType !== geometryTypes[layer.id]) {
    problems.push(`geometry is ${metadata.geometryType}, expected ${geometryTypes[layer.id]}`);
  }
  if (!String(metadata.capabilities ?? "").includes("Query")) problems.push("the service does not advertise Query");
  return problems;
}

function checkCount(layer, count) {
  const expected = expectedCounts[layer.id];
  const problems = [];
  if (typeof count !== "number") return ["the count query returned no count"];
  if (count < expected * 0.5 || count > expected * 2) {
    problems.push(`${count} features, far from the ${expected} recorded on 2026-09-23`);
  }
  const gated = Number.isFinite(Number(layer.options.maxCameraHeight));
  if (count > recordLimit && !gated) problems.push(`${count} features exceed one query's ${recordLimit} and the layer has no zoom gate`);
  return problems;
}

async function checkSample(layer) {
  const sample = await getJson(queryUrl(layer, { where: layer.options?.where ?? "1=1", outFields: requestedFields(layer).join(","), returnGeometry: "false", resultRecordCount: "1" }));
  return sample.features?.length > 0 ? [] : ["a sample query returned no feature"];
}

async function checkSeason(layer) {
  if (layer.id === "mndnr-cwd-sampling-sites") return checkCwdSamplingSeason(layer);
  const season = layer.dnr.season;
  if (!season) return [];
  if (season.source === "service") {
    const distinct = await getJson(queryUrl(layer, { where: "1=1", outFields: season.field, returnDistinctValues: "true", returnGeometry: "false" }));
    const periods = (distinct.features ?? []).map((feature) => String(feature.attributes?.[season.field] ?? "").trim());
    return periods.length > 0 && periods.every(Boolean) ? checkPeriods(layer, periods) : [`the service publishes no ${season.field}`];
  }
  const remaining = Math.floor((Date.parse(season.verifiedThrough) + dayInMilliseconds - Date.now()) / dayInMilliseconds);
  if (remaining <= 0) return [`the configured season "${season.label}" is no longer verified; re-verify it against ${layer.dnr.verifyUrl}`];
  if (remaining <= configuredSeasonWarningDays) return [`the configured season "${season.label}" stays verified for ${remaining} more days; re-verify it against ${layer.dnr.verifyUrl}`];
  return [];
}

async function checkCwdSamplingSeason(layer) {
  const problems = [];
  const root = layer.sourceUrl.replace(/\/FeatureServer\/1$/, "/FeatureServer");
  const service = await getJson(new URL(`${root}?f=json`));
  if (!service.layers?.some(({ id, name }) => id === 1 && name === "wld_cwd_hunter_resource_sites_web")) {
    problems.push("layer 1 name or index changed");
  }
  if (!service.layers?.some(({ id, name }) => id === 3 && name === "wld_cwd_dpa_sampling_area_web")) {
    problems.push("layer 3 name or index changed");
  }
  const periodsUrl = new URL(`${root}/3/query`);
  for (const [key, value] of Object.entries({ f: "json", where: "1=1", outFields: "effperiod", returnDistinctValues: "true", returnGeometry: "false" })) periodsUrl.searchParams.set(key, value);
  const periods = (await getJson(periodsUrl)).features?.map(({ attributes }) => String(attributes?.effperiod ?? "").trim()) ?? [];
  if (periods.length === 0 || periods.some((period) => period !== "July 2026 - June 2027")) problems.push("layer 3 effective period differs from the verified 2026–27 period");
  const itemId = "8462b6a81c46461484c68d4bd638134c";
  const item = await getJson(new URL(`https://gis.dnr.state.mn.us/arcgis/sharing/rest/content/items/${itemId}?f=json`));
  if (!/(^|\D)2026(\D|$)/.test(String(item.title ?? ""))) problems.push("the portal item title does not identify the 2026 season");
  const siteUrl = new URL(`${root}/1/query`);
  for (const [key, value] of Object.entries({ f: "json", where: layer.options?.where ?? "show = 'Yes'", returnGeometry: "false", resultRecordCount: "1" })) siteUrl.searchParams.set(key, value);
  const sites = (await getJson(siteUrl)).features ?? [];
  const editsUrl = new URL(`${root}/1/query`);
  for (const [key, value] of Object.entries({ f: "json", where: "1=1", outFields: "last_edited_date", returnGeometry: "false", orderByFields: "last_edited_date DESC", resultRecordCount: "1" })) editsUrl.searchParams.set(key, value);
  const editedSites = (await getJson(editsUrl)).features ?? [];
  const newest = Math.max(...editedSites.map(({ attributes }) => Number(attributes?.last_edited_date)));
  if (sites.length === 0) problems.push("layer 1 has no active sites matching the configured layer filter");
  if (!Number.isFinite(newest) || newest < Date.UTC(2026, 6, 1)) problems.push("the newest layer-1 record predates 1 July 2026 or has no valid edit date");
  const metadata = await getJson(new URL(`${root}/1?f=json`));
  const required = [...requestedFields(layer), "show"];
  const present = new Set((metadata.fields ?? []).map(({ name }) => name));
  const missing = required.filter((field) => !present.has(field));
  if (metadata.name !== "wld_cwd_hunter_resource_sites_web" || missing.length > 0) {
    problems.push(`layer 1 schema changed${missing.length ? `; missing ${missing.join(", ")}` : ""}`);
  }
  return problems;
}

function checkPeriods(layer, periods) {
  const stale = periods.filter((period) => !isCurrent(period));
  if (stale.length > 0) return [`the service's period "${stale.join('", "')}" is not current; check ${layer.dnr.verifyUrl}`];
  const configured = layer.dnr.season.lastVerifiedPeriod;
  return periods.includes(configured) ? [] : [`the service publishes "${periods.join('", "')}", not the last verified "${configured}"; update lastVerifiedPeriod in the layer definition`];
}

// Only "Month YYYY - Month YYYY" is read, the wording DNR uses. The app's own reader
// (src/lib/dnr/season.ts) is the authority; this only needs to say whether a person should look.
function isCurrent(period) {
  const match = /^([a-z]+)\s+(\d{4})\s*[-–—]\s*([a-z]+)\s+(\d{4})$/i.exec(period.trim());
  if (!match) return false;
  const first = months.indexOf(match[1].toLowerCase());
  const last = months.indexOf(match[3].toLowerCase());
  if (first < 0 || last < 0) return false;
  const start = Date.UTC(Number(match[2]), first, 1);
  const end = Date.UTC(Number(match[4]), last + 1, 1);
  return Date.now() >= start && Date.now() < end;
}

async function checkReferenceMap(layer) {
  const check = referenceMapChecks[layer.id];
  const problems = [];
  try {
    const serviceUrl = new URL(`${layer.sourceUrl.split("/").slice(0, -1).join("/")}?f=json`);
    const service = await getJson(serviceUrl);
    if (!String(service.capabilities ?? "").includes("Map")) problems.push("the service does not advertise Map");
    const sourceLayer = (service.layers ?? []).find((entry) => entry.id === check.id);
    if (sourceLayer?.name !== check.name) problems.push(`layer ${check.id} is "${sourceLayer?.name}", expected "${check.name}"`);
    problems.push(...(await checkReferenceLayer(layer, check)));
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  return { name: layer.name, count: undefined, problems };
}

async function checkReferenceLayer(layer, check) {
  const metadata = await getJson(new URL(`${layer.sourceUrl}?f=json`));
  const present = new Set((metadata.fields ?? []).map((field) => field.name));
  const missing = check.fields.filter((field) => !present.has(field));
  const problems = missing.length > 0 ? [`layer ${check.id} no longer has fields ${missing.join(", ")}`] : [];
  if (metadata.geometryType !== check.geometry) problems.push(`layer ${check.id} has unexpected geometry ${metadata.geometryType}`);
  const countUrl = new URL(`${layer.sourceUrl}/query`);
  for (const [key, value] of Object.entries({ f: "json", where: "1=1", returnCountOnly: "true" })) countUrl.searchParams.set(key, value);
  const { count } = await getJson(countUrl);
  problems.push(...checkCount(layer, count));
  return problems;
}

// The depth map is a live map service, so it is checked for the layers the map draws and for the
// outline and contour records identify reads, rather than for a feature count of its own.
async function checkDepthMap(layer) {
  const problems = [];
  try {
    const metadata = await getJson(new URL(`${layer.sourceUrl}?f=json`));
    if (!String(metadata.capabilities ?? "").includes("Map")) problems.push("the service does not advertise Map");
    for (const check of depthMapChecks) {
      const found = (metadata.layers ?? []).find((entry) => entry.id === check.id);
      if (found?.name !== check.name) problems.push(`layer ${check.id} is "${found?.name}", expected "${check.name}"`);
      if (check.expected !== undefined) problems.push(...(await checkDepthLayer(layer, check)));
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  return { name: layer.name, count: undefined, problems };
}

async function checkDepthLayer(layer, { id, expected, fields }) {
  const metadata = await getJson(new URL(`${layer.sourceUrl}/${id}?f=json`));
  const present = new Set((metadata.fields ?? []).map((field) => field.name));
  const missing = fields.filter((field) => !present.has(field));
  if (missing.length > 0) return [`layer ${id} no longer has the fields ${missing.join(", ")}`];
  const url = new URL(`${layer.sourceUrl}/${id}/query`);
  for (const [key, value] of Object.entries({ f: "json", where: "1=1", returnCountOnly: "true" })) url.searchParams.set(key, value);
  const { count } = await getJson(url);
  if (typeof count !== "number") return [`layer ${id} returned no count`];
  return count < expected * 0.5 || count > expected * 2 ? [`layer ${id} has ${count} records, far from the ${expected} recorded on 2026-09-23`] : [];
}

// LakeFinder is read through the app's own adapter, so a change in its response shows here first.
async function checkLakeFinder() {
  const name = "LakeFinder by-ID API and lake map PDF";
  const problems = [];
  try {
    const url = new URL("https://services.dnr.state.mn.us/api/lakefinder/by_id/v1/");
    url.searchParams.set("id", knownLake.dow);
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url.pathname}`);
    const outcome = lakeModules.parseLakeFinder(knownLake.dow, JSON.parse(await response.text()));
    if (outcome.status !== "found") problems.push(`the app cannot read the LakeFinder record for ${knownLake.name}: ${outcome.status}`);
    else problems.push(...(await checkLakeMap(outcome.lake)));
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  return { name, count: undefined, problems };
}

// The PDF's file name is inferred from the map ID (see src/lib/dnr/lakeMap.ts), so it is checked.
async function checkLakeMap(lake) {
  if (!lake.resources.lakeMap || lake.mapIds.length === 0) return [`${lake.name} no longer reports a lake map`];
  const file = lakeModules.lakeMapPath(lake.mapIds[0]).split("/").at(-1);
  const response = await fetch(`https://files.dnr.state.mn.us/lakefind/data/lakemaps/${file}`, { method: "HEAD", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) return [`DNR has no lake map file ${file}; the naming in lakeMap.ts has changed`];
  return response.headers.get("content-type")?.includes("pdf") ? [] : [`${file} is not a PDF`];
}
