import { ChevronDownIcon } from "@/components/ui/MapIcons";
import type { LayerDefinition } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";
import { isLayerVisible } from "./layerGrouping";

interface GroupHeadingProps {
  id: string;
  label: string;
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  onVisibilityChange: (id: string, visible: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function GroupHeading(props: GroupHeadingProps) {
  const { id, label, layers, state, onVisibilityChange, expanded, onToggleExpand } = props;
  const visibleCount = layers.filter((layer) => isLayerVisible(layer, state)).length;
  return (
    <>
      {layers.length > 0 && (
        <input
          type="checkbox"
          className="layer-heading-toggle"
          aria-label={`Turn all ${label} layers on or off`}
          checked={visibleCount === layers.length}
          ref={(input) => {
            if (input) input.indeterminate = visibleCount > 0 && visibleCount < layers.length;
          }}
          onChange={(event) => {
            layers.forEach((layer) => onVisibilityChange(layer.id, event.target.checked));
          }}
        />
      )}
      <button
        className="layer-heading-collapse"
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={onToggleExpand}
      >
        <span>{label}</span>
        <span className="category-summary">
          {visibleCount} on <ChevronDownIcon />
        </span>
      </button>
    </>
  );
}
