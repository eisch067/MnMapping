export type RecordKind = "item" | "folder" | "settings";

export interface SyncRecord {
  id: string;
  revision: number;
  updatedAt: string;
  outbox: { mutationId: string; operation: "upsert" | "delete"; queuedAt: string };
  [key: string]: unknown;
}

export interface RemoteChange {
  kind: RecordKind;
  id: string;
  revision: number;
  cursor: number;
  updatedAt: string;
  deletedAt: string | null;
  tombstone: boolean;
  record: Record<string, unknown> | null;
}

export interface SyncState {
  cursor: number;
  resetAt: string | null;
  migrationComplete: boolean;
  conflictCount?: number;
}

export interface SyncStorage {
  getState(): Promise<SyncState>;
  setState(state: SyncState): Promise<void>;
  pending(): Promise<Array<{ kind: RecordKind; record: SyncRecord; expectedRevision: number | null }>>;
  resolveFolderNameConflict(id: string): Promise<void>;
  acknowledge(kind: RecordKind, id: string, mutationId: string, revision: number, acceptedAt: string, sentRecord?: SyncRecord): Promise<void>;
  receive(changes: readonly RemoteChange[]): Promise<void>;
  purge(): Promise<void>;
  completeMigration(): Promise<void>;
}

export interface SyncResponse {
  ok?: boolean;
  replayed?: boolean;
  revision?: number;
  acceptedAt?: string;
  error?: string;
  actualRevision?: number | null;
  accountResetAt?: string | null;
  changes?: RemoteChange[];
  cursor?: number;
  resetAt?: string | null;
}

export type SyncStatus = "idle" | "syncing" | "paused" | "error";

export class SyncPausedError extends Error {
  constructor() {
    super("Sync paused");
    this.name = "SyncPausedError";
  }
}

export class SyncConflictError extends Error {
  constructor(readonly actualRevision: number | null) {
    super("Revision conflict.");
    this.name = "SyncConflictError";
  }
}

export async function resetAccountData(
  storage: SyncStorage,
  request: typeof fetch = fetch,
): Promise<void> {
  const result = await callApi(request, "/api/sync/reset", { method: "POST" });
  if (!result.ok || typeof result.resetAt !== "string") {
    throw new Error(result.error ?? "The account's synchronized data could not be deleted.");
  }
  await storage.purge();
  await storage.setState({ cursor: 0, resetAt: result.resetAt, migrationComplete: true, conflictCount: 0 });
}

export async function synchronize(
  storage: SyncStorage,
  request: typeof fetch = fetch,
): Promise<void> {
  let state = await storage.getState();
  if (await pullAll(storage, request, state)) return;

  for (let attempt = 0; attempt < 5; attempt++) {
    state = await storage.getState();
    try {
      await pushPending(storage, request, state.resetAt);
      const pending = await storage.pending();
      if (!state.migrationComplete && pending.length === 0) {
        await storage.completeMigration();
        state = { ...state, migrationComplete: true };
        await storage.setState(state);
      }
      if (await pullAll(storage, request, state)) return;
      if (!(await storage.pending()).length) return;
    } catch (error) {
      if (!(error instanceof SyncConflictError) || attempt === 4) throw error;
      if (await pullAll(storage, request, state)) return;
    }
  }
  throw new Error("Sync could not settle concurrent changes. Try again shortly.");
}

async function pullAll(storage: SyncStorage, request: typeof fetch, initial: SyncState): Promise<boolean> {
  let state = initial;
  let cursor = state.cursor;
  while (true) {
    const page = await callApi(request, `/api/sync?cursor=${cursor}`, { method: "GET" });
    const resetAt = page.resetAt ?? null;
    if (resetAt !== state.resetAt) {
      await storage.purge();
      await storage.setState({ cursor: 0, resetAt, migrationComplete: true });
      return true;
    }
    const changes = page.changes ?? [];
    if (changes.length) await storage.receive(changes);
    const nextCursor = page.cursor ?? cursor;
    state = { ...state, cursor: nextCursor };
    await storage.setState(state);
    if (!changes.length || nextCursor <= cursor) return false;
    cursor = nextCursor;
  }
}

async function pushPending(storage: SyncStorage, request: typeof fetch, resetAt: string | null) {
  for (const entry of await storage.pending()) {
    const mutation = {
      mutationId: entry.record.outbox.mutationId,
      kind: entry.kind,
      id: entry.record.id,
      expectedRevision: entry.expectedRevision,
      operation: entry.record.outbox.operation,
      accountResetAt: resetAt,
      ...(entry.record.outbox.operation === "upsert" ? { record: entry.record } : {}),
    };
    const result = await callApi(request, "/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mutation),
    });
    if (result.error === "D1 daily limit exceeded" || result.error?.toLowerCase().includes("daily limit")) {
      throw new SyncPausedError();
    }
    if (result.error === "Folder names must be unique." && entry.kind === "folder") {
      await storage.resolveFolderNameConflict(entry.record.id);
      return;
    }
    if (!result.ok || typeof result.revision !== "number" || !result.acceptedAt) {
      if (result.actualRevision !== undefined) throw new SyncConflictError(result.actualRevision);
      throw new Error(result.error ?? "Sync mutation was not acknowledged.");
    }
    await storage.acknowledge(entry.kind, entry.record.id, mutation.mutationId, result.revision, result.acceptedAt, entry.record);
  }
}

async function callApi(request: typeof fetch, path: string, init: RequestInit): Promise<SyncResponse> {
  const response = await request(path, { ...init, cache: "no-store" });
  let result: SyncResponse;
  try {
    result = await response.json() as SyncResponse;
  } catch {
    throw new Error(`Sync request failed (${response.status}).`);
  }
  const message = result.error?.toLowerCase() ?? "";
  if (response.status === 429 || response.status === 503 || message.includes("daily limit")) {
    throw new SyncPausedError();
  }
  if (!response.ok && response.status !== 409) {
    throw new Error(result.error ?? `Sync request failed (${response.status}).`);
  }
  return result;
}
