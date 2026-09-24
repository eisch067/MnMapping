# LakeFinder integration surface

Verified 2026-09-23 against official Minnesota DNR LakeFinder pages, the documented LakeFinder by-ID API, and DNR datasets published through Minnesota's Geospatial Commons ArcGIS REST service.

## Decision

LakeFinder v1 is feasible as a small click-through summary:

1. Identify a clicked lake polygon through the official Public Waters Basin layer and read its eight-character DOW lake number.
2. Query the official LakeFinder by-ID API with that DOW number.
3. Show lake identity, surveyed species, special fishing regulations returned by DNR, invasive species, basic morphology/depth, and links to the official LakeFinder details.

Do not label a species **fishable** or **bowfishable** merely because it appears in `fishSpecies`. The API has no bowfishing eligibility field, and surveyed presence is not permission to take a species. Do not embed a lake-surface elevation in v1: it is not present in the documented structured metadata response. Link to the official water-level report when available.

## Click-to-summary join

Use [Public Waters Basin Delineations, layer 1](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_mn_public_waters/FeatureServer/1) as the clickable polygon index. It is an anonymous, queryable polygon layer with 21,989 features in the verification snapshot and exposes `dowlknum` (eight-character DOW lake ID), `pw_basin_name`, `acres`, `shore_mi`, classification fields, and publication dates.

