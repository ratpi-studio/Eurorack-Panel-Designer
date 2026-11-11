/**
 * The files of the panel templates, built by the editor's own export code: what a visitor
 * downloads is what the editor would export for the same blank panel. Only the server entry loads
 * this module, since the export builders bring `three` and `polygon-clipping` with them.
 */

import { buildKicadEdgeCutsSvg, buildKicadPcbFile } from "@lib/exportKicad";
import { buildPanelStl } from "@lib/exportStl";

import type { TemplateFileExtension } from "./paths";
import type { SiteFile } from "./siteFiles";
import { PANEL_TEMPLATES, TEMPLATE_THICKNESS_MM, type PanelTemplate } from "./templates";

const BUILDERS: Record<TemplateFileExtension, (template: PanelTemplate) => string> = {
  // The Edge.Cuts SVG is the bare outline, in millimeters: the panel and its holes, each drawn
  // once, which is what a laser cutter or a drawing program wants.
  svg: ({ model, holes }) => buildKicadEdgeCutsSvg(model, holes),
  stl: ({ model, holes }) => buildPanelStl(model, holes, { thicknessMm: TEMPLATE_THICKNESS_MM }),
  kicad_pcb: ({ model, holes }) => buildKicadPcbFile(model, holes),
};

/** Every template file, at the path the pages link it at. */
export function templateFiles(): SiteFile[] {
  return PANEL_TEMPLATES.flatMap((template) =>
    (Object.keys(BUILDERS) as TemplateFileExtension[]).map((extension) => ({
      fileName: template.files[extension].slice(1),
      source: BUILDERS[extension](template),
    })),
  );
}
