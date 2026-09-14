# Step 12 — Initial Five County Parcel Adapters

## Goal
Add private parcel boundaries and useful ownership information for the first five counties.

## Order
1. Hubbard
2. Beltrami
3. Becker
4. Todd
5. Douglas

## Per-county checklist
- Locate authoritative parcel geometry service.
- Determine whether ownership/assessment attributes are in the same service.
- Determine usage/access limitations.
- Record field mappings.
- Add parcel geometry.
- Add click/identify query.
- Normalize fields into the common Parcel model.
- Verify several parcels manually against the county's own viewer.

## Display rules
- Do not draw parcel polygons statewide at low zoom.
- Begin loading parcels only when the user is close enough for them to be meaningful.
- Use understated parcel styling so aerial imagery remains readable.

## Acceptance criteria
- Each initial county can display parcel lines.
- Clicking a parcel returns parcel ID and whatever owner/address/acreage fields are legitimately exposed.
- Crossing a county line does not require reloading the application.
