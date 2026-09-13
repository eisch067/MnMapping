# Step 16 — OnX-Oriented Export and Later Enhancements

## Goal
Make MnMapping work conveniently with the user's existing recreation mapping workflow without making OnX integration a dependency of the core application.

## First approach
Research the file formats/import paths OnX currently accepts and generate compatible GPX/KML exports where possible.

Do not depend on undocumented private OnX APIs.

## Possible later features
- one-click export of selected pins/tracks for OnX import
- imagery swipe comparison
- elevation profiles
- slope/aspect
- local contour generation
- print/PDF map export
- offline-area packaging if practical
- search by parcel ID/address
- bookmarks/saved viewpoints
- additional Minnesota counties
- optional lightweight account/cloud sync only if the personal-use model outgrows browser storage

## Explicitly deferred
- Supabase/Postgres
- authentication
- social/sharing features
- commercial billing
- large hosted geospatial warehouse

## Acceptance criteria
- The project remains useful without implementing anything in this file.
- Future enhancements can be added without changing the core county/layer architecture.
