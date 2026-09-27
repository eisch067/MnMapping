"use client";

import { useEffect, useState } from "react";
import { fetchLakeFinder, type LakeFinderOutcome } from "@/lib/dnr/lakefinder";
import { describeLakeSummary, type LakeSummaryView } from "@/lib/dnr/lakeSummary";
import type { IdentifyLake } from "@/lib/identify/types";
import { LinkList, RowList } from "./IdentifyParts";

interface LoadedLake {
  dow: string;
  outcome: LakeFinderOutcome;
}

// Asks DNR once for the lake, and drops the answer if the sheet has moved on to another lake.
function useLakeFinder(dow: string): LakeFinderOutcome | undefined {
  const [loaded, setLoaded] = useState<LoadedLake | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchLakeFinder(dow, { signal: controller.signal }).then(
      (outcome) => setLoaded({ dow, outcome }),
      // Only an abort rejects: any other failure is already an "unavailable" outcome.
      () => undefined,
    );
    return () => controller.abort();
  }, [dow]);
  return loaded?.dow === dow ? loaded.outcome : undefined;
}

function Regulations({ regulations }: { regulations: NonNullable<LakeSummaryView["regulations"]> }) {
  const { entries, emptyMessage, verifyLink } = regulations;
  return (
    <section className="lake-regulations" aria-label="DNR special fishing regulations">
      <h4>DNR special fishing regulations</h4>
      {emptyMessage && <p>{emptyMessage}</p>}
      {entries.length > 0 && (
        <ul>
          {entries.map((entry) => (
            <li key={`${entry.species}|${entry.location}|${entry.text}`}>
              {entry.species && <strong>{entry.species}</strong>}
              {entry.location && <em>{entry.location}</em>}
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>
      )}
      <a href={verifyLink.href} target="_blank" rel="noreferrer">
        {verifyLink.label} ↗
      </a>
    </section>
  );
}

function SummaryBody({ view }: { view: LakeSummaryView }) {
  return (
    <>
      {view.notice && (
        <p role="status" className="lake-notice">
          {view.notice}
        </p>
      )}
      <RowList rows={view.facts} />
      {view.regulations && <Regulations regulations={view.regulations} />}
      <RowList rows={view.details} />
      {view.species && (
        <details className="identify-more lake-species">
          <summary>{view.species.heading}</summary>
          <p>{view.species.names.join(", ")}</p>
          <p className="sheet-hint">{view.species.caveat}</p>
        </details>
      )}
      <LinkList links={view.links} />
      <small className="identify-attribution">{view.attribution}</small>
    </>
  );
}

export function LakeSummary({ lake, onBack }: { lake: IdentifyLake; onBack: () => void }) {
  const outcome = useLakeFinder(lake.dow);
  const view = outcome && describeLakeSummary({ dow: lake.dow, fallbackName: lake.name, outcome });
  return (
    <article className="identify-detail lake-summary">
      <button type="button" className="identify-back" onClick={onBack}>
        ‹ Back
      </button>
      <span className="identify-kicker">LakeFinder summary</span>
      <h3>{view?.title ?? lake.name ?? `Lake ${lake.dow}`}</h3>
      {view ? (
        <SummaryBody view={view} />
      ) : (
        <p role="status" className="sheet-hint">
          Asking DNR LakeFinder about this lake…
        </p>
      )}
    </article>
  );
}
