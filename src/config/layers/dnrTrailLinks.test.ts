import { describe, expect, it } from "vitest";
import {
  brokenRgmaPdfFiles,
  stateTrailPages,
  unreconciledStateTrailNames,
  unreconciledWaterTrailNames,
  waterTrailPages,
} from "./dnrTrailLinks";

describe("DNR trail page reconciliation", () => {
  it("records every reconciled and unreconciled live State Trail name", () => {
    expect(Object.keys(stateTrailPages)).toHaveLength(31);
    expect(unreconciledStateTrailNames).toHaveLength(7);
    expect(new Set([
      ...Object.keys(stateTrailPages),
      ...unreconciledStateTrailNames,
    ])).toHaveLength(38);
  });

  it("reconciles all 35 State Water Trail names without guessing", () => {
    expect(Object.keys(waterTrailPages)).toHaveLength(35);
    expect(unreconciledWaterTrailNames).toEqual([]);
  });

  it("records the five unit PDFs that the release link check found unavailable", () => {
    expect(brokenRgmaPdfFiles).toHaveLength(5);
  });
});
