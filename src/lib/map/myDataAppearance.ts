import type { GeoJsonDataSource } from "cesium";
import { builtInSymbol } from "../myDataSymbols";
import type { MyMapItem } from "../myData";

export async function applyMyDataAppearance(
  dataSource: GeoJsonDataSource,
  items: readonly MyMapItem[],
): Promise<void> {
  const { Color, ColorMaterialProperty, ConstantProperty } = await import("cesium");
  const itemsById = new Map(items.map((item) => [item.id, item]));
  for (const entity of dataSource.entities.values) {
    const item = itemsById.get(entity.id);
    if (!item) continue;
    const appearance = item.appearance;
    if (appearance.kind === "point" && entity.billboard) {
      entity.billboard.image = new ConstantProperty(symbolImage(
        builtInSymbol(appearance.symbolId).glyph,
        appearance.color,
      ));
    }
    if (appearance.kind === "line" && entity.polyline) {
      entity.polyline.material = new ColorMaterialProperty(Color.fromCssColorString(appearance.color));
      entity.polyline.width = new ConstantProperty(appearance.width);
    }
    if (appearance.kind === "polygon" && entity.polygon) {
      const outline = Color.fromCssColorString(appearance.outlineColor);
      const fill = Color.fromCssColorString(appearance.fillColor).withAlpha(appearance.opacity);
      entity.polygon.material = new ColorMaterialProperty(fill);
      entity.polygon.outline = new ConstantProperty(true);
      entity.polygon.outlineColor = new ConstantProperty(outline);
    }
  }
}

function symbolImage(glyph: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path fill="${color}" stroke="white" stroke-width="2" d="M20 1C9.5 1 1 9.5 1 20c0 14.3 19 27 19 27s19-12.7 19-27C39 9.5 30.5 1 20 1Z"/><text x="20" y="25" fill="white" font-family="sans-serif" font-size="16" text-anchor="middle">${glyph}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
