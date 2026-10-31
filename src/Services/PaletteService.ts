import type { GeneratedTheme, HarmonyName, MoodName } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { OklabUtil, type Lch } from "@/Utils/OklabUtil.ts";

interface HarmonyOffsets {
  secondaryRad: number;
  accentRad: number;
}

interface MoodBands {
  skyTopL: number;
  skyTopC: number;
  skyBottomL: number;
  skyBottomC: number;
  groundL: number;
  groundC: number;
  groundDarkL: number;
  groundDarkC: number;
  wallL: number;
  wallC: number;
  floorL: number;
  floorC: number;
  shadow: string;
}

interface SkyHues {
  top: number;
  bottom: number;
}

export class PaletteService {
  private static readonly DEFAULT_HARMONY: HarmonyName = "analogous";

  private static readonly DEFAULT_MOOD: MoodName = "day";

  private static readonly FULL_TURN = Math.PI * 2;

  private static readonly WCAG_AA_RATIO = 4.5;

  private static readonly DEFAULT_PRIMARY = "#2F6BFF";

  private static readonly ANALOGOUS_SECONDARY_RAD = 0.5236;

  private static readonly ANALOGOUS_ACCENT_RAD = -0.5236;

  private static readonly ACCENT_EXTRA_RAD = 0.2618;

  private static readonly SPLIT_SECONDARY_RAD = 2.618;

  private static readonly SPLIT_ACCENT_RAD = 3.665;

  private static readonly TRIAD_SECONDARY_RAD = 2.0944;

  private static readonly TRIAD_ACCENT_RAD = 4.1888;

  private static readonly HARMONY_TO_OFFSETS: Record<HarmonyName, HarmonyOffsets> = {
    analogous: {
      secondaryRad: PaletteService.ANALOGOUS_SECONDARY_RAD,
      accentRad: PaletteService.ANALOGOUS_ACCENT_RAD,
    },
    complementary: {
      secondaryRad: Math.PI,
      accentRad: Math.PI + PaletteService.ACCENT_EXTRA_RAD,
    },
    split: {
      secondaryRad: PaletteService.SPLIT_SECONDARY_RAD,
      accentRad: PaletteService.SPLIT_ACCENT_RAD,
    },
    triad: {
      secondaryRad: PaletteService.TRIAD_SECONDARY_RAD,
      accentRad: PaletteService.TRIAD_ACCENT_RAD,
    },
    mono: {
      secondaryRad: 0,
      accentRad: 0,
    },
  };

  private static readonly DAY_SKY_TOP_L = 0.94;

  private static readonly DAY_SKY_TOP_C = 0.02;

  private static readonly DAY_SKY_BOTTOM_L = 0.97;

  private static readonly DAY_SKY_BOTTOM_C = 0.01;

  private static readonly DAY_GROUND_L = 0.72;

  private static readonly DAY_GROUND_C = 0.1;

  private static readonly DAY_GROUND_DARK_L = 0.62;

  private static readonly DAY_WALL_L = 0.95;

  private static readonly DAY_WALL_C = 0.01;

  private static readonly DAY_FLOOR_L = 0.76;

  private static readonly DAY_FLOOR_C = 0.02;

  private static readonly DUSK_SKY_TOP_L = 0.48;

  private static readonly DUSK_SKY_TOP_C = 0.12;

  private static readonly DUSK_SKY_BOTTOM_L = 0.76;

  private static readonly DUSK_SKY_BOTTOM_C = 0.14;

  private static readonly DUSK_GROUND_L = 0.45;

  private static readonly DUSK_GROUND_C = 0.08;

  private static readonly DUSK_GROUND_DARK_L = 0.35;

  private static readonly DUSK_WALL_L = 0.82;

  private static readonly DUSK_WALL_C = 0.04;

  private static readonly DUSK_FLOOR_L = 0.58;

  private static readonly DUSK_FLOOR_C = 0.04;

  private static readonly NIGHT_SKY_TOP_L = 0.18;

  private static readonly NIGHT_SKY_TOP_C = 0.06;

  private static readonly NIGHT_SKY_BOTTOM_L = 0.28;

  private static readonly NIGHT_SKY_BOTTOM_C = 0.08;

  private static readonly NIGHT_GROUND_L = 0.26;

  private static readonly NIGHT_GROUND_C = 0.05;

  private static readonly NIGHT_GROUND_DARK_L = 0.18;

  private static readonly NIGHT_WALL_L = 0.32;

  private static readonly NIGHT_WALL_C = 0.02;

  private static readonly NIGHT_FLOOR_L = 0.24;

  private static readonly NIGHT_FLOOR_C = 0.02;

