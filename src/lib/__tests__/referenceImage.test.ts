import { describe, expect, it } from "vite-plus/test";

import {
  calibrateReferenceImage,
  getReferenceImageControlPositions,
  referenceImageLocalToWorld,
  referenceImageWorldToLocal,
  getScaledImageSize,
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

describe("getScaledImageSize", () => {
  it("keeps images within the limit untouched", () => {
    expect(getScaledImageSize(1200, 800, 2048)).toEqual({ width: 1200, height: 800 });
    expect(getScaledImageSize(2048, 100, 2048)).toEqual({ width: 2048, height: 100 });
  });

  it("scales the longest side down to the limit and keeps the aspect ratio", () => {
    expect(getScaledImageSize(4032, 3024, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(getScaledImageSize(3000, 6000, 2048)).toEqual({ width: 1024, height: 2048 });
  });

  it("never returns an empty dimension", () => {
    expect(getScaledImageSize(10_000, 1, 2048)).toEqual({ width: 2048, height: 1 });
  });
});

describe("reference image calibration", () => {
  it("scales the image so the two points are the given distance apart", () => {
    const image = createReferenceImage();
    // 20 mm apart on the image, 50 mm on the real part.
    const result = calibrateReferenceImage(image, { x: 40, y: 60 }, { x: 60, y: 60 }, 50);

    expect(result).not.toBeNull();
    expect(result!.widthMm).toBeCloseTo(100);
    expect(result!.heightMm).toBeCloseTo(50);
  });

  it("keeps the first point where it is and moves the second one to the real distance", () => {
    const image = createReferenceImage({ rotationDeg: 30 });
    const first = { x: 42, y: 55 };
    const second = { x: 61, y: 68 };
    const firstLocal = referenceImageWorldToLocal(first, image);
    const secondLocal = referenceImageWorldToLocal(second, image);
    const result = calibrateReferenceImage(image, first, second, 12);
    expect(result).not.toBeNull();

    const scale = result!.widthMm / image.widthMm;
    const calibrated = { ...image, ...result! };
    const scaledLocal = (point: { x: number; y: number }) => ({
      x: point.x * scale,
      y: point.y * scale,
    });
    const firstAfter = referenceImageLocalToWorld(scaledLocal(firstLocal), calibrated);
    const secondAfter = referenceImageLocalToWorld(scaledLocal(secondLocal), calibrated);

    expect(firstAfter.x).toBeCloseTo(first.x);
    expect(firstAfter.y).toBeCloseTo(first.y);
    expect(Math.hypot(secondAfter.x - firstAfter.x, secondAfter.y - firstAfter.y)).toBeCloseTo(12);
    expect(result!.heightMm / result!.widthMm).toBeCloseTo(image.heightMm / image.widthMm);
  });

  it("gives no scale for points on top of each other or a distance that is not positive", () => {
    const image = createReferenceImage();

    expect(calibrateReferenceImage(image, { x: 50, y: 60 }, { x: 50, y: 60 }, 10)).toBeNull();
    expect(calibrateReferenceImage(image, { x: 40, y: 60 }, { x: 60, y: 60 }, 0)).toBeNull();
    expect(
      calibrateReferenceImage(image, { x: 40, y: 60 }, { x: 60, y: 60 }, Number.NaN),
    ).toBeNull();
  });
});
