"use client";

import { useState } from "react";
import type { IdentifyLake, IdentifyResult } from "@/lib/identify/types";
import { LinkList, RowList } from "./IdentifyParts";
import { LakeSummary } from "./LakeSummary";
import type { IdentifyState } from "./useIdentify";

export interface IdentifySheetProps {
  state: IdentifyState;
  onSelect: (id: string | null) => void;
  onClear: () => void;
}

type CopyStatus = "idle" | "copied" | "failed";

function CoordinateBar({ coordinates, onClear }: { coordinates: string; onClear: () => void }) {
  const [copy, setCopy] = useState<CopyStatus>("idle");
  const copyCoordinates = () => {
    navigator.clipboard.writeText(coordinates).then(
      () => setCopy("copied"),
      () => setCopy("failed"),
    );
  };
  return (
    <div className="identify-point">
      <span className="identify-coordinates">{coordinates}</span>
      <div className="identify-actions">
        <button type="button" onClick={copyCoordinates}>
          Copy coordinates
        </button>
        <button type="button" onClick={onClear}>
          Clear
        </button>
      </div>
      {copy === "copied" && <span role="status">Copied</span>}
      {copy === "failed" && (
        <span role="alert">Copy is blocked here. Select the coordinates to copy them.</span>
      )}
    </div>
  );
}

function resultKind(result: IdentifyResult): string {
  return result.detailLabel ? `${result.sourceName} · ${result.detailLabel}` : result.sourceName;
}

function ResultList({ state, onSelect }: Pick<IdentifySheetProps, "state" | "onSelect">) {
  const { status, results, failures } = state;
  if (status === "loading") {
    return (
      <p role="status" className="sheet-hint">
        Checking the visible layers…
      </p>
    );
  }
  return (
    <div className="identify-results">
      {results.length > 0 ? (
        <>
          <p className="sheet-hint">
            {results.length === 1 ? "1 result" : `${results.length} results`}, topmost first.
          </p>
          <ul>
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className="identify-result"
                  data-kind={result.kind}
                  onClick={() => onSelect(result.id)}
                >
                  <span>
                    <strong>{result.title}</strong>
                    <small>{resultKind(result)}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="sheet-hint">Nothing under this point in the visible layers.</p>
      )}
      {failures.length > 0 && (
        <p role="alert" className="identify-failures">
          Could not check {failures.map((failure) => failure.layerName).join(", ")}. Try again in a
          moment.
        </p>
      )}
    </div>
  );
}

interface ResultDetailProps {
  result: IdentifyResult;
  onBack: () => void;
  onOpenLake: (lake: IdentifyLake) => void;
}

function ResultDetail({ result, onBack, onOpenLake }: ResultDetailProps) {
  return (
    <article className="identify-detail">
      <button type="button" className="identify-back" onClick={onBack}>
        ‹ Results
      </button>
      <span className="identify-kicker">{resultKind(result)}</span>
      <h3>{result.title}</h3>
      {result.banner && (
        <p role="alert" className="identify-banner">
          {result.banner}
        </p>
      )}
      <RowList rows={result.rows} />
      {result.lake && (
        <button
          type="button"
          className="identify-action"
          onClick={() => result.lake && onOpenLake(result.lake)}
        >
          Open lake summary
        </button>
      )}
      {result.notes.map((note) => (
        <p key={note} className="sheet-hint">
          {note}
        </p>
      ))}
      <LinkList links={result.links} />
      {result.moreRows && result.moreRows.length > 0 && (
        <details className="identify-more">
          <summary>More details</summary>
          <RowList rows={result.moreRows} />
        </details>
      )}
      {result.attribution && <small className="identify-attribution">{result.attribution}</small>}
    </article>
  );
}

interface PointViewProps extends IdentifySheetProps {
  coordinates: string;
}

function PointView({ state, coordinates, onSelect, onClear }: PointViewProps) {
  const [lake, setLake] = useState<IdentifyLake | null>(null);
  const selected = state.results.find((result) => result.id === state.selectedId);
  const closeLake = () => setLake(null);
  return (
    <div className="identify">
      <CoordinateBar coordinates={coordinates} onClear={onClear} />
      {lake ? (
        <LakeSummary lake={lake} onBack={closeLake} />
      ) : selected ? (
        <ResultDetail result={selected} onBack={() => onSelect(null)} onOpenLake={setLake} />
      ) : (
        <ResultList state={state} onSelect={onSelect} />
      )}
    </div>
  );
}

export function IdentifySheet({ state, onSelect, onClear }: IdentifySheetProps) {
  const { point } = state;
  if (!point) return <p className="sheet-hint">Click or tap the map to see coordinates.</p>;
  const coordinates = `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
  // A new point starts without the lake summary the last one opened.
  return (
    <PointView
      key={coordinates}
      state={state}
      coordinates={coordinates}
      onSelect={onSelect}
      onClear={onClear}
    />
  );
}
