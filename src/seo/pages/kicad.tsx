import type { ReactNode } from "react";
import type { Column } from "@salnika/uipirate";

import { DataTable } from "../components/DataTable";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { PAGE_PATHS } from "../paths";
import type { ContentPage } from "../types";

interface ExportRow {
  name: string;
  holds: ReactNode;
  open: ReactNode;
}

const EXPORTS: readonly ExportRow[] = [
  {
    name: "KiCad Edge SVG",
    holds: "Outline and cut-outs as SVG paths",
    open: <code>File → Import Graphics → Edge.Cuts</code>,
  },
  {
    name: "KiCad PCB",
    holds: (
      <>
        <code>gr_line</code> geometry on Edge.Cuts only
      </>
    ),
    open: "Open as a board, or copy into an existing one",
  },
];

const COLUMNS: Column<ExportRow>[] = [
  { key: "export", header: "EXPORT", variant: "id", render: (row) => row.name },
  { key: "holds", header: "WHAT IT HOLDS", variant: "text", render: (row) => row.holds },
  { key: "open", header: "HOW TO OPEN IT", variant: "text", render: (row) => row.open },
];

function Body() {
  return (
    <>
      <Section number="01" title="Which export to pick" kicker="2 FORMATS">
        <DataTable
          title="KICAD EXPORTS"
          meta="EDGE.CUTS"
          columns={COLUMNS}
          rows={[...EXPORTS]}
          rowKey={(row) => row.name}
          minWidth="lg"
        />
      </Section>

      <Section number="02" title="What the geometry looks like" kicker="EDGE.CUTS">
        <Prose>
          <ul>
            <li>
              Circular holes are approximated with 32 segments, which is under the tolerance of
              every panel fabricator&apos;s cutter.
            </li>
            <li>
              Cut-outs that overlap each other, or cross the panel edge, are merged into a single
              outline: KiCad rejects crossing Edge.Cuts lines. The merged outline is a polygon, and
              the other cut-outs keep their own shapes.
            </li>
            <li>
              The canvas, the SVG export and the STL merge them exactly the same way, so what you
              see is what the board gets.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="03" title="A panel as a PCB" kicker="FABRICATION">
        <Prose>
          <p>
            A PCB front panel is the usual alternative to aluminium or a 3D print: it comes out
            flat, it is cheap in small runs, and the silkscreen carries the legend. Draw it here,
            export Edge.Cuts, then add your own silkscreen in KiCad — the part holes are already
            placed at their <a href={PAGE_PATHS.drillSizes}>datasheet diameters</a>, and the
            mounting holes on the <a href={PAGE_PATHS.dimensions}>rail grid</a>.
          </p>
        </Prose>
      </Section>
    </>
  );
}

export const kicadPage: ContentPage = {
  path: PAGE_PATHS.kicad,
  label: "KiCad export",
  group: "reference",
  title: "Export a Eurorack panel to KiCad (Edge.Cuts)",
  description:
    "Turn a Eurorack front panel into a KiCad board outline: a minimal Edge.Cuts SVG for " +
    "Import Graphics, or a .kicad_pcb holding only Edge.Cuts geometry.",
  kicker: "GUIDE / KICAD",
  lead: (
    <>
      The editor exports either a minimal <strong>Edge.Cuts SVG</strong>, imported with{" "}
      <code>File → Import Graphics</code>, or a <strong>.kicad_pcb</strong> that contains only
      Edge.Cuts <code>gr_line</code> geometry — no copper, no silkscreen.
    </>
  ),
  facts: [
    { label: "LAYER", value: "EDGE.CUTS" },
    { label: "FILES", value: "SVG · PCB" },
    { label: "CIRCLES", value: "32", unit: "segments" },
    { label: "COPPER", value: "NONE" },
  ],
  Body,
};
