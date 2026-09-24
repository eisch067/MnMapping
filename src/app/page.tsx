import { MapShell } from "@/components/map/MapShell";
import type { InteractionPrototypeVariant } from "@/components/map/MapInteractionPrototype";
import type { PrototypeVariant } from "@/components/map/MobileMapShellPrototype";

export default async function Home({ searchParams }: { searchParams: Promise<{ prototype?: string; variant?: string }> }) {
  const query = await searchParams;
  const value = query.variant?.toUpperCase();
  const isPrototypeVariant = value === "A" || value === "B" || value === "C";
  const interactionPrototypeVariant: InteractionPrototypeVariant | null = process.env.NODE_ENV !== "production" && query.prototype === "interaction" && isPrototypeVariant ? value : null;
  const prototypeVariant: PrototypeVariant | null = process.env.NODE_ENV !== "production" && query.prototype !== "interaction" && isPrototypeVariant ? value : null;
  return <MapShell initialPrototypeVariant={prototypeVariant} initialInteractionPrototypeVariant={interactionPrototypeVariant} />;
}
