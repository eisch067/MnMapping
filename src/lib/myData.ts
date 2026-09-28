import type { RestorePlan } from "./exchange/archive";
import { isPersonalMode } from "../config/appMode";
import { mergeRemoteChange } from "./syncMerge";
import type { RecordKind, RemoteChange, SyncRecord, SyncState, SyncStorage } from "./syncClient";
import {
  MY_DATA_SCHEMA_VERSION,
  MY_DATA_SETTINGS_ID,
  createDefaultSettings,
  createFolder,
  createMyDataItem,
  defaultClock,
  defaultIdFactory,
  importFolderName,
  isTrashExpired,
  normalizeFolderName,
  restoreFolderBundle,
  restoreItem as restoreItemRecord,
  reviseRecord,
  requeueRecord,
  trashFolderBundle,
  type Clock,
  type IdFactory,
  type MyDataFolder,
  type MyDataSettings,
  type MyDataSnapshot,
  type MyGeometry,
  type MyMapItem,
  type NewMyDataItem,
} from "./myDataModel";

export * from "./myDataModel";

const databaseName = "mnmapping-local-data";
const databaseVersion = 4;
const itemStoreName = "items";
const folderStoreName = "folders";
const settingsStoreName = "settings";
const syncStoreName = "sync";
const syncStateKey = "state";

interface LegacyMyMapItem {
  id: string;
  name?: string;
  note?: string;
  geometry: MyMapItem["geometry"];
  createdAt?: string;
}

interface OpenDatabaseOptions {
  name?: string;
  indexedDB?: IDBFactory;
  clock?: Clock;
  idFactory?: IdFactory;
  migrateItem?: (item: LegacyMyMapItem, settings: MyDataSettings) => MyMapItem;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

async function incrementConflictCount(metadata: IDBObjectStore): Promise<void> {
  const state = await requestResult(metadata.get(syncStateKey)) as (SyncState & { key: string }) | undefined;
  metadata.put({
    key: syncStateKey,
    cursor: state?.cursor ?? 0,
    resetAt: state?.resetAt ?? null,
    migrationComplete: state?.migrationComplete ?? false,
    conflictCount: (state?.conflictCount ?? 0) + 1,
  });
}

function migrateLegacyItem(
  value: LegacyMyMapItem | MyMapItem,
  settings: MyDataSettings,
  clock: Clock,
  idFactory: IdFactory,
): MyMapItem {
  if ("schemaVersion" in value && value.schemaVersion === MY_DATA_SCHEMA_VERSION) return value;
  return createMyDataItem(
    {
      id: value.id,
      name: value.name,
      note: value.note,
      geometry: value.geometry,
      createdAt: value.createdAt,
    },
    settings,
    clock,
    idFactory,
  );
}

function migrateItems(
  transaction: IDBTransaction,
  settings: MyDataSettings,
  migrate: (item: LegacyMyMapItem, settings: MyDataSettings) => MyMapItem,
) {
  const request = transaction.objectStore(itemStoreName).openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    try {
      cursor.update(migrate(cursor.value as LegacyMyMapItem, settings));
      cursor.continue();
    } catch {
      transaction.abort();
    }
  };
  request.onerror = () => transaction.abort();
}

