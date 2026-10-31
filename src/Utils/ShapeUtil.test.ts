import { describe, expect, it } from "vitest";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

describe("ShapeUtil.blob()", () => {
  it("is deterministic for the same seed", () => {
    const first = ShapeUtil.blob(0, 0, 30, { seed: 3, fill: "#0f0" });
    const second = ShapeUtil.blob(0, 0, 30, { seed: 3, fill: "#0f0" });
    expect(first).toBe(second);
  });

  it("changes with the seed", () => {
    expect(ShapeUtil.blob(0, 0, 30, { seed: 1 })).not.toBe(ShapeUtil.blob(0, 0, 30, { seed: 2 }));
  });

  it("stays close to the requested radius", () => {
    const svg = ShapeUtil.blob(0, 0, 40, { seed: 5, wobble: 0.1 });
    const numbers = [...svg.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Math.abs(Number(match[0])));
    expect(Math.max(...numbers)).toBeLessThan(40 * 1.2);
  });

  it("is a closed path, not a circle", () => {
    const svg = ShapeUtil.blob(10, 10, 20, { fill: "#123456", extra: "opacity=\"0.5\"" });
    expect(svg).toMatch(/^<path d="M.*Z" fill="#123456" opacity="0.5"\/>$/);
  });
});
