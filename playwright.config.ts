import { defineConfig, devices } from "@playwright/test";

// Lebar uji sesuai DESIGN.md §5.1: 360 (mobile), 768 (tablet), 1280 (desktop).
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000", locale: "id-ID", timezoneId: "Asia/Jakarta" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true },
});
