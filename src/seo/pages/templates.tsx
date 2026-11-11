import type { Column } from "@salnika/uipirate";

import { DEFAULT_MM_PER_HP, PANEL_WIDTH_CLEARANCE_MM, THREE_U_HEIGHT_MM } from "@lib/panelFormat";
import { DEFAULT_MOUNTING_HOLE_CONFIG } from "@lib/panelTypes";

import { DataTable } from "../components/DataTable";
import { Faq } from "../components/Faq";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { PAGE_PATHS, TEMPLATE_MAX_HP } from "../paths";
import { REPO_URL } from "../site";
import { getPanelTemplate, PANEL_TEMPLATES, TEMPLATE_THICKNESS_MM } from "../templates";
import type { PanelTemplate } from "../templates";
import type { ContentPage, FaqEntry } from "../types";
import { DOEPFER_URL, mm } from "./shared";

const holes = DEFAULT_MOUNTING_HOLE_CONFIG;
const fourHp = getPanelTemplate(4);
const eightHp = getPanelTemplate(8);

const COLUMNS: Column<PanelTemplate>[] = [
  {
    key: "width",
    header: "WIDTH",
    variant: "id",
    render: ({ widthHp, pagePath }) =>
      pagePath ? <a href={pagePath}>{widthHp} HP</a> : `${widthHp} HP`,
  },
  { key: "panel", header: "PANEL (MM)", variant: "value", render: (row) => mm(row.widthMm) },
  { key: "holes", header: "HOLES", variant: "value", render: (row) => row.holes.length },
  {
    key: "files",
    header: "DOWNLOAD",
    variant: "text",
    render: ({ widthHp, files }) => (
      <>
        <a href={files.svg} download aria-label={`${widthHp} HP blank panel, SVG outline`}>
          SVG
        </a>
        {" · "}
        <a href={files.stl} download aria-label={`${widthHp} HP blank panel, STL`}>
          STL
        </a>
        {" · "}
        <a href={files.kicad_pcb} download aria-label={`${widthHp} HP blank panel, KiCad board`}>
          KiCad
        </a>
      </>
    ),
  },
  {
    key: "editor",
    header: "EDITOR",
    variant: "text",
    render: ({ widthHp, editorUrl }) => (
      <a href={editorUrl} aria-label={`Open a blank ${widthHp} HP panel in the editor`}>
        Open
      </a>
    ),
  },
];

const FAQ: FaqEntry[] = [
  {
    question: "Are the templates free?",
    answer:
      "Yes, for personal use: download them, change them, and cut or print your own panels. Like every file the editor exports, the templates and the panels made from them may not be sold; the terms of use have the details.",
  },
  {
    question: "What size is a Eurorack blank panel?",
    answer: `${mm(THREE_U_HEIGHT_MM)} mm high, and a little narrower than its width in HP times ${DEFAULT_MM_PER_HP} mm: a 4 HP blank is ${mm(fourHp.widthMm)} mm wide and an 8 HP blank ${mm(eightHp.widthMm)} mm, the widths Doepfer publishes.`,
  },
  {
    question: "How thick should a 3D printed blank panel be?",
    answer: `${TEMPLATE_THICKNESS_MM} mm, the thickness of the STL templates: rigid enough for a 3U panel up to about 20 HP. Above 30 HP, 2.5 to 3 mm holds better: open the template in the editor and export the STL at that thickness.`,
  },
  {
    question: "Where do the mounting holes of a Eurorack panel go?",
    answer: `${holes.verticalOffsetMm} mm from the top and the bottom edges, in columns that follow the threads of the rails: the first ${holes.horizontalOffsetMm} mm from the left edge, the others a whole number of HP from it. The templates drill them ${holes.diameterMm} mm across, for M3 screws.`,
  },
];

