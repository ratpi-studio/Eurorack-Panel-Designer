import {
  ClipboardPaste,
  Copy,
  CopyPlus,
  FlipHorizontal2,
  Grid3x3,
  Orbit,
  Scissors,
} from "lucide-react";
import React from "react";

import { IconButton } from "@components/IconButton/IconButton";
import { useI18n } from "@i18n/I18nContext";
import { MAX_ARRAY_COPIES, MAX_ARRAY_SIDE, MAX_CIRCULAR_COUNT } from "@lib/elementTransforms";
import type { Vector2 } from "@lib/panelTypes";
import { getPatternCopyCount, type PatternTool, type PatternToolKind } from "@lib/patternTool";

import * as styles from "./SelectionTools.css";

export const PATTERN_TOOL_ICONS = {
  mirror: FlipHorizontal2,
  rectangular: Grid3x3,
  circular: Orbit,
} as const;

export interface SelectionToolsProps {
  selectionCount: number;
  canPaste: boolean;
  panelCenter: Vector2;
  /** The running mirror or pattern command, if any. */
  tool: PatternTool | null;
  /** Diameter of the circle of a circular pattern as it stands. */
  circularDiameterMm: number | null;
  problem: "reference" | "tooMany" | "nothing" | null;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onStart: (kind: PatternToolKind) => void;
  onChange: (tool: PatternTool) => void;
  onApply: () => void;
  onCancel: () => void;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  wide?: boolean;
}

/**
 * A number the canvas may change while it is shown (an arrow being dragged): it follows the
 * value, and keeps what is typed until it reads as a number.
 */
function NumberField({ label, value, onChange, step, min, max, integer, wide }: NumberFieldProps) {
  const [draft, setDraft] = React.useState(formatNumber(value));
  const [shownValue, setShownValue] = React.useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    setDraft(formatNumber(value));
  }
  const parse = (text: string) => {
    const parsed = integer ? Number.parseInt(text, 10) : Number.parseFloat(text);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
      return null;
    }
    return parsed;
  };
  return (
    <label className={wide ? styles.fieldWide : styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type="number"
        step={step}
        min={min}
        max={max}
        value={draft}
        aria-invalid={parse(draft) === null}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parse(event.target.value);
          if (parsed !== null) {
            setShownValue(parsed);
            onChange(parsed);
          }
        }}
      />
    </label>
  );
}

