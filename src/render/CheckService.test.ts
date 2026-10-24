import { CheckService } from "@/render/CheckService.ts";
import { describe, expect, it } from "vitest";
const FRAME = { width: 1000, height: 500 };

describe("CheckService.check()", () => {
  it("says nothing about a balanced scene", () => {
    const result = CheckService.check({ canvas: FRAME, objects: { a: { asset: "tree", at: "left" }, b: { asset: "tree", at: "right" } } });

    expect(result.art).toStrictEqual([]);
  });

  it("points at the heavy side when the visual weight leans", () => {
    const result = CheckService.check({ canvas: FRAME, objects: { a: { asset: "tree", at: "far-left" } } });

    expect(result.art).toStrictEqual([
      "arte: peso visual pende para a esquerda (centro de massa em 15% da largura); aproxime 'a' do centro ou ponha algo do lado direito",
    ]);
  });

  it("reports an empty scene and the empty band, with the zoom that would fix it", () => {
    const result = CheckService.check({ canvas: FRAME, objects: { a: { asset: "cup", at: "center", on: "table" }, table: { asset: "table", at: "center", size: "tiny" } } });

    expect(result.art).toStrictEqual([
      "arte: cena vazia: os objetos ocupam só 0% do quadro; aproxime a câmera (canvas.scale ≈ 2.50) ou use objetos maiores",
      "arte: faixa vazia de 84% da altura (de y=0% a y=84%); suba o grupo principal, aumente a escala ou ocupe a faixa (texto, objeto de parede, elemento de céu)",
    ]);
  });

  it("reports two outlines that almost touch", () => {
    const result = CheckService.check({ canvas: FRAME, objects: { a: { asset: "tree", at: 0.4 }, b: { asset: "house", at: 0.62 } } });

    expect(result.art).toStrictEqual([
      "arte: 'a' e 'b' quase se encostam (tangência); afaste-os um pouco ou sobreponha de propósito",
    ]);
  });

  it("stays silent when the scene turns the art director off", () => {
    const result = CheckService.check({ canvas: { ...FRAME, critique: false }, objects: { a: { asset: "tree", at: "far-left" } } });

    expect(result.art).toStrictEqual([]);
  });

  it("returns the same SVG as compile", () => {
    const result = CheckService.check({ canvas: FRAME, objects: { a: { asset: "tree" } } });

    expect(result.svg.startsWith("<svg xmlns=\"http://www.w3.org/2000/svg\"")).toBe(true);
  });
});
