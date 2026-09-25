import type { MyDataFolder, MyGeometry, MyMapItem } from "@/lib/myDataModel";

export type ExportFormat = "kml" | "gpx" | "geojson";

// A margin under OnX's documented limits of 3,000 Markups and 4 MB per import.
export const EXPORT_PART_ITEMS = 3_000;
export const EXPORT_PART_BYTES = 3.5 * 1024 * 1024;

export interface ExportFile {
  filename: string;
  mimeType: string;
  content: string;
  itemCount: number;
}

export interface ExportRequest {
  items: readonly MyMapItem[];
  folders: readonly MyDataFolder[];
  // Names the file when everything lands in one: the folder, the item, or the selection.
  scopeName: string;
  format: ExportFormat;
  exportedAt: Date;
}

interface FormatWriter {
  extension: string;
  mimeType: string;
  header: (title: string) => string;
  fragment: (item: MyMapItem) => string;
  footer: string;
}

const UNFILED_LABEL = "Unfiled";
const encoder = new TextEncoder();

// XML 1.0 forbids most control characters even when escaped.
const forbiddenXmlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

function escapeXml(value: string): string {
  return value
    .replace(forbiddenXmlCharacters, "")
    .replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

function closeRing(ring: readonly [number, number][]): [number, number][] {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || (first[0] === last[0] && first[1] === last[1])) return [...ring];
  return [...ring, first];
}

// Lines and areas as a list of positions; areas are closed so no format receives an open ring.
function outline(geometry: MyGeometry): [number, number][] {
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "LineString") return geometry.coordinates;
  return closeRing(geometry.coordinates[0] ?? []);
}

function decimals(value: number): string {
  return value.toFixed(6);
}

function kmlCoordinates(positions: readonly [number, number][]): string {
  return positions.map(([longitude, latitude]) => `${decimals(longitude)},${decimals(latitude)}`).join(" ");
}

function kmlGeometry(geometry: MyGeometry): string {
  const coordinates = `<coordinates>${kmlCoordinates(outline(geometry))}</coordinates>`;
  if (geometry.type === "Point") return `<Point>${coordinates}</Point>`;
  if (geometry.type === "LineString") return `<LineString>${coordinates}</LineString>`;
  return `<Polygon><outerBoundaryIs><LinearRing>${coordinates}</LinearRing></outerBoundaryIs></Polygon>`;
}

function optionalText(tag: string, value: string | undefined): string {
  return value ? `<${tag}>${escapeXml(value)}</${tag}>` : "";
}

function kmlFragment(item: MyMapItem): string {
  return `<Placemark><name>${escapeXml(item.name)}</name>${optionalText("description", item.note)}`
    + `${kmlGeometry(item.geometry)}</Placemark>`;
}

function trackPoint([longitude, latitude]: [number, number]): string {
  return `<trkpt lat="${decimals(latitude)}" lon="${decimals(longitude)}"/>`;
}

function gpxFragment(item: MyMapItem): string {
  const identity = `<name>${escapeXml(item.name)}</name>${optionalText("desc", item.note)}`;
  if (item.geometry.type === "Point") {
    const [longitude, latitude] = item.geometry.coordinates;
    return `<wpt lat="${decimals(latitude)}" lon="${decimals(longitude)}">${identity}</wpt>`;
  }
  return `<trk>${identity}<trkseg>${outline(item.geometry).map(trackPoint).join("")}</trkseg></trk>`;
}

function rounded(geometry: MyGeometry): MyGeometry {
  const round = (position: [number, number]): [number, number] => [
    Number(decimals(position[0])),
    Number(decimals(position[1])),
  ];
  if (geometry.type === "Point") return { type: "Point", coordinates: round(geometry.coordinates) };
  if (geometry.type === "LineString") return { type: "LineString", coordinates: geometry.coordinates.map(round) };
  return { type: "Polygon", coordinates: [outline(geometry).map(round)] };
}

const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';

const writers: Record<Exclude<ExportFormat, "geojson">, FormatWriter> = {
  kml: {
    extension: "kml",
    mimeType: "application/vnd.google-earth.kml+xml",
    header: (title) => `${xmlDeclaration}<kml xmlns="http://www.opengis.net/kml/2.2"><Document>`
      + `<name>${escapeXml(title)}</name>`,
    fragment: kmlFragment,
    footer: "</Document></kml>",
  },
  gpx: {
    extension: "gpx",
    mimeType: "application/gpx+xml",
    header: () => `${xmlDeclaration}<gpx version="1.1" creator="MnMapping" `
      + 'xmlns="http://www.topografix.com/GPX/1/1">',
    fragment: gpxFragment,
    footer: "</gpx>",
  },
};