export function SelectionTools({
  selectionCount,
  canPaste,
  panelCenter,
  tool,
  circularDiameterMm,
  problem,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onStart,
  onChange,
  onApply,
  onCancel,
}: SelectionToolsProps) {
  const t = useI18n();
  const copy = t.selectionTools;

  const toolButton = (kind: PatternToolKind) => (
    <IconButton
      label={copy[kind]}
      icon={PATTERN_TOOL_ICONS[kind]}
      variant="ghost"
      aria-pressed={tool?.kind === kind}
      onClick={() => (tool?.kind === kind ? onCancel() : onStart(kind))}
    />
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  const copyCount = tool ? getPatternCopyCount(tool, selectionCount) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>{copy.title}</div>
        <div className={styles.actions}>
          <IconButton
            label={`${copy.copy} (${copy.copyKeys})`}
            icon={Copy}
            variant="ghost"
            onClick={onCopy}
          />
          <IconButton
            label={`${copy.cut} (${copy.cutKeys})`}
            icon={Scissors}
            variant="ghost"
            onClick={onCut}
          />
          <IconButton
            label={`${copy.paste} (${copy.pasteKeys})`}
            icon={ClipboardPaste}
            variant="ghost"
            onClick={onPaste}
            disabled={!canPaste}
          />
          <IconButton
            label={`${copy.duplicate} (${copy.duplicateKeys})`}
            icon={CopyPlus}
            variant="ghost"
            onClick={onDuplicate}
          />
          <span className={styles.separator} aria-hidden="true" />
          {toolButton("mirror")}
          {toolButton("rectangular")}
          {toolButton("circular")}
        </div>
      </div>

      {tool ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formTitle}>{copy[tool.kind]}</div>

          {tool.kind === "mirror" ? (
            <>
              <p className={styles.hintStrong}>
                {tool.lineMm ? copy.mirrorDragHint : copy.mirrorPickHint}
              </p>
              <label className={styles.fieldWide}>
                <span className={styles.label}>{copy.lineOrientation}</span>
                <select
                  className={styles.select}
                  value={tool.orientation}
                  onChange={(event) =>
                    onChange({
                      ...tool,
                      orientation: event.target.value === "horizontal" ? "horizontal" : "vertical",
                    })
                  }
                >
                  <option value="vertical">{copy.lineVertical}</option>
                  <option value="horizontal">{copy.lineHorizontal}</option>
                </select>
              </label>
              {tool.lineMm ? (
                <NumberField
                  label={tool.orientation === "vertical" ? copy.linePositionX : copy.linePositionY}
                  value={tool.orientation === "vertical" ? tool.lineMm.x : tool.lineMm.y}
                  step={0.1}
                  onChange={(value) =>
                    tool.lineMm &&
                    onChange({
                      ...tool,
                      lineMm:
                        tool.orientation === "vertical"
                          ? { ...tool.lineMm, x: value }
                          : { ...tool.lineMm, y: value },
                    })
                  }
                />
              ) : null}
              <div className={tool.lineMm ? styles.buttonCell : styles.buttonCellWide}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => onChange({ ...tool, lineMm: { ...panelCenter } })}
                >
                  {copy.middleOfPanel}
                </button>
              </div>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={tool.keepOriginal}
                  onChange={(event) => onChange({ ...tool, keepOriginal: event.target.checked })}
                />
                {copy.keepOriginal}
              </label>
            </>
          ) : null}

          {tool.kind === "rectangular" ? (
            <>
              <p className={styles.hintStrong}>{copy.rectangularHint}</p>
              <NumberField
                label={copy.columns}
                value={tool.columns}
                integer
                min={1}
                max={MAX_ARRAY_SIDE}
                step={1}
                onChange={(columns) => onChange({ ...tool, columns })}
              />
              <NumberField
                label={copy.rows}
                value={tool.rows}
                integer
                min={1}
                max={MAX_ARRAY_SIDE}
                step={1}
                onChange={(rows) => onChange({ ...tool, rows })}
              />
              <NumberField
                label={copy.spacingX}
                value={tool.spacingMm.x}
                step={0.01}
                onChange={(x) => onChange({ ...tool, spacingMm: { ...tool.spacingMm, x } })}
              />
              <NumberField
                label={copy.spacingY}
                value={tool.spacingMm.y}
                step={0.01}
                onChange={(y) => onChange({ ...tool, spacingMm: { ...tool.spacingMm, y } })}
              />
            </>
          ) : null}

          {tool.kind === "circular" ? (
            <>
              <p className={styles.hintStrong}>
                {tool.centerMm ? copy.circularDragHint : copy.circularPickHint}
              </p>
              {tool.centerMm ? (
                <>
                  <NumberField
                    label={copy.centerX}
                    value={tool.centerMm.x}
                    step={0.1}
                    onChange={(x) =>
                      tool.centerMm && onChange({ ...tool, centerMm: { ...tool.centerMm, x } })
                    }
                  />
                  <NumberField
                    label={copy.centerY}
                    value={tool.centerMm.y}
                    step={0.1}
                    onChange={(y) =>
                      tool.centerMm && onChange({ ...tool, centerMm: { ...tool.centerMm, y } })
                    }
                  />
                </>
              ) : null}
              <div className={styles.buttonCellWide}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => onChange({ ...tool, centerMm: { ...panelCenter } })}
                >
                  {copy.middleOfPanel}
                </button>
              </div>
              <NumberField
                label={copy.count}
                value={tool.count}
                integer
                min={2}
                max={MAX_CIRCULAR_COUNT}
                step={1}
                onChange={(count) => onChange({ ...tool, count })}
              />
              <NumberField
                label={copy.sweep}
                value={tool.sweepDeg}
                min={-360}
                max={360}
                step={5}
                onChange={(sweepDeg) => {
                  if (sweepDeg !== 0) {
                    onChange({ ...tool, sweepDeg });
                  }
                }}
              />
              {tool.centerMm && circularDiameterMm !== null ? (
                <NumberField
                  label={copy.diameter}
                  value={circularDiameterMm}
                  min={0}
                  step={0.5}
                  wide
                  onChange={(diameterMm) => onChange({ ...tool, diameterMm })}
                />
              ) : null}
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={tool.rotateCopies}
                  onChange={(event) => onChange({ ...tool, rotateCopies: event.target.checked })}
                />
                {copy.rotateCopies}
              </label>
            </>
          ) : null}

          {problem === "tooMany" ? (
            <p className={styles.warning}>{copy.tooMany(MAX_ARRAY_COPIES)}</p>
          ) : null}
          <div className={styles.footer}>
            <span className={styles.count}>
              {problem === "reference" ? null : copy.copyCount(copyCount)}
            </span>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              {copy.cancel}
            </button>
            <button type="submit" className={styles.applyButton} disabled={problem !== null}>
              {copy.apply}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
