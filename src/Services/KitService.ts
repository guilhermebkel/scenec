import { FlatKit } from "@/Resources/Kits/FlatKit.ts";
import { OutlineKit } from "@/Resources/Kits/OutlineKit.ts";
import { HatchKit } from "@/Resources/Kits/HatchKit.ts";
import { RisoKit } from "@/Resources/Kits/RisoKit.ts";
import { PaperKit } from "@/Resources/Kits/PaperKit.ts";
import { SketchKit } from "@/Resources/Kits/SketchKit.ts";
import type { KitId, KitLightMode, KitSceneName, KitTextureName } from "@/Protocols/KitProtocol.ts";
import { RegistryUtil } from "@/Utils/RegistryUtil.ts";
import { BaseKit } from "@/Resources/Kits/BaseKit.ts";
import type { CompilationContext } from "@/Protocols/CompilationProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";

export interface OutlineFilterOptions {
  shadeX?: number;
  shadeY?: number;
  wobble?: number;
}

export class KitService {
  static readonly KIT_ID_TO_KIT: Record<KitId, BaseKit> = RegistryUtil.indexById(
    [new FlatKit(), new OutlineKit(), new HatchKit(), new RisoKit(), new PaperKit(), new SketchKit()],
  );

  private static readonly WHOLE_KIT_HEIGHT = 900;

  private static readonly LIGHT_MODE_TO_IS_HATCHED: Record<KitLightMode, boolean> = { none: false, hatch: true };

  private static readonly DIGITS = 3;

  private static readonly WOBBLE_FREQUENCY = 0.035;

  private static readonly WOBBLE_SEED = 9;

  private static readonly SMALL_SHAPE = 5;

  private static readonly DROP_BLUR = 2.2;

  private static readonly DROP_OFFSET_X = 2.5;

  private static readonly DROP_OFFSET_Y = 4;

  private static readonly SCENE_TO_FILTER: Record<KitSceneName, string> = {
    // Why: posterize to flat ink, add an offset pink copy where there is ink (alpha = 1 - luminance) so light areas stay, then light paper pores.
    riso: `<filter id="kitScene" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`
      + `<feComponentTransfer in="SourceGraphic" result="post">`
      + `<feFuncR type="discrete" tableValues="0.1 0.35 0.6 0.85 1"/>`
      + `<feFuncG type="discrete" tableValues="0.1 0.35 0.6 0.85 1"/>`
      + `<feFuncB type="discrete" tableValues="0.12 0.38 0.62 0.86 1"/></feComponentTransfer>`
      + `<feOffset in="post" dx="2.2" dy="1.4" result="off"/>`
      + `<feColorMatrix in="off" type="matrix" `
      + `values="0 0 0 0 1  0 0 0 0 0.36  0 0 0 0 0.66  -0.2 -0.4 -0.08 0.62 0" result="tint"/>`
      + `<feBlend in="post" in2="tint" mode="multiply" result="reg"/>`
      + `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="7" result="nz"/>`
      + `<feColorMatrix in="nz" type="matrix" `
      + `values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.94  0 0 0 -2.4 1.25" result="spk"/>`
      + `<feComposite in="spk" in2="reg" operator="in" result="spk2"/>`
      + `<feMerge><feMergeNode in="reg"/><feMergeNode in="spk2"/></feMerge></filter>`,
    sketch: `<filter id="kitScene" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`
      + `<feColorMatrix in="SourceGraphic" type="saturate" values="0.55" result="ds"/>`
      + `<feComponentTransfer in="ds" result="wash">`
      + `<feFuncR type="linear" slope="0.58" intercept="0.42"/>`
      + `<feFuncG type="linear" slope="0.58" intercept="0.42"/>`
      + `<feFuncB type="linear" slope="0.58" intercept="0.4"/></feComponentTransfer>`
      + `<feColorMatrix in="SourceGraphic" type="matrix" `
      + `values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" result="g"/>`
      + `<feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" `
      + `preserveAlpha="true" result="e1"/>`
      + `<feConvolveMatrix in="g" order="3" kernelMatrix="1 1 1 1 -8 1 1 1 1" preserveAlpha="true" result="e2"/>`
      + `<feComposite in="e1" in2="e2" operator="arithmetic" k2="1" k3="1" result="e"/>`
      + `<feColorMatrix in="e" type="matrix" `
      + `values="0 0 0 0 0.22  0 0 0 0 0.22  0 0 0 0 0.26  2.2 2.2 2.2 0 0" result="lines"/>`
      + `<feMorphology in="lines" operator="dilate" radius="0.6" result="lines2"/>`
      + `<feMerge><feMergeNode in="wash"/><feMergeNode in="lines2"/></feMerge></filter>`,
  };

