import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { check } from "../../src/render/check.ts";
import { createFileReader } from "../../src/render/files.ts";
import { renderPng } from "../../src/render/png.ts";

export const CASES_DIR = fileURLToPath(new URL("cases", import.meta.url));
export const REPORT_DIR = fileURLToPath(new URL("report", import.meta.url));
const COMPARE_WIDTH = 800;
const DEFAULT_MAX_DIFF_PERCENT = 0.005;
const PERCENT = 100;

export interface CaseRef {
  set: string;
  id: string;
  dir: string;
}

export interface CaseConfig {
  maxDiffPercent?: number;
}

export interface CaseResult {
  ref: CaseRef;
  failures: string[];
  isIdentical: boolean;
  diffPercent: number | null;
  svg: string;
  baselineSvg: string;
}

export function listCases(): CaseRef[] {
  const refs: CaseRef[] = [];
  for (const set of fs.readdirSync(CASES_DIR).sort()) {
    for (const id of fs.readdirSync(path.join(CASES_DIR, set)).sort()) {
      refs.push({ set, id, dir: path.join(CASES_DIR, set, id) });
    }
  }
  return refs;
}

export function runCase(ref: CaseRef): { svg: string; record: string } {
  const scene: unknown = yaml.load(fs.readFileSync(path.join(ref.dir, "scene.yaml"), "utf8"));
  const result = check(scene, { files: createFileReader(ref.dir) });
  const record = JSON.stringify({ layout: result.layout, warnings: result.warnings, art: result.art }, null, 2) + "\n";
  return { svg: result.svg, record };
}

function readConfig(ref: CaseRef): CaseConfig {
  const file = path.join(ref.dir, "case.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) as CaseConfig : {};
}

export function updateBaseline(ref: CaseRef): void {
  const { svg, record } = runCase(ref);
  fs.writeFileSync(path.join(ref.dir, "baseline.svg"), svg);
  fs.writeFileSync(path.join(ref.dir, "baseline.layout.json"), record);
}

function diffPixels(baselineSvg: string, svg: string, ref: CaseRef): number {
  const before = renderPng(baselineSvg, COMPARE_WIDTH);
  const after = renderPng(svg, COMPARE_WIDTH);
  if (before.width !== after.width || before.height !== after.height) {
    return PERCENT;
  }
  const mask = new PNG({ width: before.width, height: before.height });
  const wrong = pixelmatch(before.pixels, after.pixels, mask.data, before.width, before.height, { threshold: 0.1 });
  const percent = (wrong / (before.width * before.height)) * PERCENT;
  if (wrong > 0) {
    const out = path.join(REPORT_DIR, ref.set, ref.id);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "before.png"), before.png);
    fs.writeFileSync(path.join(out, "after.png"), after.png);
    fs.writeFileSync(path.join(out, "diff.png"), PNG.sync.write(mask));
  }
  return percent;
}

export function compareCase(ref: CaseRef): CaseResult {
  const { svg, record } = runCase(ref);
  const baselineSvg = fs.readFileSync(path.join(ref.dir, "baseline.svg"), "utf8");
  const baselineRecord = fs.readFileSync(path.join(ref.dir, "baseline.layout.json"), "utf8");
  const failures: string[] = [];
  const isIdentical = svg === baselineSvg;
  if (record !== baselineRecord) {
    failures.push("layout, warnings or critiques changed (gate 2)");
  }
  let diffPercent: number | null = null;
  if (!isIdentical) {
    diffPercent = diffPixels(baselineSvg, svg, ref);
    const limit = readConfig(ref).maxDiffPercent ?? DEFAULT_MAX_DIFF_PERCENT;
    if (diffPercent > limit) {
      failures.push(`${diffPercent.toFixed(4)}% of the pixels changed, limit ${limit}% (gate 3)`);
    }
  }
  return { ref, failures, isIdentical, diffPercent, svg, baselineSvg };
}
