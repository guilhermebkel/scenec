import { describe, expect, it } from "vitest";
import { CatalogService } from "@/Services/CatalogService.ts";

describe("CatalogService.catalog()", () => {
  it("lists the kits with their description", () => {
    expect(CatalogService.catalog("kits")).toStrictEqual([
      { id: "flat", description: "flat vector with soft light (default)" },
      { id: "outline", description: "cartoon outline: thick border on the silhouette and a thin line inside" },
      { id: "hatch", description: "engraving/comics: ink outline, hatched shadows instead of gradients, light paper" },
      { id: "riso", description: "risograph: few vivid inks, print grain and slightly misaligned registration" },
      { id: "paper", description: "paper cut-out: each piece with its own shadow and fiber texture" },
      { id: "sketch", description: "sketch: watercolor-washed colors and pencil lines on the edges" },
    ]);
  });

  it("lists the themes with presets, harmonies and moods", () => {
    expect(CatalogService.catalog("themes")).toStrictEqual({
      presets: ["flat-autumn", "flat-cool", "night", "warm-cafe", "beach"],
      harmonies: ["analogous", "complementary", "split", "triad", "mono"],
      moods: ["day", "dusk", "night"],
    });
  });

  it("lists standing and seated poses and the expressions", () => {
    expect(CatalogService.catalog("poses")).toStrictEqual({
      standing: ["standing", "waving", "pointing", "presenting", "celebrating", "holding", "hands_on_hips", "thinking", "shrugging", "walking", "phone"],
      seated: ["sitting", "typing", "reading", "drinking"],
      expressions: ["happy", "neutral", "surprised", "sad", "worried", "angry", "laughing", "wink", "thinking"],
    });
  });
});

describe("CatalogService.listAssets()", () => {
  it("gives the person asset with its box and synonyms", () => {
    const person = CatalogService.listAssets().find((asset) => asset.id === "person");

    expect(person).toStrictEqual({
      id: "person", kind: "ground", width: 40, height: 108, synonyms: ["pessoa", "human", "character", "man", "woman", "personagem"],
    });
  });
});

describe("CatalogService.listGroups()", () => {
  it("names the parts of the workspace group and the asset of each", () => {
    const workspace = CatalogService.listGroups().find((group) => group.id === "workspace");

    expect(workspace?.parts).toStrictEqual({
      mesa: "desk", cadeira: "chair", pessoa: "person", tela: "laptop", luminaria: "lamp", caneca: "cup", planta: "big_plant",
    });
  });
});
