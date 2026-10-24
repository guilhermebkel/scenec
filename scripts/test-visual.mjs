import { spawnSync } from "node:child_process";

const isUpdate = process.argv.includes("--update");
const result = spawnSync("npx", ["vitest", "run", "-c", "vitest.visual.config.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SCENEC_UPDATE_BASELINES: isUpdate ? "1" : "0" },
});
process.exitCode = result.status ?? 1;