export function openMyDataDatabase(options: OpenDatabaseOptions = {}): Promise<IDBDatabase> {
  const factory = options.indexedDB ?? indexedDB;
  const clock = options.clock ?? defaultClock;
  const idFactory = options.idFactory ?? defaultIdFactory;
  return new Promise((resolve, reject) => {
    const request = factory.open(options.name ?? databaseName, databaseVersion);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      const transaction = request.transaction;
      if (!transaction) return;
      if (!database.objectStoreNames.contains(itemStoreName)) {
        database.createObjectStore(itemStoreName, { keyPath: "id" });
      }
      if (event.oldVersion < 2) {
        if (!database.objectStoreNames.contains(folderStoreName)) {
          database.createObjectStore(folderStoreName, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(settingsStoreName)) {
          database.createObjectStore(settingsStoreName, { keyPath: "id" });
        }
        const settings = createDefaultSettings(clock, idFactory);
        transaction.objectStore(settingsStoreName).put(settings);
        const migrate = options.migrateItem
          ?? ((item: LegacyMyMapItem) => migrateLegacyItem(item, settings, clock, idFactory));
        migrateItems(transaction, settings, migrate);
      }
      if (event.oldVersion < 3 && !database.objectStoreNames.contains(syncStoreName)) {
        database.createObjectStore(syncStoreName, { keyPath: "key" });
      }
      if (event.oldVersion < 4) {
        if (!database.objectStoreNames.contains(syncStoreName)) {
          database.createObjectStore(syncStoreName, { keyPath: "key" });
        }
        transaction.objectStore(syncStoreName).put({
          key: syncStateKey,
          cursor: 0,
          resetAt: null,
          migrationComplete: false,
        } satisfies SyncState & { key: string });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open My Data."));
    request.onblocked = () => reject(new Error("My Data upgrade is blocked by another tab."));
  });
}

async function readSnapshot(database: IDBDatabase): Promise<MyDataSnapshot> {
  const transaction = database.transaction([itemStoreName, folderStoreName, settingsStoreName]);
  const itemsRequest = transaction.objectStore(itemStoreName).getAll();
  const foldersRequest = transaction.objectStore(folderStoreName).getAll();
  const settingsRequest = transaction.objectStore(settingsStoreName).get(MY_DATA_SETTINGS_ID);
  const [items, folders, settings] = await Promise.all([
    requestResult(itemsRequest),
    requestResult(foldersRequest),
    requestResult(settingsRequest),
  ]);
  return {
    items: items as MyMapItem[],
    folders: folders as MyDataFolder[],
    settings: settings as MyDataSettings,
  };
}

export class MyDataStore implements SyncStorage {
  constructor(
    private readonly database: IDBDatabase,
    private readonly clock: Clock = defaultClock,
    private readonly idFactory: IdFactory = defaultIdFactory,
  ) {}

  static async open(options: OpenDatabaseOptions = {}): Promise<MyDataStore> {
    const database = await openMyDataDatabase(options);
    return new MyDataStore(database, options.clock, options.idFactory);
  }

  async load(): Promise<MyDataSnapshot> {
    await this.purgeExpired();
    return readSnapshot(this.database);
  }

  async addItem(input: NewMyDataItem): Promise<MyMapItem> {
    const { settings } = await readSnapshot(this.database);
    const item = createMyDataItem(input, settings, this.clock, this.idFactory);
    await this.put(itemStoreName, item);
    return item;
  }

  async createFolder(name: string): Promise<MyDataFolder> {
    const { folders } = await readSnapshot(this.database);
    const folder = createFolder(name, folders, this.clock, this.idFactory);
    await this.put(folderStoreName, folder);
    return folder;
  }

  async moveItem(itemId: string, folderId: string | null): Promise<void> {
    const snapshot = await readSnapshot(this.database);
    const item = snapshot.items.find((value) => value.id === itemId && !value.deletion);
    const folderExists = folderId === null
      || snapshot.folders.some((folder) => folder.id === folderId && !folder.deletion);
    if (!item || !folderExists) throw new Error("The item or destination folder no longer exists.");
    await this.put(itemStoreName, reviseRecord(item, { folderId }, "upsert", this.clock, this.idFactory));
  }

  async updateItemGeometry(
    itemId: string,
    geometry: MyGeometry,
    primaryDimension?: MyMapItem["primaryDimension"],
  ): Promise<void> {
    const { items } = await readSnapshot(this.database);
    const item = items.find((value) => value.id === itemId && !value.deletion);
    if (!item) throw new Error("The item no longer exists.");
    const changes = primaryDimension === undefined ? { geometry } : { geometry, primaryDimension };
    await this.put(itemStoreName, reviseRecord(item, changes, "upsert", this.clock, this.idFactory));
  }

  async trashItem(itemId: string): Promise<void> {
    const { items } = await readSnapshot(this.database);
    const item = items.find((value) => value.id === itemId && !value.deletion);
    if (!item) return;
    const deletedAt = this.clock().toISOString();
    await this.put(
      itemStoreName,
      reviseRecord(item, { deletion: { deletedAt } }, "delete", () => new Date(deletedAt), this.idFactory),
    );
  }

  async trashFolder(folderId: string): Promise<number> {
    const snapshot = await readSnapshot(this.database);
    const folder = snapshot.folders.find((value) => value.id === folderId && !value.deletion);
    if (!folder) return 0;
    const bundle = trashFolderBundle(folder, snapshot.items, this.clock, this.idFactory);
    const transaction = this.database.transaction([itemStoreName, folderStoreName], "readwrite");
    transaction.objectStore(folderStoreName).put(bundle.folder);
    for (const item of bundle.items) transaction.objectStore(itemStoreName).put(item);
    await transactionDone(transaction);
    return bundle.items.length;
  }

  async restoreFolder(folderId: string): Promise<void> {
    const snapshot = await readSnapshot(this.database);
    const folder = snapshot.folders.find((value) => value.id === folderId && value.deletion);
    if (!folder) return;
    const bundle = restoreFolderBundle(folder, snapshot.items, snapshot.folders, this.clock, this.idFactory);
    const transaction = this.database.transaction([itemStoreName, folderStoreName], "readwrite");
    transaction.objectStore(folderStoreName).put(bundle.folder);
    for (const item of bundle.items) transaction.objectStore(itemStoreName).put(item);
    await transactionDone(transaction);
  }

  async restoreItem(itemId: string): Promise<void> {
    const snapshot = await readSnapshot(this.database);
    const item = snapshot.items.find((value) => value.id === itemId && value.deletion);
    if (!item) return;
    await this.put(itemStoreName, restoreItemRecord(item, snapshot.folders, this.clock, this.idFactory));
  }

  // The folder and its items are written in one transaction, so a failure leaves nothing behind.
  async importItems(
    items: readonly NewMyDataItem[],
    source: { filename: string; format: string },
  ): Promise<{ folder: MyDataFolder; count: number }> {
    if (items.length === 0) throw new Error("There are no items to import.");
    const { folders, settings } = await readSnapshot(this.database);
    const now = this.clock();
    const folderName = importFolderName(source.filename, now, folders);
    const folder = createFolder(folderName, folders, this.clock, this.idFactory);
    const importedAt = now.toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await this.writeAll([itemStoreName, folderStoreName], (transaction) => {
      transaction.objectStore(folderStoreName).put(folder);
      for (const item of items) {
        const record = createMyDataItem(
          { ...item, folderId: folder.id, importProvenance: { ...source, importedAt, timezone } },
          settings,
          this.clock,
          this.idFactory,
        );
        transaction.objectStore(itemStoreName).put(record);
      }
    });
    return { folder, count: items.length };
  }

  async applyRestore(plan: Extract<RestorePlan, { ok: true }>): Promise<void> {
    const markers = await requestResult(
      this.database.transaction(syncStoreName).objectStore(syncStoreName).getAll(),
    ) as Array<{ key: string; record?: SyncRecord | null }>;
    const permanentlyDeleted = new Set(markers.filter((entry) => entry.record === null).map((entry) => entry.key));
    const idMap = new Map<string, string>();
    for (const folder of plan.foldersToAdd) {
      if (permanentlyDeleted.has(`folder:${folder.id}`)) idMap.set(folder.id, this.idFactory());
    }
    for (const item of plan.itemsToAdd) {
      if (permanentlyDeleted.has(`item:${item.id}`)) idMap.set(item.id, this.idFactory());
    }
    await this.writeAll([itemStoreName, folderStoreName, settingsStoreName], (transaction) => {
      for (const folder of plan.foldersToAdd) {
        const id = idMap.get(folder.id);
        transaction.objectStore(folderStoreName).put(id
          ? requeueRecord({ ...folder, id }, this.clock, this.idFactory)
          : folder);
      }
      for (const item of plan.itemsToAdd) {
        const id = idMap.get(item.id);
        const folderId = item.folderId ? idMap.get(item.folderId) ?? item.folderId : null;
        transaction.objectStore(itemStoreName).put(id || folderId !== item.folderId
          ? requeueRecord({ ...item, ...(id ? { id } : {}), folderId }, this.clock, this.idFactory)
          : item);
      }
      if (plan.settingsToApply) transaction.objectStore(settingsStoreName).put(plan.settingsToApply);
    });
  }

  // The local half of delete-all: everything, Trash included, goes and the defaults return.
  async deleteAll(): Promise<void> {
    const settings = createDefaultSettings(this.clock, this.idFactory);
    await this.writeAll([itemStoreName, folderStoreName, settingsStoreName, syncStoreName], (transaction) => {
      transaction.objectStore(itemStoreName).clear();
      transaction.objectStore(folderStoreName).clear();
      transaction.objectStore(settingsStoreName).clear();
      transaction.objectStore(settingsStoreName).put(settings);
      transaction.objectStore(syncStoreName).clear();
      transaction.objectStore(syncStoreName).put({ key: syncStateKey, cursor: 0, resetAt: null,
        migrationComplete: false, conflictCount: 0 });
      transaction.objectStore(syncStoreName).put({ key: "settings:settings", record: settings, serverRevision: null });
    });
  }

  async updateSettings(changes: Partial<MyDataSettings>): Promise<void> {
    const { settings } = await readSnapshot(this.database);
    await this.put(
      settingsStoreName,
      reviseRecord(settings, changes, "upsert", this.clock, this.idFactory),
    );
  }

  async purgeExpired(): Promise<void> {
    const snapshot = await readSnapshot(this.database);
    const metadata = await requestResult(this.database.transaction(syncStoreName).objectStore(syncStoreName).getAll()) as Array<{ key: string }>;
    const synchronized = new Set(metadata.map((entry) => entry.key));
    const canPurge = (kind: RecordKind, id: string, outbox: SyncRecord["outbox"]) => (
      !isPersonalMode || (!synchronized.has(`${kind}:${id}`) && outbox.operation !== "delete")
    );
    const expiredItems = snapshot.items.filter(
      (item) => item.deletion && isTrashExpired(item.deletion.deletedAt, this.clock)
        && canPurge("item", item.id, item.outbox),
    );
    const expiredFolders = snapshot.folders.filter(
      (folder) => folder.deletion && isTrashExpired(folder.deletion.deletedAt, this.clock)
        && canPurge("folder", folder.id, folder.outbox),
    );
    if (!expiredItems.length && !expiredFolders.length) return;
    const transaction = this.database.transaction([itemStoreName, folderStoreName], "readwrite");
    for (const item of expiredItems) transaction.objectStore(itemStoreName).delete(item.id);
    for (const folder of expiredFolders) transaction.objectStore(folderStoreName).delete(folder.id);
    await transactionDone(transaction);
  }

  async getState(): Promise<SyncState> {
    const transaction = this.database.transaction(syncStoreName);
    const stored = await requestResult(transaction.objectStore(syncStoreName).get(syncStateKey));
    return stored
      ? {
          cursor: stored.cursor,
          resetAt: stored.resetAt,
          migrationComplete: stored.migrationComplete,
          ...(typeof stored.conflictCount === "number" ? { conflictCount: stored.conflictCount } : {}),
        }
      : { cursor: 0, resetAt: null, migrationComplete: false };
  }

  async setState(state: SyncState): Promise<void> {
    await this.writeAll([syncStoreName], (transaction) => {
      transaction.objectStore(syncStoreName).put({ key: syncStateKey, ...state });
    });
  }

  async resolveFolderNameConflict(id: string): Promise<void> {
    const { folders } = await readSnapshot(this.database);
    const folder = folders.find((entry) => entry.id === id && !entry.deletion);
    if (!folder) return;
    const activeNames = new Set(folders.filter((entry) => !entry.deletion && entry.id !== id)
      .map((entry) => normalizeFolderName(entry.name)));
    const base = `${folder.name} (conflict copy)`;
    let name = base;
    for (let suffix = 2; activeNames.has(normalizeFolderName(name)); suffix++) name = `${base} ${suffix}`;
    await this.put(folderStoreName, reviseRecord(folder, { name }, "upsert", this.clock, this.idFactory));
  }

  async pending(): Promise<Array<{ kind: RecordKind; record: SyncRecord; expectedRevision: number | null }>> {
    const transaction = this.database.transaction([itemStoreName, folderStoreName, settingsStoreName, syncStoreName]);
    const [items, folders, settings, metadata] = await Promise.all([
      requestResult(transaction.objectStore(itemStoreName).getAll()),
      requestResult(transaction.objectStore(folderStoreName).getAll()),
      requestResult(transaction.objectStore(settingsStoreName).getAll()),
      requestResult(transaction.objectStore(syncStoreName).getAll()),
    ]);
    const baselines = new Map((metadata as Array<{ key: string; record?: SyncRecord; serverRevision?: number | null }>).map((entry) => [entry.key, entry]));
    return ([...items.map((record) => ["item", record] as const), ...folders.map((record) => ["folder", record] as const), ...settings.map((record) => ["settings", record] as const)])
      .filter(([, value]) => Boolean((value as SyncRecord).outbox))
      .filter(([kind, value]) => {
        const record = value as SyncRecord;
        const baseline = baselines.get(`${kind}:${record.id}`)?.record;
        return baseline?.outbox?.mutationId !== record.outbox.mutationId;
      })
      .map(([kind, value]) => {
        const record = value as SyncRecord;
        return { kind, record, expectedRevision: baselines.get(`${kind}:${record.id}`)?.serverRevision ?? null };
      });
  }

  async acknowledge(
    kind: RecordKind,
    id: string,
    mutationId: string,
    revision: number,
    acceptedAt: string,
    sentRecord?: SyncRecord,
  ): Promise<void> {
    const stores: Record<RecordKind, string> = { item: itemStoreName, folder: folderStoreName, settings: settingsStoreName };
    const transaction = this.database.transaction([stores[kind], syncStoreName], "readwrite");
    const done = transactionDone(transaction);
    const records = transaction.objectStore(stores[kind]);
    const current = await requestResult(records.get(id)) as SyncRecord | undefined;
    const baseline = sentRecord ?? current;
    if (baseline) {
      const stamped = { ...baseline, revision, updatedAt: acceptedAt, outbox: { ...baseline.outbox, mutationId } } as SyncRecord;
      if (kind !== "settings" && stamped.deletion) stamped.deletion = { ...stamped.deletion, deletedAt: acceptedAt };
      if (current?.outbox?.mutationId === mutationId) records.put(stamped);
      transaction.objectStore(syncStoreName).put({ key: `${kind}:${id}`, record: stamped, revision, serverRevision: revision });
    }
    await done;
  }

  async receive(changes: readonly RemoteChange[]): Promise<void> {
    for (const change of changes) await this.receiveOne(change);
  }

  private async receiveOne(change: RemoteChange): Promise<void> {
    const stores: Record<RecordKind, string> = { item: itemStoreName, folder: folderStoreName, settings: settingsStoreName };
    const storeName = stores[change.kind];
    const transaction = this.database.transaction([storeName, syncStoreName], "readwrite");
    const done = transactionDone(transaction);
    const records = transaction.objectStore(storeName);
    const metadata = transaction.objectStore(syncStoreName);
    const [local, baselineEntry] = await Promise.all([
      requestResult(records.get(change.id)) as Promise<SyncRecord | undefined>,
      requestResult(metadata.get(`${change.kind}:${change.id}`)) as Promise<{ record?: SyncRecord; revision?: number; serverRevision?: number | null } | undefined>,
    ]);
    const knownRevision = baselineEntry && "serverRevision" in baselineEntry
      ? baselineEntry.serverRevision ?? 0
      : baselineEntry?.revision ?? baselineEntry?.record?.revision ?? 0;
    if (knownRevision >= change.revision) {
      await done;
      return;
    }
    const result = mergeRemoteChange(baselineEntry?.record ?? null, local ?? null, change, this.idFactory);
    if (result.kind === "deleted") {
      records.delete(change.id);
      metadata.put({ key: `${change.kind}:${change.id}`, record: null, revision: change.revision, serverRevision: change.revision });
      if (result.conflictCopy) {
        records.put(result.conflictCopy);
        metadata.put({ key: `${change.kind}:${result.conflictCopy.id}`, record: null, revision: 0, serverRevision: null });
        await incrementConflictCount(metadata);
      }
    } else {
      records.put(result.record);
      if (result.kind === "conflict") records.put(result.conflictCopy);
      metadata.put({ key: `${change.kind}:${change.id}`, record: change.record ?? null, revision: change.revision, serverRevision: change.revision });
      if (result.kind === "conflict") {
        metadata.put({ key: `${change.kind}:${result.conflictCopy.id}`, record: null, revision: 0, serverRevision: null });
        await incrementConflictCount(metadata);
      }
    }
    await done;
  }

  async purge(): Promise<void> {
    const settings = createDefaultSettings(this.clock, this.idFactory);
    await this.writeAll([itemStoreName, folderStoreName, settingsStoreName, syncStoreName], (transaction) => {
      transaction.objectStore(itemStoreName).clear();
      transaction.objectStore(folderStoreName).clear();
      transaction.objectStore(settingsStoreName).clear();
      transaction.objectStore(settingsStoreName).put(settings);
      transaction.objectStore(syncStoreName).clear();
      transaction.objectStore(syncStoreName).put({ key: syncStateKey, cursor: 0, resetAt: null,
        migrationComplete: true, conflictCount: 0 });
      transaction.objectStore(syncStoreName).put({ key: "settings:settings", record: settings, serverRevision: null });
    });
  }

  async completeMigration(): Promise<void> {
    if ((await this.pending()).length) throw new Error("Cannot complete sync migration while changes are pending.");
    const state = await this.getState();
    await this.setState({ ...state, migrationComplete: true });
  }

  close() {
    this.database.close();
  }

  private async writeAll(storeNames: string[], apply: (transaction: IDBTransaction) => void) {
    const transaction = this.database.transaction(storeNames, "readwrite");
    const done = transactionDone(transaction);
    try {
      apply(transaction);
    } catch (error) {
      transaction.abort();
      // The abort rejects `done`; the caller needs the original error, not the abort.
      await done.catch(() => undefined);
      throw error;
    }
    await done;
  }

  private async put(storeName: string, value: MyMapItem | MyDataFolder | MyDataSettings) {
    const transaction = this.database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    await transactionDone(transaction);
  }
}

let defaultStore: Promise<MyDataStore> | undefined;
export function getMyDataStore(): Promise<MyDataStore> {
  defaultStore ??= MyDataStore.open();
  return defaultStore;
}

export async function loadMyData(): Promise<MyMapItem[]> {
  const snapshot = await (await getMyDataStore()).load();
  return snapshot.items.filter((item) => !item.deletion);
}

export async function saveMyItem(item: NewMyDataItem): Promise<void> {
  await (await getMyDataStore()).addItem(item);
}

export async function deleteMyItem(id: string): Promise<void> {
  await (await getMyDataStore()).trashItem(id);
}

export function toGeoJson(items: readonly MyMapItem[]) {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      id: item.id,
      properties: { name: item.name, note: item.note },
      geometry: item.geometry,
    })),
  };
}