  private static readonly TEXTURE_TO_FILTER: Record<KitTextureName, { defs: string; opacity: string }> = {
    paper: {
      defs: `<filter id="kitTex" x="0" y="0" width="100%" height="100%">`
        + `<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3"/>`
        + `<feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 -1.6 1.05"/></filter>`,
      opacity: "0.05",
    },
    fiber: {
      defs: `<filter id="kitTex" x="0" y="0" width="100%" height="100%">`
        + `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="f"/>`
        + `<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11" result="m"/>`
        + `<feComposite in="f" in2="m" operator="arithmetic" k2="0.6" k3="0.4" result="mix"/>`
        + `<feColorMatrix in="mix" type="matrix" `
        + `values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.28  0.5 0 0 0 -0.12"/></filter>`,
      opacity: "0.55",
    },
  };

  private static fixed(value: number): string {
    return value.toFixed(KitService.DIGITS);
  }

  static outlineFilter(id: string, radius: number, ink: string, options: OutlineFilterOptions = {}): string {
    const { shadeX = 0, shadeY = 0, wobble = 0 } = options;
    const isWeighted = shadeX !== 0 || shadeY !== 0;
    const weighted = isWeighted
      ? `<feOffset in="d" dx="${KitService.fixed(shadeX)}" dy="${KitService.fixed(shadeY)}" result="d2"/>`
      + `<feMerge result="dm"><feMergeNode in="d"/><feMergeNode in="d2"/></feMerge>`
      : `<feOffset in="d" dx="0" dy="0" result="dm"/>`;
    // Why: the fixed seed keeps the hand-inked wobble identical on every render.
    const wobbled = wobble > 0
      ? `<feTurbulence type="fractalNoise" baseFrequency="${KitService.WOBBLE_FREQUENCY}" numOctaves="2" `
      + `seed="${KitService.WOBBLE_SEED}" result="n"/>`
      + `<feDisplacementMap in="dm" in2="n" scale="${KitService.fixed(wobble)}" xChannelSelector="R" `
      + `yChannelSelector="G" result="dw"/>`
      : `<feOffset in="dm" dx="0" dy="0" result="dw"/>`;
    return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%">`
      + `<feMorphology in="SourceAlpha" operator="dilate" radius="${KitService.fixed(radius)}" result="d"/>`
      + weighted + wobbled
      + `<feFlood flood-color="${ink}"/><feComposite in2="dw" operator="in" result="o"/>`
      + `<feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  static dropFilter(id: string, scale: number): string {
    const blur = KitService.fixed(KitService.DROP_BLUR / scale);
    const offsetX = KitService.fixed(KitService.DROP_OFFSET_X / scale);
    const offsetY = KitService.fixed(KitService.DROP_OFFSET_Y / scale);
    return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="150%">`
      + `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}"/>`
      + `<feOffset dx="${offsetX}" dy="${offsetY}" result="b"/>`
      + `<feFlood flood-color="#2B1D10" flood-opacity="0.42"/><feComposite in2="b" operator="in" result="sh"/>`
      + `<feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  static innerStroke(art: string, width: number, ink: string, detailRatio = 1): string {
    const shapes = art.replace(/<(rect|path|circle|ellipse|polygon)\b([^>]*?)\/>/g, (match: string, tag: string, attrs: string) => {
      const hasStroke = /\bstroke=/.test(attrs);
      // Why: shapes with opacity or no fill (glints, transparencies) stay without a stroke; the rest get a thin inner line.
      const isUnpainted = /\bopacity=|fill-opacity=|fill="none"|fill="url\(/.test(attrs);
      if (isUnpainted && !hasStroke) {
        return `<${tag}${attrs} stroke="none"/>`;
      }
      // Why: small parts (buttons, glints, fingertips) take the thinner detail line; big shapes keep the contour line.
      const isDetail = !hasStroke && KitService.isSmallShape(attrs);
      return isDetail ? `<${tag}${attrs} stroke-width="${KitService.fixed(width * detailRatio)}"/>` : match;
    });
    return `<g stroke="${ink}" stroke-width="${KitService.fixed(width)}" stroke-linejoin="round">${shapes}</g>`;
  }

  private static isSmallShape(attrs: string): boolean {
    const sizes = [...attrs.matchAll(/\b(?:r|rx|ry)="([\d.]+)"/g)].map((match) => Number(match[1]) * 2)
      .concat([...attrs.matchAll(/\b(?:width|height)="([\d.]+)"/g)].map((match) => Number(match[1])));
    return sizes.length > 0 && Math.min(...sizes) <= KitService.SMALL_SHAPE;
  }

  static hatchDefs(ink: string): string {
    return `<pattern id="hatchP" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
      + `<rect x="0" y="0" width="1.5" height="7" fill="${ink}" fill-opacity="0.5"/></pattern>`
      + `<pattern id="hatchC" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">`
      + `<rect x="0" y="0" width="1.4" height="6" fill="${ink}" fill-opacity="0.42"/>`
      + `<rect x="0" y="0" width="6" height="1.2" fill="${ink}" fill-opacity="0.22"/></pattern>`;
  }

