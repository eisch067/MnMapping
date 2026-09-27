import { describe, expect, it } from "vitest";
import { layerRegistry, type LayerDefinition } from "@/config/layers";
import type { IdentifyContext } from "@/lib/identify/types";
import { identifyLakeDepth } from "./lakeDepth";

function depthLayer(): LayerDefinition {
  const layer = layerRegistry.find((candidate) => candidate.id === "mndnr-lake-depth-map");
  if (!layer) throw new Error("The personal registry has no Lake depth map.");
  return { ...layer, url: "https://example.test/rest/services/bathymetry/MapServer" };
}

const beltrami = { dowlknum: "04013500", lake_name: "Beltrami", cty_name: "Beltrami", acres: 725.8 };

interface Answers {
  outline?: unknown[];
  contours?: unknown[];
}

function contextFor({ outline = [], contours = [] }: Answers, calls: URL[] = []): IdentifyContext {
  return {
    point: { longitude: -94.8132, latitude: 47.594, toleranceMeters: 12.4 },
    fetcher: async (input) => {
      const url = new URL(String(input));
      calls.push(url);
      const features = url.pathname.endsWith("/1/query") ? outline : contours;
      return Response.json({ features: features.map((attributes) => ({ attributes })) });
    },
  };
}

describe("identifyLakeDepth", () => {
  it("asks the outline layer for the lake under the point and the contour layer for lines near it", async () => {
    const calls: URL[] = [];

    await identifyLakeDepth(depthLayer(), contextFor({}, calls));

    const outline = calls.find((url) => url.pathname.endsWith("/MapServer/1/query"));
    const contours = calls.find((url) => url.pathname.endsWith("/MapServer/0/query"));
    expect(outline?.searchParams.get("geometry")).toBe("-94.8132,47.594");
    expect(outline?.searchParams.get("outFields")).toBe("dowlknum,lake_name,cty_name,acres,island");
    expect(outline?.searchParams.get("distance")).toBeNull();
    expect(contours?.searchParams.get("distance")).toBe("12");
    expect(contours?.searchParams.get("outFields")).toBe("dowlknum,lake_name,abs_depth");
    expect(contours?.searchParams.get("returnGeometry")).toBe("false");
  });

  it("returns nothing where neither layer has anything", async () => {
    await expect(identifyLakeDepth(depthLayer(), contextFor({}))).resolves.toEqual([]);
  });

  it("names the lake, its DOW number, and the contour depth near the point", async () => {
    const [result] = await identifyLakeDepth(
      depthLayer(),
      contextFor({
        outline: [beltrami],
        contours: [
          { dowlknum: "04013500", lake_name: "Beltrami", abs_depth: 10 },
          { dowlknum: "04013500", lake_name: "Beltrami", abs_depth: 5 },
          { dowlknum: "04013500", lake_name: "Beltrami", abs_depth: 10 },
        ],
      }),
    );

    expect(result).toMatchObject({
      kind: "layer",
      sourceName: "Lake depth map",
      title: "Beltrami",
      lake: { dow: "04013500", name: "Beltrami" },
    });
    expect(result?.rows).toEqual([
      { label: "DOW number", value: "04013500" },
      { label: "County", value: "Beltrami" },
      { label: "Acres", value: "725.8" },
      { label: "Contour depth", value: "5 ft, 10 ft" },
    ]);
  });

  it("warns that coverage is incomplete and historical, and states the class meaning", async () => {
    const [result] = await identifyLakeDepth(depthLayer(), contextFor({ outline: [beltrami] }));

    expect(result?.notes).toEqual([
      "DNR reference data — not for navigation; coverage varies.",
      expect.stringMatching(/incomplete and historical/),
    ]);
    expect(result?.attribution).toBe(
      "Minnesota DNR · reference only, not a legal boundary or proof of access",
    );
  });

  it("omits the contour row where no contour is near the point", async () => {
    const [result] = await identifyLakeDepth(depthLayer(), contextFor({ outline: [beltrami] }));

    expect(result?.rows.map((row) => row.label)).not.toContain("Contour depth");
  });

  it("still reports a lake whose contour is within reach of the point but whose outline is not", async () => {
    const [result] = await identifyLakeDepth(
      depthLayer(),
      contextFor({ contours: [{ dowlknum: "04013500", lake_name: "Beltrami", abs_depth: 0 }] }),
    );

    expect(result?.title).toBe("Beltrami");
    expect(result?.rows).toContainEqual({ label: "Contour depth", value: "0 ft" });
  });

  it("does not treat an island as a lake", async () => {
    const results = await identifyLakeDepth(
      depthLayer(),
      contextFor({ outline: [{ ...beltrami, island: "Y" }] }),
    );

    expect(results).toEqual([]);
  });

  it("reports a service error rather than an empty answer", async () => {
    const context: IdentifyContext = {
      ...contextFor({}),
      fetcher: async () => Response.json({ error: { code: 400, message: "Bad request" } }),
    };

    await expect(identifyLakeDepth(depthLayer(), context)).rejects.toThrow(/ArcGIS error 400/);
  });
});
