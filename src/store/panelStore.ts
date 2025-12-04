import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPanelElement } from '@lib/elements';
import {
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  sanitizePropertiesForType,
  withElementProperties,
  type PanelElement,
  type PanelElementPropertiesMap,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import { createPanelDimensions } from '@lib/units';

const DEFAULT_PANEL_WIDTH_CM = 10;

type DraftPropertiesState = Partial<{
  [T in PanelElementType]: PanelElementPropertiesMap[T];
}>;

type PanelState = {
  model: PanelModel;
  selectedElementId: string | null;
  selectedElementIds: string[];
  placementType: PanelElementType | null;
  draftProperties: DraftPropertiesState;
};

type ElementsMoveInput = {
  id: string;
  positionMm: Vector2;
};

type PanelActions = {
  setModel: (model: PanelModel) => void;
  setPlacementType: (type: PanelElementType | null) => void;
  setSelectedElement: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  addSelectedElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;
  clearSelection: () => void;
  setDraftProperties: (
    type: PanelElementType,
    properties: PanelElement['properties']
  ) => void;
  addElement: (type: PanelElementType, positionMm: Vector2) => string;
  moveElement: (id: string, positionMm: Vector2) => void;
  moveElements: (updates: ElementsMoveInput[]) => void;
  updateElement: (id: string, updater: (el: PanelElement) => PanelElement) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  reset: () => void;
};

const createInitialModel = (): PanelModel => ({
  dimensions: createPanelDimensions(DEFAULT_PANEL_WIDTH_CM),
  elements: [],
  options: { ...DEFAULT_PANEL_OPTIONS }
});

export const usePanelStore = create<PanelState & PanelActions>()(
  persist(
    (set, get) => ({
      model: createInitialModel(),
      selectedElementId: null,
      selectedElementIds: [],
      placementType: null,
      draftProperties: {},
      setModel: (model) => set({ model }),
      setPlacementType: (type) => set({ placementType: type }),
      setSelectedElement: (id) =>
        set(() => ({
          selectedElementId: id,
          selectedElementIds: id ? [id] : []
        })),
      setSelectedElementIds: (ids) =>
        set(() => {
          const unique = Array.from(new Set(ids.filter(Boolean)));
          return {
            selectedElementIds: unique,
            selectedElementId: unique.length ? unique[unique.length - 1] : null
          };
        }),
      addSelectedElements: (ids) =>
        set((state) => {
          const existing = new Set(state.selectedElementIds);
          const nextIds = [...state.selectedElementIds];
          let lastAdded: string | null = null;
          ids.forEach((id) => {
            if (!id || existing.has(id)) {
              return;
            }
            existing.add(id);
            nextIds.push(id);
            lastAdded = id;
          });
          return {
            selectedElementIds: nextIds,
            selectedElementId: lastAdded ?? state.selectedElementId
          };
        }),
      toggleElementSelection: (id) =>
        set((state) => {
          if (!id) {
            return state;
          }
          const exists = state.selectedElementIds.includes(id);
          if (!exists) {
            return {
              selectedElementIds: [...state.selectedElementIds, id],
              selectedElementId: id
            };
          }
          const nextIds = state.selectedElementIds.filter((value) => value !== id);
          return {
            selectedElementIds: nextIds,
            selectedElementId: nextIds.length ? nextIds[nextIds.length - 1] : null
          };
        }),
      clearSelection: () => set({ selectedElementId: null, selectedElementIds: [] }),
      setDraftProperties: (type, properties) =>
        set((state) => {
          const sanitized = sanitizePropertiesForType(type, properties);
          if (!sanitized) {
            const nextDraft = { ...state.draftProperties };
            delete nextDraft[type];
            return { draftProperties: nextDraft };
          }
          return {
            draftProperties: { ...state.draftProperties, [type]: sanitized }
          };
        }),
      addElement: (type, positionMm) => {
        const element = withElementProperties(
          createPanelElement(type, positionMm),
          get().draftProperties[type]
        );
        set((state) => ({
          model: {
            ...state.model,
            elements: [...state.model.elements, element]
          },
          selectedElementId: element.id,
          selectedElementIds: [element.id]
        }));
        return element.id;
      },
      moveElement: (id, positionMm) =>
        set((state) => ({
          model: {
            ...state.model,
            elements: state.model.elements.map((element) =>
              element.id === id ? { ...element, positionMm } : element
            )
          }
        })),
      moveElements: (updates) =>
        set((state) => {
          if (!updates.length) {
            return state;
          }
          const updateMap = new Map(updates.map((entry) => [entry.id, entry.positionMm]));
          return {
            model: {
              ...state.model,
              elements: state.model.elements.map((element) => {
                const nextPosition = updateMap.get(element.id);
                return nextPosition ? { ...element, positionMm: nextPosition } : element;
              })
            }
          };
        }),
      updateElement: (id, updater) =>
        set((state) => ({
          model: {
            ...state.model,
            elements: state.model.elements.map((element) =>
              element.id === id ? updater(element) : element
            )
          }
        })),
      removeElement: (id) =>
        set((state) => ({
          model: {
            ...state.model,
            elements: state.model.elements.filter((element) => element.id !== id)
          },
          selectedElementIds: state.selectedElementIds.filter((elementId) => elementId !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        })),
      removeElements: (ids) =>
        set((state) => {
          const removeSet = new Set(ids);
          if (!removeSet.size) {
            return state;
          }
          const nextElements = state.model.elements.filter((element) => !removeSet.has(element.id));
          const nextSelection = state.selectedElementIds.filter((id) => !removeSet.has(id));
          return {
            model: {
              ...state.model,
              elements: nextElements
            },
            selectedElementIds: nextSelection,
            selectedElementId: nextSelection.length ? nextSelection[nextSelection.length - 1] : null
          };
        }),
      reset: () =>
        set({
          model: createInitialModel(),
          selectedElementId: null,
          selectedElementIds: [],
          placementType: null
        })
    }),
    {
      name: 'panel-designer-store',
      version: 1
    }
  )
);
