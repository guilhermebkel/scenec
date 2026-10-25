import { describe, expect, it } from "vitest";
import { CompilationModule } from "@/Modules/CompilationModule.ts";
import type { ShotName } from "@/Protocols/SceneProtocol.ts";

function personWidth(shot: ShotName | undefined): number {
  const result = CompilationModule.compile({
    canvas: { width: 800, height: 600, shot, focus: "hero" },
    objects: { hero: { asset: "person", at: "center" }, oak: { asset: "tree", at: "left" } },
  });
  return result.layout?.find((entry) => entry.id === "hero")?.w ?? 0;
}

describe("CameraService.frame()", () => {
  it("keeps the focused object the same size in the wide shot as without a shot", () => {
    expect(personWidth("wide")).toBe(personWidth(undefined));
  });

  it("zooms closer on the focused object as the shot gets tighter", () => {
    const widths = [personWidth("wide"), personWidth("full"), personWidth("medium"), personWidth("close")];

    expect(widths).toStrictEqual([...widths].sort((first, second) => first - second));
    expect(new Set(widths).size).toBe(widths.length);
  });

  it("keeps the focused object centered whatever the shot", () => {
    const result = CompilationModule.compile({
      canvas: { width: 800, height: 600, shot: "close", focus: "hero" },
      objects: { hero: { asset: "person", at: "center" }, oak: { asset: "tree", at: "left" } },
    });

    expect(result.layout?.find((entry) => entry.id === "hero")?.x).toBe(50);
  });
});
