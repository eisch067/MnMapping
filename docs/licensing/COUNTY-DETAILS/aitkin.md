# Aitkin County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2024 Pictometry imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1. The 2011 DNR
fall imagery and parcel findings below are unaffected.

## Parcels

Aitkin's own `ParcelTaxData` FeatureServer (`gisweb.co.aitkin.mn.us`), not the statewide aggregation. Service
JSON carries no `copyrightText`/`license` fields. The county's GIS Maps page states: *"These maps are intended
for graphic display purposes only. While every reasonable effort has been made to produce a correct map, we
cannot guarantee their accuracy. Aitkin County assumes no liability for any errors... or for any unintended use
of these maps,"* plus a vague "Data rates may apply" note with no fee schedule found. Owner name, mailing
address, and assessed value are all exposed (`OWNNAME`, `OWN_ADDR_1`, `ESTTOTVAL`) through the same
undifferentiated service. **YELLOW.**

## Imagery — the important finding

MnMapping embeds two sources for Aitkin: 2011 DNR fall imagery (no vendor, YELLOW), and a **2024 Pictometry
MapServer that `src/config/restrictedImagery.ts` documents as excluded** ("the Pictometry imagery record does
not publish a third-party reuse license for MnMapping"). Because `arcgisImagery.ts` defines a live spec for the
identical URL, `isIntegratedArcgisImagery()` silently drops that warning from the app's own UI, and the layer is
fetched and rendered today regardless. See [RISK-REGISTER.md](../RISK-REGISTER.md) B1. **ORANGE**, trending RED
for any monetized use.

## Business model notes

- Ad-supported free site: YELLOW for parcels/DNR imagery; ORANGE for the live Pictometry layer.
- Paid ad removal: probably allowed (parcels); unclear (Pictometry layer).
- Paywalled layer access: YELLOW (parcels); ORANGE, do not paywall the Pictometry layer.
- Fields to exclude from a commercial product: `OWNNAME`, `OWN_ADDR_1`, `ESTTOTVAL` pending confirmation.

## Open questions for Aitkin County / Pictometry

1. Does the public ArcGIS parcel FeatureServer permit third-party commercial redistribution, including in a
   paid or ad-supported product?
2. Does the 2024 Pictometry aerial imagery carry a license permitting embedding in a third-party public web map?
3. Are owner name, mailing address, and assessed-value fields subject to any use restriction beyond the general
   Data Practices Act classification of parcel data?

## Evidence

- `gisweb.co.aitkin.mn.us/arcgis/rest/services/ParcelTaxData/FeatureServer/0?f=json` — empty license fields.
- `co.aitkin.mn.us/departments/gis/gis-maps.php` — disclaimer quoted above.
- `gisweb.co.aitkin.mn.us/arcgis/rest/services/2024PictometryImagery/MapServer?f=json` — empty license fields.
- `src/config/restrictedImagery.ts` lines 12–18 and `src/config/layers/counties/arcgisImagery.ts` line 19 —
  code cross-reference confirming the suppression.
