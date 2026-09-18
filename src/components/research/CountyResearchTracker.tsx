"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  createInitialResearchRecords,
  createResearchExport,
  mergeResearchExport,
  researchRecordsToCsv,
  researchStatuses,
  type CountyImageryResearchRecord,
  type ImageryResearchSource,
  type ResearchStatus,
} from "@/lib/imageryResearch";
import { ArrowLeftIcon, CheckIcon, SearchIcon } from "@/components/ui/MapIcons";

const storageKey = "mnmapping.imagery-research.v1";

export function CountyResearchTracker() {
  const [records, setRecords] = useState(createInitialResearchRecords);
  const [selectedId, setSelectedId] = useState(() => createInitialResearchRecords()[0]?.countyId ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResearchStatus | "All">("All");
  const [zoneFilter, setZoneFilter] = useState<"All" | "north" | "south">("All");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) setRecords(mergeResearchExport(JSON.parse(stored) as unknown));
      } catch {
        setNotice("Saved browser data could not be read. The registry defaults are shown instead.");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(createResearchExport(records)));
  }, [hydrated, records]);

  const selected = records.find((record) => record.countyId === selectedId) ?? records[0];
  const counts = useMemo(() => Object.fromEntries(researchStatuses.map((status) => [
    status,
    records.filter((record) => record.status === status).length,
  ])) as Record<ResearchStatus, number>, [records]);
  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((record) => (
      (!normalized || record.county.toLowerCase().includes(normalized) || record.fips.includes(normalized))
      && (statusFilter === "All" || record.status === statusFilter)
      && (zoneFilter === "All" || record.zone === zoneFilter)
    ));
  }, [query, records, statusFilter, zoneFilter]);

  const updateRecord = (countyId: string, patch: Partial<CountyImageryResearchRecord>) => {
    setRecords((current) => current.map((record) => record.countyId === countyId ? { ...record, ...patch } : record));
  };

  const completeAndOpenNext = () => {
    if (!selected) return;
    const currentIndex = records.findIndex((record) => record.countyId === selected.countyId);
    const reviewQueue = [
      ...records.slice(currentIndex + 1),
      ...records.slice(0, currentIndex),
    ];
    const next = reviewQueue.find((record) => record.status !== "Complete");
    setRecords((current) => current.map((record) => record.countyId === selected.countyId ? { ...record, status: "Complete" } : record));
    if (next) setSelectedId(next.countyId);
  };

  const exportJson = () => {
    downloadText(JSON.stringify(createResearchExport(records), null, 2), `mnmapping-county-imagery-${dateStamp()}.json`, "application/json");
    setNotice("JSON session export downloaded. Keep this file as the round-trip research backup.");
  };

  const exportCsv = () => {
    downloadText(researchRecordsToCsv(records), `mnmapping-county-imagery-${dateStamp()}.csv`, "text/csv;charset=utf-8");
    setNotice("CSV export downloaded for spreadsheet review.");
  };

  const importJson = async (file: File) => {
    try {
      const imported = mergeResearchExport(JSON.parse(await file.text()) as unknown);
      setRecords(imported);
      setSelectedId(imported[0]?.countyId ?? "");
      setNotice(`Imported ${file.name}. All 87 registry counties are present.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The research file could not be imported.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <main className="research-shell">
      <header className="research-topbar">
        <div className="research-title">
          <Link href="/" className="research-back" aria-label="Back to MnMapping"><ArrowLeftIcon /></Link>
          <div><span className="eyebrow">MnMapping research workspace</span><h1>County imagery tracker</h1></div>
        </div>
        <div className="research-actions">
          <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJson(file); }} />
          <button type="button" onClick={() => importRef.current?.click()}>Import JSON</button>
          <button type="button" onClick={exportCsv}>Export CSV</button>
          <button type="button" className="primary-button" onClick={exportJson}>Export session</button>
        </div>
      </header>

      <section className="research-summary" aria-label="Research progress">
        <div><strong>{records.length}</strong><span>Total counties</span></div>
        <div><strong>{counts["In progress"]}</strong><span>In progress</span></div>
        <div><strong>{counts["Needs review"]}</strong><span>Needs review</span></div>
        <div className="is-deep-research"><strong>{counts["Deep research"]}</strong><span>Deep research</span></div>
        <div className="is-complete"><strong>{counts.Complete}</strong><span>Complete</span></div>
        <div><strong>{Math.round((counts.Complete / Math.max(records.length, 1)) * 100)}%</strong><span>Finished</span></div>
      </section>

      {notice && <div className="research-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

      <section className="research-workspace">
        <aside className="research-county-panel">
          <div className="research-filters">
            <label className="research-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="County or FIPS" /></label>
            <div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ResearchStatus | "All")} aria-label="Filter by status">
                <option>All</option>{researchStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value as "All" | "north" | "south")} aria-label="Filter by zone">
                <option>All</option><option value="north">North</option><option value="south">South</option>
              </select>
            </div>
          </div>
          <div className="research-county-list" aria-label="Minnesota counties">
            {visibleRecords.map((record) => (
              <button type="button" className={record.countyId === selected?.countyId ? "is-selected" : ""} key={record.countyId} onClick={() => setSelectedId(record.countyId)}>
                <span><strong>{record.county}</strong><small>FIPS {record.fips} · {record.zone}</small></span>
                <i className={`research-status-dot status-${statusSlug(record.status)}`} title={record.status} />
              </button>
            ))}
            {visibleRecords.length === 0 && <p>No counties match these filters.</p>}
          </div>
        </aside>

        {selected && (
          <section key={selected.countyId} className="research-editor" aria-label={`${selected.county} County imagery research`}>
            <header className="research-editor-header">
              <div><span className="eyebrow">{selected.zone} zone · FIPS {selected.fips}</span><h2>{selected.county} County</h2></div>
              <div className="research-review-actions">
                <label>Status<select value={selected.status} onChange={(event) => updateRecord(selected.countyId, { status: event.target.value as ResearchStatus })}>{researchStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <button type="button" onClick={completeAndOpenNext}><CheckIcon />Mark complete &amp; next</button>
              </div>
            </header>

            <label className="research-source-inbox">
              <span>{selected.county} County source inbox</span>
              <textarea
                value={selected.sourceInbox}
                onChange={(event) => updateRecord(selected.countyId, { sourceInbox: event.target.value, status: selected.status === "Not started" && event.target.value.trim() ? "In progress" : selected.status })}
                rows={6}
                aria-label={`${selected.county} County source inbox`}
                placeholder={`Paste imagery links, county GIS pages, notes, or leads for ${selected.county} County here. Use one item per line when possible.`}
              />
              <small>Saved only to {selected.county} County. Paste first; sorting is not required. Export the session JSON and send it back to me so I can verify, categorize, and implement these sources.</small>
            </label>

            <div className="research-meta-grid">
              <label>Last verified<input type="date" value={selected.lastVerified} onChange={(event) => updateRecord(selected.countyId, { lastVerified: event.target.value })} /></label>
              <label>Next action<input value={selected.nextAction} onChange={(event) => updateRecord(selected.countyId, { nextAction: event.target.value })} placeholder="What should be checked next?" /></label>
              <label className="research-wide-field">County research notes<textarea value={selected.notes} onChange={(event) => updateRecord(selected.countyId, { notes: event.target.value })} rows={2} placeholder="Contacts, licensing findings, unresolved questions…" /></label>
            </div>

            <section className="research-current-findings">
              <header><div><h3>Current categorized findings</h3><p>These records come from MnMapping’s checked-in registry. They are updated after the source inbox is researched.</p></div></header>
              <div>
                <CurrentSourceGroup title="Implemented imagery" sources={[...selected.statewide, ...selected.countySources]} />
                <CurrentSourceGroup title="External imagery—date confirmed" sources={selected.other} />
                <CurrentSourceGroup title="Official viewer/research lead—date unknown" sources={selected.researchLeads} />
              </div>
            </section>
          </section>
        )}
      </section>
      <footer className="research-footer"><CheckIcon />Changes save automatically in this browser. Export JSON after each research session so the records can be restored and shared.</footer>
    </main>
  );
}

function CurrentSourceGroup({ title, sources }: { title: string; sources: readonly ImageryResearchSource[] }) {
  return (
    <section className="research-finding-group">
      <h4>{title}</h4>
      <div>
        {sources.map((source) => (
          <article key={source.id}>
            <div><strong>{source.name}</strong>{source.best && <small>Best</small>}</div>
            <span>{source.year || "Year unknown"}</span>
            <span>{source.detail || "Detail not stated"}</span>
            {/^(https?:\/\/|\/)/.test(source.url) && <a href={source.url} target="_blank" rel="noreferrer">Open source</a>}
            <p>{source.notes}</p>
          </article>
        ))}
        {sources.length === 0 && <p className="research-empty-source">No categorized source yet.</p>}
      </div>
    </section>
  );
}

function downloadText(text: string, filename: string, type: string) {
  const href = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusSlug(status: ResearchStatus): string {
  return status.toLowerCase().replaceAll(" ", "-");
}
