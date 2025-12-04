import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig(async ({ mode }) => {
  const baseConfig =
    typeof viteConfig === 'function'
      ? await viteConfig({
          command: 'serve',
          mode: mode ?? 'test',
          isSsrBuild: false,
          isPreview: false
        })
      : await viteConfig;

  return mergeConfig(baseConfig, {
    test: {
      include: ['src/lib/**/*.test.ts'],
      passWithNoTests: false
    }
  });
});
