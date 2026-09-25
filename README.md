![Vercel Deploy](https://deploy-badge.vercel.app/vercel/eurorack-panel-designer-oss8)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/ratpi-studio/Eurorack-Panel-Designer?utm_source=oss&utm_medium=github&utm_campaign=ratpi-studio%2FEurorack-Panel-Designer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Deployments

- Live: [https://www.eurorackpanel.com/](https://www.eurorackpanel.com/) (the apex and the old
  `eurorack-panel-designer-oss8.vercel.app` address redirect to it).
- GitHub Pages: [https://ratpi-studio.github.io/Eurorack-Panel-Designer/](https://ratpi-studio.github.io/Eurorack-Panel-Designer/) redirects to the live site and moves the designs and projects saved there.

# Eurorack Panel Designer

Single-page web app to sketch Eurorack front panels. The canvas mirrors a real panel, 3U by default, or 1U (Intellijel or Pulp Logic), 2U, 4U, or any custom size: convert cm/mm/HP on the fly, drop elements (jacks, pots, switches, LEDs, labels), tweak their properties, and export or save layouts locally.

![Interactive editor demo](./public/images/demo.gif)

## Features

- Canvas-driven editor with zoom, pan, snapping, and optional grid.
- Live 3D view of the panel as exported to STL: show the 2D editor, the 3D view, or both side by side. The 3D model follows every edit and uses the panel and design colors.
- Printable text and SVG patterns, raised in the design color: five bundled fonts, and text that clears the pattern around it or merges into it.
- Automatic conversion between centimeters, millimeters, and HP, with panels cut at the width Doepfer publishes (a 6 HP panel is 30.00 mm, not 30.48 mm) and the 3U height of 128.5 mm.
- Panel formats: 3U Eurorack (128.5 mm), 1U Intellijel (39.65 mm), 1U Pulp Logic tiles (43.18 mm, multiples of 6 HP), 2U and 4U rows, or a custom size in millimeters.
- Library of panel elements with editable geometry, rotation, and labels.
- Real parts with the hole to drill for them, from their datasheets (Thonkiconn jacks, Alpha 9 mm pots, Bourns PEC11R encoders, Dailywell toggles, LEDs) and the knob that goes on each knob, outlined on the canvas with their nuts and washers, in red where they run into each other.
- Generated mounting holes that update with the panel width, on the 5.08 mm grid of the rails: first column 7.5 mm from the left edge, the others a whole number of HP from it.
- Local projects (save/load/delete) plus JSON, PNG, SVG, KiCad Edge.Cuts (SVG or `.kicad_pcb`), and STL exports (vector extrusion, thickness picker, and live 3D preview).

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) with client-side routing.
- Strict TypeScript, unit-tested core logic.
- State managed with [Zustand](https://zustand-demo.pmnd.rs/).
- Styling via [vanilla-extract](https://vanilla-extract.style/).
- Icons from [Lucide](https://lucide.dev/).

## Pages for search engines and AI assistants

The app is a single-page app, and no major AI crawler runs JavaScript, so the build also publishes
plain HTML that needs none:

- `index.html` carries the description, Open Graph tags and a `SoftwareApplication` JSON-LD block,
  plus a static summary inside `#root` that React replaces when it mounts.
- `src/seo/` holds the content pages: the HP and U calculator (`/eurorack-hp-calculator/`) and the
  reference pages (`/eurorack-hp-to-mm/`, `/eurorack-panel-dimensions/`, `/eurorack-drill-sizes/`,
  `/3d-print-eurorack-panel/`, `/kicad-eurorack-panel/`). They are React pages built with the
  [UI kit](#ui-kit), rendered to plain HTML at build time by `scripts/seo/plugin.ts`, along with
  `sitemap.xml`, `robots.txt`, `llms.txt` and `llms-full.txt`. Their styles are a stylesheet
  written at build time, with the dark background inline in the head so no white shows before it,
  and the browser cross-fades from one page to the next. Only the calculator runs in the browser:
  it is an island, hydrated over the HTML the build rendered for it; the other pages load no
  script. Every measurement on the pages is read from `src/lib`, so a page cannot quote a number
  the editor no longer applies.
- `vp dev` serves the very files the build makes, built on the first request and again after a
  source file changes: reload the page to see a change.
- `public/images/og.png` is the link preview card, drawn by `scripts/generate-og-image.py` and
  committed; the build needs no Python.

Add a page by adding it to `CONTENT_PAGES` in `src/seo/pages/index.ts`: the navigation, the footer,
the sitemap and `llms.txt` follow on their own.

### UI kit

The content pages use UIPIRATE (`@salnika/uipirate`), the Ratpi UI kit: React components and
vanilla-extract tokens, set in Geist and Geist Mono (SIL OFL, served from `public/fonts/ui/`). The
editor keeps its own styles.

The kit is not on the public npm registry, so the repository vendors the package as
`vendor/salnika-uipirate-<version>.tgz`: installs need no token, locally, in CI and on Vercel. To
update it, pack the new version in the kit's repository (`yarn pack`), put the tarball in `vendor/`
in place of the old one, and point the dependency at it:

```bash
pnpm add @salnika/uipirate@file:vendor/salnika-uipirate-<version>.tgz
```

## Getting started

1. Install [Node.js 20+](https://nodejs.org/).
2. Install the [Vite+ CLI (`vp`)](https://viteplus.dev/) globally.
3. Install dependencies:
   ```bash
   vp install
   ```
   This repository is configured for `pnpm`, and `vp` will use it automatically.
4. Start the dev server:
   ```bash
   vp dev
   ```
   Vite serves the app at `http://localhost:5173` by default.

## Commands

| Command        | Description                               |
| -------------- | ----------------------------------------- |
| `vp install`   | Install dependencies through `pnpm`.      |
| `vp dev`       | Run the Vite dev server with HMR.         |
| `vp run build` | Type-check then build the production SPA. |
| `vp preview`   | Preview the production build locally.     |
| `vp test`      | Execute Vitest unit tests.                |
| `vp lint`      | Run oxlint with the project config.       |
| `vp check`     | Run formatting, linting, and type checks. |

## Usage tips

- Adjust panel width through either the mm or HP input; the other unit updates instantly and the canvas resizes. Panels are a few tenths of a millimeter narrower than their HP pitch, as Doepfer's A-100 construction details list them, so modules can be screwed side by side; the widths that table leaves out are cut `PANEL_WIDTH_CLEARANCE_MM` (0.35 mm) under the grid. The height is always 128.5 mm (3U).
- Pick the height of the panel in the **Format** bar of the width box: 1U, 2U, 3U (the default), or 4U. At 1U, choose **Intellijel** (39.65 mm high) or **Pulp Logic** (43.18 mm tiles in multiples of 6 HP, holes 5.08 mm from the edge); the two do not fit each other's cases. No brand publishes 2U or 4U, so those take the rack unit less the rail lips, as 3U does (84.05 mm and 172.95 mm). **Custom size** frees the width and height (5 to 1000 mm); unchecking it brings the format back. Changing the format keeps the elements in place and moves the mounting holes where the format puts them. The numbers and their sources are in `src/lib/panelFormat.ts`. Etsy orders only take 3U panels for now.
- Mounting holes follow the rails rather than the panel edges: the first column sits 7.5 mm from the left edge, every other column a whole number of HP from it, and the rows 3 mm from the top and bottom. Panels wider than the spacing (10 HP) take a column in between, and one always lands near the right edge. Their diameter is 3.4 mm by default, a little over the 3.2 mm of the Doepfer drawing, so an M3 screw still passes through a 3D print.
- Pick an element in the palette, click on the canvas to place it, then drag to reposition. Use the right-hand panel to fine-tune coordinates, rotation, or dimensions.
- Actions are icon buttons: hover one, or focus it with the keyboard, to see what it does. Text stays on the order button, in menus and dialogs, and on the **Tools** and **Properties** buttons of small screens, which have no hover.
- The project controls sit at the top of the right-hand panel: the project name (click it to rename), a row of file actions (new, save, import a JSON design, import a reference image) with the export button on its right, which exports in the last format picked in its menu, then the saved projects with their open and delete buttons. When no saved project is picked, the delete button resets the design.
- The right-hand panel keeps the project controls on top and three tabs below: **Display** (grid, snapping, dimensions, knobs and nuts, colors, reset view), **Properties** (the selected element, the mounting holes or the reference image), and **Components**. Selecting something on the canvas opens Properties, unless Components is open. The open tab is remembered.
- **Components** lists every placed element. Click a row to select it (Shift or ⌘/Ctrl-click to add it to the selection), double-click its name to rename it, and use its buttons to hide, lock, or delete it. Hidden components stay in the project but are left out of the canvas, the 3D view, every export, and orders; the eye button above the list (**Show all hidden components**) brings them back. Locked components cannot be picked or moved on the canvas, but can still be selected and edited from the list.
- Placed cut-outs are tinted with their palette color and show their measurements (diameter inside round holes, width × height inside other shapes); the selected element gets dimension lines along its sides. Toggle them with the **Dimensions** button in the Display tab. Exports keep using the panel and design colors.
- Jacks, knobs, switches, and LEDs stand for a real part, chosen in the **Part** menu of their properties: new ones start as the most common part (Thonkiconn, Alpha 9 mm pot, Dailywell sub-mini toggle, 3 mm LED). A part sets the hole to drill for it, from its datasheet; change the diameter to leave some play, and **Use Ø… mm** brings the recommended one back. **Custom hole** keeps a hole of your own, and switches choose a round or a rectangular one. Knobs also pick the **Knob** that goes on them.
- The canvas outlines the knob, nut, or washer of each part, dashed in the element's color, and in red when it runs into another component: two knobs too close together, or a knob over an LED. The properties of the element warn about it too, and so does the order dialog. Toggle the outlines with the **Knobs and nuts** button in the Display tab; the exports leave them out. The part catalog and the sources of its numbers are in `src/lib/parts.ts`.
- Drag the handles around the selected element to resize it: round holes grow around their center, other shapes keep the opposite side in place, and text scales its font size. Sizes snap to 0.5 mm steps unless `Shift` is held.
- Switch the render area between the **2D**, **3D**, and **2D and 3D side by side** views with the buttons above it; the choice is remembered. In 3D, drag to rotate, right-drag to pan, and scroll to zoom. **Reset view** reframes both views. The 3D view shows the STL geometry at the thickness set in the STL export dialog (2 mm by default): cut-outs, mounting holes, text and SVG relief on the front, and inserts on the back. Complex SVG artwork refreshes the 3D view once edits pause, so dragging in 2D stays smooth.
- Panels print in two colors: the panel color for the body, and the design color for every text and SVG pattern, raised on the front. Text and patterns share one relief, set from the properties of either (**Relief**: thickness, and how deep it sinks into the panel so both colors bond); they are cut away over cut-outs.
- Place **Text** from the palette, then set its content, **Font**, size, and **Color** (the design color, which also applies to every SVG pattern) in the properties. The five fonts are bold or technical faces that print well at small sizes; a warning appears when text is likely too small to print (under 6 pt, or strokes under about 0.4 mm) or uses characters its font lacks. The canvas, PNG, SVG, and STL draw the same outlines, and the SVG export turns text into paths.
- Over an SVG pattern, text either clears the pattern around it (**Clear the pattern around the text**, with a **Clearance** in mm, 1 mm by default) or merges into it at the same height (**Merge into the pattern**), even where that makes it harder to read.
- Keep `Shift` pressed to temporarily disable snapping, `Esc` to cancel placement, `⌘/Ctrl + Z` and `⌘/Ctrl + Shift + Z` for undo/redo.
- Shift-click elements or drag a marquee on the canvas to build a multi-selection, then drag anywhere on the canvas to move the entire group or press Delete to remove it in one go.
- A click on the canvas picks what you see under the pointer, even under a bigger element: cut-outs first, as they show through texts and SVG patterns, then the smallest element. An SVG pattern that covers the panel is selected wherever nothing else is, and elements placed from the palette land on patterns and texts instead of selecting them.
- Save named projects to the browser, export/import JSON for backups, render the canvas as PNG/SVG, export KiCad Edge.Cuts, or export a clean STL: choose STL in the export dropdown, set thickness in mm, and use the live 3D preview to inspect the mesh before downloading.

## Ordering a print on Etsy (optional)

Buyers can order their panel 3D printed through a single Etsy listing:

1. **Order this panel** (project panel) opens a dialog with the print preview in the chosen filaments (panel, then text and patterns), the price, and checks such as the maximum width.
2. **Get my design code** stores the design with Vercel Blob under a code like `EPD-7K3Q-9XMB` and opens its page at `/order/<code>`.
3. That page shows the design in 3D, the code, and what to pick on Etsy. **Buy on Etsy** copies the code and opens the listing, where the buyer chooses the width and pastes the code in the personalization field.
4. To print an order, open `/order/<code>` with the code from the Etsy order: **Download STL** builds the print file at the order thickness, and **Download design (JSON)** opens in the designer with **Import a JSON design**.

Prices, widths, and filaments live in `src/lib/orderCatalog.ts`: 9 € + 1 € per HP, from 1 to 42 HP, in white, black, or sky blue. `api/order.ts` repeats the widths and filament ids to validate designs; its tests check that both agree.

To enable it on Vercel:

1. **Enable Vercel Blob** on the project. It injects `BLOB_READ_WRITE_TOKEN` for `api/order.ts`, which stores each design as `orders/<code>/design.json` (public blobs; the API never shares their URLs).
2. **Create the Etsy listing**:
   - one variation, "Width", with one option per HP from 1 to 42 HP, each priced like `orderPriceEur` (12 HP = 21 €);
   - a required personalization text field for the code, with instructions such as "Paste your EPD-… code from the Eurorack Panel Designer" (Etsy allows 120 characters).
3. **Set `VITE_ETSY_LISTING_URL`** to the listing URL, or to its Etsy Share & Save link, which gives back part of the fees on orders from the designer.
4. **Add a rate limit** in the Vercel Firewall on `/api/order`, for example 10 requests per 10 minutes per IP. Every stored design uses Blob operations, which the Hobby plan caps each month.
5. **Turn the feature flag on** with `VITE_ORDERING_ENABLED=true`, then redeploy: both variables are read at build time. You can set it on the Preview environment first to try the whole flow on a preview deployment.

While the flag is off (the default), the order button is hidden and `/api/order` refuses new designs. Codes already given keep opening their page, so orders placed before can still be printed.

The `/order/:id` rewrite is already configured in `vercel.json`.

## KiCad Edge.Cuts export

- Open the export dropdown and pick either **KiCad Edge SVG** (minimal Edge.Cuts-only SVG) or **KiCad PCB** (minimal `.kicad_pcb` with Edge.Cuts lines).
- The SVG is ready for KiCad via `File → Import Graphics → Edge.Cuts`.
- The `.kicad_pcb` contains only Edge.Cuts `gr_line` geometry (outline, circular holes approximated with 32 segments, rectangular cutouts). No copper or silkscreen is added.
- Cut-outs that overlap each other or cross the panel edge are merged into a single outline, as in the STL, because KiCad rejects crossing Edge.Cuts lines. The merged outline is a polygon; the other cut-outs keep their own shapes. The SVG export and the canvas merge them the same way, so their overlaps stay open.

## Contributing

Issues, feature ideas, and pull requests are welcome. Please open a discussion before large changes and keep business logic within `src/lib` modules so it remains testable. Keep docs in English.

## License

Distributed under the [MIT License](LICENSE). Feel free to fork, remix, and build on the project.

The fonts in `public/fonts/` (Roboto, Barlow Condensed, JetBrains Mono, Michroma, Orbitron) are distributed under the [SIL Open Font License 1.1](https://openfontlicense.org); each folder holds the font's license.
