# National Wetland Inventory and Buffer Protection reference sources

Verified 2026-09-24 against official Minnesota DNR, BWSR, and U.S. Fish and Wildlife Service (USFWS) pages, the Minnesota Geospatial Commons item records and metadata PDFs, and the anonymous ArcGIS REST endpoints. Counts and timings are live-query snapshots, not contractual values. No DNR, BWSR, or USFWS web viewer was scraped; only documented REST endpoints and published metadata were used.

## Answer

Both resources can be integrated directly, as anonymous, DNR-published map services, but neither is a plain feature layer and NWI must not be described as regulatory.

| Resource | Authoritative publisher | Endpoint | Recommendation |
| --- | --- | --- | --- |
| National Wetland Inventory (Minnesota update, 2009-2014 imagery) | Minnesota DNR (Ecological and Water Resources) led and publishes the Minnesota update; USFWS is the national NWI program and hosts the same data | [`water_nat_wetlands_inv_2009_2014` MapServer, layer 0 "Statewide NWI"](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_nat_wetlands_inv_2009_2014/MapServer/0) | **Direct**, as MapServer image display gated to close zoom, with point identify. Not as a feature layer (2,372,223 polygons). |
| Buffer Protection Map | Minnesota DNR (Ecological and Water Resources) under Minn. Stat. 103F.48; BWSR administers the law but points to the DNR map | [`env_buffer_protection_mn` MapServer, layers 1 and 2](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/env_buffer_protection_mn/MapServer) | **Direct**, as MapServer image display with point identify. Exclude layer 0 (removed watercourses). |

**Surprise that changes #10:** the DNR and USFWS both state that NWI has no legal or regulatory status. The #10 wording "wetland and buffer boundaries are regulatory references" is correct for the Buffer Protection Map and wrong for NWI. NWI needs its own meaning statement (below). The Buffer Protection Map is a regulatory guide, but it is a general guide, not a parcel or compliance determination.

## National Wetland Inventory

### Publisher and endpoint

