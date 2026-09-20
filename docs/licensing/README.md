# MnMapping licensing audit

A source-by-source and county-by-county audit of licensing, redistribution, attribution, and commercial-use
risk for the MnMapping Minnesota map viewer, covering every statewide/agency source and all 87 counties.
Research completed 2026-09-18/19 by parallel research passes against live service metadata, agency terms pages,
and Minnesota statutes, cross-referenced against the app's own source code
(`src/config/layers/`, `src/config/restrictedImagery.ts`).

**This is a research and risk-classification exercise, not legal advice.** Where terms are ambiguous or
unconfirmed, this audit says so explicitly rather than guessing in either direction — see the confidence level
attached to every finding in [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md) and [COUNTIES.md](COUNTIES.md).
Confirm anything you plan to rely on commercially with the data owner or an attorney before launch.

## The headline finding — and its fix

The single largest risk in this audit wasn't ambiguous licensing language — it was a **structural bug that had
been live in the codebase.** MnMapping's own team had previously researched dozens of county aerial-imagery
services and correctly concluded many lack a third-party reuse license (recorded in
`src/config/restrictedImagery.ts`). But a separate config file
(`src/config/layers/counties/arcgisImagery.ts`) independently defined live layers for many of those *exact
same* services, and a matching function silently dropped the "unlicensed" warning from the app's UI the moment
that happened — without the underlying license question ever being resolved. The result: vendor-flown imagery
(mostly EagleView/Pictometry, plus Nearmap in Dakota County and Kucera in Carver County) was being fetched and
rendered live in the public map for 35 of Minnesota's 87 counties, roughly 60 individual layers, despite the
app's own prior research saying not to do this.

**This has been fixed (2026-09-19).** All 35 counties' vendor imagery now shows the same way Itasca's, Wright's,
and Brown's already did — as an "External imagery" link that opens the county's own map in a new tab, instead
of being copied into MnMapping. Two related items were fixed alongside it: the 3D terrain layer, which relied
on an Esri service requiring a paid subscription MnMapping didn't have, was removed (a true replacement using
Minnesota's own elevation data turned out not to be a simple swap — see
[RISK-REGISTER.md](RISK-REGISTER.md) H1); and owner name, mailing address, and assessed value were removed from
the parcel data for the 10 counties with the strongest signal that they treat that information differently from
parcel geometry, replaced with a link to each county's own lookup site. See
[RISK-REGISTER.md](RISK-REGISTER.md) BLOCKER B1, H1, and H2 for exactly what changed, what's still open
(Dodge and Goodhue's owner/mailing fields are the next candidates), and how to bring a county's imagery back
once permission is actually obtained.

## Risk by scenario

**Personal use (Model A) — low risk, with one exception.** Every statewide source and every county's data
source is fine for an individual's own private, non-commercial viewing. The one exception is the same as above:
the 35-county vendor-imagery pattern is a redistribution problem regardless of who's viewing it, because
MnMapping (the redistributor) is outside the vendor's licensed relationship even when the end viewer's own use
is personal.

**A free public website (Model B) — viable once B1 is fixed.** The statewide Open Parcels service (parcels for
~59 counties, including owner name/mailing address/assessed value) came back GREEN with strong, independently-
corroborated evidence — explicit "Access Constraints: None" / "Use Constraints: None" in the state's own
metadata, confirmed a second way via the ArcGIS item record. USGS DOQ, USDA NAIP, and Natural Earth are all
public domain. DNR public land and the statewide lidar DEM are usable for free live display with attribution.
Pull or license the vendor-imagery layers first.

**An ad-supported public viewer (Model C) — same conditions as B, plus one new wrinkle.** Every DNR-governed and
vendor-imagery source in this audit treats "advertising-supported" the same as "commercial" — none of them
carve out an exception for "the user doesn't pay, only the ads do." Don't assume free-to-the-user clears a
source that's already ORANGE/RED for commercial use.

**Paid ad removal (Model D) — no source treated this differently from "ads shown."** Wherever the research
found terms addressing monetization at all, they spoke to *how the data is accessed and displayed*, not to
whether a specific viewer sees ads. If a source clears model C, it clears D; if it doesn't clear C, removing ads
for a paying user doesn't fix the underlying issue.

**Subscription risk (Models F/G) — the riskiest category, and the one to avoid.** Directly paywalling access to
government or vendor-licensed data — as opposed to paywalling MnMapping's own software features — is the use
case DNR's license, the lidar DEM's license, and every vendor-imagery license most clearly and explicitly
address, and they say no without written permission. The statewide Open Parcels service is a partial exception
(no legal prohibition found), but paywalling data any Minnesota resident can get free from the state creates its
own business problem. See [MONETIZATION.md](MONETIZATION.md).

**Redistribution risk — split cleanly by source.** MnMapping's current architecture (a live pass-through proxy
with `cache: no-store`, no persistent storage) is already the lower-risk posture almost everywhere. The
statewide Open Parcels service is the one source actually designed for bulk redistribution (the state itself
publishes GeoPackage/FGDB downloads). Everything DNR-governed or vendor-imagery-governed explicitly or
functionally blocks bulk/offline redistribution — the lidar DEM even has `exportTilesAllowed:false` set at the
server level.

