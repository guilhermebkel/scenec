import { describe, expect, it } from "vitest";
import { restoreJsonAttributes, rewriteSpecifiers } from "./alias-rules.mjs";

describe("rewriteSpecifiers()", () => {
  it("rewrites an alias import to a relative path with the .js extension", () => {
    const source = 'import { ColorUtil } from "@/utils/ColorUtil.ts";';

    expect(rewriteSpecifiers(source, "/pkg/dist/pipeline/CompileService.js", "/pkg/dist")).toBe(
      'import { ColorUtil } from "../utils/ColorUtil.js";',
    );
  });

  it("uses ./ for a file in the same folder", () => {
    expect(rewriteSpecifiers('export * from "@/utils/b.ts";', "/pkg/dist/utils/a.js", "/pkg/dist")).toBe('export * from "./b.js";');
  });

  it("rewrites a type import in a declaration file", () => {
    expect(rewriteSpecifiers('import type { A } from "@/protocols/a.ts";', "/pkg/dist/index.d.ts", "/pkg/dist")).toBe(
      'import type { A } from "./protocols/a.js";',
    );
  });

  it("turns a relative .ts import into .js", () => {
    expect(rewriteSpecifiers('import { x } from "./x.ts";', "/pkg/dist/a.js", "/pkg/dist")).toBe('import { x } from "./x.js";');
  });

  it("keeps the .json extension of an aliased data import", () => {
    const source = 'import data from "@/data/europe.json" with { type: "json" };';

    expect(rewriteSpecifiers(source, "/pkg/dist/modes/MapService.js", "/pkg/dist")).toBe(
      'import data from "../data/europe.json" with { type: "json" };',
    );
  });

  it("leaves package imports alone", () => {
    const source = 'import z from "zod";';

    expect(rewriteSpecifiers(source, "/pkg/dist/a.js", "/pkg/dist")).toBe(source);
  });
});

describe("restoreJsonAttributes()", () => {
  it("adds the json import attribute esbuild removed", () => {
    expect(restoreJsonAttributes('import data from "../data/europe.json";')).toBe('import data from "../data/europe.json" with { type: "json" };');
  });

  it("does not add it twice", () => {
    const source = 'import data from "../data/europe.json" with { type: "json" };';

    expect(restoreJsonAttributes(source)).toBe(source);
  });
});
