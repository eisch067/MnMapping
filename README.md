# MnMapping Build Specs

MnMapping is a lightweight, personal-use-first Minnesota mapping viewer. The project should stay simple, client-heavy, and easy to expand county by county without rebuilding the application.

## Development

The implementation lives alongside these numbered build specifications.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Useful checks are `npm run typecheck`, `npm run lint`, and `npm run build`. Cesium's runtime assets are copied from the installed package into the ignored `public/cesium/` directory automatically before development and production builds.

Current imagery services and source-selection decisions are recorded in [`docs/imagery-sources.md`](docs/imagery-sources.md).
Elevation source roles and vertical-reference details are recorded in [`docs/elevation-sources.md`](docs/elevation-sources.md).
The location-first startup and lazy-loading behavior are recorded in [`docs/location-start.md`](docs/location-start.md).
Layer ordering and preference persistence are recorded in [`docs/layer-controls.md`](docs/layer-controls.md).
Public-land semantics and sources are recorded in [`docs/public-land-sources.md`](docs/public-land-sources.md).
Parcel adapters, inspection, and browser-local data are recorded in [`docs/parcels-and-local-data.md`](docs/parcels-and-local-data.md).
The optional onX-compatible export workflow is recorded in [`docs/onx-handoff.md`](docs/onx-handoff.md).

### Automated screenshots

With Microsoft Edge installed and `npm run dev` running, use `npm run screenshot` to capture `http://localhost:3000` into `screenshots/localhost.png`. You can also ask Codex in VS Code to run this command and inspect the image; no browser extension or manual capture is needed.

An optional URL and output path can be supplied: `npm run screenshot -- http://localhost:3000 screenshots/review.png`. Captures use a fresh browser session at 1440 × 1000, so saved locations and other preferences from your normal browser are not included. Generated screenshots are ignored by Git.

## Product principles

- Prefer statewide public services over self-hosting large datasets.
- Keep county-specific logic in small adapters/config files.
- No Supabase, hosted database, accounts, or backend unless a later need clearly justifies them.
- Store personal settings and map data locally in the browser first.
- Prioritize clarity, imagery quality, lidar, public land, and easy layer comparison.
- Build useful increments; every step should leave the app in a working state.

## Initial county set

1. Hubbard
2. Beltrami
3. Becker
4. Todd
5. Douglas

These counties are primarily needed for county-specific imagery and parcel/ownership adapters. Statewide imagery, lidar, MnTOPO, and public-land layers should work across Minnesota wherever services are available.

The v1.0 north-of-I-94 expansion covers all 43 North-zone counties through the shared county registry. Verified named imagery and repeatable parcel sources are integrated; counties without a repeatable parcel service remain explicitly pending. See [`docs/north-region-status.md`](docs/north-region-status.md) for batch results and deferred counties, and [`specs/v1.0/MnMapping-North-of-I94-County-Expansion.md`](specs/v1.0/MnMapping-North-of-I94-County-Expansion.md) for the requirements.

## Planned stack

- Next.js
- TypeScript
- CesiumJS
- Browser `localStorage` for small preferences
- Browser IndexedDB for pins, drawings, and imported user data
- Public WMS / WMTS / ArcGIS REST / FeatureServer / ImageServer sources

## Build order

1. [Core application and map shell](specs/original/01-core-map-shell.md)
2. [Layer registry and source adapters](specs/original/02-layer-registry.md)
3. [Statewide imagery](specs/original/03-statewide-imagery.md)
4. [County high-resolution imagery](specs/original/04-county-imagery.md)
5. [Statewide lidar](specs/original/05-statewide-lidar.md)
6. [3D terrain and elevation exaggeration](specs/original/06-3d-terrain.md)
7. [MnTOPO, hillshade, and contours](specs/original/07-mntopo.md)
8. [Layer controls, opacity, ordering, and comparison](specs/original/08-layer-controls.md)
9. [Statewide public-land boundaries](specs/original/09-public-land.md)
10. [County public-land supplements](specs/original/10-county-public-land.md)
11. [Private parcel architecture](specs/original/11-parcel-architecture.md)
12. [Initial five county parcel adapters](specs/original/12-initial-county-parcels.md)
13. [Coordinates, identify, and map inspection](specs/original/13-map-inspection.md)
14. [Pins, drawings, and local browser storage](specs/original/14-local-user-data.md)
15. [GPX/KML import and export](specs/original/15-import-export.md)
16. [OnX-oriented export workflow and later enhancements](specs/original/16-onx-and-later.md)

## Non-goals for the first version

- User accounts
- Cloud sync
- Multi-user collaboration
- Hosted spatial database
- Self-hosting all Minnesota imagery or lidar
- Mobile app
- Complex editing workflows
- Guaranteed commercial-scale infrastructure
