import type { LayerCategory, LayerDefinition } from "@/config/layers/types";
import { formatBytes, groupVisibleLayersByCategory } from "./layerGrouping";
import { transferLabel, usageFor, type LayerTransferById } from "./useLayerTransfer";

interface ActiveLayersProps {
  visibleLayers: readonly LayerDefinition[];
  categories: Map<LayerCategory, LayerDefinition[]>;
  terrainLayers: readonly LayerDefinition[];
  transferByLayer: LayerTransferById;
  onVisibilityChange: (id: string, visible: boolean) => void;
}

export function ActiveLayers(props: ActiveLayersProps) {
  const { visibleLayers, categories, terrainLayers, transferByLayer, onVisibilityChange } = props;
  const totalBytes = visibleLayers.reduce(
    (total, layer) => total + usageFor(transferByLayer, layer).bytes,
    0,
  );
  const groups = groupVisibleLayersByCategory(visibleLayers, categories, terrainLayers);
  return (
    <section className="active-layers" aria-labelledby="active-layers-heading">
      <header>
        <span>
          <strong id="active-layers-heading">Active layers</strong>
          <small>Transferred this session</small>
        </span>
        <output>{formatBytes(totalBytes)}</output>
      </header>
      {visibleLayers.length > 0 ? (
        <div className="active-layer-groups">
          {groups.map(([groupLabel, groupLayers]) => (
            <div className="active-layer-group" key={groupLabel}>
              <span className="active-layer-group-label">{groupLabel}</span>
              <div className="active-layer-list">
                {groupLayers.map((layer) => (
                  <label className="active-layer" key={layer.id}>
                    <input
                      type="checkbox"
                      checked
                      onChange={(event) => onVisibilityChange(layer.id, event.target.checked)}
                    />
                    <span>
                      <strong>{layer.name}</strong>
                      <small>{transferLabel(usageFor(transferByLayer, layer))}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No layers are currently active.</p>
      )}
      <p className="bandwidth-note">
        Counts bytes reported by the browser since this page loaded. Cached and some third-party
        requests may report no transferred size.
      </p>
    </section>
  );
}
