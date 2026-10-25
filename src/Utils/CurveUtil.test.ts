import { describe, expect, it } from "vitest";
import { CurveUtil } from "@/Utils/CurveUtil.ts";

describe("CurveUtil.catmullRom()", () => {
  it("returns a copy of the points when there are fewer than two", () => {
    expect(CurveUtil.catmullRom([[1, 2]])).toStrictEqual([[1, 2]]);
    expect(CurveUtil.catmullRom([])).toStrictEqual([]);
  });

  it("starts and ends exactly on the first and last points", () => {
    const curve = CurveUtil.catmullRom([[0, 0], [10, 5], [20, 0]], 4);

    expect(curve[0]).toStrictEqual([0, 0]);
    expect(curve.at(-1)).toStrictEqual([20, 0]);
  });

  it("passes through every control point", () => {
    const curve = CurveUtil.catmullRom([[0, 0], [10, 5], [20, 0]], 4);

    expect(curve).toContainEqual([10, 5]);
  });

  it("samples each segment the requested number of times", () => {
    expect(CurveUtil.catmullRom([[0, 0], [10, 0], [20, 0]], 5)).toHaveLength(2 * 5 + 1);
  });
});
