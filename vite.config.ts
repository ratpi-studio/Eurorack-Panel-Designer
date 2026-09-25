import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite-plus";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

import { chunkCycleGuardPlugin } from "./scripts/chunkCycleGuard";
import { seoPagesPlugin } from "./scripts/seo/plugin";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const changelogVirtualId = "virtual:changelog";
const resolvedChangelogVirtualId = `\0${changelogVirtualId}`;
const changelogPath = path.resolve(configDir, "CHANGELOG.md");

interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

function parseChangelogMarkdown(markdown: string): ChangelogEntry[] {
  const lines = markdown.split(/\r?\n/);
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headerMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headerMatch) {
      const header = headerMatch[1].trim();
      const [rawVersion, rawDate = ""] = header.split(/\s+-\s+/, 2);
      const version = (rawVersion ?? "").trim().replace(/^v/i, "");
      const date = (rawDate ?? "").trim();

      if (!version) {
        currentEntry = null;
        continue;
      }

      currentEntry = { version, date, highlights: [] };
      entries.push(currentEntry);
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    const bulletMatch = line.match(/^\s*-\s+(.*)$/);
    if (bulletMatch) {
      const text = bulletMatch[1].trim();
      if (text) {
        currentEntry.highlights.push(text);
      }
    }
  }

  return entries;
}

function changelogPlugin(): Plugin {
  return {
    name: "eurorack-changelog",
    resolveId(id) {
      if (id === changelogVirtualId) {
        return resolvedChangelogVirtualId;
      }
      return null;
    },
    load(id) {
      if (id !== resolvedChangelogVirtualId) {
        return null;
      }

      this.addWatchFile(changelogPath);

      const markdown = readFileSync(changelogPath, "utf8");
      const entries = parseChangelogMarkdown(markdown);

      return `export const changelogEntries = ${JSON.stringify(entries, null, 2)};\n`;
    },
    configureServer(server) {
      server.watcher.add(changelogPath);
    },
    handleHotUpdate({ file, server }) {
      if (path.resolve(file) !== changelogPath) {
        return [];
      }

      const module = server.moduleGraph.getModuleById(resolvedChangelogVirtualId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [module];
      }

      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}

const activeMode = process.env.MODE ?? process.env.NODE_ENV ?? "development";
const env = loadEnv(activeMode, process.cwd(), "");
const basePath = env.VITE_BASE_PATH || "/";

// Sentry only reports from official deployments: Vercel builds of this repository, or builds that
// set SENTRY_ENVIRONMENT explicitly. Local and fork builds leave it disabled.
const vercelTargetEnv = process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV;
const isVercelFork =
  Boolean(process.env.VERCEL_GIT_REPO_OWNER) &&
  process.env.VERCEL_GIT_REPO_OWNER !== "ratpi-studio";
const sentryEnvironment =
  env.SENTRY_ENVIRONMENT || (vercelTargetEnv && !isVercelFork ? `vercel-${vercelTargetEnv}` : "");
// Named after the commit. On Vercel production, the Sentry plugin attaches commits and a deploy to it.
const sentryRelease =
  env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";

// Read by src/instrument.ts and by the boot error reporter in index.html.
process.env.VITE_SENTRY_DSN =
  "https://05489173dd52acef4232f82e99d559a2@o4509397199486976.ingest.de.sentry.io/4510476688359504";
process.env.VITE_SENTRY_ENVIRONMENT = sentryEnvironment;
process.env.VITE_SENTRY_RELEASE = sentryRelease;
// The tunnel is a Vercel Function (api/sentry-tunnel.ts), so only Vercel builds can use it.
process.env.VITE_SENTRY_TUNNEL = vercelTargetEnv ? "/api/sentry-tunnel" : "";

const useSentry = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    plugins: ["react", "import", "typescript", "vitest"],
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    ignorePatterns: ["dist/**"],
    options: {},
  },
  test: {
    include: ["src/lib/**/*.test.ts", "src/seo/**/*.test.ts"],
    passWithNoTests: false,
  },
  base: basePath,
  plugins: [
    vanillaExtractPlugin(),
    changelogPlugin(),
    chunkCycleGuardPlugin(),
    seoPagesPlugin(basePath),
    react(),
    ...(useSentry
      ? [
          sentryVitePlugin({
            org: env.SENTRY_ORG,
            project: env.SENTRY_PROJECT,
            authToken: env.SENTRY_AUTH_TOKEN,
            telemetry: false,
            release: {
              ...(sentryRelease ? { name: sentryRelease } : {}),
              inject: true,
            },
            sourcemaps: {
              assets: "./dist/assets/**",
            },
          }),
        ]
      : []),
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
  resolve: {
    alias: {
      "@components": path.resolve(configDir, "src/components"),
      "@lib": path.resolve(configDir, "src/lib"),
      "@store": path.resolve(configDir, "src/store"),
      "@i18n": path.resolve(configDir, "src/i18n"),
      "@styles": path.resolve(configDir, "src/styles"),
    },
  },
});
