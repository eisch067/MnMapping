import { describe, expect, it, vi } from "vitest";
import beltrami from "./fixtures/lakefinder-beltrami.json";
import changedSchema from "./fixtures/lakefinder-changed-schema.json";
import noRecord from "./fixtures/lakefinder-no-record.json";
import peltier from "./fixtures/lakefinder-peltier.json";
import { fetchLakeFinder, isDow, parseLakeFinder } from "./lakefinder";

function foundLake(dow: string, body: unknown) {
  const outcome = parseLakeFinder(dow, body);
  if (outcome.status !== "found") throw new Error(`Expected a record, got ${outcome.status}.`);
  return outcome.lake;
}

describe("parseLakeFinder", () => {
  it("reads identity, morphology, and flags from a matching record", () => {
    const lake = foundLake("04013500", beltrami.body);

    expect(lake).toMatchObject({
      dow: "04013500",
      name: "Beltrami",
      county: "Beltrami",
      nearestTown: "Bemidji",
      acres: 725.82,
      maxDepthFeet: 50,
      meanDepthFeet: 13,
      invasiveSpecies: ["starry stonewort"],
      mapIds: ["B0025"],
    });
    expect(lake.resources).toMatchObject({ waterLevels: true, lakeMap: true, lakeSurvey: true });
  });

  it("keeps special regulations verbatim, with the species and location they name", () => {
    const { regulations } = foundLake("04013500", beltrami.body);

    expect(regulations).toEqual([
      {
        species: ["Northern Pike"],
        text: 'All from 22-30" must be immediately released. Possession limit 10, only one over 30".',
        location: "",
      },
      {
        species: ["Sunfish"],
        text: "Daily limit five.",
        location: "Including connected Turtle River Fox Lake",
      },
    ]);
  });

  it("splits the comma-joined survey list DNR sends as one string", () => {
    const { surveyedSpecies } = foundLake("04013500", beltrami.body);

    expect(surveyedSpecies).toHaveLength(16);
    expect(surveyedSpecies.slice(0, 3)).toEqual(["black crappie", "bluegill", "bowfin (dogfish)"]);
  });

  it("treats an empty regulations list as a record with no special regulations", () => {
    const lake = foundLake("02000400", peltier.body);

    expect(lake.regulations).toEqual([]);
  });

  it("treats a depth of zero as not reported", () => {
    const lake = foundLake("02000400", peltier.body);

    expect(lake.maxDepthFeet).toBe(18);
    expect(lake.meanDepthFeet).toBeUndefined();
  });

  it("reports no record when DNR finds no match", () => {
    expect(parseLakeFinder("99999999", noRecord.body)).toEqual({ status: "none" });
    expect(parseLakeFinder("99999999", { status: "OK", message: "", results: [] })).toEqual({
      status: "none",
    });
  });

  it("reports a changed schema when the regulations list is missing", () => {
    expect(parseLakeFinder("04013500", changedSchema.body)).toEqual({ status: "changed" });
  });

  it.each([
    ["a body that is not an object", "nope"],
    ["a body without a status", { results: [] }],
    ["results that are not a list", { status: "OK", results: {} }],
    ["an error DNR did not describe as no results", { status: "ERROR", message: "Down", results: null }],
    ["a record for another lake", { status: "OK", results: [{ ...beltrami.body.results[0], id: "1" }] }],
    ["a record with no name", { status: "OK", results: [{ ...beltrami.body.results[0], name: "" }] }],
    [
      "a regulation without its text",
      {
        status: "OK",
        results: [
          { ...beltrami.body.results[0], specialFishingRegs: [{ regs: [{ species: ["Walleye"] }] }] },
        ],
      },
    ],
  ])("reports a changed schema for %s", (_label, body) => {
    expect(parseLakeFinder("04013500", body)).toEqual({ status: "changed" });
  });

  it("tolerates missing optional fields", () => {
    const { id, name, specialFishingRegs } = beltrami.body.results[0];
    const lake = foundLake(id, { status: "OK", results: [{ id, name, specialFishingRegs }] });

    expect(lake).toMatchObject({ dow: id, name, invasiveSpecies: [], surveyedSpecies: [], mapIds: [] });
    expect(lake.county).toBeUndefined();
    expect(lake.resources.waterLevels).toBe(false);
  });
});

describe("isDow", () => {
  it("accepts exactly eight digits, keeping leading zeros", () => {
    expect(isDow("04013500")).toBe(true);
    expect(isDow("4013500")).toBe(false);
    expect(isDow("040135000")).toBe(false);
    expect(isDow("0401350a")).toBe(false);
  });
});

describe("fetchLakeFinder", () => {
  const respond = (body: string, init?: ResponseInit) =>
    vi.fn<typeof fetch>().mockResolvedValue(new Response(body, init));

  it("asks the proxy for the lake by its DOW number and parses the text body", async () => {
    const fetcher = respond(JSON.stringify(beltrami.body), {
      headers: { "content-type": "text/plain" },
    });

    const outcome = await fetchLakeFinder("04013500", { fetcher });

    expect(outcome.status).toBe("found");
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      "/api/gis-proxy/dnr-lakefinder/by_id/v1?id=04013500",
    );
  });

  it("reports the service as unavailable when the request fails", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchLakeFinder("04013500", { fetcher })).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("reports the service as unavailable on an error status or a body that is not JSON", async () => {
    await expect(
      fetchLakeFinder("04013500", { fetcher: respond("{}", { status: 502 }) }),
    ).resolves.toEqual({ status: "unavailable" });
    await expect(
      fetchLakeFinder("04013500", { fetcher: respond("<html>Maintenance</html>") }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("does not ask DNR about a value that is not a DOW number", async () => {
    const fetcher = respond("{}");

    await expect(fetchLakeFinder("../admin", { fetcher })).resolves.toEqual({ status: "none" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rethrows when the caller aborts, so a stale answer is dropped", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(
      fetchLakeFinder("04013500", { fetcher, signal: controller.signal }),
    ).rejects.toThrow("Aborted");
  });
});
