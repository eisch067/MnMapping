"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayersIcon } from "@/components/ui/MapIcons";
import { isTerrainLayer } from "@/config/layers/types";
import { MapControls } from "@/components/shell/MapControls";
import { SheetHost } from "@/components/shell/SheetHost";
import { ShellHeader } from "@/components/shell/ShellHeader";
import { ToolRow } from "@/components/shell/ToolRow";
import { shellSheets, sheetIds } from "@/components/shell/shellSheets";
import { useLayerControls } from "@/components/shell/useLayerControls";
import { useMapTools } from "@/components/shell/useMapTools";
import { useExchange } from "@/components/shell/useExchange";
import { useIdentify } from "@/components/shell/useIdentify";
import { useMyData } from "@/components/shell/useMyData";
import { useShapeDrawing } from "@/components/shell/useShapeDrawing";
import { useSheetState } from "@/components/shell/useSheetState";
import type { Bounds } from "@/lib/exchange/bounds";
import type { IdentifyPoint } from "@/lib/identify/types";
import { isPersonalMode } from "@/config/appMode";
import type { MapLocation, ViewportBounds } from "@/lib/location";
import type { Position } from "@/lib/geodesy";
import { recordRecentLocation } from "@/lib/locationHistory";
import { CesiumMap, type MapViewControls } from "./CesiumMap";
import { LocationGate } from "./LocationGate";
import { TerrainCoachMark } from "./TerrainCoachMark";
import { ExpiredSignInDialog } from "./ExpiredSignInDialog";
import { probeSession } from "@/lib/sessionProbe";

function statusText(cursor: [number, number] | null, viewportCounties: readonly string[]): string {
  if (cursor) return `${cursor[1].toFixed(5)}, ${cursor[0].toFixed(5)}`;
  return viewportCounties.length
    ? `Viewport: ${viewportCounties.join(", ")}`
    : "Viewport: statewide sources only";
}

