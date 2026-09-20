# Dodge County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2026 imagery described below has been moved from a live embedded layer to an
external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1. **The owner/mailing-address
parcel exposure described below was left as-is** — a deliberate product decision (2026-09-19), not an
oversight, made alongside the same decision for Goodhue.

## Parcels — Goodhue-hosted, owner/mailing PII exposed

Dodge's parcels are served from a MapServer hosted on **Goodhue County's** infrastructure
(`publicmaps.co.goodhue.mn.us/.../DodgeCounty/Dodge_Parcels/MapServer/1`). `?f=json` has no license fields.
`parcelFields` map owner (`C0NAME1P`), secondary owner (`C0NAME2P`), mailing address (`C0ADRLN1P`), site address,
acres, and legal description — streamed live alongside geometry with no field-level distinction in the service.

## Imagery — vendor unconfirmed but embedded despite an internal flag

The 2026 aerial mosaic is embedded via `/api/gis-proxy/dodge-imagery/ImageryDC/Dodge_County_2026/MapServer`.
Unlike Goodhue's own layer, no vendor name (EagleView/Pictometry/Nearmap) appears in the fetched metadata —
vendor identity is genuinely unconfirmed either way. `src/config/restrictedImagery.ts` flags this exact
(2026, url) pair: "publishes no provider, copyright, or reuse-license information" — suppressed by the
integration. See [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: **ORANGE** — no license found, owner/mailing-address fields exposed.
- Imagery: ORANGE (less severe than confirmed-EagleView counties, but the same underlying gap).
- Fields to exclude: `C0NAME1P`/`C0NAME2P` (owner), `C0ADRLN1P` (mailing address).

## Open questions for Dodge County

1. Can Dodge County confirm whether the 2026 aerial imagery was flown by a third-party vendor, and if so, what
   license governs third-party embedding?
2. Does the county's parcel MapServer intend owner name and mailing address to be treated the same as geometry
   for reuse purposes, or differently?

## Evidence

- `publicmaps.co.goodhue.mn.us/arcgis/rest/services/DodgeCounty/Dodge_Parcels/MapServer?f=json` — empty license
  fields; field mapping confirmed against `southExpansion.ts`.
- `maps.co.goodhue.mn.us/server/rest/services/ImageryDC/Dodge_County_2026/MapServer?f=json` — no vendor named.
- `src/config/restrictedImagery.ts` (line ~178-184) — quoted above.
