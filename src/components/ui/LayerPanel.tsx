"use client";

import { useEffect, useRef, useState } from "react";
import { isLayerAvailableAtCameraHeight, isTerrainLayer, type LayerCategory, type LayerDefinition } from "@/config/layers/types";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import type { LayerStateById } from "@/lib/map/layerState";
import type { LayerRuntimeStateById } from "@/lib/map/layerRuntime";
import { ChevronDownIcon, ChevronUpIcon, CloseIcon, LayersIcon } from "./MapIcons";

interface LayerPanelProps {
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  terrainExaggeration: number;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onTerrainExaggerationChange: (exaggeration: number) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  externalImagery: readonly RestrictedImagerySource[];
  pendingParcelCounties: readonly string[];
  pendingPublicLandCounties: readonly string[];
  cameraHeight: number;
  open: boolean;
  onClose: () => void;
  runtimeState: LayerRuntimeStateById;
  onRetryLayer: (id: string) => void;
}

const categoryLabels: Record<LayerCategory, string> = {
  basemap: "Basemap",
  imagery: "Imagery",
  elevation: "Elevation",
  "public-land": "Public lands",
  parcels: "Parcels",
  reference: "Reference",
};

const exaggerationPresets = [1, 1.5, 2, 3, 5] as const;

interface LayerTransferUsage {
  bytes: number;
  requests: number;
}

