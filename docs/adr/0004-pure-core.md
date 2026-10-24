# 0004. Pure core, I/O at the edge

Status: accepted.

`compile` has no native dependency, no file system, no clock and no randomness: the same scene gives the same SVG on any machine. Files come through the `FileReader` option (sandboxed by `createFileReader`: `..` and absolute paths are refused) and bounding boxes through `measure` (supplied by `scenec/render` with resvg). Lint bans `Math.random`, `Date`, `node:*` and `process.env` in the core.
