import { SvgUtil } from "@/utils/SvgUtil.ts";
import { describe, expect, it } from "vitest";
describe("SvgUtil.flattenOpacity()", () => {
  it("turns opacity on a shape into fill and stroke opacity", () => {
    expect(SvgUtil.flattenOpacity("<circle cx=\"1\" opacity=\"0.5\"/>")).toBe("<circle cx=\"1\" fill-opacity=\"0.5\" stroke-opacity=\"0.5\"/>");
  });

  it("turns opacity on text into fill opacity", () => {
    expect(SvgUtil.flattenOpacity("<text x=\"1\" opacity=\"0.3\">a</text>")).toBe("<text x=\"1\" fill-opacity=\"0.3\">a</text>");
  });

  it("leaves a shape that already has fill opacity alone", () => {
    const shape = "<rect fill-opacity=\"0.2\" opacity=\"0.9\"/>";

    expect(SvgUtil.flattenOpacity(shape)).toBe(shape);
  });

  it("leaves a group alone, because its opacity applies to the whole layer", () => {
    const group = "<g opacity=\"0.5\"><rect/></g>";

    expect(SvgUtil.flattenOpacity(group)).toBe(group);
  });
});

describe("SvgUtil.escapeXml()", () => {
  it("escapes the ampersand first and then the less-than sign", () => {
    expect(SvgUtil.escapeXml("a & b < c")).toBe("a &amp; b &lt; c");
  });
});
