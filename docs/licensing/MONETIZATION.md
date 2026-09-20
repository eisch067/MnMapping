# Monetization models

Research and risk classification, not legal advice. Evaluated against the actual sources MnMapping uses today
(see [STATEWIDE-SOURCES.md](STATEWIDE-SOURCES.md) and [COUNTIES.md](COUNTIES.md)), assuming
[RISK-REGISTER.md](RISK-REGISTER.md) BLOCKER B1 (vendor imagery live despite internal "unlicensed" flags) is
resolved first — either by removing those ~60 layers or by obtaining written confirmation. The matrix below
does **not** give false certainty: "Likely viable" means the sources involved support it; it does not mean a
launch requires no further diligence.

## Matrix

| Model | Likely viable? | Main restrictions | Sources needing permission |
|---|---|---|---|
| **A — Personal/private use only** | Yes, essentially as-is | None material — every source in the audit permits personal, non-commercial viewing | None |
| **B — Free public website, no ads, no subscriptions** | Yes, once B1 is resolved | Same disclaimers as A; still need to resolve vendor imagery and the handful of self-contradictory county disclaimers (Winona, Fillmore, Lake) | Same list as B1, plus confirm Esri terrain access |
| **C — Free with advertising** | Yes for the statewide-only sources; **not yet** for the 35 counties in B1 | Ad-supported use is "commercial" under most vendor definitions even with no user-facing price tag — DNR's "not sold commercially... without written permission" clause and every vendor-imagery clause treat it that way | All 35 B1 counties; Esri terrain (RED for ads as configured); DNR public-land layers (ORANGE, confirm before scaling) |
| **D — Free with ads + paid ad removal, same data either way** | Yes, once B1 is resolved | The research consistently found that removing ads doesn't change how a source's terms apply — if the underlying data/imagery is licensed for ad-supported display, paid ad-removal on top of it is "probably allowed"/"clearly allowed" everywhere checked; if the underlying source is unlicensed for display at all, paid ad-removal doesn't fix that either | Same as C |
| **E — Free data + paid MnMapping software features** (saved projects, measurement tools, exports of user content, offline UI, historical-imagery comparison UI) | **Yes, essentially unconditionally** | Every source in this audit was scored GREEN for this model — charging for MnMapping's own functionality is independent of source terms, provided the "feature" doesn't itself consist of extracting/downloading a restricted source (see F) | None, as long as paid features don't bundle restricted data |
| **F — Paid data/layer access** (some layers free, some behind a subscription) | **No, not recommended for any government/vendor source** | This is the model the research flags hardest. DNR public land and the lidar DEM explicitly require MNDNR's written permission before being "sold commercially." Vendor imagery (EagleView/Nearmap/Kucera) treats a paywall as commercial resale of copyrighted content — the single most clearly prohibited use under EagleView's own terms. The statewide Open Parcels service doesn't prohibit this legally, but paywalling data any Minnesota resident can get free from the state/county is a business-model risk (bypass), not just a legal one | DNR layers, lidar DEM, all vendor imagery, Esri terrain |
| **G — B2B/commercial subscription** (surveyors, foresters, ag, real estate professionals) | Same restrictions as F, applied with more force | Every source that's ORANGE/RED for F is at least as risky for G, since a sophisticated paying professional audience increases scrutiny and scale | Same as F |
| **H — Paid downloadable/offline data packages** | **No for anything DNR-governed or vendor-imagery-governed; qualified yes for the statewide Open Parcels service specifically** | The DEM's own service configuration technically blocks bulk tile export (`exportTilesAllowed:false`) on top of the DNR license text. Vendor imagery explicitly forbids reproduction "in any form, for any purpose." The statewide Open Parcels service is the one source in the whole audit that's actually designed for bulk distribution (GeoPackage/FGDB downloads published directly by the state) — an offline parcel package built on it is comparatively low legal risk, though a handful of individual contributing counties (Fillmore, Winona, McLeod, Kanabec) have their own stricter no-redistribution language whose relationship to the state compilation is unresolved | DNR layers, lidar DEM, all vendor imagery; confirm county-specific carve-outs before packaging Fillmore/Winona/McLeod/Kanabec parcels specifically |

