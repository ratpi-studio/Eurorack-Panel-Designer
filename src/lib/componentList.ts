import { formatBoxLabel, formatDiameterLabel } from "@lib/canvas/elementDimensions";
import { isElementHidden, isElementLocked } from "@lib/elementVisibility";
import { PanelElementType, isCircularElementProperties, type PanelElement } from "@lib/panelTypes";

/** A row of the components list. */
export interface ComponentListItem {
  id: string;
  type: PanelElementType;
  /** The name given to the element, or its type and number among the elements of that type. */
  name: string;
  isRenamed: boolean;
  /** Size or text, to tell similar elements apart. */
  detail: string;
  hidden: boolean;
  locked: boolean;
}

const MAX_TEXT_DETAIL_LENGTH = 24;

/** Size of the element, or its text for a text element. */
export function describeElementDetail(element: PanelElement): string {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return `${formatDiameterLabel(element.properties.diameterMm)} mm`;
    case PanelElementType.Insert:
      return `${formatDiameterLabel(element.properties.outerDiameterMm)} mm`;
    case PanelElementType.Switch:
      return isCircularElementProperties(element.properties)
        ? `${formatDiameterLabel(element.properties.diameterMm)} mm`
        : `${formatBoxLabel(element.properties.widthMm, element.properties.heightMm)} mm`;
    case PanelElementType.Rectangle:
    case PanelElementType.Oval:
    case PanelElementType.Slot:
    case PanelElementType.Triangle:
    case PanelElementType.SvgArtwork:
      return `${formatBoxLabel(element.properties.widthMm, element.properties.heightMm)} mm`;
    case PanelElementType.Label: {
      const text = element.properties.text.trim();
      if (!text) {
        return "";
      }
      const shown =
        text.length > MAX_TEXT_DETAIL_LENGTH
          ? `${text.slice(0, MAX_TEXT_DETAIL_LENGTH).trimEnd()}…`
          : text;
      return `“${shown}”`;
    }
    default:
      return "";
  }
}

/** Rows of the components list, in the order the elements were placed. */
export function describeComponents(
  elements: PanelElement[],
  typeLabels: Record<PanelElementType, string>,
): ComponentListItem[] {
  const countByType = new Map<PanelElementType, number>();
  return elements.map((element) => {
    const number = (countByType.get(element.type) ?? 0) + 1;
    countByType.set(element.type, number);
    const name = element.properties.label?.trim() ?? "";
    return {
      id: element.id,
      type: element.type,
      name: name || `${typeLabels[element.type]} ${number}`,
      isRenamed: Boolean(name),
      detail: describeElementDetail(element),
      hidden: isElementHidden(element),
      locked: isElementLocked(element),
    };
  });
}
