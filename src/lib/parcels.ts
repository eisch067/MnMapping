import type { ParcelFieldMap } from "@/config/layers/types";

export interface Parcel {
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

export function normalizeParcel(county: string, fields: ParcelFieldMap, attributes: Record<string, unknown>): Parcel {
  const text = (field?: string) => field && attributes[field] != null ? String(attributes[field]) : undefined;
  const number = (field?: string) => {
    const value = field ? Number(attributes[field]) : Number.NaN;
    return Number.isFinite(value) ? value : undefined;
  };
  return {
    county,
    parcelId: text(fields.parcelId) ?? "Unknown",
    owner: text(fields.owner),
    secondaryOwner: text(fields.secondaryOwner),
    siteAddress: text(fields.siteAddress),
    mailingAddress: text(fields.mailingAddress),
    acres: number(fields.acres),
    legalDescription: text(fields.legalDescription),
    assessedValue: number(fields.assessedValue),
    taxYear: number(fields.taxYear),
  };
}
