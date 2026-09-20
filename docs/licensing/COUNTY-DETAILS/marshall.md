# Marshall County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** both EagleView imagery layers described below have been moved from live embedded
layers to external "View imagery ↗" links — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1. The parcel
findings below are unaffected and remain the county's primary open item.

## Parcels

Statewide MnGeo Open Parcels aggregation. No county-specific disclaimer found on the county's GIS or Assessor
pages (both fetched, both empty of licensing text).

## Imagery — two EagleView layers, plus a reportedly restrictive (unverified) viewer ToU

Marshall's own 2024 and 2020 EagleView-branded MapServers are directly integrated live. `?f=json` for the 2024
layer has no license fields. `src/config/restrictedImagery.ts`'s entry for this exact service independently
concludes: *"the official public service identifies commercial EagleView imagery but publishes no third-party
reuse license"* — yet the layer is live in the app anyway. See [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

A web search surfaced text purportedly from Marshall County's GIS Viewer "Terms of Use"
(`gismap.co.marshall.mn.us`), stating the viewer is "provided solely for individual, non-commercial viewing of
parcel and tax information," prohibits scraping/bulk retrieval, and states the terms "do not grant you any
right to sell, license, redistribute, or publish the data in bulk or as a database." **This could not be
independently verified** — the domain's TLS certificate has expired, blocking a direct fetch — so treat it as a
reasonable-inference/unverified lead, not confirmed fact. If accurate, it would explicitly forbid the
"non-commercial viewing only" use case any of MnMapping's public business models (C–H) would need.

## Business model notes

- Imagery: **RED** — vendor-branded, no reuse grant found, live-embedded regardless of the app's own prior
  research.
- Recommend pulling both Marshall EagleView layers from any public-launch build until the county confirms in
  writing.

## Open questions for Marshall County

1. Does the EagleView imagery license permit a third-party website to embed and publicly display the imagery,
   including under an advertising-supported or subscription business model?
2. Can Marshall County confirm or correct the "individual, non-commercial viewing only" and "no redistribution"
   language reportedly on `gismap.co.marshall.mn.us` (that domain's certificate has expired and could not be
   directly verified)?

## Evidence

- `gis.co.marshall.mn.us/server/rest/services/Marshall/Marshall_2024_Eagleview_Imagery/MapServer?f=json` — empty
  license fields.
- `src/config/restrictedImagery.ts` lines 505–520 — "no third-party reuse license," contradicted by integration.
- Search-engine-returned text attributed to `gismap.co.marshall.mn.us` — unverified, TLS certificate expired.
