# Step 04 — County High-Resolution Imagery

## Goal
Add the clearest available county/local imagery for Hubbard, Beltrami, Becker, Todd, and Douglas without changing the core map code.

## Requirements
For each county:
1. Inventory available high-resolution imagery sources.
2. Record year/date and resolution when known.
3. Prefer official county or MnGeo-hosted services.
4. Add every useful available vintage, not just the newest one.
5. Restrict county-specific layers to their useful extent if needed.

## Initial county order
1. Hubbard
2. Beltrami
3. Becker
4. Todd
5. Douglas

## County adapter rule
All county imagery definitions live in that county's config module.

## Metadata
Each imagery source should include:
- year
- resolution
- source agency
- service URL
- notes on leaf-on/leaf-off or acquisition season when known

## Acceptance criteria
- County imagery appears automatically in the same layer UI as statewide imagery.
- No main-map changes are necessary to add the sixth county later.
- User can compare county imagery against statewide imagery with opacity controls.
