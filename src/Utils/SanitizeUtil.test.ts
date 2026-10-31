import { SanitizeUtil } from "@/Utils/SanitizeUtil.ts";
import { describe, expect, it } from "vitest";
import { UnsafeSvgError } from "@/Errors/UnsafeSvgError.ts";

describe("SanitizeUtil.sanitizeSvg()", () => {
  it("removes a script element together with its content", () => {
    const svg = "<svg viewBox=\"0 0 10 10\"><script>alert(1)</script><rect width=\"4\" height=\"4\"/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg viewBox=\"0 0 10 10\"><rect width=\"4\" height=\"4\"/></svg>");
  });

  it("removes a foreignObject and the elements nested in it", () => {
    const svg = "<svg><foreignObject><div><p>hi</p></div></foreignObject><circle r=\"2\"/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><circle r=\"2\"/></svg>");
  });

  it("removes event handler attributes and keeps the others", () => {
    const svg = "<svg><rect onclick=\"steal()\" onload='x()' width=\"4\"/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><rect width=\"4\"/></svg>");
  });

  it("drops an external link and keeps an internal one", () => {
    const svg = "<svg><use href=\"http://evil.test/a.svg#x\"/><use href=\"#local\"/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><use/><use href=\"#local\"/></svg>");
  });

  it("keeps an embedded png image and drops a javascript link", () => {
    const svg = "<svg><image href=\"data:image/png;base64,AAAA\"/><a href=\"javascript:alert(1)\"><rect/></a></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><image href=\"data:image/png;base64,AAAA\"/></svg>");
  });

  it("drops a paint that points to an external url and keeps a gradient reference", () => {
    const svg = "<svg><rect fill=\"url(http://evil.test/p)\"/><rect fill=\"url(#g)\"/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><rect/><rect fill=\"url(#g)\"/></svg>");
  });

  it("refuses an entity declaration", () => {
    const svg = "<!DOCTYPE svg [<!ENTITY boom \"boom\">]><svg>&boom;</svg>";

    expect(() => SanitizeUtil.sanitizeSvg(svg)).toThrow(new UnsafeSvgError("<!ENTITY> declarations are not allowed in imported SVG"));
  });

  it("drops an attribute that uses an entity other than the standard ones", () => {
    const svg = "<svg><text title=\"&custom;\" x=\"1\">a &amp; b</text></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><text x=\"1\">a &amp; b</text></svg>");
  });

  it("removes the xml declaration, the doctype and comments", () => {
    const svg = "<?xml version=\"1.0\"?><!DOCTYPE svg><!-- note --><svg><g/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><g/></svg>");
  });

  it("turns CDATA text into escaped text", () => {
    const svg = "<svg><text><![CDATA[a < b & c]]></text></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><text>a &lt; b &amp; c</text></svg>");
  });

  it("removes a style element, which could import outside content", () => {
    const svg = "<svg><style>@import url(http://evil.test/x.css);</style><g/></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><g/></svg>");
  });

  it("keeps mix-blend-mode and isolation attributes and styles", () => {
    const svg = "<svg><g style=\"mix-blend-mode: multiply; isolation: isolate\"><rect style=\"mix-blend-mode: screen\"/></g></svg>";

    expect(SanitizeUtil.sanitizeSvg(svg)).toBe("<svg><g style=\"mix-blend-mode: multiply; isolation: isolate\"><rect style=\"mix-blend-mode: screen\"/></g></svg>");
  });
});
