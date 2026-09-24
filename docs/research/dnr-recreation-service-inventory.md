# Minnesota DNR recreation service inventory

Verified 2026-09-23 against official Minnesota DNR pages and DNR datasets published through Minnesota's Geospatial Commons ArcGIS REST service. Counts below are live-query snapshots, not contractual totals.

## Decision

The committed first collection is supportable with anonymous, queryable official services. Use the durable `enterprise.gisdata.mn.gov` FeatureServers for all layers except current CWD regulation zones. CWD should come from the season-specific DNR deer/CWD web map because that is where the DNR publishes the current effective-period and regulation fields.

All hunting-zone layers should default off. Every hunting popup and legend should show its effective season/year, link to the current official regulations, and say that the map is a reference aid rather than the legal authority or evidence of access.

## Recommended inventory

| MnMapping layer | Official service | Verified schema and snapshot | Decision-relevant constraint |
| --- | --- | --- | --- |
| Deer permit areas | [DNR deer permit areas, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/bdry_deer_permit_areas/FeatureServer/0) | Polygon; 130 features; `dpa`, `management`, `designatio`, season fields, `specialreg`, disease/carcass fields, `effperiod`, and official report/map URLs. The live distinct `effperiod` was `July 2026 - June 2027`. | Prefer this durable endpoint. Display `dpa`, management/designation, `effperiod`, and official links; do not translate the fields into independent legal advice. The DNR explains that DPAs are management areas rather than ownership/access boundaries on its [deer permit areas page](https://www.dnr.state.mn.us/mammals/deer/management/dpas.html). |
| Bear permit areas | [DNR bear permit areas, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/bdry_bear_permit_areas/FeatureServer/0) | Polygon; 17 features; `b_id`, `bmu_label`, and area fields. | The service has no effective-year field. Set a separately verified season label in MnMapping configuration and re-check it annually against the [current DNR bear page](https://www.dnr.state.mn.us/hunting/bear/index.html). Include quota/no-quota and private-land caveats; a permit boundary is not access permission. |
| Turkey permit areas | [DNR turkey permit areas, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/bdry_turkey_permit_areas/FeatureServer/0) | Polygon; 12 features; `tpa` and `sq_mi`. | The service has no effective-year or regulation fields. Set and annually verify a configured season label against the [current DNR wild-turkey page](https://www.dnr.state.mn.us/gohunting/wild-turkey-hunting.html), and link rather than restating rules. |
| CWD zones and deer rules | [Current DNR deer/CWD layer, layer 3](https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services/Hosted/CWD_Sampling_and_Regulations_for_MN_2020_Deer_Seasons_Public_View/FeatureServer/3) | Polygon; 130 features; anonymous `Query`; `cwdzone`, `disemgmt`, `disesamp`, `carcmovmt`, `feedattban`, official URLs, and `effperiod`. The live data reported `July 2026 - June 2027`. | The service's legacy name says 2020 even though its records are current. Treat the [2026 Deer Hunt and CWD Plan](https://gis.dnr.state.mn.us/arcgis/apps/experiencebuilder/experience/?id=1eea035e49a047a88464306414a632c8) as the discovery authority each season, verify the operational-layer URL/effective period, and fail closed if stale. Do not show CWD zones without an effective period. |
| Walk-In Access sites | [DNR Walk-In Access sites, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/bdry_dnr_walk_in_access_sites/FeatureServer/0) | Polygon; 224 features; `wia_id`, county, acres, title/label, uses, atlas fields, and notes. | These are participating private lands, not general public ownership. The [WIA program page](https://www.dnr.state.mn.us/walkin/index.html) requires a WIA validation, limits access to September 1-May 31 and stated daily hours, and warns that landowners can opt out. Link current status/closures in the popup. |
| Hunter Walking Trails | [DNR Hunter Walking Trails, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/trans_hunter_walking_trails/FeatureServer/0) | Polyline; 304 features; owner, unit/area/trail name, administrator/cooperator, comments, miles, edit date, PDF, county, and phone. | A trail can cross multiple ownerships with different rules. The [DNR HWT page](https://www.dnr.state.mn.us/hunting/hwt/index.html) says conditions/rules can vary by segment and that the dataset is updated annually. Show owner/admin and the official GeoPDF/contact rather than implying uniform access. |
| Public-water access | [DNR Water Access Sites, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/struc_water_access_sites/FeatureServer/0) | Point; 3,025 features; stable ID, name, administrator, directions, launch/ramp/parking/dock/toilet attributes, alerts, water-trail fields, and DOW lake ID. | A point describes a facility, not access to every adjoining shore parcel. The [DNR water-access page](https://www.dnr.state.mn.us/water_access/index.html) says sites are normally open unless posted and sends users to LakeFinder for current condition; surface `alerts` and administrator. |
| Fishing piers and shore-fishing sites | [DNR Fishing Sites in Minnesota, layer 0](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/struc_fishing_sites_in_minnesota/FeatureServer/0) | Point; 463 features; facility name/description, directions, site type, ADA flag, lake/county, managing party/unit, and DOW lake number. | This is a facility inventory, not a statement that a species may legally be taken there. The [DNR fishing-piers page](https://www.dnr.state.mn.us/fishing_piers/index.html) describes DNR/local partnerships and notes that accessibility varies by site. |

All eight endpoints returned successful anonymous metadata and `where=1=1&returnCountOnly=true` queries during verification. The FeatureServers advertise `Query` (and the MnGeo-hosted services also advertise `Extract`), support viewport geometry queries, and expose stable identifiers suitable for popup joins.

## Implementation boundaries

- Put the seven user-facing subjects in a **DNR Recreation** group, with hunting boundaries, WIA, and trails off by default. Public-water access and fishing facilities may also default off to avoid point clutter.
- Keep the source URL, source access date, configured season label, and optional `effperiod` on every layer definition. A release/season verification job should compare the configured period with the live service and block stale seasonal layers from being described as current.
- Use viewport/bounding-box queries and pagination. The service maximum is 2,000 records, while the water-access layer alone currently exceeds that total.
- Preserve exact official language where possible. Permit areas and CWD zones regulate or describe hunting; they do not grant land access. WIA is time-limited access to enrolled private land. HWT rules can change with the underlying land ownership. Water-access and fishing-site points describe facilities only.
- Add a visible **Verify current regulations** link to hunting and fishing popups. Never derive legal take methods, seasons, bag limits, or permission to enter from geometry alone.

## Licensing and attribution

The services expose empty `copyrightText` fields, but absence of a REST metadata notice is not a reuse grant. The official [DNR General Data and Software License Agreement](https://www.dnr.state.mn.us/sitetools/data_software_license_plain.html) allows derivative works, requires DNR acknowledgment, says the full data may not be commercially resold/distributed/displayed, disclaims currency and accuracy, and explicitly says geographic data do not establish legal boundaries or legal access and are for reference rather than navigation.

For the current private personal program, use live services, attribute `Minnesota Department of Natural Resources`, carry the reference/legal-access disclaimer, and avoid bulk redistribution. Any later paid, ad-supported, public, or offline-data product needs an explicit licensing review or written DNR permission before the plan assumes these layers can be included.

## Sources

- [Minnesota DNR ArcGIS/MnGeo service directory](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr)
- [2026 Deer Hunt and CWD Plan](https://gis.dnr.state.mn.us/arcgis/apps/experiencebuilder/experience/?id=1eea035e49a047a88464306414a632c8)
- [DNR General Data and Software License Agreement](https://www.dnr.state.mn.us/sitetools/data_software_license_plain.html)
- The individual official REST layers and DNR program pages linked in the inventory table
