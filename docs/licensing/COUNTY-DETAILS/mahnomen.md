# Mahnomen County

Not legal advice. Access date: 2026-09-18.

**✅ Update, 2026-09-19:** owner name, taxpayer name, and mailing address are no longer requested from the
direct parcel service for Mahnomen — only geometry, site address, acres, and legal description are shown,
with a link to the county Assessor's page for ownership/tax lookup. This was the richest owner/taxpayer
attribute exposure of any direct-service county in the audit. See
[RISK-REGISTER.md](../RISK-REGISTER.md) H2.

## Parcels — the richest owner/taxpayer attribute exposure of any direct-service county

Mahnomen's own `TaxParcels` FeatureServer, not the statewide aggregation. Service JSON has no license fields.
Confirmed 31 fields including `OWNER_NAME`, `OWNER_ADDRESS_1` through `_4`, `TAXPAYER_NAME`,
`TAXPAYER_ADDRESS_1` through `_4`, `PROPERTY_ADDRESS`, `DEEDED_ACRES`, `LEGAL`, `TAX_YEAR`. MnMapping's config
surfaces owner, site address, mailing address, acres, legal description, and tax year to the UI. The county
Assessor's office states generally (paraphrased): "most information in the assessor's office is public, except
for data subject to the data privacy act" — a general statement about office records, not a specific reuse
license for the GIS service, and it doesn't itself authorize bulk redistribution or commercial resale.

## Imagery

Only the 2012 statewide flight is embedded. The county's own 2020 aerial-photography item is **correctly
excluded** — the official item publishes the imagery for viewing but identifies no provider, copyright, or
imagery-specific reuse license.

## Business model notes

- Ads/free site: ORANGE.
- **Fields to consider excluding from a commercial product:** `OWNER_NAME`, `OWNER_ADDRESS_1-4`,
  `TAXPAYER_NAME`, `TAXPAYER_ADDRESS_1-4` — strongly consider suppressing the full taxpayer mailing-address
  block (4 lines) even if owner name and geometry are kept, since no source confirms bulk/commercial reuse of
  the complete mailing address is intended.

## Open questions for Mahnomen County

1. The public FeatureServer's service metadata carries no `copyrightText`/`licenseInfo` — is anonymous public
   access intended to permit third-party redistribution, or is it published for internal/viewer use only?
2. Does "most information... is public" extend to bulk machine redistribution of owner name and full mailing
   address via a commercial web app, or only to individual public-records requests?
3. Is there a data-use agreement or fee schedule for bulk/commercial use of this FeatureServer that isn't
   published on the public site?

## Evidence

- `services8.arcgis.com/eORKbx5CWReJmkoa/.../TaxParcels/FeatureServer/0?f=json` — all license fields empty.
- `mahnomencounty.gov/department/departments_a_h/assessor/index.php` — quoted above.
