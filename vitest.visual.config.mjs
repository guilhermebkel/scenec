import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/visual/**/*.test.ts"],
    testTimeout: 60000,
  },
});
