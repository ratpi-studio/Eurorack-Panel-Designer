export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

export const changelogEntries: ChangelogEntry[] = [
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

