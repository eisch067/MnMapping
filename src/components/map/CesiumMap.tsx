"use client";

import { useEffect, useRef } from "react";
import type { ImageryLayer, Viewer } from "cesium";
import { layerRegistry } from "@/config/layers";
import { createLayerResource } from "@/lib/map/createLayer";
import type { LayerStateById } from "@/lib/map/layerState";

interface CesiumMapProps {
  layerState: LayerStateById;
  onResetReady: (reset: () => void) => void;
}

export function CesiumMap({ layerState, onResetReady }: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const imageryRef = useRef(new Map<string, ImageryLayer>());
  const layerStateRef = useRef(layerState);

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
      viewer.camera.setView(minnesotaView);
      onResetReady(() => viewer.camera.flyTo({ ...minnesotaView, duration: 0.8 }));

      const definitions = layerRegistry.filter((layer) => layer.category !== "elevation");
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
    }).catch((error: unknown) => console.error("Unable to initialize the map", error));

    return () => {
      cancelled = true;
      imageryLayers.clear();
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [onResetReady]);

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

  return <div className="map-canvas" ref={containerRef} aria-label="Interactive map of Minnesota" />;
}
