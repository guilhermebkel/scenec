import { describe, expect, it } from "vitest";
import { ThemeService } from "@/Services/ThemeService.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

const THEME = ThemeService.THEME_ID_TO_THEME["flat-cool"];

describe("ThemeUtil.resolve()", () => {
  it("turns a theme color name into its color", () => {
    expect(ThemeUtil.resolve(THEME, "primary", "#000000")).toBe(THEME.primary);
  });

  it("keeps a literal color as written", () => {
    expect(ThemeUtil.resolve(THEME, "#123456", "#000000")).toBe("#123456");
  });

  it("falls back when the value is missing or empty", () => {
    expect(ThemeUtil.resolve(THEME, undefined, "#abcdef")).toBe("#abcdef");
    expect(ThemeUtil.resolve(THEME, "", "#abcdef")).toBe("#abcdef");
  });
});
