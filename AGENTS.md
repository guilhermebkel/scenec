# scenec

An AI writes a YAML scene; the compiler returns an SVG plus warnings, art-director critiques and a text description, so an AI that cannot see images can still illustrate. CPU only, no ML models.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/protocols/` | Zod scene schema, option types, theme type. Imports nothing from the project. |
| `src/utils/` | Pure helpers: color, svg, suggest, recolor, sanitize. |
| `src/drawing/` | Themes, people, the 86 assets and the kits. |
| `src/modes/` | The two layouts: `plane` (2.5D) and `map`. |
| `src/pipeline/` | Parse, groups, custom assets, compile, catalog and schema services. |
| `src/render/` | Needs the native renderer: critic, `check`, PNG, fonts, sandboxed file reader. |
| `src/index.ts`, `src/render.ts`, `src/schema.ts` | The three public entries: thin facades over the classes. |
| `src/cli.ts` | `scenec render|check|catalog|schema`. |
| `fonts/` | Poppins (OFL-1.1). |
| `skills/scenec/` | The agent skill shipped in the package. |
| `test/visual/` | 108 base generations with baselines. |
| `test/smoke/` | Every asset in every kit. |

Layers: protocols < utils < drawing < modes < pipeline < render < cli. A layer imports only the ones below it (lint enforces it). Files are classes in `PascalCase` (`ColorUtil.ts`), imported with `@/` (`@/utils/ColorUtil.ts`).

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
- The core (`protocols` to `pipeline`) is pure: no clock, randomness, file system or process. Files come through the `FileReader` option and measurements through `measure`.
- A change that moves any baseline is deliberate: run `pnpm test:visual --update`, look at `test/visual/report/`, and say in the PR why each case changed.
- Anything that goes into an SVG from outside passes `sanitizeSvg`. Never loosen its allowlist without a test for the new element.
- When the DSL changes, regenerate the skill references (`pnpm skill:refs`) in the same PR.
- No comments by default. A comment starts with `Why:` and sits above the line whose hidden rule it explains.
- When behavior or vocabulary changes, update `GLOSSARY.md`, the docs or an ADR in the same PR.

## Legacy debt

Files ported from the JavaScript prototype keep relaxed lint rules, listed in `eslint.config.mjs` under `LEGACY_FILES`: `any`, naming, complexity and magic numbers. `noUncheckedIndexedAccess` is off. All of it is tracked in https://github.com/guilhermebkel/scenec/issues/1; clean one file at a time, remove it from the list, and keep the baselines identical. See ADR 0010.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `guilhermebkel/scenec`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

`GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
