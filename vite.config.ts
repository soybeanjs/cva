import { defineConfig } from 'vite-plus';
import { fmt, lint } from '@soybeanjs/oxc-config';

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  fmt,
  lint,
  resolve: {
    tsconfigPaths: true
  },
  pack: {
    entry: ['src/colord.ts', 'src/index.ts', 'src/palette/index.ts', 'src/plugins/**/*.ts'],
    platform: 'neutral',
    dts: true
  },
  test: {
    globals: false
  }
});
