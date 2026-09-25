import type { RestorePlan } from "./exchange/archive";
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
  restoreFolderBundle,
  restoreItem as restoreItemRecord,
  reviseRecord,
  trashFolderBundle,
  type Clock,
  type IdFactory,
  type MyDataFolder,
  type MyDataSettings,
  type MyDataSnapshot,
  type MyMapItem,
  type NewMyDataItem,
} from "./myDataModel";

export * from "./myDataModel";

const databaseName = "mnmapping-local-data";
const databaseVersion = 2;
const itemStoreName = "items";
const folderStoreName = "folders";
const settingsStoreName = "settings";

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
      if (event.oldVersion >= databaseVersion) return;
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

export class MyDataStore {
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
    await this.writeAll([itemStoreName, folderStoreName, settingsStoreName], (transaction) => {
      for (const folder of plan.foldersToAdd) transaction.objectStore(folderStoreName).put(folder);
      for (const item of plan.itemsToAdd) transaction.objectStore(itemStoreName).put(item);
      if (plan.settingsToApply) {
        transaction.objectStore(settingsStoreName).put(plan.settingsToApply);
      }
    });
  }

  // The local half of delete-all: everything, Trash included, goes and the defaults return.
  async deleteAll(): Promise<void> {
    const settings = createDefaultSettings(this.clock, this.idFactory);
    await this.writeAll([itemStoreName, folderStoreName, settingsStoreName], (transaction) => {
      transaction.objectStore(itemStoreName).clear();
      transaction.objectStore(folderStoreName).clear();
      transaction.objectStore(settingsStoreName).clear();
      transaction.objectStore(settingsStoreName).put(settings);
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
    const expiredItems = snapshot.items.filter(
      (item) => item.deletion && isTrashExpired(item.deletion.deletedAt, this.clock),
    );
    const expiredFolders = snapshot.folders.filter(
      (folder) => folder.deletion && isTrashExpired(folder.deletion.deletedAt, this.clock),
    );
    if (!expiredItems.length && !expiredFolders.length) return;
    const transaction = this.database.transaction([itemStoreName, folderStoreName], "readwrite");
    for (const item of expiredItems) transaction.objectStore(itemStoreName).delete(item.id);
    for (const folder of expiredFolders) transaction.objectStore(folderStoreName).delete(folder.id);
    await transactionDone(transaction);
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

export function roughLengthMeters(coordinates: [number, number][]): number {
  return coordinates.slice(1).reduce((sum, point, index) => sum + haversine(coordinates[index], point), 0);
}

export function roughAreaSquareMeters(ring: [number, number][]): number {
  if (ring.length < 3) return 0;
  const latitude = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const scaleX = 111_320 * Math.cos(latitude * Math.PI / 180);
  const scaleY = 110_540;
  return Math.abs(ring.reduce((sum, point, index) => {
    const next = ring[(index + 1) % ring.length];
    return sum + point[0] * scaleX * next[1] * scaleY - next[0] * scaleX * point[1] * scaleY;
  }, 0) / 2);
}

function haversine(a: [number, number], b: [number, number]): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
