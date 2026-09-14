# MnMapping — North of I-94 County Expansion Spec

**Research date:** 2026-09-14  
**Purpose:** Give Codex a county-by-county implementation plan for the remaining Minnesota counties in the North zone.

## Zone rule

For this project, the **North of I-94 zone** contains:

1. Every Minnesota county wholly or substantially north of Interstate 94, **plus**
2. Every Minnesota county that I-94 passes through.

This avoids splitting a county between two implementation batches. The I-94 corridor counties in Minnesota are Clay, Wilkin, Otter Tail, Grant, Douglas, Todd, Stearns, Wright, Hennepin, Ramsey, and Washington.

The five counties already selected for the initial implementation are **not work items in this file**:

- Becker
- Beltrami
- Douglas
- Hubbard
- Todd

This file therefore contains **38 remaining counties**.

---

## Shared sources that apply to every county

### Statewide imagery

Use the MnGeo Geospatial Image Service in Web Mercator:

`https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?`

At minimum, retain these statewide selectable layers:

- `fsa2025` — 2025 NAIP natural color, ~0.6 m / 2 ft
- `fsa2025cir` — 2025 NAIP color infrared
- `fsa2023` — 2023 NAIP natural color, ~0.3 m / 1 ft
- `fsa2023cir` — 2023 NAIP color infrared
- `fsa2021` / `fsa2021cir`
- `fsa2019` / `fsa2019cir`
- `hillshd` — statewide lidar hillshade
- `doq` — 1991 statewide USGS imagery where desired as Historical

Also keep the automatic MnGeo Composite imagery option:

`https://imageserver.gisdata.mn.gov/cgi-bin/mncomp?`

Do **not** replace county-specific high-resolution imagery with Composite. Composite is a convenience/default layer; named imagery layers must remain separately selectable for comparison.

### Statewide lidar / terrain

Do not create separate county lidar adapters unless a county has a genuinely superior product needed by the app. Continue using the statewide second-generation seamless lidar/elevation implementation from the core specs.

County boundaries must not create visible breaks in terrain.

### Statewide open parcels

Before writing a special parcel adapter, check Minnesota's statewide Open Parcels service:

`https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer`

- Layer `0` = metadata/coverage
- Layer `1` = open parcel polygons

Codex should query layer 0 to determine whether the target county is currently included and its acquisition/run date.

If the statewide service contains current enough data for the county, it can be used as the geometry source. A direct county service may still be preferred if it contains fresher geometry or richer attributes.

### Public land

Do **not** make public land county-specific unless a county has useful supplemental tax-forfeited/county-managed land that is absent from the statewide sources.

The statewide public-land implementation should continue seamlessly through all counties.

---

## Parcel integration priority

For every county, use this order:

1. **Existing direct public county FeatureServer/MapServer**
2. **MnGeo statewide Open Parcels FeatureServer**
3. **Official ArcGIS Hub/ArcGIS Online item resolved to its underlying public service**
4. **Official downloadable county data**, only if it can be reasonably converted/served without adding a heavy backend
5. Mark parcel support **pending**

### Never do this

- Do not scrape HTML from Beacon.
- Do not automate a county viewer intended only for interactive human use.
- Do not bypass logins, tokens, request restrictions, or access controls.
- Do not hard-code data copied manually out of a county website.
- Do not create a backend just to work around a county that does not provide a clean public service.

If parcel polygons cannot be integrated cleanly, leave that county's imagery, lidar, public land, coordinates, pins, and other features working and mark `parcels: unavailable/pending`.

---

## County adapter requirements

Every new county must be configuration-driven. Adding a county must **not** add county-specific conditions to the main map component.

A county adapter/config entry should be able to describe:

```ts
{
  id: "county-slug",
  name: "County Name",
  fips: "###",
  zone: "north",
  imagery: [...],
  parcels: {
    status: "available" | "partial" | "pending",
    sourceType: "arcgis-feature" | "mngeo-open" | "download" | "none",
    url: "...",
    layerId: 0,
    fields: {
      parcelId: "...",
      owner: "...",
      owner2: "...",
      siteAddress: "...",
      mailingAddress: "...",
      acres: "...",
      legalDescription: "...",
      assessedValue: "..."
    }
  },
  notes: [...]
}
```

