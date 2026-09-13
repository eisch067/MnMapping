import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cesiumRoot = join(projectRoot, "node_modules", "cesium", "Build", "Cesium");
const publicRoot = join(projectRoot, "public", "cesium");

await mkdir(publicRoot, { recursive: true });

for (const directory of ["Assets", "ThirdParty", "Widgets", "Workers"]) {
  await cp(join(cesiumRoot, directory), join(publicRoot, directory), {
    recursive: true,
    force: true,
  });
}
