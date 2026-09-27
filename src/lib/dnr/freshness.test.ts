import { describe, expect, it } from "vitest";
import type { DnrFreshness } from "@/config/layers/types";
import { evaluateFreshness } from "./freshness";

const freshness: DnrFreshness = {
  label: "2026 season",
  contentDate: "2026-09-23",
  freshThrough: "2026-12-31",
  staleWarning: "Check the current source.",
};

describe("evaluateFreshness", () => {
  it("keeps the release label current through its last verified day", () => {
    expect(evaluateFreshness(freshness, new Date("2026-12-31T23:59:59Z"))).toEqual({
      label: "2026 season",
      contentDate: "2026-09-23",
      stale: false,
      warning: undefined,
    });
  });

  it("warns after the verified period without representing the layer as unavailable", () => {
    expect(evaluateFreshness(freshness, new Date("2027-01-01T00:00:00Z"))).toMatchObject({
      stale: true,
      warning: "Check the current source.",
    });
  });
});
