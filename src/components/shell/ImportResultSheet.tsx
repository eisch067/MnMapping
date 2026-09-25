"use client";

import { useState } from "react";
import { describeWarnings } from "@/lib/exchange/summaries";
import type { ImportResultState } from "./useExchange";

export interface ImportResultSheetProps {
  result: ImportResultState | null;
  onShowOnMap: () => void;
  onUndo: () => Promise<void>;
}

const rejectedPreviewCount = 20;

function RejectedList({ rejected }: { rejected: readonly { name: string; reason: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  if (rejected.length === 0) return null;
  const shown = expanded ? rejected : rejected.slice(0, rejectedPreviewCount);
  return (
    <div>
      <h3>Not imported ({rejected.length})</h3>
      <ul className="exchange-rejected">
        {shown.map((entry, index) => (
          <li key={`${entry.name}-${index}`}><strong>{entry.name}</strong> {entry.reason}</li>
        ))}
      </ul>
      {rejected.length > rejectedPreviewCount && (
        <button type="button" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${rejected.length}`}
        </button>
      )}
    </div>
  );
}

function pluralize(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function ImportResultSheet({ result, onShowOnMap, onUndo }: ImportResultSheetProps) {
  if (!result) return <p className="sheet-hint">Import a GPX, KML, or GeoJSON file from My Data.</p>;
  if (result.status === "refused") {
    return (
      <div className="exchange-sheet">
        <p role="alert" className="my-data-error">{result.message}</p>
        <p className="sheet-hint">{result.filename}: nothing was imported and no folder was created.</p>
      </div>
    );
  }
  const warnings = describeWarnings(result.report.warnings);
  if (result.status === "nothing") {
    return (
      <div className="exchange-sheet">
        <p role="alert" className="my-data-error">
          {result.filename} has no items that can be imported, so no folder was created.
        </p>
        {warnings.length > 0 && <ul>{warnings.map((line) => <li key={line}>{line}</li>)}</ul>}
        <RejectedList rejected={result.report.rejected} />
      </div>
    );
  }
  const { counts } = result;
  return (
    <div className="exchange-sheet">
      <p className="exchange-scope">Imported into {result.folder.name}</p>
      <p>
        {pluralize(counts.pins, "pin", "pins")}, {pluralize(counts.lines, "line", "lines")}, {pluralize(counts.areas, "area", "areas")}
      </p>
      {warnings.length > 0 && (
        <div>
          <h3>Changed on the way in</h3>
          <ul>{warnings.map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      )}
      <RejectedList rejected={result.report.rejected} />
      {result.undone ? (
        <p className="sheet-hint">Moved to Trash. You can restore it from Trash for 30 days.</p>
      ) : (
        <div className="tool-buttons">
          <button type="button" onClick={onShowOnMap}>Show on map</button>
          <button type="button" onClick={() => void onUndo()}>Undo import</button>
        </div>
      )}
    </div>
  );
}
