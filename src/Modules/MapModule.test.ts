import { describe, expect, it } from "vitest";
import { MapModule } from "@/Modules/MapModule.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import { ThemeService } from "@/Services/ThemeService.ts";

const THEME = ThemeService.THEME_ID_TO_THEME["flat-cool"];

function compile(scene: Scene): { svg: string; warnings: string[]; description: string } {
  const warnings: string[] = [];
  const result = MapModule.compileMap(scene, { theme: THEME, warnings, width: 1400, height: 900 });
  return { svg: result.svg, warnings: result.warnings, description: result.description };
}

const PARIS_ROME: Scene = {
  canvas: { mode: "map" },
  route: [{ city: "Paris", country: "França" }, { by: "avião" }, { city: "Roma", country: "Itália" }],
};

describe("MapModule.compileMap()", () => {
  it("describes each stop, each leg and the highlighted countries", () => {
    const { description } = compile(PARIS_ROME);

    expect(description.split("\n").slice(2)).toStrictEqual([
      "Paris → Roma: plane",
      "highlighted countries: França, Itália",
    ]);
  });

  it("places the first stop to the left of the second when it lies to the west", () => {
    const [first = "", second = ""] = compile(PARIS_ROME).description.split("\n");
    const column = (line: string): number => Number(/screen \((\d+)%/.exec(line)?.[1]);

    expect(column(first)).toBeLessThan(column(second));
  });

  it("accepts a city that is not in the dictionary when it has coordinates", () => {
    const scene: Scene = { canvas: { mode: "map" }, route: [{ city: "Paris" }, { by: "trem" }, { city: "Lugar", at: [10, 50] }] };

    const { warnings, description } = compile(scene);

    expect(warnings).toStrictEqual([]);
    expect(description).toContain("2. Lugar");
  });

  it("warns about a city that is not in the dictionary and has no coordinates", () => {
    const scene: Scene = { canvas: { mode: "map" }, route: [{ city: "Paris" }, { city: "Atlantida" }] };

    expect(compile(scene).warnings).toContain("city 'Atlantida' is not in the dictionary; set 'at: [lon, lat]'");
  });

  it("asks for at least two cities", () => {
    const scene: Scene = { canvas: { mode: "map" }, route: [{ city: "Paris" }] };

    expect(compile(scene).warnings).toContain("the route needs at least 2 cities");
  });

  it("uses a car and says so when a leg has no transport", () => {
    const scene: Scene = { canvas: { mode: "map" }, route: [{ city: "Paris" }, { city: "Lyon" }] };

    const { warnings, description } = compile(scene);

    expect(warnings).toContain("leg to 'Lyon' has no transport; used car (add '- {by: ...}')");
    expect(description).toContain("Paris → Lyon: car");
  });

  it("warns about an unknown transport and draws the leg as a car", () => {
    const scene: Scene = { canvas: { mode: "map" }, route: [{ city: "Paris" }, { by: "foguete" }, { city: "Lyon" }] };

    const { warnings, description } = compile(scene);

    expect(warnings).toStrictEqual(["transport 'foguete' is unknown (use plane, train, car, bus or boat)"]);
    expect(description).toContain("Paris → Lyon: car");
  });

  it("warns about a country that is not on the map", () => {
    const scene: Scene = { canvas: { mode: "map" }, route: [{ city: "Paris", country: "Narnia" }, { by: "trem" }, { city: "Lyon" }] };

    expect(compile(scene).warnings).toContain("country 'Narnia' not found on the map");
  });

  it("highlights extra countries named in the map options", () => {
    const scene: Scene = { ...PARIS_ROME, map: { highlight: ["Espanha"] } };

    expect(compile(scene).description).toContain("highlighted countries: França, Itália, Espanha");
  });

  it("shows the route panel with the title of the scene, and hides it on request", () => {
    const withPanel = compile({ ...PARIS_ROME, text: [{ content: "Minha viagem", role: "title" }] });
    const withoutPanel = compile({ ...PARIS_ROME, map: { panel: false }, text: [{ content: "Minha viagem", role: "title" }] });

    expect([withPanel.svg.includes("Minha viagem"), withoutPanel.svg.includes("Minha viagem")]).toStrictEqual([true, false]);
  });

  it("escapes the text it draws", () => {
    const scene: Scene = { ...PARIS_ROME, text: [{ content: "A & B <C>", role: "title" }] };

    expect(compile(scene).svg).toContain("A &amp; B &lt;C>");
  });

  it("numbers repeated visits to the same city with separate pins", () => {
    const scene: Scene = {
      canvas: { mode: "map" },
      route: [{ city: "Paris" }, { by: "trem" }, { city: "Lyon" }, { by: "trem" }, { city: "Paris" }],
    };

    const { svg } = compile(scene);

    expect(svg.match(/text-anchor="middle">[123]<\/text>/g)).toHaveLength(6);
  });
});
