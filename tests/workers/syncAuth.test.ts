import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";
import { unauthorizedResponse, verifyAccessToken, type SyncEnv } from "../../src/lib/syncServer";

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
  it("returns a plain unauthorized response when authentication fails", async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized." });
  });

  it("accepts valid tokens and logs safe reason codes for every rejection", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const wrongPair = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const fetchMock = vi.fn(async () => Response.json({ keys: [{ ...jwk, kid: "test-key", alg: "RS256", use: "sig" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(await verifyAccessToken(new Request("https://app.test", {
        headers: { "cf-access-jwt-assertion": await token(privateKey) },
      }), env)).toBe("verified-user");

      const rejectionCases: Array<{ token: string | null; env?: SyncEnv; reason: string }> = [
        { token: null, reason: "header_missing" },
        { token: await token(privateKey), env: { ...env, ACCESS_AUD: "" }, reason: "settings_missing" },
        { token: await token(privateKey, { iss: "https://attacker.test" }), reason: "issuer_mismatch" },
        { token: await token(privateKey, { aud: "wrong-aud" }), reason: "audience_mismatch" },
        { token: await token(wrongPair.privateKey), reason: "signature_or_expiry_failure" },
        { token: await token(privateKey, { exp: Math.floor(Date.now() / 1000) - 10 }), reason: "signature_or_expiry_failure" },
      ];
      for (const entry of rejectionCases) {
        const headers = entry.token ? { "cf-access-jwt-assertion": entry.token } : undefined;
        expect(await verifyAccessToken(new Request("https://app.test", { headers }), entry.env ?? env)).toBeNull();
      }

      const logs = JSON.stringify(warn.mock.calls);
      for (const { reason, token: rejectedToken } of rejectionCases) {
        expect(logs).toContain(reason);
        if (rejectedToken) expect(logs).not.toContain(rejectedToken);
      }
    } finally {
      warn.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
