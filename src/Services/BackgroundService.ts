import type { Background, CompilationContext, HazeLevels } from "@/Protocols/CompilationProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

export class BackgroundService {
  private static readonly OUTDOOR_HAZE: HazeLevels = { far: 0.32, mid: 0.13 };

  private static readonly INDOOR_HAZE: HazeLevels = { far: 0.08, mid: 0.04 };

  private static readonly DEFAULT_SHADOW_RGBA = [0, 0, 0, 0.15];

  private static readonly PLANK_COUNT = 16;

  private static readonly PLANK_MARGIN = 6;

  private static readonly PLANK_SPREAD = 1.6;

  private static readonly PLANK_VANISH_HEIGHT = 0.9;

  private static readonly SHADE_CYCLE = 3;

  private static readonly SHADE_STEP = 0.03;

  private static readonly BOARD_LINES = 8;

  private static readonly CITY_DASHES = 10;

  private static readonly WAVE_COUNT = 6;

  static build(context: CompilationContext): Background {
    const { theme, setting } = context;
    const haze = BackgroundService.hazeLevels(context);
    const shadowRgba = BackgroundService.shadowRgba(theme);
    const defs = BackgroundService.defs(context, haze, shadowRgba);
    if (setting === "indoor") {
      return { svg: defs + BackgroundService.indoor(context), haze, shadowRgba, textBackdrop: theme.wall };
    }
    const outdoor = setting === "beach" ? BackgroundService.beach(context) : BackgroundService.open(context);
    return { svg: defs + outdoor, haze, shadowRgba, textBackdrop: theme.skyTop };
  }

  private static hazeLevels(context: CompilationContext): HazeLevels {
    if (context.canvas.haze === false) {
      return { far: 0, mid: 0 };
    }
    return { ...(context.setting === "indoor" ? BackgroundService.INDOOR_HAZE : BackgroundService.OUTDOOR_HAZE) };
  }

  private static shadowRgba(theme: Theme): number[] {
    const numbers = theme.shadow.match(/[\d.]+/g);
    return numbers ? numbers.map(Number) : BackgroundService.DEFAULT_SHADOW_RGBA;
  }

  private static hazeFilter(id: string, strength: number, air: string): string {
    const [red, green, blue] = [1, 3, 5].map((start) => parseInt(air.slice(start, start + 2), 16) / 255);
    const keep = 1 - strength;
    return `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${keep} 0 0 0 ${(red * strength).toFixed(3)} 0 ${keep} 0 0 ${(green * strength).toFixed(3)} 0 0 ${keep} 0 ${(blue * strength).toFixed(3)} 0 0 0 1 0"/></filter>`;
  }

