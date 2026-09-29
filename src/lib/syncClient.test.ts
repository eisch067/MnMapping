import { describe, expect, it } from "vitest";
import {
  SyncAuthenticationError,
  SyncPausedError,
  synchronize,
  type RemoteChange,
  type SyncRecord,
  type SyncState,
  type SyncStorage,
} from "./syncClient";

class MemoryStorage implements SyncStorage {
  state: SyncState = { cursor: 0, resetAt: null, migrationComplete: false };
  changes: RemoteChange[] = [];
  entries: Array<{ kind: "item"; record: SyncRecord; expectedRevision: number | null }> = [];
  purged = false;
  migrated = false;

  async getState() { return this.state; }
  async setState(state: SyncState) { this.state = state; }
  async pending() { return this.entries; }
  async resolveFolderNameConflict() {}
  async acknowledge(_kind: "item", _id: string, mutationId: string) {
    this.entries = this.entries.filter((entry) => entry.record.outbox.mutationId !== mutationId);
  }
  async receive(changes: readonly RemoteChange[]) { this.changes.push(...changes); }
  async purge() { this.purged = true; this.entries = []; this.changes = []; }
  async completeMigration() { this.migrated = true; this.state = { ...this.state, migrationComplete: true }; }
}

function pendingEntry() {
  return {
    kind: "item" as const,
    expectedRevision: null,
    record: {
      id: "item-1",
      schemaVersion: 2,
      revision: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
      name: "Offline",
      outbox: { mutationId: "mutation-1", operation: "upsert" as const, queuedAt: "2026-01-01T00:00:00.000Z" },
    },
  };
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("synchronize", () => {
  it("pushes pending migration data, retains it until acknowledged, then marks migration complete", async () => {
    const storage = new MemoryStorage();
    storage.entries = [pendingEntry()];
    const calls: string[] = [];
    const request: typeof fetch = async (input, init) => {
      calls.push(`${init?.method ?? "GET"} ${String(input)}`);
      if (init?.method === "POST") return response({ ok: true, revision: 1, acceptedAt: "2026-01-02T00:00:00.000Z" });
      return response({ changes: [], cursor: 0, resetAt: null });
    };

    await synchronize(storage, request);

    expect(storage.entries).toEqual([]);
    expect(storage.migrated).toBe(true);
    expect(calls).toContain("POST /api/sync");
  });

  it("stops on an authentication response without changing pending data", async () => {
    const storage = new MemoryStorage();
    storage.entries = [pendingEntry()];
    let calls = 0;
    const request: typeof fetch = async () => {
      calls += 1;
      return response({ error: "Unauthorized." }, 401);
    };

    await expect(synchronize(storage, request)).rejects.toBeInstanceOf(SyncAuthenticationError);
    expect(calls).toBe(1);
    expect(storage.entries).toHaveLength(1);
  });

  it("keeps every outbox mutation when D1 reports a daily-limit pause", async () => {
    const storage = new MemoryStorage();
    storage.entries = [pendingEntry()];
    const request: typeof fetch = async (_input, init) => init?.method === "POST"
      ? response({ error: "D1 daily limit exceeded" }, 503)
      : response({ changes: [], cursor: 0, resetAt: null });

    await expect(synchronize(storage, request)).rejects.toBeInstanceOf(SyncPausedError);
    expect(storage.entries).toHaveLength(1);
    expect(storage.entries[0]?.record.id).toBe("item-1");
    expect(storage.migrated).toBe(false);
  });

  it("purges local data when the server reset marker changes", async () => {
    const storage = new MemoryStorage();
    storage.entries = [pendingEntry()];
    const request: typeof fetch = async () => response({ changes: [], cursor: 0, resetAt: "server-reset" });

    await synchronize(storage, request);

    expect(storage.purged).toBe(true);
    expect(storage.entries).toEqual([]);
    expect(storage.state).toMatchObject({ resetAt: "server-reset", migrationComplete: true });
  });

  it("leaves pending edits available for replay when the network is unavailable", async () => {
    const storage = new MemoryStorage();
    storage.entries = [pendingEntry()];
    const request: typeof fetch = async () => { throw new TypeError("Failed to fetch"); };

    await expect(synchronize(storage, request)).rejects.toThrow("Failed to fetch");
    expect(storage.entries).toHaveLength(1);
  });
});
