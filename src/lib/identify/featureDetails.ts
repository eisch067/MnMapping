import type { LayerDefinition, LayerPopupField, ParcelFieldMap } from "@/config/layers/types";
import { normalizeParcel } from "@/lib/parcels";
import type { IdentifyLink, IdentifyRow } from "./types";

export interface FeatureDetails {
  title: string;
  rows: IdentifyRow[];
  notes: string[];
  links: IdentifyLink[];
}

const accessMeaningNotes: Record<NonNullable<LayerDefinition["accessMeaning"]>, string> = {
  "public-access": "Published as publicly accessible; verify current site rules.",
  "managed-land": "Managed land; access restrictions may apply.",
  "administrative-boundary":
    "Administrative or management boundary, not proof that every acre is publicly owned.",
  "access-varies":
    "Ownership interest and public access vary by parcel; verify before entering.",
};

export function describeFeature(
  layer: LayerDefinition,
  attributes: Record<string, unknown>,
): FeatureDetails {
  const fields = layer.parcelFields
    ? parcelPopupFields(layer.parcelFields)
    : (layer.popupFields ?? []);
  const rows = fields.flatMap(({ field, label }) => {
    const value = attributes[field];
    return value === null || value === undefined || value === ""
      ? []
      : [{ label, value: String(value) }];
  });
  rows.push({ label: "Source", value: layer.agency ?? layer.attribution });
  const note = layer.accessMeaning ? accessMeaningNotes[layer.accessMeaning] : undefined;
  return {
    title: featureTitle(layer, attributes),
    rows,
    notes: note ? [note] : [],
    links: layer.recordsUrl
      ? [{ label: "Look up ownership & tax records on the county site", href: layer.recordsUrl }]
      : [],
  };
}

function featureTitle(layer: LayerDefinition, attributes: Record<string, unknown>): string {
  const name = layer.nameField ? attributes[layer.nameField] : undefined;
  if (typeof name === "string" && name.trim()) return name;
  if (layer.parcelFields && layer.county) {
    return `Parcel ${normalizeParcel(layer.county, layer.parcelFields, attributes).parcelId}`;
  }
  return layer.name;
}

function parcelPopupFields(fields: ParcelFieldMap): LayerPopupField[] {
  return [
    { field: fields.parcelId, label: "Parcel ID" },
    fields.owner && { field: fields.owner, label: "Owner" },
    fields.secondaryOwner && { field: fields.secondaryOwner, label: "Secondary owner" },
    fields.siteAddress && { field: fields.siteAddress, label: "Site address" },
    fields.mailingAddress && { field: fields.mailingAddress, label: "Mailing address" },
    fields.acres && { field: fields.acres, label: "Acres" },
    fields.legalDescription && { field: fields.legalDescription, label: "Legal description" },
    fields.assessedValue && { field: fields.assessedValue, label: "Assessed value" },
    fields.taxYear && { field: fields.taxYear, label: "Tax year" },
  ].filter((entry): entry is LayerPopupField => Boolean(entry));
}