  private static defs(context: CompilationContext, haze: HazeLevels, shadowRgba: number[]): string {
    const { theme, setting } = context;
    // Why: far things blend into the air color and lose contrast (atmospheric perspective).
    const air = setting === "indoor" ? theme.wall : theme.skyBottom;
    const [red, green, blue, alpha] = shadowRgba;
    const shadowColor = `rgb(${red},${green},${blue})`;
    return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.skyTop}"/><stop offset="1" stop-color="${theme.skyBottom}"/></linearGradient>`
      + `<radialGradient id="cshadow"><stop offset="0" stop-color="${shadowColor}" stop-opacity="${alpha * 1.5}"/><stop offset="0.55" stop-color="${shadowColor}" stop-opacity="${alpha * 1.1}"/><stop offset="1" stop-color="${shadowColor}" stop-opacity="0"/></radialGradient>`
      + BackgroundService.hazeFilter("hazeFar", haze.far, air) + BackgroundService.hazeFilter("hazeMid", haze.mid, air) + "</defs>";
  }

  private static indoor(context: CompilationContext): string {
    const { theme, width, height, lines, canvas } = context;
    const horizonY = height * lines.horizon;
    const base = `<rect width="${width}" height="${horizonY}" fill="${theme.wall}"/><rect y="${horizonY}" width="${width}" height="${height - horizonY}" fill="${theme.floor}"/>`
      + `<rect y="${horizonY - 8}" width="${width}" height="10" fill="${theme.woodDark}" opacity="0.35"/>`;
    return base + (canvas.floor === "planks" ? BackgroundService.planks(context) : BackgroundService.floorLines(context));
  }

  private static planks(context: CompilationContext): string {
    const { theme, width, height, lines, canvas } = context;
    const horizonY = height * lines.horizon;
    // Why: the planks converge to a vanishing point above the wall.
    const vanishX = width * (canvas.vanish ?? 0.5);
    const vanishY = horizonY - height * BackgroundService.PLANK_VANISH_HEIGHT;
    const count = BackgroundService.PLANK_COUNT;
    const spread = BackgroundService.PLANK_SPREAD;
    const atHorizon = (x: number): number => vanishX + ((x - vanishX) * (horizonY - vanishY)) / (height - vanishY);
    let svg = "";
    for (let index = -BackgroundService.PLANK_MARGIN; index < count + BackgroundService.PLANK_MARGIN; index++) {
      const left = (index / count) * width * spread - width * ((spread - 1) / 2);
      const right = ((index + 1) / count) * width * spread - width * ((spread - 1) / 2);
      const shade = (index % BackgroundService.SHADE_CYCLE) * BackgroundService.SHADE_STEP - BackgroundService.SHADE_STEP;
      svg += `<path d="M${atHorizon(left).toFixed(1)} ${horizonY} L${atHorizon(right).toFixed(1)} ${horizonY} L${right.toFixed(1)} ${height} L${left.toFixed(1)} ${height} Z" fill="${ColorUtil.sh(theme.floor, shade)}"/>`
        + `<path d="M${atHorizon(left).toFixed(1)} ${horizonY} L${left.toFixed(1)} ${height}" stroke="${ColorUtil.sh(theme.floor, -0.3)}" stroke-width="1.2" opacity="0.6"/>`;
    }
    return svg;
  }

  private static floorLines(context: CompilationContext): string {
    const { theme, width, height, lines } = context;
    const horizonY = height * lines.horizon;
    let svg = "";
    for (let index = 1; index < BackgroundService.BOARD_LINES; index++) {
      const y = horizonY + (height - horizonY) * (index / BackgroundService.BOARD_LINES) ** 1.4 - 0.75;
      svg += `<rect x="0" y="${y.toFixed(1)}" width="${width}" height="1.5" fill="${theme.woodDark}" opacity="0.15"/>`;
    }
    return svg;
  }

  private static beach(context: CompilationContext): string {
    const { theme, width, height, lines } = context;
    const horizonY = height * lines.horizon;
    const seaY = height * (lines.sea ?? lines.horizon);
    let svg = `<rect width="${width}" height="${height}" fill="url(#sky)"/><rect y="${horizonY}" width="${width}" height="${seaY - horizonY}" fill="${theme.sea}"/>`
      + `<path d="M0 ${seaY} Q${width * 0.25} ${seaY - 14} ${width * 0.5} ${seaY} T${width} ${seaY} L${width} ${height} L0 ${height} Z" fill="${theme.ground}"/>`;
    for (let index = 0; index < BackgroundService.WAVE_COUNT; index++) {
      svg += `<path d="M${width * (0.08 + index * 0.17)} ${horizonY + 18 + (index % 3) * 22} q14 -6 28 0" stroke="${theme.seaLight}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    return svg + `<path d="M0 ${seaY - 4} Q${width * 0.25} ${seaY - 18} ${width * 0.5} ${seaY - 4} T${width} ${seaY - 4}" stroke="${theme.paper}" stroke-width="4" fill="none" opacity="0.7"/>`;
  }

  private static open(context: CompilationContext): string {
    const { theme, width, height, lines, setting } = context;
    const horizonY = height * lines.horizon;
    let svg = `<rect width="${width}" height="${height}" fill="url(#sky)"/>`;
    if (setting === "outdoor") {
      svg += `<path d="M0 ${horizonY} Q${width * 0.2} ${horizonY - 50} ${width * 0.45} ${horizonY - 10} T${width} ${horizonY - 30} L${width} ${height} L0 ${height} Z" fill="${theme.groundDark}" opacity="0.55"/>`;
    }
    svg += `<path d="M0 ${horizonY + 12} Q${width * 0.3} ${horizonY - 6} ${width * 0.6} ${horizonY + 10} T${width} ${horizonY + 4} L${width} ${height} L0 ${height} Z" fill="${theme.ground}"/>`;
    return setting === "city" ? svg + BackgroundService.street(context) : svg;
  }

  private static street(context: CompilationContext): string {
    const { theme, width, height } = context;
    const dashes = Array.from({ length: BackgroundService.CITY_DASHES }, (_, index) =>
      `<rect x="${(index * width) / BackgroundService.CITY_DASHES + 20}" y="${height * 0.925}" width="${width / 20}" height="5" fill="${theme.primary}" opacity="0.5"/>`);
    return `<rect y="${height * 0.86}" width="${width}" height="${height * 0.14}" fill="${theme.groundDark}"/>${dashes.join("")}`;
  }
}
