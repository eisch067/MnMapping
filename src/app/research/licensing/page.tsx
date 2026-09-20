import type { Metadata } from "next";
import { LicensingAudit } from "@/components/research/LicensingAudit";

export const metadata: Metadata = {
  title: "Licensing Audit | MnMapping",
  description: "County-by-county and source-by-source licensing, redistribution, and commercial-use audit for MnMapping.",
};

export default function LicensingAuditPage() {
  return <LicensingAudit />;
}
