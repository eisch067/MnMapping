"use client";

import { useCallback, useState } from "react";
import { LayersIcon } from "@/components/ui/MapIcons";
import { MapControls } from "@/components/shell/MapControls";
import { SheetHost } from "@/components/shell/SheetHost";
import { ShellHeader } from "@/components/shell/ShellHeader";
import { ToolRow } from "@/components/shell/ToolRow";
import { shellSheets, sheetIds } from "@/components/shell/shellSheets";
import { useLayerControls } from "@/components/shell/useLayerControls";
import { useMapTools } from "@/components/shell/useMapTools";
import { useIdentify } from "@/components/shell/useIdentify";
import { useMyData } from "@/components/shell/useMyData";
import { useSheetState } from "@/components/shell/useSheetState";
import type { IdentifyPoint } from "@/lib/identify/types";
import type { MapLocation, ViewportBounds } from "@/lib/location";
import { recordRecentLocation } from "@/lib/locationHistory";
import { CesiumMap, type MapViewControls } from "./CesiumMap";
import { LocationGate } from "./LocationGate";

function statusText(cursor: [number, number] | null, viewportCounties: readonly string[]): string {
  if (cursor) return `${cursor[1].toFixed(5)}, ${cursor[0].toFixed(5)}`;
  return viewportCounties.length
    ? `Viewport: ${viewportCounties.join(", ")}`
    : "Viewport: statewide sources only";
}

export function MapShell() {
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [cameraHeight, setCameraHeight] = useState(Number.POSITIVE_INFINITY);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);
  const layerControls = useLayerControls(location, viewportBounds);
  const myData = useMyData();
  const tools = useMapTools(myData.add);
  const identify = useIdentify({
    layers: layerControls.map.layers,
    layerState: layerControls.map.layerState,
    cameraHeight,
    myData: myData.items,
    myDataVisible: myData.visible,
  });
  // A drawing tool is only armed while the Add sheet that shows it is open.
  const sheet = useSheetState({
    defaultId: sheetIds.layers,
    onChange: (openId) => {
      if (openId !== sheetIds.add) tools.reset();
    },
  });

  const showTerrainView = () => {
    layerControls.enableTerrain();
    viewControls?.showTerrainView();
  };
  const showMapView = () => viewControls?.showMapView();
  const chooseLocation = (next: MapLocation) => {
    layerControls.resetForLocation(next);
    setViewportBounds(null);
    setLocation(next);
    recordRecentLocation(next);
  };
  const changeArea = () => {
    setViewportBounds(null);
    setLocation(null);
  };
  const handleMapClick = (point: IdentifyPoint) => {
    tools.handleCoordinateClick(point.longitude, point.latitude);
    if (tools.mode === "inspect") void identify.identify(point);
    if (sheet.openId === null) sheet.open(sheetIds.explore);
  };

  if (!location) return <LocationGate onLocationSelect={chooseLocation} />;

  const sheets = shellSheets({
    layers: { ...layerControls.drawer, cameraHeight },
    myData,
    explore: { state: identify, onSelect: identify.select, onClear: identify.clear },
    add: {
      mode: tools.mode,
      vertexCount: tools.draft.length,
      onModeChange: tools.selectMode,
      onFinish: () => void tools.finishDrawing(),
    },
    mapView: { onMapView: showMapView, onTerrainView: showTerrainView },
  });

  return (
    <div className={`app-shell ${sheet.docked ? "is-docked" : ""}`}>
      <main className="map-region">
        <CesiumMap
          {...layerControls.map}
          location={location}
          onResetReady={registerReset}
          onViewControlsReady={setViewControls}
          onViewportChange={setViewportBounds}
          onCameraHeightChange={setCameraHeight}
          interactionMode={tools.mode}
          myData={myData.items}
          myDataVisible={myData.visible}
          crosshair={identify.point}
          onMapClick={handleMapClick}
          onCursorChange={(longitude, latitude) => setCursor([longitude, latitude])}
        />
      </main>
      <ShellHeader location={location} onChangeArea={changeArea} />
      <MapControls onRecenter={() => resetCamera?.()} onTerrain={showTerrainView} />
      <SheetHost
        sheets={sheets}
        visibleId={sheet.visibleId}
        docked={sheet.docked}
        onSelect={sheet.open}
        onClose={sheet.close}
        onEngage={sheet.commit}
        hover={sheet.hover}
      />
      <ToolRow
        sheets={sheets}
        openId={sheet.openId}
        pinned={sheet.pinned}
        onToggle={sheet.toggle}
        onPinnedChange={sheet.setPinned}
        hover={sheet.hover}
      />
      <div className="status">
        <LayersIcon />
        {statusText(cursor, layerControls.viewportCounties)}
      </div>
    </div>
  );
}
