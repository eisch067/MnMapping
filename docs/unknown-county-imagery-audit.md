# Unknown-county imagery audit

Search completed September 18, 2026. This pass covered the 25 counties whose research lead still lacked a confirmed current acquisition year or a verified current county service. A subsequent manual viewer review resolved four of the five counties that had depended only on statewide imagery.

Two independent searches were run for every county:

1. Public ArcGIS Online items, ArcGIS Enterprise REST catalogs, and the web-map definitions behind official county viewers.
2. Indexed official county pages, board packets, minutes, budgets, contracts, fee schedules, and reports for `aerial imagery`, `orthophoto`, `Pictometry`, `EagleView`, and `Nearmap`.

A year is reported only when it appears in a service, web-map layer, or county record. An ArcGIS item's modified date is not treated as an acquisition date. A vendor payment or multi-year agreement is evidence of access, but not evidence that a flight occurred that year.

## Results

| County | ArcGIS / viewer result | Official-record result | Decision |
| --- | --- | --- | --- |
| Freeborn | [2020 Hollandale tiles](https://tiles.arcgis.com/tiles/ZkOsbg84o8DsPPaP/arcgis/rest/services/Hollandale_Aerial_Freeborn_County_2020/MapServer) cover only the Hollandale area, not the county. | The county's [2020 fee schedule](https://www.co.freeborn.mn.us/DocumentCenter/View/7025/2020-Fee-Schedule) offers aerial photos in a paid GIS data bundle but gives no acquisition year. | Still unknown countywide; do not display the partial cache as county imagery. |
| Isanti | The official viewer's public web-map definition uses `NearmapMostCurrent`. A separate [2020 Isanti cache](https://tiles.arcgis.com/tiles/ZkOsbg84o8DsPPaP/arcgis/rest/services/2020_Isanti_Aerial/MapServer) is partial coverage. | Official [October 15, 2024 minutes](https://www.co.isanti.mn.us/AgendaCenter/ViewFile/Minutes/_10152024-783) record a Nearmap payment but do not identify a capture date. | Current imagery exists, but its date varies by place; retain the viewer link rather than publish a fixed year. |
| Kanabec | No county-specific imagery service or dated public web-map layer was found. | No indexed official record established an acquisition year. | Still unknown. |
| Kittson | Manual review of the official [Beacon viewer](https://beacon.schneidercorp.com/Application.aspx?AppID=1044&LayerID=23156&PageTypeID=1&PageID=9718) found 2024, 2019, 2015, and 2013 imagery choices. No reusable imagery endpoint was exposed. | The viewer establishes the available years; no separate indexed acquisition record was needed. | **Confirmed 2024 and 2019; linked as external viewer imagery.** |
| Lac qui Parle | The official open-data catalog exposed no dated county imagery service. | The [2026 fee schedule](https://www.lqpco.com/DocumentCenter/View/758/2026-Fee-Schedule) confirms a paid Pictometry Online subscription, not a flight year. | Vendor confirmed; year still unknown. |
| Lake of the Woods | No dated county imagery service was found in the public ArcGIS catalog. | [February 13, 2018 minutes](https://lotwcounty.gov/february-13th-2018/) approve two Pictometry flights over six years; later payments do not identify the actual flight years. | Acquisition program confirmed; current year still unknown. |
| Lincoln | The [official viewer web map](https://lcmn.maps.arcgis.com/apps/webappviewer/index.html?id=bd3d7b6cc3814818ab38a32c4b8c7105) uses Esri World Imagery and has no dated county imagery layer. | No indexed official record established an acquisition year. | No separate county imagery found. |
| Marshall | The official catalog exposes anonymous public MapServers for [2024 EagleView](https://gis.co.marshall.mn.us/server/rest/services/Marshall/Marshall_2024_Eagleview_Imagery/MapServer) and [2020 aerial imagery](https://gis.co.marshall.mn.us/server/rest/services/Marshall/2020_Aerial/MapServer). The 2024 service returned a real JPEG tile. | The service names and official web maps identify the acquisition years. | **Integrated as 2024 and 2020 imagery.** |
| Martin | No Minnesota county-specific imagery service or dated public web-map layer was found; search results for Martin County were predominantly Florida or generic NAIP items. | No indexed official record established a recent county acquisition year. | Still unknown. |
| McLeod | The public [2026 McLeod County MapServer](https://tiles.arcgis.com/tiles/7sSDkfIZpd2ReAg5/arcgis/rest/services/2026_McLeod_County/MapServer) is countywide, anonymous, Web Mercator, and returned a real JPEG tile. | No separate record was needed to infer the year; it is explicit in the service and item description. | **Integrated as 2026 imagery.** |
| Meeker | No service newer than the currently cataloged older county imagery was found. | The [2022 adopted budget](https://www.co.meeker.mn.us/DocumentCenter/View/5647/2022-Adopted-Budget--Levy) confirms that county GIS funds Pictometry flights, but gives no acquisition year. | Vendor confirmed; newer year still unknown. |
| Murray | No Minnesota county-specific newer imagery service or dated public web-map layer was found. | No indexed official record established a newer acquisition year. | Keep the existing 2011 layer; newer year unknown. |
| Norman | Manual review of the official [Link viewer](https://gis.co.norman.mn.us/link/jsfe/index.aspx) found 2025 and 2022 EagleView choices. The county's public ArcGIS group contains applications but no reusable imagery service. | The viewer establishes the available years; no separate indexed acquisition record was found. | **Confirmed 2025 and 2022; linked as external viewer imagery.** |
| Pine | No Minnesota county-specific imagery service or dated public web-map layer was found. | No indexed official record established an acquisition year. | Still unknown. |
| Red Lake | The official [GIS viewer](https://gismap.redlakecounty.gov/link/wab/) and [ArcGIS group](https://redlakecountymn.maps.arcgis.com/home/group.html?id=0e1ad03a8ccf429486aa944f5e5e50c4) expose county applications but no relevant dated local imagery basemap. | No indexed official record established an acquisition year. | **Statewide imagery remains the best verified option.** |
| Rice | No county service newer than the already implemented 2023 six-inch imagery was found. | No official record established a newer acquisition. | Existing 2023 layer remains current best verified. |
| Rock | No Minnesota county-specific imagery service or dated public web-map layer was found; ArcGIS results were for Rock County, Wisconsin. | No indexed official record established an acquisition year. | Still unknown. |
| Roseau | The county REST catalog exposed no imagery-named service. State-hosted 2022–2023 regional orthophotography is not a separate county acquisition. | No indexed official record established a newer county acquisition year. | Keep verified regional imagery; county-specific year unknown. |
| Stevens | The official catalog exposes 2026 and 2023 Pictometry WMTS web maps plus an anonymous [2020 Pictometry MapServer](https://gis.co.stevens.mn.us/arcgis/rest/services/2020Pictometry/MapServer). The 2020 service returned a real JPEG tile. | The official items and tax-parcel viewer identify all three acquisition years. | **Integrated 2020; linked 2026 and 2023 externally because they use licensed WMTS delivery.** |
| Todd | The official viewer's public [2023 web map](https://www.arcgis.com/home/item.html?id=78e30997de2f4ade806aec6c0b0e47fa) references countywide `PICT-MNTODD23` Pictometry WMTS imagery. | The year is explicit in the county-viewer layer; no open third-party embedding grant was found. | **Confirmed 2023; listed as external licensed imagery.** Existing public 2020 MapServer remains integrated. |
| Wadena | The county catalog exposes [2025 EagleView imagery](https://gis.co.wadena.mn.us/arcgis/rest/services/Pictometry/2025Eagleview/MapServer), plus 2024, 2021, 2018, 2015, and 2012 history. The 2025 service returned both native tiles and a reprojected JPEG export. | The service itself explicitly identifies the acquisition year. | **Integrated as 2025 imagery.** |
| Waseca | Public ArcGIS search found only older undated story-map items; Beacon advertises high-resolution photography without a capture year. | No indexed official record established an acquisition year. | Still unknown. |
| Watonwan | The public [EagleView county web map](https://www.arcgis.com/home/item.html?id=f049a777febe406a9f0dc4bf3f5254bd) references countywide `PICT-MNWATO22` WMTS imagery. A separate 2022 ArcGIS tile cache is only partial local coverage. | The year is explicit in the county web-map layer; no open third-party embedding grant was found. | **Confirmed 2022; listed as external licensed imagery.** |
| Wilkin | The official catalog exposes [2026 EagleView](https://gisweb.co.wilkin.mn.us/arcgis/rest/services/EagleView_2026/MapServer), 2023, 2020, and 2017 services. The 2026 service is countywide and returned a real JPEG tile and export. | The service and official ArcGIS item explicitly identify 2026 capture. | **Integrated as 2026 imagery.** |
| Winona | No public dated county imagery service was found. | The county's [2018 capital plan](https://www.winonacounty.gov/DocumentCenter/View/2247/Working-Session-August-2018-PDF) says Pictometry is flown every three years, while the [2022 budget](https://www.winonacounty.gov/DocumentCenter/View/2236/2022-Budget---September-14-2021-Working-Session-PDF) budgets imagery fees through 2025; neither establishes the latest flight year. | Acquisition cycle confirmed; current year still unknown. |

## Outcome

- Directly displayable and added: Marshall 2024 and 2020, McLeod 2026, Stevens 2020, Wadena 2025, and Wilkin 2026.
- Newly dated but kept external: Kittson 2024/2019, Norman 2025/2022, Stevens 2026/2023, Todd 2023, and Watonwan 2022. The source is either a viewer without a reusable endpoint or a commercial EagleView/Pictometry WMTS layer with no published third-party reuse grant.
- Confirmed current-but-variable: Isanti Nearmap. A single countywide acquisition year cannot be assigned from the public viewer.
- Partial local caches only: Freeborn 2020 Hollandale, Isanti 2020, and Watonwan 2022 local coverage. They are not represented as countywide layers.
- Remaining unresolved after both searches: Freeborn, Kanabec, Lac qui Parle, Lake of the Woods, Martin, Meeker, Murray, Pine, Rock, Roseau, Waseca, and Winona. Red Lake was resolved as having no relevant local imagery in its current public applications; Lincoln likewise has no separate county imagery in its current public web map. Rice has no verified layer newer than 2023.

The unresolved group is now at the point where direct county GIS contact or a public-data request is the appropriate next step; repeating Beacon inspection or generic web searches is unlikely to establish the missing flight year or reuse permission.

## Recency-focused follow-up queue

For the research GUI, the stricter usability target is a verified non-statewide-NAIP source from approximately 2018 or newer. Under that definition, 69 counties meet the target and 18 need follow-up:

- **Statewide only (1):** Red Lake.
- **Older or recency unverified (17):** Cottonwood, Freeborn, Grant, Isanti, Kanabec, Lac qui Parle, Lake of the Woods, Lincoln, Martin, Meeker, Murray, Pine, Redwood, Rock, Roseau, Waseca, and Winona.

Beacon, Pictometry, Nearmap, or other official viewers in the second group are treated as strong leads that may contain newer usable imagery. They are not treated as proof of an acquisition year until the layer metadata or county confirms it.
