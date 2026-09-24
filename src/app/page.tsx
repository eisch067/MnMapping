import { MapShell } from "@/components/map/MapShell";
import type { PrototypeVariant } from "@/components/map/MobileMapShellPrototype";

export default async function Home({ searchParams }: { searchParams: Promise<{ variant?: string }> }) {
  const value = (await searchParams).variant?.toUpperCase();
  const prototypeVariant: PrototypeVariant | null = process.env.NODE_ENV !== "production" && (value === "A" || value === "B" || value === "C") ? value : null;
  return <MapShell initialPrototypeVariant={prototypeVariant} />;
}
