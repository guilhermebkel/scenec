import { describe, expect, it } from "vitest";
import { KIT_SCENE_NAMES, KIT_TEXTURE_NAMES } from "@/Protocols/KitProtocol.ts";
import { KitService } from "@/Services/KitService.ts";

describe("KitService.sceneFilter()", () => {
  it.each(KIT_SCENE_NAMES)("builds the whole-scene filter for the %s kit", (kind) => {
    expect(KitService.sceneFilter(kind)).toContain(`<filter id="kitScene"`);
  });
});

describe("KitService.texture()", () => {
  it("draws nothing when the kit has no texture", () => {
    expect(KitService.texture(undefined, 800, 600)).toBe("");
  });

  it.each(KIT_TEXTURE_NAMES)("covers the canvas with the %s texture", (kind) => {
    expect(KitService.texture(kind, 800, 600)).toContain(`width="800"`);
  });
});
