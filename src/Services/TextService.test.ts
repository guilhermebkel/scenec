import { describe, expect, it } from "vitest";
import type { CompilationContext } from "@/Protocols/CompilationProtocol.ts";
import { KitService } from "@/Services/KitService.ts";
import { TextService } from "@/Services/TextService.ts";
import { ThemeService } from "@/Services/ThemeService.ts";

function createContext(overrides: Partial<CompilationContext> = {}): CompilationContext {
  return {
    canvas: { width: 1200, height: 630 },
    kit: KitService.KIT_ID_TO_KIT.flat,
    idToObject: {},
    library: {},
    failedAssets: new Set(),
    theme: ThemeService.resolve("warm-cafe"),
    warnings: [],
    width: 1200,
    height: 630,
    setting: "indoor",
    lines: { horizon: 300, depthToBase: { far: 350, mid: 450, near: 550 } },
    unit: 100,
    ...overrides,
  };
}

describe("TextService.render()", () => {
  it("renders default sans font (Poppins) when font is not specified", () => {
    const context = createContext();
    const result = TextService.render([{ content: "Hello Sans", role: "title" }], context, [], "#F4F1EA");
    expect(result.svg).toContain("font-family=\"Poppins\"");
  });

  it("renders serif font (DM Serif Display) when specified or in paper kit", () => {
    const explicitContext = createContext();
    const explicitResult = TextService.render(
      [{ content: "Editorial Title", role: "title", font: "serif" }],
      explicitContext,
      [],
      "#F4F1EA",
    );
    expect(explicitResult.svg).toContain("font-family=\"DM Serif Display\"");

    const paperContext = createContext({ canvas: { width: 1200, height: 630, kit: "paper" } });
    const paperResult = TextService.render(
      [{ content: "Paper Title", role: "title" }],
      paperContext,
      [],
      "#F4F1EA",
    );
    expect(paperResult.svg).toContain("font-family=\"DM Serif Display\"");
  });

  it("renders hand font (Patrick Hand) when specified or in sketch kit", () => {
    const explicitContext = createContext();
    const explicitResult = TextService.render(
      [{ content: "Sketchy Note", role: "label", font: "hand" }],
      explicitContext,
      [],
      "#F4F1EA",
    );
    expect(explicitResult.svg).toContain("font-family=\"Patrick Hand\"");

    const sketchContext = createContext({ canvas: { width: 1200, height: 630, kit: "sketch" } });
    const sketchResult = TextService.render(
      [{ content: "Sketch Kit Note", role: "label" }],
      sketchContext,
      [],
      "#F4F1EA",
    );
    expect(sketchResult.svg).toContain("font-family=\"Patrick Hand\"");
  });

  it("applies tighter tracking to large title sizes", () => {
    const context = createContext();
    const result = TextService.render([{ content: "Big Heading", role: "title" }], context, [], "#F4F1EA");
    expect(result.svg).toContain("letter-spacing=\"-0.015em\"");
  });

  it("renders highlight box style with skewed polygons behind lines", () => {
    const context = createContext();
    const result = TextService.render(
      [{ content: "Important\nNotice", box_style: "highlight" }],
      context,
      [],
      "#F4F1EA",
    );
    expect(result.svg).toContain("<polygon points=");
    expect(result.svg).toContain("fill-opacity=\"0.38\"");
    expect(result.rects[0]?.hasBox).toBe(true);
  });

  it("renders pill box style with full rounded corners and drop shadow filter", () => {
    const context = createContext();
    const result = TextService.render(
      [{ content: "Badge", box_style: "pill" }],
      context,
      [],
      "#F4F1EA",
    );
    expect(result.svg).toContain("<feDropShadow");
    expect(result.svg).toContain("filter=\"url(#pill_sh_0)\"");
    expect(result.rects[0]?.hasBox).toBe(true);
  });

  it("renders sticker box style with rotated group, white border and drop shadow", () => {
    const context = createContext();
    const result = TextService.render(
      [{ content: "NEW ARRIVAL", box_style: "sticker", rotation: -2 }],
      context,
      [],
      "#F4F1EA",
    );
    expect(result.svg).toContain("stroke=\"#FFFFFF\"");
    expect(result.svg).toContain("rotate(-2.0,");
    expect(result.svg).toContain("filter=\"url(#stk_sh_0)\"");
    expect(result.rects[0]?.hasBox).toBe(true);
  });

  it("renders underline box style with wavy path under emphasized words", () => {
    const context = createContext();
    const result = TextService.render(
      [{ content: "Grow your business today", box_style: "underline", emphasis: ["business"] }],
      context,
      [],
      "#F4F1EA",
    );
    expect(result.svg).toContain("<path d=");
    expect(result.svg).toContain("stroke-linecap=\"round\"");
    expect(result.rects[0]?.hasBox).toBe(true);
  });

  it("balances multi-line titles when balance is true", () => {
    const context = createContext();
    const result = TextService.render(
      [{ content: "Comece cedo e já faça a diferença", role: "title", balance: true }],
      context,
      [],
      "#F4F1EA",
    );
    expect(result.svg).toContain("<tspan x=");
    expect(result.svg).toContain("Comece cedo e já");
    expect(result.svg).toContain("faça a diferença");
  });
});
