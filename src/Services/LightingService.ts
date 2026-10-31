import type { AssetId } from "@/Protocols/AssetProtocol.ts";
import type { Background, Camera, CelestialGlow, CompilationContext, LightShaft, LightState, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { KitLightMode } from "@/Protocols/KitProtocol.ts";
import type { SettingName, TimeName } from "@/Protocols/SceneProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { KitService } from "@/Services/KitService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

interface SettingLight {
  surface: "wall" | "skyTop";
  blur: number;
  glowY: number;
  extraSourceAsset: AssetId | null;
  glowLayers: (defs: string, size: { width: number; height: number; horizonY: number; light: LightState }) => string;
}

interface LightModeTraits {
  isOff: boolean;
  isHatch: boolean;
}

export class LightingService {
  private static readonly DIRECTION_TO_FRACTION: Record<"left" | "right" | "front" | "top", number> = {
    left: 0.05, right: 0.95, front: 0.5, top: 0.5,
  };

  private static readonly MODE_TO_TRAITS: Record<KitLightMode, LightModeTraits> = {
    none: { isOff: true, isHatch: false },
    hatch: { isOff: false, isHatch: true },
  };

  private static readonly TIME_TO_LIGHT_COLOR: Record<TimeName, string> = {
    golden: "#FFAE42",
    noon: "#FFFFF0",
    overcast: "#D8DFE8",
    dusk: "#E8A0BF",
    night: "#9BB8ED",
  };

  private static readonly TIME_TO_GRADE: Record<TimeName, string> = {
    golden: `<filter id="timeGrade" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.08 0 0 0 0.04 0 1.02 0 0 0.02 0 0 0.88 0 -0.02 0 0 0 1 0"/></filter>`,
    noon: `<filter id="timeGrade" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.05" intercept="-0.025"/><feFuncG type="linear" slope="1.05" intercept="-0.025"/><feFuncB type="linear" slope="1.05" intercept="-0.025"/></feComponentTransfer></filter>`,
    overcast: `<filter id="timeGrade" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.75"/><feComponentTransfer><feFuncR type="linear" slope="0.95" intercept="0.04"/><feFuncG type="linear" slope="0.95" intercept="0.04"/><feFuncB type="linear" slope="0.98" intercept="0.05"/></feComponentTransfer></filter>`,
    dusk: `<filter id="timeGrade" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.05 0 0 0 0.05 0 0.92 0 0 0.01 0 0 1.08 0 0.06 0 0 0 1 0"/></filter>`,
    night: `<filter id="timeGrade" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.65 0 0 0 0.01 0 0.72 0 0 0.02 0 0 0.92 0 0.08 0 0 0 1 0"/></filter>`,
  };

  private static readonly PANE_BOXES: readonly [number, number, number, number][] = [
    [0.08, 0.08, 0.46, 0.46],
    [0.54, 0.08, 0.92, 0.46],
    [0.08, 0.54, 0.46, 0.92],
    [0.54, 0.54, 0.92, 0.92],
  ];

  private static readonly SHAFT_WIDTH_RATIO = 0.4;

  private static readonly FLOOR_PATCH_START = 0.15;

  private static readonly FLOOR_PATCH_SPAN = 0.7;

  private static readonly FLOOR_LEFT_FAR = 2.2;

  private static readonly FLOOR_LEFT_NEAR = 0.4;

  private static readonly FLOOR_PANE_OPACITY = 0.2;

  private static readonly INDOOR_LIGHT: SettingLight = {
    surface: "wall",
    blur: 0.006,
    glowY: 0.25,
    extraSourceAsset: "window",
    glowLayers: (defs, { width, height, horizonY, light }) => {
      const shaftLayer = light.shaft ? LightingService.indoorShaftSvg(light.shaft, light, { width, height, horizonY }) : "";
      return `${defs}<rect width="${width}" height="${horizonY}" fill="url(#glow)" style="mix-blend-mode: screen;"/>`
        + `<rect width="${width}" height="${height}" fill="url(#falloff)" style="mix-blend-mode: multiply;"/>`
        + shaftLayer;
    },
  };

  private static readonly OPEN_LIGHT: SettingLight = {
    surface: "skyTop",
    blur: 0.003,
    glowY: 0.15,
    extraSourceAsset: null,
    glowLayers: (defs, { width, height, light }) => {
      const sunLayer = light.celestialGlow
        ? `<rect width="${width}" height="${height}" fill="url(#sunGlow)" style="mix-blend-mode: screen;"/>`
        : "";
      return `${defs}<rect width="${width}" height="${height * 0.75}" fill="url(#glow)" style="mix-blend-mode: screen;"/>${sunLayer}`;
    },
  };

  private static readonly SETTING_TO_LIGHT: Partial<Record<SettingName, SettingLight>> = {
    indoor: LightingService.INDOOR_LIGHT,
  };

  private static readonly DEFAULT_SOURCE = 0.15;

  private static readonly DEFAULT_STRENGTH = 0.6;

  private static readonly LIGHT_LEFT_LIMIT = 0.4;

  private static readonly LIGHT_RIGHT_LIMIT = 0.6;

  private static readonly NIGHT_LUMINANCE = 0.12;

  private static readonly NIGHT_LIGHT = "#C9D8FF";

  private static readonly DAY_LIGHT = "#FFF4DE";

  private static readonly SOURCE_ASSETS: readonly AssetId[] = ["sun", "moon"];

  static resolve(context: CompilationContext, list: Placement[], background: Background): LightState | null {
    const { canvas, kit, setting, width, theme } = context;
    const kitLight = kit.light ?? {};
    const modeTraits = IdUtil.lookup(LightingService.MODE_TO_TRAITS, kitLight.mode);
    const isDisabled = canvas.light === false || (modeTraits?.isOff === true && canvas.light == null);
    if (isDisabled) {
      return null;
    }
    const requested = typeof canvas.light === "object" ? canvas.light : {};
    const settingLight = LightingService.settingLightOf(setting);
    const { extraSourceAsset } = settingLight;
    const source = LightingService.sourceOf(requested.from, { list, width, extraSourceAsset });
    const isNight = canvas.time === "night"
      || ColorUtil.luminance(theme[settingLight.surface]) < LightingService.NIGHT_LUMINANCE;
    const [red, green, blue] = background.shadowRgba;
    const celestial = list.find((placement) => IdUtil.isOneOf(LightingService.SOURCE_ASSETS, placement.asset));
    const celestialGlow: CelestialGlow | null = celestial
      ? { cx: celestial.x / width, cy: celestial.y / context.height }
      : null;
    const shaft = LightingService.resolveShaft(setting, list, requested, width);
    return {
      source,
      strength: requested.strength ?? kitLight.strength ?? LightingService.DEFAULT_STRENGTH,
      direction: LightingService.directionOf(source),
      isNight,
      shadowColor: `rgb(${red},${green},${blue})`,
      shadowRgb: [red, green, blue],
      isHatch: modeTraits?.isHatch === true,
      time: canvas.time,
      shaft,
      celestialGlow,
    };
  }

  private static resolveShaft(
    setting: SettingName,
    list: readonly Placement[],
    requested: Record<string, unknown>,
    width: number,
  ): LightShaft | null {
    if (setting !== "indoor" || requested.shafts === false) {
      return null;
    }
    const windowPlacement = list.find((placement) => placement.asset === "window");
    if (!windowPlacement) {
      return null;
    }
    const winX = windowPlacement.x;
    const winY = windowPlacement.y;
    const winW = windowPlacement.width * windowPlacement.scale;
    const winH = windowPlacement.height * windowPlacement.scale;
    const isRight = winX > width * 0.5;
    const floorLeft = isRight
      ? winX - winW * LightingService.FLOOR_LEFT_FAR
      : winX + winW * LightingService.FLOOR_LEFT_NEAR;
    const floorRight = isRight
      ? winX - winW * LightingService.FLOOR_LEFT_NEAR
      : winX + winW * LightingService.FLOOR_LEFT_FAR;
    return {
      windowX: winX,
      windowY: winY,
      windowWidth: winW,
      windowHeight: winH,
      floorLeft,
      floorRight,
    };
  }

  static timeGradeFilter(time: TimeName): string {
    return LightingService.TIME_TO_GRADE[time];
  }

  private static settingLightOf(setting: SettingName): SettingLight {
    return IdUtil.lookup(LightingService.SETTING_TO_LIGHT, setting) ?? LightingService.OPEN_LIGHT;
  }

  private static directionOf(source: number): number {
    if (source < LightingService.LIGHT_LEFT_LIMIT) {
      return 1;
    }
    return source > LightingService.LIGHT_RIGHT_LIMIT ? -1 : 0;
  }

  private static sourceOf(
    from: unknown, scene: { list: Placement[]; width: number; extraSourceAsset: AssetId | null },
  ): number {
    if (typeof from === "number") {
      return from;
    }
    const named = IdUtil.lookup(LightingService.DIRECTION_TO_FRACTION, from);
    if (named != null) {
      return named;
    }
    const isSource = (placement: Placement): boolean => IdUtil.isOneOf(LightingService.SOURCE_ASSETS, placement.asset);
    const isExtra = (placement: Placement): boolean => placement.asset === scene.extraSourceAsset;
    const sourcePlacement = scene.list.find(isSource)
      ?? (scene.extraSourceAsset ? scene.list.find(isExtra) : undefined);
    return sourcePlacement ? sourcePlacement.x / scene.width : LightingService.DEFAULT_SOURCE;
  }

  static lightColorOf(light: LightState): string {
    if (light.time != null) {
      const timeColor = IdUtil.lookup(LightingService.TIME_TO_LIGHT_COLOR, light.time);
      if (timeColor != null) {
        return timeColor;
      }
    }
    return light.isNight ? LightingService.NIGHT_LIGHT : LightingService.DAY_LIGHT;
  }

  static applyToBackground(svg: string, light: LightState, context: CompilationContext, camera: Camera): string {
    const { setting, width, height, lines, theme } = context;
    const hatchDefs = light.isHatch ? KitService.hatchDefs(theme.ink) : "";
    const lightDefs = `${LightingService.defs(light, context, camera)}${hatchDefs}${LightingService.vignetteDef(light)}`;
    const defs = svg.replace("</defs>", `${lightDefs}</defs>`);
    if (light.isHatch) {
      return defs;
    }
    const horizonY = height * lines.horizon;
    return LightingService.settingLightOf(setting).glowLayers(defs, { width, height, horizonY, light });
  }

  private static vignetteDef(light: LightState): string {
    const { shadowColor, strength } = light;
    return `<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">`
      + `<stop offset="0.6" stop-color="${shadowColor}" stop-opacity="0"/>`
      + `<stop offset="1" stop-color="${shadowColor}" stop-opacity="${(0.17 * strength).toFixed(3)}"/></radialGradient>`;
  }

  private static defs(light: LightState, context: CompilationContext, camera: Camera): string {
    const { setting, height, width, lines } = context;
    const { source, strength, direction, shadowColor, shadowRgb } = light;
    const lightColor = LightingService.lightColorOf(light);
    const [fromX, toX] = direction >= 0 ? [0, 1] : [1, 0];
    const horizonY = height * lines.horizon;
    const settingLight = LightingService.settingLightOf(setting);
    const blur = (height * settingLight.blur).toFixed(1);
    const rgb = shadowRgb.map((channel) => (channel / 255).toFixed(3));
    const fade = (factor: number): string => (factor * strength).toFixed(3);
    const falloffOpacity = direction ? fade(0.13) : 0;
    // Why: volume shading: lgLight for lit side (screen mode) and lgShade for shadow side (multiply mode).
    return `<linearGradient id="lgLight" x1="${direction ? fromX : 0.5}" y1="0" x2="${direction ? toX : 0.5}" `
      + `y2="${direction ? 0.35 : 1}"><stop offset="0" stop-color="${lightColor}" stop-opacity="${fade(0.26)}"/>`
      + `<stop offset="0.42" stop-color="${lightColor}" stop-opacity="0"/></linearGradient>`
      + `<linearGradient id="lgShade" x1="${direction ? fromX : 0.5}" y1="0" x2="${direction ? toX : 0.5}" `
      + `y2="${direction ? 0.35 : 1}"><stop offset="0.6" stop-color="${shadowColor}" stop-opacity="0"/>`
      + `<stop offset="1" stop-color="${shadowColor}" stop-opacity="${fade(0.5)}"/></linearGradient>`
      + `<linearGradient id="lgAO" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="${shadowColor}" `
      + `stop-opacity="0"/><stop offset="1" stop-color="${shadowColor}" stop-opacity="${fade(0.32)}"/></linearGradient>`
      + `<filter id="toWhite" color-interpolation-filters="sRGB"><feColorMatrix `
      + `values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>`
      + `<filter id="castF" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">`
      + `<feColorMatrix values="0 0 0 0 ${rgb[0]} 0 0 0 0 ${rgb[1]} 0 0 0 0 ${rgb[2]} 0 0 0 1 0"/>`
      + `<feGaussianBlur stdDeviation="${blur}"/></filter>`
      + `<clipPath id="groundClip"><rect y="${(horizonY * camera.zoom + camera.translateY).toFixed(1)}" `
      + `width="${width}" height="${height}"/></clipPath>`
      + `<radialGradient id="glow" cx="${source}" cy="${settingLight.glowY}" r="0.75">`
      + `<stop offset="0" stop-color="${lightColor}" stop-opacity="${fade(0.55)}"/>`
      + `<stop offset="1" stop-color="${lightColor}" stop-opacity="0"/></radialGradient>`
      + `<linearGradient id="falloff" x1="${fromX}" y1="0" x2="${toX}" y2="0">`
      + `<stop offset="0.35" stop-color="${shadowColor}" stop-opacity="0"/>`
      + `<stop offset="1" stop-color="${shadowColor}" stop-opacity="${falloffOpacity}"/></linearGradient>`
      + LightingService.sunGlowDef(light, lightColor, fade)
      + LightingService.shaftGradDef(light, lightColor, fade, { width, height });
  }

  private static sunGlowDef(light: LightState, lightColor: string, fade: (factor: number) => string): string {
    if (!light.celestialGlow) {
      return "";
    }
    return `<radialGradient id="sunGlow" cx="${light.celestialGlow.cx.toFixed(3)}" cy="${light.celestialGlow.cy.toFixed(3)}" r="0.32">`
      + `<stop offset="0" stop-color="${lightColor}" stop-opacity="${fade(0.38)}"/>`
      + `<stop offset="0.45" stop-color="${lightColor}" stop-opacity="${fade(0.14)}"/>`
      + `<stop offset="1" stop-color="${lightColor}" stop-opacity="0"/></radialGradient>`;
  }

  private static shaftGradDef(
    light: LightState,
    lightColor: string,
    fade: (factor: number) => string,
    bounds: { width: number; height: number },
  ): string {
    if (!light.shaft) {
      return "";
    }
    const { width, height } = bounds;
    const shaftX = (light.shaft.windowX / width).toFixed(3);
    const shaftY = (light.shaft.windowY / height).toFixed(3);
    const targetX = (((light.shaft.floorLeft + light.shaft.floorRight) / 2) / width).toFixed(3);
    return `<linearGradient id="shaftGrad" x1="${shaftX}" y1="${shaftY}" x2="${targetX}" y2="1">`
      + `<stop offset="0" stop-color="${lightColor}" stop-opacity="${fade(0.22)}"/>`
      + `<stop offset="0.75" stop-color="${lightColor}" stop-opacity="${fade(0.06)}"/>`
      + `<stop offset="1" stop-color="${lightColor}" stop-opacity="0"/></linearGradient>`;
  }

  private static indoorShaftSvg(
    shaft: LightShaft,
    light: LightState,
    bounds: { width: number; height: number; horizonY: number },
  ): string {
    const { height, horizonY } = bounds;
    const halfWidth = shaft.windowWidth * LightingService.SHAFT_WIDTH_RATIO;
    const winLeft = shaft.windowX - halfWidth;
    const winRight = shaft.windowX + halfWidth;
    const winBottom = shaft.windowY;
    const shaftPoints = `${winLeft.toFixed(1)},${winBottom.toFixed(1)} ${winRight.toFixed(1)},${winBottom.toFixed(1)} `
      + `${shaft.floorRight.toFixed(1)},${height.toFixed(1)} ${shaft.floorLeft.toFixed(1)},${height.toFixed(1)}`;
    const shaftPolygon = `<polygon points="${shaftPoints}" fill="url(#shaftGrad)" style="mix-blend-mode: screen;"/>`;
    const lightColor = LightingService.lightColorOf(light);
    const paneOpacity = (LightingService.FLOOR_PANE_OPACITY * light.strength).toFixed(3);
    const floorHeight = height - horizonY;
    let panesSvg = "";
    LightingService.PANE_BOXES.forEach(([u0, v0, u1, v1]) => {
      const mapPoint = (coordU: number, coordV: number): string => {
        const spanRatio = LightingService.FLOOR_PATCH_START + coordV * LightingService.FLOOR_PATCH_SPAN;
        const paneY = horizonY + spanRatio * floorHeight;
        const progress = (paneY - horizonY) / floorHeight;
        const leftAtY = winLeft + (shaft.floorLeft - winLeft) * progress;
        const rightAtY = winRight + (shaft.floorRight - winRight) * progress;
        const paneX = leftAtY + coordU * (rightAtY - leftAtY);
        return `${paneX.toFixed(1)},${paneY.toFixed(1)}`;
      };
      const p1 = mapPoint(u0, v0);
      const p2 = mapPoint(u1, v0);
      const p3 = mapPoint(u1, v1);
      const p4 = mapPoint(u0, v1);
      panesSvg += `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${lightColor}" opacity="${paneOpacity}" style="mix-blend-mode: screen;"/>`;
    });
    return shaftPolygon + panesSvg;
  }
}
