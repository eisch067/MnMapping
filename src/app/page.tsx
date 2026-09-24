import { MapShell } from "@/components/map/MapShell";
import type { TerrainPrototypeVariant } from "@/components/map/TerrainAnalysisPrototype";

export default async function Home({ searchParams }: { searchParams: Promise<{ prototype?: string; variant?: string }> }) {
  const query = await searchParams;
  const value = query.variant?.toUpperCase();
  const isPrototypeVariant = value === "A" || value === "B" || value === "C";
  const isDev = process.env.NODE_ENV !== "production";
  const terrainPrototypeVariant: TerrainPrototypeVariant | null = isDev && query.prototype === "terrain" && isPrototypeVariant ? value : null;
  return <MapShell initialTerrainPrototypeVariant={terrainPrototypeVariant} />;
}
