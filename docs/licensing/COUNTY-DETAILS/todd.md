# Todd County

Not legal advice. Access date: 2026-09-18 (imagery fix verified 2026-09-19).

## Parcels

Todd's own `PublicViewerServer` MapServer (layer 80), not the statewide aggregation. No license fields in the
service JSON. The county's GIS/mapping page states: *"The information on this web site is made available as a
public service. The drawing is neither a legally recorded map nor a survey and is not intended to be used as
one,"* plus a standard no-warranty/no-liability disclaimer. Owner name (×2) and mailing address are exposed
(`OWNNAM`/`OWNNAM2`, `OWNERADD1`) with no field-specific distinction from geometry — Todd was not included in
the 10-county owner/tax redaction (that list was scoped to the counties with the clearest signal; Todd's own
disclaimer doesn't specifically address owner/tax data differently, so it wasn't prioritized).

## Imagery — a real gap in the first fix pass, caught on review

Todd's six imagery vintages (2020/2018/2017/2013×2/2008) were attributed directly in the app's own config as
**"Todd County GIS / Pictometry"** — vendor content served through the county's own dynamic MapServer. This was
correctly identified as one of the 35 counties affected by [RISK-REGISTER.md](../RISK-REGISTER.md) BLOCKER B1,
but the first implementation pass missed it: Todd's imagery is defined in its own dedicated file
(`src/config/layers/counties/todd.ts`), not in `arcgisImagery.ts`'s shared `specs` array or the hardcoded
vendor-layer functions in `northExpansion.ts`/`southExpansion.ts` that the fix touched. A follow-up code search
for "Pictometry/EagleView/Nearmap/Kucera" across every county config file caught it. All six vintages are now
removed from `todd.ts` and added to `src/config/restrictedImagery.ts` as external-link entries, verified live
in a running browser to show up under "Other Imagery" exactly like every other fixed county.

## Business model notes

- Parcels: ORANGE — no license found, owner/mailing-address fields exposed, same posture as Dodge/Goodhue.
- Imagery: now YELLOW/GREEN depending on model, since it's link-only rather than embedded.
- Fields to consider excluding from a commercial product if this county's risk profile needs to drop further:
  `OWNNAM`/`OWNNAM2` (owner), `OWNERADD1` (mailing address) — not yet redacted, unlike the 10-county list.

## Open questions for Todd County

1. Does the `PublicViewerServer` parcel layer (layer 80) permit third-party commercial redistribution?
2. Does Todd County's Pictometry-sourced imagery, served through the county's own public MapServer, carry a
   license permitting third-party embedding in a separate commercial or ad-supported web application?

## Evidence

- `gis.mytoddcounty.com/toddcounty/rest/services/PublicViewerServer/MapServer/80?f=json` — empty license fields.
- `toddcountymn.gov/government/departments/interactive_gis_mapping.php` — disclaimer quoted above.
- `src/config/layers/counties/todd.ts` (repo, pre-fix) — attribution "Todd County GIS / Pictometry" on all six
  imagery layers, confirmed via direct code read, not a secondhand source.
