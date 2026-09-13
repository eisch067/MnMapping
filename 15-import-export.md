# Step 15 — GPX/KML Import and Export

## Goal
Move waypoints, tracks, and simple geometry between MnMapping and other mapping/GPS software.

## Import
Support first:
- GPX
- KML
- GeoJSON if easy

## Export
Support:
- GPX for waypoints/tracks where representable
- KML
- GeoJSON

## Requirements
- Imported items become a local `My Data` layer.
- User can choose whether to save imported data to IndexedDB.
- Export selected items or all personal data.
- Preserve names and notes when the destination format supports them.

## Acceptance criteria
- Importing a small GPX displays waypoints/tracks correctly.
- User can export a dropped pin and reopen it in common GIS/GPS software.