Fields that do not exist for a county should be `undefined`; do not invent them.

### Required behavior after adding each county

- County-specific imagery automatically appears only where relevant.
- Coverage extents are honored; partial imagery must not be presented as countywide.
- Parcel layer loads only at an appropriate zoom level.
- Parcel requests are spatially bounded to the current view/click; do not download an entire large county on page load.
- Clicking a parcel uses the same normalized parcel info UI used by every other county.
- Opacity/reordering works without custom county UI.
- Existing counties still work.
- Build/typecheck/lint still pass.

---

## Source confidence tiers

- **Tier A** — direct open/downloadable GIS data is known to exist. Start here.
- **Tier B** — official ArcGIS app/hub or county data is known, but Codex must resolve/verify the actual REST layer.
- **Tier C** — only a legacy/Beacon-style public viewer is obvious from the state catalog. Check statewide Open Parcels and official REST endpoints; otherwise leave parcel support pending.

The tier describes **parcel integration ease**, not data quality.

---

# Remaining counties

## 01. Aitkin County — Tier A

**Parcel availability:** Direct downloadable/open parcel dataset available.

**Official/start source:** https://gis.data.mn.gov/datasets/3cd285cbb13a43478d42e2ade3915403_0/explore

**Imagery available/recommended:** Statewide 2025/2023 NAIP. MnGeo `fall11` / `fallcir11` covers Aitkin at 0.5 m (2011 fall).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Aitkin` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Aitkin` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Prefer current parcel FeatureServer behind the MnGeo/ArcGIS item if queryable.

---

## 02. Anoka County — Tier A

**Parcel availability:** Open GIS downloads include parcels and tax extract; MetroGIS regional parcels are also available.

**Official/start source:** https://www.anokacountymn.gov/1990/Data-Downloads

**Imagery available/recommended:** MnGeo `met25` / `met25cir` (2025, 1 ft) is the preferred high-resolution layer; older `met20`, `met16`, etc. are available. `fall11` also covers Anoka.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Anoka` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Anoka` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use MetroGIS/current county service rather than downloading static files if a public FeatureServer is available.

---

## 03. Benton County — Tier A

**Parcel availability:** County publishes parcel shapefiles plus a weekly-updated ArcGIS map service.

**Official/start source:** https://www.bentoncountymn.gov/274/GIS-Mapping

**Imagery available/recommended:** County page explicitly provides 2023 aerial imagery through ArcGIS Online. MnGeo `fall11` provides 2011 fall 0.5 m imagery.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Benton` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Benton` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Prefer the weekly county service for parcels; add county 2023 imagery if its service supports direct browser use.

---

## 04. Carlton County — Tier A

**Parcel availability:** Carlton County ArcGIS open-data portal.

**Official/start source:** https://data-carltoncounty.opendata.arcgis.com/

**Imagery available/recommended:** Excellent MnGeo history: `carlton21` (2021, 6 in), `carl19` (2019, 6 in), `carl15_9` (2015, 9 in), `nc13ft` (2013, 1 ft), `fall11`, and `neclr2009`/`neir2009`.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Carlton` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Carlton` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Expose the recent 2021 and 2019 layers first; older layers go under Historical.

---

## 05. Cass County — Tier B

**Parcel availability:** County public interactive GIS and downloadable-data entry point are listed by MnGeo.

**Official/start source:** https://cassweb.casscountymn.gov/link/jsfe/index.aspx?defaultRole=Public

**Imagery available/recommended:** Statewide NAIP plus MnGeo `fall12` / `fallcir12` (2012 fall, 0.5 m) covering Cass.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Cass` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Cass` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels first. If absent, inspect the county's public GIS services for a queryable parcel endpoint; do not scrape the viewer.

---

## 06. Chisago County — Tier B

**Parcel availability:** County exposes parcel/open data through ArcGIS Experience/ArcGIS infrastructure.

**Official/start source:** https://experience.arcgis.com/experience/f1e7717bfb1e48fd9ed34c6d7aa01018

