import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";
import { verifyAccessToken, type SyncEnv } from "../../src/lib/syncServer";

const issuer = "https://sync-test.cloudflareaccess.com";
const env = { ACCESS_TEAM_DOMAIN: "sync-test.cloudflareaccess.com", ACCESS_AUD: "app-aud", DB: {} } as SyncEnv;

async function token(privateKey: CryptoKey, claims: { iss?: string; aud?: string; exp?: number } = {}) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(claims.iss ?? issuer)
    .setAudience(claims.aud ?? "app-aud")
    .setSubject("verified-user")
    .setExpirationTime(claims.exp ?? "2m")
    .sign(privateKey);
}

describe("Cloudflare Access authentication", () => {
  it("accepts valid tokens and rejects bad signature, issuer, audience, and expiration", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const wrongPair = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const fetchMock = vi.fn(async () => Response.json({ keys: [{ ...jwk, kid: "test-key", alg: "RS256", use: "sig" }] }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      expect(await verifyAccessToken(new Request("https://app.test", {
        headers: { "cf-access-jwt-assertion": await token(privateKey) },
      }), env)).toBe("verified-user");
      expect(await verifyAccessToken(new Request("https://app.test", {
        headers: { "cf-access-jwt-assertion": await token(wrongPair.privateKey) },
      }), env)).toBeNull();
      expect(await verifyAccessToken(new Request("https://app.test", {
        headers: { "cf-access-jwt-assertion": await token(privateKey, { iss: "https://attacker.test" }) },
      }), env)).toBeNull();
      expect(await verifyAccessToken(new Request("https://app.test", {
        headers: { "cf-access-jwt-assertion": await token(privateKey, { aud: "wrong-aud" }) },
      }), env)).toBeNull();
      expect(await verifyAccessToken(new Request("https://app.test", {
        headers: { "cf-access-jwt-assertion": await token(privateKey, { exp: Math.floor(Date.now() / 1000) - 10 }) },
      }), env)).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
