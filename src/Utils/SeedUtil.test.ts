import { describe, expect, it } from "vitest";
import { SeedUtil } from "@/Utils/SeedUtil.ts";

describe("SeedUtil.sequence()", () => {
  it("repeats the same numbers for the same seed", () => {
    const first = SeedUtil.sequence(7);
    const second = SeedUtil.sequence(7);

    expect([first(), first(), first()]).toStrictEqual([second(), second(), second()]);
  });

  it("gives different numbers for different seeds", () => {
    expect(SeedUtil.sequence(1)()).not.toBe(SeedUtil.sequence(2)());
  });

  it("stays in [0, 1)", () => {
    const next = SeedUtil.sequence(42);
    const values = Array.from({ length: 200 }, () => next());

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("treats seed 0 like seed 1 so the sequence never sticks at zero", () => {
    expect(SeedUtil.sequence(0)()).toBe(SeedUtil.sequence(1)());
  });
});
