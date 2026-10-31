import { BOTTOM_NAMES, OUTFIT_NAMES } from "@/Protocols/PersonProtocol.ts";
import type { BottomName, BuildName, HatName, OutfitName, PersonParams } from "@/Protocols/PersonProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FallbackUtil } from "@/Utils/FallbackUtil.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { PersonArmUtil } from "@/Utils/PersonArmUtil.ts";
import { PersonHeadUtil } from "@/Utils/PersonHeadUtil.ts";

export interface PersonLook {
  theme: Theme;
  skin: string;
  top: string;
  bottomColor: string;
  jacket: string | null;
  outfit: OutfitName | null;
  bottom: BottomName | null;
  shoes: string;
  gown: string | null;
  sleeve: string;
  isShortSleeve: boolean;
  detail: number;
}

interface OutfitTraits {
  hasGown: boolean;
  isDress: boolean;
  isLabCoat: boolean;
  isTshirt: boolean;
}

type HatBuilder = (look: PersonLook, params: PersonParams, side: number) => string;

type LookLayer = (look: PersonLook) => string;

interface LegShape {
  width: number;
  isCovered: boolean;
}

type HemKind = "gown" | "labcoat" | "none" | "heavy" | "standard";

type LegsOverlay = (look: PersonLook, facing: number) => string;

export class PersonOutfitUtil {
  private static readonly LAB_COAT = "#FBFBF8";

  private static readonly FOLD_DETAIL = 2;

  private static readonly OUTFIT_TO_HEM_KIND: Partial<Record<OutfitName, HemKind>> = { labcoat: "labcoat", dress: "none" };

  private static readonly BUILD_TO_HEM_KIND: Partial<Record<BuildName, HemKind>> = { heavy: "heavy" };

  private static readonly LONG_HEMS = new Set<HemKind>(["gown", "labcoat", "none"]);

  private static readonly HEM_KIND_TO_PATH: Record<HemKind, string> = {
    gown: "M-18 -16.2 L18 -16.2 L18 -14 L-18 -14 Z",
    labcoat: "M-15 -29.2 L15 -29.2 L15 -27 L-15 -27 Z",
    none: "",
    heavy: "M-13 -46.4 L13 -46.4 L13 -44 L-13 -44 Z",
    standard: "M-12 -46.4 L12 -46.4 L12 -44 L-12 -44 Z",
  };

  private static readonly OUTFIT_TO_COLLAR: Partial<Record<OutfitName, LookLayer>> = {
    labcoat: () => {
      const lapel = ColorUtil.sh(PersonOutfitUtil.LAB_COAT, -0.06);
      return `<path d="M-6 -82 L0 -73 L-8.5 -66 Z M6 -82 L0 -73 L8.5 -66 Z" fill="${lapel}"/>`;
    },
    sweater: (look) => (
      `<path d="M-6.2 -81.4 Q0 -75.8 6.2 -81.4" stroke="${ColorUtil.sh(look.top, -0.28)}" stroke-width="2.2" fill="none" `
      + `stroke-linecap="round"/>`
    ),
    tshirt: (look) => (
      `<path d="M-6.2 -81.4 Q0 -75.8 6.2 -81.4" stroke="${ColorUtil.sh(look.top, -0.28)}" stroke-width="1.1" fill="none" `
      + `stroke-linecap="round"/><path d="M-4.6 -81 Q0 -77.4 4.6 -81" fill="${ColorUtil.sh(look.skin, -0.12)}"/>`
    ),
  };

  private static readonly HEM_SHADE = 0.2;

  private static readonly SOLE_LIGHTEN = 0.3;

  private static readonly LEG_TAPER = 0.4;

  private static readonly WALKING_LEG_WIDTHS = [8.8, 6.4];

  private static readonly HAT_NAME_TO_BUILDER: Record<HatName, HatBuilder> = {
    grad_cap: (look) => PersonOutfitUtil.graduationCap(look),
    cap: (look, params, side) => PersonOutfitUtil.cap(look, params, side),
  };

