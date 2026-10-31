import { CheckModule } from "@/Modules/CheckModule.ts";
import { describe, expect, it } from "vitest";
const FRAME = { width: 1000, height: 500 };

describe("CheckModule.check()", () => {
  it("says nothing about a balanced scene", () => {
    const result = CheckModule.check({ canvas: FRAME, objects: { a: { asset: "tree", at: "left" }, b: { asset: "tree", at: "right" } } });

    expect(result.art).toStrictEqual([]);
  });

  it("points at the heavy side when the visual weight leans", () => {
    const result = CheckModule.check({ canvas: FRAME, objects: { a: { asset: "tree", at: "far-left" } } });

    expect(result.art).toStrictEqual([
      "art: visual weight leans left (center of mass at 14% of the width); move 'a' toward the center or put something on the right side",
    ]);
  });

  it("reports an empty scene and the empty band, with the zoom that would fix it", () => {
    const result = CheckModule.check({ canvas: FRAME, objects: { a: { asset: "cup", at: "center", on: "table" }, table: { asset: "table", at: "center", size: "tiny" } } });

    expect(result.art).toStrictEqual([
      "art: empty scene: objects cover only 0% of the frame; move the camera closer (canvas.scale ≈ 2.50) or use larger objects",
      "art: empty band of 84% of the height (from y=0% to y=84%); raise the main group, increase the scale or fill the band (text, wall object, sky element)",
    ]);
  });

  it("reports two outlines that almost touch", () => {
    const result = CheckModule.check({ canvas: FRAME, objects: { a: { asset: "tree", at: 0.4 }, b: { asset: "house", at: 0.62 } } });

    expect(result.art).toStrictEqual([
      "art: 'a' just touches 'b' (tangent); overlap them clearly or leave a gap of at least 8 px",
    ]);
  });

  it("stays silent when the scene turns the art director off", () => {
    const result = CheckModule.check({ canvas: { ...FRAME, critique: false }, objects: { a: { asset: "tree", at: "far-left" } } });

    expect(result.art).toStrictEqual([]);
  });

  it("returns the same SVG as compile", () => {
    const result = CheckModule.check({ canvas: FRAME, objects: { a: { asset: "tree" } } });

    expect(result.svg.startsWith("<svg xmlns=\"http://www.w3.org/2000/svg\"")).toBe(true);
  });
});
