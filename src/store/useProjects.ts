import React from 'react';

import { useI18n } from '@i18n/I18nContext';
import { buildPanelSvg } from '@lib/exportSvg';
import {
  DEFAULT_PANEL_OPTIONS,
  type MountingHole
} from '@lib/panelTypes';
import {
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
  type StoredProject
} from '@lib/storage';
import {
  deserializePanelModel,
  serializePanelModel
} from '@lib/serialization';
import { createPanelDimensions } from '@lib/units';
import { usePanelStore } from '@store/panelStore';

interface UseProjectsArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mountingHoles: MountingHole[];
  resetView: () => void;
  clearHistory: () => void;
}

interface UseProjectsResult {
  projectName: string;
  setProjectName: React.Dispatch<React.SetStateAction<string>>;
  projects: StoredProject[];
  activeProjectName: string | null;
  selectedSavedName: string;
  setSelectedSavedName: React.Dispatch<React.SetStateAction<string>>;
  statusMessage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  refreshProjects: () => void;
  handleSaveProject: () => void;
  handleLoadProject: (name: string) => void;
  handleDeleteProject: (name: string) => void;
  handleExportJson: () => void;
  handleImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportPng: () => void;
  handleExportSvg: () => void;
  handleReset: () => void;
}

export function useProjects({
  canvasRef,
  mountingHoles,
  resetView,
  clearHistory
}: UseProjectsArgs): UseProjectsResult {
  const t = useI18n();
  const panelModel = usePanelStore((state) => state.model);
  const setModel = usePanelStore((state) => state.setModel);
  const setPlacementType = usePanelStore((state) => state.setPlacementType);
  const setSelectedElementId = usePanelStore((state) => state.setSelectedElement);

  const [projectName, setProjectName] = React.useState(t.projects.defaultName);
  const [projects, setProjects] = React.useState<StoredProject[]>([]);
  const [activeProjectName, setActiveProjectName] = React.useState<string | null>(null);
  const [selectedSavedName, setSelectedSavedName] = React.useState<string>('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const refreshProjects = React.useCallback(() => {
    setProjects(listProjects());
  }, []);

  React.useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleSaveProject = React.useCallback(() => {
    const trimmedName = projectName.trim() || t.projects.defaultName;
    const saved = saveProject(trimmedName, panelModel);
    setProjects(saved);
    setActiveProjectName(trimmedName);
    setSelectedSavedName(trimmedName);
    setStatusMessage(t.projects.messages.saveSuccess(trimmedName));
  }, [panelModel, projectName, t.projects.defaultName, t.projects.messages, t.projects.messages.saveSuccess]);

  const handleLoadProject = React.useCallback(
    (name: string) => {
      const model = loadProject(name);
      if (!model) {
        setStatusMessage(t.projects.messages.loadError(name));
        return;
      }
      setModel(model);
      clearHistory();
      setSelectedElementId(null);
      setPlacementType(null);
      resetView();
      setActiveProjectName(name);
      setSelectedSavedName(name);
      setStatusMessage(t.projects.messages.loadSuccess(name));
    },
    [
      clearHistory,
      resetView,
      setModel,
      setPlacementType,
      setSelectedElementId,
      t.projects.messages
    ]
  );

  const handleDeleteProject = React.useCallback(
    (name: string) => {
      const next = deleteProject(name);
      setProjects(next);
      if (activeProjectName && activeProjectName.toLowerCase() === name.toLowerCase()) {
        setActiveProjectName(null);
      }
      if (selectedSavedName && selectedSavedName.toLowerCase() === name.toLowerCase()) {
        setSelectedSavedName('');
      }
      setStatusMessage(t.projects.messages.deleteSuccess(name));
    },
    [activeProjectName, selectedSavedName, t.projects.messages]
  );

  const handleExportJson = React.useCallback(() => {
    const payload = serializePanelModel(panelModel);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage(t.projects.messages.jsonExport);
  }, [panelModel, projectName, t.projects.messages]);

  const handleImportJson = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          const model = deserializePanelModel(text);
          setModel(model);
          clearHistory();
          setProjectName(file.name.replace(/\.json$/i, ''));
          setSelectedElementId(null);
          setPlacementType(null);
          resetView();
          setStatusMessage(t.projects.messages.importSuccess(file.name));
        })
        .catch(() => {
          setStatusMessage(t.projects.messages.importError);
        })
        .finally(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    },
    [
      clearHistory,
      resetView,
      setModel,
      t.projects.messages,
      t.projects.messages.importError,
      t.projects.messages.importSuccess
    ]
  );

  const handleExportPng = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setStatusMessage(t.projects.messages.pngError);
      return;
    }
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.png`;
    link.href = url;
    link.click();
    setStatusMessage(t.projects.messages.pngSuccess);
  }, [canvasRef, projectName, t.projects.messages]);

  const handleExportSvg = React.useCallback(() => {
    const svg = buildPanelSvg(panelModel, mountingHoles, {
      stroke: '#f5f3f0',
      panelStroke: '#f5f3f0',
      background: null,
      strokeWidth: 0.8
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage(t.projects.messages.svgExport);
  }, [mountingHoles, panelModel, projectName, t.projects.messages]);

  const handleReset = React.useCallback(() => {
    setModel({
      dimensions: createPanelDimensions(10),
      elements: [],
      options: { ...DEFAULT_PANEL_OPTIONS }
    });
    clearHistory();
    setPlacementType(null);
    setSelectedElementId(null);
    setProjectName(t.projects.defaultName);
    setStatusMessage(t.projects.messages.reset);
    resetView();
  }, [
    clearHistory,
    resetView,
    setModel,
    setPlacementType,
    setSelectedElementId,
    t.projects.defaultName,
    t.projects.messages.reset
  ]);

  return {
    projectName,
    setProjectName,
    projects,
    activeProjectName,
    selectedSavedName,
    setSelectedSavedName,
    statusMessage,
    fileInputRef,
    refreshProjects,
    handleSaveProject,
    handleLoadProject,
    handleDeleteProject,
    handleExportJson,
    handleImportJson,
    handleExportPng,
    handleExportSvg,
    handleReset
  };
}

