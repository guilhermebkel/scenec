import { describe, expect, it } from "vitest";
import { FontMetricsUtil } from "@/Utils/FontMetricsUtil.ts";

describe("FontMetricsUtil.lineEm()", () => {
  it("measures proportional glyphs, so a narrow letter is narrower than a wide one", () => {
    expect(FontMetricsUtil.lineEm("i", "sans", false)).toBeLessThan(FontMetricsUtil.lineEm("m", "sans", false));
  });

  it("measures the bold table for bold sans text", () => {
    expect(FontMetricsUtil.lineEm("Sábado", "sans", true)).toBeGreaterThan(FontMetricsUtil.lineEm("Sábado", "sans", false));
  });

  it("adds an average width for characters outside the table", () => {
    expect(FontMetricsUtil.lineEm("€", "sans", false)).toBe(0.5);
  });
});
