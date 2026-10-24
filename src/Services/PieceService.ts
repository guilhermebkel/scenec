import type { CompilationContext, HazeLevels, LightState, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";
import { KitService } from "@/Services/KitService.ts";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PieceContext {
  context: CompilationContext;
  light: LightState | null;
  haze: HazeLevels;
  heldBy: Record<string, string>;
}

export interface Pieces {
  body: string;
  casts: string[];
}

export class PieceService {
  private static readonly SHADOW_ELLIPSE = /<ellipse cx="([-\d.]+)" cy="0" rx="([\d.]+)" ry="([\d.]+)" fill="[^"]*"( stroke="none")?\s*\/>/;

  private static readonly DEPTH_TO_SHADE: Record<string, number> = { near: 1, mid: 0.6, far: 0.3 };

  private static readonly UNLIT_KINDS = ["sky", "floor"];

  private static readonly GROUNDED_KINDS = ["ground", "any"];

  private static readonly NO_CAST_ASSETS = ["mountain", "cloud"];

  private static readonly MASK_PADDING = 0.2;

  private static readonly HATCH_INSET = 0.08;

  private static readonly HATCH_LOWER_START = 0.6;

  private static readonly CONTACT_SHADOW_WIDTH = 1.25;

  private static readonly CONTACT_SHADOW_HEIGHT = 1.4;

  private static readonly CAST_OPACITY = 0.42;

  private static readonly NIGHT_CAST = 0.5;

  private static readonly INDOOR_CAST = 0.75;

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
    const ambient = light.isNight ? PieceService.NIGHT_CAST : setting === "indoor" ? PieceService.INDOOR_CAST : 1;
    const opacity = (ambient * PieceService.CAST_OPACITY * light.strength).toFixed(3);
    return `<g clip-path="url(#groundClip)" opacity="${opacity}"><g filter="url(#castF)">${casts.join("")}</g></g>`;
  }

  private static isDecorated(placement: Placement, object: SceneObject, context: CompilationContext): boolean {
    return !context.library[placement.asset].isBackdrop && !PieceService.UNLIT_KINDS.includes(placement.kind) && object.kit !== false;
  }

  private static piece(placement: Placement, pieceContext: PieceContext, casts: string[]): string {
    const { context, haze } = pieceContext;
    const { theme, objects, kit } = context;
    const object = objects[placement.id] ?? {};
    const cord = placement.kind === "ceiling"
      ? `<path d="M${placement.x.toFixed(1)} 0 L${placement.x.toFixed(1)} ${(placement.y - placement.height).toFixed(1)}" stroke="${theme.ink}" stroke-width="2"/>`
      : "";
    const transform = `translate(${placement.x.toFixed(1)} ${placement.y.toFixed(1)}) scale(${placement.scale.toFixed(3)})`;
    const { art, shadow } = PieceService.splitContactShadow(placement.svg, context);
    const shade = PieceService.shadeOf(placement, object, { pieceContext, transform, casts });
    placement.bodySvg = `<g transform="${transform}">${art}</g>`;
    const hazeAttribute = PieceService.hazeAttribute(placement, haze);
    const contact = shadow ? `<g transform="${transform}"${hazeAttribute}>${shadow}</g>` : "";
    let artwork = art;
    let filterId = "";
    let defs = "";
    if (PieceService.isDecorated(placement, object, context)) {
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
    // Why: the contact shadow stays outside the outline filter, otherwise it becomes a ring around the ellipse.
    return cord + contact + (filterId ? `${defs}<g filter="url(#${filterId})">${inner}</g>` : inner) + shade;
  }

  private static hazeAttribute(placement: Placement, haze: HazeLevels): string {
    if (!placement.hasHaze) {
      return "";
    }
    if (placement.depth === "far" && haze.far) {
      return " filter=\"url(#hazeFar)\"";
    }
    return placement.depth === "mid" && haze.mid ? " filter=\"url(#hazeMid)\"" : "";
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
    const { context, light, heldBy } = pieceContext;
    const isLit = light && !context.library[placement.asset].isBackdrop && !PieceService.UNLIT_KINDS.includes(placement.kind) && object.light !== false;
    if (!light || !isLit) {
      return "";
    }
    const box = PieceService.maskBox(placement);
    const opacity = PieceService.DEPTH_TO_SHADE[placement.depth ?? ""] ?? 1;
    const mask = `<mask id="mk_${placement.id}" maskUnits="userSpaceOnUse" x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}"><use href="#b_${placement.id}" transform="${transform}" filter="url(#toWhite)"/></mask>`;
    const isGrounded = PieceService.GROUNDED_KINDS.includes(placement.kind) && !object.on;
    if (isGrounded && context.kit.light?.hasCasts !== false && !heldBy[placement.id] && !((object.elevation ?? 0) > 0)
      && !PieceService.NO_CAST_ASSETS.includes(placement.asset)) {
      casts.push(PieceService.castShape(placement, light, context));
    }
    const layer = light.isHatch
      ? PieceService.hatchShade(placement, light, box, opacity)
      : PieceService.softShade(placement, box, { opacity, isGrounded });
    return `${mask}${layer}`;
  }

  // Why: the cast shadow is the silhouette flattened and slanted away from the light.
  private static castShape(placement: Placement, light: LightState, context: CompilationContext): string {
    const isIndoor = context.setting === "indoor";
    const flatten = isIndoor ? 0.13 : 0.24;
    const slant = (isIndoor ? 0.35 : 0.75) * light.direction;
    return `<use href="#b_${placement.id}" transform="translate(${placement.x.toFixed(1)} ${placement.y.toFixed(1)}) matrix(1 0 ${(-slant).toFixed(3)} ${flatten} 0 0) scale(${placement.scale.toFixed(3)})"/>`;
  }

  // Why: engraving hatches only the shadow side (opposite the light; facing the light, the lower part).
  private static hatchShade(placement: Placement, light: LightState, box: Box, opacity: number): string {
    const { direction } = light;
    const left = direction > 0 ? placement.x + placement.width * PieceService.HATCH_INSET : box.x;
    const right = direction < 0 ? placement.x - placement.width * PieceService.HATCH_INSET : box.x + box.width;
    const top = direction ? box.y : placement.boxTop + placement.height * PieceService.HATCH_LOWER_START;
    const bottom = box.y + box.height;
    return `<g mask="url(#mk_${placement.id})" opacity="${opacity}"><rect x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(0, right - left).toFixed(1)}" height="${Math.max(0, bottom - top).toFixed(1)}" fill="url(#hatchP)"/></g>`;
  }

  private static softShade(placement: Placement, box: Box, shade: { opacity: number; isGrounded: boolean }): string {
    const occlusion = shade.isGrounded
      ? `<rect x="${placement.boxLeft.toFixed(1)}" y="${placement.boxTop.toFixed(1)}" width="${placement.width.toFixed(1)}" height="${placement.height.toFixed(1)}" fill="url(#lgAO)"/>`
      : "";
    return `<g mask="url(#mk_${placement.id})" opacity="${shade.opacity}"><rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}" fill="url(#lgShade)"/>${occlusion}</g>`;
  }
}
