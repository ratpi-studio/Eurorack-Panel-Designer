import { PanelElementType, type PanelModel } from "@lib/panelTypes";
import { type ElementStyle, type PanelCanvasPalette } from "./renderScene";
import { themeValues } from "@styles/theme.css";

type ExtendedPalette = PanelCanvasPalette & {
  workspace?: string;
  text?: string;
};

type ElementStyles = Record<PanelElementType, ElementStyle>;

export interface ModelDerivedPalette {
  palette: ExtendedPalette;
  elementStyles: ElementStyles;
}

// Same hues as the palette icons, so a placed element keeps the color it has in the toolbox.
export const elementTypeColors: Record<PanelElementType, string> = {
  [PanelElementType.Jack]: "#38bdf8",
  [PanelElementType.Potentiometer]: "#f472b6",
  [PanelElementType.Switch]: "#facc15",
  [PanelElementType.Led]: "#f87171",
  [PanelElementType.Label]: "#f8fafc",
  [PanelElementType.Rectangle]: "#4ade80",
  [PanelElementType.Oval]: "#c084fc",
  [PanelElementType.Slot]: "#fb923c",
  [PanelElementType.Triangle]: "#22d3ee",
  [PanelElementType.Insert]: "#f59e0b",
  [PanelElementType.SvgArtwork]: "#f8fafc",
};

export const elementFillAlpha = 0.3;

// Text and artwork are printed in the design color, so the editor keeps showing them that way.
const designColoredTypes = new Set<PanelElementType>([
  PanelElementType.Label,
  PanelElementType.SvgArtwork,
]);

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const canvasPalette: ExtendedPalette = {
  workspace: "#030712",
  panelFill: "#111827",
  panelBorder: "#334155",
  grid: "rgba(148, 163, 184, 0.2)",
  gridCenter: "rgba(148, 163, 184, 0.45)",
  mountingHoleFill: "#0f172a",
  mountingHoleStroke: "#94a3b8",
  selection: "#ffffff",
  text: themeValues.color.textSecondary,
  clearanceLine: "rgba(244, 114, 182, 0.4)",
  clearanceLabel: "#fbcfe8",
  handleFill: "#f8fafc",
  handleStroke: "#0f172a",
  dimensionText: "#f8fafc",
  dimensionHalo: "rgba(3, 7, 18, 0.85)",
  dimensionLine: "rgba(248, 250, 252, 0.75)",
  crowdedHardwareFill: "rgba(239, 68, 68, 0.25)",
  crowdedHardwareStroke: "#ef4444",
};

export const exportPalette: PanelCanvasPalette = {
  panelFill: canvasPalette.panelFill,
  panelBorder: canvasPalette.panelBorder,
  grid: canvasPalette.grid,
  gridCenter: canvasPalette.gridCenter,
  mountingHoleFill: canvasPalette.mountingHoleFill,
  mountingHoleStroke: canvasPalette.mountingHoleStroke,
  selection: canvasPalette.selection,
  clearanceLine: canvasPalette.clearanceLine,
  clearanceLabel: canvasPalette.clearanceLabel,
  handleFill: canvasPalette.handleFill,
  handleStroke: canvasPalette.handleStroke,
  dimensionText: canvasPalette.dimensionText,
  dimensionHalo: canvasPalette.dimensionHalo,
  dimensionLine: canvasPalette.dimensionLine,
  crowdedHardwareFill: canvasPalette.crowdedHardwareFill,
  crowdedHardwareStroke: canvasPalette.crowdedHardwareStroke,
};

/** Turns a `#rgb` / `#rrggbb` color into `rgba()`; other formats are returned unchanged. */
export function withAlpha(color: string, alpha: number): string {
  const match = HEX_COLOR_PATTERN.exec(color.trim());
  if (!match) {
    return color;
  }
  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : match[1];
  const value = Number.parseInt(hex, 16);
  const clampedAlpha = Math.min(Math.max(alpha, 0), 1);
  return `rgba(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff}, ${clampedAlpha})`;
}

function buildElementStyles(resolve: (type: PanelElementType) => ElementStyle): ElementStyles {
  return Object.fromEntries(
    Object.values(PanelElementType).map((type) => [type, resolve(type)]),
  ) as ElementStyles;
}

function buildDesignElementStyles(
  model: Pick<PanelModel, "panelColor" | "designColor">,
): ElementStyles {
  const style: ElementStyle = { fill: model.designColor, stroke: model.panelColor };
  return buildElementStyles(() => style);
}

function buildEditorElementStyles(
  model: Pick<PanelModel, "panelColor" | "designColor">,
): ElementStyles {
  const designStyle: ElementStyle = { fill: model.designColor, stroke: model.panelColor };
  return buildElementStyles((type) =>
    designColoredTypes.has(type)
      ? designStyle
      : {
          fill: withAlpha(elementTypeColors[type], elementFillAlpha),
          stroke: elementTypeColors[type],
        },
  );
}

/** Editor view: cut-outs are tinted with their palette color so they stay easy to tell apart. */
export function derivePaletteFromModel(
  model: Pick<PanelModel, "panelColor" | "designColor">,
  base: ExtendedPalette = canvasPalette,
): ModelDerivedPalette {
  return {
    palette: {
      ...base,
      panelFill: model.panelColor,
    },
    elementStyles: buildEditorElementStyles(model),
  };
}

/** Export view: everything is drawn in the design color, as it will be produced. */
export function deriveExportPaletteFromModel(
  model: Pick<PanelModel, "panelColor" | "designColor">,
): ModelDerivedPalette {
  return {
    palette: {
      ...exportPalette,
      panelFill: model.panelColor,
    },
    elementStyles: buildDesignElementStyles(model),
  };
}