**Imagery available/recommended:** Statewide NAIP plus MnGeo `smet10` / `smet10cir` (2010, 0.5 m) and `fall11` / `fallcir11` (2011 fall, 0.5 m).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Chisago` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Chisago` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Resolve the Experience item to its underlying public FeatureServer and store only the service URL in the adapter.

---

## 07. Clay County — Tier A

**Parcel availability:** County GIS Hub and public ArcGIS Server services are explicitly exposed.

**Official/start source:** https://www.claycountymn.gov/658/Access-GIS-Data

**Imagery available/recommended:** Statewide NAIP plus MnGeo `nc13ft` / `nc13ftcir` (2013, 1 ft). Red River regional imagery may provide older supplemental coverage.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Clay` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Clay` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use the public ArcGIS Server/Hub service. Do not import county-coordinate-system assumptions into core UI.

---

## 08. Clearwater County — Tier B

**Parcel availability:** MnGeo lists downloadable county parcel data and a public parcel map; the old county data link currently redirects poorly.

**Official/start source:** https://map.co.clearwater.mn.us/

**Imagery available/recommended:** Statewide NAIP; DNR 2022 fall imagery exists for Clearwater. MnGeo `fall12` covers the southern portion at 0.5 m.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Clearwater` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Clearwater` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** First query statewide open parcels. Then locate the current county REST endpoint. Treat the old MnGeo county download link as stale until verified.

---

## 09. Cook County — Tier A

**Parcel availability:** Current tax parcel layer is published in Cook County's ArcGIS Open Data portal.

**Official/start source:** https://open-data-portal-cookcountymn.hub.arcgis.com/datasets/cookcountymn::tax-parcel-layer-current/about

**Imagery available/recommended:** Statewide NAIP plus DNR fall imagery (including 2019). MnGeo has `neclr2009`/`neir2009`, `bwca09`, `iroy09`, and other Arrowhead historical coverage.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Cook` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Cook` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use current tax parcels from the public FeatureServer. Group older Arrowhead/BWCA imagery under Historical/Regional.

---

## 10. Crow Wing County — Tier A

**Parcel availability:** Crow Wing County ArcGIS Open Data portal.

**Official/start source:** https://hub-cwccm.hub.arcgis.com/pages/opendata

**Imagery available/recommended:** Statewide NAIP plus MnGeo `fall12` / `fallcir12` (2012 fall, 0.5 m).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Crow Wing` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Crow Wing` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Search the Hub for the current parcel FeatureServer and normalize its fields to the common parcel schema.

---

## 11. Grant County — Tier A

**Parcel availability:** ArcGIS open-data hub includes parcel data.

**Official/start source:** https://equitable-property-value-co-grant-mn-us.hub.arcgis.com/search?q=parcel

**Imagery available/recommended:** Use statewide 2025 and 2023 NAIP as primary imagery unless a newer county service is discovered.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Grant` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Grant` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** I-94 corridor county assigned to North zone so counties are never split.

---

## 12. Hennepin County — Tier A

**Parcel availability:** Hennepin County publishes a County Parcels open dataset; MetroGIS regional parcels are another authoritative option.

**Official/start source:** https://gis-hennepin.hub.arcgis.com/datasets/county-parcels/explore

**Imagery available/recommended:** Excellent: `met25` (2025, 1 ft), `hen22` (2022, 6 in), `hen21` (2021, 6 in), `hen18` and older Metro imagery.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Hennepin` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Hennepin` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Expose 2025 Metro and the sharper 2022/2021 Hennepin layers separately so users can compare recency vs resolution.

---

## 13. Isanti County — Tier A

**Parcel availability:** Tax Parcels are available through Isanti County ArcGIS Open Data.

**Official/start source:** https://opendata-isanticounty.hub.arcgis.com/datasets/1ecbd057d10a43b7976f6ae9957019d5_0/explore

**Imagery available/recommended:** Statewide NAIP plus `smet10` / `smet10cir` (2010, 0.5 m) and `fall11` / `fallcir11`.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Isanti` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Isanti` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use the FeatureServer behind the Hub item.

---

## 14. Itasca County — Tier A

**Parcel availability:** Direct MnGeo-hosted Itasca parcel FeatureServer/open dataset.

