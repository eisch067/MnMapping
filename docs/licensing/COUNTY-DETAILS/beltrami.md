# Beltrami County

Not legal advice. Access date: 2026-09-18.

## Parcels

Beltrami's own `BeltramiOpenData` FeatureServer (layer 2, ~41,646 records). No `copyrightText`/license fields.
The county's property-mapping page states: *"Parcel maps are developed primarily from property tax records and
deeds. Even though they display 'boundaries' on a map, they are not surveys and should not be used for locating
property lines and corners... their accuracy is not guaranteed."* Owner name (×2), mailing address, and assessed
value are all exposed (`OWNERNAME1`/`OWNERNAME2`, `OWNER1_ADD`, `EMV_TTL`) with no field-specific distinction.

## County parks (separate from the statewide tax-forfeit layer)

Beltrami is **not** in the statewide county-owned/tax-forfeited allow-list, but separately publishes its own
8-polygon county-parks layer through the same open-data FeatureServer (layer 12), which MnMapping embeds. The
app's own description already flags: "Verify current park rules and closures before visiting" — an appropriate
disclaimer, not a licensing gap.

## Imagery

2023/2020 county imagery and the 2014 joint Polk/Beltrami acquisition, all served through the statewide MnGeo
WMS (no vendor, no county-specific integration). **YELLOW.**

## Business model notes

- Ads/free site: YELLOW — no restriction found, but the surveyor-caution language is about accuracy, not
  commercial use.
- Paywalled layer access: YELLOW.
- Fields to exclude from a commercial product: `OWNERNAME1`/`OWNERNAME2`, `OWNER1_ADD`, `EMV_TTL` for
  paywalled/B2B models pending confirmation.

## Open questions for Beltrami County

1. Does the Open Data parcel and parks FeatureServer permit third-party commercial embedding and redistribution?
2. Are owner name, mailing address, or assessed-value fields subject to any separate access or reuse
   restriction under the county's Data Practices Act procedures?

## Evidence

- `arcgis.co.beltrami.mn.us/arcgis/rest/services/BeltramiData/BeltramiOpenData/FeatureServer/2?f=json` — empty.
- `beltramicountymn.gov/departments/gis/property-mapping/` — disclaimer quoted above.
