import type { PanelElement, PanelModel } from "./panelTypes";

export function isElementHidden(element: PanelElement): boolean {
  return element.hidden === true;
}

export function isElementLocked(element: PanelElement): boolean {
  return element.locked === true;
}

/** Elements people can pick, move and resize on the canvas: shown and not locked. */
export function isElementInteractive(element: PanelElement): boolean {
  return !isElementHidden(element) && !isElementLocked(element);
}

/**
 * The elements that the canvas, the 3D view, the exports and orders use. Returns the same array
 * when no element is hidden, so memoized views do not rebuild for nothing.
 */
export function getVisibleElements(elements: PanelElement[]): PanelElement[] {
  return elements.some(isElementHidden)
    ? elements.filter((element) => !isElementHidden(element))
    : elements;
}

/** The design as the outputs see it: hidden elements left out. Same object when none is hidden. */
export function withoutHiddenElements(model: PanelModel): PanelModel {
  const elements = getVisibleElements(model.elements);
  return elements === model.elements ? model : { ...model, elements };
}
