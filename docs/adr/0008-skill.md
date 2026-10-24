# 0008. The skill ships inside the npm package

Status: accepted.

`skills/draw-scene/` is in the package `files` and installable with `npx skills add guilhermebkel/scenec`. `references/dsl.md` and `references/catalog.md` are generated from the code and a test fails when they are stale. The skill tells the agent to run `npx @guilhermebkel/scenec@1 check`, fix up to five cycles, then `render --png`, and never edit the SVG by hand. Sources are in `references/sources.md`.

The skill is named after the action (`draw-scene`), not after the library: a skill says what the agent does, and the CLI it calls can change.
