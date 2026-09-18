import React from "react";

import { ColorPickerField, toColorInputValue } from "@components/DisplayOptions/DisplayOptions";
import { useI18n } from "@i18n/I18nContext";
import {
  DEFAULT_DESIGN_COLOR,
  PanelElementType,
  type DesignReliefConfig,
  type LabelElementProperties,
  type PanelElement,
  type SvgArtworkElementProperties,
  type TextPatternOverlap,
  type Vector2,
} from "@lib/panelTypes";
import { getSvgArtworkAspectRatio } from "@lib/svgArtwork";
import { getTextFontsVersion, loadTextFonts, subscribeTextFonts } from "@lib/text/textFontLoader";
import { TEXT_FONTS, isTextFontId } from "@lib/text/textFonts";
import {
  assessTextPrintability,
  MIN_PRINTABLE_STROKE_MM,
  MIN_PRINTABLE_TEXT_SIZE_PT,
} from "@lib/text/textLayout";

import { DesignReliefFields } from "./DesignReliefFields";
import * as styles from "./ElementProperties.css";

interface ElementPropertiesProps {
  element: PanelElement | null;
  /** Name of the element in the components list; null for an element being placed. */
  name?: string | null;
  selectionCount: number;
  /** Color of every text and SVG pattern, shared by the whole panel. */
  designColor: string;
  /** Relief of every text and SVG pattern, shared by the whole panel. */
  designRelief: DesignReliefConfig;
  onChangePosition: (position: Vector2) => void;
  onChangeRotation: (rotationDeg: number) => void;
  onChangeProperties: (properties: PanelElement["properties"]) => void;
  onChangeDesignColor: (color: string) => void;
  onChangeDesignRelief: (relief: Partial<DesignReliefConfig>) => void;
  onRemove: () => void;
}

function sanitizeNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ElementProperties({
  element,
  name = null,
  selectionCount,
  designColor,
  designRelief,
  onChangePosition,
  onChangeRotation,
  onChangeProperties,
  onChangeDesignColor,
  onChangeDesignRelief,
  onRemove,
}: ElementPropertiesProps) {
  const t = useI18n();
  const [inputs, setInputs] = React.useState<Record<string, string>>({});

  // A text's font loads on demand; its warnings (missing characters) follow once it has.
  const labelFontId = element?.type === PanelElementType.Label ? element.properties.fontId : null;
  React.useSyncExternalStore(subscribeTextFonts, getTextFontsVersion);
  React.useEffect(() => {
    if (labelFontId) {
      void loadTextFonts([labelFontId]);
    }
  }, [labelFontId]);

  React.useEffect(() => {
    if (!element) {
      setInputs({});
      return;
    }

    const base = {
      posX: element.positionMm.x.toFixed(1),
      posY: element.positionMm.y.toFixed(1),
      rotation: (element.rotationDeg ?? 0).toString(),
    };

    const isCircularElement =
      element.type === PanelElementType.Jack ||
      element.type === PanelElementType.Potentiometer ||
      element.type === PanelElementType.Led;
    if (isCircularElement) {
      setInputs({
        ...base,
        diameter: (element.properties as { diameterMm: number }).diameterMm.toString(),
      });
      return;
    }

    const isSizeElement =
      element.type === PanelElementType.Switch ||
      element.type === PanelElementType.Rectangle ||
      element.type === PanelElementType.Oval ||
      element.type === PanelElementType.Slot ||
      element.type === PanelElementType.Triangle;

    if (isSizeElement) {
      setInputs({
        ...base,
        width: (element.properties as { widthMm: number }).widthMm.toString(),
        height: (element.properties as { heightMm: number }).heightMm.toString(),
      });
      return;
    }

    if (element.type === PanelElementType.Label) {
      setInputs({
        ...base,
        fontSize: element.properties.fontSizePt.toString(),
        knockoutPadding: element.properties.knockoutPaddingMm.toString(),
      });
      return;
    }

    if (element.type === PanelElementType.Insert) {
      const props = element.properties as {
        outerDiameterMm: number;
        outerDepthMm: number;
        innerDiameterMm: number;
        innerDepthMm: number;
        embedDepthMm: number;
      };
      setInputs({
        ...base,
        outerDiameter: props.outerDiameterMm.toString(),
        outerDepth: props.outerDepthMm.toString(),
        innerDiameter: props.innerDiameterMm.toString(),
        innerDepth: props.innerDepthMm.toString(),
        embedDepth: props.embedDepthMm.toString(),
      });
      return;
    }

    if (element.type === PanelElementType.SvgArtwork) {
      const props = element.properties as SvgArtworkElementProperties;
      setInputs({
        ...base,
        width: props.widthMm.toString(),
        height: props.heightMm.toString(),
      });
      return;
    }

    setInputs(base);
  }, [element]);

  if (selectionCount > 1) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{t.properties.title}</div>
            <div className={styles.subtitle}>{t.properties.multiSelection(selectionCount)}</div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.removeButton} onClick={onRemove}>
              {t.properties.delete}
            </button>
          </div>
        </div>
        <div className={styles.selectionSummary}>{t.properties.multiSelectionHint}</div>
      </div>
    );
  }

  if (!element) {
    return <div className={styles.empty}>{t.properties.empty}</div>;
  }

  const { positionMm, rotationDeg = 0, properties } = element;
  const isDraft = element.id === "draft";

  const handlePositionChange = (axis: "x" | "y", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [axis === "x" ? "posX" : "posY"]: value,
    }));
    const next = sanitizeNumber(value);
    if (next === null) {
      return;
    }
    onChangePosition({
      ...positionMm,
      [axis]: Math.max(0, next),
    });
  };

  const handleRotationChange = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      rotation: value,
    }));
    const next = sanitizeNumber(value);
    if (next === null) {
      return;
    }
    onChangeRotation(Math.max(0, next));
  };

  const handlePropertyChange = (key: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
    const next = sanitizeNumber(value);
    if (next === null) {
      return;
    }
    onChangeProperties({
      ...properties,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key]: Math.max(0, next) as any,
    });
  };

  const handleLabelChange = (changes: Partial<LabelElementProperties>) => {
    if (element.type !== PanelElementType.Label) {
      return;
    }
    onChangeProperties({
      ...element.properties,
      ...changes,
    });
  };

  const labelProperties = element.type === PanelElementType.Label ? element.properties : null;
  const printability = labelProperties ? assessTextPrintability(labelProperties) : null;
  const textWarnings = printability
    ? [
        printability.tooSmall ? t.properties.textTooSmall(MIN_PRINTABLE_TEXT_SIZE_PT) : null,
        printability.thinStrokes
          ? t.properties.textThinStrokes(printability.strokeMm, MIN_PRINTABLE_STROKE_MM)
          : null,
        printability.missingCharacters.length
          ? t.properties.textMissingCharacters(printability.missingCharacters.join(" "))
          : null,
      ].filter((warning): warning is string => warning !== null)
    : [];

  const handleSvgSizeChange = (axis: "width" | "height", value: string) => {
    if (element?.type !== PanelElementType.SvgArtwork) {
      return;
    }
    setInputs((prev) => ({
      ...prev,
      [axis]: value,
    }));
    const next = sanitizeNumber(value);
    if (next === null) {
      return;
    }
    const props = properties as SvgArtworkElementProperties;
    const ratio = getSvgArtworkAspectRatio(props);
    const safeValue = Math.max(1, next);
    if (axis === "width") {
      onChangeProperties({
        ...props,
        widthMm: safeValue,
        heightMm: Math.max(1, safeValue / Math.max(ratio, 0.001)),
      });
      return;
    }
    onChangeProperties({
      ...props,
      heightMm: safeValue,
      widthMm: Math.max(1, safeValue * Math.max(ratio, 0.001)),
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{name ?? t.properties.title}</div>
          <div className={styles.subtitle}>
            {t.palette.items[element.type]?.label ?? element.type}
          </div>
        </div>
        <div className={styles.actions}>
          {!isDraft ? (
            <button type="button" className={styles.removeButton} onClick={onRemove}>
              {t.properties.delete}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>{t.properties.posX}</span>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={0.5}
            value={inputs.posX ?? positionMm.x.toFixed(1)}
            onChange={(event) => handlePositionChange("x", event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.properties.posY}</span>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={0.5}
            value={inputs.posY ?? positionMm.y.toFixed(1)}
            onChange={(event) => handlePositionChange("y", event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.properties.rotation}</span>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={1}
            value={inputs.rotation ?? rotationDeg.toString()}
            onChange={(event) => handleRotationChange(event.target.value)}
          />
        </label>

        {(element.type === PanelElementType.Jack ||
          element.type === PanelElementType.Potentiometer ||
          element.type === PanelElementType.Led) && (
          <label className={styles.field}>
            <span className={styles.label}>{t.properties.diameter}</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={0.5}
              value={
                inputs.diameter ?? (properties as { diameterMm: number }).diameterMm.toString()
              }
              onChange={(event) => handlePropertyChange("diameterMm", event.target.value)}
            />
          </label>
        )}

        {(element.type === PanelElementType.Switch ||
          element.type === PanelElementType.Rectangle ||
          element.type === PanelElementType.Oval ||
          element.type === PanelElementType.Slot ||
          element.type === PanelElementType.Triangle) && (
          <>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.width}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.5}
                value={inputs.width ?? (properties as { widthMm: number }).widthMm.toString()}
                onChange={(event) => handlePropertyChange("widthMm", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.height}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.5}
                value={inputs.height ?? (properties as { heightMm: number }).heightMm.toString()}
                onChange={(event) => handlePropertyChange("heightMm", event.target.value)}
              />
            </label>
          </>
        )}

        {element.type === PanelElementType.Insert ? (
          <>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.outerDiameter}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.1}
                value={
                  inputs.outerDiameter ??
                  (properties as { outerDiameterMm: number }).outerDiameterMm.toString()
                }
                onChange={(event) => handlePropertyChange("outerDiameterMm", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.outerDepth}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.1}
                value={
                  inputs.outerDepth ??
                  (properties as { outerDepthMm: number }).outerDepthMm.toString()
                }
                onChange={(event) => handlePropertyChange("outerDepthMm", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.innerDiameter}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.1}
                value={
                  inputs.innerDiameter ??
                  (properties as { innerDiameterMm: number }).innerDiameterMm.toString()
                }
                onChange={(event) => handlePropertyChange("innerDiameterMm", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.innerDepth}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.1}
                value={
                  inputs.innerDepth ??
                  (properties as { innerDepthMm: number }).innerDepthMm.toString()
                }
                onChange={(event) => handlePropertyChange("innerDepthMm", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.embedDepth}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={0.1}
                value={
                  inputs.embedDepth ??
                  (properties as { embedDepthMm: number }).embedDepthMm.toString()
                }
                onChange={(event) => handlePropertyChange("embedDepthMm", event.target.value)}
              />
            </label>
          </>
        ) : null}

        {labelProperties ? (
          <>
            <label className={styles.fieldWide}>
              <span className={styles.label}>{t.properties.text}</span>
              <input
                className={styles.input}
                type="text"
                value={labelProperties.text}
                onChange={(event) => handleLabelChange({ text: event.target.value })}
              />
            </label>
            <label className={styles.fieldWide}>
              <span className={styles.label}>{t.properties.font}</span>
              <select
                className={styles.select}
                value={labelProperties.fontId}
                onChange={(event) => {
                  if (isTextFontId(event.target.value)) {
                    handleLabelChange({ fontId: event.target.value });
                  }
                }}
              >
                {TEXT_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {t.properties.fontOptions[font.id]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.fontSize}</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={1}
                value={inputs.fontSize ?? labelProperties.fontSizePt.toString()}
                onChange={(event) => handlePropertyChange("fontSizePt", event.target.value)}
              />
            </label>
            <div className={styles.field}>
              <ColorPickerField
                label={t.properties.color}
                value={toColorInputValue(designColor, DEFAULT_DESIGN_COLOR)}
                onChange={onChangeDesignColor}
              />
            </div>
            <span className={`${styles.hint} ${styles.fieldWide}`}>
              {t.properties.textColorHint}
            </span>
            {textWarnings.length ? (
              <ul className={styles.warnings} role="status">
                {textWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            <label className={styles.fieldWide}>
              <span className={styles.label}>{t.properties.patternOverlap}</span>
              <select
                className={styles.select}
                value={labelProperties.patternOverlap}
                onChange={(event) =>
                  handleLabelChange({ patternOverlap: event.target.value as TextPatternOverlap })
                }
              >
                <option value="knockout">{t.properties.patternOverlapKnockout}</option>
                <option value="merge">{t.properties.patternOverlapMerge}</option>
              </select>
              <span className={styles.hint}>{t.properties.patternOverlapHint}</span>
            </label>
            {labelProperties.patternOverlap === "knockout" ? (
              <label className={styles.field}>
                <span className={styles.label}>{t.properties.knockoutPadding}</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  step={0.5}
                  value={inputs.knockoutPadding ?? labelProperties.knockoutPaddingMm.toString()}
                  onChange={(event) =>
                    handlePropertyChange("knockoutPaddingMm", event.target.value)
                  }
                />
              </label>
            ) : null}
            <DesignReliefFields relief={designRelief} onChange={onChangeDesignRelief} />
          </>
        ) : null}

        {element.type === PanelElementType.SvgArtwork ? (
          <>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.width}</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                step={0.5}
                value={
                  inputs.width ?? (properties as SvgArtworkElementProperties).widthMm.toString()
                }
                onChange={(event) => handleSvgSizeChange("width", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.height}</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                step={0.5}
                value={
                  inputs.height ?? (properties as SvgArtworkElementProperties).heightMm.toString()
                }
                onChange={(event) => handleSvgSizeChange("height", event.target.value)}
              />
            </label>
            <DesignReliefFields relief={designRelief} onChange={onChangeDesignRelief} />
          </>
        ) : null}
      </div>
    </div>
  );
}
