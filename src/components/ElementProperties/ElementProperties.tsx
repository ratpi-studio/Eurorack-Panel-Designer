import React from 'react';

import { enUS } from '@i18n/en_US';
import {
  PanelElementType,
  type PanelElement,
  type Vector2
} from '@lib/panelTypes';

import * as styles from './ElementProperties.css';

interface ElementPropertiesProps {
  element: PanelElement | null;
  onChangePosition: (position: Vector2) => void;
  onChangeRotation: (rotationDeg: number) => void;
  onChangeProperties: (properties: PanelElement['properties']) => void;
  onRemove: () => void;
}

function sanitizeNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ElementProperties({
  element,
  onChangePosition,
  onChangeRotation,
  onChangeProperties,
  onRemove
}: ElementPropertiesProps) {
  const t = enUS;
  const [inputs, setInputs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!element) {
      setInputs({});
      return;
    }

    const base = {
      posX: element.positionMm.x.toFixed(1),
      posY: element.positionMm.y.toFixed(1),
      rotation: (element.rotationDeg ?? 0).toString()
    };

    if (
      element.type === PanelElementType.Jack ||
      element.type === PanelElementType.Potentiometer ||
      element.type === PanelElementType.Led
    ) {
      setInputs({
        ...base,
        diameter: (element.properties as { diameterMm: number }).diameterMm.toString()
      });
      return;
    }

    if (element.type === PanelElementType.Switch) {
      setInputs({
        ...base,
        width: (element.properties as { widthMm: number }).widthMm.toString(),
        height: (element.properties as { heightMm: number }).heightMm.toString()
      });
      return;
    }

    if (element.type === PanelElementType.Label) {
      setInputs({
        ...base,
        fontSize: (element.properties as { fontSizePt: number }).fontSizePt.toString()
      });
      return;
    }

    setInputs(base);
  }, [element]);

  if (!element) {
    return (
      <div className={styles.empty}>
        {t.properties.empty}
      </div>
    );
  }

  const { positionMm, rotationDeg = 0, properties } = element;
  const isDraft = element.id === 'draft';

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    setInputs((prev) => ({
      ...prev,
      [axis === 'x' ? 'posX' : 'posY']: value
    }));
    const next = sanitizeNumber(value);
    if (next === null) {
      return;
    }
    onChangePosition({
      ...positionMm,
      [axis]: Math.max(0, next)
    });
  };

  const handleRotationChange = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      rotation: value
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
      [key]: value
    }));
    const next = sanitizeNumber(value);
    if (next === null) {
      return;
    }
    onChangeProperties({
      ...properties,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key]: Math.max(0, next) as any
    });
  };

  const handleTextChange = (value: string) => {
    if (element.type !== PanelElementType.Label) {
      return;
    }
    onChangeProperties({
      ...properties,
      text: value
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t.properties.title}</div>
          <div className={styles.subtitle}>{element.type}</div>
        </div>
        {!isDraft ? (
          <button type="button" className={styles.removeButton} onClick={onRemove}>
            {t.properties.delete}
          </button>
        ) : null}
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
            onChange={(event) => handlePositionChange('x', event.target.value)}
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
            onChange={(event) => handlePositionChange('y', event.target.value)}
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

        {element.type === PanelElementType.Jack ||
        element.type === PanelElementType.Potentiometer ||
        element.type === PanelElementType.Led ? (
          <label className={styles.field}>
            <span className={styles.label}>{t.properties.diameter}</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={0.5}
              value={inputs.diameter ?? (properties as { diameterMm: number }).diameterMm.toString()}
              onChange={(event) =>
                handlePropertyChange('diameterMm', event.target.value)
              }
            />
          </label>
        ) : null}

        {element.type === PanelElementType.Switch ? (
          <>
            <label className={styles.field}>
            <span className={styles.label}>{t.properties.width}</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={0.5}
              value={inputs.width ?? (properties as { widthMm: number }).widthMm.toString()}
              onChange={(event) =>
                handlePropertyChange('widthMm', event.target.value)
              }
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
              onChange={(event) =>
                handlePropertyChange('heightMm', event.target.value)
              }
            />
            </label>
          </>
        ) : null}

        {element.type === PanelElementType.Label ? (
          <>
            <label className={styles.fieldWide}>
              <span className={styles.label}>{t.properties.text}</span>
              <input
                className={styles.input}
                type="text"
                value={(properties as { text: string }).text}
                onChange={(event) => handleTextChange(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.properties.fontSize}</span>
              <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={
                inputs.fontSize ??
                (properties as { fontSizePt: number }).fontSizePt.toString()
              }
                onChange={(event) =>
                  handlePropertyChange('fontSizePt', event.target.value)
                }
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
}
