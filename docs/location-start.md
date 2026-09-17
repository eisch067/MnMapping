# Location-first startup

MnMapping starts with three numbered paths instead of initializing the full imagery and terrain viewer:

1. **Enter a location** searches for an address, coordinates, city, ZIP code, county, or place name.
2. **Select on a map** opens the lightweight transportation map for choosing a precise point.
3. **Explore available imagery** opens the new statewide county explorer, where users can click any of Minnesota's 87 counties or use the keyboard-accessible county list to preview imagery availability before entering the main map.

## Search and selection

- Text searches use the public ArcGIS World Geocoding Service with a Minnesota search extent.
- Coordinates are accepted in either latitude/longitude or longitude/latitude order when the values fall within Minnesota.
- The precise-point map uses Esri World Street Map. The separate imagery explorer adds MnGeo's official Minnesota County Boundaries layer, a visible border around every county, and alternating county colors. Detailed imagery and terrain are not created until a county, point, or search result is confirmed.
- Selecting a county opens three side-by-side source lists: State-wide Imagery, County Wide Imagery, and Other Imagery. Each list explains its source category and shows imagery name, year, detail, and notes. The best statewide and county-specific choices are identified, while the newest dated natural-color imagery MnMapping can display opens automatically. The Explore County action remains in the title bar for a consistent location across counties.
- Known newer or more detailed sources that cannot be embedded are linked separately with their year and the source-specific licensing or access explanation. These records live in `src/config/restrictedImagery.ts` so additional counties can be added without branching the interface.
- County polygons are mouse-selectable, and the complete county list provides the equivalent keyboard and screen-reader path. A visible retry message appears if the boundary service fails.
- Searches and selected locations are not persisted by MnMapping.

## Loading behavior

After selection, the camera starts at the chosen place rather than the statewide extent. The header keeps the chosen address/place and its county visible. County-specific options then follow the current camera viewport: panning into a supported county adds its catalog, leaving it removes that catalog, and zooming out can expose multiple intersecting counties. County adapters outside the visible area are not shown or rendered.

Imagery and terrain providers are lazy: a hidden provider is created only when its layer is first enabled. The default statewide composite therefore requests tiles only around the chosen camera extent, while optional county vintages, lidar hillshade, and 3D terrain produce no requests until used.

The county registry includes all 87 Minnesota counties across the v1.0 North and South zones. County recognition, viewport bounds, layer lists, parcel status, and source type come from this shared registry, so expansion and source repairs do not require branches in the map UI.
