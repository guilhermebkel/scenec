import { describe, expect, it } from "vitest";
import { RidgeService } from "@/Services/RidgeService.ts";

describe("RidgeService.draw()", () => {
  it("returns empty string when count is 0", () => {
    const svg = RidgeService.draw({
      count: 0,
      seed: 42,
      width: 1200,
      horizonY: 400,
      groundColor: "#4B6B3C",
      airColor: "#C9E2F5",
      bottomY: 600,
    });
    expect(svg).toBe("");
  });

  it("draws the requested number of ridge layers", () => {
    const svg = RidgeService.draw({
      count: 3,
      seed: 42,
      width: 1200,
      horizonY: 400,
      groundColor: "#4B6B3C",
      airColor: "#C9E2F5",
      bottomY: 600,
    });
    const paths = svg.match(/<path/g) ?? [];
    expect(paths).toHaveLength(3);
  });

  it("produces deterministic output for the same seed", () => {
    const first = RidgeService.draw({
      count: 2,
      seed: 123,
      width: 1000,
      horizonY: 350,
      groundColor: "#506040",
      airColor: "#A0C0E0",
      bottomY: 500,
    });
    const second = RidgeService.draw({
      count: 2,
      seed: 123,
      width: 1000,
      horizonY: 350,
      groundColor: "#506040",
      airColor: "#A0C0E0",
      bottomY: 500,
    });
    expect(first).toBe(second);
  });

  it("produces different output for different seeds", () => {
    const first = RidgeService.draw({
      count: 2,
      seed: 1,
      width: 1000,
      horizonY: 350,
      groundColor: "#506040",
      airColor: "#A0C0E0",
      bottomY: 500,
    });
    const second = RidgeService.draw({
      count: 2,
      seed: 2,
      width: 1000,
      horizonY: 350,
      groundColor: "#506040",
      airColor: "#A0C0E0",
      bottomY: 500,
    });
    expect(first).not.toBe(second);
  });
});
