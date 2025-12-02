import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PANEL_OPTIONS, type PanelModel } from '../panelTypes';
import { createPanelDimensions } from '../units';
import {
  deleteProject,
  listProjects,
  loadProject,
  saveProject
} from '../storage';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
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
  options: { ...DEFAULT_PANEL_OPTIONS }
};

describe('storage helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and lists projects', () => {
    const projects = saveProject('Test', sampleModel);
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Test');
    const listed = listProjects();
    expect(listed[0].payload.model.dimensions.widthHp).toBeGreaterThan(0);
  });

  it('loads a saved project', () => {
    saveProject('Loadable', sampleModel);
    const model = loadProject('loadable');
    expect(model).not.toBeNull();
    expect(model?.dimensions.widthHp).toBe(sampleModel.dimensions.widthHp);
  });

  it('deletes a saved project', () => {
    saveProject('Temp', sampleModel);
    const afterDelete = deleteProject('Temp');
    expect(afterDelete).toHaveLength(0);
    expect(loadProject('Temp')).toBeNull();
  });
});
