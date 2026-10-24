import { execFileSync } from "node:child_process";
import { findLicenseProblems } from "./license-rules.mjs";

const output = execFileSync("pnpm", ["licenses", "list", "--prod", "--json"], { encoding: "utf8" });
const licenseToPackages = JSON.parse(output);
const byLicense = Object.fromEntries(
  Object.entries(licenseToPackages).map(([license, packages]) => [license, packages.map((entry) => entry.name)]),
);
const problems = findLicenseProblems(byLicense);
if (problems.length > 0) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`licenses ok: ${Object.keys(byLicense).join(", ")}\n`);
}
