import type { Background, CompilationContext, HazeLevels, Placement, Rgba, TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { GroundDetail, SettingName } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { GroundDetailService } from "@/Services/GroundDetailService.ts";
import { RidgeService } from "@/Services/RidgeService.ts";
import { SkyDetailService } from "@/Services/SkyDetailService.ts";

export interface BackgroundBuildOptions {
  textRects?: readonly TextRect[];
  placements?: readonly Placement[];
}

type ContextDrawer = (context: CompilationContext, options?: BackgroundBuildOptions) => string;

export class BackgroundService {
  private static readonly OUTDOOR_HAZE: HazeLevels = { far: 0.32, mid: 0.13 };

  private static readonly INDOOR_HAZE: HazeLevels = { far: 0.08, mid: 0.04 };

  private static readonly DEFAULT_SHADOW_ALPHA = 0.15;

  private static readonly PLANK_COUNT = 16;

  private static readonly PLANK_MARGIN = 6;

  private static readonly PLANK_SPREAD = 1.6;

  private static readonly PLANK_VANISH_HEIGHT = 0.9;

  private static readonly SHADE_CYCLE = 3;

  private static readonly SHADE_STEP = 0.03;

  private static readonly BOARD_LINES = 8;

  private static readonly CITY_DASHES = 10;

  private static readonly WAVE_COUNT = 6;

  private static readonly DEFAULT_RIDGES = 2;

  private static readonly DEFAULT_SEED = 1;

  private static readonly SETTING_TO_HAZE: Partial<Record<SettingName, HazeLevels>> = {
    indoor: BackgroundService.INDOOR_HAZE,
  };

  private static readonly SETTING_TO_DEFAULT_RIDGES: Partial<Record<SettingName, number>> = {
    outdoor: BackgroundService.DEFAULT_RIDGES,
  };

  private static readonly SETTING_TO_DEFAULT_GROUND_DETAIL: Partial<Record<SettingName, GroundDetail>> = {
    outdoor: "low",
  };

  private static readonly SETTING_TO_AIR: Partial<Record<SettingName, "wall">> = { indoor: "wall" };

  private static readonly SETTING_TO_OUTDOOR_DRAWER: Partial<Record<SettingName, ContextDrawer>> = {
    beach: (context) => BackgroundService.beach(context),
  };

  private static readonly SETTING_TO_HILLS: Partial<Record<SettingName, ContextDrawer>> = {
    outdoor: (context) => BackgroundService.hills(context),
  };

  private static readonly SETTING_TO_FOREGROUND: Partial<Record<SettingName, ContextDrawer>> = {
    city: (context) => BackgroundService.street(context),
  };

  private static readonly FLOOR_TO_DRAWER: Partial<Record<"planks", ContextDrawer>> = {
    planks: (context) => BackgroundService.planks(context),
  };

  static build(context: CompilationContext, options?: BackgroundBuildOptions): Background {
    const { theme, setting } = context;
    const haze = BackgroundService.hazeLevels(context);
    const shadowRgba = BackgroundService.shadowRgba(theme);
    const defs = BackgroundService.defs(context, haze, shadowRgba);
    if (setting === "indoor") {
      return { svg: defs + BackgroundService.indoor(context), haze, shadowRgba, textBackdrop: theme.wall };
    }
    const drawOutdoor = IdUtil.lookup(BackgroundService.SETTING_TO_OUTDOOR_DRAWER, setting);
    const outdoor = drawOutdoor ? drawOutdoor(context, options) : BackgroundService.open(context, options);
    return { svg: defs + outdoor, haze, shadowRgba, textBackdrop: theme.skyTop };
  }

  private static hazeLevels(context: CompilationContext): HazeLevels {
    if (context.canvas.haze === false) {
      return { far: 0, mid: 0 };
    }
    const levels = IdUtil.lookup(BackgroundService.SETTING_TO_HAZE, context.setting);
    return { ...(levels ?? BackgroundService.OUTDOOR_HAZE) };
  }

  private static shadowRgba(theme: Theme): Rgba {
    const numbers = (theme.shadow.match(/[\d.]+/g) ?? []).map(Number);
    const [red = 0, green = 0, blue = 0, alpha = BackgroundService.DEFAULT_SHADOW_ALPHA] = numbers;
    return [red, green, blue, alpha];
  }

  private static hazeFilter(id: string, strength: number, air: string): string {
    const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start) => parseInt(air.slice(start, start + 2), 16) / 255);
    const keep = 1 - strength;
    return `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" `
      + `values="${keep} 0 0 0 ${(red * strength).toFixed(3)} 0 ${keep} 0 0 ${(green * strength).toFixed(3)} `
      + `0 0 ${keep} 0 ${(blue * strength).toFixed(3)} 0 0 0 1 0"/></filter>`;
  }

  private static defs(context: CompilationContext, haze: HazeLevels, shadowRgba: Rgba): string {
    const { theme, setting } = context;
    // Why: far things blend into the air color and lose contrast (atmospheric perspective).
    const airName = IdUtil.lookup(BackgroundService.SETTING_TO_AIR, setting) ?? "skyBottom";
    const air = theme[airName];
    const [red, green, blue, alpha] = shadowRgba;
    const shadowColor = `rgb(${red},${green},${blue})`;
    const hazeFar = BackgroundService.hazeFilter("hazeFar", haze.far, air);
    const hazeMid = BackgroundService.hazeFilter("hazeMid", haze.mid, air);
    const groundDef = GroundDetailService.groundGradientDef(theme);
    return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${SkyDetailService.skyGradientStops(theme)}</linearGradient>`
      + groundDef
      + `<radialGradient id="cshadow"><stop offset="0" stop-color="${shadowColor}" stop-opacity="${alpha * 1.5}"/>`
      + `<stop offset="0.55" stop-color="${shadowColor}" stop-opacity="${alpha * 1.1}"/>`
      + `<stop offset="1" stop-color="${shadowColor}" stop-opacity="0"/></radialGradient>`
      + hazeFar + hazeMid + "</defs>";
  }

  private static indoor(context: CompilationContext): string {
    const { theme, width, height, lines, canvas } = context;
    const horizonY = height * lines.horizon;
    const base = `<rect width="${width}" height="${horizonY}" fill="${theme.wall}"/>`
      + `<rect y="${horizonY}" width="${width}" height="${height - horizonY}" fill="${theme.floor}"/>`
      + `<rect y="${horizonY - 8}" width="${width}" height="10" fill="${theme.woodDark}" opacity="0.35"/>`;
    const drawFloor = IdUtil.lookup(BackgroundService.FLOOR_TO_DRAWER, canvas.floor);
    return base + (drawFloor ? drawFloor(context) : BackgroundService.floorLines(context));
  }

  private static planks(context: CompilationContext): string {
    const { theme, width, height, lines, canvas } = context;
    const horizonY = height * lines.horizon;
    // Why: the planks converge to a vanishing point above the wall.
    const vanishX = width * (canvas.vanish ?? 0.5);
    const vanishY = horizonY - height * BackgroundService.PLANK_VANISH_HEIGHT;
    const count = BackgroundService.PLANK_COUNT;
    const spread = BackgroundService.PLANK_SPREAD;
    const atHorizon = (column: number): number => (
      vanishX + ((column - vanishX) * (horizonY - vanishY)) / (height - vanishY)
    );
    let svg = "";
    for (let index = -BackgroundService.PLANK_MARGIN; index < count + BackgroundService.PLANK_MARGIN; index++) {
      const left = (index / count) * width * spread - width * ((spread - 1) / 2);
      const right = ((index + 1) / count) * width * spread - width * ((spread - 1) / 2);
      const shade = (index % BackgroundService.SHADE_CYCLE) * BackgroundService.SHADE_STEP
        - BackgroundService.SHADE_STEP;
      svg += `<path d="M${atHorizon(left).toFixed(1)} ${horizonY} L${atHorizon(right).toFixed(1)} ${horizonY} `
        + `L${right.toFixed(1)} ${height} L${left.toFixed(1)} ${height} Z" fill="${ColorUtil.sh(theme.floor, shade)}"/>`
        + `<path d="M${atHorizon(left).toFixed(1)} ${horizonY} L${left.toFixed(1)} ${height}" `
        + `stroke="${ColorUtil.sh(theme.floor, -0.3)}" stroke-width="1.2" opacity="0.6"/>`;
    }
    return svg;
  }

  private static floorLines(context: CompilationContext): string {
    const { theme, width, height, lines } = context;
    const horizonY = height * lines.horizon;
    let svg = "";
    for (let index = 1; index < BackgroundService.BOARD_LINES; index++) {
      const lineY = horizonY + (height - horizonY) * (index / BackgroundService.BOARD_LINES) ** 1.4 - 0.75;
      svg += `<rect x="0" y="${lineY.toFixed(1)}" width="${width}" height="1.5" fill="${theme.woodDark}" opacity="0.15"/>`;
    }
    return svg;
  }

  private static beach(context: CompilationContext): string {
    const { theme, width, height, lines } = context;
    const horizonY = height * lines.horizon;
    const seaY = height * (lines.sea ?? lines.horizon);
    let svg = `<rect width="${width}" height="${height}" fill="url(#sky)"/>`
      + `<rect y="${horizonY}" width="${width}" height="${seaY - horizonY}" fill="${theme.sea}"/>`
      + `<path d="M0 ${seaY} Q${width * 0.25} ${seaY - 14} ${width * 0.5} ${seaY} T${width} ${seaY} `
      + `L${width} ${height} L0 ${height} Z" fill="${theme.ground}"/>`;
    for (let index = 0; index < BackgroundService.WAVE_COUNT; index++) {
      svg += `<path d="M${width * (0.08 + index * 0.17)} ${horizonY + 18 + (index % 3) * 22} q14 -6 28 0" `
        + `stroke="${theme.seaLight}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    return svg + `<path d="M0 ${seaY - 4} Q${width * 0.25} ${seaY - 18} ${width * 0.5} ${seaY - 4} T${width} ${seaY - 4}" `
      + `stroke="${theme.paper}" stroke-width="4" fill="none" opacity="0.7"/>`;
  }

  private static hills(context: CompilationContext): string {
    const { theme, width, height, lines, canvas, setting } = context;
    const horizonY = height * lines.horizon;
    const defaultRidges = IdUtil.lookup(BackgroundService.SETTING_TO_DEFAULT_RIDGES, setting) ?? 0;
    const count = canvas.ridges ?? defaultRidges;
    return RidgeService.draw({
      count,
      seed: canvas.seed ?? BackgroundService.DEFAULT_SEED,
      width,
      horizonY,
      groundColor: theme.groundDark || theme.ground,
      airColor: theme.skyBottom,
      bottomY: height,
    });
  }

  private static open(context: CompilationContext, options?: BackgroundBuildOptions): string {
    const { theme, width, height, lines, setting, canvas } = context;
    const horizonY = height * lines.horizon;
    const drawHills = IdUtil.lookup(BackgroundService.SETTING_TO_HILLS, setting);
    const drawForeground = IdUtil.lookup(BackgroundService.SETTING_TO_FOREGROUND, setting);
    const clouds = SkyDetailService.ambientClouds({
      density: canvas.clouds,
      seed: canvas.seed ?? BackgroundService.DEFAULT_SEED,
      width,
      horizonY,
      paperColor: theme.paper,
      textRects: options?.textRects,
    });
    const defaultGroundDetail = IdUtil.lookup(BackgroundService.SETTING_TO_DEFAULT_GROUND_DETAIL, setting) ?? "none";
    const groundDetail = GroundDetailService.draw({
      detail: canvas.ground_detail ?? defaultGroundDetail,
      seed: canvas.seed ?? BackgroundService.DEFAULT_SEED,
      width,
      height,
      horizonY,
      theme,
      placements: options?.placements,
    });
    const svg = `<rect width="${width}" height="${height}" fill="url(#sky)"/>`
      + clouds
      + (drawHills ? drawHills(context, options) : "")
      + `<path d="M0 ${horizonY + 12} Q${width * 0.3} ${horizonY - 6} ${width * 0.6} ${horizonY + 10} `
      + `T${width} ${horizonY + 4} L${width} ${height} L0 ${height} Z" fill="url(#ground)"/>`
      + groundDetail;
    return drawForeground ? svg + drawForeground(context, options) : svg;
  }

  private static street(context: CompilationContext): string {
    const { theme, width, height } = context;
    const dashes = Array.from({ length: BackgroundService.CITY_DASHES }, (_, index) =>
      `<rect x="${(index * width) / BackgroundService.CITY_DASHES + 20}" y="${height * 0.925}" `
      + `width="${width / 20}" height="5" fill="${theme.primary}" opacity="0.5"/>`);
    return `<rect y="${height * 0.86}" width="${width}" height="${height * 0.14}" fill="${theme.groundDark}"/>`
      + dashes.join("");
  }
}