  private static readonly OUTFIT_TO_TRAITS: Record<OutfitName, OutfitTraits> = {
    tshirt: { hasGown: false, isDress: false, isLabCoat: false, isTshirt: true },
    sweater: { hasGown: false, isDress: false, isLabCoat: false, isTshirt: false },
    labcoat: { hasGown: false, isDress: false, isLabCoat: true, isTshirt: false },
    gown: { hasGown: true, isDress: false, isLabCoat: false, isTshirt: false },
    dress: { hasGown: false, isDress: true, isLabCoat: false, isTshirt: false },
  };

  private static readonly BOTTOM_TO_LEG_SHAPE: Record<BottomName, LegShape> = {
    pants: { width: 8, isCovered: true },
    shorts: { width: 6.5, isCovered: false },
    skirt: { width: 6.5, isCovered: false },
    dress: { width: 6.5, isCovered: false },
  };

  private static readonly UNKNOWN_LEG_SHAPE: LegShape = { width: 6.5, isCovered: false };

  private static readonly OUTFIT_TO_NECKLINE: Partial<Record<OutfitName, LookLayer>> = {
    sweater: (look) => (
      `<path d="M-6 -81 Q0 -76 6 -81" stroke="${ColorUtil.sh(look.top, -0.25)}" stroke-width="1.5" fill="none"/>`
    ),
    tshirt: (look) => `<path d="M-5 -81 Q0 -77 5 -81" fill="${ColorUtil.sh(look.skin, -0.12)}"/>`,
  };

  private static readonly BOTTOM_TO_SEATED_OVERLAY: Partial<Record<BottomName, LegsOverlay>> = {
    shorts: (look, facing) => (
      `<path d="M0 -45 L${facing * 14} -45" stroke="${look.bottomColor}" stroke-width="12" stroke-linecap="butt"/>`
    ),
    skirt: (look, facing) => PersonOutfitUtil.seatedSkirt(look, facing, look.bottomColor),
    dress: (look, facing) => PersonOutfitUtil.seatedSkirt(look, facing, look.top),
  };

  private static readonly BOTTOM_TO_STANDING_OVERLAY: Partial<Record<BottomName, LookLayer>> = {
    shorts: (look) => (
      `<path d="M-11 -47 L11 -47 L12 -30 L1 -30 L0 -36 L-1 -30 L-12 -30 Z" fill="${look.bottomColor}"/>`
      + `<path d="M4 -47 L11 -47 L12 -30 L5 -30 Z" fill="${ColorUtil.sh(look.bottomColor, -0.12)}"/>`
    ),
    skirt: (look) => (
      `<path d="M-12 -48 L12 -48 L17 -27 L-17 -27 Z" fill="${look.bottomColor}"/>`
      + PersonOutfitUtil.hem(look, "M-17.2 -29.2 L17.2 -29.2 L17 -27 L-17 -27 Z", look.bottomColor)
      + `<path d="M4 -48 L12 -48 L17 -27 L7 -27 Z" fill="${ColorUtil.sh(look.bottomColor, -0.12)}"/>`
    ),
    dress: (look) => (
      `<path d="M-12 -48 L12 -48 L18 -24 L-18 -24 Z" fill="${look.top}"/>`
      + PersonOutfitUtil.hem(look, "M-18.2 -26.2 L18.2 -26.2 L18 -24 L-18 -24 Z", look.top)
      + `<path d="M4 -48 L12 -48 L18 -24 L7 -24 Z" fill="${ColorUtil.sh(look.top, -0.12)}"/>`
    ),
  };

  private static colorOf(theme: Theme, name: string | undefined, fallback: string): string {
    if (!name) {
      return fallback;
    }
    const value = theme[name];
    return typeof value === "string" && value ? value : name;
  }

  private static themeColorOnly(theme: Theme, name: string | undefined, fallback: string): string {
    const value = name ? theme[name] : undefined;
    return typeof value === "string" && value ? value : fallback;
  }

