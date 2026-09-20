"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { licensingDocs, type LicensingDoc } from "@/config/licensingDocs.generated";
import { renderMarkdown } from "@/lib/markdown";
import { ArrowLeftIcon, SearchIcon } from "@/components/ui/MapIcons";

const categoryLabels: Record<LicensingDoc["category"], string> = {
  overview: "Executive summary",
  statewide: "Statewide sources",
  counties: "All 87 counties",
  monetization: "Business models",
  attribution: "Attribution design",
  risk: "Risk register",
  questions: "Questions for agencies",
  "county-detail": "County detail",
};

const topLevelOrder: readonly LicensingDoc["category"][] = ["overview", "statewide", "counties", "monetization", "attribution", "risk", "questions"];

export function LicensingAudit() {
  const topDocs = useMemo(() => topLevelOrder.map((category) => licensingDocs.find((doc) => doc.category === category)).filter((doc): doc is LicensingDoc => Boolean(doc)), []);
  const countyDocs = useMemo(() => licensingDocs.filter((doc) => doc.category === "county-detail").toSorted((a, b) => a.title.localeCompare(b.title)), []);
  const [selectedSlug, setSelectedSlug] = useState(topDocs[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const selected = licensingDocs.find((doc) => doc.slug === selectedSlug);
  const visibleCountyDocs = countyDocs.filter((doc) => doc.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <main className="licensing-shell">
      <header className="research-topbar">
        <div className="research-title">
          <Link href="/research" className="research-back" aria-label="Back to research workspace"><ArrowLeftIcon /></Link>
          <div><span className="eyebrow">MnMapping research workspace</span><h1>Licensing &amp; commercial-use audit</h1></div>
        </div>
        <div className="licensing-disclaimer">Research and risk classification only — not legal advice. Confirm ORANGE/GRAY items with the data owner or an attorney before commercial launch.</div>
      </header>

      <div className="licensing-workspace">
        <aside className="licensing-nav">
          <nav aria-label="Licensing audit documents">
            <ul>
              {topDocs.map((doc) => (
                <li key={doc.slug}>
                  <button type="button" className={doc.slug === selectedSlug ? "is-selected" : ""} onClick={() => setSelectedSlug(doc.slug)}>
                    {doc.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="licensing-county-nav">
            <label className="research-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find county detail" /></label>
            <span className="licensing-county-nav-label">County detail files ({countyDocs.length})</span>
            <ul>
              {visibleCountyDocs.map((doc) => (
                <li key={doc.slug}>
                  <button type="button" className={doc.slug === selectedSlug ? "is-selected" : ""} onClick={() => setSelectedSlug(doc.slug)}>
                    {doc.title}
                  </button>
                </li>
              ))}
              {visibleCountyDocs.length === 0 && <li className="licensing-empty">No matches.</li>}
            </ul>
          </div>
        </aside>

        <article className="licensing-doc">
          {selected
            ? <>
                <span className="licensing-doc-category">{categoryLabels[selected.category]}</span>
                <div className="markdown-body">{renderMarkdown(selected.content)}</div>
              </>
            : <p className="licensing-empty">Licensing research has not been published yet. Run <code>npm run generate-licensing-docs</code> after adding files under <code>docs/licensing/</code>.</p>}
        </article>
      </div>
    </main>
  );
}
