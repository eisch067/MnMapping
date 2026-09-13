# Step 14 — Pins, Drawings, and Local Browser Storage

## Goal
Allow personal map markup without accounts or a backend.

## Storage
- `localStorage`: preferences only.
- IndexedDB: pins, drawings, imported files, and saved map objects.

## Features
- Drop pin.
- Rename pin.
- Add optional note.
- Delete pin.
- Draw line.
- Draw polygon.
- Measure rough distance/area.
- Toggle personal-data layer.

## Data model
Each object should have a stable local ID and GeoJSON-compatible geometry where practical.

## Important behavior
All data stays in the browser unless the user explicitly exports it.

## Acceptance criteria
- Pins survive browser refresh/restart.
- User can delete all saved local map data.
- No login or network storage is involved.
