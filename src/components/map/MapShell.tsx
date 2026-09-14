"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { LayerPanel } from "@/components/ui/LayerPanel";
import { LayersIcon, LocateIcon, MapIcon, PinIcon, SearchIcon, TerrainIcon } from "@/components/ui/MapIcons";
import { initialCountyForName, supportedCountiesInViewport, type MapLocation, type ViewportBounds } from "@/lib/location";
import { restoreLayerOrder, restoreLayerState, restoreVerticalExaggeration, saveLayerPreferences } from "@/lib/map/layerState";
import { CesiumMap, type MapViewControls } from "./CesiumMap";
import type { InteractionMode } from "./CesiumMap";
import { LocationGate } from "./LocationGate";
import { clearMyData, deleteMyItem, loadMyData, roughAreaSquareMeters, roughLengthMeters, saveMyItem, type MyMapItem } from "@/lib/myData";
import { exportText, parseMapFile } from "@/lib/mapFormats";

export function MapShell() {
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [layerState, setLayerState] = useState(() => restoreLayerState(layerRegistry));
  const [layerOrder, setLayerOrder] = useState(() => restoreLayerOrder(layerRegistry));
  const [verticalExaggeration, setVerticalExaggeration] = useState(restoreVerticalExaggeration);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
  const [mode, setMode] = useState<InteractionMode>("inspect");
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [inspection, setInspection] = useState<[number, number] | null>(null);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [myData, setMyData] = useState<MyMapItem[]>([]);
  const [myDataVisible, setMyDataVisible] = useState(true);
  const [showMyData, setShowMyData] = useState(false);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);
  const registerViewControls = useCallback((controls: MapViewControls) => setViewControls(controls), []);
  const registerViewport = useCallback((bounds: ViewportBounds) => setViewportBounds(bounds), []);
  const terrainLayer = layerRegistry.find(isTerrainLayer);
  const selectedCounty = initialCountyForName(location?.county);
  const viewportCounties = useMemo(
    () => viewportBounds ? supportedCountiesInViewport(viewportBounds) : selectedCounty ? [selectedCounty] : [],
    [selectedCounty, viewportBounds],
  );
  const activeLayers = useMemo(
    () => {
      const countySet = new Set(viewportCounties);
      const order = new Map(layerOrder.map((id, index) => [id, index]));
      return layerRegistry
        .filter((layer) => !layer.county || countySet.has(layer.county))
        .toSorted((first, second) => (order.get(first.id) ?? 0) - (order.get(second.id) ?? 0));
    },
    [layerOrder, viewportCounties],
  );

  useEffect(() => {
    saveLayerPreferences(layerState, layerOrder, verticalExaggeration);
  }, [layerOrder, layerState, verticalExaggeration]);

  useEffect(() => { void loadMyData().then(setMyData); }, []);

  const addItem = useCallback(async (item: MyMapItem) => {
    setMyData((current) => [...current, item]);
    await saveMyItem(item);
  }, []);

  const handleCoordinateClick = useCallback((longitude: number, latitude: number) => {
    setInspection([longitude, latitude]);
    if (mode === "inspect") return;
    if (mode === "pin") {
      const name = window.prompt("Pin name", "Dropped pin")?.trim() || "Dropped pin";
      const note = window.prompt("Optional note")?.trim() || undefined;
      void addItem({ id: crypto.randomUUID(), name, note, geometry: { type: "Point", coordinates: [longitude, latitude] }, createdAt: new Date().toISOString() });
      setMode("inspect");
      return;
    }
    setDraft((current) => [...current, [longitude, latitude]]);
  }, [addItem, mode]);

  const finishDrawing = async () => {
    const minimum = mode === "polygon" ? 3 : 2;
    if (draft.length < minimum) return;
    const geometry = mode === "polygon" ? { type: "Polygon" as const, coordinates: [[...draft, draft[0]]] } : { type: "LineString" as const, coordinates: draft };
    const measurement = mode === "polygon" ? `${(roughAreaSquareMeters(draft) / 4046.856).toFixed(2)} acres` : `${(roughLengthMeters(draft) / 1609.344).toFixed(2)} miles`;
    await addItem({ id: crypto.randomUUID(), name: window.prompt("Drawing name", mode === "polygon" ? "Area" : "Route")?.trim() || "Drawing", note: `Approx. ${measurement}`, geometry, createdAt: new Date().toISOString() });
    setDraft([]);
    setMode("inspect");
  };

  const download = (format: "geojson" | "kml" | "gpx") => {
    const blob = new Blob([exportText(myData, format)], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `mnmapping-data.${format}`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const showTerrainView = () => {
    if (terrainLayer) {
      setLayerState((current) => ({
        ...current,
        [terrainLayer.id]: { ...current[terrainLayer.id], visible: true },
      }));
    }
    viewControls?.showTerrainView();
  };

  const chooseLocation = (nextLocation: MapLocation) => {
    setViewportBounds(null);
    setLocation(nextLocation);
  };

  const changeArea = () => {
    setViewportBounds(null);
    setLocation(null);
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    const layer = activeLayers.find((candidate) => candidate.id === id);
    if (!layer) return;
    const peers = activeLayers.filter((candidate) => candidate.category === layer.category && !isTerrainLayer(candidate));
    const peerIndex = peers.findIndex((candidate) => candidate.id === id);
    const target = peers[peerIndex + (direction === "up" ? 1 : -1)];
    if (!target) return;
    setLayerOrder((current) => {
      const next = [...current];
      const currentIndex = next.indexOf(id);
      const targetIndex = next.indexOf(target.id);
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      return next;
    });
  };

  if (!location) return <LocationGate onLocationSelect={chooseLocation} />;

  return (
    <main className="app-shell">
      <CesiumMap
        layers={activeLayers}
        layerState={layerState}
        location={location}
        verticalExaggeration={verticalExaggeration}
        onResetReady={registerReset}
        onViewControlsReady={registerViewControls}
        onViewportChange={registerViewport}
        interactionMode={mode}
        myData={myData}
        myDataVisible={myDataVisible}
        onCoordinateClick={handleCoordinateClick}
        onCursorChange={(longitude, latitude) => setCursor([longitude, latitude])}
      />
      <header className="top-bar">
        <div className="brand"><PinIcon /><h1>MnMapping</h1><span>Personal Minnesota map viewer</span></div>
        <div className="top-actions">
          <div className="selected-location" title={location.label}>
            <PinIcon />
            <span><strong>{location.label}</strong><small>{location.county ?? "County unavailable"}</small></span>
          </div>
          <button className="map-button" type="button" onClick={() => viewControls?.showMapView()}><MapIcon />Map view</button>
          <button className="map-button" type="button" onClick={showTerrainView}><TerrainIcon />Terrain</button>
          <button className="map-button compact-action" type="button" onClick={() => resetCamera?.()}><LocateIcon />Recenter</button>
          <button className="map-button change-area" type="button" onClick={changeArea}><SearchIcon />Change area</button>
        </div>
      </header>
      <LayerPanel
        layers={activeLayers}
        state={layerState}
        terrainExaggeration={verticalExaggeration}
        onVisibilityChange={(id, visible) => setLayerState((current) => ({
          ...current,
          [id]: { ...current[id], visible },
        }))}
        onOpacityChange={(id, opacity) => setLayerState((current) => ({
          ...current,
          [id]: { ...current[id], opacity },
        }))}
        onTerrainExaggerationChange={setVerticalExaggeration}
        onMoveLayer={moveLayer}
      />
      <nav className="map-tools" aria-label="Map inspection and personal data tools">
        {(["inspect", "pin", "line", "polygon"] as const).map((tool) => <button key={tool} type="button" aria-pressed={mode === tool} onClick={() => { setMode(tool); setDraft([]); }}>{tool}</button>)}
        {(mode === "line" || mode === "polygon") && <button type="button" disabled={draft.length < (mode === "polygon" ? 3 : 2)} onClick={() => void finishDrawing()}>Finish ({draft.length})</button>}
        <button type="button" aria-pressed={showMyData} onClick={() => setShowMyData((value) => !value)}>My Data</button>
      </nav>
      {inspection && <section className="inspection-card"><strong>Map point</strong><span>{inspection[1].toFixed(6)}, {inspection[0].toFixed(6)}</span><button type="button" onClick={() => void navigator.clipboard.writeText(`${inspection[1].toFixed(6)}, ${inspection[0].toFixed(6)}`)}>Copy coordinates</button></section>}
      {showMyData && <section className="my-data-panel">
        <header><strong>My Data</strong><label><input type="checkbox" checked={myDataVisible} onChange={(event) => setMyDataVisible(event.target.checked)} /> Show</label></header>
        <label className="file-import">Import GPX, KML, or GeoJSON<input type="file" accept=".gpx,.kml,.geojson,.json" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then(async (text) => { const imported = parseMapFile(text, file.name.split(".").pop()?.toLowerCase() ?? ""); for (const item of imported) await saveMyItem(item); setMyData((current) => [...current, ...imported]); }); }} /></label>
        <div className="export-buttons"><button onClick={() => download("gpx")}>GPX</button><button onClick={() => download("kml")}>KML</button><button onClick={() => download("geojson")}>GeoJSON</button></div>
        <div className="my-data-list">{myData.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.note ?? item.geometry.type}</small></span><button aria-label={`Delete ${item.name}`} onClick={() => { void deleteMyItem(item.id); setMyData((current) => current.filter((candidate) => candidate.id !== item.id)); }}>×</button></div>)}</div>
        {myData.length > 0 && <button className="delete-all" onClick={() => { if (window.confirm("Delete all locally saved map data?")) { void clearMyData(); setMyData([]); } }}>Delete all local data</button>}
        <p>Stored only in this browser unless you export it.</p>
      </section>}
      <div className="status"><LayersIcon />{cursor ? `${cursor[1].toFixed(5)}, ${cursor[0].toFixed(5)}` : viewportCounties.length ? `Viewport: ${viewportCounties.join(", ")}` : "Viewport: statewide sources only"}</div>
    </main>
  );
}