  private static readonly MOOD_TO_BANDS: Record<MoodName, MoodBands> = {
    day: {
      skyTopL: PaletteService.DAY_SKY_TOP_L,
      skyTopC: PaletteService.DAY_SKY_TOP_C,
      skyBottomL: PaletteService.DAY_SKY_BOTTOM_L,
      skyBottomC: PaletteService.DAY_SKY_BOTTOM_C,
      groundL: PaletteService.DAY_GROUND_L,
      groundC: PaletteService.DAY_GROUND_C,
      groundDarkL: PaletteService.DAY_GROUND_DARK_L,
      groundDarkC: PaletteService.DAY_GROUND_C,
      wallL: PaletteService.DAY_WALL_L,
      wallC: PaletteService.DAY_WALL_C,
      floorL: PaletteService.DAY_FLOOR_L,
      floorC: PaletteService.DAY_FLOOR_C,
      shadow: "rgba(31,42,61,0.13)",
    },
    dusk: {
      skyTopL: PaletteService.DUSK_SKY_TOP_L,
      skyTopC: PaletteService.DUSK_SKY_TOP_C,
      skyBottomL: PaletteService.DUSK_SKY_BOTTOM_L,
      skyBottomC: PaletteService.DUSK_SKY_BOTTOM_C,
      groundL: PaletteService.DUSK_GROUND_L,
      groundC: PaletteService.DUSK_GROUND_C,
      groundDarkL: PaletteService.DUSK_GROUND_DARK_L,
      groundDarkC: PaletteService.DUSK_GROUND_C,
      wallL: PaletteService.DUSK_WALL_L,
      wallC: PaletteService.DUSK_WALL_C,
      floorL: PaletteService.DUSK_FLOOR_L,
      floorC: PaletteService.DUSK_FLOOR_C,
      shadow: "rgba(20,10,35,0.22)",
    },
    night: {
      skyTopL: PaletteService.NIGHT_SKY_TOP_L,
      skyTopC: PaletteService.NIGHT_SKY_TOP_C,
      skyBottomL: PaletteService.NIGHT_SKY_BOTTOM_L,
      skyBottomC: PaletteService.NIGHT_SKY_BOTTOM_C,
      groundL: PaletteService.NIGHT_GROUND_L,
      groundC: PaletteService.NIGHT_GROUND_C,
      groundDarkL: PaletteService.NIGHT_GROUND_DARK_L,
      groundDarkC: PaletteService.NIGHT_GROUND_C,
      wallL: PaletteService.NIGHT_WALL_L,
      wallC: PaletteService.NIGHT_WALL_C,
      floorL: PaletteService.NIGHT_FLOOR_L,
      floorC: PaletteService.NIGHT_FLOOR_C,
      shadow: "rgba(5,10,25,0.30)",
    },
  };

  private static readonly DUSK_SKY_TOP_HUE = 5.5;

  private static readonly DUSK_SKY_BOTTOM_HUE = 1.0;

  private static readonly NIGHT_SKY_TOP_HUE = 4.6;

  private static readonly NIGHT_SKY_BOTTOM_HUE = 4.8;

  private static readonly SKY_BASE_HUE = 4.2;

  private static readonly MOOD_TO_SKY_HUES: Record<MoodName, (primaryHue: number) => SkyHues> = {
    day: (primaryHue) => {
      const averaged = (primaryHue + PaletteService.SKY_BASE_HUE) / 2;
      return { top: averaged, bottom: averaged };
    },
    dusk: () => ({ top: PaletteService.DUSK_SKY_TOP_HUE, bottom: PaletteService.DUSK_SKY_BOTTOM_HUE }),
    night: () => ({ top: PaletteService.NIGHT_SKY_TOP_HUE, bottom: PaletteService.NIGHT_SKY_BOTTOM_HUE }),
  };

  private static readonly INK_LIGHTNESS = 0.22;

  private static readonly INK_CHROMA = 0.04;

  private static readonly GLASS_L = 0.85;

  private static readonly GLASS_C = 0.04;

  private static readonly GLASS_H = 4.2;

  private static readonly GLASS_LCH: Lch = [PaletteService.GLASS_L, PaletteService.GLASS_C, PaletteService.GLASS_H];

  private static readonly METAL_L = 0.65;

  private static readonly METAL_C = 0.02;

  private static readonly METAL_H = 4.4;

  private static readonly METAL_LCH: Lch = [PaletteService.METAL_L, PaletteService.METAL_C, PaletteService.METAL_H];

  private static readonly TRUNK_L = 0.45;

  private static readonly TRUNK_C = 0.05;

  private static readonly TRUNK_H = 1.0;

  private static readonly TRUNK_LCH: Lch = [PaletteService.TRUNK_L, PaletteService.TRUNK_C, PaletteService.TRUNK_H];

  private static readonly WOOD_L = 0.65;

  private static readonly WOOD_C = 0.08;

  private static readonly WOOD_H = 1.1;

