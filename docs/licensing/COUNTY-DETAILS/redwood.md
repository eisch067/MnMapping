# Redwood County

Not legal advice. Access date: 2026-09-18.

## Parcels and imagery — the most fully-priced county fee schedule found in the audit

Not currently sourced by MnMapping (statewide-only imagery is what's live). Redwood's **2025 Fee Schedule**
(adopted 2025-01-07) was fetched and read directly in full, GIS DATA section:

- Parcel Data: **$800.00/county**, or $0.10/parcel
- All other GIS Data: free
- 2009/2013/2016 aerial photos (free for **government entities only**): **$3,000.00/year** for all county
  sections; $100.00/section "Neighborhood Resolution"; $50.00/section "Community Resolution"
- Beacon subscription: $10/user (1 week) up to $250 (11+ users/year)
- GIS services requests: $45.00/hour

`src/config/restrictedImagery.ts` independently states "Redwood County sells the Pictometry aerial-photo
sections under its fee schedule rather than publishing a reusable streaming service" — this research
independently confirms the exact pricing behind that statement, directly answering the audit's specific
"paid licensing fee" question for Redwood.

## Business model notes

- Imagery: **RED** if ever added — the county explicitly sells sections by resolution tier as a standalone
  revenue product; the Beacon viewer itself is a paid per-user subscription, meaning the underlying data access
  is intentionally not meant for anonymous public redistribution.
- Parcels: **ORANGE** if ever added — an explicit paid product ($800/county), free-tier reuse terms unclear.
- Redistribution: RED — pricing is structured as one-time/annual purchases for a defined product, with no
  resale/redistribution rights found.

## Open questions for Redwood County

1. Does purchasing the "All County Sections" aerial-photo product ($3,000/year) or the Parcel Data product
   ($800/county) include any right to redistribute or publicly display the data on a third-party website?
2. Who is the imagery vendor/copyright holder for the priced Pictometry aerial-photo sections?

## Evidence

- `redwoodcounty-mn.gov/wp-content/uploads/dlm_uploads/2025/01/2025-Redwood-County-Fee-Schedule-1.pdf` — full
  PDF fetched and read directly, pricing quoted above verbatim, page 8.
- `src/config/restrictedImagery.ts` Redwood entry, citing the same fee-schedule PDF.
