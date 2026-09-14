"use client";

import { useCallback, useMemo, useState } from "react";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { LayerPanel } from "@/components/ui/LayerPanel";
import { LayersIcon, LocateIcon, MapIcon, PinIcon, SearchIcon, TerrainIcon } from "@/components/ui/MapIcons";
import { initialCountyForName, type MapLocation } from "@/lib/location";
import { createInitialLayerState } from "@/lib/map/layerState";
import { CesiumMap, type MapViewControls } from "./CesiumMap";
import { LocationGate } from "./LocationGate";

export function MapShell() {
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [layerState, setLayerState] = useState(() => createInitialLayerState(layerRegistry));
  const [verticalExaggeration, setVerticalExaggeration] = useState(1);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);
  const registerViewControls = useCallback((controls: MapViewControls) => setViewControls(controls), []);
  const terrainLayer = layerRegistry.find(isTerrainLayer);
  const selectedCounty = initialCountyForName(location?.county);
  const activeLayers = useMemo(
    () => layerRegistry.filter((layer) => !layer.county || layer.county === selectedCounty),
    [selectedCounty],
  );

  const showTerrainView = () => {
    if (terrainLayer) {
      setLayerState((current) => ({
        ...current,
        [terrainLayer.id]: { ...current[terrainLayer.id], visible: true },
      }));
    }
    viewControls?.showTerrainView();
  };

  if (!location) return <LocationGate onLocationSelect={setLocation} />;

  return (
    <main className="app-shell">
      <CesiumMap
        layers={activeLayers}
        layerState={layerState}
        location={location}
        verticalExaggeration={verticalExaggeration}
        onResetReady={registerReset}
        onViewControlsReady={registerViewControls}
      />
      <header className="top-bar">
        <div className="brand"><PinIcon /><h1>MnMapping</h1><span>{location.label}</span></div>
        <div className="top-actions">
          <button className="map-button" type="button" onClick={() => viewControls?.showMapView()}><MapIcon />Map view</button>
          <button className="map-button" type="button" onClick={showTerrainView}><TerrainIcon />Terrain</button>
          <button className="map-button compact-action" type="button" onClick={() => resetCamera?.()}><LocateIcon />Recenter</button>
          <button className="map-button change-area" type="button" onClick={() => setLocation(null)}><SearchIcon />Change area</button>
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
      />
      <div className="status"><LayersIcon />{selectedCounty ? `${selectedCounty} County sources available` : "Statewide sources available"}</div>
    </main>
  );
}
