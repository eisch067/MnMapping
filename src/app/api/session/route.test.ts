import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/session", () => {
  it("returns an empty, non-cacheable success response", async () => {
    const response = await GET();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });
});
