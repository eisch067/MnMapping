"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJsonDataSource, ImageryLayer, TerrainProvider, Viewer } from "cesium";
import type { LayerDefinition } from "@/config/layers";
import { isLayerAvailableAtCameraHeight, isTerrainLayer } from "@/config/layers/types";
import { cameraHeightForLocation, type MapLocation, type ViewportBounds } from "@/lib/location";
import { applyGeoJsonOpacity, createLayerResource } from "@/lib/map/createLayer";
import type { LayerStateById } from "@/lib/map/layerState";
import type { LayerRuntimeState } from "@/lib/map/layerRuntime";
import type { MyMapItem } from "@/lib/myData";
import { toGeoJson } from "@/lib/myData";

export type InteractionMode = "inspect" | "pin" | "line" | "polygon";

interface CesiumMapProps {
  layers: readonly LayerDefinition[];
  layerState: LayerStateById;
  location: MapLocation;
  verticalExaggeration: number;
  onResetReady: (reset: () => void) => void;
  onViewControlsReady: (controls: MapViewControls) => void;
  onViewportChange: (bounds: ViewportBounds) => void;
  onCameraHeightChange: (height: number) => void;
  interactionMode: InteractionMode;
  myData: readonly MyMapItem[];
  myDataVisible: boolean;
  onCoordinateClick: (longitude: number, latitude: number) => void;
  onCursorChange: (longitude: number, latitude: number) => void;
  retryVersion: Readonly<Record<string, number>>;
  onLayerStatusChange: (id: string, state: LayerRuntimeState) => void;
}

export interface MapViewControls {
  showMapView: () => void;
  showTerrainView: () => void;
}

