# Step 03 — Statewide Imagery

## Goal
Provide excellent recent aerial imagery across all of Minnesota before county-specific layers are added.

## Initial sources
- MnGeo Composite Image Service as `Best Available`.
- Recent NAIP imagery exposed by MnGeo, including the newest usable statewide years.
- Keep each imagery year separate so the user can compare them.

## Requirements
- `Best Available` imagery option.
- Individual recent statewide imagery years.
- Display capture year and published resolution when known.
- Multiple imagery layers may be enabled simultaneously.
- Layers must support independent opacity.
- Imagery requests should go directly to state services from the browser where practical.

## UX
Group these under `Imagery > Statewide`.

Example:
```text
Imagery
  Statewide
    ☑ Best Available
    ☐ 2025 NAIP
    ☐ 2023 NAIP
```

## Acceptance criteria
- User can move anywhere in Minnesota and retain imagery coverage.
- User can switch between at least two imagery vintages.
- Attribution/source information is available in the UI.
