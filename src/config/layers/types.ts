export const layerSourceTypes = [
  "tms",
  "wms",
  "wmts",
  "arcgis-mapserver",
  "arcgis-imageserver",
  "arcgis-featureserver",
  "geojson",
  "cesium-terrain",
  "arcgis-terrain",
] as const;

export type LayerSourceType = (typeof layerSourceTypes)[number];
export type LayerCategory = "basemap" | "imagery" | "elevation" | "public-land" | "parcels" | "reference";
export type CountyZone = "north" | "south";
export type ParcelAvailability = "available" | "partial" | "pending";
export type ParcelSourceType = "arcgis-feature" | "mngeo-open" | "download" | "none";

export const terrainSourceTypes: readonly LayerSourceType[] = ["cesium-terrain", "arcgis-terrain"];

export function isTerrainLayer(layer: LayerDefinition): boolean {
  return terrainSourceTypes.includes(layer.sourceType);
}

export function isLayerAvailableAtCameraHeight(layer: LayerDefinition, cameraHeight: number): boolean {
  const maximum = Number(layer.options?.maxCameraHeight ?? Number.POSITIVE_INFINITY);
  return cameraHeight <= maximum;
}

export interface LayerBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface LayerPopupField {
  field: string;
  label: string;
}

export interface ParcelFieldMap {
  parcelId: string;
  owner?: string;
  secondaryOwner?: string;
  siteAddress?: string;
  mailingAddress?: string;
  acres?: string;
  legalDescription?: string;
  assessedValue?: string;
  taxYear?: string;
}

export type AccessMeaning = "public-access" | "managed-land" | "administrative-boundary" | "access-varies";
export type ImageryGroup = "naip" | "cir";

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
  agency?: string;
  sourceUrl?: string;
  county?: string;
  bounds?: LayerBounds;
  recordsUrl?: string;
  year?: number | string;
  resolution?: string;
  description?: string;
  imageryGroup?: ImageryGroup;
  unavailableMessage?: string;
  accessMeaning?: AccessMeaning;
  nameField?: string;
  popupFields?: readonly LayerPopupField[];
  parcelFields?: ParcelFieldMap;
  options?: Record<string, string | number | boolean | string[]>;
}

export interface CountyDefinition {
  id: string;
  name: string;
  fips: string;
  zone: CountyZone;
  bounds: LayerBounds;
  layers: readonly LayerDefinition[];
  parcels: {
    status: ParcelAvailability;
    sourceType: ParcelSourceType;
    verifiedAt?: string;
  };
  notes?: readonly string[];
}
