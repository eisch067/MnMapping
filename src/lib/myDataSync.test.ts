import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { MyDataStore } from "./myData";
import { buildArchive, planRestore } from "./exchange/archive";
import type { RemoteChange, SyncRecord } from "./syncClient";

const point = { type: "Point" as const, coordinates: [-95, 47] as [number, number] };
const remoteChange = (record: SyncRecord, overrides: Partial<RemoteChange> = {}): RemoteChange => ({
  kind: "item", id: record.id, revision: record.revision, cursor: 1,
  updatedAt: record.updatedAt, deletedAt: null, tombstone: false, record,
  ...overrides,
});

async function open(name: string, factory = new IDBFactory()) {
  let id = 0;
  return { store: await MyDataStore.open({ name, indexedDB: factory, clock: () => new Date("2026-06-15T07:05:00.000Z"), idFactory: () => `copy-${name}-${++id}` }), factory };
}

describe("durable sync storage", () => {
  it("persists sync state and record baselines across reopen without resetting user settings", async () => {
    const factory = new IDBFactory();
    const { store } = await open("sync-reopen", factory);
    await store.updateSettings({ point: { symbolId: "star", color: "#123456" } });
    await store.setState({ cursor: 18, resetAt: "reset", migrationComplete: false });
    store.close();
    const reopened = await MyDataStore.open({ name: "sync-reopen", indexedDB: factory });
    expect(await reopened.getState()).toEqual({ cursor: 18, resetAt: "reset", migrationComplete: false });
    expect((await reopened.pending()).find((entry) => entry.kind === "settings")?.expectedRevision).toBeNull();
    expect((await reopened.load()).settings.point.symbolId).toBe("star");
    reopened.close();
  });

  it("retains pending edits, acknowledges only the matching mutation, and stamps accepted deletions", async () => {
    const { store } = await open("sync-ack");
    const item = await store.addItem({ name: "Local", geometry: point });
    expect((await store.pending()).map((entry) => entry.record.id)).toContain(item.id);
    await store.updateItemGeometry(item.id, { ...point, coordinates: [-94, 47] });
    await store.acknowledge("item", item.id, item.outbox.mutationId, 4, "2026-06-01T00:00:00.000Z", item as unknown as SyncRecord);
    const pendingAfterAck = (await store.pending()).find((entry) => entry.record.id === item.id)!;
    expect(pendingAfterAck.record.geometry).toEqual({ ...point, coordinates: [-94, 47] });
    expect(pendingAfterAck.expectedRevision).toBe(4);
    const current = pendingAfterAck;
    await store.acknowledge("item", item.id, current.record.outbox.mutationId, 5, "2026-06-02T00:00:00.000Z");
    expect((await store.pending()).some((entry) => entry.record.id === item.id)).toBe(false);
    await store.trashItem(item.id);
    const deletion = (await store.pending()).find((entry) => entry.record.id === item.id)!;
    await store.acknowledge("item", item.id, deletion.record.outbox.mutationId, 6, "2026-06-03T00:00:00.000Z");
    expect((await store.load()).items[0]?.deletion?.deletedAt).toBe("2026-06-03T00:00:00.000Z");
    store.close();
  });

  it("does not permanently purge synchronized Trash using the device clock", async () => {
    const { store } = await open("sync-server-time-trash");
    const item = await store.addItem({ name: "Trashed", geometry: point });
    const pendingAdd = (await store.pending()).find((entry) => entry.record.id === item.id)!;
    await store.acknowledge("item", item.id, pendingAdd.record.outbox.mutationId, 1, item.updatedAt, pendingAdd.record);
    await store.trashItem(item.id);
    const deletion = (await store.pending()).find((entry) => entry.record.id === item.id)!;
    await store.acknowledge("item", item.id, deletion.record.outbox.mutationId, 2,
      "2026-01-01T00:00:00.000Z", deletion.record);
    expect((await store.load()).items[0]?.deletion?.deletedAt).toBe("2026-01-01T00:00:00.000Z");
    store.close();
  });

  it("merges remote records, processes tombstones, and persists cursor and reset state", async () => {
    const { store } = await open("sync-receive");
    const item = await store.addItem({ name: "Remote", geometry: point });
    const pending = (await store.pending()).find((entry) => entry.record.id === item.id)!;
    await store.acknowledge("item", item.id, pending.record.outbox.mutationId, 1, item.updatedAt);
    const baseline = { ...item, revision: 2, updatedAt: "2026-06-04T00:00:00.000Z", name: "Server" } as SyncRecord;
    await store.receive([remoteChange(baseline)]);
    expect((await store.load()).items[0]?.name).toBe("Server");
    await store.setState({ cursor: 27, resetAt: "server-reset", migrationComplete: true });
    expect(await store.getState()).toEqual({ cursor: 27, resetAt: "server-reset", migrationComplete: true });
    await store.purge();
    expect((await store.load()).items).toEqual([]);
    expect((await store.getState()).cursor).toBe(0);
    store.close();
  });

  it("assigns a fresh id when restoring an archive item with a permanent tombstone", async () => {
    const { store } = await open("sync-tombstone-restore");
    const item = await store.addItem({ name: "Archived", geometry: point });
    const archive = buildArchive(await store.load(), new Date("2026-06-15T08:00:00.000Z"));
    const pending = (await store.pending()).find((entry) => entry.record.id === item.id)!;
    await store.acknowledge("item", item.id, pending.record.outbox.mutationId, 1, item.updatedAt, pending.record);
    await store.receive([remoteChange(item as unknown as SyncRecord, {
      revision: 2,
      cursor: 2,
      tombstone: true,
      deletedAt: "2026-06-14T00:00:00.000Z",
      record: null,
    })]);
    const plan = planRestore(archive.content, await store.load());
    expect(plan.ok).toBe(true);
    if (plan.ok) await store.applyRestore(plan);
    const restored = (await store.load()).items;
    expect(restored).toHaveLength(1);
    expect(restored[0]?.id).not.toBe(item.id);
    expect((await store.pending()).some((entry) => entry.record.id === restored[0]?.id)).toBe(true);
    store.close();
  });

  it("does not complete migration while local changes remain", async () => {
    const { store } = await open("sync-migration");
    await store.addItem({ name: "Pending", geometry: point });
    await expect(store.completeMigration()).rejects.toThrow(/pending/i);
    for (const entry of await store.pending()) {
      await store.acknowledge(entry.kind, entry.record.id, entry.record.outbox.mutationId, 1, entry.record.updatedAt);
    }
    await store.completeMigration();
    expect((await store.getState()).migrationComplete).toBe(true);
    store.close();
  });
});
