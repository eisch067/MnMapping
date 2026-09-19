# Imagery source inventory

Verified against live service metadata through September 18, 2026.

## Public county ArcGIS REST imagery

MnMapping now streams additional public ArcGIS MapServer and ImageServer layers from 33 counties, including newly verified Marshall 2024/2020 and Stevens 2020 imagery alongside 2026 McLeod, 2025 Wadena, and 2026 Wilkin. Anoka contributes five vintages and Dakota contributes separate spring and fall 2025 acquisitions. The complete follow-up search of previously unknown counties is recorded in [`unknown-county-imagery-audit.md`](unknown-county-imagery-audit.md).

Each endpoint was checked for anonymous metadata access and a real tile, dynamic map export, or image export response. Web Mercator caches use native ArcGIS tiles. Services cached in a county coordinate system, and uncached MapServers, use ArcGIS dynamic export so Cesium receives Web Mercator imagery. ImageServers use `exportImage`. Requests pass through fixed, read-only proxy roots; the browser cannot supply an arbitrary upstream host.

These services remain hosted by their counties or ArcGIS Online. MnMapping does not copy the imagery, and the source link and county attribution remain attached to every layer. Public availability does not transfer ownership of commercial EagleView, Pictometry, Nearmap, or other third-party imagery.

Some known sources remain external. WMTS-only sources require a separate capabilities-driven integration, Sibley's service is not anonymously tile-accessible, and Wright County's tile-only caches use a local projection that Cesium's ArcGIS provider does not support. Download-only imagery is also not treated as a streamable map layer.

## Statewide

MnGeo's Composite Image Service is the `Best Available` layer. Its selection changes by location and scale using imagery quality, resolution, recency, coverage, and season. Separate natural-color and color-infrared NAIP layers are configured for 2025 (0.6 meter), 2023 (0.3 meter), 2021 (0.6 meter), and 2019 (0.6 meter). Historical 1991 USGS DOQ imagery is also available. Statewide requests use the fixed MnGeo proxy route.

- Composite: `https://imageserver.gisdata.mn.gov/cgi-bin/mncomp?`, layer `mncomp`
- NAIP and county WMS: `https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?`

The composite service advertises only EPSG:26915 but was verified to return Web Mercator JPEG requests using WMS 1.1.1, which is required by Cesium's standard imagery tiling.

## Hubbard County

Official cached services from Hubbard County GIS are configured for 2026 (spring, 6 inches), 2023 (spring, mixed 6/9 inches), 2020 (summer, 3 inches), 2017 (spring, 9 inches), 2013–2014 SAIP (resolution/season not published), and 2011 (spring, 9 inches).

The county catalog also publishes older CIR, partial fall, NAIP, hillshade, and 2025 storm-response services. Those are intentionally excluded from the normal high-resolution natural-color catalog because they are duplicate statewide products, non-natural-color/special-purpose layers, or partial operational imagery.

## Aitkin County

MnGeo's active `fall11` and `fallcir11` WMS layers provide 2011 fall natural-color and color-infrared imagery at 0.5-meter resolution. Both are exposed as separate Aitkin choices and clipped to the county adapter bounds. The WMS capabilities, layer names, resolution, and published coverage were verified on 2026-09-14.

## North-region expansion

The remaining v1.0 North counties use a shared catalog of active MnGeo WMS layers. It includes verified Metro, county, fall, North 1-foot, northern-border, Arrowhead, and north-central acquisitions from 2009 through 2025. Each county references only relevant presets, while each preset retains the service's published coverage rectangle. The complete selection and deferred unverified county imagery are recorded in [`north-region-status.md`](north-region-status.md).

## South-region expansion

All 44 South-zone counties are registered. The catalog uses the verified 2011 spring Southern Minnesota layer only within its published footprint, labels separate spring/fall collections, and adds verified high-resolution county and Metro acquisitions where available. See [`south-region-status.md`](south-region-status.md) for batch and deferral details.

## Beltrami County

MnGeo-hosted natural-color layers are configured for 2023 (9 inches), 2020 (9 inches), and the joint 2014 Polk/Beltrami acquisition (1 foot). Published WMS coverage bounds are stored on each layer.

## Carlton County

Carlton County's 2024 EagleView mosaic is displayed from the WMS link that the county explicitly publishes for GIS software. The live capabilities document reports no fees or access constraints, identifies the countywide layer and April 10–May 3 capture dates, and supplies the exact coverage bounds. The imagery remains on the source server; MnMapping does not copy or redistribute it.

## Becker County

