import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import {
  getPreferredExportFormat,
  getPreferredRightPanelTab,
  getPreferredViewMode,
  setPreferredExportFormat,
  setPreferredRightPanelTab,
  setPreferredViewMode,
} from "../preferences";

const PREFERENCES_KEY = "eurorack-panel-preferences";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length(): number {
    return this.store.size;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("preferences", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when nothing is stored", () => {
    expect(getPreferredExportFormat()).toBeNull();
    expect(getPreferredViewMode()).toBeNull();
  });

  it("stores the view mode next to the export format", () => {
    setPreferredExportFormat("stl");
    setPreferredViewMode("split");

    expect(getPreferredExportFormat()).toBe("stl");
    expect(getPreferredViewMode()).toBe("split");
    expect(JSON.parse(storage.getItem(PREFERENCES_KEY) ?? "{}")).toEqual({
      preferredExportFormat: "stl",
      viewMode: "split",
    });
  });

  it("remembers the open tab of the right panel", () => {
    expect(getPreferredRightPanelTab()).toBeNull();

    setPreferredViewMode("3d");
    setPreferredRightPanelTab("components");

    expect(getPreferredRightPanelTab()).toBe("components");
    expect(getPreferredViewMode()).toBe("3d");

    storage.setItem(PREFERENCES_KEY, JSON.stringify({ rightPanelTab: "layers" }));
    expect(getPreferredRightPanelTab()).toBeNull();
  });

  it("ignores an unknown value without dropping the other preferences", () => {
    storage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ preferredExportFormat: "png", viewMode: "vr" }),
    );

    expect(getPreferredViewMode()).toBeNull();
    expect(getPreferredExportFormat()).toBe("png");
  });

  it("ignores unreadable stored preferences", () => {
    storage.setItem(PREFERENCES_KEY, "{not json");

    expect(getPreferredViewMode()).toBeNull();
  });

  it("does not throw when storage is full", () => {
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => setPreferredViewMode("3d")).not.toThrow();
    expect(getPreferredViewMode()).toBeNull();
  });
});
