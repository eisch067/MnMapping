# Yellow Medicine County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2025 EagleView imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation. A separate county tax-value lookup tool (not the GIS service
MnMapping uses) carries a standard no-warranty disclaimer.

## Imagery — confirmed vendor, live-embedded

The 2025 EagleView MapServer is embedded via `/api/gis-proxy/yellow-medicine-imagery/Pictometry/2025_Eagleview/MapServer`.
`documentInfo.Keywords`: "Imagery,Eagleview,Pictometry" — vendor explicitly named — while `copyrightText`,
`accessInformation`, and `licenseInfo` are all empty, and `exportTilesAllowed` is `false`.
`src/config/restrictedImagery.ts` independently found: "the official service identifies commercial
EagleView/Pictometry imagery but publishes no third-party reuse license" — suppressed by the integration. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: ORANGE.
- Imagery: **RED**.
- Current attribution ("Yellow Medicine County GIS") doesn't credit EagleView/Pictometry by name — worth fixing
  regardless of the licensing question.

## Open questions for Yellow Medicine County / EagleView

1. Does Yellow Medicine County hold a sublicense from EagleView/Pictometry that permits third-party web
   applications to redistribute/embed the 2025 imagery?
2. Why does `exportTilesAllowed:false` apply if the intent is public reuse?

## Evidence

- `gis.co.ym.mn.gov/arcgis/rest/services/Pictometry/2025_Eagleview/MapServer?f=json` — quoted above.
- `src/config/restrictedImagery.ts` (line ~442-448) — quoted above.
