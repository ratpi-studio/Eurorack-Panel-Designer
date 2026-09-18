import { isLabelElement, type PanelElement } from "@lib/panelTypes";
import type { SurfaceRing } from "@lib/panelSurface";
import { isSvgArtworkElement } from "@lib/svgArtwork";
import type { TextFontId } from "@lib/text/textFonts";
import { getLabelKnockoutRing } from "@lib/text/textLayout";

/**
 * The design layer holds what prints in the design color on the panel front: SVG patterns and
 * texts. Both are clipped to the panel surface, share one relief (`PanelModel.designRelief`), and
 * texts can clear the patterns around them (knockout) or merge with them.
 */
export function hasDesignElements(elements: PanelElement[]): boolean {
  return elements.some((element) => isSvgArtworkElement(element) || isLabelElement(element));
}

/** Fonts the texts of a design use, to load before drawing or exporting it. */
export function collectTextFontIds(elements: PanelElement[]): TextFontId[] {
  return [...new Set(elements.filter(isLabelElement).map((element) => element.properties.fontId))];
}

/**
 * Zones of the SVG patterns cleared by knocked-out texts, in panel coordinates. Texts whose font has
 * not loaded yet clear nothing until it has.
 */
export function collectKnockoutRings(elements: PanelElement[]): SurfaceRing[] {
  if (!elements.some(isSvgArtworkElement)) {
    return [];
  }
  return elements
    .filter(isLabelElement)
    .map((element) => getLabelKnockoutRing(element))
    .filter((ring): ring is SurfaceRing => ring !== null);
}
