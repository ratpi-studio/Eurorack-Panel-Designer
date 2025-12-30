# Changelog

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
