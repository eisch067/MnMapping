import { createRemoteJWKSet, importJWK, jwtVerify } from "jose";

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
  SYNC_TEST_PUBLIC_JWK?: string;
}
export interface Mutation {
  mutationId: string;
  kind: RecordKind;
  id: string;
  expectedRevision: number | null;
  operation: "upsert" | "delete";
  accountResetAt: string | null;
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

type AccessRejectionReason =
  | "header_missing"
  | "settings_missing"
  | "issuer_mismatch"
  | "audience_mismatch"
  | "signature_or_expiry_failure";

function logAccessRejection(reason: AccessRejectionReason): null {
  console.warn("Sync authentication rejected", { reason });
  return null;
}

function unauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}

export async function authorizeSyncRequest(request: Request, env: SyncEnv): Promise<string | Response> {
  const owner = await verifyAccessToken(request, env);
  return owner ?? unauthorizedResponse();
}

function tokenFailureReason(error: unknown): AccessRejectionReason {
  if (error && typeof error === "object" && "code" in error && error.code === "ERR_JWT_CLAIM_VALIDATION_FAILED" && "claim" in error) {
    if (error.claim === "iss") return "issuer_mismatch";
    if (error.claim === "aud") return "audience_mismatch";
  }
  return "signature_or_expiry_failure";
}