## Biggest blockers, in priority order

1. ~~**[BLOCKER]** 35 counties' vendor-flown imagery is live despite the codebase's own unresolved licensing
   concerns~~ — **fixed 2026-09-19**, see [RISK-REGISTER.md](RISK-REGISTER.md) B1.
2. ~~**[HIGH]** The 3D terrain layer (Esri World Elevation 3D) is used without the ArcGIS subscription Esri's own
   terms say this service requires~~ — **removed 2026-09-19**, see [RISK-REGISTER.md](RISK-REGISTER.md) H1. A
   true mesh-based 3D replacement using Minnesota's own data is a separate, larger project.
3. ~~**[HIGH]** Owner name, mailing address, and assessed value are displayed for every parcel statewide with no
   field-level distinction from geometry~~ — **fixed 2026-09-19 for Hennepin, Wright, Washington, Nicollet,
   Hubbard, Meeker, Mahnomen, McLeod, Fillmore, and Winona**, see [RISK-REGISTER.md](RISK-REGISTER.md) H2. Dodge
   and Goodhue still expose these fields and are the next candidates.
4. **[HIGH]** DNR public-land layers and the statewide lidar DEM both explicitly bar commercial sale of the
   data without MNDNR's written permission — fine for free display, a hard stop for paywalled/offline models
   without that permission.

## Safest commercialization strategy, based on what this audit actually found

The evidence supports the strategy MnMapping's own architecture already leans toward:

- Keep the core map and data free for everyone — the statewide Open Parcels service, USGS/USDA imagery, and
  DNR public land all support this with attribution and standard disclaimers.
- Fund it with advertising, or a subscription that removes ads and/or adds MnMapping-built software features
  (saved projects, exports of the user's own pins, offline UI, measurement tools) — not access to the
  underlying government data itself.
- Never paywall a government or vendor-licensed layer directly; that's the one pattern the evidence consistently
  says no to.
- Don't build a bulk/offline data-package product without the specific written permission each restricted
  source requires — except the statewide Open Parcels service, which is genuinely designed for it.
- Keep the live-proxy, no-persistent-cache architecture already in place.
- Fix the vendor-imagery suppression bug first, and add dynamic, per-layer attribution driven by this audit's
  findings — see [ATTRIBUTION.md](ATTRIBUTION.md).

This is a recommendation grounded in the collected terms, not an automatic default — see
[MONETIZATION.md](MONETIZATION.md) for the full model-by-model breakdown and what would need to change to make
a different model viable.

## What's in this audit

- **[STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md)** — every statewide/agency source: MnGeo imagery family, the
  statewide lidar DEM and MnTOPO, DNR public land, the statewide Open Parcels aggregation, Esri terrain, and the
  three imagery vendors (EagleView/Pictometry, Nearmap, Kucera) plus Schneider/Beacon.
- **[COUNTIES.md](COUNTIES.md)** — all 87 counties, one row each, with parcel/owner-tax/imagery sources,
  personal/commercial/ads/paid-feature/paywall/redistribution classifications, and links to a detail page for
  the ~40 counties with genuinely complex terms.
- **[COUNTY-DETAILS/](COUNTY-DETAILS/)** — one file per complex county, with direct quotes and citations.
- **[MONETIZATION.md](MONETIZATION.md)** — Models A–H compared source-by-source.
- **[ATTRIBUTION.md](ATTRIBUTION.md)** — what attribution is actually required vs. good practice, and a
  suggested dynamic architecture.
- **[RISK-REGISTER.md](RISK-REGISTER.md)** — every issue found, classified LOW/MEDIUM/HIGH/BLOCKER/UNKNOWN,
  with remediation.
- **[QUESTIONS-FOR-AGENCIES.md](QUESTIONS-FOR-AGENCIES.md)** — concise, ready-to-send questions grouped by
  agency and county.

## What remains genuinely unknown

- Whether a county's own stricter local disclaimer (Fillmore, Winona, Lake, McLeod, Kanabec) survives that
  county's opt-in to the statewide parcel aggregator, or is superseded by it — MnGeo's metadata doesn't say.
- The current, primary-source text of the MnGeo Data Disclaimer — blocked by a bot-verification challenge on
  every attempt this session.
- Whether Minnesota's Safe at Home address-suppression program is consistently applied across the ~59 counties
  contributing to the statewide parcel service before their data reaches MnGeo.
- Several counties' exact bulk-data fee amounts where the published PDF could not be machine-read this session
  (Wabasha, Murray, Kandiyohi, Redwood's Beacon brochure).

None of these block a personal-use or Model-B public-free-site launch once B1 is fixed. They matter before a
paid or ad-supported launch that leans on the specific counties named above.
