# Layer controls and persistence

Compatible imagery, elevation, reference, public-land, parcel, and user-data layers share the same controls:

- independent visibility
- independent opacity
- source metadata
- bottom-to-top display ordering

The layer drawer presents the topmost item first. The up/down controls move a layer relative to peers in the same category and immediately synchronize Cesium's imagery stack.

The Layers action in the tool row opens the Layers sheet: a bottom sheet on a phone and a side panel on a desktop, described in [Map shell](map-shell.md). The sheet has Layers and My Data tabs, and closes with its close button, the Escape key, or the Layers action again. Every category starts collapsed, reports how many layers are enabled, and can be expanded independently. Imagery has secondary collapsible Statewide and County groups. Both groups start collapsed and keep imagery in newest-to-oldest order. Statewide imagery places the dynamic Best Available layer first, then separate collapsed NAIP and CIR groups with NAIP above CIR, followed by other historical imagery.

## Group controls

Each layer group heading has a checkbox that suspends and restores the group's **active subset**: the layers the user has switched on. A group is a category, or an Imagery scope (County, each county, Statewide, NAIP, CIR).

- **Suspend.** Unchecking the control hides every layer in the group and remembers the ones that were on. The heading reads, for example, "0 on · 2 suspended".
- **Restore.** Checking a suspended group switches on exactly the remembered layers. Layers that were not on stay off, and each layer keeps its opacity.
- **Nothing to suspend.** With no layer on and nothing suspended the control is disabled. No control turns every layer in a group on at once; layers are switched on one at a time in their own rows.
- **A layer switched on while the group is suspended** shows on its own. The remembered subset holds only layers that are still hidden, so switching a remembered layer on takes it out of the subset, and a layer that was not remembered is never added to it. Restoring brings back the layers still remembered, alongside whatever is on. A group counts as suspended while any remembered layer is hidden.
- **A layer that comes into view** by panning or zooming is never added to the active subset.
- **A new location search** resets county layers to their defaults and forgets any suspended county layers, so a restore never brings back a layer from the previous search.

3D terrain holds a single layer and has no group control. Public lands and Parcels also have an All opacities slider that sets every layer in the group at once.

The transitions live in `src/lib/map/layerGroups.ts` as pure functions over the layer state and the suspended subsets, and are covered by `src/lib/map/layerGroups.test.ts`.

## Persistence

Visibility, opacity, display order, the layers each group control has suspended, and vertical terrain exaggeration are stored in browser `localStorage` under `mnmapping.layer-preferences`. The stored value carries a `version` (currently 2), and a value with any other version is ignored. Preferences saved before the format was versioned, under `mnmapping.layer-preferences.v1`, are read once, migrated, and replaced by the versioned entry on the next save. A display order saved by an older ordering scheme is dropped.

Unknown or retired layer identifiers are ignored, including in suspended subsets, and newly registered layers are appended with their configured defaults. Location searches are not persisted.

## Active layers

The bottom of the Layers sheet lists every active layer in descending session-transfer order, shows browser-reported transferred bytes and request counts, and provides a direct checkbox for disabling each layer. Transfer totals reset on page reload; cached responses and third-party services without Resource Timing size access can report an unavailable size.
