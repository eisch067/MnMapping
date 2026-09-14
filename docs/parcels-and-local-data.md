# Parcels and local data

Parcel services are viewport queried only when the camera is below 35 km. County adapters map source fields into the shared `Parcel` model, keeping geometry transport separate from normalized popup attributes. Hubbard and Todd have verified official public parcel services enabled; other initial counties remain explicit adapter work until an authoritative, publicly queryable service and its usage limits are confirmed.

Map inspection shows live desktop coordinates and a click coordinate that can be copied. Public-land and parcel features use the same Cesium selection/identify path.

Pins and drawings use GeoJSON-compatible geometry and are stored in IndexedDB. Preferences alone remain in localStorage. The My Data panel can hide personal data, delete individual/all objects, import GPX/KML/GeoJSON, and export GPX/KML/GeoJSON. No personal geometry is uploaded by MnMapping.

GPX represents polygons as tracks because GPX has no polygon primitive. KML and GeoJSON preserve areas. Measurements are deliberately labeled approximate.
