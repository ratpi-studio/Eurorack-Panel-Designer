import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

const sentryEnvFile = path.resolve(__dirname, '.env.sentry');

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
      sourcemap: true
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
