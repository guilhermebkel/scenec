import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/Protocols/ThemeProtocol.ts";
import { ThemeService } from "@/Services/ThemeService.ts";

describe("ThemeService.resolve()", () => {
  it("returns the palette registered under each id", () => {
    for (const id of THEME_IDS) {
      expect(ThemeService.resolve(id)).toBe(ThemeService.THEME_ID_TO_THEME[id]);
    }
  });

  it("registers exactly the themes named in THEME_IDS", () => {
    expect(Object.keys(ThemeService.THEME_ID_TO_THEME).sort()).toStrictEqual([...THEME_IDS].sort());
  });
});