  private static readonly WOOD_LCH: Lch = [PaletteService.WOOD_L, PaletteService.WOOD_C, PaletteService.WOOD_H];

  private static readonly WOOD_DARK_L = 0.5;

  private static readonly WOOD_DARK_LCH: Lch = [
    PaletteService.WOOD_DARK_L,
    PaletteService.WOOD_C,
    PaletteService.WOOD_H,
  ];

  private static readonly SEA_L = 0.58;

  private static readonly SEA_C = 0.08;

  private static readonly SEA_H = 4.0;

  private static readonly SEA_LCH: Lch = [PaletteService.SEA_L, PaletteService.SEA_C, PaletteService.SEA_H];

  private static readonly SEA_LIGHT_L = 0.75;

  private static readonly SEA_LIGHT_C = 0.06;

  private static readonly SEA_LIGHT_LCH: Lch = [
    PaletteService.SEA_LIGHT_L,
    PaletteService.SEA_LIGHT_C,
    PaletteService.SEA_H,
  ];

  private static readonly FOLIAGE_HUE = 2.4;

  private static readonly FOLIAGE_CHROMA = 0.12;

  private static readonly FOLIAGE_STEP_0 = 0.6;

  private static readonly FOLIAGE_STEP_1 = 0.68;

  private static readonly FOLIAGE_STEP_2 = 0.5;

  private static readonly FOLIAGE_STEPS = [
    PaletteService.FOLIAGE_STEP_0,
    PaletteService.FOLIAGE_STEP_1,
    PaletteService.FOLIAGE_STEP_2,
  ] as const;

  private static readonly FOLIAGE_PULL_FACTOR = 0.15;

  private static readonly GROUND_BASE_HUE = 2.3;

  private static readonly GROUND_HUE_FACTOR = 0.1;

  private static readonly FLOOR_HUE = 1.2;

  private static readonly ACCENT_MAX_L = 0.85;

  private static readonly ACCENT_L_BOOST = 0.08;

  private static readonly ACCENT_MAX_C = 0.2;

  private static readonly ACCENT_C_BOOST = 0.05;

  private static readonly TEXT_LIGHT = "#FFFFFF";

  private static readonly TEXT_DARK = "#1A1A1A";

  static generate(spec: GeneratedTheme): Theme {
    const primarySeed = PaletteService.seedHex(spec.from);
    const harmony = spec.harmony ?? PaletteService.DEFAULT_HARMONY;
    const mood = spec.mood ?? PaletteService.DEFAULT_MOOD;
    const { primary, secondary, accent, primaryHue } = PaletteService.resolveTrio(primarySeed, spec.from, harmony);
    const bands = IdUtil.lookup(PaletteService.MOOD_TO_BANDS, mood) ?? PaletteService.MOOD_TO_BANDS.day;
    const backgrounds = PaletteService.resolveBackgrounds(primaryHue, mood, bands);
    const foliage = PaletteService.resolveFoliage(primaryHue);
    const ink = OklabUtil.lchToHex([PaletteService.INK_LIGHTNESS, PaletteService.INK_CHROMA, primaryHue]);
    const textPair = PaletteService.resolveText(ink, backgrounds.skyTop, backgrounds.wall, backgrounds.groundDark);
    return {
      primary,
      secondary,
      accent,
      ...backgrounds,
      foliage,
      trunk: OklabUtil.lchToHex(PaletteService.TRUNK_LCH),
      wood: OklabUtil.lchToHex(PaletteService.WOOD_LCH),
      woodDark: OklabUtil.lchToHex(PaletteService.WOOD_DARK_LCH),
      ink,
      paper: PaletteService.TEXT_LIGHT,
      glass: OklabUtil.lchToHex(PaletteService.GLASS_LCH),
      metal: OklabUtil.lchToHex(PaletteService.METAL_LCH),
      text: textPair.text,
      textOnDark: textPair.textOnDark,
      shadow: bands.shadow,
      sea: OklabUtil.lchToHex(PaletteService.SEA_LCH),
      seaLight: OklabUtil.lchToHex(PaletteService.SEA_LIGHT_LCH),
    };
  }

  private static seedHex(from: string | string[]): string {
    const seed = Array.isArray(from) ? from[0] ?? PaletteService.DEFAULT_PRIMARY : from;
    return seed.startsWith("#") ? seed : `#${seed}`;
  }

