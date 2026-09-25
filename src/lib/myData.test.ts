import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
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
