# Layer controls and persistence

Compatible imagery, elevation, reference, public-land, parcel, and user-data layers share the same controls:

- independent visibility
- independent opacity
- source metadata
- bottom-to-top display ordering

The layer drawer presents the topmost item first. The up/down controls move a layer relative to peers in the same category and immediately synchronize Cesium's imagery stack.

The Layers action in the tool row opens the Layers sheet: a bottom sheet on a phone and a side panel on a desktop, described in [Map shell](map-shell.md). The sheet has Layers and My Data tabs, and closes with its close button, the Escape key, or the Layers action again. Every category starts collapsed, reports how many layers are enabled, and can be expanded independently. Imagery has secondary collapsible Statewide and County groups. Both groups start collapsed and keep imagery in newest-to-oldest order. Statewide imagery places the dynamic Best Available layer first, then separate collapsed NAIP and CIR groups with NAIP above CIR, followed by other historical imagery.

Visibility, opacity, display order, and vertical terrain exaggeration are stored in browser `localStorage`. Unknown or retired layer identifiers are ignored, and newly registered layers are appended with their configured defaults. Location searches are not persisted.

The Public lands section includes a master checkbox for all public-land layers available in the current area. The bottom of the Layers sheet lists every active layer in descending session-transfer order, shows browser-reported transferred bytes and request counts, and provides a direct checkbox for disabling each layer. Transfer totals reset on page reload; cached responses and third-party services without Resource Timing size access can report an unavailable size.
