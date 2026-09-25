import type { Column } from "@salnika/uipirate";

import {
  DEFAULT_MM_PER_HP,
  PANEL_WIDTH_CLEARANCE_MM,
  RACK_UNIT_MM,
  THREE_U_HEIGHT_MM,
} from "@lib/panelFormat";
import {
  mmToInches,
  NINETEEN_INCH_RACK_HP,
  readCase,
  readHeight,
  readWidthHp,
  readWidthMm,
  type CaseReading,
} from "@lib/rackCalculator";

import { DataTable } from "../components/DataTable";
import { Faq } from "../components/Faq";
import { Island } from "../components/Island";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { absoluteUrl, REPO_URL, SITE_NAME, SITE_ORIGIN } from "../site";
import { PAGE_PATHS } from "../paths";
import type { ContentPage, FaqEntry } from "../types";
import { DOEPFER_URL, INTELLIJEL_URL, mm, PULP_LOGIC_URL } from "./shared";

const TITLE = "Eurorack HP calculator: HP to mm, mm to HP, and U to mm";
const HEADING = "Eurorack HP and U calculator";
const DESCRIPTION =
  "Convert Eurorack HP to millimeters and back, get the width a panel is cut at and the height " +
  "of 1U, 2U, 3U and 4U panels, and size a case in rack units.";

const sixHp = readWidthHp(6);
const twelveHp = readWidthHp(12);
const boardWidth = readWidthMm(58);
const elevenHp = readWidthHp(boardWidth.widthHp - 1);
const threeU = readHeight({ rackUnits: 3, oneUSpec: "intellijel" });
const intellijel1u = readHeight({ rackUnits: 1, oneUSpec: "intellijel" });
const pulpLogic1u = readHeight({ rackUnits: 1, oneUSpec: "pulpLogic" });

interface CaseRow {
  name: string;
  reading: CaseReading;
}

const caseRow = (name: string, threeURows: number, oneURows: number): CaseRow => ({
  name,
  reading: readCase({ threeURows, oneURows, widthHp: NINETEEN_INCH_RACK_HP }),
});

const CASES: readonly CaseRow[] = [
  caseRow("One 1U row", 0, 1),
  caseRow("One 3U row", 1, 0),
  caseRow("Two 3U rows", 2, 0),
  caseRow("Two 3U rows and a 1U row", 2, 1),
  caseRow("Three 3U rows", 3, 0),
  caseRow("Four 3U rows", 4, 0),
];

const sixU = CASES[2].reading;
const sevenU = CASES[3].reading;

const CASE_COLUMNS: Column<CaseRow>[] = [
  {
    key: "units",
    header: "RACK UNITS",
    variant: "id",
    render: (row) => `${row.reading.rackUnits}U`,
  },
  { key: "rows", header: "ROWS", variant: "text", render: (row) => row.name },
  { key: "mm", header: "HEIGHT (MM)", variant: "value", render: (row) => mm(row.reading.heightMm) },
  {
    key: "in",
    header: "HEIGHT (IN)",
    variant: "value",
    render: (row) => mm(mmToInches(row.reading.heightMm)),
  },
];

const FAQ: FaqEntry[] = [
  {
    question: "How do I convert HP to millimeters?",
    answer: `Multiply by ${DEFAULT_MM_PER_HP}: 12 HP is ${mm(twelveHp.pitchMm)} mm of rail. The panel itself is cut a little narrower, ${mm(twelveHp.panelWidthMm)} mm for 12 HP, so that neighbouring modules do not bind.`,
  },
  {
    question: "How do I convert millimeters to HP?",
    answer: `Divide by ${DEFAULT_MM_PER_HP} and round up. A ${boardWidth.requestedMm} mm circuit board takes ${boardWidth.widthHp} HP: ${elevenHp.widthHp} HP would only give ${mm(elevenHp.pitchMm)} mm.`,
  },
  {
    question: "How tall is a 3U Eurorack module?",
    answer: `Its front panel is ${mm(THREE_U_HEIGHT_MM)} mm high. 3U is ${mm(threeU.rowHeightMm)} mm of rack space, and the rail lips take the other ${mm(threeU.underRowMm)} mm.`,
  },
  {
    question: "What is the difference between HP and U?",
    answer: `HP measures width and U measures height. 1 HP is ${DEFAULT_MM_PER_HP} mm, a fifth of an inch: the horizontal pitch of the rails. 1 U is ${RACK_UNIT_MM} mm, 1.75 inches: the rack unit of 19-inch racks. Eurorack modules are 3U high and a whole number of HP wide.`,
  },
  {
    question: "How many HP fit in a 19-inch rack?",
    answer: `${NINETEEN_INCH_RACK_HP} HP per row, the usable width Doepfer gives for a 19-inch rack.`,
  },
  {
    question: "How tall is a 6U or a 7U case?",
    answer: `A 6U case, two 3U rows, takes ${mm(sixU.heightMm)} mm of rack height. A 7U case adds a 1U row, for ${mm(sevenU.heightMm)} mm. The case's own top and bottom come on top of that.`,
  },
];

