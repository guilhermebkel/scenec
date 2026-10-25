import { describe, expect, it } from "vitest";
import { findManifestWarnings, findPackProblems } from "./pack-rules.mjs";

describe("findPackProblems()", () => {
  it("accepts dist, fonts, skills and the root files", () => {
    const paths = ["dist/index.js", "fonts/OFL.txt", "skills/draw-scene/SKILL.md", "package.json", "LICENSE", "README.md"];

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

describe("findManifestWarnings()", () => {
  it("reports npm's auto-correction notice", () => {
    const stderr = "npm warn publish npm auto-corrected some errors in your package.json when publishing.";

    expect(findManifestWarnings(stderr)).toStrictEqual(["npm auto-corrected package.json; run `npm pkg fix` and commit the result"]);
  });

  it("accepts a clean stderr", () => {
    expect(findManifestWarnings("")).toStrictEqual([]);
  });
});
