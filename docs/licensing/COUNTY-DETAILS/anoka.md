# Anoka County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** all five imagery vintages described below have been moved from live embedded
layers to external "View imagery ↗" links — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Parcels

Statewide MnGeo Open Parcels aggregation (140,221 records) — see [STATEWIDE-SOURCES.md](../STATEWIDE-SOURCES.md).

## Imagery — five vintages, all suppressed from the app's own warning UI

Anoka's own five county-owned vintage MapServers (2026 spring, 2025 fall, 2024 spring, 2020, 2017) are
integrated directly. `src/config/restrictedImagery.ts` has an entry for every one of these exact five
URL+year combinations: *"The county service is publicly viewable, but it provides no copyright statement or
license granting third-party embedding rights."* Because `isIntegratedArcgisImagery()` matches on exact
year+sourceUrl, all five entries are filtered from the app's own restricted-imagery display. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1.

Anoka's own Data Downloads page states: *"There is no cost associated with this data and a no signed license
agreement is required,"* plus a $50/hour processing fee for custom/non-standard requests, and the standard
Minn. Stat. §466.03 Subd. 21 liability disclaimer (reference-only, not for legal/engineering/survey use). This
is the strongest "explicit permission" language found for a directly-integrated county imagery service anywhere
in this audit — but it describes using county GIS data generally (e.g., in desktop GIS software), which is
legally distinct from a sublicense to embed the imagery inside a commercial third-party web map.

## Business model notes

- Ads/free site: ORANGE — the "no cost, no license agreement" language is a positive signal but doesn't
  affirmatively grant third-party redistribution/embedding rights.
- Paid ad removal: probably allowed (doesn't change the underlying data exposure).
- Paywalled layer access: ORANGE — paywalling increases visibility/stakes without adding legal certainty.
- Redistribution/offline packages: ORANGE-RED — not addressed anywhere; confirm with the county first.

## Open questions for Anoka County

1. Does the "no license agreement required" data policy extend to embedding the county's aerial imagery
   services inside a commercial, ad-supported, third-party web-mapping application?
2. Is there a separate license or attribution requirement specifically for the Aerials MapServer series versus
   general GIS data?
3. Would a paid/subscription tier built on this imagery require a separate agreement?

## Evidence

- `gis.anokacountymn.gov/anoka_gis/rest/services/Aerials/MapServer?f=json` (and 4 sibling vintages) — no
  license fields.
- `anokacountymn.gov/1990/Data-Downloads` — "no cost... no signed license agreement is required," quoted above.
- `src/config/restrictedImagery.ts` lines 19–58 — five matching entries, all suppressed by integration.
