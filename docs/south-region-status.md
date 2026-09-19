# South region implementation status

Verified 2026-09-14 against the official MnGeo imagery capabilities, Open Parcels metadata, and Open Parcels polygon services.

All 44 counties assigned to the v1.0 South zone are recognized through the shared county registry. Together with the North registry, MnMapping recognizes all 87 Minnesota counties. Statewide imagery, terrain, hillshade, public lands, coordinates, and local user data remain available when a county parcel source is pending.

## Batch status

| Batch | Counties | Result |
| --- | --- | --- |
| S1 | Dakota, Lyon, McLeod, Rice, Steele, Carver, Scott, Wabasha | Complete. Standout county and Metro imagery uses verified MnGeo layers; parcels use bounded statewide queries. |
| S2 | Big Stone, Brown, Chippewa, Lac qui Parle, Meeker, Mower, Pipestone, Pope, Renville, Stevens, Traverse, Waseca, Yellow Medicine | Complete. Brown and Meeker use official county FeatureServers; Brown also supplies 52 non-private local park polygons. |
| S3 | Dodge, Goodhue, Lincoln, Olmsted, Sibley, Kandiyohi, Rock | Complete. Dodge and Goodhue use resolved official county services, Olmsted uses MnGeo, and four counties remain pending. |
| S4 | Fillmore, Houston, Winona, Le Sueur, Murray | Complete. Spring and fall 2011 imagery are labeled separately; Le Sueur parcels remain pending. |
| S5 | Blue Earth, Cottonwood, Faribault, Freeborn, Jackson, Martin, Nicollet, Nobles, Redwood, Swift, Watonwan | Complete with Jackson parcels available and the other ten pending. |

## Deferred parcel integrations

These 15 counties are recognized but expose no parcel toggle:

- Blue Earth
- Cottonwood
- Faribault
- Freeborn
- Kandiyohi
- Le Sueur
- Lincoln
- Martin
- Nicollet
- Nobles
- Redwood
- Rock
- Sibley
- Swift
- Watonwan

The official statewide metadata lists each county, but layer 1 of MnGeo Open Parcels returned no records for its FIPS code at verification time. County sources that only exposed interactive viewers, downloads, expiring URLs, or unresolved applications were not forced into the browser architecture. These adapters remain explicitly `pending` for later source work.

## Parcel implementation

Twenty-five South counties use the same normalized MnGeo Open Parcels adapter as the North expansion. Brown, Meeker, Dodge, and Goodhue use resolved official county services with verified anonymous GeoJSON queries. Brown publishes 18,481 polygons and parcel identifiers but explicitly omits owner information. Every request includes the current viewport envelope, and parcel layers remain off until requested below the 35 km camera threshold.

## Imagery implementation

The September 18–19 service audits added anonymous county imagery services for Big Stone, Blue Earth, Carver, Chippewa, Dakota, Dodge, Goodhue, Lac qui Parle, Lincoln, Meeker, Mower, Pipestone, Scott, Steele, Stevens, and Yellow Medicine. Cached Web Mercator and `GoogleMapsCompatible` WMTS services use tiles; county-coordinate-system and uncached services use dynamic export, while Dakota's raster services use ImageServer export. Lac qui Parle's public 2024/2020/2017 and Lincoln's public 2026/2023/2020/2017 EagleView WMTS layers are integrated after anonymous tile and CORS verification. Meeker's public 2024 and 2018 EagleView WMTS layers are integrated, with its 2021 Beacon choice linked externally. Stevens' public 2020 Pictometry MapServer is integrated; its official 2026 and 2023 commercial WMTS mosaics remain external.

The South catalog includes the verified `south11` and `south11ir` spring collection only in counties where its published footprint applies. Southeast counties can separately select the 2011 fall collection. Verified higher-resolution choices include 2026 McLeod, 2025 Wabasha and Metro, 2024 Lyon, 2023 Dakota and Rice, 2022 McLeod and Steele, 2021 Dakota, Rice, and Le Sueur, plus relevant older county acquisitions.

Every imagery adapter retains the exact WMS-published rectangle. Brown County's public portal catalogs 2026 and 2023 EagleView mosaics, but its Connect Image Service contract is limited to internal organizational use and neither item grants third-party reuse rights. As with Douglas County's licensed EagleView imagery, the mosaics are linked as external alternatives rather than routed through MnMapping.
