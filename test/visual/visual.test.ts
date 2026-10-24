import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { type CaseResult, compareCase, listCases, REPORT_DIR, updateBaseline } from "./runner.ts";

const shouldUpdate = process.env.SCENEC_UPDATE_BASELINES === "1";
const cases = listCases();
const results: CaseResult[] = [];

const noop = (): void => undefined;

function rowOf(result: CaseResult): string {
  const { set, id } = result.ref;
  const images = result.diffPercent === null
    ? ""
    : ["before", "after", "diff"].map((name) => `<img src="${set}/${id}/${name}.png" width="260" alt="${name}">`).join(" ");
  const percent = result.diffPercent === null ? "identical SVG" : `${result.diffPercent.toFixed(4)}% pixels`;
  return `<section><h3>${set}/${id}</h3><p>${percent}: ${result.failures.join("; ")}</p>${images}</section>`;
}

describe("visual regression", () => {
  if (shouldUpdate) {
    fs.rmSync(REPORT_DIR, { recursive: true, force: true });
  }

  afterAll(() => {
    const failed = results.filter((result) => result.failures.length > 0);
    if (failed.length === 0) {
      return;
    }
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const body = failed.map((result) => rowOf(result)).join("\n");
    const html = `<!doctype html><meta charset="utf-8"><title>scenec visual report</title><h1>${failed.length} case(s) changed</h1>${body}`;
    fs.writeFileSync(path.join(REPORT_DIR, "index.html"), html);
  });

  it.each(cases)("$set/$id matches its baseline", (ref) => {
    const refresh = shouldUpdate ? updateBaseline : noop;
    refresh(ref);
    const result = compareCase(ref);
    results.push(result);
    expect(result.failures).toStrictEqual([]);
  });
});
