# Winona County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** owner name, mailing address, and assessed value are no longer requested from the
statewide parcel service for Winona — only geometry, acres, and legal description are shown, with a link to
the county's GIS page for ownership/tax lookup. See [RISK-REGISTER.md](../RISK-REGISTER.md) H2. **This does
not resolve the broader question below** — Winona's self-contradictory "public domain" / "not for use by
third parties" disclaimer reads as covering the parcel geometry itself, not just owner/tax attributes, and
that remains the strongest unresolved conflict in the audit.

## Parcels — a self-contradictory disclaimer

Statewide MnGeo Open Parcels aggregation (25,538 records). Winona County's own GIS page carries a genuinely
self-contradictory disclaimer, fetched directly and quoted in full:

- *"Map and/or data is public domain in accordance with Section 466.03, subdivision 21 of Minnesota State
  Statute."*
- *"Map and/or data not appropriate for use in establishment of property boundaries, in property descriptions,
  or for any legal purposes; not appropriate for navigation; **not for use by third parties**."*
- Standard "AS IS"/no-warranty/liability-limitation language follows.

A public third-party web application is exactly the use case the "not for use by third parties" clause appears
to exclude, sitting immediately after a "public domain" claim in the same document. Minn. Stat. § 466.03 subd.
21 is a municipal tort-liability exemption statute, not a data-licensing statute — the "public domain" framing
citing it appears to be boilerplate, and does not resolve the conflict.

## Imagery

Only statewide WMS imagery is embedded; Winona's own Beacon-viewer imagery is correctly excluded.

## Business model notes

- **This is the strongest single conflict found in the entire audit** — recommend direct written confirmation
  from Winona County before any commercial launch touching Winona parcel/tax data.
- Paywalled layer access / redistribution: **RED** on the plain text.
- Fields to exclude: `owner_name`, `owner_more`, `own_add_l1`–`l4`, `emv_total`, `tax_capac`, `total_tax`; also
  consider whether Winona parcel geometry itself should be held back pending clarification, since the "not for
  use by third parties" language applies to "map and/or data" generally, not just attributes.

## Open questions for Winona County

1. The GIS page states the data is "public domain" per Minn. Stat. 466.03 subd. 21, yet the same disclaimer
   says the data is "not for use by third parties" — which governs for a public-facing third-party web
   application?
2. Does the county's opt-in to the MnGeo statewide Open Parcels aggregation carry different reuse terms than
   the county's own posted disclaimer?

## Evidence

- `winonacounty.gov/245/GIS` (redirected from `co.winona.mn.us/245/GIS`) — fetched in full, quoted above.
