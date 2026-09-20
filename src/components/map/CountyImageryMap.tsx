"use client";

import { useEffect, useRef, useState } from "react";
import type { Cartesian2, Entity, Viewer } from "cesium";
import { countyRegistry } from "@/config/counties";
import { minnesotaBounds } from "@/lib/location";

interface CountyImageryMapProps {
  active: boolean;
  selectedCounty: string | null;
  onCountySelect: (countyName: string) => void;
}

const countyBoundaryUrl = "/api/gis-proxy/mngeo-boundaries/MnGeo/mn_counties/FeatureServer/0/query?where=1%3D1&outFields=county_name%2Ccounty_fips55_code&returnGeometry=true&outSR=4326&f=geojson";
const countyPalette = ["#356859", "#5a7152", "#436d7b", "#75664a", "#4f657e", "#6f5d74", "#3f725f", "#706a48"] as const;
const selectedFillColor = "#e78a58";
const selectedOutlineColor = "#fff0d6";
const defaultOutlineColor = "#F8F9FF";

export function CountyImageryMap({ active, selectedCounty, onCountySelect }: CountyImageryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const countyEntitiesRef = useRef<Map<string, Entity>>(new Map());
  const selectedEntityNameRef = useRef<string | null>(null);
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
      ColorMaterialProperty,
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

      const countyData = await GeoJsonDataSource.load(countyBoundaryUrl, { clampToGround: false });
      if (cancelled || viewer.isDestroyed()) return;
      const entitiesByName = new Map<string, Entity>();
      for (const entity of countyData.entities.values) {
        const countyName = entity.properties?.county_name?.getValue() as string | undefined;
        if (countyName) { entity.name = countyName; entitiesByName.set(countyName, entity); }
        if (entity.polygon) {
          entity.polygon.height = new ConstantProperty(0);
          entity.polygon.outline = new ConstantProperty(true);
          // Color each county's final look up front, in the same pass that first draws it,
          // instead of drawing a flat placeholder color and re-styling every entity again once
          // "ready" — that second full pass over ~87 complex polygons was the visible few-second
          // jump from "labeled" to "colored" after the boundaries first appeared.
          const isSelected = countyName === selectedCounty;
          entity.polygon.material = new ColorMaterialProperty(
            Color.fromCssColorString(isSelected ? selectedFillColor : colorForCounty(countyName ?? "")).withAlpha(isSelected ? 0.68 : 0.42),
          );
          entity.polygon.outlineColor = new ConstantProperty(
            Color.fromCssColorString(isSelected ? selectedOutlineColor : defaultOutlineColor).withAlpha(0.98),
          );
        }
      }
      countyEntitiesRef.current = entitiesByName;
      selectedEntityNameRef.current = selectedCounty;
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
            outlineColor: Color.fromCssColorString("#07041F"),
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
      countyEntitiesRef.current = new Map();
      selectedEntityNameRef.current = null;
      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
    // selectedCounty is only read here for the initial paint; later changes are handled by the
    // selection effect below (via countyEntitiesRef/selectedEntityNameRef), not by reloading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryVersion]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const entitiesByName = countyEntitiesRef.current;
    if (!viewer || viewer.isDestroyed() || entitiesByName.size === 0) return;
    if (selectedEntityNameRef.current === selectedCounty) return;
    // Only the previously-selected and newly-selected counties actually need re-styling here —
    // touching all 87 entities on every selection change (as before) is unnecessary work.
    void import("cesium").then(({ Color, ColorMaterialProperty, ConstantProperty }) => {
      if (!viewerRef.current || viewer.isDestroyed()) return;
      const restyle = (entity: Entity | undefined, isSelected: boolean) => {
        if (!entity?.polygon) return;
        entity.polygon.material = new ColorMaterialProperty(
          Color.fromCssColorString(isSelected ? selectedFillColor : colorForCounty(entity.name ?? "")).withAlpha(isSelected ? 0.68 : 0.42),
        );
        entity.polygon.outlineColor = new ConstantProperty(
          Color.fromCssColorString(isSelected ? selectedOutlineColor : defaultOutlineColor).withAlpha(0.98),
        );
      };
      const previousName = selectedEntityNameRef.current;
      if (previousName) restyle(entitiesByName.get(previousName), false);
      if (selectedCounty) restyle(entitiesByName.get(selectedCounty), true);
      selectedEntityNameRef.current = selectedCounty;
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
        <div className={`map-loading-overlay ${loadState === "error" ? "is-error" : ""}`} role="status">
          {loadState === "loading" ? (<><span className="spinner" aria-hidden="true" /><span>Loading county map…</span></>) : (
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
