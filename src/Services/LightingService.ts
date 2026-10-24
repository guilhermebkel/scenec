import type { AssetId } from "@/Protocols/AssetProtocol.ts";
import type { Background, Camera, CompilationContext, LightState, Placement } from "@/Protocols/CompilationProtocol.ts";
import { KitService } from "@/Services/KitService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

export class LightingService {
  private static readonly DIRECTION_TO_FRACTION: Record<string, number> = { left: 0.05, right: 0.95, front: 0.5, top: 0.5 };

  private static readonly DEFAULT_SOURCE = 0.15;

  private static readonly DEFAULT_STRENGTH = 0.6;

  private static readonly LIGHT_LEFT_LIMIT = 0.4;

  private static readonly LIGHT_RIGHT_LIMIT = 0.6;

  private static readonly NIGHT_LUMINANCE = 0.12;

  private static readonly NIGHT_LIGHT = "#C9D8FF";

  private static readonly DAY_LIGHT = "#FFF4DE";

  private static readonly SOURCE_ASSETS: AssetId[] = ["sun", "moon"];

  static resolve(context: CompilationContext, list: Placement[], background: Background): LightState | null {
    const { canvas, kit, setting, width, theme } = context;
    const kitLight = kit.light ?? {};
    const isDisabled = canvas.light === false || (kitLight.mode === "none" && canvas.light == null);
    if (isDisabled) {
      return null;
    }
    const requested = typeof canvas.light === "object" ? canvas.light : {};
    const source = LightingService.sourceOf(requested.from, { list, setting, width });
    const [red, green, blue] = background.shadowRgba;
    return {
      source,
      strength: requested.strength ?? kitLight.strength ?? LightingService.DEFAULT_STRENGTH,
      direction: source < LightingService.LIGHT_LEFT_LIMIT ? 1 : source > LightingService.LIGHT_RIGHT_LIMIT ? -1 : 0,
      isNight: ColorUtil.luminance(setting === "indoor" ? theme.wall : theme.skyTop) < LightingService.NIGHT_LUMINANCE,
      shadowColor: `rgb(${red},${green},${blue})`,
      shadowRgb: [red, green, blue],
      isHatch: kitLight.mode === "hatch",
    };
  }

  private static sourceOf(from: unknown, scene: { list: Placement[]; setting: string; width: number }): number {
    if (typeof from === "number") {
      return from;
    }
    const named = typeof from === "string" ? LightingService.DIRECTION_TO_FRACTION[from] : undefined;
    if (named != null) {
      return named;
    }
    const sourcePlacement = scene.list.find((placement) => LightingService.SOURCE_ASSETS.includes(placement.asset as AssetId))
      ?? (scene.setting === "indoor" ? scene.list.find((placement) => placement.asset === "window") : undefined);
    return sourcePlacement ? sourcePlacement.x / scene.width : LightingService.DEFAULT_SOURCE;
  }

  static lightColorOf(light: LightState): string {
    return light.isNight ? LightingService.NIGHT_LIGHT : LightingService.DAY_LIGHT;
  }

  static applyToBackground(svg: string, light: LightState, context: CompilationContext, camera: Camera): string {
    const { setting, width, height, lines, theme } = context;
    const defs = svg.replace("</defs>", `${LightingService.defs(light, context, camera)}${light.isHatch ? KitService.hatchDefs(theme.ink) : ""}${LightingService.vignetteDef(light)}</defs>`);
    if (light.isHatch) {
      return defs;
    }
    const horizonY = height * lines.horizon;
    if (setting === "indoor") {
      return `${defs}<rect width="${width}" height="${horizonY}" fill="url(#glow)"/><rect width="${width}" height="${height}" fill="url(#falloff)"/>`;
    }
    return `${defs}<rect width="${width}" height="${height * 0.75}" fill="url(#glow)"/>`;
  }

  private static vignetteDef(light: LightState): string {
    const { shadowColor, strength } = light;
    return `<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="${shadowColor}" stop-opacity="0"/><stop offset="1" stop-color="${shadowColor}" stop-opacity="${(0.17 * strength).toFixed(3)}"/></radialGradient>`;
  }

  private static defs(light: LightState, context: CompilationContext, camera: Camera): string {
    const { setting, height, width, lines } = context;
    const { source, strength, direction, shadowColor, shadowRgb } = light;
    const lightColor = LightingService.lightColorOf(light);
    const [fromX, toX] = direction >= 0 ? [0, 1] : [1, 0];
    const horizonY = height * lines.horizon;
    // Why: volume shading lightens the lit side and darkens the opposite one; the base darkens (occlusion).
    return `<linearGradient id="lgShade" x1="${direction ? fromX : 0.5}" y1="0" x2="${direction ? toX : 0.5}" y2="${direction ? 0.35 : 1}"><stop offset="0" stop-color="${lightColor}" stop-opacity="${(0.26 * strength).toFixed(3)}"/><stop offset="0.42" stop-color="${lightColor}" stop-opacity="0"/><stop offset="0.6" stop-color="${shadowColor}" stop-opacity="0"/><stop offset="1" stop-color="${shadowColor}" stop-opacity="${(0.5 * strength).toFixed(3)}"/></linearGradient>`
      + `<linearGradient id="lgAO" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="${shadowColor}" stop-opacity="0"/><stop offset="1" stop-color="${shadowColor}" stop-opacity="${(0.32 * strength).toFixed(3)}"/></linearGradient>`
      + `<filter id="toWhite" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>`
      + `<filter id="castF" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 ${(shadowRgb[0] / 255).toFixed(3)} 0 0 0 0 ${(shadowRgb[1] / 255).toFixed(3)} 0 0 0 0 ${(shadowRgb[2] / 255).toFixed(3)} 0 0 0 1 0"/><feGaussianBlur stdDeviation="${(height * (setting === "indoor" ? 0.006 : 0.003)).toFixed(1)}"/></filter>`
      + `<clipPath id="groundClip"><rect y="${(horizonY * camera.zoom + camera.translateY).toFixed(1)}" width="${width}" height="${height}"/></clipPath>`
      + `<radialGradient id="glow" cx="${source}" cy="${setting === "indoor" ? 0.25 : 0.15}" r="0.75"><stop offset="0" stop-color="${lightColor}" stop-opacity="${(0.55 * strength).toFixed(3)}"/><stop offset="1" stop-color="${lightColor}" stop-opacity="0"/></radialGradient>`
      + `<linearGradient id="falloff" x1="${fromX}" y1="0" x2="${toX}" y2="0"><stop offset="0.35" stop-color="${shadowColor}" stop-opacity="0"/><stop offset="1" stop-color="${shadowColor}" stop-opacity="${direction ? (0.13 * strength).toFixed(3) : 0}"/></linearGradient>`;
  }
}
