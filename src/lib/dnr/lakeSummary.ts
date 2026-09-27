import type { IdentifyLink, IdentifyRow } from "@/lib/identify/types";
import type { LakeFinderOutcome, LakeRecord } from "./lakefinder";
import { lakeMapPath } from "./lakeMap";
import { dnrAttribution, verifyLinkLabel } from "./meaning";

export interface LakeRegulationEntry {
  species: string;
  text: string;
  location: string;
}

export interface LakeRegulations {
  entries: LakeRegulationEntry[];
  emptyMessage?: string;
  verifyLink: IdentifyLink;
}

export interface LakeSummaryView {
  title: string;
  // Present when the summary is only links: no record, no answer, or an unreadable answer.
  notice?: string;
  facts: IdentifyRow[];
  regulations?: LakeRegulations;
  // Invasive species and DNR's notes, hidden when DNR lists none.
  details: IdentifyRow[];
  species?: { heading: string; names: string[]; caveat: string };
  links: IdentifyLink[];
  attribution: string;
}

export interface LakeSummaryInput {
  dow: string;
  // The lake's name from the result that opened the summary, used until DNR's own is known.
  fallbackName?: string;
  outcome: LakeFinderOutcome;
}

const lakeFinderRoot = "https://www.dnr.state.mn.us/lakefind";

export const emptyRegulationsMessage =
  "No lake-specific special regulations listed by DNR. " +
  "Statewide, border-water, method, and seasonal rules may still apply.";

const speciesCaveat =
  "Based on DNR's most recent survey or the last ten years. " +
  "The list can leave out species anglers catch and include species they rarely do. " +
  "Surveyed species do not show what may be taken or by what method.";

const notices = {
  none: "DNR has no LakeFinder record for this lake.",
  unavailable: "DNR lake data isn't responding — official links below",
  changed: "DNR lake data came back in a form this app cannot read — official links below",
} as const;

const searchLink: IdentifyLink = {
  label: "Search LakeFinder",
  href: `${lakeFinderRoot}/index.html`,
};
const regulationsLink: IdentifyLink = {
  label: verifyLinkLabel,
  href: "https://www.dnr.state.mn.us/regulations/fishing/index.html",
};

function lakePageLink(dow: string): IdentifyLink {
  return { label: "Full LakeFinder page", href: `${lakeFinderRoot}/lake.html?id=${dow}` };
}

function feet(value: number | undefined): string {
  return value === undefined ? "Unavailable" : `${value.toLocaleString("en-US")} ft`;
}

function factsFor(lake: LakeRecord): IdentifyRow[] {
  const rows: IdentifyRow[] = [{ label: "DOW number", value: lake.dow }];
  if (lake.county) rows.push({ label: "County", value: lake.county });
  if (lake.nearestTown) rows.push({ label: "Nearest town", value: lake.nearestTown });
  if (lake.acres !== undefined) {
    const acres = lake.acres.toLocaleString("en-US", { maximumFractionDigits: 1 });
    rows.push({ label: "Area", value: `${acres} acres` });
  }
  rows.push({ label: "Maximum depth", value: feet(lake.maxDepthFeet) });
  rows.push({ label: "Mean depth", value: feet(lake.meanDepthFeet) });
  return rows;
}

function detailsFor(lake: LakeRecord): IdentifyRow[] {
  const rows: IdentifyRow[] = [];
  if (lake.invasiveSpecies.length > 0) {
    rows.push({ label: "Invasive species", value: lake.invasiveSpecies.join(", ") });
  }
  if (lake.notes) rows.push({ label: "Notes", value: lake.notes });
  return rows;
}

// Each report is offered only where DNR flags that it exists.
function reportLinks({ dow, resources }: LakeRecord): IdentifyLink[] {
  const reports = [
    { offered: resources.waterLevels, label: "Water-level report", page: "showlevel", query: "" },
    { offered: resources.lakeSurvey, label: "Fisheries lake survey", page: "showreport", query: "" },
    {
      offered: resources.fishStocking,
      label: "Fish stocking",
      page: "showstocking",
      query: "&context=desktop",
    },
    {
      offered: resources.lakeMap,
      label: "Lake depth maps on DNR's site",
      page: "showmap",
      query: "",
    },
  ];
  return reports
    .filter((report) => report.offered)
    .map(({ label, page, query }) => ({
      label,
      href: `${lakeFinderRoot}/${page}.html?downum=${dow}${query}`,
    }));
}

function mapPdfLinks(lake: LakeRecord): IdentifyLink[] {
  const [mapId] = lake.mapIds;
  return lake.resources.lakeMap && mapId
    ? [{ label: "Lake map (PDF)", href: lakeMapPath(mapId) }]
    : [];
}

function foundSummary(lake: LakeRecord): LakeSummaryView {
  return {
    title: lake.name,
    facts: factsFor(lake),
    regulations: {
      entries: lake.regulations.map(({ species, text, location }) => ({
        species: species.join(", "),
        text,
        location,
      })),
      ...(lake.regulations.length === 0 ? { emptyMessage: emptyRegulationsMessage } : {}),
      verifyLink: regulationsLink,
    },
    details: detailsFor(lake),
    species:
      lake.surveyedSpecies.length > 0
        ? {
            heading: "Species encountered in DNR fisheries surveys",
            names: lake.surveyedSpecies,
            caveat: speciesCaveat,
          }
        : undefined,
    links: [lakePageLink(lake.dow), ...reportLinks(lake), ...mapPdfLinks(lake)],
    attribution: dnrAttribution,
  };
}

export function describeLakeSummary(input: LakeSummaryInput): LakeSummaryView {
  const { dow, fallbackName, outcome } = input;
  if (outcome.status === "found") return foundSummary(outcome.lake);
  return {
    title: fallbackName ?? `Lake ${dow}`,
    notice: notices[outcome.status],
    facts: [{ label: "DOW number", value: dow }],
    details: [],
    // A lake DNR has no record of has no page to open, so only the search is offered.
    links:
      outcome.status === "none"
        ? [searchLink]
        : [searchLink, lakePageLink(dow), regulationsLink],
    attribution: dnrAttribution,
  };
}
