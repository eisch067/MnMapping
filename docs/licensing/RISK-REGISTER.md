# Risk register

Research and risk classification, not legal advice. Every item below cites the evidence behind it in
[STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md), [COUNTIES.md](COUNTIES.md), or a file under
[COUNTY-DETAILS/](COUNTY-DETAILS/). Access date for the underlying research: 2026-09-18/19.

## BLOCKER

### B1 — Vendor-flown county imagery is live in the app despite the app's own code documenting that no reuse license was found — ✅ FIXED 2026-09-19

**Status: resolved.** All 35 counties' vendor imagery listed below has been moved from live embedding to
the "External imagery" link-out pattern (same treatment as Itasca, Wright, Brown), verified end-to-end in
a running browser and by inspecting the actual network requests. `src/config/layers/counties/arcgisImagery.ts`'s
`specs` array is now empty; the hardcoded EagleView layers previously embedded directly in `northExpansion.ts`
(Carlton, Polk) and `southExpansion.ts` (Meeker, Lac qui Parle, Lincoln) were removed; every affected
county/year now has a matching entry in `src/config/restrictedImagery.ts` so it still surfaces to users as a
"View imagery ↗" link. Re-embed a county only after written permission is obtained — see the original
write-up below for what to ask.

**Note on Todd:** the first implementation pass covered `arcgisImagery.ts`, `northExpansion.ts`, and
`southExpansion.ts`, but missed Todd — its six Pictometry-attributed imagery vintages were defined entirely
inside `src/config/layers/counties/todd.ts`, a mechanism none of those three files touch. A follow-up
code-wide search for vendor names (`grep -rniE "pictometry|eagleview|nearmap|kucera"` across every county
config) caught it; it's now fixed the same way as the other 35 and independently verified in the browser.
That search is worth re-running before trusting any future "this is fully fixed" claim in this codebase.

**What's happening:** `src/config/restrictedImagery.ts` is an internal research log. For dozens of entries it
concludes a specific county imagery service — usually EagleView/Pictometry, sometimes Nearmap or Kucera — has
"no third-party reuse license" and should stay excluded. Separately, `src/config/layers/counties/arcgisImagery.ts`
(plus a handful of hardcoded entries in `northExpansion.ts`/`southExpansion.ts`) defines live layers for many of
those *exact same* services. `isIntegratedArcgisImagery()` (`arcgisImagery.ts:69-71`) matches a restricted entry
by year+county or by identical URL, and `restrictedImageryForCounty()` (`restrictedImagery.ts:605-609`) then
silently drops that entry from the app's own warning UI once a match exists. `src/config/counties.ts:25-32`
unconditionally merges every `arcgisImageryLayersForCounty()` result into the live, publicly-queryable layer
registry — there is no license gate on that merge. Net effect: the layer is fetched and rendered through
`/api/gis-proxy/...` today, and the one piece of internal documentation that would have flagged it as
unresolved has been suppressed, not resolved.

**Why it's a BLOCKER, not just a finding:** four independent research agents, working on disjoint county
batches, converged on the identical pattern without prompting each other — this is a structural bug in the
codebase's licensing-review pipeline, not a one-off oversight. It is the single largest source of legal
exposure identified in this audit, and it is already live in production-facing code today, not a hypothetical
future business model.

**Counties/layers affected (confirmed across all 10 county-batch reviews):**

