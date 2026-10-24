import path from "node:path";

const ALIAS_IMPORT = /(["'])@\/([^"']+?)\.ts\1/g;

/** Rewrites "@/x/y.ts" specifiers to the relative "./x/y.js" that Node resolves in dist. */
export function rewriteAliases(source, filePath, distRoot) {
  return source.replace(ALIAS_IMPORT, (_match, quote, target) => {
    const fromDir = path.dirname(filePath);
    const relative = path.relative(fromDir, path.join(distRoot, `${target}.js`)).split(path.sep).join("/");
    const specifier = relative.startsWith(".") ? relative : `./${relative}`;
    return `${quote}${specifier}${quote}`;
  });
}
