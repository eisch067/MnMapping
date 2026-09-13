"use client";

import { useCallback, useState } from "react";
import { layerRegistry } from "@/config/layers";
import { LayerPanel } from "@/components/ui/LayerPanel";
import { createInitialLayerState } from "@/lib/map/layerState";
import { CesiumMap } from "./CesiumMap";

export function MapShell() {
  const [layerState, setLayerState] = useState(() => createInitialLayerState(layerRegistry));
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);

  return (
    <main className="app-shell">
      <CesiumMap layerState={layerState} onResetReady={registerReset} />
      <header className="top-bar">
        <div className="brand"><h1>MnMapping</h1><span>Personal Minnesota map viewer</span></div>
        <div className="top-actions"><button className="map-button" type="button" onClick={() => resetCamera?.()}>Minnesota</button></div>
      </header>
      <LayerPanel
        layers={layerRegistry}
        state={layerState}
        onVisibilityChange={(id, visible) => setLayerState((current) => ({
          ...current,
          [id]: { ...current[id], visible },
        }))}
        onOpacityChange={(id, opacity) => setLayerState((current) => ({
          ...current,
          [id]: { ...current[id], opacity },
        }))}
      />
      <div className="status">Pan, zoom, rotate, and tilt with your mouse or trackpad.</div>
    </main>
  );
}
