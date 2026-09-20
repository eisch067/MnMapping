# Questions for agencies

Concise, emailable questions, grouped by agency/county, generated from this audit's ambiguous or unresolved
findings. Not legal advice — treat responses as informing a legal review, not replacing one.

## MnGeo (Minnesota Geospatial Information Office)

1. Does the Composite ("Best Available") Image Service carry a single license covering all of its component
   sources, or does each displayed tile inherit its originating source's own terms (Landsat, NAIP, Metropolitan
   Council aerial photography, etc.)?
2. Is Metropolitan Council's contracted aerial photography, as served through the Composite service, licensed
   by MnGeo for embedding in third-party commercial web applications, including advertising-supported and paid
   products?
3. Your statewide Open Parcels service's Use and Access Constraints fields both say "None," and the ArcGIS item
   record shows `licenseInfo: "None"` — can MnGeo confirm in writing that this extends to bulk redistribution of
   the compiled statewide parcel dataset (geometry and attributes, including owner name/address/assessed value)
   inside a commercial, advertising-supported, or subscription-based third-party mapping application?
4. For a county that has opted in to the Open Parcels compilation, does that opt-in act itself constitute the
   county's consent to have MnGeo redistribute its parcel data under the "no constraints" terms stated in the
   dataset's metadata, or could an individual county still separately restrict use of its own original data in a
   way MnMapping should check independently? (Relevant specifically for Fillmore, Winona, Lake, McLeod, and
   Kanabec — see their individual county-detail pages.)
5. Does MnGeo have a position on charging end users a subscription fee to access the Open Parcels layer inside a
   third-party app, while the county-of-record and MnGeo both continue to provide the same data for free?
6. Can you confirm the current, canonical text of the MnGeo Data Disclaimer
   (`mngeo.state.mn.us/chouse/disclaimer.html`) — every attempt to fetch it during this research hit a
   bot-verification challenge?
7. For the county-owned/tax-forfeited land layer (`plan_gov_own_open`): does MnGeo or the Geospatial Advisory
   Council's Open Data Subcommittee impose any commercial-use or resale restriction on this derivative product
   beyond the generic AS-IS disclaimer, or is it intentionally unrestricted since it's compiled specifically for
   redistribution? Is there a recommended disclaimer MnGeo asks downstream publishers to display for the
   admittedly "best-effort inference" `govt_own` classification?

## Minnesota DNR

1. Does displaying live-rendered hillshade/contour layers (no persistent storage) inside a free or
   advertising-supported public web map, or inside a paid B2B/professional subscription tool, count as the data
   being "sold commercially" under the DNR General Data & Software License Agreement, or does that clause apply
   only to redistributing copies of the dataset itself?
2. Would a paid point-elevation/profile/slope/aspect tool that queries the lidar DEM live (returning computed
   values/charts but not the raw DEM) require MNDNR's written permission, or is that MnMapping software
   functionality outside the scope of the clause?
3. Does MNDNR consider a free, ad-supported public web map that displays the WMA/SNA/State Parks/AMA/State
   Forest layers live (no bulk redistribution) to be "sold... commercially" under clause 6 of the General
   Geographic Data License Agreement?
4. Is written permission required for a B2B subscription product (e.g., for foresters/surveyors) that includes
   DNR public-land layers among many others, even if no one pays specifically for that dataset?
5. Does the "Publicly Accessible WMAs" service imply DNR maintains a separate, non-public WMA layer MnMapping
   should never substitute this one for?
6. For State Parks: please confirm which of the three feature classes (reference points / statutory boundary /
   managed lands) corresponds to the specific sub-layer MnMapping currently uses.
7. For AMAs acquired as easements rather than fee title: does the "no sale without permission" clause apply
   identically, or does DNR view easement-based acquisition data differently from fee-owned management-unit
   boundaries?
8. Is the `access_wo_trespass` field on the State Forest layer maintained/updated reliably enough for MnMapping
   to use it for user-facing "can I go here" messaging?

## Esri

1. Does anonymous, unauthenticated access to `elevation3d.arcgis.com/.../Terrain3D/ImageServer` (no API key, no
   ArcGIS Online login) constitute licensed use for a public, commercial, advertising-supported third-party web
   application, or does Esri consider this out-of-policy access that could be revoked?
2. What is the current fee schedule / free-tier limit for accessing this service through an ArcGIS Location
   Platform API key, for a production commercial web mapping application?
3. Is live interactive display (no caching, no export) of this layer within the "interactive, non-programmatic
   access" language in the Product-Specific Terms of Use, and does that apply to anonymous (non-Named-User)
   access at all?

