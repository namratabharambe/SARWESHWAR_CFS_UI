import { defineConfig } from 'vitest/config';
import path from 'path';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest-setup.ts'],
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, './src/app'),
      core: path.resolve(__dirname, './src/app/core'),
      shared: path.resolve(__dirname, './src/app/shared'),
      environment: path.resolve(__dirname, './src/environments'),
    },
  },
});