export function LayerPanel({
  layers,
  state,
  terrainExaggeration,
  onVisibilityChange,
  onOpacityChange,
  onTerrainExaggerationChange,
  onMoveLayer,
  externalImagery,
  pendingParcelCounties,
  pendingPublicLandCounties,
  cameraHeight,
  open,
  onClose,
  runtimeState,
  onRetryLayer,
}: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set([
      "terrain",
      "imagery-county",
      "imagery-statewide",
      "imagery-statewide-naip",
      "imagery-statewide-cir",
      ...Object.keys(categoryLabels),
    ]),
  );
  const [transferByLayer, setTransferByLayer] = useState<Record<string, LayerTransferUsage>>({});
  const layersRef = useRef(layers);
  const stateRef = useRef(state);
  const terrainLayers = layers.filter(isTerrainLayer);
  const categories = groupLayers(layers.filter((layer) => !isTerrainLayer(layer)));
  if (pendingParcelCounties.length > 0 && !categories.has("parcels")) categories.set("parcels", []);
  if (pendingPublicLandCounties.length > 0 && !categories.has("public-land")) categories.set("public-land", []);
  const visibleLayers = layers
    .filter((layer) => (state[layer.id]?.visible ?? layer.defaultVisible) && isLayerAvailableAtCameraHeight(layer, cameraHeight))
    .toSorted((left, right) => (transferByLayer[right.id]?.bytes ?? 0) - (transferByLayer[left.id]?.bytes ?? 0));
  const visibleTransferBytes = visibleLayers.reduce((total, layer) => total + (transferByLayer[layer.id]?.bytes ?? 0), 0);
  const toggleSection = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  useEffect(() => {
    layersRef.current = layers;
    stateRef.current = state;
  }, [layers, state]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    performance.setResourceTimingBufferSize(5_000);
    const recordEntries = (entries: readonly PerformanceResourceTiming[]) => {
      const additions: Record<string, LayerTransferUsage> = {};
      for (const entry of entries) {
        const layer = matchLayerRequest(entry.name, layersRef.current, stateRef.current);
        if (!layer) continue;
        const usage = additions[layer.id] ?? { bytes: 0, requests: 0 };
        usage.bytes += entry.transferSize;
        usage.requests += 1;
        additions[layer.id] = usage;
      }
      if (Object.keys(additions).length === 0) return;
      setTransferByLayer((current) => {
        const next = { ...current };
        for (const [id, usage] of Object.entries(additions)) {
          const previous = next[id] ?? { bytes: 0, requests: 0 };
          next[id] = { bytes: previous.bytes + usage.bytes, requests: previous.requests + usage.requests };
        }
        return next;
      });
    };
    const observer = new PerformanceObserver((list) => recordEntries(list.getEntries() as PerformanceResourceTiming[]));
    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      recordEntries(performance.getEntriesByType("resource") as PerformanceResourceTiming[]);
      observer.observe({ entryTypes: ["resource"] });
    }
    return () => observer.disconnect();
  }, []);

  const renderLayerRows = (items: readonly LayerDefinition[], reverse = true) => (reverse ? [...items].reverse() : items).map((layer) => {
    const layerState = state[layer.id] ?? {
      visible: layer.defaultVisible,
      opacity: layer.defaultOpacity,
    };
    const unavailable = Boolean(layer.unavailableMessage) && !isLayerAvailableAtCameraHeight(layer, cameraHeight);
    const runtime = runtimeState[layer.id];
    return (
      <div className={`layer-row ${unavailable ? "is-scale-locked" : ""}`} key={layer.id}>
        <div className="layer-row-heading">
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerState.visible}
              disabled={unavailable}
              onChange={(event) => onVisibilityChange(layer.id, event.target.checked)}
            />
            <span>
              <span className="layer-name-line">
                {layer.category === "public-land" && (
                  <span
                    className="legend-swatch"
                    aria-hidden="true"
                    style={{
                      background: String(layer.options?.fillColor ?? "#8654E0"),
                      borderColor: String(layer.options?.strokeColor ?? "#D6C6FF"),
                    }}
                  />
                )}
                <span className="layer-name">{layer.name}</span>
              </span>
              <span className="layer-meta">{metadataLine(layer)}</span>
              {layer.accessMeaning && <span className="land-meaning">{accessMeaningLabel(layer.accessMeaning)}</span>}
            </span>
          </label>
          <span className="layer-order-controls" aria-label={`${layer.name} display order`}>
            <button type="button" title="Move above" aria-label={`Move ${layer.name} above`} onClick={() => onMoveLayer(layer.id, "up")}><ChevronUpIcon /></button>
            <button type="button" title="Move below" aria-label={`Move ${layer.name} below`} onClick={() => onMoveLayer(layer.id, "down")}><ChevronDownIcon /></button>
          </span>
        </div>
        <label className="opacity-control">
          <span>Opacity</span>
          <input
            aria-label={`${layer.name} opacity`}
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(layerState.opacity * 100)}
            onChange={(event) => onOpacityChange(layer.id, Number(event.target.value) / 100)}
          />
          <output>{Math.round(layerState.opacity * 100)}%</output>
        </label>
        <details className="layer-details">
          <summary>Info</summary>
          <p>{layer.description ?? "No additional source notes."}</p>
          <p>{layer.agency ?? layer.attribution}</p>
          <a href={layer.sourceUrl ?? layer.url} target="_blank" rel="noreferrer">Service metadata</a>
        </details>
        {layerState.visible && runtime?.status === "loading" && (
          <p className="layer-load-status is-loading" role="status">{runtime.message ?? "Loading…"}</p>
        )}
        {layerState.visible && runtime?.status === "error" && (
          <div className="layer-load-status is-error" role="alert">
            <span>{runtime.message ?? "This layer could not be loaded."}</span>
            <button type="button" onClick={() => onRetryLayer(layer.id)}>Retry</button>
          </div>
        )}
        {unavailable && <div className="layer-scale-overlay">{layer.unavailableMessage}</div>}
      </div>
    );
  });

  return (
    <aside id="map-layer-panel" className={`side-panel ${open ? "is-open" : ""}`} aria-label="Map layers" aria-hidden={!open} inert={!open}>
      <header className="layer-panel-header">
        <span><LayersIcon /><strong>Map layers</strong></span>
        <button className="panel-close" type="button" onClick={onClose} aria-label="Close map layers"><CloseIcon /></button>
      </header>
      <p className="panel-note">Choose what appears on the map and arrange the display order.</p>
      {terrainLayers.length > 0 && <section className="layer-category">
        <div className="layer-category-heading">
          <GroupHeading
            id="layer-section-terrain"
            label="3D terrain"
            layers={terrainLayers}
            state={state}
            onVisibilityChange={onVisibilityChange}
            expanded={!collapsed.has("terrain")}
            onToggleExpand={() => toggleSection("terrain")}
          />
        </div>
        {!collapsed.has("terrain") && <div className="layer-list" id="layer-section-terrain">{terrainLayers.map((layer) => {
        const layerState = state[layer.id] ?? { visible: false, opacity: 1 };
        return (
          <section className="terrain-controls" key={layer.id} aria-label="3D terrain controls">
            <label className="terrain-toggle">
              <input
                type="checkbox"
                checked={layerState.visible}
                onChange={(event) => onVisibilityChange(layer.id, event.target.checked)}
              />
              <span><strong>{layer.name}</strong><small>{layer.resolution}</small></span>
            </label>
            <span className="control-label">Vertical exaggeration</span>
            <div className="preset-buttons">
              {exaggerationPresets.map((preset) => (
                <button
                  className="preset-button"
                  type="button"
                  aria-pressed={terrainExaggeration === preset}
                  key={preset}
                  onClick={() => onTerrainExaggerationChange(preset)}
                >
                  {preset}×
                </button>
              ))}
            </div>
            <label className="exaggeration-slider">
              <input
                aria-label="Vertical exaggeration"
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={terrainExaggeration}
                onChange={(event) => onTerrainExaggerationChange(Number(event.target.value))}
              />
              <output>{terrainExaggeration.toFixed(1)}×</output>
            </label>
            <details className="layer-details terrain-details">
              <summary>Source details</summary>
              <p>{layer.description}</p>
              <p>{layer.agency}</p>
              <a href={layer.sourceUrl ?? layer.url} target="_blank" rel="noreferrer">Service metadata</a>
            </details>
          </section>
        );
        })}</div>}
      </section>}
      <div className="layer-categories">
        {Array.from(categories, ([category, categoryLayers]) => (
          <section className="layer-category" key={category}>
            <div className="layer-category-heading">
              <GroupHeading
                id={`layer-section-${category}`}
                label={categoryLabels[category]}
                layers={categoryLayers}
                state={state}
                onVisibilityChange={onVisibilityChange}
                expanded={!collapsed.has(category)}
                onToggleExpand={() => toggleSection(category)}
              />
            </div>
            {!collapsed.has(category) && (category === "imagery" ? (
              <div className="layer-scopes" id={`layer-section-${category}`}>
                {([true, false] as const).map((isCounty) => {
                  const scopeId = `imagery-${isCounty ? "county" : "statewide"}`;
                  const scopeLayers = categoryLayers.filter((layer) => Boolean(layer.county) === isCounty);
                  if (scopeLayers.length === 0) return null;
                  return <section className="layer-scope" key={scopeId}>
                    <div className="layer-scope-heading">
                      <GroupHeading
                        id={`layer-section-${scopeId}`}
                        label={isCounty ? "County" : "Statewide"}
                        layers={scopeLayers}
                        state={state}
                        onVisibilityChange={onVisibilityChange}
                        expanded={!collapsed.has(scopeId)}
                        onToggleExpand={() => toggleSection(scopeId)}
                      />
                    </div>
                    {!collapsed.has(scopeId) && (isCounty ? (
                      <div className="layer-list" id={`layer-section-${scopeId}`}>
                        <div className="layer-subscopes">
                          {Array.from(groupByCounty(scopeLayers), ([countyName, countyLayers]) => {
                            const countyScopeId = `${scopeId}-${countyName.toLowerCase().replaceAll(" ", "-")}`;
                            return <section className="layer-scope" key={countyScopeId}>
                              <div className="layer-scope-heading">
                                <GroupHeading
                                  id={`layer-section-${countyScopeId}`}
                                  label={countyName}
                                  layers={countyLayers}
                                  state={state}
                                  onVisibilityChange={onVisibilityChange}
                                  expanded={!collapsed.has(countyScopeId)}
                                  onToggleExpand={() => toggleSection(countyScopeId)}
                                />
                              </div>
                              {!collapsed.has(countyScopeId) && <div className="layer-list" id={`layer-section-${countyScopeId}`}>{renderLayerRows(sortImageryNewestFirst(countyLayers), false)}</div>}
                            </section>;
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="layer-list" id={`layer-section-${scopeId}`}>
                        {renderLayerRows(sortImageryNewestFirst(scopeLayers.filter((layer) => !layer.imageryGroup && typeof layer.year !== "number")), false)}
                        <div className="layer-subscopes">
                          {(["naip", "cir"] as const).map((group) => {
                            const groupId = `${scopeId}-${group}`;
                            const groupLayers = sortImageryNewestFirst(scopeLayers.filter((layer) => layer.imageryGroup === group));
                            if (groupLayers.length === 0) return null;
                            return <section className="layer-scope" key={groupId}>
                              <div className="layer-scope-heading">
                                <GroupHeading
                                  id={`layer-section-${groupId}`}
                                  label={group === "naip" ? "NAIP" : "CIR"}
                                  layers={groupLayers}
                                  state={state}
                                  onVisibilityChange={onVisibilityChange}
                                  expanded={!collapsed.has(groupId)}
                                  onToggleExpand={() => toggleSection(groupId)}
                                />
                              </div>
                              {!collapsed.has(groupId) && <div className="layer-list" id={`layer-section-${groupId}`}>{renderLayerRows(groupLayers, false)}</div>}
                            </section>;
                          })}
                        </div>
                        {renderLayerRows(sortImageryNewestFirst(scopeLayers.filter((layer) => !layer.imageryGroup && typeof layer.year === "number")), false)}
                      </div>
                    ))}
                  </section>;
                })}
                {externalImagery.length > 0 && (
                  <ExternalImagerySection
                    sources={externalImagery}
                    collapsed={collapsed.has("imagery-external")}
                    onToggle={() => toggleSection("imagery-external")}
                  />
                )}
              </div>
            ) : (
              <div className="layer-list" id={`layer-section-${category}`}>
                {(category === "public-land" || category === "parcels") && categoryLayers.length > 0 && <label className="category-master-toggle">
                  <input
                    type="checkbox"
                    checked={categoryLayers.every((layer) => state[layer.id]?.visible ?? layer.defaultVisible)}
                    ref={(input) => {
                      if (!input) return;
                      const enabled = categoryLayers.filter((layer) => state[layer.id]?.visible ?? layer.defaultVisible).length;
                      input.indeterminate = enabled > 0 && enabled < categoryLayers.length;
                    }}
                    onChange={(event) => categoryLayers.forEach((layer) => onVisibilityChange(layer.id, event.target.checked))}
                  />
                  <span><strong>{category === "public-land" ? "All public lands" : "All parcels"}</strong><small>Turn every {category === "public-land" ? "public-land" : "parcel"} layer in the current area on or off. New layers that come into view while every layer is on will join them automatically.</small></span>
                </label>}
                {(category === "public-land" || category === "parcels") && categoryLayers.length > 0 && <label className="opacity-control category-master-opacity">
                  <span>All opacities</span>
                  <input
                    aria-label={`${category === "public-land" ? "All public lands" : "All parcels"} opacity`}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(averageOpacity(categoryLayers, state) * 100)}
                    onChange={(event) => {
                      const opacity = Number(event.target.value) / 100;
                      categoryLayers.forEach((layer) => onOpacityChange(layer.id, opacity));
                    }}
                  />
                  <output>{Math.round(averageOpacity(categoryLayers, state) * 100)}%</output>
                </label>}
                {renderLayerRows(categoryLayers)}
                {category === "parcels" && pendingParcelCounties.map((county) => (
                  <p className="layer-availability-note" key={county}>
                    <strong>{county} County parcels pending.</strong> No stable, repeatable public query source has been verified yet.
                  </p>
                ))}
                {category === "public-land" && pendingPublicLandCounties.map((county) => (
                  <p className="layer-availability-note" key={county}>
                    <strong>{county} County public-land data pending.</strong> Minnesota&apos;s statewide government-ownership service does not include this county yet.
                  </p>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
      <section className="active-layers" aria-labelledby="active-layers-heading">
        <header>
          <span><strong id="active-layers-heading">Active layers</strong><small>Transferred this session</small></span>
          <output>{formatBytes(visibleTransferBytes)}</output>
        </header>
        {visibleLayers.length > 0 ? <div className="active-layer-groups">
          {groupVisibleLayersByCategory(visibleLayers, categories, terrainLayers).map(([groupLabel, groupLayers]) => (
            <div className="active-layer-group" key={groupLabel}>
              <span className="active-layer-group-label">{groupLabel}</span>
              <div className="active-layer-list">
                {groupLayers.map((layer) => {
                  const usage = transferByLayer[layer.id] ?? { bytes: 0, requests: 0 };
                  return <label className="active-layer" key={layer.id}>
                    <input type="checkbox" checked onChange={(event) => onVisibilityChange(layer.id, event.target.checked)} />
                    <span><strong>{layer.name}</strong><small>{transferLabel(usage)}</small></span>
                  </label>;
                })}
              </div>
            </div>
          ))}
        </div> : <p>No layers are currently active.</p>}
        <p className="bandwidth-note">Counts bytes reported by the browser since this page loaded. Cached and some third-party requests may report no transferred size.</p>
      </section>
    </aside>
  );
}

interface GroupHeadingProps {
  id: string;
  label: string;
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  onVisibilityChange: (id: string, visible: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

function GroupHeading({ id, label, layers, state, onVisibilityChange, expanded, onToggleExpand }: GroupHeadingProps) {
  const visibleCount = layers.filter((layer) => state[layer.id]?.visible ?? layer.defaultVisible).length;
  return (
    <>
      {layers.length > 0 && (
        <input
          type="checkbox"
          className="layer-heading-toggle"
          aria-label={`Turn all ${label} layers on or off`}
          checked={layers.length > 0 && visibleCount === layers.length}
          ref={(input) => {
            if (!input) return;
            input.indeterminate = visibleCount > 0 && visibleCount < layers.length;
          }}
          onChange={(event) => layers.forEach((layer) => onVisibilityChange(layer.id, event.target.checked))}
        />
      )}
      <button className="layer-heading-collapse" type="button" aria-expanded={expanded} aria-controls={id} onClick={onToggleExpand}>
        <span>{label}</span>
        <span className="category-summary">{visibleCount} on <ChevronDownIcon /></span>
      </button>
    </>
  );
}

function ExternalImagerySection({
  sources,
  collapsed,
  onToggle,
}: {
  sources: readonly RestrictedImagerySource[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const counties = groupExternalImageryByCounty(sources);
  return (
    <section className="layer-scope external-imagery-scope">
      <div className="layer-scope-heading">
        <button className="layer-heading-collapse" type="button" aria-expanded={!collapsed} aria-controls="layer-section-imagery-external" onClick={onToggle}>
          <span>External imagery</span>
          <span className="category-summary">{sources.length} link{sources.length === 1 ? "" : "s"} <ChevronDownIcon /></span>
        </button>
      </div>
      {!collapsed && (
        <div className="external-imagery-list" id="layer-section-imagery-external">
          {Array.from(counties, ([county, countySources]) => (
            <section className="external-imagery-county" key={county}>
              <strong>{county} County</strong>
              {countySources.map((source) => (
                <article key={`${source.name}-${source.year}-${source.url}`}>
                  <span><b>{source.name}</b><small>{[source.year, source.detail].filter(Boolean).join(" · ")}</small></span>
                  <a href={source.url} target="_blank" rel="noreferrer" aria-label={`View ${source.name} imagery in a new tab`}>View imagery ↗</a>
                  <p>{source.reason}</p>
                </article>
              ))}
            </section>
          ))}
          <p className="external-imagery-note">These sources open outside MnMapping because licensing, access, or delivery restrictions prevent displaying them directly on this map.</p>
        </div>
      )}
    </section>
  );
}

function groupExternalImageryByCounty(sources: readonly RestrictedImagerySource[]): Map<string, RestrictedImagerySource[]> {
  const counties = new Map<string, RestrictedImagerySource[]>();
  for (const source of sources) counties.set(source.county, [...(counties.get(source.county) ?? []), source]);
  return counties;
}

function groupByCounty(layers: readonly LayerDefinition[]): Map<string, LayerDefinition[]> {
  const counties = new Map<string, LayerDefinition[]>();
  for (const layer of layers) {
    if (!layer.county) continue;
    counties.set(layer.county, [...(counties.get(layer.county) ?? []), layer]);
  }
  return new Map([...counties].toSorted(([first], [second]) => first.localeCompare(second)));
}

function averageOpacity(layers: readonly LayerDefinition[], state: LayerStateById): number {
  if (layers.length === 0) return 1;
  const total = layers.reduce((sum, layer) => sum + (state[layer.id]?.opacity ?? layer.defaultOpacity), 0);
  return total / layers.length;
}

function metadataLine(layer: LayerDefinition): string {
  return [layer.county ?? "Statewide", layer.year, layer.resolution, layer.attribution].filter(Boolean).join(" · ");
}

function accessMeaningLabel(value: NonNullable<LayerDefinition["accessMeaning"]>): string {
  if (value === "public-access") return "Publicly accessible — verify current rules";
  if (value === "managed-land") return "Managed conservation land — restrictions may apply";
  if (value === "administrative-boundary") return "Unit boundary — not parcel ownership";
  return "Ownership interest and access vary";
}

function groupLayers(layers: readonly LayerDefinition[]) {
  const categories = new Map<LayerCategory, LayerDefinition[]>();
  for (const layer of layers) {
    categories.set(layer.category, [...(categories.get(layer.category) ?? []), layer]);
  }
  return categories;
}

function groupVisibleLayersByCategory(
  visibleLayers: readonly LayerDefinition[],
  categories: Map<LayerCategory, LayerDefinition[]>,
  terrainLayers: readonly LayerDefinition[],
): [string, LayerDefinition[]][] {
  const visibleIds = new Set(visibleLayers.map((layer) => layer.id));
  const groups: [string, LayerDefinition[]][] = [];
  const visibleTerrain = terrainLayers.filter((layer) => visibleIds.has(layer.id));
  if (visibleTerrain.length > 0) groups.push(["3D terrain", visibleTerrain]);
  for (const category of categories.keys()) {
    const layersInGroup = visibleLayers.filter((layer) => layer.category === category);
    if (layersInGroup.length > 0) groups.push([categoryLabels[category], layersInGroup]);
  }
  return groups;
}

function sortImageryNewestFirst(layers: readonly LayerDefinition[]): LayerDefinition[] {
  return [...layers].sort((left, right) => {
    const leftYear = typeof left.year === "number" ? left.year : Number.POSITIVE_INFINITY;
    const rightYear = typeof right.year === "number" ? right.year : Number.POSITIVE_INFINITY;
    return rightYear - leftYear;
  });
}

function matchLayerRequest(requestName: string, layers: readonly LayerDefinition[], state: LayerStateById): LayerDefinition | undefined {
  let requestUrl: URL;
  try {
    requestUrl = new URL(requestName, window.location.origin);
  } catch {
    return undefined;
  }
  return layers.find((layer) => {
    if (!(state[layer.id]?.visible ?? layer.defaultVisible)) return false;
    let layerUrl: URL;
    try {
      layerUrl = new URL(layer.url, window.location.origin);
    } catch {
      return false;
    }
    const basePath = layerUrl.pathname.replace(/\/$/, "");
    if (requestUrl.origin !== layerUrl.origin || (requestUrl.pathname !== basePath && !requestUrl.pathname.startsWith(`${basePath}/`))) return false;
    const expectedWmsLayer = stringLayerOption(layer, "layers") ?? stringLayerOption(layer, "layer");
    const requestedWmsLayer = caseInsensitiveSearchParam(requestUrl.searchParams, "layers") ?? caseInsensitiveSearchParam(requestUrl.searchParams, "layer");
    if (expectedWmsLayer && requestedWmsLayer && !requestedWmsLayer.split(",").includes(expectedWmsLayer)) return false;
    const expectedLayerId = layer.options?.layerId;
    if (expectedLayerId !== undefined && !requestUrl.pathname.startsWith(`${basePath}/${expectedLayerId}/`)) return false;
    const expectedWhere = stringLayerOption(layer, "where");
    if (expectedWhere && caseInsensitiveSearchParam(requestUrl.searchParams, "where") !== expectedWhere) return false;
    const renderingRule = stringLayerOption(layer, "renderingRule") ?? stringLayerOption(layer, "renderingRuleJson");
    if (renderingRule) {
      const requestRule = caseInsensitiveSearchParam(requestUrl.searchParams, "renderingRule");
      if (!requestRule?.toLowerCase().includes(renderingRule.toLowerCase().replaceAll("\\\"", "\""))) return false;
    }
    return true;
  });
}

function stringLayerOption(layer: LayerDefinition, key: string): string | undefined {
  const value = layer.options?.[key];
  return typeof value === "string" ? value : undefined;
}

function caseInsensitiveSearchParam(searchParams: URLSearchParams, name: string): string | null {
  const entry = [...searchParams].find(([key]) => key.toLowerCase() === name.toLowerCase());
  return entry?.[1] ?? null;
}

function transferLabel(usage: LayerTransferUsage): string {
  if (usage.requests === 0) return "No requests yet";
  if (usage.bytes === 0) return `${usage.requests} ${usage.requests === 1 ? "request" : "requests"} · size unavailable or cached`;
  return `${formatBytes(usage.bytes)} · ${usage.requests} ${usage.requests === 1 ? "request" : "requests"}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
