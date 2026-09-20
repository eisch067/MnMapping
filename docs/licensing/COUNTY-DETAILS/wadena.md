# Wadena County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** the 2025 EagleView imagery described below has been moved from a live embedded
layer to an external "View imagery ↗" link — see [RISK-REGISTER.md](../RISK-REGISTER.md) B1. The parcel
findings below (owner/taxpayer/mailing-address fields, Data License Agreement) are unaffected.

## Parcels — a real, documented Data License Agreement

Wadena's own `LinkPublic` FeatureServer, not the statewide aggregation. `?f=json` has no license fields, but
Wadena County publishes a separate **"Application/Request for Data License Agreement"** PDF whose text was
independently decompressed and read directly (not search-engine paraphrase):

> "No warranty is made, either expressed or implied, as to other matter whatsoever, including... the condition
> of the product or its fitness for any particular purpose. The burden for determining fitness for use lies
> entirely with the user."
>
> "The Wadena County GIS is regarded as public information; however, due to the content and technicality of the
> [system there are costs to recover — this continuation was reported by a search-engine index but not
> independently confirmed byte-for-byte in this session's own PDF extraction; treat as probable, not confirmed]."
>
> "Any hardcopies utilizing any of the data shall clearly indicate the source... Licensee specifically agrees
> not to misrepresent any data, nor to imply that changes they made were approved."
>
> "The digital data is licensed by Wadena County, Wadena, MN." The applicant must sign, and the form has a
> blank **"FEE: $______"** field, i.e. a per-request fee determined case-by-case.

Owner name, taxpayer name (secondary owner), and mailing address are exposed (`OWNER_NAME`,
`OWNER_ADDRESS1/2/3`, `TAXPAYER_NAME`, `PHYSICAL_ADDRESS`); **no assessed-value field is exposed** — a smaller
attribute surface than most other direct-service counties.

The county separately operates the public, anonymous, no-login `LinkPublic` service MnMapping actually queries —
suggesting the county already distinguishes "browse via our live map service" from "obtain a licensed copy of
our data" (the fee-bearing Application process), but no source confirms a third party may re-embed the live
service in its own app.

## Imagery

The 2025 EagleView MapServer is directly integrated live. `src/config/restrictedImagery.ts` independently
concludes no third-party reuse license was found — suppressed from the app's UI by the integration. See
[RISK-REGISTER.md](../RISK-REGISTER.md) B1.

## Business model notes

- Parcels: ORANGE — a real licensing regime exists, but its applicability to a live, anonymous pass-through
  display (vs. the formal fee-based Application process) is unsettled.
- Imagery: **RED**, same reasoning as Marshall.
- Fields to exclude from a commercial product: owner name, taxpayer name, mailing address.
- Redistribution/offline packages: this is the one county in the state with an affirmative, *documented* path
  to a licensed bulk/offline data package — but it's paid, case-by-case, not a blanket grant.

## Open questions for Wadena County

1. Does the live, anonymous `LinkPublic` service require the same Application/Data License Agreement as bulk
   data requests, or is public live-map display already permitted without that process?
2. What is the actual fee schedule for a Data License Agreement, and would it scale to a commercial web
   application rather than a one-time data pull?
3. Does the EagleView imagery contract permit third-party embedding by a public web map?

## Evidence

- `gis.co.wadena.mn.us/arcgis/rest/services/LinkPublic/MapServer/0?f=json` — empty license fields; field schema
  confirmed.
- `wadenacounty.gov/DocumentCenter/View/165/GIS-Data-Request-Form-PDF` — decompressed and quoted directly above.
- `src/config/restrictedImagery.ts` lines 465–471 — EagleView layer, contradicted by integration.
