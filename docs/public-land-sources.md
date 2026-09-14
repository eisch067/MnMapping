# Public-land sources

MnMapping queries authoritative Minnesota DNR FeatureServer layers only for the current viewport. The statewide group includes wildlife management areas, scientific and natural areas, park/recreation units, aquatic management acquisitions, and state-forest management units.

The UI states what each polygon means. A unit or management boundary is not represented as proof that every enclosed acre is publicly owned. AMA interests and access may vary, and users should verify current rules before entering. Feature popups retain the agency, acreage/name fields supplied by the source, and the service-metadata link.

County supplements are registered in the same county definitions as imagery and parcels. A shared adapter queries MnGeo's official Government Ownership layer for parcels classified as `County Fee` or `Tax Forfeit`, filtered by county and the current viewport. The source currently contains one or both classifications in 56 counties. These polygons describe ownership classification only; they do not establish recreational access, so the UI labels them `access varies` and directs users to verify current county rules. Todd County's official public viewer also supplies a city-parks supplement.

The government-ownership source currently returns no county-fee or tax-forfeit records for 31 counties: Beltrami, Blue Earth, Brown, Cottonwood, Dodge, Faribault, Freeborn, Goodhue, Hubbard, Kanabec, Kandiyohi, Kittson, Le Sueur, Lincoln, Mahnomen, Martin, Meeker, Morrison, Nicollet, Nobles, Pine, Redwood, Rice, Rock, Roseau, Sibley, Stearns, Swift, Todd, Wadena, and Watonwan. These counties retain the statewide DNR layers while authoritative local supplements are investigated. Empty or viewer-only sources are not presented as coverage.

The ownership service metadata, distinct ownership classes, grouped county coverage, and a GeoJSON geometry response were verified on 2026-09-14.
