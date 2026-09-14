"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { isInMinnesota, parseCoordinates, type MapLocation } from "@/lib/location";
import { ArrowLeftIcon, CheckIcon, MapIcon, PinIcon, SearchIcon } from "@/components/ui/MapIcons";
import { SelectionMap } from "./SelectionMap";

interface LocationGateProps {
  onLocationSelect: (location: MapLocation) => void;
}

export function LocationGate({ onLocationSelect }: LocationGateProps) {
  const [mode, setMode] = useState<"search" | "map">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapLocation[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("Choose a point within Minnesota.");
      return;
    }
    setMessage("");
    setSelectedPoint({ latitude, longitude });
  };

  const confirmPoint = async () => {
    if (!selectedPoint) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/location-search?lat=${selectedPoint.latitude}&lon=${selectedPoint.longitude}`);
      const data = await response.json() as { results?: MapLocation[]; error?: string };
      if (!response.ok || !data.results?.[0]) throw new Error(data.error ?? "Location lookup failed.");
      onLocationSelect({ ...data.results[0], kind: "coordinate" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Location lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "map") {
    return (
      <main className="location-map-shell">
        <SelectionMap selectedPoint={selectedPoint} onPointSelect={selectPoint} />
        <header className="selection-header">
          <button className="icon-button" type="button" onClick={() => { setMode("search"); setMessage(""); }} aria-label="Back to location search">
            <ArrowLeftIcon />
          </button>
          <div><strong>Select on map</strong><span>Choose a point from the transportation map.</span></div>
        </header>
        <section className="selection-confirm" aria-live="polite">
          <PinIcon />
          <div>
            <strong>{selectedPoint ? "Location selected" : "Click anywhere in Minnesota"}</strong>
            <span>{selectedPoint ? `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}` : "Imagery will not load until you confirm."}</span>
            {message && <span className="form-message">{message}</span>}
          </div>
          <button className="primary-button" type="button" disabled={!selectedPoint || loading} onClick={() => void confirmPoint()}>
            <CheckIcon />{loading ? "Loading…" : "Use location"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="location-gate">
      <div className="location-backdrop" aria-hidden="true" />
      <header className="welcome-brand"><PinIcon /><span>MnMapping</span></header>
      <section className="location-card" aria-labelledby="location-title">
        <div className="location-card-heading">
          <span className="eyebrow">Start with a place</span>
          <h1 id="location-title">Where would you like to explore?</h1>
          <p>Choose a focused area first. MnMapping will load detailed imagery only around that location.</p>
        </div>
        <form className="location-search" onSubmit={(event) => void search(event)}>
          <SearchIcon />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Address, city, coordinates, or county"
            aria-label="Search for a Minnesota location"
          />
          <button type="submit" disabled={loading || !query.trim()}>{loading ? "Searching…" : "Search"}</button>
        </form>
        <p className="search-example">Try “Park Rapids”, “Hubbard County”, or “46.9221, -95.0616”.</p>
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
        <button className="select-map-button" type="button" onClick={() => { setMode("map"); setMessage(""); }}>
          <MapIcon />
          <span><strong>Select on map</strong><small>Open a lightweight transportation map and point to an area.</small></span>
        </button>
        <p className="privacy-note">No location is stored. You can change areas at any time.</p>
      </section>
    </main>
  );
}
