# MnMapping

MnMapping is an interactive Minnesota mapping application for comparing current and historical aerial imagery, inspecting parcels and public-land boundaries, exploring elevation, and working with personal map data. It combines statewide public GIS services with verified county sources in one Cesium-based 3D map.

**Live application:** [publicmnmapping.eischens-brad.workers.dev](https://publicmnmapping.eischens-brad.workers.dev)

## What you can do

MnMapping opens with three ways to begin:

1. **Enter a location** — search for an address, coordinates, city, ZIP code, county, or place name.
2. **Select on a map** — choose an exact point using a lightweight street map before loading the full viewer.
3. **Explore available imagery** — select any of Minnesota's 87 counties and compare its statewide, county-level, and externally hosted imagery sources.

Once the main map opens, you can:

- Compare statewide NAIP, color-infrared, regional, county, and historical imagery.
- Automatically open the newest verified imagery MnMapping can display for the selected county.
- Follow clearly labeled external links when newer imagery is publicly viewable but cannot be embedded because of licensing or delivery restrictions.
- View compatible imagery over interactive 3D terrain and adjust terrain exaggeration.
- Display statewide lidar hillshade and 10-foot or property-scale 2-foot contours.
- Inspect parcel boundaries and available assessment attributes at parcel scale.
- View Minnesota DNR management areas, state parks, forests, county-fee land, tax-forfeit land, and verified county supplements.
- Reorder layers, adjust opacity, disable active layers, and monitor browser-reported request and transfer activity.
- Add pins and drawings, organize them in folders, recover them from 30-day Trash, import GPX, KML, and GeoJSON files into an Import folder, export them for OnX or GIS tools, and back up or restore everything as a My Data archive.
- Use the same map on a phone or a desktop: a bottom dock and swipeable sheets on a phone, and a left rail with a dockable panel on a desktop.

## Coverage and source approach

All 87 Minnesota counties are represented in the shared county registry. Statewide imagery and reference layers are available everywhere their source services provide coverage. County imagery is added only after its year, coverage, resolution, service behavior, and reuse conditions have been checked.

Parcel layers currently use repeatable public services in 68 counties; counties without a dependable anonymous parcel source remain clearly marked as pending. County-fee and tax-forfeit ownership records are available for the 56 counties represented in MnGeo's current government-ownership service.

MnMapping streams authoritative public services rather than copying large GIS datasets. Sources include Minnesota Geospatial Information Office, Minnesota DNR, USDA NAIP, county GIS departments, and other official public agencies. Source decisions and limitations are documented in [Imagery sources](docs/imagery-sources.md), [Elevation sources](docs/elevation-sources.md), [Public-land sources](docs/public-land-sources.md), and [Parcels and local data](docs/parcels-and-local-data.md).

Public-land and parcel boundaries are reference information. A management or ownership polygon does not by itself establish legal access, and parcel geometry is not a survey. Verify current ownership, rules, and conditions with the responsible agency before relying on the map in the field.

## Privacy and local data

MnMapping does not require an account. Searches are sent to the public ArcGIS geocoder, but MnMapping does not persist the query or selected location.

Layer preferences are stored in browser `localStorage`. My Data items, folders, appearance defaults, and deletion metadata are stored locally in IndexedDB and are not uploaded by MnMapping. **Unfiled** and **Trash** are permanent system views; deleting a folder moves it and its items to Trash as one recoverable bundle, and local Trash expires after 30 days according to the device clock. Users can organize, restore, hide, import, export, archive, or delete their data from the **My Data** sheet; see [docs/import-export.md](docs/import-export.md).

## County imagery research

The built-in [`/research`](https://publicmnmapping.eischens-brad.workers.dev/research) workspace tracks imagery research for every county without a database or account. It provides:

- A separate source inbox for each county.
- Implemented, date-confirmed external, and unresolved research categories.
- Status filtering, including a purple **Deep research** status for sources requiring manual viewer inspection.
- JSON session export and import for reliable round trips.
- CSV export for spreadsheet review.

See the [research tracker guide](docs/imagery-research-tracker.md) for the workflow.

## Development

Requirements: a current Node.js installation and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Cesium runtime assets are copied automatically into the ignored `public/cesium/` directory before development and production builds.

Run the project checks with:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` runs Vitest and then the registry audit. Vitest has two projects: `src/**/*.test.ts` runs in Node, and `tests/workers/**/*.test.ts` runs inside the Workers runtime with a D1 database through `@cloudflare/vitest-pool-workers`. `npm run typecheck` also checks `tests/workers/` with its own tsconfig, because the Workers runtime types conflict with the DOM types the app uses.

Browser tests in `tests/e2e/` run with Playwright at 390×844 (mobile) and 1280×800 (desktop) against the built app, so build it first:

```bash
npx playwright install chromium   # first run only
npm run build:vinext              # NEXT_PUBLIC_APP_MODE=personal for the personal build
npm run test:e2e
```

GitHub Actions runs all of these, and builds both the personal and public modes, on every pull request. See [Cloudflare deployment](docs/cloudflare-deployment.md#continuous-integration).

Cesium is pinned to an exact version (currently 1.145.0) so upgrades are deliberate. `package.json` also overrides `sharp` to 0.35.4 because the Workers test pool pins 0.35.2, which has security advisories; remove the override once the pool updates.

For a repeatable local screenshot, start the development server and run:

```bash
npm run screenshot
```

The default capture is written to `screenshots/localhost.png`. You can provide another URL and output path with `npm run screenshot -- <url> <output-path>`.

## Architecture

- Next.js, React, and TypeScript
- CesiumJS for the map and 3D globe
- Public WMS, WMTS, ArcGIS REST, FeatureServer, ImageServer, and terrain services
- Thin county configuration and adapter modules
- Browser-local storage for preferences and personal geometry
- Cloudflare Workers production hosting through vinext

County-specific behavior belongs in the layer registry and small adapters rather than the shared map UI. Remote-service proxies are read-only and restricted to allowlisted government or verified imagery hosts.

## Deployment

Production is deployed to Cloudflare Workers from the checked-in vinext configuration. Build and deploy manually with:

```bash
npm run build:vinext
npm run deploy:vinext:public
```

Cloudflare configuration and GitHub deployment details are documented in [Cloudflare deployment](docs/cloudflare-deployment.md).

## Project documentation

- [Location-first startup and loading](docs/location-start.md)
- [Map shell: tool row and sheets](docs/map-shell.md)
- [Identify: what is under a click](docs/identify.md)
- [Layer controls and persistence](docs/layer-controls.md)
- [Imagery source inventory](docs/imagery-sources.md)
- [County imagery research tracker](docs/imagery-research-tracker.md)
- [MnDOT public map catalog](docs/mndot-map-catalog.md)
- [Minnesota DNR public map catalog](docs/mndnr-map-catalog.md)
- [Elevation and terrain](docs/elevation-sources.md)
- [Public-land semantics and sources](docs/public-land-sources.md)
- [Parcels and browser-local data](docs/parcels-and-local-data.md)
- [onX-compatible handoff](docs/onx-handoff.md)
- [North region status](docs/north-region-status.md)
- [South region status](docs/south-region-status.md)
- [Remaining release work](docs/remaining-checklist.md)

## Project principles

- Prefer authoritative public services over self-hosting large datasets.
- Verify service metadata and licensing before integrating a source.
- Keep county-specific logic in small, maintainable adapters.
- Keep personal map data in the browser unless a future requirement justifies accounts or cloud storage.
- Expose uncertainty and coverage gaps instead of presenting unverified data as complete.
