import { MapIcon, TerrainIcon } from "@/components/ui/MapIcons";

export interface MapViewSheetProps {
  onMapView: () => void;
  onTerrainView: () => void;
}

export function MapViewSheet({ onMapView, onTerrainView }: MapViewSheetProps) {
  return (
    <div className="sheet-tools">
      <div className="tool-buttons">
        <button type="button" onClick={onMapView}>
          <MapIcon />
          Map view
        </button>
        <button type="button" onClick={onTerrainView}>
          <TerrainIcon />
          Terrain view
        </button>
      </div>
    </div>
  );
}
