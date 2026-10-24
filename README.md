# scenec

Write a short YAML scene; get an SVG (and PNG) plus text feedback. Built so an AI that cannot see images can still illustrate: the compiler reports warnings, art-director critiques and a text description of what it drew. CPU only, no image model.

```sh
npx scenec@1 check scene.yaml
npx scenec@1 render scene.yaml -o out --png
```

```yaml
canvas: { theme: warm-cafe, setting: indoor }
objects:
  mesa: { asset: table, at: 0.6 }
  ana:  { asset: person, pose: waving, at: 0.3 }
```

## Commands

- `scenec render <scene.yaml> [-o name] [--png] [--width 1200]`: writes the SVG (and PNG), prints a JSON report.
- `scenec check <scene.yaml>`: compiles and critiques; exit code 1 when there is a warning or critique.
- `scenec catalog [assets|groups|kits|themes|poses|layout]`: the vocabulary.
- `scenec schema`: JSON Schema of the scene.

## Library

```ts
import { compile } from "scenec";            // pure: no native code, no file system
import { check, renderPng } from "scenec/render";
import { sceneJsonSchema, catalog } from "scenec/schema";
```

## Agent skill

```sh
npx skills add guilhermebkel/scenec
```

The skill in `skills/scenec/` teaches an agent to pick a recipe, check, fix and render.

## Development

See `AGENTS.md`. `pnpm check` runs everything CI runs.

## License

MIT. Runtime dependencies: zod (MIT), js-yaml (MIT), @resvg/resvg-js (MPL-2.0, unmodified). Poppins font: OFL-1.1. Map data: Natural Earth (public domain).
