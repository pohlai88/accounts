import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['../../tests/setup.ts'],
    globals: true,
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'test/**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98
        }
      }
    }
  },
  resolve: {
    alias: {
      '@aibos/accounting': resolve(__dirname, './src'),
      '@aibos/auth': resolve(__dirname, '../auth/src'),
      '@aibos/contracts': resolve(__dirname, '../contracts/src'),
      '@aibos/db': resolve(__dirname, '../db/src'),
      '@aibos/utils': resolve(__dirname, '../utils/src')
    }
  }
})