The join was verified with Lake Beltrami: polygon `dowlknum=04013500` returned the same lake identity from the [LakeFinder by-ID endpoint](https://services.dnr.state.mn.us/api/lakefinder/by_id/v1/?id=04013500). Preserve leading zeroes and treat the DOW number as a string.

Not every polygon will have LakeFinder detail. The [official LakeFinder page](https://www.dnr.state.mn.us/lakefind/index.html) says it covers more than 4,500 lakes and rivers and warns that not every lake has been surveyed or depth sounded. A no-result state should therefore be normal: show polygon identity and an official LakeFinder search link, not an error.

## V1 fields

The [documented LakeFinder Search By ID API](https://services.dnr.state.mn.us/api/lakefinder/by_id/v1/usage.html) requires the eight-digit DOW ID. A verified response exposes:

| Summary content | Response fields | Presentation rule |
| --- | --- | --- |
| Identity | `id`, `name`, `county`, `county_id`, `nearest_town`, `point`, `bbox` | Display DOW ID, lake/county, and official LakeFinder link. Use the clicked coordinate for the identify marker, not the API's representative point. |
| Surveyed species | `fishSpecies` | Label **Species encountered in DNR fisheries surveys**, not fishable species. The official LakeFinder page explains this is based on the last ten years or most recent survey and may omit catchable species or include species rarely caught by anglers. |
| Special fishing rules | `specialFishingRegs[].regs[].species` and `.text`, plus location/display fields | Display verbatim as **DNR special fishing regulations**, alongside a link to the current [DNR fishing regulations](https://www.dnr.state.mn.us/regulations/fishing/index.html). An empty array does not prove that no statewide, border-water, method, or seasonal rule applies. |
| Depth/morphology | `morphology.max_depth`, `mean_depth`, `littoral_area`, `shore_length`, and `area` | Show maximum and mean depth in feet and lake area when present. Label values as DNR morphology, with missing values shown as unavailable. |
| Other useful status | `invasiveSpecies`, `notes`, `border`, and `resources` flags | Show invasive species and notes. Use resource flags only to decide which official links to offer; a flag is not the underlying report data. |

The API response uses JSON over HTTPS and returned `Access-Control-Allow-Origin: *` in the live check, so direct browser reads are technically possible. It reports `text/plain`, so the client should parse the body as JSON rather than depend on the response MIME type. The documentation's response-metadata section is unfinished, so isolate the response behind a small adapter, validate every field, tolerate missing/changed fields, and keep a link-only fallback.

## Elevation

The structured by-ID response provides depth but no water-surface elevation or datum. Its `resources.waterLevels` flag only says a report exists. The official LakeFinder water-level page can contain readings, ordinary high-water elevation, and datum for some lakes (for example, [Lake Beltrami's report](https://www.dnr.state.mn.us/lakefind/showlevel.html?downum=04013500)), but no documented structured water-level API was found.

Therefore v1 should:

- show **Max depth** and **Mean depth** from the by-ID response;
- show **Water-level/elevation report ↗** when `resources.waterLevels` is true;
- not scrape the HTML report or present a DEM sample as the lake's legal/observed elevation;
- defer embedded elevation until DNR confirms a supported structured source and the app can preserve the vertical datum and observation date.

## Deferred richer capabilities

Official services exist, but their coverage and payloads warrant separate implementation/performance work:

- [Lake Basin Morphology, layer 1](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_basin_morphology/FeatureServer/1) is an anonymous polygon service keyed by `dowlknum`, with maximum/average depth, area, volume, shoreline, slope, fetch, and littoral metrics. It can supplement the by-ID response later but is unnecessary for the first summary.
- [Lake Bathymetry MapServer](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_bathymetry/MapServer) publishes queryable contour lines (layer 0), outlines (layer 1), metadata footprints (layer 2), and an elevation-model layer (layer 3). Verification found 46,306 contour features, 7,499 outline features, and 1,305 metadata features; these are record counts, not counts of fully mapped lakes. `exportTilesAllowed` is false.
- [Lake Bathymetric Shaded Relief ImageServer](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_bathy_shaded_relief/ImageServer) supports image display/metadata/mensuration but does not allow tile export. Treat it as a later live-display experiment, not an offline asset source.
- Full lake-survey, stocking, water-quality, clarity, fish-consumption, and aquatic-plant reports remain official outbound links in v1. The [LakeFinder overview](https://www.dnr.state.mn.us/lakefind/index.html) identifies multiple contributing agencies and notes publication delays, so reproducing all reports would require separate schema, licensing, freshness, and ownership verification.

## Fishing and bowfishing meaning

`fishSpecies` is evidence that DNR surveys encountered a species; it is not a current legal classification. `specialFishingRegs` is useful authoritative content for listed lake-specific exceptions, but the absence of an entry is not a legal conclusion. The verified response contains no field that states whether a species may be taken by bowfishing or another method.

Accordingly, the summary may say **Surveyed species** and **Special fishing regulations**, but it must not generate **fishable** or **bowfishable** badges. Provide the current regulation link and only add method-specific claims later if DNR supplies a current authoritative structured rule source.

## Licensing and resilience

The [LakeFinder overview](https://www.dnr.state.mn.us/lakefind/index.html) states that DNR retains copyright in lake maps and requires users of lake information commercially to accept the [DNR General Data and Software License Agreement](https://www.dnr.state.mn.us/sitetools/data_software_license_plain.html). That agreement requires DNR acknowledgment, restricts commercial display/distribution of the data in its entirety, disclaims currency and accuracy, and says geographic data do not establish legal boundaries or legal access.

For the current private personal program, use live calls, attribute Minnesota DNR, cache only for normal resilience rather than bulk redistribution, and retain official links. Revisit permission before any paid, ad-supported, public, or offline LakeFinder/bathymetry product.

## Sources

- [LakeFinder overview and limitations](https://www.dnr.state.mn.us/lakefind/index.html)
- [LakeFinder Search By ID API documentation](https://services.dnr.state.mn.us/api/lakefinder/by_id/v1/usage.html)
- [Public Waters Basin Delineations](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_mn_public_waters/FeatureServer/1)
- [Lake Basin Morphology](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_basin_morphology/FeatureServer/1)
- [Lake Bathymetry service](https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_bathymetry/MapServer)
- [DNR General Data and Software License Agreement](https://www.dnr.state.mn.us/sitetools/data_software_license_plain.html)