  static lookOf(params: PersonParams, theme: Theme): PersonLook {
    const top = PersonOutfitUtil.colorOf(theme, params.shirt, theme.primary);
    const jacket = params.jacket ? PersonOutfitUtil.colorOf(theme, params.jacket, "") : null;
    const outfitText = FallbackUtil.nonEmpty(params.outfit, "tshirt");
    const outfit = IdUtil.isOneOf(OUTFIT_NAMES, outfitText) ? outfitText : null;
    const traits = IdUtil.lookup(PersonOutfitUtil.OUTFIT_TO_TRAITS, outfit);
    const gown = traits?.hasGown ? PersonOutfitUtil.colorOf(theme, params.gown, theme.ink) : null;
    const bottomText = traits?.isDress ? "dress" : FallbackUtil.nonEmpty(params.bottom, "pants");
    return {
      theme,
      skin: PersonHeadUtil.skinOf(params.skin),
      top,
      bottomColor: PersonOutfitUtil.colorOf(theme, params.pants, theme.secondary),
      jacket,
      outfit,
      bottom: IdUtil.isOneOf(BOTTOM_NAMES, bottomText) ? bottomText : null,
      shoes: PersonOutfitUtil.colorOf(theme, params.shoes, theme.ink),
      gown,
      sleeve: traits?.isLabCoat ? PersonOutfitUtil.LAB_COAT : gown ?? jacket ?? top,
      isShortSleeve: !jacket && traits?.isTshirt === true,
      detail: DetailUtil.rankOf(params.detail),
    };
  }

  private static legShapeOf(look: PersonLook): LegShape {
    return IdUtil.lookup(PersonOutfitUtil.BOTTOM_TO_LEG_SHAPE, look.bottom) ?? PersonOutfitUtil.UNKNOWN_LEG_SHAPE;
  }

  private static legColorOf(look: PersonLook): string {
    return PersonOutfitUtil.legShapeOf(look).isCovered ? look.bottomColor : look.skin;
  }

  static shoe(look: PersonLook, centerX: number, direction: number): string {
    const { shoes, detail } = look;
    const round = (value: number): number => PersonArmUtil.round(value);
    const heel = round(centerX - direction * 5);
    const toe = round(centerX + direction * 6);
    const tip = round(toe + direction * 1.2);
    const base = `<path d="M${heel} -5.4 L${heel} -0.8 L${round(toe - direction * 0.5)} -0.8 Q${tip} -0.8 ${tip} -2.8 `
      + `Q${round(toe - direction)} -5.6 ${round(centerX)} -5.6 Z" fill="${shoes}"/>`;
    // Why: a lighter sole makes the toe and the heel read as a shoe instead of a blob.
    const sole = `<path d="M${heel} -1.8 L${tip} -1.8 L${round(toe + direction * 0.7)} -0.5 L${heel} -0.5 Z" `
      + `fill="${ColorUtil.sh(shoes, PersonOutfitUtil.SOLE_LIGHTEN)}"/>`;
    return base + (detail >= 1 ? sole : "");
  }

  private static hem(look: PersonLook, path: string, color: string): string {
    return look.detail >= 1 ? `<path d="${path}" fill="${ColorUtil.sh(color, -PersonOutfitUtil.HEM_SHADE)}"/>` : "";
  }

  static seatedLegs(look: PersonLook, facing: number): string {
    const legColor = PersonOutfitUtil.legColorOf(look);
    const knee: [number, number] = [facing * 24, -45];
    const legs = PersonArmUtil.taper([[0, -45], knee, [facing * 24, -4]], [11.5, 10.5, 8.5], legColor)
      + `<path d="M${facing * 2} -41 L${facing * 24} -41" stroke="${ColorUtil.sh(legColor, -0.12)}" `
      + `stroke-width="3" fill="none"/>`
      + `<g transform="translate(0 -2.2)">${PersonOutfitUtil.shoe(look, facing * 26, facing)}</g>`;
    return legs + (IdUtil.lookup(PersonOutfitUtil.BOTTOM_TO_SEATED_OVERLAY, look.bottom)?.(look, facing) ?? "");
  }

  private static seatedSkirt(look: PersonLook, facing: number, fill: string): string {
    return `<path d="M${-facing * 6} -52 L${facing * 18} -50 L${facing * 20} -39 L${-facing * 7} -40 Z" fill="${fill}"/>`;
  }

