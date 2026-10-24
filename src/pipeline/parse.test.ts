import { describe, expect, it } from "vitest";
import { parseScene, SceneError } from "./parse.ts";

function errorsOf(input: unknown): string[] {
  try {
    parseScene(input);
  } catch (error) {
    return (error as SceneError).errors;
  }
  return [];
}

describe("parse.parseScene()", () => {
  it("reads a scene from YAML text", () => {
    const { scene, warnings } = parseScene("canvas:\n  width: 800\nobjects:\n  tree:\n    at: left\n");

    expect([scene, warnings]).toStrictEqual([{ canvas: { width: 800 }, objects: { tree: { at: "left" } } }, []]);
  });

  it("reads a scene that is already an object", () => {
    expect(parseScene({ canvas: { theme: "night" } }).scene).toStrictEqual({ canvas: { theme: "night" } });
  });

  it("reports broken YAML with the position", () => {
    expect(errorsOf("canvas: [")).toStrictEqual([
      "YAML inválido: unexpected end of the stream within a flow collection (1:10)\n\n 1 | canvas: [\n--------------^",
    ]);
  });

  it("reports a scene that is not an object", () => {
    expect(errorsOf("hello")).toStrictEqual(["(cena): Entrada inválida: esperava um objeto, recebeu um texto"]);
  });

  it("suggests the right name for a misspelled option", () => {
    expect(errorsOf({ canvas: { mode: "mapp" } })).toStrictEqual([
      "canvas.mode: Opção inválida: esperava uma das seguintes opções: \"classic\"|\"2.5d\"|\"board\"|\"map\"; você quis dizer 'map'?",
    ]);
  });

  it("suggests a slot name for a misspelled position", () => {
    expect(errorsOf({ objects: { tree: { at: "centre" } } })).toStrictEqual([
      "objects.tree.at: use um nome de posição (far-left, left, center-left, center, center-right, right, far-right), "
      + "um número de 0 a 1 ou [x, z] no modo 2.5d; você quis dizer 'center'?",
    ]);
  });

  it("lists the accepted sizes when none is close", () => {
    expect(errorsOf({ objects: { tree: { size: "gigante" } } })).toStrictEqual([
      "objects.tree.size: Entrada inválida; valores aceitos: tiny, small, medium, large, huge",
    ]);
  });

  it("refuses a frame larger than 4096 px", () => {
    expect(errorsOf({ canvas: { width: 5000 } })).toStrictEqual([
      "canvas.width: Demasiado grande: esperava que o número fosse <= 4096",
    ]);
  });

  it("refuses more than 200 objects and says the limit", () => {
    const objects = Object.fromEntries(Array.from({ length: 201 }, (_, index) => [`o${index}`, { asset: "tree" }]));

    expect(errorsOf({ objects })).toStrictEqual(["objects: 201 objetos; o limite é 200"]);
  });

  it("warns about an unknown field and suggests the close name, without refusing the scene", () => {
    const { warnings } = parseScene({ objects: { tree: { asset: "tree", siz: "small" } } });

    expect(warnings).toStrictEqual(["campo 'siz' desconhecido em objects.tree; você quis dizer 'size'?"]);
  });

  it("warns that an unknown field with no close name will be ignored", () => {
    const { warnings } = parseScene({ canvas: { zzzzzzzz: 1 } });

    expect(warnings).toStrictEqual(["campo 'zzzzzzzz' desconhecido em canvas; ele será ignorado"]);
  });
});
