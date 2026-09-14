# Imagery source inventory

Verified against live service metadata on September 13, 2026.

## Statewide

MnGeo's Composite Image Service is the `Best Available` layer. Its selection changes by location and scale using imagery quality, resolution, recency, coverage, and season. Separate natural-color NAIP layers are configured for 2025 (0.6 meter), 2023 (0.3 meter), and 2021 (0.6 meter). All requests go directly from the browser to MnGeo.

- Composite: `https://imageserver.gisdata.mn.gov/cgi-bin/mncomp?`, layer `mncomp`
- NAIP and county WMS: `https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?`

The composite service advertises only EPSG:26915 but was verified to return Web Mercator JPEG requests using WMS 1.1.1, which is required by Cesium's standard imagery tiling.

## Hubbard County

Official cached services from Hubbard County GIS are configured for 2026 (spring, 6 inches), 2023 (spring, mixed 6/9 inches), 2020 (summer, 3 inches), 2017 (spring, 9 inches), 2013–2014 SAIP (resolution/season not published), and 2011 (spring, 9 inches).

The county catalog also publishes older CIR, partial fall, NAIP, hillshade, and 2025 storm-response services. Those are intentionally excluded from the normal high-resolution natural-color catalog because they are duplicate statewide products, non-natural-color/special-purpose layers, or partial operational imagery.

## Aitkin County

MnGeo's active `fall11` and `fallcir11` WMS layers provide 2011 fall natural-color and color-infrared imagery at 0.5-meter resolution. Both are exposed as separate Aitkin choices and clipped to the county adapter bounds. The WMS capabilities, layer names, resolution, and published coverage were verified on 2026-09-14.

## North-region expansion

The remaining v1.0 North counties use a shared catalog of active MnGeo WMS layers. It includes verified Metro, county, fall, North 1-foot, northern-border, Arrowhead, and north-central acquisitions from 2009 through 2025. Each county references only relevant presets, while each preset retains the service's published coverage rectangle. The complete selection and deferred unverified county imagery are recorded in [`north-region-status.md`](north-region-status.md).

## Beltrami County

MnGeo-hosted natural-color layers are configured for 2023 (9 inches), 2020 (9 inches), and the joint 2014 Polk/Beltrami acquisition (1 foot). Published WMS coverage bounds are stored on each layer.

## Becker County

Official Becker County cached services are configured for 2024 and 2021. Their service records do not publish acquisition season or source resolution, so those values remain explicitly unknown. County services named 2013 and 2015 identify themselves as NAIP and are excluded because the statewide catalog already provides NAIP vintages.

## Todd County

Official Todd County/Pictometry services are configured for the 2020 county flight (resolution/season not published), 2018 city refly (spring, 4 inches), 2017 county flight (spring, 9 inches), 2013 city flight (spring, 6 inches), 2013 county flight (spring, 9 inches), and 2008 county flight (12 inches). The 2017 city flight is excluded because the county metadata says it was too green and was superseded by the 2018 refly.

Todd's caches use a county coordinate system unsupported by Cesium's tiled ArcGIS provider, so those layers deliberately use the services' dynamic export operation.

## Douglas County

MnGeo-hosted natural-color layers are configured for 2022 (2 inches) and 2016 (3 inches), with their published WMS coverage bounds. Douglas County's EagleView service was not selected because the public metadata does not establish open reuse terms for its licensed imagery.

## Browser access

MnGeo returns permissive CORS headers and is accessed directly. The official Hubbard, Becker, and Todd ArcGIS servers do not return browser CORS headers. A read-only, allowlisted route proxies only those three fixed government service roots; it cannot proxy arbitrary hosts or accept write methods.
