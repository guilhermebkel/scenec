import * as yaml from "js-yaml";
import { SceneError } from "@/Errors/SceneError.ts";
import { CheckModule } from "@/Modules/CheckModule.ts";
import type { CheckResult } from "@/Modules/CheckModule.ts";
import { ParsingModule } from "@/Modules/ParsingModule.ts";
import type { CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import { RIDGES_MAX, type HarmonyName } from "@/Protocols/SceneProtocol.ts";

export interface BestWinner {
  variant: number;
  score: number;
  parameters: Record<string, unknown>;
}

export interface BestResult extends CheckResult {
  winner: BestWinner;
  updatedSceneYaml: string;
}

export interface BestOptions extends CompileOptions {
  count?: number;
}

interface VariantCandidate {
  variantIndex: number;
  scene: Record<string, unknown>;
  parameters: Record<string, unknown>;
}

interface FreeFlags {
  isSeedFree: boolean;
  isLightFree: boolean;
  isFrameFree: boolean;
  isCloudsFree: boolean;
  isRidgeFree: boolean;
  isHarmonyFree: boolean;
}

export class BestModule {
  private static readonly DEFAULT_COUNT = 8;

  private static readonly BASE_SCORE = 100;

  private static readonly WARNING_PENALTY = 40;

  private static readonly CRITIQUE_PENALTY = 15;

  private static readonly OVERLAP_PENALTY = 25;

  private static readonly BLEND_PENALTY = 20;

  private static readonly LEAN_PENALTY = 15;

  private static readonly EMPTY_PENALTY = 25;

  private static readonly BALANCE_BONUS_WEIGHT = 5;

  private static readonly TARGET_CENTER = 0.5;

  private static readonly SCORE_DECIMALS = 1;

  private static readonly RIDGE_COUNT_OPTIONS = [1, 2, RIDGES_MAX] as const;

  private static readonly CLOUD_OPTIONS = ["few", "many"] as const;

  private static readonly LIGHT_DIRECTIONS = ["left", "right"] as const;

  private static readonly FRAME_POSITIONS = ["center", "left", "right"] as const;

  private static readonly HARMONIES: readonly HarmonyName[] = ["analogous", "split", "triad", "complementary"];

  private static readonly CRITIQUE_PENALTIES: readonly [string, number][] = [
    ["overlaps", BestModule.OVERLAP_PENALTY],
    ["barely touching", BestModule.OVERLAP_PENALTY],
    ["blends into the background", BestModule.BLEND_PENALTY],
    ["visual weight leans", BestModule.LEAN_PENALTY],
    ["empty scene", BestModule.EMPTY_PENALTY],
    ["empty band", BestModule.EMPTY_PENALTY],
  ];

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private static detectFree(rawCanvas: Record<string, unknown>): FreeFlags {
    const isSeedFree = rawCanvas.seed === undefined;
    const isLightFree = rawCanvas.light !== false
      && (rawCanvas.light === undefined
        || (BestModule.isRecord(rawCanvas.light) && rawCanvas.light.from === undefined));
    const isFrameFree = rawCanvas.frame === undefined;
    const isCloudsFree = rawCanvas.clouds === undefined;
    const isRidgeFree = rawCanvas.ridges === undefined
      && (rawCanvas.setting === "outdoor" || rawCanvas.setting === undefined);
    const isHarmonyFree = BestModule.isRecord(rawCanvas.theme) && rawCanvas.theme.harmony === undefined;
    return { isSeedFree, isLightFree, isFrameFree, isCloudsFree, isRidgeFree, isHarmonyFree };
  }

  private static buildParameters(
    rawCanvas: Record<string, unknown>,
    flags: FreeFlags,
    index: number,
  ): Record<string, unknown> {
    const parameters: Record<string, unknown> = {};
    if (flags.isSeedFree) {
      parameters.seed = index + 1;
    }
    if (flags.isLightFree) {
      const baseLight = BestModule.isRecord(rawCanvas.light) ? rawCanvas.light : {};
      const direction = BestModule.LIGHT_DIRECTIONS[index % BestModule.LIGHT_DIRECTIONS.length];
      parameters.light = { ...baseLight, from: direction };
    }
    if (flags.isFrameFree) {
      parameters.frame = BestModule.FRAME_POSITIONS[index % BestModule.FRAME_POSITIONS.length];
    }
    if (flags.isCloudsFree) {
      parameters.clouds = BestModule.CLOUD_OPTIONS[index % BestModule.CLOUD_OPTIONS.length];
    }
    if (flags.isRidgeFree) {
      parameters.ridges = BestModule.RIDGE_COUNT_OPTIONS[index % BestModule.RIDGE_COUNT_OPTIONS.length];
    }
    if (flags.isHarmonyFree && BestModule.isRecord(rawCanvas.theme)) {
      const harmony = BestModule.HARMONIES[index % BestModule.HARMONIES.length];
      parameters.theme = { ...rawCanvas.theme, harmony };
    }
    return parameters;
  }

  private static generateCandidates(raw: Record<string, unknown>, count: number): VariantCandidate[] {
    const rawCanvas = BestModule.isRecord(raw.canvas) ? raw.canvas : {};
    const flags = BestModule.detectFree(rawCanvas);
    const candidates: VariantCandidate[] = [];
    for (let variantIndex = 0; variantIndex < count; variantIndex++) {
      const parameters = BestModule.buildParameters(rawCanvas, flags, variantIndex);
      const scene = {
        ...raw,
        canvas: {
          ...rawCanvas,
          ...parameters,
        },
      };
      candidates.push({ variantIndex, scene, parameters });
    }
    return candidates;
  }

  private static critiquePenalty(message: string): number {
    const match = BestModule.CRITIQUE_PENALTIES.find(([keyword]) => message.includes(keyword));
    return match ? match[1] : BestModule.CRITIQUE_PENALTY;
  }

  private static layoutBalanceBonus(result: CheckResult): number {
    const layout = result.layout ?? [];
    if (layout.length === 0) {
      return 0;
    }
    let totalWeight = 0;
    let weightedX = 0;
    for (const item of layout) {
      const weight = item.w * item.h;
      totalWeight += weight;
      weightedX += weight * item.x;
    }
    if (totalWeight <= 0) {
      return 0;
    }
    const centerOfMass = weightedX / totalWeight;
    const offsetFromCenter = Math.abs(centerOfMass - BestModule.TARGET_CENTER);
    return Math.max(0, BestModule.BALANCE_BONUS_WEIGHT * (1 - offsetFromCenter * 2));
  }

  private static score(checkResult: CheckResult): number {
    let penalty = checkResult.warnings.length * BestModule.WARNING_PENALTY;
    for (const artMessage of checkResult.art) {
      penalty += BestModule.critiquePenalty(artMessage);
    }
    const bonus = BestModule.layoutBalanceBonus(checkResult);
    const rawScore = BestModule.BASE_SCORE - penalty + bonus;
    return Number(Math.max(0, rawScore).toFixed(BestModule.SCORE_DECIMALS));
  }

  static best(input: unknown, options: BestOptions = {}): BestResult {
    let raw: unknown = input;
    if (typeof input === "string") {
      try {
        raw = yaml.load(input);
      } catch (error) {
        throw new SceneError([`invalid YAML: ${error instanceof Error ? error.message : String(error)}`]);
      }
    }
    if (!BestModule.isRecord(raw)) {
      throw new SceneError(["scene must be a YAML mapping"]);
    }
    // Why: validate through ParsingModule to catch scene schema errors upfront.
    ParsingModule.parseScene(raw);
    const count = options.count && options.count > 0 ? options.count : BestModule.DEFAULT_COUNT;
    const candidates = BestModule.generateCandidates(raw, count);

    let bestScore = -1;
    let winningCandidate = candidates[0] ?? { variantIndex: 0, scene: raw, parameters: {} };
    let winningResult: CheckResult | undefined;

    for (const candidate of candidates) {
      const checkResult = CheckModule.check(candidate.scene, options);
      const score = BestModule.score(checkResult);
      if (score > bestScore) {
        bestScore = score;
        winningCandidate = candidate;
        winningResult = checkResult;
      }
    }

    const winnerResult = winningResult ?? CheckModule.check(winningCandidate.scene, options);
    const updatedSceneYaml = yaml.dump(winningCandidate.scene, { indent: 2, lineWidth: -1, noRefs: true });

    return {
      ...winnerResult,
      winner: {
        variant: winningCandidate.variantIndex,
        score: bestScore,
        parameters: winningCandidate.parameters,
      },
      updatedSceneYaml,
    };
  }
}
