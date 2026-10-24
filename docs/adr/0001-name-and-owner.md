# 0001. Name, license and owner

Status: accepted.

The project is called `scenec`, licensed MIT, owned by the personal account `guilhermebkel`. The GitHub repository is `guilhermebkel/scenec` and the command is `scenec`.

The npm package is `@scenec/core`, not `scenec`: npm refused the unscoped name as too similar to the existing package `seneca` (E403, 2026-10-24). The `@scenec` scope (an npm organization) leaves room for future sub-packages next to the core. The `bin` stays `scenec`, so only the `npx` call carries the scope: `npx @scenec/core@1 check scene.yaml`. The skill is installed from the repository: `npx skills add guilhermebkel/scenec`.
