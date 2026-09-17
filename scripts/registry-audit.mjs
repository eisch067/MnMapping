import { build } from "esbuild";

const result = await build({
  stdin: {
    contents: `
      import { countyRegistry } from "./src/config/counties";
      import { layerRegistry } from "./src/config/layers";
      import { auditRegistry } from "./src/lib/registryAudit";
      const result = auditRegistry(countyRegistry, layerRegistry);
      console.log(JSON.stringify(result));
    `,
    resolveDir: process.cwd(),
    sourcefile: "registry-audit-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  tsconfig: "tsconfig.json",
});

const output = result.outputFiles[0].text;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
const originalLog = console.log;
let serialized = "";
console.log = (value) => { serialized = String(value); };
await import(moduleUrl);
console.log = originalLog;
const audit = JSON.parse(serialized);

originalLog(`Registry audit: ${audit.countyCount} counties (${audit.northCountyCount} north, ${audit.southCountyCount} south), ${audit.layerCount} layers.`);
if (audit.issues.length > 0) {
  for (const issue of audit.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  originalLog("Registry audit passed.");
}