## Per-model breakdown

### Model A — Personal/private

**Clearly permissible:** every statewide source; every county's parcel/imagery source as currently configured
(with the standard "not a survey, no warranty" disclaimer carried along).
**Permissible with conditions:** none beyond the standard disclaimers.
**Requiring permission:** none.
**Should not be used:** none — this is the lowest-risk model in the audit.

### Model B — Free public website

**Clearly permissible:** Natural Earth, USGS DOQ, NAIP (YELLOW flag on long-term status), statewide Open
Parcels (geometry + owner/tax attributes), the 26 counties correctly excluding their own vendor imagery
(Itasca, Morrison, Cook, Wright, Isanti, Brown, Renville, St. Louis, Cass, Clearwater, Houston, Fillmore,
Winona, Le Sueur, Blue Earth, Cottonwood, Faribault, Nobles, Swift, Redwood, Watonwan, Mahnomen's imagery,
Douglas, Beltrami, Hubbard, Becker).
**Permissible with conditions:** MnGeo Composite (confirm the Metropolitan Council component), DNR public land
and the lidar DEM (attribution required, live display only).
**Requiring permission:** Esri terrain (get an API key), the 35 B1 counties' vendor imagery.
**Should not be used:** none of the above should be *removed* for this model — they should be fixed or excluded
per B1's remediation, then B becomes broadly safe.

### Model C — Free with advertising

Same list as B, with one added distinction the research surfaced repeatedly: **every DNR-governed and
vendor-imagery source treats "commercial" and "ads-supported" as the same category**, even though the end user
pays nothing. Don't assume "free to the user" clears a source that's ORANGE/RED here.

### Model D — Free with ads + paid ad removal

No source in the audit treats "pay to remove ads" differently from "free with ads shown" — the underlying
data-access pattern is identical in both tiers everywhere this was checked (statewide parcels, DNR layers, the
lidar DEM). If a source clears model C, it clears model D too; if it doesn't clear C, ad removal doesn't fix it.

### Model E — Freemium software features

The cleanest model in the whole audit. Saved projects, drawing/measurement tools, GPX/KML/GeoJSON import-export
(of the user's own pins/notes — MnMapping's export code already only touches user-created `MyMapItem` data, not
source GIS data), PDF printing, offline caching *of the app UI*, and historical-imagery comparison *UI* can all
be paywalled without implicating any source's terms — provided the underlying map/imagery layers being compared
or exported are the same free ones everyone else sees.

### Model F — Paid data/layer access

The riskiest model with the clearest evidence against it. Every government source with an explicit commercial
clause (DNR, lidar DEM) requires written permission before "selling" the data; every vendor-imagery source
treats resale as the single most clearly prohibited use. The statewide Open Parcels service is the exception —
nothing in its own terms bars this — but the "why would anyone pay for what the state gives away free" business
problem remains.

### Model G — B2B/commercial subscription

Same sources as F, with the added note that several individual counties (Washington, McLeod, Nicollet's
RecordEASE) have documented anti-commercial-reuse language specifically aimed at professional/bulk users —
exactly the audience a B2B tier would target.

### Model H — Offline tile/data packages

The one model where the statewide Open Parcels service stands out as unusually well-supported (the state
already publishes bulk GeoPackage/FGDB downloads directly). Every DNR/lidar/vendor-imagery source is a clear
no. Confirm county-specific carve-outs (Fillmore, Winona, McLeod, Kanabec) before packaging their contributions
specifically, since their own disclaimers speak in stronger, more absolute redistribution-prohibition language
than the state aggregator's silence does.
