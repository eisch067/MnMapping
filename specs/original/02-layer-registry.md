# Step 02 — Layer Registry and Source Adapters

## Goal
Create one common way to describe map layers so future county additions are configuration work instead of UI rewrites.

## Requirements
Define a typed layer model supporting at least:
- WMS
- WMTS/tiled imagery where needed
- ArcGIS MapServer
- ArcGIS ImageServer
- ArcGIS FeatureServer
- GeoJSON
- Cesium terrain

Each layer definition should support:
- `id`
- display name
- category
- source type
- source URL
- default visibility
- default opacity
- minimum/maximum zoom or scale when applicable
- attribution/source note
- county scope, if any
- year/date
- resolution if known
- optional metadata/description

## Architecture
Use a registry such as:
```text
src/config/layers/
  statewide.ts
  imagery.ts
  elevation.ts
  publicLand.ts
  counties/
    hubbard.ts
    beltrami.ts
    becker.ts
    todd.ts
    douglas.ts
```

County files should only describe county-specific sources and field mappings.

## Acceptance criteria
- Adding a dummy layer to the registry causes it to appear in the layer system without modifying the map component.
- No county-specific `if/else` logic exists in the main map component.
