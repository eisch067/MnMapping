# Layer controls and persistence

Compatible imagery, elevation, reference, public-land, parcel, and user-data layers share the same controls:

- independent visibility
- independent opacity
- source metadata
- bottom-to-top display ordering

The layer panel presents the topmost item first. The up/down controls move a layer relative to peers in the same category and immediately synchronize Cesium's imagery stack.

The Layers button opens a closable drawer on the left side of the map. Every category starts collapsed, reports how many layers are enabled, and can be expanded independently. Imagery has secondary collapsible Statewide and County groups. Both groups start collapsed and keep imagery in newest-to-oldest order, with the dynamic Best Available layer above dated statewide imagery.

Visibility, opacity, display order, and vertical terrain exaggeration are stored in browser `localStorage`. Unknown or retired layer identifiers are ignored, and newly registered layers are appended with their configured defaults. Location searches are not persisted.
