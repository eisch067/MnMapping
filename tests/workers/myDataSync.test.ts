import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { mergeRemoteChange } from "../../src/lib/syncMerge";
import {
  synchronize,
  type RecordKind,
  type RemoteChange,
  type SyncRecord,
  type SyncState,
  type SyncStorage,
} from "../../src/lib/syncClient";
import { pullChanges, pushMutation, type Mutation } from "../../src/lib/syncServer";

const db = env.DB;
const now = new Date("2026-09-27T12:00:00.000Z");

beforeAll(async () => {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS sync_records (
      owner TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL,
      cursor INTEGER NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
      tombstone INTEGER NOT NULL DEFAULT 0, record_json TEXT, name_key TEXT,
      PRIMARY KEY(owner, kind, id)) WITHOUT ROWID`),
    db.prepare("CREATE INDEX IF NOT EXISTS sync_records_owner_cursor ON sync_records(owner, cursor)"),
    db.prepare("CREATE INDEX IF NOT EXISTS sync_records_purge ON sync_records(deleted_at) WHERE deleted_at IS NOT NULL AND tombstone = 0"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS sync_folders_owner_name ON sync_records(owner, name_key) WHERE kind='folder' AND deleted_at IS NULL AND name_key IS NOT NULL"),
    db.prepare(`CREATE TABLE IF NOT EXISTS sync_mutations (
      owner TEXT NOT NULL, mutation_id TEXT NOT NULL, applied_at TEXT NOT NULL, revision INTEGER NOT NULL,
      PRIMARY KEY(owner, mutation_id)) WITHOUT ROWID`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sync_account_state (
      owner TEXT PRIMARY KEY, reset_at TEXT NOT NULL) WITHOUT ROWID`),
  ]);
});

async function clearOwner(owner: string) {
  await db.batch([
    db.prepare("DELETE FROM sync_records WHERE owner = ?").bind(owner),
    db.prepare("DELETE FROM sync_mutations WHERE owner = ?").bind(owner),
    db.prepare("DELETE FROM sync_account_state WHERE owner = ?").bind(owner),
  ]);
}

class FakeDeviceStorage implements SyncStorage {
  state: SyncState = { cursor: 0, resetAt: null, migrationComplete: true };
  records = new Map<string, SyncRecord>();
  baselines = new Map<string, { record: SyncRecord | null; revision: number | null }>();
  nextId = 0;

  constructor(private readonly name: string) {}

  async getState() { return this.state; }
  async setState(state: SyncState) { this.state = state; }
  async pending() {
    const pending: Array<{ kind: RecordKind; record: SyncRecord; expectedRevision: number | null }> = [];
    for (const record of this.records.values()) {
      const baseline = this.baselines.get(`item:${record.id}`);
      if (baseline?.record?.outbox.mutationId === record.outbox.mutationId) continue;
      pending.push({ kind: "item", record, expectedRevision: baseline?.revision ?? null });
    }
    return pending;
  }
  async resolveFolderNameConflict() {}
  async acknowledge(kind: RecordKind, id: string, mutationId: string, revision: number, acceptedAt: string, sentRecord?: SyncRecord) {
    const current = this.records.get(id);
    const sent = sentRecord ?? current;
    if (!sent) return;
    const accepted = { ...sent, revision, updatedAt: acceptedAt, outbox: { ...sent.outbox, mutationId } };
    this.baselines.set(`${kind}:${id}`, { record: accepted, revision });
    if (current?.outbox.mutationId === mutationId) this.records.set(id, accepted);
  }
  async receive(changes: readonly RemoteChange[]) {
    for (const change of changes) {
      const key = `${change.kind}:${change.id}`;
      const baseline = this.baselines.get(key);
      if ((baseline?.revision ?? 0) >= change.revision) continue;
      const local = this.records.get(change.id) ?? null;
      const result = mergeRemoteChange(baseline?.record ?? null, local, change, () => `${this.name}-${++this.nextId}`);
      if (result.kind === "deleted") {
        this.records.delete(change.id);
        if (result.conflictCopy) this.records.set(result.conflictCopy.id, result.conflictCopy);
      } else {
        this.records.set(change.id, result.record);
        if (result.kind === "conflict") this.records.set(result.conflictCopy.id, result.conflictCopy);
      }
      this.baselines.set(key, { record: change.record as SyncRecord | null, revision: change.revision });
    }
  }
  async purge() { this.records.clear(); this.baselines.clear(); }
  async completeMigration() {
    if ((await this.pending()).length) throw new Error("Pending changes remain.");
    this.state = { ...this.state, migrationComplete: true };
  }
  add(name: string, geometry: { type: "Point"; coordinates: [number, number] }) {
    const record: SyncRecord = {
      id: `${this.name}-item`, name, schemaVersion: 2, geometry, revision: 1,
      updatedAt: now.toISOString(), outbox: { mutationId: `${this.name}-mutation-${++this.nextId}`,
        operation: "upsert", queuedAt: now.toISOString() },
    };
    this.records.set(record.id, record);
    return record;
  }
  editGeometry(id: string, coordinates: [number, number]) {
    const current = this.records.get(id)!;
    const record: SyncRecord = {
      ...current,
      geometry: { type: "Point", coordinates },
      revision: current.revision + 1,
      updatedAt: now.toISOString(),
      outbox: { mutationId: `${this.name}-mutation-${++this.nextId}`, operation: "upsert", queuedAt: now.toISOString() },
    };
    this.records.set(id, record);
  }
  trash(id: string) {
    const current = this.records.get(id)!;
    this.records.set(id, {
      ...current,
      revision: current.revision + 1,
      updatedAt: now.toISOString(),
      deletion: { deletedAt: now.toISOString() },
      outbox: { mutationId: `${this.name}-mutation-${++this.nextId}`, operation: "delete", queuedAt: now.toISOString() },
    });
  }
}

