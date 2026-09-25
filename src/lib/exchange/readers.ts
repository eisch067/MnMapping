import type { RawPart, RawPosition } from "./normalize";

export class ImportRefusal extends Error {}

export interface RawFeature {
  name?: string;
  note?: string;
  parts: RawPart[];
}

export interface RawRead {
  features: RawFeature[];
  unsupported: number;
  foldersFlattened: number;
}

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null ? (value as JsonObject) : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function jsonPosition(value: unknown): RawPosition {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 2).map((component) => (typeof component === "number" ? component : Number.NaN));
}

function jsonPositions(value: unknown): RawPosition[] {
  return Array.isArray(value) ? value.map(jsonPosition) : [];
}

function jsonParts(geometry: unknown): RawPart[] | null {
  const shape = asObject(geometry);
  if (!shape) return null;
  const { type, coordinates, geometries } = shape;
  const list: unknown[] = Array.isArray(coordinates) ? coordinates : [];
  switch (type) {
    case "Point":
      return [{ type: "Point", position: jsonPosition(coordinates) }];
    case "LineString":
      return [{ type: "LineString", positions: jsonPositions(coordinates) }];
    case "Polygon":
      return [{ type: "Polygon", rings: list.map(jsonPositions) }];
    case "MultiPoint":
      return list.map((position) => ({ type: "Point", position: jsonPosition(position) }));
    case "MultiLineString":
      return list.map((line) => ({ type: "LineString", positions: jsonPositions(line) }));
    case "MultiPolygon":
      return list.map((polygon) => ({
        type: "Polygon",
        rings: Array.isArray(polygon) ? polygon.map(jsonPositions) : [],
      }));
    case "GeometryCollection":
      return (Array.isArray(geometries) ? geometries : []).flatMap((member) => jsonParts(member) ?? []);
    default:
      return null;
  }
}

function jsonFeatures(value: unknown): unknown[] {
  const root = asObject(value);
  if (!root) throw new ImportRefusal("This file is not GeoJSON, so nothing was imported.");
  if (root.type === "FeatureCollection" && Array.isArray(root.features)) return root.features;
  if (root.type === "Feature") return [root];
  if (jsonParts(root)) return [{ type: "Feature", properties: {}, geometry: root }];
  throw new ImportRefusal("This file is not GeoJSON: it has no features or geometry, so nothing was imported.");
}

export function readGeoJson(source: string): RawRead {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new ImportRefusal("This file is not valid JSON, so nothing was imported.");
  }
  const read: RawRead = { features: [], unsupported: 0, foldersFlattened: 0 };
  for (const feature of jsonFeatures(value)) {
    const shape = asObject(feature);
    const properties = asObject(shape?.properties) ?? {};
    const parts = jsonParts(shape?.geometry);
    if (!parts) {
      read.unsupported++;
      continue;
    }
    read.features.push({
      name: text(properties.name),
      note: text(properties.description) ?? text(properties.note),
      parts,
    });
  }
  return read;
}

function parseXml(source: string, rootName: string, format: string): Element {
  const document = new DOMParser().parseFromString(source, "application/xml");
  const root = document.documentElement;
  if (document.getElementsByTagName("parsererror").length > 0 || root?.localName !== rootName) {
    throw new ImportRefusal(`This file is not a valid ${format} file, so nothing was imported.`);
  }
  return root;
}

function descendants(parent: Element, localName: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS("*", localName));
}

function childrenNamed(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter((element) => element.localName === localName);
}

function childText(parent: Element, localName: string): string | undefined {
  return childrenNamed(parent, localName)[0]?.textContent ?? undefined;
}

function numberOrNaN(value: string | null): number {
  return value === null || value.trim() === "" ? Number.NaN : Number(value);
}

function kmlPositions(element: Element): RawPosition[] {
  const coordinates = descendants(element, "coordinates")[0];
  const tokens = coordinates?.textContent?.trim().split(/\s+/).filter(Boolean) ?? [];
  return tokens.map((token) => token.split(",").slice(0, 2).map(numberOrNaN));
}

function kmlPolygon(polygon: Element): RawPart {
  const boundaries = ["outerBoundaryIs", "innerBoundaryIs"]
    .flatMap((name) => childrenNamed(polygon, name))
    .map(kmlPositions);
  return { type: "Polygon", rings: boundaries };
}

function kmlParts(parent: Element): RawPart[] {
  return Array.from(parent.children).flatMap((child): RawPart[] => {
    switch (child.localName) {
      case "Point":
        return [{ type: "Point", position: kmlPositions(child)[0] ?? [] }];
      case "LineString":
        return [{ type: "LineString", positions: kmlPositions(child) }];
      case "Polygon":
        return [kmlPolygon(child)];
      case "MultiGeometry":
        return kmlParts(child);
      default:
        return [];
    }
  });
}

const unsupportedKmlElements = [
  "GroundOverlay",
  "ScreenOverlay",
  "PhotoOverlay",
  "NetworkLink",
  "Model",
  "Track",
  "MultiTrack",
];

export function readKml(source: string): RawRead {
  const root = parseXml(source, "kml", "KML");
  const foldersFlattened = descendants(root, "Folder")
    .filter((folder) => descendants(folder, "Placemark").length > 0).length;
  const unsupported = unsupportedKmlElements
    .reduce((count, name) => count + descendants(root, name).length, 0);
  // A placemark holding only unsupported geometry is already counted above, not rejected.
  const features = descendants(root, "Placemark")
    .map((placemark) => ({
      name: childText(placemark, "name"),
      note: childText(placemark, "description"),
      parts: kmlParts(placemark),
      hasUnsupported: unsupportedKmlElements.some((name) => descendants(placemark, name).length > 0),
    }))
    .filter((feature) => feature.parts.length > 0 || !feature.hasUnsupported)
    .map(({ name, note, parts }) => ({ name, note, parts }));
  return { features, unsupported, foldersFlattened };
}

function gpxPosition(element: Element): RawPosition {
  return [numberOrNaN(element.getAttribute("lon")), numberOrNaN(element.getAttribute("lat"))];
}

function gpxLine(points: Element[]): RawPart {
  return { type: "LineString", positions: points.map(gpxPosition) };
}

function gpxParts(element: Element): RawPart[] {
  switch (element.localName) {
    case "wpt":
      return [{ type: "Point", position: gpxPosition(element) }];
    case "rte":
      return [gpxLine(descendants(element, "rtept"))];
    case "trk":
      return descendants(element, "trkseg").map((segment) => gpxLine(descendants(segment, "trkpt")));
    default:
      return [];
  }
}

export function readGpx(source: string): RawRead {
  const root = parseXml(source, "gpx", "GPX");
  const features = Array.from(root.children)
    .filter((element) => ["wpt", "rte", "trk"].includes(element.localName))
    .map((element) => ({
      name: childText(element, "name"),
      note: childText(element, "desc"),
      parts: gpxParts(element),
    }));
  return { features, unsupported: 0, foldersFlattened: 0 };
}