| County | Layer(s) | Vendor confirmed? |
|---|---|---|
| Aitkin | 2024 Pictometry | Named in restrictedImagery.ts; not reconfirmed in service metadata |
| Crow Wing | 2025 county imagery | Not named in metadata |
| Carlton | 2024 EagleView/Pictometry WMS | **Confirmed** — "Copyright Pictometry 2024" in layer abstract |
| Todd | 6 embedded vintages | App's own attribution string says "Todd County GIS / Pictometry" |
| Grant | 2024 EagleView, 2021 & 2017 Pictometry (3 layers) | Confirmed via keywords on 2024 layer |
| Clay | 2025 EagleView ImageServer | **Confirmed** — `copyrightText: "Eagleview"` |
| Wilkin | 2026 EagleView | Confirmed via `documentInfo.Keywords` |
| Mille Lacs | 2026 flyover | Not named in metadata |
| Otter Tail | 2024 imagery | Not named (county's own GIS dept authored it) |
| Polk | 2025 EagleView WMTS | **Confirmed** — served directly from Pictometry's own domain, not the county's |
| Anoka | 5 vintages (2026/2025/2024/2020/2017) | Not named in metadata |
| Chisago | 2025 EagleView | **Confirmed** — `description: "Eagleview Aerials flown in April 2025"` |
| Sherburne | 2024 | Not named (suppressed via year-match, not URL-match) |
| Stearns | 2024 (county's *only* imagery source) | Not named |
| Washington | 2026 | Not named |
| Marshall | 2024, 2020 EagleView | Confirmed via keywords |
| Pennington | 2023 | Not named; `exportTilesAllowed:false` |
| Wadena | 2025 EagleView | Confirmed |
| Dakota | 2025 spring + fall (2 ImageServers) | **Confirmed** — `copyrightText: "Nearmap, Inc"` on the fall layer |
| Carver | 2026 Tiled Imagery | **Confirmed** — `documentInfo.Subject: "2026 Imagery - Kucera"` |
| Scott | 2026 spring ORTHO | Not named |
| McLeod | 2026 tiled | Not named |
| Steele | 2025 imagery cache | Not named |
| Big Stone | 2026 EagleView | Confirmed via URL path |
| Chippewa | 2025 EagleView | Not named in this service's own JSON, but matches a named restrictedImagery.ts entry |
| Lac qui Parle | 2024/2020/2017 EagleView WMTS (3 layers) | **Confirmed**, and never even logged in restrictedImagery.ts |
| Meeker | 2024/2018 EagleView WMTS (2 layers) | **Confirmed**, and never even logged in restrictedImagery.ts |
| Mower | 2023 (Ayres Associates, MERC partnership program) | **Confirmed** — named-program use restriction, not generic silence |
| Pipestone | 2020 Pictometry | Confirmed |
| Pope | 2023 Pictometry | **Confirmed** — identical URL to the flagged restrictedImagery.ts entry |
| Stevens | 2020 Pictometry (2026/2023 correctly stay excluded) | Confirmed |
| Dodge | 2026 imagery | Not named |
| Goodhue | 2025 EagleView | **Confirmed** — layer's own display name says "EagleView" |
| Yellow Medicine | 2025 EagleView | Confirmed via keywords |
| Lincoln | 2026/2023/2020/2017 EagleView WMTS (4 layers) | **Confirmed** — served directly from `svc.pictometry.com`, per-layer "Copyright Pictometry `<year>`" notices |

**35 counties, roughly 60 individual layers.** See [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md) "Vendor imagery"
section for the underlying vendor-terms research (EagleView's own published terms are "for internal use only...
not to reproduce or redistribute... outside of your company"; Nearmap's Master Subscription Agreement bars
"publicly accessible" use unless a specific customer Order Form says otherwise; Kucera has no located public
terms at all).

**Counties that show the correct pattern already** (vendor imagery researched, found unlicensed, and actually
kept out of the live map — the model to extend everywhere else): Itasca, Morrison, Cook, Wright, Isanti, Brown,
Renville, St. Louis, Cass, Clearwater, Houston, Fillmore, Winona, Le Sueur, Blue Earth, Cottonwood, Faribault,
Nobles, Swift, Redwood, Watonwan, Mahnomen, Douglas, Beltrami, Hubbard, Becker.

**Remediation:** either (a) obtain written, county- or vendor-specific confirmation that the public ArcGIS/WMTS
endpoint carries a sublicense for third-party commercial embedding, for each of the ~35 counties above, before
any public launch, or (b) revert all of them to link-out treatment (matching the already-correct counties) until
confirmed. As a secondary fix, `isIntegratedArcgisImagery()`/`restrictedImageryForCounty()` should stop being
able to silently suppress an unresolved restricted-imagery flag — a flagged source should require an explicit,
separate "cleared" action, not just a coincidental year/URL match in a different config file.

---

## HIGH

### H1 — Esri World Elevation 3D Terrain is used anonymously, but Esri's own terms require an ArcGIS subscription for this exact service — ✅ REMOVED 2026-09-19

**Status: resolved (source removed); a like-for-like replacement is a separate future project.**
Esri's free developer tier doesn't cover commercial apps, so the layer was removed outright from
`src/config/layers/elevation.ts` rather than paid for. **A direct swap to Minnesota's own lidar DEM was
checked and confirmed not to be a drop-in replacement**: fetching the DEM ImageServer's own metadata shows
`"capabilities": "Catalog,Image,Metadata"` with no tile cache — it lacks the "Elevation" tile-cache profile
Cesium's `ArcGISTiledElevationTerrainProvider` requires, unlike Esri's purpose-built Terrain3D service. Real
mesh-based 3D terrain from MN's own data would need either a request to MnGeo to publish an elevation-capable
service (see [QUESTIONS-FOR-AGENCIES.md](QUESTIONS-FOR-AGENCIES.md)) or new tiling infrastructure — out of
scope for this fix. The app now stays on the flat globe with the existing hillshade/contour drape for visual
relief, and the tilted "Terrain view" camera preset still works without a terrain-provider swap. Confirmed in
a running browser: the "3D terrain" section and vertical-exaggeration control disappear cleanly (they were
already conditional on a terrain layer existing), with no console errors.

### H2 — Owner name, mailing address, and assessed value are displayed for every parcel, statewide, with no field-level license distinction

The statewide MnGeo Open Parcels aggregation (the parcel source for ~59 of 87 counties) states blanket
"Access Constraints: None" / "Use Constraints: None" covering the *entire* feature class, including
`owner_name`, `owner_more`, `own_add_l1` (mailing address), and `emv_total` (assessed value) — MnGeo does not
carve out a stricter rule for these fields than for geometry. Research into the Minnesota Government Data
Practices Act (Minn. Stat. §§ 13.03, 13.44, 13.51) supports classifying these as ordinarily-public assessor
data. This is GREEN at the *statewide* level (see [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md)), but several
individual counties run their **own** stricter property-lookup systems that explicitly ban bulk/automated
extraction of this same data class — Hennepin (`propertyinformation.hennepin.us`), Wright
(`propertyaccess.co.wright.mn.us`, threatens civil/criminal penalties), Washington (own parcel-data page: "all
users... are licensees," fee-based), Nicollet (RecordEASE: "screen scraping... strictly prohibited"), Pennington
and Pine (property-search portals with data-mining prohibitions). None of these directly govern the statewide
channel MnMapping actually uses, but they are strong evidence of how each county wants this data class treated.
Direct-service counties with no field-level distinction at all include Hubbard (explicit but unreleased
copyright assertion naming the Assessor's and Recorder's Offices), Meeker, Mahnomen, Dodge, and Goodhue.

**Status: resolved for the 10 counties with the strongest signal — ✅ FIXED 2026-09-19.** Owner name, secondary
owner, mailing address, assessed value, and tax year are no longer requested at all for Hennepin, Wright,
Washington, Nicollet, McLeod, Fillmore, Winona (via a redaction list in
`src/config/layers/counties/shared.ts`'s `createMnGeoParcelLayer`), Hubbard, Meeker, and Mahnomen (edited
directly in their own county files). Parcel shape, boundary, acreage, legal description, and (where it existed)
site address are still shown. A new `recordsUrl` field on `LayerDefinition` renders as an "Ownership & tax
records — Look up on the county site ↗" link in the parcel popup instead. Verified directly against the live
upstream service for Hennepin: querying with the new reduced `outFields` list returns only `county_pin`,
`acres_deed`, `abb_legal`, `co_code` — the sensitive fields are never sent to the browser, not just hidden in
the UI. Dodge and Goodhue (owner/mailing exposure noted above) are **not yet redacted** — they were flagged as
lower priority than the 10 above and are a reasonable next step. **Remediation for other statewide-only
counties:** treat owner/mailing-address/assessed-value fields as the next candidate to suppress if the product
becomes ad-supported or paywalled; do not rely on the statewide GREEN finding to cover a county with its own
documented stricter policy.

### H3 — Minnesota DNR public-land layers bar commercial sale of the data without written MNDNR permission

All five DNR FeatureServer layers (WMA, SNA, State Parks, AMA, State Forest) are governed by the DNR's "General
Data & Software License Agreement," which states verbatim: "Although the use of these data are not restricted,
**they may not be sold commercially or privately, without the written permission of MNDNR**," plus a mandatory
attribution clause. This drives RED for a paywalled public-land layer (model F) and paid offline packages (model
H); it is ambiguous (ORANGE) for an ad-supported free site, since ad revenue is not literally "selling the data."
See [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md). **Remediation:** never paywall or offer offline-downloadable
public-land layers without MNDNR's written permission; keep live-display-only.

### H4 — The same "sold commercially... without written permission" clause applies to the statewide lidar DEM and its live-rendered hillshade/contour derivatives

Confirmed via the DNR's General Geographic Data License Agreement, which the lidar DEM's Minnesota Geospatial
Commons metadata cites as its controlling Use Constraint. Live rendering (the app's current hillshade/contour
architecture) is YELLOW; a *paid* elevation-profile/slope/aspect tool or a paywalled terrain layer is ORANGE; a
downloadable/offline hillshade or contour package is RED, and is also technically blocked
(`exportTilesAllowed:false` on the DEM service itself). See [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md).

### H5 — Nearmap- and Kucera-sourced imagery is confirmed embedded with vendor terms that squarely prohibit the use

Beyond the general B1 pattern, Nearmap's own Master Subscription Agreement explicitly requires a specific,
customer-scoped Order Form before imagery may be made "publicly accessible," and separately bars creating "an
internal or commercial imagery dataset." Nearmap's copyright notice is directly confirmed live on Dakota
County's fall 2025 ImageServer. Kucera has no located public licensing terms at all (GRAY), but Carver County's
own catalog leaves the license field blank and a third-party contract analog found elsewhere shows Kucera's
standard clause requires the county's consent before any redistribution. **Remediation:** same as B1 — pull
Dakota's two Nearmap layers and Carver's Kucera layer, or obtain written vendor/county confirmation.

---

## MEDIUM

### M1 — MnGeo's Composite ("Best Available") Image Service silently blends a non-MnGeo component

The `mncomp` layer dynamically mixes Landsat, USDA NAIP, and **Metropolitan Council's own separately-contracted
Twin Cities aerial photography** — a different regional government body's product that MnGeo hosting doesn't by
itself license for third-party redistribution. No per-tile source attribution is exposed in the WMS response, so
a client cannot apply per-source terms even if it wanted to. ORANGE. See [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md).

### M2 — Several counties' own GIS disclaimers directly contradict or narrow what MnMapping is doing, even though MnMapping's technical path is the statewide aggregator, not the county's own service

- **Winona**: county disclaimer is internally self-contradictory — "public domain" in one sentence, "not for use
  by third parties" in the next, for the *same* dataset.
- **Fillmore**: county disclaimer states data "may not be distributed without prior signed authorization" and
  the user "will not convey or sell the data... to a third party."
- **Lake County**: "public domain... restricted from use... by third parties without authorization."
- **McLeod**: county's own direct-download page states data may be used "for the requestor's own internal
  business or organizational purpose and for no other purpose... shall not duplicate or disclose the data to
  any third parties" unless authorized in writing.
- **Kanabec**: formal, signed "GIS Data Sharing Policy and Data Use Agreement," fees paid before release.

None of these counties' own restrictions are proven to travel with the data once it reaches the statewide
aggregator (MnGeo's own metadata is silent either way — see H2/statewide finding), but they are real,
county-documented positions that should be resolved by direct outreach before treating those specific counties'
data as GREEN. See [QUESTIONS-FOR-AGENCIES.md](QUESTIONS-FOR-AGENCIES.md).

### M3 — A significant fraction of counties monetize their own GIS/imagery data directly, which a MnMapping paywall on the "same" data would sit awkwardly beside

Morrison ($2,500–$4,000 countywide imagery + signed license agreement), Faribault (~$500 countywide imagery /
$100 per city, ~$50 other GIS data), Redwood ($3,000/year countywide imagery, $800/county parcels, tiered Beacon
subscription), Freeborn ($1,500 "IT Bundle" containing imagery + parcels), Nicollet ($500 countywide shapefile,
$50/mo RecordEASE with an anti-scraping clause), Jackson ($100 flat fee per dataset, signed disclaimer required),
Wadena (signed Data License Agreement, blank "FEE: $___" field), Kandiyohi (signed release form + per-request
quote), Blue Earth (license agreement + case-by-case cost estimate), Washington (own parcel product is
fee-based, licensee-gated). See per-county entries in [COUNTIES.md](COUNTIES.md) and
[COUNTY-DETAILS/](COUNTY-DETAILS/) for the ones with dedicated files.

---

## LOW

### L1 — Administrative/ownership classifications are not proof of legal public access

DNR's own metadata already distinguishes this in several places (an `access_wo_trespass` field on the State
Forest layer, an explicit statutory-boundary-vs-managed-lands split on the State Parks layer, `int_type`/
`acq_type` fee-vs-easement flags on the AMA layer), and MnGeo's county-owned/tax-forfeited layer admits its own
`govt_own` classification is "a best-effort inference... where ownership was not directly provided." This is a
disclaimer requirement, not a licensing blocker — see [ATTRIBUTION.md](ATTRIBUTION.md) for suggested wording.
MnMapping's own descriptions for these layers already do a reasonable job of this; keep it up as new counties/
layers are added.

### L2 — Cesium/Natural Earth/USGS DOQ/NAIP are clean

Natural Earth II (bundled offline) is explicitly public domain. USGS DOQ is explicitly public domain
("USGS-authored... data are considered to be in the U.S. Public Domain"). USDA NAIP has a strong public-domain
history, though USDA floated moving it to a licensed model in 2018–2019 — confirm current status before
committing to a paid/offline model built on NAIP specifically (YELLOW flag, not a blocker).

---

## UNKNOWN

- Whether an individual county's own restriction (Fillmore, Winona, Lake, McLeod, Kanabec, Wright, Hennepin,
  Washington — see M2/H2) actually travels with that county's contribution to the statewide MnGeo aggregator,
  or is legally superseded by the county's own opt-in act. MnGeo's metadata doesn't say either way.
- Current, primary-source text of the MnGeo Data Disclaimer (`mngeo.state.mn.us/chouse/disclaimer.html`) —
  every attempt to fetch it during this research hit a bot-verification challenge or a stale redirect to the
  new `gis.data.mn.gov` portal.
- Whether Minnesota's Safe at Home program (Minn. Stat. § 5B) address-suppression is consistently applied
  across all ~59 counties contributing to the statewide parcel aggregation before their data reaches MnGeo.
- The exact dollar amount and scope of several counties' bulk-data fee schedules where the PDF could not be
  machine-read this session (Wabasha's ortho-archive fee, Murray's 2026 fee schedule, Kandiyohi's GIS Data
  Pricing list, Redwood's Beacon brochure).
