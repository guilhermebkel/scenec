import { BOTTOM_NAMES, OUTFIT_NAMES } from "@/Protocols/PersonProtocol.ts";
import type { BottomName, HatName, OutfitName, PersonParams } from "@/Protocols/PersonProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { FallbackUtil } from "@/Utils/FallbackUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
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

type LegsOverlay = (look: PersonLook, facing: number) => string;

export class PersonOutfitUtil {
  private static readonly LAB_COAT = "#FBFBF8";

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
      + `<path d="M4 -48 L12 -48 L17 -27 L7 -27 Z" fill="${ColorUtil.sh(look.bottomColor, -0.12)}"/>`
    ),
    dress: (look) => (
      `<path d="M-12 -48 L12 -48 L18 -24 L-18 -24 Z" fill="${look.top}"/>`
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
    };
  }

  private static legShapeOf(look: PersonLook): LegShape {
    return IdUtil.lookup(PersonOutfitUtil.BOTTOM_TO_LEG_SHAPE, look.bottom) ?? PersonOutfitUtil.UNKNOWN_LEG_SHAPE;
  }

  private static legColorOf(look: PersonLook): string {
    return PersonOutfitUtil.legShapeOf(look).isCovered ? look.bottomColor : look.skin;
  }

  static seatedLegs(look: PersonLook, facing: number): string {
    const { shoes } = look;
    const legColor = PersonOutfitUtil.legColorOf(look);
    const legs = `<path d="M0 -45 L${facing * 24} -45 L${facing * 24} -4" stroke="${legColor}" stroke-width="11" `
      + `fill="none" stroke-linejoin="round"/>`
      + `<path d="M${facing * 2} -41 L${facing * 24} -41" stroke="${ColorUtil.sh(legColor, -0.12)}" `
      + `stroke-width="3" fill="none"/>`
      + `<path d="M${facing * 21} -3 L${facing * 32} -3 Q${facing * 32} -8 ${facing * 25} -8 L${facing * 21} -8 Z" `
      + `fill="${shoes}"/>`;
    return legs + (IdUtil.lookup(PersonOutfitUtil.BOTTOM_TO_SEATED_OVERLAY, look.bottom)?.(look, facing) ?? "");
  }

  private static seatedSkirt(look: PersonLook, facing: number, fill: string): string {
    return `<path d="M${-facing * 6} -52 L${facing * 18} -50 L${facing * 20} -39 L${-facing * 7} -40 Z" fill="${fill}"/>`;
  }

  static seatedTorso(look: PersonLook, facing: number): string {
    const { jacket, top } = look;
    const torsoColor = jacket ?? top;
    return `<rect x="-10" y="-81" width="20" height="40" rx="7" fill="${torsoColor}"/>`
      + `<path d="M${-facing * 10} -74 Q${-facing * 10} -81 ${-facing * 4} -81 L${-facing * 3} -81 `
      + `L${-facing * 3} -41 L${-facing * 10} -41 Z" fill="${ColorUtil.sh(torsoColor, -0.13)}"/>`
      + (jacket ? `<path d="M${facing * 5} -80 L${facing * 9} -76 L${facing * 9} -44 L${facing * 4} -44 Z" fill="${top}"/>` : "");
  }

  static standingLegs(look: PersonLook, isWalking: boolean): string {
    const { shoes } = look;
    const legColor = PersonOutfitUtil.legColorOf(look);
    const legWidth = PersonOutfitUtil.legShapeOf(look).width;
    const legs = isWalking
      ? PersonOutfitUtil.walkingLegs(legColor, shoes)
      : PersonOutfitUtil.restingLegs(legColor, shoes, legWidth);
    return legs + (IdUtil.lookup(PersonOutfitUtil.BOTTOM_TO_STANDING_OVERLAY, look.bottom)?.(look) ?? "");
  }

  private static walkingLegs(legColor: string, shoes: string): string {
    return `<path d="M-3 -45 L-12 -3" stroke="${legColor}" stroke-width="8" stroke-linecap="round"/>`
      + `<path d="M3 -45 L11 -3" stroke="${ColorUtil.sh(legColor, -0.12)}" stroke-width="8" stroke-linecap="round"/>`
      + `<ellipse cx="-14" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`
      + `<ellipse cx="14" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`;
  }

  private static restingLegs(legColor: string, shoes: string, legWidth: number): string {
    return `<rect x="${-1 - legWidth}" y="-47" width="${legWidth}" height="45" rx="3" fill="${legColor}"/>`
      + `<rect x="1" y="-47" width="${legWidth}" height="45" rx="3" fill="${legColor}"/>`
      + `<rect x="${1 + legWidth * 0.45}" y="-47" width="${legWidth * 0.55}" height="45" rx="2" `
      + `fill="${ColorUtil.sh(legColor, -0.12)}"/>`
      + `<ellipse cx="-5.5" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`
      + `<ellipse cx="5.5" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`;
  }

  static standingTorso(look: PersonLook, params: PersonParams, isBack: boolean): string {
    return PersonOutfitUtil.baseTorso(look, params.build === "heavy")
      + PersonOutfitUtil.upperLayers(look, isBack)
      + PersonOutfitUtil.gownLayer(look, params, isBack)
      + PersonOutfitUtil.labCoatLayer(look, isBack);
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