**Official/start source:** https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_co_itasca/plan_parcels/FeatureServer/0

**Imagery available/recommended:** Statewide NAIP; `itas18` / `itas18cir` (2018, 1 ft), `nc13ft` (2013, 1 ft), DNR 2022 fall imagery, and partial `ncclr09`/`ncir09` coverage.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Itasca` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Itasca` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** This is a good reference implementation because the parcel REST layer is directly queryable as JSON/GeoJSON/PBF.

---

## 15. Kanabec County — Tier C

**Parcel availability:** MnGeo lists a Beacon parcel viewer but no downloadable parcel dataset.

**Official/start source:** https://beacon.schneidercorp.com/

**Imagery available/recommended:** Statewide NAIP plus MnGeo `fall11` / `fallcir11` (2011 fall, 0.5 m).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Kanabec` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Kanabec` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels first. Do not scrape Beacon. If no public queryable source exists, leave parcels marked pending.

---

## 16. Kittson County — Tier C

**Parcel availability:** MnGeo lists a Beacon parcel viewer but no downloadable parcel dataset.

**Official/start source:** https://beacon.schneidercorp.com/

**Imagery available/recommended:** Use statewide 2025/2023 NAIP as primary. Older northern-border/regional imagery exists, but the old `ndak09` layer is not a preferred active source.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Kittson` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Kittson` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels first; otherwise search for an official county REST/open-data service before declaring pending.

---

## 17. Koochiching County — Tier C

**Parcel availability:** County provides a public parcel viewer, but MnGeo does not list downloadable parcel data. County warns its legacy parcel layer originated in 2000 and is being improved.

**Official/start source:** https://www.koochiching.gov/289/1990/Disclaimer

**Imagery available/recommended:** `kooc20` (2020, 1 ft), DNR 2021/2019 fall imagery, statewide NAIP, and partial `ncclr09`/`ncir09`.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Koochiching` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Koochiching` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Treat parcel geometry cautiously. Check statewide open parcels/current county services before using the legacy viewer source.

---

## 18. Lake County — Tier B

**Parcel availability:** MnGeo lists downloadable parcel data and an online ArcGIS viewer, but the old MnGeo data link currently appears stale.

**Official/start source:** https://experience.arcgis.com/

**Imagery available/recommended:** Excellent: `lake24` (2024, 6 in), `lake19` (2019, 6 in), DNR 2021/2019 fall imagery, plus Arrowhead/BWCA historical layers.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Lake` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Lake` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Prioritize 2024 6-inch imagery. Locate the current official county parcel FeatureServer rather than relying on the stale catalog link.

---

## 19. Lake of the Woods County — Tier C

**Parcel availability:** MnGeo lists a Beacon parcel viewer but no downloadable parcel dataset.

**Official/start source:** https://beacon.schneidercorp.com/

**Imagery available/recommended:** Statewide NAIP, DNR 2021/2019 fall imagery, and `bord15` northern-border coverage.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Lake of the Woods` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Lake of the Woods` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use statewide open parcels if coverage exists; do not scrape Beacon.

---

## 20. Mahnomen County — Tier B

**Parcel availability:** Public ArcGIS Web Application is available.

**Official/start source:** https://mahnomencountymn.maps.arcgis.com/apps/webappviewer/index.html?id=374e6dba7090419092bea8e28869fd07

**Imagery available/recommended:** Statewide NAIP, DNR 2022 fall imagery, and MnGeo `fall12` / `fallcir12` (2012 fall, 0.5 m).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Mahnomen` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Mahnomen` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Resolve the web-map item to its public parcel layer. If none is queryable, use statewide open parcels if available.

---

## 21. Marshall County — Tier C

**Parcel availability:** County public legacy interactive map; MnGeo does not list downloadable parcel data.

**Official/start source:** https://gis.co.marshall.mn.us/link/jsfe/index.aspx

**Imagery available/recommended:** Use statewide NAIP as primary; older northwest regional swaths may provide supplemental historical coverage.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Marshall` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Marshall` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels and official REST services. Do not scrape the legacy Link viewer.

---

## 22. Mille Lacs County — Tier A

