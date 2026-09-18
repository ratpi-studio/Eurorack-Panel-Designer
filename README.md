![Vercel Deploy](https://deploy-badge.vercel.app/vercel/eurorack-panel-designer-oss8)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/ratpi-studio/Eurorack-Panel-Designer?utm_source=oss&utm_medium=github&utm_campaign=ratpi-studio%2FEurorack-Panel-Designer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Deployments

- Vercel: [https://eurorack-panel-designer-oss8.vercel.app/](https://eurorack-panel-designer-oss8.vercel.app/)
- GitHub Pages: [https://ratpi-studio.github.io/Eurorack-Panel-Designer/](https://ratpi-studio.github.io/Eurorack-Panel-Designer/) redirects to the Vercel deployment and moves the designs and projects saved there.

# Eurorack Panel Designer

Single-page web app to sketch Eurorack front panels. The canvas mirrors a real 3U panel: convert cm/mm/HP on the fly, drop elements (jacks, pots, switches, LEDs, labels), tweak their properties, and export or save layouts locally.

![Interactive editor demo](./public/images/demo.gif)

## Features

- Canvas-driven editor with zoom, pan, snapping, and optional grid.
- Live 3D view of the panel as exported to STL: show the 2D editor, the 3D view, or both side by side. The 3D model follows every edit and uses the panel and design colors.
- Automatic conversion between centimeters, millimeters, and HP.
- Library of panel elements with editable geometry, rotation, and labels.
- Generated mounting holes that update with the panel width.
- Local projects (save/load/delete) plus JSON, PNG, SVG, KiCad Edge.Cuts (SVG or `.kicad_pcb`), and STL exports (vector extrusion, thickness picker, and live 3D preview).

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) with client-side routing.
- Strict TypeScript, unit-tested core logic.
- State managed with [Zustand](https://zustand-demo.pmnd.rs/).
- Styling via [vanilla-extract](https://vanilla-extract.style/).

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

- Adjust panel width through either the mm or HP input; the other unit updates instantly and the canvas resizes.
- Pick an element in the palette, click on the canvas to place it, then drag to reposition. Use the right-hand panel to fine-tune coordinates, rotation, or dimensions.
- Placed cut-outs are tinted with their palette color and show their measurements (diameter inside round holes, width × height inside other shapes); the selected element gets dimension lines along its sides. Toggle them with **Dimensions** in the Display panel. Exports keep using the panel and design colors.
- Drag the handles around the selected element to resize it: round holes grow around their center, other shapes keep the opposite side in place, and text scales its font size. Sizes snap to 0.5 mm steps unless `Shift` is held.
- Switch the render area between **2D**, **3D**, and **2D + 3D** with the buttons above it; the choice is remembered. In 3D, drag to rotate, right-drag to pan, and scroll to zoom. **Reset view** reframes both views. The 3D view shows the STL geometry at the thickness set in the STL export dialog (2 mm by default): cut-outs, mounting holes, SVG relief on the front, and inserts on the back, but not text labels. Complex SVG artwork refreshes the 3D view once edits pause, so dragging in 2D stays smooth.
- Keep `Shift` pressed to temporarily disable snapping, `Esc` to cancel placement, `⌘/Ctrl + Z` and `⌘/Ctrl + Shift + Z` for undo/redo.
- Shift-click elements or drag a marquee on the canvas to build a multi-selection, then drag anywhere on the canvas to move the entire group or press Delete to remove it in one go.
- Save named projects to the browser, export/import JSON for backups, render the canvas as PNG/SVG, export KiCad Edge.Cuts, or export a clean STL: choose STL in the export dropdown, set thickness in mm, and use the live 3D preview to inspect the mesh before downloading.

## Etsy ordering (optional)

The export menu includes an **"Order on Etsy"** entry that uploads the current design + a thumbnail PNG to Vercel Blob and redirects to a recap page at `/order/<id>`. The recap shows the panel preview, color choices, the computed price, and a button that points to a single Etsy listing where buyers paste the design ID in the personalization note.

To enable on a Vercel deployment:

1. **Enable Vercel Blob** on the project — this auto-injects `BLOB_READ_WRITE_TOKEN` for the serverless functions in `api/`.
2. **Configure environment variables** (Vercel dashboard or `.env.local` for local `vercel dev`):
   - `VITE_ETSY_LISTING_URL` — the Etsy listing buyers are sent to.
   - `VITE_PRICE_BASE_EUR` — base price in euros (default `8`).
   - `VITE_PRICE_PER_HP_EUR` — price per HP (default `1.5`). Final price = base + widthHp × perHp.
   - Optionally set `PRICE_BASE_EUR` / `PRICE_PER_HP_EUR` for the server-side recompute in `api/order.ts`.
3. The rewrite for `/order/:id` is already configured in `vercel.json`.

When a customer places the Etsy order, you'll receive the design ID in the personalization note. Fetch the panel JSON / thumbnail from the Vercel Blob URLs (visible in the Vercel dashboard) to print it.

See `.env.example` for the full list of variables.

## KiCad Edge.Cuts export

- Open the export dropdown and pick either **KiCad Edge SVG** (minimal Edge.Cuts-only SVG) or **KiCad PCB** (minimal `.kicad_pcb` with Edge.Cuts lines).
- The SVG is ready for KiCad via `File → Import Graphics → Edge.Cuts`.
- The `.kicad_pcb` contains only Edge.Cuts `gr_line` geometry (outline, circular holes approximated with 32 segments, rectangular cutouts). No copper or silkscreen is added.
- Cut-outs that overlap each other or cross the panel edge are merged into a single outline, as in the STL, because KiCad rejects crossing Edge.Cuts lines. The merged outline is a polygon; the other cut-outs keep their own shapes. The SVG export and the canvas merge them the same way, so their overlaps stay open.

## Contributing

Issues, feature ideas, and pull requests are welcome. Please open a discussion before large changes and keep business logic within `src/lib` modules so it remains testable. Keep docs in English.

## License

Distributed under the [MIT License](LICENSE). Feel free to fork, remix, and build on the project.
