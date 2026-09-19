# Minnesota DNR public map catalog

Verified September 18, 2026 against the official [Minnesota DNR Maps directory](https://www.dnr.state.mn.us/maps/index.html).

The directory currently lists 70 resources: 40 web maps, 24 PDF/image resources, five entries offering both web and printable maps, and one other interactive map. It is a discovery catalog rather than a single GIS service, so each candidate still needs its underlying data endpoint, schema, access meaning, and update behavior verified before integration.

## Already represented in MnMapping

MnMapping already queries authoritative statewide DNR FeatureServers for:

- Publicly accessible wildlife management areas
- Scientific and natural areas
- State parks and recreation management units
- Aquatic management acquisition interests
- State forest management units

These layers remain preferable to embedding the corresponding DNR viewer because MnMapping can query only the current viewport, expose useful fields, and state whether a boundary means public access, managed land, or an administrative unit.

## Strong candidates for direct integration

| Priority | DNR maps | Potential MnMapping value | Required verification |
| --- | --- | --- | --- |
| High | School Trust Lands | Adds a major state-land classification not currently shown as its own layer. | Find the authoritative polygon service and distinguish surface ownership from severed mineral rights and public access. |
| High | Walk-In Access, Hunter Walking Trails, Ruffed Grouse Management Areas, Forest Legacy public hunting | Adds hunting-access programs beyond the existing WMA layer. | Confirm current enrollment, seasonality, access restrictions, and stable feature services. |
| High | Public Water Access, Fishing Piers, State Water Trails | Adds boat launches, shore-fishing sites, portages, campsites, hazards, and water-trail facilities. | Identify reusable point/line services and separate facilities from generalized map locations. |
| Medium | State Trails, Snowmobile Trails, Off-Highway Vehicle Trails, Ski Pass Trails | Adds recreation routes and trail context. | Verify authoritative line services, seasonal status, permitted uses, and update frequency. |
| Medium | National Wetland Inventory, Public Waters Inventory, Buffer Protection | Adds regulatory and hydrologic reference boundaries. | Keep regulatory meaning explicit and avoid presenting inventory boundaries as parcel ownership. |
| Medium | Spring Inventory, Dam Finder, LakeFinder | Adds natural-resource reference points and detailed water information. | Confirm direct services, useful popup fields, and query cost. |
| Specialized | County Groundwater Atlas, Minnesota Hydrogeology Atlas, native plant communities, aggregate and mine maps | Valuable research layers, but narrower than the main land-navigation workflow. | Prefer direct GIS data where available; otherwise retain official external links. |

## Hunting and game overlays

Hunting boundaries are high-value reference layers, but they must remain separate from public-land ownership and access layers. A permit or management zone does not establish permission to enter land.

The DNR's public [2026 Deer Hunt and CWD Plan](https://gis.dnr.state.mn.us/arcgis/apps/experiencebuilder/experience/?id=1eea035e49a047a88464306414a632c8) exposes a current web map and separate anonymous services for:

- Deer Permit Areas and their management designations
- CWD management and sampling zones
- CWD sampling and self-service locations
- Feeding and attractant bans
- County firearm ordinances
- Public lands with potential deer-hunting opportunities
- Hunting access points and public-land trails

The standalone [Minnesota Deer Permit Areas FeatureServer](https://gis.dnr.state.mn.us/arcgis/sharing/servers/dcc01eabc82143aa8d98f940f4ee37dd/rest/services/Hosted/Minnesota_Deer_Permit_Areas/FeatureServer/0) is anonymously queryable and publishes useful fields for DPA number, management designation, special regulations, season categories, disease management, carcass movement, and effective period. This is the strongest first candidate for a dedicated **Hunting zones** layer group.

Other useful official references include bear permit areas, turkey permit areas, chronic-wasting-disease maps, hunter walking trails, ruffed grouse management areas, and wildlife observations. Before direct integration, each boundary source must be tied to a current season, tested for anonymous spatial queries, and labeled with its effective year. Seasonal layers should default off and link users to the current DNR regulations because the map is a navigation aid rather than the legal authority.

## Better as external or time-sensitive references

Fire danger and burning restrictions, fall colors, snow depth, river levels, lake ice dates, chronic wasting disease surveillance, and current hunting-season maps change frequently or carry date-sensitive rules. They should remain clearly dated external references unless MnMapping adds a dedicated live-status design with update timestamps and appropriate warnings.

The catalog's PDF, image, GeoPDF, and downloadable-atlas entries are useful resources but are not automatically streamable map layers. Viewer availability alone is also insufficient: a candidate must expose a stable anonymous service and have a meaning MnMapping can label accurately.
