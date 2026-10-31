import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BestCommand } from "@/Commands/BestCommand.ts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("BestCommand.run()", () => {
  let tempDir: string;
  let capturedOutput: string;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "scenec-best-test-"));
    capturedOutput = "";
    process.stdout.write = (chunk: string | Uint8Array) => {
      capturedOutput += chunk.toString();
      return true;
    };
    process.stderr.write = () => true;
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns EXIT_INVALID when positionals is empty", () => {
    const command = new BestCommand();
    const code = command.run({
      positionals: [],
      output: undefined,
      shouldWritePng: false,
      width: 1200,
      count: 2,
    });

    expect(code).toBe(2);
  });

  it("returns EXIT_INVALID and prints errors when scene is invalid", () => {
    const invalidFile = path.join(tempDir, "invalid.yaml");
    fs.writeFileSync(invalidFile, "not: valid: [yaml");

    const command = new BestCommand();
    const code = command.run({
      positionals: [invalidFile],
      output: undefined,
      shouldWritePng: false,
      width: 1200,
      count: 2,
    });

    expect(code).toBe(2);
    expect(capturedOutput.length).toBeGreaterThan(0);
    const output = JSON.parse(capturedOutput) as { errors: string[] };
    expect(output.errors.length).toBeGreaterThan(0);
  });

  it("renders the best variant, writes SVG, updates scene file and returns EXIT_OK on clean scene", () => {
    const sceneFile = path.join(tempDir, "scene.yaml");
    const outBase = path.join(tempDir, "out-scene");
    const initialYaml = `canvas:
  width: 1000
  height: 500
  setting: outdoor
objects:
  a:
    asset: tree
    at: left
  b:
    asset: tree
    at: right
`;
    fs.writeFileSync(sceneFile, initialYaml);

    const command = new BestCommand();
    const code = command.run({
      positionals: [sceneFile],
      output: outBase,
      shouldWritePng: false,
      width: 1200,
      count: 4,
    });

    expect(code).toBe(0);
    expect(fs.existsSync(`${outBase}.svg`)).toBe(true);

    const updatedYaml = fs.readFileSync(sceneFile, "utf8");
    expect(updatedYaml).toContain("seed:");

    const output = JSON.parse(capturedOutput) as {
      winner: { variant: number; score: number };
      written: Record<string, unknown>;
    };
    expect(output.winner.variant).toBeGreaterThanOrEqual(0);
    expect(output.written.svg).toBe(`${outBase}.svg`);
    expect(output.written.scene).toBe(sceneFile);
  });

  it("writes PNG when shouldWritePng is enabled", () => {
    const sceneFile = path.join(tempDir, "scene.yaml");
    const outBase = path.join(tempDir, "out-png");
    const initialYaml = `canvas:
  width: 1000
  height: 500
objects:
  a:
    asset: tree
    at: left
`;
    fs.writeFileSync(sceneFile, initialYaml);

    const command = new BestCommand();
    const code = command.run({
      positionals: [sceneFile],
      output: outBase,
      shouldWritePng: true,
      width: 800,
      count: 2,
    });

    expect(code).toBeGreaterThanOrEqual(0);
    expect(fs.existsSync(`${outBase}.png`)).toBe(true);
  });
});
