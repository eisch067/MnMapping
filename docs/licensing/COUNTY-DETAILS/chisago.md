# Chisago County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2025 EagleView imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (29,949 records) — see [STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md).

## Imagery — the cleanest vendor confirmation in the metro batch

Chisago's 2025 aerial imagery is integrated directly (`gis.chisagocounty.us/.../2025Aerials/MapServer`). The
service's own `?f=json` metadata **explicitly confirms EagleView as the vendor**: `description`/`comments`:
**"Eagleview Aerials flown in April 2025"**; `keywords`: "Aerials,Eagleview." No `copyrightText`/`licenseInfo`
is populated. `src/config/restrictedImagery.ts`'s prior review of this **exact same URL and year** concluded:
*"The service identifies EagleView imagery captured in April 2025 but does not publish third-party reuse
terms."* Because the URL+year match exactly, this entry is silently filtered from the app's own warning UI once
the direct integration exists — meaning MnMapping is currently live-streaming EagleView-copyrighted aerial
imagery despite its own documented conclusion, reached independently, that no reuse license exists. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- **RED for the imagery layer under every business model that touches it** — the vendor is named in the
  service's own metadata, the app's own prior finding is "no third-party reuse terms," and it's currently
  embedded regardless.
- Parcels/statewide layers alone: YELLOW.
- Current MnMapping attribution ("Chisago County GIS") does not credit EagleView as the actual imagery
  provider — worth fixing regardless of the licensing question.

## Open questions for Chisago County / EagleView

1. Does Chisago County's agreement with EagleView for the 2025 flight permit the county to sublicense the
   imagery for embedding in a third-party commercial web application?
2. Is there a written third-party reuse/embedding license for the `2025Aerials` MapServer?

## Evidence

- `gis.chisagocounty.us/arcgis/rest/services/2025Aerials/MapServer?f=json` — "Eagleview Aerials flown in April
  2025," quoted above.
- `src/config/restrictedImagery.ts` lines 121–128 — identical URL+year, "no third-party reuse terms."
