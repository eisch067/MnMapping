# Step 08 — Layer Controls, Opacity, Ordering, and Comparison

## Goal
Make multiple datasets easy to compare instead of behaving like a simple single-basemap viewer.

## Requirements
For every compatible layer:
- visibility checkbox
- opacity control
- layer ordering
- metadata/info button

## Preferred UX
Groups:
- Imagery
- Elevation / Terrain
- Public Land
- Parcels
- Reference
- My Data

## Nice-to-have
- drag-and-drop ordering
- `solo` action to temporarily show one layer
- reset opacity button
- swipe/compare tool later

## Persistence
Save simple preferences such as active layers, opacity, and terrain exaggeration in `localStorage`.

## Acceptance criteria
- Two or more imagery layers can be active together.
- User can change opacity independently.
- User can reorder layers without editing code.
- Refresh preserves basic layer preferences.
