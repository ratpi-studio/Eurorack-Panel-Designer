import type { Column } from "@salnika/uipirate";

import { DEFAULT_MM_PER_HP, PANEL_WIDTH_CLEARANCE_MM } from "@lib/panelFormat";
import type { MountingHole } from "@lib/panelTypes";
import { mmToInches } from "@lib/rackCalculator";

import { DataTable } from "../components/DataTable";
import { Faq } from "../components/Faq";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { TemplateFigure } from "../components/TemplateFigure";
import { PAGE_PATHS, TEMPLATE_MAX_HP, TEMPLATE_PAGE_WIDTHS_HP, templatePagePath } from "../paths";
import { getPanelTemplate, TEMPLATE_THICKNESS_MM, type PanelTemplate } from "../templates";
import type { ContentPage, FaqEntry } from "../types";
import { aWidthHp, mm } from "./shared";

interface DimensionRow {
  name: string;
  value: string;
  note: string;
}

const DIMENSION_COLUMNS: Column<DimensionRow>[] = [
  { key: "name", header: "DIMENSION", variant: "id", render: (row) => row.name },
  { key: "value", header: "VALUE", variant: "value", render: (row) => row.value },
  { key: "note", header: "WHERE IT COMES FROM", variant: "text", render: (row) => row.note },
];

const HOLE_COLUMNS: Column<MountingHole>[] = [
  {
    key: "x",
    header: "FROM THE LEFT EDGE (MM)",
    variant: "value",
    render: (hole) => mm(hole.center.x),
  },
  {
    key: "y",
    header: "FROM THE TOP EDGE (MM)",
    variant: "value",
    render: (hole) => mm(hole.center.y),
  },
  { key: "d", header: "DIAMETER (MM)", variant: "value", render: (hole) => mm(hole.diameterMm) },
];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** How the columns of mounting holes are laid out on this width, in a sentence. */
function describeColumns({ widthHp, widthMm, columnXs, model }: PanelTemplate): string {
  const { horizontalOffsetMm, spacingHp } = model.mountingHoleConfig;
  const first = columnXs[0];
  const last = columnXs[columnXs.length - 1];

  if (columnXs.length === 1) {
    return first === horizontalOffsetMm
      ? `It takes one column of mounting holes, ${mm(first)} mm from the left edge: at ${widthHp} HP there is no room for a second one on the rail grid.`
      : `It takes one column of mounting holes down its middle, ${mm(first)} mm from each edge: the panel is narrower than the ${horizontalOffsetMm} mm the first column usually sits at.`;
  }

  const spanHp = Math.round((last - first) / DEFAULT_MM_PER_HP);
  const between = columnXs.length > 2 ? `, with one every ${spacingHp} HP in between` : "";
  return `Its mounting holes sit in ${columnXs.length} columns: the first ${mm(first)} mm from the left edge and the last ${spanHp} HP further along the rails, ${mm(widthMm - last)} mm from the right edge${between}.`;
}

function widthFaq(template: PanelTemplate): FaqEntry[] {
  const { widthHp, widthMm, pitchMm, published, holes, columnXs, model } = template;
  const { verticalOffsetMm, diameterMm } = model.mountingHoleConfig;
  const source = published
    ? "It is the width Doepfer publishes for this size."
    : `Doepfer's table leaves this size out, so it is the pitch less ${PANEL_WIDTH_CLEARANCE_MM} mm.`;

  return [
    {
      question: `How wide is ${aWidthHp(widthHp)} Eurorack panel in mm?`,
      answer: `${mm(widthMm)} mm. ${widthHp} HP takes ${mm(pitchMm)} mm on the rails, and the panel is cut ${mm(pitchMm - widthMm)} mm under that so it does not bind against its neighbours. ${source}`,
    },
    {
      question: `How many mounting holes does ${aWidthHp(widthHp)} panel have?`,
      answer: `${holes.length}, in ${plural(columnXs.length, "column")} of two: one hole ${verticalOffsetMm} mm from the top edge and one ${verticalOffsetMm} mm from the bottom, ${diameterMm} mm across for M3 screws.`,
    },
  ];
}

