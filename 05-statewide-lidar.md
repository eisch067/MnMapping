# Step 05 — Statewide Lidar

## Goal
Integrate Minnesota's second-generation statewide lidar-derived elevation data as the authoritative elevation source.

## Requirements
- Use Minnesota's seamless second-generation lidar DEM where practical.
- Keep analytical elevation separate from the visual 3D terrain representation.
- Add a visible lidar/elevation layer if the state service supports useful raster visualization.
- Make source metadata easy to inspect.
- Do not download or bundle statewide lidar locally.

## Future-facing design
The elevation access layer should be reusable later for:
- point elevation
- elevation profiles
- slope
- aspect
- contours
- min/max/mean elevation inside an area

Do not build those tools in this step.

## Acceptance criteria
- A statewide elevation/lidar visualization can be turned on and off.
- The app records the authoritative lidar source separately from imagery sources.
- No local elevation database is required.
