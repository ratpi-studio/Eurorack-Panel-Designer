import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

const sentryEnvFile = path.resolve(__dirname, '.env.sentry');

const changelogVirtualId = 'virtual:changelog';
const resolvedChangelogVirtualId = `\0${changelogVirtualId}`;
const changelogPath = path.resolve(__dirname, 'CHANGELOG.md');

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
      const [rawVersion, rawDate = ''] = header.split(/\s+-\s+/, 2);
      const version = (rawVersion ?? '').trim().replace(/^v/i, '');
      const date = (rawDate ?? '').trim();

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
    name: 'eurorack-changelog',
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

      const markdown = readFileSync(changelogPath, 'utf8');
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

      server.ws.send({ type: 'full-reload' });
      return [];
    }
  };
}

const readLocalSentryEnv = () => {
  if (!existsSync(sentryEnvFile)) {
    return {};
  }

  const data = readFileSync(sentryEnvFile, 'utf8');
  return data.split(/\r?\n/).reduce<Record<string, string>>((acc, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      return acc;
    }

    const [key, ...rest] = line.split('=');
    if (!key) {
      return acc;
    }

    acc[key] = rest.join('=').trim();
    return acc;
  }, {});
};

export default defineConfig(({ mode }) => {
  const localSentryEnv = readLocalSentryEnv();
  Object.entries(localSentryEnv).forEach(([key, value]) => {
    if (value && !process.env[key]) {
      process.env[key] = value;
    }
  });

  const env = loadEnv(mode, process.cwd(), '');
  const releaseName = env.VITE_SENTRY_RELEASE || env.SENTRY_RELEASE || localSentryEnv.SENTRY_RELEASE;

  if (releaseName) {
    if (!env.VITE_SENTRY_RELEASE) {
      env.VITE_SENTRY_RELEASE = releaseName;
      process.env.VITE_SENTRY_RELEASE = releaseName;
    }

    if (!env.SENTRY_RELEASE) {
      env.SENTRY_RELEASE = releaseName;
      process.env.SENTRY_RELEASE = releaseName;
    }
  }

  const useSentry = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);

  return {
    plugins: [
      vanillaExtractPlugin(),
      changelogPlugin(),
      react(),
      ...(useSentry
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              authToken: env.SENTRY_AUTH_TOKEN,
              telemetry: false,
              release: {
                ...(releaseName ? { name: releaseName } : {}),
                inject: true
              },
              sourcemaps: {
                assets: './dist/assets/**'
              }
            })
          ]
        : [])
    ],
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }
            if (/node_modules\/react/i.test(id)) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/three')) {
              return 'three';
            }
            if (id.includes('node_modules/@sentry')) {
              return 'sentry';
            }
            if (id.includes('node_modules/zustand')) {
              return 'zustand';
            }
            if (id.includes('node_modules/react-hot-toast')) {
              return 'react-hot-toast';
            }
            return 'vendor';
          }
        }
      }
    },
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@lib': path.resolve(__dirname, 'src/lib'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@i18n': path.resolve(__dirname, 'src/i18n'),
        '@styles': path.resolve(__dirname, 'src/styles')
      }
    }
  };
});
