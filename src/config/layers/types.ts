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
export type LayerCategory =
  | "basemap"
  | "imagery"
  | "elevation"
  | "public-land"
  | "dnr-recreation"
  | "parcels"
  | "reference";
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

export type DnrHeading =
  | "hunting-zones-health"
  | "hunting-access-habitat"
  | "fishing-water-access"
  | "recreation-trails"
  | "water-regulatory-reference";

// What a DNR Recreation result claims, and refuses to claim, about the place it describes.
export type DnrMeaningClass =
  | "regulation-zone"
  | "inventory-reference"
  | "regulatory-guide"
  | "enrolled-private-land"
  | "facility"
  | "access-varies"
  | "managed-land"
  | "reference";

// A layer whose meaning depends on a season is unavailable unless its effective period is
// current: read from the service when it publishes one, otherwise configured and verified by hand.
export type DnrSeasonRule =
  | { source: "service"; field: string; lastVerifiedPeriod: string }
  | { source: "configured"; label: string; verifiedThrough: string };

export interface DnrLink {
  label: string;
  href: string;
}

export interface DnrLinkField {
  field: string;
  label: string;
  // Joined to the attribute when DNR publishes only a file name.
  baseUrl?: string;
  // Known broken links remain part of the release link check but are not offered to users.
  excludedValues?: readonly string[];
}

export interface DnrNameLinkTable {
  field: string;
  label: string;
  pages: Readonly<Record<string, string>>;
}

export interface DnrFreshness {
  label: string;
  contentDate: string;
  freshThrough: string;
  staleWarning: string;
}

// Where a result names its lake, so the LakeFinder summary can be opened from it.
export interface DnrLakeLink {
  // The attribute holding the eight-character DOW lake number.
  dowField: string;
  // The attribute holding the lake's name, used until the summary loads.
  nameField?: string;
}

export interface DnrLayerInfo {
  heading: DnrHeading;
  meaningClass: DnrMeaningClass;
  // The official DNR page a result links as "Verify current regulations".
  verifyUrl: string;
  // When the source service was last checked against DNR, as YYYY-MM-DD.
  verifiedOn: string;
  season?: DnrSeasonRule;
  // Shown under "More details" rather than in the summary.
  moreFields?: readonly LayerPopupField[];
  // Attributes holding a web address DNR published, shown as links when they are DNR pages.
  linkFields?: readonly DnrLinkField[];
  // Official pages that apply to every result of the layer.
  links?: readonly DnrLink[];
  // Official pages selected by an exact source name. Unreconciled names deliberately have no link.
  nameLinks?: readonly DnrNameLinkTable[];
  // Release-verified currency label; stale layers warn but remain available.
  freshness?: DnrFreshness;
  // Source-specific cautions shown after the shared meaning statement.
  notes?: readonly string[];
  // Attributes DNR stores as epoch milliseconds, shown as dates.
  dateFields?: readonly string[];
  // Prepended to the name field, for a source whose name is only a number.
  titlePrefix?: string;
  // An attribute DNR uses for a closure or condition notice, shown as a banner above the summary.
  alertField?: string;
  // Lets a result open the LakeFinder summary for the lake it names.
  lake?: DnrLakeLink;
  // A limit on what the layer covers, shown on its drawer row and in every result.
  caution?: string;
}

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
  dnr?: DnrLayerInfo;
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
