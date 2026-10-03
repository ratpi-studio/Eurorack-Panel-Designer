import React from "react";

import { getVisibleElements } from "@lib/elementVisibility";
import type { PanelElement, PanelModel, Vector2 } from "@lib/panelTypes";
import {
  applyPatternResult,
  clampPatternTool,
  computePatternResult,
  createPatternTool,
  dragPatternHandle,
  getPatternCandidateGuides,
  getPatternGuides,
  getPatternProblem,
  isAwaitingReference,
  pickPatternReference,
  type PatternGuides,
  type PatternHandleId,
  type PatternSnapContext,
  type PatternTool,
  type PatternToolKind,
} from "@lib/patternTool";
import { usePanelStore } from "@store/panelStore";

/** How the canvas snaps a reference: reach in mm at its zoom, and whether the grid applies. */
export interface PatternSnapOptions {
  thresholdMm: number;
  grid: boolean;
}

/** What the canvas needs to preview a running command and to drive its handles. */
export interface PatternCanvasBinding {
  /** The design as it would be once applied. */
  previewElements: PanelElement[];
  copyIds: ReadonlySet<string>;
  guides: PatternGuides;
  awaitingReference: boolean;
  getCandidate: (pointMm: Vector2, snap: PatternSnapOptions) => PatternGuides | null;
  pick: (pointMm: Vector2, snap: PatternSnapOptions) => void;
  dragHandle: (handle: PatternHandleId, pointMm: Vector2, snap: PatternSnapOptions) => void;
}

interface PatternCommandInput {
  panelModel: PanelModel;
  selectedElementIds: string[];
  updateModel: (updater: (model: PanelModel) => PanelModel) => void;
}

const NO_COPIES: ReadonlySet<string> = new Set();

export function usePatternCommand({
  panelModel,
  selectedElementIds,
  updateModel,
}: PatternCommandInput) {
  const setSelectedElementIds = usePanelStore((state) => state.setSelectedElementIds);
  const [tool, setTool] = React.useState<PatternTool | null>(null);

  const selection = React.useMemo(() => {
    const ids = new Set(selectedElementIds);
    return panelModel.elements.filter((element) => ids.has(element.id));
  }, [panelModel.elements, selectedElementIds]);

  // The command applies to the selection: it ends with it (reset during render, not in an effect).
  if (tool && !selection.length) {
    setTool(null);
  }

  const panelSizeMm = React.useMemo(
    () => ({ x: panelModel.dimensions.widthMm, y: panelModel.dimensions.heightMm }),
    [panelModel.dimensions.heightMm, panelModel.dimensions.widthMm],
  );
  const holeRotation = panelModel.elementHoleConfig.rotationDeg;

  // References snap to the middle of the panel and to the other visible elements.
  const snapTargets = React.useMemo(() => {
    const selected = new Set(selectedElementIds);
    return [
      { x: panelSizeMm.x / 2, y: panelSizeMm.y / 2 },
      ...getVisibleElements(panelModel.elements)
        .filter((element) => !selected.has(element.id))
        .map((element) => element.positionMm),
    ];
  }, [panelModel.elements, panelSizeMm, selectedElementIds]);

  const gridSizeMm = panelModel.options.gridSizeMm;
  const toSnapContext = React.useCallback(
    ({ thresholdMm, grid }: PatternSnapOptions): PatternSnapContext => ({
      targets: snapTargets,
      thresholdMm,
      gridSizeMm: grid ? gridSizeMm : null,
      panelSizeMm,
    }),
    [gridSizeMm, panelSizeMm, snapTargets],
  );

  const result = React.useMemo(
    () => (tool ? computePatternResult(selection, tool, holeRotation) : null),
    [holeRotation, selection, tool],
  );

  const start = React.useCallback(
    (kind: PatternToolKind) => {
      if (selection.length) {
        setTool(createPatternTool(kind));
      }
    },
    [selection.length],
  );

  const cancel = React.useCallback(() => setTool(null), []);

  const change = React.useCallback((next: PatternTool) => setTool(clampPatternTool(next)), []);

  const problem = tool ? getPatternProblem(tool, selection.length) : null;

  const apply = React.useCallback(() => {
    if (!tool || getPatternProblem(tool, selection.length)) {
      return false;
    }
    // Computed again so the copies get ids of their own, apart from the preview's.
    const applied = computePatternResult(selection, tool, holeRotation);
    updateModel((prev) => ({ ...prev, elements: applyPatternResult(prev.elements, applied) }));
    setSelectedElementIds([
      ...selection.map((element) => element.id),
      ...applied.copies.map((copy) => copy.id),
    ]);
    setTool(null);
    return true;
  }, [holeRotation, selection, setSelectedElementIds, tool, updateModel]);

  const canvas = React.useMemo<PatternCanvasBinding | null>(() => {
    if (!tool || !result) {
      return null;
    }
    return {
      previewElements: applyPatternResult(panelModel.elements, result),
      copyIds: result.copies.length ? new Set(result.copies.map((copy) => copy.id)) : NO_COPIES,
      guides: getPatternGuides(selection, tool, panelSizeMm),
      awaitingReference: isAwaitingReference(tool),
      getCandidate: (pointMm, snap) =>
        getPatternCandidateGuides(tool, pointMm, toSnapContext(snap)),
      pick: (pointMm, snap) => setTool(pickPatternReference(tool, pointMm, toSnapContext(snap))),
      dragHandle: (handle, pointMm, snap) =>
        setTool((current) =>
          current
            ? clampPatternTool(
                dragPatternHandle(selection, current, handle, pointMm, toSnapContext(snap)),
              )
            : current,
        ),
    };
  }, [panelModel.elements, panelSizeMm, result, selection, toSnapContext, tool]);

  return { tool, problem, canvas, start, change, cancel, apply };
}
