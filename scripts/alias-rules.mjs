import path from "node:path";

const EXTENSION_TO_OUTPUT = { ts: "js", json: "json" };
const IMPORT_SPECIFIER = /(["'])(@\/|\.{1,2}\/)([^"']+?)\.(ts|json)\1/g;

export function rewriteSpecifiers(source, filePath, distRoot) {
  return source.replace(IMPORT_SPECIFIER, (_match, quote, prefix, target, extension) => {
    const resolvedExtension = EXTENSION_TO_OUTPUT[extension];
    if (prefix !== "@/") {
      return `${quote}${prefix}${target}.${resolvedExtension}${quote}`;
    }
    const fromDir = path.dirname(filePath);
    const relative = path.relative(fromDir, path.join(distRoot, `${target}.${resolvedExtension}`)).split(path.sep).join("/");
    const specifier = relative.startsWith(".") ? relative : `./${relative}`;
    return `${quote}${specifier}${quote}`;
  });
}

const JSON_IMPORT_WITHOUT_ATTRIBUTE = /(from\s+["'][^"']+\.json["'])(?!\s+with)/g;

export function restoreJsonAttributes(source) {
  return source.replace(JSON_IMPORT_WITHOUT_ATTRIBUTE, "$1 with { type: \"json\" }");
}
