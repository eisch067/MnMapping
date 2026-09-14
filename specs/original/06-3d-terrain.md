# Step 06 — 3D Terrain and Elevation Exaggeration

## Goal
Provide a Google-Earth-like terrain view with adjustable vertical exaggeration.

## Requirements
- Smooth transition between top-down mapping and tilted 3D viewing.
- Terrain can be enabled/disabled.
- Elevation exaggeration control with practical presets such as:
  - 1x
  - 1.5x
  - 2x
  - 3x
  - 5x
- Optional fine slider after presets work.
- Imagery should drape correctly over terrain.

## Performance rule
Do not attempt to render raw 0.5 m DEM geometry everywhere if it causes poor performance. A terrain pyramid may be coarser for visualization while the source lidar remains authoritative for later measurements.

## Acceptance criteria
- User can tilt into a 3D view.
- Terrain exaggeration visibly changes subtle Minnesota terrain.
- Returning to 1x restores realistic terrain.
- Imagery remains aligned while terrain exaggeration changes.
