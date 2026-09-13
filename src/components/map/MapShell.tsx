"use client";

import { useCallback, useState } from "react";
import { layerRegistry } from "@/config/layers";
import { CesiumMap } from "./CesiumMap";

export function MapShell() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(layerRegistry.map((layer) => [layer.id, layer.defaultVisible])),
  );
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);

  return (
    <main className="app-shell">
      <CesiumMap visibility={visibility} onResetReady={registerReset} />
      <header className="top-bar">
        <div className="brand"><h1>MnMapping</h1><span>Personal Minnesota map viewer</span></div>
        <div className="top-actions"><button className="map-button" type="button" onClick={() => resetCamera?.()}>Minnesota</button></div>
      </header>
      <aside className="side-panel" aria-label="Map layers and tools">
        <h2>Layers</h2>
        <p className="panel-note">Available map sources are registered as data, independent of this panel.</p>
        <div className="layer-list">
          {layerRegistry.map((layer) => (
            <label className="layer-row" key={layer.id}>
              <input type="checkbox" checked={visibility[layer.id] ?? false} onChange={(event) => setVisibility((current) => ({ ...current, [layer.id]: event.target.checked }))} />
              <span><span className="layer-name">{layer.name}</span><span className="layer-meta">{layer.category} · {layer.attribution}</span></span>
            </label>
          ))}
        </div>
      </aside>
      <div className="status">Pan, zoom, rotate, and tilt with your mouse or trackpad.</div>
    </main>
  );
}
