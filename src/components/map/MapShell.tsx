"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { LayerPanel } from "@/components/ui/LayerPanel";
import { LayersIcon, LocateIcon, MapIcon, PinIcon, SearchIcon, TerrainIcon } from "@/components/ui/MapIcons";
import { initialCountyForName, supportedCountiesInViewport, type MapLocation, type ViewportBounds } from "@/lib/location";
import { restoreLayerOrder, restoreLayerState, restoreVerticalExaggeration, saveLayerPreferences } from "@/lib/map/layerState";
import { CesiumMap, type MapViewControls } from "./CesiumMap";
import { LocationGate } from "./LocationGate";

export function MapShell() {
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [layerState, setLayerState] = useState(() => restoreLayerState(layerRegistry));
  const [layerOrder, setLayerOrder] = useState(() => restoreLayerOrder(layerRegistry));
  const [verticalExaggeration, setVerticalExaggeration] = useState(restoreVerticalExaggeration);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
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
      <div className="status"><LayersIcon />{viewportCounties.length ? `Viewport: ${viewportCounties.join(", ")}` : "Viewport: statewide sources only"}</div>
    </main>
  );
}
