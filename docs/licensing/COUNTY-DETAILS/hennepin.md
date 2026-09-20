# Hennepin County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** owner name and mailing address are no longer requested from the statewide parcel
service for Hennepin — only geometry, acres, and legal description are shown, with a link to
`propertyinformation.hennepin.us` for ownership/tax lookup. Verified directly against the live upstream
service: the reduced field list is the only thing requested over the wire. See
[RISK-REGISTER.md](../RISK-REGISTER.md) H2.

## Parcels and owner/tax attributes

Statewide MnGeo Open Parcels aggregation (447,044 records — the largest county source in this audit). See
[STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md) for the GREEN statewide finding — but Hennepin runs its **own**
dedicated property/tax lookup site, separate from GIS, that states a materially stricter position on this same
class of data: *"Multiple parcel data downloads, screen scraping programs or other computer extraction
techniques are strictly prohibited"* (`propertyinformation.hennepin.us`, per search-indexed text). MnMapping
does not query that site directly — it uses the MnGeo aggregation instead — but this is strong evidence of how
Hennepin actually wants owner name/address/assessed-value data treated, and should weigh against any owner/
tax-attribute-heavy business model.

Hennepin's own GIS Open Data hub (per secondary-source text) carries only a standard AS-IS/no-warranty
disclaimer with no commercial-use or redistribution clause.

## Imagery

No direct `arcgisImagery.ts` integration exists for Hennepin — all Hennepin imagery (2018/2021/2022, plus 2025
Metro) is served through the statewide MnGeo WMS pass-through, attributed generically to "Minnesota Geospatial
Information Office and contributing agencies." This is materially lower-risk than the direct-integration
pattern seen elsewhere in the metro batch, since it inherits the statewide-imagery finding rather than a
county-specific vendor question.

## Business model notes

- Geometry/imagery: YELLOW (statewide pass-through, standard disclaimer only).
- **Owner/tax attribute fields specifically: ORANGE**, given the dedicated property site's anti-scraping
  stance elsewhere in the county's own systems.
- Fields to consider excluding from a commercial product: `owner_name`, `owner_more`, `own_add_l1`,
  `emv_total`, `tax_year` — a strong candidate for exclusion or access-gating.

## Open questions for Hennepin County

1. Does the prohibition on "multiple parcel data downloads, screen scraping... or other computer extraction
   techniques" on the property-information site reflect a broader county position on bulk reuse of owner/tax
   attributes obtained via the statewide MnGeo aggregation?
2. Is there a formal Hennepin GIS terms-of-use document (distinct from the property-tax site) addressing
   commercial/advertising-supported third-party use?

## Evidence

- `propertyinformation.hennepin.us` — anti-scraping clause (secondary-source text; not independently re-fetched
  verbatim from the live page).
- `gis-hennepin.hub.arcgis.com/pages/open-data` — general AS-IS disclaimer (secondary source).
- `src/config/restrictedImagery.ts` — no Hennepin entries exist (confirmed), consistent with no direct
  integration.
