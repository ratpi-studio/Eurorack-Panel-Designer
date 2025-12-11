export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.4.0',
    date: '2025-12-12',
    highlights: [
      'Reference images can be imported via the Projects panel and dragged on the canvas.',
      'Dedicated reference image controls for position, size, rotation, and opacity.'
    ]
  },
  {
    version: '0.3.0',
    date: '2025-12-11',
    highlights: [
      'Added draggable clearance guide lines with distance labels to the nearest edge.',
      'Mounting holes can now be toggled per element rather than globally.',
      'PNG export now crops to only the panel area.'
    ]
  },
  {
    version: '0.1.1',
    date: '2024-12-29',
    highlights: [
      'Added the mounting-hole settings panel with diameter and slot controls.',
      'Clamped mounting holes to the panel bounds and enforced minimum spacing.',
      'Aligned SVG/KiCad/STL exports and the canvas with the new slotted holes.',
      'Introduced the in-app changelog modal content.'
    ]
  },
  {
    version: '0.1.0',
    date: '2024-12-10',
    highlights: ['Initial public release.']
  }
];
