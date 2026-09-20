# Pennington County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2023 imagery described below has been moved from a live embedded layer to an
external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation. No separate Pennington parcel disclaimer found for the geometry
service itself (distinct from the county's separate property-records portal, below).

## Imagery

The 2023 county imagery MapServer is directly integrated live. `?f=json` confirms empty `copyrightText`/
`description`, no vendor named, and **`"exportTilesAllowed": false`** — a real technical restriction set by the
county's own ArcGIS Server admin, worth respecting even for live pass-through. `src/config/restrictedImagery.ts`
independently concludes "the official service confirms the 2023 mosaic but publishes no provider, copyright
statement, or third-party reuse license" — suppressed from the app's UI by the integration (see
[RISK-REGISTER.md](../RISK-REGISTER.md) B1). No vendor is named for this specific service, unlike Marshall/Wadena.

## Property-records portal (separate system, relevant context)

`publicsearch.co.pennington.mn.us`: *"Visitors to this website are expressly prohibited from using applications
designed to mine, gather or extract data"*; unauthorized use "may expose the visitor to criminal penalties
and/or claims for civil damages, attorney's fees and costs."

## Business model notes

- Imagery: ORANGE, trending RED — no reuse license found, `exportTilesAllowed:false` signals the county
  actively restricts at least one form of reuse at the service level.
- Redistribution/offline: RED — `exportTilesAllowed:false` argues directly against offline packaging.

## Open questions for Pennington County

1. Who is the imagery vendor/provider for the 2023 orthophotography, and does the county's contract permit
   third-party embedding?
2. Does the `exportTilesAllowed:false` setting reflect an intentional no-download policy the county wants
   MnMapping to respect?
3. Does the property-records portal's data-mining prohibition extend to the separate GIS/imagery ArcGIS Server?

## Evidence

- `gismap.co.pennington.mn.us/arcgis/rest/services/Pennington/PenningtonImagery2023/MapServer?f=json` —
  `exportTilesAllowed:false`, empty license fields.
- `src/config/restrictedImagery.ts` lines 321–328 — quoted above, contradicted by integration.
- `publicsearch.co.pennington.mn.us` — quoted above verbatim.
