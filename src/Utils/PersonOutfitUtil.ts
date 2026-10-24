import type { HatName, PersonParams } from "@/Protocols/PersonProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { PersonHeadUtil } from "@/Utils/PersonHeadUtil.ts";

export interface PersonLook {
  theme: Theme;
  skin: string;
  top: string;
  bottomColor: string;
  jacket: string | null;
  outfit: string;
  bottom: string;
  shoes: string;
  gown: string | null;
  sleeve: string;
  isShortSleeve: boolean;
}

export class PersonOutfitUtil {
  private static readonly LAB_COAT = "#FBFBF8";

  private static readonly HAT_BUILDERS: Record<HatName, (look: PersonLook, params: PersonParams, side: number) => string> = {
    grad_cap: (look) => PersonOutfitUtil.graduationCap(look),
    cap: (look, params, side) => PersonOutfitUtil.cap(look, params, side),
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
    const outfit = params.outfit || "tshirt";
    const gown = outfit === "gown" ? PersonOutfitUtil.colorOf(theme, params.gown, theme.ink) : null;
    return {
      theme,
      skin: PersonHeadUtil.skinOf(params.skin),
      top,
      bottomColor: PersonOutfitUtil.colorOf(theme, params.pants, theme.secondary),
      jacket,
      outfit,
      bottom: outfit === "dress" ? "dress" : (params.bottom || "pants"),
      shoes: PersonOutfitUtil.colorOf(theme, params.shoes, theme.ink),
      gown,
      sleeve: outfit === "labcoat" ? PersonOutfitUtil.LAB_COAT : gown || jacket || top,
      isShortSleeve: !jacket && outfit === "tshirt",
    };
  }

  static seatedLegs(look: PersonLook, facing: number): string {
    const { bottom, bottomColor, skin, shoes, top } = look;
    const legColor = bottom === "pants" ? bottomColor : skin;
    let legs = `<path d="M0 -45 L${facing * 24} -45 L${facing * 24} -4" stroke="${legColor}" stroke-width="11" fill="none" stroke-linejoin="round"/>`
      + `<path d="M${facing * 2} -41 L${facing * 24} -41" stroke="${ColorUtil.sh(legColor, -0.12)}" stroke-width="3" fill="none"/>`
      + `<path d="M${facing * 21} -3 L${facing * 32} -3 Q${facing * 32} -8 ${facing * 25} -8 L${facing * 21} -8 Z" fill="${shoes}"/>`;
    if (bottom === "shorts") {
      legs += `<path d="M0 -45 L${facing * 14} -45" stroke="${bottomColor}" stroke-width="12" stroke-linecap="butt"/>`;
    }
    if (bottom === "skirt" || bottom === "dress") {
      legs += `<path d="M${-facing * 6} -52 L${facing * 18} -50 L${facing * 20} -39 L${-facing * 7} -40 Z" fill="${bottom === "dress" ? top : bottomColor}"/>`;
    }
    return legs;
  }

  static seatedTorso(look: PersonLook, facing: number): string {
    const { jacket, top } = look;
    const torsoColor = jacket || top;
    return `<rect x="-10" y="-81" width="20" height="40" rx="7" fill="${torsoColor}"/>`
      + `<path d="M${-facing * 10} -74 Q${-facing * 10} -81 ${-facing * 4} -81 L${-facing * 3} -81 L${-facing * 3} -41 L${-facing * 10} -41 Z" fill="${ColorUtil.sh(torsoColor, -0.13)}"/>`
      + (jacket ? `<path d="M${facing * 5} -80 L${facing * 9} -76 L${facing * 9} -44 L${facing * 4} -44 Z" fill="${top}"/>` : "");
  }

