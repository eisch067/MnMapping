# Fillmore County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** owner name, mailing address, and assessed value are no longer requested from the
statewide parcel service for Fillmore — only geometry, acres, and legal description are shown, with a link to
the county's GIS page for ownership/tax lookup. See [RISK-REGISTER.md](../RISK-REGISTER.md) H2. **This does
not resolve the broader question below** — Fillmore's own "will not convey or sell the data... to a third
party" language reads as covering the parcel geometry itself, not just owner/tax attributes, and that remains
open.

## Parcels — a direct collision with the county's own posted disclaimer

Sourced via the statewide MnGeo Open Parcels aggregation only (20,917 records) — no direct Fillmore service.
This directly collides with Fillmore's own posted GIS disclaimer, fetched directly:

- *"The Fillmore County data is provided for demonstration purposes only and **may not be distributed without
  prior signed authorization from the Fillmore County GIS Department**."*
- *"[The user] will not convey or sell the data or any part of it to a third party."*
- *"COPYRIGHT 2006, FILLMORE COUNTY, MINNESOTA."*

Owner name, mailing address (4 lines), and assessed value are all present in the statewide schema. Given
Fillmore's explicit "will not convey or sell the data... to a third party" language, exposing these fields
pulled indirectly from Fillmore's contribution is a live, unresolved legal question — even though MnMapping's
technical access point is the state aggregator, not Fillmore's own service, and silence in the aggregator's own
metadata does not affirmatively clear this.

## Imagery

Only statewide WMS imagery is embedded; Fillmore's own 2022 EagleView (Pictometry) imagery is **correctly
excluded** already (per a county board-packet PDF documenting the licensed flight).

## Business model notes

- **Paywalled/redistribution: RED** — directly gating access to Fillmore-sourced parcel/tax data behind a
  paywall, or offering it as a bulk/offline package, is difficult to reconcile with "will not convey or sell the
  data or any part of it to a third party."
- Ads: ORANGE — monetizing display of data the source county says may not be conveyed/sold to a third party
  compounds risk, especially combined with owner/tax PII.
- Fields to exclude from a commercial product: `owner_name`, `owner_more`, `own_add_l1`–`l4`, `emv_land`/
  `emv_bldg`/`emv_total`, `tax_capac`, `total_tax` — until Fillmore County confirms the statewide-aggregation
  pathway isn't subject to its own no-redistribution disclaimer.

## Open questions for Fillmore County

1. Does the county's opt-in agreement with the MnGeo statewide Open Parcels service grant MnGeo (and its
   downstream consumers) reuse rights beyond the county's own posted "no redistribution without signed
   authorization" disclaimer?
2. Would Fillmore County permit a public, ad-supported or subscription web map to display parcel ownership name,
   mailing address, and assessed value sourced via the MnGeo aggregation?

## Evidence

- `co.fillmore.mn.us/departments/gis/disclaimer.php` — quoted in full above.
- `co.fillmore.mn.us/departments/gis/gis_services.php` — historical subscription fee model, now "open and free
  to the public," no current dollar figures published.