/** The page of one template width: its drawing, its files, its numbers and its holes. */
export function templateWidthPage(widthHp: number): ContentPage {
  const template = getPanelTemplate(widthHp);
  const { widthMm, heightMm, pitchMm, published, holes, columnXs, model } = template;
  const { diameterMm, verticalOffsetMm } = model.mountingHoleConfig;
  const faq = widthFaq(template);
  const columns = describeColumns(template);
  const index = TEMPLATE_PAGE_WIDTHS_HP.indexOf(widthHp);
  const narrower = TEMPLATE_PAGE_WIDTHS_HP[index - 1];
  const wider = TEMPLATE_PAGE_WIDTHS_HP[index + 1];

  const dimensions: DimensionRow[] = [
    { name: "Rack space", value: `${widthHp} HP`, note: "The width the panel takes on the rails" },
    {
      name: "Rail pitch",
      value: `${mm(pitchMm)} mm`,
      note: `${widthHp} × ${DEFAULT_MM_PER_HP} mm`,
    },
    {
      name: "Panel width",
      value: `${mm(widthMm)} mm`,
      note: published
        ? "Doepfer A-100 construction details, table 1"
        : `The pitch less ${PANEL_WIDTH_CLEARANCE_MM} mm: Doepfer's table leaves ${widthHp} HP out`,
    },
    {
      name: "Panel width, in inches",
      value: `${mmToInches(widthMm).toFixed(3)} in`,
      note: "The same width, at 25.4 mm to the inch",
    },
    { name: "Panel height", value: `${mm(heightMm)} mm`, note: "3U, less the lips of the rails" },
    {
      name: "Mounting holes",
      value: `${holes.length} × Ø ${mm(diameterMm)} mm`,
      note: "Clearance for M3 screws",
    },
    {
      name: "STL thickness",
      value: `${mm(TEMPLATE_THICKNESS_MM)} mm`,
      note: "Change it by exporting from the editor",
    },
  ];

  function Body() {
    return (
      <>
        <Section number="01" title="Template" kicker={`${widthHp} HP · 3U`}>
          <TemplateFigure template={template} />
        </Section>

        <Section number="02" title="Dimensions" kicker="MM · HP">
          <DataTable
            title={`${widthHp} HP BLANK PANEL`}
            meta="3U EURORACK"
            columns={DIMENSION_COLUMNS}
            rows={dimensions}
            rowKey={(row) => row.name}
            minWidth="md"
          />
        </Section>

        <Section
          number="03"
          title="Mounting holes"
          kicker={plural(columnXs.length, "COLUMN").toUpperCase()}
        >
          <Prose>
            <p>
              {columns} Each column has a hole {verticalOffsetMm} mm from the top edge and one{" "}
              {verticalOffsetMm} mm from the bottom. The{" "}
              <a href={PAGE_PATHS.dimensions}>panel dimensions</a> page explains the grid.
            </p>
          </Prose>
          <DataTable
            title="HOLE CENTRES"
            meta={`${holes.length} HOLES`}
            columns={HOLE_COLUMNS}
            rows={holes}
            rowKey={(hole) => `${hole.center.x}-${hole.center.y}`}
            note="Measured from the top left corner of the panel, seen from the front."
          />
        </Section>

        <Section number="04" title="Using the files" kicker="SVG · STL · KICAD">
          <Prose>
            <ul>
              <li>
                <strong>SVG</strong>: the outline and the holes in millimeters, as hairlines. Open
                it at 1:1 to lay out a panel in a drawing program, or to laser cut the blank.
              </li>
              <li>
                <strong>STL</strong>: the blank, {TEMPLATE_THICKNESS_MM} mm thick. Print it flat,
                front face on the bed, as the <a href={PAGE_PATHS.printing}>3D printing guide</a>{" "}
                describes.
              </li>
              <li>
                <strong>KiCad</strong>: a <code>.kicad_pcb</code> with the outline and the holes on
                Edge.Cuts, to order the blank as a PCB; see the{" "}
                <a href={PAGE_PATHS.kicad}>KiCad guide</a>.
              </li>
            </ul>
            <p>
              To turn the blank into a module panel, open it in the editor: parts drop in at the{" "}
              <a href={PAGE_PATHS.drillSizes}>hole their datasheet calls for</a>, and the same three
              files come out with them.
            </p>
          </Prose>
        </Section>

        <Section number="05" title="Questions" kicker="FAQ">
          <Faq entries={faq} />
        </Section>

        <Section number="06" title="Other widths" kicker={`1–${TEMPLATE_MAX_HP} HP`}>
          <Prose>
            <p>
              {narrower ? (
                <>
                  Narrower: <a href={templatePagePath(narrower)}>{narrower} HP blank panel</a>.{" "}
                </>
              ) : null}
              {wider ? (
                <>
                  Wider: <a href={templatePagePath(wider)}>{wider} HP blank panel</a>.{" "}
                </>
              ) : null}
              Every width from 1 to {TEMPLATE_MAX_HP} HP is on the{" "}
              <a href={PAGE_PATHS.templates}>panel templates</a> page, and the{" "}
              <a href={PAGE_PATHS.hpToMm}>HP to mm table</a> gives their sizes side by side.
            </p>
          </Prose>
        </Section>
      </>
    );
  }

  return {
    path: templatePagePath(widthHp),
    label: `${widthHp} HP blank panel`,
    group: "templates",
    parent: { path: PAGE_PATHS.templates, label: "Panel templates" },
    title: `${widthHp} HP Eurorack blank panel: template, SVG and STL`,
    heading: `${widthHp} HP Eurorack blank panel template`,
    description:
      `${capitalize(aWidthHp(widthHp))} Eurorack blank panel is ${mm(widthMm)} × ${mm(heightMm)} mm, with ` +
      `${plural(holes.length, "mounting hole")}. Free template: SVG outline, STL to 3D print, ` +
      "KiCad Edge.Cuts.",
    kicker: `TEMPLATE / ${widthHp} HP`,
    lead: (
      <>
        {capitalize(aWidthHp(widthHp))} Eurorack blank panel is{" "}
        <strong>
          {mm(widthMm)} × {mm(heightMm)} mm
        </strong>
        , with {plural(holes.length, "mounting hole")}. Download it as an SVG outline, an STL or a
        KiCad board outline, or open it in the editor to add your parts.
      </>
    ),
    facts: [
      { label: "PANEL WIDTH", value: mm(widthMm), unit: "mm" },
      { label: "HEIGHT", value: mm(heightMm), unit: "mm" },
      { label: "RAIL PITCH", value: mm(pitchMm), unit: "mm" },
      { label: "MOUNTING HOLES", value: `${holes.length} × Ø ${mm(diameterMm)}`, unit: "mm" },
    ],
    faq,
    Body,
  };
}
