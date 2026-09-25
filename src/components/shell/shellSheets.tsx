import { CompassIcon, FolderIcon, LayersIcon, MapIcon, PlusIcon } from "@/components/ui/MapIcons";
import { AddSheet, type AddSheetProps } from "./AddSheet";
import { BackupSheet, type BackupSheetProps } from "./BackupSheet";
import { ExploreSheet } from "./ExploreSheet";
import { ExportSheet, type ExportSheetProps } from "./ExportSheet";
import { ImportResultSheet, type ImportResultSheetProps } from "./ImportResultSheet";
import { LayerDrawer, type LayerDrawerProps } from "./LayerDrawer";
import { MapViewSheet, type MapViewSheetProps } from "./MapViewSheet";
import { MyDataSlot, type MyDataSlotProps } from "./MyDataSlot";
import type { SheetDefinition } from "./sheets";
import type { Position } from "./useMapTools";

export const sheetIds = {
  explore: "explore",
  layers: "layers",
  add: "add",
  data: "data",
  map: "map",
  export: "export",
  importResult: "import-result",
  backup: "backup",
} as const;

interface ShellSheetProps {
  layers: LayerDrawerProps;
  myData: MyDataSlotProps;
  explore: { point: Position | null };
  add: AddSheetProps;
  mapView: MapViewSheetProps;
  exchange: {
    export: ExportSheetProps;
    importResult: ImportResultSheetProps;
    backup: BackupSheetProps;
  };
}

// Every sheet the shell offers, in tool-row order. A later slice adds its sheet here and gets a
// tool-row action and a place in the sheet host without touching either.
export function shellSheets(props: ShellSheetProps): SheetDefinition[] {
  const { layers, myData, explore, add, mapView, exchange } = props;
  return [
    {
      id: sheetIds.explore,
      title: "Explore",
      icon: <CompassIcon />,
      size: "compact",
      content: <ExploreSheet point={explore.point} />,
    },
    {
      id: sheetIds.layers,
      title: "Layers",
      icon: <LayersIcon />,
      size: "tall",
      tabGroup: "drawer",
      content: <LayerDrawer {...layers} />,
    },
    {
      id: sheetIds.add,
      title: "Add",
      icon: <PlusIcon />,
      size: "compact",
      primary: true,
      content: <AddSheet {...add} />,
    },
    {
      id: sheetIds.data,
      title: "My Data",
      icon: <FolderIcon />,
      size: "tall",
      tabGroup: "drawer",
      content: <MyDataSlot {...myData} />,
    },
    {
      id: sheetIds.map,
      title: "Map",
      icon: <MapIcon />,
      size: "compact",
      content: <MapViewSheet {...mapView} />,
    },
    {
      id: sheetIds.export,
      title: "Export",
      icon: <FolderIcon />,
      size: "tall",
      secondary: true,
      content: <ExportSheet {...exchange.export} />,
    },
    {
      id: sheetIds.importResult,
      title: "Import result",
      icon: <FolderIcon />,
      size: "tall",
      secondary: true,
      content: <ImportResultSheet {...exchange.importResult} />,
    },
    {
      id: sheetIds.backup,
      title: "Backup and restore",
      icon: <FolderIcon />,
      size: "tall",
      secondary: true,
      content: <BackupSheet {...exchange.backup} />,
    },
  ];
}
