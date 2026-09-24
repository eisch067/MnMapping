"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countyRegistry } from "@/config/counties";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { LayerPanel } from "@/components/ui/LayerPanel";
import { LayersIcon, LocateIcon, MapIcon, PinIcon, SearchIcon, TerrainIcon } from "@/components/ui/MapIcons";
import { initialCountyForName, supportedCountiesInViewport, type MapLocation, type ViewportBounds } from "@/lib/location";
import { restoreLayerOrder, restoreLayerState, restoreVerticalExaggeration, saveLayerPreferences } from "@/lib/map/layerState";
import { recordRecentLocation } from "@/lib/locationHistory";
import type { LayerRuntimeStateById } from "@/lib/map/layerRuntime";
import { CesiumMap, type MapViewControls } from "./CesiumMap";
import type { InteractionMode } from "./CesiumMap";
import { LocationGate } from "./LocationGate";
import { clearMyData, deleteMyItem, loadMyData, roughAreaSquareMeters, roughLengthMeters, saveMyItem, type MyMapItem } from "@/lib/myData";
import { exportText, parseMapFile } from "@/lib/mapFormats";
import { latestDisplayableImagery } from "@/lib/countyImagery";
import { restrictedImageryForCounty } from "@/config/restrictedImagery";
import { MobileMapShellPrototype, type PrototypePanel, type PrototypeVariant } from "./MobileMapShellPrototype";

const layerRegistryById = new Map(layerRegistry.map((layer) => [layer.id, layer]));
const masterToggleCategories = ["public-land", "parcels"] as const;

