import { Alert } from "@salnika/uipirate";

import { ORDER_PANEL_THICKNESS_MM } from "@lib/orderCatalog";
import { DEFAULT_MOUNTING_HOLE_CONFIG } from "@lib/panelTypes";

import { Prose } from "../components/Prose";
import { measure } from "../components/Prose.css";
import { Section } from "../components/Section";
import { PAGE_PATHS } from "../paths";
import type { ContentPage } from "../types";
import { mm } from "./shared";

const holes = DEFAULT_MOUNTING_HOLE_CONFIG;

function Body() {
  return (
    <>
      <Section number="01" title="Thickness" kicker="STL EXPORT">
        <Prose>
          <p>
            {ORDER_PANEL_THICKNESS_MM} mm is the working default: rigid enough for a 3U panel up to
            about 20 HP, thin enough that jack bushings and pot shafts still reach their nuts. Above
            30 HP, or with heavy jacks, 2.5 to 3 mm holds better — but check that your parts have
            enough thread left.
          </p>
        </Prose>
      </Section>

      <Section number="02" title="Holes" kicker="TOLERANCES">
        <Prose>
          <ul>
            <li>
              Mounting holes: {holes.diameterMm} mm, a little over the 3.2 mm of the Doepfer
              drawing. A printed hole comes out slightly undersized, and this leaves an M3 screw
              free.
            </li>
            <li>
              Part holes: use the <a href={PAGE_PATHS.drillSizes}>datasheet diameters</a> as they
              are, then test-print a strip with two or three holes before committing to a full
              panel.
            </li>
            <li>
              Print flat, front face on the bed: the face is then as smooth as the build plate, and
              no support touches the visible side.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="03" title="Text and patterns in a second colour" kicker="TWO COLOURS">
        <Prose>
          <p>
            Labels and SVG patterns are raised on the front of the panel, so a two-colour print
            gives legends that will not rub off. The relief has a thickness and a depth it sinks
            into the panel, which is what makes the two colours bond instead of peeling apart.
          </p>
        </Prose>
        <Alert className={measure} tone="warn" title="Keep text at 6 pt or more">
          Below that, strokes fall under about 0.4 mm and the printer smears them.
        </Alert>
      </Section>

      <Section number="04" title="From the editor to the printer" kicker="4 STEPS">
        <Prose>
          <ol>
            <li>Set the width in HP and the format, and place the parts.</li>
            <li>
              Switch the view to 3D and check the mesh: cut-outs, mounting holes and relief all
              appear at the export thickness.
            </li>
            <li>
              Export <strong>STL</strong>, pick the thickness, and slice with the front face down.
            </li>
            <li>
              Print the body in one filament, and pause for the colour change at the layer where the
              relief starts if your printer has no second extruder.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section number="05" title="Checks before printing" kicker="CHECKLIST">
        <Prose>
          <ul>
            <li>
              Knobs and nuts that overlap are outlined in red on the canvas; fix them before
              exporting.
            </li>
            <li>
              Panels wider than {holes.spacingHp} HP get a middle column of mounting holes — keep it
              clear of your parts.
            </li>
            <li>
              Rack space is counted in whole HP: see the{" "}
              <a href={PAGE_PATHS.hpToMm}>HP to mm table</a>, or the{" "}
              <a href={PAGE_PATHS.hpCalculator}>HP and U calculator</a>.
            </li>
          </ul>
        </Prose>
      </Section>
    </>
  );
}

export const printingPage: ContentPage = {
  path: PAGE_PATHS.printing,
  label: "3D printing a panel",
  group: "reference",
  title: "How to 3D print a Eurorack front panel",
  description:
    "Thickness, mounting hole clearance, two-colour text and patterns, and the STL export " +
    "settings that make a 3D printed Eurorack panel fit a real rack.",
  kicker: "GUIDE / 3D PRINTING",
  lead: (
    <>
      Export the panel as an STL at <strong>{ORDER_PANEL_THICKNESS_MM} mm</strong> thick, print it
      face down on the bed, and keep the mounting holes at {holes.diameterMm} mm so an M3 screw
      still passes once the print has shrunk.
    </>
  ),
  facts: [
    { label: "THICKNESS", value: mm(ORDER_PANEL_THICKNESS_MM), unit: "mm" },
    { label: "MOUNTING HOLES", value: `Ø ${mm(holes.diameterMm)}`, unit: "mm" },
    { label: "SMALLEST TEXT", value: "6", unit: "pt" },
    { label: "FRONT FACE", value: "ON THE BED" },
  ],
  Body,
};
