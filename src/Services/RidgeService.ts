import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { SeedUtil } from "@/Utils/SeedUtil.ts";

export interface RidgeOptions {
  count: number;
  seed: number;
  width: number;
  horizonY: number;
  groundColor: string;
  airColor: string;
  bottomY: number;
}

interface Point {
  x: number;
  y: number;
}

export class RidgeService {
  private static readonly SAMPLE_COUNT = 24;

  private static readonly MAX_ELEVATION_FACTOR = 0.14;

  private static readonly ELEVATION_DROP = 0.45;

  private static readonly AMPLITUDE_RATIO = 0.35;

  private static readonly BASE_AMP_SCALE = 0.5;

  private static readonly OCTAVE1_WEIGHT = 0.55;

  private static readonly OCTAVE2_WEIGHT = 0.3;

  private static readonly OCTAVE3_WEIGHT = 0.15;

  private static readonly MAX_MIX_FACTOR = 0.52;

  private static readonly FULL_TURN = Math.PI * 2;

  private static readonly FREQ1_BASE = 1.5;

  private static readonly FREQ1_SPAN = 0.8;

  private static readonly FREQ2_BASE = 3.5;

  private static readonly FREQ2_SPAN = 1.5;

  private static readonly FREQ3_BASE = 7.0;

  private static readonly FREQ3_SPAN = 2.5;

  private static readonly LAYER_SEED_STEP = 101;

  static draw(options: RidgeOptions): string {
    const { count, seed, width, horizonY, groundColor, airColor, bottomY } = options;
    if (count <= 0) {
      return "";
    }
    let svg = "";
    for (let index = 0; index < count; index++) {
      svg += RidgeService.drawLayer({ index, count, seed, width, horizonY, groundColor, airColor, bottomY });
    }
    return svg;
  }

  private static drawLayer(parts: {
    index: number;
    count: number;
    seed: number;
    width: number;
    horizonY: number;
    groundColor: string;
    airColor: string;
    bottomY: number;
  }): string {
    const { index, count, seed, width, horizonY, groundColor, airColor, bottomY } = parts;
    const random = SeedUtil.sequence(seed + index * RidgeService.LAYER_SEED_STEP);
    const elevationRatio = 1 - (index / count) * RidgeService.ELEVATION_DROP;
    const baseElevation = horizonY * RidgeService.MAX_ELEVATION_FACTOR * elevationRatio;
    const ampScale = RidgeService.BASE_AMP_SCALE + (index / count) * RidgeService.BASE_AMP_SCALE;
    const amplitude = baseElevation * RidgeService.AMPLITUDE_RATIO * ampScale;
    const freq1 = (RidgeService.FREQ1_BASE + random() * RidgeService.FREQ1_SPAN) * Math.PI / width;
    const phase1 = random() * RidgeService.FULL_TURN;
    const freq2 = (RidgeService.FREQ2_BASE + random() * RidgeService.FREQ2_SPAN) * Math.PI / width;
    const phase2 = random() * RidgeService.FULL_TURN;
    const freq3 = (RidgeService.FREQ3_BASE + random() * RidgeService.FREQ3_SPAN) * Math.PI / width;
    const phase3 = random() * RidgeService.FULL_TURN;
    const points: Point[] = [];
    for (let sample = 0; sample <= RidgeService.SAMPLE_COUNT; sample++) {
      const posX = (sample / RidgeService.SAMPLE_COUNT) * width;
      const octave1 = Math.sin(freq1 * posX + phase1) * RidgeService.OCTAVE1_WEIGHT;
      const octave2 = Math.sin(freq2 * posX + phase2) * RidgeService.OCTAVE2_WEIGHT;
      const octave3 = Math.sin(freq3 * posX + phase3) * RidgeService.OCTAVE3_WEIGHT;
      const wave = octave1 + octave2 + octave3;
      const posY = horizonY - baseElevation + amplitude * wave;
      points.push({ x: posX, y: posY });
    }
    const path = RidgeService.buildPath(points, width, bottomY);
    const mixWeight = RidgeService.MAX_MIX_FACTOR * (1 - (index + 0.5) / (count + 0.5));
    const color = ColorUtil.mix(groundColor, airColor, mixWeight);
    return `<path d="${path}" fill="${color}"/>`;
  }

  private static buildPath(points: Point[], width: number, bottomY: number): string {
    const first = points[0];
    if (!first) {
      return "";
    }
    let commands = `M 0 ${first.y.toFixed(1)}`;
    for (let index = 1; index < points.length; index++) {
      const prev = points[index - 1];
      const curr = points[index];
      if (prev && curr) {
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        commands += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
      }
    }
    const last = points[points.length - 1];
    if (last) {
      commands += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    }
    commands += ` L ${width.toFixed(1)} ${bottomY.toFixed(1)} L 0 ${bottomY.toFixed(1)} Z`;
    return commands;
  }
}