export async function verifyAccessToken(request: Request, env: SyncEnv): Promise<string | null> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return logAccessRejection("header_missing");
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return logAccessRejection("settings_missing");
  try {
    const issuer = `https://${env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
    const hostname = new URL(request.url).hostname;
    // Playwright supplies an ephemeral key only to the local Wrangler process.
    if (env.SYNC_TEST_PUBLIC_JWK && ["localhost", "127.0.0.1", "::1"].includes(hostname)) {
      const jwk = JSON.parse(atob(env.SYNC_TEST_PUBLIC_JWK)) as JsonWebKey;
      const { payload } = await jwtVerify(token, await importJWK(jwk, "RS256"), {
        issuer,
        audience: env.ACCESS_AUD,
        algorithms: ["RS256"],
      });
      return typeof payload.sub === "string" && payload.sub.length > 0
        ? payload.sub
        : logAccessRejection("signature_or_expiry_failure");
    }
    let keys = keySets.get(issuer);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
      keySets.set(issuer, keys);
    }
    const { payload } = await jwtVerify(token, keys, { issuer, audience: env.ACCESS_AUD, algorithms: ["RS256"] });
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : logAccessRejection("signature_or_expiry_failure");
  } catch (error) {
    return logAccessRejection(tokenFailureReason(error));
  }
}

export async function pushMutation(db: SyncDatabase, owner: string, mutation: Mutation, now: Date): Promise<Response> {
  try {
    return await pushMutationInternal(db, owner, mutation, now);
  } catch (error) {
    const paused = dailyLimitResponse(error);
    if (paused) return paused;
    throw error;
  }
}

async function pushMutationInternal(db: SyncDatabase, owner: string, mutation: Mutation, now: Date): Promise<Response> {
  if (!validMutation(mutation)) return json({ error: "Invalid mutation." }, 400);
  const accountState = await db.prepare("SELECT reset_at FROM sync_account_state WHERE owner = ?")
    .bind(owner).first<{ reset_at: string }>();
  const accountResetAt = accountState?.reset_at ?? null;
  if (mutation.accountResetAt !== accountResetAt) {
    return json({ error: "Account reset state changed; pull before pushing.", accountResetAt }, 409);
  }
  const prior = await db.prepare("SELECT applied_at, revision FROM sync_mutations WHERE owner = ? AND mutation_id = ?")
    .bind(owner, mutation.mutationId).first<{ applied_at: string; revision: number }>();
  if (prior) {
    return json({
      ok: true,
      replayed: true,
      revision: prior.revision,
      acceptedAt: prior.applied_at,
    });
  }

  const current = await db.prepare(
    "SELECT revision, record_json, name_key FROM sync_records WHERE owner = ? AND kind = ? AND id = ?",
  ).bind(owner, mutation.kind, mutation.id).first<CurrentRecord>();
  const actualRevision = current?.revision ?? null;
  if (actualRevision !== mutation.expectedRevision || (current && current.record_json === null)) {
    return json({ error: "Revision conflict.", expectedRevision: mutation.expectedRevision, actualRevision }, 409);
  }
  return persistMutation(db, owner, mutation, now, current, actualRevision);
}

interface CurrentRecord {
  revision: number;
  record_json: string | null;
  name_key: string | null;
}

async function persistMutation(
  db: SyncDatabase,
  owner: string,
  mutation: Mutation,
  now: Date,
  current: CurrentRecord | null,
  actualRevision: number | null,
): Promise<Response> {
  const acceptedAt = now.toISOString();
  const revision = (actualRevision ?? 0) + 1;
  const record = buildServerRecord(mutation, current, revision, acceptedAt);
  const deletedAt = mutation.operation === "delete" ? acceptedAt : null;
  const nameKey = folderNameKey(mutation, current);
  const insertedMutation = db.prepare(`INSERT INTO sync_mutations (owner, mutation_id, applied_at, revision)
    SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM sync_mutations WHERE owner = ? AND mutation_id = ?)
    AND ((? IS NULL AND NOT EXISTS (SELECT 1 FROM sync_records WHERE owner = ? AND kind = ? AND id = ?))
      OR EXISTS (SELECT 1 FROM sync_records WHERE owner = ? AND kind = ? AND id = ? AND revision = ?))
    AND COALESCE((SELECT reset_at FROM sync_account_state WHERE owner = ?), '') = COALESCE(?, '')`)
    .bind(owner, mutation.mutationId, acceptedAt, revision, owner, mutation.mutationId,
      mutation.expectedRevision, owner, mutation.kind, mutation.id, owner, mutation.kind, mutation.id,
      mutation.expectedRevision, owner, mutation.accountResetAt);
  const upsertRecord = db.prepare(`INSERT INTO sync_records
    (owner, kind, id, revision, cursor, updated_at, deleted_at, tombstone, record_json, name_key)
    SELECT ?, ?, ?, ?, (SELECT COALESCE(MAX(cursor), 0) + 1 FROM sync_records WHERE owner = ?), ?, ?, 0, ?, ?
    WHERE changes() = 1
    ON CONFLICT(owner, kind, id) DO UPDATE SET revision=excluded.revision, cursor=excluded.cursor,
    updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, tombstone=0, record_json=excluded.record_json,
    name_key=excluded.name_key`)
    .bind(owner, mutation.kind, mutation.id, revision, owner, acceptedAt, deletedAt, JSON.stringify(record), nameKey);
  const batch = await persistBatch(db, insertedMutation, upsertRecord);
  if (batch instanceof Response) return batch;
  if (batch[0]?.meta.changes === 0) return resolveUnappliedMutation(db, owner, mutation);
  return json({ ok: true, replayed: false, revision, acceptedAt });
}

async function persistBatch(db: SyncDatabase, ...statements: D1Statement[]): Promise<D1Result[] | Response> {
  try {
    const results = await db.batch(statements);
    return results.some((result) => !result.success)
      ? json({ error: "Mutation could not be stored." }, 500)
      : results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE constraint failed")) return json({ error: "Folder names must be unique." }, 409);
    const paused = dailyLimitResponse(error);
    if (paused) return paused;
    throw error;
  }
}

async function resolveUnappliedMutation(db: SyncDatabase, owner: string, mutation: Mutation): Promise<Response> {
  const replay = await db.prepare("SELECT applied_at, revision FROM sync_mutations WHERE owner = ? AND mutation_id = ?")
    .bind(owner, mutation.mutationId).first<{ applied_at: string; revision: number }>();
  if (replay) {
    return json({ ok: true, replayed: true, revision: replay.revision, acceptedAt: replay.applied_at });
  }
  const latest = await db.prepare("SELECT revision FROM sync_records WHERE owner = ? AND kind = ? AND id = ?")
    .bind(owner, mutation.kind, mutation.id).first<{ revision: number }>();
  return json({ error: "Revision conflict.", expectedRevision: mutation.expectedRevision, actualRevision: latest?.revision ?? null }, 409);
}

function buildServerRecord(
  mutation: Mutation,
  current: CurrentRecord | null,
  revision: number,
  acceptedAt: string,
): Record<string, unknown> {
  const previous = current?.record_json ? JSON.parse(current.record_json) as Record<string, unknown> : {};
  const incoming = mutation.record ?? {};
  if (mutation.operation === "delete") {
    return { ...previous, revision, updatedAt: acceptedAt, deletion: { deletedAt: acceptedAt } };
  }
  const active = Object.fromEntries(Object.entries(incoming).filter(([key]) => key !== "deletion"));
  return {
    ...active,
    schemaVersion: 2,
    ...(mutation.kind === "folder" ? { name: String(incoming.name).trim() } : {}),
    revision,
    updatedAt: acceptedAt,
  };
}

function folderNameKey(mutation: Mutation, current: CurrentRecord | null): string | null {
  if (mutation.operation === "delete") return current?.name_key ?? null;
  if (mutation.kind !== "folder") return null;
  return normalizeName(String(mutation.record?.name));
}

export async function pullChanges(db: SyncDatabase, owner: string, cursor: number, requestedLimit: number) {
  try {
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
  } catch (error) {
    const paused = dailyLimitResponse(error);
    if (paused) return paused;
    throw error;
  }
}

export async function deleteAccount(db: SyncDatabase, owner: string, now: Date): Promise<Response> {
  const resetAt = `${now.toISOString()}#${crypto.randomUUID()}`;
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
  if (!isRecord(value)) return false;
  const mutation = value as Partial<Mutation>;
  if (!validMutationHeader(mutation) || !validMutationRecord(mutation)) return false;
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength <= maxJsonBytes;
  } catch {
    return false;
  }
}

