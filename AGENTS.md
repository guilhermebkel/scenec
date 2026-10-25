# scenec

An AI writes a YAML scene; the compiler returns an SVG plus warnings, art-director critiques and a text description, so an AI that cannot see images can still illustrate. CPU only, no ML models.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/Errors/` | `SceneError`, `UnsafeSvgError`: one `<Name>Error.ts` per error. |
| `src/Protocols/` | Zod scene schema and the option, result, theme and command types. |
| `src/Utils/` | Pure helpers: color, svg, shapes, suggest, recolor, sanitize, person drawing. |
| `src/Resources/` | `Assets/` (86), `Kits/`, `Themes/`, `Groups/`: one class per file, each extending a `Base` class that fixes its shape. |
| `src/Services/` | Registries and lookups: `AssetService`, `KitService`, `ThemeService`, `GroupService`, `CustomAssetService`, `CatalogService`, `SchemaService`. |
| `src/Modules/` | The files that need the most attention: `CompilationModule`, `ParsingModule`, `PlaneModule` (2.5D), `MapModule`, `CritiqueModule`, `CheckModule`. |
| `src/Adapters/` | The outside world: resvg, fonts, the sandboxed file reader. |
| `src/Data/` | Static data (the Europe map outlines). |
| `src/Commands/` | One class per CLI command, all extending `BaseCommand`. |
| `src/index.ts`, `src/render.ts`, `src/schema.ts` | The three public entries: thin facades over the classes. |
| `src/cli.ts` | The CLI entry: parses the arguments and runs a command from `src/Commands/`. |
| `fonts/` | Poppins (OFL-1.1). |
| `skills/draw-scene/` | The agent skill shipped in the package. |
| `test/visual/` | 108 base generations with baselines. |
| `test/smoke/` | Every asset in every kit. |

Layers: Errors and Protocols < Utils < Resources < Services < Modules < Commands. A layer imports only the ones below it (lint enforces it); Adapters see only Protocols and Utils, and only the critique and check modules may use them. Files are classes in `PascalCase` (`ColorUtil.ts`) in `PascalCase` folders, imported with `@/` (`@/Utils/ColorUtil.ts`).

## Commands

```
pnpm typecheck       # tsc --noEmit (TypeScript 7)
pnpm lint            # eslint (typescript-eslint runs on the TypeScript 6 alias)
pnpm quality         # knip + jscpd + dpdm
pnpm test            # unit, smoke and package tests
pnpm build           # esbuild per file, tsc for declarations, then @/ rewritten to relative paths
pnpm test:visual     # the 108 baselines; add --update to rewrite them
pnpm check           # everything above; what CI runs
pnpm check:pack      # package size and contents
pnpm check:licenses  # runtime dependency licenses
```

## Rules

- One commit per task, after `pnpm check` is clean. Never raise a limit or silence a rule to pass.
- Work on a branch from `main` and open a pull request.
- Code, docs and commit messages are in English. Runtime messages for the scene author are in English too.
- The core (`Errors` to `Modules`, except the critique and check modules) is pure: no clock, randomness, file system or process. Files come through the `FileReader` option and measurements through `measure`.
- A change that moves any baseline is deliberate: run `pnpm test:visual --update`, look at `test/visual/report/`, and say in the PR why each case changed.
- Anything that goes into an SVG from outside passes `sanitizeSvg`. Never loosen its allowlist without a test for the new element.
- When the DSL changes, regenerate the skill references (`pnpm skill:refs`) in the same PR.
- The README quotes counts (assets, kits, recipes, baselines). When one of them changes, update `README.md` in the same PR.
- No comments by default. A comment starts with `Why:` and sits above the line whose hidden rule it explains.
- When behavior or vocabulary changes, update `GLOSSARY.md`, the docs or an ADR in the same PR.
- Every rule in `docs/code-standards.md` is enforced on all of `src`; there is no relaxed-rules list.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `guilhermebkel/scenec`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

`GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
