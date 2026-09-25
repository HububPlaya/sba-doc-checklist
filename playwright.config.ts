import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: "e2e-test.db",
    },
    timeout: 60000,
  },
  use: {
    baseURL: "http://localhost:3001",
  },
});
