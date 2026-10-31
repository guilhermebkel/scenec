import type { TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { CloudDensity } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { SeedUtil } from "@/Utils/SeedUtil.ts";

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface AmbientCloudOptions {
  density?: CloudDensity;
  seed: number;
  width: number;
  horizonY: number;
  paperColor: string;
  textRects?: readonly TextRect[];
  focusBox?: Box | null;
}

interface CloudSpec {
  scale: number;
  opacity: number;
  minYRatio: number;
  maxYRatio: number;
}

export class SkyDetailService {
  private static readonly CLOUD_BASE_WIDTH = 110;

  private static readonly CLOUD_BASE_HEIGHT = 50;

  private static readonly TEXT_MARGIN = 20;

  private static readonly FEW_COUNT = 3;

  private static readonly MANY_COUNT = 6;

  private static readonly SEED_STEP = 79;

  private static readonly SKY_MID_STOP = 0.55;

  private static readonly SKY_BAND_STOP = 0.85;

  private static readonly WARM_SHIFT = 0.12;

  private static readonly X_START_RATIO = 0.1;

  private static readonly X_SPAN_RATIO = 0.8;

  private static readonly SHADOW_AMOUNT = -0.08;

  private static readonly DENSITY_TO_COUNT: Record<CloudDensity, number> = {
    none: 0,
    few: SkyDetailService.FEW_COUNT,
    many: SkyDetailService.MANY_COUNT,
  };

  private static readonly CLOUD_SPECS: readonly CloudSpec[] = [
    { scale: 0.55, opacity: 0.45, minYRatio: 0.12, maxYRatio: 0.35 },
    { scale: 0.85, opacity: 0.7, minYRatio: 0.28, maxYRatio: 0.58 },
    { scale: 1.15, opacity: 0.92, minYRatio: 0.42, maxYRatio: 0.78 },
  ];

  static skyGradientStops(theme: Theme): string {
    const skyMid = ColorUtil.mix(theme.skyTop, theme.skyBottom, SkyDetailService.SKY_MID_STOP);
    const skyBand = ColorUtil.sh(theme.skyBottom, SkyDetailService.WARM_SHIFT);
    return `<stop offset="0" stop-color="${theme.skyTop}"/>`
      + `<stop offset="${SkyDetailService.SKY_MID_STOP}" stop-color="${skyMid}"/>`
      + `<stop offset="${SkyDetailService.SKY_BAND_STOP}" stop-color="${skyBand}"/>`
      + `<stop offset="1" stop-color="${theme.skyBottom}"/>`;
  }

  static ambientClouds(options: AmbientCloudOptions): string {
    const { density = "none", seed, width, horizonY, paperColor, textRects = [], focusBox } = options;
    const count = SkyDetailService.DENSITY_TO_COUNT[density];
    if (count <= 0) {
      return "";
    }
    let svg = "";
    for (let index = 0; index < count; index++) {
      svg += SkyDetailService.drawOneCloud({
        index,
        seed,
        width,
        horizonY,
        paperColor,
        textRects,
        focusBox,
      });
    }
    return svg;
  }

  private static drawOneCloud(parts: {
    index: number;
    seed: number;
    width: number;
    horizonY: number;
    paperColor: string;
    textRects: readonly TextRect[];
    focusBox?: Box | null;
  }): string {
    const { index, seed, width, horizonY, paperColor, textRects, focusBox } = parts;
    const random = SeedUtil.sequence(seed + index * SkyDetailService.SEED_STEP);
    const specIndex = index % SkyDetailService.CLOUD_SPECS.length;
    const spec = SkyDetailService.CLOUD_SPECS[specIndex] ?? {
      scale: 0.55, opacity: 0.45, minYRatio: 0.12, maxYRatio: 0.35,
    };
    const posX = (SkyDetailService.X_START_RATIO + random() * SkyDetailService.X_SPAN_RATIO) * width;
    const yRatio = spec.minYRatio + random() * (spec.maxYRatio - spec.minYRatio);
    const posY = horizonY * yRatio;
    const halfWidth = (SkyDetailService.CLOUD_BASE_WIDTH * spec.scale) / 2;
    const halfHeight = (SkyDetailService.CLOUD_BASE_HEIGHT * spec.scale) / 2;
    const cloudBox: Box = {
      x0: posX - halfWidth - SkyDetailService.TEXT_MARGIN,
      y0: posY - halfHeight - SkyDetailService.TEXT_MARGIN,
      x1: posX + halfWidth + SkyDetailService.TEXT_MARGIN,
      y1: posY + halfHeight + SkyDetailService.TEXT_MARGIN,
    };
    if (SkyDetailService.overlapsAny(cloudBox, textRects, focusBox)) {
      return "";
    }
    const shaded = ColorUtil.sh(paperColor, SkyDetailService.SHADOW_AMOUNT);
    return `<g transform="translate(${posX.toFixed(1)} ${posY.toFixed(1)}) scale(${spec.scale.toFixed(2)})" fill="${paperColor}" opacity="${spec.opacity}">`
      + `<circle cx="-28" cy="-15" r="15"/><circle cx="0" cy="-26" r="22"/><circle cx="28" cy="-15" r="15"/><rect x="-43" y="-15" width="86" height="15" rx="7"/>`
      + `<path d="M-43 -8 Q-43 0 -36 0 L36 0 Q43 0 43 -8 Z" fill="${shaded}" opacity="0.9"/>`
      + "</g>";
  }

  private static overlapsAny(cloudBox: Box, textRects: readonly TextRect[], focusBox?: Box | null): boolean {
    if (focusBox && SkyDetailService.intersects(cloudBox, focusBox)) {
      return true;
    }
    return textRects.some((rect) => SkyDetailService.intersects(cloudBox, {
      x0: rect.x0,
      y0: rect.y0,
      x1: rect.x1,
      y1: rect.y1,
    }));
  }

  private static intersects(first: Box, second: Box): boolean {
    return first.x0 < second.x1 && first.x1 > second.x0 && first.y0 < second.y1 && first.y1 > second.y0;
  }
}
