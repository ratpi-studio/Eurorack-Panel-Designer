import {
  PanelElementType,
  hasRoundHole,
  isCircularElementProperties,
  type CircularElementProperties,
  type PanelElement,
  type Vector2,
} from "./panelTypes";
import { getKnob, getPart, getPartsForType, isPartId, type PartId } from "./parts";

/**
 * What the part select of an element offers: one of its parts, or a hole of its own. Switches
 * pick the shape of their own hole, since their parts all mount through a round one.
 */
export type PartChoice = PartId | "custom" | "customRound" | "customRectangle";

export function isPartChoice(value: unknown): value is PartChoice {
  return (
    isPartId(value) || value === "custom" || value === "customRound" || value === "customRectangle"
  );
}

/** The choice the part select shows for an element; null for the types without parts. */
export function getPartChoice(element: PanelElement): PartChoice | null {
  if (getPartsForType(element.type).length === 0) {
    return null;
  }
  if (!hasRoundHole(element)) {
    return "customRectangle";
  }
  if (element.properties.partId) {
    return element.properties.partId;
  }
  return element.type === PanelElementType.Switch ? "customRound" : "custom";
}

/**
 * The properties of an element once a part is picked in its part select. A part brings its
 * recommended hole. A hole of its own keeps the current size, or turns a switch round (the circle
 * inside its rectangle) or rectangular (the square around its circle).
 */
export function applyPartChoice(
  element: PanelElement,
  choice: PartChoice,
): PanelElement["properties"] {
  const { properties } = element;
  if (!isCircularElementProperties(properties)) {
    if (choice === "customRectangle" || !("widthMm" in properties)) {
      return properties;
    }
    const round = {
      label: properties.label,
      diameterMm: Math.min(properties.widthMm, properties.heightMm),
    };
    return isPartId(choice)
      ? { ...round, diameterMm: getPart(choice).holeDiameterMm, partId: choice }
      : round;
  }
  if (choice === "customRectangle") {
    return {
      label: properties.label,
      widthMm: properties.diameterMm,
      heightMm: properties.diameterMm,
    };
  }
  const ownHole: CircularElementProperties = { ...properties };
  delete ownHole.partId;
  return isPartId(choice)
    ? { ...ownHole, diameterMm: getPart(choice).holeDiameterMm, partId: choice }
    : ownHole;
}

/** Round outline of what an element takes on the front of the panel. */
export interface FrontOutline {
  elementId: string;
  center: Vector2;
  /** Its knob, nut or washer, and at least its hole. */
  diameterMm: number;
  /** A knob, nut or washer is wider than the hole. */
  hasHardware: boolean;
}

// Outlines that only touch are fine: snapping often puts them exactly side by side.
const OVERLAP_TOLERANCE_MM = 0.01;

/**
 * The outline of the knob, nut or washer of a jack, knob, switch or LED, from its part and its
 * knob. Null for the elements without a round hole.
 */
export function getFrontOutline(element: PanelElement): FrontOutline | null {
  if (!hasRoundHole(element)) {
    return null;
  }
  const { diameterMm, partId } = element.properties;
  const knobId =
    element.type === PanelElementType.Potentiometer ? element.properties.knobId : undefined;
  const hardwareMm = Math.max(
    partId ? (getPart(partId).hardwareDiameterMm ?? 0) : 0,
    knobId ? getKnob(knobId).diameterMm : 0,
  );
  return {
    elementId: element.id,
    center: element.positionMm,
    diameterMm: Math.max(diameterMm, hardwareMm),
    hasHardware: hardwareMm > diameterMm,
  };
}

/**
 * Elements whose knob, nut or washer runs into another element's, or into its hole. Two bare
 * holes are left out: overlapping holes already merge into one opening.
 */
export function findCrowdedElements(elements: PanelElement[]): Set<string> {
  const outlines = elements.flatMap((element) => getFrontOutline(element) ?? []);
  const crowded = new Set<string>();
  outlines.forEach((outline, index) => {
    for (let otherIndex = index + 1; otherIndex < outlines.length; otherIndex += 1) {
      const other = outlines[otherIndex];
      if (!outline.hasHardware && !other.hasHardware) {
        continue;
      }
      const distanceMm = Math.hypot(
        other.center.x - outline.center.x,
        other.center.y - outline.center.y,
      );
      if (distanceMm < (outline.diameterMm + other.diameterMm) / 2 - OVERLAP_TOLERANCE_MM) {
        crowded.add(outline.elementId);
        crowded.add(other.elementId);
      }
    }
  });
  return crowded;
}
