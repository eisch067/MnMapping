import type { GeoJsonDataSource } from "cesium";

export function decorateGeoJson(
  dataSource: GeoJsonDataSource,
  ConstantProperty: typeof import("cesium").ConstantProperty,
  HeightReference: typeof import("cesium").HeightReference,
) {
  for (const entity of dataSource.entities.values) {
    if (entity.polygon) entity.polygon.outline = new ConstantProperty(true);
    if (entity.polyline) entity.polyline.clampToGround = new ConstantProperty(true);
    if (entity.billboard) entity.billboard.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
    if (entity.point) entity.point.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
  }
}
