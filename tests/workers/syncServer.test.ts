import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { deleteAccount, pullChanges, purgeExpired, pushMutation, validMutation, type Mutation } from "../../src/lib/syncServer";

const db = env.DB;
const now = new Date("2026-09-27T12:00:00.000Z");
const id = () => crypto.randomUUID();

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
      owner TEXT NOT NULL, mutation_id TEXT NOT NULL, applied_at TEXT NOT NULL,
      PRIMARY KEY(owner, mutation_id)) WITHOUT ROWID`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sync_account_state (
      owner TEXT PRIMARY KEY, reset_at TEXT NOT NULL) WITHOUT ROWID`),
  ]);
});

async function clean(owner: string) {
  await db.batch([
    db.prepare("DELETE FROM sync_records WHERE owner = ?").bind(owner),
    db.prepare("DELETE FROM sync_mutations WHERE owner = ?").bind(owner),
    db.prepare("DELETE FROM sync_account_state WHERE owner = ?").bind(owner),
  ]);
}

function mutation(owner: string, overrides: Partial<Mutation> = {}): Mutation {
  const base: Mutation = {
    mutationId: `${owner}-${id()}`,
    kind: "item",
    id: `${owner}-item`,
    expectedRevision: null,
    operation: "upsert",
    accountResetAt: null,
    record: { id: `${owner}-item`, name: "Pin", schemaVersion: 2 },
  };
  return {
    ...base,
    ...overrides,
    record: overrides.operation === "delete" ? undefined : {
      schemaVersion: 2,
      ...overrides.record ?? base.record,
    },
  };
}