  static standingLegs(look: PersonLook, isWalking: boolean): string {
    const { bottom, bottomColor, skin, shoes, top } = look;
    const legColor = bottom === "pants" ? bottomColor : skin;
    let legs = isWalking ? PersonOutfitUtil.walkingLegs(legColor, shoes) : PersonOutfitUtil.restingLegs(legColor, shoes, bottom === "pants" ? 8 : 6.5);
    if (bottom === "shorts") {
      legs += `<path d="M-11 -47 L11 -47 L12 -30 L1 -30 L0 -36 L-1 -30 L-12 -30 Z" fill="${bottomColor}"/><path d="M4 -47 L11 -47 L12 -30 L5 -30 Z" fill="${ColorUtil.sh(bottomColor, -0.12)}"/>`;
    }
    if (bottom === "skirt") {
      legs += `<path d="M-12 -48 L12 -48 L17 -27 L-17 -27 Z" fill="${bottomColor}"/><path d="M4 -48 L12 -48 L17 -27 L7 -27 Z" fill="${ColorUtil.sh(bottomColor, -0.12)}"/>`;
    }
    if (bottom === "dress") {
      legs += `<path d="M-12 -48 L12 -48 L18 -24 L-18 -24 Z" fill="${top}"/><path d="M4 -48 L12 -48 L18 -24 L7 -24 Z" fill="${ColorUtil.sh(top, -0.12)}"/>`;
    }
    return legs;
  }

  private static walkingLegs(legColor: string, shoes: string): string {
    return `<path d="M-3 -45 L-12 -3" stroke="${legColor}" stroke-width="8" stroke-linecap="round"/><path d="M3 -45 L11 -3" stroke="${ColorUtil.sh(legColor, -0.12)}" stroke-width="8" stroke-linecap="round"/>`
      + `<ellipse cx="-14" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/><ellipse cx="14" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`;
  }

  private static restingLegs(legColor: string, shoes: string, legWidth: number): string {
    return `<rect x="${-1 - legWidth}" y="-47" width="${legWidth}" height="45" rx="3" fill="${legColor}"/><rect x="1" y="-47" width="${legWidth}" height="45" rx="3" fill="${legColor}"/>`
      + `<rect x="${1 + legWidth * 0.45}" y="-47" width="${legWidth * 0.55}" height="45" rx="2" fill="${ColorUtil.sh(legColor, -0.12)}"/>`
      + `<ellipse cx="-5.5" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/><ellipse cx="5.5" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`;
  }

  static standingTorso(look: PersonLook, params: PersonParams, isBack: boolean): string {
    return PersonOutfitUtil.baseTorso(look, params.build === "heavy")
      + PersonOutfitUtil.upperLayers(look, isBack)
      + PersonOutfitUtil.gownLayer(look, params, isBack)
      + PersonOutfitUtil.labCoatLayer(look, isBack);
  }

  private static baseTorso(look: PersonLook, isHeavy: boolean): string {
    const torsoColor = look.jacket || look.top;
    const shade = ColorUtil.sh(torsoColor, -0.13);
    if (isHeavy) {
      return `<path d="M-13 -74 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -74 Q18 -58 13 -44 L-13 -44 Q-18 -58 -13 -74 Z" fill="${torsoColor}"/>`
        + `<path d="M5 -81 L6 -81 Q13 -81 13 -74 Q18 -58 13 -44 L5 -44 Z" fill="${shade}"/>`;
    }
    return `<path d="M-13 -74 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -74 L12 -44 L-12 -44 Z" fill="${torsoColor}"/>`
      + `<path d="M5 -81 L6 -81 Q13 -81 13 -74 L12 -44 L5 -44 Z" fill="${shade}"/>`;
  }

  private static upperLayers(look: PersonLook, isBack: boolean): string {
    const { jacket, top, outfit, skin } = look;
    if (isBack) {
      return "";
    }
    if (jacket) {
      return `<path d="M-5 -81 L5 -81 L3 -45 L-3 -45 Z" fill="${top}"/><path d="M-5 -81 L-1 -70 L-4 -60 M5 -81 L1 -70 L4 -60" stroke="${ColorUtil.sh(jacket, -0.25)}" stroke-width="1.2" fill="none"/>`;
    }
    if (outfit === "sweater") {
      return `<path d="M-6 -81 Q0 -76 6 -81" stroke="${ColorUtil.sh(top, -0.25)}" stroke-width="1.5" fill="none"/>`;
    }
    return outfit === "tshirt" ? `<path d="M-5 -81 Q0 -77 5 -81" fill="${ColorUtil.sh(skin, -0.12)}"/>` : "";
  }

