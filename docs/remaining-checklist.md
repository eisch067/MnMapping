# Remaining project checklist

This list records unfinished work after completing the North and South v1.0 county expansions on 2026-09-14.

## Required before a v1.0 release

- [ ] Show parcel availability directly in the Layers UI so users in a pending county see a short explanation instead of only an absent Parcels section.
- [ ] Add ArcGIS query pagination or a visible truncation warning for dense parcel extents. The service may cap a response even though requests are spatially bounded.
- [ ] Run and record a lightweight automated recognition/layer smoke test for every one of the 87 counties; current interactive tests cover representative counties from each batch.
- [ ] Add permanent tests for county-name normalization, registry ID uniqueness, imagery year ordering, county/statewide grouping, and parcel query construction.
- [ ] Verify parcel click details for every distinct source family: MnGeo Open Parcels, Aitkin, Douglas, Hubbard, Todd, Meeker, Dodge, and Goodhue.
- [ ] Verify GPX, KML, and GeoJSON round trips with common desktop/GPS software and malformed-file error handling.
- [ ] Add user-facing loading and failure states for imagery and feature services; provider failures currently appear primarily in the browser console.
- [ ] Perform keyboard, screen-reader, narrow-screen, and touch checks for the location gate, Layers drawer, nested imagery groups, inspection card, and My Data panel.
- [ ] Choose a deployment target and add a continuous-integration check for typecheck, lint, and production build.

## Deferred parcel-source work

- [ ] Recheck North pending counties: Beltrami, Kanabec, Kittson, Mahnomen, Pine, Roseau, and Wadena.
- [ ] Recheck South pending counties: Blue Earth, Brown, Cottonwood, Faribault, Freeborn, Kandiyohi, Le Sueur, Lincoln, Martin, Nicollet, Nobles, Redwood, Rock, Sibley, Swift, and Watonwan.
- [ ] Prefer a stable anonymous county FeatureServer when it is fresher or richer than MnGeo; keep viewer-only and download-only sources pending unless a maintainable conversion path is chosen.
- [ ] Improve standardized parcel addresses by safely combining the published address components instead of showing only the first mailing-address line.

## Deferred imagery and land-source work

- [ ] Recheck county imagery mentioned only through unresolved interactive viewers, especially Benton, Otter Tail, Stearns, and other counties with newer local acquisitions than the verified MnGeo catalog.
- [ ] Investigate newer named DNR fall imagery for northern counties once exact active layer names and footprints can be verified.
- [ ] Evaluate county-managed and tax-forfeited public-land supplements that are absent from the statewide DNR layers.
- [ ] Add an optional county-boundary reference layer if users need visible jurisdiction outlines instead of location recognition alone.

## Product follow-ups

- [ ] Replace prompt-based pin and drawing naming with an in-app editor that supports notes without modal browser dialogs.
- [ ] Add editing for saved pins and drawings, including rename, geometry adjustment, and per-item visibility.
- [ ] Add search or filtering within long imagery catalogs while preserving County and Statewide grouping.
- [ ] Decide whether measurements should remain approximate or use geodesic/terrain-aware calculations with explicit units.
- [ ] Review service attribution and data freshness on a regular schedule because county GIS endpoints and inventories change.
