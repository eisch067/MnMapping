export const MY_DATA_SCHEMA_VERSION = 2 as const;
export const UNFILED_VIEW_ID = "unfiled" as const;
export const TRASH_VIEW_ID = "trash" as const;
export const MY_DATA_SETTINGS_ID = "settings" as const;
export const TRASH_RETENTION_DAYS = 30;
export const MAX_NOTE_LENGTH = 2000;

export type Clock = () => Date;
export type IdFactory = () => string;
export type DistanceKind = "horizontal" | "direct" | "ground";
export type DistanceUnit = "miles" | "feet" | "kilometers" | "meters";
export type PolygonDimensionKind = "area" | "perimeter" | "both";
export type AreaUnit = "acres" | "square-feet" | "square-miles" | "hectares";

export type MyGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

export type SavedAppearance =
  | { kind: "point"; symbolId: string; color: string }
  | { kind: "line"; color: string; width: number }
  | { kind: "polygon"; outlineColor: string; fillColor: string; opacity: number };

export type PrimaryDimension =
  | { kind: DistanceKind; unit: DistanceUnit }
  | { kind: PolygonDimensionKind; areaUnit: AreaUnit; perimeterUnit: DistanceUnit }
  | null;

export interface ImportProvenance {
  filename: string;
  format: string;
  importedAt: string;
  timezone: string;
}

export interface DeletionMetadata {
  deletedAt: string;
  bundleId?: string;
}

export interface OutboxMutation {
  mutationId: string;
  operation: "upsert" | "delete";
  queuedAt: string;
}

interface SynchronizedRecord {
  schemaVersion: typeof MY_DATA_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  revision: number;
  outbox: OutboxMutation;
  deletion?: DeletionMetadata;
}

export interface MyMapItem extends SynchronizedRecord {
  id: string;
  name: string;
  note?: string;
  folderId: string | null;
  geometry: MyGeometry;
  appearance: SavedAppearance;
  primaryDimension: PrimaryDimension;
  importProvenance?: ImportProvenance;
}

export interface MyDataFolder extends SynchronizedRecord {
  id: string;
  name: string;
}

export interface MyDataSettings extends SynchronizedRecord {
  id: typeof MY_DATA_SETTINGS_ID;
  point: { symbolId: string; color: string };
  line: { color: string; width: number; dimensionKind: DistanceKind; unit: DistanceUnit };
  polygon: {
    outlineColor: string;
    fillColor: string;
    opacity: number;
    dimensionKind: PolygonDimensionKind;
    areaUnit: AreaUnit;
    perimeterUnit: DistanceUnit;
  };
}

export interface MyDataSnapshot {
  items: MyMapItem[];
  folders: MyDataFolder[];
  settings: MyDataSettings;
}

export interface NewMyDataItem {
  id?: string;
  name?: string;
  note?: string;
  folderId?: string | null;
  geometry: MyGeometry;
  appearance?: SavedAppearance;
  primaryDimension?: PrimaryDimension;
  importProvenance?: ImportProvenance;
  createdAt?: string;
}

export const defaultClock: Clock = () => new Date();
export const defaultIdFactory: IdFactory = () => crypto.randomUUID();

function outbox(operation: OutboxMutation["operation"], now: string, idFactory: IdFactory) {
  return { mutationId: idFactory(), operation, queuedAt: now };
}

