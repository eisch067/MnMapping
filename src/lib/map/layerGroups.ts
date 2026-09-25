import type { LayerSelection, LayerStateById, SuspendedByGroup } from "@/lib/map/layerState";

// A layer group's control suspends the layers the user has on and later restores exactly those.
// The remembered subset holds only layers that are still hidden: switching one on takes it out, so
// a group is suspended while any remembered layer is hidden, even if other layers in it are on.
export type GroupMode = "active" | "suspended" | "empty";

export interface GroupStatus {
  mode: GroupMode;
  on: number;
  suspended: number;
}

function withLayerVisibility(
  layers: LayerStateById,
  ids: readonly string[],
  visible: boolean,
): LayerStateById {
  const next = { ...layers };
  for (const id of ids) {
    const layer = next[id];
    if (layer) next[id] = { ...layer, visible };
  }
  return next;
}

function withoutGroup(suspended: SuspendedByGroup, groupId: string): SuspendedByGroup {
  return Object.fromEntries(Object.entries(suspended).filter(([id]) => id !== groupId));
}

function withoutSuspendedIds(
  suspended: SuspendedByGroup,
  shouldDrop: (layerId: string) => boolean,
): SuspendedByGroup {
  if (!Object.values(suspended).some((ids) => ids.some(shouldDrop))) return suspended;
  const kept = Object.entries(suspended)
    .map(([groupId, ids]): [string, string[]] => [groupId, ids.filter((id) => !shouldDrop(id))])
    .filter(([, ids]) => ids.length > 0);
  return Object.fromEntries(kept);
}

export function setLayerVisible(
  selection: LayerSelection,
  id: string,
  visible: boolean,
): LayerSelection {
  return {
    layers: withLayerVisibility(selection.layers, [id], visible),
    suspended: visible
      ? withoutSuspendedIds(selection.suspended, (layerId) => layerId === id)
      : selection.suspended,
  };
}

export function suspendGroup(
  selection: LayerSelection,
  groupId: string,
  memberIds: readonly string[],
): LayerSelection {
  const active = memberIds.filter((id) => selection.layers[id]?.visible);
  if (active.length === 0) return selection;
  const remembered = [...new Set([...(selection.suspended[groupId] ?? []), ...active])];
  return {
    layers: withLayerVisibility(selection.layers, active, false),
    suspended: { ...selection.suspended, [groupId]: remembered },
  };
}

export function restoreGroup(selection: LayerSelection, groupId: string): LayerSelection {
  const remembered = selection.suspended[groupId];
  if (!remembered) return selection;
  return {
    layers: withLayerVisibility(selection.layers, remembered, true),
    suspended: withoutGroup(selection.suspended, groupId),
  };
}

export function groupStatus(
  selection: LayerSelection,
  groupId: string,
  memberIds: readonly string[],
): GroupStatus {
  const on = memberIds.filter((id) => selection.layers[id]?.visible).length;
  const hidden = (selection.suspended[groupId] ?? []).filter(
    (id) => selection.layers[id]?.visible === false,
  ).length;
  if (hidden > 0) return { mode: "suspended", on, suspended: hidden };
  return { mode: on > 0 ? "active" : "empty", on, suspended: 0 };
}

export function toggleGroup(
  selection: LayerSelection,
  groupId: string,
  memberIds: readonly string[],
): LayerSelection {
  return groupStatus(selection, groupId, memberIds).mode === "suspended"
    ? restoreGroup(selection, groupId)
    : suspendGroup(selection, groupId, memberIds);
}

export function forgetSuspended(
  selection: LayerSelection,
  shouldForget: (layerId: string) => boolean,
): LayerSelection {
  const suspended = withoutSuspendedIds(selection.suspended, shouldForget);
  return suspended === selection.suspended ? selection : { ...selection, suspended };
}
