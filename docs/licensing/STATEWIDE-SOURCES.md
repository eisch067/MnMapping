# Statewide sources

Research and risk classification, not legal advice. Access date for all findings: 2026-09-18/19 unless
noted. "Confidence" in each write-up follows: explicit permission / reasonable inference / ambiguous /
explicit prohibition / no information found. See [RISK-REGISTER.md](RISK-REGISTER.md) for how these roll up
into blockers, and [MONETIZATION.md](MONETIZATION.md) for how each source maps onto business models A–H.

## Summary table

| Source | Agency | Personal | Public Free | Ads | Ad Removal | Paid Features | Paywall Layer | Cache | Redistribute | Attribution | Risk | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MnGeo Composite ("Best Available") | MnGeo (hosts Landsat/NAIP/Met Council components) | YES | YES WITH CONDITIONS | ORANGE | unclear | GREEN | ORANGE | live only | not addressed | "MnGeo Composite Image Service" | ORANGE | GetCapabilities silent on fees/constraints; Met Council component unverified |
| MnGeo NAIP WMS (2019–2025 + CIR) | USDA FSA, hosted by MnGeo | YES | YES | GREEN | probably allowed | GREEN | YELLOW | live/bulk OK | probably allowed | "USDA Farm Service Agency via MnGeo" | GREEN (YELLOW flag on NAIP's long-term licensing status) | Federal public-domain history; USDA floated a licensed model 2018–19, current status not independently reconfirmed |
| 1991 USGS DOQ | USGS, hosted by MnGeo | YES | YES | GREEN | clearly allowed | GREEN | GREEN | live/bulk OK | GREEN | "USGS Digital Orthophoto Quadrangles via MnGeo" | GREEN | "USGS-authored... data are... in the U.S. Public Domain" (USGS policy, quoted) |
| Natural Earth II (bundled offline) | Natural Earth / CesiumJS | YES | YES | GREEN | clearly allowed | GREEN | GREEN | n/a (bundled) | GREEN | not required | GREEN | "No permission is needed to use Natural Earth... crediting the authors is unnecessary" |
| ~~Esri World Elevation 3D Terrain~~ — **removed 2026-09-19** | Esri (visualization only, not authoritative) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a — source no longer used | Removed rather than paid for; see write-up below for why a direct MN-DEM swap wasn't possible |
| Statewide 2nd-gen lidar DEM (MnTOPO) | MnGeo + MN DNR | YES | YES WITH CONDITIONS | YELLOW (live render only) | probably allowed | GREEN | ORANGE | live only; `exportTilesAllowed:false` | RED without MNDNR written permission | required: "MNDNR must be acknowledged as having contributed data" | YELLOW (live) / RED (offline) | DNR License Agreement: "may not be sold commercially or privately, without the written permission of MNDNR" |
| DNR public land (WMA/SNA/Parks/AMA/State Forest) | MN DNR | YES | YES WITH CONDITIONS | ORANGE | unclear | GREEN | RED | live only | RED without MNDNR permission | required, same DNR clause | ORANGE | Same DNR License Agreement clause as the DEM |
| MnGeo county-owned/tax-forfeited land | MnGeo | YES | YES WITH CONDITIONS | ORANGE | probably allowed | GREEN | ORANGE | live preferred | GRAY | not specified | ORANGE | No DNR-style clause found; generic AS-IS disclaimer; `govt_own` admitted to be "best-effort inference" |
| Statewide Open Parcels (`plan_parcels_open`) | MnGeo (opt-in county compilation) | YES | YES | GREEN | clearly allowed | GREEN | YELLOW | GREEN | GREEN (bulk GeoPackage/FGDB download is the state's own published distribution channel) | not required, but MnMapping's own attribution string is good practice | GREEN | FGDC metadata: "Access Constraints: None" / "Use Constraints: None"; ArcGIS item `licenseInfo: "None"`; independently corroborated twice |
| EagleView / Pictometry (vendor, licensed to ~25 counties) | EagleView Technologies | YES WITH CONDITIONS | NO | RED | prohibited | GREEN (unrelated features only) | RED | RED | RED | does not cure the missing license | RED | "for internal use only, and not to reproduce or redistribute... outside of your company" (published Terms of Use) |
| Nearmap (vendor, licensed to Dakota) | Nearmap | UNCLEAR | NO | RED | prohibited | GREEN (unrelated) | RED | RED | RED | required where authorized, doesn't cure this | RED | MSA §2.2: customer may not "make the Products publicly accessible" absent a specific Order Form |
| Kucera International (vendor, licensed to Carver) | Kucera International | UNCLEAR | UNCLEAR | GRAY | unclear | GREEN (unrelated) | GRAY | GRAY | GRAY | not specified | GRAY | No company-wide published terms located; one out-of-state contract analog requires county consent before disclosure |
| Schneider Geospatial / Beacon (not a live MnMapping source, evaluated to validate internal docs) | Schneider Geospatial | YES (interactive browsing) | NO (automated access) | RED | prohibited | n/a | RED | RED | RED | n/a | RED | "The use of robots, screen scraping or other data mining tools... is prohibited"; reserves rights in "content... provided... by agreement of local government jurisdictions" |

---

## MnGeo Composite Image Service ("Best Available")

- **What it is:** a dynamic, scale/location-dependent mosaic (`mncomp` layer, `imageserver.gisdata.mn.gov/cgi-bin/mncomp`)
  that automatically switches among Landsat (1999–2002), USDA FSA NAIP (current year, MN + western WI), and
  **Metropolitan Council's own separately-contracted** Twin Cities metro aerial photography (flown 1997–2020).
- **Evidence:** WMS `GetCapabilities` (fetched in full) has no `<Fees>` or `<AccessConstraints>` element anywhere
  in the document — silence, not a permissive statement. No per-tile source attribution is exposed, so a client
  cannot apply per-source terms even if it wanted to.
- **Risk:** ORANGE. The Landsat and NAIP components are individually low-risk (see below), but the Metropolitan
  Council component is a separate government body's own product that MnGeo merely hosts/composites — that does
  not by itself establish a sublicense for third-party redistribution (this is the same "hosting ≠ licensing"
  pattern that dominates the county-vendor-imagery findings; see [RISK-REGISTER.md](RISK-REGISTER.md) B1).
- **Recommendation:** confirm with MnGeo and/or Metropolitan Council before relying on Twin-Cities-metro-scale
  detail from this specific layer in a paywalled or offline product; live display everywhere else is reasonable.

## MnGeo NAIP WMS (statewide National Agriculture Imagery Program)

- USDA Farm Service Agency imagery, natural color + color-infrared, 2019/2021/2023/2025 vintages, hosted live by
  MnGeo (`imageserver.gisdata.mn.gov/cgi-bin/wmsll`, layers `fsa2019`…`fsa2025` and `*cir`).
- **Evidence:** capabilities document silent on fees/constraints, same as the composite service above. NAIP has a
  long public-domain history; USDA proposed a "Commercial-Off-The-Shelf" licensed model in 2018–2019 due to a
  funding shortfall, and current secondary-source reporting says NAIP "remains freely available... and maintains
  its public domain status" as of the most recent (2025) acquisition cycle — but no primary USDA/FSA legal terms
  page was independently fetched to confirm this is still true today.
- **Risk:** GREEN, with a YELLOW flag: confirm NAIP's current licensing status directly with USDA/FSA before
  committing a paid or offline-package business model (F/H) to it long-term.

## 1991 USGS Digital Orthophoto Quadrangles

- Historical black-and-white federal imagery, same `wmsll` WMS, layer `doq`.
- **Evidence:** USGS's own general copyright/credit policy, fetched directly: **"USGS-authored or produced data
  and information are considered to be in the U.S. Public Domain."** (Not all USGS *website* content is public
  domain — some photos are separately copyrighted — but this doesn't apply to the standard DOQ raster product.)
- **Risk:** GREEN across every business model, including redistribution and offline packaging. Attribution is
  requested, not legally required ("Credit: U.S. Geological Survey").

## Natural Earth II (bundled offline basemap)

- Public-domain cartographic dataset shipped as a static asset with CesiumJS; not fetched live from any remote
  service at runtime.
- **Evidence:** Natural Earth's own Terms of Use: **"All versions of Natural Earth raster + vector map data...
  are in the public domain... No permission is needed to use Natural Earth. Crediting the authors is
  unnecessary."**
- **Risk:** GREEN across every business model.

## Esri World Elevation 3D Terrain — ✅ REMOVED 2026-09-19

**This source is no longer used by MnMapping.** It was removed from `src/config/layers/elevation.ts` rather
than paid for, since Esri's free developer tier doesn't cover commercial apps. A direct swap to Minnesota's
own lidar DEM was checked and confirmed not to be a drop-in replacement: the DEM ImageServer's own metadata
reports `"capabilities": "Catalog,Image,Metadata"` with no tile cache, lacking the "Elevation" tile-cache
profile Cesium's `ArcGISTiledElevationTerrainProvider` requires. Real mesh-based 3D terrain from Minnesota's
own data would need either a request to MnGeo to publish an elevation-capable service (see
[QUESTIONS-FOR-AGENCIES.md](QUESTIONS-FOR-AGENCIES.md)) or new tiling infrastructure — a separate future
project, not part of this fix. The app now stays on the flat globe with the existing hillshade/contour drape
for visual relief; the "3D terrain" panel and vertical-exaggeration control disappear cleanly since they were
already conditional on a terrain layer existing, and the tilted "Terrain view" camera preset still works.
The research below is retained as the record of why this source was removed.

- Was used *only* for coarse 3D visualization terrain — never MnMapping's authoritative elevation data
  (that's the statewide lidar DEM, below). `elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer`,
  accessed with no API key and no login prompt.
- **The "technically accessible ≠ licensed" case study of this whole audit.** Esri's own FAQ for this exact
  service family: **"These image services are free for users with an ArcGIS Online subscription account,"** and
  **"Connecting client software to the World Elevation services requires authentication (login and password)
  using an ArcGIS Online subscription account,"** directing commercial users to the Esri Master Agreement.
  Esri's Web Site and Service Terms of Use define "Commercial Use" broadly (any use for "commercial advantage or
  private financial gain") and gate it behind payment. The Product-Specific Terms of Use (E300, footnote 96, for
  ArcGIS Image services): **"Customer may use ArcGIS Image services for interactive, non-programmatic access by
  Named Users only. Programmatic use... or exporting volumes of data larger than 10MB at a time [is] not
  permitted."** Esri also reserves the right to "change, alter, or discontinue" free anonymous access at will.
- **Risk:** RED for ads/paid-ad-removal/paywall/B2B/offline-package business models as currently configured
  (anonymous, no subscription); ORANGE even for a free public site, since continued anonymous access is not
  contractually guaranteed.
- **Recommendation:** obtain an ArcGIS Location Platform API key (a free tier exists) before public launch, or
  swap this visualization-only layer for a different terrain source (the app's own authoritative lidar DEM,
  USGS 3DEP, or Cesium World Terrain via Cesium ion) to avoid Esri's commercial terms entirely.

## Statewide second-generation lidar DEM (MnTOPO / MnGeo ImageServer)

- 0.5 m bare-earth DEM, 2021–2024 acquisition, `enterprise.gisdata.mn.gov/agsimg/.../2nd_Generation_Seamless_Lidar_DEM/ImageServer`.
  Used for a live server-rendered hillshade and dynamically-generated 10 ft/2 ft contours — no download, no
  persistent cache.
- **Evidence:** Minnesota Geospatial Commons metadata: Access Constraints **"All data is in the public domain
  and there are no access constraints"**; Use Constraints defers to a Disclaimer field pointing to two governing
  documents. The controlling one, the **DNR General Data & Software License Agreement** (full text recovered
  from a sibling DNR page, corroborated independently): **"Although the use of these data are not restricted,
  they may not be sold commercially or privately, without the written permission of MNDNR,"** plus a mandatory
  acknowledgement clause. The service itself technically enforces part of this: `exportTilesAllowed: false`
  (bulk tile-package export is blocked at the ArcGIS Server level), while `allowRasterFunction: true` supports
  exactly the kind of live hillshade/contour rendering MnMapping already does. MnGeo licenses its own
  hillshade *derivative* of this same DEM under the identical Access/Use Constraints as the raw data — useful
  precedent that a derived visualization isn't held to stricter terms than the source.
- **Risk:** YELLOW for live rendering (current architecture) in a free or ad-supported product, with
  attribution and no persistent caching. ORANGE for a *paid* feature whose core value is the elevation data
  itself (a paid elevation-profile/slope/aspect tool, or a paywalled terrain layer) — this plausibly falls
  closer to "selling the data" than to generic software functionality. RED for downloading/redistributing/
  offline-packaging the DEM or a derived raster (paid hillshade tile packages, bulk contour exports) without
  DNR's written permission — both the license text and the service's own technical configuration point the
  same direction.
- **Attribution required:** yes — "MNDNR must be acknowledged as having contributed data to the development of
  the product" (DNR License Agreement, exact wording).

## Minnesota DNR public-land layers (WMA, SNA, State Parks, AMA, State Forest)

- Five FeatureServer layers under `us_mn_state_dnr`, all auto-published from the same Minnesota Geospatial
  Commons pipeline, all carrying empty `copyrightText`/`description` at the ArcGIS REST level.
- **Evidence:** every metadata record states Access Constraints "None" and Use Constraints pointing to the same
  DNR General Geographic Data License Agreement quoted above — full text recovered from a sibling DNR page
  (`dnr.state.mn.us/wmas/kml/license.html`): grant is "non-exclusive, non-sublicensable"; **"they may not be sold
  commercially or privately, without the written permission of MNDNR"**; mandatory attribution.
- **The administrative-boundary-vs-public-access distinction is directly agency-documented here, not inferred:**
  the State Forest layer carries an `access_wo_trespass` field ("Access open to public" vs. "Access closed to
  public"); the State Parks layer explicitly separates "statutory boundary" polygons (which "do not imply
  management or ownership... by the State") from "managed lands" polygons; the AMA layer's `int_type`/`acq_type`
  fields show some acquisitions are easements, not fee title. Surface this distinction in the UI wherever these
  layers are shown — see [ATTRIBUTION.md](ATTRIBUTION.md).
- **Risk:** ORANGE. Free live display with attribution is reasonably safe; paywalled access (model F), a B2B
  subscription built around this data (model G), or an offline package (model H) all require MNDNR's written
  permission under the plain text of the license clause above.

## MnGeo county-owned & tax-forfeited land layer

- `us_mn_state_mngeo/plan_gov_own_open`, a *different* agency/license regime than the DNR layers above — no
  reference to the DNR License Agreement was found anywhere in this dataset's own metadata.
- **Evidence:** the ArcGIS Online item description carries only a generic AS-IS/no-warranty disclaimer plus the
  standard "NOT suitable for accurate boundary determination" caveat. No commercial-use or resale restriction
  was found either way — genuinely GRAY/ORANGE, not GREEN by default. **Notably, the item description itself
  admits `govt_own` is "a best-effort inference of government ownership... where ownership was not directly
  provided"** — the classification is explicitly uncertain, independent of whatever it implies about physical
  access (owning land as "County Fee" or "Tax Forfeit" doesn't mean the public may enter it; recreational access
  to tax-forfeited land specifically depends on a county "conservation" classification under Minn. Stat. ch.
  282, which this dataset doesn't encode).
- **Risk:** ORANGE. No commercial-use restriction was found (a more permissive posture than the DNR layers), but
  none was affirmatively granted either. The disclaimer risk (inferred classification, boundary ≠ access) is
  higher than any DNR layer and should be surfaced prominently wherever this layer is shown.
- **A latent future risk, not a current one:** the item description invites joining this layer to a companion
  "opt-in open parcel" dataset via `objectid` — that companion dataset carries full owner/taxpayer-name fields.
  This layer's own schema (currently `objectid`, `parcel_oid`, `county_pin`, `co_code`, `co_name`, `govt_own`)
  has no owner/tax PII today; flag any future join as its own licensing question.

## Statewide Open Parcels (`plan_parcels_open`) — the single most consequential source in the audit

Parcel geometry AND owner/tax attributes for roughly 59 of Minnesota's 87 counties flow through this one
service. Deserves, and got, the deepest research pass in this audit.

- **What it actually is:** *not* a single MnGeo-authored dataset. A non-spatial metadata table inside the same
  service (`layer 0`, queried directly) proves it is a deliberate, quarterly, **opt-in** compilation: 59 of 87
  counties have `gac_open_approval: true` and a live `data_url` pointing at that county's own portal; 28 counties
  are present in the roster but flagged `false`, with no data at all — they are simply absent, not present under
  different terms. The FGDC metadata record states this explicitly: *"This dataset is a compilation of county
  parcel data from Minnesota counties that have opted-in for their parcel data to be included in this
  dataset,"* and separately warns that general county "open data" status and opting in to *this specific*
  compilation are not the same thing.
- **Evidence, independently corroborated twice:** the full FGDC/Minnesota Geographic Metadata Guidelines record
  states, verbatim, **Access Constraints: "None"** and **Use Constraints: "None."** A second, independent
  endpoint — the ArcGIS Online item's Sharing REST API record — separately confirms **`licenseInfo: "None"`**,
  `access: "public"`. The dataset is explicitly designed for bulk distribution: it's downloadable as a full
  statewide Esri File Geodatabase or OGC GeoPackage directly from the state's own Commons infrastructure
  (no shapefile option "because the size of the dataset exceeds the limit for that format").
- **Fields exposed** (confirmed against the live schema and against what MnMapping's `shared.ts` actually
  requests): `owner_name`, `owner_more` (secondary owner), `own_add_l1` (mailing address), `acres_deed`,
  `abb_legal`, `emv_total` (assessed value), `tax_year`. The same blanket "None"/"None" constraints cover this
  entire feature class — MnGeo does not carve out a stricter rule for these attribute columns than for geometry.
- **Minnesota Government Data Practices Act (MGDPA) background** (Minn. Stat. ch. 13, researched as context,
  not as a source-specific license): § 13.03 establishes a general public-data presumption with no
  purpose-based or commercial-use restriction on access, and does not require a requester to state a purpose.
  § 13.44 (property data) classifies only pre-decisional acquisition/condemnation appraisals as
  nonpublic — not ordinary assessed-value fields. § 13.51 (assessor's data) classifies only MLS-sourced sales
  data and income-property assessment detail as private — not owner name, mailing address, or standard
  estimated-market-value fields. None of the fields MnMapping actually surfaces fall inside those carve-outs on
  their face.
- **Disclaimers present:** the standard Minnesota "AS IS"/no-warranty text, plus **"This dataset is NOT suitable
  for accurate boundary determination. Contact a licensed land surveyor if you have questions about boundary
  determinations,"** and a data-currency caveat ("Users should consult County websites to see the most
  up-to-date and complete parcel data").
- **Risk:** GREEN for both geometry and owner/tax attributes, with two operational caveats: (1) always surface
  the no-warranty/boundary-accuracy disclaimer in the UI, and (2) treat paywalling this specific layer (model F)
  as a *product/business* risk rather than a legal one — the same data is freely available directly from the
  state and from most contributing counties, so a paywall mainly risks users bypassing it, not a licensing
  violation.
- **A genuine open question, not resolved by this research:** whether a county's own stricter local disclaimer
  (Fillmore, Winona, Lake, McLeod, Kanabec — see [RISK-REGISTER.md](RISK-REGISTER.md) M2) survives that county's
  opt-in to this state compilation, or is superseded by it. MnGeo's own metadata doesn't say. See
  [QUESTIONS-FOR-AGENCIES.md](QUESTIONS-FOR-AGENCIES.md).
- **Not resolved this session:** the current, primary-source text of the MnGeo Data Disclaimer
  (`mngeo.state.mn.us/chouse/disclaimer.html`) — blocked by a bot-verification challenge on every attempt.

## Vendor imagery licensed to individual counties (EagleView/Pictometry, Nearmap, Kucera)

Dozens of Minnesota counties fly imagery through commercial vendors, then expose it via their own public
ArcGIS REST/WMTS endpoints. This is evaluated once here because the vendor-level terms are the same regardless
of which county's portal is doing the hosting; see [RISK-REGISTER.md](RISK-REGISTER.md) B1 for the full list
of the 36 counties where this vendor imagery was *live-embedded* in MnMapping as of this research. **As of
2026-09-19 none of it is embedded anymore** — every one of those 36 counties now shows its vendor imagery as
an external "View imagery ↗" link instead, matching the pattern already used for Itasca, Wright, and Brown.
The vendor-terms research below stands regardless: it's what to check before ever re-embedding one of these
sources with permission.

- **EagleView / Pictometry** ("Pictometry CONNECT Image Service"): EagleView's own published Terms of Use,
  fetched directly: **"Eagleview Technologies hereby grants to you a non-exclusive, non-transferable license to
  use the Copyrighted Materials... You agree to use the Copyrighted Materials for internal use only, and not to
  reproduce or redistribute the Copyrighted Materials outside of your company... You may not otherwise
  reproduce, copy, modify, transfer or distribute the Copyrighted Materials in any form, for any purpose."**
  This is materially identical to the "internal use only" clause MnMapping's own team already found in Brown
  County's EagleView order form — confirming it's EagleView's standard boilerplate, not a one-off county term.
  A WMTS/WMS `GetCapabilities` document reporting `<Fees>none</Fees>` / `<AccessConstraints>none</AccessConstraints>`
  describes whether the *OGC transport-layer call* costs money or needs a login — it is not, and cannot be, a
  substitute for this separate copyright license, and several fetched capabilities documents carry an explicit
  per-layer "Copyright Pictometry `<year>`" notice in the same breath as "no access constraints." **Risk: RED**
  across every business model except MnMapping's own unrelated software features.
- **Nearmap**: fetched both the free-tier Website Terms of Use and the Master Subscription Agreement (the
  contract type an actual county customer would hold). MSA §2.2: customer shall not, "unless otherwise stated in
  an Order Form, make the Products publicly accessible or viewable," nor "create an internal or commercial
  imagery dataset... composed principally of the Nearmap Data." Public accessibility is a narrow,
  customer-specific exception requiring a specific Order Form — not a default right that flows through to any
  third party who finds the endpoint. Confirmed live on Dakota County's Fall 2025 ImageServer:
  `copyrightText: "Nearmap, Inc"`. **Risk: RED.**
- **Kucera International**: no company-wide published Terms of Use or licensing policy was located anywhere
  (unlike EagleView and Nearmap, which both publish a standard public terms page). The one located contract
  analog (a non-Minnesota county) requires the county's consent before the imagery/map data is provided "to any
  party other than" the county. Carver County's own catalog item — the county using Kucera imagery in this
  audit — leaves its license and access-information fields blank. **Risk: GRAY**, i.e. `NO EXPLICIT LICENSE
  FOUND` — do not treat the absence of published terms as permission.
- **Schneider Geospatial / Beacon** (evaluated to validate an existing internal MnMapping documentation claim,
  not because MnMapping currently pulls data through Beacon): Schneider's own Software Terms, fetched directly:
  **"The use of robots, screen scraping or other data mining tools, scripts, or other data gathering and
  extraction techniques is prohibited,"** and the site's content is "owned by Schneider Geospatial and/or
  provided to Schneider Geospatial by agreement of local government jurisdictions; Schneider Geospatial
  expressly reserves all rights related to such content." This directly confirms MnMapping's own existing docs
  claim. **Risk: RED** for any automated/programmatic access to Beacon — MnMapping correctly does not proxy or
  scrape it today; keep it that way.

### Assessment of the counties already integrating EagleView WMTS layers directly from the vendor's own server (Carlton, Polk, Meeker, Lac qui Parle, Lincoln)

These ten layers are architecturally different from the other 30 counties in the B1 finding: they point at
`svc.pictometry.com` directly — EagleView's own infrastructure, not a county-controlled endpoint — addressed by
an opaque per-county GUID and per-flight license-style layer identifiers (e.g. `PICT-MNLINC26-Jf5kHa0zly`). The
justification recorded in the app's own code for integrating them ("the public WMTS capabilities report no fees
or access constraints") answers a different, narrower question (is the transport call free/anonymous?) than the
one that actually matters (does EagleView or the county authorize a third party to redistribute the imagery?).
Every one of these five counties' layers is classified **RED** for the same reason the rest of B1's EagleView
layers are, with additional weight: this pattern is not even logged as a risk anywhere in the codebase for Lac
qui Parle or Meeker, unlike the other 30 counties where at least the concern was written down and then
overridden.
