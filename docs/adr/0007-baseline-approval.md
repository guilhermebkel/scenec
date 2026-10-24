# 0007. Baseline updates need a human approval in CI

Status: accepted.

When the visual job fails on a same-repository pull request, an `update-baselines` job waits on the `baseline-update` environment (required reviewers), runs `pnpm test:visual --update` and commits with a GitHub App token. Fork pull requests get no secrets and cannot update. Required reviewers on a private repository need a paid plan; a public repository is free.
