import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { rewriteAliases } from "./alias-rules.mjs";

const distRoot = path.resolve("dist");
const entries = readdirSync(distRoot, { recursive: true, withFileTypes: true });
const files = entries.filter((entry) => entry.isFile() && /\.(js|d\.ts)$/.test(entry.name));
for (const file of files) {
  const filePath = path.join(file.parentPath, file.name);
  const source = readFileSync(filePath, "utf8");
  writeFileSync(filePath, rewriteAliases(source, filePath, distRoot));
}
process.stdout.write(`aliases rewritten in ${files.length} files\n`);
