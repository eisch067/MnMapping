import type { LayerDefinition } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";
import { GroupHeading } from "./GroupHeading";

const exaggerationPresets = [1, 1.5, 2, 3, 5] as const;

interface TerrainSectionProps {
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  exaggeration: number;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onExaggerationChange: (exaggeration: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function TerrainSection({
  layers,
  state,
  exaggeration,
  onVisibilityChange,
  onExaggerationChange,
  expanded,
  onToggleExpand,
}: TerrainSectionProps) {
  return (
    <section className="layer-category">
      <div className="layer-category-heading">
        <GroupHeading
          id="layer-section-terrain"
          label="3D terrain"
          layers={layers}
          state={state}
          onVisibilityChange={onVisibilityChange}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
        />
      </div>
      {expanded && (
        <div className="layer-list" id="layer-section-terrain">
          {layers.map((layer) => (
            <TerrainControls
              key={layer.id}
              layer={layer}
              visible={state[layer.id]?.visible ?? false}
              exaggeration={exaggeration}
              onVisibilityChange={(visible) => onVisibilityChange(layer.id, visible)}
              onExaggerationChange={onExaggerationChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface TerrainControlsProps {
  layer: LayerDefinition;
  visible: boolean;
  exaggeration: number;
  onVisibilityChange: (visible: boolean) => void;
  onExaggerationChange: (exaggeration: number) => void;
}

function TerrainControls({
  layer,
  visible,
  exaggeration,
  onVisibilityChange,
  onExaggerationChange,
}: TerrainControlsProps) {
  return (
    <section className="terrain-controls" aria-label="3D terrain controls">
      <label className="terrain-toggle">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => onVisibilityChange(event.target.checked)}
        />
        <span>
          <strong>{layer.name}</strong>
          <small>{layer.resolution}</small>
        </span>
      </label>
      <span className="control-label">Vertical exaggeration</span>
      <div className="preset-buttons">
        {exaggerationPresets.map((preset) => (
          <button
            className="preset-button"
            type="button"
            aria-pressed={exaggeration === preset}
            key={preset}
            onClick={() => onExaggerationChange(preset)}
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
          value={exaggeration}
          onChange={(event) => onExaggerationChange(Number(event.target.value))}
        />
        <output>{exaggeration.toFixed(1)}×</output>
      </label>
      <details className="layer-details terrain-details">
        <summary>Source details</summary>
        <p>{layer.description}</p>
        <p>{layer.agency}</p>
        <a href={layer.sourceUrl ?? layer.url} target="_blank" rel="noreferrer">
          Service metadata
        </a>
      </details>
    </section>
  );
}
