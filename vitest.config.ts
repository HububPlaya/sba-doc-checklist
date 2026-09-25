import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    env: {
      DATABASE_PATH: ":memory:",
    },
    setupFiles: ["./src/test/setup.ts"],
  },
});
