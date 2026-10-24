import { describe, expect, it } from "vitest";
import { CatalogService } from "@/pipeline/CatalogService.ts";

describe("CatalogService.catalog()", () => {
  it("lists the kits with their description", () => {
    expect(CatalogService.catalog("kits")).toStrictEqual([
      { id: "flat", description: "vetor chapado com luz suave (padrão)" },
      { id: "outline", description: "contorno de desenho animado: borda grossa na silhueta e traço fino por dentro" },
      { id: "hatch", description: "gravura/HQ: contorno a nanquim, sombras em hachura em vez de gradiente, papel claro" },
      { id: "riso", description: "risografia: poucas tintas vivas, granulado de impressão e registro levemente desalinhado" },
      { id: "paper", description: "recorte de papel: cada peça com sombra própria e textura de fibra" },
      { id: "sketch", description: "esboço: cores lavadas como aquarela e linhas de lápis nas bordas" },
    ]);
  });

  it("lists the themes", () => {
    expect(CatalogService.catalog("themes")).toStrictEqual(["flat-autumn", "flat-cool", "night", "warm-cafe", "beach"]);
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
