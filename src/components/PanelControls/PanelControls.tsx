import { Ruler } from "lucide-react";
import React from "react";

import { useI18n } from "@i18n/I18nContext";
import {
  CUSTOM_SIZE_MAX_MM,
  CUSTOM_SIZE_MIN_MM,
  getFormatSpec,
  KOSMO_WIDTH_STEP_MM,
  MM_PER_CM,
  ONE_U_SPECS,
  PANEL_RACK_UNITS,
  type PanelFormat,
  type PanelRackUnits,
} from "@lib/panelFormat";

import * as styles from "./PanelControls.css";

const KOSMO_WIDTH_STEP_CM = KOSMO_WIDTH_STEP_MM / MM_PER_CM;

interface PanelControlsProps {
  format: PanelFormat;
  widthMm: number;
  widthHp: number;
  heightMm: number;
  onChangeFormat: (format: PanelFormat) => void;
  onChangeWidthMm: (widthMm: number) => void;
  onChangeWidthHp: (widthHp: number) => void;
  onChangeHeightMm: (heightMm: number) => void;
}

/** What the format bar offers: a Eurorack row, or Kosmo. */
type FormatChoice = PanelRackUnits | "kosmo";

function getFormatChoice(format: PanelFormat): FormatChoice {
  return format.system === "kosmo" ? "kosmo" : format.rackUnits;
}

/** Picks a row or Kosmo, keeping the rest of the format for when it comes back. */
function withFormatChoice(format: PanelFormat, choice: FormatChoice): PanelFormat {
  return choice === "kosmo"
    ? { ...format, system: "kosmo" }
    : { ...format, system: "eurorack", rackUnits: choice };
}

/** A length in mm or cm, to two decimals at most. */
function formatLength(value: number): string {
  return String(Number(value.toFixed(2)));
}

function formatHp(value: number): string {
  return String(value);
}

interface NumberFieldProps {
  id: string;
  label: string;
  hint: string;
  value: number;
  format: (value: number) => string;
  min: number;
  step: number;
  onCommit: (value: number) => void;
}

/**
 * A number input that applies each valid value as it is typed, and shows the panel's own value
 * again once it loses focus, such as a width rounded to the HP it takes.
 */
function NumberField({ id, label, hint, value, format, min, step, onCommit }: NumberFieldProps) {
  const [draft, setDraft] = React.useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);

    const parsed = Number.parseFloat(text);
    if (Number.isFinite(parsed) && parsed > 0 && Math.abs(parsed - value) >= 0.001) {
      onCommit(parsed);
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="number"
        min={min}
        step={step}
        value={draft ?? format(value)}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
      />
      <span className={styles.hint}>{hint}</span>
    </div>
  );
}

interface SegmentedControlProps<TValue extends string | number> {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: TValue; label: string }>;
  value: TValue;
  disabled: boolean;
  onChange: (value: TValue) => void;
}

