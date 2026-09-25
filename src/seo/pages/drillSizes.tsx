import type { Column } from "@salnika/uipirate";

import {
  getKnob,
  getPart,
  PANEL_KNOBS,
  PANEL_PARTS,
  type KnobId,
  type PanelKnob,
  type PanelPart,
  type PartId,
} from "@lib/parts";

import { DataTable } from "../components/DataTable";
import { Faq } from "../components/Faq";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { REPO_URL } from "../site";
import { PAGE_PATHS } from "../paths";
import type { ContentPage, FaqEntry } from "../types";
import { mm } from "./shared";

/** Display names and datasheets. A new part or knob fails to compile until it is listed here. */
const PART_LABELS: Record<PartId, { name: string; kind: string; source: string }> = {
  thonkiconn: { name: "Thonkiconn jack", kind: "3.5 mm jack", source: "QingPu PJ398SM / WQP518MA" },
  alpha9mm: { name: "Alpha 9 mm potentiometer", kind: "Potentiometer", source: "Alpha RD901F-40" },
  bournsPec11r: { name: "Bourns PEC11R encoder", kind: "Rotary encoder", source: "Bourns PEC11R" },
  dailywellSubMiniToggle: {
    name: "Dailywell sub-mini toggle",
    kind: "Toggle switch",
    source: "Dailywell 2MS",
  },
  dailywellMiniToggle: {
    name: "Dailywell mini toggle",
    kind: "Toggle switch",
    source: "Dailywell 1MS",
  },
  led3mm: { name: "LED, 3 mm", kind: "LED", source: "T-1 body" },
  led5mm: { name: "LED, 5 mm", kind: "LED", source: "T-1¾ body" },
};

const KNOB_LABELS: Record<KnobId, string> = {
  thonkTallTrimmerTopper: "Thonk Tall Trimmer Topper",
  davies1900h: "Davies 1900H clone (Tayda)",
  roganPt1ps: "Rogan PT-1PS",
  roganPt2ps: "Rogan PT-2PS",
  roganPt3ps: "Rogan PT-3PS",
};

const PART_COLUMNS: Column<PanelPart>[] = [
  { key: "part", header: "PART", variant: "id", render: (part) => PART_LABELS[part.id].name },
  { key: "type", header: "TYPE", variant: "text", render: (part) => PART_LABELS[part.id].kind },
  {
    key: "hole",
    header: "HOLE Ø (MM)",
    variant: "value",
    render: (part) => mm(part.holeDiameterMm),
  },
  {
    key: "hardware",
    header: "HARDWARE Ø (MM)",
    variant: "value",
    render: (part) => (part.hardwareDiameterMm ? mm(part.hardwareDiameterMm) : "—"),
  },
  {
    key: "datasheet",
    header: "DATASHEET",
    variant: "text",
    render: (part) => PART_LABELS[part.id].source,
  },
];

const KNOB_COLUMNS: Column<PanelKnob>[] = [
  { key: "knob", header: "KNOB", variant: "id", render: (knob) => KNOB_LABELS[knob.id] },
  {
    key: "diameter",
    header: "WIDEST Ø (MM)",
    variant: "value",
    render: (knob) => mm(knob.diameterMm),
  },
];

const thonkiconn = getPart("thonkiconn");
const alpha9mm = getPart("alpha9mm");
const subMiniToggle = getPart("dailywellSubMiniToggle");
const miniToggle = getPart("dailywellMiniToggle");
const led3mm = getPart("led3mm");
const led5mm = getPart("led5mm");
const davies = getKnob("davies1900h");

const FAQ: FaqEntry[] = [
  {
    question: "What size hole does a Thonkiconn jack need?",
    answer: `${mm(thonkiconn.holeDiameterMm, 0)} mm. The bushing of the QingPu PJ398SM is ${mm(thonkiconn.holeDiameterMm, 0)} mm across, and its knurled nut covers ${mm(thonkiconn.hardwareDiameterMm ?? thonkiconn.holeDiameterMm, 1)} mm on the front of the panel.`,
  },
  {
    question: "What hole do Alpha 9 mm potentiometers need?",
    answer: `${mm(alpha9mm.holeDiameterMm, 0)} mm, for the M7 × 0.75 bushing. The nut and washer cover ${mm(alpha9mm.hardwareDiameterMm ?? alpha9mm.holeDiameterMm, 0)} mm on the front, so two pots need at least that much space between centres before their knobs are considered.`,
  },
];

