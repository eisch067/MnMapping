"use client";

import { useEffect, useRef, useState } from "react";
import type { ImageryLayer, TerrainProvider, Viewer } from "cesium";
import type { LayerDefinition } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { cameraHeightForLocation, type MapLocation } from "@/lib/location";
import { createLayerResource } from "@/lib/map/createLayer";
import type { LayerStateById } from "@/lib/map/layerState";

interface CesiumMapProps {
  layers: readonly LayerDefinition[];
  layerState: LayerStateById;
  location: MapLocation;
  verticalExaggeration: number;
  onResetReady: (reset: () => void) => void;
  onViewControlsReady: (controls: MapViewControls) => void;
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
}: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const imageryRef = useRef(new Map<string, ImageryLayer>());
  const pendingImageryRef = useRef(new Set<string>());
  const terrainRef = useRef<TerrainProvider | null>(null);
  const pendingTerrainRef = useRef(false);
  const ellipsoidTerrainRef = useRef<TerrainProvider | null>(null);
  const layerStateRef = useRef(layerState);
  const exaggerationRef = useRef(verticalExaggeration);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    window.CESIUM_BASE_URL = "/cesium";
    let cancelled = false;
    const imageryLayers = imageryRef.current;
    const pendingImagery = pendingImageryRef.current;

    void import("cesium").then(({ Cartesian3, Math: CesiumMath, Viewer }) => {
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
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: true,
        selectionIndicator: false,
        timeline: false,
      });
      viewerRef.current = viewer;
      ellipsoidTerrainRef.current = viewer.terrainProvider;
      viewer.scene.verticalExaggeration = exaggerationRef.current;
      viewer.camera.setView(mapView);
      onResetReady(() => viewer.camera.flyTo({ ...mapView, duration: 0.8 }));
      onViewControlsReady({
        showMapView: () => viewer.camera.flyTo({ ...mapView, duration: 1.1 }),
        showTerrainView: () => viewer.camera.flyTo({ ...terrainView, duration: 1.4 }),
      });
      setMapReady(true);
    }).catch((error: unknown) => console.error("Unable to initialize the map", error));

    return () => {
      cancelled = true;
      imageryLayers.clear();
      pendingImagery.clear();
      terrainRef.current = null;
      pendingTerrainRef.current = false;
      ellipsoidTerrainRef.current = null;
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [location, onResetReady, onViewControlsReady]);

  useEffect(() => {
    layerStateRef.current = layerState;
    const viewer = viewerRef.current;
    if (!mapReady || !viewer) return;

    for (const [id, imagery] of imageryRef.current) {
      const currentState = layerState[id];
      // Cesium layers expose visibility through an intentionally mutable object API.
      // eslint-disable-next-line react-hooks/immutability
      imagery.show = currentState?.visible ?? false;
      imagery.alpha = currentState?.opacity ?? 1;
    }

    layers.forEach((layer, layerIndex) => {
      const currentState = layerState[layer.id];
      if (isTerrainLayer(layer) || !currentState?.visible || imageryRef.current.has(layer.id) || pendingImageryRef.current.has(layer.id)) return;
      pendingImageryRef.current.add(layer.id);
      void createLayerResource(layer).then((resource) => {
        pendingImageryRef.current.delete(layer.id);
        const currentViewer = viewerRef.current;
        if (!currentViewer || currentViewer.isDestroyed() || !("alpha" in resource)) return;
        const latestState = layerStateRef.current[layer.id];
        resource.show = latestState?.visible ?? false;
        resource.alpha = latestState?.opacity ?? layer.defaultOpacity;
        const insertionIndex = layers
          .slice(0, layerIndex)
          .filter((candidate) => imageryRef.current.has(candidate.id)).length;
        currentViewer.imageryLayers.add(resource, insertionIndex);
        imageryRef.current.set(layer.id, resource);
      }).catch((error: unknown) => {
        pendingImageryRef.current.delete(layer.id);
        console.error(`Unable to load ${layer.name}`, error);
      });
    });

    const terrainDefinition = layers.find(isTerrainLayer);
    const terrainEnabled = terrainDefinition ? layerState[terrainDefinition.id]?.visible : false;
    if (!terrainEnabled) {
      if (ellipsoidTerrainRef.current) viewer.terrainProvider = ellipsoidTerrainRef.current;
    } else if (terrainRef.current) {
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
  }, [layerState, layers, mapReady]);

  useEffect(() => {
    exaggerationRef.current = verticalExaggeration;
    const viewer = viewerRef.current;
    if (viewer) viewer.scene.verticalExaggeration = verticalExaggeration;
  }, [verticalExaggeration]);

  return <div className="map-canvas" ref={containerRef} aria-label={`Interactive map centered on ${location.label}`} />;
}
