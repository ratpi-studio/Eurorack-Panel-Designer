import type { Column } from "@salnika/uipirate";

import {
  DEFAULT_MM_PER_HP,
  getRackFormatSpec,
  KOSMO_FORMAT_SPEC,
  KOSMO_RAIL_ALLOWANCE_MM,
  MM_PER_CM,
  panelWidthMmForKosmoSteps,
  RACK_UNIT_MM,
  THREE_U_HEIGHT_MM,
  type FormatSpec,
} from "@lib/panelFormat";
import { DEFAULT_MOUNTING_HOLE_CONFIG } from "@lib/panelTypes";

import { DataTable } from "../components/DataTable";
import { Faq } from "../components/Faq";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { REPO_URL } from "../site";
import { PAGE_PATHS } from "../paths";
import type { ContentPage, FaqEntry } from "../types";
import {
  DOEPFER_URL,
  INTELLIJEL_URL,
  KOSMO_SPEC_URL,
  KOSMO_URL,
  mm,
  PULP_LOGIC_URL,
} from "./shared";

interface FormatRow {
  spec: FormatSpec;
  name: string;
  source: string;
}

const intellijel1u = getRackFormatSpec({ rackUnits: 1, oneUSpec: "intellijel" });
const pulpLogic1u = getRackFormatSpec({ rackUnits: 1, oneUSpec: "pulpLogic" });
const kosmo = KOSMO_FORMAT_SPEC;

const FORMATS: readonly FormatRow[] = [
  {
    spec: intellijel1u,
    name: "1U Intellijel",
    source: "Intellijel 1U technical specifications",
  },
  {
    spec: pulpLogic1u,
    name: "1U Pulp Logic tile",
    source: "Pulp Logic 1U tiles",
  },
  {
    spec: getRackFormatSpec({ rackUnits: 2, oneUSpec: "intellijel" }),
    name: "2U row",
    source: "Derived from the rack unit",
  },
  {
    spec: getRackFormatSpec({ rackUnits: 3, oneUSpec: "intellijel" }),
    name: "3U Eurorack",
    source: "Doepfer A-100 construction details",
  },
  {
    spec: getRackFormatSpec({ rackUnits: 4, oneUSpec: "intellijel" }),
    name: "4U row",
    source: "Derived from the rack unit",
  },
  {
    spec: kosmo,
    name: "Kosmo",
    source: "Look Mum No Computer, and the Kosmo community",
  },
];

const holes = DEFAULT_MOUNTING_HOLE_CONFIG;
const railLipsMm = 3 * RACK_UNIT_MM - THREE_U_HEIGHT_MM;
const kosmoWidths = [1, 2, 3, 4].map((steps) => mm(panelWidthMmForKosmoSteps(steps), 0));
const kosmoStepCm = mm(kosmo.widthStepMm / MM_PER_CM, 1);

function widthStep(spec: FormatSpec): string {
  return spec.key === "kosmo" ? `${mm(spec.widthStepMm, 0)} mm` : `${spec.widthStepHp} HP`;
}

const COLUMNS: Column<FormatRow>[] = [
  { key: "format", header: "FORMAT", variant: "id", render: (row) => row.name },
  {
    key: "height",
    header: "HEIGHT (MM)",
    variant: "value",
    render: (row) => mm(row.spec.heightMm),
  },
  {
    key: "holeX",
    header: "HOLE X (MM)",
    variant: "value",
    render: (row) => mm(row.spec.holeOffsetXMm),
  },
  {
    key: "holeY",
    header: "HOLE Y (MM)",
    variant: "value",
    render: (row) => mm(row.spec.holeOffsetYMm),
  },
  {
    key: "step",
    header: "WIDTH STEP",
    variant: "value",
    render: (row) => widthStep(row.spec),
  },
  { key: "source", header: "SOURCE", variant: "text", render: (row) => row.source },
];

const FAQ: FaqEntry[] = [
  {
    question: "How tall is a 3U Eurorack panel?",
    answer: `${mm(THREE_U_HEIGHT_MM)} mm. A 3U rack row is ${mm(3 * RACK_UNIT_MM)} mm, and the rail lips take ${mm(railLipsMm)} mm of it.`,
  },
  {
    question: "Where do the mounting holes go on a Eurorack panel?",
    answer: `The first column sits ${holes.horizontalOffsetMm} mm from the left edge, the rows ${holes.verticalOffsetMm} mm from the top and bottom, and every other column a whole number of HP from the first. The usual hole is ${holes.diameterMm} mm across, a little over the 3.2 mm of the Doepfer drawing so an M3 screw still passes through a 3D print.`,
  },
  {
    question: "How big is a Kosmo panel?",
    answer: `${mm(kosmo.heightMm, 0)} mm high, and a multiple of ${kosmoStepCm} cm wide (${kosmoWidths.join(", ")} mm and so on), cut at the full width. The mounting holes sit ${kosmo.holeOffsetYMm} mm from the top and bottom and ${kosmo.holeOffsetXMm} mm from each side, for M3 screws.`,
  },
];

