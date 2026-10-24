import { describe, expect, it } from "vitest";
import { CritiqueModule } from "@/Modules/CritiqueModule.ts";
import type { CritiqueInput, CritiqueObject } from "@/Protocols/CompilationProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

const SIZE = 320;
const HEAD = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">`;
const PAPER = "#F0F0F0";
const INK = "#202020";
const BACKGROUND = `<rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>`;
const THEME = { paper: PAPER, ink: INK } as Theme;

interface Square {
  left: number;
  top: number;
  side: number;
  color: string;
}

function box(id: string, square: Square, extra: Partial<CritiqueObject> = {}): CritiqueObject {
  const { left, top, side, color } = square;
  const body = `<rect x="${left}" y="${top}" width="${side}" height="${side}" fill="${color}"/>`;
  return { id, asset: id, kind: "ground", z: 0, body, related: [], ignore: false, ...extra };
}

function input(objects: CritiqueObject[], overrides: Partial<CritiqueInput> = {}): CritiqueInput {
  return {
    width: SIZE, height: SIZE, head, bg: BACKGROUND, scene: BACKGROUND + objects.map((object) => object.body).join(""),
    theme: THEME, scale: 1, textRects: [], skip: [], objects, ...overrides,
  };
}

const head = HEAD;

describe("CritiqueModule.critique()", () => {
  it("says nothing about a balanced scene whose objects are clearly visible", () => {
    const objects = [box("left", { left: 15, top: 90, side: 140, color: INK }), box("right", { left: 165, top: 90, side: 140, color: INK })];

    expect(CritiqueModule.critique(input(objects))).toStrictEqual([]);
  });

  it("asks for a closer camera when the objects cover almost nothing", () => {
    const messages = CritiqueModule.critique(input([box("tiny", { left: 150, top: 150, side: 12, color: INK })]));

    expect(messages.filter((message) => message.startsWith("art: empty scene: objects cover only 0%"))).toHaveLength(1);
  });

  it("reports a wide empty band across the frame", () => {
    const messages = CritiqueModule.critique(input([box("top", { left: 100, top: 10, side: 120, color: INK })]));

    expect(messages.some((message) => message.startsWith("art: empty band of"))).toBe(true);
  });

  it("points at the heaviest object when the visual weight leans to one side", () => {
    const messages = CritiqueModule.critique(input([box("heavy", { left: 10, top: 100, side: 120, color: INK })]));

    expect(messages).toContain(
      "art: visual weight leans left (center of mass at 22% of the width); move 'heavy' toward the center or put something on the right side",
    );
  });

  it("warns when an object has the same color as the background", () => {
    const messages = CritiqueModule.critique(input([box("ghost", { left: 100, top: 100, side: 120, color: PAPER })]));

    expect(messages.some((message) => message.includes("'ghost' blends into the background"))).toBe(true);
  });

  it("names the theme color that is too close when the blended color is a token", () => {
    const messages = CritiqueModule.critique(input([box("ghost", { left: 100, top: 100, side: 120, color: PAPER })]));

    expect(messages.some((message) => message.includes(`the color ${PAPER} (paper) is too close`))).toBe(true);
  });

  it("skips the silhouette check when asked to", () => {
    const messages = CritiqueModule.critique(input([box("ghost", { left: 100, top: 100, side: 120, color: PAPER })], { skip: ["silhouette"] }));

    expect(messages.some((message) => message.includes("blends into"))).toBe(false);
  });

  it("never judges sky and floor objects by their silhouette", () => {
    const messages = CritiqueModule.critique(input([box("sky", { left: 100, top: 100, side: 120, color: PAPER }, { kind: "sky" })]));

    expect(messages.some((message) => message.includes("blends into"))).toBe(false);
  });

  it("warns about two unrelated objects that almost touch", () => {
    const objects = [box("first", { left: 40, top: 100, side: 100, color: INK }), box("second", { left: 141, top: 100, side: 100, color: INK })];

    expect(CritiqueModule.critique(input(objects))).toContain(
      "art: 'first' and 'second' almost touch (tangency); move them apart a little or overlap them on purpose",
    );
  });

  it("lets related objects touch", () => {
    const objects = [box("first", { left: 40, top: 100, side: 100, color: INK }, { related: ["second"] }), box("second", { left: 141, top: 100, side: 100, color: INK })];

    expect(CritiqueModule.critique(input(objects)).some((message) => message.includes("almost touch"))).toBe(false);
  });

  it("warns about an object that stops one pixel short of the edge", () => {
    const messages = CritiqueModule.critique(input([box("edge", { left: 1, top: 100, side: 100, color: INK })]));

    expect(messages).toContain("art: 'edge' touches the edge (left); move it away from the edge or let it crop on purpose");
  });

  it("ignores objects marked to be ignored", () => {
    const messages = CritiqueModule.critique(input([box("ghost", { left: 100, top: 100, side: 120, color: PAPER }, { ignore: true })]));

    expect(messages.some((message) => message.includes("'ghost'"))).toBe(false);
  });
});