function Body() {
  return (
    <>
      <Section
        number="01"
        title={`Blank panels, 1 to ${TEMPLATE_MAX_HP} HP`}
        kicker="TABLE / 3U EURORACK"
      >
        <DataTable
          title={`BLANK PANEL TEMPLATES · 1–${TEMPLATE_MAX_HP} HP`}
          meta={`${PANEL_TEMPLATES.length} WIDTHS`}
          columns={COLUMNS}
          rows={[...PANEL_TEMPLATES]}
          rowKey={(row) => String(row.widthHp)}
          minWidth="md"
          note={`Every panel is ${mm(THREE_U_HEIGHT_MM)} mm high. Holes are ${mm(holes.diameterMm)} mm across; the STL is ${TEMPLATE_THICKNESS_MM} mm thick.`}
        />
      </Section>

      <Section number="02" title="What is in each file" kicker="SVG · STL · KICAD">
        <Prose>
          <ul>
            <li>
              <strong>SVG</strong>: the outline of the panel and its mounting holes, in millimeters,
              as hairlines with no fill. Open it at 1:1 in Inkscape, Illustrator or a laser
              cutter&apos;s software, and draw your own layout on a layer above it.
            </li>
            <li>
              <strong>STL</strong>: the same panel, {TEMPLATE_THICKNESS_MM} mm thick, ready to
              slice. Print it flat, front face on the bed; the{" "}
              <a href={PAGE_PATHS.printing}>3D printing guide</a> covers thickness and tolerances.
            </li>
            <li>
              <strong>KiCad</strong>: a <code>.kicad_pcb</code> holding the outline and the holes on
              Edge.Cuts, and nothing else. Open it as a board to make the panel as a PCB; see the{" "}
              <a href={PAGE_PATHS.kicad}>KiCad guide</a>.
            </li>
          </ul>
          <p>
            All three are written by the editor&apos;s own export code, so a template is exactly
            what the editor exports for a blank panel of that width.
          </p>
        </Prose>
      </Section>

      <Section number="03" title="The sizes behind the templates" kicker="DOEPFER A-100">
        <Prose>
          <p>
            A 3U Eurorack panel is {mm(THREE_U_HEIGHT_MM)} mm high. Its width is counted in HP, 1 HP
            being {DEFAULT_MM_PER_HP} mm of rail, but it is cut a few tenths of a millimeter under
            that so two panels screwed side by side do not bind: {mm(eightHp.widthMm)} mm for 8 HP,
            not {mm(eightHp.pitchMm)} mm. The templates use the widths Doepfer publishes, and take{" "}
            {PANEL_WIDTH_CLEARANCE_MM} mm off the pitch for the widths its table leaves out. The{" "}
            <a href={PAGE_PATHS.hpToMm}>HP to mm table</a> lists them all.
          </p>
          <p>
            Mounting holes sit {holes.verticalOffsetMm} mm from the top and the bottom. The first
            column is {holes.horizontalOffsetMm} mm from the left edge and the others a whole number
            of HP from it, so every screw meets a thread of the rail; panels wider than{" "}
            {holes.spacingHp} HP get a column every {holes.spacingHp} HP. The{" "}
            <a href={PAGE_PATHS.dimensions}>panel dimensions</a> page has the drawing.
          </p>
        </Prose>
      </Section>

      <Section number="04" title="From a blank to a module panel" kicker="EDITOR">
        <Prose>
          <p>
            <strong>Open</strong> starts the editor on a blank panel of that width. From there, drop
            jacks, potentiometers, switches and LEDs at the{" "}
            <a href={PAGE_PATHS.drillSizes}>hole their datasheet calls for</a>, add text and
            patterns, and export the same three formats, or a PNG. Other heights are a click away
            there: 1U Intellijel and Pulp Logic, 2U, 4U, Kosmo, or any size in millimeters. The{" "}
            <a href={PAGE_PATHS.hpCalculator}>HP and U calculator</a> tells which width a circuit
            board needs.
          </p>
        </Prose>
      </Section>

      <Section number="05" title="Questions" kicker="FAQ">
        <Faq entries={FAQ} />
      </Section>

      <Section number="06" title="Sources" kicker="REFERENCES">
        <Prose small>
          <p>
            Widths, height and hole positions come from the{" "}
            <a href={DOEPFER_URL}>Doepfer A-100 construction details</a>. The files are built by{" "}
            <a href={`${REPO_URL}/blob/master/src/lib/exportKicad.ts`}>
              <code>exportKicad.ts</code>
            </a>{" "}
            and{" "}
            <a href={`${REPO_URL}/blob/master/src/lib/exportStl.ts`}>
              <code>exportStl.ts</code>
            </a>
            , the code behind the editor&apos;s exports.
          </p>
        </Prose>
      </Section>
    </>
  );
}

export const templatesPage: ContentPage = {
  path: PAGE_PATHS.templates,
  label: "Panel templates",
  group: "tools",
  title: "Eurorack blank panel templates: free SVG, STL and KiCad",
  heading: "Eurorack blank panel templates",
  description:
    `Free Eurorack blank panel templates from 1 to ${TEMPLATE_MAX_HP} HP: SVG outline, STL to 3D ` +
    "print and KiCad Edge.Cuts, at the widths Doepfer publishes, holes on the rail grid.",
  kicker: "TEMPLATES / SVG · STL · KICAD",
  lead: (
    <>
      A blank 3U Eurorack panel for every width from <strong>1 to {TEMPLATE_MAX_HP} HP</strong>, to
      download as an SVG outline, an STL or a KiCad board outline, or to open in the editor. Each is{" "}
      {mm(THREE_U_HEIGHT_MM)} mm high, cut at the width Doepfer publishes, with its mounting holes
      on the grid of the rails.
    </>
  ),
  facts: [
    { label: "WIDTHS", value: `1–${TEMPLATE_MAX_HP}`, unit: "HP" },
    { label: "HEIGHT", value: mm(THREE_U_HEIGHT_MM), unit: "mm" },
    { label: "STL THICKNESS", value: mm(TEMPLATE_THICKNESS_MM), unit: "mm" },
    { label: "FILES", value: "SVG · STL · KICAD" },
  ],
  faq: FAQ,
  Body,
};
