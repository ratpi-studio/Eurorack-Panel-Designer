import {
  getFormatSpec,
  KOSMO_WIDTH_STEP_MM,
  kosmoWidthStepsForMm,
  resolvePanelDimensions,
  widthHpForMm,
  type PanelFormat,
  type PanelSizeInput,
} from "./panelFormat";
import type { PanelDimensions, PanelModel } from "./panelTypes";

/**
 * Gives the panel new dimensions. The clearance guides are left as they are: they are clamped to
 * the panel where they are drawn, so a height typed digit by digit does not squash them for good.
 */
function withDimensions(
  model: PanelModel,
  format: PanelFormat,
  dimensions: PanelDimensions,
): PanelModel {
  return { ...model, format, dimensions };
}

/**
 * Switches the panel to another format, keeping its size where the format allows: a custom panel
 * starts from the current size, a Eurorack row keeps the width in HP, in the steps its widths come
 * in, and Kosmo the width in millimeters, to the nearest 2.5 cm. A format whose mounting holes sit
 * elsewhere than the previous one's moves them; the elements keep their position.
 */
export function setPanelFormat(model: PanelModel, format: PanelFormat): PanelModel {
  const next = withDimensions(model, format, resolvePanelDimensions(format, model.dimensions));
  if (format.custom) {
    return next;
  }

  const previousSpec = getFormatSpec(model.format);
  const nextSpec = getFormatSpec(format);
  if (
    previousSpec.holeOffsetXMm === nextSpec.holeOffsetXMm &&
    previousSpec.holeOffsetYMm === nextSpec.holeOffsetYMm
  ) {
    return next;
  }

  return {
    ...next,
    mountingHoleConfig: {
      ...next.mountingHoleConfig,
      horizontalOffsetMm: nextSpec.holeOffsetXMm,
      verticalOffsetMm: nextSpec.holeOffsetYMm,
    },
  };
}

export function setPanelWidthHp(model: PanelModel, widthHp: number): PanelModel {
  return withDimensions(
    model,
    model.format,
    resolvePanelDimensions(model.format, { widthHp, heightMm: model.dimensions.heightMm }),
  );
}

/**
 * Sets the width from millimeters. A custom panel takes it as it is; a Eurorack row takes the HP
 * that width needs, and Kosmo the steps of 2.5 cm, rounded up.
 */
export function setPanelWidthMm(model: PanelModel, widthMm: number): PanelModel {
  const size: PanelSizeInput = model.format.custom
    ? { widthMm, heightMm: model.dimensions.heightMm }
    : model.format.system === "kosmo"
      ? { widthMm: kosmoWidthStepsForMm(widthMm) * KOSMO_WIDTH_STEP_MM }
      : { widthHp: widthHpForMm(widthMm) };
  return withDimensions(model, model.format, resolvePanelDimensions(model.format, size));
}

/** Sets the height of a custom panel; Eurorack rows and Kosmo have a height of their own. */
export function setPanelHeightMm(model: PanelModel, heightMm: number): PanelModel {
  if (!model.format.custom) {
    return model;
  }

  return withDimensions(
    model,
    model.format,
    resolvePanelDimensions(model.format, { widthMm: model.dimensions.widthMm, heightMm }),
  );
}
