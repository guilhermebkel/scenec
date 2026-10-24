import { describe, expect, it } from "vitest";
import { closest } from "./suggest.ts";

describe("suggest.closest()", () => {
  it("finds the name with one wrong letter", () => {
    expect(closest("mapp", ["classic", "map", "board"])).toStrictEqual(["map"]);
  });

  it("returns the best match first and at most the limit", () => {
    expect(closest("centar", ["centre", "center", "left"], 2)).toStrictEqual(["center", "centre"]);
  });

  it("ignores case", () => {
    expect(closest("CENTER", ["center"])).toStrictEqual(["center"]);
  });

  it("returns nothing when no name is close", () => {
    expect(closest("zzzzzz", ["map", "board"])).toStrictEqual([]);
  });
});
