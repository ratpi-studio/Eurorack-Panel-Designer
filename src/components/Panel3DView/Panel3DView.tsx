import React from "react";

import { hud as hudStyle } from "@components/PanelCanvas/PanelCanvas.css";
import { useI18n } from "@i18n/I18nContext";
import { collectTextFontIds } from "@lib/designLayer";
import { createPanelExtrusion } from "@lib/exportStl";
import { reportDegradation } from "@lib/monitoring";
import { type MountingHole, type PanelModel } from "@lib/panelTypes";
import { getTextFontsVersion, loadTextFonts, subscribeTextFonts } from "@lib/text/textFontLoader";
import { createPanelViewer, type PanelViewer } from "@lib/view3d/panelViewer";

import * as styles from "./Panel3DView.css";

interface Panel3DViewProps {
  model: PanelModel;
  mountingHoles: MountingHole[];
  thicknessMm: number;
  /** Changing this value frames the whole panel again. */
  resetKey?: number;
  /** Shows the thickness and how to move the camera. */
  showHud?: boolean;
}

/** The panel as exported to STL, kept in sync with the model while the camera stays put. */
export function Panel3DView({
  model,
  mountingHoles,
  thicknessMm,
  resetKey = 0,
  showHud = false,
}: Panel3DViewProps) {
  const t = useI18n();
  const [viewer, setViewer] = React.useState<PanelViewer | null>(null);
  const [isUnavailable, setIsUnavailable] = React.useState(false);

  // The viewer lives as long as its canvas: React calls the returned cleanup on unmount.
  const canvasRef = React.useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      return undefined;
    }
    let created: PanelViewer;
    try {
      created = createPanelViewer(canvas);
    } catch (error) {
      reportDegradation(error, "3d-view", "webgl-context");
      setIsUnavailable(true);
      return undefined;
    }
    setViewer(created);
    return () => {
      created.dispose();
      setViewer((current) => (current === created ? null : current));
    };
  }, []);

  const { panelColor, designColor } = model;
  React.useEffect(() => {
    viewer?.setColors(panelColor, designColor);
  }, [viewer, panelColor, designColor]);

  const { widthMm, heightMm } = model.dimensions;
  React.useEffect(() => {
    viewer?.setPanelSize({ x: widthMm, y: heightMm, z: thicknessMm });
  }, [viewer, widthMm, heightMm, thicknessMm]);

  React.useEffect(() => {
    viewer?.frame();
  }, [viewer, resetKey]);

  const buildGeometry = React.useEffectEvent(() => {
    try {
      return createPanelExtrusion(model, mountingHoles, thicknessMm);
    } catch (error) {
      reportDegradation(error, "3d-view", "geometry");
      return null;
    }
  });

  // Colors and display options do not change the geometry, so they do not rebuild it.
  const { dimensions, elements } = model;
  const { thicknessMm: reliefThicknessMm, penetrationMm: reliefPenetrationMm } = model.designRelief;
  // Texts join the model once their font has loaded.
  const fontsVersion = React.useSyncExternalStore(subscribeTextFonts, getTextFontsVersion);
  React.useEffect(() => {
    void loadTextFonts(collectTextFontIds(elements));
  }, [elements]);
  React.useEffect(() => {
    viewer?.scheduleGeometry(() => buildGeometry());
  }, [
    viewer,
    dimensions,
    elements,
    reliefThicknessMm,
    reliefPenetrationMm,
    mountingHoles,
    thicknessMm,
    fontsVersion,
  ]);

  return (
    <div className={styles.root} translate="no">
      <canvas ref={canvasRef} className={styles.canvas} aria-label={t.view3d.canvasLabel} />
      <div className={styles.message} hidden={!isUnavailable}>
        {t.view3d.unavailable}
      </div>
      {showHud ? (
        <div className={hudStyle} hidden={isUnavailable}>
          {t.view3d.hud(thicknessMm)}
        </div>
      ) : null}
    </div>
  );
}
