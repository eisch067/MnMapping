import type { LayerCategory, LayerDefinition } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";

interface LayerPanelProps {
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onOpacityChange: (id: string, opacity: number) => void;
}

const categoryLabels: Record<LayerCategory, string> = {
  basemap: "Basemap",
  imagery: "Imagery",
  elevation: "Elevation",
  "public-land": "Public land",
  parcels: "Parcels",
  reference: "Reference",
};

export function LayerPanel({ layers, state, onVisibilityChange, onOpacityChange }: LayerPanelProps) {
  const categories = groupLayers(layers);

  return (
    <aside className="side-panel" aria-label="Map layers and tools">
      <h2>Layers</h2>
      <p className="panel-note">Combine imagery vintages, then fade the upper layer to compare coverage.</p>
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
