# Brown County

Not legal advice. Access date: 2026-09-18.

## Parcels — the best-case privacy posture found in the whole state

Brown's own `Brown_County_Production_Public_Parcels` FeatureServer. Its field list, confirmed directly:
`PIN, PARCEL_NUM, OBJECTID, created_user, created_date, last_edited_user, last_edited_date, Change_Reason,
DOCNUM, GlobalID, Shape__Area, Shape__Length` — **no owner, mailing-address, or valuation fields present at
all.** This independently confirms MnMapping's own config description ("Brown County labels the public dataset
as containing no owner information"). `copyrightText`/`description` are empty — no license statement either
way, but with no PII exposure, the stakes are much lower than any other county in this audit. Brown also
publishes a 52-polygon local-parks layer (city/county/state parks) through the same FeatureServer, also with no
license text.

## Imagery — correctly excluded

Brown's own EagleView/Pictometry mosaics (2026, 2023) are **not embedded**. Both portal items were fetched
directly: `type: "WMTS"`, `access: "public"`, but `"listed": false`, `"accessInformation": null`,
`"licenseInfo": null` — unlisted/internal-facing even though the endpoint is technically reachable. This is
consistent with (and corroborates, via the `listed:false` flag) the county's known EagleView order-form language
limiting "Connect Image Service" use to the county's own organization. **This exclusion is correct and is the
model the other 35 counties in [RISK-REGISTER.md](../RISK-REGISTER.md) B1 should follow.**

## Business model notes

- Parcels/parks: **GREEN** across every business model — no owner PII, no license text restricting reuse.
- Fields to exclude: none — this is the best-case outcome under the parcel-geometry-vs-attributes distinction.
- If Brown's EagleView imagery were ever added: RED, same as every other county in B1.

## Open questions for Brown County

1. Can Brown County confirm in writing that the public parcel FeatureServer may be embedded live in a
   commercial third-party web map, including ad-supported and paid-tier use?
2. Is there any fee schedule for bulk/API access to this service beyond normal query use?

## Evidence

- `gis.browncountymn.gov/server/rest/services/GISNEW/Brown_County_Production_Public_Parcels/FeatureServer/0?f=json`
  — field list confirmed directly, no owner/valuation fields.
- `gis.browncountymn.gov/portal/sharing/rest/content/items/6abb304efc674371b52c255b11b027bd?f=json` (2026
  EagleView) and `.../7c66b91ebb53409a8a7f68628305a89c?f=json` (2023 EagleView) — both `listed:false`, null
  license fields.
