import { useState } from "react";
import {
  Alert,
  Badge,
  Field,
  NumberInput,
  Panel,
  SegmentDisplay,
  SegmentedControl,
  StatCell,
  StatGrid,
  type SegmentedItem,
} from "@salnika/uipirate";

import { generateMountingHoles } from "@lib/mountingHoles";
import {
  PANEL_WIDTH_CLEARANCE_MM,
  panelWidthMmForHp,
  snapWidthHp,
  type OneUSpec,
  type PanelRackUnits,
  type RackFormatSpec,
} from "@lib/panelFormat";
import { DEFAULT_MOUNTING_HOLE_CONFIG } from "@lib/panelTypes";
import {
  CALCULATOR_MAX_HP,
  CALCULATOR_MAX_MM,
  CALCULATOR_MAX_ROWS,
  mmToInches,
  NINETEEN_INCH_RACK_HP,
  readCase,
  readHeight,
  readWidthHp,
  readWidthMm,
} from "@lib/rackCalculator";

import * as styles from "./HpCalculator.css";
import { PanelPreview } from "./PanelPreview";
import * as previewStyles from "./PanelPreview.css";

type WidthMode = "hp" | "mm";
type RackUnitsValue = `${PanelRackUnits}`;

const WIDTH_MODES: SegmentedItem<WidthMode>[] = [
  { value: "hp", label: "HP → MM", title: "From a width in HP" },
  { value: "mm", label: "MM → HP", title: "From a width in millimeters" },
];

const RACK_UNIT_ITEMS: SegmentedItem<RackUnitsValue>[] = [
  { value: "1", label: "1U" },
  { value: "2", label: "2U" },
  { value: "3", label: "3U" },
  { value: "4", label: "4U" },
];

const ONE_U_ITEMS: SegmentedItem<OneUSpec>[] = [
  { value: "intellijel", label: "INTELLIJEL" },
  { value: "pulpLogic", label: "PULP LOGIC" },
];

/** The format as the calculator names it, and where its height comes from. */
const FORMAT_NOTES: Record<RackFormatSpec["key"], { name: string; source: string; note: string }> =
  {
    intellijel1u: {
      name: "1U INTELLIJEL",
      source: "INTELLIJEL",
      note: "The 1U height Intellijel publishes. Pulp Logic tiles are taller and fit other cases.",
    },
    pulpLogic1u: {
      name: "1U PULP LOGIC",
      source: "PULP LOGIC",
      note: "Pulp Logic tiles come in multiples of 6 HP, with their holes 5.08 mm from the edge.",
    },
    rack2u: {
      name: "2U",
      source: "DERIVED",
      note: "No brand publishes 2U: the rack unit less the rail lips, the way 3U is.",
    },
    eurorack3u: {
      name: "3U",
      source: "DOEPFER A-100",
      note: "The height of every A-100 panel: the 3U row less the rail lips.",
    },
    rack4u: {
      name: "4U",
      source: "DERIVED",
      note: "No brand publishes 4U: the rack unit less the rail lips, the way 3U is.",
    },
  };

const mm = (value: number) => value.toFixed(2);
const inches = (valueMm: number) => mmToInches(valueMm).toFixed(2);

/**
 * The HP and U calculator: a width in HP or millimeters, a row height, the panel they make drawn
 * to scale, and a case of several rows. The build renders it with these starting values, and the
 * browser hydrates it.
 */
