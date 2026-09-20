# Nicollet County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** Nicollet has no parcel layer configured in MnMapping at all today (see below), so
there was nothing live to redact. The owner/mailing-address redaction added for the other 9 counties in
[RISK-REGISTER.md](../RISK-REGISTER.md) H2 has been pre-configured in code (`shared.ts`) so it will apply
automatically the moment a Nicollet parcel source is added.

## Parcels

Not currently sourced by MnMapping. Nicollet directly sells "GIS Digital Data (ESRI Shapefile Format)":
per-parcel $0.05/sq ft or $5.00 minimum; entire county **$500.00** (2026 Property Services Fee Schedule,
verified verbatim by full document fetch).

## Owner/tax attributes — the strongest explicit anti-bulk-download clause in the audit outside imagery

Nicollet's Recorder/Registrar of Titles land-records portal, **RecordEASE Web**, is a paid subscription ($50
setup + $50/month) whose terms state, fetched verbatim: *"Multiple parcel data downloads, screen scraping
programs or other computer extraction techniques are strictly prohibited,"* and the county "reserves the right
to deny site access to any individual or entity determined to be misusing the site." This is an explicit,
confirmed prohibition on bulk extraction of recorded land-record data — the strongest such clause found anywhere
in this audit outside the vendor-imagery findings.

## Imagery

Only statewide WMS imagery is embedded; Nicollet's own 2020 Pictometry mosaic (viewable via an Esri "Experience"
web app) is correctly excluded.

## Business model notes

- Paywalled/redistribution: **RED for RecordEASE-sourced content** (bulk extraction expressly prohibited);
  ORANGE for the plain GIS shapefile purchase (sold, but silent on resale/reuse rights).
- Fields to exclude if Nicollet is ever added: owner/taxpayer name, mailing address if sourced via RecordEASE.

## Open questions for Nicollet County

1. Does the $500 "entire county" GIS shapefile purchase include a license to redistribute or publicly display
   the data on a third-party website, including an ad-supported one?
2. Do the RecordEASE Subscription Agreement terms extend to publicly available parcel geometry, or only to
   recorded documents?

## Evidence

- `co.nicollet.mn.us/DocumentCenter/View/5049/Property-Services-Fee-Schedule` — full PDF fetched, GIS Digital
  Data pricing quoted above.
- `nicolletcountymn.gov/581/RecordEASE-Web` — anti-scraping clause quoted verbatim above.
