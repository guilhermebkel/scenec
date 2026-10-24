# Contributing

Issues and pull requests are welcome. Small ones are often the most useful: a scene that gets a wrong warning, an asset that overlaps, a recipe that fails.

1. Read `AGENTS.md`, `GLOSSARY.md`, `docs/code-standards.md` and `docs/test-standards.md`.
2. Branch from `main`, make one change per pull request.
3. Run `pnpm install` and `pnpm check` until it is clean. Never raise a limit or silence a rule to pass.
4. If a baseline moves, run `pnpm test:visual --update`, open `test/visual/report/index.html` and say in the PR why each case changed.
5. If the scene language or the catalog changes, run `pnpm skill:refs` and commit the result.

Known debt is in [issue #1](https://github.com/guilhermebkel/scenec/issues/1); picking an item from it is a good first contribution.
