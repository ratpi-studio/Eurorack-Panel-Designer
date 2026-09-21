/**
 * The static content pages. Every measurement on them is read from the modules the editor itself
 * uses, so a page can never quote a number the app no longer applies.
 */

import {
  DEFAULT_MM_PER_HP,
  getRackFormatSpec,
  panelWidthMmForHp,
  PANEL_WIDTH_CLEARANCE_MM,
  type PanelFormat,
} from "../../src/lib/panelFormat";
import { DEFAULT_MOUNTING_HOLE_CONFIG } from "../../src/lib/panelTypes";
import { ORDER_PANEL_THICKNESS_MM } from "../../src/lib/orderCatalog";
import { PANEL_KNOBS, PANEL_PARTS, type KnobId, type PartId } from "../../src/lib/parts";
import { escapeHtml, mm, type ContentPage, type PageLink } from "./layout";
import { REPO_URL } from "./site";

/** Widths Doepfer prints in table 1 of the A-100 construction details. */
const PUBLISHED_HP = new Set([1, 1.5, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 28, 42]);

const TABLE_HP: readonly number[] = [1, 1.5, ...Array.from({ length: 42 }, (_, i) => i + 2)];

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

const FORMATS: readonly { format: PanelFormat; name: string; source: string }[] = [
  {
    format: { rackUnits: 1, oneUSpec: "intellijel", custom: false },
    name: "1U Intellijel",
    source: "Intellijel 1U technical specifications",
  },
  {
    format: { rackUnits: 1, oneUSpec: "pulpLogic", custom: false },
    name: "1U Pulp Logic tile",
    source: "Pulp Logic 1U tiles",
  },
  {
    format: { rackUnits: 2, oneUSpec: "intellijel", custom: false },
    name: "2U row",
    source: "Derived from the rack unit",
  },
  {
    format: { rackUnits: 3, oneUSpec: "intellijel", custom: false },
    name: "3U Eurorack",
    source: "Doepfer A-100 construction details",
  },
  {
    format: { rackUnits: 4, oneUSpec: "intellijel", custom: false },
    name: "4U row",
    source: "Derived from the rack unit",
  },
];

const DOEPFER_URL = "https://doepfer.de/a100_man/a100m_e.htm";
const INTELLIJEL_URL = "https://intellijel.com/support/1u-technical-specifications/";
const PULP_LOGIC_URL = "https://pulplogic.com/1u_tiles/";

