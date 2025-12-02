import React from 'react';

import {
  PanelElementType,
  withElementProperties,
  type PanelElement,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import { usePanelStore } from '@store/panelStore';

const MAX_HISTORY = 100;

interface PanelHistoryApi {
  clearHistory: () => void;
  updateModel: (
    updater: (model: PanelModel) => PanelModel,
    options?: { skipHistory?: boolean }
  ) => void;
  undo: () => void;
  redo: () => void;
  beginMove: () => void;
  endMove: () => void;
  addElement: (type: PanelElementType, positionMm: Vector2) => string;
  moveElement: (elementId: string, positionMm: Vector2) => void;
  updateElement: (elementId: string, updater: (element: PanelElement) => PanelElement) => void;
  updateElementProperties: (elementId: string, properties: PanelElement['properties']) => void;
  removeElement: (elementId: string) => void;
}

export function usePanelHistory(): PanelHistoryApi {
  const setModel = usePanelStore((state) => state.setModel);
  const setSelectedElementId = usePanelStore((state) => state.setSelectedElement);
  const addElementAction = usePanelStore((state) => state.addElement);
  const moveElementAction = usePanelStore((state) => state.moveElement);
  const updateElementAction = usePanelStore((state) => state.updateElement);
  const removeElementAction = usePanelStore((state) => state.removeElement);

  const historyRef = React.useRef<PanelModel[]>([]);
  const futureRef = React.useRef<PanelModel[]>([]);
  const moveHistoryPushedRef = React.useRef(false);

  const pushHistory = React.useCallback((model: PanelModel) => {
    const snapshot = JSON.parse(JSON.stringify(model)) as PanelModel;
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
  }, []);

  const clearHistory = React.useCallback(() => {
    historyRef.current = [];
    futureRef.current = [];
  }, []);

  const updateModel = React.useCallback<
    PanelHistoryApi['updateModel']
  >(
    (updater, options) => {
      const current = usePanelStore.getState().model;
      if (!options?.skipHistory) {
        pushHistory(current);
        futureRef.current = [];
      }
      setModel(updater(current));
    },
    [pushHistory, setModel]
  );

  const undo = React.useCallback(() => {
    const previous = historyRef.current.pop();
    const current = usePanelStore.getState().model;
    if (!previous) {
      return;
    }
    const snapshot = JSON.parse(JSON.stringify(current)) as PanelModel;
    futureRef.current.push(snapshot);
    setModel(previous);
    setSelectedElementId(null);
  }, [setModel, setSelectedElementId]);

  const redo = React.useCallback(() => {
    const next = futureRef.current.pop();
    const current = usePanelStore.getState().model;
    if (!next) {
      return;
    }
    const snapshot = JSON.parse(JSON.stringify(current)) as PanelModel;
    historyRef.current.push(snapshot);
    setModel(next);
    setSelectedElementId(null);
  }, [setModel, setSelectedElementId]);

  const beginMove = React.useCallback(() => {
    moveHistoryPushedRef.current = false;
  }, []);

  const endMove = React.useCallback(() => {
    moveHistoryPushedRef.current = false;
  }, []);

  const addElement = React.useCallback<
    PanelHistoryApi['addElement']
  >(
    (type, positionMm) => {
      const current = usePanelStore.getState().model;
      pushHistory(current);
      futureRef.current = [];
      return addElementAction(type, positionMm);
    },
    [addElementAction, pushHistory]
  );

  const moveElement = React.useCallback<
    PanelHistoryApi['moveElement']
  >(
    (elementId, positionMm) => {
      if (!moveHistoryPushedRef.current) {
        const current = usePanelStore.getState().model;
        pushHistory(current);
        futureRef.current = [];
        moveHistoryPushedRef.current = true;
      }
      moveElementAction(elementId, positionMm);
    },
    [moveElementAction, pushHistory]
  );

  const updateElement = React.useCallback<
    PanelHistoryApi['updateElement']
  >(
    (elementId, updater) => {
      const current = usePanelStore.getState().model;
      pushHistory(current);
      futureRef.current = [];
      updateElementAction(elementId, updater);
    },
    [pushHistory, updateElementAction]
  );

  const updateElementProperties = React.useCallback<
    PanelHistoryApi['updateElementProperties']
  >(
    (elementId, properties) => {
      const current = usePanelStore.getState().model;
      pushHistory(current);
      futureRef.current = [];
      updateElementAction(elementId, (element) =>
        withElementProperties(element, properties)
      );
    },
    [pushHistory, updateElementAction]
  );

  const removeElement = React.useCallback<
    PanelHistoryApi['removeElement']
  >(
    (elementId) => {
      const current = usePanelStore.getState().model;
      pushHistory(current);
      futureRef.current = [];
      removeElementAction(elementId);
    },
    [pushHistory, removeElementAction]
  );

  return {
    clearHistory,
    updateModel,
    undo,
    redo,
    beginMove,
    endMove,
    addElement,
    moveElement,
    updateElement,
    updateElementProperties,
    removeElement
  };
}

