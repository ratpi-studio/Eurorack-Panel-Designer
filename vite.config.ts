import path from 'node:path';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const releaseName = env.VITE_SENTRY_RELEASE || env.SENTRY_RELEASE;
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
