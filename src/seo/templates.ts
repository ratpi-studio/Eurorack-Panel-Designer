/**
 * The blank panel templates the content pages publish: a 3U Eurorack panel per width, as the
 * editor starts one, with the mounting holes it gives it. The numbers the pages print and the files
 * they link (`templateFiles.ts`) both come from here, so they cannot disagree.
 */

import { createBlankPanelModel, openWidthUrl, panelMountingHoles } from "@lib/blankPanel";
import { ORDER_PANEL_THICKNESS_MM } from "@lib/orderCatalog";
import { DEFAULT_MM_PER_HP, isPublishedPanelWidth } from "@lib/panelFormat";
import type { MountingHole, PanelModel } from "@lib/panelTypes";

import {
  TEMPLATE_FILE_EXTENSIONS,
  TEMPLATE_PAGE_WIDTHS_HP,
  TEMPLATE_WIDTHS_HP,
  templateFilePath,
  templatePagePath,
  type TemplateFileExtension,
} from "./paths";

/** Thickness of the STL templates: the one panels are printed at. */
export const TEMPLATE_THICKNESS_MM = ORDER_PANEL_THICKNESS_MM;

export interface PanelTemplate {
  widthHp: number;
  model: PanelModel;
  holes: MountingHole[];
  widthMm: number;
  heightMm: number;
  /** The width the panel takes on the rails, which it is cut a little under. */
  pitchMm: number;
  /** Whether Doepfer's table gives this width, rather than the pitch less the clearance. */
  published: boolean;
  /** Where the columns of mounting holes sit, from the left edge, in mm. */
  columnXs: number[];
  /** The page of this width, for the widths that have one. */
  pagePath: string | null;
  files: Record<TemplateFileExtension, string>;
  /** Where the editor starts from this panel. */
  editorUrl: string;
}

function buildTemplate(widthHp: number): PanelTemplate {
  const model = createBlankPanelModel(widthHp);
  const holes = panelMountingHoles(model);
  return {
    widthHp,
    model,
    holes,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm,
    pitchMm: widthHp * DEFAULT_MM_PER_HP,
    published: isPublishedPanelWidth(widthHp),
    columnXs: [...new Set(holes.map((hole) => hole.center.x))].sort((a, b) => a - b),
    pagePath: TEMPLATE_PAGE_WIDTHS_HP.includes(widthHp) ? templatePagePath(widthHp) : null,
    files: Object.fromEntries(
      TEMPLATE_FILE_EXTENSIONS.map((extension) => [
        extension,
        templateFilePath(widthHp, extension),
      ]),
    ) as Record<TemplateFileExtension, string>,
    editorUrl: openWidthUrl(widthHp),
  };
}

/** Every template, from the narrowest. */
export const PANEL_TEMPLATES: readonly PanelTemplate[] = TEMPLATE_WIDTHS_HP.map(buildTemplate);

export function getPanelTemplate(widthHp: number): PanelTemplate {
  const template = PANEL_TEMPLATES.find((candidate) => candidate.widthHp === widthHp);
  if (!template) {
    throw new Error(`No panel template is published at ${widthHp} HP.`);
  }
  return template;
}
