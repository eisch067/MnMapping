"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { countyRegistry } from "@/config/counties";
import { restrictedImageryForCounty } from "@/config/restrictedImagery";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import type { LayerDefinition } from "@/config/layers/types";
import { displayableImageryForCounty, latestDisplayableImagery } from "@/lib/countyImagery";
import { isInMinnesota, parseCoordinates, type MapLocation } from "@/lib/location";
import { ArrowLeftIcon, CheckIcon, MapIcon, PinIcon, SearchIcon } from "@/components/ui/MapIcons";
import { CountyImageryMap } from "./CountyImageryMap";
import { SelectionMap } from "./SelectionMap";

interface LocationGateProps {
  onLocationSelect: (location: MapLocation) => void;
}

const sortedCounties = countyRegistry.toSorted((first, second) => first.name.localeCompare(second.name));

export function LocationGate({ onLocationSelect }: LocationGateProps) {
  const [mode, setMode] = useState<"search" | "point" | "imagery">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapLocation[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [pointMapWarm, setPointMapWarm] = useState(false);
  const [imageryMapWarm, setImageryMapWarm] = useState(false);
  const [resolvingPoint, setResolvingPoint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const browserWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = browserWindow.requestIdleCallback?.(() => setPointMapWarm(true), { timeout: 1200 });
    const timeoutId = idleId === undefined ? window.setTimeout(() => setPointMapWarm(true), 350) : undefined;
    return () => {
      if (idleId !== undefined) browserWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!selectedPoint) return;
    const controller = new AbortController();
    void fetch(`/api/location-search?lat=${selectedPoint.latitude}&lon=${selectedPoint.longitude}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { results?: MapLocation[]; error?: string };
        if (!response.ok || !data.results?.[0]) throw new Error(data.error ?? "Location lookup failed.");
        setSelectedLocation({ ...data.results[0], kind: "coordinate" });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Location lookup failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setResolvingPoint(false);
      });
    return () => controller.abort();
  }, [selectedPoint]);

  const selectedDefinition = useMemo(
    () => countyRegistry.find((county) => county.name === selectedCounty),
    [selectedCounty],
  );
  const countyLocation = useMemo<MapLocation | null>(() => selectedDefinition ? ({
    id: `county-${selectedDefinition.id}`,
    label: `${selectedDefinition.name} County, Minnesota`,
    latitude: (selectedDefinition.bounds.south + selectedDefinition.bounds.north) / 2,
    longitude: (selectedDefinition.bounds.west + selectedDefinition.bounds.east) / 2,
    county: selectedDefinition.name,
    kind: "county",
  }) : null, [selectedDefinition]);
  const latestImagery = selectedCounty ? latestDisplayableImagery(selectedCounty) : undefined;
  const displayableImagery = useMemo(
    () => selectedCounty ? displayableImageryForCounty(selectedCounty) : [],
    [selectedCounty],
  );
  const statewideImagery = displayableImagery.filter((layer) => !layer.county);
  const countyImagery = displayableImagery.filter((layer) => Boolean(layer.county));
  const bestStatewideId = bestNaturalColorLayer(statewideImagery)?.id;
  const bestCountyId = bestNaturalColorLayer(countyImagery)?.id;
  const restrictedImagery = selectedCounty ? restrictedImageryForCounty(selectedCounty) : [];

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setLoading(true);
    setMessage("");
    setResults([]);
    const coordinates = parseCoordinates(value);
    const endpoint = coordinates
      ? `/api/location-search?lat=${coordinates.latitude}&lon=${coordinates.longitude}`
      : `/api/location-search?q=${encodeURIComponent(value)}`;
    try {
      const response = await fetch(endpoint);
      const data = await response.json() as { results?: MapLocation[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Location lookup failed.");
      const matches = data.results ?? [];
      setResults(matches);
      if (!matches.length) setMessage("No Minnesota locations matched that search.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Location lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const selectPoint = (latitude: number, longitude: number) => {
    if (!isInMinnesota(latitude, longitude)) {
      setSelectedPoint(null);
      setSelectedLocation(null);
      setMessage("Choose a point within Minnesota.");
      return;
    }
    setMessage("");
    setSelectedLocation(null);
    setResolvingPoint(true);
    setSelectedPoint({ latitude, longitude });
  };

  const showSearch = () => {
    setMode("search");
    setMessage("");
  };

  return (
    <main className="location-start-shell">
      {pointMapWarm && (
        <section className={`location-map-shell ${mode === "point" ? "is-active" : "is-warming"}`} aria-hidden={mode !== "point"} inert={mode !== "point"}>
          <SelectionMap active={mode === "point"} selectedPoint={selectedPoint} onPointSelect={selectPoint} />
          <header className="selection-header">
            <button className="icon-button" type="button" onClick={showSearch} aria-label="Back to start options"><ArrowLeftIcon /></button>
            <div><strong>2 · Select on a map</strong><span>Choose a precise point from the transportation map.</span></div>
          </header>
          <section className="selection-confirm" aria-live="polite">
            <PinIcon />
            <div>
              <strong>{selectedPoint ? "Location selected" : "Click anywhere in Minnesota"}</strong>
              <span>{selectedLocation ? selectedLocation.label : selectedPoint ? `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}` : "Detailed imagery loads after you confirm."}</span>
              {selectedLocation?.county && <span className="point-preview-meta">{selectedLocation.county}</span>}
              {resolvingPoint && <span className="point-preview-meta">Loading location details…</span>}
              {message && <span className="form-message">{message}</span>}
            </div>
            <button className="primary-button" type="button" disabled={!selectedLocation || resolvingPoint} onClick={() => selectedLocation && onLocationSelect(selectedLocation)}>
              <CheckIcon />{resolvingPoint ? "Loading…" : "Use location"}
            </button>
          </section>
        </section>
      )}

      {imageryMapWarm && (
        <section className={`location-map-shell ${mode === "imagery" ? "is-active" : "is-warming"}`} aria-hidden={mode !== "imagery"} inert={mode !== "imagery"}>
          <CountyImageryMap active={mode === "imagery"} selectedCounty={selectedCounty} onCountySelect={setSelectedCounty} />
          <header className="selection-header county-selection-header">
            <button className="icon-button" type="button" onClick={showSearch} aria-label="Back to start options"><ArrowLeftIcon /></button>
            <div className="county-selection-title"><strong>3 · Explore available imagery</strong><span>Click a county to compare displayable and externally available imagery.</span></div>
            <label className="county-select-control">
              <span className="sr-only">Choose a county</span>
              <select value={selectedCounty ?? ""} onChange={(event) => setSelectedCounty(event.target.value || null)}>
                <option value="">County list</option>
                {sortedCounties.map((county) => <option key={county.id} value={county.name}>{county.name}</option>)}
              </select>
            </label>
          </header>
          <section className={`selection-confirm county-imagery-card ${selectedCounty ? "has-selection" : ""}`} aria-live="polite">
            {selectedCounty && countyLocation ? (
              <div className="county-imagery-content">
                <div className="county-imagery-titlebar">
                  <MapIcon />
                  <div className="county-imagery-heading">
                    <span className="eyebrow">{selectedCounty} County</span>
                    <strong>Available imagery</strong>
                    <span>{latestImagery ? `${latestImagery.name} (${latestImagery.year}) will open automatically.` : "Best Available imagery will open automatically."}</span>
                  </div>
                  <button className="primary-button county-explore-button" type="button" onClick={() => onLocationSelect(countyLocation)} aria-label={`Explore ${selectedCounty} County`}>
                    <CheckIcon />Explore County
                  </button>
                </div>
                <div className="imagery-source-grid">
                  <ImagerySourceTable
                    title="State-wide Imagery"
                    information="State-wide imagery offers great-quality coverage for the entire state. Detail is typically not as fine as county-level imagery, but coverage is consistent throughout Minnesota."
                    layers={statewideImagery}
                    bestId={bestStatewideId}
                    bestLabel="Best statewide"
                    defaultId={latestImagery?.id}
                    emptyMessage="No statewide imagery is currently configured."
                  />
                  <ImagerySourceTable
                    title="County Wide Imagery"
                    information="County-wide imagery is some of the best publicly available imagery on the market. Counties with larger populations typically have higher-quality imagery."
                    layers={countyImagery}
                    bestId={bestCountyId}
                    bestLabel="Best county imagery"
                    defaultId={latestImagery?.id}
                    emptyMessage="No county-specific imagery is currently available in MnMapping."
                  />
                  <ExternalImageryTable sources={restrictedImagery} />
                </div>
              </div>
            ) : (
              <><MapIcon /><div><strong>Select any county</strong><span>We’ll show statewide, county-wide, and known external imagery sources.</span></div></>
            )}
          </section>
        </section>
      )}

      <section className={`location-gate ${mode === "search" ? "is-active" : "is-hidden"}`} aria-hidden={mode !== "search"} inert={mode !== "search"}>
        <div className="location-backdrop" aria-hidden="true" />
        <header className="welcome-brand"><PinIcon /><span>MnMapping</span></header>
        <section className="location-card start-options-card" aria-labelledby="location-title">
          <div className="location-card-heading">
            <span className="eyebrow">1 · Enter a location</span>
            <h1 id="location-title">Where would you like to explore?</h1>
            <p>Search by address, coordinates, city, ZIP code, county, or place name.</p>
          </div>
          <form className="location-search" onSubmit={(event) => void search(event)}>
            <SearchIcon />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Address, city, ZIP, coordinates, or county"
              aria-label="Enter a Minnesota location"
            />
            <button type="submit" disabled={loading || !query.trim()}>{loading ? "Searching…" : "Search"}</button>
          </form>
          <p className="search-example">Try “Park Rapids”, “Hubbard County”, “56073”, or “46.9221, -95.0616”.</p>
          {message && <p className="form-message" role="status">{message}</p>}
          {results.length > 0 && (
            <div className="location-results" aria-label="Location results">
              {results.map((result) => (
                <button type="button" className="location-result" key={result.id} onClick={() => onLocationSelect(result)}>
                  <PinIcon />
                  <span><strong>{result.label}</strong><small>{[result.kind, result.county].filter(Boolean).join(" · ")}</small></span>
                </button>
              ))}
            </div>
          )}
          <div className="location-divider"><span>or</span></div>
          <div className="start-option-stack">
            <button className="select-map-button" type="button" onClick={() => { setPointMapWarm(true); setMode("point"); setMessage(""); }}>
              <PinIcon />
              <span><strong>2 · Select on a map</strong><small>Choose a precise point from a lightweight transportation map.</small></span>
            </button>
            <button className="select-map-button imagery-explore-button" type="button" onClick={() => { setImageryMapWarm(true); setMode("imagery"); setMessage(""); }}>
              <MapIcon />
              <span><strong>3 · Explore available imagery</strong><small>Browse all 87 counties, compare years, and find restricted external sources.</small></span>
            </button>
          </div>
          <p className="privacy-note">No location is stored. You can change areas at any time.</p>
        </section>
      </section>
    </main>
  );
}

interface ImagerySourceTableProps {
  title: string;
  information: string;
  layers: readonly LayerDefinition[];
  bestId?: string;
  bestLabel: string;
  defaultId?: string;
  emptyMessage: string;
}

function ImagerySourceTable({ title, information, layers, bestId, bestLabel, defaultId, emptyMessage }: ImagerySourceTableProps) {
  return (
    <section className="imagery-source-table" aria-labelledby={`${title.replaceAll(" ", "-").toLowerCase()}-heading`}>
      <ImageryTableHeading title={title} information={information} />
      <div className="imagery-source-columns" aria-hidden="true"><span>Imagery Name</span><span>Year</span><span>Detail</span></div>
      <div className="imagery-source-rows">
        {layers.length > 0 ? layers.map((layer) => (
          <article className="imagery-source-row" key={layer.id}>
            <div className="imagery-source-primary">
              <strong>{layer.name}</strong>
              <span>{layer.year ?? "—"}</span>
              <span>{layer.resolution ?? "Not stated"}</span>
            </div>
            <div className="imagery-source-badges">
              {layer.id === bestId && <small>{bestLabel}</small>}
              {layer.id === defaultId && <small>Opens by default</small>}
            </div>
            <p><b>Notes:</b> {layer.description ?? `Available from ${layer.agency ?? layer.attribution}.`}</p>
          </article>
        )) : <p className="imagery-empty-state">{emptyMessage}</p>}
      </div>
    </section>
  );
}

function ExternalImageryTable({ sources }: { sources: readonly RestrictedImagerySource[] }) {
  return (
    <section className="imagery-source-table other-imagery-table" aria-labelledby="other-imagery-heading">
      <ImageryTableHeading
        title="Other Imagery"
        information="We have identified better-quality imagery available through a public website, but it cannot be displayed here because of licensing restrictions. Select the external link to view it."
      />
      <div className="imagery-source-columns" aria-hidden="true"><span>Imagery Name</span><span>Year</span><span>Detail</span></div>
      <div className="imagery-source-rows">
        {sources.length > 0 ? sources.map((source, index) => (
          <article className="imagery-source-row is-external" key={`${source.county}-${source.year}`}>
            <div className="imagery-source-primary">
              <strong><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a></strong>
              <span>{source.year}</span>
              <span>Higher-detail imagery</span>
            </div>
            <div className="imagery-source-badges"><small>{index === 0 ? "Best external imagery" : "External source"}</small></div>
            <p><b>Notes:</b> {source.reason}</p>
          </article>
        )) : <p className="imagery-empty-state">No known higher-detail external imagery is currently documented.</p>}
      </div>
    </section>
  );
}

function ImageryTableHeading({ title, information }: { title: string; information: string }) {
  const id = `${title.replaceAll(" ", "-").toLowerCase()}-heading`;
  return (
    <header className="imagery-source-heading">
      <h2 id={id}>{title}</h2>
      <span className="imagery-info-control">
        <button type="button" aria-label={`About ${title}`} aria-describedby={`${id}-tip`}>i</button>
        <span className="imagery-info-tooltip" id={`${id}-tip`} role="tooltip">{information}</span>
      </span>
    </header>
  );
}

function bestNaturalColorLayer(layers: readonly LayerDefinition[]): LayerDefinition | undefined {
  return layers.find((layer) => typeof layer.year === "number"
    && layer.imageryGroup !== "cir"
    && !/\bCIR\b/i.test(layer.name)
    && !/color infrared/i.test(layer.description ?? ""));
}
