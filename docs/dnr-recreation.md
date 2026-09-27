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
| Walk-In Access sites | Hunting access & habitat | `bdry_dnr_walk_in_access_sites` layer 0 | enrolled-private-land | none |
| Hunter Walking Trails | Hunting access & habitat | `trans_hunter_walking_trails` layer 0 | access-varies | none |
| Public-water access | Fishing & water access | `struc_water_access_sites` layer 0 | facility | none |
| Fishing piers & shore-fishing sites | Fishing & water access | `struc_fishing_sites_in_minnesota` layer 0 | facility | none |

All but CWD zones are on MnGeo's `enterprise.gisdata.mn.gov` under `us_mn_state_dnr`, reached through the existing `mngeo-features` proxy provider. CWD zones come from the season-specific DNR service, because that is where DNR publishes the current effective period. The layers are defined in `src/config/layers/dnrRecreation.ts`; each names its source, attribution, meaning class, verify link, heading, and the date it was last checked against DNR.

The Recreation trails and Water & regulatory reference headings hold no layer yet. They are listed with a disabled control so the five headings are always there.

## The drawer

**DNR Recreation** is one category in the Layers sheet. Its control suspends and restores the active subset across the whole collection, and each of the five headings has its own control that does the same for that heading. The rules are the ones in [Layer controls](layer-controls.md#group-controls); no control turns a layer on that the user had not. An **All opacities** slider sets every DNR layer at once.

A layer's row shows its Season label when it has one, its meaning statement, and an **Info** section with the DNR General Data and Software License Agreement text and a link to the official page. The license text appears there once per layer and is not repeated in results.

### Zoom in to load

Public-water access holds about 3,000 sites and one query returns at most 2,000, so the layer does not draw a partial set. While it is on and the camera is above 300 km, its row reads "Zoom in to load Public-water access." and nothing is drawn; closer in, the sites in view load. The layer's `maxCameraHeight` option sets the height. The live smoke fails a layer that grows past 2,000 records without one.

## The season gate

Four layers mean something only for a season: Deer permit areas, CWD zones, Bear permit areas, and Turkey permit areas. Each is **fail closed**: unless its season is verified as current, the layer stays listed but is unavailable. Its checkbox is disabled, the row reads "Season data not verified" with the last verified period and a link to the official DNR source, and nothing is drawn or identified. A "on" stored from an earlier visit is ignored, not erased, so the layer returns as it was left once its season is current.

- **Deer permit areas and CWD zones** take the season from the service. On load the app asks each service for its distinct `effperiod` values. Every value must read as a whole-month period such as "July 2026 - June 2027" that contains today. A service that cannot be reached, returns an error, publishes no period, or publishes any period that is not current leaves the layer unavailable. Until the service answers, the row reads "Checking season data…".
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

| Class | Meaning statement |
| --- | --- |
| regulation-zone | Regulation boundary — does not show ownership or permission to enter. |
| enrolled-private-land | Participating private land — WIA validation required, Sept 1–May 31, landowners may opt out. |
| facility | Marks a facility or route, not access to adjoining land or permission to take any species. |
| access-varies | Rules vary by landowner along the trail. |

The wording, the fields each layer shows, and its links are in `src/lib/dnr/meaning.ts`, `src/config/layers/dnrRecreation.ts`, and `src/lib/dnr/describe.ts`. The deer permit area report PDF is not linked, because the base address that its file names resolve against has not been verified.

## The proxy provider

`dnr-gis` in `src/lib/gisProxy.ts` reaches `https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services/` and nothing else on that host. Requests with a `.` or `..` path segment are refused, and a resolved address that does not start with the provider's root is refused. The provider exists only in the personal build.

## Checks

- `npm run audit:registry` audits both builds. Every DNR layer must default off and name its source (on an official DNR or MnGeo host), attribution, meaning class, verify link (a DNR page over `https`), heading, and verification date, with a complete season rule where it has one. The public registry must contain no DNR layer, and the personal registry must contain them all.
- `src/lib/dnr/*.test.ts` cover the season rules, the gate with stubbed services, the wording of each class from recorded service responses (`src/lib/dnr/fixtures/`, recorded 2026-09-26), the audit, and the zoom hint. `src/lib/gisProxy.test.ts` covers the pinned prefix.
- `tests/e2e/dnr.spec.ts` covers the drawer, the group controls, the gate, and a result. It reads `NEXT_PUBLIC_APP_MODE` and runs the personal or public half accordingly; CI runs both builds.
- `npm run smoke:dnr` queries every layer anonymously and checks its geometry, requested fields, feature count against the 2026-09-23 snapshot, a sample record, and its season. `.github/workflows/dnr-smoke.yml` runs it weekly and on demand. It is not part of the pull-request checks, so a change in DNR's services cannot block unrelated work.
