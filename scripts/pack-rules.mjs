export const MAX_PACK_BYTES = 5 * 1024 * 1024;
const ALLOWED_PREFIXES = ["dist/", "fonts/", "skills/"];
const ALLOWED_FILES = new Set(["package.json", "LICENSE", "README.md", "CHANGELOG.md"]);

export function findPackProblems(paths, sizeBytes) {
  const problems = [];
  if (sizeBytes > MAX_PACK_BYTES) {
    problems.push(`package is ${sizeBytes} bytes; the limit is ${MAX_PACK_BYTES}`);
  }
  for (const path of paths) {
    const isAllowed = ALLOWED_FILES.has(path) || ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (!isAllowed) {
      problems.push(`unexpected file in the package: ${path}`);
    }
  }
  return problems;
}
