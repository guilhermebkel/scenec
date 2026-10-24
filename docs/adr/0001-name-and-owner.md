# 0001. Name, license and owner

Status: accepted.

The project is called `scenec`, licensed MIT, owned by the personal account `guilhermebkel`. The GitHub repository is `guilhermebkel/scenec` and the command is `scenec`.

The npm package is `@guilhermebkel/scenec`, not `scenec`: npm refused the unscoped name as too similar to the existing package `seneca` (E403, 2026-10-24). The `bin` stays `scenec`, so only the `npx` call carries the scope: `npx @guilhermebkel/scenec@1 check scene.yaml`. The skill is installed from the repository: `npx skills add guilhermebkel/scenec`.
