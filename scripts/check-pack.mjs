import { spawnSync } from "node:child_process";
import { findManifestWarnings, findPackProblems } from "./pack-rules.mjs";

const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { encoding: "utf8" });
const [pack] = JSON.parse(result.stdout);
const paths = pack.files.map((file) => file.path);
const problems = [...findPackProblems(paths, pack.size), ...findManifestWarnings(result.stderr)];
// Why: the packed files only work if the built CLI can load its data files; list-only checks missed a wrong Data folder.
const smoke = spawnSync("node", ["dist/cli.js", "catalog", "kits"], { encoding: "utf8" });
if (smoke.status !== 0) {
  const firstLine = smoke.stderr.split("\n")[0];
  problems.push(`built CLI failed: ${firstLine}`);
}
const mapSmoke = spawnSync("node", ["dist/cli.js", "check", "test/visual/cases/examples/13-europe-trip/scene.yaml"], { encoding: "utf8" });
if (mapSmoke.stderr.includes("ERR_MODULE_NOT_FOUND")) {
  problems.push("built CLI cannot load the map data");
}
if (problems.length > 0) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`pack ok: ${pack.files.length} files, ${pack.size} bytes\n`);
}
