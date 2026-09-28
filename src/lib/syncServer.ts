import { createRemoteJWKSet, jwtVerify } from "jose";

export type RecordKind = "item" | "folder" | "settings";
interface D1Result<T = unknown> { success: boolean; meta: { changes: number }; results?: T[] }
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
export interface SyncDatabase {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result[]>;
}
export interface SyncEnv {
  DB: SyncDatabase;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
}
export interface Mutation {
  mutationId: string;
  kind: RecordKind;
  id: string;
  expectedRevision: number | null;
  operation: "upsert" | "delete";
  record?: Record<string, unknown>;
}
interface StoredRecord {
  kind: RecordKind;
  id: string;
  revision: number;
  cursor: number;
  updated_at: string;
  deleted_at: string | null;
  tombstone: number;
  record_json: string | null;
}

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const maxJsonBytes = 512_000;
const maxPullLimit = 100;

export async function verifyAccessToken(request: Request, env: SyncEnv): Promise<string | null> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  try {
    const issuer = `https://${env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
    let keys = keySets.get(issuer);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
      keySets.set(issuer, keys);
    }
    const { payload } = await jwtVerify(token, keys, { issuer, audience: env.ACCESS_AUD, algorithms: ["RS256"] });
    return typeof payload.sub === "string" && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function pushMutation(db: SyncDatabase, owner: string, mutation: Mutation, now: Date): Promise<Response> {
  if (!validMutation(mutation)) return json({ error: "Invalid mutation." }, 400);
  const prior = await db.prepare("SELECT 1 FROM sync_mutations WHERE owner = ? AND mutation_id = ?")
    .bind(owner, mutation.mutationId).first();
  if (prior) return json({ ok: true, replayed: true });

  const current = await db.prepare(
    "SELECT revision, record_json, name_key FROM sync_records WHERE owner = ? AND kind = ? AND id = ?",
  ).bind(owner, mutation.kind, mutation.id).first<{ revision: number; record_json: string | null; name_key: string | null }>();
  const actualRevision = current?.revision ?? null;
  if (actualRevision !== mutation.expectedRevision || (current && current.record_json === null)) {
    return json({ error: "Revision conflict.", expectedRevision: mutation.expectedRevision, actualRevision }, 409);
  }

  const acceptedAt = now.toISOString();
  const revision = (actualRevision ?? 0) + 1;
  const previousRecord = current?.record_json ? JSON.parse(current.record_json) as Record<string, unknown> : {};
  const incoming = mutation.record ?? {};
  const cleanRecord = Object.fromEntries(Object.entries(incoming).filter(([key]) => key !== "deletion"));
  const record = mutation.operation === "delete"
    ? { ...previousRecord, revision, updatedAt: acceptedAt, deletion: { deletedAt: acceptedAt } }
    : { ...cleanRecord, schemaVersion: 2, ...(mutation.kind === "folder" ? { name: String(incoming.name).trim() } : {}), revision, updatedAt: acceptedAt };
  const deletedAt = mutation.operation === "delete" ? acceptedAt : null;
  const nameKey = mutation.operation === "delete" ? current?.name_key ?? null
    : mutation.kind === "folder" ? normalizeName(String(incoming.name)) : null;
  const insertedMutation = db.prepare(`INSERT INTO sync_mutations (owner, mutation_id, applied_at)
    SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM sync_mutations WHERE owner = ? AND mutation_id = ?)
    AND ((? IS NULL AND NOT EXISTS (SELECT 1 FROM sync_records WHERE owner = ? AND kind = ? AND id = ?))
      OR EXISTS (SELECT 1 FROM sync_records WHERE owner = ? AND kind = ? AND id = ? AND revision = ?))`)
    .bind(owner, mutation.mutationId, acceptedAt, owner, mutation.mutationId,
      mutation.expectedRevision, owner, mutation.kind, mutation.id, owner, mutation.kind, mutation.id, mutation.expectedRevision);
  const upsertRecord = db.prepare(`INSERT INTO sync_records
    (owner, kind, id, revision, cursor, updated_at, deleted_at, tombstone, record_json, name_key)
    SELECT ?, ?, ?, ?, (SELECT COALESCE(MAX(cursor), 0) + 1 FROM sync_records WHERE owner = ?), ?, ?, 0, ?, ?
    WHERE changes() = 1
    ON CONFLICT(owner, kind, id) DO UPDATE SET revision=excluded.revision, cursor=excluded.cursor,
    updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, tombstone=0, record_json=excluded.record_json,
    name_key=excluded.name_key`)
    .bind(owner, mutation.kind, mutation.id, revision, owner, acceptedAt, deletedAt, JSON.stringify(record), nameKey);
  let batch: D1Result[];
  try {
    batch = await db.batch([insertedMutation, upsertRecord]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return json({ error: "Folder names must be unique." }, 409);
    }
    throw error;
  }
  if (batch.some((result) => !result.success)) return json({ error: "Mutation could not be stored." }, 500);
  if (batch[0]?.meta.changes === 0) {
    const replay = await db.prepare("SELECT 1 FROM sync_mutations WHERE owner = ? AND mutation_id = ?")
      .bind(owner, mutation.mutationId).first();
    if (replay) return json({ ok: true, replayed: true });
    const latest = await db.prepare("SELECT revision FROM sync_records WHERE owner = ? AND kind = ? AND id = ?")
      .bind(owner, mutation.kind, mutation.id).first<{ revision: number }>();
    return json({ error: "Revision conflict.", expectedRevision: mutation.expectedRevision, actualRevision: latest?.revision ?? null }, 409);
  }
  return json({ ok: true, replayed: false, revision, acceptedAt });
}

export async function pullChanges(db: SyncDatabase, owner: string, cursor: number, requestedLimit: number) {
  const limit = Math.min(Math.max(1, requestedLimit), maxPullLimit);
  const rows = await db.prepare(`SELECT kind, id, revision, cursor, updated_at, deleted_at, tombstone, record_json
    FROM sync_records WHERE owner = ? AND cursor > ? ORDER BY cursor LIMIT ?`)
    .bind(owner, cursor, limit).all<StoredRecord>();
  const state = await db.prepare("SELECT reset_at FROM sync_account_state WHERE owner = ?").bind(owner).first<{ reset_at: string }>();
  return json({
    changes: (rows.results ?? []).map((row) => ({
      kind: row.kind,
      id: row.id,
      revision: row.revision,
      cursor: row.cursor,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      tombstone: row.tombstone === 1,
      record: row.record_json === null ? null : JSON.parse(row.record_json) as Record<string, unknown>,
    })),
    cursor: (rows.results ?? []).at(-1)?.cursor ?? cursor,
    resetAt: state?.reset_at ?? null,
  });
}

export async function deleteAccount(db: SyncDatabase, owner: string, now: Date): Promise<Response> {
  const resetAt = now.toISOString();
  const results = await db.batch([
    db.prepare("DELETE FROM sync_records WHERE owner = ?").bind(owner),
    db.prepare("DELETE FROM sync_mutations WHERE owner = ?").bind(owner),
    db.prepare(`INSERT INTO sync_account_state (owner, reset_at) VALUES (?, ?)
      ON CONFLICT(owner) DO UPDATE SET reset_at=excluded.reset_at`).bind(owner, resetAt),
  ]);
  if (results.some((result) => !result.success)) return json({ error: "Account data could not be deleted." }, 500);
  return json({ ok: true, resetAt });
}

export async function purgeExpired(db: SyncDatabase, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = await db.prepare(`WITH expired AS MATERIALIZED (
      SELECT owner, kind, id, ROW_NUMBER() OVER (PARTITION BY owner ORDER BY cursor, kind, id) AS position
      FROM sync_records WHERE deleted_at IS NOT NULL AND deleted_at <= ? AND tombstone = 0
    ), maxes AS MATERIALIZED (
      SELECT owner, MAX(cursor) AS cursor FROM sync_records GROUP BY owner
    )
    UPDATE sync_records SET tombstone=1, record_json=NULL, revision=revision+1, updated_at=?,
      cursor=(SELECT maxes.cursor + expired.position FROM expired JOIN maxes USING(owner)
        WHERE expired.owner=sync_records.owner AND expired.kind=sync_records.kind AND expired.id=sync_records.id)
    WHERE EXISTS (SELECT 1 FROM expired WHERE expired.owner=sync_records.owner
      AND expired.kind=sync_records.kind AND expired.id=sync_records.id)`)
    .bind(cutoff, now.toISOString()).run();
  return result.meta.changes;
}

export function validMutation(value: unknown): value is Mutation {
  if (!value || typeof value !== "object") return false;
  const mutation = value as Partial<Mutation>;
  if (typeof mutation.mutationId !== "string" || !mutation.mutationId || mutation.mutationId.length > 128) return false;
  if (!(mutation.kind === "item" || mutation.kind === "folder" || mutation.kind === "settings")) return false;
  if (typeof mutation.id !== "string" || !mutation.id || mutation.id.length > 128) return false;
  if (!(mutation.expectedRevision === null || (typeof mutation.expectedRevision === "number" && Number.isSafeInteger(mutation.expectedRevision) && mutation.expectedRevision >= 1))) return false;
  if (!(mutation.operation === "upsert" || mutation.operation === "delete")) return false;
  if (mutation.operation === "upsert" && (!mutation.record || typeof mutation.record !== "object" || Array.isArray(mutation.record))) return false;
  if (mutation.record && ("owner" in mutation.record || "sub" in mutation.record)) return false;
  if (mutation.operation === "upsert" && (mutation.record?.id !== mutation.id || mutation.record.schemaVersion !== 2)) return false;
  if (mutation.kind === "folder" && mutation.operation === "upsert"
      && (typeof mutation.record?.name !== "string" || !mutation.record.name.trim())) return false;
  if (mutation.kind === "settings" && mutation.id !== "settings") return false;
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength <= maxJsonBytes;
  } catch {
    return false;
  }
}

function normalizeName(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
