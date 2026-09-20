# Wright County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** owner name and mailing address are no longer requested from the statewide parcel
service for Wright — only geometry, acres, and legal description are shown, with a link to
`propertyaccess.co.wright.mn.us` for ownership/tax lookup. See [RISK-REGISTER.md](../RISK-REGISTER.md) H2.

## Parcels and owner/tax attributes

Statewide MnGeo Open Parcels aggregation (75,691 records). Wright separately runs its own dedicated
**property-access site** with an explicit anti-scraping clause: *"Visitors to this website are expressly
prohibited from using applications designed to mine, gather or extract data. Unauthorized use and collection of
this data may expose the visitor to criminal penalties and/or claims for civil damages, attorney's fees and
costs by Wright County,"* plus a broad indemnification/waiver clause triggered by mere use of the site. As with
Hennepin, this governs a different system than the statewide aggregation MnMapping actually queries, but is the
strongest-worded anti-extraction language found in this whole audit and directly signals the county's stance on
owner/property-data reuse.

## Imagery — the model to follow

Wright is a **positive example**: its own 2025 aerial photography is deliberately **not** integrated —
`src/config/restrictedImagery.ts` states *"the county's aerial products require licensing and the item grants
no third-party embedding rights,"* independently confirmed by fetching the underlying ArcGIS item JSON directly
(`licenseInfo`/`accessInformation`/`description` all empty). The live map uses only the 2010 statewide `smet10`
WMS layers instead. **This exclusion is correct and should stay as-is.**

## Business model notes

- Imagery: YELLOW (no county-specific vendor risk currently live, thanks to the correct exclusion above).
- Owner/tax attribute fields: **ORANGE**, given the demonstrated anti-scraping stance.
- Fields to exclude from a commercial product: `owner_name`, `own_add_l1`, `emv_total`, `tax_year`.

## Open questions for Wright County

1. Does the data-mining/scraping prohibition on the property-access site reflect a position on reuse of the
   same owner/tax data obtained via the statewide MnGeo aggregation?
2. What license and fee would apply to Wright's 2025 aerial photography if MnMapping wanted to integrate it
   directly in the future?

## Evidence

- `propertyaccess.co.wright.mn.us` — quoted in full above.
- `arcgis.com/sharing/rest/content/items/7270ae3ba5f64e98b3dff567720f37bf?f=json` — confirms no license text on
  the excluded 2025 imagery item.
- `src/config/restrictedImagery.ts` lines 433–440 — correctly excludes Wright's own imagery.
