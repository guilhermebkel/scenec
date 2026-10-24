# 0009. Publishing with a manual release workflow and npm trusted publishing

Status: accepted.

A release is started by hand: Actions → Release → Run workflow on `main`, choosing `patch`, `minor`, `major` or `none` (release the current version as is). The workflow bumps `package.json`, runs `pnpm check`, commits `release: vX.Y.Z [skip ci]`, tags `vX.Y.Z`, pushes both to `main`, publishes to npm and creates the GitHub Release with generated notes. Same shape as harness-ledger; there is no changesets step.

npm publishing uses trusted publishing (OIDC, npm 11.5.1 or newer, `id-token: write`, no `NODE_AUTH_TOKEN`). The first `0.1.0` is published by hand, then the trusted publisher is configured for `release.yml`. The workflow skips `npm publish` when that version is already on npm, so running it with `none` after the manual first publish only tags and creates the Release. The `repository` field in `package.json` must match the GitHub repository exactly, case included.
