"use client";

import { useState, type ChangeEvent } from "react";
import type { RestoreResultState } from "./useExchange";

export interface BackupSheetProps {
  restoreResult: RestoreResultState | null;
  onArchive: () => Promise<void>;
  onRestore: (file: File) => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

function DeleteAllFlow(props: Pick<BackupSheetProps, "onArchive" | "onDeleteAll">) {
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  if (!open) {
    return (
      <button className="delete-folder" type="button" onClick={() => setOpen(true)}>
        Delete all my data…
      </button>
    );
  }
  const cancel = () => {
    setOpen(false);
    setUnderstood(false);
  };
  const confirm = async () => {
    await props.onDeleteAll();
    cancel();
  };
  return (
    <div className="delete-all" role="group" aria-label="Delete all my data">
      <p>
        This removes every item, folder, setting, and everything in Trash from this browser.
        Download an archive first if you might want any of it back.
      </p>
      <button type="button" onClick={() => void props.onArchive()}>
        Download an archive first
      </button>
      <label className="my-data-visibility">
        <input
          type="checkbox"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
        />
        I understand this cannot be undone.
      </label>
      <div className="tool-buttons">
        <button
          className="delete-folder"
          type="button"
          disabled={!understood}
          onClick={() => void confirm()}
        >
          Delete everything
        </button>
        <button type="button" onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function BackupSheet(props: BackupSheetProps) {
  const restoreSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void props.onRestore(file);
  };
  return (
    <div className="exchange-sheet">
      <div>
        <h3>Archive My Data</h3>
        <p className="sheet-hint">
          A complete copy of your items, folders, settings, and Trash. Only Restore can read it; use
          Export to share with other programs.
        </p>
        <button type="button" onClick={() => void props.onArchive()}>
          Download archive
        </button>
      </div>
      <div>
        <h3>Restore from an archive</h3>
        <p className="sheet-hint">
          Adds anything missing. Items already here are never changed or replaced.
        </p>
        <label className="file-import">
          Restore from archive
          <input type="file" accept=".json,application/json" onChange={restoreSelected} />
        </label>
        {props.restoreResult?.status === "refused" && (
          <p role="alert" className="my-data-error">
            {props.restoreResult.message}
          </p>
        )}
        {props.restoreResult?.status === "restored" && (
          <ul aria-label="Restore result">
            {props.restoreResult.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3>Delete all</h3>
        <DeleteAllFlow onArchive={props.onArchive} onDeleteAll={props.onDeleteAll} />
      </div>
    </div>
  );
}
