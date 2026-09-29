import { importJWK, SignJWT } from "jose";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const personalBuild = process.env.NEXT_PUBLIC_APP_MODE === "personal";
const baseUrl = "http://localhost:8787";

test.skip(!personalBuild, "Sync is available in the personal build only.");

test("two browser contexts exchange account changes through the local sync Worker", async ({ browser }) => {
  const privateJwk = JSON.parse(await readFile("test-results/sync-test-key.json", "utf8"));
  const signingKey = await importJWK(privateJwk, "RS256");
  const owner = `playwright-${crypto.randomUUID()}`;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer("https://mnmapping.local")
    .setAudience("local-test-aud")
    .setSubject(owner)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(signingKey);
  const headers = { "cf-access-jwt-assertion": token };
  const firstDevice = await browser.newContext();
  const secondDevice = await browser.newContext();
  try {
    const firstWrite = await firstDevice.request.post(`${baseUrl}/api/sync`, {
      headers,
      data: {
        mutationId: `${owner}-mutation-a`,
        kind: "item",
        id: `${owner}-item`,
        expectedRevision: null,
        operation: "upsert",
        accountResetAt: null,
        record: {
          id: `${owner}-item`,
          schemaVersion: 2,
          name: "Phone pin",
          geometry: { type: "Point", coordinates: [-95, 47] },
        },
      },
    });
    expect(firstWrite.ok()).toBe(true);

    const secondPull = await secondDevice.request.get(`${baseUrl}/api/sync?cursor=0`, { headers });
    expect(secondPull.ok()).toBe(true);
    const page = await secondPull.json() as { changes: Array<{ id: string; revision: number }> };
    expect(page.changes).toContainEqual(expect.objectContaining({ id: `${owner}-item`, revision: 1 }));

    const secondWrite = await secondDevice.request.post(`${baseUrl}/api/sync`, {
      headers,
      data: {
        mutationId: `${owner}-mutation-b`,
        kind: "item",
        id: `${owner}-item`,
        expectedRevision: 1,
        operation: "upsert",
        accountResetAt: null,
        record: {
          id: `${owner}-item`,
          schemaVersion: 2,
          name: "Desktop pin",
          geometry: { type: "Point", coordinates: [-94, 47] },
        },
      },
    });
    expect(secondWrite.ok()).toBe(true);

    const firstPull = await firstDevice.request.get(`${baseUrl}/api/sync?cursor=1`, { headers });
    expect(firstPull.ok()).toBe(true);
    const updated = await firstPull.json() as { changes: Array<{ id: string; revision: number; record: { name: string } }> };
    expect(updated.changes).toContainEqual(expect.objectContaining({
      id: `${owner}-item`,
      revision: 2,
      record: expect.objectContaining({ name: "Desktop pin" }),
    }));
  } finally {
    await firstDevice.close();
    await secondDevice.close();
  }
});
