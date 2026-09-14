# Remaining project work

County work is split into two checklists:

- [North of I-94 county checklist](north-of-i94-checklist.md) — 43 counties
- [South of I-94 county checklist](south-of-i94-checklist.md) — 44 counties

Each regional checklist starts with work that spans many counties, then lists imagery, parcel, public-land, and end-to-end sign-off tasks for every county.

## Application-wide release work

- [ ] Add shared ArcGIS pagination or truncation handling for parcel and public-land services.
- [ ] Add visible loading, retry, and failure states for all remote map layers.
- [ ] Prevent stale viewport requests from replacing newer feature results.
- [ ] Add permanent tests for county recognition, registry integrity, layer ordering, request construction, and preference restoration.
- [ ] Verify GPX, KML, and GeoJSON round trips and add malformed-file messages.
- [ ] Complete keyboard, screen-reader, color-contrast, touch, and narrow-screen reviews.
- [ ] Finish visual and performance validation for the property-scale 2-foot contour layer and its zoom overlay.
- [x] Choose and configure Cloudflare Workers with vinext as the v1.0 deployment target.
- [ ] Connect the GitHub repository to Cloudflare Workers Builds and complete the first production deployment.
- [ ] Add CI for typecheck, lint, build, and tests.
- [ ] Add a production smoke check for routes, Cesium assets, location search, and the GIS proxy.
- [ ] Record the supported browser set and complete browser validation.
- [ ] Commit the current imagery-priority, parcel-status, county-land, contour, and checklist changes after visual review.

## Product work after v1.0

- [ ] Replace prompt-based pin and drawing naming with an in-app editor.
- [ ] Add rename, geometry adjustment, deletion confirmation, and per-item visibility for saved data.
- [ ] Add imagery search or filtering while preserving County/Statewide grouping.
- [ ] Decide whether measurements remain approximate or become geodesic and terrain-aware.
- [ ] Add imagery swipe comparison.
- [ ] Add elevation profiles and optional slope/aspect analysis.
- [ ] Evaluate parcel-ID and address search without a hosted statewide parcel database.
- [ ] Consider print/PDF export, saved viewpoints, and offline-area packaging.

## Ongoing maintenance

- [ ] Schedule audits for service availability, layer IDs, imagery freshness, parcel dates, attribution, and access descriptions.
- [ ] Document how to repair retired county endpoints while preserving prior verification evidence.
- [ ] Re-run both regional smoke tests after every source-registry update.

## v1.0 completion gate

v1.0 is ready when the application-wide release work and both regional Region-wide work sections are complete, every county has either a completed sign-off or documented pending-source evidence, CI passes, and the production smoke check succeeds.
