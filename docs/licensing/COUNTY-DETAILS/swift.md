# Swift County

Not legal advice. Access date: 2026-09-18.

## Parcels

Not currently sourced by MnMapping.

## Imagery — direct, first-party confirmation of a vendor contract

Swift County's own GIS page states, verbatim (fetched directly): *"Our aerial images have been flown every
three years since 2015. Eagle View is who we contract with for this."* This is direct, first-party confirmation
of a county-vendor EagleView contract, consistent with `src/config/restrictedImagery.ts`'s existing flag that
"no third-party embedding license is published." Correctly not embedded in MnMapping today.

## Business model notes

- Imagery: **RED** if ever added — confirmed vendor contract, no reuse license published.
- Disclaimer on file (Swift's GIS page): *"All of the Swift County GIS data and maps are always in maintenance
  mode... They are for reference purposes only and cannot be considered legally binding in any way."*

## Open questions for Swift County / EagleView

1. What are the specific terms of Swift County's contract with EagleView, and would the county or vendor
   consider licensing the imagery for a public third-party web map?
2. Does Swift County publish a GIS-specific fee schedule for parcel/imagery data requests?

## Evidence

- `swiftcounty.gov/gis` — quoted verbatim above.
- `src/config/restrictedImagery.ts` Swift entry — independently corroborates the EagleView contract.