**Parcel availability:** Parcel Tax Data is published through the county ArcGIS Hub.

**Official/start source:** https://mille-lacs-county-geospatial-hub-millelacs.hub.arcgis.com/datasets/0eedcd30889d448a91ac25edb00cdc0c/about

**Imagery available/recommended:** Statewide NAIP plus `nc13ft` / `nc13ftcir` (2013, 1 ft) and `fall11` / `fallcir11`.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Mille Lacs` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Mille Lacs` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use the parcel FeatureServer behind the Hub item and normalize tax/owner fields separately from geometry fields.

---

## 23. Morrison County — Tier A

**Parcel availability:** Direct parcel open dataset is published through MnGeo.

**Official/start source:** https://gis.data.mn.gov/datasets/1633b4242c8346aaa06647330dad8efc_0/explore

**Imagery available/recommended:** Use statewide NAIP as primary. 2013 North 1-ft imagery includes Camp Ripley but should be treated as partial coverage, not countywide.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Morrison` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Morrison` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** FeatureServer behind the MnGeo item should be preferred over static downloads.

---

## 24. Norman County — Tier C

**Parcel availability:** Public legacy interactive map; no downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://gis.co.norman.mn.us/link/jsfe/index.aspx

**Imagery available/recommended:** Statewide NAIP; Red River regional imagery can be offered as older supplemental coverage where it intersects.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Norman` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Norman` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels first and do not scrape the Link viewer.

---

## 25. Otter Tail County — Tier A

**Parcel availability:** County has a strong GIS/Open Data program with a dedicated Parcel Data category.

**Official/start source:** https://ottertailcounty.gov/property-home/maps-data/

**Imagery available/recommended:** Statewide NAIP plus several years of aerial photography exposed in the county map. Discover and add any public high-resolution imagery services that outperform NAIP.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Otter Tail` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Otter Tail` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use the county Open Data Hub for current parcel service and inspect its imagery services. This should be an easy county adapter.

---

## 26. Pennington County — Tier C

**Parcel availability:** Public legacy interactive parcel map; no downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://gismap.co.pennington.mn.us/link/jsfe/index.aspx

**Imagery available/recommended:** Use statewide NAIP as primary. Northwest regional imagery may offer older supplemental coverage.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Pennington` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Pennington` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels/current county REST services. Do not scrape the Link viewer.

---

## 27. Pine County — Tier C

**Parcel availability:** MnGeo lists a Beacon parcel viewer but no downloadable parcel dataset.

**Official/start source:** https://beacon.schneidercorp.com/

**Imagery available/recommended:** Statewide NAIP plus MnGeo `fall11` / `fallcir11` (2011 fall, 0.5 m).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Pine` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Pine` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels first; no Beacon scraping.

---

## 28. Polk County — Tier A

**Parcel availability:** Polk County ArcGIS Hub publishes tax parcel/open data.

**Official/start source:** https://hub-pcg.hub.arcgis.com/search?tags=Tax+Parcels

**Imagery available/recommended:** Statewide NAIP plus `polk` / `polkcir` (2014 Polk/Beltrami, 1 ft) and older Red River imagery.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Polk` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Polk` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use current Hub FeatureServer; expose 2014 1-ft imagery as a historical high-resolution option.

---

## 29. Ramsey County — Tier A

**Parcel availability:** Attributed Parcels are available from Ramsey County Open Data; MetroGIS is another regional source.

**Official/start source:** https://data-ramseygis.opendata.arcgis.com/datasets/RamseyGIS::attributed-parcels/explore

**Imagery available/recommended:** `met25` (2025, 1 ft), `rams20` / `rams20cir` (2020, 6 in), older Metro layers, and partial `fall11` in northern Ramsey.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Ramsey` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Ramsey` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use 2025 Metro by default, but retain 2020 6-inch imagery because it is sharper.

---

## 30. Red Lake County — Tier B

**Parcel availability:** Public ArcGIS Web Application; no separate downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://redlakecountymn.maps.arcgis.com/apps/webappviewer/index.html?id=22572566d86b4469b540d3071d9382c0

