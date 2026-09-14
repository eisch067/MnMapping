"use client";

import { useCallback, useState } from "react";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { LayerPanel } from "@/components/ui/LayerPanel";
import { createInitialLayerState } from "@/lib/map/layerState";
import { CesiumMap, type MapViewControls } from "./CesiumMap";

export function MapShell() {
  const [layerState, setLayerState] = useState(() => createInitialLayerState(layerRegistry));
  const [verticalExaggeration, setVerticalExaggeration] = useState(1);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);
  const registerViewControls = useCallback((controls: MapViewControls) => setViewControls(controls), []);
  const terrainLayer = layerRegistry.find(isTerrainLayer);

  const showTerrainView = () => {
    if (terrainLayer) {
      setLayerState((current) => ({
        ...current,
        [terrainLayer.id]: { ...current[terrainLayer.id], visible: true },
      }));
    }
    viewControls?.showTerrainView();
  };

  return (
    <main className="app-shell">
      <CesiumMap
        layerState={layerState}
        verticalExaggeration={verticalExaggeration}
        onResetReady={registerReset}
        onViewControlsReady={registerViewControls}
      />
      <header className="top-bar">
        <div className="brand"><h1>MnMapping</h1><span>Personal Minnesota map viewer</span></div>
        <div className="top-actions">
          <button className="map-button" type="button" onClick={() => viewControls?.showMapView()}>Map view</button>
          <button className="map-button" type="button" onClick={showTerrainView}>Terrain view</button>
          <button className="map-button compact-action" type="button" onClick={() => resetCamera?.()}>Minnesota</button>
        </div>
      </header>
      <LayerPanel
        layers={layerRegistry}
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
      />
      <div className="status">Pan, zoom, rotate, and tilt with your mouse or trackpad.</div>
    </main>
  );
}
