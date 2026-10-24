# 0010. Harness adaptation and legacy debt

Status: accepted.

The harness comes from the author's own templates. Adaptations: layers are `protocols < utils < drawing < modes < pipeline < render < cli`; the class-based local rules (`describe-target`, `class-matches-file`) and the `@/` import alias are switched off for now because the ported code is functions, not classes. The target is classes, as in harness-ledger; the move is tracked in issue #1.

The JavaScript prototype was ported so that 108/108 baseline SVGs stayed byte-identical. That code keeps debt, listed in `LEGACY_FILES` of `eslint.config.mjs`: `any`, relaxed complexity and naming rules, and `noUncheckedIndexedAccess` off. Runtime messages for the scene author are Portuguese; they must become English (issue #1). Pay the debt one file at a time and remove the file from the list when it passes.

All of this debt is listed in https://github.com/guilhermebkel/scenec/issues/1.