function Body() {
  return (
    <>
      <Section
        number="01"
        title="Every format at a glance"
        kicker={`TABLE / ${FORMATS.length} FORMATS`}
      >
        <DataTable
          title="PANEL FORMATS"
          meta="MM"
          columns={COLUMNS}
          rows={[...FORMATS]}
          rowKey={(row) => row.name}
          minWidth="lg"
          note="Hole offsets are measured from the left edge (both sides on Kosmo), and from the top and bottom edges."
        />
        <Prose>
          <p>
            2U and 4U are not published by any brand. They take the rack unit ({RACK_UNIT_MM} mm)
            multiplied out, less the {mm(railLipsMm)} mm the rail lips take from a 3U panel, so a
            row built from the same rails fits.
          </p>
        </Prose>
      </Section>

      <Section number="02" title="Mounting holes" kicker="RAIL GRID">
        <Prose>
          <ul>
            <li>
              The first column is {holes.horizontalOffsetMm} mm from the left edge; the others sit a
              whole number of HP from it, so they land on the {DEFAULT_MM_PER_HP} mm grid of the
              rails.
            </li>
            <li>Rows are {holes.verticalOffsetMm} mm from the top and bottom edges.</li>
            <li>
              Panels wider than {holes.spacingHp} HP take a column in between, and one always lands
              near the right edge.
            </li>
            <li>
              The default diameter is {holes.diameterMm} mm, slightly over the 3.2 mm of the Doepfer
              drawing, so an M3 screw still passes through a 3D printed panel.
            </li>
          </ul>
          <p>Kosmo panels leave the grid: see below.</p>
        </Prose>
      </Section>

      <Section number="03" title="Widths" kicker="HP">
        <Prose>
          <p>
            Width is counted in HP, and a panel is cut a little under its pitch. The{" "}
            <a href={PAGE_PATHS.hpToMm}>HP to mm table</a> gives every width from 1 to 42 HP, and
            the <a href={PAGE_PATHS.hpCalculator}>HP and U calculator</a> any other. Pulp Logic
            tiles are the exception: they come in multiples of {pulpLogic1u.widthStepHp} HP.
          </p>
        </Prose>
      </Section>

      <Section number="04" title="Kosmo" kicker="LARGE FORMAT">
        <Prose>
          <p>
            Kosmo is the large format started by Look Mum No Computer, with 1/4 in jacks and
            Eurorack power. It has no formal specification: these are the criteria its author
            publishes and the community&apos;s summary of them.
          </p>
          <ul>
            <li>
              Panels are {mm(kosmo.heightMm, 0)} mm high and a multiple of {kosmoStepCm} cm wide:{" "}
              {kosmoWidths.join(", ")} mm and up, cut at the full width.
            </li>
            <li>
              Mounting holes sit {kosmo.holeOffsetYMm} mm from the top and bottom and{" "}
              {kosmo.holeOffsetXMm} mm from each side: one column per side, none in between. Metric
              widths leave the {DEFAULT_MM_PER_HP} mm grid of threaded rails, so Kosmo panels are
              held by sliding nuts or wood screws, anywhere along the rails.
            </li>
            <li>
              The rails take {KOSMO_RAIL_ALLOWANCE_MM} mm at the top and at the bottom: keep
              components clear of them, with the clearance guides of the editor.
            </li>
            <li>
              The <a href={PAGE_PATHS.drillSizes}>drill sizes</a> page gives the holes of 1/4 in
              jacks.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="05" title="Questions" kicker="FAQ">
        <Faq entries={FAQ} />
      </Section>

      <Section number="06" title="Sources" kicker="REFERENCES">
        <Prose small>
          <p>
            3U from the <a href={DOEPFER_URL}>Doepfer A-100 construction details</a>, 1U from the{" "}
            <a href={INTELLIJEL_URL}>Intellijel 1U specifications</a> and from{" "}
            <a href={PULP_LOGIC_URL}>Pulp Logic</a>, Kosmo from the{" "}
            <a href={KOSMO_URL}>Look Mum No Computer criteria</a> and the{" "}
            <a href={KOSMO_SPEC_URL}>community specification</a>. The editor applies them in{" "}
            <a href={`${REPO_URL}/blob/master/src/lib/panelFormat.ts`}>
              <code>panelFormat.ts</code>
            </a>
            .
          </p>
        </Prose>
      </Section>
    </>
  );
}

export const panelDimensionsPage: ContentPage = {
  path: PAGE_PATHS.dimensions,
  label: "Panel dimensions",
  group: "reference",
  title: "Eurorack and Kosmo panel dimensions: 3U, 1U, 2U, 4U",
  description:
    "Heights, mounting hole positions and width steps for 3U Eurorack, 1U Intellijel, 1U Pulp " +
    "Logic tiles, 2U and 4U rows, and Kosmo, with the source of each number.",
  kicker: "REFERENCE / FORMATS",
  lead: (
    <>
      A 3U Eurorack panel is <strong>{mm(THREE_U_HEIGHT_MM)} mm</strong> high. 1U is{" "}
      {mm(intellijel1u.heightMm)} mm on the Intellijel standard and {mm(pulpLogic1u.heightMm)} mm on
      Pulp Logic tiles, which do not fit each other&apos;s cases. Kosmo panels are{" "}
      {mm(kosmo.heightMm, 0)} mm high, in steps of {kosmoStepCm} cm.
    </>
  ),
  facts: [
    { label: "3U", value: mm(THREE_U_HEIGHT_MM), unit: "mm" },
    { label: "1U INTELLIJEL", value: mm(intellijel1u.heightMm), unit: "mm" },
    { label: "1U PULP LOGIC", value: mm(pulpLogic1u.heightMm), unit: "mm" },
    { label: "KOSMO", value: mm(kosmo.heightMm), unit: "mm" },
  ],
  faq: FAQ,
  Body,
};
