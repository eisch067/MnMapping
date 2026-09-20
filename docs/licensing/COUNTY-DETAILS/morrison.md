# Morrison County

Not legal advice. Access date: 2026-09-18.

## Parcels

Statewide MnGeo Open Parcels aggregation only — see [STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md) (GREEN).
Morrison (FIPS 097) is **not** in `countiesWithGovernmentOwnership`, so no county-owned/tax-forfeited layer is
generated for it — a data gap, not a licensing restriction.

## Imagery — the cleanest example of a county monetizing its own imagery directly

Only the 2013 statewide WMS layer is embedded. Morrison's own 2020 aerial photography (3-inch cities / 6-inch
county) is explicitly **for sale**, not published as a streaming service. The county's live GIS Fees page,
fetched directly:

- Baseline Tax/CAMA data: $350 each
- 2020 Aerial Photos (3"/6"): $30/section, $250/township, **$2,500 countywide**
- 2023 Aerial Photos (2"/9"): $50/section, $500/township, **$4,000 countywide**
- *"All digital data requests are required to sign a license agreement prior to release of any data."* 6.875%
  sales tax applies.
- Disclaimer: "Morrison County makes no representation or warranties... for the merchantability or fitness of
  the data for a particular purpose... is not responsible for any misuse or misrepresentation."

## Business model notes

- Currently-embedded statewide source: YELLOW, same as any other statewide-only county.
- Morrison's own imagery is N/A today (not embedded); if it were ever added, it would require purchasing under
  a signed license agreement — treat as RED for any model that doesn't go through that process first.

## Open questions for Morrison County

1. What does the standard digital-data license agreement say about commercial resale, web-embedding, or a
   paying subscriber base?
2. Does the $4,000 countywide 2023 imagery price include any redistribution rights, or display-only?
3. Would Morrison consider a streaming-service arrangement similar to Ramsey's/Carlton's ArcGIS REST offerings?

## Evidence

- `morrisoncountymn.gov/292/GIS-Fees` — fee figures and license-agreement requirement quoted above.
- `src/config/restrictedImagery.ts` — Morrison entry, correctly excluded from the live map.