**Imagery available/recommended:** Use statewide NAIP as primary; northwest regional imagery can be offered if verified to cover the county.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Red Lake` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Red Lake` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Resolve the ArcGIS web map to its underlying public layers. Fall back to statewide open parcels if available.

---

## 31. Roseau County — Tier C

**Parcel availability:** Public legacy interactive map; no downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://gis.co.roseau.mn.us/link/jsfe/index.aspx

**Imagery available/recommended:** Statewide NAIP, DNR 2022/2019 fall imagery, plus active `bord15` coverage in the eastern/northern area.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Roseau` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Roseau` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels/current official REST services; do not scrape the legacy viewer.

---

## 32. St. Louis County — Tier A

**Parcel availability:** St. Louis County publishes Tax Parcels in its ArcGIS Open Data portal.

**Official/start source:** https://open-data-slcgis.hub.arcgis.com/datasets/5f05e9148b4a4fe58b04d62e37decff2_7/about

**Imagery available/recommended:** Statewide NAIP; DNR 2021/2019 fall imagery; multiple MnGeo regional layers including north shore, Duluth, BWCA, north-central, and Arrowhead imagery.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `St. Louis` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `St. Louis` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Because the county is huge, use coverage extents for regional imagery rather than pretending every special layer is countywide.

---

## 33. Sherburne County — Tier A

**Parcel availability:** Parcels are published through Sherburne County ArcGIS Open Data.

**Official/start source:** https://data-sherburnegis.opendata.arcgis.com/datasets/0fdf41eee3004bab9ef04df77a45e5a7_0/explore

**Imagery available/recommended:** Statewide NAIP plus `smet10` / `smet10cir` (2010, 0.5 m) and `fall11` / `fallcir11`.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Sherburne` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Sherburne` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use the public parcel FeatureServer behind the Hub dataset.

---

## 34. Stearns County — Tier A

**Parcel availability:** Stearns County GIS ArcGIS Hub provides downloadable/open GIS data.

**Official/start source:** https://stearns-county-gis-stearns.hub.arcgis.com/

**Imagery available/recommended:** Use statewide 2025/2023 NAIP by default. Inspect Stearns County GIS for any current high-resolution county imagery service before finalizing.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Stearns` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Stearns` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** I-94 corridor county assigned to North zone.

---

## 35. Wadena County — Tier C

**Parcel availability:** Public legacy interactive map; no downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://gis.co.wadena.mn.us/link/jsfe/index.aspx

**Imagery available/recommended:** Statewide NAIP plus MnGeo `fall12` / `fallcir12` (2012 fall, 0.5 m).

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Wadena` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Wadena` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Check statewide open parcels and public REST services first; no viewer scraping.

---

## 36. Washington County — Tier A

**Parcel availability:** Use the Twin Cities Metro regional parcel dataset and/or the county's official parcel viewer/service.

**Official/start source:** https://www.washingtoncountymn.gov/

**Imagery available/recommended:** `met25` / `met25cir` (2025, 1 ft), older Metro imagery, `wash13` (2013, 6 in), and partial `fall11` in northern Washington.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Washington` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Washington` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** Use the regional MetroGIS parcel model where practical because it is already normalized across metro counties.

---

## 37. Wilkin County — Tier A

**Parcel availability:** Wilkin County ArcGIS Open Data portal.

**Official/start source:** https://share-open-data-wilkinco.hub.arcgis.com/

**Imagery available/recommended:** Statewide NAIP plus `nc13ft` / `nc13ftcir` (2013, 1 ft) and older Red River regional imagery.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Wilkin` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Wilkin` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** I-94 corridor county assigned to North zone.

---

## 38. Wright County — Tier A

**Parcel availability:** Wright County publishes Parcels through its ArcGIS GIS Hub.

**Official/start source:** https://wright-county-gis-wrightgis.hub.arcgis.com/datasets/6bae27646e664fad990aa6018c60cb91_0/explore

**Imagery available/recommended:** Statewide NAIP plus `smet10` / `smet10cir` (2010, 0.5 m). Check county GIS for newer local imagery.

**Codex instructions:**

