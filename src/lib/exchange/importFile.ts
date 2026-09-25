import { generatedItemName, type MyGeometry } from "@/lib/myDataModel";
import { cleanNote } from "./noteText";
import { normalizePart, type NormalizeTally } from "./normalize";
import {
  ImportRefusal,
  readGeoJson,
  readGpx,
  readKml,
  type RawFeature,
  type RawRead,
} from "./readers";

export { MAX_ITEM_VERTICES } from "./normalize";
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ITEMS = 5_000;

export interface ImportFileInput {
  name: string;
  size: number;
  text: string;
}

export interface ImportedItem {
  name: string;
  note: string | undefined;
  geometry: MyGeometry;
}

export interface RejectedItem {
  name: string;
  reason: string;
}

export interface ImportWarnings {
  holesRemoved: number;
  multiPartSplit: number;
  simplified: number;
  notesTruncated: number;
  unsupportedSkipped: number;
  foldersFlattened: number;
}

export interface ImportReport {
  warnings: ImportWarnings;
  rejected: RejectedItem[];
}

export type ImportOutcome =
  { ok: true; items: ImportedItem[]; report: ImportReport } | { ok: false; message: string };

const readers: Record<string, (text: string) => RawRead> = {
  gpx: readGpx,
  kml: readKml,
  geojson: readGeoJson,
  json: readGeoJson,
};

export function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function readerFor(filename: string): (text: string) => RawRead {
  const extension = fileExtension(filename);
  if (extension === "kmz") {
    throw new ImportRefusal("KMZ files can't be imported. Export the file as KML instead.");
  }
  const reader = readers[extension];
  if (!reader) throw new ImportRefusal("Only GPX, KML, or GeoJSON files can be imported.");
  return reader;
}

function partName(base: string, index: number): string {
  return index === 0 ? base : `${base} (${index + 1})`;
}

function importFeature(
  feature: RawFeature,
  report: ImportReport,
  tally: NormalizeTally,
): ImportedItem[] {
  const note = cleanNote(feature.note);
  if (note.truncated) report.warnings.notesTruncated++;
  const results = feature.parts.map((part) => normalizePart(part, tally));
  const firstValid = results.find((result) => "geometry" in result);
  const generated =
    firstValid && "geometry" in firstValid ? generatedItemName(firstValid.geometry) : "Untitled";
  const base = feature.name?.trim() || generated;
  if (feature.parts.length > 1) report.warnings.multiPartSplit++;
  if (results.length === 0) {
    report.rejected.push({ name: base, reason: "It has no supported geometry." });
  }
  const items: ImportedItem[] = [];
  results.forEach((result, index) => {
    const name = partName(base, index);
    if ("reason" in result) report.rejected.push({ name, reason: result.reason });
    else items.push({ name, note: note.text, geometry: result.geometry });
  });
  return items;
}

function readFile(input: ImportFileInput): RawRead {
  const read = readerFor(input.name)(input.text);
  const itemCount = read.features.reduce(
    (sum, feature) => sum + Math.max(feature.parts.length, 1),
    0,
  );
  if (itemCount > MAX_IMPORT_ITEMS) {
    throw new ImportRefusal(
      `This file has ${itemCount.toLocaleString("en-US")} items; the limit is 5,000. ` +
        "Split it into smaller files and import each one.",
    );
  }
  return read;
}

function emptyReport(read: RawRead): ImportReport {
  return {
    warnings: {
      holesRemoved: 0,
      multiPartSplit: 0,
      simplified: 0,
      notesTruncated: 0,
      unsupportedSkipped: read.unsupported,
      foldersFlattened: read.foldersFlattened,
    },
    rejected: [],
  };
}

export function parseImport(input: ImportFileInput): ImportOutcome {
  try {
    if (input.size > MAX_IMPORT_BYTES) {
      throw new ImportRefusal(
        "This file is larger than 10 MB. Split it into smaller files and import each one.",
      );
    }
    const read = readFile(input);
    const tally: NormalizeTally = { holesRemoved: 0, simplified: 0 };
    const report = emptyReport(read);
    const items = read.features.flatMap((feature) => importFeature(feature, report, tally));
    report.warnings.holesRemoved = tally.holesRemoved;
    report.warnings.simplified = tally.simplified;
    return { ok: true, items, report };
  } catch (error) {
    if (error instanceof ImportRefusal) return { ok: false, message: error.message };
    throw error;
  }
}
