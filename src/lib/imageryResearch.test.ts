import { describe, expect, it } from "vitest";
import {
  createInitialResearchRecords,
  createResearchExport,
  mergeResearchExport,
  researchRecordsToCsv,
} from "@/lib/imageryResearch";
import type { CountyImageryResearchRecord } from "@/lib/imageryResearch";

const completedCounties = [
  "Cottonwood", "Freeborn", "Grant", "Isanti", "Kanabec", "Kittson", "Lac qui Parle",
  "Lake of the Woods", "Lincoln", "Marshall", "Martin", "Meeker", "Murray", "Norman", "Pine",
  "Red Lake", "Redwood", "Rock", "Roseau", "Stevens", "Waseca", "Winona",
];

function recordFor(
  records: CountyImageryResearchRecord[],
  county: string,
): CountyImageryResearchRecord {
  const record = records.find((candidate) => candidate.county === county);
  if (!record) {
    throw new Error(`No research record for ${county} County; check the county registry.`);
  }
  return record;
}

function recordsWithEditedBrownAndBenton(): CountyImageryResearchRecord[] {
  const records = createInitialResearchRecords();
  const brown = recordFor(records, "Brown");
  brown.status = "Complete";
  brown.outreachStatus = "Responded";
  brown.contactEmail = "gis@example.test";
  brown.responseNotes = "Confirmed public viewer.";
  brown.sourceInbox = "https://example.test/brown-imagery\n2026 aerial imagery lead";
  recordFor(records, "Benton").other = [];
  return records;
}

describe("initial imagery research records", () => {
  it("creates one record per county with the expected coverage tiers", () => {
    const records = createInitialResearchRecords();

    expect(records).toHaveLength(87);
    expect(records.filter((record) => record.requiresOutreach)).toHaveLength(3);
    expect(records.filter((record) => record.coverageTier === "Statewide only")).toHaveLength(1);
    expect(
      records.filter((record) => record.coverageTier === "Older / recency unverified"),
    ).toHaveLength(2);
    expect(records.filter((record) => record.coverageTier === "Verified recent")).toHaveLength(84);
    expect(recordFor(records, "Freeborn").requiresOutreach).toBe(false);
    expect(recordFor(records, "Kittson").coverageTier).toBe("Verified recent");
    expect(recordFor(records, "Red Lake").coverageTier).toBe("Statewide only");
    expect(recordFor(records, "Cottonwood").coverageTier).toBe("Older / recency unverified");
    expect(recordFor(records, "Todd").requiresOutreach).toBe(false);
  });

  it("assigns research statuses", () => {
    const records = createInitialResearchRecords();

    expect(records.filter((record) => record.status === "Deep research")).toHaveLength(26);
    expect(records.filter((record) => record.status === "Needs review")).toHaveLength(39);
    expect(records.filter((record) => record.status === "Complete")).toHaveLength(22);
    expect(recordFor(records, "Freeborn").status).toBe("Complete");
    expect(recordFor(records, "Becker").status).toBe("Needs review");
  });

  it.each(completedCounties)("marks %s County complete", (county) => {
    expect(recordFor(createInitialResearchRecords(), county).status).toBe("Complete");
  });

  it("carries county, other, and research-lead imagery sources", () => {
    const records = createInitialResearchRecords();

    expect(recordFor(records, "Brown").other).toHaveLength(2);
    expect(recordFor(records, "Carlton").countySources[0]?.year).toBe("2024");
    expect(recordFor(records, "Clay").countySources[0]?.detail).toBe("Approximately 6 inches");
    expect(recordFor(records, "Faribault").other[0]?.detail).toBe("6-inch county; 3-inch cities");
    expect(recordFor(records, "Kandiyohi").other[0]?.detail).toBe(
      "Spring leaf-off high-resolution imagery",
    );
    expect(recordFor(records, "Olmsted").countySources[0]?.year).toBe("2023");
    expect(recordFor(records, "Mille Lacs").countySources[0]?.year).toBe("2026");
    expect(recordFor(records, "Nobles").other[0]?.detail).toBe("3-inch county imagery");
    expect(recordFor(records, "Washington").countySources[0]?.year).toBe("2026");
    expect(recordFor(records, "Yellow Medicine").countySources[0]?.year).toBe("2025");
    expect(recordFor(records, "Hubbard").countySources[0]?.year).toBe("2026");
    const beacon = /beacon\.schneidercorp\.com/;
    expect(recordFor(records, "Winona").researchLeads[0]?.url ?? "").toMatch(beacon);
    expect(recordFor(records, "Meeker").researchLeads[0]?.url ?? "").toMatch(beacon);
    expect(recordFor(records, "Marshall").researchLeads[0]?.year).toBe("");
  });

  it("keeps each county's source inbox independent", () => {
    const records = createInitialResearchRecords();
    const aitkin = recordFor(records, "Aitkin");
    const anoka = recordFor(records, "Anoka");
    expect(anoka.other).toStrictEqual([]);
    expect(anoka.countySources[0]?.year).toBe("2026");

    aitkin.sourceInbox = "https://example.test/aitkin-imagery";
    anoka.sourceInbox = "https://example.test/anoka-imagery";

    expect(aitkin.sourceInbox).toBe("https://example.test/aitkin-imagery");
    expect(anoka.sourceInbox).toBe("https://example.test/anoka-imagery");
    expect(aitkin.sourceInbox).not.toMatch(/anoka-imagery/);
    expect(anoka.sourceInbox).not.toMatch(/aitkin-imagery/);
  });
});

describe("imagery research export", () => {
  it("restores edits from an exported research file", () => {
    const records = recordsWithEditedBrownAndBenton();

    const restored = mergeResearchExport(createResearchExport(records, "2026-09-17T00:00:00.000Z"));

    const brown = recordFor(restored, "Brown");
    expect(brown.status).toBe("Complete");
    expect(brown.outreachStatus).toBe("Responded");
    expect(brown.contactEmail).toBe("gis@example.test");
    expect(brown.responseNotes).toBe("Confirmed public viewer.");
    expect(brown.sourceInbox).toMatch(/brown-imagery/);
    expect(recordFor(restored, "Benton").other[0]?.year).toBe("2023");
  });

  it("writes edited records to CSV with the outreach columns", () => {
    const csv = researchRecordsToCsv(recordsWithEditedBrownAndBenton());

    expect(csv).toMatch(/"Brown"/);
    expect(csv).toMatch(/"Implemented imagery"/);
    expect(csv).toMatch(/"External imagery—date confirmed"/);
    expect(csv).toMatch(/"Official viewer\/research lead—date unknown"/);
    expect(csv).toMatch(/gis\.browncountymn\.gov/);
    expect(csv).toMatch(/example\.test\/brown-imagery/);
    expect(csv).toMatch(/"Coverage Tier","Needs Outreach","Outreach Status"/);
    expect(csv).toMatch(/gis@example\.test/);
  });
});