/** Radio buttons drawn as one bar of choices; the arrow keys move between them. */
function SegmentedControl<TValue extends string | number>({
  name,
  label,
  options,
  value,
  disabled,
  onChange,
}: SegmentedControlProps<TValue>) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className={styles.segment}>
          <input
            type="radio"
            className={styles.segmentInput}
            name={name}
            value={String(option.value)}
            checked={option.value === value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.segmentLabel}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function PanelControls({
  format,
  widthMm,
  widthHp,
  heightMm,
  onChangeFormat,
  onChangeWidthMm,
  onChangeWidthHp,
  onChangeHeightMm,
}: PanelControlsProps) {
  const t = useI18n();
  const spec = getFormatSpec(format);
  const formatOptions: Array<{ value: FormatChoice; label: string }> = [
    ...PANEL_RACK_UNITS.map((rackUnits) => ({
      value: rackUnits,
      label: t.controls.rackUnitsOption(rackUnits),
    })),
    { value: "kosmo", label: t.controls.kosmoOption },
  ];
  const oneUSpecOptions = ONE_U_SPECS.map((oneUSpec) => ({
    value: oneUSpec,
    label: t.controls.oneUSpecOptions[oneUSpec],
  }));
  // Kosmo widths are not counted in HP.
  const note = !format.custom
    ? t.controls.heightNote(heightMm, t.controls.formatNames[spec.key])
    : format.system === "eurorack"
      ? t.controls.customNote(widthHp)
      : null;

  return (
    <div className={styles.root}>
      <div className={styles.formatSection}>
        <div className={styles.formatHeader}>
          <span className={styles.label}>{t.controls.formatLabel}</span>
          <label className={styles.customToggle}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={format.custom}
              onChange={(event) => onChangeFormat({ ...format, custom: event.target.checked })}
            />
            {t.controls.customLabel}
          </label>
        </div>
        <SegmentedControl
          name="panel-format"
          label={t.controls.formatLabel}
          options={formatOptions}
          value={getFormatChoice(format)}
          disabled={format.custom}
          onChange={(choice) => onChangeFormat(withFormatChoice(format, choice))}
        />
        {format.system === "eurorack" && format.rackUnits === 1 ? (
          <SegmentedControl
            name="panel-one-u-spec"
            label={t.controls.oneUSpecLabel}
            options={oneUSpecOptions}
            value={format.oneUSpec}
            disabled={format.custom}
            onChange={(oneUSpec) => onChangeFormat({ ...format, oneUSpec })}
          />
        ) : null}
      </div>

      <div className={styles.fields}>
        {format.custom ? (
          <>
            <NumberField
              id="panel-width-mm"
              label={t.controls.widthMmLabel}
              hint={t.controls.customWidthMmHint}
              value={widthMm}
              format={formatLength}
              min={CUSTOM_SIZE_MIN_MM}
              step={1}
              onCommit={onChangeWidthMm}
            />
            <NumberField
              id="panel-height-mm"
              label={t.controls.heightMmLabel}
              hint={t.controls.customHeightMmHint(CUSTOM_SIZE_MIN_MM, CUSTOM_SIZE_MAX_MM)}
              value={heightMm}
              format={formatLength}
              min={CUSTOM_SIZE_MIN_MM}
              step={1}
              onCommit={onChangeHeightMm}
            />
          </>
        ) : spec.key === "kosmo" ? (
          <>
            <NumberField
              id="panel-width-cm"
              label={t.controls.widthCmLabel}
              hint={t.controls.kosmoWidthCmHint(KOSMO_WIDTH_STEP_CM)}
              value={widthMm / MM_PER_CM}
              format={formatLength}
              min={KOSMO_WIDTH_STEP_CM}
              step={KOSMO_WIDTH_STEP_CM}
              onCommit={(widthCm) => onChangeWidthMm(widthCm * MM_PER_CM)}
            />
            <NumberField
              id="panel-width-mm"
              label={t.controls.widthMmLabel}
              hint={t.controls.kosmoWidthMmHint(KOSMO_WIDTH_STEP_MM)}
              value={widthMm}
              format={formatLength}
              min={1}
              step={1}
              onCommit={onChangeWidthMm}
            />
          </>
        ) : (
          <>
            <NumberField
              id="panel-width-hp"
              label={t.controls.widthHpLabel}
              hint={
                spec.widthStepHp > 1
                  ? t.controls.tileWidthHpHint(spec.widthStepHp)
                  : t.controls.widthHpHint
              }
              value={widthHp}
              format={formatHp}
              min={spec.widthStepHp}
              step={spec.widthStepHp}
              onCommit={onChangeWidthHp}
            />
            <NumberField
              id="panel-width-mm"
              label={t.controls.widthMmLabel}
              hint={t.controls.widthMmHint}
              value={widthMm}
              format={formatLength}
              min={1}
              step={1}
              onCommit={onChangeWidthMm}
            />
          </>
        )}
      </div>

      {note ? (
        <div className={styles.notes}>
          <p className={styles.note}>
            <Ruler />
            {note}
          </p>
          {!format.custom && !spec.published ? (
            <p className={styles.hint}>{t.controls.derivedHeightNote}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
