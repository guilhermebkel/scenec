import { describe, expect, it } from "vitest";
import { rewriteAliases } from "./alias-rules.mjs";

describe("rewriteAliases()", () => {
  it("rewrites an alias import to a relative path with the .js extension", () => {
    const source = 'import { ColorUtil } from "@/utils/ColorUtil.ts";';

    expect(rewriteAliases(source, "/pkg/dist/pipeline/CompileService.js", "/pkg/dist")).toBe(
      'import { ColorUtil } from "../utils/ColorUtil.js";',
    );
  });

  it("uses ./ for a file in the same folder", () => {
    expect(rewriteAliases('export * from "@/utils/b.ts";', "/pkg/dist/utils/a.js", "/pkg/dist")).toBe('export * from "./b.js";');
  });

  it("rewrites a type import in a declaration file", () => {
    expect(rewriteAliases('import type { A } from "@/protocols/a.ts";', "/pkg/dist/index.d.ts", "/pkg/dist")).toBe(
      'import type { A } from "./protocols/a.js";',
    );
  });

  it("leaves package imports and relative imports alone", () => {
    const source = 'import z from "zod"; import x from "./x.js";';

    expect(rewriteAliases(source, "/pkg/dist/a.js", "/pkg/dist")).toBe(source);
  });
});
