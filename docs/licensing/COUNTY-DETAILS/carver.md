# Carver County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the Kucera-named 2026 imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (47,886 records). Carver is reported (via a secondary source, not
independently confirmed from a Carver-specific document) as one of seven Twin Cities metro counties (Ramsey,
Hennepin, Dakota, Carver, Anoka, Washington, Scott) that adopted 2014–2015 board resolutions making public
geospatial data freely available "without fee or licensure" — a positive but unconfirmed-at-the-primary-source
signal.

## Imagery — vendor named directly in the service metadata

The 2026 "Tiled Imagery" MapServer is integrated live. Its `documentInfo`: Title "2026 Tiled Imagery," Author
"CarverGIS," **Subject: "2026 Imagery - Kucera," Keywords: "2026, Imagery, Kucera"** — Kucera International is
explicitly named as the vendor. `copyrightText`/`licenseInfo` are empty. The service reports
`"exportTilesAllowed": false` and an `accessInformation`/access-level field marked **"SECURE"** — worth flagging
as an open question (this may just indicate an HTTPS requirement, or may indicate the service was intended to
be access-controlled and isn't being enforced that way publicly). `src/config/restrictedImagery.ts`: "the
official public item identifies Kucera imagery but leaves its license and access-information fields blank" —
suppressed from the app's UI by the integration. See [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: YELLOW, per the metro open-data policy signal (unconfirmed at the primary source).
- Imagery: **RED** — named vendor (Kucera), no confirmed license, live-embedded.
- Current attribution ("CarverGIS") doesn't credit Kucera.

## Open questions for Carver County

1. Does the 2014–2015 metro-counties open-data resolution (if Carver adopted it) extend to bulk redistribution
   and commercial reuse by a third-party application, or only to direct end-user download?
2. Does Carver County's Kucera imagery contract permit third-party web embedding, and what does the "SECURE"
   access designation on the 2026 Tiled Imagery service indicate?

## Evidence

- `tiles.arcgis.com/tiles/wMZT8kNwa6tOxhKg/.../2026_Tiled_Imagery/MapServer?f=json` — Kucera named directly,
  quoted above.
- `src/config/restrictedImagery.ts` lines 97–104 — quoted above.
