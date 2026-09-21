import React from "react";

import { useI18n } from "@i18n/I18nContext";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_COLOR,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_COLOR,
  DEFAULT_PANEL_OPTIONS,
  type MountingHole,
  type PanelModel,
} from "@lib/panelTypes";
import { DEFAULT_PANEL_FORMAT } from "@lib/panelFormat";
import { buildPanelPngDataUrl } from "@lib/canvas/exportPng";
import { collectTextFontIds } from "@lib/designLayer";
import {
  DEFAULT_EXPORT_FORMAT,
  getPreferredExportFormat,
  setPreferredExportFormat,
  type ExportFormat,
} from "@lib/preferences";
import {
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
  type StoredProject,
} from "@lib/storage";
import { reportError } from "@lib/monitoring";
import { withoutHiddenElements } from "@lib/elementVisibility";
import { deserializePanelModel, serializePanelModel } from "@lib/serialization";
import { loadTextFonts } from "@lib/text/textFontLoader";
import { createPanelDimensions } from "@lib/units";
import { usePanelStore } from "@store/panelStore";

interface UseProjectsArgs {
  mountingHoles: MountingHole[];
  resetView: () => void;
  clearHistory: () => void;
}

type StatusVariant = "success" | "error" | "info";

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
  handleExportStl: (thicknessMm: number, fileName?: string) => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  handleReset: () => void;
}

