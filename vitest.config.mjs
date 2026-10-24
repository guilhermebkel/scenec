import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs", "test/smoke/**/*.test.ts", "test/package/**/*.test.ts"],
    testTimeout: 60000,
  },
});
