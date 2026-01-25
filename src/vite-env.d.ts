/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:changelog' {
  export const changelogEntries: Array<{
    version: string;
    date: string;
    highlights: string[];
  }>;
}
