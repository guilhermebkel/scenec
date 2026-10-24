import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs", "test/smoke/**/*.test.ts", "test/package/**/*.test.ts"],
    testTimeout: 60000,
  },
});
