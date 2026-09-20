# Ramsey County

Not legal advice. Access date: 2026-09-18.

## An in-app licensing claim that does not hold up

`src/config/layers/counties/northExpansion.ts` (line 242) asserts Ramsey County *"explicitly makes the imagery
available for public download and use without fee or licensure."* This audit could not substantiate that claim.
The county's own aerial-imagery-download page (`ramseycountymn.gov/residents/property-home/maps-surveys/
aerial-imagery-download`) was fetched directly, including every link and all footer/small-print text: it links
to an ArcGIS Experience app for downloading imagery, but contains **no fee statement and no licensing statement
of any kind**. The page's only "Terms of Use" link actually routes to the county's general Notice of Privacy
Practices — not an aerial-imagery-specific terms document. The ImageServer's own `?f=json` metadata
(`copyrightText` empty) likewise has no fee/license statement. **Recommend downgrading the in-app description or
confirming directly with Ramsey County GIS before relying on it for a commercial launch.**

## Imagery

The 2022 ImageServer (`OrthoPhotos/Aerial2022`) that MnMapping embeds is a **county-owned** product — Ramsey's
own ArcGIS Server folder listing separately includes a distinct "Pictometry" folder (vendor-licensed imagery)
that MnMapping correctly does *not* use. Keep it that way if a future Ramsey vintage is ever added.

## Parcels

Statewide MnGeo Open Parcels aggregation — see [STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md).

## Business model notes

- Free public site (imagery): UNCLEAR pending the verification gap above.
- Ads/paywalled use of the 2022 imagery: ORANGE — do not rely on the "explicit permission... without fee or
  licensure" language without confirming it directly with the county.

## Open questions for Ramsey County

1. Is there a written license or terms document specifically covering the OrthoPhotos/Aerial2022 ImageServer,
   distinct from the general Notice of Privacy Practices linked from the download page?
2. Where is the actual "no fee or licensure" policy documented, if it exists?
3. Can Ramsey County confirm in writing that a commercial, ad-supported third-party web application may embed
   this imagery live?

## Evidence

- `ramseycountymn.gov/residents/property-home/maps-surveys/aerial-imagery-download` — fetched in full; no
  fee/license statement found; "Terms of Use" link resolves to Notice of Privacy Practices.
- `maps.co.ramsey.mn.us/arcgis/rest/services/OrthoPhotos/Aerial2022/ImageServer?f=json` — empty license fields.
- `maps.co.ramsey.mn.us/arcgis/rest/services?f=json` — confirms a separate, unused "Pictometry" folder.
