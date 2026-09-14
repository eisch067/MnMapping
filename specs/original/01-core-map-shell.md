# Step 01 — Core Application and Map Shell

## Goal
Create the smallest working MnMapping application with a full-screen Cesium map and a clean layout that future tools can plug into.

## Requirements
- Next.js + TypeScript.
- CesiumJS loaded client-side.
- Full-screen map filling the browser viewport.
- Default camera centered on Minnesota.
- Simple left-side layer/tool panel placeholder.
- Small top bar containing the project name and basic map controls.
- App runs with `npm run dev` without external database or server dependencies.

## Decisions
- Cesium is the primary map engine.
- Avoid a component framework at first unless it clearly reduces code.
- Keep map state in React/client state only for now.

## Suggested structure
```text
src/
  app/
  components/map/
  components/ui/
  lib/map/
  config/
```

## Acceptance criteria
- Opening the app displays Minnesota on an interactive Cesium map.
- Pan, zoom, rotate, and tilt work.
- UI does not cover an excessive amount of map area.
- No account, database, or API keys are required except any unavoidable Cesium configuration.
