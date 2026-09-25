import { TableStatus, type Column } from "@salnika/uipirate";

import {
  DEFAULT_MM_PER_HP,
  isPublishedPanelWidth,
  PANEL_WIDTH_CLEARANCE_MM,
  panelWidthMmForHp,
} from "@lib/panelFormat";

import { DataTable } from "../components/DataTable";
import { Faq } from "../components/Faq";
import { Prose } from "../components/Prose";
import { Section } from "../components/Section";
import { REPO_URL } from "../site";
import { PAGE_PATHS } from "../paths";
import type { ContentPage, FaqEntry } from "../types";
import { DOEPFER_URL, mm } from "./shared";

/** Widest panel the table lists. Doepfer publishes up to 42 HP, the widest common panel. */
const MAX_TABLE_HP = 42;

const TABLE_HP: readonly number[] = [
  1,
  1.5,
  ...Array.from({ length: MAX_TABLE_HP - 1 }, (_, index) => index + 2),
];

const COLUMNS: Column<number>[] = [
  { key: "width", header: "WIDTH", variant: "id", render: (hp) => `${hp} HP` },
  {
    key: "pitch",
    header: "RAIL PITCH (MM)",
    variant: "value",
    render: (hp) => mm(hp * DEFAULT_MM_PER_HP),
  },
  {
    key: "panel",
    header: "PANEL WIDTH (MM)",
    variant: "value",
    render: (hp) => mm(panelWidthMmForHp(hp)),
  },
  {
    key: "source",
    header: "SOURCE",
    variant: "status",
    render: (hp) =>
      isPublishedPanelWidth(hp) ? (
        <TableStatus tone="ok">DOEPFER</TableStatus>
      ) : (
        <TableStatus tone="muted">DERIVED</TableStatus>
      ),
  },
];

const FAQ: FaqEntry[] = [
  {
    question: "How many millimeters is 1 HP?",
    answer: `1 HP is ${DEFAULT_MM_PER_HP} mm, one fifth of an inch. It is the pitch of the mounting holes on the rails, not the width a panel is cut at.`,
  },
  {
    question: "How wide is a 12 HP Eurorack panel?",
    answer: `A 12 HP panel takes ${mm(12 * DEFAULT_MM_PER_HP)} mm on the rails and is cut ${mm(panelWidthMmForHp(12))} mm wide, as published in the Doepfer A-100 construction details.`,
  },
  {
    question: "How do I convert millimeters back to HP?",
    answer: `Divide by ${DEFAULT_MM_PER_HP} and round up: a 60 mm panel takes 12 HP of rack space. Rounding down would leave the module overlapping its neighbour.`,
  },
];

function Body() {
  return (
    <>
      <Section
        number="01"
        title={`HP to mm, 1 to ${MAX_TABLE_HP} HP`}
        kicker="TABLE / DOEPFER A-100"
      >
        <DataTable
          title={`HP TO MM · 1–${MAX_TABLE_HP} HP`}
          meta={`${TABLE_HP.length} ROWS`}
          columns={COLUMNS}
          rows={[...TABLE_HP]}
          rowKey={(hp) => String(hp)}
          note={`Rail pitch is HP × ${DEFAULT_MM_PER_HP} mm. Panel width is what the panel is actually cut at.`}
        />
      </Section>

      <Section number="02" title="Why a panel is narrower than its pitch" kicker="CLEARANCE">
        <Prose>
          <p>
            If every panel were cut at exactly HP × {DEFAULT_MM_PER_HP} mm, two modules side by side
            would touch and the screws would bind. Doepfer therefore publishes a width per size, and
            the reduction is not constant: {mm(1 * DEFAULT_MM_PER_HP - panelWidthMmForHp(1))} mm at
            1 HP, {mm(6 * DEFAULT_MM_PER_HP - panelWidthMmForHp(6))} mm at 6 HP. For the widths that
            table leaves out, a clearance of {PANEL_WIDTH_CLEARANCE_MM} mm is taken off the pitch.
          </p>
        </Prose>
      </Section>

      <Section number="03" title="Millimeters back to HP" kicker="ROUND UP">
        <Prose>
          <p>
            Divide by {DEFAULT_MM_PER_HP} and round <em>up</em>: a panel of 63 mm occupies 13 HP of
            rack space, because 12 HP would be {mm(12 * DEFAULT_MM_PER_HP)} mm. Rack space is always
            counted in whole HP, even when the panel itself is narrower.
          </p>
          <p>
            The <a href={PAGE_PATHS.hpCalculator}>HP and U calculator</a> does it for any width, and
            gives the height of the row as well.
          </p>
        </Prose>
      </Section>

      <Section number="04" title="Questions" kicker="FAQ">
        <Faq entries={FAQ} />
      </Section>

      <Section number="05" title="Sources" kicker="REFERENCES">
        <Prose small>
          <p>
            Widths and the mounting grid come from the{" "}
            <a href={DOEPFER_URL}>Doepfer A-100 construction details</a>, table 1. The same numbers
            are applied by the editor in{" "}
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

export const hpToMmPage: ContentPage = {
  path: PAGE_PATHS.hpToMm,
  label: "HP to mm",
  group: "reference",
  title: "Eurorack HP to mm: the full conversion table",
  description:
    "1 HP is 5.08 mm on the rack rails, but a Eurorack front panel is cut a little narrower. " +
    `Full HP to mm table from 1 to ${MAX_TABLE_HP} HP, with the widths Doepfer publishes.`,
  kicker: "REFERENCE / WIDTHS",
  lead: (
    <>
      <strong>1 HP = {DEFAULT_MM_PER_HP} mm</strong> on the rails. A front panel is cut a few tenths
      narrower than its pitch so modules can be screwed side by side, which is why a 6 HP panel is{" "}
      {mm(panelWidthMmForHp(6))} mm wide and not {mm(6 * DEFAULT_MM_PER_HP)} mm.
    </>
  ),
  facts: [
    { label: "1 HP", value: mm(DEFAULT_MM_PER_HP), unit: "mm" },
    { label: "6 HP PANEL", value: mm(panelWidthMmForHp(6)), unit: "mm" },
    { label: "12 HP PANEL", value: mm(panelWidthMmForHp(12)), unit: "mm" },
    { label: "CLEARANCE", value: mm(PANEL_WIDTH_CLEARANCE_MM), unit: "mm" },
  ],
  faq: FAQ,
  Body,
};
