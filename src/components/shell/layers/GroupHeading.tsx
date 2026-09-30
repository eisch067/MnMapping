import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/MapIcons";
import type { LayerDefinition } from "@/config/layers/types";
import {
  categorySwitchIsOn,
  groupStatus,
  type GroupStatus,
} from "@/lib/map/layerGroups";
import { isSeasonAvailable } from "@/lib/dnr/seasonGate";
import type { LayerStateById } from "@/lib/map/layerState";
import type { LayerControls } from "./LayerRow";

interface GroupHeadingProps {
  groupId: string;
  label: string;
  layers: readonly LayerDefinition[];
  state: LayerStateById;
  // Omitted for a section that holds a single layer, which has no subset to suspend.
  groupControls?: Pick<LayerControls, "suspended" | "onToggleGroup">;
  categorySwitch?: boolean;
  seasonGates?: LayerControls["seasonGates"];
  onToggleCategory?: LayerControls["onToggleCategory"];
  // Keeps the control on a group that holds no layer yet, where it stays disabled.
  showWhenEmpty?: boolean;
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
  const {
    groupId,
    label,
    layers,
    state,
    groupControls,
    expanded,
    onToggleExpand,
    categorySwitch: hasCategorySwitch = false,
    seasonGates = {},
    onToggleCategory,
  } = props;
  const hasControl = groupControls && (layers.length > 0 || props.showWhenEmpty);
  const layerIds = layers.map((layer) => layer.id);
  const availableIds = layerIds.filter((id) => isSeasonAvailable(seasonGates, id));
  const switchOn = categorySwitchIsOn({ layers: state }, availableIds);
  const [showAllOffNote, setShowAllOffNote] = useState(false);
  useEffect(() => {
    if (!showAllOffNote) return;
    const timeout = window.setTimeout(() => setShowAllOffNote(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showAllOffNote]);
  const status = groupStatus(
    { layers: state, suspended: groupControls?.suspended ?? {} },
    groupId,
    layerIds,
  );
  return (
    <>
      {hasControl && (
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
      {hasCategorySwitch && availableIds.length > 0 && onToggleCategory && (
        <input
          type="checkbox"
          className="layer-category-switch"
          aria-label={`All ${label} on`}
          title="Turns every layer on or off."
          checked={switchOn}
          onChange={(event) => {
            const turningOn = event.currentTarget.checked;
            setShowAllOffNote(
              !turningOn && availableIds.some((id) => state[id]?.visible),
            );
            onToggleCategory(groupId, availableIds, turningOn);
          }}
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
      {showAllOffNote && (
        <p className="category-all-off-note" role="status">
          All layers are off. To hide and bring back only your picks, use the checkbox.
        </p>
      )}
    </>
  );
}