  static seatedTorso(look: PersonLook, facing: number): string {
    const { jacket, top } = look;
    const torsoColor = jacket ?? top;
    const hem = PersonOutfitUtil.hem(look, "M-10 -43.4 L10 -43.4 L10 -41 L-10 -41 Z", torsoColor);
    const fold = look.detail >= PersonOutfitUtil.FOLD_DETAIL
      ? `<path d="M${-facing * 8} -52 Q${-facing * 2} -49.5 ${facing * 6} -52.5" stroke="${ColorUtil.sh(torsoColor, -0.22)}" `
      + `stroke-width="0.9" fill="none" stroke-linecap="round"/>`
      : "";
    return `<rect x="-10" y="-81" width="20" height="40" rx="7" fill="${torsoColor}"/>`
      + `<path d="M${-facing * 10} -74 Q${-facing * 10} -81 ${-facing * 4} -81 L${-facing * 3} -81 `
      + `L${-facing * 3} -41 L${-facing * 10} -41 Z" fill="${ColorUtil.sh(torsoColor, -0.13)}"/>`
      + (jacket ? `<path d="M${facing * 5} -80 L${facing * 9} -76 L${facing * 9} -44 L${facing * 4} -44 Z" fill="${top}"/>` : "")
      + hem + fold;
  }

  static standingLegs(look: PersonLook, isWalking: boolean): string {
    const legColor = PersonOutfitUtil.legColorOf(look);
    const legWidth = PersonOutfitUtil.legShapeOf(look).width;
    const isCovered = PersonOutfitUtil.legShapeOf(look).isCovered;
    const legs = isWalking
      ? PersonOutfitUtil.walkingLegs(look, legColor)
      : PersonOutfitUtil.restingLegs(look, { legColor, legWidth, isCovered });
    return legs + (IdUtil.lookup(PersonOutfitUtil.BOTTOM_TO_STANDING_OVERLAY, look.bottom)?.(look) ?? "");
  }

  private static walkingLegs(look: PersonLook, legColor: string): string {
    return PersonArmUtil.taper([[-3, -45], [-12, -3]], PersonOutfitUtil.WALKING_LEG_WIDTHS, legColor)
      + PersonArmUtil.taper([[3, -45], [11, -3]], PersonOutfitUtil.WALKING_LEG_WIDTHS, ColorUtil.sh(legColor, -0.12))
      + PersonOutfitUtil.shoe(look, -14, -1) + PersonOutfitUtil.shoe(look, 14, 1);
  }

  private static restingLegs(
    look: PersonLook, leg: { legColor: string; legWidth: number; isCovered: boolean },
  ): string {
    const { legColor, legWidth, isCovered } = leg;
    const round = (value: number): number => PersonArmUtil.round(value);
    const bottomInset = legWidth * PersonOutfitUtil.LEG_TAPER;
    const left = -1 - legWidth / 2;
    const right = 1 + legWidth / 2;
    const tapered = (center: number, color: string): string => (
      `<path d="M${round(center - legWidth / 2)} -47 L${round(center + legWidth / 2)} -47 `
      + `L${round(center + bottomInset)} -2 L${round(center - bottomInset)} -2 Z" fill="${color}"/>`
    );
    const shade = `<path d="M${round(1 + legWidth * 0.45)} -47 L${round(1 + legWidth)} -47 `
      + `L${round(right + bottomInset)} -2 L${round(right - legWidth * 0.04)} -2 Z" fill="${ColorUtil.sh(legColor, -0.12)}"/>`;
    const cuff = isCovered
      ? PersonOutfitUtil.hem(look, `M${round(left - bottomInset - 0.4)} -9.6 L${round(left + bottomInset + 0.4)} -9.6 `
      + `L${round(left + bottomInset)} -7.2 L${round(left - bottomInset)} -7.2 Z`, legColor)
    + PersonOutfitUtil.hem(look, `M${round(right - bottomInset - 0.4)} -9.6 L${round(right + bottomInset + 0.4)} -9.6 `
    + `L${round(right + bottomInset)} -7.2 L${round(right - bottomInset)} -7.2 Z`, legColor)
      : "";
    return tapered(left, legColor) + tapered(right, legColor) + shade + cuff
      + PersonOutfitUtil.shoe(look, -5.5, -1) + PersonOutfitUtil.shoe(look, 5.5, 1);
  }

  static standingTorso(look: PersonLook, params: PersonParams, isBack: boolean): string {
    return PersonOutfitUtil.baseTorso(look, params.build === "heavy")
      + PersonOutfitUtil.upperLayers(look, isBack)
      + PersonOutfitUtil.gownLayer(look, params, isBack)
      + PersonOutfitUtil.labCoatLayer(look, isBack)
      + PersonOutfitUtil.torsoDetails(look, params, isBack);
  }