export function normalizeFolderName(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

export function validateFolderName(name: string, folders: readonly MyDataFolder[], excludeId?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder names cannot be blank.");
  const normalized = normalizeFolderName(trimmed);
  const duplicate = folders.some(
    (folder) => folder.id !== excludeId && !folder.deletion && normalizeFolderName(folder.name) === normalized,
  );
  if (duplicate) throw new Error("Folder names must be unique.");
  return trimmed;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

// The source filename and the user's local import time keep separate imports distinguishable.
export function importFolderName(filename: string, importedAt: Date, folders: readonly MyDataFolder[]): string {
  const date = `${importedAt.getFullYear()}-${twoDigits(importedAt.getMonth() + 1)}-${twoDigits(importedAt.getDate())}`;
  const time = `${twoDigits(importedAt.getHours())}:${twoDigits(importedAt.getMinutes())}`;
  const base = `${filename.trim() || "Import"} ${date} ${time}`;
  const taken = new Set(folders.filter((folder) => !folder.deletion).map((folder) => normalizeFolderName(folder.name)));
  let candidate = base;
  for (let suffix = 2; taken.has(normalizeFolderName(candidate)); suffix++) candidate = `${base} (${suffix})`;
  return candidate;
}

export function generatedItemName(geometry: MyGeometry): string {
  if (geometry.type === "Point") return "Pin";
  if (geometry.type === "LineString") return "Line";
  return "Polygon";
}

export function createDefaultSettings(
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): MyDataSettings {
  const now = clock().toISOString();
  return {
    id: MY_DATA_SETTINGS_ID,
    schemaVersion: MY_DATA_SCHEMA_VERSION,
    point: { symbolId: "pin", color: "#9974ff" },
    line: { color: "#9974ff", width: 3, dimensionKind: "horizontal", unit: "miles" },
    polygon: {
      outlineColor: "#9974ff",
      fillColor: "#9974ff",
      opacity: 0.25,
      dimensionKind: "area",
      areaUnit: "acres",
      perimeterUnit: "miles",
    },
    createdAt: now,
    updatedAt: now,
    revision: 1,
    outbox: outbox("upsert", now, idFactory),
  };
}

function defaultsForGeometry(geometry: MyGeometry, settings: MyDataSettings) {
  if (geometry.type === "Point") {
    return {
      appearance: { kind: "point", ...settings.point } as SavedAppearance,
      primaryDimension: null,
    };
  }
  if (geometry.type === "LineString") {
    const { color, width, dimensionKind: kind, unit } = settings.line;
    return { appearance: { kind: "line", color, width } as SavedAppearance, primaryDimension: { kind, unit } };
  }
  const { outlineColor, fillColor, opacity, dimensionKind: kind, areaUnit, perimeterUnit } = settings.polygon;
  return {
    appearance: { kind: "polygon", outlineColor, fillColor, opacity } as SavedAppearance,
    primaryDimension: { kind, areaUnit, perimeterUnit },
  };
}

export function createMyDataItem(
  input: NewMyDataItem,
  settings: MyDataSettings,
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): MyMapItem {
  const now = input.createdAt ?? clock().toISOString();
  const defaults = defaultsForGeometry(input.geometry, settings);
  return {
    id: input.id ?? idFactory(),
    schemaVersion: MY_DATA_SCHEMA_VERSION,
    name: input.name?.trim() || generatedItemName(input.geometry),
    note: input.note?.slice(0, MAX_NOTE_LENGTH),
    folderId: input.folderId ?? null,
    geometry: input.geometry,
    appearance: input.appearance ?? defaults.appearance,
    primaryDimension: input.primaryDimension === undefined ? defaults.primaryDimension : input.primaryDimension,
    importProvenance: input.importProvenance,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    outbox: outbox("upsert", now, idFactory),
  };
}

export function createFolder(
  name: string,
  folders: readonly MyDataFolder[],
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): MyDataFolder {
  const now = clock().toISOString();
  return {
    id: idFactory(),
    schemaVersion: MY_DATA_SCHEMA_VERSION,
    name: validateFolderName(name, folders),
    createdAt: now,
    updatedAt: now,
    revision: 1,
    outbox: outbox("upsert", now, idFactory),
  };
}

function updateRecord<T extends SynchronizedRecord>(
  record: T,
  changes: Partial<T>,
  operation: OutboxMutation["operation"],
  clock: Clock,
  idFactory: IdFactory,
): T {
  const now = clock().toISOString();
  return {
    ...record,
    ...changes,
    updatedAt: now,
    revision: record.revision + 1,
    outbox: outbox(operation, now, idFactory),
  };
}

export function trashFolderBundle(
  folder: MyDataFolder,
  items: readonly MyMapItem[],
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
) {
  const bundleId = idFactory();
  const deletedAt = clock().toISOString();
  const deletion = { deletedAt, bundleId };
  return {
    folder: updateRecord(folder, { deletion }, "delete", () => new Date(deletedAt), idFactory),
    items: items
      .filter((item) => item.folderId === folder.id && !item.deletion)
      .map((item) => updateRecord(item, { deletion }, "delete", () => new Date(deletedAt), idFactory)),
  };
}

function restoredName(folder: MyDataFolder, folders: readonly MyDataFolder[]): string {
  if (!folders.some((value) => !value.deletion && normalizeFolderName(value.name) === normalizeFolderName(folder.name))) {
    return folder.name;
  }
  const base = `${folder.name} (restored)`;
  let candidate = base;
  let suffix = 2;
  while (folders.some((value) => !value.deletion && normalizeFolderName(value.name) === normalizeFolderName(candidate))) {
    candidate = `${base} ${suffix++}`;
  }
  return candidate;
}

export function restoreFolderBundle(
  folder: MyDataFolder,
  items: readonly MyMapItem[],
  folders: readonly MyDataFolder[],
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
) {
  const bundleId = folder.deletion?.bundleId;
  const restoredFolder = updateRecord(
    folder,
    { name: restoredName(folder, folders), deletion: undefined },
    "upsert",
    clock,
    idFactory,
  );
  const restoredItems = items
    .filter((item) => bundleId && item.deletion?.bundleId === bundleId)
    .map((item) => updateRecord(item, { deletion: undefined }, "upsert", clock, idFactory));
  return { folder: restoredFolder, items: restoredItems };
}

export function restoreItem(
  item: MyMapItem,
  folders: readonly MyDataFolder[],
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): MyMapItem {
  const folderIsActive = item.folderId
    ? folders.some((folder) => folder.id === item.folderId && !folder.deletion)
    : true;
  return updateRecord(
    item,
    { folderId: folderIsActive ? item.folderId : null, deletion: undefined },
    "upsert",
    clock,
    idFactory,
  );
}

export function isTrashExpired(deletedAt: string, clock: Clock = defaultClock): boolean {
  const elapsed = clock().getTime() - new Date(deletedAt).getTime();
  return elapsed >= TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

export function reviseRecord<T extends SynchronizedRecord>(
  record: T,
  changes: Partial<T>,
  operation: OutboxMutation["operation"] = "upsert",
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): T {
  return updateRecord(record, changes, operation, clock, idFactory);
}

// A record recreated on this device is queued to synchronize again without changing its content.
export function requeueRecord<T extends SynchronizedRecord>(
  record: T,
  clock: Clock = defaultClock,
  idFactory: IdFactory = defaultIdFactory,
): T {
  const operation = record.deletion ? "delete" : "upsert";
  return { ...record, outbox: outbox(operation, clock().toISOString(), idFactory) };
}
