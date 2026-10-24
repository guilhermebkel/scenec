import { spawnSync } from "node:child_process";
import { findManifestWarnings, findPackProblems } from "./pack-rules.mjs";

const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { encoding: "utf8" });
const [pack] = JSON.parse(result.stdout);
const paths = pack.files.map((file) => file.path);
const problems = [...findPackProblems(paths, pack.size), ...findManifestWarnings(result.stderr)];
if (problems.length > 0) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`pack ok: ${pack.files.length} files, ${pack.size} bytes\n`);
}
