# Attribution design

Research and design guidance, not legal advice. Where a source publishes exact required wording, it's quoted
here — do not invent attribution language beyond what's documented in
[STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md) and [COUNTIES.md](COUNTIES.md).

## What's actually required vs. what's good practice

| Source | Required wording | Legally required? |
|---|---|---|
| Statewide lidar DEM / hillshade / contours | "MNDNR must be acknowledged as having contributed data to the development of the product" | **Yes** (DNR General Data & Software License Agreement, clause 5) |
| DNR public land (WMA/SNA/Parks/AMA/State Forest) | Same clause 5 wording, same DNR agreement | **Yes** |
| USGS DOQ | "Credit: U.S. Geological Survey" (suggested) | No — requested, not required |
| Natural Earth II | None | No — "crediting the authors is unnecessary" |
| Statewide NAIP, MnGeo Composite | None found | No, but keep it — good practice |
| Statewide Open Parcels | None found | No — not shown as a contractual condition anywhere in the metadata |
| MnGeo county-owned/tax-forfeited land | None found | No |
| County parcel/imagery services (most) | None found on the pages checked | No, except where noted below |
| Wadena County (parcels) | "Any hardcopies utilizing any of the data shall clearly indicate the source" | **Yes**, per the county's signed Data License Agreement |
| Esri World Elevation 3D Terrain | Esri's own `copyrightText`: "Sources: Vantor, Airbus DS, USGS, NGA, NASA, CGIAR, GEBCO, N Robinson, NCEAS, NLS, OS, NMA, Geodatastyrelsen and the GIS User Community" | Standard ArcGIS practice; not confirmed as a contractual term for anonymous access in the terms reviewed |
| EagleView/Pictometry, Nearmap, Kucera imagery | County-supplied "County and Vendor" strings already in MnMapping's config | Attribution does **not** cure the missing reuse license for these — see [RISK-REGISTER.md](RISK-REGISTER.md) B1. Fix the license question first; attribution is a separate, smaller issue for these sources. |

## Suggested dynamic attribution architecture

Build a small per-layer attribution registry that mirrors what's already in `LayerDefinition.attribution` /
`.agency` (`src/config/layers/types.ts`) and render it two ways:

1. **On-map, always visible while a layer is on** — a compact strip listing the `attribution` string for every
   currently-visible layer, deduplicated (e.g. "MnGeo · MN DNR · Wadena County · EagleView (Pictometry), pending
   confirmation"). This is standard web-map practice (compare Leaflet/Mapbox attribution controls) and
   satisfies the DNR's "acknowledged as having contributed data" requirement automatically, since the DNR
   layers' attribution is already wired into their layer definitions.
2. **A dedicated "Data Sources" / About page** — one row per source, linking to the same evidence this audit
   collected: agency name, source URL, license summary, and a disclaimer excerpt. This is the natural home for
   the longer required text (the boundary-accuracy disclaimer, the DNR acknowledgement clause, Wadena's
   source-marking requirement) that doesn't fit in a one-line map strip.

Generate both from the same data structure so they can't drift apart — e.g., extend `LayerDefinition` with an
optional `attributionRequired: boolean` and `licenseNote?: string` field, populated from this audit's findings,
and have the on-map strip and the About page both read from it.

## Should attribution travel with exports/downloads/screenshots?

- **Exported maps/screenshots**: yes, for any layer requiring attribution per the table above (DNR/lidar,
  Wadena). A PDF/PNG export or screenshot feature should burn the same attribution strip into the output,
  consistent with the DNR clause's "when these data are used in the development of digital or analog products"
  language.
- **Downloaded data**: MnMapping's current export code (`src/lib/mapFormats.ts`) only exports the *user's own*
  drawn pins/notes (GeoJSON/KML/GPX of `MyMapItem`), never source GIS data — so this isn't yet a live concern.
  If a future "export the visible parcels" or "download this imagery tile" feature is added, it must carry the
  same attribution and disclaimer text, and (per [RISK-REGISTER.md](RISK-REGISTER.md)) must not include any of
  the B1 vendor-imagery layers or the DNR/lidar layers without written permission.
- **Copyright symbols**: not documented as required anywhere in this audit's evidence — none of the sources
  reviewed specify a © symbol as part of required attribution text. Use one if it reads naturally, but don't
  treat it as a compliance requirement.

## Example attribution strings, built from what's actually documented

```
Parcels: Minnesota Geospatial Information Office Open Parcels (MnGeo)
Imagery: USDA Farm Service Agency (NAIP) via MnGeo
Imagery: Wadena County, Minnesota — source must be indicated per county Data License Agreement
Terrain: MNDNR must be acknowledged as having contributed data to the development of this product
Public land: MNDNR must be acknowledged as having contributed data to the development of this product
```

Do not write attribution strings implying a vendor-imagery layer is properly licensed (e.g., a clean "Carlton
County and EagleView (Pictometry)" credit) while that layer's underlying reuse-rights question is unresolved —
crediting a source correctly is not the same as being licensed to display it. Fix the license question in
[RISK-REGISTER.md](RISK-REGISTER.md) B1 first.
