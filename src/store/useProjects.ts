import React from 'react';

import { useI18n } from '@i18n/I18nContext';
import { buildKicadEdgeCutsSvg, buildKicadPcbFile } from '@lib/exportKicad';
import { buildPanelSvg } from '@lib/exportSvg';
import {
  DEFAULT_PANEL_OPTIONS,
  type MountingHole
} from '@lib/panelTypes';
import {
  DEFAULT_EXPORT_FORMAT,
  getPreferredExportFormat,
  setPreferredExportFormat,
  type ExportFormat
} from '@lib/exportPreferences';
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

type StatusVariant = 'success' | 'error' | 'info';

interface StatusMessage {
  message: string;
  variant: StatusVariant;
}

interface UseProjectsResult {
  projectName: string;
  setProjectName: React.Dispatch<React.SetStateAction<string>>;
  projects: StoredProject[];
  activeProjectName: string | null;
  hasUnsavedChanges: boolean;
  selectedSavedName: string;
  setSelectedSavedName: React.Dispatch<React.SetStateAction<string>>;
  statusMessage: StatusMessage | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleSaveProject: () => void;
  handleLoadProject: (name: string) => void;
  handleDeleteProject: (name: string) => void;
  handleUndoDeleteProject: () => boolean;
  handleExportJson: () => void;
  handleImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportPng: () => void;
  handleExportSvg: () => void;
  handleExportKicadSvg: () => void;
  handleExportKicadPcb: () => void;
  handleExportStl: (thicknessMm: number) => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
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
  const clearSelection = usePanelStore((state) => state.clearSelection);

  const [projectName, setProjectName] = React.useState(t.projects.defaultName);
  const [projects, setProjects] = React.useState<StoredProject[]>([]);
  const [activeProjectName, setActiveProjectName] = React.useState<string | null>(null);
  const [selectedSavedName, setSelectedSavedName] = React.useState<string>('');
  const [statusMessage, setStatusMessage] = React.useState<StatusMessage | null>(null);
  const [lastDeletedProject, setLastDeletedProject] = React.useState<StoredProject | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = React.useState<string>(t.projects.defaultName);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [exportFormat, setExportFormatState] = React.useState<ExportFormat>(() => {
    const stored = getPreferredExportFormat();
    return stored ?? DEFAULT_EXPORT_FORMAT;
  });

  const refreshProjects = React.useCallback(() => {
    setProjects(listProjects());
  }, []);

  React.useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const serializedModel = React.useMemo(() => serializePanelModel(panelModel), [panelModel]);

  const hasUnsavedChanges = React.useMemo(() => {
    if (!lastSavedSnapshot) {
      return true;
    }
    const trimmedName = projectName.trim() || t.projects.defaultName;
    const savedName = (lastSavedName || t.projects.defaultName).trim();
    return serializedModel !== lastSavedSnapshot || trimmedName !== savedName;
  }, [lastSavedName, lastSavedSnapshot, projectName, serializedModel, t.projects.defaultName]);

  const markSavedState = React.useCallback(
    (name: string, snapshot: string) => {
      setLastSavedSnapshot(snapshot);
      setLastSavedName(name);
    },
    []
  );

  const setStatus = React.useCallback(
    (message: string, variant: StatusVariant) => {
      setStatusMessage({ message, variant });
    },
    []
  );

  const handleSaveProject = React.useCallback(() => {
    const trimmedName = projectName.trim() || t.projects.defaultName;
    const saved = saveProject(trimmedName, panelModel);
    markSavedState(trimmedName, serializedModel);
    setProjects(saved);
    setActiveProjectName(trimmedName);
    setLastDeletedProject(null);
    setSelectedSavedName(trimmedName);
    setStatus(t.projects.messages.saveSuccess(trimmedName), 'success');
  }, [
    markSavedState,
    panelModel,
    projectName,
    serializedModel,
    setStatus,
    t.projects.defaultName,
    t.projects.messages,
    t.projects.messages.saveSuccess
  ]);

