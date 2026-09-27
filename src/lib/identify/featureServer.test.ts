import { describe, expect, it } from "vitest";
import type { LayerDefinition } from "@/config/layers";
import { identifyFeatureServer } from "@/lib/identify/featureServer";
import type { IdentifyContext } from "@/lib/identify/types";

const layer: LayerDefinition = {
  id: "wma",
  name: "Publicly Accessible WMAs",
  category: "public-land",
  sourceType: "arcgis-featureserver",
  url: "https://example.test/rest/services/wma/FeatureServer/",
  defaultVisible: true,
  defaultOpacity: 1,
  attribution: "Minnesota DNR Wildlife",
  nameField: "unit_name",
  popupFields: [{ field: "unit_name", label: "WMA" }],
  options: { layerId: 3, outFields: "unit_name", where: "status = 'open'" },
};

function contextFor(respond: (url: URL) => Response, calls: URL[] = []): IdentifyContext {
  return {
    point: { longitude: -95.0616, latitude: 46.9221, toleranceMeters: 10 },
    fetcher: async (input) => {
      const url = new URL(String(input));
      calls.push(url);
      return respond(url);
    },
  };
}

describe("identifyFeatureServer", () => {
  it("asks the layer for the features under the exact point and only its own fields", async () => {
    const calls: URL[] = [];

    await identifyFeatureServer(layer, contextFor(() => Response.json({ features: [] }), calls));

    const query = calls[0];
    expect(query.pathname).toBe("/rest/services/wma/FeatureServer/3/query");
    expect(Object.fromEntries(query.searchParams)).toEqual({
      where: "status = 'open'",
      outFields: "unit_name",
      returnGeometry: "false",
      geometry: "-95.0616,46.9221",
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      f: "json",
    });
  });

  it("returns one result per feature, described by the layer's fields", async () => {
    const context = contextFor(() =>
      Response.json({
        features: [
          { attributes: { unit_name: "Straight River WMA" } },
          { attributes: { unit_name: "Fish Hook WMA" } },
        ],
      }),
    );

    const results = await identifyFeatureServer(layer, context);

    expect(results.map((result) => result.title)).toEqual(["Straight River WMA", "Fish Hook WMA"]);
    expect(results[0]).toMatchObject({
      id: "wma:0",
      kind: "layer",
      sourceName: "Publicly Accessible WMAs",
      rows: [
        { label: "WMA", value: "Straight River WMA" },
        { label: "Source", value: "Minnesota DNR Wildlife" },
      ],
    });
    expect(results[1].id).toBe("wma:1");
  });

  it("returns nothing when no feature is under the point", async () => {
    const context = contextFor(() => Response.json({ features: [] }));

    const results = await identifyFeatureServer(layer, context);

    expect(results).toEqual([]);
  });

  it("asks for every field when the layer names none", async () => {
    const calls: URL[] = [];
    const bare = { ...layer, options: undefined };

    await identifyFeatureServer(bare, contextFor(() => Response.json({ features: [] }), calls));

    expect(calls[0].pathname).toBe("/rest/services/wma/FeatureServer/0/query");
    expect(calls[0].searchParams.get("outFields")).toBe("*");
    expect(calls[0].searchParams.get("where")).toBe("1=1");
  });

  it("reports a service error with its message", async () => {
    const context = contextFor(() =>
      Response.json({ error: { code: 400, message: "Invalid query" } }),
    );

    await expect(identifyFeatureServer(layer, context)).rejects.toThrow(/Invalid query/);
  });

  it("reports a failed request with its status", async () => {
    const context = contextFor(
      () => new Response("nope", { status: 502, statusText: "Bad Gateway" }),
    );

    await expect(identifyFeatureServer(layer, context)).rejects.toThrow(/502/);
  });
});