export function CesiumMap({
  layers,
  layerState,
  location,
  verticalExaggeration,
  onResetReady,
  onViewControlsReady,
  onViewportChange,
  onCameraHeightChange,
  interactionMode,
  myData,
  myDataVisible,
  onCoordinateClick,
  onCursorChange,
  retryVersion,
  onLayerStatusChange,
}: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const imageryRef = useRef(new Map<string, ImageryLayer>());
  const pendingImageryRef = useRef(new Set<string>());
  const failedImageryRef = useRef(new Set<string>());
  const imageryErrorCleanupRef = useRef(new Map<string, () => void>());
  const dataSourcesRef = useRef(new Map<string, GeoJsonDataSource>());
  const dataRequestRef = useRef(new Map<string, number>());
  const dataExtentRef = useRef(new Map<string, string>());
  const pendingDataExtentRef = useRef(new Map<string, string>());
  const failedDataExtentRef = useRef(new Map<string, string>());
  const dataAbortRef = useRef(new Map<string, AbortController>());
  const terrainRef = useRef<TerrainProvider | null>(null);
  const pendingTerrainRef = useRef(false);
  const ellipsoidTerrainRef = useRef<TerrainProvider | null>(null);
  const layerStateRef = useRef(layerState);
  const exaggerationRef = useRef(verticalExaggeration);
  const coordinateClickRef = useRef(onCoordinateClick);
  const cursorChangeRef = useRef(onCursorChange);
  const layerStatusChangeRef = useRef(onLayerStatusChange);
  const retryVersionRef = useRef<Record<string, number>>({});
  const activeLayerIdsRef = useRef(new Set(layers.map((layer) => layer.id)));
  const personalDataRef = useRef<GeoJsonDataSource | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [viewportBounds, setInternalViewportBounds] = useState<ViewportBounds | null>(null);
  const [cameraHeight, setCameraHeight] = useState(Number.POSITIVE_INFINITY);

  useEffect(() => {
    if (!containerRef.current) return;
    window.CESIUM_BASE_URL = "/cesium";
    let cancelled = false;
    const imageryLayers = imageryRef.current;
    const pendingImagery = pendingImageryRef.current;
    const failedImagery = failedImageryRef.current;
    const imageryErrorCleanup = imageryErrorCleanupRef.current;
    const dataSources = dataSourcesRef.current;
    const dataRequests = dataRequestRef.current;
    const dataExtents = dataExtentRef.current;
    const pendingDataExtents = pendingDataExtentRef.current;
    const failedDataExtents = failedDataExtentRef.current;
    const dataAborts = dataAbortRef.current;

    void import("cesium").then(({ Cartesian3, Math: CesiumMath, SceneMode, ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer }) => {
      if (cancelled || !containerRef.current) return;
      const height = cameraHeightForLocation(location.kind);
      const mapView = {
        destination: Cartesian3.fromDegrees(location.longitude, location.latitude, height),
        orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 },
      };
      const terrainView = {
        destination: Cartesian3.fromDegrees(location.longitude, location.latitude, Math.min(height, 22_000)),
        orientation: { heading: CesiumMath.toRadians(345), pitch: CesiumMath.toRadians(-38), roll: 0 },
      };
      const viewer = new Viewer(containerRef.current, {
        baseLayer: false,
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: true,
        navigationHelpButton: false,
        // Cesium's 3D globe mode tessellates terrain geometry continuously even without a
        // terrain provider selected. Starting in 2D (a flat orthographic projection with no
        // globe/terrain work) keeps the common case cheap; morphTo3D is only triggered once
        // someone asks for the tilted terrain view or enables the 3D Terrain layer.
        sceneMode: SceneMode.SCENE2D,
        sceneModePicker: true,
        selectionIndicator: true,
        timeline: false,
      });
      viewerRef.current = viewer;
      ellipsoidTerrainRef.current = viewer.terrainProvider;
      viewer.scene.verticalExaggeration = exaggerationRef.current;
      viewer.camera.setView(mapView);
      onResetReady(() => viewer.camera.flyTo({ ...mapView, duration: 0.8 }));
      onViewControlsReady({
        showMapView: () => {
          viewer.scene.morphTo2D(0);
          viewer.camera.flyTo({ ...mapView, duration: 1.1 });
        },
        showTerrainView: () => {
          viewer.scene.morphTo3D(0);
          viewer.camera.flyTo({ ...terrainView, duration: 1.4 });
        },
      });
      const reportViewport = () => {
        const rectangle = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
        if (!rectangle) return;
        const bounds = {
          west: CesiumMath.toDegrees(rectangle.west),
          south: CesiumMath.toDegrees(rectangle.south),
          east: CesiumMath.toDegrees(rectangle.east),
          north: CesiumMath.toDegrees(rectangle.north),
        };
        setInternalViewportBounds(bounds);
        const currentCameraHeight = viewer.camera.positionCartographic.height;
        setCameraHeight(currentCameraHeight);
        onCameraHeightChange(currentCameraHeight);
        onViewportChange(bounds);
      };
      viewer.camera.moveEnd.addEventListener(reportViewport);
      const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
      const positionAt = (screen: import("cesium").Cartesian2) => {
        const cartesian = viewer.camera.pickEllipsoid(screen, viewer.scene.globe.ellipsoid);
        if (!cartesian) return null;
        const point = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        return [CesiumMath.toDegrees(point.longitude), CesiumMath.toDegrees(point.latitude)] as const;
      };
      handler.setInputAction((movement: { endPosition: import("cesium").Cartesian2 }) => {
        const point = positionAt(movement.endPosition);
        if (point) cursorChangeRef.current(point[0], point[1]);
      }, ScreenSpaceEventType.MOUSE_MOVE);
      handler.setInputAction((event: { position: import("cesium").Cartesian2 }) => {
        const point = positionAt(event.position);
        if (point) coordinateClickRef.current(point[0], point[1]);
      }, ScreenSpaceEventType.LEFT_CLICK);
      reportViewport();
      setMapReady(true);
    }).catch((error: unknown) => console.error("Unable to initialize the map", error));

    return () => {
      cancelled = true;
      imageryLayers.clear();
      pendingImagery.clear();
      failedImagery.clear();
      for (const cleanup of imageryErrorCleanup.values()) cleanup();
      imageryErrorCleanup.clear();
      dataSources.clear();
      dataRequests.clear();
      dataExtents.clear();
      pendingDataExtents.clear();
      failedDataExtents.clear();
      for (const controller of dataAborts.values()) controller.abort();
      dataAborts.clear();
      personalDataRef.current = null;
      terrainRef.current = null;
      pendingTerrainRef.current = false;
      ellipsoidTerrainRef.current = null;
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [location, onCameraHeightChange, onResetReady, onViewControlsReady, onViewportChange]);

  useEffect(() => { coordinateClickRef.current = onCoordinateClick; }, [onCoordinateClick]);
  useEffect(() => { cursorChangeRef.current = onCursorChange; }, [onCursorChange]);
  useEffect(() => { layerStatusChangeRef.current = onLayerStatusChange; }, [onLayerStatusChange]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!mapReady || !viewer) return;
    let cancelled = false;
    void import("cesium").then(async ({ Color, ConstantProperty, GeoJsonDataSource }) => {
      const dataSource = await GeoJsonDataSource.load(toGeoJson(myData), { clampToGround: false, markerColor: Color.fromCssColorString("#de6b48"), stroke: Color.fromCssColorString("#de6b48"), fill: Color.fromCssColorString("#de6b48").withAlpha(0.2), strokeWidth: 3 });
      for (const entity of dataSource.entities.values) {
        if (entity.polygon) {
          entity.polygon.height = new ConstantProperty(0);
          entity.polygon.outline = new ConstantProperty(true);
        }
        if (entity.polyline) entity.polyline.clampToGround = new ConstantProperty(true);
      }
      dataSource.name = "My Data";
      dataSource.show = myDataVisible;
      if (cancelled || viewer.isDestroyed()) return;
      const previous = personalDataRef.current;
      await viewer.dataSources.add(dataSource);
      personalDataRef.current = dataSource;
      if (previous) viewer.dataSources.remove(previous, true);
    });
    return () => { cancelled = true; };
  }, [mapReady, myData, myDataVisible]);

  useEffect(() => {
    layerStateRef.current = layerState;
    const viewer = viewerRef.current;
    if (!mapReady || !viewer) return;

    const activeLayerIds = new Set(layers.map((layer) => layer.id));
    activeLayerIdsRef.current = activeLayerIds;
    for (const layer of layers) {
      const retry = retryVersion[layer.id] ?? 0;
      if (retry === (retryVersionRef.current[layer.id] ?? 0)) continue;
      retryVersionRef.current[layer.id] = retry;
      failedImageryRef.current.delete(layer.id);
      failedDataExtentRef.current.delete(layer.id);
      const imagery = imageryRef.current.get(layer.id);
      if (imagery) {
        imageryErrorCleanupRef.current.get(layer.id)?.();
        imageryErrorCleanupRef.current.delete(layer.id);
        viewer.imageryLayers.remove(imagery, true);
        imageryRef.current.delete(layer.id);
      }
    }
    for (const [id, imagery] of imageryRef.current) {
      if (activeLayerIds.has(id)) continue;
      imageryErrorCleanupRef.current.get(id)?.();
      imageryErrorCleanupRef.current.delete(id);
      viewer.imageryLayers.remove(imagery, true);
      imageryRef.current.delete(id);
      pendingImageryRef.current.delete(id);
      failedImageryRef.current.delete(id);
      layerStatusChangeRef.current(id, { status: "idle" });
    }
    for (const [id, dataSource] of dataSourcesRef.current) {
      if (activeLayerIds.has(id)) continue;
      viewer.dataSources.remove(dataSource, true);
      dataSourcesRef.current.delete(id);
      dataExtentRef.current.delete(id);
      pendingDataExtentRef.current.delete(id);
      failedDataExtentRef.current.delete(id);
      dataAbortRef.current.get(id)?.abort();
      dataAbortRef.current.delete(id);
      dataRequestRef.current.set(id, (dataRequestRef.current.get(id) ?? 0) + 1);
      layerStatusChangeRef.current(id, { status: "idle" });
    }
    for (const [id, imagery] of imageryRef.current) {
      const currentState = layerState[id];
      const definition = layers.find((layer) => layer.id === id);
      // Cesium layers expose visibility through an intentionally mutable object API.
      // eslint-disable-next-line react-hooks/immutability
      imagery.show = activeLayerIds.has(id)
        && (currentState?.visible ?? false)
        && Boolean(definition && isLayerAvailableAtCameraHeight(definition, cameraHeight));
      imagery.alpha = currentState?.opacity ?? 1;
    }
    for (const [id, dataSource] of dataSourcesRef.current) {
      const currentState = layerState[id];
      // Cesium data sources expose visibility through an intentionally mutable object API.
      // eslint-disable-next-line react-hooks/immutability
      dataSource.show = activeLayerIds.has(id) && (currentState?.visible ?? false);
      const definition = layers.find((layer) => layer.id === id);
      if (definition) void applyGeoJsonOpacity(dataSource, definition, currentState?.opacity ?? 1);
    }

    layers.forEach((layer) => {
      const currentState = layerState[layer.id];
      if (isTerrainLayer(layer) || layer.sourceType === "arcgis-featureserver" || layer.sourceType === "geojson" || !currentState?.visible || !isLayerAvailableAtCameraHeight(layer, cameraHeight) || imageryRef.current.has(layer.id) || pendingImageryRef.current.has(layer.id) || failedImageryRef.current.has(layer.id)) return;
      pendingImageryRef.current.add(layer.id);
      layerStatusChangeRef.current(layer.id, { status: "loading", message: "Loading imagery…" });
      void createLayerResource(layer).then((resource) => {
        pendingImageryRef.current.delete(layer.id);
        const currentViewer = viewerRef.current;
        if (!currentViewer || currentViewer.isDestroyed() || !("alpha" in resource) || !activeLayerIdsRef.current.has(layer.id)) return;
        const latestState = layerStateRef.current[layer.id];
        resource.show = latestState?.visible ?? false;
        resource.alpha = latestState?.opacity ?? layer.defaultOpacity;
        currentViewer.imageryLayers.add(resource);
        imageryRef.current.set(layer.id, resource);
        const removeErrorListener = resource.errorEvent.addEventListener((error: { retry?: boolean; message?: string }) => {
          error.retry = true;
          layerStatusChangeRef.current(layer.id, { status: "error", message: error.message ?? "An imagery tile failed to load." });
        });
        imageryErrorCleanupRef.current.set(layer.id, removeErrorListener);
        layerStatusChangeRef.current(layer.id, { status: "ready" });
        synchronizeImageryOrder(currentViewer, layers, imageryRef.current);
      }).catch((error: unknown) => {
        pendingImageryRef.current.delete(layer.id);
        failedImageryRef.current.add(layer.id);
        layerStatusChangeRef.current(layer.id, { status: "error", message: errorMessage(error, "Unable to load imagery.") });
        console.error(`Unable to load ${layer.name}`, error);
      });
    });

    if (viewportBounds) {
      const extentKey = [viewportBounds.west, viewportBounds.south, viewportBounds.east, viewportBounds.north]
        .map((value) => value.toFixed(3))
        .join(",");
      for (const layer of layers) {
        const currentState = layerState[layer.id];
        const maxCameraHeight = Number(layer.options?.maxCameraHeight ?? Number.POSITIVE_INFINITY);
        if (layer.sourceType !== "arcgis-featureserver") continue;
        if (!currentState?.visible || cameraHeight > maxCameraHeight) {
          dataAbortRef.current.get(layer.id)?.abort();
          dataAbortRef.current.delete(layer.id);
          const existing = dataSourcesRef.current.get(layer.id);
          if (existing) viewer.dataSources.remove(existing, true);
          dataSourcesRef.current.delete(layer.id);
          dataExtentRef.current.delete(layer.id);
          pendingDataExtentRef.current.delete(layer.id);
          failedDataExtentRef.current.delete(layer.id);
          layerStatusChangeRef.current(layer.id, { status: "idle" });
          continue;
        }
        if (dataExtentRef.current.get(layer.id) === extentKey || pendingDataExtentRef.current.get(layer.id) === extentKey || failedDataExtentRef.current.get(layer.id) === extentKey) continue;
        dataAbortRef.current.get(layer.id)?.abort();
        const controller = new AbortController();
        dataAbortRef.current.set(layer.id, controller);
        const requestNumber = (dataRequestRef.current.get(layer.id) ?? 0) + 1;
        dataRequestRef.current.set(layer.id, requestNumber);
        pendingDataExtentRef.current.set(layer.id, extentKey);
        layerStatusChangeRef.current(layer.id, { status: "loading", message: "Loading features…", featureCount: 0 });
        void createLayerResource(layer, {
          bounds: viewportBounds,
          signal: controller.signal,
          onProgress: ({ loaded }) => {
            if (dataRequestRef.current.get(layer.id) !== requestNumber) return;
            layerStatusChangeRef.current(layer.id, {
              status: "loading",
              message: `Loading features… ${loaded.toLocaleString("en-US")}`,
              featureCount: loaded,
            });
          },
        }).then(async (resource) => {
          const currentViewer = viewerRef.current;
          if (dataRequestRef.current.get(layer.id) !== requestNumber || !currentViewer || currentViewer.isDestroyed() || !("entities" in resource)) return;
          await applyGeoJsonOpacity(resource, layer, layerStateRef.current[layer.id]?.opacity ?? layer.defaultOpacity);
          resource.show = layerStateRef.current[layer.id]?.visible ?? false;
          const previous = dataSourcesRef.current.get(layer.id);
          await currentViewer.dataSources.add(resource);
          dataSourcesRef.current.set(layer.id, resource);
          dataExtentRef.current.set(layer.id, extentKey);
          pendingDataExtentRef.current.delete(layer.id);
          failedDataExtentRef.current.delete(layer.id);
          dataAbortRef.current.delete(layer.id);
          if (previous) currentViewer.dataSources.remove(previous, true);
          layerStatusChangeRef.current(layer.id, { status: "ready", featureCount: resource.entities.values.length });
          synchronizeDataSourceOrder(currentViewer, layers, dataSourcesRef.current);
        }).catch((error: unknown) => {
          pendingDataExtentRef.current.delete(layer.id);
          dataAbortRef.current.delete(layer.id);
          if (controller.signal.aborted || dataRequestRef.current.get(layer.id) !== requestNumber) return;
          failedDataExtentRef.current.set(layer.id, extentKey);
          layerStatusChangeRef.current(layer.id, { status: "error", message: errorMessage(error, "Unable to load features.") });
          console.error(`Unable to load ${layer.name}`, error);
        });
      }
    }

    const terrainDefinition = layers.find(isTerrainLayer);
    const terrainEnabled = terrainDefinition ? layerState[terrainDefinition.id]?.visible : false;
    if (!terrainEnabled) {
      if (ellipsoidTerrainRef.current) viewer.terrainProvider = ellipsoidTerrainRef.current;
    } else {
      // Selecting the 3D Terrain layer directly from the Layers panel (rather than the
      // "Terrain view" button) should still switch out of 2D mode, since the mesh terrain has
      // nothing to render in a flat, top-down projection.
      viewer.scene.morphTo3D(0);
      if (terrainRef.current) {
        viewer.terrainProvider = terrainRef.current;
      } else if (terrainDefinition && !pendingTerrainRef.current) {
        pendingTerrainRef.current = true;
        void createLayerResource(terrainDefinition).then((resource) => {
          pendingTerrainRef.current = false;
          const currentViewer = viewerRef.current;
          if (!currentViewer || currentViewer.isDestroyed() || !("requestTileGeometry" in resource)) return;
          terrainRef.current = resource;
          if (layerStateRef.current[terrainDefinition.id]?.visible) currentViewer.terrainProvider = resource;
        }).catch((error: unknown) => {
          pendingTerrainRef.current = false;
          console.error(`Unable to load ${terrainDefinition.name}`, error);
        });
      }
    }
    synchronizeImageryOrder(viewer, layers, imageryRef.current);
    synchronizeDataSourceOrder(viewer, layers, dataSourcesRef.current);
  }, [cameraHeight, layerState, layers, mapReady, retryVersion, viewportBounds]);

  useEffect(() => {
    exaggerationRef.current = verticalExaggeration;
    const viewer = viewerRef.current;
    if (viewer) viewer.scene.verticalExaggeration = verticalExaggeration;
  }, [verticalExaggeration]);

  return <div className={`map-canvas mode-${interactionMode}`} ref={containerRef} aria-label={`Interactive map centered on ${location.label}`} />;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function synchronizeImageryOrder(
  viewer: Viewer,
  layers: readonly LayerDefinition[],
  imageryById: ReadonlyMap<string, ImageryLayer>,
) {
  const renderOrder = layers.toSorted(
    (first, second) => imageryStackBand(first) - imageryStackBand(second),
  );
  for (const layer of renderOrder) {
    const imagery = imageryById.get(layer.id);
    if (imagery && viewer.imageryLayers.contains(imagery)) viewer.imageryLayers.raiseToTop(imagery);
  }
}

function imageryStackBand(layer: LayerDefinition): number {
  if (layer.category === "basemap") return 0;
  if (layer.category === "imagery") return layer.county ? 2 : 1;
  return 3;
}

function synchronizeDataSourceOrder(
  viewer: Viewer,
  layers: readonly LayerDefinition[],
  dataSourcesById: ReadonlyMap<string, GeoJsonDataSource>,
) {
  for (const layer of layers) {
    const dataSource = dataSourcesById.get(layer.id);
    if (dataSource && viewer.dataSources.contains(dataSource)) viewer.dataSources.raiseToTop(dataSource);
  }
}
