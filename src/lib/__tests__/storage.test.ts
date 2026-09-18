import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  type PanelModel,
} from "../panelTypes";
import { createPanelDimensions } from "../units";
import { deleteProject, importProjects, listProjects, loadProject, saveProject } from "../storage";
import { parseSerializedPanel, serializePanelModel } from "../serialization";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
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

const sampleModel: PanelModel = {
  dimensions: createPanelDimensions(12),
  elements: [],
  options: { ...DEFAULT_PANEL_OPTIONS },
  mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
  elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
  clearance: { ...DEFAULT_CLEARANCE_CONFIG },
  panelColor: "#1a1a1a",
  designColor: "#ffffff",
  designRelief: { ...DEFAULT_DESIGN_RELIEF },
};

describe("storage helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and lists projects", () => {
    const projects = saveProject("Test", sampleModel);
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Test");
    const listed = listProjects();
    expect(listed[0].payload.model.dimensions.widthHp).toBeGreaterThan(0);
  });

  it("loads a saved project", () => {
    saveProject("Loadable", sampleModel);
    const model = loadProject("loadable");
    expect(model).not.toBeNull();
    expect(model?.dimensions.widthHp).toBe(sampleModel.dimensions.widthHp);
  });

  it("deletes a saved project", () => {
    saveProject("Temp", sampleModel);
    const afterDelete = deleteProject("Temp");
    expect(afterDelete).toHaveLength(0);
    expect(loadProject("Temp")).toBeNull();
  });

  it("loads projects saved before texts had fonts and the relief moved to the panel", () => {
    const { designRelief: _unused, ...legacyModel } = sampleModel;
    const legacyPayload = {
      version: 6,
      model: {
        ...legacyModel,
        elements: [
          {
            id: "label-1",
            type: "label",
            positionMm: { x: 10, y: 20 },
            properties: { text: "OUT", fontSizePt: 9, label: "" },
          },
          {
            id: "svg-1",
            type: "svgArtwork",
            positionMm: { x: 20, y: 40 },
            properties: {
              svgText: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
              viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
              widthMm: 10,
              heightMm: 10,
              color: "#ffffff",
              stlThicknessMm: 1.2,
              stlPenetrationMm: 0.4,
            },
          },
        ],
      },
    };
    localStorage.setItem(
      "eurorack-panel-projects",
      JSON.stringify([{ name: "Old", payload: legacyPayload, updatedAt: 1 }]),
    );

    const model = loadProject("Old");

    expect(model?.designRelief).toEqual({ thicknessMm: 1.2, penetrationMm: 0.4 });
    expect(model?.elements[0].properties).toEqual({
      text: "OUT",
      fontSizePt: 9,
      label: "",
      fontId: "roboto",
      patternOverlap: "knockout",
      knockoutPaddingMm: 1,
    });
    expect(model?.elements[1].properties).not.toHaveProperty("stlThicknessMm");
    // Saving again stores the current format.
    saveProject("Old", model!);
    expect(listProjects()[0].payload.model.designRelief).toEqual(model?.designRelief);
  });
});

describe("importProjects", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const payload = parseSerializedPanel(serializePanelModel(sampleModel));

  it("keeps every version when names collide, and can run twice", () => {
    saveProject("Filter", sampleModel);
    const incoming = [
      { name: "Filter", payload, updatedAt: 1 },
      { name: "Mixer", payload, updatedAt: 2 },
    ];

    expect(importProjects(incoming, "(GitHub Pages)")).toBe(2);
    expect(importProjects(incoming, "(GitHub Pages)")).toBe(0);

    const names = listProjects().map((project) => project.name);
    expect(names.sort()).toEqual(["Filter", "Filter (GitHub Pages)", "Mixer"]);
  });

  it("ignores invalid entries", () => {
    expect(importProjects([{ name: "No payload", updatedAt: 1 }, "junk"], "(copy)")).toBe(0);
    expect(importProjects("not a list", "(copy)")).toBe(0);
    expect(listProjects()).toHaveLength(0);
  });
});
