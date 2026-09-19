export interface ImageryResearchLead {
  county: string;
  name: string;
  url: string;
  notes: string;
}

export const imageryResearchLeads: readonly ImageryResearchLead[] = [
  lead("Cottonwood", "Cottonwood County ArcGIS catalog", "https://www.arcgis.com/home/search.html?restrict=false&sortField=relevance&sortOrder=desc&searchTerm=owner%3A%22CottonwoodCounty%22&mode=keyword#content", "Manual review found no dated countywide acquisition newer than the currently cataloged imagery."),
  lead("Cottonwood", "Cottonwood County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=132&LayerID=1693&PageTypeID=1&PageID=855", "County and local-government records confirm that Cottonwood uses this Beacon parcel map with aerial imagery, but indexed evidence and the public county ArcGIS account do not identify the imagery acquisition year."),
  lead("Freeborn", "Freeborn County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=333&LayerID=3791&PageTypeID=1&PageID=2405", "Manual review confirmed 2020, 2017, and 2014 imagery choices; 2020 is linked externally because no reusable countywide endpoint was found."),
  lead("Freeborn", "Freeborn County GIS data fee schedule", "https://www.co.freeborn.mn.us/DocumentCenter/View/7025/2020-Fee-Schedule", "The county offers aerial photos in a paid GIS data bundle, but the record does not identify an acquisition year."),
  lead("Grant", "Grant County public GIS viewer", "https://gis.co.grant.mn.us/Link/jsfe/index.aspx", "Manual review confirmed 2024 EagleView plus 2021, 2017, and 2013 Pictometry imagery. The public 2024, 2021, and 2017 MapServers are implemented."),
  lead("Isanti", "Isanti County GIS viewer", "https://experience.arcgis.com/experience/afa4f0f2b20e4a11814c824a9a85f6c5", "Manual review confirmed spring imagery for 2025, 2023, 2020, and 2017 plus fall imagery for 2025, 2023, 2022, and 2021. The current basemap uses Nearmap and remains external."),
  lead("Kanabec", "Kanabec County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=453&LayerID=6582&PageTypeID=1&PageID=4283", "Manual review confirmed 2024, 2021, 2018, and 2015 imagery choices; recent vintages are linked externally."),
  lead("Kittson", "Kittson County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=1044&LayerID=23156&PageTypeID=1&PageID=9718", "Manual review confirmed 2024, 2019, 2015, and 2013 imagery choices; no reusable public imagery service was found."),
  lead("Lac qui Parle", "Lac qui Parle County open-data hub", "https://opendata-lqpgis.hub.arcgis.com/", "The official county account publishes 2024, 2020, and 2017 EagleView WMTS layers. Their public capabilities and anonymous tile delivery were verified and all three are implemented."),
  lead("Lac qui Parle", "Lac qui Parle County 2024 EagleView item", "https://www.arcgis.com/home/item.html?id=fcfb1132c6684c7fb92cb854cfb1c4d3", "Official county-owned public WMTS item for the implemented 2024 EagleView mosaic."),
  lead("Lake of the Woods", "Lake of the Woods County Beacon", "https://beacon.schneidercorp.com/Application.aspx?App=LakeoftheWoodsCountyMN&PageType=Map", "Manual review confirmed 2024, 2021, and 2018 imagery choices; no reusable public endpoint was found."),
  lead("Lake of the Woods", "Lake of the Woods Pictometry agreement record", "https://lotwcounty.gov/february-13th-2018/", "The county approved two Pictometry flights over six years in 2018, but the record does not identify the completed flight years."),
  lead("Lincoln", "Lincoln County GIS viewer", "https://lcmn.maps.arcgis.com/apps/webappviewer/index.html?id=bd3d7b6cc3814818ab38a32c4b8c7105", "The older viewer still uses Esri World Imagery, but the same official county account publishes a public EagleView WMTS containing 2026, 2023, 2020, and 2017 mosaics; all four are implemented."),
  lead("Lincoln", "Lincoln County EagleView WMTS item", "https://www.arcgis.com/home/item.html?id=6574d97262dd46b392dee4afb6fecfed", "Official county-owned public WMTS item. Its live capabilities include four dated mosaics through 2026 with no fees or access constraints."),
  lead("Marshall", "Marshall County public GIS viewer", "https://gis.co.marshall.mn.us/link/jsfe/index.aspx", "Official viewer confirms 2024 EagleView and 2020 county imagery; both public MapServers are implemented in MnMapping."),
  lead("Martin", "Martin County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=139&LayerID=1771&PageTypeID=1&PageID=1679", "Manual review confirmed 2026, 2023, 2020, 2019, 2016, 2013, and 2009 imagery choices; recent vintages are linked externally."),
  lead("McLeod", "McLeod County GIS viewer", "https://gis.mcleodcountymn.gov/", "Official viewer retained for visual review of the implemented public 2026 county imagery."),
  lead("Meeker", "Meeker County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=585&LayerID=8946&PageTypeID=1", "Manual review confirmed 2024, 2021, 2018, and 2007 imagery. The public 2024 and 2018 WMTS layers are implemented; 2021 remains linked externally."),
  lead("Meeker", "Meeker County Pictometry budget record", "https://www.co.meeker.mn.us/DocumentCenter/View/5647/2022-Adopted-Budget--Levy", "The adopted budget confirms county funding for Pictometry flights but does not identify an acquisition year."),
  lead("Mille Lacs", "Mille Lacs County public GIS viewer", "https://gis.co.mille-lacs.mn.us/link/jsfe/index.aspx", "Official county viewer retained for visual review of the confirmed 2026 flyover and its available layers."),
  lead("Morrison", "Morrison County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=104", "Official property viewer retained for visual review; its landing page does not state an imagery year."),
  lead("Mower", "Mower County online mapping", "https://www.co.mower.mn.us/482/GIS---Online-Mapping", "Official mapping page retained for visual review of county imagery layers."),
  lead("Murray", "Murray County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=1153&LayerID=30832&PageTypeID=1&PageID=12498", "Manual review confirmed 2024, 2022, and 2019 imagery choices; they remain external because no reusable public endpoint was found."),
  lead("Nobles", "Nobles County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=479&LayerID=6865&PageTypeID=1&PageID=3669", "Official property viewer retained for visual review of the confirmed EagleView acquisition cycle."),
  lead("Norman", "Norman County public GIS viewer", "https://gis.co.norman.mn.us/link/jsfe/index.aspx", "Manual review confirmed 2025 and 2022 EagleView imagery; no reusable public imagery endpoint was found."),
  lead("Olmsted", "Olmsted County GIS map", "https://gweb01.co.olmsted.mn.us/WebApps/OlmstedCountyGISMap/", "Official viewer retained for visual review of the implemented 2023 imagery and other available layers."),
  lead("Pennington", "Pennington County public GIS viewer", "https://gismap.co.pennington.mn.us/link/jsfe/index.aspx", "Official county viewer retained for visual review of the confirmed 2023 imagery."),
  lead("Pine", "Pine County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=197", "Manual review confirmed 2023, 2018, and 2011 imagery choices; recent vintages are linked externally."),
  lead("Pope", "Pope County public GIS viewer", "https://gis.popecountymn.gov/link/jsfe/index.aspx?defaultRole=Public", "Official county viewer retained for visual review of the confirmed 2023 imagery."),
  lead("Ramsey", "MapRamsey", "https://maps.co.ramsey.mn.us/MapRamsey/", "Official viewer retained for visual review of the implemented 2022 imagery and newer public layers."),
  lead("Red Lake", "Red Lake County GIS hub", "https://www.arcgis.com/home/item.html?id=99beedd681964704b664b41ccc711da0", "The official hub and county applications expose no relevant local imagery basemap; current statewide imagery remains the best verified option."),
  lead("Redwood", "Redwood County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=800&LayerID=12803&PageTypeID=1&PageID=5979", "Manual review confirmed 2026, 2023, 2020, and 2013 imagery choices; recent vintages are linked externally."),
  lead("Rice", "Rice County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=74&LayerID=590&PageTypeID=1&PageID=956", "Official property viewer retained for checking whether imagery newer than the implemented 2023 layer is available."),
  lead("Rock", "Rock County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=1275&LayerID=43613&PageTypeID=1&PageID=15912", "Manual review confirmed 2025, 2022, 2019, 2016, and 2013 imagery choices; recent vintages are linked externally."),
  lead("Roseau", "Roseau County public GIS viewer", "https://gis.co.roseau.mn.us/portal/apps/webappviewer/index.html?id=30edc8d9ad244176a9c48643e1ee4276", "The viewer exposes Esri imagery and multiple FSA/NAIP vintages, but no separate recent county acquisition was confirmed."),
  lead("Scott", "Scott County GIS viewer", "https://gis.co.scott.mn.us/sg3/", "Official county viewer retained for visual review of the confirmed 2026 imagery and its layer list."),
  lead("Sherburne", "Sherburne County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=133&LayerID=1600&PageTypeID=1&PageID=903", "Official property viewer retained for visual review of the county's imagery layers."),
  lead("Sibley", "Sibley County parcel viewer", "https://experience.arcgis.com/experience/ce3e459da37b4a31be399de86feba630", "Official county viewer retained for visual review of the confirmed 2023 imagery and its layer list."),
  lead("St. Louis", "St. Louis County Land Explorer", "https://gis.stlouiscountymn.gov/landexplorer/", "Official county viewer retained for reviewing available orthogonal and bird's-eye imagery dates."),
  lead("Stearns", "Stearns County property viewer", "https://stearns-county-gis-stearns.hub.arcgis.com/apps/fbc70d782fc547f9b8220218eac3c966", "Official county viewer retained for visual review of the confirmed Spring 2024 imagery."),
  lead("Steele", "Steele County tax parcel viewer", "https://steele-county-hub-site-steelecomn.hub.arcgis.com/apps/d3aead984a994bce861ad812a4551e7f/explore", "Official county viewer retained for visual review of the confirmed 2025 imagery."),
  lead("Stevens", "Stevens County tax parcel viewer", "https://experience.arcgis.com/experience/341973449f2645629cf84d159bba50e7", "Official viewer provides 2026, 2023, and 2020 Pictometry imagery; the public 2020 MapServer is implemented and the newer licensed WMTS layers are linked externally."),
  lead("Swift", "Swift County public GIS map", "https://www.gismidwest.com/maps/swiftpublic/", "Officially linked public viewer retained for reviewing the county's EagleView imagery layers."),
  lead("Todd", "Todd County interactive GIS mapping", "https://www.toddcountymn.gov/government/departments/interactive_gis_mapping.php", "Official viewer uses a confirmed 2023 Pictometry WMTS layer; it remains external because no third-party embedding grant was found."),
  lead("Traverse", "Traverse County open-data portal", "https://data-traversecountymn.opendata.arcgis.com/", "Official county portal retained for visual review of the confirmed 2022 Pictometry imagery and other layers."),
  lead("Wabasha", "Wabasha County GIS", "https://www.co.wabasha.mn.us/departments/gis_department/index.php", "Official county GIS page retained for reviewing the already implemented 2025 imagery."),
  lead("Wadena", "Wadena County public GIS viewer", "https://gis.co.wadena.mn.us/link/jsfe/index.aspx", "Official viewer retained for visual review of the implemented public 2025 EagleView service and older county imagery."),
  lead("Waseca", "Waseca County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=1041&LayerID=22741&PageTypeID=1&PageID=0", "Manual review confirmed 2025 and 2021 imagery plus Beacon's oblique-imagery tool; both vintages are linked externally."),
  lead("Washington", "Washington County property viewer", "https://experience.arcgis.com/experience/a0a1cb63cd7846bea9ff6c8e18b9b48c", "Official county viewer retained for visual review of the confirmed 2026 imagery and historical layers."),
  lead("Watonwan", "Watonwan County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=216&LayerID=2931&PageTypeID=1", "Official property viewer; a public web map confirms 2022 EagleView imagery, but it remains external because no third-party embedding grant was found."),
  lead("Wilkin", "Wilkin County public GIS viewer", "https://gisweb.co.wilkin.mn.us/link/jsfe/index.aspx", "Official viewer retained for visual review of the implemented public 2026 EagleView service and 2023, 2020, and 2017 history."),
  lead("Winona", "Winona County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=597&LayerID=9787&PageTypeID=1", "Manual review confirmed 2026, 2022, 2020, and 2016 imagery choices. The county offers a licensed countywide imagery product, so the viewer links remain external."),
  lead("Winona", "Winona County Pictometry acquisition plan", "https://www.winonacounty.gov/DocumentCenter/View/2247/Working-Session-August-2018-PDF", "The county plan says Pictometry is flown every three years, but it does not establish the latest completed flight year."),
  lead("Wright", "Wright County aerial imagery viewer", "https://experience.arcgis.com/experience/0fb2593f7cec4fa9b01e157b02d20102", "Official county viewer retained for visual review of the confirmed 2025 aerial layer and historical imagery."),
  lead("Yellow Medicine", "Yellow Medicine County public GIS viewer", "https://gis.co.ym.mn.gov/Link/jsfe/index.aspx", "Official county viewer retained for visual review of the confirmed 2025 EagleView imagery."),
] as const;

export function imageryResearchLeadsForCounty(countyName: string): readonly ImageryResearchLead[] {
  return imageryResearchLeads.filter((source) => source.county === countyName);
}

function lead(county: string, name: string, url: string, notes: string): ImageryResearchLead {
  return { county, name, url, notes };
}
