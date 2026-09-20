# Goodhue County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2025 EagleView imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1. **The
owner/mailing-address parcel exposure described below was left as-is** — a deliberate product decision
(2026-09-19), not an oversight, made alongside the same decision for Dodge.

## Parcels

Goodhue's own direct MapServer (`publicmaps.co.goodhue.mn.us/.../GoodhueCounty/ParcelsAGOL/MapServer/0`). No
license fields. Same owner/mailing-address exposure pattern as Dodge (`C0NAME1P`/`C0NAME2P`, `C0ADRLN1P`).

## Imagery — vendor confirmed in the layer's own display name

The 2025 imagery layer's own display name in `arcgisImagery.ts` is literally **"2025 Goodhue County
EagleView."** The MapServer's own `?f=json` doesn't itself surface "EagleView" (keywords: "Imagery,Goodhue,2025";
copyright/license empty), but the county's ArcGIS Online catalog item referenced in
`src/config/restrictedImagery.ts` is described there as identifying "EagleView as the provider but publishes no
license or access information allowing third-party embedding." `isIntegratedArcgisImagery()` suppresses that
caution because `arcgisImagery.ts` embeds the identical (2025, url) service. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: ORANGE — owner/mailing-address exposure, no license found.
- Imagery: **RED** — confirmed commercial vendor (EagleView), no sublicense evidence, currently embedded.
- Current attribution ("Goodhue County GIS") understates the imagery's actual vendor origin.

## Open questions for Goodhue County / EagleView

1. Does Goodhue County hold, or can it obtain, a sublicense from EagleView permitting a third-party web
   application to embed the 2025 imagery?
2. Does the county intend owner/mailing-address fields to be publicly redistributable in the same way as
   geometry?

## Evidence

- `publicmaps.co.goodhue.mn.us/arcgis/rest/services/GoodhueCounty/ParcelsAGOL/MapServer?f=json` — empty license
  fields.
- `maps.co.goodhue.mn.us/server/rest/services/ImageryGC/T2025/MapServer?f=json` — vendor not named at this
  endpoint; named at `arcgisImagery.ts`'s own display string and in the linked AGOL item.
