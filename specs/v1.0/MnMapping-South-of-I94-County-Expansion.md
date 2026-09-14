# MnMapping — South of I-94 County Expansion Spec

**Research date:** 2026-09-14  
**Purpose:** Give Codex a county-by-county implementation plan for the Minnesota counties assigned to the South zone.

## Zone rule

The North-zone spec intentionally assigned **every county crossed by I-94** to the North zone so no county would ever be split between batches.

The **South zone** therefore contains every Minnesota county **not already assigned to the North/I-94 zone**.

This file contains **44 counties**. Together with the 43 North-zone counties, it covers all 87 Minnesota counties.

---

## Shared implementation rules

These are the same rules used in the North-zone expansion and should not be reimplemented differently.

### Statewide imagery

Use the MnGeo Geospatial Image Service in Web Mercator:

`https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?`

Keep these statewide layers available everywhere:

- `fsa2025` / `fsa2025cir` — 2025 NAIP, ~0.6 m / 2 ft
- `fsa2023` / `fsa2023cir` — 2023 NAIP, ~0.3 m / 1 ft
- `fsa2021` / `fsa2021cir`
- `fsa2019` / `fsa2019cir`
- other historical NAIP layers already supported
- `hillshd` — statewide lidar hillshade
- `doq` — 1991 statewide USGS imagery when Historical imagery is enabled

Keep the MnGeo Composite service as a convenient automatic option:

`https://imageserver.gisdata.mn.gov/cgi-bin/mncomp?`

Composite must **not** hide the named imagery layers. Users should be able to deliberately cycle through years and compare imagery with opacity.

### Important South-region imagery layer

MnGeo's `south11` / `south11ir` layer is 2011 spring natural-color/CIR imagery at **0.5-meter resolution** covering 37 southern Minnesota counties.

Use it where its published coverage applies. Do not add it to the seven South-zone counties outside that footprint merely because they are geographically southern.

### Lidar / terrain

Continue using the common statewide lidar/terrain implementation.

Do not create county-specific terrain code unless a county has a materially better authoritative elevation product that is intentionally being added.

Terrain should remain seamless across county boundaries.

### Statewide open parcels

Before creating a special parcel adapter, query Minnesota's statewide Open Parcels service:

`https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer`

- Layer `0` — county metadata/coverage
- Layer `1` — parcel polygons

Check the acquisition/run date for the county.

A direct county FeatureServer should be preferred when it is fresher or exposes richer parcel attributes.

### Public lands

Public-land support remains statewide.

Do not create county-specific public-land logic unless a county exposes useful supplemental public ownership such as county-managed or tax-forfeited land that is missing from the common statewide layers.

---

## Parcel-source priority

For every South-zone county:

1. Existing official county public FeatureServer/MapServer
2. Minnesota statewide Open Parcels FeatureServer
3. Official ArcGIS Hub/Experience/Web Map resolved to its underlying public REST service
4. Official downloadable county data when it can be integrated without adding a heavy backend
5. `pending`

### Never do this

- Do not scrape Beacon.
- Do not scrape GIS Midwest or another third-party interactive viewer.
- Do not automate human-oriented parcel-search sites.
- Do not bypass authentication, tokens, rate restrictions, or access controls.
- Do not introduce a database/server simply to work around a difficult county.
- Do not copy parcel data manually into source code.

A county can be considered successfully added even when private parcels remain pending, provided imagery, lidar, public lands, county recognition, pins, coordinates, and other statewide functionality continue to work.

---

## County adapter requirements

County additions must remain configuration-driven.

Do not add county-name `if/else` blocks to the main map component.

Use the existing shared county/layer/parcel registries and normalized parcel interface.

Each county configuration should be capable of describing:

