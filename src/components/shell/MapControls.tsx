import { LocateIcon, TerrainIcon } from "@/components/ui/MapIcons";

interface MapControlsProps {
  onRecenter: () => void;
  onTerrain: () => void;
}

// Compact controls that float over the map so the most common view changes are one tap away.
export function MapControls({ onRecenter, onTerrain }: MapControlsProps) {
  return (
    <div className="map-controls" role="group" aria-label="Map view controls">
      <button type="button" title="Recenter" aria-label="Recenter map" onClick={onRecenter}>
        <LocateIcon />
      </button>
      <button type="button" title="Terrain" aria-label="Show terrain" onClick={onTerrain}>
        <TerrainIcon />
      </button>
    </div>
  );
}
