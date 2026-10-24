# Test standards

How tests in this repository are written. `pnpm lint` enforces the rules marked **(lint)**, through `@vitest/eslint-plugin` and the rules in `docs/code-standards.md`, which apply to tests too; the rest are checked in review. Every rule here serves one of two questions: would this test fail if the code broke, and is it testing the real code?

Rules marked **(pending)** wait for the class refactor in [issue #1](https://github.com/guilhermebkel/scenec/issues/1).

## Where tests live

- **Next to the code.** A unit test lives beside the file it tests and shares its name: `ColorUtil.ts` → `ColorUtil.test.ts`. Suites that cut across files live in `test/`: `test/visual/` (baselines), `test/smoke/` (every asset in every kit) and `test/package/` (public exports, the skill).
- **The outer describe names what is tested (pending).** Every unit test sits under a top-level `describe("ClassName.method()")`: the class the file tests and the public method the tests go through. Situations go in describes inside it, worded as a context (`describe("when the hex color has three digits")`). Lint (`local/describe-target`) checks that the class is the file's and that the method exists and is public, so renaming a method without its tests fails. Until the refactor, the outer describe is `file.function()`.
- **Through the highest seam.** Test behavior through `parseScene`, `compile`, `check` and the CLI. Test a lower module directly only for logic with many cases (color math, suggestions, the sanitizer).
- **Fixtures in the real format.** Scenes are real YAML; custom SVG fixtures are real SVG, including hostile ones (scripts, entities, external links).
- **Every new behavior brings its test.** Each new asset, field, rule or output path gets a test. A new asset also enters the smoke suite on its own, because it iterates the catalog.

## What a test checks

- **Name the break.** Before writing the body, name the change to the code that should make the test fail. If you can't name one, the test checks nothing. A test that fails only when a constant or a message changes is a change detector: test the behavior that depends on it instead.
- **Expected values come from outside the code.** Write them as literals worked out by hand, never computed with the code under test or its constants. Arithmetic that shows the derivation is fine (`contrast("#000", "#fff")` is `21`).
- **Exact assertions (lint).** `toStrictEqual`, not `toEqual`. No `toBeDefined`, `toBeTruthy` or `toBeFalsy`. `toThrow` names the message; calls are checked with their arguments.
- **No vacuous passes.** An assertion that something never appears passes on empty output too: first assert there was something to check (the sanitizer test first asserts the element was in the input).
- **One behavior per test, named by the behavior,** in the domain's words (`GLOSSARY.md`): "warns with the closest asset name when the asset is unknown", "drops on* attributes from a custom SVG".

## Test code stays simple

- **No logic in the test body (lint).** No `if` or `try` deciding which assertion runs. Cases that differ only in data are rows of `it.each`.
- **Same rules as the code (lint).** Complexity, nesting, parameters, nested calls and duplication apply to tests. Exemptions: magic numbers, external key spelling, `!`, nested calls and alphabetical sort in `test/`.
- **Builders, with what matters spelled out.** Build input with builders (`SceneBuilder`), and set every value the assertion depends on in the test itself.
- **Clean structure (lint).** No skipped, focused, commented-out or duplicated tests; hooks at the top of their block.

## Real code, doubles only at the edges

- **Run the real thing.** Real schema, real compiler, real resvg. Don't mock this repository's own modules: if a test needs that, the seam is wrong.
- **Doubles only where the process meets the outside:** the file system (an in-memory `FileReader`) and the renderer when a test targets the core alone (a `measure` stub). Assert what the code did with them.
- **Time and randomness are inputs.** The core has neither, so output is deterministic and tests compare it exactly.
- **Production code has no test-only methods.**

## Visual regression

The 108 base generations (`test/visual/cases/`) are the contract for the drawing. Each passes three gates (ADR 0006):

1. The SVG is byte-identical to `baseline.svg`.
2. `baseline.layout.json` (layout, warnings and art) is equal.
3. If the SVG changed, both render at 800 px and pixelmatch (threshold 0.1) finds at most 0.005% changed pixels; a case may set its own limit in `case.json`.

PNGs are not stored: the pixel gate renders `baseline.svg` on the fly. A change that moves a baseline is deliberate: run `pnpm test:visual --update`, open `test/visual/report/index.html` (before, after, diff), and say in the PR why each case changed. In CI the update waits for a human approval (ADR 0007).

## The skill

The skill is tested like code: the frontmatter has only the allowed fields with the sources inside `metadata`, the generated references match the code (`pnpm skill:refs`), and every recipe compiles with zero warnings and zero critiques.

## Before finishing: the mutation check

Go through the code you changed and imagine the realistic mistakes: a wrong threshold, the wrong branch, a missing allowlist entry, a path that escapes the sandbox, an empty scene, an off-by-one in a slot, something counted twice. Some test should fail for each. When none would, add or fix the test before committing.
