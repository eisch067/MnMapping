# Location-first startup

MnMapping starts with a location prompt instead of initializing the full viewer at a statewide extent. Users can search for a Minnesota address, city, coordinate, or county, or use a lightweight transportation map to select a point.

## Search and selection

- Text searches use the public ArcGIS World Geocoding Service with a Minnesota search extent.
- Coordinates are accepted in either latitude/longitude or longitude/latitude order when the values fall within Minnesota.
- Map selection uses Esri World Street Map only. Its code, viewer, and initial tiles begin loading during browser idle time so the map opens promptly without delaying the location form. Detailed imagery and terrain are not created until the point is confirmed.
- Selecting a point immediately begins reverse geocoding. The confirmation card shows the resolved place and county as soon as they arrive, and confirming reuses that result rather than issuing the same lookup again.
- Reverse geocoding identifies the county for coordinate and map selections.
- Searches and selected locations are not persisted by MnMapping.

## Loading behavior

After selection, the camera starts at the chosen place rather than the statewide extent. The header keeps the chosen address/place and its county visible. County-specific options then follow the current camera viewport: panning into a supported county adds its catalog, leaving it removes that catalog, and zooming out can expose multiple intersecting counties. County adapters outside the visible area are not shown or rendered.

Imagery and terrain providers are lazy: a hidden provider is created only when its layer is first enabled. The default statewide composite therefore requests tiles only around the chosen camera extent, while optional county vintages, lidar hillshade, and 3D terrain produce no requests until used.

The county registry includes all 87 Minnesota counties across the v1.0 North and South zones. County recognition, viewport bounds, layer lists, parcel status, and source type come from this shared registry, so expansion and source repairs do not require branches in the map UI.
