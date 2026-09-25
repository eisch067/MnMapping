import { ChevronDownIcon } from "@/components/ui/MapIcons";
import type { LayerDefinition } from "@/config/layers/types";
import { groupStatus, type GroupStatus } from "@/lib/map/layerGroups";
import type { LayerStateById } from "@/lib/map/layerState";
import type { LayerControls } from "./LayerRow";

interface GroupHeadingProps {
  groupId: string;
  label: string;
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  // Omitted for a section that holds a single layer, which has no subset to suspend.
  groupControls?: Pick<LayerControls, "suspended" | "onToggleGroup">;
  expanded: boolean;
  onToggleExpand: () => void;
}

function plural(count: number): string {
  return `${count} layer${count === 1 ? "" : "s"}`;
}

function controlTitle({ mode, on, suspended }: GroupStatus): string {
  if (mode === "suspended") return `Restore ${plural(suspended)}`;
  if (mode === "active") return `Suspend ${plural(on)}`;
  return "No layers are on";
}

export function GroupHeading(props: GroupHeadingProps) {
  const { groupId, label, layers, state, groupControls, expanded, onToggleExpand } = props;
  const layerIds = layers.map((layer) => layer.id);
  const status = groupStatus(
    { layers: state, suspended: groupControls?.suspended ?? {} },
    groupId,
    layerIds,
  );
  return (
    <>
      {groupControls && layers.length > 0 && (
        <input
          type="checkbox"
          className="layer-heading-toggle"
          aria-label={`Suspend or restore ${label} layers`}
          title={controlTitle(status)}
          checked={status.mode === "active"}
          disabled={status.mode === "empty"}
          onChange={() => groupControls.onToggleGroup(groupId, layerIds)}
        />
      )}
      <button
        className="layer-heading-collapse"
        type="button"
        aria-expanded={expanded}
        aria-controls={`layer-section-${groupId}`}
        onClick={onToggleExpand}
      >
        <span>{label}</span>
        <span className="category-summary">
          {status.on} on{status.suspended > 0 && ` · ${status.suspended} suspended`}
          <ChevronDownIcon />
        </span>
      </button>
    </>
  );
}
