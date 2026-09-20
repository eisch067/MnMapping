# McLeod County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** two things changed. (1) The 2026 imagery described below has been moved from a
live embedded layer to an external "View imagery ↗" link. (2) Owner name and mailing address are no longer
requested from the statewide parcel service for McLeod — only geometry, acres, and legal description are
shown, with a link to the county's own GIS data page for ownership/tax lookup. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1 and H2. **The county's "internal use only, no third-party
disclosure" language described below may still cover the parcel geometry itself, independent of the owner/tax
field redaction — that question remains open.**

## Parcels — an unresolved tension between the county's own site and the statewide feed

MnMapping uses the statewide MnGeo Open Parcels aggregation for what it actually pulls (20,467 records). But
McLeod County's own GIS data-request page states, verbatim: *"The requestor may use the data in the form
provided by the County for the requestor's own internal business or organizational purpose and for no other
purpose, except upon prior written consent of McLeod County,"* and *"The requestor shall not use the data on
behalf of any other individual, organization, corporation, government entity, or any other third party, and
shall not duplicate or disclose the data to any third parties unless such a use, duplication, or disclosure is
expressly authorized in writing by McLeod County."* This describes McLeod's own direct-download channel, not
explicitly the statewide aggregator — but since `plan_parcels_open`'s own metadata is silent on licensing, there
is no way to confirm whether McLeod contributed its parcels under different (more permissive) terms, or whether
this restriction should be read to travel with the data regardless of channel. **This is a genuine open
question, not resolvable from public metadata alone**, and is the standout risk factor for McLeod in this audit.

## Imagery

The 2026 county tiled MapServer is integrated live. No vendor name found in the metadata (`documentInfo.Author:
"JCMcLeod"`, underlying raster "McLeod_County_2026_Mosaic_MG3_30to1.sid"). `src/config/restrictedImagery.ts`:
"the public county tile service is anonymously viewable but publishes no provider, copyright, or third-party
reuse terms" — suppressed from the app's UI by the integration.

## Business model notes

- Parcels: **ORANGE trending RED** for paywalled/B2B models (F/G) specifically — McLeod is the one county with
  an affirmative, explicit "internal use only / no third-party disclosure without written consent" restriction
  on record.
- Imagery: ORANGE.
- Fields to consider excluding: given the explicit no-third-party-disclosure clause, consider whether owner
  name/mailing address specifically (not just geometry) should be suppressed for McLeod pending confirmation.

## Open questions for McLeod County

1. Does the county's contribution of parcel data to the Minnesota Geospatial Commons / statewide Open Parcels
   service carry the same "internal use only, no third-party disclosure without written consent" restriction
   stated on the county's own direct-download page, or different terms?
2. Who is the imagery provider/vendor for the 2026 aerial mosaic, and does the county's ArcGIS Server hosting
   include a third-party web-embedding sublicense?

## Evidence

- `mcleodcountymn.gov/departments/public_works/gis_(mapping___surveying)/gis_data.php` — quoted verbatim above.
- `tiles.arcgis.com/tiles/7sSDkfIZpd2ReAg5/.../2026_McLeod_County/MapServer?f=json` — empty license fields.
- `src/config/restrictedImagery.ts` lines 449–456 — quoted above.
