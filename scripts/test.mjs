import assert from "node:assert/strict";
import { build } from "esbuild";

const built = await build({
  stdin: {
    contents: `
      export { fetchAllArcGisFeatures } from "./src/lib/map/arcgisFeatures";
      export { latestDisplayableImagery } from "./src/lib/countyImagery";
      export { displayableImageryForCounty } from "./src/lib/countyImagery";
      export { restrictedImageryForCounty } from "./src/config/restrictedImagery";
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
const { displayableImageryForCounty, fetchAllArcGisFeatures, latestDisplayableImagery, restrictedImageryForCounty } = await import(moduleUrl);

await testOffsetPagination();
await testObjectIdFallback();
await testArcGisErrors();
await testRepeatedPageProtection();
testCountyImagerySummary();
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
  assert.equal(displayableImageryForCounty("Brown")[0]?.id, "mngeo-best-available");
  assert.ok(displayableImageryForCounty("Hubbard").some((layer) => layer.id === "hubbard-imagery-2026"));
  assert.deepEqual(restrictedImageryForCounty("Brown").map((source) => source.year), [2026, 2023]);
  assert.deepEqual(restrictedImageryForCounty("Beltrami"), []);
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
