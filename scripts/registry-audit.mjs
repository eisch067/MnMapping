import { build } from "esbuild";

const result = await build({
  stdin: {
    contents: `
      import { countyRegistry } from "./src/config/counties";
      import { layerRegistry } from "./src/config/layers";
      import { dnrRecreationLayers } from "./src/config/layers/dnrRecreation";
      import { isPersonalMode } from "./src/config/appMode";
      import { auditDnrLayers } from "./src/lib/dnr/audit";
      import { auditRegistry } from "./src/lib/registryAudit";
      const result = auditRegistry(countyRegistry, layerRegistry);
      result.issues.push(...auditDnrLayers(dnrRecreationLayers, layerRegistry, { personal: isPersonalMode }));
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
const originalLog = console.log;

// The build mode is read when the registry loads, so each mode gets its own copy of the bundle.
async function auditMode(mode) {
  process.env.NEXT_PUBLIC_APP_MODE = mode;
  const source = `${output}\n// ${mode}`;
  let serialized = "";
  console.log = (value) => { serialized = String(value); };
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  console.log = originalLog;
  return JSON.parse(serialized);
}

for (const mode of ["public", "personal"]) {
  const audit = await auditMode(mode);
  originalLog(`Registry audit (${mode}): ${audit.countyCount} counties (${audit.northCountyCount} north, ${audit.southCountyCount} south), ${audit.layerCount} layers.`);
  for (const issue of audit.issues) console.error(`- [${mode}] ${issue}`);
  if (audit.issues.length > 0) process.exitCode = 1;
}
if (!process.exitCode) originalLog("Registry audit passed.");