  const handleLoadProject = React.useCallback(
    (name: string) => {
      const model = loadProject(name);
      if (!model) {
        setStatus(t.projects.messages.loadError(name), 'error');
        return;
      }
      setModel(model);
      clearHistory();
      clearSelection();
      setPlacementType(null);
      resetView();
      setActiveProjectName(name);
      setProjectName(name);
      markSavedState(name, serializePanelModel(model));
      setLastDeletedProject(null);
      setSelectedSavedName(name);
      setStatus(t.projects.messages.loadSuccess(name), 'success');
    },
    [
      clearHistory,
      markSavedState,
      resetView,
      setStatus,
      setModel,
      setPlacementType,
      clearSelection,
      t.projects.messages
    ]
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
    setStatus(t.projects.messages.jsonExport, 'success');
  }, [panelModel, projectName, setStatus, t.projects.messages]);

  const handleImportJson = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          const model = deserializePanelModel(text);
          const nextName = file.name.replace(/\.json$/i, '');
          setModel(model);
          clearHistory();
          setProjectName(nextName);
          markSavedState(nextName, serializePanelModel(model));
          clearSelection();
          setPlacementType(null);
          resetView();
          setStatus(t.projects.messages.importSuccess(file.name), 'success');
        })
        .catch(() => {
          setStatus(t.projects.messages.importError, 'error');
        })
        .finally(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    },
    [
      clearHistory,
      markSavedState,
      resetView,
      setStatus,
      setModel,
      setPlacementType,
      clearSelection,
      t.projects.messages,
      t.projects.messages.importError,
      t.projects.messages.importSuccess
    ]
  );

  const handleExportPng = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setStatus(t.projects.messages.pngError, 'error');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.png`;
    link.href = url;
    link.click();
    setStatus(t.projects.messages.pngSuccess, 'success');
  }, [canvasRef, projectName, setStatus, t.projects.messages]);

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
    setStatus(t.projects.messages.svgExport, 'success');
  }, [mountingHoles, panelModel, projectName, setStatus, t.projects.messages]);

  const handleExportKicadSvg = React.useCallback(() => {
    const svg = buildKicadEdgeCutsSvg(panelModel, mountingHoles);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}-edge-cuts.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t.projects.messages.kicadSvgExport, 'success');
  }, [mountingHoles, panelModel, projectName, setStatus, t.projects.messages]);

  const handleExportKicadPcb = React.useCallback(() => {
    const pcb = buildKicadPcbFile(panelModel, mountingHoles);
    const blob = new Blob([pcb], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.kicad_pcb`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t.projects.messages.kicadPcbExport, 'success');
  }, [mountingHoles, panelModel, projectName, setStatus, t.projects.messages]);

  const handleExportStl = React.useCallback(
    (thicknessMm: number) => {
      if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) {
        return;
      }

      import('@lib/exportStl')
        .then(({ buildPanelStl }) => {
          const stl = buildPanelStl(panelModel, mountingHoles, {
            thicknessMm
          });
          const blob = new Blob([stl], { type: 'model/stl' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
          link.download = `${baseName || 'panel'}.stl`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setStatus(t.projects.messages.stlExport, 'success');
        })
        .catch((error) => {
          console.error('Failed to export STL', error);
          setStatus(t.projects.messages.stlError, 'error');
        });
    },
    [mountingHoles, panelModel, projectName, setStatus, t.projects.messages]
  );

  const setExportFormat = React.useCallback((format: ExportFormat) => {
    setExportFormatState(format);
    setPreferredExportFormat(format);
  }, []);

  const handleDeleteProject = React.useCallback(
    (name: string) => {
      const match = projects.find(
        (project) => project.name.toLowerCase() === name.toLowerCase()
      );
      setLastDeletedProject(match ?? null);
      const next = deleteProject(name);
      setProjects(next);
      if (activeProjectName && activeProjectName.toLowerCase() === name.toLowerCase()) {
        setActiveProjectName(null);
      }
      if (selectedSavedName && selectedSavedName.toLowerCase() === name.toLowerCase()) {
        setSelectedSavedName('');
      }
      setStatus(t.projects.messages.deleteSuccess(name), 'success');
    },
    [activeProjectName, projects, selectedSavedName, setStatus, t.projects.messages]
  );

  const handleUndoDeleteProject = React.useCallback(() => {
    if (!lastDeletedProject) {
      return false;
    }
    const restoredModel = deserializePanelModel(lastDeletedProject.payload);
    const restoredSnapshot = serializePanelModel(restoredModel);
    const saved = saveProject(lastDeletedProject.name, restoredModel);
    markSavedState(lastDeletedProject.name, restoredSnapshot);
    setProjects(saved);
    setLastDeletedProject(null);
    setSelectedSavedName(lastDeletedProject.name);
    setStatus(t.projects.messages.deleteUndoSuccess(lastDeletedProject.name), 'success');
    return true;
  }, [lastDeletedProject, markSavedState, setStatus, t.projects.messages]);

  const handleReset = React.useCallback(() => {
    const resetModel = {
      dimensions: createPanelDimensions(10),
      elements: [],
      options: { ...DEFAULT_PANEL_OPTIONS }
    };
    setModel(resetModel);
    clearHistory();
    setPlacementType(null);
    clearSelection();
    setProjectName(t.projects.defaultName);
    markSavedState(t.projects.defaultName, serializePanelModel(resetModel));
    setLastDeletedProject(null);
    setStatus(t.projects.messages.reset, 'info');
    resetView();
  }, [
    clearHistory,
    markSavedState,
    setStatus,
    resetView,
    setModel,
    setPlacementType,
    clearSelection,
    t.projects.defaultName,
    t.projects.messages.reset
  ]);

  return {
    projectName,
    setProjectName,
    projects,
    activeProjectName,
    hasUnsavedChanges,
    selectedSavedName,
    setSelectedSavedName,
    statusMessage,
    fileInputRef,
    handleSaveProject,
    handleLoadProject,
    handleDeleteProject,
    handleUndoDeleteProject,
    handleExportJson,
    handleImportJson,
    handleExportPng,
    handleExportSvg,
    handleExportKicadSvg,
    handleExportKicadPcb,
    handleExportStl,
    exportFormat,
    setExportFormat,
    handleReset
  };
}
