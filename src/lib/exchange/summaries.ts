import type { MyGeometry } from "@/lib/myDataModel";
import type { RestoreSummary } from "./archive";
import type { ImportWarnings } from "./importFile";

function plural(count: number, singular: string): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : `${singular}s`}`;
}

function verb(count: number): string {
  return count === 1 ? "was" : "were";
}

export function describeWarnings(warnings: ImportWarnings): string[] {
  const lines: [number, string][] = [
    [warnings.holesRemoved, `${plural(warnings.holesRemoved, "area hole")} removed.`],
    [
      warnings.multiPartSplit,
      `${plural(warnings.multiPartSplit, "multi-part shape")} split into separate items.`,
    ],
    [
      warnings.simplified,
      `${plural(warnings.simplified, "item")} simplified to fit 20,000 points.`,
    ],
    [
      warnings.notesTruncated,
      `${plural(warnings.notesTruncated, "note")} shortened to 2,000 characters.`,
    ],
    [
      warnings.unsupportedSkipped,
      `${plural(warnings.unsupportedSkipped, "unsupported item")} skipped ` +
        "(overlays, links, models, photos, or extended tracks).",
    ],
    [
      warnings.foldersFlattened,
      `${plural(warnings.foldersFlattened, "source folder")} flattened into this folder.`,
    ],
  ];
  return lines.filter(([count]) => count > 0).map(([, line]) => line);
}

export function countsByType(geometries: readonly MyGeometry[]) {
  return {
    pins: geometries.filter((geometry) => geometry.type === "Point").length,
    lines: geometries.filter((geometry) => geometry.type === "LineString").length,
    areas: geometries.filter((geometry) => geometry.type === "Polygon").length,
  };
}

export function describeRestore(summary: RestoreSummary): string[] {
  const lines: [number | boolean, string][] = [
    [summary.itemsRestored, `${plural(summary.itemsRestored, "item")} restored.`],
    [summary.trashRestored, `${plural(summary.trashRestored, "item")} returned to Trash.`],
    [
      summary.alreadyPresent,
      summary.alreadyPresent === 1
        ? "1 item was already here and was left unchanged."
        : `${plural(summary.alreadyPresent, "item")} were already here and were left unchanged.`,
    ],
    [
      summary.expiredSkipped,
      `${plural(summary.expiredSkipped, "expired Trash item")} `
        + `${verb(summary.expiredSkipped)} skipped.`,
    ],
    [summary.foldersCreated, `${plural(summary.foldersCreated, "folder")} created.`],
    [summary.settingsApplied, "Your default settings were restored."],
  ];
  const shown = lines.filter(([count]) => Boolean(count)).map(([, line]) => line);
  return shown.length > 0 ? shown : ["Nothing was missing, so nothing changed."];
}
