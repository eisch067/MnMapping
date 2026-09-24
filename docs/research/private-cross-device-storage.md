# Private cross-device storage architecture

Research for [Choose the private cross-device storage architecture](https://github.com/eisch067/MnMapping/issues/2).

## Decision

Use the existing personal Cloudflare Worker as a same-origin synchronization API, a **single Cloudflare D1 database** as the private server-side store, and IndexedDB as the local working copy and durable offline outbox. Continue using Cloudflare Access as the only sign-in system.

This is an appropriate fit for at most 50 invited users because D1 is a managed SQLite-compatible database available on both Workers Free and Paid plans, binds directly to a Worker, and scales to zero. Its Free allowance is currently 5 million rows read per day, 100,000 rows written per day, and 5 GB total storage; queries fail until the next daily reset if a Free allowance is exceeded. D1 has no egress charge. These limits should be monitored, not treated as a permanent capacity promise. [Cloudflare D1 overview](https://developers.cloudflare.com/d1/) · [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

Do not create one D1 database per user. The Free plan currently permits only 10 databases, while this program may have 50 users. One database with an owner key on every private row is simpler and remains well inside the stated storage envelope for ordinary vector markups. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

## Identity and API boundary

Expose synchronization only through same-origin routes on the **personal** deployment, for example `/api/my-data/sync`, `/api/my-data/export`, and `/api/my-data/account`. The public deployment must not receive a D1 binding for personal data and should return `404` for these routes.

For every request, validate the `Cf-Access-Jwt-Assertion` signature against the Access JWKS and verify its issuer and application audience. Cloudflare explicitly says that a Worker behind Access still needs to validate this JWT and that trusting a header alone is insufficient. Use the verified `sub` claim as `owner_id`; Cloudflare defines it as the user ID unique to an email address within the Zero Trust account. Retain the verified email only as mutable display/recovery metadata. Never accept an owner ID from a request body or query string. [Validate Access JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) · [Access application-token claims](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/)

Keeping the API on the same protected hostname avoids a second authentication flow and cross-origin cookie complications. Access checks the `CF_Authorization` cookie before requests reach the application; an expired session redirects the user through Access again, but it does not erase IndexedDB or D1. [Access authorization cookie](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/) · [Access session management](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/)

Additional boundary requirements:

- Deny missing, invalid, expired, wrong-issuer, wrong-audience, service-token, or empty-`sub` tokens.
- Derive `owner_id` server-side and include it in every `SELECT`, `UPDATE`, and `DELETE` predicate. Use composite indexes beginning with `owner_id` so isolation is also the efficient query path.
- Accept only same-origin JSON requests, a small explicit method set, schema-validated geometry and metadata, bounded batches, and bounded payload sizes. Do not enable permissive CORS.
- Bind D1 only to server code; no database credential or administrative endpoint belongs in the browser.
- Keep audit metadata (`created_at`, `updated_at`, mutation/device ID) but do not log geometry or notes.

## Data model

Use stable client-generated UUIDs so offline objects can be created before the server is reachable.

Suggested logical tables:

- `users(owner_id, email, created_at, last_seen_at, erase_requested_at, reset_generation)`
- `folders(owner_id, id, name, version, created_at, updated_at, deleted_at)`
- `items(owner_id, id, folder_id, kind, name, note, symbol, geometry_json, settings_json, version, created_at, updated_at, deleted_at)`
- `preferences(owner_id, version, value_json, updated_at)` for synchronized measurement and primary-dimension preferences
- `mutations(owner_id, mutation_id, accepted_at)` for idempotent retry
- `changes(sequence, owner_id, entity_kind, entity_id, version, changed_at)` for cursor-based pulls

`folder_id = NULL` means the automatic **Unfiled** folder; it does not need a mutable database row. One item belongs to at most one folder. Imported parsed objects—not original uploaded blobs—are assigned to a new folder named from local import date and time, such as `Imported 2026-09-23 20-41-06`, with collision-safe suffixing.

All writes that update an entity, record an idempotency key, and append its change record should be submitted as a D1 batch. Cloudflare documents that batched statements execute sequentially as a transaction and roll back the sequence if a statement fails. [D1 Worker binding and `batch()`](https://developers.cloudflare.com/d1/worker-api/d1-database/)

## Synchronization contract

1. The UI reads and writes IndexedDB immediately. Every local mutation also enters an IndexedDB outbox with a stable `mutation_id`, the entity's last known `base_version`, and a device ID.
2. When online and authenticated, the client pushes bounded mutation batches. The server treats a repeated `mutation_id` as success without applying it twice.
3. A write succeeds only when `base_version` matches the current server version (or the entity is genuinely new). D1 assigns the next integer version and server timestamp.
4. A stale write returns the current server entity as a conflict. Preserve both user edits: keep the server version at its original location and save the rejected local version as a clearly named conflict copy in Unfiled. Do not use client wall-clock time as an automatic last-writer-wins authority.
5. The client pulls changes after its opaque cursor, including deletion tombstones, applies them to IndexedDB, and stores the returned cursor only after the local transaction commits.
6. Report `Saved`, `Syncing`, `Offline`, `Sign in again`, or `Conflict needs review` in the UI. Retry transient failures with backoff; never discard an outbox entry before acknowledgement.

Indexes should at minimum cover `(owner_id, id)`, `(owner_id, folder_id, deleted_at)`, and `(owner_id, sequence)`. Cloudflare bills D1 by rows scanned/written and recommends indexes to avoid full scans. [D1 indexing guidance](https://developers.cloudflare.com/d1/best-practices/use-indexes/)

## Trash, deletion, and recovery

Deleting an item or folder is a synchronized soft delete (`deleted_at`) for 30 days. Folder deletion offers:

- default: move its live contents to Unfiled, then trash the empty folder;
- explicit: trash the folder and all its contents in one transaction.

After 30 days, purge the recoverable payload but retain a minimal tombstone containing owner, entity ID, version, and deletion generation. This prevents a device that was offline longer than 30 days from resurrecting deleted content. A complete account erasure removes payloads after its 30-day recovery window and advances `reset_generation`; stale clients must clear/quarantine their old outbox before starting a new dataset.

D1 Time Travel is disaster recovery, not the product's Trash feature: it restores a database as a whole and retains history for 7 days on Workers Free or 30 days on Workers Paid. User-visible recovery therefore requires the application-level soft-delete design above. [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

## Existing IndexedDB migration

Run a one-time merge after verified sign-in:

1. Upgrade the local schema without clearing the existing `mnmapping-local-data/items` store.
2. Read existing items, preserve their IDs, and add missing sync metadata locally.
3. Pull the user's server state first, then enqueue local items absent from that state.
4. Resolve the improbable same-ID/different-content case through the normal conflict-copy rule.
5. Mark migration complete only after every item is acknowledged and a verification pull succeeds. Keep the local copy throughout.

This makes migration retryable after a crash or Access-session expiry.

## Exports and backups

Provide selected-item, folder, and all-data export from the local canonical copy in GPX, KML, and GeoJSON. Export is a portability feature, not the synchronization mechanism. “Delete my synchronized data” should require explicit confirmation, enter the 30-day recovery state, then permanently erase private content.

Operationally, monitor D1 row/storage metrics and test database restore procedures. D1 Time Travel is always on for supported databases, but the application should still periodically export a recovery snapshot if recovery beyond the plan's Time Travel window matters. [D1 metrics and analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/) · [D1 Time Travel and R2 export](https://developers.cloudflare.com/d1/reference/time-travel/)

## Alternatives considered

- **Workers KV:** useful for read-heavy key/value configuration, but a relational D1 schema better supports per-owner listing, folder membership, revision checks, tombstones, and transactional mutation/change records.
- **One Durable Object per user:** would serialize each user's writes, but adds routing and storage complexity that is unnecessary for this small workload. D1 already provides transactional batches and a simpler query/export surface.
- **Supabase or another backend:** viable, but adds another service and either a second login or custom Access-token integration. It does not improve the requested <=50-user deployment enough to offset that operational cost.
- **Cloud-only replacement for IndexedDB:** rejected because it would make offline/mobile edits fragile and turn Access expiry into a hard interruption. IndexedDB remains the immediate store; D1 supplies durability across browsers and devices.

## Implementation handoff

Before implementation, confirm the personal Access team domain and application AUD tag, create one D1 database and binding for only the personal Worker, and decide whether to remain on Workers Free after measuring realistic sync traffic. No new user-facing authentication system is required.
