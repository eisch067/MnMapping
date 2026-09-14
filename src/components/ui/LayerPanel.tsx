"use client";

import { useEffect, useState } from "react";
import { isTerrainLayer, type LayerCategory, type LayerDefinition } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";
import { ChevronDownIcon, ChevronUpIcon, CloseIcon, LayersIcon } from "./MapIcons";

interface LayerPanelProps {
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  terrainExaggeration: number;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onTerrainExaggerationChange: (exaggeration: number) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  open: boolean;
  onClose: () => void;
}

const categoryLabels: Record<LayerCategory, string> = {
  basemap: "Basemap",
  imagery: "Imagery",
  elevation: "Elevation",
  "public-land": "Public land",
  parcels: "Parcels",
  reference: "Reference",
};

const exaggerationPresets = [1, 1.5, 2, 3, 5] as const;

export function LayerPanel({
  layers,
  state,
  terrainExaggeration,
  onVisibilityChange,
  onOpacityChange,
  onTerrainExaggerationChange,
  onMoveLayer,
  open,
  onClose,
}: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(["terrain", "imagery-county", "imagery-statewide", ...Object.keys(categoryLabels)]),
  );
  const terrainLayers = layers.filter(isTerrainLayer);
  const categories = groupLayers(layers.filter((layer) => !isTerrainLayer(layer)));
  const toggleSection = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const renderLayerRows = (items: readonly LayerDefinition[]) => [...items].reverse().map((layer) => {
    const layerState = state[layer.id] ?? {
      visible: layer.defaultVisible,
      opacity: layer.defaultOpacity,
    };
    return (
      <div className="layer-row" key={layer.id}>
        <div className="layer-row-heading">
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerState.visible}
              onChange={(event) => onVisibilityChange(layer.id, event.target.checked)}
            />
            <span>
              <span className="layer-name-line">
                {layer.category === "public-land" && (
                  <span
                    className="legend-swatch"
                    aria-hidden="true"
                    style={{
                      background: String(layer.options?.fillColor ?? "#68a677"),
                      borderColor: String(layer.options?.strokeColor ?? "#c8eed1"),
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
        <button className="layer-category-heading" type="button" aria-expanded={!collapsed.has("terrain")} aria-controls="layer-section-terrain" onClick={() => toggleSection("terrain")}>
          <span>3D terrain</span><span className="category-summary">{terrainLayers.filter((layer) => state[layer.id]?.visible).length} on <ChevronDownIcon /></span>
        </button>
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
            <button className="layer-category-heading" type="button" aria-expanded={!collapsed.has(category)} aria-controls={`layer-section-${category}`} onClick={() => toggleSection(category)}>
              <span>{categoryLabels[category]}</span>
              <span className="category-summary">{categoryLayers.filter((layer) => state[layer.id]?.visible).length} on <ChevronDownIcon /></span>
            </button>
            {!collapsed.has(category) && (category === "imagery" ? (
              <div className="layer-scopes" id={`layer-section-${category}`}>
                {([true, false] as const).map((isCounty) => {
                  const scopeId = `imagery-${isCounty ? "county" : "statewide"}`;
                  const scopeLayers = categoryLayers.filter((layer) => Boolean(layer.county) === isCounty);
                  if (scopeLayers.length === 0) return null;
                  return <section className="layer-scope" key={scopeId}>
                    <button className="layer-scope-heading" type="button" aria-expanded={!collapsed.has(scopeId)} aria-controls={`layer-section-${scopeId}`} onClick={() => toggleSection(scopeId)}>
                      <span>{isCounty ? "County" : "Statewide"}</span>
                      <span className="category-summary">{scopeLayers.filter((layer) => state[layer.id]?.visible).length} on <ChevronDownIcon /></span>
                    </button>
                    {!collapsed.has(scopeId) && <div className="layer-list" id={`layer-section-${scopeId}`}>{renderLayerRows(scopeLayers)}</div>}
                  </section>;
                })}
              </div>
            ) : (
              <div className="layer-list" id={`layer-section-${category}`}>{renderLayerRows(categoryLayers)}</div>
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
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