export function useProjects({
  mountingHoles,
  resetView,
  clearHistory,
}: UseProjectsArgs): UseProjectsResult {
  const t = useI18n();
  const panelModel = usePanelStore((state) => state.model);
  // Exports leave hidden elements out; saving and the JSON export keep them.
  const outputModel = React.useMemo(() => withoutHiddenElements(panelModel), [panelModel]);
  const setModel = usePanelStore((state) => state.setModel);
  const setPlacementType = usePanelStore((state) => state.setPlacementType);
  const clearSelection = usePanelStore((state) => state.clearSelection);

  const [projectName, setProjectName] = React.useState(t.projects.defaultName);
  const [projects, setProjects] = React.useState<StoredProject[]>([]);
  const [activeProjectName, setActiveProjectName] = React.useState<string | null>(null);
  const [selectedSavedName, setSelectedSavedName] = React.useState<string>("");
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

  const markSavedState = React.useCallback((name: string, snapshot: string) => {
    setLastSavedSnapshot(snapshot);
    setLastSavedName(name);
  }, []);

  const setStatus = React.useCallback((message: string, variant: StatusVariant) => {
    setStatusMessage({ message, variant });
  }, []);

  const renderPanelPng = React.useCallback(
    () => buildPanelPngDataUrl(outputModel, mountingHoles),
    [mountingHoles, outputModel],
  );

  const trySaveProject = React.useCallback(
    (name: string, model: PanelModel): StoredProject[] | null => {
      try {
        return saveProject(name, model);
      } catch (error) {
        // Usually QuotaExceededError: saved projects share browser storage with the autosave.
        reportError(error, "save-project");
        setStatus(t.projects.messages.saveError(name), "error");
        return null;
      }
    },
    [setStatus, t.projects.messages],
  );

  const handleSaveProject = React.useCallback(() => {
    const trimmedName = projectName.trim() || t.projects.defaultName;
    const saved = trySaveProject(trimmedName, panelModel);
    if (!saved) {
      return;
    }
    markSavedState(trimmedName, serializedModel);
    setProjects(saved);
    setActiveProjectName(trimmedName);
    setLastDeletedProject(null);
    setSelectedSavedName(trimmedName);
    setStatus(t.projects.messages.saveSuccess(trimmedName), "success");
  }, [markSavedState, panelModel, projectName, serializedModel, setStatus, t, trySaveProject]);

  const handleLoadProject = React.useCallback(
    (name: string) => {
      const model = loadProject(name);
      if (!model) {
        setStatus(t.projects.messages.loadError(name), "error");
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
      setStatus(t.projects.messages.loadSuccess(name), "success");
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
    ],
  );

  const handleExportJson = React.useCallback(() => {
    const payload = serializePanelModel(panelModel);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const baseName = (projectName || "panel").trim().replace(/\s+/g, "-");
    link.download = `${baseName || "panel"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t.projects.messages.jsonExport, "success");
  }, [panelModel, projectName, setStatus, t.projects.messages]);

  const handleImportJson = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          const model = deserializePanelModel(text);
          const nextName = file.name.replace(/\.json$/i, "");
          setModel(model);
          clearHistory();
          setProjectName(nextName);
          markSavedState(nextName, serializePanelModel(model));
          clearSelection();
          setPlacementType(null);
          resetView();
          setStatus(t.projects.messages.importSuccess(file.name), "success");
        })
        .catch(() => {
          setStatus(t.projects.messages.importError, "error");
        })
        .finally(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
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
      t,
    ],
  );

  const handleExportPng = React.useCallback(() => {
    renderPanelPng()
      .then((url) => {
        if (!url) {
          setStatus(t.projects.messages.pngError, "error");
          return;
        }
        const link = document.createElement("a");
        const baseName = (projectName || "panel").trim().replace(/\s+/g, "-");
        link.download = `${baseName || "panel"}.png`;
        link.href = url;
        link.click();
        setStatus(t.projects.messages.pngSuccess, "success");
      })
      .catch((error) => {
        reportError(error, "export-png");
        setStatus(t.projects.messages.pngError, "error");
      });
  }, [renderPanelPng, projectName, setStatus, t.projects.messages]);

  // The SVG and KiCad builders merge overlapping cut-outs with polygon-clipping, which stays out of
  // the startup bundle: they load on demand, like the STL one. Texts need their fonts loaded to be
  // turned into outlines.
  const handleExportSvg = React.useCallback(() => {
    Promise.all([import("@lib/exportSvg"), loadTextFonts(collectTextFontIds(outputModel.elements))])
      .then(([{ buildPanelSvg }]) => {
        const svg = buildPanelSvg(outputModel, mountingHoles, {
          stroke: "#f5f3f0",
          panelStroke: "#f5f3f0",
          background: null,
          strokeWidth: 0.8,
        });
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const baseName = (projectName || "panel").trim().replace(/\s+/g, "-");
        link.download = `${baseName || "panel"}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setStatus(t.projects.messages.svgExport, "success");
      })
      .catch((error) => {
        reportError(error, "export-svg");
        setStatus(t.projects.messages.svgError, "error");
      });
  }, [mountingHoles, outputModel, projectName, setStatus, t.projects.messages]);

  const handleExportKicadSvg = React.useCallback(() => {
    import("@lib/exportKicad")
      .then(({ buildKicadEdgeCutsSvg }) => {
        const svg = buildKicadEdgeCutsSvg(outputModel, mountingHoles);
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const baseName = (projectName || "panel").trim().replace(/\s+/g, "-");
        link.download = `${baseName || "panel"}-edge-cuts.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setStatus(t.projects.messages.kicadSvgExport, "success");
      })
      .catch((error) => {
        reportError(error, "export-kicad");
        setStatus(t.projects.messages.kicadError, "error");
      });
  }, [mountingHoles, outputModel, projectName, setStatus, t.projects.messages]);

  const handleExportKicadPcb = React.useCallback(() => {
    import("@lib/exportKicad")
      .then(({ buildKicadPcbFile }) => {
        const pcb = buildKicadPcbFile(outputModel, mountingHoles);
        const blob = new Blob([pcb], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const baseName = (projectName || "panel").trim().replace(/\s+/g, "-");
        link.download = `${baseName || "panel"}.kicad_pcb`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setStatus(t.projects.messages.kicadPcbExport, "success");
      })
      .catch((error) => {
        reportError(error, "export-kicad");
        setStatus(t.projects.messages.kicadError, "error");
      });
  }, [mountingHoles, outputModel, projectName, setStatus, t.projects.messages]);

  const handleExportStl = React.useCallback(
    (thicknessMm: number, fileName?: string) => {
      if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) {
        return;
      }

      Promise.all([
        import("@lib/exportStl"),
        loadTextFonts(collectTextFontIds(outputModel.elements)),
      ])
        .then(([{ buildPanelStlWithWarnings }]) => {
          const { stl, warnings } = buildPanelStlWithWarnings(outputModel, mountingHoles, {
            thicknessMm,
          });
          const blob = new Blob([stl], { type: "model/stl" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const baseNameInput = (fileName || projectName || "panel").trim();
          const baseName = baseNameInput
            .replace(/\.stl$/i, "")
            .replace(/[<>:"/\\|?*]|\p{Cc}/gu, "")
            .trim()
            .replace(/\s+/g, "-");
          link.download = `${baseName || "panel"}.stl`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setStatus(
            warnings.length
              ? t.projects.messages.stlExportWithWarnings(warnings.length)
              : t.projects.messages.stlExport,
            "success",
          );
        })
        .catch((error) => {
          console.error("Failed to export STL", error);
          reportError(error, "export-stl");
          setStatus(t.projects.messages.stlError, "error");
        });
    },
    [mountingHoles, outputModel, projectName, setStatus, t.projects.messages],
  );

  const setExportFormat = React.useCallback((format: ExportFormat) => {
    setExportFormatState(format);
    setPreferredExportFormat(format);
  }, []);

  const handleDeleteProject = React.useCallback(
    (name: string) => {
      const match = projects.find((project) => project.name.toLowerCase() === name.toLowerCase());
      setLastDeletedProject(match ?? null);
      const next = deleteProject(name);
      setProjects(next);
      if (activeProjectName && activeProjectName.toLowerCase() === name.toLowerCase()) {
        setActiveProjectName(null);
      }
      if (selectedSavedName && selectedSavedName.toLowerCase() === name.toLowerCase()) {
        setSelectedSavedName("");
      }
      setStatus(t.projects.messages.deleteSuccess(name), "success");
    },
    [activeProjectName, projects, selectedSavedName, setStatus, t.projects.messages],
  );

  const handleUndoDeleteProject = React.useCallback(() => {
    if (!lastDeletedProject) {
      return false;
    }
    const restoredModel = deserializePanelModel(lastDeletedProject.payload);
    const restoredSnapshot = serializePanelModel(restoredModel);
    const saved = trySaveProject(lastDeletedProject.name, restoredModel);
    if (!saved) {
      return false;
    }
    markSavedState(lastDeletedProject.name, restoredSnapshot);
    setProjects(saved);
    setLastDeletedProject(null);
    setSelectedSavedName(lastDeletedProject.name);
    setStatus(t.projects.messages.deleteUndoSuccess(lastDeletedProject.name), "success");
    return true;
  }, [lastDeletedProject, markSavedState, setStatus, t.projects.messages, trySaveProject]);

  const handleReset = React.useCallback(() => {
    const resetModel = {
      dimensions: createPanelDimensions(10),
      elements: [],
      options: { ...DEFAULT_PANEL_OPTIONS },
      mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
      elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
      clearance: { ...DEFAULT_CLEARANCE_CONFIG },
      panelColor: DEFAULT_PANEL_COLOR,
      designColor: DEFAULT_DESIGN_COLOR,
      designRelief: { ...DEFAULT_DESIGN_RELIEF },
      format: { ...DEFAULT_PANEL_FORMAT },
    };
    setModel(resetModel);
    clearHistory();
    setPlacementType(null);
    clearSelection();
    setProjectName(t.projects.defaultName);
    markSavedState(t.projects.defaultName, serializePanelModel(resetModel));
    setLastDeletedProject(null);
    setStatus(t.projects.messages.reset, "info");
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
    t.projects.messages.reset,
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
    handleReset,
  };
}
