import { PinIcon, SearchIcon } from "@/components/ui/MapIcons";
import type { MapLocation } from "@/lib/location";

interface ShellHeaderProps {
  location: MapLocation;
  onChangeArea: () => void;
}

export function ShellHeader({ location, onChangeArea }: ShellHeaderProps) {
  return (
    <header className="shell-header">
      <div className="shell-brand">
        <PinIcon />
        <h1>MnMapping</h1>
        <span>Personal Minnesota map viewer</span>
      </div>
      <div className="shell-location" title={location.label}>
        <PinIcon />
        <span>
          <strong>{location.label}</strong>
          <small>{location.county ?? "County unavailable"}</small>
        </span>
      </div>
      <button className="shell-change-area" type="button" onClick={onChangeArea}>
        <SearchIcon />
        <span>Change area</span>
      </button>
    </header>
  );
}
