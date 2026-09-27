# Public-land sources

MnMapping queries authoritative Minnesota DNR FeatureServer layers only for the current viewport. The statewide group includes wildlife management areas, scientific and natural areas, park/recreation units, aquatic management acquisitions, and state-forest management units.

The UI states what each polygon means. A unit or management boundary is not represented as proof that every enclosed acre is publicly owned. AMA interests and access may vary, and users should verify current rules before entering. Identify results retain the agency and the name and acreage fields supplied by the source.

County supplements are registered in the same county definitions as imagery and parcels. A shared adapter queries MnGeo's official Government Ownership layer for parcels classified as `County Fee` or `Tax Forfeit`, filtered by county and the current viewport. The source currently contains one or both classifications in 56 counties. These polygons describe ownership classification only; they do not establish recreational access, so the UI labels them `access varies` and directs users to verify current county rules. Todd County's official public viewer also supplies a city-parks supplement.

The government-ownership source currently returns no county-fee or tax-forfeit records for 31 counties: Beltrami, Blue Earth, Brown, Cottonwood, Dodge, Faribault, Freeborn, Goodhue, Hubbard, Kanabec, Kandiyohi, Kittson, Le Sueur, Lincoln, Mahnomen, Martin, Meeker, Morrison, Nicollet, Nobles, Pine, Redwood, Rice, Rock, Roseau, Sibley, Stearns, Swift, Todd, Wadena, and Watonwan. Beltrami supplements the statewide DNR layers with eight official county-park polygons, and Brown supplements them with 52 official city, county, and state park polygons after excluding two private-city features. The remaining source gaps remain under investigation. Empty or viewer-only sources are not presented as coverage.

The ownership service metadata, distinct ownership classes, grouped county coverage, and a GeoJSON geometry response were verified on 2026-09-14.
