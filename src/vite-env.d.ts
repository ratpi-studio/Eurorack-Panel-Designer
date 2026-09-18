/// <reference types="vite-plus/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_RELEASE?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_TUNNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "virtual:changelog" {
  export const changelogEntries: Array<{
    version: string;
    date: string;
    highlights: string[];
  }>;
}
