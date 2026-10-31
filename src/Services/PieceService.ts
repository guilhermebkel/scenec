import type { AssetId, AssetKind } from "@/Protocols/AssetProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import type { Depth, CompilationContext, HazeLevels, LightState, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { SceneObject, SettingName } from "@/Protocols/SceneProtocol.ts";
import { KitService } from "@/Services/KitService.ts";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DepthHaze {
  level: keyof HazeLevels;
  attribute: string;
}

interface CastShape {
  flatten: number;
  slant: number;
}

interface PieceContext {
  context: CompilationContext;
  light: LightState | null;
  haze: HazeLevels;
  heldToHolder: Record<string, string>;
}

export interface Pieces {
  body: string;
  casts: string[];
}

export class PieceService {
  private static readonly SHADOW_ELLIPSE = /<ellipse cx="([-\d.]+)" cy="0" rx="([\d.]+)" ry="([\d.]+)" fill="[^"]*"( stroke="none")?\s*\/>/;

  private static readonly DEPTH_TO_SHADE: Record<Depth, number> = { near: 1, mid: 0.6, far: 0.3 };

  private static readonly UNLIT_KINDS: readonly AssetKind[] = ["sky", "floor"];

  private static readonly GROUNDED_KINDS: readonly AssetKind[] = ["ground", "any"];

  private static readonly NO_CAST_ASSETS: AssetId[] = ["mountain", "cloud"];

  private static readonly DEPTH_TO_HAZE: Partial<Record<Depth, DepthHaze>> = {
    far: { level: "far", attribute: " filter=\"url(#hazeFar)\"" },
    mid: { level: "mid", attribute: " filter=\"url(#hazeMid)\"" },
  };

  private static readonly SETTING_TO_AMBIENT: Partial<Record<SettingName, number>> = { indoor: 0.75 };

  private static readonly SETTING_TO_CAST_SHAPE: Partial<Record<SettingName, CastShape>> = {
    indoor: { flatten: 0.13, slant: 0.35 },
  };

  private static readonly OUTDOOR_CAST_SHAPE: CastShape = { flatten: 0.24, slant: 0.75 };

  private static readonly DIGITS = 3;

  private static readonly MASK_PADDING = 0.2;

  private static readonly HATCH_INSET = 0.08;

  private static readonly HATCH_LOWER_START = 0.6;

  private static readonly CONTACT_SHADOW_WIDTH = 1.25;

  private static readonly CONTACT_SHADOW_HEIGHT = 1.4;

  private static readonly CAST_OPACITY = 0.42;

  private static readonly NIGHT_CAST = 0.5;

  static assemble(ordered: Placement[], pieceContext: PieceContext): Pieces {
    const casts: string[] = [];
    const body = ordered.filter((placement) => !placement.isOffView)
      .map((placement) => PieceService.piece(placement, pieceContext, casts))
      .join("\n");
    return { body, casts };
  }

  static castLayer(casts: string[], light: LightState | null, context: CompilationContext): string {
    if (casts.length === 0 || !light) {
      return "";
    }
    const { width, height, setting } = context;
    if (light.isHatch) {
      return `<mask id="castM" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><g filter="url(#toWhite)">${casts.join("")}</g></mask><g clip-path="url(#groundClip)"><rect width="${width}" height="${height}" fill="url(#hatchC)" mask="url(#castM)"/></g>`;
    }
    const settingAmbient = IdUtil.lookup(PieceService.SETTING_TO_AMBIENT, setting) ?? 1;
    const ambient = light.isNight ? PieceService.NIGHT_CAST : settingAmbient;
    const opacity = (ambient * PieceService.CAST_OPACITY * light.strength).toFixed(PieceService.DIGITS);
    return `<g clip-path="url(#groundClip)" opacity="${opacity}" style="mix-blend-mode: multiply;"><g filter="url(#castF)">${casts.join("")}</g></g>`;
  }

  private static isDecorated(placement: Placement, object: SceneObject): boolean {
    return !placement.isBackdrop && !PieceService.UNLIT_KINDS.includes(placement.kind) && object.kit !== false;
  }

  private static piece(placement: Placement, pieceContext: PieceContext, casts: string[]): string {
    const { context, haze } = pieceContext;
    const { theme, idToObject: objects, kit } = context;
    const object = objects[placement.id] ?? {};
    const cord = PieceService.cordOf(placement, theme.ink);
    const scale = placement.scale.toFixed(PieceService.DIGITS);
    const transform = `translate(${placement.x.toFixed(1)} ${placement.y.toFixed(1)}) scale(${scale})`;
    const { art, shadow } = PieceService.splitContactShadow(placement.svg, context);
    const shade = PieceService.shadeOf(placement, object, { pieceContext, transform, casts });
    placement.bodySvg = `<g transform="${transform}">${art}</g>`;
    const hazeAttribute = PieceService.hazeAttribute(placement, haze);
    const contact = shadow ? `<g transform="${transform}"${hazeAttribute}>${shadow}</g>` : "";
    let artwork = art;
    let filterId = "";
    let defs = "";
    if (PieceService.isDecorated(placement, object)) {
      if (kit.outline) {
        artwork = kit.outline.inner ? KitService.innerStroke(art, kit.outline.inner / placement.scale, theme.ink) : art;
        defs += KitService.outlineFilter(`ol_${placement.id}`, kit.outline.w / placement.scale, theme.ink);
        filterId = `ol_${placement.id}`;
      }
      if (kit.hasDrop) {
        defs += KitService.dropFilter(`dr_${placement.id}`, placement.scale);
        filterId = `dr_${placement.id}`;
      }
    }
    const inner = `<g id="${placement.id}" transform="${transform}"${hazeAttribute}><g id="b_${placement.id}">${artwork}</g></g>`;
    const body = (filterId ? `${defs}<g filter="url(#${filterId})">${inner}</g>` : inner) + shade;
    // Why: isolation keeps multiply and screen blending within the piece and stops it from bleeding to background.
    const isolated = `<g style="isolation: isolate;">${body}</g>`;
    // Why: the contact shadow stays outside the outline filter, otherwise it becomes a ring around the ellipse.
    return cord + contact + isolated;
  }

  private static cordOf(placement: Placement, ink: string): string {
    if (placement.kind !== "ceiling") {
      return "";
    }
    const column = placement.x.toFixed(1);
    return `<path d="M${column} 0 L${column} ${(placement.y - placement.height).toFixed(1)}" `
      + `stroke="${ink}" stroke-width="2"/>`;
  }

  private static hazeAttribute(placement: Placement, haze: HazeLevels): string {
    const depthHaze = IdUtil.lookup(PieceService.DEPTH_TO_HAZE, placement.depth);
    if (!placement.hasHaze || !depthHaze || !haze[depthHaze.level]) {
      return "";
    }
    return depthHaze.attribute;
  }

  private static splitContactShadow(svg: string, context: CompilationContext): { art: string; shadow: string } {
    let shadow = "";
    const art = svg.replace(PieceService.SHADOW_ELLIPSE, (match, centerX: string, radiusX: string, radiusY: string) => {
      if (!match.includes(context.theme.shadow)) {
        return match;
      }
      const wide = (Number(radiusX) * PieceService.CONTACT_SHADOW_WIDTH).toFixed(1);
      const tall = (Number(radiusY) * PieceService.CONTACT_SHADOW_HEIGHT).toFixed(1);
      shadow = `<ellipse cx="${centerX}" cy="0" rx="${wide}" ry="${tall}" fill="url(#cshadow)"/>`;
      return "";
    });
    return { art, shadow };
  }

  private static maskBox(placement: Placement): Box {
    const pad = PieceService.MASK_PADDING;
    const round = (value: number): number => Number(value.toFixed(1));
    return {
      x: round(placement.boxLeft - placement.width * pad),
      y: round(placement.boxTop - placement.height * pad),
      width: round(placement.width * (1 + 2 * pad)),
      height: round(placement.height * (1 + pad)),
    };
  }

  private static shadeOf(
    placement: Placement,
    object: SceneObject,
    parts: { pieceContext: PieceContext; transform: string; casts: string[] },
  ): string {
    const { pieceContext, transform, casts } = parts;
    const { context, light, heldToHolder } = pieceContext;
    const isUnlit = placement.isBackdrop || PieceService.UNLIT_KINDS.includes(placement.kind);
    if (!light || isUnlit || object.light === false) {
      return "";
    }
    const box = PieceService.maskBox(placement);
    const opacity = IdUtil.lookup(PieceService.DEPTH_TO_SHADE, placement.depth) ?? 1;
    const mask = `<mask id="mk_${placement.id}" maskUnits="userSpaceOnUse" x="${box.x.toFixed(1)}" `
      + `y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}">`
      + `<use href="#b_${placement.id}" transform="${transform}" filter="url(#toWhite)"/></mask>`;
    const isGrounded = PieceService.GROUNDED_KINDS.includes(placement.kind) && !object.on;
    const isHeld = Boolean(heldToHolder[placement.id]);
    const isCasting = isGrounded && context.kit.light?.hasCasts !== false && !isHeld && !((object.elevation ?? 0) > 0)
      && !PieceService.NO_CAST_ASSETS.includes(placement.asset as AssetId);
    if (isCasting) {
      const cast = PieceService.castShape(placement, light, context);
      casts.push(cast);
    }
    const layer = light.isHatch
      ? PieceService.hatchShade(placement, light, box, opacity)
      : PieceService.softShade(placement, box, { opacity, isGrounded });
    return `${mask}${layer}`;
  }

  private static castShape(placement: Placement, light: LightState, context: CompilationContext): string {
    // Why: the cast shadow is the silhouette flattened and slanted away from the light.
    const shape = IdUtil.lookup(PieceService.SETTING_TO_CAST_SHAPE, context.setting) ?? PieceService.OUTDOOR_CAST_SHAPE;
    const slant = shape.slant * light.direction;
    const digits = PieceService.DIGITS;
    return `<use href="#b_${placement.id}" transform="translate(${placement.x.toFixed(1)} ${placement.y.toFixed(1)}) `
      + `matrix(1 0 ${(-slant).toFixed(digits)} ${shape.flatten} 0 0) scale(${placement.scale.toFixed(digits)})"/>`;
  }

  private static hatchShade(placement: Placement, light: LightState, box: Box, opacity: number): string {
    // Why: engraving hatches only the shadow side (opposite the light; facing the light, the lower part).
    const { direction } = light;
    const left = direction > 0 ? placement.x + placement.width * PieceService.HATCH_INSET : box.x;
    const right = direction < 0 ? placement.x - placement.width * PieceService.HATCH_INSET : box.x + box.width;
    const top = direction ? box.y : placement.boxTop + placement.height * PieceService.HATCH_LOWER_START;
    const bottom = box.y + box.height;
    return `<g mask="url(#mk_${placement.id})" opacity="${opacity}"><rect x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(0, right - left).toFixed(1)}" height="${Math.max(0, bottom - top).toFixed(1)}" fill="url(#hatchP)"/></g>`;
  }

  private static softShade(placement: Placement, box: Box, shade: { opacity: number; isGrounded: boolean }): string {
    const occlusion = shade.isGrounded
      ? `<rect x="${placement.boxLeft.toFixed(1)}" y="${placement.boxTop.toFixed(1)}" width="${placement.width.toFixed(1)}" height="${placement.height.toFixed(1)}" fill="url(#lgAO)" style="mix-blend-mode: multiply;"/>`
      : "";
    return `<g mask="url(#mk_${placement.id})" opacity="${shade.opacity}">`
      + `<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}" fill="url(#lgLight)" style="mix-blend-mode: screen;"/>`
      + `<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}" fill="url(#lgShade)" style="mix-blend-mode: multiply;"/>`
      + `${occlusion}</g>`;
  }
}
