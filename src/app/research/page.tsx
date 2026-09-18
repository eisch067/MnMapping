import type { Metadata } from "next";
import { CountyResearchTracker } from "@/components/research/CountyResearchTracker";

export const metadata: Metadata = {
  title: "County Imagery Research | MnMapping",
  description: "Track and export imagery research for all 87 Minnesota counties.",
};

export default function ResearchPage() {
  return <CountyResearchTracker />;
}