function Body() {
  return (
    <>
      <Section number="01" title="Panel holes" kicker={`TABLE / ${PANEL_PARTS.length} PARTS`}>
        <DataTable
          title="PANEL HOLES"
          meta="Ø MM"
          columns={PART_COLUMNS}
          rows={[...PANEL_PARTS]}
          rowKey={(part) => part.id}
          minWidth="lg"
          note="Hardware diameter is the widest part on the front of the panel: nut or locking washer."
        />
        <Prose>
          <p>
            Drill the hole named above and open it up slightly if the part needs play; going under
            it means the bushing will not pass. On a{" "}
            <a href={PAGE_PATHS.printing}>3D printed panel</a>, print a test piece first: holes
            usually come out a little under their nominal size.
          </p>
        </Prose>
      </Section>

      <Section number="02" title="Knob diameters" kicker={`TABLE / ${PANEL_KNOBS.length} KNOBS`}>
        <Prose>
          <p>
            The hole is only half of the spacing problem. A knob has to clear its neighbours, and
            the skirt is wider than the shaft.
          </p>
        </Prose>
        <DataTable
          title="KNOBS"
          meta="Ø MM"
          columns={KNOB_COLUMNS}
          rows={[...PANEL_KNOBS]}
          rowKey={(knob) => knob.id}
        />
        <Prose>
          <p>
            Two Davies 1900H knobs need at least {mm(davies.diameterMm)} mm between centres to
            touch, and more to be comfortable. The editor outlines every knob, nut and washer on the
            canvas and turns the outline red where two of them overlap.
          </p>
        </Prose>
      </Section>

      <Section number="03" title="Questions" kicker="FAQ">
        <Faq entries={FAQ} />
      </Section>

      <Section number="04" title="Sources" kicker="DATASHEETS">
        <Prose small>
          <p>
            Thonkiconn from the QingPu PJ398SM and WQP518MA datasheets; Alpha 9 mm from the
            RD901F-40 datasheet; the encoder from the Bourns PEC11R datasheet; the toggles from the
            Dailywell 1MS and 2MS datasheets. The editor applies them in{" "}
            <a href={`${REPO_URL}/blob/master/src/lib/parts.ts`}>
              <code>parts.ts</code>
            </a>
            .
          </p>
        </Prose>
      </Section>
    </>
  );
}

export const drillSizesPage: ContentPage = {
  path: PAGE_PATHS.drillSizes,
  label: "Drill sizes",
  group: "reference",
  title: "Drill sizes for Eurorack panel parts",
  description:
    "Panel hole diameters for Thonkiconn jacks, Alpha 9 mm pots, Bourns PEC11R encoders, " +
    "Dailywell toggles and 3 mm and 5 mm LEDs, each from the part's datasheet.",
  kicker: "REFERENCE / PARTS",
  lead: (
    <>
      A Thonkiconn jack needs a <strong>{mm(thonkiconn.holeDiameterMm, 0)} mm</strong> hole, an
      Alpha 9 mm pot and a Bourns PEC11R encoder{" "}
      <strong>{mm(alpha9mm.holeDiameterMm, 0)} mm</strong>, a Dailywell sub-mini toggle{" "}
      <strong>{mm(subMiniToggle.holeDiameterMm, 0)} mm</strong>, a mini toggle{" "}
      <strong>{mm(miniToggle.holeDiameterMm)} mm</strong>, and LEDs{" "}
      <strong>{mm(led3mm.holeDiameterMm, 0)}</strong> or{" "}
      <strong>{mm(led5mm.holeDiameterMm, 0)} mm</strong>.
    </>
  ),
  facts: [
    { label: "THONKICONN", value: mm(thonkiconn.holeDiameterMm), unit: "mm" },
    { label: "ALPHA 9 MM POT", value: mm(alpha9mm.holeDiameterMm), unit: "mm" },
    { label: "SUB-MINI TOGGLE", value: mm(subMiniToggle.holeDiameterMm), unit: "mm" },
    {
      label: "LED",
      value: `${mm(led3mm.holeDiameterMm, 0)} / ${mm(led5mm.holeDiameterMm, 0)}`,
      unit: "mm",
    },
  ],
  faq: FAQ,
  Body,
};
