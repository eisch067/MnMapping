# St. Louis County

Not legal advice. Access date: 2026-09-18.

## Parcels

Statewide MnGeo Open Parcels aggregation (186,455 records — the largest county-specific parcel count in the
north batch). No county-specific parcel disclaimer beyond the general GIS disclaimer below.

## Imagery

MnMapping uses only 2009 regional (Arrowhead/BWCA-border) statewide WMS imagery for St. Louis. The county's own
2023 Pictometry mosaic — board-authorized as a commercial acquisition — is **correctly excluded**, per
`src/config/restrictedImagery.ts`: "no third-party web-embedding grant... found." The board-resolution link
cited in that note returned a 404 on independent re-check; the underlying board record could not be
independently located this session, but the exclusion itself is sound and should stay in place.

## Business model notes

- Ads/free site: ORANGE — the county's GIS disclaimer is silent on commercial/advertising use.
- Paywalled layer access: ORANGE.
- Fields to exclude from a commercial product: `owner_name`, `owner_more`, `own_add_l1` pending confirmation.

## Open questions for St. Louis County

1. Does the county's GIS disclaimer permit a third-party web application to redisplay parcel and county-owned-
   land geometry and owner/tax attributes on a public commercial website?
2. Is there a separate license for the 2023 Pictometry imagery that would allow MnMapping to embed it?
3. Is bulk/offline redistribution of parcel data permitted, and is there a fee schedule for that use?

## Evidence

- `stlouiscountymn.gov/departments-a-z/economic-community-development/enterprise-gis/gis-disclaimer` — "St.
  Louis County makes no representation or warranties... THE DATA IS PROVIDED 'AS IS'..."
- `src/config/restrictedImagery.ts` — St. Louis 2023 Pictometry entry, correctly excluded.