  private static hemKindOf(look: PersonLook, params: PersonParams): HemKind {
    if (look.gown) {
      return "gown";
    }
    const named = IdUtil.lookup(PersonOutfitUtil.OUTFIT_TO_HEM_KIND, look.outfit);
    if (named) {
      return named;
    }
    return IdUtil.lookup(PersonOutfitUtil.BUILD_TO_HEM_KIND, params.build) ?? "standard";
  }

  private static torsoDetails(look: PersonLook, params: PersonParams, isBack: boolean): string {
    const torsoColor = look.jacket ?? look.top;
    const kind = PersonOutfitUtil.hemKindOf(look, params);
    const kindToColor = { gown: look.gown ?? torsoColor, labcoat: PersonOutfitUtil.LAB_COAT };
    const hemColor = IdUtil.lookup(kindToColor, kind) ?? torsoColor;
    const hem = PersonOutfitUtil.hem(look, PersonOutfitUtil.HEM_KIND_TO_PATH[kind], hemColor);
    const hasFold = look.detail >= PersonOutfitUtil.FOLD_DETAIL && !PersonOutfitUtil.LONG_HEMS.has(kind);
    const fold = hasFold
      ? `<path d="M-9 -54 Q-2 -51.5 6 -54.5" stroke="${ColorUtil.sh(torsoColor, -0.22)}" stroke-width="0.9" fill="none" `
      + `stroke-linecap="round"/>`
      : "";
    const hasCollar = !isBack && look.detail >= 1;
    return hem + fold + (hasCollar ? PersonOutfitUtil.collar(look) : "");
  }

  private static collar(look: PersonLook): string {
    if (look.jacket) {
      return `<path d="M-6 -82 L-1 -76 L-7.5 -71 Z M6 -82 L1 -76 L7.5 -71 Z" fill="${ColorUtil.sh(look.jacket, -0.1)}"/>`;
    }
    return IdUtil.lookup(PersonOutfitUtil.OUTFIT_TO_COLLAR, look.outfit)?.(look) ?? "";
  }

  private static baseTorso(look: PersonLook, isHeavy: boolean): string {
    const torsoColor = look.jacket ?? look.top;
    const shade = ColorUtil.sh(torsoColor, -0.13);
    if (isHeavy) {
      return `<path d="M-13 -74 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -74 Q18 -58 13 -44 L-13 -44 Q-18 -58 -13 -74 Z" `
        + `fill="${torsoColor}"/>`
        + `<path d="M5 -81 L6 -81 Q13 -81 13 -74 Q18 -58 13 -44 L5 -44 Z" fill="${shade}"/>`;
    }
    return `<path d="M-13 -74 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -74 L12 -44 L-12 -44 Z" fill="${torsoColor}"/>`
      + `<path d="M5 -81 L6 -81 Q13 -81 13 -74 L12 -44 L5 -44 Z" fill="${shade}"/>`;
  }

  private static upperLayers(look: PersonLook, isBack: boolean): string {
    const { jacket, top } = look;
    if (isBack) {
      return "";
    }
    if (jacket) {
      return `<path d="M-5 -81 L5 -81 L3 -45 L-3 -45 Z" fill="${top}"/>`
        + `<path d="M-5 -81 L-1 -70 L-4 -60 M5 -81 L1 -70 L4 -60" stroke="${ColorUtil.sh(jacket, -0.25)}" `
        + `stroke-width="1.2" fill="none"/>`;
    }
    return IdUtil.lookup(PersonOutfitUtil.OUTFIT_TO_NECKLINE, look.outfit)?.(look) ?? "";
  }

  private static gownLayer(look: PersonLook, params: PersonParams, isBack: boolean): string {
    const { gown, theme, skin } = look;
    // Why: the graduation gown goes over everything else.
    if (!gown) {
      return "";
    }
    const stole = PersonOutfitUtil.themeColorOnly(theme, params.stole, theme.accent);
    const front = `<path d="M-6 -81 L-3 -81 L-4 -46 L-7 -46 Z M3 -81 L6 -81 L7 -46 L4 -46 Z" fill="${stole}"/>`
      + `<path d="M-5 -81 Q0 -74 5 -81" fill="${ColorUtil.sh(skin, -0.12)}"/>`;
    return `<path d="M-13 -76 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -76 L18 -14 L-18 -14 Z" fill="${gown}"/>`
      + `<path d="M5 -81 L6 -81 Q13 -81 13 -76 L18 -14 L6 -14 Z" fill="${ColorUtil.sh(gown, -0.15)}"/>`
      + (isBack ? "" : front);
  }

