# South of I-94 county checklist

This checklist covers the 44 counties assigned to the south-of-I-94 v1.0 region. Complete the shared regional work first, then sign off counties one at a time. A county may remain parcel-pending when the source investigation is recorded and no maintainable anonymous service exists.

## Region-wide work

- [ ] Add ArcGIS pagination or a visible truncation warning for every parcel and public-land query that returns exceededTransferLimit.
- [ ] Add loading, retry, failure, and stale-request protection for imagery and feature layers.
- [ ] Run an automated registry audit for every county in this file: unique IDs, FIPS, bounds, zone, imagery order, parcel status, and county-land filter.
- [ ] Run a repeatable remote-source smoke test and record the verification date without making routine tests depend on network access.
- [ ] Verify cross-county panning loads and removes the correct county catalogs without restarting the map.
- [ ] Verify county imagery overrides statewide imagery and the basemap while contours, public land, and parcels remain visible above it.
- [ ] Validate the 2-foot contour property-scale lock, disabled overlay, rendering performance, and automatic hiding after zooming out.
- [ ] Re-audit the 16 parcel-pending counties as a focused source batch.
- [ ] Re-audit the 20 counties without MnGeo county-fee/tax-forfeit records as a focused public-land batch.
- [ ] Re-audit the 3 counties currently limited to statewide imagery as a focused imagery batch.
- [ ] Record evidence for every source decision: official URL, layer ID, fields, record count, acquisition/freshness date, access meaning, and verification date.

## County-by-county work

### Big Stone County

Current: FIPS 27011; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Blue Earth County

Current: FIPS 27013; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Brown County

Current: FIPS 27015; S2; MnGeo imagery configured; direct Brown County parcels; official local-parks supplement. Brown County's portal catalogs public 2026 and 2023 EagleView mosaics, but its contract limits the Connect Image Service to internal organizational use and no third-party reuse license is published, so both are linked externally rather than integrated.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [x] Rechecked the official county GIS and integrated the anonymous `Brown_County_Production_Public_Parcels` FeatureServer: 18,481 polygons, stable bounded queries, parcel IDs, and no published owner information.
- [x] Integrated 52 official city, county, and state park polygons with park name, type, city, and address; two private-city features are excluded and access remains labeled `access varies`.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Carver County

Current: FIPS 27019; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Chippewa County

Current: FIPS 27023; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Cottonwood County

Current: FIPS 27033; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Dakota County

Current: FIPS 27037; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Dodge County

Current: FIPS 27039; S3; county imagery configured; direct parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Faribault County

Current: FIPS 27043; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Fillmore County

Current: FIPS 27045; S4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Freeborn County

Current: FIPS 27047; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Goodhue County

Current: FIPS 27049; S3; county imagery configured; direct parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Houston County

Current: FIPS 27055; S4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Jackson County

Current: FIPS 27063; S5; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Kandiyohi County

Current: FIPS 27067; S3; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Lac qui Parle County

Current: FIPS 27073; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Le Sueur County

Current: FIPS 27079; S4; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Lincoln County

Current: FIPS 27081; S3; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Lyon County

Current: FIPS 27083; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### McLeod County

Current: FIPS 27085; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Martin County

Current: FIPS 27091; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Meeker County

Current: FIPS 27093; S2; county imagery configured; direct parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Mower County

Current: FIPS 27099; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Murray County

Current: FIPS 27101; S4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Nicollet County

Current: FIPS 27103; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Nobles County

Current: FIPS 27105; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Olmsted County

Current: FIPS 27109; S3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Pipestone County

Current: FIPS 27117; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Pope County

Current: FIPS 27121; S2; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Redwood County

Current: FIPS 27127; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Renville County

Current: FIPS 27129; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Rice County

Current: FIPS 27131; S1; county imagery configured; MnGeo parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Rock County

Current: FIPS 27133; S3; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Scott County

Current: FIPS 27139; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Sibley County

Current: FIPS 27143; S3; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Steele County

Current: FIPS 27147; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Stevens County

Current: FIPS 27149; S2; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Swift County

Current: FIPS 27151; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Traverse County

Current: FIPS 27155; S2; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Wabasha County

Current: FIPS 27157; S1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Waseca County

Current: FIPS 27161; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Watonwan County

Current: FIPS 27165; S5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Winona County

Current: FIPS 27169; S4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Yellow Medicine County

Current: FIPS 27173; S2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.
