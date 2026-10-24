import { SuggestUtil } from "@/utils/SuggestUtil.ts";
import { describe, expect, it } from "vitest";
describe("SuggestUtil.closest()", () => {
  it("finds the name with one wrong letter", () => {
    expect(SuggestUtil.closest("mapp", ["classic", "map", "board"])).toStrictEqual(["map"]);
  });

  it("returns the best match first and at most the limit", () => {
    expect(SuggestUtil.closest("centar", ["centre", "center", "left"], 2)).toStrictEqual(["center", "centre"]);
  });

  it("ignores case", () => {
    expect(SuggestUtil.closest("CENTER", ["center"])).toStrictEqual(["center"]);
  });

  it("returns nothing when no name is close", () => {
    expect(SuggestUtil.closest("zzzzzz", ["map", "board"])).toStrictEqual([]);
  });
});
