import type { GeoJsonDataSource } from "cesium";

export interface PolygonBorderStyle {
  color: import("cesium").Color;
  width: number;
}

export interface PolygonBorderDecoration {
  style: PolygonBorderStyle;
  ColorMaterialProperty: typeof import("cesium").ColorMaterialProperty;
  PropertyBag: typeof import("cesium").PropertyBag;
}

const generatedPolygonBorderSourceProperty = "mnMappingPolygonBorderSource";

export function decorateGeoJson(
  dataSource: GeoJsonDataSource,
  ConstantProperty: typeof import("cesium").ConstantProperty,
  HeightReference: typeof import("cesium").HeightReference,
  polygonBorder?: PolygonBorderDecoration,
) {
  const sourceEntities = [...dataSource.entities.values];
  for (const entity of sourceEntities) {
    if (entity.polygon) {
      entity.polygon.outline = new ConstantProperty(false);
      const hierarchy = entity.polygon.hierarchy?.getValue();
      if (polygonBorder && hierarchy) {
        addRingBorders(dataSource, entity.id, hierarchy, polygonBorder);
      }
    }
    if (entity.polyline) entity.polyline.clampToGround = new ConstantProperty(true);
    if (entity.billboard) entity.billboard.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
    if (entity.point) entity.point.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
  }
}

function addRingBorders(
  dataSource: GeoJsonDataSource,
  sourceId: string,
  hierarchy: import("cesium").PolygonHierarchy,
  polygonBorder: PolygonBorderDecoration,
) {
  const rings: import("cesium").PolygonHierarchy[] = [];
  const collectRings = (current: import("cesium").PolygonHierarchy) => {
    rings.push(current);
    current.holes?.forEach(collectRings);
  };
  collectRings(hierarchy);
  rings.forEach((ring) => {
    if (ring.positions.length < 2) return;
    const first = ring.positions[0]!;
    const last = ring.positions[ring.positions.length - 1]!;
    const positions = ring.positions.length > 2 && first.x === last.x && first.y === last.y && first.z === last.z
      ? ring.positions
      : [...ring.positions, first];
    const border = dataSource.entities.add({
      polyline: {
        positions,
        material: new polygonBorder.ColorMaterialProperty(polygonBorder.style.color),
        width: polygonBorder.style.width,
        clampToGround: true,
      },
    });
    border.properties = new polygonBorder.PropertyBag({ [generatedPolygonBorderSourceProperty]: sourceId });
  });
}

export function isGeneratedPolygonBorder(entity: import("cesium").Entity): boolean {
  return Boolean(entity.properties?.hasProperty(generatedPolygonBorderSourceProperty));
}
