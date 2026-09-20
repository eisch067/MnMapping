# Meeker County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** two things changed. (1) Both EagleView WMTS imagery layers described below have
been moved from live embedded layers to external "View imagery ↗" links. (2) Owner name and mailing
city/state are no longer requested from the direct parcel service — only geometry, acres, and legal
description are shown, with a link to the county's GIS page for ownership/tax lookup. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1 and H2.

## Parcels — owner/mailing PII exposed with no license text

Meeker's own `Parcels_hub` FeatureServer (ArcGIS Online), not the statewide aggregation. No license fields
anywhere (service JSON, hub catalog entry). Full field list confirmed: `NAME` (owner), `MAILING`/`MAIL_CITY`/
`STATE` (mailing address), `DEED_AC` (acres), `LEGAL1`–`LEGAL13` (legal description), all queryable with no
access restriction. This is a materially different exposure than Brown County (which deliberately omits owner
fields) — owner name and mailing address are both present and should be evaluated separately from geometry.

## Imagery — two vendor layers, never logged as a risk

**Two integrated WMTS layers (2024, 2018)**, `svc.pictometry.com/Image/F35F6850-.../wmts`. Same finding as Lac
qui Parle: `<Fees>none</Fees>`, `<AccessConstraints>none</AccessConstraints>`, `ServiceProvider: Pictometry` —
this is a vendor-access statement, not a third-party sublicense. No `src/config/restrictedImagery.ts` entry
tracks these two layers (a separate, unrelated Beacon 2021 viewer entry exists but doesn't govern this
integration). See [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: **ORANGE** — no license found, and owner/mailing PII is exposed; recommend excluding `NAME`/
  `MAILING`/`MAIL_CITY` from a public-facing commercial product pending county confirmation.
- Imagery: **RED**.
- Fields to exclude: `NAME`, `MAILING`, `MAIL_CITY`, `STATE` — strongly recommend dropping unless the county
  confirms reuse in writing; `DEED_AC` and `LEGAL1-13` are lower-sensitivity but still untested.

## Open questions for Meeker County

1. May MnMapping display and redistribute (live, not bulk) the `NAME`/`MAILING`/`MAIL_CITY` owner fields from
   the `Parcels_hub` service in a public commercial web application, or should these be suppressed?
2. Does Meeker County's Pictometry/EagleView agreement permit third-party embedding of the 2024/2018 WMTS
   imagery outside the county's own GIS viewer?

## Evidence

- `services2.arcgis.com/pHb2Lre5eSy5plfE/.../Parcels_hub/FeatureServer/0?f=json` — field list confirmed, no
  license text.
- `svc.pictometry.com/Image/F35F6850-E352-2E77-4AA7-A1E920BCEFAE/wmts?SERVICE=WMTS&REQUEST=GetCapabilities` —
  quoted above.
