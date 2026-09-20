# Olmsted County

Not legal advice. Access date: 2026-09-18.

## Parcels

Statewide MnGeo Open Parcels aggregation (75,579 records).

## Imagery — an "open source" claim that does not hold up as a formal grant

Olmsted's own 2023 ImageServer is embedded directly. `?f=json`: `copyrightText: "na"`, `description: "Olmsted
County 2023 Aerial Imagery"` — no vendor name anywhere, and no `accessInformation`/`licenseInfo` populated
either. `copyrightText: "na"` is simply an unpopulated field, not a public-domain dedication.

The app's own layer description states "The county describes its GIS data as open source." This was checked
directly: neither `olmstedcounty.gov/residents/land-property/gis-maps-addressing` nor
`enterprise-resources-gis-olmsted.hub.arcgis.com/pages/gis-data` — the two most likely candidate pages —
contained any "open source" text, formal license grant, or reuse/redistribution language on direct fetch; both
returned only generic service-catalog descriptions ("Discover, download, purchase, or request standard and
custom services..."). A general web search separately produced a paraphrase along those lines, but it could not
be independently confirmed live on the county's site this session. Even taken at face value, government GIS
shops routinely use "open" informally to mean "publicly viewable/downloadable" — not the formal open-source
sense — and this does not by itself establish a license to redistribute, resell, or embed the imagery in a
third-party commercial product.

## Business model notes

- Ads/free site: **ORANGE** — informal "open" framing (itself unconfirmed) plus no license fields populated; do
  not treat as GREEN.
- Paywalled layer access: ORANGE — paywalling data whose only "open" signal is unverified marketing language is
  riskier than paywalling data with a confirmed license.

## Open questions for Olmsted County

1. Is there a formal, written license (not marketing copy) for the county's GIS data and 2023 imagery, and does
   it permit third-party commercial redistribution/embedding?
2. What does "open source" mean as the county uses it — publicly viewable, freely downloadable, or something
   with actual reuse rights attached?
3. Which GIS products carry the "application fees" mentioned on the GIS Data Resources page, and does that
   include the ImageServer MnMapping uses?

## Evidence

- `public.gis.olmstedcounty.gov/.../ImageServer?f=json` — `copyrightText: "na"`.
- `olmstedcounty.gov/residents/land-property/gis-maps-addressing` — no "open source" text found on direct fetch.
- `enterprise-resources-gis-olmsted.hub.arcgis.com/pages/gis-data` — same; generic service-catalog language only.
