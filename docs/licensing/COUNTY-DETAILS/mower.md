# Mower County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2023 Ayres Associates/MERC-program imagery described below has been moved from
a live embedded layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (22,956 records).

## Imagery — the strongest-worded prohibition of any suppressed layer in the state

Mower's 2023 spring imagery is a named, licensed **Ayres Associates** flight (not EagleView/Pictometry) —
4-band orthoimagery from a Microsoft Vexcel UltraCam Eagle M3 sensor. `src/config/restrictedImagery.ts`
independently found: *"The official item limits use to purposes outlined in the 2023-24 MERC orthoimagery
partnership program and does not grant general third-party embedding rights."* This is a **named-program**
restriction, not generic silence about an unnamed vendor — the strongest-worded prohibition of any layer caught
in the [RISK-REGISTER.md](../RISK-REGISTER.md) B1 pattern. `arcgisImagery.ts` nonetheless defines a live spec
for the same county+year, and the layer is embedded today. Independently confirmed the Ayres/MERC provenance
via the service's own hub description.

## Business model notes

- Parcels: GREEN.
- Imagery: **RED**, and the strongest case in the state for pulling a layer immediately given the named-
  program restriction is explicit, not inferred.

## Open questions for Mower County

1. Does the 2023-24 MERC orthoimagery partnership program permit Mower County to allow third-party commercial
   web applications (not just the county's own GIS viewer) to display this imagery?
2. Would the county prefer MnMapping remove this specific layer pending clarification?

## Evidence

- `restrictedImagery.ts:290-295` — MERC program restriction quoted above.
- `gisweb.co.mower.mn.us/server/rest/services/Imagery/County_Imagery_2023_Spring/MapServer?f=json` and
  `geospatial-hub-mowercountymn.hub.arcgis.com` — Ayres Associates/Vexcel provenance confirmed directly.
