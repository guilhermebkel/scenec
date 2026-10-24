# Test standards

- A unit test sits next to its file as `name.test.ts`; the outer `describe` is `name.function()`.
- Expected values are written by hand in the test, never computed with the code under test.
- Assertions are exact: `toBe`, `toStrictEqual`. No `toBeTruthy`, `toBeDefined`. (lint)
- No `if`, loops or `try` inside a test. (lint)
- Cross-cutting suites: `test/visual` (108 baselines, three gates), `test/smoke` (every asset in every kit), `test/package` (public exports).

## Visual regression gates

1. SVG byte-identical to `baseline.svg`.
2. `baseline.layout.json` (layout, warnings, art) equal.
3. If the SVG changed, render both at 800 px and compare with pixelmatch (threshold 0.1); the share of changed pixels must stay at or below 0.005% (override per case in `case.json`).

PNGs are not stored: the pixel gate renders `baseline.svg` on the fly. Update with `pnpm test:visual --update` and review `test/visual/report/`.