export function HpCalculator() {
  const [mode, setMode] = useState<WidthMode>("hp");
  const [widthHp, setWidthHp] = useState(12);
  const [widthMm, setWidthMm] = useState(58);
  const [rackUnits, setRackUnits] = useState<PanelRackUnits>(3);
  const [oneUSpec, setOneUSpec] = useState<OneUSpec>("intellijel");
  const [threeURows, setThreeURows] = useState(2);
  const [oneURows, setOneURows] = useState(0);
  const [caseHp, setCaseHp] = useState(NINETEEN_INCH_RACK_HP);

  const hpReading = readWidthHp(widthHp);
  const mmReading = readWidthMm(widthMm);
  const width = mode === "hp" ? hpReading : mmReading;
  const height = readHeight({ rackUnits, oneUSpec });
  const format = FORMAT_NOTES[height.spec.key];

  // The panel follows the format like the editor does: Pulp Logic tiles snap to 6 HP steps.
  const panelHp = snapWidthHp(width.widthHp, { rackUnits, oneUSpec, custom: false });
  const panelWidthMm = panelWidthMmForHp(panelHp);
  const holes = generateMountingHoles({
    widthHp: panelHp,
    widthMm: panelWidthMm,
    heightMm: height.panelHeightMm,
    config: {
      horizontalOffsetMm: height.spec.holeOffsetXMm,
      verticalOffsetMm: height.spec.holeOffsetYMm,
    },
  });

  const caseReading = readCase({ threeURows, oneURows, widthHp: caseHp });

  return (
    <div className={styles.tool}>
      <div className={styles.column}>
        <Panel
          variant="device"
          title="WIDTH"
          sub="HP ↔ MM"
          actions={
            <SegmentedControl
              aria-label="Conversion"
              size="xs"
              items={WIDTH_MODES}
              value={mode}
              onChange={setMode}
            />
          }
        >
          <div className={styles.body}>
            {mode === "hp" ? (
              <Field label="WIDTH IN HP" hint={`A whole number of HP, 1 to ${CALCULATOR_MAX_HP}.`}>
                {({ id, describedBy }) => (
                  <NumberInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-label="Width in HP"
                    value={widthHp}
                    onChange={setWidthHp}
                    min={1}
                    max={CALCULATOR_MAX_HP}
                    step={1}
                    precision={0}
                    unit="HP"
                  />
                )}
              </Field>
            ) : (
              <Field
                label="WIDTH IN MM"
                hint="A panel, a circuit board, or the space left in a case."
              >
                {({ id, describedBy }) => (
                  <NumberInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-label="Width in millimeters"
                    value={widthMm}
                    onChange={setWidthMm}
                    min={1}
                    max={CALCULATOR_MAX_MM}
                    step={0.1}
                    precision={2}
                    unit="mm"
                  />
                )}
              </Field>
            )}
            <div aria-live="polite">
              {mode === "hp" ? (
                <SegmentDisplay label="PANEL WIDTH" unit="MM" value={mm(hpReading.panelWidthMm)} />
              ) : (
                <SegmentDisplay label="RACK SPACE" unit="HP" value={String(mmReading.widthHp)} />
              )}
            </div>
            {mode === "hp" ? (
              <StatGrid columns={3}>
                <StatCell label="RAIL PITCH" value={mm(hpReading.pitchMm)} unit="mm" size="sm" />
                <StatCell label="CLEARANCE" value={mm(hpReading.clearanceMm)} unit="mm" size="sm" />
                <StatCell
                  label="INCHES"
                  value={inches(hpReading.panelWidthMm)}
                  unit="in"
                  size="sm"
                />
              </StatGrid>
            ) : (
              <StatGrid columns={3}>
                <StatCell
                  label="PANEL WIDTH"
                  value={mm(mmReading.panelWidthMm)}
                  unit="mm"
                  size="sm"
                />
                <StatCell label="RAIL PITCH" value={mm(mmReading.pitchMm)} unit="mm" size="sm" />
                <StatCell label="SPARE RAIL" value={mm(mmReading.spareMm)} unit="mm" size="sm" />
              </StatGrid>
            )}
            <div className={styles.status}>
              {width.published ? (
                <Badge tone="accent">DOEPFER TABLE</Badge>
              ) : (
                <Badge tone="neutral">PITCH − {PANEL_WIDTH_CLEARANCE_MM} MM</Badge>
              )}
              <span>
                {width.published
                  ? `Doepfer publishes the width of a ${width.widthHp} HP panel.`
                  : `Doepfer's table leaves ${width.widthHp} HP out: the pitch less ${PANEL_WIDTH_CLEARANCE_MM} mm.`}
              </span>
            </div>
          </div>
        </Panel>

        <Panel variant="device" title="HEIGHT" sub="U → MM">
          <div className={styles.body}>
            <SegmentedControl
              aria-label="Rack units"
              fullWidth
              items={RACK_UNIT_ITEMS}
              value={`${rackUnits}`}
              onChange={(value) => setRackUnits(Number(value) as PanelRackUnits)}
            />
            {rackUnits === 1 ? (
              <SegmentedControl
                aria-label="1U standard"
                fullWidth
                items={ONE_U_ITEMS}
                value={oneUSpec}
                onChange={setOneUSpec}
              />
            ) : null}
            <div aria-live="polite">
              <SegmentDisplay label="PANEL HEIGHT" unit="MM" value={mm(height.panelHeightMm)} />
            </div>
            <StatGrid columns={3}>
              <StatCell
                label={`${rackUnits}U ROW`}
                value={mm(height.rowHeightMm)}
                unit="mm"
                size="sm"
              />
              <StatCell label="UNDER ROW" value={mm(height.underRowMm)} unit="mm" size="sm" />
              <StatCell label="INCHES" value={inches(height.panelHeightMm)} unit="in" size="sm" />
            </StatGrid>
            <div className={styles.status}>
              <Badge tone={height.spec.published ? "accent" : "warn"}>{format.source}</Badge>
              <span>{format.note}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        className={styles.preview}
        variant="device"
        title="PANEL"
        sub="TO SCALE"
        meta={`${panelHp} HP · ${format.name}`}
        footer={
          <span className={styles.footerValue}>
            {mm(panelWidthMm)} × {mm(height.panelHeightMm)} MM · {holes.length} HOLES · Ø{" "}
            {mm(DEFAULT_MOUNTING_HOLE_CONFIG.diameterMm)}
          </span>
        }
      >
        {panelHp !== width.widthHp ? (
          <Alert tone="warn" title="Pulp Logic tiles come in steps of 6 HP">
            The drawing shows the nearest tile, {panelHp} HP.
          </Alert>
        ) : null}
        <div className={previewStyles.frame}>
          <PanelPreview
            widthMm={panelWidthMm}
            heightMm={height.panelHeightMm}
            holes={holes}
            firstColumnMm={height.spec.holeOffsetXMm}
            label={`${panelHp} HP ${format.name} panel, ${mm(panelWidthMm)} by ${mm(height.panelHeightMm)} mm, with ${holes.length} mounting holes.`}
          />
        </div>
      </Panel>

      <Panel className={styles.wide} variant="device" title="CASE" sub="ROWS × HP">
        <div className={styles.body}>
          <div className={styles.inputs}>
            <Field label="3U ROWS">
              {({ id, describedBy }) => (
                <NumberInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-label="3U rows"
                  value={threeURows}
                  onChange={setThreeURows}
                  min={0}
                  max={CALCULATOR_MAX_ROWS}
                  step={1}
                  precision={0}
                />
              )}
            </Field>
            <Field label="1U ROWS">
              {({ id, describedBy }) => (
                <NumberInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-label="1U rows"
                  value={oneURows}
                  onChange={setOneURows}
                  min={0}
                  max={CALCULATOR_MAX_ROWS}
                  step={1}
                  precision={0}
                />
              )}
            </Field>
            <Field label="ROW WIDTH">
              {({ id, describedBy }) => (
                <NumberInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-label="Row width in HP"
                  value={caseHp}
                  onChange={setCaseHp}
                  min={1}
                  max={CALCULATOR_MAX_HP}
                  step={1}
                  precision={0}
                  unit="HP"
                />
              )}
            </Field>
          </div>
          <div aria-live="polite">
            <SegmentDisplay
              label={`${caseReading.rackUnits}U OF RACK SPACE`}
              unit="MM"
              value={mm(caseReading.heightMm)}
            />
          </div>
          <StatGrid columns={3}>
            <StatCell label="HEIGHT" value={inches(caseReading.heightMm)} unit="in" size="sm" />
            <StatCell label="ROW WIDTH" value={mm(caseReading.rowWidthMm)} unit="mm" size="sm" />
            <StatCell
              label="MODULE SPACE"
              value={String(caseReading.moduleSpaceHp)}
              unit="HP"
              size="sm"
            />
          </StatGrid>
          <div className={styles.status}>
            {caseReading.fitsNineteenInchRack ? (
              <Badge tone="accent">FITS A 19-INCH RACK</Badge>
            ) : (
              <Badge tone="warn">WIDER THAN A 19-INCH RACK</Badge>
            )}
            <span>
              A 19-inch rack row holds {NINETEEN_INCH_RACK_HP} HP. Heights count the rows only: add
              the case&apos;s own top and bottom.
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
