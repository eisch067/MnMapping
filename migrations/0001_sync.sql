CREATE TABLE sync_records (
  owner TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('item', 'folder', 'settings')),
  id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  tombstone INTEGER NOT NULL DEFAULT 0 CHECK (tombstone IN (0, 1)),
  record_json TEXT,
  name_key TEXT,
  PRIMARY KEY (owner, kind, id)
) WITHOUT ROWID;
CREATE INDEX sync_records_owner_cursor ON sync_records(owner, cursor);
CREATE INDEX sync_records_purge ON sync_records(deleted_at) WHERE deleted_at IS NOT NULL AND tombstone = 0;
CREATE UNIQUE INDEX sync_folders_owner_name ON sync_records(owner, name_key)
  WHERE kind = 'folder' AND deleted_at IS NULL AND name_key IS NOT NULL;

CREATE TABLE sync_mutations (
  owner TEXT NOT NULL,
  mutation_id TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  PRIMARY KEY (owner, mutation_id)
) WITHOUT ROWID;

CREATE TABLE sync_account_state (
  owner TEXT PRIMARY KEY,
  reset_at TEXT NOT NULL
) WITHOUT ROWID;
