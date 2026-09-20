# Carlton County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2024 EagleView/Pictometry WMS described below has been moved from a live
embedded layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation only — see [STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md) (GREEN).

## Imagery — the flagship "technically accessible ≠ licensed" case

Carlton directly embeds a **2024 EagleView/Pictometry WMS proxied straight through MnMapping's backend**
(`svc.pictometry.com/Image/F244BDF4.../wms`). Fetched `GetCapabilities` directly:

- `<Fees>`: "none"
- `<AccessConstraints>`: "none"
- Service `<Abstract>`: "Pictometry WMS Server," contact `customersupport@pictometry.com`
- **Primary layer `<Abstract>`: "Capture dates: 04/10/2024 - 05/03/2024, Copyright Pictometry 2024"** — an
  explicit vendor copyright notice in the same document that reports "no fees or access constraints."

Carlton County's own GIS-Mapping page describes the WMS as available "for GIS Software" with a link to a
Google Drive document not accessible in this research pass; a separate note that "fees do apply to custom map
production" concerns an unrelated custom-map-request service, not this data license. The county's site-wide
copyright page is generic CivicPlus boilerplate with no GIS-specific terms.

Per [RISK-REGISTER.md](../RISK-REGISTER.md) B1: "no fees / no access constraints" describes anonymous technical
access to Pictometry's own server — it is not evidence of a sublicense permitting a third-party commercial web
application to redistribute Pictometry's copyrighted imagery, and the layer abstract names Pictometry as
copyright holder in the same breath.

## Business model notes

- Free display: ORANGE (technically reachable, publicly intended for GIS-software consumption, but no confirmed
  third-party embedding grant).
- Any paid, paywalled, or B2B use of this layer: **RED** — the least defensible business model here.
- Should not be included in any bulk-download or offline package (model H) without written confirmation from
  Pictometry/EagleView or Carlton County.

## Open questions

1. [To Carlton County] Does the county's license with Pictometry/EagleView for the 2024 imagery permit
   sublicensing or third-party embedding by an independent commercial web-mapping application?
2. [To EagleView/Pictometry] Under what terms does `svc.pictometry.com/Image/F244BDF4.../wms` permit embedding
   by a third-party public web application, including ad-supported or paid products?

## Evidence

- `svc.pictometry.com/Image/F244BDF4-3688-1040-2C2F-33486C6D4B05/wms?SERVICE=WMS&REQUEST=GetCapabilities` —
  Fees "none," AccessConstraints "none," layer abstract "Copyright Pictometry 2024," quoted above.
- `carltoncountymn.gov/185/GIS-Mapping` — no imagery-specific license text found.
