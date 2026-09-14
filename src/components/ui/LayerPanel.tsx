import { isTerrainLayer, type LayerCategory, type LayerDefinition } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";

interface LayerPanelProps {
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  terrainExaggeration: number;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onTerrainExaggerationChange: (exaggeration: number) => void;
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
}: LayerPanelProps) {
  const terrainLayers = layers.filter(isTerrainLayer);
  const categories = groupLayers(layers.filter((layer) => !isTerrainLayer(layer)));

  return (
    <aside className="side-panel" aria-label="Map layers and tools">
      <h2>Layers</h2>
      <p className="panel-note">Compare imagery, inspect lidar-derived relief, or tilt into exaggerated 3D terrain.</p>
      {terrainLayers.map((layer) => {
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
      })}
      <div className="layer-categories">
        {Array.from(categories, ([category, scopes]) => (
          <section className="layer-category" key={category}>
            <h3>{categoryLabels[category]}</h3>
            {Array.from(scopes, ([scope, scopedLayers]) => (
              <div className="layer-scope" key={scope}>
                <h4>{scope}</h4>
                <div className="layer-list">
                  {scopedLayers.map((layer) => {
                    const layerState = state[layer.id] ?? {
                      visible: layer.defaultVisible,
                      opacity: layer.defaultOpacity,
                    };
                    return (
                      <div className="layer-row" key={layer.id}>
                        <label className="layer-toggle">
                          <input
                            type="checkbox"
                            checked={layerState.visible}
                            onChange={(event) => onVisibilityChange(layer.id, event.target.checked)}
                          />
                          <span>
                            <span className="layer-name">{layer.name}</span>
                            <span className="layer-meta">{metadataLine(layer)}</span>
                          </span>
                        </label>
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
                          <summary>Source details</summary>
                          <p>{layer.description ?? "No additional source notes."}</p>
                          <p>{layer.agency ?? layer.attribution}</p>
                          <a href={layer.sourceUrl ?? layer.url} target="_blank" rel="noreferrer">Service metadata</a>
                        </details>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}

function metadataLine(layer: LayerDefinition): string {
  return [layer.year, layer.resolution, layer.attribution].filter(Boolean).join(" · ");
}

function groupLayers(layers: readonly LayerDefinition[]) {
  const categories = new Map<LayerCategory, Map<string, LayerDefinition[]>>();
  for (const layer of layers) {
    const scopes = categories.get(layer.category) ?? new Map<string, LayerDefinition[]>();
    const scope = layer.county ?? "Statewide";
    scopes.set(scope, [...(scopes.get(scope) ?? []), layer]);
    categories.set(layer.category, scopes);
  }
  return categories;
}