```ts
{
  id: "county-slug",
  name: "County Name",
  fips: "###",
  zone: "south",

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

Undefined county fields remain undefined.

Do not invent or infer owner names, addresses, acreage, values, or other parcel attributes.

### Required verification for every county

Before committing a county adapter:

1. Verify the service URL still works.
2. Inspect its ArcGIS/WMS metadata.
3. Verify layer ID and geometry type.
4. Verify coverage extent.
5. Inspect field names.
6. Verify anonymous/public query access.
7. Record source and verification date.
8. Test parcel querying only at an appropriate zoom level.
9. Spatially bound queries; never download a large county's entire parcel layer at app startup.
10. Test existing counties for regressions.

---

## Parcel integration tiers

- **Tier A** — MnGeo currently lists downloadable/open county parcel data. These should generally be easiest.
- **Tier B** — an official ArcGIS app/viewer is known, but Codex must resolve and verify the underlying REST layer.
- **Tier C** — current state catalog mainly points to Beacon, GIS Midwest, a legacy/custom viewer, or no map. Check statewide Open Parcels and official services, but parcels may legitimately remain pending.

The tier is about ease of integration, not survey accuracy or data quality.

---

# South-zone counties

## 01. Big Stone County — Tier A

**Parcel availability:** Open Data portal with downloadable parcel GIS data.

**Official/start source:** https://data-bigstonecounty.opendata.arcgis.com/

**Imagery available/recommended:** Statewide 2025/2023 NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Big Stone` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Big Stone`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Resolve the ArcGIS Open Data parcel item to its FeatureServer and use that if current.

---

## 02. Blue Earth County — Tier C

**Parcel availability:** MnGeo lists a Beacon parcel map but no downloadable county parcel dataset.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide 2025/2023 NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Blue Earth` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Blue Earth`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Check statewide Open Parcels first. Do not scrape Beacon.

---

## 03. Brown County — Tier A

**Parcel availability:** County GIS site provides downloadable parcel data.

**Official/start source:** https://gis.browncountymn.gov/portal/apps/sites/

**Imagery available/recommended:** Statewide 2025/2023 NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Brown` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Brown`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Inspect Brown County's public ArcGIS services and use a live FeatureServer if available.

---

## 04. Carver County — Tier A

**Parcel availability:** Carver County Open Data Parcels are published through ArcGIS Open Data.

**Official/start source:** https://data-carver.opendata.arcgis.com/datasets/carver::open-data-parcels/about

**Imagery available/recommended:** Use `met25` / `met25cir` (2025 Twin Cities Metro, 1 ft) as the preferred recent local imagery, plus statewide NAIP and older Metro imagery.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Carver` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Carver`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** MetroGIS parcels may also be useful. Prefer one authoritative normalized source and avoid duplicate parcel layers.

---

## 05. Chippewa County — Tier A

**Parcel availability:** Tax Parcels are published through Chippewa County ArcGIS Open Data.

**Official/start source:** https://data-chippewa.opendata.arcgis.com/datasets/chippewa::tax-parcels/about

**Imagery available/recommended:** Statewide 2025/2023 NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Chippewa` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Chippewa`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the public FeatureServer behind the ArcGIS item.

---

## 06. Cottonwood County — Tier C

**Parcel availability:** MnGeo lists a Beacon parcel map but no downloadable county parcel dataset.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m). Lyon 2024 imagery may touch only limited neighboring areas; do not imply Cottonwood countywide coverage.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Cottonwood` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Cottonwood`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Check statewide Open Parcels first; do not scrape Beacon.

---

## 07. Dakota County — Tier A

**Parcel availability:** MnGeo lists downloadable Dakota County parcel data; MetroGIS is also available.

**Official/start source:** https://gis.data.mn.gov/search?groupIds=8cdcc25a6049456e92ae754e41d3cdf2

**Imagery available/recommended:** Excellent imagery: `met25` (2025, 1 ft), `dak23` (2023, 6 in), `dak21` (2021, 6 in), `dak19` / `dak19cir` (2019, 6 in), plus older Metro layers.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Dakota` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Dakota`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Expose `dak23` separately even though `met25` is newer because 6-inch imagery is sharper.

---

## 08. Dodge County — Tier B

**Parcel availability:** Official ArcGIS Experience parcel viewer; no downloadable dataset listed by MnGeo.

**Official/start source:** https://experience.arcgis.com/experience/c0543b6276904e6b8da0a1e36a9491c8

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Dodge` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Dodge`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Resolve the Experience item to its underlying public parcel layer. Fall back to statewide Open Parcels.

---

## 09. Faribault County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Faribault` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Faribault`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use statewide Open Parcels if current; do not scrape Beacon.

---

## 10. Fillmore County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` and `fall11` / `fallcir11` (both 2011, 0.5 m; different season/collection).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Fillmore` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Fillmore`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Offer both 2011 spring and fall imagery as separate historical comparison layers. Do not scrape Beacon.

