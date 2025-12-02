import {
  type PanelModel,
  type SerializedPanel
} from './panelTypes';
import {
  deserializePanelModel,
  parseSerializedPanel,
  serializePanelModel
} from './serialization';

const STORAGE_KEY = 'eurorack-panel-projects';

export interface StoredProject {
  name: string;
  payload: SerializedPanel;
  updatedAt: number;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const globalStore = (globalThis as { localStorage?: Storage }).localStorage;
  return globalStore ?? null;
}

function persist(projects: StoredProject[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function hydrateProjects(raw: unknown): StoredProject[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        typeof (entry as StoredProject).name !== 'string' ||
        typeof (entry as StoredProject).updatedAt !== 'number' ||
        !(entry as StoredProject).payload
      ) {
        return null;
      }

      try {
        const parsedPayload = parseSerializedPanel(
          (entry as StoredProject).payload
        );
        return {
          name: (entry as StoredProject).name,
          payload: parsedPayload,
          updatedAt: (entry as StoredProject).updatedAt
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as StoredProject[];
}

function readProjects(): StoredProject[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return hydrateProjects(parsed).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function listProjects(): StoredProject[] {
  return readProjects();
}

export function saveProject(name: string, model: PanelModel): StoredProject[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const payload = parseSerializedPanel(serializePanelModel(model));
  const projects = readProjects();
  const existingIndex = projects.findIndex(
    (project) => project.name.toLowerCase() === name.toLowerCase()
  );
  const nextEntry: StoredProject = {
    name,
    payload,
    updatedAt: Date.now()
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = nextEntry;
  } else {
    projects.unshift(nextEntry);
  }

  persist(projects);
  return projects;
}

export function loadProject(name: string): PanelModel | null {
  const projects = readProjects();
  const match = projects.find(
    (project) => project.name.toLowerCase() === name.toLowerCase()
  );
  if (!match) {
    return null;
  }
  return deserializePanelModel(match.payload);
}

export function deleteProject(name: string): StoredProject[] {
  const projects = readProjects().filter(
    (project) => project.name.toLowerCase() !== name.toLowerCase()
  );
  persist(projects);
  return projects;
}
