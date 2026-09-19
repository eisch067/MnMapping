# North region implementation status

Verified 2026-09-14 against the official MnGeo imagery capabilities and Open Parcels services.

All 43 counties assigned to the v1.0 North zone are recognized through the shared county registry. Statewide imagery, terrain, hillshade, and public-land layers remain available in every county. County imagery is included only when its named MnGeo WMS layer and published coverage could be verified; vague references to county viewers or unverified services were left out.

## Batch status

| Batch | Counties | Result |
| --- | --- | --- |
| N1 | Aitkin, Benton, Carlton, Crow Wing, Itasca, Mille Lacs, Morrison, Otter Tail | Complete. Verified named imagery where available; parcels use a direct Aitkin service or MnGeo Open Parcels. |
| N2 | Clay, Polk, Wilkin, Grant, Cook | Complete. Verified regional imagery coverage and MnGeo Open Parcels. |
| N3 | Anoka, Hennepin, Ramsey, Washington, Wright, Sherburne, Isanti, Chisago, Stearns | Complete. Verified Metro and east-central imagery; parcels use one normalized MnGeo adapter. |
| N4 | St. Louis, Lake, Cass, Clearwater, Mahnomen, Red Lake | Complete. Verified named regional imagery and coverage; Mahnomen now uses its official anonymous parcel service. |
| N5 | Kanabec, Kittson, Koochiching, Lake of the Woods, Marshall, Norman, Pennington, Pine, Roseau, Wadena | Complete with the parcel exceptions below. Every county remains usable with statewide layers. |

## Deferred parcel integrations

These counties are recognized and retain statewide imagery, terrain, hillshade, and public-land coverage, but expose no parcel toggle:

- Kanabec
- Kittson
- Pine
- Roseau

MnGeo's metadata layer lists each county, but its Open Parcels polygon layer returned no records for its county FIPS code at verification time. No other repeatable public query service was verified for these four counties. They remain explicitly `pending`; no viewer scraping, expiring download URL, or access-control workaround was added. Beltrami, Mahnomen, and Wadena were removed from this list on 2026-09-14 after stable official services were verified.

## Parcel implementation

Thirty-one expansion counties use layer 1 of the statewide MnGeo Open Parcels FeatureServer. Each adapter filters by the five-digit county code and every request is also bounded to the visible map extent. The shared mapping exposes county parcel ID, owner names, first mailing-address line, deeded acres, abbreviated legal description, estimated market value, and tax year when supplied by the county.

Aitkin, Beltrami, Douglas, Hubbard, Mahnomen, Todd, and Wadena use verified direct county adapters. Becker uses the repeatable statewide adapter. Parcel layers are disabled by default and load only below 35 km camera height.

## Imagery implementation

The September 18–19 follow-up audits added Grant County's public 2024 EagleView and 2021/2017 Pictometry MapServers, Marshall County's public 2024 EagleView and 2020 MapServers, Wadena County's public 2025 EagleView MapServer, and Wilkin County's public 2026 EagleView MapServer. Grant, Marshall, and Wilkin use native Web Mercator tiles; Wadena uses dynamic export because its cache is in a county coordinate system. Official viewers now link dated external history for Kanabec, Kittson, Lake of the Woods, Norman, and Pine. Roseau remains recency-unverified, while Red Lake remains the sole statewide-only county.

The expansion uses verified active MnGeo layers including 2025 Metro, 2024 Lake, 2021/2019 Carlton, 2020 Koochiching and Ramsey, 2018 Itasca and Hennepin, 2015 northern-border and Carlton, 2014 Polk–Beltrami, 2013 North 1-foot and Washington, 2012/2011 fall, 2010 north-metro, and 2009 Arrowhead/north-central coverage. Each definition retains the WMS-published coverage rectangle so partial regional imagery is not described or requested as countywide.

The September 18 service audit added anonymous county imagery services for Aitkin, Anoka, Cass, Chisago, Clay, Clearwater, Crow Wing, Grant, Mille Lacs, Otter Tail, Pennington, Polk, Pope, Sherburne, Stearns, Traverse, and Washington. Polk's 2025 EagleView mosaic uses its public `GoogleMapsCompatible` WMTS endpoint; cached ArcGIS Web Mercator services use native tiles, while county-coordinate-system and uncached services use dynamic export.

County-specific imagery that was only mentioned through an interactive county map, download, or an unspecified DNR vintage was skipped until a stable service name and coverage can be verified.
