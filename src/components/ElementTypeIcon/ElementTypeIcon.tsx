import { PanelElementType } from "@lib/panelTypes";

import * as styles from "./ElementTypeIcon.css";

const SVG_ARTWORK_ICON_URL = `${import.meta.env.BASE_URL}images/svg.png`;

interface ElementTypeIconProps {
  type: PanelElementType;
  color: string;
  /** Width and height in px. */
  size: number;
}

/** The outline of an element type, as the palette and the components list show it. */
export function ElementTypeIcon({ type, color, size }: ElementTypeIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 36 36",
    role: "presentation",
    focusable: false,
  } as const;

  switch (type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return (
        <svg {...commonProps}>
          <circle cx="18" cy="18" r="9" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
    case PanelElementType.Switch:
    case PanelElementType.Rectangle:
      return (
        <svg {...commonProps}>
          <rect
            x="9"
            y="6"
            width="18"
            height="24"
            stroke={color}
            strokeWidth="2"
            fill="none"
            rx="2"
          />
        </svg>
      );
    case PanelElementType.Oval:
      return (
        <svg {...commonProps}>
          <ellipse cx="18" cy="18" rx="12" ry="7" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
    case PanelElementType.Slot:
      return (
        <svg {...commonProps}>
          <rect
            x="8"
            y="10"
            width="20"
            height="16"
            stroke={color}
            strokeWidth="2"
            fill="none"
            rx="8"
            ry="8"
          />
        </svg>
      );
    case PanelElementType.Triangle:
      return (
        <svg {...commonProps}>
          <polygon points="18,6 28,26 8,26" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
    case PanelElementType.Label:
      return (
        <svg {...commonProps}>
          <line x1="8" y1="14" x2="28" y2="14" stroke={color} strokeWidth="2" />
          <line x1="8" y1="22" x2="24" y2="22" stroke={color} strokeWidth="2" />
        </svg>
      );
    case PanelElementType.Insert:
      return (
        <svg {...commonProps}>
          <circle cx="18" cy="18" r="11" stroke={color} strokeWidth="2" fill="none" />
          <circle cx="18" cy="18" r="5" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
    case PanelElementType.SvgArtwork:
      return (
        <img
          className={styles.image}
          src={SVG_ARTWORK_ICON_URL}
          alt=""
          width={size}
          height={size}
          draggable={false}
        />
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="18" cy="18" r="9" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      );
  }
}
