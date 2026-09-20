# Lac qui Parle County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** all three EagleView WMTS layers described below have been moved from live embedded
layers to external "View imagery ↗" links — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (8,876 records). The county separately publishes its own "Tax Parcels"
ArcGIS Hub item (not used by MnMapping) with a standard Pro-West/county "AS IS" disclaimer — informational only.

## Imagery — three vendor layers, never even logged as a risk

**Three integrated WMTS layers (2024, 2020, 2017)**, each pointing directly at
`svc.pictometry.com/Image/DE0EA214-.../wmts` — EagleView's own server, not the county's. `GetCapabilities`
fetched directly confirms: `<ows:Title>Pictometry CONNECT Image Service WMTS</ows:Title>`,
`<Fees>none</Fees>`, `<AccessConstraints>none</AccessConstraints>`, `ServiceProvider: Pictometry`. Unlike most
of the counties in [RISK-REGISTER.md](../RISK-REGISTER.md) B1, **`src/config/restrictedImagery.ts` has no Lac
qui Parle entry at all** — this integration was never flagged internally in the first place, so there's no
internal paper trail acknowledging the risk. Per methodology: "no fees"/"no access constraints" in the vendor's
own capabilities document describes querying the endpoint, not a sublicense to redistribute the imagery.

## Business model notes

- Parcels: GREEN.
- Imagery: **RED** across every model that displays it (ads, paywall, B2B, offline). Even a free public site is
  NO absent a demonstrated sublicense.

## Open questions for Lac qui Parle County / EagleView

1. Does the county's Pictometry/EagleView CONNECT agreement authorize embedding the 2024/2020/2017 imagery
   mosaics in a third-party commercial web-mapping application, or is the WMTS endpoint intended only for the
   county's own GIS consumption?
2. Would the county confirm this in writing before MnMapping's public launch?

## Evidence

- `svc.pictometry.com/Image/DE0EA214-2CBE-9B5F-8453-9DEC73CEE63D/wmts?SERVICE=WMTS&REQUEST=GetCapabilities` —
  quoted above.
- `opendata-lqpgis.hub.arcgis.com/api/feed/dcat-us/1.1.json` — Pro-West disclaimer for the unused direct parcel
  service.
- `src/config/restrictedImagery.ts` (grepped in full) — no Lac qui Parle entry exists.
