"use client";

import { useEffect, useRef, useState } from "react";
import type { Cartesian2, GeoJsonDataSource, Viewer } from "cesium";
import { countyRegistry } from "@/config/counties";
import { minnesotaBounds } from "@/lib/location";

interface CountyImageryMapProps {
  active: boolean;
  selectedCounty: string | null;
  onCountySelect: (countyName: string) => void;
}

const countyBoundaryUrl = "/api/gis-proxy/mngeo-boundaries/MnGeo/mn_counties/FeatureServer/0/query?where=1%3D1&outFields=county_name%2Ccounty_fips55_code&returnGeometry=true&outSR=4326&f=geojson";
const countyPalette = ["#356859", "#5a7152", "#436d7b", "#75664a", "#4f657e", "#6f5d74", "#3f725f", "#706a48"] as const;

export function CountyImageryMap({ active, selectedCounty, onCountySelect }: CountyImageryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const countiesRef = useRef<GeoJsonDataSource | null>(null);
  const selectRef = useRef(onCountySelect);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => { selectRef.current = onCountySelect; }, [onCountySelect]);

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
    setLoadState("loading");

    void import("cesium").then(async ({
      ArcGisMapServerImageryProvider,
      Cartesian3,
      Color,
      ConstantProperty,
      GeoJsonDataSource,
      HorizontalOrigin,
      ImageryLayer,
      LabelStyle,
      Rectangle,
      ScreenSpaceEventType,
      VerticalOrigin,
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

      const countyData = await GeoJsonDataSource.load(countyBoundaryUrl, {
        clampToGround: false,
        fill: Color.fromCssColorString(countyPalette[0]).withAlpha(0.4),
        stroke: Color.fromCssColorString("#f4f8f1").withAlpha(0.96),
        strokeWidth: 1.7,
      });
      if (cancelled || viewer.isDestroyed()) return;
      countiesRef.current = countyData;
      for (const entity of countyData.entities.values) {
        const countyName = entity.properties?.county_name?.getValue() as string | undefined;
        if (countyName) entity.name = countyName;
        if (entity.polygon) {
          entity.polygon.height = new ConstantProperty(0);
          entity.polygon.outline = new ConstantProperty(true);
        }
      }
      await viewer.dataSources.add(countyData);
      for (const county of countyRegistry) {
        viewer.entities.add({
          name: county.name,
          position: Cartesian3.fromDegrees(
            (county.bounds.west + county.bounds.east) / 2,
            (county.bounds.south + county.bounds.north) / 2,
          ),
          label: {
            text: county.name,
            font: "600 10px system-ui, sans-serif",
            fillColor: Color.WHITE,
            outlineColor: Color.fromCssColorString("#14231c"),
            outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE,
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }
      viewer.screenSpaceEventHandler.setInputAction((movement: { position: Cartesian2 }) => {
        const picked = viewer.scene.pick(movement.position) as { id?: { name?: string } } | undefined;
        const countyName = picked?.id?.name;
        if (countyName && countyRegistry.some((county) => county.name === countyName)) selectRef.current(countyName);
      }, ScreenSpaceEventType.LEFT_CLICK);
      setLoadState("ready");
      viewer.scene.requestRender();
    }).catch((error: unknown) => {
      console.error("Unable to initialize the county imagery map", error);
      if (!cancelled) setLoadState("error");
    });

    return () => {
      cancelled = true;
      countiesRef.current = null;
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, [retryVersion]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const countyData = countiesRef.current;
    if (!viewer || !countyData || viewer.isDestroyed()) return;
    void import("cesium").then(({ Color, ColorMaterialProperty, ConstantProperty }) => {
      if (!viewerRef.current || viewer.isDestroyed()) return;
      for (const entity of countyData.entities.values) {
        if (!entity.polygon) continue;
        const isSelected = entity.name === selectedCounty;
        entity.polygon.material = new ColorMaterialProperty(
          Color.fromCssColorString(isSelected ? "#e78a58" : colorForCounty(entity.name ?? "")).withAlpha(isSelected ? 0.68 : 0.42),
        );
        entity.polygon.outlineColor = new ConstantProperty(
          Color.fromCssColorString(isSelected ? "#fff0d6" : "#f4f8f1").withAlpha(0.98),
        );
        entity.polygon.outline = new ConstantProperty(true);
      }
      viewer.scene.requestRender();
    });
  }, [loadState, selectedCounty]);

  return (
    <>
      <div className="map-canvas county-imagery-map-canvas" ref={containerRef} aria-label="Clickable map of Minnesota counties for exploring imagery" />
      <div className="county-color-legend" aria-hidden="true">
        <span>{countyPalette.slice(0, 5).map((color) => <i key={color} style={{ background: color }} />)}</span>
        County colors separate boundaries
      </div>
      {loadState !== "ready" && (
        <div className={`county-overlay-status ${loadState === "error" ? "is-error" : ""}`} role="status">
          {loadState === "loading" ? "Loading county boundaries…" : (
            <><span>County boundaries could not be loaded.</span><button type="button" onClick={() => setRetryVersion((value) => value + 1)}>Retry</button></>
          )}
        </div>
      )}
    </>
  );
}

function colorForCounty(countyName: string): string {
  let hash = 0;
  for (const character of countyName) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return countyPalette[Math.abs(hash) % countyPalette.length];
}
