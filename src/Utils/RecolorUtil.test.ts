import { describe, expect, it } from "vitest";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { RecolorUtil } from "@/Utils/RecolorUtil.ts";

const THEME = {
  primary: "#3E7CB1", secondary: "#E07A5F", accent: "#F2CC8F", foliage: ["#81B29A", "#5F9E83", "#3D6F5A"],
  trunk: "#6B4F3A", wood: "#B08968", glass: "#BFD8E6", metal: "#9AA5B1",
} as Theme;

describe("RecolorUtil.makeRecolor()", () => {
  describe("when the color is saturated", () => {
    it("moves red toward the nearest theme swatch", () => {
      expect(RecolorUtil.makeRecolor(THEME)('<g fill="#FF0000"/>')).toBe('<g fill="#dd5e41"/>');
    });

    it("moves the color less when the strength is lower", () => {
      expect(RecolorUtil.makeRecolor(THEME, 0.3)('<g fill="#FF0000"/>')).toBe('<g fill="#f23c20"/>');
    });

    it("recolors stroke and stop-color attributes too", () => {
      expect(RecolorUtil.makeRecolor(THEME)('<g stroke="#00ff00"/><stop stop-color="#FFD700"/>')).toBe('<g stroke="#66db9e"/><stop stop-color="#fdd17b"/>');
    });
  });

  describe("when the color is gray", () => {
    it("pulls mid gray toward the theme neutral", () => {
      expect(RecolorUtil.makeRecolor(THEME)('<g fill="#808080"/>')).toBe('<g fill="#7d8085"/>');
    });

    it("keeps white and black close to themselves", () => {
      expect(RecolorUtil.makeRecolor(THEME)('<g fill="#FFFFFF"/><g fill="#101010"/>')).toBe('<g fill="#fbffff"/><g fill="#0c1015"/>');
    });
  });

  describe("when the color is written with three digits", () => {
    it("expands it before converting", () => {
      expect(RecolorUtil.makeRecolor(THEME)('<g fill="#abc"/>')).toBe('<g fill="#98a6b8"/>');
    });
  });

  describe("when the attribute is not a hex color", () => {
    it("leaves it as it is", () => {
      const svg = '<g fill="url(#sky)"/><g fill="red"/>';
      expect(RecolorUtil.makeRecolor(THEME)(svg)).toBe(svg);
    });
  });

  describe("when the theme has no saturated swatch", () => {
    it("keeps saturated colors unchanged", () => {
      const gray = { ...THEME, primary: "#888888", secondary: "#888888", accent: "#888888", foliage: ["#888888", "#888888", "#888888"], trunk: "#888888", wood: "#888888", glass: "#888888" } as Theme;
      expect(RecolorUtil.makeRecolor(gray)('<g fill="#FF0000"/>')).toBe('<g fill="#FF0000"/>');
    });
  });
});
