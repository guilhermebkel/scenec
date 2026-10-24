# Code standards

`pnpm lint` checks the rules marked (lint).

## Architecture

- Layers: protocols < utils < drawing < modes < pipeline < render < cli. (lint)
- The core is pure: no `Date`, `Math.random`, `node:*`, `process.env`. (lint)
- One public entry per concern: `scenec`, `scenec/render`, `scenec/schema`. A test snapshots the exports.
- External input is parsed once, in `parseScene`, with Zod. Inside, types are trusted.

## Names

- Files and functions in camelCase; types in PascalCase; constants in UPPER_CASE. (lint)
- Booleans start with `is`, `has`, `should`, `can`, `must`, `was`, `did`. (lint)
- Units in the name: `widthPx`, `timeoutMs`. No one-letter names. (lint)
- A map is named after its key and value: `slotToX`. (lint)

## TypeScript

- `strict`; no `any` in new code. (lint) `noUncheckedIndexedAccess` is a goal (ADR 0010).
- `interface` for object shapes. (lint)
- ESM only; imports end in `.ts`.

## Logic

- Dispatch on a fixed value through a `Record`, not a chain of `if`. (lint)
- Cognitive complexity up to 15, depth up to 3, five parameters. (lint)
- Store a nested call's result in a named variable. (lint)
- No comments except `Why:`. (lint)
