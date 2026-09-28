import type { RemoteChange, SyncRecord } from "./syncClient";

const internalKeys = new Set(["revision", "updatedAt", "outbox"]);

export type MergeResult =
  | { kind: "merged"; record: SyncRecord }
  | { kind: "conflict"; record: SyncRecord; conflictCopy: SyncRecord }
  | { kind: "remote"; record: SyncRecord }
  | { kind: "deleted"; conflictCopy?: SyncRecord };

export function mergeRemoteChange(
  base: SyncRecord | null,
  local: SyncRecord | null,
  change: RemoteChange,
  newId: () => string,
): MergeResult {
  if (change.tombstone || !change.record) {
    if (local && base && change.kind === "item" && local.outbox.operation === "upsert" && hasLocalChanges(base, local)) {
      return {
        kind: "deleted",
        conflictCopy: queuedCopy(local, newId, local.updatedAt, `${String(local.name ?? "Item")} (conflict copy)`),
      };
    }
    return { kind: "deleted" };
  }
  const remote = change.record as SyncRecord;
  if (!local) return { kind: "remote", record: remote };
  if (local.outbox.mutationId === remote.outbox.mutationId) return { kind: "remote", record: remote };
  if (change.kind === "settings") return mergeSettings(base, local, remote, newId);
  if (!base) return conflict(local, remote, newId);
  if (local.deletion && remote.deletion) return { kind: "remote", record: remote };
  if (local.outbox.operation === "delete" && !remote.deletion) {
    return {
      kind: "conflict",
      record: local,
      conflictCopy: queuedCopy(remote, newId, remote.updatedAt, `${String(remote.name ?? "Item")} (conflict copy)`),
    };
  }
  if (remote.deletion && !local.deletion && hasLocalChanges(base, local)) return conflict(local, remote, newId);
  if (!hasLocalChanges(base, local)) return { kind: "remote", record: remote };
  const merged = { ...remote };
  const conflicts: string[] = [];
  const fields = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  for (const field of fields) {
    if (internalKeys.has(field) || field === "id") continue;
    const baseValue = base[field];
    const localValue = local[field];
    const remoteValue = remote[field];
    const localChanged = !same(baseValue, localValue);
    const remoteChanged = !same(baseValue, remoteValue);
    if (localChanged && remoteChanged && !same(localValue, remoteValue)) conflicts.push(field);
    else if (localChanged) merged[field] = localValue;
  }
  if (conflicts.length) return conflict(local, remote, newId);
  return {
    kind: "merged",
    record: {
      ...merged,
      revision: remote.revision + 1,
      updatedAt: local.updatedAt,
      outbox: { mutationId: newId(), operation: "upsert", queuedAt: local.updatedAt },
    },
  };
}

function mergeSettings(
  base: SyncRecord | null,
  local: SyncRecord,
  remote: SyncRecord,
  newId: () => string,
): MergeResult {
  const defaults = base ?? ({
    id: "settings",
    point: { symbolId: "pin", color: "#9974ff" },
    line: { color: "#9974ff", width: 3, dimensionKind: "horizontal", unit: "miles" },
    polygon: {
      outlineColor: "#9974ff", fillColor: "#9974ff", opacity: 0.25,
      dimensionKind: "area", areaUnit: "acres", perimeterUnit: "miles",
    },
  } as unknown as SyncRecord);
  const merged = { ...remote };
  let hasLocalChangesToMerge = false;
  for (const category of ["point", "line", "polygon"]) {
    const baseValues = asObject(defaults[category]);
    const localValues = asObject(local[category]);
    const remoteValues = asObject(remote[category]);
    const values = { ...remoteValues };
    for (const key of new Set([...Object.keys(baseValues), ...Object.keys(localValues)])) {
      if (!same(baseValues[key], localValues[key])) {
        values[key] = localValues[key];
        hasLocalChangesToMerge ||= !same(localValues[key], remoteValues[key]);
      }
    }
    merged[category] = values;
  }
  if (!hasLocalChangesToMerge) return { kind: "remote", record: remote };
  return {
    kind: "merged",
    record: {
      ...merged,
      revision: remote.revision + 1,
      updatedAt: local.updatedAt,
      outbox: { mutationId: newId(), operation: "upsert", queuedAt: local.updatedAt },
    },
  };
}

function conflict(local: SyncRecord, remote: SyncRecord, newId: () => string): MergeResult {
  const conflictCopy = queuedCopy(local, newId, local.updatedAt, `${String(local.name ?? "Item")} (conflict copy)`);
  return { kind: "conflict", record: remote, conflictCopy };
}

function queuedCopy(
  source: SyncRecord,
  newId: () => string,
  updatedAt: string,
  name = String(source.name ?? "Item"),
): SyncRecord {
  return {
    ...source,
    id: newId(),
    name,
    updatedAt,
    revision: 1,
    outbox: { mutationId: newId(), operation: "upsert", queuedAt: updatedAt },
  };
}

function hasLocalChanges(base: SyncRecord, local: SyncRecord): boolean {
  const fields = new Set([...Object.keys(base), ...Object.keys(local)]);
  for (const field of fields) {
    if (internalKeys.has(field) || field === "id") continue;
    if (!same(base[field], local[field])) return true;
  }
  return false;
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function same(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
