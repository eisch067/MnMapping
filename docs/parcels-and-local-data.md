# Parcels and local data

Parcel services are queried by viewport only at parcel-scale camera heights. County adapters map source fields into the shared `Parcel` model, keeping geometry transport separate from normalized popup attributes. Thirty-one north-expansion counties and Becker use the official statewide MnGeo Open Parcels layer with a county-code filter and 35 km camera-height threshold. Aitkin, Hubbard, Todd, and Douglas retain verified direct public services. Douglas County emphasizes that its parcel layer is a reference compilation, not a survey.

Aitkin uses the county's public `ParcelTaxData` FeatureServer, which supports bounded GeoJSON queries and publishes parcel ID, owner, physical address, deeded acres, legal description, assessed value, and tax year. The direct service, field mapping, CORS behavior, and a bounded geometry query were verified on 2026-09-14. MnGeo's statewide Open Parcels metadata also listed Aitkin with 43,024 parcel records at verification time; the county service was selected because it is direct and exposes richer current assessment attributes.

Beltrami, Kanabec, Kittson, Mahnomen, Pine, Roseau, and Wadena remain pending because the statewide metadata lists them but the parcel polygon layer returned no matching records, and no other repeatable query service was verified. See [`north-region-status.md`](north-region-status.md) for the batch record.

Map inspection shows live desktop coordinates and a click coordinate that can be copied. Public-land and parcel features use the same Cesium selection/identify path.

Pins and drawings use GeoJSON-compatible geometry and are stored in IndexedDB. Preferences alone remain in localStorage. The My Data panel can hide personal data, delete individual/all objects, import GPX/KML/GeoJSON, and export GPX/KML/GeoJSON. No personal geometry is uploaded by MnMapping.

GPX represents polygons as tracks because GPX has no polygon primitive. KML and GeoJSON preserve areas. Measurements are deliberately labeled approximate.