  // Why: the graduation gown goes over everything else.
  private static gownLayer(look: PersonLook, params: PersonParams, isBack: boolean): string {
    const { gown, theme, skin } = look;
    if (!gown) {
      return "";
    }
    const stole = PersonOutfitUtil.themeColorOnly(theme, params.stole, theme.accent);
    return `<path d="M-13 -76 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -76 L18 -14 L-18 -14 Z" fill="${gown}"/><path d="M5 -81 L6 -81 Q13 -81 13 -76 L18 -14 L6 -14 Z" fill="${ColorUtil.sh(gown, -0.15)}"/>`
      + (isBack ? "" : `<path d="M-6 -81 L-3 -81 L-4 -46 L-7 -46 Z M3 -81 L6 -81 L7 -46 L4 -46 Z" fill="${stole}"/><path d="M-5 -81 Q0 -74 5 -81" fill="${ColorUtil.sh(skin, -0.12)}"/>`);
  }

  private static labCoatLayer(look: PersonLook, isBack: boolean): string {
    if (look.outfit !== "labcoat") {
      return "";
    }
    const coat = PersonOutfitUtil.LAB_COAT;
    const { top, theme } = look;
    return `<path d="M-13 -76 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -76 L15 -27 L-15 -27 Z" fill="${coat}"/><path d="M5 -81 L6 -81 Q13 -81 13 -76 L15 -27 L5 -27 Z" fill="${ColorUtil.sh(coat, -0.1)}"/>`
      + (isBack
        ? ""
        : `<path d="M-5 -81 L5 -81 L1 -60 L-1 -60 Z" fill="${top}"/><path d="M0 -60 L0 -27" stroke="${ColorUtil.sh(coat, -0.25)}" stroke-width="1"/>`
          + `<rect x="-11" y="-42" width="7" height="6" rx="1" fill="none" stroke="${ColorUtil.sh(coat, -0.25)}" stroke-width="1"/><path d="M6 -72 L6 -66" stroke="${theme.primary}" stroke-width="1.6"/>`);
  }

  /** The backpack shows behind the body from the front and on the torso from behind. */
  static backpack(look: PersonLook, params: PersonParams, isBack: boolean): { behind: string; onTorso: string } {
    if (!params.backpack) {
      return { behind: "", onTorso: "" };
    }
    const { theme } = look;
    const color = params.backpack === true ? theme.accent : PersonOutfitUtil.colorOf(theme, params.backpack, theme.accent);
    if (isBack) {
      return {
        behind: "",
        onTorso: `<rect x="-11" y="-78" width="22" height="30" rx="7" fill="${color}"/><rect x="-7" y="-62" width="14" height="10" rx="3" fill="${ColorUtil.sh(color, -0.15)}"/>`,
      };
    }
    return {
      behind: `<rect x="-16" y="-79" width="32" height="32" rx="7" fill="${ColorUtil.sh(color, -0.2)}"/>`,
      onTorso: `<path d="M-8 -81 L-9 -50 M8 -81 L9 -50" stroke="${ColorUtil.sh(color, -0.1)}" stroke-width="2.5" stroke-linecap="round"/>`,
    };
  }

  static hat(look: PersonLook, params: PersonParams, side: number): string {
    return IdUtil.lookup(PersonOutfitUtil.HAT_BUILDERS, params.hat)?.(look, params, side) ?? "";
  }

  private static graduationCap(look: PersonLook): string {
    const { ink, accent } = look.theme;
    return `<path d="M-9 -103 L9 -103 L9 -98 Q0 -95 -9 -98 Z" fill="${ink}"/><path d="M-18 -103 L0 -110 L18 -103 L0 -96 Z" fill="${ink}"/><path d="M-18 -103 L0 -96 L18 -103 L0 -98.5 Z" fill="${ColorUtil.sh(ink, 0.15)}"/>`
      + `<path d="M0 -103 L13 -102 L14 -93" stroke="${accent}" stroke-width="1.3" fill="none"/><circle cx="14" cy="-92" r="1.8" fill="${accent}"/>`;
  }

  private static cap(look: PersonLook, params: PersonParams, side: number): string {
    const color = PersonOutfitUtil.themeColorOnly(look.theme, params.hat_color, look.theme.primary);
    const facingRight = side >= 0;
    return `<path d="M-11 -97 Q-11 -108 0 -108 Q11 -108 11 -97 Z" fill="${color}"/><path d="M${facingRight ? 4 : -18} -98 L${facingRight ? 18 : -4} -98 L${facingRight ? 16 : -6} -95 L${facingRight ? 4 : -4} -95 Z" fill="${ColorUtil.sh(color, -0.2)}"/>`;
  }
}
