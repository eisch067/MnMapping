# North-region source verification

Latest remote verification: **2026-09-14**.

The opt-in smoke check reached every unique remote source used by the North-region registry. All **34 of 34** checks passed. The check validates ArcGIS layer/service metadata and verifies that every configured MnGeo WMS layer name is still advertised. It is deliberately separate from `npm test`, so routine development and CI do not depend on outside network availability.

```bash
npm run smoke:remote:north
```

The offline registry audit covers all 87 counties and checks unique county/layer IDs, unique and well-formed FIPS codes, valid Minnesota bounds, the 43/44 North/South zone split, newest-first county imagery definitions, parcel status/source consistency, and exact county-land FIPS and ownership-class filters.

```bash
npm run audit:registry
```

## Evidence locations

- Imagery service URLs, published layer names, coverage, acquisition year, resolution, and selection decisions: [`imagery-sources.md`](imagery-sources.md) and the county layer definitions under `src/config/layers/counties/`.
- Parcel service URLs, layer IDs, field mappings, record counts, acquisition dates, and pending-source decisions: [`parcels-and-local-data.md`](parcels-and-local-data.md), [`north-region-status.md`](north-region-status.md), and the county registry definitions.
- Public-land service URL, layer ID, popup fields, county filters, access meaning, represented-county count, and source-gap decisions: [`public-land-sources.md`](public-land-sources.md) and `src/config/layers/counties/publicLand.ts`.

The remote check is an availability and contract smoke test, not a substitute for visual review. County imagery alignment and labels, feature geometry and popup values, boundary-crossing behavior, and contour rendering remain part of county sign-off.

## Focused parcel-source re-audit

The seven North counties that were parcel-pending at the start of the 2026-09-14 audit were checked as one batch against MnGeo's county source index, official county GIS/assessor pages, and discoverable official ArcGIS services.

| County | Outcome |
| --- | --- |
| Beltrami | Integrated official `BeltramiOpenData` FeatureServer layer 2: 41,646 polygons; bounded GeoJSON geometry and the configured popup fields were sampled successfully. |
| Mahnomen | Integrated official `TaxParcels` FeatureServer layer 0: 6,222 polygons; GeoJSON, pagination, fields, and 2026-07-10 data freshness verified. |
| Wadena | Integrated official public `LinkPublic` MapServer layer 0: 11,821 polygons; GeoJSON, pagination, and fields verified. |
| Kanabec | Remains pending. The official workflow is a hosted parcel viewer and the county data-sharing policy retains fee-based GIS distribution; no stable anonymous polygon query was verified. |
| Kittson | Remains pending. The official assessor site exposes search and GIS-map workflows, but no maintainable anonymous polygon service was verified. |
| Pine | Remains pending. MnGeo lists a county viewer but no downloadable parcel dataset, and no official anonymous polygon service was verified. |
| Roseau | Remains pending. The official assessor and map-viewer workflows were current, but no maintainable anonymous polygon service was verified. |