  private static labCoatLayer(look: PersonLook, isBack: boolean): string {
    if (look.outfit !== "labcoat") {
      return "";
    }
    const coat = PersonOutfitUtil.LAB_COAT;
    const { top, theme } = look;
    const seam = ColorUtil.sh(coat, -0.25);
    const front = `<path d="M-5 -81 L5 -81 L1 -60 L-1 -60 Z" fill="${top}"/>`
      + `<path d="M0 -60 L0 -27" stroke="${seam}" stroke-width="1"/>`
      + `<rect x="-11" y="-42" width="7" height="6" rx="1" fill="none" stroke="${seam}" stroke-width="1"/>`
      + `<path d="M6 -72 L6 -66" stroke="${theme.primary}" stroke-width="1.6"/>`;
    return `<path d="M-13 -76 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -76 L15 -27 L-15 -27 Z" fill="${coat}"/>`
      + `<path d="M5 -81 L6 -81 Q13 -81 13 -76 L15 -27 L5 -27 Z" fill="${ColorUtil.sh(coat, -0.1)}"/>`
      + (isBack ? "" : front);
  }

  static backpack(look: PersonLook, params: PersonParams, isBack: boolean): { behind: string; onTorso: string } {
    // Why: the backpack shows behind the body from the front and on the torso from behind.
    if (!params.backpack) {
      return { behind: "", onTorso: "" };
    }
    const { theme } = look;
    const color = params.backpack === true
      ? theme.accent
      : PersonOutfitUtil.colorOf(theme, params.backpack, theme.accent);
    if (isBack) {
      return {
        behind: "",
        onTorso: `<rect x="-11" y="-78" width="22" height="30" rx="7" fill="${color}"/>`
          + `<rect x="-7" y="-62" width="14" height="10" rx="3" fill="${ColorUtil.sh(color, -0.15)}"/>`,
      };
    }
    return {
      behind: `<rect x="-16" y="-79" width="32" height="32" rx="7" fill="${ColorUtil.sh(color, -0.2)}"/>`,
      onTorso: `<path d="M-8 -81 L-9 -50 M8 -81 L9 -50" stroke="${ColorUtil.sh(color, -0.1)}" `
        + `stroke-width="2.5" stroke-linecap="round"/>`,
    };
  }

  static hat(look: PersonLook, params: PersonParams, side: number): string {
    return IdUtil.lookup(PersonOutfitUtil.HAT_NAME_TO_BUILDER, params.hat)?.(look, params, side) ?? "";
  }

  private static graduationCap(look: PersonLook): string {
    const { ink, accent } = look.theme;
    return `<path d="M-9 -103 L9 -103 L9 -98 Q0 -95 -9 -98 Z" fill="${ink}"/>`
      + `<path d="M-18 -103 L0 -110 L18 -103 L0 -96 Z" fill="${ink}"/>`
      + `<path d="M-18 -103 L0 -96 L18 -103 L0 -98.5 Z" fill="${ColorUtil.sh(ink, 0.15)}"/>`
      + `<path d="M0 -103 L13 -102 L14 -93" stroke="${accent}" stroke-width="1.3" fill="none"/>`
      + `<circle cx="14" cy="-92" r="1.8" fill="${accent}"/>`;
  }

  private static cap(look: PersonLook, params: PersonParams, side: number): string {
    const color = PersonOutfitUtil.themeColorOnly(look.theme, params.hat_color, look.theme.primary);
    const isFacingRight = side >= 0;
    return `<path d="M-11 -97 Q-11 -108 0 -108 Q11 -108 11 -97 Z" fill="${color}"/>`
      + `<path d="M${isFacingRight ? 4 : -18} -98 L${isFacingRight ? 18 : -4} -98 `
      + `L${isFacingRight ? 16 : -6} -95 L${isFacingRight ? 4 : -4} -95 Z" fill="${ColorUtil.sh(color, -0.2)}"/>`;
  }
}
