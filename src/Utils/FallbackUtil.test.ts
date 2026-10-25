import { describe, expect, it } from "vitest";
import { FallbackUtil } from "@/Utils/FallbackUtil.ts";

describe("FallbackUtil.nonEmpty()", () => {
  it("keeps a filled value", () => {
    expect(FallbackUtil.nonEmpty("brown", "black")).toBe("brown");
  });

  it("uses the fallback for undefined and for an empty string", () => {
    expect(FallbackUtil.nonEmpty(undefined, "black")).toBe("black");
    expect(FallbackUtil.nonEmpty("", "black")).toBe("black");
  });
});
