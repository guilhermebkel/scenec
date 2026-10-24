# scenec

Illustrate with text. You (or your AI agent) write a short YAML scene; `scenec` compiles it to an SVG and tells you, in text, what is wrong with it. It was built for AIs that cannot see images: they can still draw, check and fix an illustration without looking at it. It runs on the CPU, with no image model.

```sh
npx scenec@1 check scene.yaml
npx scenec@1 render scene.yaml -o out --png
```

## What you get

For each scene, one JSON report plus the files:

- **SVG** (and a **PNG** with `--png`), with a bundled font, so it looks the same everywhere.
- **Warnings**: fields it did not understand (with a "did you mean"), objects out of frame, missing assets.
- **Critiques**: an art director's remarks in text — empty areas, overlaps, low contrast, a crowded corner.
- **Description**: where each object ended up (position, size, depth), so the AI can reason about the layout without seeing it.

`check` exits with code 1 when there is a warning or a critique, so an agent knows to fix and run it again.

## Install the skill

```sh
npx skills add guilhermebkel/scenec
```

The skill teaches an agent to pick one of 8 recipes (reel, carousel, "wrapped" card, e-learning, illustrated story, route map, ad variations, product), change the content, check, fix up to 5 times and render. It works in Claude Code, Codex and Cursor. It needs Node.js 20+.

## Commands

| Command | What it does |
| --- | --- |
| `scenec render <scene.yaml> [-o name] [--png] [--width 1200]` | Writes the SVG (and PNG) and prints the JSON report. |
| `scenec check <scene.yaml>` | Compiles and critiques without writing files. |
| `scenec catalog [assets\|groups\|kits\|themes\|poses\|layout]` | Lists the vocabulary a scene can use. |
| `scenec schema` | Prints the JSON Schema of the scene. |

## As a library

```ts
import { compile } from "scenec";                  // pure: no native code, no file system
import { check, renderPng } from "scenec/render";  // needs the native renderer
import { sceneJsonSchema, catalog } from "scenec/schema";
```

## What it draws

86 assets (people with poses and expressions, furniture, plants, food, vehicles, buildings), ready-made groups, a map of Europe with routes, and 6 kits (`flat`, `outline`, `hatch`, `riso`, `paper`, `sketch`). `scenec catalog` lists everything; the full language is in [`skills/scenec/references/dsl.md`](skills/scenec/references/dsl.md).

## Safe by design

- The core is pure: the same scene gives the same SVG on any machine. Files are read through a sandbox that refuses `..` and absolute paths.
- Custom SVG is allowlisted: scripts, `on*` handlers, external links, `<style>` and entities are removed or rejected.
- Scenes are limited to 200 objects and a 4096 px frame.

## Comparison

Image-generation models need a picture-capable model and are not repeatable. Hand-written SVG has no feedback loop, so an AI that cannot see it cannot tell if it is good. `scenec` trades open-ended style for a closed vocabulary that it can measure and critique.

## Contributing

Run `pnpm check`: typecheck, lint, dead code, duplication, import cycles, tests, build, package checks and the 108 visual baselines. Read [`AGENTS.md`](AGENTS.md) first; the standards are in [`docs/`](docs/) and the vocabulary in [`GLOSSARY.md`](GLOSSARY.md). Known debt is in [issue #1](https://github.com/guilhermebkel/scenec/issues/1).

## License

MIT. Runtime dependencies: zod (MIT), js-yaml (MIT), @resvg/resvg-js (MPL-2.0, unmodified). Poppins font: OFL-1.1. Map data: Natural Earth (public domain).
