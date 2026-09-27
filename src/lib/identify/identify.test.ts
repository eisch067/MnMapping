import { describe, expect, it } from "vitest";
import type { LayerDefinition } from "@/config/layers";
import { identifyAt } from "@/lib/identify/identify";
import type { IdentifyPoint, IdentifyResult, LayerIdentifyAdapter } from "@/lib/identify/types";
import type { IdentifiableItem } from "@/lib/identify/myData";

const point: IdentifyPoint = { longitude: -95.1, latitude: 47.0, toleranceMeters: 10 };

function layer(id: string, overrides: Partial<LayerDefinition> = {}): LayerDefinition {
  return {
    id,
    name: `Layer ${id}`,
    category: "public-land",
    sourceType: "arcgis-featureserver",
    url: "https://example.test",
    defaultVisible: false,
    defaultOpacity: 1,
    attribution: "Test",
    ...overrides,
  };
}

function result(id: string, sourceName: string): IdentifyResult {
  return { id, kind: "layer", sourceName, title: id, rows: [], notes: [], links: [] };
}

// Answers every layer with one result named after it, and records which layers were asked.
function recordingAdapter(asked: string[] = []): LayerIdentifyAdapter {
  return async (queried) => {
    asked.push(queried.id);
    return [result(queried.id, queried.name)];
  };
}

const allOn = (...ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { visible: true, opacity: 1 }]));

const pin: IdentifiableItem = {
  id: "camp",
  name: "North camp",
  geometry: { type: "Point", coordinates: [-95.1, 47.0] },
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("identifyAt", () => {
  it("lists results from the topmost layer first", async () => {
    const outcome = await identifyAt({
      point,
      layers: [layer("bottom"), layer("middle"), layer("top")],
      layerState: allOn("bottom", "middle", "top"),
      cameraHeight: 1_000,
      myData: [],
      adapters: { "arcgis-featureserver": recordingAdapter() },
    });

    expect(outcome.results.map((entry) => entry.id)).toEqual(["top", "middle", "bottom"]);
    expect(outcome.failures).toEqual([]);
  });

  it("lists saved My Data above every layer", async () => {
    const outcome = await identifyAt({
      point,
      layers: [layer("parcels")],
      layerState: allOn("parcels"),
      cameraHeight: 1_000,
      myData: [pin],
      adapters: { "arcgis-featureserver": recordingAdapter() },
    });

    expect(outcome.results.map((entry) => entry.id)).toEqual(["my-data:camp", "parcels"]);
  });

  it("asks only visible layers that can be seen at the camera height", async () => {
    const asked: string[] = [];
    const tooFar = layer("far", { options: { maxCameraHeight: 500 } });

    await identifyAt({
      point,
      layers: [layer("shown"), layer("hidden"), layer("unknown"), tooFar],
      layerState: { ...allOn("shown", "far"), hidden: { visible: false, opacity: 1 } },
      cameraHeight: 1_000,
      myData: [],
      adapters: { "arcgis-featureserver": recordingAdapter(asked) },
    });

    expect(asked).toEqual(["shown"]);
  });

  it("skips layers whose source type has no adapter", async () => {
    const asked: string[] = [];

    const outcome = await identifyAt({
      point,
      layers: [layer("aerial", { sourceType: "wms", category: "imagery" }), layer("parcels")],
      layerState: allOn("aerial", "parcels"),
      cameraHeight: 1_000,
      myData: [],
      adapters: { wms: null, "arcgis-featureserver": recordingAdapter(asked) },
    });

    expect(asked).toEqual(["parcels"]);
    expect(outcome.failures).toEqual([]);
  });

  it("reports a layer that fails without losing the others", async () => {
    const adapter: LayerIdentifyAdapter = async (queried) => {
      if (queried.id === "broken") throw new Error("ArcGIS request failed (502 Bad Gateway).");
      return [result(queried.id, queried.name)];
    };

    const outcome = await identifyAt({
      point,
      layers: [layer("ok"), layer("broken")],
      layerState: allOn("ok", "broken"),
      cameraHeight: 1_000,
      myData: [pin],
      adapters: { "arcgis-featureserver": adapter },
    });

    expect(outcome.results.map((entry) => entry.id)).toEqual(["my-data:camp", "ok"]);
    expect(outcome.failures).toEqual([
      { layerName: "Layer broken", message: "ArcGIS request failed (502 Bad Gateway)." },
    ]);
  });

  it("returns nothing when no layer is visible and nothing is saved there", async () => {
    const outcome = await identifyAt({
      point,
      layers: [layer("hidden")],
      layerState: {},
      cameraHeight: 1_000,
      myData: [],
    });

    expect(outcome).toEqual({ results: [], failures: [] });
  });

  it("passes the click and the abort signal to each adapter", async () => {
    const controller = new AbortController();
    const seen: unknown[] = [];
    const adapter: LayerIdentifyAdapter = async (_layer, context) => {
      seen.push(context.point, context.signal);
      return [];
    };

    await identifyAt({
      point,
      layers: [layer("parcels")],
      layerState: allOn("parcels"),
      cameraHeight: 1_000,
      myData: [],
      signal: controller.signal,
      adapters: { "arcgis-featureserver": adapter },
    });

    expect(seen).toEqual([point, controller.signal]);
  });
});
