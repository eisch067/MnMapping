# Hubbard County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** owner name, mailing address, and tax year are no longer requested from the direct
parcel service for Hubbard — only geometry, site address, acres, and legal description are shown, with a
link to `publicaccess.co.hubbard.mn.us` for ownership/tax lookup. See [RISK-REGISTER.md](../RISK-REGISTER.md)
H2. **This does not resolve the broader question below** — the county's explicit, unreleased copyright
assertion (naming the Recorder's and Assessor's Offices) reads as covering the parcel geometry itself, not
just owner/tax attributes, and remains the strongest unresolved risk signal in the state for a still-displayed
source.

## Parcels — the strongest explicit copyright assertion found in the state

Hubbard's own `Hubbard_County_Tax_Parcels` FeatureServer is the *only* service in this entire audit with a
populated `copyrightText` field. Quoted in full: *"Hubbard County GIS, Hubbard County Environmental Services,
301 Court Ave, Park Rapids, MN 56470; Hubbard County Recorder's Office...; Hubbard County Assessor's Office...;
Hubbard County Environmental Services..."* — an explicit ownership claim naming the Recorder's and Assessor's
Offices as contributing rights-holders, with **no accompanying reuse grant**. Owner name, secondary owner,
mailing address, and tax year are all exposed through the same service (`PINAME1`/`PINAME2`, `PIADRLN1`,
`PYPYEAR`).

A separate system — the county's public parcel-lookup website (`publicaccess.co.hubbard.mn.us`, distinct from
the FeatureServer MnMapping actually queries) reportedly states (per search-indexed text, not independently
confirmed by direct fetch, which returned HTTP 403): *"Visitors to this website are expressly prohibited from
using applications designed to mine, gather or extract data."* This doesn't directly govern MnMapping's REST
queries, but signals the county's general posture.

## Imagery

Six county-owned vintages (2011–2026), no vendor identified in the metadata, empty `copyrightText`. **YELLOW.**

## Business model notes

- **ORANGE for both parcels and owner/tax attributes** — the explicit, named copyright claim with no reuse
  grant is the strongest single risk signal of any county in this audit for the parcel-attribute question.
- Paywalled/B2B/offline models (F, G, H) on Hubbard parcel data are the highest-risk in the state; do not launch
  without written confirmation from the county.
- Fields to exclude from a commercial product: `PINAME1`/`PINAME2` (owner), `PIADRLN1` (mailing address) —
  strongest candidates in the whole audit.

## Open questions for Hubbard County

1. The Tax Parcels FeatureServer's `copyrightText` names the county, Recorder's Office, and Assessor's Office as
   rights holders — what does this permit or prohibit for a third-party public web application, including
   ad-supported or paid use?
2. Does the county's Public Data Access Policy (2025) impose a fee or agreement requirement for bulk/automated
   (API) access, as distinct from manual public inspection?
3. Does the anti-data-mining clause on the public parcel-search website extend to the separate ArcGIS REST
   FeatureServer?

## Evidence

- `gis.co.hubbard.mn.us/arcgis/rest/services/OpenData/Hubbard_County_Tax_Parcels/FeatureServer/0?f=json` —
  copyright text quoted above in full.
- `gis.co.hubbard.mn.us/arcgis/rest/services/Imagery/2026_Imagery/MapServer?f=json` — empty.
- `publicaccess.co.hubbard.mn.us` — search-indexed only, direct fetch returned 403.
