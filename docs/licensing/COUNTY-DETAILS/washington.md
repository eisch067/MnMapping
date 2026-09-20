# Washington County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** two things changed. (1) The 2026 imagery described below has been moved from a
live embedded layer to an external "View imagery ↗" link. (2) Owner name and mailing address are no longer
requested from the statewide parcel service for Washington — only geometry, acres, and legal description are
shown, with a link to the county's own Parcel Data page for ownership/tax lookup. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1 and H2.

## Parcels — the clearest explicit fee+license framework for parcel data in the audit

MnMapping uses the statewide MnGeo Open Parcels aggregation (119,096 records; see
[STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md)). Washington County also operates its own separate, direct
"Parcel Data" page for its own digital-parcel-data product, stating materially different terms:

- *"The data set is available to anyone. Fees are charged according to Washington County pricing policy."*
- *"All users of the digital parcel data are licensees. Licensees agree to certain terms which define
  limitations on the use and handling of the digital parcel data."*
- *"THE DIGITAL MAP IS FURNISHED ON AN AS IS BASIS... WITHOUT REPRESENTATION OR WARRANTY, INCLUDING BUT NOT IN
  ANY MANNER LIMITED TO FITNESS, MERCHANTABILITY AND COMPLETENESS."*
- *"A license agreement may be required before the data will be shipped."* (Formats: Geodatabase, Shapefile,
  DXF, AutoCAD.)

This doesn't (today) govern the statewide aggregation MnMapping actually queries, but strongly signals that
Washington County treats bulk/downloadable parcel data as a licensable product requiring a licensee agreement
and possible fee — relevant context even though the technical access path differs.

## Imagery

The 2026 county imagery MapServer is integrated live. `?f=json` has no license fields.
`src/config/restrictedImagery.ts` independently concluded (same URL/year): *"the official property viewer uses
this 2026 county service, but its provider, copyright, and imagery-specific reuse-license fields are blank"* —
suppressed from the app's own warning UI by the integration. See [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Ads/free site: ORANGE for both parcels and imagery.
- **Paywalled data/layer access: ORANGE-RED** — Washington's own parcel-data page explicitly frames bulk/
  downloadable access as fee-based and licensee-gated; a paywalled MnMapping product built on this data could
  be seen as monetizing what the county considers its own licensable product.
- Redistribution/offline packages: RED-leaning — "a license agreement may be required before the data will be
  shipped" is a direct statement that the county controls redistribution of its own parcel product.

## Open questions for Washington County

1. Does the parcel-data licensee/fee framework apply to data obtained via the statewide MnGeo Open Parcels
   aggregation, or only to data requested directly from the county?
2. What terms must a "licensee" agree to, and is embedding in a commercial, ad-supported, or paywalled
   third-party map covered or excluded?
3. Is there a written reuse license for the Aerials2026 imagery service permitting third-party web embedding?

## Evidence

- `washingtoncountymn.gov/1606/Parcel-Data` — quoted in full above.
- `maps.co.washington.mn.us/arcgis/rest/services/Aerials/Aerials2026/MapServer?f=json` — empty license fields.
- `src/config/restrictedImagery.ts` lines 425–432 — same conclusion, suppressed by later integration.
