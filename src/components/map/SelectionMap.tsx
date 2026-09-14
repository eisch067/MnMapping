"use client";

import { useEffect, useRef } from "react";
import type { Cartesian2, Viewer } from "cesium";
import { minnesotaBounds } from "@/lib/location";

interface SelectionMapProps {
  active: boolean;
  selectedPoint: { latitude: number; longitude: number } | null;
  onPointSelect: (latitude: number, longitude: number) => void;
}

export function SelectionMap({ active, selectedPoint, onPointSelect }: SelectionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const selectRef = useRef(onPointSelect);

  useEffect(() => { selectRef.current = onPointSelect; }, [onPointSelect]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!active || !viewer || viewer.isDestroyed()) return;
    viewer.resize();
    viewer.scene.requestRender();
  }, [active]);

  useEffect(() => {
    if (!containerRef.current) return;
    window.CESIUM_BASE_URL = "/cesium";
    let cancelled = false;

    void import("cesium").then(async ({
      ArcGisMapServerImageryProvider,
      ImageryLayer,
      Math: CesiumMath,
      Rectangle,
      ScreenSpaceEventType,
      Viewer,
    }) => {
      const provider = await ArcGisMapServerImageryProvider.fromUrl(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
        { enablePickFeatures: false },
      );
      if (cancelled || !containerRef.current) return;
      const viewer = new Viewer(containerRef.current, {
        baseLayer: new ImageryLayer(provider),
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        requestRenderMode: true,
      });
      viewerRef.current = viewer;
      viewer.camera.setView({ destination: Rectangle.fromDegrees(
        minnesotaBounds.west,
        minnesotaBounds.south,
        minnesotaBounds.east,
        minnesotaBounds.north,
      ) });
      viewer.screenSpaceEventHandler.setInputAction((movement: { position: Cartesian2 }) => {
        const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        if (!cartesian) return;
        const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        selectRef.current(CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude));
      }, ScreenSpaceEventType.LEFT_CLICK);

    }).catch((error: unknown) => console.error("Unable to initialize the selection map", error));

    return () => {
      cancelled = true;
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.entities.removeAll();
    if (!selectedPoint) return;
    void import("cesium").then(({ Cartesian3, Color }) => {
      if (!viewerRef.current || viewer.isDestroyed()) return;
      viewer.entities.add({
        position: Cartesian3.fromDegrees(selectedPoint.longitude, selectedPoint.latitude),
        point: { color: Color.fromCssColorString("#de6b48"), outlineColor: Color.WHITE, outlineWidth: 3, pixelSize: 14 },
      });
    });
  }, [selectedPoint]);

  return <div className="map-canvas selection-map-canvas" ref={containerRef} aria-label="Transportation map for selecting a Minnesota location" />;
}
