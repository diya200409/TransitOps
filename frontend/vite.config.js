import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    // Use jsdom to simulate a browser environment
    environment: 'jsdom',
    // Run setup file before each test to configure jest-dom matchers
    setupFiles: './src/test/setup.js',
    // Make test APIs (describe, it, expect) globally available without imports
    globals: true,
    // Exclude Playwright/e2e tests
    exclude: ['**/node_modules/**', '**/e2e/**', 'test_e2e.py'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
})
