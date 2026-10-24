# 0010. Harness adaptation and legacy debt

Status: accepted.

The harness comes from the author's own templates. Adaptations: layers are `protocols < utils < drawing < modes < pipeline < render < cli`; the class-based local rules (`describe-target`, `class-matches-file`) are removed because scenec has no classes.

The JavaScript prototype was ported so that 108/108 baseline SVGs stayed byte-identical. That code keeps debt, listed in `LEGACY_FILES` of `eslint.config.mjs`: `any`, relaxed complexity and naming rules, and `noUncheckedIndexedAccess` off. Runtime messages for the scene author are Portuguese. Pay the debt one file at a time and remove the file from the list when it passes.
