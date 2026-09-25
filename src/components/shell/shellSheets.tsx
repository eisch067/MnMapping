import { CompassIcon, FolderIcon, LayersIcon, MapIcon, PlusIcon } from "@/components/ui/MapIcons";
import { AddSheet, type AddSheetProps } from "./AddSheet";
import { IdentifySheet, type IdentifySheetProps } from "./IdentifySheet";
import { LayerDrawer, type LayerDrawerProps } from "./LayerDrawer";
import { MapViewSheet, type MapViewSheetProps } from "./MapViewSheet";
import { MyDataSlot, type MyDataSlotProps } from "./MyDataSlot";
import type { SheetDefinition } from "./sheets";

export const sheetIds = {
  explore: "explore",
  layers: "layers",
  add: "add",
  data: "data",
  map: "map",
} as const;

interface ShellSheetProps {
  layers: LayerDrawerProps;
  myData: MyDataSlotProps;
  explore: IdentifySheetProps;
  add: AddSheetProps;
  mapView: MapViewSheetProps;
}

// Every sheet the shell offers, in tool-row order. A later slice adds its sheet here and gets a
// tool-row action and a place in the sheet host without touching either.
export function shellSheets(props: ShellSheetProps): SheetDefinition[] {
  const { layers, myData, explore, add, mapView } = props;
  return [
    {
      id: sheetIds.explore,
      title: "Explore",
      icon: <CompassIcon />,
      size: "compact",
      content: <IdentifySheet {...explore} />,
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
  ];
}
