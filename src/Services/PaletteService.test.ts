import { PaletteService } from "@/Services/PaletteService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { describe, expect, it } from "vitest";

describe("PaletteService.generate()", () => {
  it("generates a complete valid theme from a single seed color", () => {
    const theme = PaletteService.generate({ from: "#2F6BFF" });

    expect(theme.primary).toBe("#2F6BFF");
    expect(theme.skyTop).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.skyBottom).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.ground).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.groundDark).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.wall).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.floor).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.ink).toMatch(/^#[0-9A-F]{6}$/);
    expect(theme.foliage).toHaveLength(3);
  });

  it("respects multiple seed colors when provided", () => {
    const theme = PaletteService.generate({ from: ["#2F6BFF", "#FF8000", "#00FF80"] });

    expect(theme.primary).toBe("#2F6BFF");
    expect(theme.secondary).toBe("#FF8000");
    expect(theme.accent).toBe("#00FF80");
  });

  it("passes WCAG AA contrast for text over backdrops", () => {
    const dayTheme = PaletteService.generate({ from: "#2F6BFF", mood: "day" });
    expect(ColorUtil.contrast(dayTheme.text, dayTheme.skyTop)).toBeGreaterThanOrEqual(4.5);
    expect(ColorUtil.contrast(dayTheme.text, dayTheme.wall)).toBeGreaterThanOrEqual(4.5);

    const nightTheme = PaletteService.generate({ from: "#2F6BFF", mood: "night" });
    expect(ColorUtil.contrast(nightTheme.text, nightTheme.skyTop)).toBeGreaterThanOrEqual(4.5);
  });

  it("generates distinct palettes across different harmonies", () => {
    const analogous = PaletteService.generate({ from: "#2F6BFF", harmony: "analogous" });
    const complementary = PaletteService.generate({ from: "#2F6BFF", harmony: "complementary" });
    const triad = PaletteService.generate({ from: "#2F6BFF", harmony: "triad" });

    expect(analogous.secondary).not.toBe(complementary.secondary);
    expect(complementary.secondary).not.toBe(triad.secondary);
  });
});
