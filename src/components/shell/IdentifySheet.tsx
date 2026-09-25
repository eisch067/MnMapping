"use client";

import { useState } from "react";
import type { IdentifyResult } from "@/lib/identify/types";
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

function ResultDetail({ result, onBack }: { result: IdentifyResult; onBack: () => void }) {
  return (
    <article className="identify-detail">
      <button type="button" className="identify-back" onClick={onBack}>
        ‹ Results
      </button>
      <span className="identify-kicker">{resultKind(result)}</span>
      <h3>{result.title}</h3>
      {result.rows.length > 0 && (
        <dl>
          {result.rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {result.notes.map((note) => (
        <p key={note} className="sheet-hint">
          {note}
        </p>
      ))}
      {result.links.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
          {link.label} ↗
        </a>
      ))}
    </article>
  );
}

export function IdentifySheet({ state, onSelect, onClear }: IdentifySheetProps) {
  const { point, selectedId, results } = state;
  if (!point) return <p className="sheet-hint">Click or tap the map to see coordinates.</p>;
  const coordinates = `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
  const selected = results.find((result) => result.id === selectedId);
  return (
    <div className="identify">
      <CoordinateBar key={coordinates} coordinates={coordinates} onClear={onClear} />
      {selected ? (
        <ResultDetail result={selected} onBack={() => onSelect(null)} />
      ) : (
        <ResultList state={state} onSelect={onSelect} />
      )}
    </div>
  );
}