function faq(entries: readonly { question: string; answer: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

function hpToMmPage(): ContentPage {
  const rows = TABLE_HP.map((hp) => {
    const pitch = hp * DEFAULT_MM_PER_HP;
    const width = panelWidthMmForHp(hp);
    const published = PUBLISHED_HP.has(hp) ? "Doepfer" : "Derived";
    const label = Number.isInteger(hp) ? `${hp} HP` : `${hp} HP`;
    return `<tr><td>${label}</td><td>${mm(pitch)}</td><td>${mm(width)}</td><td>${published}</td></tr>`;
  }).join("\n");

  return {
    path: "/eurorack-hp-to-mm/",
    label: "HP to mm",
    title: "Eurorack HP to mm: the full conversion table",
    description:
      "1 HP is 5.08 mm on the rack rails, but a Eurorack front panel is cut a little narrower. " +
      "Full HP to mm table from 1 to 42 HP, with the widths Doepfer publishes.",
    lead:
      "<strong>1 HP = 5.08 mm</strong> on the rails. A front panel is cut a few tenths narrower " +
      "than its pitch so modules can be screwed side by side, which is why a 6 HP panel is " +
      `${mm(panelWidthMmForHp(6))} mm wide and not ${mm(6 * DEFAULT_MM_PER_HP)} mm.`,
    structuredData: [
      faq([
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
      ]),
    ],
    bodyHtml: `
<h2>HP to mm, 1 to 42 HP</h2>
<div class="wide">
<table>
<caption>Rail pitch is HP × ${DEFAULT_MM_PER_HP} mm. Panel width is what the panel is actually cut at.</caption>
<thead><tr><th>Width</th><th>Rail pitch (mm)</th><th>Panel width (mm)</th><th>Source</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>

<h2>Why a panel is narrower than its pitch</h2>
<p>If every panel were cut at exactly HP × ${DEFAULT_MM_PER_HP} mm, two modules side by side would
touch and the screws would bind. Doepfer therefore publishes a width per size, and the reduction is
not constant: ${mm(1 * DEFAULT_MM_PER_HP - panelWidthMmForHp(1))} mm at 1 HP,
${mm(6 * DEFAULT_MM_PER_HP - panelWidthMmForHp(6))} mm at 6 HP. For the widths that table leaves
out, a clearance of ${PANEL_WIDTH_CLEARANCE_MM} mm is taken off the pitch.</p>

<h2>Millimeters back to HP</h2>
<p>Divide by ${DEFAULT_MM_PER_HP} and round <em>up</em>: a panel of 63 mm occupies 13 HP of rack
space, because 12 HP would be ${mm(12 * DEFAULT_MM_PER_HP)} mm. Rack space is always counted in
whole HP, even when the panel itself is narrower.</p>

<h2>Sources</h2>
<p class="sources">Widths and the mounting grid come from the
<a href="${DOEPFER_URL}">Doepfer A-100 construction details</a>, table 1. The same numbers are
applied by the editor in <a href="${REPO_URL}/blob/master/src/lib/panelFormat.ts"><code>panelFormat.ts</code></a>.</p>
`,
  };
}

function dimensionsPage(): ContentPage {
  const rows = FORMATS.map(({ format, name, source }) => {
    const spec = getRackFormatSpec(format);
    const step = spec.widthStepHp === 1 ? "1 HP" : `${spec.widthStepHp} HP`;
    return `<tr><td>${escapeHtml(name)}</td><td>${mm(spec.heightMm)}</td><td>${mm(spec.holeOffsetXMm)}</td><td>${mm(spec.holeOffsetYMm)}</td><td>${step}</td><td>${escapeHtml(source)}</td></tr>`;
  }).join("\n");

  const holes = DEFAULT_MOUNTING_HOLE_CONFIG;

  return {
    path: "/eurorack-panel-dimensions/",
    label: "Panel dimensions",
    title: "Eurorack panel dimensions: 3U, 1U, 2U and 4U",
    description:
      "Heights, mounting hole positions and width steps for 3U Eurorack, 1U Intellijel, 1U Pulp " +
      "Logic tiles, and 2U and 4U rows, with the source each number comes from.",
    lead:
      `A 3U Eurorack panel is <strong>${mm(getRackFormatSpec(FORMATS[3].format).heightMm)} mm</strong> high. ` +
      `1U is ${mm(getRackFormatSpec(FORMATS[0].format).heightMm)} mm on the Intellijel standard and ` +
      `${mm(getRackFormatSpec(FORMATS[1].format).heightMm)} mm on Pulp Logic tiles, which do not fit each other's cases.`,
    structuredData: [
      faq([
        {
          question: "How tall is a 3U Eurorack panel?",
          answer: `128.50 mm. A 3U rack row is 133.35 mm, and the rail lips take 4.85 mm of it.`,
        },
        {
          question: "Where do the mounting holes go on a Eurorack panel?",
          answer: `The first column sits ${holes.horizontalOffsetMm} mm from the left edge, the rows ${holes.verticalOffsetMm} mm from the top and bottom, and every other column a whole number of HP from the first. The usual hole is ${holes.diameterMm} mm across, a little over the 3.2 mm of the Doepfer drawing so an M3 screw still passes through a 3D print.`,
        },
      ]),
    ],
    bodyHtml: `
<h2>Every format at a glance</h2>
<table>
<caption>Hole offsets are measured from the left edge, and from the top and bottom edges.</caption>
<thead><tr><th>Format</th><th>Height (mm)</th><th>Hole X (mm)</th><th>Hole Y (mm)</th><th>Width step</th><th>Source</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p>2U and 4U are not published by any brand. They take the rack unit (44.45 mm) multiplied out,
less the 4.85 mm the rail lips take from a 3U panel, so a row built from the same rails fits.</p>

<h2>Mounting holes</h2>
<ul>
<li>The first column is ${holes.horizontalOffsetMm} mm from the left edge; the others sit a whole
number of HP from it, so they land on the ${DEFAULT_MM_PER_HP} mm grid of the rails.</li>
<li>Rows are ${holes.verticalOffsetMm} mm from the top and bottom edges.</li>
<li>Panels wider than ${holes.spacingHp} HP take a column in between, and one always lands near the
right edge.</li>
<li>The default diameter is ${holes.diameterMm} mm, slightly over the 3.2 mm of the Doepfer
drawing, so an M3 screw still passes through a 3D printed panel.</li>
</ul>

<h2>Widths</h2>
<p>Width is counted in HP, and a panel is cut a little under its pitch. The
<a href="/eurorack-hp-to-mm/">HP to mm table</a> gives every width from 1 to 42 HP. Pulp Logic tiles
are the exception: they come in multiples of 6 HP.</p>

<h2>Sources</h2>
<p class="sources">3U from the <a href="${DOEPFER_URL}">Doepfer A-100 construction details</a>,
1U from the <a href="${INTELLIJEL_URL}">Intellijel 1U specifications</a> and from
<a href="${PULP_LOGIC_URL}">Pulp Logic</a>. The editor applies them in
<a href="${REPO_URL}/blob/master/src/lib/panelFormat.ts"><code>panelFormat.ts</code></a>.</p>
`,
  };
}

function drillSizesPage(): ContentPage {
  const partRows = PANEL_PARTS.map((part) => {
    const label = PART_LABELS[part.id];
    const hardware = part.hardwareDiameterMm ? mm(part.hardwareDiameterMm, 2) : "—";
    return `<tr><td>${escapeHtml(label.name)}</td><td>${escapeHtml(label.kind)}</td><td>${mm(part.holeDiameterMm)}</td><td>${hardware}</td><td>${escapeHtml(label.source)}</td></tr>`;
  }).join("\n");

  const knobRows = PANEL_KNOBS.map(
    (knob) =>
      `<tr><td>${escapeHtml(KNOB_LABELS[knob.id])}</td><td>${mm(knob.diameterMm)}</td></tr>`,
  ).join("\n");

  return {
    path: "/eurorack-drill-sizes/",
    label: "Drill sizes",
    title: "Drill sizes for Eurorack panel parts",
    description:
      "Panel hole diameters for Thonkiconn jacks, Alpha 9 mm pots, Bourns PEC11R encoders, " +
      "Dailywell toggles and 3 mm and 5 mm LEDs, each taken from the part's datasheet.",
    lead:
      "A Thonkiconn jack needs a <strong>6 mm</strong> hole, an Alpha 9 mm pot and a Bourns PEC11R " +
      "encoder <strong>7 mm</strong>, a Dailywell sub-mini toggle <strong>5 mm</strong>, a mini " +
      "toggle <strong>6.35 mm</strong>, and LEDs <strong>3</strong> or <strong>5 mm</strong>.",
    structuredData: [
      faq([
        {
          question: "What size hole does a Thonkiconn jack need?",
          answer:
            "6 mm. The bushing of the QingPu PJ398SM is 6 mm across, and its knurled nut covers 7.8 mm on the front of the panel.",
        },
        {
          question: "What hole do Alpha 9 mm potentiometers need?",
          answer:
            "7 mm, for the M7 × 0.75 bushing. The nut and washer cover 12 mm on the front, so two pots need at least that much space between centres before their knobs are considered.",
        },
      ]),
    ],
    bodyHtml: `
<h2>Panel holes</h2>
<table>
<caption>Hardware diameter is the widest part on the front of the panel: nut or locking washer.</caption>
<thead><tr><th>Part</th><th>Type</th><th>Hole Ø (mm)</th><th>Hardware Ø (mm)</th><th>Datasheet</th></tr></thead>
<tbody>
${partRows}
</tbody>
</table>
<p>Drill the hole named above and open it up slightly if the part needs play; going under it means
the bushing will not pass. On a 3D printed panel, print a test piece first: holes usually come out
a little under their nominal size.</p>

<h2>Knob diameters</h2>
<p>The hole is only half of the spacing problem. A knob has to clear its neighbours, and the skirt
is wider than the shaft.</p>
<table>
<thead><tr><th>Knob</th><th>Widest Ø (mm)</th></tr></thead>
<tbody>
${knobRows}
</tbody>
</table>
<p>Two Davies 1900H knobs need at least ${mm(12.7)} mm between centres to touch, and more to be
comfortable. The editor outlines every knob, nut and washer on the canvas and turns the outline red
where two of them overlap.</p>

<h2>Sources</h2>
<p class="sources">Thonkiconn from the QingPu PJ398SM and WQP518MA datasheets; Alpha 9 mm from the
RD901F-40 datasheet; the encoder from the Bourns PEC11R datasheet; the toggles from the Dailywell
1MS and 2MS datasheets. The editor applies them in
<a href="${REPO_URL}/blob/master/src/lib/parts.ts"><code>parts.ts</code></a>.</p>
`,
  };
}

function printingPage(): ContentPage {
  const holes = DEFAULT_MOUNTING_HOLE_CONFIG;
  return {
    path: "/3d-print-eurorack-panel/",
    label: "3D printing a panel",
    title: "How to 3D print a Eurorack front panel",
    description:
      "Thickness, mounting hole clearance, two-colour text and patterns, and the STL export " +
      "settings that make a 3D printed Eurorack panel fit a real rack.",
    lead:
      `Export the panel as an STL at <strong>${ORDER_PANEL_THICKNESS_MM} mm</strong> thick, print it ` +
      `face down on the bed, and keep the mounting holes at ${holes.diameterMm} mm so an M3 screw ` +
      "still passes once the print has shrunk.",
    bodyHtml: `
<h2>Thickness</h2>
<p>${ORDER_PANEL_THICKNESS_MM} mm is the working default: rigid enough for a 3U panel up to about
20 HP, thin enough that jack bushings and pot shafts still reach their nuts. Above 30 HP, or with
heavy jacks, 2.5 to 3 mm holds better — but check that your parts have enough thread left.</p>

<h2>Holes</h2>
<ul>
<li>Mounting holes: ${holes.diameterMm} mm, a little over the 3.2 mm of the Doepfer drawing. A
printed hole comes out slightly undersized, and this leaves an M3 screw free.</li>
<li>Part holes: use the <a href="/eurorack-drill-sizes/">datasheet diameters</a> as they are, then
test-print a strip with two or three holes before committing to a full panel.</li>
<li>Print flat, front face on the bed: the face is then as smooth as the build plate, and no
support touches the visible side.</li>
</ul>

<h2>Text and patterns in a second colour</h2>
<p>Labels and SVG patterns are raised on the front of the panel, so a two-colour print gives legends
that will not rub off. The relief has a thickness and a depth it sinks into the panel, which is what
makes the two colours bond instead of peeling apart. Keep text at 6 pt or more: below that, strokes
fall under about 0.4 mm and the printer smears them.</p>

<h2>From the editor to the printer</h2>
<ol>
<li>Set the width in HP and the format, and place the parts.</li>
<li>Switch the view to 3D and check the mesh: cut-outs, mounting holes and relief all appear at the
export thickness.</li>
<li>Export <strong>STL</strong>, pick the thickness, and slice with the front face down.</li>
<li>Print the body in one filament, and pause for the colour change at the layer where the relief
starts if your printer has no second extruder.</li>
</ol>

<h2>Checks before printing</h2>
<ul>
<li>Knobs and nuts that overlap are outlined in red on the canvas; fix them before exporting.</li>
<li>Panels wider than ${holes.spacingHp} HP get a middle column of mounting holes — keep it clear of
your parts.</li>
<li>Rack space is counted in whole HP: see the <a href="/eurorack-hp-to-mm/">HP to mm table</a>.</li>
</ul>
`,
  };
}

function kicadPage(): ContentPage {
  return {
    path: "/kicad-eurorack-panel/",
    label: "KiCad export",
    title: "Export a Eurorack panel to KiCad (Edge.Cuts)",
    description:
      "Turn a Eurorack front panel into a KiCad board outline: a minimal Edge.Cuts SVG for " +
      "Import Graphics, or a .kicad_pcb holding only Edge.Cuts geometry.",
    lead:
      "The editor exports either a minimal <strong>Edge.Cuts SVG</strong>, imported with " +
      "<code>File → Import Graphics</code>, or a <strong>.kicad_pcb</strong> that contains only " +
      "Edge.Cuts <code>gr_line</code> geometry — no copper, no silkscreen.",
    bodyHtml: `
<h2>Which export to pick</h2>
<table>
<thead><tr><th>Export</th><th>What it holds</th><th>How to open it</th></tr></thead>
<tbody>
<tr><td>KiCad Edge SVG</td><td>Outline and cut-outs as SVG paths</td><td><code>File → Import Graphics → Edge.Cuts</code></td></tr>
<tr><td>KiCad PCB</td><td><code>gr_line</code> geometry on Edge.Cuts only</td><td>Open as a board, or copy into an existing one</td></tr>
</tbody>
</table>

<h2>What the geometry looks like</h2>
<ul>
<li>Circular holes are approximated with 32 segments, which is under the tolerance of every panel
fabricator's cutter.</li>
<li>Cut-outs that overlap each other, or cross the panel edge, are merged into a single outline:
KiCad rejects crossing Edge.Cuts lines. The merged outline is a polygon, and the other cut-outs keep
their own shapes.</li>
<li>The canvas, the SVG export and the STL merge them exactly the same way, so what you see is what
the board gets.</li>
</ul>

<h2>A panel as a PCB</h2>
<p>A PCB front panel is the usual alternative to aluminium or a 3D print: it comes out flat, it is
cheap in small runs, and the silkscreen carries the legend. Draw it here, export Edge.Cuts, then add
your own silkscreen in KiCad — the part holes are already placed at their
<a href="/eurorack-drill-sizes/">datasheet diameters</a>, and the mounting holes on the
<a href="/eurorack-panel-dimensions/">rail grid</a>.</p>
`,
  };
}

export function buildContentPages(): ContentPage[] {
  return [hpToMmPage(), dimensionsPage(), drillSizesPage(), printingPage(), kicadPage()];
}

export function pageLinks(pages: readonly ContentPage[]): PageLink[] {
  return pages.map(({ path, label }) => ({ path, label }));
}
