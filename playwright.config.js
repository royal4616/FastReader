import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 180000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'VITE_BASE=/ npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/FastReader/',
    reuseExistingServer: !process.env.CI,
    timeout: 180000
  }
})