describe("sync server mutations and cursors", () => {
  it("scopes records by verified owner and never trusts a payload owner", async () => {
    const ownerA = `a-${id()}`;
    const ownerB = `b-${id()}`;
    await clean(ownerA);
    await clean(ownerB);
    const write = mutation(ownerA, { record: { id: `${ownerA}-item`, name: "A" } });
    expect(validMutation({ ...write, record: { id: `${ownerA}-item`, owner: ownerB } })).toBe(false);
    expect((await pushMutation(db, ownerA, write, now)).status).toBe(200);
    const aPull = await pullChanges(db, ownerA, 0, 100).then((response) => response.json() as Promise<{ changes: unknown[] }>);
    const bPull = await pullChanges(db, ownerB, 0, 100).then((response) => response.json() as Promise<{ changes: unknown[] }>);
    expect(aPull.changes).toHaveLength(1);
    expect(bPull.changes).toHaveLength(0);
  });

  it("makes replay a no-op and rejects stale revisions", async () => {
    const owner = `revision-${id()}`;
    await clean(owner);
    const first = mutation(owner);
    expect((await pushMutation(db, owner, first, now)).status).toBe(200);
    expect(await (await pushMutation(db, owner, first, now)).json()).toMatchObject({ replayed: true });
    const stale = mutation(owner, { expectedRevision: null, record: { id: `${owner}-item`, name: "stale" } });
    expect((await pushMutation(db, owner, stale, now)).status).toBe(409);
    const current = mutation(owner, { expectedRevision: 1, record: { id: `${owner}-item`, name: "updated" } });
    expect(await (await pushMutation(db, owner, current, now)).json()).toMatchObject({ revision: 2 });
  });

  it("pages each saved row once and leaves tombstones after 30 days", async () => {
    const owner = `cursor-${id()}`;
    await clean(owner);
    const first = mutation(owner);
    await pushMutation(db, owner, first, now);
    await pushMutation(db, owner, mutation(owner, {
      id: `${owner}-deleted`, mutationId: `${owner}-delete`,
      record: { id: `${owner}-deleted`, geometry: { type: "Point", coordinates: [0, 0] } },
    }), now);
    await pushMutation(db, owner, mutation(owner, {
      id: `${owner}-deleted`, mutationId: `${owner}-soft-delete`, expectedRevision: 1, operation: "delete", record: undefined,
    }), now);

    const firstPage = await pullChanges(db, owner, 0, 1).then((response) => response.json() as Promise<{ changes: Array<{ cursor: number }>; cursor: number }>);
    const secondPage = await pullChanges(db, owner, firstPage.cursor, 1).then((response) => response.json() as Promise<{ changes: Array<{ cursor: number; deletedAt: string | null; record: unknown }>; cursor: number }>);
    expect(firstPage.changes).toHaveLength(1);
    expect(secondPage.changes).toHaveLength(1);
    const deleteChange = await pullChanges(db, owner, 2, 1).then((response) => response.json() as Promise<{ changes: Array<{ cursor: number; deletedAt: string | null; record: unknown }> }>);
    expect(deleteChange.changes[0]?.deletedAt).toBe(now.toISOString());
    expect(deleteChange.changes[0]?.record).not.toBeNull();

    expect(await purgeExpired(db, new Date(now.getTime() + 29 * 86_400_000))).toBe(0);
    expect(await purgeExpired(db, new Date(now.getTime() + 30 * 86_400_000))).toBe(1);
    const tombstone = await pullChanges(db, owner, 2, 1).then((response) => response.json() as Promise<{ changes: Array<{ tombstone: boolean; record: unknown; revision: number }> }>);
    expect(tombstone.changes[0]).toMatchObject({ tombstone: true, record: null, revision: 3 });
    const staleResurrection = mutation(owner, {
      id: `${owner}-deleted`, mutationId: `${owner}-stale-resurrection`, expectedRevision: 2,
      record: { id: `${owner}-deleted`, name: "stale" },
    });
    expect((await pushMutation(db, owner, staleResurrection, now)).status).toBe(409);
  });

  it("enforces trimmed, case-folded folder-name uniqueness per owner", async () => {
    const owner = `folder-${id()}`;
    await clean(owner);
    const first = mutation(owner, {
      kind: "folder", id: `${owner}-one`, record: { id: `${owner}-one`, name: " North " },
    });
    expect((await pushMutation(db, owner, first, now)).status).toBe(200);
    const duplicate = mutation(owner, {
      kind: "folder", id: `${owner}-two`, record: { id: `${owner}-two`, name: "north" },
    });
    expect((await pushMutation(db, owner, duplicate, now)).status).toBe(409);
  });

  it("uses indexes for identity, cursor, and purge queries", async () => {
    const plans = await Promise.all([
      db.prepare("EXPLAIN QUERY PLAN SELECT revision FROM sync_records WHERE owner = ? AND kind = ? AND id = ?")
        .bind("owner", "item", "id").all<{ detail: string }>(),
      db.prepare("EXPLAIN QUERY PLAN SELECT id FROM sync_records WHERE owner = ? AND cursor > ? ORDER BY cursor LIMIT ?")
        .bind("owner", 0, 10).all<{ detail: string }>(),
      db.prepare("EXPLAIN QUERY PLAN UPDATE sync_records SET tombstone=1 WHERE deleted_at <= ? AND deleted_at IS NOT NULL AND tombstone=0")
        .bind(now.toISOString()).all<{ detail: string }>(),
    ]);
    const details = plans.flatMap((plan) => plan.results ?? []).map((row) => row.detail).join(" ");
    expect(details).toContain("PRIMARY KEY");
    expect(details).toContain("sync_records_owner_cursor");
    expect(details).toContain("sync_records_purge");
  });

  it("deletes all account data and returns a server-time reset marker", async () => {
    const owner = `reset-${id()}`;
    await clean(owner);
    await pushMutation(db, owner, mutation(owner), now);
    const response = await deleteAccount(db, owner, now);
    const resetResponse = await response.json() as { resetAt: string };
    expect(resetResponse.resetAt).toMatch(new RegExp(`^${now.toISOString()}#`));
    const pulled = await pullChanges(db, owner, 0, 100).then((result) => result.json() as Promise<{ changes: unknown[]; resetAt: string }>);
    expect(pulled).toMatchObject({ changes: [], resetAt: resetResponse.resetAt });
    const staleWrite = mutation(owner, { mutationId: `${owner}-pre-reset` });
    expect((await pushMutation(db, owner, staleWrite, now)).status).toBe(409);
    const acknowledgedReset = mutation(owner, { accountResetAt: pulled.resetAt });
    expect((await pushMutation(db, owner, acknowledgedReset, now)).status).toBe(200);
    const secondReset = await deleteAccount(db, owner, now).then((result) => result.json() as Promise<{ resetAt: string }>);
    expect(secondReset.resetAt).not.toBe(resetResponse.resetAt);
    expect((await pushMutation(db, owner, acknowledgedReset, now)).status).toBe(409);
  });
});