Official Becker County cached services are configured for 2024 and 2021. Their service records do not publish acquisition season or source resolution, so those values remain explicitly unknown. County services named 2013 and 2015 identify themselves as NAIP and are excluded because the statewide catalog already provides NAIP vintages.

## Todd County

Official Todd County/Pictometry services are configured for the 2020 county flight (resolution/season not published), 2018 city refly (spring, 4 inches), 2017 county flight (spring, 9 inches), 2013 city flight (spring, 6 inches), 2013 county flight (spring, 9 inches), and 2008 county flight (12 inches). The 2017 city flight is excluded because the county metadata says it was too green and was superseded by the 2018 refly.

Todd's caches use a county coordinate system unsupported by Cesium's tiled ArcGIS provider, so those layers deliberately use the services' dynamic export operation.

## Douglas County

MnGeo-hosted natural-color layers are configured for 2022 (2 inches) and 2016 (3 inches), with their published WMS coverage bounds. Douglas County's 2026 EagleView imagery is linked as an external option because the public metadata does not establish open reuse terms for its licensed imagery.

## D–H county research and external imagery

Dakota County publishes official 2025 spring leaf-off and fall leaf-on six-inch ImageServers. Item-level metadata identifies both as Nearmap imagery. The fall item states that Nearmap retains copyright and restricts resale or distribution for direct commercial benefit, while the spring item's license field is blank. Both are therefore linked as external options rather than embedded; Dakota's existing public 2025 Metro and 2023 county layers remain available in MnMapping.

Verified newer or sharper external options are listed for Dakota (2025 Nearmap spring and fall), Dodge (2026 county mosaic), Douglas (2026 EagleView), Faribault (2025 orthophotos, six-inch county and three-inch cities), Fillmore (2022 EagleView, three inches), Goodhue (2025 EagleView), and Houston (2023 Pictometry, six inches). Their official services or records establish the imagery date and, where published, resolution. They do not establish a third-party embedding grant. Faribault distributes its 2025 SID mosaic by paid data request rather than a reusable map service.

Freeborn now links to its manually confirmed 2020 countywide Beacon imagery; the public Hollandale tile cache remains excluded because it covers only part of the county. Grant now streams its official public 2024 EagleView, 2021 Pictometry, and 2017 Pictometry MapServers. Hennepin retains the 2025 Metro and 2022 county imagery already configured, and Hubbard retains its official 2026 county service. A generic aerial-photo sale or basemap without dated metadata is not treated as a verified imagery source.

## I–L county research and external imagery

Verified external options are listed for Itasca (2023 Pictometry), Jackson (2021 Pictometry), Kandiyohi (Spring 2024 leaf-off Pictometry), and Le Sueur (2025 EagleView imagery shown through Beacon). The linked county portals, records, or reports establish the acquisition year, but the commercial imagery sources do not publish a third-party embedding grant.

Lake County's official data page confirms its already integrated 2024 and 2019 leaf-off WMS imagery, including six-inch county coverage and three-inch shoreline coverage, and identifies the published data as public data under Minnesota law. Koochiching retains its integrated 2020 MnGeo imagery and Lyon retains its integrated 2024 three-to-six-inch MnGeo imagery.

Isanti links to manually confirmed spring and fall imagery history through 2025, while Kanabec links to 2024/2021/2018, Kittson to 2024/2019, and Lake of the Woods to 2024/2021/2018. These remain external because the official viewers expose no reusable county-controlled endpoint or use credentialed commercial delivery. A final official-account audit found public WMTS layers for Lac qui Parle (2024/2020/2017) and Lincoln (2026/2023/2020/2017); all seven mosaics are integrated after capabilities and anonymous tile verification. The incorrect Lac qui Parle Beacon URL belongs to Kanabec and was not used.

## M–R county research and external imagery

Olmsted County's official 2023 ImageServer is integrated as two-inch imagery. The county describes its GIS data as open source, and anonymous JPEG image export was verified before integration. Ramsey County's official Spring 2022 ImageServer is integrated as three-inch imagery because its aerial-download application explicitly permits public download and use without fee or licensure. Both are accessed through fixed, read-only county proxy roots.

Verified external options are listed for Mahnomen (2020), Mille Lacs (2026), Morrison (2020), Mower (2023), Nicollet (2020), Nobles (2024), Otter Tail (2024), Pennington (2023), Pipestone (2020), Pope (2023), Redwood (2016), and Renville (Spring 2024). The linked official records establish the imagery year and, where published, resolution. They remain external because they are commercial EagleView/Pictometry products, require a paid request or signed agreement, contain an express use limitation, or publish no imagery-specific third-party reuse grant.

