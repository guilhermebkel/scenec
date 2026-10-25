import { execFileSync } from "node:child_process";
import { cpSync, globSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { restoreJsonAttributes, rewriteSpecifiers } from "./alias-rules.mjs";

const distRoot = path.resolve("dist");
rmSync(distRoot, { recursive: true, force: true });
const sources = globSync("src/**/*.ts").filter((file) => !file.endsWith(".test.ts"));
await build({ entryPoints: sources, outdir: "dist", outbase: "src", format: "esm", platform: "node", target: "node20", logLevel: "warning" });
cpSync("src/Data", path.join(distRoot, "Data"), { recursive: true });
execFileSync("npx", ["tsc", "-p", "tsconfig.build.json"], { stdio: "inherit" });
const outputs = globSync("dist/**/*.{js,d.ts}");
for (const file of outputs) {
  const filePath = path.resolve(file);
  const rewritten = rewriteSpecifiers(readFileSync(filePath, "utf8"), filePath, distRoot);
  writeFileSync(filePath, file.endsWith(".js") ? restoreJsonAttributes(rewritten) : rewritten);
}
process.stdout.write(`built ${outputs.length} files\n`);
