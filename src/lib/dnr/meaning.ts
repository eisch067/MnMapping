import type { DnrMeaningClass } from "@/config/layers/types";

// One line per class of DNR result, so a result never says more than its class supports.
export const meaningStatements: Record<DnrMeaningClass, string> = {
  "regulation-zone": "Regulation boundary — does not show ownership or permission to enter.",
  "inventory-reference": "Wetland inventory — planning reference mapped from 2009–2014 imagery. It has no legal or regulatory status and is not a wetland boundary or permit determination.",
  "regulatory-guide": "Minimum state buffer requirement — a general guide to waters where Minnesota's buffer law applies. It is not parcel ownership or a compliance determination; exemptions and stricter local rules are not shown. Confirm with your SWCD.",
  "enrolled-private-land":
    "Participating private land — WIA validation required, Sept 1–May 31, landowners may opt out.",
  facility:
    "Marks a facility or route, not access to adjoining land or permission to take any species.",
  "access-varies": "Rules vary by landowner along the trail.",
  "managed-land":
    "DNR habitat designation — does not show ownership or permission to enter; verify boundary signs.",
  reference: "DNR reference data — not for navigation; coverage varies.",
};

export const dnrAttribution =
  "Minnesota DNR · reference only, not a legal boundary or proof of access";

export const verifyLinkLabel = "Verify current regulations";
