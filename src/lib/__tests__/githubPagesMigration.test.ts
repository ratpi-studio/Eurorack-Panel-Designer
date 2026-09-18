import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { createPanelElement } from "@lib/elements";
import {
  GITHUB_PAGES_DATA_PREFIX,
  importGithubPagesData,
  readGithubPagesData,
} from "@lib/githubPagesMigration";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  type PanelModel,
} from "@lib/panelTypes";
import { parseSerializedPanel, serializePanelModel } from "@lib/serialization";
import { listProjects, loadProject } from "@lib/storage";
import { createPanelDimensions } from "@lib/units";

const STORE_KEY = "panel-designer-store";
const PROJECTS_KEY = "eurorack-panel-projects";
const PREFERENCES_KEY = "eurorack-panel-preferences";
const names = {
  sessionProjectName: "Last session on GitHub Pages",
  projectNameSuffix: "(GitHub Pages)",
};

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

function createModel(jackCount: number): PanelModel {
  return {
    dimensions: createPanelDimensions(12),
    elements: Array.from({ length: jackCount }, (_, index) =>
      createPanelElement(PanelElementType.Jack, { x: 10, y: 20 + index * 10 }),
    ),
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#1a1a1a",
    designColor: "#ffffff",
  };
}

function persistedStore(model: PanelModel): string {
  return JSON.stringify({
    state: { model, referenceImage: null, referenceImageSelected: false },
    version: 8,
  });
}

describe("readGithubPagesData", () => {
  it("ignores other fragments", () => {
    expect(readGithubPagesData("")).toBeNull();
    expect(readGithubPagesData("#settings")).toBeNull();
  });

  it("decodes the values handed over by the redirect page", () => {
    const data = { [PROJECTS_KEY]: '[{"name":"Filtré #1 100%"}]', ignored: 42 };
    const hash = `${GITHUB_PAGES_DATA_PREFIX}${encodeURIComponent(JSON.stringify(data))}`;
    expect(readGithubPagesData(hash)).toEqual({ [PROJECTS_KEY]: data[PROJECTS_KEY] });
  });

  it("rejects malformed data", () => {
    expect(() => readGithubPagesData(`${GITHUB_PAGES_DATA_PREFIX}%7Bbroken`)).toThrow(SyntaxError);
    expect(() => readGithubPagesData(`${GITHUB_PAGES_DATA_PREFIX}%5B%5D`)).toThrow(
      "Invalid GitHub Pages data",
    );
  });
});

describe("importGithubPagesData", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores the previous design, projects and preferences in a fresh browser", () => {
    const store = persistedStore(createModel(2));
    const projects = JSON.stringify([
      {
        name: "Filter",
        payload: parseSerializedPanel(serializePanelModel(createModel(1))),
        updatedAt: 1,
      },
    ]);
    importGithubPagesData(
      { [STORE_KEY]: store, [PROJECTS_KEY]: projects, [PREFERENCES_KEY]: '{"exportFormat":"stl"}' },
      names,
    );

    expect(localStorage.getItem(STORE_KEY)).toBe(store);
    expect(listProjects().map((project) => project.name)).toEqual(["Filter"]);
    expect(localStorage.getItem(PREFERENCES_KEY)).toBe('{"exportFormat":"stl"}');
  });

  it("keeps the current design and saves the previous one as a project", () => {
    const current = persistedStore(createModel(3));
    localStorage.setItem(STORE_KEY, current);

    importGithubPagesData({ [STORE_KEY]: persistedStore(createModel(1)) }, names);

    expect(localStorage.getItem(STORE_KEY)).toBe(current);
    expect(loadProject(names.sessionProjectName)?.elements).toHaveLength(1);
  });

  it("keeps the previous design only once across visits", () => {
    localStorage.setItem(STORE_KEY, persistedStore(createModel(3)));
    const data = { [STORE_KEY]: persistedStore(createModel(1)) };

    importGithubPagesData(data, names);
    importGithubPagesData(data, names);

    expect(listProjects().map((project) => project.name)).toEqual([names.sessionProjectName]);
  });

  it("does not duplicate a previous design that is already the current one", () => {
    const store = persistedStore(createModel(2));
    importGithubPagesData({ [STORE_KEY]: store }, names);
    importGithubPagesData({ [STORE_KEY]: store }, names);

    expect(localStorage.getItem(STORE_KEY)).toBe(store);
    expect(listProjects()).toHaveLength(0);
  });

  it("replaces a current design that has no elements", () => {
    localStorage.setItem(STORE_KEY, persistedStore(createModel(0)));
    const previous = persistedStore(createModel(1));

    importGithubPagesData({ [STORE_KEY]: previous }, names);

    expect(localStorage.getItem(STORE_KEY)).toBe(previous);
    expect(listProjects()).toHaveLength(0);
  });

  it("does not overwrite preferences or keep an empty previous design", () => {
    localStorage.setItem(PREFERENCES_KEY, '{"exportFormat":"png"}');
    localStorage.setItem(STORE_KEY, persistedStore(createModel(1)));

    importGithubPagesData(
      { [STORE_KEY]: persistedStore(createModel(0)), [PREFERENCES_KEY]: '{"exportFormat":"stl"}' },
      names,
    );

    expect(localStorage.getItem(PREFERENCES_KEY)).toBe('{"exportFormat":"png"}');
    expect(listProjects()).toHaveLength(0);
  });
});