export function MapShell() {
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [viewportCenter, setViewportCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cameraHeight, setCameraHeight] = useState(Number.POSITIVE_INFINITY);
  const [heading, setHeading] = useState(0);
  const [observer, setObserver] = useState<Position | null>(null);
  const [pickingObserver, setPickingObserver] = useState(false);
  const [showExpiredSignIn, setShowExpiredSignIn] = useState(false);
  const probingSessionRef = useRef(false);
  const expiredDialogOpenRef = useRef(false);
  const layerFailuresAwaitingProbeRef = useRef(new Set<string>());
  const failedWhileSignedOutRef = useRef(new Set<string>());
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [viewControls, setViewControls] = useState<MapViewControls | null>(null);
  const registerReset = useCallback((reset: () => void) => setResetCamera(() => reset), []);
  const updateViewport = useCallback((bounds: ViewportBounds, center: { latitude: number; longitude: number }) => {
    setViewportBounds(bounds);
    setViewportCenter(center);
  }, []);
  const layerControls = useLayerControls(location, viewportBounds, viewportCenter);
  const retryLayer = layerControls.drawer.onRetryLayer;
  const checkSessionAfterLayerFailure = useCallback(async () => {
    if (!isPersonalMode || probingSessionRef.current) return;
    probingSessionRef.current = true;
    try {
      const status = await probeSession();
      if (status === "sign-in-required") {
        for (const id of layerFailuresAwaitingProbeRef.current) failedWhileSignedOutRef.current.add(id);
        expiredDialogOpenRef.current = true;
        setShowExpiredSignIn(true);
      }
      layerFailuresAwaitingProbeRef.current.clear();
    } finally {
      probingSessionRef.current = false;
    }
  }, []);
  const onProxyRequestFailure = useCallback((id: string) => {
    if (!isPersonalMode) return;
    if (expiredDialogOpenRef.current) {
      failedWhileSignedOutRef.current.add(id);
      return;
    }
    layerFailuresAwaitingProbeRef.current.add(id);
    void checkSessionAfterLayerFailure();
  }, [checkSessionAfterLayerFailure]);
  const retryFailedWhileSignedOut = useCallback(() => {
    for (const id of failedWhileSignedOutRef.current) retryLayer(id);
    failedWhileSignedOutRef.current.clear();
    expiredDialogOpenRef.current = false;
    setShowExpiredSignIn(false);
  }, [retryLayer]);
  useEffect(() => {
    if (!showExpiredSignIn || !isPersonalMode) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || probingSessionRef.current) return;
      probingSessionRef.current = true;
      void probeSession().then((status) => {
        if (status === "signed-in") retryFailedWhileSignedOut();
      }).finally(() => {
        probingSessionRef.current = false;
      });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [retryFailedWhileSignedOut, showExpiredSignIn]);
  const myData = useMyData();
  const tools = useMapTools(myData.add);
  const shapes = useShapeDrawing(myData.add, myData.onUpdateItemGeometry);
  const identify = useIdentify({
    layers: layerControls.map.layers,
    layerState: layerControls.map.layerState,
    cameraHeight,
    myData: myData.items,
    myDataVisible: myData.visible,
  });
  const showBounds = useCallback(
    (bounds: Bounds) => viewControls?.showBounds(bounds),
    [viewControls],
  );
  // A drawing tool is only armed while the Add sheet that shows it is open.
  const sheet = useSheetState({
    defaultId: sheetIds.layers,
    onChange: (openId) => {
      if (openId !== sheetIds.add) {
        tools.reset();
        shapes.cancel();
      }
      if (openId !== sheetIds.terrain) setPickingObserver(false);
    },
  });

  const exchange = useExchange({
    myData,
    openSheet: sheet.open,
    closeSheet: sheet.close,
    showBounds,
  });

  const showTerrainView = () => {
    layerControls.enableTerrain();
    viewControls?.showTerrainView();
  };
  const showMapView = () => viewControls?.showMapView();
  const chooseLocation = (next: MapLocation) => {
    layerControls.resetForLocation(next);
    setViewportBounds(null);
    setViewportCenter(null);
    setLocation(next);
    recordRecentLocation(next);
  };
  const changeArea = () => {
    setObserver(null);
    setPickingObserver(false);
    setViewportBounds(null);
    setViewportCenter(null);
    setLocation(null);
  };
  const handleMapClick = (point: IdentifyPoint) => {
    if (pickingObserver) {
      setObserver([point.longitude, point.latitude]);
      setPickingObserver(false);
      return;
    }
    if (shapes.active) {
      if (!shapes.active.item) shapes.addPoint(point.longitude, point.latitude);
      return;
    }
    tools.handleCoordinateClick(point.longitude, point.latitude);
    if (tools.mode === "inspect") void identify.identify(point);
    if (sheet.openId === null) sheet.open(sheetIds.explore);
  };

  if (!location) return <LocationGate onLocationSelect={chooseLocation} />;

  const terrainLayer = layerControls.drawer.layers.find(isTerrainLayer);
  const sheets = shellSheets({
    layers: { ...layerControls.drawer, cameraHeight },
    myData: {
      ...myData,
      onImportFile: exchange.importFile,
      onExportScope: exchange.startExport,
      onOpenBackup: exchange.openBackup,
      onEditItem: (item) => {
        shapes.startEditing(item);
        sheet.open(sheetIds.add);
      },
    },
    explore: { state: identify, onSelect: identify.select, onClear: identify.clear },
    terrain: {
      observer,
      pickingObserver,
      thresholdBounds: viewportBounds,
      terrainEnabled: Boolean(terrainLayer && layerControls.drawer.state[terrainLayer.id]?.visible),
      onTerrainVisibilityChange: (visible: boolean) => {
        if (terrainLayer) layerControls.drawer.onVisibilityChange(terrainLayer.id, visible);
      },
      onPickObserver: () => setPickingObserver(true),
    },
    add: {
      mode: tools.mode,
      settingsReady: Boolean(myData.settings),
      shape: shapes.active ? {
        editing: Boolean(shapes.active.item),
        kind: shapes.active.kind,
        itemName: shapes.active.item?.name,
        vertexCount: shapes.active.state.vertices.length,
        minimumVertices: shapes.minimumVertices,
        canUndo: shapes.active.state.history.length > 0,
        measurement: shapes.measurement,
        elevationMeasurement: shapes.elevationMeasurement,
        allowElevationMeasurements: isPersonalMode,
        lineDimension: shapes.active.kind === "line" && shapes.active.primaryDimension && "unit" in shapes.active.primaryDimension
          ? shapes.active.primaryDimension.kind
          : undefined,
        onLineDimensionChange: shapes.setLineDimension,
        polygonDimension: shapes.active.primaryDimension && "areaUnit" in shapes.active.primaryDimension
          ? shapes.active.primaryDimension.kind
          : undefined,
        onDimensionChange: shapes.setPolygonDimension,
        onUndo: shapes.undo,
        onCancel: shapes.cancel,
        onSave: () => void shapes.save(),
      } : null,
      onPinToggle: () => tools.selectMode(tools.mode === "pin" ? "inspect" : "pin"),
      onStartShape: (kind) => {
        tools.reset();
        shapes.startDrawing(kind, myData.settings);
      },
    },
    mapView: { onMapView: showMapView, onTerrainView: showTerrainView },
    exchange: {
      export: { scope: exchange.resolvedScope, folders: myData.folders },
      importResult: {
        result: exchange.importResult,
        onShowOnMap: exchange.showImportOnMap,
        onUndo: exchange.undoImport,
      },
      backup: {
        restoreResult: exchange.restoreResult,
        onArchive: exchange.archiveNow,
        onRestore: exchange.restoreFile,
        onDeleteAll: exchange.deleteAll,
      },
    },
  });

  return (
    <div className={`app-shell ${sheet.docked ? "is-docked" : ""} ${pickingObserver ? "is-picking-observer" : ""}`}>
      <main className="map-region">
        <CesiumMap
          {...layerControls.map}
          onProxyRequestFailure={onProxyRequestFailure}
          location={location}
          onResetReady={registerReset}
          onViewControlsReady={setViewControls}
          onViewportChange={updateViewport}
          onCameraHeightChange={setCameraHeight}
          onHeadingChange={setHeading}
          interactionMode={shapes.active ? (shapes.active.item ? "edit" : shapes.active.kind) : tools.mode}
          myData={myData.items}
          myDataVisible={myData.visible}
          crosshair={identify.point}
          onMapClick={handleMapClick}
          drawingOverlay={shapes.overlay}
          onMidpointInsert={shapes.insertMidpoint}
          onCursorChange={(longitude, latitude) => setCursor([longitude, latitude])}
        />
      </main>
      <ShellHeader location={location} onChangeArea={changeArea} />
      <TerrainCoachMark onOpenLayers={() => sheet.open(sheetIds.layers)} />
      {isPersonalMode && showExpiredSignIn && (
        <ExpiredSignInDialog onDismiss={() => {
          expiredDialogOpenRef.current = false;
          setShowExpiredSignIn(false);
        }} />
      )}
      <MapControls
        onRecenter={() => resetCamera?.()}
        onTerrain={showTerrainView}
        heading={heading}
        showCompass={isPersonalMode}
        onResetNorth={() => viewControls?.resetNorth()}
      />
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
