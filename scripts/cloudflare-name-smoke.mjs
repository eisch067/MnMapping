import { readFileSync } from "node:fs";

// Confirms wrangler.jsonc's declared Worker names match what's actually deployed on
// Cloudflare. Cloudflare's Git-integrated builds take a Worker's identity from the
// dashboard application's own name, not from wrangler.jsonc, so the two can drift
// silently -- exactly what happened when this file said "mn-mapping" while the deployed
// Workers were "mnmapping" (fixed in #52), undetected through several merged pull
// requests. Runs on a schedule, like dnr-smoke.mjs, since it depends on Cloudflare's API
// and repo secrets, not on anything a pull request changes.

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
if (!accountId || !apiToken) {
  console.error(
    "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (a token scoped to Workers Scripts:Read) to run this check.",
  );
  process.exit(1);
}

function readJsonc(path) {
  // wrangler.jsonc's only comments are whole lines starting with "//"; stripping those
  // is enough to parse it as JSON without adding a JSONC-parsing dependency.
  const withoutComments = readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  return JSON.parse(withoutComments);
}

const config = readJsonc(new URL("../wrangler.jsonc", import.meta.url));
const expectedNames = [config.name, config.env.public.name];

const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
  headers: { Authorization: `Bearer ${apiToken}` },
});
if (!response.ok) {
  throw new Error(`Cloudflare API returned ${response.status}: ${await response.text()}`);
}
const body = await response.json();
const deployedNames = new Set(body.result.map((script) => script.id));

const missing = expectedNames.filter((name) => !deployedNames.has(name));
if (missing.length > 0) {
  throw new Error(
    `wrangler.jsonc names [${missing.join(", ")}] not found among deployed Workers ` +
      `[${[...deployedNames].join(", ")}]. Either wrangler.jsonc or the live dashboard app ` +
      "has been renamed without the other -- see docs/cloudflare-deployment.md.",
  );
}

console.log(`Worker names match what's deployed: ${expectedNames.join(", ")}`);
