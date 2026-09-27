import { describe, expect, it } from "vitest";
import { layerRegistry, type LayerDefinition } from "@/config/layers";
import { describeFeature } from "@/lib/identify/featureDetails";
import bear from "./fixtures/bear-permit-area-12.json";
import cwd from "./fixtures/cwd-zone.json";
import deer from "./fixtures/deer-permit-area-201.json";
import fishing from "./fixtures/fishing-site.json";
import hunterTrail from "./fixtures/hunter-walking-trail.json";
import turkey from "./fixtures/turkey-permit-area-502.json";
import waterAccess from "./fixtures/water-access-with-alert.json";
import walkIn from "./fixtures/walk-in-access-1001.json";

function layerNamed(id: string): LayerDefinition {
  const layer = layerRegistry.find((candidate) => candidate.id === id);
  if (!layer) throw new Error(`The personal registry has no layer ${id}.`);
  return layer;
}

const attribution = "Minnesota DNR · reference only, not a legal boundary or proof of access";
const regulationZone = "Regulation boundary — does not show ownership or permission to enter.";
const verify = "Verify current regulations";

const rowValue = (rows: { label: string; value: string }[], label: string) =>
  rows.find((row) => row.label === label)?.value;

describe("a regulation-zone result (deer permit area)", () => {
  const details = describeFeature(layerNamed("mndnr-deer-permit-areas"), deer.attributes);

  it("leads with the title, the season label, and the meaning statement", () => {
    expect(details.title).toBe("Deer Permit Area 201");
    expect(details.rows[0]).toEqual({ label: "Season", value: "July 2026 - June 2027" });
    expect(details.notes).toEqual([regulationZone]);
  });

  it("links the official page for verifying current regulations first", () => {
    expect(details.links[0]).toEqual({
      label: verify,
      href: "https://www.dnr.state.mn.us/mammals/deer/management/dpas.html",
    });
    expect(details.links.map((link) => link.href)).toContain(
      "https://www.dnr.state.mn.us/hunting/deer/deer-season-faq.html#text-1-1",
    );
  });

  it("keeps secondary source fields under More details and hides empty ones", () => {
    expect(rowValue(details.rows, "Management")).toBe("Two-deer limit");
    expect(rowValue(details.rows, "Special regulations")).toBeUndefined();
    expect(rowValue(details.moreRows ?? [], "Special regulations")).toMatch(/WMAs in this permit area/);
    expect(details.moreRows?.map((row) => row.label)).not.toContain("Carcass movement");
    expect(details.moreRows?.map((row) => row.label)).not.toContain("Disease management");
  });

  it("carries the attribution and shows no season or license-type codes", () => {
    expect(details.attribution).toBe(attribution);
    const shown = [...details.rows, ...(details.moreRows ?? [])].map((row) => row.label);
    expect(shown).not.toContain("Archery");
    expect(shown).not.toContain("Firearm A");
  });
});

describe("a regulation-zone result whose season is configured (bear, turkey)", () => {
  it("names the bear management unit and the configured season label", () => {
    const details = describeFeature(layerNamed("mndnr-bear-permit-areas"), bear.attributes);

    expect(details.title).toBe("Bear management unit 12");
    expect(details.rows).toEqual([{ label: "Season", value: "2026 season" }]);
    expect(details.notes).toEqual([regulationZone]);
    expect(details.links[0].href).toBe("https://www.dnr.state.mn.us/hunting/bear/index.html");
  });

  it("names the turkey permit area, a number in the source", () => {
    const details = describeFeature(layerNamed("mndnr-turkey-permit-areas"), turkey.attributes);

    expect(details.title).toBe("Turkey permit area 502");
    expect(details.rows).toEqual([{ label: "Season", value: "Fall 2026 season" }]);
    expect(details.links[0].href).toBe(
      "https://www.dnr.state.mn.us/gohunting/wild-turkey-hunting.html",
    );
  });
});

describe("a CWD zone result", () => {
  const details = describeFeature(layerNamed("mndnr-cwd-zones"), cwd.attributes);

  it("shows the zone, its rules, and the service's effective period", () => {
    expect(details.title).toBe("outside a CWD zone");
    expect(details.rows[0]).toEqual({ label: "Season", value: "July 2026 - June 2027" });
    expect(rowValue(details.rows, "Sampling")).toBe("however optional CWD testing is available.");
    expect(details.notes).toEqual([regulationZone]);
  });

  it("ignores blank and missing attributes rather than showing empty rows", () => {
    expect(details.rows.map((row) => row.label)).not.toContain("Carcass movement");
    expect(details.rows.map((row) => row.label)).not.toContain("Feeding and attractant ban");
  });
});

