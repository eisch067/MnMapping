# Layer controls and persistence

Compatible imagery, elevation, reference, public-land, parcel, and user-data layers share the same controls:

- independent visibility
- independent opacity
- source metadata
- bottom-to-top display ordering

The layer panel presents the topmost item first. The up/down controls move a layer relative to peers in the same category and immediately synchronize Cesium's imagery stack.

Visibility, opacity, display order, and vertical terrain exaggeration are stored in browser `localStorage`. Unknown or retired layer identifiers are ignored, and newly registered layers are appended with their configured defaults. Location searches are not persisted.