---

## 11. Freeborn County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Freeborn` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Freeborn`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Check statewide Open Parcels first; otherwise mark parcels pending.

---

## 12. Goodhue County — Tier B

**Parcel availability:** Official ArcGIS Experience/GeoHub parcel viewer; no downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://experience.arcgis.com/experience/ffadfa9bc1c04b7d804d9eb0172e70cc/

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` plus `fall11` / `fallcir11` (2011, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Goodhue` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Goodhue`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Resolve the ArcGIS app to the underlying public service and use a queryable parcel FeatureServer if exposed.

---

## 13. Houston County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` and `fall11` / `fallcir11` (2011, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Houston` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Houston`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Offer both spring and fall 2011 imagery. Use statewide Open Parcels if possible; no Beacon scraping.

---

## 14. Jackson County — Tier C

**Parcel availability:** MnGeo lists Beacon property search, and notes it is not a county-wide map interface.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Jackson` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Jackson`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Treat the Beacon property search as unsuitable for integration. Check statewide Open Parcels or official REST services.

---

## 15. Kandiyohi County — Tier C

**Parcel availability:** County has an online parcel viewer but MnGeo does not list downloadable parcel GIS data.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Kandiyohi` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Kandiyohi`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Inspect the official county viewer/service for a public REST endpoint; otherwise use statewide Open Parcels or mark pending.

---

## 16. Lac qui Parle County — Tier A

**Parcel availability:** Tax Parcels are published through the county ArcGIS Open Data Hub.

**Official/start source:** https://opendata-lqpgis.hub.arcgis.com/datasets/8f253ed11e144631b0c4b56ef6665ac8_0/explore

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Lac qui Parle` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Lac qui Parle`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the FeatureServer behind the Tax Parcels item and normalize county fields.

---

## 17. Le Sueur County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Excellent historical/local option: `lesueur21` (2021, 3 in), plus statewide NAIP and `south11` / `south11ir`.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Le Sueur` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Le Sueur`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Prioritize 2021 3-inch imagery as the sharp county layer. Use statewide Open Parcels; do not scrape Beacon.

---

## 18. Lincoln County — Tier B

**Parcel availability:** Official ArcGIS parcel map is listed; no downloadable parcel dataset in MnGeo catalog.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Lincoln` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Lincoln`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Resolve the ArcGIS item to a public FeatureServer if possible. Otherwise use statewide Open Parcels.

---

## 19. Lyon County — Tier A

**Parcel availability:** Lyon County Open GIS Data Hub provides parcel GIS data.

**Official/start source:** https://maps-lyonmn.hub.arcgis.com/

**Imagery available/recommended:** Outstanding imagery: `lyon24` (2024, 3 in in Cottonwood/Marshall/Minneota/Tracy areas and 6 in elsewhere), `lyon20` (2020, 3 in), `south11`, and 1938 historical imagery.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Lyon` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Lyon`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Expose 2024, 2020, 2011, and 1938 separately. This county is a good test of imagery-year cycling.

---

## 20. Martin County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Martin` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Martin`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Check statewide Open Parcels first; do not scrape Beacon.

---

## 21. McLeod County — Tier A

**Parcel availability:** McLeod County GIS provides downloadable GIS data.

**Official/start source:** https://www.mcleodcountymn.gov/departments/public_works/gis_(mapping___surveying)/gis_data.php

**Imagery available/recommended:** Excellent imagery: `mcle22` (2022, 4 in), `mcle18` (2018, 4 in), `mc14` (2014, 6 in natural color), plus `south11`.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `McLeod` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `McLeod`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Expose the sharper county imagery individually. Locate a live county parcel service before relying on static downloads.

---

## 22. Meeker County — Tier A

**Parcel availability:** Meeker Parcels are published through the county ArcGIS GIS Hub.

**Official/start source:** https://meeker-county-gis-meekergis.hub.arcgis.com/datasets/475abea85548405090745f2ceaaca120_0/explore

**Imagery available/recommended:** Statewide NAIP plus `meek13` (2013, 0.5 m natural color).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Meeker` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Meeker`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the parcel FeatureServer behind the Hub item. `meek13cir` is inactive; do not configure unavailable layers.

---

## 23. Mower County — Tier A

**Parcel availability:** Tax Parcels are published through the Mower County Geospatial Hub.

**Official/start source:** https://geospatial-hub-mowercountymn.hub.arcgis.com/datasets/cb79684b0f5c455fa27b16869da4b9c4_4/explore

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Mower` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Mower`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the FeatureServer behind the Hub parcel item.

---

## 24. Murray County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `murray11` (2011, 1 ft) plus `south11` / `south11ir` (2011, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Murray` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Murray`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Retain both county-specific and regional 2011 layers if they provide visibly different products. No Beacon scraping.

---

## 25. Nicollet County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Nicollet` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Nicollet`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Check statewide Open Parcels; otherwise mark parcel integration pending.

---

## 26. Nobles County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Nobles` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Nobles`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use statewide Open Parcels where available; do not scrape Beacon.

---

## 27. Olmsted County — Tier A

**Parcel availability:** Olmsted County maintains an official GIS Data Catalog and parcel map.

**Official/start source:** https://webapp.co.olmsted.mn.us/shoppingcart/site/Planning/GIS/DataCatalog/categories.aspx?CTypeid=4

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` and `fall11` / `fallcir11` (2011, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Olmsted` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Olmsted`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Look for a current public REST parcel service before integrating catalog downloads. Offer spring/fall 2011 imagery separately.

---

## 28. Pipestone County — Tier A

**Parcel availability:** Pipestone County Geospatial and Mapping Hub provides parcel GIS/open data.

**Official/start source:** https://landrecords-pipestone.hub.arcgis.com/

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Pipestone` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Pipestone`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the public parcel FeatureServer from the Hub.

---

## 29. Pope County — Tier A

**Parcel availability:** Pope County Geospatial Hub exposes parcel data.

**Official/start source:** https://hub-popecounty.hub.arcgis.com/search?tags=parcels

**Imagery available/recommended:** Use statewide 2025/2023 NAIP as primary; no special active MnGeo county orthophoto was identified in the current imagery inventory.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Pope` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Pope`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the Hub FeatureServer and keep imagery simple unless a newer official county service is discovered.

---

## 30. Redwood County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Redwood` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Redwood`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use statewide Open Parcels if available; no Beacon scraping.

---

## 31. Renville County — Tier A

**Parcel availability:** Renville County Hub publishes parcel/open GIS data.

**Official/start source:** https://hub-renvilleco.hub.arcgis.com/search?tags=Tax+Parcels

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Renville` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Renville`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the current public FeatureServer behind the Hub item.

---

## 32. Rice County — Tier A

**Parcel availability:** MnGeo lists downloadable Rice County parcel data.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Excellent imagery: `rice23` (2023, 6 in), `rice21` (2021, 6 in), `rice11` (2011, 1 ft natural color), plus `south11`.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Rice` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Rice`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Expose 2023 and 2021 separately; use 2023 6-inch as the preferred county imagery.

---

## 33. Rock County — Tier C

**Parcel availability:** MnGeo lists only a county base page, with no downloadable parcel data or county-wide parcel viewer in the catalog.

**Official/start source:** https://www.co.rock.mn.us/

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Rock` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Rock`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Search for a current official public GIS/REST service. If none exists and statewide Open Parcels lacks Rock, leave parcels pending.

---

## 34. Scott County — Tier A

**Parcel availability:** Scott County Open Data publishes parcels; MetroGIS is also available.

**Official/start source:** https://open-data-scottcounty.hub.arcgis.com/datasets/07feb1aed9364b1a9900fe0ec6f93929_0/explore

**Imagery available/recommended:** Use `met25` / `met25cir` (2025, 1 ft), plus `scott13` (2013, 6 in natural color), `scott10` (2010, 6 in natural color), and older Metro layers.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Scott` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Scott`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Prefer current county/MetroGIS parcels. Note that some older CIR Scott layers are inactive and should not be configured.

---

## 35. Sibley County — Tier B

**Parcel availability:** Official ArcGIS Experience parcel viewer; no downloadable parcel dataset listed by MnGeo.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Sibley` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Sibley`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Resolve the Experience item to a public REST parcel layer; otherwise use statewide Open Parcels.

---

## 36. Steele County — Tier A

**Parcel availability:** MnGeo lists downloadable Steele County parcel data and a county GIS Hub.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Excellent imagery: `steele22` (2022, 3 in), `steele19` (2019, 6 in), plus `south11`.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Steele` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Steele`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use 2022 3-inch as preferred local imagery; locate the live parcel service behind the county Hub.

---

## 37. Stevens County — Tier A

**Parcel availability:** Stevens County Geospatial Hub provides downloadable/open parcel GIS data.

**Official/start source:** https://geospatial-hub-stevens-county.hub.arcgis.com/

**Imagery available/recommended:** Use statewide 2025/2023 NAIP as primary unless a current county imagery service is found.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Stevens` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Stevens`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the public parcel FeatureServer from the Hub.

---

## 38. Swift County — Tier C

**Parcel availability:** MnGeo lists a GIS Midwest parcel viewer but no downloadable county parcel dataset.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Swift` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Swift`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Do not scrape the third-party viewer. Check statewide Open Parcels and official county REST sources first.

---

## 39. Traverse County — Tier A

**Parcel availability:** Traverse County ArcGIS Open Data portal provides GIS data.

**Official/start source:** https://data-traversecountymn.opendata.arcgis.com/

**Imagery available/recommended:** Use statewide 2025/2023 NAIP as primary unless a current county high-resolution imagery service is found.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Traverse` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Traverse`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the public parcel FeatureServer behind the ArcGIS Open Data item.

---

## 40. Wabasha County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Exceptional imagery: `wab25` (2025, 2 in), plus statewide NAIP, `south11`, and `fall11`.

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Wabasha` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Wabasha`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use `wab25` as the preferred county imagery. Check statewide Open Parcels; do not scrape Beacon.

---

## 41. Waseca County — Tier A

**Parcel availability:** MnGeo lists downloadable Waseca County parcel data.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Waseca` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Waseca`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Resolve the MnGeo dataset to its current FeatureServer/download source and prefer a queryable service.

---

## 42. Watonwan County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Watonwan` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Watonwan`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use statewide Open Parcels where possible; do not scrape Beacon.

---

## 43. Winona County — Tier C

**Parcel availability:** MnGeo lists Beacon parcel mapping only.

**Official/start source:** https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` and `fall11` / `fallcir11` (2011, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Winona` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Winona`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Offer spring/fall historical imagery separately. Use statewide Open Parcels; no Beacon scraping.

---

## 44. Yellow Medicine County — Tier A

**Parcel availability:** Tax Parcels are published through Yellow Medicine County ArcGIS Open Data.

**Official/start source:** https://shareopendata-yellowmedicine.hub.arcgis.com/datasets/b541e04a4c204811ab3251a980b92138_0/explore

**Imagery available/recommended:** Statewide NAIP; `south11` / `south11ir` (2011 spring, 0.5 m).

**Codex instructions:**

1. Keep the shared statewide NAIP, Composite, lidar/terrain, hillshade, and public-land implementation unchanged.
2. Add the county/regional imagery named above as separate layer-registry entries only after verifying the service is currently active and its coverage extent.
3. Query the statewide Open Parcels metadata for `Yellow Medicine` before building a county-specific parcel adapter.
4. Prefer a fresher/richer official county FeatureServer when one exists.
5. Normalize county fields into the existing shared parcel model.
6. Do not put `Yellow Medicine`-specific conditions into the main map/UI components.
7. Test opacity, ordering, extent clipping, parcel identify, zoom behavior, and regressions.

**County-specific note:** Use the public FeatureServer behind the parcel item.

---
# Recommended Codex execution batches

Do not hand Codex all 44 counties as one unreviewed implementation.

## Batch S1 — strong open-data sources + standout imagery

1. Dakota
2. Lyon
3. McLeod
4. Rice
5. Steele
6. Carver
7. Scott
8. Wabasha

**Checkpoint**

- Confirm local high-resolution imagery layers respect county/coverage extents.
- Confirm a newer but lower-resolution layer does not erase access to an older sharper layer.
- Confirm parcel normalization still works without special-case UI code.

## Batch S2 — straightforward open-data counties

1. Big Stone
2. Brown
3. Chippewa
4. Lac qui Parle
5. Meeker
6. Mower
7. Pipestone
8. Pope
9. Renville
10. Stevens
11. Traverse
12. Waseca
13. Yellow Medicine

**Checkpoint**

- Verify ArcGIS Hub items are resolved to direct service endpoints where possible.
- Verify no entire parcel datasets are pulled into the browser unnecessarily.

## Batch S3 — ArcGIS/app-resolved or official custom sources

1. Dodge
2. Goodhue
3. Lincoln
4. Olmsted
5. Sibley
6. Kandiyohi
7. Rock

**Checkpoint**

- Any county without a clean anonymous parcel service should remain `pending`.
- Do not weaken the architecture to force a viewer-only source into the app.

## Batch S4 — southeastern imagery/history group

1. Fillmore
2. Houston
3. Winona
4. Le Sueur
5. Murray

**Checkpoint**

- Verify spring/fall imagery is labeled clearly.
- Verify imagery date and resolution are visible in layer metadata.
- Verify inactive MnGeo layers are not configured.

## Batch S5 — remaining difficult/viewer-only counties

1. Blue Earth
2. Cottonwood
3. Faribault
4. Freeborn
5. Jackson
6. Martin
7. Nicollet
8. Nobles
9. Redwood
10. Swift
11. Watonwan

For these counties, an acceptable finished state may be:

- county recognized ✅
- current/statewide imagery ✅
- county historical imagery where available ✅
- lidar/terrain ✅
- public land ✅
- private parcels pending ⚠️

No scraping should be introduced merely to eliminate the pending status.

---

# Definition of done — South zone

The South-zone expansion is complete when:

- All 44 counties in this file are recognized by the application.
- Combined with the North spec, all 87 Minnesota counties are covered.
- Statewide imagery, lidar/terrain, hillshade, public lands, pins, and coordinate features remain seamless.
- Selected high-resolution county/regional imagery layers are available through the same common layer UI.
- Coverage-limited imagery never appears to be countywide when it is not.
- Every county with a clean public parcel source is integrated through the normalized parcel system.
- Viewer-only/problem counties fail gracefully with parcels explicitly marked pending.
- There is no county-specific map UI fork.
- Adding or repairing a county primarily means editing its adapter/configuration.
- Build, typecheck, lint, and interactive regression checks pass.

---

# Research references

Primary sources used for this spec:

- MnGeo parcel/ownership county source catalog:  
  https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/land-ownership/property.jsp
- MnGeo Geospatial Image Service layer inventory:  
  https://mn.gov/mngeo/gis-data-and-maps/web-map-services/mngeo-image-service/data.jsp
- MnGeo Geospatial Image Service technical information:  
  https://mn.gov/mngeo/gis-data-and-maps/web-map-services/mngeo-image-service/technical.jsp
- MnGeo Composite Image Service:  
  https://mn.gov/mngeo/gis-data-and-maps/web-map-services/composite-image-service/
- Minnesota statewide Open Parcels FeatureServer:  
  https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer
- Minnesota county GIS contacts:  
  https://mn.gov/mngeo/community/gis-contacts/county-gis-contacts/

## Maintenance rule

GIS URLs and county systems change.

The source URLs in this file are **researched starting points**, not promises that a given endpoint will remain unchanged forever.

Codex must verify each endpoint at implementation time and store the actual verified direct service URL in the application configuration.

If a source stops working later, repair the county adapter rather than changing core map behavior.