describe("an enrolled-private-land result (Walk-In Access)", () => {
  const details = describeFeature(layerNamed("mndnr-walk-in-access-sites"), walkIn.attributes);

  it("says the land is enrolled private land subject to validation and opt-out", () => {
    expect(details.title).toBe("Blue Earth WIA #1001");
    expect(details.notes).toEqual([
      "Participating private land — WIA validation required, Sept 1–May 31, landowners may opt out.",
    ]);
    expect(details.links[0]).toEqual({
      label: verify,
      href: "https://www.dnr.state.mn.us/walkin/index.html",
    });
  });

  it("shows county, acres, and uses, with the WIA ID under More details", () => {
    expect(rowValue(details.rows, "County")).toBe("Blue Earth");
    expect(rowValue(details.rows, "Uses")).toBe("All Compatible");
    expect(rowValue(details.moreRows ?? [], "WIA ID")).toBe("wia0701001");
    expect(rowValue(details.rows, "Notes")).toBeUndefined();
  });
});

describe("an access-varies result (Hunter Walking Trail)", () => {
  const details = describeFeature(layerNamed("mndnr-hunter-walking-trails"), hunterTrail.attributes);

  it("says rules vary by landowner along the trail", () => {
    expect(details.notes).toEqual(["Rules vary by landowner along the trail."]);
  });

  it("links the trail GeoPDF on DNR's file server and shows the edit date", () => {
    expect(details.links.map((link) => link.href)).toContain(
      "https://files.dnr.state.mn.us/hunting/hwt/hwt00049_1241_hwt.pdf",
    );
    expect(rowValue(details.moreRows ?? [], "Last edited")).toBe("2018-09-04");
    expect(rowValue(details.moreRows ?? [], "Phone")).toBe("218-783-6861");
  });
});

describe("a facility result", () => {
  const facilityNote =
    "Marks a facility or route, not access to adjoining land or permission to take any species.";

  it("puts a public-water access alert in a banner and keeps the rest under More details", () => {
    const details = describeFeature(layerNamed("mndnr-public-water-access"), waterAccess.attributes);

    expect(details.banner).toMatch(/^Closed for park construction project all of 2026\./);
    expect(details.notes).toEqual([facilityNote]);
    expect(rowValue(details.rows, "Administrator")).toBe("Dakota County");
    expect(rowValue(details.moreRows ?? [], "Docks")).toBe("0");
    expect(details.rows.map((row) => row.label)).not.toContain("Season");
  });

  it("shows no banner when DNR posts no alert", () => {
    const attributes = { ...waterAccess.attributes, alerts: "  " };

    const details = describeFeature(layerNamed("mndnr-public-water-access"), attributes);

    expect(details.banner).toBeUndefined();
  });

  it("describes a fishing site, verifies against fishing regulations, and links the pier page", () => {
    const details = describeFeature(layerNamed("mndnr-fishing-sites"), fishing.attributes);

    expect(details.title).toBe("Norway Lake Fishing Pier");
    expect(details.notes).toEqual([facilityNote]);
    expect(details.links[0]).toEqual({
      label: verify,
      href: "https://www.dnr.state.mn.us/regulations/fishing/index.html",
    });
    expect(details.links.map((link) => link.href)).toContain(
      "https://www.dnr.state.mn.us/fishing_piers/index.html",
    );
    expect(rowValue(details.rows, "Site type")).toBe("Fishing Pier");
  });
});

describe("links DNR publishes in the data", () => {
  const layer = layerNamed("mndnr-cwd-zones");

  it("keeps only https links on DNR's own domain", () => {
    const attributes = {
      ...cwd.attributes,
      cwdhunturl: "https://example.com/phish",
      disepage: "javascript:alert(1)",
      carcpage: "http://www.dnr.state.mn.us/insecure",
      fdbanpage: "https://www.dnr.state.mn.us/cwd/feeding.html",
    };

    const hrefs = describeFeature(layer, attributes).links.map((link) => link.href);

    expect(hrefs).toContain("https://www.dnr.state.mn.us/cwd/feeding.html");
    expect(hrefs.filter((href) => !href.startsWith("https://www.dnr.state.mn.us/"))).toEqual([]);
  });

  it("lists a page once even when two attributes point at it", () => {
    const attributes = { ...cwd.attributes, carcpage: cwd.attributes.disepage };

    const hrefs = describeFeature(layer, attributes).links.map((link) => link.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
