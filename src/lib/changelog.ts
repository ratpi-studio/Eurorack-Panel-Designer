import { changelogEntries as generatedChangelogEntries } from 'virtual:changelog';

export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

export const changelogEntries: ChangelogEntry[] = generatedChangelogEntries;
