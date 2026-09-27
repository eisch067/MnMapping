import type { DnrHeading } from "./types";

// Kept apart from the layer definitions so the drawer can name its headings in every build while
// the layers themselves reach only the personal one.
export const dnrHeadings: readonly { id: DnrHeading; label: string }[] = [
  { id: "hunting-zones-health", label: "Hunting zones & health" },
  { id: "hunting-access-habitat", label: "Hunting access & habitat" },
  { id: "fishing-water-access", label: "Fishing & water access" },
  { id: "recreation-trails", label: "Recreation trails" },
  { id: "water-regulatory-reference", label: "Water & regulatory reference" },
];