## EagleView / Pictometry (applies to ~25 counties' worth of imagery — see RISK-REGISTER.md B1)

1. Does a county's Pictometry CONNECT Image Service agreement grant any right to third parties to embed the
   imagery in independent applications?
2. Is the WMTS/WMS endpoint intended only for the county's own authorized GIS software integrations, or is it
   published as a general-purpose public API?
3. Would EagleView consider a third-party embed reportable to the county as the underlying licensee, or is there
   a standard sublicense/reseller path a third-party mapping application could apply for?
4. Specifically for Carlton, Polk, Meeker, Lac qui Parle, and Lincoln — whose layers are served directly from
   `svc.pictometry.com` rather than proxied through the county — does EagleView authorize third-party embedding
   of these specific endpoints under any terms?

## Nearmap (Dakota County)

1. Does Dakota County's Nearmap Order Form authorize "publicly accessible" use only via the county's own
   website/ArcGIS Online integration, or does it permit third-party embedding generally?
2. Would Nearmap treat a third-party app pulling tiles from the county's public-facing integration as a breach
   of the county's Order Form?
3. Is there a Nearmap reseller/API partner program MnMapping could apply for directly?

## Kucera International (Carver County)

1. Does Carver County's Kucera imagery contract permit third-party redistribution, embedding, or public display
   beyond the county's own GIS services?
2. Does Kucera retain copyright in the flown imagery, and if so, under what terms does it authorize public web
   display?

## Individual counties with unresolved or conflicting disclaimers

**Winona County** — Your GIS page states the data is "public domain" per Minn. Stat. 466.03 subd. 21, yet the
same disclaimer says the data is "not for use by third parties." Which governs for a public-facing third-party
web application? Does your opt-in to the MnGeo statewide Open Parcels aggregation carry different reuse terms
than your own posted disclaimer?

**Fillmore County** — Your GIS disclaimer states data "may not be distributed without prior signed
authorization" and users "will not convey or sell the data... to a third party." Does your county's opt-in
agreement with the MnGeo statewide Open Parcels service grant MnGeo (and its downstream consumers) reuse rights
beyond this disclaimer? Would you permit a public, ad-supported or subscription web map to display parcel
ownership name, mailing address, and assessed value sourced via the MnGeo aggregation?

**Lake County** — Your GIS page states data is "public domain" but also "restricted from use... by third
parties without authorization." Does displaying county parcel data live on a public third-party website require
that authorization, and if so how is it obtained?

**McLeod County** — Your direct-download page states data may be used only "for the requestor's own internal
business or organizational purpose... shall not... disclose the data to any third parties" without written
consent. Does this restriction travel with your parcel contribution to the statewide MnGeo Open Parcels
aggregation, or does the state's own "no constraints" language govern data accessed that way?

**Kanabec County** — Your GIS Data Sharing Policy requires a signed Data Use Agreement and fees paid before
release. Can you provide the current fee schedule and confirm whether it applies to a live, view-only web-map
display versus a bulk data export? Does the agreement permit redistribution through a public-facing commercial
website?

**Hubbard County** — Your Tax Parcels FeatureServer's `copyrightText` names the county, Recorder's Office, and
Assessor's Office as rights holders — what does this permit or prohibit for a third-party public web
application displaying this data, including in an ad-supported or paid product?

**Wadena County** — Your Data License Agreement process appears designed for discrete, fee-bearing data
requests. Does the separately-hosted live, anonymous `LinkPublic` ArcGIS REST/GeoJSON service require the same
Application/Data License Agreement, or is public live-map display already permitted without it?

**Washington County** — Your Parcel Data page states "all users... are licensees," fee-based, and "a license
agreement may be required before the data will be shipped." Does this framework apply to parcel data obtained
via the statewide MnGeo Open Parcels aggregation, or only to data requested directly from the county?

**Mower County** — Your 2023 imagery is limited to the MERC orthoimagery partnership program per county
records. Does that program permit third-party commercial web applications (not just the county's own GIS
viewer) to display the imagery?

**Redwood, Morrison, Faribault, Nicollet, Freeborn, Jackson, Blue Earth, Kandiyohi Counties** — You each sell
GIS/imagery/parcel data directly under a fee schedule or signed license agreement. Does a purchase (or a
county-published streaming service, where one exists) include any right to display or redistribute the data on
a public third-party website, including an ad-supported one?

## Schneider Geospatial (Beacon) — validation only, not a live MnMapping source

No questions needed — Schneider's own published terms are clear (automated extraction prohibited, rights
reserved in hosted third-party content) and MnMapping correctly does not query Beacon programmatically. Keep
it that way.
