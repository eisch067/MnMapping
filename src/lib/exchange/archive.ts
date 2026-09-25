import {
  MY_DATA_SCHEMA_VERSION,
  MY_DATA_SETTINGS_ID,
  defaultClock,
  defaultIdFactory,
  isTrashExpired,
  normalizeFolderName,
  requeueRecord,
  reviseRecord,
  type Clock,
  type IdFactory,
  type MyDataFolder,
  type MyDataSettings,
  type MyDataSnapshot,
  type MyMapItem,
} from "@/lib/myDataModel";
import { localStamp, type ExportFile } from "./exportFiles";

export const ARCHIVE_FORMAT = "mnmapping-archive";

export interface RestoreSummary {
  itemsRestored: number;
  trashRestored: number;
  alreadyPresent: number;
  expiredSkipped: number;
  foldersCreated: number;
  settingsApplied: boolean;
}

export type RestorePlan =
  | {
    ok: true;
    itemsToAdd: MyMapItem[];
    foldersToAdd: MyDataFolder[];
    settingsToApply: MyDataSettings | null;
    summary: RestoreSummary;
  }
  | { ok: false; message: string };

const notAnArchive = "This file is not a My Data archive. Choose a file exported with Archive My Data.";
const damaged = "This archive is damaged, so nothing was restored.";
const geometryTypes = ["Point", "LineString", "Polygon"];

export function buildArchive(snapshot: MyDataSnapshot, exportedAt: Date): ExportFile {
  const archive = {
    format: ARCHIVE_FORMAT,
    schemaVersion: MY_DATA_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    items: snapshot.items,
    folders: snapshot.folders,
    settings: snapshot.settings,
  };
  return {
    filename: `MnMapping-archive_${localStamp(exportedAt)}.json`,
    mimeType: "application/json",
    content: JSON.stringify(archive),
    itemCount: snapshot.items.length,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArchivedItem(value: unknown): value is MyMapItem {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return false;
  const { geometry, folderId, appearance, outbox } = value;
  return isRecord(geometry) && geometryTypes.includes(geometry.type as string)
    && Array.isArray(geometry.coordinates)
    && (folderId === null || typeof folderId === "string")
    && isRecord(appearance) && isRecord(outbox);
}

function isArchivedFolder(value: unknown): value is MyDataFolder {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string"
    && isRecord(value.outbox);
}

interface ParsedArchive {
  items: MyMapItem[];
  folders: MyDataFolder[];
  settings: MyDataSettings;
}

function parseArchive(text: string): ParsedArchive | { message: string } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { message: notAnArchive };
  }
  if (!isRecord(value) || value.format !== ARCHIVE_FORMAT || typeof value.schemaVersion !== "number") {
    return { message: notAnArchive };
  }
  if (value.schemaVersion > MY_DATA_SCHEMA_VERSION) {
    return {
      message: "This archive was made by a newer version of MnMapping. "
        + "Update the app, then restore it.",
    };
  }
  if (value.schemaVersion !== MY_DATA_SCHEMA_VERSION) return { message: notAnArchive };
  const { items, folders, settings } = value;
  const isSettings = isRecord(settings) && settings.id === MY_DATA_SETTINGS_ID;
  if (!Array.isArray(items) || !Array.isArray(folders) || !isSettings) return { message: damaged };
  if (!items.every(isArchivedItem) || !folders.every(isArchivedFolder)) return { message: damaged };
  return { items, folders, settings: settings as unknown as MyDataSettings };
}

interface RestoreContext {
  current: MyDataSnapshot;
  clock: Clock;
  idFactory: IdFactory;
  // Archived folder id -> the folder its items go into here.
  destinations: Map<string, string>;
  foldersToAdd: MyDataFolder[];
}

function activeFolderNamed(name: string, context: RestoreContext): MyDataFolder | undefined {
  const wanted = normalizeFolderName(name);
  return [...context.current.folders, ...context.foldersToAdd].find(
    (folder) => !folder.deletion && normalizeFolderName(folder.name) === wanted,
  );
}

function addFolder(folder: MyDataFolder, context: RestoreContext) {
  const idIsTaken = context.current.folders.some((existing) => existing.id === folder.id)
    || context.foldersToAdd.some((existing) => existing.id === folder.id);
  const id = idIsTaken ? context.idFactory() : folder.id;
  context.foldersToAdd.push(requeueRecord({ ...folder, id }, context.clock, context.idFactory));
  context.destinations.set(folder.id, id);
}

function planFolder(folder: MyDataFolder, context: RestoreContext) {
  const sameId = context.current.folders.find((existing) => existing.id === folder.id);
  if (folder.deletion) {
    if (isTrashExpired(folder.deletion.deletedAt, context.clock)) return;
    if (sameId) context.destinations.set(folder.id, sameId.id);
    else addFolder(folder, context);
    return;
  }
  const named = activeFolderNamed(folder.name, context);
  if (named) context.destinations.set(folder.id, named.id);
  else if (sameId && !sameId.deletion) context.destinations.set(folder.id, sameId.id);
  else addFolder(folder, context);
}

function shouldApplySettings(current: MyDataSettings): boolean {
  // A record that was never revised is still the defaults created with this My Data.
  return current.revision === 1;
}

// Restore only adds: nothing present is changed, and nothing is removed.
export function planRestore(
  text: string,
  current: MyDataSnapshot,
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): RestorePlan {
  const archive = parseArchive(text);
  if ("message" in archive) return { ok: false, message: archive.message };
  const context: RestoreContext = {
    current,
    clock,
    idFactory,
    destinations: new Map(),
    foldersToAdd: [],
  };
  archive.folders.forEach((folder) => planFolder(folder, context));
  const summary: RestoreSummary = {
    itemsRestored: 0,
    trashRestored: 0,
    alreadyPresent: 0,
    expiredSkipped: 0,
    foldersCreated: context.foldersToAdd.length,
    settingsApplied: false,
  };
  const knownIds = new Set(current.items.map((item) => item.id));
  const itemsToAdd: MyMapItem[] = [];
  for (const item of archive.items) {
    if (knownIds.has(item.id)) {
      summary.alreadyPresent++;
    } else if (item.deletion && isTrashExpired(item.deletion.deletedAt, clock)) {
      summary.expiredSkipped++;
    } else {
      knownIds.add(item.id);
      const folderId = item.folderId === null ? null : (context.destinations.get(item.folderId) ?? null);
      itemsToAdd.push(requeueRecord({ ...item, folderId }, clock, idFactory));
      if (item.deletion) summary.trashRestored++;
      else summary.itemsRestored++;
    }
  }
  const settingsToApply = shouldApplySettings(current.settings)
    ? reviseRecord(current.settings, {
      point: archive.settings.point,
      line: archive.settings.line,
      polygon: archive.settings.polygon,
    }, "upsert", clock, idFactory)
    : null;
  summary.settingsApplied = settingsToApply !== null;
  return { ok: true, itemsToAdd, foldersToAdd: context.foldersToAdd, settingsToApply, summary };
}
