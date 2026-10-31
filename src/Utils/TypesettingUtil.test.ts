import { describe, expect, it } from "vitest";
import { TypesettingUtil } from "@/Utils/TypesettingUtil.ts";

describe("TypesettingUtil.splitLines()", () => {
  it("keeps explicit newlines when no wrapping or balancing is requested", () => {
    const input = "First line\nSecond line";
    expect(TypesettingUtil.splitLines(input)).toStrictEqual(["First line", "Second line"]);
  });

  it("balances lines into roughly equal lengths when balance is true", () => {
    const input = "Comece cedo e já faça a diferença";
    const balanced = TypesettingUtil.splitLines(input, { hasBalance: true });
    expect(balanced).toHaveLength(2);
    expect(balanced).toStrictEqual(["Comece cedo e já", "faça a diferença"]);
  });

  it("wraps and balances text according to max wrap characters", () => {
    const input = "Designing Great Software with Small Autonomous Teams";
    const wrapped = TypesettingUtil.splitLines(input, { wrap: 25 });
    expect(wrapped.length).toBeGreaterThanOrEqual(2);
    for (const line of wrapped) {
      expect(line.length).toBeLessThan(35);
    }
  });

  it("finds emphasis ranges matching specified words", () => {
    const line = "Aprenda agora mesmo com facilidade e rapidez";
    const ranges = TypesettingUtil.emphasisRanges(line, ["agora", "rapidez"]);
    expect(ranges).toHaveLength(2);
    expect(ranges[0]?.start).toBe(8);
    expect(ranges[0]?.length).toBe(5);
    expect(ranges[1]?.length).toBe(7);
  });

  it("falls back to entire line range when no emphasis words are specified", () => {
    const line = "Single line headline";
    const ranges = TypesettingUtil.emphasisRanges(line);
    expect(ranges).toStrictEqual([{ start: 0, length: line.length }]);
  });
});
