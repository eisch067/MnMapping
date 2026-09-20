# Sherburne County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2024 imagery described below has been moved from a live embedded layer to an
external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (44,573 records). No Sherburne-specific parcel disclaimer located
beyond the general county GIS boilerplate (standard "as is," reference-purposes-only, Minn. Stat. §466.03 Subd.
21 indemnification language).

## Imagery — a suppression by coincidental year match, not URL match

Sherburne's 2024 imagery (`gis.co.sherburne.mn.us/arcgis3/.../Aerials2024/MapServer`) is integrated live; no
license fields, no vendor named in the metadata. `src/config/restrictedImagery.ts` has a Sherburne 2024 entry,
but at a **different URL** — an `arcgis.com` catalog item — flagged for "no imagery-specific third-party reuse
license." `isIntegratedArcgisImagery()` filters this entry out not because the URLs match, but because the
function also matches on **county name + year alone**. That means the specific concern raised about the
`arcgis.com` catalog item was never actually investigated or resolved for the different MapServer URL MnMapping
actually embeds — the internal warning disappeared due to a coincidental year match, not because the concern
was addressed. This is a distinct sub-pattern worth flagging separately in
[RISK-REGISTER.md](../RISK-REGISTER.md) B1's remediation.

## Business model notes

- Ads/free site: ORANGE (silent service, no vendor confirmation either way, prior flag not actually resolved).
- Paywalled layer access: ORANGE.

## Open questions for Sherburne County

1. Is the 2024 imagery served at `gis.co.sherburne.mn.us/arcgis3/.../Aerials2024/MapServer` the county's own
   product, or third-party vendor-flown imagery, and does the county publish a specific reuse license for it?
2. Does the licensing concern raised about the county's `arcgis.com` 2024 imagery catalog item apply equally to
   this MapServer?

## Evidence

- `gis.co.sherburne.mn.us/arcgis3/rest/services/Imagery/Aerials2024/MapServer?f=json` — all rights fields empty.
- `src/config/restrictedImagery.ts` lines 369–376 — different URL, same county+year, quoted above.
