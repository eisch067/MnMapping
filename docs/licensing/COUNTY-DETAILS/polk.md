# Polk County

Not legal advice. Access date: 2026-09-18.

## Parcels

Statewide MnGeo Open Parcels aggregation (28,885 records). Polk separately publishes its own direct ArcGIS
parcel service (not used by MnMapping), whose disclaimer names **Pro-West and Associates, Inc.** — a Minnesota
county-GIS data-processing contractor — alongside the county, standard AS-IS boilerplate.

## Imagery — the flagship "technically accessible ≠ licensed" case for the whole audit

`polk`/`polkcir` (2014 "Polk–Beltrami," 1 ft) is a MnGeo-hosted **statewide** WMS layer, low risk. Separately,
**`createPolk2025ImageryLayer`** integrates a WMTS served **directly from Pictometry's own infrastructure**
(`svc.pictometry.com/Image/98AF9924-.../wmts`), not proxied through any Polk County server. The app's own
`description` field for this layer already concedes its justification: *"The public WMTS capabilities report no
fees or access constraints, and an anonymous PNG tile response was verified 2026-09-18"* — i.e., the reasoning
rests entirely on technical accessibility, precisely what [RISK-REGISTER.md](../RISK-REGISTER.md) B1 identifies
as insufficient. `GetCapabilities`, fetched directly: `AccessConstraints: "none"`, `Fees: "none"`, but the layer
abstract explicitly states **"Copyright Pictometry 2025,"** and `ServiceProvider` identifies Pictometry (100
Town Centre Drive, Rochester, NY) as the operator — not Polk County. Because Polk County itself may not even be
the correct party to grant a sublicense here, EagleView/Pictometry would need to authorize this directly.

## Business model notes

- Parcels/statewide imagery: ORANGE (statewide-inherited silence).
- **The directly-integrated 2025 EagleView WMTS layer: RED** across every model that displays it. This is the
  single highest-priority remediation item in the whole northern-county batch, given (a) it's the only vendor
  imagery served directly from the vendor's own domain rather than proxied through a county service, and (b) the
  app's own code comment already concedes the justification is "technically accessible," not "licensed."

## Open questions for Polk County / EagleView

1. [To Polk County] Does the county's Pictometry CONNECT agreement permit the county to authorize third-party
   web applications to embed this WMTS service, or would that require Pictometry/EagleView's direct consent?
2. [To Pictometry/EagleView directly] Under what terms, if any, can a third-party commercial web-mapping
   application embed this publicly reachable WMTS endpoint?
3. [To Polk County] Is there a preferred, lower-risk way to display current Polk County imagery (e.g., a
   county-branded viewer link) instead of a direct embed, similar to Itasca and Cook?

## Evidence

- `svc.pictometry.com/Image/98AF9924-7080-15F7-B6F4-685FAB863751/wmts?SERVICE=WMTS&REQUEST=GetCapabilities` —
  "Copyright Pictometry 2025," AccessConstraints/Fees "none," quoted above.
- `src/config/layers/counties/northExpansion.ts`, `createPolk2025ImageryLayer` — the app's own reasoning,
  quoted above.
