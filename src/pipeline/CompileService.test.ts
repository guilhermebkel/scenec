import { describe, expect, it } from "vitest";
import { CompileService } from "@/pipeline/CompileService.ts";

const FRAME = { width: 1000, height: 500 };

describe("CompileService.compile()", () => {
  it("gives the same SVG for the same scene, byte for byte", () => {
    const scene = { canvas: FRAME, objects: { tree: { asset: "tree" }, dog: { asset: "dog", left_of: "tree" } } };

    expect(CompileService.compile(scene).svg).toBe(CompileService.compile(scene).svg);
  });

  it("describes each object in position and size, as text", () => {
    const result = CompileService.compile({ canvas: FRAME, objects: { arvore: { asset: "tree", at: "center" } } });

    expect([result.description, result.layout]).toStrictEqual([
      "arvore (tree): x=50%, base=92%, 20%×70% do quadro, near",
      [{ id: "arvore", asset: "tree", x: 50, base: 92, w: 19.6, h: 69.7 }],
    ]);
  });

  it("suggests close asset names when the asset does not exist", () => {
    const result = CompileService.compile({ objects: { a: { asset: "tre" } } });

    expect(result.warnings).toStrictEqual(["asset 'tre' (em 'a') não existe; você quis dizer: tree, tv, figurine?"]);
  });

  it("warns when an object goes out of the frame", () => {
    const result = CompileService.compile({ canvas: FRAME, objects: { casa: { asset: "house", at: 0.98 } } });

    expect(result.warnings).toStrictEqual(["'casa' está 43% fora do quadro"]);
  });

  it("warns when text has too little contrast against the background", () => {
    const result = CompileService.compile({ canvas: { theme: "night" }, text: [{ content: "Oi", color: "ink" }] });

    expect(result.warnings).toStrictEqual(["texto \"Oi\" com contraste 1.1:1 (mín. 4.5); troque 'color' ou use 'box'"]);
  });

  it("warns about a reference to an object that does not exist", () => {
    const result = CompileService.compile({ objects: { b: { asset: "tree", left_of: "zz" } } });

    expect(result.warnings).toStrictEqual(["'b' referencia 'zz', que não existe na cena"]);
  });

  it("puts unknown-field warnings before the compile warnings", () => {
    const result = CompileService.compile({ objects: { b: { asset: "tre", siz: 1 } } });

    expect(result.warnings).toStrictEqual([
      "campo 'siz' desconhecido em objects.b; você quis dizer 'size'?",
      "asset 'tre' (em 'b') não existe; você quis dizer: tree, tv, figurine?",
    ]);
  });

  describe("when the shot is medium and focuses a person", () => {
    it("zooms so the person fills the frame from the headroom down", () => {
      const scene = { canvas: { ...FRAME, height: 600, shot: "medium", focus: "p" }, objects: { p: { asset: "person" } } };

      expect(CompileService.compile(scene).layout).toStrictEqual([{ id: "p", asset: "person", x: 50, base: 153.9, w: 31.5, h: 141.9 }]);
    });

    it("warns when the focus does not exist", () => {
      const scene = { canvas: { ...FRAME, shot: "close", focus: "nobody" }, objects: { p: { asset: "person" } } };

      expect(CompileService.compile(scene).warnings).toStrictEqual(["focus 'nobody' não existe na cena"]);
    });
  });

  describe("when the scene has a custom asset from a file", () => {
    it("warns that this call reads no files instead of failing", () => {
      const scene = { assets: { logo: { svg: "logo.svg", kind: "wall" } }, objects: { logo: { at: "center" } } };

      expect(CompileService.compile(scene).warnings).toStrictEqual([
        "asset custom 'logo': esta chamada não lê arquivos; passe o SVG inline ou use a CLI",
        "'logo' foi ignorado porque o asset custom 'logo' não carregou",
      ]);
    });

    it("draws an inline custom asset sanitized", () => {
      const inline = "<svg viewBox=\"0 0 10 10\"><script>x()</script><rect width=\"10\" height=\"10\" fill=\"#FF0000\"/></svg>";
      const scene = { assets: { box: { svg: inline, kind: "ground", height: 40 } }, objects: { box: { at: "center" } } };

      expect(CompileService.compile(scene).svg).not.toContain("<script");
    });
  });
});