export function MapShell({ initialPrototypeVariant = null }: { initialPrototypeVariant?: PrototypeVariant | null }) {
  const [location, setLocation] = useState<MapLocation | null>(() => initialPrototypeVariant ? ({
    id: "prototype-hubbard",
    label: "Heartland Trail, Park Rapids",
    latitude: 46.9221,
    longitude: -95.0616,
    county: "Hubbard",
    kind: "coordinate",
  }) : null);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [layerState, setLayerState] = useState(() => restoreLayerState(layerRegistry));
  const [layerOrder, setLayerOrder] = useState(() => restoreLayerOrder(layerRegistry));
  const [verticalExaggeration, setVerticalExaggeration] = useState(restoreVerticalExaggeration);
  const [cameraHeight, setCameraHeight] = useState(Number.POSITIVE_INFINITY);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
  const [mode, setMode] = useState<InteractionMode>("inspect");
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [inspection, setInspection] = useState<[number, number] | null>(null);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [myData, setMyData] = useState<MyMapItem[]>([]);
  const [myDataVisible, setMyDataVisible] = useState(true);
  const [showMyData, setShowMyData] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [layerRuntimeState, setLayerRuntimeState] = useState<LayerRuntimeStateById>({});
  const [layerRetryVersion, setLayerRetryVersion] = useState<Record<string, number>>({});
  const [prototypeVariant, setPrototypeVariant] = useState<PrototypeVariant | null>(initialPrototypeVariant);
  const [prototypeRailPinned, setPrototypeRailPinned] = useState(false);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);
  const registerViewControls = useCallback((controls: MapViewControls) => setViewControls(controls), []);
  const registerViewport = useCallback((bounds: ViewportBounds) => setViewportBounds(bounds), []);
  const updateLayerStatus = useCallback((id: string, status: LayerRuntimeStateById[string]) => {
    setLayerRuntimeState((current) => {
      const previous = current[id];
      if (previous?.status === status.status && previous.message === status.message && previous.featureCount === status.featureCount) return current;
      return { ...current, [id]: status };
    });
  }, []);
  const terrainLayer = layerRegistry.find(isTerrainLayer);
  const selectedCounty = initialCountyForName(location?.county);
  const viewportCounties = useMemo(
    () => viewportBounds ? supportedCountiesInViewport(viewportBounds) : selectedCounty ? [selectedCounty] : [],
    [selectedCounty, viewportBounds],
  );
  const pendingParcelCounties = useMemo(() => {
    const visibleCounties = new Set(viewportCounties);
    return countyRegistry
      .filter((county) => visibleCounties.has(county.name) && county.parcels.status === "pending")
      .map((county) => county.name);
  }, [viewportCounties]);
  const pendingPublicLandCounties = useMemo(() => {
    const visibleCounties = new Set(viewportCounties);
    // Minnesota's statewide government-ownership service (plan_gov_own_open) only covers 56 of
    // 87 counties today; there's no separate per-county source to fall back to yet, so this is
    // surfaced the same way an unverified parcel source is, rather than just silently omitting
    // the layer with no explanation.
    return countyRegistry
      .filter((county) => visibleCounties.has(county.name) && !county.layers.some((layer) => layer.category === "public-land"))
      .map((county) => county.name);
  }, [viewportCounties]);
  const externalImagery = useMemo(
    () => viewportCounties.flatMap((county) => restrictedImageryForCounty(county)),
    [viewportCounties],
  );
  const activeLayers = useMemo(
    () => {
      const countySet = new Set(viewportCounties);
      const order = new Map(layerOrder.map((id, index) => [id, index]));
      // A layer already turned on stays available even if the viewport's computed rectangle no
      // longer overlaps its county's bounding box (e.g. zoomed in tight near a shared border, or
      // a tilted terrain-view camera skewing the visible footprint) — that box check is only a
      // coarse proxy for "is this county relevant right now" and shouldn't silently undo an
      // explicit choice the user already made.
      return layerRegistry
        .filter((layer) => !layer.county || countySet.has(layer.county) || layerState[layer.id]?.visible)
        .toSorted((first, second) => (order.get(first.id) ?? 0) - (order.get(second.id) ?? 0));
    },
    [layerOrder, viewportCounties, layerState],
  );

  const previousMasterToggleIdsRef = useRef<Record<typeof masterToggleCategories[number], Set<string>>>({ "public-land": new Set(), parcels: new Set() });
  useEffect(() => {
    // Public-land and parcel layers each have an "All ___" master toggle in the layer panel. If
    // every layer in one of those categories is currently on and panning/zooming brings a new
    // county's layer into view, that new layer should join them automatically instead of
    // silently starting off and quietly breaking the "all on" state the user chose.
    setLayerState((current) => {
      let next = current;
      for (const category of masterToggleCategories) {
        const currentIds = new Set(activeLayers.filter((layer) => layer.category === category).map((layer) => layer.id));
        const previousIds = previousMasterToggleIdsRef.current[category];
        const newIds = [...currentIds].filter((id) => !previousIds.has(id));
        if (newIds.length > 0 && previousIds.size > 0 && [...previousIds].every((id) => next[id]?.visible)) {
          if (next === current) next = { ...current };
          for (const id of newIds) next[id] = { ...next[id], visible: true };
        }
        previousMasterToggleIdsRef.current[category] = currentIds;
      }
      return next;
    });
  }, [activeLayers]);

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
    const latestImagery = nextLocation.county ? latestDisplayableImagery(nextLocation.county.replace(/\s+County$/i, "")) : undefined;
    const imageryIds = new Set(layerRegistry.filter((layer) => layer.category === "imagery").map((layer) => layer.id));
    // A fresh location search is a deliberate "start over," not incremental panning, so
    // county-scoped layers reset to their defaults here — otherwise a layer left on near the
    // previous search (kept visible even off-viewport by the edge-case fix in activeLayers)
    // would keep rendering indefinitely after jumping somewhere unrelated.
    setLayerState((current) => Object.fromEntries(Object.entries(current).map(([id, state]) => {
      if (imageryIds.has(id)) return [id, latestImagery ? { ...state, visible: id === latestImagery.id } : state];
      const layer = layerRegistryById.get(id);
      return layer?.county ? [id, { ...state, visible: layer.defaultVisible }] : [id, state];
    })));
    setViewportBounds(null);
    setLocation(nextLocation);
    recordRecentLocation(nextLocation);
  };

  const changeArea = () => {
    setViewportBounds(null);
    setLocation(null);
  };

  const changePrototypeVariant = (variant: PrototypeVariant) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", variant);
    window.history.replaceState(null, "", url);
    setPrototypeVariant(variant);
  };

  const prototypePanel: PrototypePanel = layerPanelOpen ? "layers" : showMyData ? "data" : null;
  const changePrototypePanel = (panel: PrototypePanel) => {
    setLayerPanelOpen(panel === "layers");
    setShowMyData(panel === "data");
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    const layer = activeLayers.find((candidate) => candidate.id === id);
    if (!layer) return;
    const peers = activeLayers.filter((candidate) => (
      candidate.category === layer.category
      && !isTerrainLayer(candidate)
      && (layer.category !== "imagery" || Boolean(candidate.county) === Boolean(layer.county))
    ));
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
    <main className={`app-shell ${prototypeVariant ? `prototype-shell prototype-variant-${prototypeVariant.toLowerCase()} prototype-panel-${prototypePanel ?? "closed"} ${prototypeRailPinned ? "is-rail-pinned" : ""}` : ""}`}>
      <CesiumMap
        layers={activeLayers}
        layerState={layerState}
        location={location}
        verticalExaggeration={verticalExaggeration}
        onResetReady={registerReset}
        onViewControlsReady={registerViewControls}
        onViewportChange={registerViewport}
        onCameraHeightChange={setCameraHeight}
        interactionMode={mode}
        myData={myData}
        myDataVisible={myDataVisible}
        onCoordinateClick={handleCoordinateClick}
        onCursorChange={(longitude, latitude) => setCursor([longitude, latitude])}
        retryVersion={layerRetryVersion}
        onLayerStatusChange={updateLayerStatus}
      />
      {prototypeVariant ? (
        <MobileMapShellPrototype
          variant={prototypeVariant}
          onVariantChange={changePrototypeVariant}
          panel={prototypePanel}
          locationLabel={location.label}
          county={location.county}
          mode={mode}
          railPinned={prototypeRailPinned}
          onPanelChange={changePrototypePanel}
          onModeChange={(nextMode) => { setMode(nextMode); setDraft([]); }}
          onMapView={() => viewControls?.showMapView()}
          onTerrain={showTerrainView}
          onRecenter={() => resetCamera?.()}
          onChangeArea={changeArea}
          onRailPinnedChange={(pinned) => { setPrototypeRailPinned(pinned); if (pinned && !prototypePanel) changePrototypePanel("layers"); }}
        />
      ) : <header className="top-bar">
        <div className="brand"><PinIcon /><h1>MnMapping</h1><span>Personal Minnesota map viewer</span></div>
        <div className="top-actions">
          <div className="selected-location" title={location.label}>
            <PinIcon />
            <span><strong>{location.label}</strong><small>{location.county ?? "County unavailable"}</small></span>
          </div>
          <button className="map-button" type="button" onClick={() => viewControls?.showMapView()}><MapIcon />Map view</button>
          <button className="map-button" type="button" onClick={showTerrainView}><TerrainIcon />Terrain</button>
          <button className="map-button layers-button" type="button" aria-expanded={layerPanelOpen} aria-controls="map-layer-panel" onClick={() => setLayerPanelOpen((value) => !value)}><LayersIcon />Layers</button>
          <button className="map-button compact-action" type="button" onClick={() => resetCamera?.()}><LocateIcon />Recenter</button>
          <button className="map-button change-area" type="button" onClick={changeArea}><SearchIcon />Change area</button>
        </div>
      </header>}
      <LayerPanel
        open={layerPanelOpen}
        onClose={() => setLayerPanelOpen(false)}
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
        externalImagery={externalImagery}
        pendingParcelCounties={pendingParcelCounties}
        pendingPublicLandCounties={pendingPublicLandCounties}
        cameraHeight={cameraHeight}
        runtimeState={layerRuntimeState}
        onRetryLayer={(id) => setLayerRetryVersion((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))}
      />
      {!prototypeVariant && <nav className="map-tools" aria-label="Map inspection and personal data tools">
        {(["inspect", "pin", "line", "polygon"] as const).map((tool) => <button key={tool} type="button" aria-pressed={mode === tool} onClick={() => { setMode(tool); setDraft([]); }}>{tool}</button>)}
        {(mode === "line" || mode === "polygon") && <button type="button" disabled={draft.length < (mode === "polygon" ? 3 : 2)} onClick={() => void finishDrawing()}>Finish ({draft.length})</button>}
        <button type="button" aria-pressed={showMyData} onClick={() => setShowMyData((value) => !value)}>My Data</button>
      </nav>}
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
