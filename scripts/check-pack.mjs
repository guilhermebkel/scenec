import { execFileSync } from "node:child_process";
import { findPackProblems } from "./pack-rules.mjs";

const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { encoding: "utf8" });
const [pack] = JSON.parse(output);
const problems = findPackProblems(pack.files.map((file) => file.path), pack.size);
if (problems.length > 0) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`pack ok: ${pack.files.length} files, ${pack.size} bytes\n`);
}