  static sceneFilter(kind: KitSceneName): string {
    return KitService.SCENE_TO_FILTER[kind];
  }

  static texture(kind: KitTextureName | undefined, width: number, height: number): string {
    const filter = IdUtil.lookup(KitService.TEXTURE_TO_FILTER, kind);
    if (!filter) {
      return "";
    }
    return `${filter.defs}<rect width="${width}" height="${height}" filter="url(#kitTex)" opacity="${filter.opacity}"/>`;
  }

  static applyWholeKit(result: CompileResult, context: CompilationContext): CompileResult {
    const { canvas, kit, width } = context;
    const isHatched = IdUtil.lookup(KitService.LIGHT_MODE_TO_IS_HATCHED, kit.light?.mode) === true;
    if (kit.outline || isHatched) {
      result.warnings.push(
        `in ${canvas.mode} mode, kit '${canvas.kit}' applies only filter and texture; `
        + `per-object outline and hatching exist in classic mode`,
      );
    }
    if (!kit.scene && !kit.texture) {
      return result;
    }
    const height = canvas.height ?? KitService.WHOLE_KIT_HEIGHT;
    const svg = result.svg.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>\s*)$/, (_match, open: string, body: string, close: string) => {
      const texts: string[] = [];
      const art = body.replace(/<text\b[\s\S]*?<\/text>/g, (text) => {
        texts.push(text);
        return "";
      });
      const defs = kit.scene ? KitService.sceneFilter(kit.scene) : "";
      const filter = kit.scene ? " filter=\"url(#kitScene)\"" : "";
      const texture = KitService.texture(kit.texture, width, height);
      // Why: the text stays outside the filter (sharp) and above the texture.
      return `${open}<defs>${defs}</defs><g${filter}>${art}</g>${texture}${texts.join("")}${close}`;
    });
    return { ...result, svg: SvgUtil.flattenOpacity(svg) };
  }
}
