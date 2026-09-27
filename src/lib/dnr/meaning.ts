import type { DnrMeaningClass } from "@/config/layers/types";

// One line per class of DNR result, so a result never says more than its class supports.
export const meaningStatements: Record<DnrMeaningClass, string> = {
  "regulation-zone": "Regulation boundary — does not show ownership or permission to enter.",
  "enrolled-private-land":
    "Participating private land — WIA validation required, Sept 1–May 31, landowners may opt out.",
  facility:
    "Marks a facility or route, not access to adjoining land or permission to take any species.",
  "access-varies": "Rules vary by landowner along the trail.",
};

export const dnrAttribution =
  "Minnesota DNR · reference only, not a legal boundary or proof of access";

export const verifyLinkLabel = "Verify current regulations";
