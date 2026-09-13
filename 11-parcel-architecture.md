# Step 11 — Private Parcel Architecture

## Goal
Create a standard parcel interface so counties can expose differently named fields without changing the rest of the application.

## Internal parcel model
At minimum support:
```ts
interface Parcel {
  county: string;
  parcelId: string;
  owner?: string;
  secondaryOwner?: string;
  siteAddress?: string;
  mailingAddress?: string;
  acres?: number;
  legalDescription?: string;
  assessedValue?: number;
  taxYear?: number;
}
```

## Requirements
- Parcel geometry and parcel attributes are separate concerns internally.
- County adapter maps county field names to the common model.
- Unknown/missing county fields are allowed.
- Geometry should only load/query at useful zoom levels.
- Do not attempt to build a statewide local parcel database.

## Example adapter concept
```ts
parcelSource: {
  type: 'arcgis-feature',
  url: '...',
  fields: {
    parcelId: 'PID',
    owner: 'OWNER_NAME',
    acres: 'ACRES'
  }
}
```

## Acceptance criteria
- A mock county can map arbitrary source fields into the common parcel popup.
- Main parcel UI never references county-specific field names.
