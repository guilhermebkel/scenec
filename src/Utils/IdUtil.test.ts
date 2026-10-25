import { describe, expect, it } from "vitest";
import { IdUtil } from "@/Utils/IdUtil.ts";

describe("IdUtil.lookup()", () => {
  it("finds an own key", () => {
    expect(IdUtil.lookup({ left: 1, right: 2 }, "right")).toBe(2);
  });

  it("does not reach the object prototype", () => {
    expect(IdUtil.lookup({ left: 1 }, "constructor")).toBeUndefined();
  });

  it("ignores keys that are not text", () => {
    expect(IdUtil.lookup({ left: 1 }, 3)).toBeUndefined();
  });
});

describe("IdUtil.isOneOf()", () => {
  it("accepts a listed id and rejects anything else", () => {
    expect(IdUtil.isOneOf(["a", "b"], "a")).toBe(true);
    expect(IdUtil.isOneOf(["a", "b"], "c")).toBe(false);
    expect(IdUtil.isOneOf(["a", "b"], 1)).toBe(false);
  });
});
