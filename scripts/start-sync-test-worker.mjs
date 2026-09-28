import { generateKeyPair, exportJWK } from "jose";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "test-results");
const keyFile = path.join(outputDirectory, "sync-test-key.json");
const isPersonalBuild = process.env.NEXT_PUBLIC_APP_MODE === "personal";
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const config = path.join(root, "dist", "server", "wrangler.json");
const persistDirectory = path.join(root, ".wrangler", "sync-test");
const args = [wrangler, "dev", "--config", config, "--local", "--port", "8787",
  "--show-interactive-dev-session=false", "--persist-to", persistDirectory];

if (isPersonalBuild) {
  await mkdir(outputDirectory, { recursive: true });
  const { publicKey, privateKey } = await generateKeyPair("RS256", { modulusLength: 2048, extractable: true });
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  await writeFile(keyFile, JSON.stringify(privateJwk), "utf8");

  const migration = spawnSync(process.execPath, [
    wrangler, "d1", "migrations", "apply", "D1.sync", "--config", config,
    "--local", "--persist-to", persistDirectory,
  ], { cwd: root, stdio: "inherit", env: process.env });
  if (migration.error) throw migration.error;
  if (migration.status !== 0) process.exit(migration.status ?? 1);

  const publicJwkBase64 = Buffer.from(JSON.stringify(publicJwk)).toString("base64");
  args.push("--var", "ACCESS_TEAM_DOMAIN:mnmapping.local", "--var", "ACCESS_AUD:local-test-aud",
    "--var", `SYNC_TEST_PUBLIC_JWK:${publicJwkBase64}`);
}

const child = spawn(process.execPath, args, { cwd: root, stdio: "inherit", env: process.env });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error("Unable to start the local sync test Worker.", error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : code ?? 1;
});
