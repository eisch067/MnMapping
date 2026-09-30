import { describe, expect, it } from "vitest";
import {
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  GeoJsonDataSource,
  HeightReference,
  PropertyBag,
} from "cesium";
import { decorateGeoJson, isGeneratedPolygonBorder } from "@/lib/map/decorateGeoJson";
import { applyGeoJsonOpacity } from "@/lib/map/createLayer";
import type { LayerDefinition } from "@/config/layers";

const polygonWithHole = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [[-95, 47], [-94, 47], [-94, 48], [-95, 48], [-95, 47]],
        [[-94.8, 47.2], [-94.2, 47.2], [-94.2, 47.8], [-94.8, 47.8], [-94.8, 47.2]],
      ],
    },
  }],
};

describe("decorateGeoJson", () => {
  it("creates clamped border polylines for the outer and inner polygon rings", async () => {
    const dataSource = await GeoJsonDataSource.load(polygonWithHole, { clampToGround: true });

    decorateGeoJson(
      dataSource,
      ConstantProperty,
      HeightReference,
      {
        style: { color: Color.YELLOW, width: 3 },
        ColorMaterialProperty,
        PropertyBag,
      },
    );

    const borders = dataSource.entities.values.filter(isGeneratedPolygonBorder);
    expect(borders).toHaveLength(2);
    expect(borders.every((entity) => entity.polyline?.clampToGround?.getValue())).toBe(true);
    expect(borders.map((entity) => entity.polyline?.positions?.getValue()?.length)).toStrictEqual([5, 5]);
    expect(dataSource.entities.values.find((entity) => entity.polygon)?.polygon?.outline?.getValue()).toBe(false);

    const layer: LayerDefinition = {
      id: "test-polygon",
      name: "Test polygon",
      category: "public-land",
      sourceType: "geojson",
      url: "https://example.test/polygon.geojson",
      attribution: "Test data",
      defaultVisible: true,
      defaultOpacity: 1,
      options: { fillColor: "#008800", strokeColor: "#ffffff", fillAlpha: 0.2, strokeWidth: 4 },
    };
    await applyGeoJsonOpacity(dataSource, layer, 0.25);

    for (const border of borders) {
      expect(border.polyline?.width?.getValue()).toBe(4);
      const material = border.polyline?.material?.getValue();
      expect(material?.color.alpha).toBe(0.25);
    }
  });
});
