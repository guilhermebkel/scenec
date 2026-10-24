import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/Protocols/ThemeProtocol.ts";
import { ThemeService } from "@/Services/ThemeService.ts";

describe("ThemeService", () => {
  it("registers exactly the themes named in THEME_IDS", () => {
    expect(Object.keys(ThemeService.THEMES).sort()).toEqual([...THEME_IDS].sort());
  });
});
