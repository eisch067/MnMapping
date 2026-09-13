"use client";

import { useEffect, useRef } from "react";
import type { ImageryLayer, Viewer } from "cesium";
import { layerRegistry } from "@/config/layers";
import { createLayerResource } from "@/lib/map/createLayer";

interface CesiumMapProps {
  visibility: Record<string, boolean>;
  onResetReady: (reset: () => void) => void;
}

export function CesiumMap({ visibility, onResetReady }: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const imageryRef = useRef(new Map<string, ImageryLayer>());
  const visibilityRef = useRef(visibility);

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

      await Promise.all(
        layerRegistry.filter((layer) => layer.category !== "elevation").map(async (definition) => {
          const resource = await createLayerResource(definition);
          if (cancelled || !("alpha" in resource)) return;
          resource.show = visibilityRef.current[definition.id] ?? false;
          viewer.imageryLayers.add(resource);
          imageryLayers.set(definition.id, resource);
        }),
      );
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
    visibilityRef.current = visibility;
    for (const [id, imagery] of imageryRef.current) {
      // Cesium layers expose visibility through an intentionally mutable object API.
      // eslint-disable-next-line react-hooks/immutability
      imagery.show = visibility[id] ?? false;
    }
  }, [visibility]);

  return <div className="map-canvas" ref={containerRef} aria-label="Interactive map of Minnesota" />;
}
