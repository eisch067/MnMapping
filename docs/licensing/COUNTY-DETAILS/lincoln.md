# Lincoln County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** all four EagleView WMTS layers described below have been moved from live embedded
layers to external "View imagery ↗" links — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1. Lincoln has no
parcel layer configured at all today, so nothing is currently embedded for this county.

## Parcels

None currently sourced — Lincoln has no `parcelLayer`/`parcelCount` set in the app at all.

## Imagery — the strongest single case for removal in the whole audit

Four EagleView WMTS layers (2026, 2023, 2020, 2017), served **directly from Pictometry's own infrastructure**
(`svc.pictometry.com`), not proxied through any Lincoln County server — architecturally distinct from most of
the other counties in [RISK-REGISTER.md](../RISK-REGISTER.md) B1, where at least the imagery is proxied through
a county-controlled endpoint. `GetCapabilities`, fetched directly, confirms: Abstract "Pictometry CONNECT
provides access to imagery via this WMTS service"; `<Fees>none</Fees>`; `<AccessConstraints>none</AccessConstraints>`;
and **each layer carries its own explicit copyright line** — "Copyright Pictometry 2026" for MNLINC26,
"Copyright Pictometry 2023" for MNLINC23, and so on. The app's own layer description reasons that "the WMTS
capabilities report no fees or access constraints" as supporting evidence for inclusion — **this reasoning does
not establish a third-party embedding right.** `<Fees>none</Fees>` describes the cost of accessing the
capabilities document/tiles, not a copyright license; it is standard for a WMTS to be technically open while the
underlying imagery remains fully copyrighted and licensed only to the paying customer (Lincoln County) for
internal/government use. Combined with EagleView's own published terms (internal-use-only,
non-redistributable — see [STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md)), this is a clear RED regardless of
technical accessibility.

## Business model notes

- **RED across every model** — free public site, ads, paywall, B2B, offline. Correct attribution ("Lincoln
  County and EagleView (Pictometry)") does not cure the missing sublicense.
- **Recommend removing all four layers from any public/commercial build** until Lincoln County or
  EagleView/Pictometry confirms a third-party embedding sublicense in writing.

## Open questions for Lincoln County / EagleView

1. Can Lincoln County or EagleView/Pictometry confirm in writing whether MnMapping may embed and redistribute
   the county's licensed EagleView WMTS imagery?
2. Does Lincoln County's EagleView contract include any web-redistribution rights the county could pass
   through, or is it strictly internal/government use?

## Evidence

- `svc.pictometry.com/Image/B87D3650-B05B-04A6-D816-184043FEA0A4/wmts?SERVICE=WMTS&REQUEST=GetCapabilities` —
  quoted above, per-layer copyright notices confirmed.
- `co.lincoln.mn.us/departments_agencies/gis_maps.php` — no disclaimer text found; links a "Geospatial Data
  Pricing" document not fetched this session.
