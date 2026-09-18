export interface ImageryResearchLead {
  county: string;
  name: string;
  url: string;
  notes: string;
}

export const imageryResearchLeads: readonly ImageryResearchLead[] = [
  lead("Freeborn", "Freeborn County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=333&LayerID=3784", "Official property viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Isanti", "Isanti County GIS viewer", "https://experience.arcgis.com/experience/afa4f0f2b20e4a11814c824a9a85f6c5", "Official viewer using Nearmap most-current imagery; the acquisition date may vary by location and is not stated on the viewer landing page."),
  lead("Kanabec", "Kanabec County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=453&LayerID=6582&PageTypeID=1&PageID=4283", "Official property viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Kittson", "Kittson County property viewer", "https://propertysearch.co.kittson.mn.us/search/commonsearch.aspx?mode=realprop", "Official property viewer; a current county imagery year has not been confirmed."),
  lead("Lac qui Parle", "Lac qui Parle County open-data hub", "https://opendata-lqpgis.hub.arcgis.com/", "Official GIS hub; a current county imagery year has not been confirmed."),
  lead("Lake of the Woods", "Lake of the Woods County GIS", "https://lotwcounty.gov/mis-gis/", "Official GIS page; a current county imagery year has not been confirmed."),
  lead("Lincoln", "Lincoln County GIS viewer", "https://lcmn.maps.arcgis.com/apps/webappviewer/index.html?id=bd3d7b6cc3814818ab38a32c4b8c7105", "Official county viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Marshall", "Marshall County public GIS viewer", "https://gis.co.marshall.mn.us/link/jsfe/index.aspx", "Official county viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Martin", "Martin County maps", "https://www.co.martin.mn.us/your_government/departments/highway/maps.php", "Official maps page; a current county imagery year has not been confirmed."),
  lead("McLeod", "McLeod County GIS viewer", "https://gis.mcleodcountymn.gov/", "Official county viewer retained for checking whether imagery newer than the implemented 2022 layer is available."),
  lead("Meeker", "Meeker County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=585&LayerID=8946&PageTypeID=1", "Official property viewer retained for checking whether imagery newer than the implemented 2013 layer is available."),
  lead("Mille Lacs", "Mille Lacs County public GIS viewer", "https://gis.co.mille-lacs.mn.us/link/jsfe/index.aspx", "Official county viewer retained for visual review of the confirmed 2026 flyover and its available layers."),
  lead("Morrison", "Morrison County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=104", "Official property viewer retained for visual review; its landing page does not state an imagery year."),
  lead("Mower", "Mower County online mapping", "https://www.co.mower.mn.us/482/GIS---Online-Mapping", "Official mapping page retained for visual review of county imagery layers."),
  lead("Murray", "Murray County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=1153&LayerID=30832&PageTypeID=1&PageID=12498", "Official property viewer retained for checking whether imagery newer than the implemented 2011 layer is available."),
  lead("Nobles", "Nobles County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=479&LayerID=6865&PageTypeID=1&PageID=3669", "Official property viewer retained for visual review of the confirmed EagleView acquisition cycle."),
  lead("Norman", "Norman County public GIS viewer", "https://gis.co.norman.mn.us/link/jsfe/index.aspx", "Official county viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Olmsted", "Olmsted County GIS map", "https://gweb01.co.olmsted.mn.us/WebApps/OlmstedCountyGISMap/", "Official viewer retained for visual review of the implemented 2023 imagery and other available layers."),
  lead("Pennington", "Pennington County public GIS viewer", "https://gismap.co.pennington.mn.us/link/jsfe/index.aspx", "Official county viewer retained for visual review of the confirmed 2023 imagery."),
  lead("Pine", "Pine County planning and zoning", "https://www.pinecountymn.gov/departments/planning_and_zoning/index.php", "Official county page; a current county imagery year has not been confirmed."),
  lead("Pope", "Pope County public GIS viewer", "https://gis.popecountymn.gov/link/jsfe/index.aspx?defaultRole=Public", "Official county viewer retained for visual review of the confirmed 2023 imagery."),
  lead("Ramsey", "MapRamsey", "https://maps.co.ramsey.mn.us/MapRamsey/", "Official viewer retained for visual review of the implemented 2022 imagery and newer public layers."),
  lead("Red Lake", "Red Lake County GIS hub", "https://www.arcgis.com/home/item.html?id=99beedd681964704b664b41ccc711da0", "Official county GIS hub; a current county imagery year has not been confirmed."),
  lead("Redwood", "Redwood County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=800&LayerID=12803&PageTypeID=1&PageID=5979", "Official property viewer retained for visual review of the county's Pictometry imagery."),
  lead("Rice", "Rice County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=74&LayerID=590&PageTypeID=1&PageID=956", "Official property viewer retained for checking whether imagery newer than the implemented 2023 layer is available."),
  lead("Rock", "Rock County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=1275&LayerID=43613&PageTypeID=1&PageID=15912", "Official property viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Roseau", "Roseau County public GIS viewer", "https://gis.co.roseau.mn.us/link/jsfe/index.aspx", "Official county viewer retained for checking whether imagery newer than the implemented 2015 northern-border layer is available."),
  lead("Scott", "Scott County GIS viewer", "https://gis.co.scott.mn.us/sg3/", "Official county viewer retained for visual review of the confirmed 2026 imagery and its layer list."),
  lead("Sherburne", "Sherburne County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=133&LayerID=1600&PageTypeID=1&PageID=903", "Official property viewer retained for visual review of the county's imagery layers."),
  lead("Sibley", "Sibley County parcel viewer", "https://experience.arcgis.com/experience/ce3e459da37b4a31be399de86feba630", "Official county viewer retained for visual review of the confirmed 2023 imagery and its layer list."),
  lead("St. Louis", "St. Louis County Land Explorer", "https://gis.stlouiscountymn.gov/landexplorer/", "Official county viewer retained for reviewing available orthogonal and bird's-eye imagery dates."),
  lead("Stearns", "Stearns County property viewer", "https://stearns-county-gis-stearns.hub.arcgis.com/apps/fbc70d782fc547f9b8220218eac3c966", "Official county viewer retained for visual review of the confirmed Spring 2024 imagery."),
  lead("Steele", "Steele County tax parcel viewer", "https://steele-county-hub-site-steelecomn.hub.arcgis.com/apps/d3aead984a994bce861ad812a4551e7f/explore", "Official county viewer retained for visual review of the confirmed 2025 imagery."),
  lead("Stevens", "Stevens County interactive mapping", "https://www.stevenscountymn.gov/991/Interactive-Mapping", "Official county mapping page; a current county imagery acquisition year has not been confirmed."),
  lead("Swift", "Swift County public GIS map", "https://www.gismidwest.com/maps/swiftpublic/", "Officially linked public viewer retained for reviewing the county's EagleView imagery layers."),
  lead("Todd", "Todd County interactive GIS mapping", "https://www.toddcountymn.gov/government/departments/interactive_gis_mapping.php", "Official county viewer retained for checking whether imagery newer than the implemented 2020 flight is available."),
  lead("Traverse", "Traverse County open-data portal", "https://data-traversecountymn.opendata.arcgis.com/", "Official county portal retained for visual review of the confirmed 2022 Pictometry imagery and other layers."),
  lead("Wabasha", "Wabasha County GIS", "https://www.co.wabasha.mn.us/departments/gis_department/index.php", "Official county GIS page retained for reviewing the already implemented 2025 imagery."),
  lead("Wadena", "Wadena County public GIS viewer", "https://gis.co.wadena.mn.us/link/jsfe/index.aspx", "Official county viewer retained for checking whether imagery newer than the implemented regional coverage is available."),
  lead("Waseca", "Waseca County Beacon", "https://beacon.schneidercorp.com/?site=WasecaCountyMN", "Official property viewer advertises ultra-high-resolution photography; inspect its layer list to confirm the acquisition year."),
  lead("Washington", "Washington County property viewer", "https://experience.arcgis.com/experience/a0a1cb63cd7846bea9ff6c8e18b9b48c", "Official county viewer retained for visual review of the confirmed 2026 imagery and historical layers."),
  lead("Watonwan", "Watonwan County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=216&LayerID=2931&PageTypeID=1", "Official property viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Wilkin", "Wilkin County public GIS viewer", "https://gisweb.co.wilkin.mn.us/link/jsfe/index.aspx", "Official county viewer; inspect its layer list to confirm the imagery acquisition year."),
  lead("Winona", "Winona County Beacon", "https://beacon.schneidercorp.com/Application.aspx?AppID=597&LayerID=9787&PageTypeID=1", "Official property viewer retained for reviewing licensed Pictometry imagery; the acquisition year has not been confirmed."),
  lead("Wright", "Wright County aerial imagery viewer", "https://experience.arcgis.com/experience/0fb2593f7cec4fa9b01e157b02d20102", "Official county viewer retained for visual review of the confirmed 2025 aerial layer and historical imagery."),
  lead("Yellow Medicine", "Yellow Medicine County public GIS viewer", "https://gis.co.ym.mn.gov/Link/jsfe/index.aspx", "Official county viewer retained for visual review of the confirmed 2025 EagleView imagery."),
] as const;

export function imageryResearchLeadsForCounty(countyName: string): readonly ImageryResearchLead[] {
  return imageryResearchLeads.filter((source) => source.county === countyName);
}

function lead(county: string, name: string, url: string, notes: string): ImageryResearchLead {
  return { county, name, url, notes };
}
