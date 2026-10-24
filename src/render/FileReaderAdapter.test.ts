import { FileReaderAdapter } from "@/render/FileReaderAdapter.ts";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
let root = "";

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "scenec-files-"));
  fs.mkdirSync(path.join(root, "scene", "custom"), { recursive: true });
  fs.writeFileSync(path.join(root, "scene", "custom", "a.svg"), "<svg/>");
  fs.writeFileSync(path.join(root, "secret.txt"), "secret");
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("FileReaderAdapter.createFileReader()", () => {
  it("reads text and bytes inside the scene folder", () => {
    const reader = FileReaderAdapter.createFileReader(path.join(root, "scene"));

    expect([reader.readText("custom/a.svg"), reader.readBytes("custom/a.svg")]).toStrictEqual([
      "<svg/>",
      new Uint8Array([60, 115, 118, 103, 47, 62]),
    ]);
  });

  it("refuses a path that climbs out of the scene folder", () => {
    const reader = FileReaderAdapter.createFileReader(path.join(root, "scene"));

    expect(() => reader.readText("../secret.txt")).toThrow("path '../secret.txt' is outside the scene folder; use a relative path inside it");
  });

  it("refuses an absolute path", () => {
    const reader = FileReaderAdapter.createFileReader(path.join(root, "scene"));
    const absolute = path.join(root, "secret.txt");

    expect(() => reader.readText(absolute)).toThrow(`path '${absolute}' is outside the scene folder; use a relative path inside it`);
  });

  it("reports a missing file with the ENOENT code", () => {
    const reader = FileReaderAdapter.createFileReader(path.join(root, "scene"));

    expect(() => reader.readText("custom/missing.svg")).toThrow(expect.objectContaining({ code: "ENOENT" }));
  });
});
