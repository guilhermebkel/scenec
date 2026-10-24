# 0009. Publishing with npm trusted publishing

Status: accepted.

The first `0.1.0` is published by hand, then the trusted publisher is configured for `release.yml` (OIDC, npm 11.5.1 or newer, `id-token: write`, no `NODE_AUTH_TOKEN`). The `repository` field in `package.json` must match the GitHub repository exactly, case included.
