# North of I-94 county checklist

This checklist covers the 43 counties assigned to the north-of-I-94 v1.0 region. Complete the shared regional work first, then sign off counties one at a time. A county may remain parcel-pending when the source investigation is recorded and no maintainable anonymous service exists.

## Region-wide work

- [ ] Add ArcGIS pagination or a visible truncation warning for every parcel and public-land query that returns exceededTransferLimit.
- [ ] Add loading, retry, failure, and stale-request protection for imagery and feature layers.
- [ ] Run an automated registry audit for every county in this file: unique IDs, FIPS, bounds, zone, imagery order, parcel status, and county-land filter.
- [ ] Run a repeatable remote-source smoke test and record the verification date without making routine tests depend on network access.
- [ ] Verify cross-county panning loads and removes the correct county catalogs without restarting the map.
- [ ] Verify county imagery overrides statewide imagery and the basemap while contours, public land, and parcels remain visible above it.
- [ ] Validate the 2-foot contour property-scale lock, disabled overlay, rendering performance, and automatic hiding after zooming out.
- [ ] Re-audit the 7 parcel-pending counties as a focused source batch.
- [ ] Re-audit the 11 counties without MnGeo county-fee/tax-forfeit records as a focused public-land batch.
- [ ] Re-audit the 8 counties currently limited to statewide imagery as a focused imagery batch.
- [ ] Record evidence for every source decision: official URL, layer ID, fields, record count, acquisition/freshness date, access meaning, and verification date.

## County-by-county work

### Aitkin County

Current: FIPS 27001; Initial; county imagery configured; direct parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Anoka County

Current: FIPS 27003; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Becker County

Current: FIPS 27005; Initial; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Beltrami County

Current: FIPS 27007; Initial; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Benton County

Current: FIPS 27009; N1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Carlton County

Current: FIPS 27017; N1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Cass County

Current: FIPS 27021; N4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Chisago County

Current: FIPS 27025; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Clay County

Current: FIPS 27027; N2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Clearwater County

Current: FIPS 27029; N4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Cook County

Current: FIPS 27031; N2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Crow Wing County

Current: FIPS 27035; N1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Douglas County

Current: FIPS 27041; Initial; county imagery configured; direct parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Grant County

Current: FIPS 27051; N2; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Hennepin County

Current: FIPS 27053; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Hubbard County

Current: FIPS 27057; Initial; county imagery configured; direct parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Isanti County

Current: FIPS 27059; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Itasca County

Current: FIPS 27061; N1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Kanabec County

Current: FIPS 27065; N5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Kittson County

Current: FIPS 27069; N5; statewide imagery only; parcels pending; county-land source gap.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Koochiching County

Current: FIPS 27071; N5; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Lake County

Current: FIPS 27075; N4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Lake of the Woods County

Current: FIPS 27077; N5; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Mahnomen County

Current: FIPS 27087; N4; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Marshall County

Current: FIPS 27089; N5; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Mille Lacs County

Current: FIPS 27095; N1; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Morrison County

Current: FIPS 27097; N1; county imagery configured; MnGeo parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Norman County

Current: FIPS 27107; N5; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Otter Tail County

Current: FIPS 27111; N1; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Pennington County

Current: FIPS 27113; N5; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Pine County

Current: FIPS 27115; N5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Polk County

Current: FIPS 27119; N2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Ramsey County

Current: FIPS 27123; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Red Lake County

Current: FIPS 27125; N4; statewide imagery only; MnGeo parcels; MnGeo county-land records.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Roseau County

Current: FIPS 27135; N5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Sherburne County

Current: FIPS 27141; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### St. Louis County

Current: FIPS 27137; N4; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Stearns County

Current: FIPS 27145; N3; statewide imagery only; MnGeo parcels; county-land source gap.

- [ ] Search official county and MnGeo catalogs for a stable county imagery service; add verified coverage or document statewide-only imagery.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Todd County

Current: FIPS 27153; Initial; county imagery configured; direct parcels; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Reverify the direct county parcel endpoint, layer ID, field mapping, bounded geometry, and popup values against the official source.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Wadena County

Current: FIPS 27159; N5; county imagery configured; parcels pending; county-land source gap.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Recheck MnGeo and official county GIS for a stable anonymous parcel endpoint; integrate it or record the evidence for keeping parcels pending.
- [ ] Search official county GIS for county-owned recreation land, tax-forfeited land, county forest, parks, or open-space polygons; integrate a clear source or record that none is suitable.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Washington County

Current: FIPS 27163; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Wilkin County

Current: FIPS 27167; N2; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

### Wright County

Current: FIPS 27171; N3; county imagery configured; MnGeo parcels; MnGeo county-land records.

- [ ] Visually verify every configured county imagery vintage, bounds, labels, newest-first order, and county-over-state rendering.
- [ ] Verify the bounded MnGeo Open Parcels query, acquisition metadata, geometry, and normalized popup fields.
- [ ] Verify the county-filtered County Fee/Tax Forfeit geometry, popup fields, and access warning from MnGeo Government Ownership.
- [ ] Run county sign-off: location search, initial camera, layer groups, imagery priority, parcel/public-land click details, 2-foot contour zoom lock, boundary crossing, and preference reload.