function validMutationHeader(mutation: Partial<Mutation>): boolean {
  return isValidId(mutation.mutationId)
    && isRecordKind(mutation.kind)
    && isValidId(mutation.id)
    && validExpectedRevision(mutation.expectedRevision)
    && isMutationOperation(mutation.operation)
    && validResetMarker(mutation.accountResetAt);
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function isRecordKind(value: unknown): value is RecordKind {
  return value === "item" || value === "folder" || value === "settings";
}

function isMutationOperation(value: unknown): value is Mutation["operation"] {
  return value === "upsert" || value === "delete";
}

function validResetMarker(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.length <= 128);
}

function validExpectedRevision(revision: unknown): revision is number | null {
  return revision === null || (typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 1);
}

function validMutationRecord(mutation: Partial<Mutation>): boolean {
  if (mutation.operation !== "upsert") return true;
  if (!isRecord(mutation.record)) return false;
  if ("owner" in mutation.record || "sub" in mutation.record) return false;
  if (mutation.record.id !== mutation.id || mutation.record.schemaVersion !== 2) return false;
  return validRecordForKind(mutation);
}

function validRecordForKind(mutation: Partial<Mutation>): boolean {
  if (mutation.kind === "folder") {
    return typeof mutation.record?.name === "string" && mutation.record.name.trim().length > 0;
  }
  if (mutation.kind === "settings") return mutation.id === "settings";
  return mutation.kind === "item";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeName(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

function dailyLimitResponse(error: unknown): Response | null {
  const message = error instanceof Error ? error.message : String(error);
  return /daily.*limit/i.test(message)
    ? json({ error: "D1 daily limit exceeded; sync is paused until the limit resets." }, 503)
    : null;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
