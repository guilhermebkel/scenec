import { describe, expect, it } from "vitest";
import { findLicenseProblems } from "./license-rules.mjs";

describe("findLicenseProblems()", () => {
  it("accepts permissive licenses and MPL-2.0 for an unmodified dependency", () => {
    expect(findLicenseProblems({ "MIT": ["zod"], "MPL-2.0": ["@resvg/resvg-js"], "PSF-2.0": ["argparse"] })).toStrictEqual([]);
  });

  it("names each package under a license that is not allowed", () => {
    expect(findLicenseProblems({ "MIT": ["zod"], "GPL-3.0": ["a", "b"] })).toStrictEqual([
      "a has the license GPL-3.0, which is not allowed",
      "b has the license GPL-3.0, which is not allowed",
    ]);
  });
});
