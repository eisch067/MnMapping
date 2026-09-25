import { describe, expect, it } from "vitest";
import type { LayerDefinition } from "@/config/layers";
import { topmostFirst } from "@/lib/map/layerStack";

function layer(id: string, overrides: Partial<LayerDefinition>): LayerDefinition {
  return {
    id,
    name: id,
    category: "reference",
    sourceType: "arcgis-mapserver",
    url: "https://example.test",
    defaultVisible: true,
    defaultOpacity: 1,
    attribution: "Test",
    ...overrides,
  };
}

const ids = (layers: readonly LayerDefinition[]) => layers.map((entry) => entry.id);

describe("topmostFirst", () => {
  it("puts the layer drawn last first", () => {
    const drawn = [
      layer("lower", { category: "public-land", sourceType: "arcgis-featureserver" }),
      layer("upper", { category: "public-land", sourceType: "arcgis-featureserver" }),
    ];

    expect(ids(topmostFirst(drawn))).toEqual(["upper", "lower"]);
  });

  it("puts vector layers above imagery however they are ordered", () => {
    const drawn = [
      layer("parcels", { category: "parcels", sourceType: "arcgis-featureserver" }),
      layer("aerial", { category: "imagery", sourceType: "wms", county: "Hubbard" }),
      layer("roads", { category: "reference" }),
    ];

    expect(ids(topmostFirst(drawn))).toEqual(["parcels", "roads", "aerial"]);
  });

  it("puts county imagery above statewide imagery above the basemap", () => {
    const drawn = [
      layer("county", { category: "imagery", county: "Hubbard" }),
      layer("statewide", { category: "imagery" }),
      layer("basemap", { category: "basemap" }),
    ];

    expect(ids(topmostFirst(drawn))).toEqual(["county", "statewide", "basemap"]);
  });

  it("returns an empty list for no layers and leaves its input alone", () => {
    const drawn = [layer("a", {}), layer("b", {})];

    expect(topmostFirst([])).toEqual([]);
    topmostFirst(drawn);
    expect(ids(drawn)).toEqual(["a", "b"]);
  });
});
