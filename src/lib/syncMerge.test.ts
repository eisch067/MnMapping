import { describe, expect, it } from "vitest";
import { mergeRemoteChange, type MergeResult } from "./syncMerge";
import type { RemoteChange, SyncRecord } from "./syncClient";

function record(overrides: Partial<SyncRecord> = {}): SyncRecord {
  return {
    id: "item-1",
    name: "Base",
    note: "unchanged",
    revision: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    outbox: { mutationId: "m1", operation: "upsert", queuedAt: "2026-01-01T00:00:00.000Z" },
    ...overrides,
  };
}

function change(overrides: Partial<RemoteChange> = {}): RemoteChange {
  return {
    kind: "item",
    id: "item-1",
    revision: 2,
    cursor: 1,
    updatedAt: "2026-01-02T00:00:00.000Z",
    deletedAt: null,
    tombstone: false,
    record: record({ revision: 2, updatedAt: "2026-01-02T00:00:00.000Z" }),
    ...overrides,
  };
}

const id = () => "conflict-id";

describe("mergeRemoteChange", () => {
  it("merges non-overlapping field changes", () => {
    const result = mergeRemoteChange(
      record(),
      record({ note: "local note", outbox: { mutationId: "local-2", operation: "upsert", queuedAt: "2026-01-02T00:00:00.000Z" } }),
      change({ record: record({ revision: 2, name: "Remote name" }) }),
      id,
    );
    expect(result.kind).toBe("merged");
    expect((result as Extract<MergeResult, { kind: "merged" }>).record).toMatchObject({
      name: "Remote name",
      note: "local note",
    });
  });

  it("creates a named copy when the same field changes", () => {
    const result = mergeRemoteChange(
      record(),
      record({ name: "Local name", outbox: { mutationId: "local-2", operation: "upsert", queuedAt: "2026-01-02T00:00:00.000Z" } }),
      change({ record: record({ revision: 2, name: "Remote name" }) }),
      id,
    );
    expect(result.kind).toBe("conflict");
    expect((result as Extract<MergeResult, { kind: "conflict" }>).conflictCopy).toMatchObject({
      id: "conflict-id",
      name: "Local name (conflict copy)",
    });
  });

  it("merges local setting defaults into a second device without duplicating the settings record", () => {
    const defaults = {
      id: "settings", point: { symbolId: "pin", color: "#9974ff" },
      line: { color: "#9974ff", width: 3, dimensionKind: "horizontal", unit: "miles" },
      polygon: { outlineColor: "#9974ff", fillColor: "#9974ff", opacity: 0.25,
        dimensionKind: "area", areaUnit: "acres", perimeterUnit: "miles" },
    };
    const local = record({ ...defaults, id: "settings", point: { symbolId: "star", color: defaults.point.color },
          outbox: { mutationId: "local-settings", operation: "upsert", queuedAt: "2026-01-02T00:00:00.000Z" } });
    const remote = record({ ...defaults, id: "settings", revision: 2,
      point: { ...defaults.point, color: "#123456" }, line: { ...defaults.line, color: "#ff0000" } });
    const result = mergeRemoteChange(null, local, change({ kind: "settings", id: "settings", record: remote }), id);
    expect(result.kind).toBe("merged");
    expect((result as Extract<MergeResult, { kind: "merged" }>).record).toMatchObject({
      id: "settings",
      point: { symbolId: "star", color: "#123456" },
      line: { color: "#ff0000" },
    });
  });

  it("keeps delete-versus-edit in Trash and preserves the edit as a named active copy", () => {
    const deletedLocal = record({
      revision: 2,
      deletion: { deletedAt: "2026-01-02T00:00:00.000Z" },
      outbox: { mutationId: "delete-1", operation: "delete", queuedAt: "2026-01-02T00:00:00.000Z" },
    });
    const result = mergeRemoteChange(
      record(),
      deletedLocal,
      change({ record: record({ revision: 2, note: "edited on second device" }) }),
      (() => { let next = 0; return () => `copy-${++next}`; })(),
    );
    expect(result.kind).toBe("conflict");
    expect((result as Extract<MergeResult, { kind: "conflict" }>).record).toMatchObject({ deletion: deletedLocal.deletion });
    expect((result as Extract<MergeResult, { kind: "conflict" }>).conflictCopy).toMatchObject({
      name: "Base (conflict copy)",
      note: "edited on second device",
      outbox: { operation: "upsert" },
    });
  });

  it("keeps a remotely deleted original in Trash and makes a local edit active", () => {
    const local = record({ note: "local edit", outbox: { mutationId: "local-edit", operation: "upsert", queuedAt: "2026-01-02T00:00:00.000Z" } });
    const remote = record({ revision: 2, deletion: { deletedAt: "2026-01-02T00:00:00.000Z" } });
    const result = mergeRemoteChange(record(), local, change({ record: remote }),
      (() => { let next = 0; return () => `remote-delete-${++next}`; })());
    expect(result.kind).toBe("conflict");
    expect((result as Extract<MergeResult, { kind: "conflict" }>).record).toMatchObject({ deletion: remote.deletion });
    expect((result as Extract<MergeResult, { kind: "conflict" }>).conflictCopy).toMatchObject({
      note: "local edit",
      outbox: { operation: "upsert" },
    });
    expect((result as Extract<MergeResult, { kind: "conflict" }>).conflictCopy.deletion).toBeUndefined();
  });

  it("accepts a remote tombstone as deletion", () => {
    expect(mergeRemoteChange(record(), null, change({ tombstone: true, record: null }), id))
      .toEqual({ kind: "deleted" });
  });
});
