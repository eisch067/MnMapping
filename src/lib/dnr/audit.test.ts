import { describe, expect, it } from "vitest";
import { dnrRecreationLayers } from "@/config/layers/dnrRecreation";
import type { LayerDefinition } from "@/config/layers/types";
import { auditDnrLayers } from "@/lib/dnr/audit";

function withDnr(layer: LayerDefinition, changes: Partial<NonNullable<LayerDefinition["dnr"]>>) {
  if (!layer.dnr) throw new Error("Not a DNR layer.");
  return { ...layer, dnr: { ...layer.dnr, ...changes } };
}

const deer = dnrRecreationLayers.find((layer) => layer.id === "mndnr-deer-permit-areas")!;
const bear = dnrRecreationLayers.find((layer) => layer.id === "mndnr-bear-permit-areas")!;

const audit = (layers: readonly LayerDefinition[], registry = layers, personal = true) =>
  auditDnrLayers(layers, registry, { personal });

describe("auditDnrLayers", () => {
  it("passes the committed collection in the personal registry", () => {
    expect(audit(dnrRecreationLayers)).toEqual([]);
  });

  it("passes when the public registry holds no DNR layer", () => {
    const publicRegistry: LayerDefinition[] = [];

    expect(audit(dnrRecreationLayers, publicRegistry, false)).toEqual([]);
  });

  it("fails when the public registry holds any DNR layer", () => {
    const issues = audit(dnrRecreationLayers, [deer], false);

    expect(issues).toEqual([expect.stringMatching(/public registry.*mndnr-deer-permit-areas/i)]);
  });

  it("fails when the personal registry leaves a DNR layer out", () => {
    const issues = audit(dnrRecreationLayers, [deer], true);

    expect(issues).toContainEqual(expect.stringMatching(/personal registry.*mndnr-bear-permit-areas/i));
    expect(issues).not.toContainEqual(expect.stringMatching(/mndnr-deer-permit-areas/));
  });

  it("requires a DNR layer to default off", () => {
    const issues = audit([{ ...deer, defaultVisible: true }]);

    expect(issues).toEqual([expect.stringMatching(/mndnr-deer-permit-areas.*default off/)]);
  });

  it("requires a source URL on an official DNR or MnGeo host", () => {
    expect(audit([{ ...deer, sourceUrl: undefined }])).toEqual([
      expect.stringMatching(/mndnr-deer-permit-areas.*source/),
    ]);
    expect(audit([{ ...deer, sourceUrl: "https://example.com/FeatureServer/0" }])).toEqual([
      expect.stringMatching(/mndnr-deer-permit-areas.*source/),
    ]);
  });

  it("requires an attribution", () => {
    expect(audit([{ ...deer, attribution: " " }])).toEqual([
      expect.stringMatching(/mndnr-deer-permit-areas.*attribution/),
    ]);
  });

  it("requires a known meaning class and heading", () => {
    const badClass = withDnr(deer, { meaningClass: "guaranteed" as never });
    const badHeading = withDnr(deer, { heading: "misc" as never });

    expect(audit([badClass])).toEqual([expect.stringMatching(/meaning class/)]);
    expect(audit([badHeading])).toEqual([expect.stringMatching(/heading/)]);
  });

  it("requires a verify link on a DNR page over https", () => {
    for (const verifyUrl of ["", "http://www.dnr.state.mn.us/x.html", "https://example.com/x"]) {
      expect(audit([withDnr(deer, { verifyUrl })])).toEqual([expect.stringMatching(/verify link/)]);
    }
  });

  it("requires a season rule to be complete and dated", () => {
    const noLabel = withDnr(bear, {
      season: { source: "configured", label: "", verifiedThrough: "2027-03-31" },
    });
    const badDate = withDnr(bear, {
      season: { source: "configured", label: "2026 season", verifiedThrough: "spring" },
    });
    const noField = withDnr(deer, {
      season: { source: "service", field: "", lastVerifiedPeriod: "July 2026 - June 2027" },
    });

    expect(audit([noLabel])).toEqual([expect.stringMatching(/season/)]);
    expect(audit([badDate])).toEqual([expect.stringMatching(/season.*verified-through/)]);
    expect(audit([noField])).toEqual([expect.stringMatching(/season/)]);
  });

  it("requires a verification date", () => {
    expect(audit([withDnr(deer, { verifiedOn: "last week" })])).toEqual([
      expect.stringMatching(/verified/),
    ]);
  });

  it("requires a DNR layer to be in the DNR Recreation category", () => {
    const issues = audit([{ ...deer, category: "public-land" }]);

    expect(issues).toEqual([expect.stringMatching(/category/)]);
  });
});
