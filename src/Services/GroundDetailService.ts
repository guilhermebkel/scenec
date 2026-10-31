import type { Placement } from "@/Protocols/CompilationProtocol.ts";
import type { GroundDetail } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { SeedUtil } from "@/Utils/SeedUtil.ts";

export interface GroundDetailOptions {
  detail?: GroundDetail;
  seed: number;
  width: number;
  height: number;
  horizonY: number;
  theme: Theme;
  placements?: readonly Placement[];
  isPathBlocked?: (x: number, y: number) => boolean;
}

export class GroundDetailService {
  private static readonly LOW_COUNT = 14;

  private static readonly HIGH_COUNT = 32;

  private static readonly BLOB_COUNT = 3;

  private static readonly SEED_STEP = 53;

  private static readonly BLOB_SEED_STEP = 97;

  private static readonly DETAIL_TO_COUNT: Record<GroundDetail, number> = {
    none: 0,
    low: GroundDetailService.LOW_COUNT,
    high: GroundDetailService.HIGH_COUNT,
  };

  private static readonly FAR_SHADE = 0.14;

  private static readonly NEAR_SHADE = -0.06;

  private static readonly BLOB_SHADE_POS = 0.04;

  private static readonly BLOB_SHADE_NEG = -0.04;

  private static readonly BLOB_OPACITY = 0.35;

  private static readonly FOOT_PADDING_X = 12;

  private static readonly FOOT_PADDING_Y = 14;

  private static readonly CYCLE_PEBBLE = 4;

  private static readonly BLOB_X_MIN = 0.15;

  private static readonly BLOB_X_SPAN = 0.7;

  private static readonly BLOB_Y_MIN = 0.2;

  private static readonly BLOB_Y_SPAN = 0.6;

  private static readonly BLOB_RX_MIN = 0.08;

  private static readonly BLOB_RX_SPAN = 0.08;

  private static readonly BLOB_RY_MIN = 0.08;

  private static readonly BLOB_RY_SPAN = 0.08;

  private static readonly TUFT_SHADE = -0.15;

  private static readonly TUFT_X_MIN = 0.04;

  private static readonly TUFT_X_SPAN = 0.92;

  private static readonly TUFT_EXPONENT = 0.65;

  private static readonly TUFT_RATIO_SCALE = 0.88;

  private static readonly TUFT_RATIO_MIN = 0.1;

  private static readonly TUFT_SCALE_BASE = 0.35;

  private static readonly TUFT_SCALE_SPAN = 0.65;

  static groundGradientDef(theme: Theme): string {
    const farColor = ColorUtil.sh(theme.ground, GroundDetailService.FAR_SHADE);
    const nearColor = ColorUtil.sh(theme.ground, GroundDetailService.NEAR_SHADE);
    return `<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">`
      + `<stop offset="0" stop-color="${farColor}"/>`
      + `<stop offset="1" stop-color="${nearColor}"/>`
      + `</linearGradient>`;
  }

  static draw(options: GroundDetailOptions): string {
    const { detail = "low", seed, width, height, horizonY, theme, placements = [], isPathBlocked } = options;
    const count = GroundDetailService.DETAIL_TO_COUNT[detail];
    if (count <= 0) {
      return "";
    }
    const blobs = GroundDetailService.drawBlobs({ seed, width, height, horizonY, theme });
    const tufts = GroundDetailService.drawTufts({
      count,
      seed,
      width,
      height,
      horizonY,
      theme,
      placements,
      isPathBlocked,
    });
    return blobs + tufts;
  }

