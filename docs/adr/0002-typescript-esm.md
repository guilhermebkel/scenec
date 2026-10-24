# 0002. TypeScript, ESM only, Node 20+

Status: accepted.

Strict TypeScript compiled with `tsc` 7, ESM only, Node 20 or newer. typescript-eslint cannot use the TypeScript 7 API yet, so `typescript` is an alias of `@typescript/typescript6` and `tsc` comes from `@typescript/native`. Revisit when typescript-eslint supports 7.x.

The build is not `tsc` emit: esbuild transpiles each file and `tsc` only writes declarations (see ADR 0010).
