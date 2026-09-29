import type { GeoJsonDataSource } from "cesium";
import { geodesicMidpoint, type Position } from "@/lib/geodesy";
import { primaryDimensionLabel, type ElevationSample } from "@/lib/measurements";
import type { MyMapItem } from "@/lib/myData";
import { isPersonalMode } from "@/config/appMode";

export async function addMyDataMeasurementLabels(
  dataSource: GeoJsonDataSource,
  items: readonly MyMapItem[],
  personalMode: boolean,
  labelCache: Map<string, string | null>,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  const { Cartesian2, Cartesian3, Color, HeightReference, LabelStyle, VerticalOrigin } = await import("cesium");
  for (const item of items) {
    if (!isCurrent()) return;
    if (item.geometry.type !== "LineString" || !item.primaryDimension || !("unit" in item.primaryDimension)) continue;
    const dimension = item.primaryDimension;
    if (dimension.kind === "horizontal" || !personalMode || !isPersonalMode) continue;
    const key = JSON.stringify([item.geometry.coordinates, dimension]);
    let label = labelCache.get(key);
    if (label === undefined) {
      try {
        const samples: ElevationSample[] = await sampleLine(item.geometry.coordinates, dimension.kind);
        label = primaryDimensionLabel(item.geometry.coordinates, dimension, samples);
      } catch {
        label = "DEM unavailable";
      }
      labelCache.set(key, label);
    }
    if (!isCurrent() || !label) continue;
    const midpoint = lineMidpoint(item.geometry.coordinates);
    if (!midpoint) continue;
    dataSource.entities.add({
      id: `measurement-${item.id}`,
      position: Cartesian3.fromDegrees(midpoint[0], midpoint[1]),
      label: {
        text: label,
        fillColor: Color.WHITE,
        font: "bold 11px sans-serif",
        style: LabelStyle.FILL,
        showBackground: true,
        backgroundColor: Color.fromCssColorString("#07041f"),
        verticalOrigin: VerticalOrigin.BOTTOM,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        pixelOffset: new Cartesian2(0, -44),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }
}

async function sampleLine(
  coordinates: readonly Position[],
  kind: "direct" | "ground",
): Promise<ElevationSample[]> {
  const { profilePositions, sampleElevations } = await import("@/lib/terrain/elevationSampling");
  const positions = kind === "ground" ? profilePositions(coordinates) : coordinates;
  return sampleElevations(positions);
}

function lineMidpoint(coordinates: readonly Position[]): Position | null {
  if (coordinates.length < 2) return null;
  return geodesicMidpoint(coordinates[0], coordinates[coordinates.length - 1]);
}
