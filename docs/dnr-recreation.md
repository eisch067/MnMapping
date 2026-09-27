# DNR Recreation

DNR Recreation is the curated collection of Minnesota DNR datasets for hunting, fishing, and public outdoor access. It is in the **personal build only**. The public build lists no DNR Recreation layer and has no proxy route to `gis.dnr.state.mn.us`: DNR must confirm that a public release of its data is acceptable, and that question is recorded in [QUESTIONS-FOR-AGENCIES.md](licensing/QUESTIONS-FOR-AGENCIES.md) (Minnesota DNR, question 9).

Every layer is queried live, and nothing is stored for offline use. Every layer starts off. The vocabulary (Hunting zone, Season label, Meaning statement) is in [CONTEXT.md](../CONTEXT.md); the reasoning behind the structure is in issue #10.

## Layers

| Layer | Heading | Source | Class | Season |
| --- | --- | --- | --- | --- |
| Deer permit areas | Hunting zones & health | `bdry_deer_permit_areas` layer 0 | regulation-zone | Service `effperiod` |
| Bear permit areas | Hunting zones & health | `bdry_bear_permit_areas` layer 0 | regulation-zone | Configured |
| Turkey permit areas | Hunting zones & health | `bdry_turkey_permit_areas` layer 0 | regulation-zone | Configured |
| CWD zones | Hunting zones & health | DNR's hosted CWD service, layer 3 | regulation-zone | Service `effperiod` |
| Migratory waterfowl feeding & resting areas | Hunting zones & health | `env_migratory_waterfowl_areas` layer 1 | regulation-zone | none |
| CWD sampling & self-service sites | Hunting zones & health | DNR's hosted CWD service, layer 1 (`show = 'Yes'`) | facility | Five-check season gate |
| Walk-In Access sites | Hunting access & habitat | `bdry_dnr_walk_in_access_sites` layer 0 | enrolled-private-land | none |
| Walk-In Access trails | Hunting access & habitat | `struc_dnr_walk_in_access_trails` layer 0 | enrolled-private-land | none |
| Hunter Walking Trails | Hunting access & habitat | `trans_hunter_walking_trails` layer 0 | access-varies | none |
| Ruffed Grouse Management Areas | Hunting access & habitat | `bdry_ruffed_grouse_mgmt_areas` layer 1 | managed-land | none |
| Public-water access | Fishing & water access | `struc_water_access_sites` layer 0 | facility | none |
| Fishing piers & shore-fishing sites | Fishing & water access | `struc_fishing_sites_in_minnesota` layer 0 | facility | none |
| Listed infested waters | Fishing & water access | `env_listed_infested_waters` layer 0 | regulation-zone | none |
| State Water Trails | Fishing & water access | `trans_water_trails_minnesota` layer 0 | facility | none |
| State forest roads | Recreation trails | `trans_state_forest_roads` layer 0 | access-varies | none |
| State forest campgrounds & day-use areas | Recreation trails | `struc_state_forest_campgrounds` layer 1 | facility | none |
| State Trails | Recreation trails | `trans_state_trails_minnesota` layer 0 | access-varies | none |
| Snowmobile trails | Recreation trails | `trans_snowmobile_trails_mn` layer 0 | access-varies | freshness warning |
| OHV trails | Recreation trails | `trans_ohv_trails_mn` layer 0 | access-varies | freshness warning |

All but CWD zones are on MnGeo's `enterprise.gisdata.mn.gov` under `us_mn_state_dnr`, reached through the existing `mngeo-features` proxy provider. CWD zones come from the season-specific DNR service, because that is where DNR publishes the current effective period. The layers are defined in `src/config/layers/dnrRecreation.ts`; each names its source, attribution, meaning class, verify link, heading, and the date it was last checked against DNR.

Water & regulatory reference holds no layer yet. It remains listed with a disabled control so the five headings are always there.

State forest campgrounds use layer 1, the current output derived from the Parks and Trails Enterprise Information System. Layer 0 is explicitly named `Orig`, uses the legacy GDRS field set, and is not used. The migratory-waterfowl `electric_m` field remains omitted: although the program page describes where small electric motors are permitted, the service does not document the flag's contract.

The Boundary Waters Canoe Area Wilderness is a personal-only Public lands layer, not a DNR Recreation layer. Its wording credits Minnesota DNR for the boundary data (derived from the Public Law 95-495 legal description) and the U.S. Forest Service as the federal wilderness administrator.

## The drawer

