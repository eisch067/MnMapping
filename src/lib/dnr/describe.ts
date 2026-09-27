import type {
  DnrLayerInfo,
  DnrLinkField,
  DnrNameLinkTable,
  LayerDefinition,
  LayerPopupField,
} from "@/config/layers/types";
import type { IdentifyLake, IdentifyLink, IdentifyRow } from "@/lib/identify/types";
import { isDow } from "./lakefinder";
import { isDnrPage } from "./links";
import { dnrAttribution, meaningStatements, verifyLinkLabel } from "./meaning";

export interface DnrFeatureDetails {
  title: string;
  rows: IdentifyRow[];
  moreRows: IdentifyRow[];
  notes: string[];
  links: IdentifyLink[];
  banner?: string;
  attribution: string;
  lake?: IdentifyLake;
}

type Attributes = Record<string, unknown>;

// DNR pads empty text fields with a space, so a value counts only once trimmed.
function textOf(value: unknown, isDate: boolean): string | undefined {
  if (typeof value === "number" && isDate) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
  }
  // DNR stores areas and lengths to many decimal places, which read as noise on a phone.
  if (typeof value === "number") return String(Number(value.toFixed(2)));
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function rowsFor(
  fields: readonly LayerPopupField[],
  attributes: Attributes,
  dateFields: readonly string[],
): IdentifyRow[] {
  return fields.flatMap(({ field, label }) => {
    const value = textOf(attributes[field], dateFields.includes(field));
    return value === undefined ? [] : [{ label, value }];
  });
}

function seasonLabel(dnr: DnrLayerInfo, attributes: Attributes): string | undefined {
  if (!dnr.season) return undefined;
  return dnr.season.source === "configured"
    ? dnr.season.label
    : textOf(attributes[dnr.season.field], false);
}

function linkFor(field: DnrLinkField, attributes: Attributes): IdentifyLink[] {
  const value = textOf(attributes[field.field], false);
  if (value === undefined || field.excludedValues?.includes(value)) return [];
  const href = field.baseUrl ? `${field.baseUrl}${encodeURIComponent(value)}` : value;
  return isDnrPage(href) ? [{ label: field.label, href }] : [];
}

function nameLinkFor(table: DnrNameLinkTable, attributes: Attributes): IdentifyLink[] {
  const value = textOf(attributes[table.field], false);
  const href = value === undefined ? undefined : table.pages[value];
  if (href === undefined || !isDnrPage(href)) return [];
  return [{ label: table.label, href }];
}

function linksFor(dnr: DnrLayerInfo, attributes: Attributes): IdentifyLink[] {
  const all = [
    { label: verifyLinkLabel, href: dnr.verifyUrl },
    ...(dnr.links ?? []),
    ...(dnr.linkFields ?? []).flatMap((field) => linkFor(field, attributes)),
    ...(dnr.nameLinks ?? []).flatMap((table) => nameLinkFor(table, attributes)),
  ];
  const seen = new Set<string>();
  return all.filter((link) => !seen.has(link.href) && seen.add(link.href));
}

function titleFor(layer: LayerDefinition, dnr: DnrLayerInfo, attributes: Attributes): string {
  const name = layer.nameField ? textOf(attributes[layer.nameField], false) : undefined;
  return name === undefined ? layer.name : `${dnr.titlePrefix ?? ""}${name}`;
}

function lakeFor(dnr: DnrLayerInfo, attributes: Attributes): IdentifyLake | undefined {
  if (!dnr.lake) return undefined;
  const dow = textOf(attributes[dnr.lake.dowField], false);
  if (dow === undefined || !isDow(dow)) return undefined;
  const name = dnr.lake.nameField ? textOf(attributes[dnr.lake.nameField], false) : undefined;
  return { dow, name };
}

export function describeDnrFeature(
  layer: LayerDefinition,
  dnr: DnrLayerInfo,
  attributes: Attributes,
): DnrFeatureDetails {
  const dateFields = dnr.dateFields ?? [];
  const season = seasonLabel(dnr, attributes);
  const banner = dnr.alertField ? textOf(attributes[dnr.alertField], false) : undefined;
  return {
    title: titleFor(layer, dnr, attributes),
    rows: [
      ...(season === undefined ? [] : [{ label: "Season", value: season }]),
      ...rowsFor(layer.popupFields ?? [], attributes, dateFields),
    ],
    moreRows: rowsFor(dnr.moreFields ?? [], attributes, dateFields),
    notes: [
      meaningStatements[dnr.meaningClass],
      ...(dnr.notes ?? []),
      ...(dnr.caution ? [dnr.caution] : []),
    ],
    links: linksFor(dnr, attributes),
    banner,
    attribution: dnrAttribution,
    lake: lakeFor(dnr, attributes),
  };
}