- The DNR led the first statewide NWI update since the mid-1980s, mapped by Ducks Unlimited and St. Mary's University under DNR contract, and posted the result to the Geospatial Commons and to the USFWS Wetlands Mapper ([DNR metadata PDF](https://operations.gis.data.mn.gov/api/publicdownload/download/903/metadata.pdf); [Commons item](https://gis.data.mn.gov/api/search/v1/collections/all/items/b02794b39e1e4125a3c89b059195f3dc)).
- USFWS is "the principal federal agency" for wetland extent and produces the national Wetlands Data Layer ([USFWS NWI program](https://www.fws.gov/program/national-wetlands-inventory)). At one Minnesota test point, the federal service returned the same two class codes (`PABHx`, `L2UBH`) as the DNR service, with slightly different computed acreage.
- Choose the DNR service as MnMapping's source: it is the Minnesota publisher, it carries the extra simplified plant-community and hydrogeomorphic fields, and it matches the DNR licence and attribution used by the rest of DNR Recreation. Keep the USFWS service as the documented fallback.
- Do not use the historical 1980-1986 NWI ([`water_nat_wetlands_inventory`](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_nat_wetlands_inventory/MapServer)). Its own Commons record says it should not be compared with the current dataset.

### Anonymous access and CORS

- The MapServer (`Map,Data,Query`) and FeatureServer (`Query,Extract`) answered metadata, count, and query requests with no token on 2026-09-24. Query formats are JSON, GeoJSON, and PBF; `maxRecordCount` is 2,000.
- Both services echo the request `Origin` in `Access-Control-Allow-Origin` (with `Access-Control-Allow-Credentials: true`) and answer `OPTIONS`, so browser reads work without a proxy. The app's existing `/api/gis-proxy/` pattern remains a delivery choice, not a requirement.

### Schema

Layer 0 fields: `attribute` (Cowardin code, for example `L2UBH`), `wetland_type` (plain-language type), `acres`, `hgm_code`, `hgm_desc`, `spcc_desc`, `cow_class1`, `circ39_class`, `hgm_symbol`. The polygon layer has no date, project-area, or imagery-year field.

- **Decoder:** the same service publishes table 2 ("State Cowardin Extended", 246 rows) that expands each code into system, subsystem, class, water regime, and modifier descriptions. A `returnDistinctValues` query over all 2,372,223 polygons returned 246 distinct `attribute` values (25 s), and all 246 appear in the decoder table, so every code decodes. Table 3 decodes the hydrogeomorphic codes (56 rows).
- Layer 1 "Project Boundary" carries per-region `delivery_date` and `spring_imagery_year`, which is how a popup can state the vintage at a point. The `Data_Source` layers on the USFWS service give the same information (`IMAGE_YR` returned 2009, 2010, and 2014 at the Minnesota test points).

### Freshness

- The data "correspond to the ground conditions at the time of the base imagery acquisition (2009-2014)"; DNR metadata lists a currentness reference of 2019-05-23, "Annually" for maintenance, and a metadata date of 2015-04-29.
- Regional delivery dates from the service: East Central 2013-05-24, Northeast 2016-07-08, Central 2018-07-23, Koochiching and Northwest 2018-12-21, South 2015-05-01.
- The service exposes no change or edit date. A truthful label is: "Minnesota NWI update, mapped from 2009-2014 imagery." Do not claim a current-year status. USFWS says its national layer "is updated twice a year", but that statement does not show that the Minnesota polygons changed; treat any newer Minnesota revision as unverified.

### Coverage and display scale

- Statewide, seamless, no coverage gaps stated in the metadata; 2,372,223 polygons.
- The service has no scale limit, and DNR's own layer files "restrict drawing of the data when zoomed out beyond 1:250,000" to avoid slow performance. `singleFusedMapCache` is false, so tiles are drawn on demand.
- Measured `export` times for a 512 px image over the Bemidji-area test point: 12 km wide 0.3 s; 34 km wide 1.6-2.6 s; 50 km wide 12.7 s; 80 km wide 13.3 s; 600 km wide timed out at 120 s. USFWS gates its own layer at 1:100,000 (`minScale` 100000); its export returned in 3.0 s at 12 km wide and returned a 2 KB image in about 0.1 s at 80 and 120 km wide, consistent with that gate.
- Recommendation: display through the MapServer `export` operation (the app already uses `ArcGisMapServerImageryProvider` and an `arcgis-mapserver` layer type) and gate on camera height, initially matching the federal 1:100,000. The existing `maxCameraHeight` option and the "zoom in to load" drawer hint from #10 cover the behaviour. Do not use the FeatureServer for display: the 2,000-record cap makes a partial draw inevitable.
- Identify: a point query on layer 0 with a small `distance` returned the wetland records in about 0.16 s (two overlapping polygons at the test point: a pond and the surrounding lake); join the code to table 2 for the readable description.

### Licence

The DNR metadata names the [DNR General Geographic Data License Agreement](https://www.dnr.state.mn.us/sitetools/data_software_license_plain.html), which the earlier DNR inventory note already covers: derivative works allowed; the whole dataset may not be resold, distributed, or displayed commercially; DNR must be acknowledged; the data are "for reference only" and not "legal boundaries or legal access". The Commons item lists licence "none", so the metadata reference is the operative text. The Commons item's `accessInformation` credits funding from the Minnesota Environment and Natural Resources Trust Fund (LCCMR) and USFWS, with Ducks Unlimited, St. Mary's University of Minnesota, and the DNR as partners. No explicit USFWS reuse text was found on the NWI pages reached; treat the federal licence as unverified.

### Wording

DNR's FAQ: "The NWI has no legal or regulatory status. It is not a jurisdictional wetland determination... The NWI is a planning and assessment tool that indicates a high probability of the presence of wetlands in a location." It also says NWI data "are not intended to be used to identify wetland boundaries for wetland permitting purposes" ([DNR NWI FAQ](https://www.dnr.state.mn.us/wetlands/nwi_faq.html)). USFWS: the "map products were neither designed nor intended to represent legal or regulatory products" and NWI data "should not be interpreted as representing the presence, absence, or extent of wetlands that may be covered under one or more federal, state, Tribal, or local laws" ([USFWS user caution](https://www.fws.gov/page/wetlands-geodatabase-user-caution), [disclaimer](https://www.fws.gov/page/wetlands-geodatabase-disclaimer)). DNR accuracy statements: about 90% wetland/upland accuracy, about 75% class accuracy, and boundaries within about 19 feet for 95% of well-defined edges.

Proposed meaning statement (class: reference, not regulation-zone):

> Wetland inventory — a planning reference mapped from 2009-2014 imagery. It has no legal or regulatory status and is not a wetland boundary or permit determination. Contact your local government or the Army Corps of Engineers before any work near water.

Proposed result content: title from `wetland_type`; decoded Cowardin description; acres; simplified plant community and hydrogeomorphic description under **More details**; the region's imagery year; attribution "Minnesota DNR, National Wetland Inventory for Minnesota (2009-2014 imagery) · reference only, no legal or regulatory status".

Verify links: [DNR Wetland Finder](https://wetland-finder.dnr.state.mn.us/), [DNR NWI FAQ](https://www.dnr.state.mn.us/wetlands/nwi_faq.html), and [DNR wetlands regulations and permits](https://www.dnr.state.mn.us/wetlands/regulations.html) (Clean Water Act Section 404 via the Corps, the Public Waters Permit Program, the Wetland Conservation Act through local governments, and local ordinances).

## Buffer Protection Map

### Publisher and endpoint

- The DNR's page says its role in the buffer law "is to produce and maintain a map of public waters and public ditch systems that require permanent vegetation buffers" ([DNR Buffer Mapping Project](https://www.dnr.state.mn.us/buffers/index.html)). The metadata says "the DNR Commissioner has validated the authenticity of this map for purposes described in M.S. 103F.48" ([metadata PDF](https://operations.gis.data.mn.gov/api/publicdownload/download/873/metadata.pdf); [Commons item](https://gis.data.mn.gov/api/search/v1/collections/all/items/05bdf93c41f843ca867236c6f7190297)).
- BWSR administers compliance with the SWCDs but does not publish the map: its [map page](https://bwsr.state.mn.us/where-can-i-find-buffer-maps) links to the DNR viewer and says map corrections go from SWCDs, drainage authorities, or local governments to the DNR.
- The statute text at Revisor could not be fetched (TLS handshake failed from this machine with three clients on 2026-09-24). Statute claims here rest on the DNR and BWSR pages that cite it. Re-read [Minn. Stat. 103F.48](https://www.revisor.mn.gov/statutes/cite/103F.48) during delivery.

### Anonymous access and CORS

MapServer (`Map,Data,Query`) and FeatureServer (`Query,Extract`) worked without a token; `maxRecordCount` 2,000; CORS behaviour matches the NWI service.

### Layers and schema

| Layer | Geometry | Count | Use |
| --- | --- | --- | --- |
| 0 Pw Watercourse Removals | Line | 609 | **Do not display.** These are watercourses the April 2017 Commissioner's Order removed from the Public Waters Inventory; they no longer require buffers. |
| 1 Pw Watercourse Public Ditches Combined | Line | 36,598 | Display. `buffer_ft` is 16.5 (18,616 features) or 50 (17,982). |
| 2 Pw Basins For Buffer Map | Polygon | 14,492 | Display. `buffer_ft` is 50 on every polygon. |

Layer 1 fields: `usgs_name`, `kittle_nam`, `fname` (local ditch name, incompletely populated), `description` (for example "PW Natural", "Public Ditch", "PW Natural/Public Ditch"), `pd_flag`, `pwi_flag`, `sl_flag`, `dnr_sl_cla` (shoreland class), `buffer_ft`, `cty_name`, `dow_lake_number`, `within_basin`, `field_review`, `potential_trout_delisting`. Layer 2 fields: `pw_basin_name`, `pwi_class`, `acres`, `dow_lake_number`, `dnr_sl_class`, `buffer_ft`, `field_review`. Metadata defines every attribute, and `dow_lake_number` matches the DOW identifier used by the LakeFinder join, so a basin result can offer the LakeFinder summary.

Flags worth surfacing: 6 watercourse features carry `field_review = Y` ("temporary designation" pending field verification); 72 carry `potential_trout_delisting = Y` (landowners may delay installing a buffer pending a final determination, per the metadata).

Identify verified: a point query on layer 2 at the centre of Lake Beltrami returned `buffer_ft` 50 and shoreland class "Recreational Development"; a point query with a 15 m tolerance on layer 1 returned two overlapping Mississippi River segments with their classification. Lines need a distance tolerance; polygons need none.

### Freshness

- Metadata: content compiled and reviewed 2016-01-01 to 2019-08-28, currentness reference 2019-08-29, maintenance "As needed", and "There is currently no planned update, but periodic updates will occur as needed." Metadata date 2024-03-13. The last of eight documented releases is August 2019.
- The DNR web page still says "The DNR last updated the buffer protection map in August 2017", which conflicts with the metadata's eighth (August 2019) update. Prefer the metadata and say so in delivery notes. The Commons item's "modified" timestamp (2026-08-07) is an ETL republish, not a content revision.
- A truthful label: "DNR Buffer Protection Map, statewide revision of August 2019." The service has no date field.

### Coverage and display scale

- Statewide, complete coverage; local drainage data came from every drainage authority except Koochiching County, where MPCA altered-watercourse data substituted.
- No scale limit, no tile cache. Measured `export` times for 512 px layers 1 and 2 over Bemidji: 12 km wide 0.16 s; 80 km wide 0.49 s; 600 km wide 9.5 s; 3,000 km wide 12.4 s. Gate on camera height with the same mechanism as NWI, starting near 1:250,000, and re-time during delivery.
- Draw the map's water lines and basins with a label or legend for 16.5 ft and 50 ft. Do not draw buffer strips: the metadata says only ">90%" of 40 sampled points were within 50 feet of the reference layers, the same magnitude as the buffer width.

### Licence

Same DNR General Geographic Data License Agreement (named in the metadata). The metadata's `Access Constraints` is "None"; its use constraint is the general-guide disclaimer quoted below.

### Wording

The metadata's use constraint, which the popup should honour: "This map is intended to be a general guide to show where buffers are required under the buffer law (M.S. 103F.48). The data are not intended to show precise locations. This map represents the minimum state riparian buffer protection standards... Local ordinances may be more restrictive... does not replace on-the-ground verification and delineation of buffer locations. Requirements under the buffer law do not apply to tribal lands, lands owned by tribal members or lands held in trust for the tribe. Exemptions to the buffer law are not displayed on this map." The map also omits public-water wetlands without a DNR shoreland class, "other waters" addressed by local water plans, and sites where an SWCD chose an alternative practice.

Proposed meaning statement (class: regulation-zone):

> Minimum state buffer requirement — a general guide to waters where Minnesota's buffer law (Minn. Stat. 103F.48) applies. It is not parcel ownership or a compliance determination, and exemptions and stricter local rules are not shown. Confirm with your SWCD.

Proposed result content: water name, "50-foot average buffer" or "16.5-foot buffer" from `buffer_ft`, type from `description`, shoreland classification, and a field-review or trout-delisting notice when flagged. Attribution: "Minnesota DNR, Buffer Protection Map (revision of August 2019) · general guide only, not a legal boundary".

Verify links: [DNR Buffer Mapping Project](https://www.dnr.state.mn.us/buffers/index.html), [DNR buffer map viewer](https://buffers-viewer.dnr.state.mn.us/), and [BWSR Minnesota Buffer Law](https://bwsr.state.mn.us/minnesota-buffer-law). Map corrections go through the local SWCD.

## Open checks carried to delivery planning

- Re-read Minn. Stat. 103F.48 from the Revisor (unreachable during this research) before finalizing the buffer meaning statement.
- Time both exports again from a Cloudflare Worker and on a phone connection, then set the camera-height gates. The NWI export took 12-13 s at 50-80 km wide from this machine.
- Confirm `ArcGisMapServerImageryProvider` requests only `show:0` for NWI and `show:1,2` for buffers, and that an uncached MapServer renders acceptably at the chosen gate.
- Confirm whether the federal USFWS layer has Minnesota edits newer than the DNR layer before promising a data vintage; the DNR service exposes no edit date.
- Decide whether NWI and buffer results need a new meaning-statement class in the layer type (`AccessMeaning` currently has no inventory or regulatory-guide value).
- Federal USFWS reuse terms were not found in text; verify them only if the USFWS fallback is ever used.
- Buffer web-page date (2017) and metadata date (2019) disagree; ask DNR which is authoritative if a revision date is ever shown more prominently than the label above.

## Sources

- [DNR Buffer Mapping Project](https://www.dnr.state.mn.us/buffers/index.html)
- [Buffer Protection Map, Minnesota (Commons item)](https://gis.data.mn.gov/api/search/v1/collections/all/items/05bdf93c41f843ca867236c6f7190297) and [metadata PDF](https://operations.gis.data.mn.gov/api/publicdownload/download/873/metadata.pdf)
- [`env_buffer_protection_mn` MapServer](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/env_buffer_protection_mn/MapServer)
- [BWSR Minnesota Buffer Law](https://bwsr.state.mn.us/minnesota-buffer-law) and [Where can I find buffer maps](https://bwsr.state.mn.us/where-can-i-find-buffer-maps)
- [National Wetland Inventory for Minnesota (Commons item)](https://gis.data.mn.gov/api/search/v1/collections/all/items/b02794b39e1e4125a3c89b059195f3dc) and [metadata PDF](https://operations.gis.data.mn.gov/api/publicdownload/download/903/metadata.pdf)
- [`water_nat_wetlands_inv_2009_2014` MapServer](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_nat_wetlands_inv_2009_2014/MapServer)
- [Historical NWI (Commons item)](https://gis.data.mn.gov/api/search/v1/collections/all/items/757765ca1fb14ba9ba69e3001991d51d)
- [DNR National Wetlands Inventory Update](https://www.dnr.state.mn.us/wetlands/nwi_proj.html), [NWI FAQ](https://www.dnr.state.mn.us/wetlands/nwi_faq.html), [Wetlands regulations and permits](https://www.dnr.state.mn.us/wetlands/regulations.html), [Wetland Finder](https://wetland-finder.dnr.state.mn.us/), [Minnesota Wetland Inventory user guide](https://files.dnr.state.mn.us/eco/wetlands/nwi-user-guide.pdf)
- [USFWS National Wetlands Inventory](https://www.fws.gov/program/national-wetlands-inventory), [Wetlands Data](https://www.fws.gov/program/national-wetlands-inventory/wetlands-data), [Web Map Services](https://www.fws.gov/program/national-wetlands-inventory/web-mapping-services), [Disclaimer](https://www.fws.gov/page/wetlands-geodatabase-disclaimer), [User Caution](https://www.fws.gov/page/wetlands-geodatabase-user-caution), [Data Limitations, Exclusions and Precautions](https://www.fws.gov/page/wetlands-data-limitations-exclusions-and-precautions)
- [USFWS Wetlands REST service](https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer) and [Data_Source service](https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Data_Source/MapServer)
- [DNR General Data and Software License Agreement](https://www.dnr.state.mn.us/sitetools/data_software_license_plain.html)
- Prior notes on this project: `docs/research/dnr-recreation-service-inventory.md` on branch `research/dnr-services`
