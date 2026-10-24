# 0010. Harness adaptation and legacy debt

Status: accepted.

The harness comes from the author's own templates. Adaptations: layers are `protocols < utils < drawing < modes < pipeline < render < cli`; the code is classes with `@/` imports, as in harness-ledger. The build is esbuild per file plus `tsc` for declarations, because `tsc` cannot emit `@/….ts` imports; `scripts/build.mjs` rewrites them to relative `.js` paths in `dist`.

The JavaScript prototype was ported so that 108/108 baseline SVGs stayed byte-identical. That code keeps debt, listed in `LEGACY_FILES` of `eslint.config.mjs`: `any`, relaxed complexity and naming rules, and `noUncheckedIndexedAccess` off. Runtime messages for the scene author are English. Pay the debt one file at a time and remove the file from the list when it passes.

All of this debt is listed in https://github.com/guilhermebkel/scenec/issues/1.
