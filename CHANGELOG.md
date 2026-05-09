# Changelog

## 0.7.0 - 2026-05-08

- Added per-panel color selection: pick a panel substrate color and a separate design color from four presets (white, black, red, sky blue). The whole canvas, PNG export, and SVG export reflect the choices.
- Added an "Order on Etsy" entry to the export menu: serializes the current design + a thumbnail PNG to Vercel Blob, redirects to a recap page at `/order/<id>`, and points to a configurable Etsy listing for checkout. Acheteurs paste the design ID in the Etsy personalization note.
- New serverless functions under `api/order` (POST upload + GET resolver). Configure `VITE_ETSY_LISTING_URL`, `VITE_PRICE_BASE_EUR`, `VITE_PRICE_PER_HP_EUR`, and enable Vercel Blob to use them.

## 0.6.0 - 2026-05-08

- Added an "SVG artwork" element: drop your own SVG files onto the panel or pick from a built-in library of 10 seamless patterns, with adjustable size, color, and 3D relief depth.
- SVG artwork now renders correctly in the 3D STL export, including `<pattern>` tilings and stroked paths.
- STL export is dramatically faster (~100× on panels with SVG artwork) thanks to a new polygon-clipping pipeline that replaces the previous rasterized height-map.
- Fixed bundled SVG patterns appearing transparent in the editor by preserving local `url(#…)` paint references through the masking step.

## 0.5.1 - 2026-01-24

- STL export dialog now supports a custom file name.
- Fixed the export dialog closing when releasing a text selection outside the modal.

## 0.5.0 - 2025-12-13

- Added insert item for pcb mount

## 0.4.1 - 2025-12-12

- Added live distance guides from the element being placed to its nearest neighbours to help fine-tune spacing.

## 0.4.0 - 2025-12-12

- Added a global “Image” button in Projects to import a reference image layer at any time.
- Reference images now render on the canvas with selection/drag support and dedicated controls.

## 0.3.0 - 2025-12-11

- Added draggable clearance guide lines with live distance labels to top/bottom edges.
- Mounting holes are now enabled per-element instead of globally, keeping other elements untouched.
- PNG export now crops to just the panel area (no surrounding workspace).
- General polish and version bump.

## 0.2.0 - 2024-12-29

- Added automatic “mounting holes” controls inside the element properties panel with snap-aware rotation slider.
- Sidebars now scroll independently while the main canvas stays fixed.
- Introduced optional per-element screw-hole generation plus updated exports/rendering to match.

## 0.1.1 - 2024-12-29

- Added mounting-hole configuration panel in the UI to tweak diameter and switch between round and slotted hardware.
- Fixed mounting holes overflowing at narrow widths by clamping offsets and enforcing a minimum spacing between columns.
- Updated SVG/KiCad/STL exports so slotted mounting holes are represented correctly.
- Introduced this changelog modal content and bumped the package version.

## 0.1.0 - 2024-12-10

- Initial public release.