function Body() {
  return (
    <>
      <Section number="01" title="Calculator" kicker="WIDTH · HEIGHT · CASE">
        <Island id="hp-calculator" />
      </Section>

      <Section number="02" title="How the numbers are worked out" kicker="METHOD">
        <Prose>
          <h3>Width, from HP to millimeters</h3>
          <p>
            1 HP is {DEFAULT_MM_PER_HP} mm, a fifth of an inch: the pitch of the threads on the
            rails. A panel is cut slightly under its pitch so that neighbours do not bind. Doepfer
            publishes the width of the common sizes, {mm(sixHp.panelWidthMm)} mm for 6 HP and{" "}
            {mm(twelveHp.panelWidthMm)} mm for 12 HP, and the calculator takes{" "}
            {PANEL_WIDTH_CLEARANCE_MM} mm off the pitch for the others. The{" "}
            <a href={PAGE_PATHS.hpToMm}>HP to mm table</a> lists every width up to 42 HP.
          </p>
          <h3>Millimeters back to HP</h3>
          <p>
            Divide by {DEFAULT_MM_PER_HP} and round up: a {boardWidth.requestedMm} mm board takes{" "}
            {boardWidth.widthHp} HP of rack space, since {elevenHp.widthHp} HP would only give{" "}
            {mm(elevenHp.pitchMm)} mm. Rack space always comes in whole HP.
          </p>
          <h3>Height, from U to millimeters</h3>
          <p>
            1 U is 1.75 inches, {RACK_UNIT_MM} mm: the rack unit of 19-inch racks. A 3U Eurorack
            panel is {mm(THREE_U_HEIGHT_MM)} mm high, the {mm(threeU.rowHeightMm)} mm of its row
            less the {mm(threeU.underRowMm)} mm the rail lips take. 1U comes in two standards that
            do not fit each other&apos;s cases: Intellijel ({mm(intellijel1u.panelHeightMm)} mm) and
            Pulp Logic tiles ({mm(pulpLogic1u.panelHeightMm)} mm, in multiples of{" "}
            {pulpLogic1u.spec.widthStepHp} HP). No brand publishes 2U or 4U, which are worked out
            the way 3U is. The <a href={PAGE_PATHS.dimensions}>panel dimensions</a> give the
            mounting holes of each format.
          </p>
          <h3>Cases</h3>
          <p>
            A case is counted in rows and in HP. A 19-inch rack row holds {NINETEEN_INCH_RACK_HP}{" "}
            HP; two 3U rows make a 6U case, {mm(sixU.heightMm)} mm of rack space, and a 1U row on
            top makes it 7U. The calculator gives the space the rows take: the case&apos;s own
            panels and rails come on top.
          </p>
        </Prose>
      </Section>

      <Section
        number="03"
        title="Rack units at a glance"
        kicker={`TABLE / ${NINETEEN_INCH_RACK_HP} HP ROWS`}
      >
        <DataTable
          title="CASE HEIGHTS"
          meta="RACK SPACE"
          columns={CASE_COLUMNS}
          rows={[...CASES]}
          rowKey={(row) => row.name}
          minWidth="md"
          note={`Rack units × ${RACK_UNIT_MM} mm. A 3U row is 3 U high, a 1U row 1 U.`}
        />
      </Section>

      <Section number="04" title="Questions" kicker="FAQ">
        <Faq entries={FAQ} />
      </Section>

      <Section number="05" title="Sources" kicker="REFERENCES">
        <Prose small>
          <p>
            The pitch, the 3U height and the {NINETEEN_INCH_RACK_HP} HP of a 19-inch row come from
            the <a href={DOEPFER_URL}>Doepfer A-100 construction details</a>, 1U from the{" "}
            <a href={INTELLIJEL_URL}>Intellijel 1U specifications</a> and from{" "}
            <a href={PULP_LOGIC_URL}>Pulp Logic</a>. The calculator uses the code of the editor:{" "}
            <a href={`${REPO_URL}/blob/master/src/lib/panelFormat.ts`}>
              <code>panelFormat.ts</code>
            </a>{" "}
            for the sizes and{" "}
            <a href={`${REPO_URL}/blob/master/src/lib/mountingHoles.ts`}>
              <code>mountingHoles.ts</code>
            </a>{" "}
            for the holes.
          </p>
        </Prose>
      </Section>
    </>
  );
}

export const hpCalculatorPage: ContentPage = {
  path: PAGE_PATHS.hpCalculator,
  label: "HP & U calculator",
  group: "tools",
  title: TITLE,
  heading: HEADING,
  description: DESCRIPTION,
  kicker: "TOOL / HP · U · MM",
  lead: (
    <>
      <strong>1 HP = {DEFAULT_MM_PER_HP} mm</strong> of width and{" "}
      <strong>1 U = {RACK_UNIT_MM} mm</strong> of height. Type a width in HP or in millimeters and
      pick a row: the calculator gives the size the panel is cut at, draws it to scale with its
      mounting holes, and works out the size of a case.
    </>
  ),
  facts: [
    { label: "1 HP", value: mm(DEFAULT_MM_PER_HP), unit: "mm" },
    { label: "1 U", value: mm(RACK_UNIT_MM), unit: "mm" },
    { label: "3U PANEL", value: mm(THREE_U_HEIGHT_MM), unit: "mm" },
    { label: "19-INCH ROW", value: String(NINETEEN_INCH_RACK_HP), unit: "HP" },
  ],
  faq: FAQ,
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: HEADING,
      url: absoluteUrl(PAGE_PATHS.hpCalculator),
      description: DESCRIPTION,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any, in a web browser",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/` },
    },
  ],
  island: "hp-calculator",
  Body,
};
