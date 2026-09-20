import { PenTool, RectangleVertical, Triangle, Type, type LucideIcon } from "lucide-react";

import { PanelElementType } from "@lib/panelTypes";

import {
  InsertIcon,
  JackIcon,
  KnobIcon,
  LedIcon,
  OvalIcon,
  SlotIcon,
  ToggleSwitchIcon,
} from "./elementIcons";

const ELEMENT_TYPE_ICONS: Record<PanelElementType, LucideIcon> = {
  [PanelElementType.Jack]: JackIcon,
  [PanelElementType.Potentiometer]: KnobIcon,
  [PanelElementType.Switch]: ToggleSwitchIcon,
  [PanelElementType.Led]: LedIcon,
  [PanelElementType.Label]: Type,
  [PanelElementType.Rectangle]: RectangleVertical,
  [PanelElementType.Oval]: OvalIcon,
  [PanelElementType.Slot]: SlotIcon,
  [PanelElementType.Triangle]: Triangle,
  [PanelElementType.Insert]: InsertIcon,
  [PanelElementType.SvgArtwork]: PenTool,
};

interface ElementTypeIconProps {
  type: PanelElementType;
  color: string;
  /** Width and height in px. */
  size: number;
}

/** The icon of an element type, as the palette and the components list show it. */
export function ElementTypeIcon({ type, color, size }: ElementTypeIconProps) {
  const Icon = ELEMENT_TYPE_ICONS[type];
  return <Icon color={color} size={size} />;
}
