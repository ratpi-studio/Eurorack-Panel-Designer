import { describe, expect, it, vi } from "vite-plus/test";

import { createPanelStateStorage, isQuotaExceededError } from "@lib/panelStateStorage";
import type { ReferenceImage } from "@lib/referenceImage";

interface TestState {
  referenceImage: ReferenceImage | null;
  referenceImageSelected: boolean;
  label: string;
}

function createQuotaStorage(maxChars: number) {
  const values = new Map<string, string>();
  const quota = { maxChars, writes: 0 };
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      quota.writes += 1;
      if (value.length > quota.maxChars) {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      }
      values.set(key, value);
    },
    removeItem: (key: string) => void values.delete(key),
  };
  return { storage, quota };
}

function image(dataUrl: string): ReferenceImage {
  return {
    dataUrl,
    positionMm: { x: 0, y: 0 },
    widthMm: 10,
    heightMm: 10,
    rotationDeg: 0,
    opacity: 0.35,
    naturalWidth: 10,
    naturalHeight: 10,
  };
}

function setup(maxChars: number) {
  const { storage, quota } = createQuotaStorage(maxChars);
  const onReferenceImageDropped = vi.fn<(error: unknown, imageChars: number) => void>();
  const onSaveFailed = vi.fn<(error: unknown) => void>();
  const persisted = createPanelStateStorage<TestState>({
    onReferenceImageDropped,
    onSaveFailed,
    getStorage: () => storage,
  });
  if (!persisted) {
    throw new Error("storage should be available");
  }
  const save = (state: TestState) => persisted.setItem("store", { state, version: 1 });
  const load = () => persisted.getItem("store") as { state: TestState } | null;
  return { quota, save, load, onReferenceImageDropped, onSaveFailed };
}

const bigImage = image(`data:image/png;base64,${"A".repeat(5000)}`);

describe("createPanelStateStorage", () => {
  it("saves the whole state when it fits", () => {
    const { save, load, onSaveFailed } = setup(100_000);
    save({ referenceImage: bigImage, referenceImageSelected: true, label: "v1" });
    expect(load()?.state.referenceImage?.dataUrl).toBe(bigImage.dataUrl);
    expect(onSaveFailed).not.toHaveBeenCalled();
  });

  it("keeps saving the design without the image when the image does not fit", () => {
    const { quota, save, load, onReferenceImageDropped, onSaveFailed } = setup(1000);

    save({ referenceImage: bigImage, referenceImageSelected: true, label: "v1" });
    expect(load()?.state).toEqual({
      referenceImage: null,
      referenceImageSelected: false,
      label: "v1",
    });
    expect(onReferenceImageDropped).toHaveBeenCalledOnce();
    expect(onReferenceImageDropped.mock.calls[0][1]).toBe(bigImage.dataUrl.length);

    const writesBefore = quota.writes;
    save({ referenceImage: bigImage, referenceImageSelected: true, label: "v2" });
    expect(load()?.state.label).toBe("v2");
    expect(quota.writes - writesBefore).toBe(1);
    expect(onReferenceImageDropped).toHaveBeenCalledOnce();
    expect(onSaveFailed).not.toHaveBeenCalled();
  });

  it("saves a new image again once it fits", () => {
    const { save, load } = setup(1000);
    save({ referenceImage: bigImage, referenceImageSelected: true, label: "v1" });
    const smallImage = image("data:image/png;base64,AAAA");
    save({ referenceImage: smallImage, referenceImageSelected: true, label: "v2" });
    expect(load()?.state.referenceImage?.dataUrl).toBe(smallImage.dataUrl);
  });

  it("never throws and reports once per failure streak when nothing fits", () => {
    const { quota, save, onSaveFailed } = setup(10);
    const state = { referenceImage: null, referenceImageSelected: false, label: "v1" };

    expect(() => save(state)).not.toThrow();
    save(state);
    expect(onSaveFailed).toHaveBeenCalledOnce();

    quota.maxChars = 100_000;
    save(state);
    quota.maxChars = 10;
    save(state);
    expect(onSaveFailed).toHaveBeenCalledTimes(2);
  });

  it("stays in memory when the browser blocks storage", () => {
    const persisted = createPanelStateStorage<TestState>({
      onReferenceImageDropped: () => {},
      onSaveFailed: () => {},
      getStorage: () => {
        throw new DOMException("Access denied", "SecurityError");
      },
    });
    expect(persisted).toBeUndefined();
  });
});

describe("isQuotaExceededError", () => {
  it("recognizes quota errors across browsers", () => {
    expect(isQuotaExceededError(new DOMException("full", "QuotaExceededError"))).toBe(true);
    expect(isQuotaExceededError({ name: "NS_ERROR_DOM_QUOTA_REACHED" })).toBe(true);
    expect(isQuotaExceededError(new TypeError("nope"))).toBe(false);
    expect(isQuotaExceededError(undefined)).toBe(false);
  });
});
