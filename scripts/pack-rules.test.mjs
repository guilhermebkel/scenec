import { describe, expect, it } from "vitest";
import { findPackProblems } from "./pack-rules.mjs";

describe("findPackProblems()", () => {
  it("accepts dist, fonts, skills and the root files", () => {
    const paths = ["dist/index.js", "fonts/OFL.txt", "skills/scenec/SKILL.md", "package.json", "LICENSE", "README.md"];

    expect(findPackProblems(paths, 1000)).toStrictEqual([]);
  });

  it("refuses a test baseline that slipped into the package", () => {
    expect(findPackProblems(["test/visual/cases/a/baseline.svg"], 1000)).toStrictEqual([
      "unexpected file in the package: test/visual/cases/a/baseline.svg",
    ]);
  });

  it("refuses a package above 5 MB", () => {
    expect(findPackProblems(["dist/index.js"], 5 * 1024 * 1024 + 1)).toStrictEqual([
      "package is 5242881 bytes; the limit is 5242880",
    ]);
  });
});
