import { CompassIcon, LocateIcon, TerrainIcon } from "@/components/ui/MapIcons";

interface MapControlsProps {
  onRecenter: () => void;
  onTerrain: () => void;
  heading: number;
  showCompass: boolean;
  onResetNorth: () => void;
}

// Compact controls that float over the map so the most common view changes are one tap away.
export function MapControls({ onRecenter, onTerrain, heading, showCompass, onResetNorth }: MapControlsProps) {
  return (
    <div className="map-controls" role="group" aria-label="Map view controls">
      <button type="button" title="Recenter" aria-label="Recenter map" onClick={onRecenter}>
        <LocateIcon />
      </button>
      <button type="button" title="Terrain" aria-label="Show terrain" onClick={onTerrain}>
        <TerrainIcon />
      </button>
      {showCompass && (
        <button type="button" title={`Map heading ${Math.round(heading)}°. Reset north`} aria-label="Reset compass to north" onClick={onResetNorth}>
          <CompassIcon style={{ transform: `rotate(${-heading}deg)` }} />
        </button>
      )}
    </div>
  );
}
