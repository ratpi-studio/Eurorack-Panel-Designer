import { describe, expect, it } from "vite-plus/test";

import {
  getReferenceImageControlPositions,
  isPointInReferenceImage,
  resizeReferenceImageFromHandle,
  type ReferenceImage,
} from "../referenceImage";

function createReferenceImage(overrides: Partial<ReferenceImage> = {}): ReferenceImage {
  return {
    dataUrl: "data:image/png;base64,test",
    positionMm: { x: 50, y: 60 },
    widthMm: 40,
    heightMm: 20,
    rotationDeg: 0,
    opacity: 0.5,
    naturalWidth: 400,
    naturalHeight: 200,
    ...overrides,
  };
}

describe("reference image geometry", () => {
  it("detects hits inside a rotated reference image", () => {
    const image = createReferenceImage({ rotationDeg: 45 });

    expect(isPointInReferenceImage({ x: 50, y: 60 }, image)).toBe(true);
    expect(isPointInReferenceImage({ x: 60, y: 70 }, image)).toBe(true);
    expect(isPointInReferenceImage({ x: 75, y: 80 }, image)).toBe(false);
  });

  it("computes control points including the rotation handle", () => {
    const image = createReferenceImage({ positionMm: { x: 50, y: 50 }, rotationDeg: 90 });
    const controls = getReferenceImageControlPositions(image, 6);

    expect(controls["top-left"].x).toBeCloseTo(60);
    expect(controls["top-left"].y).toBeCloseTo(30);
    expect(controls.top.x).toBeCloseTo(60);
    expect(controls.top.y).toBeCloseTo(50);
    expect(controls.rotate.x).toBeCloseTo(66);
    expect(controls.rotate.y).toBeCloseTo(50);
  });

  it("resizes from a corner while preserving the current aspect ratio", () => {
    const image = createReferenceImage();
    const resized = resizeReferenceImageFromHandle(image, "top-left", { x: 20, y: 40 });

    expect(resized.widthMm).toBeCloseTo(60);
    expect(resized.heightMm).toBeCloseTo(30);
    expect(resized.widthMm / resized.heightMm).toBeCloseTo(image.widthMm / image.heightMm);
    expect(resized.positionMm.x).toBeCloseTo(40);
    expect(resized.positionMm.y).toBeCloseTo(55);
  });

  it("resizes rotated images from an edge along the local axis", () => {
    const image = createReferenceImage({
      positionMm: { x: 50, y: 50 },
      rotationDeg: 90,
    });
    const resized = resizeReferenceImageFromHandle(image, "right", { x: 50, y: 80 });

    expect(resized.widthMm).toBeCloseTo(50);
    expect(resized.heightMm).toBeCloseTo(20);
    expect(resized.positionMm.x).toBeCloseTo(50);
    expect(resized.positionMm.y).toBeCloseTo(55);
  });
});
