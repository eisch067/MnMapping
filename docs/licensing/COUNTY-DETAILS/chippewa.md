# Chippewa County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2025 EagleView imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (11,962 records). Site-wide county disclaimer: *"The data and
information contained in or attached to any part of the Chippewa County website are not official documents or
transactions of Chippewa County... The County does not guarantee the accuracy, completeness, and/or
timeliness."* No GIS-specific commercial-use or resale language.

## Imagery — vendor confirmed, live-embedded

`ChippewaPictometry2025` MapServer is integrated live. `src/config/restrictedImagery.ts` flags the *AGOL item
page* for the same 2025 flight: "does not publish a license or access information permitting third-party
embedding." `arcgisImagery.ts` defines a live spec for the same county+year pointing at the *direct* service —
`isIntegratedArcgisImagery()` matches on year+county and drops the warning, even though it's the identical
underlying flight, just accessed via a different URL. Fetched the direct MapServer JSON directly: `copyrightText`,
`description`, and `serviceDescription` are all empty strings. See [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: GREEN (statewide aggregation).
- Imagery: **RED** — vendor-flown, no license text found anywhere, integrated live.

## Open questions for Chippewa County / EagleView

1. Does Chippewa County's EagleView/Pictometry licensing agreement permit the county to sublicense the 2025
   imagery for embedding in a third-party commercial web application?
2. Is the direct MapServer intended for public/anonymous consumption, or only for the county's own internal GIS
   viewer embeds?

## Evidence

- `gis.chippewa.mn/arcgis/rest/services/ChippewaPictometry2025/MapServer?f=json` — empty license fields.
- `co.chippewa.mn.us/disclaimer` — quoted above.
- `src/config/restrictedImagery.ts` lines 114–119 vs. `arcgisImagery.ts` line 29 — code cross-reference.
