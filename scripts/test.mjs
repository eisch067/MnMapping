import assert from "node:assert/strict";
import { build } from "esbuild";

// This suite exercises the full (personal-mode) imagery registry, including vendor imagery
// that's only embedded when NEXT_PUBLIC_APP_MODE=personal (see src/config/appMode.ts). The
// public build's reduced registry is covered separately by `npm run audit:registry`.
process.env.NEXT_PUBLIC_APP_MODE = "personal";

const built = await build({
  stdin: {
    contents: `
      export { fetchAllArcGisFeatures } from "./src/lib/map/arcgisFeatures";
      export { latestDisplayableImagery } from "./src/lib/countyImagery";
      export { displayableImageryForCounty } from "./src/lib/countyImagery";
      export { restrictedImageryForCounty } from "./src/config/restrictedImagery";
      export { createInitialResearchRecords, createResearchExport, mergeResearchExport, researchRecordsToCsv } from "./src/lib/imageryResearch";
    `,
    resolveDir: process.cwd(),
    sourcefile: "test-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  tsconfig: "tsconfig.json",
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`;
const { createInitialResearchRecords, createResearchExport, displayableImageryForCounty, fetchAllArcGisFeatures, latestDisplayableImagery, mergeResearchExport, researchRecordsToCsv, restrictedImageryForCounty } = await import(moduleUrl);

await testOffsetPagination();
await testObjectIdFallback();
await testArcGisErrors();
await testRepeatedPageProtection();
testCountyImagerySummary();
testImageryResearchTracker();
console.log("Shared ArcGIS query and county imagery tests passed.");

async function testOffsetPagination() {
  const calls = [];
  const progress = [];
  const fetcher = async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    if (!url.pathname.endsWith("/query")) return jsonResponse({
      maxRecordCount: 2,
      objectIdField: "OBJECTID",
      advancedQueryCapabilities: { supportsPagination: true, supportsOrderBy: true },
    });
    const offset = Number(url.searchParams.get("resultOffset"));
    if (offset === 0) return jsonResponse(featureCollection([1, 2], true));
    return jsonResponse(featureCollection([3], false));
  };
  const result = await fetchAllArcGisFeatures(queryUrl("offset-test"), {
    fetcher,
    onProgress: ({ loaded }) => progress.push(loaded),
  });
  assert.deepEqual(result.features.map((feature) => feature.id), [1, 2, 3]);
  assert.deepEqual(progress, [2, 3]);
  assert.equal(calls[1].searchParams.get("resultRecordCount"), "2");
  assert.equal(calls[2].searchParams.get("resultOffset"), "2");
  assert.equal(calls[1].searchParams.get("orderByFields"), "OBJECTID ASC");
  assert.equal(result.exceededTransferLimit, false);
}

async function testObjectIdFallback() {
  const calls = [];
  const fetcher = async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    if (!url.pathname.endsWith("/query")) return jsonResponse({
      maxRecordCount: 2,
      objectIdFieldName: "FID",
      advancedQueryCapabilities: { supportsPagination: false },
    });
    if (url.searchParams.get("returnIdsOnly") === "true") return jsonResponse({ objectIds: [8, 9, 10], objectIdFieldName: "FID" });
    const ids = url.searchParams.get("objectIds").split(",").map(Number);
    return jsonResponse(featureCollection(ids, false));
  };
  const result = await fetchAllArcGisFeatures(queryUrl("ids-test"), { fetcher });
  assert.deepEqual(result.features.map((feature) => feature.id), [8, 9, 10]);
  const featureCalls = calls.filter((url) => url.searchParams.has("objectIds"));
  assert.equal(featureCalls.length, 2);
  assert.equal(featureCalls[0].searchParams.has("geometry"), false);
  assert.equal(result.exceededTransferLimit, false);
}

async function testArcGisErrors() {
  const fetcher = async (input) => {
    const url = new URL(String(input));
    if (!url.pathname.endsWith("/query")) return jsonResponse({ maxRecordCount: 10 });
    return jsonResponse({ error: { code: 400, message: "Bad query" } });
  };
  await assert.rejects(() => fetchAllArcGisFeatures(queryUrl("error-test"), { fetcher }), /ArcGIS error 400: Bad query/);
}

async function testRepeatedPageProtection() {
  const fetcher = async (input) => {
    const url = new URL(String(input));
    if (!url.pathname.endsWith("/query")) return jsonResponse({ maxRecordCount: 2 });
    return jsonResponse(featureCollection([1, 2], true));
  };
  await assert.rejects(() => fetchAllArcGisFeatures(queryUrl("repeat-test"), { fetcher }), /repeated page/);
}

function testCountyImagerySummary() {
  assert.equal(latestDisplayableImagery("Hubbard")?.id, "hubbard-imagery-2026");
  assert.equal(latestDisplayableImagery("Brown")?.id, "mngeo-naip-2025");
  assert.ok(displayableImageryForCounty("Cass").some((layer) => layer.id === "cass-arcgis-imagery-2024-pictometry"));
  assert.equal(latestDisplayableImagery("Anoka")?.id, "anoka-arcgis-imagery-2026-spring");
  assert.equal(displayableImageryForCounty("Brown")[0]?.id, "mngeo-best-available");
  assert.ok(displayableImageryForCounty("Hubbard").some((layer) => layer.id === "hubbard-imagery-2026"));
  assert.ok(displayableImageryForCounty("Carlton").some((layer) => layer.id === "carlton-imagery-2024"));
  assert.ok(displayableImageryForCounty("Beltrami").some((layer) => layer.id === "beltrami-imagery-2023"));
  assert.ok(displayableImageryForCounty("Olmsted").some((layer) => layer.id === "olmsted-imagery-2023"));
  assert.ok(displayableImageryForCounty("Ramsey").some((layer) => layer.id === "ramsey-imagery-2022"));
  assert.equal(latestDisplayableImagery("McLeod")?.id, "mcleod-arcgis-imagery-2026");
  assert.equal(latestDisplayableImagery("Wadena")?.id, "wadena-arcgis-imagery-2025-eagleview");
  assert.equal(latestDisplayableImagery("Wilkin")?.id, "wilkin-arcgis-imagery-2026-eagleview");
  const polk2025 = latestDisplayableImagery("Polk");
  assert.equal(polk2025?.id, "polk-imagery-2025-eagleview");
  assert.equal(polk2025?.sourceType, "wmts");
  assert.equal(polk2025?.options?.layer, "PICT-MNPOLK25-bwELhvEqES");
  assert.equal(polk2025?.options?.tileMatrixSetID, "GoogleMapsCompatible");
  assert.ok(displayableImageryForCounty("Grant").some((layer) => layer.id === "grant-arcgis-imagery-2024-eagleview"));
  assert.ok(displayableImageryForCounty("Meeker").some((layer) => layer.id === "meeker-imagery-2024-eagleview"));
  assert.ok(displayableImageryForCounty("Lac qui Parle").some((layer) => layer.id === "lac-qui-parle-imagery-2024-eagleview"));
  assert.equal(latestDisplayableImagery("Lincoln")?.id, "lincoln-imagery-2026-eagleview");
  assert.ok(displayableImageryForCounty("Marshall").some((layer) => layer.id === "marshall-arcgis-imagery-2024-eagleview"));
  assert.ok(displayableImageryForCounty("Stevens").some((layer) => layer.id === "stevens-arcgis-imagery-2020-pictometry"));
  assert.deepEqual(restrictedImageryForCounty("Brown").map((source) => source.year), [2026, 2023]);
  assert.deepEqual(restrictedImageryForCounty("Anoka"), []);
  assert.deepEqual(restrictedImageryForCounty("Benton").map((source) => source.year), [2023]);
  assert.deepEqual(restrictedImageryForCounty("Cook").map((source) => source.year), [2024]);
  assert.deepEqual(restrictedImageryForCounty("Dakota"), []);
  assert.deepEqual(restrictedImageryForCounty("Dodge"), []);
  assert.deepEqual(restrictedImageryForCounty("Douglas").map((source) => source.year), [2026]);
  assert.deepEqual(restrictedImageryForCounty("Faribault").map((source) => source.year), [2025]);
  assert.deepEqual(restrictedImageryForCounty("Fillmore").map((source) => source.year), [2022]);
  assert.deepEqual(restrictedImageryForCounty("Goodhue"), []);
  assert.deepEqual(restrictedImageryForCounty("Grant"), []);
  assert.deepEqual(restrictedImageryForCounty("Houston").map((source) => source.year), [2023]);
  assert.deepEqual(restrictedImageryForCounty("Itasca").map((source) => source.year), [2023]);
  assert.deepEqual(restrictedImageryForCounty("Jackson").map((source) => source.year), [2021]);
  assert.deepEqual(restrictedImageryForCounty("Kandiyohi").map((source) => source.year), [2024]);
  assert.deepEqual(restrictedImageryForCounty("Le Sueur").map((source) => source.year), [2025]);
  assert.deepEqual(restrictedImageryForCounty("Mahnomen").map((source) => source.year), [2020]);
  assert.deepEqual(restrictedImageryForCounty("Mille Lacs"), []);
  assert.deepEqual(restrictedImageryForCounty("Morrison").map((source) => source.year), [2020]);
  assert.deepEqual(restrictedImageryForCounty("Mower"), []);
  assert.deepEqual(restrictedImageryForCounty("Nicollet").map((source) => source.year), [2020]);
  assert.deepEqual(restrictedImageryForCounty("Nobles").map((source) => source.year), [2024]);
  assert.deepEqual(restrictedImageryForCounty("Otter Tail"), []);
  assert.deepEqual(restrictedImageryForCounty("Pennington"), []);
  assert.deepEqual(restrictedImageryForCounty("Pipestone"), []);
  assert.deepEqual(restrictedImageryForCounty("Polk"), []);
  assert.deepEqual(restrictedImageryForCounty("Pope"), []);
  assert.deepEqual(restrictedImageryForCounty("Redwood").map((source) => source.year), [2026, 2023, 2020, 2016]);
  assert.deepEqual(restrictedImageryForCounty("Renville").map((source) => source.year), [2024]);
  assert.deepEqual(restrictedImageryForCounty("Scott"), []);
  assert.deepEqual(restrictedImageryForCounty("Sherburne"), []);
  assert.deepEqual(restrictedImageryForCounty("Sibley").map((source) => source.year), [2023]);
  assert.deepEqual(restrictedImageryForCounty("St. Louis").map((source) => source.year), [2023]);
  assert.deepEqual(restrictedImageryForCounty("Stearns"), []);
  assert.deepEqual(restrictedImageryForCounty("Steele"), []);
  assert.deepEqual(restrictedImageryForCounty("Swift").map((source) => source.year), [2024]);
  assert.deepEqual(restrictedImageryForCounty("Traverse"), []);
  assert.deepEqual(restrictedImageryForCounty("Washington"), []);
  assert.deepEqual(restrictedImageryForCounty("Wright").map((source) => source.year), [2025]);
  assert.deepEqual(restrictedImageryForCounty("Yellow Medicine"), []);
  assert.deepEqual(restrictedImageryForCounty("McLeod"), []);
  assert.deepEqual(restrictedImageryForCounty("Todd").map((source) => source.year), [2023]);
  assert.deepEqual(restrictedImageryForCounty("Wadena"), []);
  assert.deepEqual(restrictedImageryForCounty("Watonwan").map((source) => source.year), [2022]);
  assert.deepEqual(restrictedImageryForCounty("Wilkin"), []);
  assert.deepEqual(restrictedImageryForCounty("Beltrami"), []);
  assert.deepEqual(restrictedImageryForCounty("Kittson").map((source) => source.year), [2024, 2019]);
  assert.deepEqual(restrictedImageryForCounty("Marshall"), []);
  assert.deepEqual(restrictedImageryForCounty("Norman").map((source) => source.year), [2025, 2022]);
  assert.deepEqual(restrictedImageryForCounty("Stevens").map((source) => source.year), [2026, 2023]);
  assert.deepEqual(restrictedImageryForCounty("Freeborn").map((source) => source.year), [2020]);
  assert.deepEqual(restrictedImageryForCounty("Isanti").map((source) => source.year), [2025, 2025, 2023, 2023, 2022, 2021, 2020]);
  assert.deepEqual(restrictedImageryForCounty("Kanabec").map((source) => source.year), [2024, 2021, 2018]);
  assert.deepEqual(restrictedImageryForCounty("Lake of the Woods").map((source) => source.year), [2024, 2021, 2018]);
  assert.deepEqual(restrictedImageryForCounty("Martin").map((source) => source.year), [2026, 2023, 2020, 2019]);
  assert.deepEqual(restrictedImageryForCounty("Meeker").map((source) => source.year), [2021]);
  assert.deepEqual(restrictedImageryForCounty("Murray").map((source) => source.year), [2024, 2022, 2019]);
  assert.deepEqual(restrictedImageryForCounty("Pine").map((source) => source.year), [2023, 2018]);
  assert.deepEqual(restrictedImageryForCounty("Rock").map((source) => source.year), [2025, 2022, 2019]);
  assert.deepEqual(restrictedImageryForCounty("Waseca").map((source) => source.year), [2025, 2021]);
  assert.deepEqual(restrictedImageryForCounty("Winona").map((source) => source.year), [2026, 2022, 2020]);
}

function testImageryResearchTracker() {
  const records = createInitialResearchRecords();
  assert.equal(records.length, 87);
  assert.equal(records.filter((record) => record.requiresOutreach).length, 3);
  assert.equal(records.filter((record) => record.coverageTier === "Statewide only").length, 1);
  assert.equal(records.filter((record) => record.coverageTier === "Older / recency unverified").length, 2);
  assert.equal(records.filter((record) => record.coverageTier === "Verified recent").length, 84);
  assert.equal(records.find((record) => record.county === "Freeborn")?.requiresOutreach, false);
  assert.equal(records.find((record) => record.county === "Kittson")?.coverageTier, "Verified recent");
  assert.equal(records.find((record) => record.county === "Red Lake")?.coverageTier, "Statewide only");
  assert.equal(records.find((record) => record.county === "Cottonwood")?.coverageTier, "Older / recency unverified");
  assert.equal(records.find((record) => record.county === "Todd")?.requiresOutreach, false);
  assert.equal(records.filter((record) => record.status === "Deep research").length, 26);
  assert.equal(records.filter((record) => record.status === "Needs review").length, 39);
  assert.equal(records.filter((record) => record.status === "Complete").length, 22);
  assert.equal(records.find((record) => record.county === "Freeborn")?.status, "Complete");
  assert.equal(records.find((record) => record.county === "Becker")?.status, "Needs review");
  assert.equal(records.find((record) => record.county === "Brown")?.other.length, 2);
  assert.equal(records.find((record) => record.county === "Carlton")?.countySources[0]?.year, "2024");
  assert.equal(records.find((record) => record.county === "Clay")?.countySources[0]?.detail, "Approximately 6 inches");
  assert.equal(records.find((record) => record.county === "Faribault")?.other[0]?.detail, "6-inch county; 3-inch cities");
  assert.equal(records.find((record) => record.county === "Kandiyohi")?.other[0]?.detail, "Spring leaf-off high-resolution imagery");
  assert.equal(records.find((record) => record.county === "Olmsted")?.countySources[0]?.year, "2023");
  assert.equal(records.find((record) => record.county === "Mille Lacs")?.countySources[0]?.year, "2026");
  assert.equal(records.find((record) => record.county === "Nobles")?.other[0]?.detail, "3-inch county imagery");
  assert.equal(records.find((record) => record.county === "Washington")?.countySources[0]?.year, "2026");
  assert.equal(records.find((record) => record.county === "Yellow Medicine")?.countySources[0]?.year, "2025");
  assert.match(records.find((record) => record.county === "Winona")?.researchLeads[0]?.url ?? "", /beacon\.schneidercorp\.com/);
  assert.match(records.find((record) => record.county === "Meeker")?.researchLeads[0]?.url ?? "", /beacon\.schneidercorp\.com/);
  assert.equal(records.find((record) => record.county === "Marshall")?.researchLeads[0]?.year, "");
  for (const county of ["Cottonwood", "Freeborn", "Grant", "Isanti", "Kanabec", "Kittson", "Lac qui Parle", "Lake of the Woods", "Lincoln", "Marshall", "Martin", "Meeker", "Murray", "Norman", "Pine", "Red Lake", "Redwood", "Rock", "Roseau", "Stevens", "Waseca", "Winona"]) {
    assert.equal(records.find((record) => record.county === county)?.status, "Complete");
  }
  assert.equal(records.find((record) => record.county === "Hubbard")?.countySources[0]?.year, "2026");
  const aitkin = records.find((record) => record.county === "Aitkin");
  const anoka = records.find((record) => record.county === "Anoka");
  assert.deepEqual(anoka.other, []);
  assert.equal(anoka.countySources[0]?.year, "2026");
  aitkin.sourceInbox = "https://example.test/aitkin-imagery";
  anoka.sourceInbox = "https://example.test/anoka-imagery";
  assert.equal(aitkin.sourceInbox, "https://example.test/aitkin-imagery");
  assert.equal(anoka.sourceInbox, "https://example.test/anoka-imagery");
  assert.doesNotMatch(aitkin.sourceInbox, /anoka-imagery/);
  assert.doesNotMatch(anoka.sourceInbox, /aitkin-imagery/);
  const brown = records.find((record) => record.county === "Brown");
  brown.status = "Complete";
  brown.outreachStatus = "Responded";
  brown.contactEmail = "gis@example.test";
  brown.responseNotes = "Confirmed public viewer.";
  brown.sourceInbox = "https://example.test/brown-imagery\n2026 aerial imagery lead";
  const benton = records.find((record) => record.county === "Benton");
  benton.other = [];
  const restored = mergeResearchExport(createResearchExport(records, "2026-09-17T00:00:00.000Z"));
  assert.equal(restored.find((record) => record.county === "Brown")?.status, "Complete");
  assert.equal(restored.find((record) => record.county === "Brown")?.outreachStatus, "Responded");
  assert.equal(restored.find((record) => record.county === "Brown")?.contactEmail, "gis@example.test");
  assert.equal(restored.find((record) => record.county === "Brown")?.responseNotes, "Confirmed public viewer.");
  assert.match(restored.find((record) => record.county === "Brown")?.sourceInbox ?? "", /brown-imagery/);
  assert.equal(restored.find((record) => record.county === "Benton")?.other[0]?.year, "2023");
  const csv = researchRecordsToCsv(records);
  assert.match(csv, /"Brown"/);
  assert.match(csv, /"Implemented imagery"/);
  assert.match(csv, /"External imagery—date confirmed"/);
  assert.match(csv, /"Official viewer\/research lead—date unknown"/);
  assert.match(csv, /gis\.browncountymn\.gov/);
  assert.match(csv, /example\.test\/brown-imagery/);
  assert.match(csv, /"Coverage Tier","Needs Outreach","Outreach Status"/);
  assert.match(csv, /gis@example\.test/);
}

function queryUrl(id) {
  return new URL(`https://example.test/${id}/FeatureServer/0/query?where=1%3D1&geometry=1%2C2%2C3%2C4&f=geojson`);
}

function featureCollection(ids, exceededTransferLimit) {
  return { type: "FeatureCollection", features: ids.map((id) => ({ type: "Feature", id, properties: {}, geometry: null })), exceededTransferLimit };
}

function jsonResponse(value) {
  return { ok: true, status: 200, statusText: "OK", json: async () => value };
}
