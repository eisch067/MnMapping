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

## Planned stack

- Next.js
- TypeScript
- CesiumJS
- Browser `localStorage` for small preferences
- Browser IndexedDB for larger local user data later
- Public WMS / WMTS / ArcGIS REST / FeatureServer / ImageServer sources

## Build order

1. [Core application and map shell](01-core-map-shell.md)
2. [Layer registry and source adapters](02-layer-registry.md)
3. [Statewide imagery](03-statewide-imagery.md)
4. [County high-resolution imagery](04-county-imagery.md)
5. [Statewide lidar](05-statewide-lidar.md)
6. [3D terrain and elevation exaggeration](06-3d-terrain.md)
7. [MnTOPO, hillshade, and contours](07-mntopo.md)
8. [Layer controls, opacity, ordering, and comparison](08-layer-controls.md)
9. [Statewide public-land boundaries](09-public-land.md)
10. [County public-land supplements](10-county-public-land.md)
11. [Private parcel architecture](11-parcel-architecture.md)
12. [Initial five county parcel adapters](12-initial-county-parcels.md)
13. [Coordinates, identify, and map inspection](13-map-inspection.md)
14. [Pins, drawings, and local browser storage](14-local-user-data.md)
15. [GPX/KML import and export](15-import-export.md)
16. [OnX-oriented export workflow and later enhancements](16-onx-and-later.md)

## Non-goals for the first version

- User accounts
- Cloud sync
- Multi-user collaboration
- Hosted spatial database
- Self-hosting all Minnesota imagery or lidar
- Mobile app
- Complex editing workflows
- Guaranteed commercial-scale infrastructure
