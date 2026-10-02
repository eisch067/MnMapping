import { describe, expect, it } from "vitest";
import { classifySessionProbe } from "./sessionProbe";

describe("classifySessionProbe", () => {
  it.each([200, 204, 299])("treats %i as signed in", (status) => {
    expect(classifySessionProbe(new Response(null, { status }))).toBe("signed-in");
  });

  it.each([401, 403])("requires sign-in for %i", (status) => {
    expect(classifySessionProbe(new Response(null, { status }))).toBe("sign-in-required");
  });

  it("requires sign-in for an opaque redirect", () => {
    const response = { status: 0, type: "opaqueredirect" } as Response;
    expect(classifySessionProbe(response)).toBe("sign-in-required");
  });

  it.each([404, 500, 502])("treats %i as unknown", (status) => {
    expect(classifySessionProbe(new Response(null, { status }))).toBe("unknown");
  });

  it("treats a network error as unknown", () => {
    expect(classifySessionProbe(null)).toBe("unknown");
  });
});
