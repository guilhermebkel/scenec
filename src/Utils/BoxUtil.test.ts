import { describe, expect, it } from "vitest";
import { BoxUtil } from "@/Utils/BoxUtil.ts";

describe("BoxUtil.overlapArea()", () => {
  it("gives the area shared by two boxes", () => {
    const first = { x0: 0, y0: 0, x1: 10, y1: 10 };
    const second = { x0: 5, y0: 5, x1: 20, y1: 20 };

    expect(BoxUtil.overlapArea(first, second)).toBe(25);
  });

  it("gives zero for boxes that only touch or are apart", () => {
    const first = { x0: 0, y0: 0, x1: 10, y1: 10 };

    expect(BoxUtil.overlapArea(first, { x0: 10, y0: 0, x1: 20, y1: 10 })).toBe(0);
    expect(BoxUtil.overlapArea(first, { x0: 30, y0: 30, x1: 40, y1: 40 })).toBe(0);
  });
});
