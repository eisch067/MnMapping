import { describe, expect, it } from "vitest";
import beltrami from "./fixtures/lakefinder-beltrami.json";
import changedSchema from "./fixtures/lakefinder-changed-schema.json";
import noRecord from "./fixtures/lakefinder-no-record.json";
import peltier from "./fixtures/lakefinder-peltier.json";
import { parseLakeFinder, type LakeFinderOutcome } from "./lakefinder";
import { describeLakeSummary, emptyRegulationsMessage } from "./lakeSummary";

const attribution = "Minnesota DNR · reference only, not a legal boundary or proof of access";
const verifyLink = {
  label: "Verify current regulations",
  href: "https://www.dnr.state.mn.us/regulations/fishing/index.html",
};
const searchLink = {
  label: "Search LakeFinder",
  href: "https://www.dnr.state.mn.us/lakefind/index.html",
};

const outcomes = {
  beltrami: parseLakeFinder("04013500", beltrami.body),
  peltier: parseLakeFinder("02000400", peltier.body),
  noRecord: parseLakeFinder("99999999", noRecord.body),
  unavailable: { status: "unavailable" } as LakeFinderOutcome,
  changed: parseLakeFinder("04013500", changedSchema.body),
};

const dows = { beltrami: "04013500", peltier: "02000400", noRecord: "99999999", unavailable: "04013500", changed: "04013500" };

function summaryOf(key: keyof typeof outcomes, fallbackName?: string) {
  return describeLakeSummary({ dow: dows[key], fallbackName, outcome: outcomes[key] });
}

describe("a matching record", () => {
  const summary = summaryOf("beltrami");

  it("leads with the lake's identity, size, and depth", () => {
    expect(summary.title).toBe("Beltrami");
    expect(summary.facts).toEqual([
      { label: "DOW number", value: "04013500" },
      { label: "County", value: "Beltrami" },
      { label: "Nearest town", value: "Bemidji" },
      { label: "Area", value: "725.8 acres" },
      { label: "Maximum depth", value: "50 ft" },
      { label: "Mean depth", value: "13 ft" },
    ]);
    expect(summary.notice).toBeUndefined();
  });

  it("shows special regulations verbatim, with what each covers", () => {
    expect(summary.regulations).toEqual({
      verifyLink,
      entries: [
        {
          species: "Northern Pike",
          text: 'All from 22-30" must be immediately released. Possession limit 10, only one over 30".',
          location: "",
        },
        { species: "Sunfish", text: "Daily limit five.", location: "Including connected Turtle River Fox Lake" },
      ],
    });
  });

  it("shows invasive species, and keeps the survey list apart under DNR's own label", () => {
    expect(summary.details).toContainEqual({ label: "Invasive species", value: "starry stonewort" });
    expect(summary.species?.heading).toBe("Species encountered in DNR fisheries surveys");
    expect(summary.species?.names).toContain("walleye");
    expect(summary.species?.caveat).toMatch(/do not show what may be taken/);
  });

  it("links the official lake page and only the reports DNR flags", () => {
    expect(summary.links).toEqual([
      { label: "Full LakeFinder page", href: "https://www.dnr.state.mn.us/lakefind/lake.html?id=04013500" },
      { label: "Water-level report", href: "https://www.dnr.state.mn.us/lakefind/showlevel.html?downum=04013500" },
      { label: "Fisheries lake survey", href: "https://www.dnr.state.mn.us/lakefind/showreport.html?downum=04013500" },
      { label: "Fish stocking", href: "https://www.dnr.state.mn.us/lakefind/showstocking.html?downum=04013500&context=desktop" },
      { label: "Lake depth maps on DNR's site", href: "https://www.dnr.state.mn.us/lakefind/showmap.html?downum=04013500" },
      { label: "Lake map (PDF)", href: "/api/lake-map/b0025010.pdf" },
    ]);
  });

  it("carries the attribution", () => {
    expect(summary.attribution).toBe(attribution);
  });
});

describe("a record with no special regulations", () => {
  const summary = summaryOf("peltier");

  it("says so in DNR's terms without concluding that no rules apply", () => {
    expect(summary.regulations).toEqual({
      entries: [],
      emptyMessage: emptyRegulationsMessage,
      verifyLink,
    });
    expect(emptyRegulationsMessage).toBe(
      "No lake-specific special regulations listed by DNR. Statewide, border-water, method, and seasonal rules may still apply.",
    );
  });

  it("marks a depth DNR does not report as unavailable rather than hiding it", () => {
    expect(summary.facts).toContainEqual({ label: "Maximum depth", value: "18 ft" });
    expect(summary.facts).toContainEqual({ label: "Mean depth", value: "Not reported" });
  });
});

describe("when there is nothing to summarize", () => {
  it("shows a lake DNR has no record of by its identity, with a search link", () => {
    const summary = summaryOf("noRecord", "Little Pond");

    expect(summary.title).toBe("Little Pond");
    expect(summary.facts).toEqual([{ label: "DOW number", value: "99999999" }]);
    expect(summary.notice).toBe("DNR has no LakeFinder record for this lake.");
    expect(summary.links).toEqual([searchLink]);
    expect(summary.regulations).toBeUndefined();
    expect(summary.species).toBeUndefined();
  });

  it("falls back to links, not an error, when the service is down", () => {
    const summary = summaryOf("unavailable", "Beltrami");

    expect(summary.notice).toBe("DNR lake data isn't responding — official links below");
    expect(summary.links.map((link) => link.label)).toEqual([
      "Search LakeFinder",
      "Full LakeFinder page",
      "Verify current regulations",
    ]);
    expect(summary.regulations).toBeUndefined();
  });

  it("falls back to the same links when the response cannot be read", () => {
    const summary = summaryOf("changed");

    expect(summary.notice).toBe("DNR lake data came back in a form this app cannot read — official links below");
    expect(summary.regulations).toBeUndefined();
    expect(summary.links.map((link) => link.label)).toContain("Full LakeFinder page");
  });

  it("names the lake by its DOW number when nothing else is known", () => {
    expect(summaryOf("noRecord").title).toBe("Lake 99999999");
  });
});

describe("every outcome", () => {
  it.each(Object.keys(outcomes) as (keyof typeof outcomes)[])(
    "never calls a lake fishable or bowfishable (%s)",
    (key) => {
      expect(JSON.stringify(summaryOf(key, "Beltrami"))).not.toMatch(/fishable|bowfish/i);
    },
  );
});