**DNR Recreation** is one category in the Layers sheet. Its control suspends and restores the active subset across the whole collection, and each of the five headings has its own control that does the same for that heading. The rules are the ones in [Layer controls](layer-controls.md#group-controls); no control turns a layer on that the user had not. An **All opacities** slider sets every DNR layer at once.

A layer's row shows its Season label when it has one, its meaning statement, and an **Info** section with the DNR General Data and Software License Agreement text and a link to the official page. The license text appears there once per layer and is not repeated in results.

### Zoom in to load

Public-water access, snowmobile trails, and OHV trails wait for a view below 150 km. Their rows show "Zoom in to load" rather than drawing an oversized statewide payload. Every request is limited to the current viewport; snowmobile and OHV geometry also sends `maxAllowableOffset=0.0005` (about 50 metres) to the FeatureServer. The live smoke fails a layer that grows past 2,000 records without a zoom gate.

### Trail freshness

Snowmobile and OHV rows show the release-verified season label and metadata content date. Snowmobile is currently labelled `2026–27 season · source content 2026-09-23`, verified through 2027-08-31; OHV is `2026 season · source content 2026-09-23`, verified through 2026-12-31. After those dates the row warns that the source is stale, but its checkbox remains enabled and the layer never fails closed. Conditions, grooming, and closures remain links to DNR pages rather than claims derived from geometry.

Snowmobile results deliberately omit `public_poc`, `public_pho`, `pocemail`, and `pocwebsite`; the layer links DNR's trail-contacts page instead.

## The season gate

Five layers mean something only for a season: Deer permit areas, CWD zones, CWD sampling & self-service sites, Bear permit areas, and Turkey permit areas. Each is **fail closed**: unless its season is verified as current, the layer stays listed but is unavailable. Its checkbox is disabled, the row reads "Season data not verified" with the last verified period and a link to the official DNR source, and nothing is drawn or identified. A "on" stored from an earlier visit is ignored, not erased, so the layer returns as it was left once its season is current.

- **Deer permit areas and CWD zones** take the season from the service. On load the app asks each service for its distinct `effperiod` values. Every value must read as a whole-month period such as "July 2026 - June 2027" that contains today. A service that cannot be reached, returns an error, publishes no period, or publishes any period that is not current leaves the layer unavailable. Until the service answers, the row reads "Checking season data…".
- **CWD sampling & self-service sites** fail closed unless five checks pass: layer 3 publishes the configured current `effperiod`; the pinned portal item title names the configured year; layer 1 has at least one site matching the visible-site filter; the newest `last_edited_date` across all layer-1 rows is on or after July 1 of that year; and the expected layer and field names remain present. The gate queries live with `cache: no-store`; it never stores sites offline. An unavailable row shows the last verified period and the official DNR CWD page. Results omit the personal `contact` field and internal `confirm` notes, preserve DNR's `cwdareas` and `dpa` text, and do not infer requirements from point geometry.
- **Bear and Turkey permit areas** publish no season, so the label and a `verifiedThrough` date are configured in `dnrRecreation.ts`. The layer is current through the end of that day and unavailable after it, or if the date is missing or malformed.

The rules are in `src/lib/dnr/season.ts` (reading a period and applying a rule, with the clock passed in) and `src/lib/dnr/seasonGate.ts` (asking the services and masking layers whose season is not current), covered by the tests beside them. Dates are read in UTC, which differs from Minnesota time by a few hours and does not matter at the grain of a month.

### Annual re-verification

Each August to September:

1. Run `npm run smoke:dnr`. It fails a service whose period is not current or differs from `lastVerifiedPeriod`, and a configured season with 30 days or fewer left.
2. Check the DNR deer and CWD hunt plan for the season and confirm the CWD service address is unchanged.
3. Check the DNR bear and turkey pages, then update each configured `label` and `verifiedThrough`. Bear is asserted through 31 March, before DNR posts the next season's permit areas in April. Turkey is asserted through 31 December, because spring permit areas may change when DNR posts them.
4. Update the `lastVerifiedPeriod` and `verifiedOn` values, and the dates in `tests/e2e/dnr.spec.ts`.

## Results

Selecting a point asks each visible DNR layer what is there, through the identify adapter for feature services ([Identify](identify.md)). A layer of lines or points is asked within the click distance, with at most ten results. A DNR result in the Explore sheet shows, in order:

1. the title, and the alerts banner for a public-water access whose site DNR has posted a notice;
2. the Season label, where the layer has one, and the layer's summary fields;
3. the meaning statement for its class;
4. **Verify current regulations ↗** and any other official pages;
5. **More details**, which holds the secondary source fields;
6. the attribution: "Minnesota DNR · reference only, not a legal boundary or proof of access".

Empty and blank fields are hidden, and DNR's wording is shown as published. Season and license-type codes are not shown; the result links to DNR instead. Web addresses in the data are linked only when they are `https` pages on DNR's own domain.

State Trail and State Water Trail pages come from exact-name lookup tables in `src/config/layers/dnrTrailLinks.ts`; names absent from the official A-Z list are omitted rather than guessed. The seven unreconciled State Trail names are Alborn-Pengilly, Blue Ox, Blufflands Preston to Forestville, Cloquet-Saginaw, Dakota Rail, Gandy Dancer, and the OHV access connector to Taconite. All 35 water-trail names are reconciled.

The same file records five RGMA unit-map filenames that returned 404 on 2026-09-26: `7mile_rgma.pdf`, `hwy115_rgma.pdf`, `moose_line_rgma.pdf`, `morehouse_road.pdf`, and `st_louis_river_rgma.pdf`. Those links are checked by the live smoke but not rendered until DNR restores them.

| Class | Meaning statement |
| --- | --- |
| regulation-zone | Regulation boundary — does not show ownership or permission to enter. |
| enrolled-private-land | Participating private land — WIA validation required, Sept 1–May 31, landowners may opt out. |
| facility | Marks a facility or route, not access to adjoining land or permission to take any species. |
| access-varies | Rules vary by landowner along the trail. |
| managed-land | DNR habitat designation — does not show ownership or permission to enter; verify boundary signs. |

The wording, the fields each layer shows, and its links are in `src/lib/dnr/meaning.ts`, `src/config/layers/dnrRecreation.ts`, and `src/lib/dnr/describe.ts`. The deer permit area report PDF is not linked, because the base address that its file names resolve against has not been verified.

## LakeFinder and the Lake depth map

### Lakes & LakeFinder

**Lakes & LakeFinder** draws DNR's Public Waters basin outlines, keyed by the eight-character DOW lake number, as faint outlines. The service holds about 22,000 basins, so like Public-water access it loads only from a closer view (a camera height of 40 km). A click inside a lake gives a **Lake** result with the basin name, DOW number, and acres, and an **Open lake summary** action.

The same action is on public-water access and fishing-site results, which carry the lake's DOW number (`dow_lake_id`, `dow_lake_number`). It works whether or not the outline layer is on, and nothing looks up a lake on an ordinary click.

### The LakeFinder summary

**Open lake summary** asks DNR's [LakeFinder by-ID API](https://services.dnr.state.mn.us/api/lakefinder/by_id/v1/usage.html) for the lake and shows, in order:

1. the lake's name, DOW number, county, nearest town, area, and maximum and mean depth (a depth DNR reports as zero is shown as "Unavailable");
2. **DNR special fishing regulations**, verbatim, with the species and location DNR gives and a **Verify current regulations ↗** link. An empty list reads "No lake-specific special regulations listed by DNR. Statewide, border-water, method, and seasonal rules may still apply.";
3. invasive species and DNR's notes, hidden when there are none;
4. **Species encountered in DNR fisheries surveys**, collapsed, with DNR's caveat. A surveyed species never implies that it may be taken, and the summary never calls a lake or species "fishable" or "bowfishable";
5. official links: the full LakeFinder page, and the water-level report, lake survey, fish stocking, and lake depth pages only where DNR flags that they exist, plus **Lake map (PDF)**.

Lake elevation is not shown: the API returns depth but no water-surface elevation or datum, so the summary links the water-level report instead.

The API's own notes are unfinished, so `src/lib/dnr/lakefinder.ts` checks every field and is the only code that reads the raw response. It returns one of four outcomes:

| Outcome | When | The summary shows |
| --- | --- | --- |
| found | A record for the requested DOW number with a name and a well-formed regulations list | The summary above |
| none | DNR reports no results | The lake's identity, "DNR has no LakeFinder record for this lake.", and **Search LakeFinder ↗** |
| unavailable | The request fails, returns an error status, or does not return JSON | The same view with "DNR lake data isn't responding — official links below", and links to the lake's LakeFinder page and the fishing regulations |
| changed | The response is JSON the adapter cannot read safely, such as a missing regulations list, a record for another lake, or a regulation with no text | The same as unavailable, with "DNR lake data came back in a form this app cannot read — official links below" |

None of these is an error message or toast. A missing or malformed optional field (county, depth, survey list, flags) is left out rather than failing the summary, but a regulations list that is missing or malformed is a changed schema, because leaving it out would read as "no special regulations".

The browser asks through the `dnr-lakefinder` proxy provider, which reaches only `https://services.dnr.state.mn.us/api/lakefinder/`. DNR's server redirects the address without a trailing slash, and the Worker follows it.

### Lake map PDF

When LakeFinder reports an official lake map and gives its map ID, the summary links **Lake map (PDF)** to `/api/lake-map/<sheet>.pdf`. That route streams the DNR-hosted PDF from `files.dnr.state.mn.us` and does not cache it: it asks upstream with `cache: "no-store"`, answers `Cache-Control: no-store`, and passes on neither validators nor the upstream cache headers. It accepts only a sheet name of one letter and seven digits (`src/lib/dnr/lakeMap.ts`) and exists only in the personal build.

DNR names a sheet from the map ID and a three-digit issue (`B0025` becomes `b0025010.pdf`). The API does not list issues and DNR's own page that does would have to be scraped, so the link assumes the first issue, `010`, which every lake checked has. A lake whose first issue differs gets a not-found response from the route; the summary also links DNR's own lake depth page, which lists the sheets, so no lake is left without a path to its map. `npm run smoke:dnr` checks the naming against a known lake.

### Lake depth map

**Lake depth map** is a live display of DNR's bathymetry map service: the lake outlines, depth contours, and elevation model (layers 1, 0, and 3). It is off by default and has the usual opacity control. The service's tiles cannot be exported, so nothing is stored, and the token-gated shaded-relief image service is not used.

Coverage is incomplete and historical, and the layer says so twice: on its drawer row, and in the notes of every result, as "Official coverage is incomplete and historical: not every lake is mapped, and depths may have changed since a survey. Not for navigation." The layer never claims statewide coverage.

Selecting a point asks the outline layer for the lake under it and the contour layer for lines within the click distance, and shows the lake name, DOW number, county, acres, and the contour depth in feet where a contour is near. An island polygon is not treated as a lake. The result also offers **Open lake summary**.

## The proxy provider

`dnr-gis` in `src/lib/gisProxy.ts` reaches `https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services/` and nothing else on that host. Requests with a `.` or `..` path segment are refused, and a resolved address that does not start with the provider's root is refused. The provider exists only in the personal build.

## Checks

- `npm run audit:registry` audits both builds. Every DNR layer must default off and name its source (on an official DNR or MnGeo host), attribution, meaning class, verify link (a DNR page over `https`), heading, and verification date, with a complete season rule where it has one. The public registry must contain no DNR layer, and the personal registry must contain them all. A live map service must carry a coverage warning, a layer that opens a lake summary must name its DOW attribute, and a trail freshness label must carry a verified date and a stale warning.
- `src/lib/dnr/*.test.ts` cover the season rules, the gate with stubbed services, the five independent CWD sampling checks, the wording of each class from recorded service responses (`src/lib/dnr/fixtures/`, recorded 2026-09-26), the audit, the zoom hint, the trail freshness rule, and the trail-name link tables. `lakefinder.test.ts`, `lakeSummary.test.ts`, `lakeDepth.test.ts`, and `lakeMap.test.ts` cover the LakeFinder adapter and its fixtures (a matching record, no record, a service that is down, and a changed schema), the summary layout, the verbatim regulations and the empty-list wording, the absence of "fishable" and "bowfishable" text, the depth-map identify, and the PDF that is never cached. `src/lib/gisProxy.test.ts` covers the pinned prefixes.
- `tests/e2e/dnr.spec.ts` covers the drawer, the group controls, the gate, a result, the LakeFinder summary from a fishing site and from the Lake depth map (found, no record, service down, no special regulations), the depth-map warning, the stale-freshness warning that leaves OHV and snowmobile toggleable, the Boundary Waters layer, and the routes the public build lacks. The Lakes & LakeFinder outline is not clicked there, because the map in that test environment does not report its camera height, which the outline layer's zoom gate needs; its result is covered by `describe.test.ts`. It reads `NEXT_PUBLIC_APP_MODE` and runs the personal or public half accordingly; CI runs both builds.
- `npm run smoke:dnr` queries every layer anonymously and checks its geometry, requested fields, feature count against the 2026-09-23 snapshot, a sample record, and its season. It also checks the bathymetry service's layers and record counts, and reads a live LakeFinder record through the app's own adapter and confirms the lake map PDF's file name. It also checks every configured verify/program URL and every dynamic DNR link, including all 48 RGMA PDF filenames; the five known 404s must remain unavailable or be removed from the exclusion list when DNR restores them. `.github/workflows/dnr-smoke.yml` runs it weekly and on demand. It is not part of the pull-request checks, so a change in DNR's services cannot block unrelated work.
