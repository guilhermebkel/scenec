import fs from "node:fs";
import path from "node:path";
import type { FileReader } from "@/protocols/options.ts";
export class FileReaderAdapter {
  static createFileReader(baseDir: string): FileReader {
    const root = path.resolve(baseDir);
    const resolveInside = (file: string): string => {
      const full = path.resolve(root, file);
      if (path.isAbsolute(file) || (full !== root && !full.startsWith(root + path.sep))) {
        throw new Error(`caminho '${file}' fora da pasta da cena; use um caminho relativo dentro dela`);
      }
      return full;
    };
    return {
      readText: (file) => fs.readFileSync(resolveInside(file), "utf8"),
      readBytes: (file) => new Uint8Array(fs.readFileSync(resolveInside(file))),
    };
  }
}
