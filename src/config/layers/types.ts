export const layerSourceTypes = [
  "tms",
  "wms",
  "wmts",
  "arcgis-mapserver",
  "arcgis-imageserver",
  "arcgis-featureserver",
  "geojson",
  "cesium-terrain",
] as const;

export type LayerSourceType = (typeof layerSourceTypes)[number];
export type LayerCategory = "basemap" | "imagery" | "elevation" | "public-land" | "parcels" | "reference";

export interface LayerDefinition {
  id: string;
  name: string;
  category: LayerCategory;
  sourceType: LayerSourceType;
  url: string;
  defaultVisible: boolean;
  defaultOpacity: number;
  minimumLevel?: number;
  maximumLevel?: number;
  minimumScale?: number;
  maximumScale?: number;
  attribution: string;
  county?: "Hubbard" | "Beltrami" | "Becker" | "Todd" | "Douglas";
  year?: number | string;
  resolution?: string;
  description?: string;
  options?: Record<string, string | number | boolean | string[]>;
}
