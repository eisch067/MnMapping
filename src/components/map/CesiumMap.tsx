"use client";

import { useEffect, useRef } from "react";
import type { ImageryLayer, TerrainProvider, Viewer } from "cesium";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer } from "@/config/layers/types";
import { createLayerResource } from "@/lib/map/createLayer";
import type { LayerStateById } from "@/lib/map/layerState";

interface CesiumMapProps {
  layerState: LayerStateById;
  verticalExaggeration: number;
  onResetReady: (reset: () => void) => void;
  onViewControlsReady: (controls: MapViewControls) => void;
}

export interface MapViewControls {
  showMapView: () => void;
  showTerrainView: () => void;
}

export function CesiumMap({ layerState, verticalExaggeration, onResetReady, onViewControlsReady }: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const imageryRef = useRef(new Map<string, ImageryLayer>());
  const terrainRef = useRef<TerrainProvider | null>(null);
  const ellipsoidTerrainRef = useRef<TerrainProvider | null>(null);
  const layerStateRef = useRef(layerState);
  const exaggerationRef = useRef(verticalExaggeration);

  useEffect(() => {
    if (!containerRef.current) return;
    window.CESIUM_BASE_URL = "/cesium";
    let cancelled = false;
    const imageryLayers = imageryRef.current;

    void import("cesium").then(async ({ Cartesian3, Math: CesiumMath, Viewer }) => {
      if (cancelled || !containerRef.current) return;
      const minnesotaView = {
        destination: Cartesian3.fromDegrees(-94.45, 46.05, 850_000),
        orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 },
      };
      const terrainView = {
        destination: Cartesian3.fromDegrees(-94.5, 46.4, 130_000),
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
      viewer.camera.setView(minnesotaView);
      onResetReady(() => viewer.camera.flyTo({ ...minnesotaView, duration: 0.8 }));
      onViewControlsReady({
        showMapView: () => viewer.camera.flyTo({ ...minnesotaView, duration: 1.1 }),
        showTerrainView: () => viewer.camera.flyTo({ ...terrainView, duration: 1.4 }),
      });

      const terrainDefinition = layerRegistry.find(isTerrainLayer);
      const pendingTerrain = terrainDefinition
        ? createLayerResource(terrainDefinition).then(
            (resource) => ({ resource, error: null }),
            (error: unknown) => ({ resource: null, error }),
          )
        : null;
      const definitions = layerRegistry.filter((layer) => !isTerrainLayer(layer));
      const pendingResources = definitions.map((definition) =>
        createLayerResource(definition).then(
          (resource) => ({ resource, error: null }),
          (error: unknown) => ({ resource: null, error }),
        ),
      );

      for (let index = 0; index < definitions.length; index += 1) {
        const definition = definitions[index];
        const { resource, error } = await pendingResources[index];
        if (error) {
          console.error(`Unable to load ${definition.name}`, error);
          continue;
        }
        if (cancelled || !resource || !("alpha" in resource)) continue;
        const currentState = layerStateRef.current[definition.id];
        resource.show = currentState?.visible ?? false;
        resource.alpha = currentState?.opacity ?? definition.defaultOpacity;
        viewer.imageryLayers.add(resource);
        imageryLayers.set(definition.id, resource);
      }

      if (pendingTerrain && terrainDefinition) {
        const { resource, error } = await pendingTerrain;
        if (error) {
          console.error(`Unable to load ${terrainDefinition.name}`, error);
        } else if (!cancelled && resource && "requestTileGeometry" in resource) {
          terrainRef.current = resource;
          if (layerStateRef.current[terrainDefinition.id]?.visible) viewer.terrainProvider = resource;
        }
      }
    }).catch((error: unknown) => console.error("Unable to initialize the map", error));

    return () => {
      cancelled = true;
      imageryLayers.clear();
      terrainRef.current = null;
      ellipsoidTerrainRef.current = null;
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [onResetReady, onViewControlsReady]);

  useEffect(() => {
    layerStateRef.current = layerState;
    for (const [id, imagery] of imageryRef.current) {
      const currentState = layerState[id];
      // Cesium layers expose visibility through an intentionally mutable object API.
      // eslint-disable-next-line react-hooks/immutability
      imagery.show = currentState?.visible ?? false;
      imagery.alpha = currentState?.opacity ?? 1;
    }
  }, [layerState]);

  useEffect(() => {
    exaggerationRef.current = verticalExaggeration;
    const viewer = viewerRef.current;
    if (!viewer) return;
    const terrainDefinition = layerRegistry.find(isTerrainLayer);
    const enabled = terrainDefinition ? layerState[terrainDefinition.id]?.visible : false;
    const terrainProvider = enabled ? terrainRef.current : ellipsoidTerrainRef.current;
    if (terrainProvider) viewer.terrainProvider = terrainProvider;
    viewer.scene.verticalExaggeration = verticalExaggeration;
  }, [layerState, verticalExaggeration]);

  return <div className="map-canvas" ref={containerRef} aria-label="Interactive map of Minnesota" />;
}