Polk County's 2025 EagleView mosaic is integrated directly from its public WMTS service. The capabilities document reports no fees or access constraints, identifies the `GoogleMapsCompatible` tile matrix, and anonymous county tiles return PNG imagery with permissive browser access. The layer is bounded to the coverage published by Polk County's official ArcGIS web map.

Marshall includes verified public 2024 EagleView and 2020 county MapServers. Meeker now streams its public 2024 and 2018 EagleView WMTS layers and links its 2021 Beacon choice externally. Martin links 2026/2023/2020/2019, Murray links 2024/2022/2019, Norman links 2025/2022, Pine links 2023/2018, Redwood links 2026/2023/2020, and Rock links 2025/2022/2019 from their official viewers. McLeod retains its public 2026 county tile service, and Rice County's existing 2023 six-inch layer remains its newest verified source. Roseau's viewer exposes FSA/NAIP imagery rather than a separate recent county acquisition. Red Lake's current public applications expose no relevant local imagery basemap, so statewide imagery remains its best verified source.

## S–Z county research and external imagery

Verified external options are listed for Scott (Spring 2026, approximately three inches), Sherburne (2024), Sibley (2023), St. Louis (2023 Pictometry), Stearns (Spring 2024), Steele (2025), Swift (2024 EagleView), Traverse (2022 Pictometry), Washington (2026), Wright (2025), and Yellow Medicine (2025 EagleView). Official services, applications, or county records establish these dates, but their imagery-specific metadata does not grant third-party embedding rights. Commercial Pictometry/EagleView acquisitions remain external unless the county publishes an applicable reuse grant.

Wabasha's integrated 2025 two-inch layer remains its best verified public county source. Wadena 2025 and Wilkin 2026 are integrated from their official public MapServers. Stevens includes its public 2020 Pictometry MapServer; its 2026 and 2023 commercial WMTS mosaics are linked externally. Todd's viewer confirms 2023 Pictometry and Watonwan's web map confirms 2022 EagleView imagery. Waseca now links 2025/2021 and Winona links 2026/2022/2020 from their official Beacon viewers. All 22 counties covered by the two manual research exports are seeded as **Complete**; coverage tier remains separate so Cottonwood, Roseau, and statewide-only Red Lake still appear in the follow-up queue.

## Brown County

Brown County's official portal catalogs public EagleView WMTS items for 2023 and 2026. The live service identifies the newer mosaic as captured March 30-31, 2026, and anonymous tile requests work. Brown County's 2022 order form nevertheless describes Connect Image Service as solely for internal use within the customer's organization, with an active-account requirement and monthly request limits; neither portal item grants third-party reuse rights. Both items are linked from the start-page county summary but are not embedded. Brown continues to use verified MnGeo imagery until written reuse authority is established.

## A–C county research and external imagery

The September 17 source export produced confirmed newer or sharper imagery leads for Aitkin, Anoka, Benton, Big Stone, Blue Earth, Carver, Cass, Chippewa, Chisago, Clay, Clearwater, Cook, and Crow Wing. These appear in the county explorer's Other Imagery table with their verified year, detail when published, direct official link, and the specific reason they are not embedded. Typical reasons are EagleView/Pictometry copyright with no third-party grant, blank ArcGIS license fields, partial coverage, or a download-only delivery format.

Useful county acquisition history is retained rather than collapsing every county to one newest source. The working cutoff is approximately 2018: each verified, materially distinct county acquisition from that period forward should be listed when an official viewer or service remains available. For Anoka County, the official catalog currently identifies 6-inch spring 2026, fall 2025, spring 2024, and approximately 6-inch 2020 and 2017 aerials. The adjacent 2017 acquisition is included at the cutoff boundary. Each is linked separately in the county explorer. Their services publish no copyright statement or reuse license, so they remain external options rather than embedded layers.

Beacon participation is treated only as evidence that a county uses Schneider Geospatial's property-viewer platform. It does not establish the imagery year, ownership, resolution, or a right to embed the imagery. Schneider's published terms prohibit automated extraction and reserve rights in website content, including third-party licensed material. For that reason MnMapping links verified imagery records rather than proxying or scraping Beacon. Supplied Beacon links without imagery-specific dated metadata remain research leads until the acquisition can be confirmed independently.

## Browser access

MnGeo returns permissive CORS headers and is accessed directly. County services without suitable browser CORS headers use a read-only, allowlisted proxy over fixed government service roots; it cannot proxy arbitrary hosts or accept write methods.