1. Keep the statewide 2025/2023 NAIP, Composite imagery, lidar, hillshade, and public-land layers unchanged.
2. Add the county-specific imagery listed above as separate selectable layers **only after verifying the current service/layer name and coverage**.
3. Check the statewide Open Parcels metadata layer for `Wright` before creating a custom parcel adapter.
4. If a cleaner/current county FeatureServer exists, prefer it and map its fields to the shared normalized parcel schema.
5. Do not add `Wright` logic to the main map component; implement it through the county/layer registry.
6. Test opacity, layer order, visibility by extent/zoom, parcel click/identify, and regressions in previously supported counties.

**County-specific note:** I-94 corridor county assigned to North zone.

---
# Recommended Codex execution order

Do not add all 38 counties in one unreviewed pass.

## Batch N1 — easiest/high-value direct data

1. Aitkin
2. Benton
3. Carlton
4. Crow Wing
5. Itasca
6. Mille Lacs
7. Morrison
8. Otter Tail

**Checkpoint:** verify the adapter architecture still requires no main-map county branching.

## Batch N2 — northwest open-data counties

1. Clay
2. Polk
3. Wilkin
4. Grant
5. Cook

**Checkpoint:** verify projections, parcel field normalization, and imagery coverage handling.

## Batch N3 — metro / east-central

1. Anoka
2. Hennepin
3. Ramsey
4. Washington
5. Wright
6. Sherburne
7. Isanti
8. Chisago
9. Stearns

**Checkpoint:** verify MetroGIS vs direct county parcel source strategy and make sure high-resolution imagery does not hide newer NAIP choices.

## Batch N4 — large/northeast and app-resolved sources

1. St. Louis
2. Lake
3. Cass
4. Clearwater
5. Mahnomen
6. Red Lake

**Checkpoint:** verify partial imagery extents and large-county performance.

## Batch N5 — difficult/legacy-viewer counties

1. Kanabec
2. Kittson
3. Koochiching
4. Lake of the Woods
5. Marshall
6. Norman
7. Pennington
8. Pine
9. Roseau
10. Wadena

For each Tier C county, a successful result may simply be:

- imagery ✅
- lidar/terrain ✅
- public lands ✅
- county boundary ✅
- parcels `pending` ⚠️

Do not weaken the architecture or add scraping just to turn the parcel checkbox green.

---

# Definition of done for the North zone

The North zone is complete when:

- All 43 North-zone counties are recognized by the app, including the five initial counties.
- Statewide imagery/lidar/public-land layers remain seamless across all 43.
- Every known MnGeo or official county high-resolution imagery layer selected for inclusion is available through the common layer UI.
- Every county with a clean public parcel service is integrated through the normalized parcel system.
- Counties without a clean parcel source fail gracefully and are explicitly marked pending.
- No county-specific logic has leaked into the main map UI.
- Adding a future county still means primarily adding a registry/adapter entry.
- App build, typecheck, lint, and normal interactive use pass after the zone expansion.

---

# Research references

Authoritative/current references used to prepare this spec:

- MnGeo parcel source catalog:  
  https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp
- MnGeo Geospatial Image Service layer inventory:  
  https://mn.gov/mngeo/gis-data-and-maps/web-map-services/mngeo-image-service/data.jsp
- MnGeo WMS technical specifications:  
  https://mn.gov/mngeo/gis-data-and-maps/web-map-services/mngeo-image-service/technical.jsp
- MnGeo Composite Image Service:  
  https://mn.gov/mngeo/gis-data-and-maps/web-map-services/composite-image-service/
- MnGeo aerial photography sources / DNR fall imagery:  
  https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/air-photos/sources/
- Minnesota statewide Open Parcels FeatureServer:  
  https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer
- Minnesota county GIS contacts:  
  https://mn.gov/mngeo/community/gis-contacts/county-gis-contacts/

## Important maintenance note

GIS services change. Codex must treat the URLs and layer names in this document as researched starting points, not immutable constants. Before committing an adapter:

1. request the service metadata,
2. verify the layer still exists,
3. verify it is publicly queryable,
4. verify its extent,
5. inspect field names,
6. record the verified service URL and verification date in the adapter or data-source metadata.

This keeps MnMapping from slowly accumulating dead county integrations.
