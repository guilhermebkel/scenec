# Code standards

How code in this repository is written. `pnpm lint` enforces the rules marked **(lint)**; the rest are checked in review. When a rule and readability disagree, raise it in the PR instead of working around the rule.

**A rule that a tool can check is a tool, not a sentence.** When a rule here can be a lint rule, a type or a test, it becomes one (this repo's own rules live in `scripts/eslint-local-rules.mjs`); text is for what no tool can check. A written rule the agent keeps breaking is the sign it should move.

**Target state and debt.** This file describes where the code must be. The code ported from the JavaScript prototype is not there yet: rules marked **(pending)** are not enforced until the debt in [issue #1](https://github.com/guilhermebkel/scenec/issues/1) is paid, and `LEGACY_FILES` in `eslint.config.mjs` lists the files with relaxed rules. New code follows every rule here, enforced or not.

## Architecture

- **Layers (lint).** Inside `src/`, folders form layers and a layer imports only the ones below it: `Errors` and `Protocols` (types, Zod schemas, errors) < `Utils` < `Resources` < `Services` < `Modules` < `Commands`; `Adapters` see only `Protocols` and `Utils`. Tests may import any layer: nothing imports them. Import cycles fail `pnpm quality` (dpdm, `import type` ignored).
- **A pure core (lint).** `Errors` to `Modules` have no clock, randomness, file system or process: the same scene gives the same SVG on any machine (ADR 0004). Files come in through the `FileReader` option and measurements through `measure`; only the adapters, the critique and check modules and the commands touch the outside.
- **Native code behind `Adapters`.** Code that knows resvg lives in `src/Adapters/`. The core depends on the `measure` contract, never on the renderer.
- **Imports use `@/` and the real file name (lint).** `@/` points to `src/`. Every import is `@/Utils/ColorUtil.ts`: never `../` or `./`. One style means searching for a file's `@/` path finds every importer.
- **Names say the folder.** Files are `PascalCase` and end in their role: `ColorUtil`, `SanitizeUtil`, `CompilationModule`, `ResvgAdapter`. Folders are `PascalCase` layer names. Resources end in their kind (`HouseAsset`, `FlatKit`, `NightTheme`, `WorkspaceGroup`) and extend a `Base` class.
- **Classes, not loose functions (lint).** Utils are classes with static methods only. The three public entries (`src/index.ts`, `src/render.ts`, `src/schema.ts`) are the only files with loose functions: thin facades over the classes. Services are classes whose dependencies come in through the constructor. Runtime constants belong to the class that owns them as `static readonly` members.
- **One class per file, named after it (lint).** `max-classes-per-file`, `local/class-matches-file`.
- **Protocols hold only types and schemas.** No logic. A type used by one file stays in that file.
- **Three public entries.** `@guilhermebkel/scenec`, `@guilhermebkel/scenec/render` and `@guilhermebkel/scenec/schema`. Anything else is internal; a test snapshots the exports.

## Naming

- **Casing (lint).** Variables, functions and parameters are `camelCase`. Types, interfaces and classes are `PascalCase`. Module-level and `static readonly` constants are `UPPER_CASE`. Scene fields keep the spelling of the YAML language (`left_of`, `hair_color`).
- **Descriptive names (lint).** No single-letter identifiers, including loop indexes and callback parameters: `(asset) => …`, not `(a) => …`. A name says what the value is in this domain (`GLOSSARY.md`), never `data`, `item`, `value` or `obj` when something more specific exists.
- **Booleans (lint).** Start with `is`, `has`, `should`, `can`, `must`, `was` or `did`. Names are affirmative: `isOnGround`, never `isNotFloating`.
- **Maps and records (lint).** Every `Record` or `Map` is named `keyToValue`: `slotToX`, `kitToRenderer`, `THEME_TO_PALETTE`. A `Record<string, unknown>` is a plain object and is exempt.
- **Known values are unions, never `string` (lint).** Every resource has a typed slug (`AssetId`, `KitId`, `ThemeId`, `GroupId`), and so does every other closed vocabulary (`SettingName`, `SlotName`, `SizeName`, `ShotName`, `Depth`, `AssetKind`). A table whose keys are known is `Record<SizeName, number>`, and a list whose values are known is `readonly AssetKind[]`; `Record<string, ...>` and `string[]` are for values that only exist at run time (ids the scene author invents). Text from the scene is narrowed with `IdUtil.isOneOf` or looked up with `IdUtil.lookup`. `local/known-keys` flags a `string`-typed annotation on a literal with fixed keys or fixed strings.
- **Units.** A number with a unit carries it in the name: `widthPx`, `compileMs`, `svgKb`. A fraction of the frame says so: `xFraction`.
- **English in code.** Identifiers, comments, docs, error messages and warnings are in English.

## TypeScript

- **No `any` (lint).** Data from outside the program (YAML, files, custom SVG, CLI arguments) is `unknown` and is parsed with a Zod schema before use. Legacy files are exempt until issue #1 is done.
- **No vague types for known shapes.** Declare the shape or a union of string literals instead of `object`, `Record<string, unknown>` or `string`.
- **Exhaustive unions (lint).** A `switch` over a union handles every member; prefer a `Record<Union, …>` map, which the compiler checks for completeness.
- **Reuse types.** Derive from an existing type (`Pick`, `Omit`, `Partial`, `&`, `z.infer`) instead of copying fields. The scene type is `z.infer` of the schema.
- **`interface` for object shapes (lint).**
- **`strict` is on; `noUncheckedIndexedAccess` is pending** (issue #1).

## Logic

- **Braces always (lint).**
- **No magic numbers (lint).** Every number other than `-1`, `0`, `1` and `2` is a named constant with its unit. Tests are exempt.
- **Maps over comparing with fixed values (lint).** When code decides what to do by comparing a value with fixed strings, the decision is a `Record<Key, Handler>`, so a new member of the union is a compile error until it has its handler (`local/literal-dispatch`). Allowed: a guard that leaves early, a comparison that only becomes a value, a `typeof` check, a check against `""`. A set of values that share an answer is a `Set`.

  ```ts
  // Before
  if (command === "render") { return runRender(args); }
  if (command === "check") { return runCheck(args); }

  // After
  return COMMAND_TO_HANDLER[command](args);
  ```

- **Small functions (lint).** Cognitive complexity ≤ 15 (`sonarjs/cognitive-complexity`), nesting ≤ 3 (`max-depth`), parameters ≤ 5 (`max-params`; group the rest in an options object). Extract a named function instead of raising a limit. Lint also rejects identical functions, duplicated branches, collapsible `if`s, nested template literals, a `switch` inside a `switch` and assignments inside expressions.
- **Name a call before passing it on (lint).** A call passed as an argument stays simple: if it takes three or more arguments or receives another call, store its result in a named variable first.
- **Safe regular expressions (lint).** No super-linear backtracking (`sonarjs/super-linear-regex`). The SVG sanitizer is a token scanner, not a regex, because the input is untrusted (ADR 0011).
- **Explicit order (lint).** `toSorted()` with a comparator, `toReversed()`.
- **No nested ternaries (lint).**
- **Name intermediate steps.** Complex conditions go into a named boolean.
- **One responsibility per function, and the name says it.** `readX` doesn't write; `findX` doesn't create.
- **No duplicated logic.** Search before adding a helper; reuse or extract to `src/Utils/`. `pnpm quality` (jscpd) catches copies.
- **Unmapped values stay visible.** An unknown asset, theme or field is never dropped or guessed: it becomes a warning with the closest valid names, and the scene still compiles.
- **No `console` (lint).** Only `src/cli.ts` writes to the terminal.
- **Floating promises (lint).** Every promise is awaited or returned.

## When lint rules collide

- **`as Type` against `!`.** Restructure instead: narrow with a guard that returns early (tests may use `!`).
- **Copies use the ES2023 methods** (`toSorted()`, `toReversed()`), not `[...array].sort()`.
- **Visitor keys in local rules are quoted** (`"IfStatement"(node)`).

## Boundaries and security

- **Validate at the edge.** Input is parsed where it enters: `parseScene` for the scene, `createFileReader` for files, `sanitizeSvg` for custom SVG. Code past the edge trusts its types.
- **Files stay inside the scene folder.** `createFileReader` refuses `..` and absolute paths.
- **Untrusted SVG is allowlisted.** Anything that reaches the output from outside passes `sanitizeSvg`: unknown elements, `on*` attributes, external `href`/`url()`, `<style>` and `<!ENTITY>` are rejected or dropped. A new allowed element comes with a test.
- **Limits live in the schema.** At most 200 objects and a 4096 px frame.
- **Rules that cannot fail live in code.** Sandboxing, limits and the allowlist are enforced and tested, never only described in the skill.
- **Environment variables.** The core never reads `process.env` (lint).

## Before committing

Commit once per task, not per file. Before the commit, `pnpm lint`, `pnpm typecheck`, `pnpm quality` and `pnpm test` must pass; `pnpm check` runs all of them plus the build, the package checks and the visual regression, and CI runs the same. A `pnpm quality` finding means delete the dead code or extract the shared part, not add an ignore. While iterating, run only the relevant file (`pnpm exec vitest run <file>`).

## Dependencies

- **pnpm only.** Commit `pnpm-lock.yaml`; never `package-lock.json`.
- **The lockfile changes only with `package.json`.**
- **Runtime dependencies are exact versions and stay few.** A new one needs a reason in the PR description and a license on the allowed list (ADR 0012, `pnpm check:licenses`).

## Tests

How tests are written is in `docs/test-standards.md`. The rules above apply to tests too, with the exemptions listed there.

## Formatting and comments

- **Formatting (lint).** ESLint Stylistic: 2-space indent, double quotes, semicolons, trailing commas in multi-line literals, lines up to 120 characters. `pnpm lint:fix` applies it.
- **No alignment (lint).** Never add spaces to align values into columns.
- **No comments by default (lint).** A comment stays only when the code guards a rule it doesn't show and someone could change it without knowing. It starts with `Why:` and names the rule (`// Why: resvg measures text after fonts load.`). Lint (`local/comment-marker`) rejects any other comment except tool directives.
- **A comment sits on the line it explains (lint).** Right above the statement where the rule happens, never above a whole function, class or type, never as a file header, never in `protocols/` (`local/comment-placement`).
- **Delete what the code already says; keep the reason true (review).**
