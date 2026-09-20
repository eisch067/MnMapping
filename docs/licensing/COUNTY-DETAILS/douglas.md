# Douglas County

Not legal advice. Access date: 2026-09-18.

## Parcels

Douglas's own ArcGIS Online `Douglas_County_MN_Open_Data_Parcels` FeatureServer. No license fields in the
service JSON. The county's parcel-mapping page states, in caps: *"THIS PARCEL DATABASE, MAPS, AND DATA VIEWED
ARE A COMPILATION OF INFORMATION AND DATA IN DOUGLAS COUNTY OFFICES AND IS NOT A SURVEY... THE COUNTY IS NOT
RESPONSIBLE FOR INACCURACIES HEREIN CONTAINED,"* material designated "FOR REFERENCE PURPOSES ONLY." Owner name
and mailing address are exposed (`OWNRNAME`, `OWNRADDR1`) — notably, unlike Aitkin/Beltrami/Hubbard/Todd,
Douglas's config does **not** map an assessed-value or tax-year field, reducing its attribute exposure.

## Imagery

2022 (2-inch) and 2016 (3-inch) county imagery, served through the statewide MnGeo WMS — no vendor. Douglas's
own 2026 EagleView/Pictometry imagery is **correctly excluded** already, per
`src/config/restrictedImagery.ts` — no reuse license found — and stays excluded (no contradicting
`arcgisImagery.ts` entry exists for Douglas).

## Business model notes

- Ads/free site: YELLOW.
- Paywalled layer access: YELLOW ("for reference purposes only" leans cautionary but doesn't expressly
  prohibit commercial paywalled use); ORANGE if the product's marketing implies survey-grade reliability.
- Fields to exclude from a commercial product: `OWNRNAME`, `OWNRADDR1` for paywalled/B2B models pending
  confirmation.

## Open questions for Douglas County

1. Does the `Douglas_County_MN_Open_Data_Parcels` FeatureServer, or its ArcGIS Open Data Hub listing, carry a
   specific reuse license (e.g., CC-BY) permitting commercial redistribution?
2. Are owner name and mailing-address fields subject to different access rules than parcel geometry?

## Evidence

- `services2.arcgis.com/8iQOd6RvhPL17pJd/.../Douglas_County_MN_Open_Data_Parcels/FeatureServer/0?f=json` — empty.
- `douglascountymn.gov/parcel-mapping` — disclaimer quoted above.
- `src/config/restrictedImagery.ts` — Douglas 2026 EagleView entry, correctly excluded and not contradicted.
