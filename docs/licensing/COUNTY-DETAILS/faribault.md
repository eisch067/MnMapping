# Faribault County

Not legal advice. Access date: 2026-09-18.

## Parcels and imagery

Not currently sourced by MnMapping — the statewide MnGeo Open Parcels aggregation returned no Faribault
records, and only the statewide 2011 WMS mosaic is embedded for imagery.

## The audit's specific question for Faribault: what does the county charge?

Faribault does not publish a reusable streaming imagery service at all — it **sells its 2025 orthophoto mosaic**
(SID format, 6-inch county / 3-inch cities) by request, and `src/config/restrictedImagery.ts` already links the
county's official ordering page rather than embedding anything. Per a web-search summary of the county's GIS
Data Fee Schedule (direct PDF text extraction failed twice with available tools, so treat the following as
**reasonable inference, not independently re-confirmed byte-for-byte**):

- **2025 digital orthophotos** (SID format, combined 6-inch county / 3-inch city mosaic): **$500.00 for the
  entire county, or $100.00 per city**
- **Other/general GIS data categories**: **$50.00 for the entire county**

Source page: `faribaultcountymn.gov/sites/g/files/vyhlif561/f/uploads/gis_data_fee_schedule_2026.pdf`, titled
"Faribault County GIS Data Fee Schedule | January 1, 2026."

The county's GIS Data Request page (fetched directly) states data is provided "as is without warranty of any
kind... for reference purposes only and is not suitable for legal, engineering, or surveying purposes," and
notably that the data "was developed by Faribault County for their own internal business purposes and may be
inaccurate for other uses" — language suggesting the underlying data wasn't created with public commercial
redistribution in mind, though it isn't an explicit prohibition.

## Business model notes

- What's currently embedded (statewide mosaic only): GREEN.
- If Faribault's own purchased orthophoto or parcel data were ever added: **ORANGE** — purchasing the product
  doesn't itself establish a license to redistribute it publicly; the purchase is explicitly a delivered file
  (SID format), not a streamed service, so any future use would involve persistent storage by design, not live
  pass-through.

## Open questions for Faribault County

1. Can the actual GIS Data Fee Schedule PDF (or its terms of use / license language) be obtained directly to
   confirm the $500 (county) / $100 (per city) orthophoto pricing and $50 general-data pricing found via search,
   and to check for any resale/redistribution restrictions attached to a purchase?
2. Does purchasing the 2025 orthophoto mosaic grant a license permitting display in a public, commercial
   third-party web map (ad-supported, subscription, or B2B), or is it restricted to the purchaser's internal
   use?
3. Is Faribault County parcel data available for separate purchase, and on what terms?

## Evidence

- `faribaultcountymn.gov/1288/GIS-Data-Request` — disclaimer quoted above, fetched directly.
- Web search summarizing `co.faribault.mn.us/sites/g/files/vyhlif561/f/uploads/gis_data_fee_schedule_2026.pdf`
  — pricing quoted above; confidence: reasonable inference, PDF text extraction failed twice with available
  tools.
- `src/config/restrictedImagery.ts` lines 194–200 — county sells by request rather than streaming.
