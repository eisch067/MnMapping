import type { CustomDataSource } from "cesium";
import { geodesicDistanceMeters, geodesicMidpoint, type Position } from "../geodesy";
import { formatDistance } from "../measurements";
import type { DistanceUnit, SavedAppearance } from "../myData";

export interface DrawingOverlayState {
  vertices: readonly Position[];
  closed: boolean;
  editing: boolean;
  appearance: Extract<SavedAppearance, { kind: "line" | "polygon" }>;
  segmentUnit: DistanceUnit;
}

export async function createDrawingOverlay(state: DrawingOverlayState): Promise<CustomDataSource> {
  const {
    Cartesian2,
    Cartesian3,
    Color,
    ColorMaterialProperty,
    ConstantProperty,
    CustomDataSource,
    HeightReference,
    LabelStyle,
    PolygonHierarchy,
    VerticalOrigin,
  } = await import("cesium");
  const dataSource = new CustomDataSource("Active drawing");
  const positions = state.vertices.map(([longitude, latitude]) => Cartesian3.fromDegrees(longitude, latitude));
  const lineColor = state.appearance.kind === "line"
    ? Color.fromCssColorString(state.appearance.color)
    : Color.fromCssColorString(state.appearance.outlineColor);
  if (positions.length > 1) dataSource.entities.add({
    id: "drawing-shape",
    polyline: { positions, width: state.appearance.kind === "line" ? state.appearance.width : 3, material: lineColor, clampToGround: true },
  });
  if (state.closed && positions.length > 2 && state.appearance.kind === "polygon") dataSource.entities.add({
    id: "drawing-fill",
    polygon: {
      hierarchy: new PolygonHierarchy(positions),
      material: new ColorMaterialProperty(
        Color.fromCssColorString(state.appearance.fillColor).withAlpha(state.appearance.opacity),
      ),
      outline: new ConstantProperty(true),
      outlineColor: new ConstantProperty(lineColor),
      heightReference: new ConstantProperty(HeightReference.CLAMP_TO_GROUND),
    },
  });
  state.vertices.forEach((point, index) => dataSource.entities.add({
    id: `drawing-vertex-${index}`,
    position: Cartesian3.fromDegrees(point[0], point[1]),
    point: { color: Color.fromCssColorString("#ffd76a"), outlineColor: Color.WHITE, outlineWidth: 3, pixelSize: 22, heightReference: HeightReference.CLAMP_TO_GROUND },
    label: { text: String(index + 1), fillColor: Color.fromCssColorString("#07041f"), font: "bold 11px sans-serif", style: LabelStyle.FILL, verticalOrigin: VerticalOrigin.CENTER, heightReference: HeightReference.CLAMP_TO_GROUND },
  }));
  const segmentCount = state.closed ? state.vertices.length : Math.max(0, state.vertices.length - 1);
  for (let index = 0; index < segmentCount; index += 1) {
    const start = state.vertices[index];
    const end = state.vertices[(index + 1) % state.vertices.length];
    const midpoint = geodesicMidpoint(start, end);
    dataSource.entities.add({
      id: `drawing-segment-${index}`,
      position: Cartesian3.fromDegrees(midpoint[0], midpoint[1]),
      label: { text: formatDistance(geodesicDistanceMeters(start, end), state.segmentUnit), fillColor: Color.WHITE, font: "bold 11px sans-serif", showBackground: true, backgroundColor: Color.fromCssColorString("#07041f"), pixelOffset: new Cartesian2(0, -22), heightReference: HeightReference.CLAMP_TO_GROUND },
      point: state.editing ? { color: Color.fromCssColorString("#07041f"), outlineColor: Color.fromCssColorString("#ffd76a"), outlineWidth: 2, pixelSize: 18, heightReference: HeightReference.CLAMP_TO_GROUND } : undefined,
    });
  }
  return dataSource;
}