function api(owner: string): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input), "http://localhost");
    if (init?.method === "POST") {
      const mutation = JSON.parse(String(init.body)) as Mutation;
      return pushMutation(db, owner, mutation, now);
    }
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 100);
    return pullChanges(db, owner, cursor, limit);
  };
}

describe("two-device My Data sync with Miniflare D1", () => {
  it("merges disjoint device state and creates a named copy for overlapping geometry edits", async () => {
    const owner = `two-device-${crypto.randomUUID()}`;
    await clearOwner(owner);
    const first = new FakeDeviceStorage("device-a");
    const second = new FakeDeviceStorage("device-b");
    const request = api(owner);
    const item = first.add("Shared pin", { type: "Point", coordinates: [-95, 47] });
    await synchronize(first, request);
    await synchronize(second, request);

    first.editGeometry(item.id, [-94, 47]);
    await synchronize(first, request);
    second.editGeometry(item.id, [-93, 47]);
    await synchronize(second, request);

    const items = [...second.records.values()].filter((record) => !record.deletion);
    expect(items).toHaveLength(2);
    expect(items.find((record) => record.id === item.id)?.geometry).toEqual({ type: "Point", coordinates: [-94, 47] });
    expect(items.find((record) => typeof record.name === "string" && record.name.includes("conflict copy"))?.geometry)
      .toEqual({ type: "Point", coordinates: [-93, 47] });
  });

  it("keeps delete-versus-edit in Trash and the edit as an active conflict copy", async () => {
    const owner = `delete-edit-${crypto.randomUUID()}`;
    await clearOwner(owner);
    const first = new FakeDeviceStorage("delete-device");
    const second = new FakeDeviceStorage("edit-device");
    const request = api(owner);
    const item = first.add("Saved", { type: "Point", coordinates: [-95, 47] });
    await synchronize(first, request);
    await synchronize(second, request);
    first.trash(item.id);
    second.editGeometry(item.id, [-94, 47]);
    await synchronize(first, request);
    await synchronize(second, request);

    expect(second.records.get(item.id)?.deletion).toBeDefined();
    expect([...second.records.values()].find((record) => typeof record.name === "string" && record.name.includes("conflict copy") && !record.deletion)?.geometry)
      .toEqual({ type: "Point", coordinates: [-94, 47] });
  });

  it("resumes an interrupted migration without duplicating an accepted item", async () => {
    const owner = `migration-resume-${crypto.randomUUID()}`;
    await clearOwner(owner);
    const device = new FakeDeviceStorage("migration-device");
    const item = device.add("One copy", { type: "Point", coordinates: [-95, 47] });
    device.state = { ...device.state, migrationComplete: false };
    const request = api(owner);
    let interrupted = false;
    const unreliable: typeof fetch = async (input, init) => {
      const response = await request(input, init);
      if (init?.method === "POST" && !interrupted && JSON.parse(String(init.body)).id === item.id) {
        interrupted = true;
        throw new TypeError("connection dropped after server acceptance");
      }
      return response;
    };
    await expect(synchronize(device, unreliable)).rejects.toThrow("connection dropped");
    expect(device.state.migrationComplete).toBe(false);
    await synchronize(device, request);
    const pulled = await pullChanges(db, owner, 0, 100).then((result) => result.json() as Promise<{ changes: Array<{ id: string }> }>);
    expect(pulled.changes.filter((change) => change.id === item.id)).toHaveLength(1);
    expect(device.state.migrationComplete).toBe(true);
  });
});
