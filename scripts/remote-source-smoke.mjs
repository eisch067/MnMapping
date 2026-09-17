import { build } from "esbuild";

const layers = await loadNorthLayers();
const targets = createTargets(layers);
const results = await mapWithConcurrency(targets, 6, checkTarget);
const passed = results.filter((result) => result.ok);
const failed = results.filter((result) => !result.ok);

console.log(`North remote-source smoke: ${passed.length}/${results.length} source checks passed (${new Date().toISOString().slice(0, 10)}).`);
for (const result of results) console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}${result.message ? ` — ${result.message}` : ""}`);
if (failed.length > 0) process.exitCode = 1;

async function loadNorthLayers() {
  const built = await build({
    stdin: {
      contents: `
        import { countyRegistry } from "./src/config/counties";
        import { layerRegistry } from "./src/config/layers";
        const northNames = new Set(countyRegistry.filter((county) => county.zone === "north").map((county) => county.name));
        console.log(JSON.stringify(layerRegistry.filter((layer) => !layer.county || northNames.has(layer.county)).map((layer) => ({
          id: layer.id, name: layer.name, sourceType: layer.sourceType, url: layer.url, sourceUrl: layer.sourceUrl, options: layer.options,
        }))));
      `,
      resolveDir: process.cwd(),
      sourcefile: "remote-source-smoke-entry.ts",
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

function createTargets(layerDefinitions) {
  const targets = new Map();
  for (const layer of layerDefinitions) {
    const source = layer.sourceUrl ?? (String(layer.url).startsWith("http") ? layer.url : undefined);
    if (!source) continue;
    if (layer.sourceType === "wms") {
      const url = new URL(source);
      url.searchParams.set("service", "WMS");
      url.searchParams.set("request", "GetCapabilities");
      const key = `wms:${url}`;
      const existing = targets.get(key);
      const expectedLayers = String(layer.options?.layers ?? "").split(",").filter(Boolean);
      if (existing) existing.expectedLayers.push(...expectedLayers);
      else targets.set(key, { kind: "wms", url, label: `WMS ${url.origin}${url.pathname}`, expectedLayers });
      continue;
    }
    if (layer.sourceType.startsWith("arcgis-")) {
      const url = new URL(source);
      url.searchParams.set("f", "json");
      targets.set(`arcgis:${url}`, { kind: "arcgis", url, label: `${layer.name} metadata` });
      continue;
    }
    if (layer.sourceType === "geojson") {
      const url = new URL(source);
      targets.set(`json:${url}`, { kind: "json", url, label: `${layer.name} GeoJSON` });
    }
  }
  return [...targets.values()].map((target) => ({
    ...target,
    expectedLayers: target.expectedLayers ? [...new Set(target.expectedLayers)] : undefined,
  }));
}

async function checkTarget(target) {
  try {
    const response = await fetch(target.url, {
      headers: { accept: target.kind === "wms" ? "application/xml,text/xml" : "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (target.kind === "wms") {
      const body = await response.text();
      const missing = target.expectedLayers.filter((name) => !body.includes(`<Name>${name}</Name>`));
      if (missing.length > 0) throw new Error(`missing layers: ${missing.join(", ")}`);
    } else {
      const body = await response.json();
      if (body.error) throw new Error(body.error.message ?? "ArcGIS returned an error");
      if (target.kind === "json" && body.type !== "FeatureCollection") throw new Error("not a GeoJSON FeatureCollection");
    }
    return { ...target, ok: true };
  } catch (error) {
    return { ...target, ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  }));
  return results;
}