  private static drawBlobs(parts: {
    seed: number;
    width: number;
    height: number;
    horizonY: number;
    theme: Theme;
  }): string {
    const { seed, width, height, horizonY, theme } = parts;
    const groundHeight = height - horizonY;
    let svg = "";
    for (let index = 0; index < GroundDetailService.BLOB_COUNT; index++) {
      const random = SeedUtil.sequence(seed + index * GroundDetailService.BLOB_SEED_STEP);
      const posX = (GroundDetailService.BLOB_X_MIN + random() * GroundDetailService.BLOB_X_SPAN) * width;
      const blobYRatio = GroundDetailService.BLOB_Y_MIN + random() * GroundDetailService.BLOB_Y_SPAN;
      const posY = horizonY + blobYRatio * groundHeight;
      const radiusX = width * (GroundDetailService.BLOB_RX_MIN + random() * GroundDetailService.BLOB_RX_SPAN);
      const radiusY = groundHeight * (GroundDetailService.BLOB_RY_MIN + random() * GroundDetailService.BLOB_RY_SPAN);
      const shadeAmount = index % 2 === 0 ? GroundDetailService.BLOB_SHADE_POS : GroundDetailService.BLOB_SHADE_NEG;
      const fill = ColorUtil.sh(theme.ground, shadeAmount);
      svg += `<ellipse cx="${posX.toFixed(1)}" cy="${posY.toFixed(1)}" rx="${radiusX.toFixed(1)}" `
        + `ry="${radiusY.toFixed(1)}" fill="${fill}" opacity="${GroundDetailService.BLOB_OPACITY}"/>`;
    }
    return svg;
  }

  private static drawTufts(parts: {
    count: number;
    seed: number;
    width: number;
    height: number;
    horizonY: number;
    theme: Theme;
    placements: readonly Placement[];
    isPathBlocked?: (x: number, y: number) => boolean;
  }): string {
    const { count, seed, width, height, horizonY, theme, placements, isPathBlocked } = parts;
    const groundHeight = height - horizonY;
    const tuftColor = ColorUtil.sh(theme.groundDark || theme.ground, GroundDetailService.TUFT_SHADE);
    let svg = "";
    for (let index = 0; index < count; index++) {
      const random = SeedUtil.sequence(seed + index * GroundDetailService.SEED_STEP);
      const posX = (GroundDetailService.TUFT_X_MIN + random() * GroundDetailService.TUFT_X_SPAN) * width;
      const ratio = (random() ** GroundDetailService.TUFT_EXPONENT) * GroundDetailService.TUFT_RATIO_SCALE
        + GroundDetailService.TUFT_RATIO_MIN;
      const posY = horizonY + ratio * groundHeight;
      if (GroundDetailService.isNearFeet(posX, posY, placements) || isPathBlocked?.(posX, posY)) {
        continue;
      }
      const scale = GroundDetailService.TUFT_SCALE_BASE + GroundDetailService.TUFT_SCALE_SPAN * ratio;
      const isPebble = index % GroundDetailService.CYCLE_PEBBLE === 0;
      const shape = isPebble
        ? `<ellipse cx="0" cy="0" rx="3.5" ry="2" fill="${tuftColor}" opacity="0.6"/>`
        : `<path d="M -5 0 Q -4 -9 -7 -14 M 0 0 Q 0 -11 1 -16 M 5 0 Q 4 -9 7 -13" stroke="${tuftColor}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
      svg += `<g transform="translate(${posX.toFixed(1)} ${posY.toFixed(1)}) scale(${scale.toFixed(2)})">${shape}</g>`;
    }
    return svg;
  }

  private static isNearFeet(posX: number, posY: number, placements: readonly Placement[]): boolean {
    return placements.some((placement) => {
      const isGrounded = !placement.isBackdrop && placement.kind !== "sky";
      if (!isGrounded) {
        return false;
      }
      const left = placement.boxLeft - GroundDetailService.FOOT_PADDING_X;
      const right = placement.boxRight + GroundDetailService.FOOT_PADDING_X;
      const top = placement.y - GroundDetailService.FOOT_PADDING_Y;
      const bottom = placement.y + GroundDetailService.FOOT_PADDING_Y;
      return posX >= left && posX <= right && posY >= top && posY <= bottom;
    });
  }
}