function byteLength(text: string): number {
  return encoder.encode(text).byteLength;
}

// Items are added in order; a part closes when the next item would pass either limit.
function splitIntoParts(items: readonly MyMapItem[], writer: FormatWriter, title: string) {
  const overhead = byteLength(writer.header(title) + writer.footer);
  const parts: { items: MyMapItem[]; fragments: string[] }[] = [];
  let bytes = 0;
  for (const item of items) {
    const fragment = writer.fragment(item);
    const size = byteLength(fragment);
    const current = parts[parts.length - 1];
    const fits = current
      && current.items.length < EXPORT_PART_ITEMS
      && overhead + bytes + size <= EXPORT_PART_BYTES;
    if (!current || !fits) {
      parts.push({ items: [item], fragments: [fragment] });
      bytes = size;
    } else {
      current.items.push(item);
      current.fragments.push(fragment);
      bytes += size;
    }
  }
  return parts;
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

export function localStamp(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function sanitizeName(name: string): string {
  const cleaned = name
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned || "MnMapping";
}

interface FolderGroup {
  label: string;
  items: MyMapItem[];
}

// Unfiled first, then folders in name order, so the same data always exports in the same order.
function groupByFolder(items: readonly MyMapItem[], folders: readonly MyDataFolder[]): FolderGroup[] {
  const known = new Map(folders.map((folder) => [folder.id, folder.name]));
  const groups = new Map<string | null, FolderGroup>();
  for (const item of items) {
    const key = item.folderId !== null && known.has(item.folderId) ? item.folderId : null;
    const label = key === null ? UNFILED_LABEL : (known.get(key) ?? UNFILED_LABEL);
    const group = groups.get(key) ?? { label, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.label === UNFILED_LABEL) return -1;
    if (b.label === UNFILED_LABEL) return 1;
    return a.label.localeCompare(b.label, "en-US");
  });
}

function uniqueFilename(base: string, extension: string, taken: Set<string>): string {
  let candidate = `${base}.${extension}`;
  for (let suffix = 2; taken.has(candidate); suffix++) candidate = `${base}-${suffix}.${extension}`;
  taken.add(candidate);
  return candidate;
}

function geoJsonFile(request: ExportRequest, items: readonly MyMapItem[]): ExportFile[] {
  const folderNames = new Map(request.folders.map((folder) => [folder.id, folder.name]));
  const collection = {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      id: item.id,
      properties: {
        name: item.name,
        note: item.note,
        folder: (item.folderId && folderNames.get(item.folderId)) || UNFILED_LABEL,
        mnmapping: { appearance: item.appearance, primaryDimension: item.primaryDimension },
      },
      geometry: rounded(item.geometry),
    })),
  };
  const base = `${sanitizeName(request.scopeName)}_${localStamp(request.exportedAt)}`;
  return [{
    filename: `${base}.geojson`,
    mimeType: "application/geo+json",
    content: JSON.stringify(collection, null, 2),
    itemCount: items.length,
  }];
}

// Interoperability exports carry active items only; Trash exists only in the My Data archive.
export function buildExport(request: ExportRequest): ExportFile[] {
  const items = request.items.filter((item) => !item.deletion);
  if (request.format === "geojson") return geoJsonFile(request, items);
  const writer = writers[request.format];
  const groups = groupByFolder(items, request.folders);
  const stamp = localStamp(request.exportedAt);
  const taken = new Set<string>();
  return groups.flatMap((group) => {
    const title = groups.length === 1 ? request.scopeName : group.label;
    const parts = splitIntoParts(group.items, writer, title);
    return parts.map((part, index) => {
      const suffix = parts.length > 1 ? `_part-${pad(index + 1)}-of-${pad(parts.length)}` : "";
      return {
        filename: uniqueFilename(`${sanitizeName(title)}_${stamp}${suffix}`, writer.extension, taken),
        mimeType: writer.mimeType,
        content: writer.header(title) + part.fragments.join("") + writer.footer,
        itemCount: part.items.length,
      };
    });
  });
}

export function gpxAreaNotice(items: readonly MyMapItem[]): string | null {
  const areas = items.filter((item) => !item.deletion && item.geometry.type === "Polygon").length;
  if (areas === 0) return null;
  const subject = areas === 1 ? "1 area is" : `${areas} areas are`;
  const result = areas === 1 ? "a closed track" : "closed tracks";
  return `GPX has no areas, so ${subject} exported as ${result}. `
    + "To keep area shapes, export KML and import it through OnX Web instead.";
}
