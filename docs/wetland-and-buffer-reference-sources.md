# NWI and Buffer Protection reference sources

Research and implementation notes for delivery slice #28. The source selection and original
measurements were recorded in issue #16 and verified there on 2026-09-24. Service metadata and
the statute have been checked again for this implementation on 2026-09-27.

## National Wetlands Inventory

- Minnesota DNR's `water_nat_wetlands_inv_2009_2014` MapServer layer 0 is the statewide NWI
  polygon layer. The service is anonymous (`Map,Data,Query`), supports spatial queries, and
  publishes Cowardin, wetland type, acres, HGM, special modifier, and Circular 39 attributes.
  The statewide feature count is over two million, so it is displayed as MapServer imagery,
  not fetched and rendered as a feature layer. Layer 1 (Project Boundary) is not displayed.
- The service identification and source inventory describe the mapped imagery as 2009–2014.
  Use that date as source vintage only; do not call the inventory current or the latest available.
- Meaning class: `inventory-reference`. The NWI has no legal or regulatory status and is not a
  jurisdictional wetland determination. The result links to DNR wetland information and advises
  contacting local government or the Army Corps of Engineers before work near water.
- The NWI service's license terms are not independently confirmed here. The DNR general
  geographic data license applies to DNR data; no USFWS reuse statement was established for
  the Minnesota layer.

## Buffer Protection Map

- Minnesota DNR's `env_buffer_protection_mn` MapServer layer 1 contains public-water and
  public-ditch lines; layer 2 contains basin polygons. Layer 0 (`Pw Watercourse Removals`) is
  deliberately excluded. Live service metadata confirms the layer IDs, geometry types, names,
  attributes, anonymous `Map,Data,Query` capability, and spatial-query support.
- MapServer exports are used for display. The configured image requests are restricted to
  `show:1` and `show:2`, respectively. Buffer lines are identified with a 15 m point-query
  tolerance; basin polygons use point intersection. The map shows the water features, never
  buffer strips. Source positional accuracy is comparable to the strip width.
- Meaning class: `regulatory-guide`. DNR calls the map a guide; its geometry is not parcel
  ownership, a compliance determination, or a precise on-the-ground boundary. Exemptions and
  stricter local rules are not represented. Results tell users to confirm with their SWCD.
- DNR metadata gives a statewide revision of August 2019. DNR's current public map page says
  August 2017; the implementation follows the service metadata, not that older page text.
- Minn. Stat. 103F.48 was reread at the [Revisor](https://www.revisor.mn.gov/statutes/cite/103F.48/)
  on 2026-09-27. Subdivision 1(d) defines the buffer-protection map as maps established and
  maintained by the DNR commissioner. Subdivision 3 describes the requirements on landowners
  adjacent to mapped waters and incorporates shoreland standards; subdivision 5 lists
  exemptions. The UI avoids applying those rules to a specific parcel or deciding compliance.
  Official guidance links to the Revisor, DNR, and BWSR.

## Display and remaining release checks

The historical source investigation recorded export timings for 512 px images: NWI around 0.3 s
at a 12 km extent, 1.6–2.6 s at 34 km, 12.7–13.3 s at 50–80 km, and a timeout at 600 km;
Buffer Protection around 0.16 s at 12 km, 0.49 s at 80 km, and 9.5 s at 600 km. The current
camera-height values are conservative provisional limits (20 km for NWI; 40 km for buffer layers).
They are not accepted as measured delivery gates: **measure uncached exports through the deployed
Worker on a phone connection, then tune and document the limits before release.**

The U.S. Fish and Wildlife Service's national [Wetlands Data](https://www.fws.gov/program/national-wetlands-inventory/wetlands-data)
page says the national data layer is updated twice a year. That does not establish whether
Minnesota-specific edits newer than the DNR service are included or available, so this project
has not confirmed a newer Minnesota vintage. Do not characterize the DNR layer as the newest
available. Ask USFWS/DNR or compare the Minnesota download before making that claim.