  private static resolveTrio(
    primaryHex: string,
    from: string | string[],
    harmony: HarmonyName,
  ): { primary: string; secondary: string; accent: string; primaryHue: number } {
    const [red, green, blue] = OklabUtil.rgbOfHex(primaryHex);
    const lab = OklabUtil.fromRgb(red, green, blue);
    const [lightness, chroma, hue] = OklabUtil.labToLch(lab);
    const offsets = IdUtil.lookup(PaletteService.HARMONY_TO_OFFSETS, harmony)
      ?? PaletteService.HARMONY_TO_OFFSETS.analogous;
    const seeds = Array.isArray(from) ? from : [from];
    const secondaryTargetHue = (hue + offsets.secondaryRad + PaletteService.FULL_TURN) % PaletteService.FULL_TURN;
    const secondary = PaletteService.secondaryOf(seeds, lightness, chroma, secondaryTargetHue);
    const accentTargetHue = (hue + offsets.accentRad + PaletteService.FULL_TURN) % PaletteService.FULL_TURN;
    const accent = PaletteService.accentOf(seeds, lightness, chroma, accentTargetHue);
    return { primary: primaryHex, secondary, accent, primaryHue: hue };
  }

  private static secondaryOf(
    seeds: readonly string[],
    lightness: number,
    chroma: number,
    targetHue: number,
  ): string {
    const secondarySeed = seeds[1];
    if (secondarySeed != null) {
      return secondarySeed.startsWith("#") ? secondarySeed : `#${secondarySeed}`;
    }
    return OklabUtil.lchToHex([lightness, chroma, targetHue]);
  }

  private static accentOf(
    seeds: readonly string[],
    lightness: number,
    chroma: number,
    targetHue: number,
  ): string {
    const accentSeed = seeds[2];
    if (accentSeed != null) {
      return accentSeed.startsWith("#") ? accentSeed : `#${accentSeed}`;
    }
    const boostedL = Math.min(PaletteService.ACCENT_MAX_L, lightness + PaletteService.ACCENT_L_BOOST);
    const boostedC = Math.min(PaletteService.ACCENT_MAX_C, chroma + PaletteService.ACCENT_C_BOOST);
    return OklabUtil.lchToHex([boostedL, boostedC, targetHue]);
  }

  private static resolveBackgrounds(
    primaryHue: number,
    mood: MoodName,
    bands: MoodBands,
  ): { skyTop: string; skyBottom: string; ground: string; groundDark: string; wall: string; floor: string } {
    const skyHuesResolver = IdUtil.lookup(PaletteService.MOOD_TO_SKY_HUES, mood)
      ?? PaletteService.MOOD_TO_SKY_HUES.day;
    const skyHues = skyHuesResolver(primaryHue);
    const groundHue = (PaletteService.GROUND_BASE_HUE + primaryHue * PaletteService.GROUND_HUE_FACTOR)
      % PaletteService.FULL_TURN;
    return {
      skyTop: OklabUtil.lchToHex([bands.skyTopL, bands.skyTopC, skyHues.top]),
      skyBottom: OklabUtil.lchToHex([bands.skyBottomL, bands.skyBottomC, skyHues.bottom]),
      ground: OklabUtil.lchToHex([bands.groundL, bands.groundC, groundHue]),
      groundDark: OklabUtil.lchToHex([bands.groundDarkL, bands.groundDarkC, groundHue]),
      wall: OklabUtil.lchToHex([bands.wallL, bands.wallC, primaryHue]),
      floor: OklabUtil.lchToHex([bands.floorL, bands.floorC, PaletteService.FLOOR_HUE]),
    };
  }

  private static resolveFoliage(primaryHue: number): [string, string, string] {
    const pulledHue = (PaletteService.FOLIAGE_HUE + primaryHue * PaletteService.FOLIAGE_PULL_FACTOR)
      % PaletteService.FULL_TURN;
    return [
      OklabUtil.lchToHex([PaletteService.FOLIAGE_STEPS[0], PaletteService.FOLIAGE_CHROMA, pulledHue]),
      OklabUtil.lchToHex([PaletteService.FOLIAGE_STEPS[1], PaletteService.FOLIAGE_CHROMA, pulledHue]),
      OklabUtil.lchToHex([PaletteService.FOLIAGE_STEPS[2], PaletteService.FOLIAGE_CHROMA, pulledHue]),
    ];
  }

  private static resolveText(
    ink: string,
    skyTop: string,
    wall: string,
    groundDark: string,
  ): { text: string; textOnDark: string } {
    const skyContrast = ColorUtil.contrast(ink, skyTop);
    const wallContrast = ColorUtil.contrast(ink, wall);
    const isInkLegible = skyContrast >= PaletteService.WCAG_AA_RATIO && wallContrast >= PaletteService.WCAG_AA_RATIO;
    const text = isInkLegible ? ink : PaletteService.TEXT_LIGHT;
    const darkContrast = ColorUtil.contrast(PaletteService.TEXT_LIGHT, groundDark);
    const textOnDark = darkContrast >= PaletteService.WCAG_AA_RATIO
      ? PaletteService.TEXT_LIGHT
      : PaletteService.TEXT_DARK;
    return { text, textOnDark };
  }
}
