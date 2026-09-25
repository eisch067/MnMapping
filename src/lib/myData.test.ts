import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { buildArchive, planRestore } from "./exchange/archive";
import { MyDataStore, openMyDataDatabase } from "./myData";

const legacyItem = {
  id: "legacy-id",
  name: "Old pin",
  geometry: { type: "Point" as const, coordinates: [-95, 47] as [number, number] },
  createdAt: "2025-01-01T00:00:00.000Z",
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function createV1(factory: IDBFactory, name: string) {
  const request = factory.open(name, 1);
  request.onupgradeneeded = () => request.result.createObjectStore("items", { keyPath: "id" });
  const database = await requestResult(request);
  const transaction = database.transaction("items", "readwrite");
  transaction.objectStore("items").put(legacyItem);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

describe("IndexedDB v2 migration", () => {
  it("preserves ids, places items in Unfiled, and is idempotent", async () => {
    const factory = new IDBFactory();
    await createV1(factory, "migration-success");
    const first = await MyDataStore.open({ name: "migration-success", indexedDB: factory });
    const migrated = await first.load();
    expect(migrated.items).toHaveLength(1);
    expect(migrated.items[0]).toMatchObject({ id: "legacy-id", folderId: null, schemaVersion: 2 });
    first.close();

    const second = await MyDataStore.open({ name: "migration-success", indexedDB: factory });
    expect((await second.load()).items.map((item) => item.id)).toEqual(["legacy-id"]);
    second.close();
  });

  it("leaves v1 data intact when migration fails", async () => {
    const factory = new IDBFactory();
    await createV1(factory, "migration-failure");
    await expect(openMyDataDatabase({
      name: "migration-failure",
      indexedDB: factory,
      migrateItem: () => { throw new Error("broken migration"); },
    })).rejects.toThrow();

    const database = await requestResult(factory.open("migration-failure", 1));
    const stored = await requestResult(database.transaction("items").objectStore("items").get("legacy-id"));
    expect(stored).toEqual(legacyItem);
    expect(database.objectStoreNames.contains("folders")).toBe(false);
    database.close();
  });
});

const fixedClock = () => new Date(2026, 5, 15, 7, 5);

function openFresh(name: string) {
  let counter = 0;
  return MyDataStore.open({
    name,
    indexedDB: new IDBFactory(),
    clock: fixedClock,
    idFactory: () => `id-${++counter}`,
  });
}

const pin = { name: "Pin", geometry: { type: "Point" as const, coordinates: [-95, 47] as [number, number] } };

describe("importing into an Import folder", () => {
  it("creates one folder named for the file and local time, holding every item", async () => {
    const store = await openFresh("import-folder");
    const result = await store.importItems([pin, { ...pin, name: "Second" }], { filename: "north40.gpx", format: "gpx" });
    const snapshot = await store.load();
    expect(result.folder.name).toBe("north40.gpx 2026-06-15 07:05");
    expect(snapshot.folders.map((folder) => folder.id)).toEqual([result.folder.id]);
    expect(snapshot.items.map((item) => item.folderId)).toEqual([result.folder.id, result.folder.id]);
    expect(snapshot.items[0]?.importProvenance).toMatchObject({ filename: "north40.gpx", format: "gpx" });
  });

  it("makes a second import of the same file a second folder", async () => {
    const store = await openFresh("import-twice");
    await store.importItems([pin], { filename: "a.kml", format: "kml" });
    await store.importItems([pin], { filename: "a.kml", format: "kml" });
    const names = (await store.load()).folders.map((folder) => folder.name).sort();
    expect(names).toEqual(["a.kml 2026-06-15 07:05", "a.kml 2026-06-15 07:05 (2)"]);
  });

  it("leaves nothing behind when a write fails", async () => {
    const store = await openFresh("import-atomic");
    const broken = { ...pin, geometry: { type: "Point" as const, coordinates: (() => 1) as never } };
    await expect(store.importItems([pin, broken], { filename: "a.gpx", format: "gpx" })).rejects.toThrow();
    const snapshot = await store.load();
    expect(snapshot.folders).toEqual([]);
    expect(snapshot.items).toEqual([]);
  });

  it("creates no folder for an empty import", async () => {
    const store = await openFresh("import-empty");
    await expect(store.importItems([], { filename: "a.gpx", format: "gpx" })).rejects.toThrow(/no items/i);
    expect((await store.load()).folders).toEqual([]);
  });

  it("can be undone as one folder bundle and recovered from Trash", async () => {
    const store = await openFresh("import-undo");
    const { folder } = await store.importItems([pin, pin], { filename: "a.gpx", format: "gpx" });
    expect(await store.trashFolder(folder.id)).toBe(2);
    await store.restoreFolder(folder.id);
    expect((await store.load()).items.every((item) => !item.deletion)).toBe(true);
  });
});

describe("archive restore and delete-all", () => {
  it("applies a restore plan in one step", async () => {
    const source = await openFresh("restore-source");
    const { folder } = await source.importItems([pin], { filename: "a.gpx", format: "gpx" });
    const archive = buildArchive(await source.load(), fixedClock());

    const target = await openFresh("restore-target");
    const plan = planRestore(archive.content, await target.load(), fixedClock);
    if (!plan.ok) throw new Error(plan.message);
    await target.applyRestore(plan);
    const restored = await target.load();
    expect(restored.folders.map((entry) => entry.name)).toEqual([folder.name]);
    expect(restored.items).toHaveLength(1);
    expect(restored.items[0]?.folderId).toBe(restored.folders[0]?.id);
  });

  it("clears the browser copy and leaves fresh defaults", async () => {
    const store = await openFresh("delete-all");
    await store.importItems([pin], { filename: "a.gpx", format: "gpx" });
    await store.updateSettings({ point: { symbolId: "star", color: "#111111" } });
    await store.deleteAll();
    const snapshot = await store.load();
    expect(snapshot.items).toEqual([]);
    expect(snapshot.folders).toEqual([]);
    expect(snapshot.settings.revision).toBe(1);
    expect(snapshot.settings.point.symbolId).not.toBe("star");
  });

  it("clears Trash too", async () => {
    const store = await openFresh("delete-all-trash");
    const item = await store.addItem(pin);
    await store.trashItem(item.id);
    await store.deleteAll();
    expect((await store.load()).items).toEqual([]);
  });
});
