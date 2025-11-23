# Changelog

## 0.3.0 - 2025-11-22

### Added
- New plugins with actionable summaries:
  - Terraform: parses `plan`/`apply` outputs, reporting add/change/destroy counts and surfacing clear errors with next steps.
  - Kubectl: summarizes `apply`/`rollout` outcomes (created/configured/unchanged/deleted) and highlights RBAC/config issues.
  - Ansible: parses PLAY RECAP (ok/changed/unreachable/failed/skipped), marks failures, and suggests next steps.
- `clarity watch <cmd>` subcommand to follow long-running pipelines: runs the command in a loop and prints a summary block per iteration (Ctrl+C to stop). Each iteration still writes .log and .json metadata.

### Changed
- CLI help updated to include the new `watch` subcommand and its flags (`--interval`, `--count`, `--profile`).
- Plugin registry now loads Terraform, Kubectl, and Ansible plugins with priority before the generic fallback.

### Tests
- Expanded unit tests to cover the new plugins.

### Documentation
- README atualizado anteriormente; futuras melhorias vão destacar `watch` e os novos plugins com exemplos.

## 0.2.0 - 2025-11-18

### Added
- Default compact mode: every command now prints a single block with the outcome, relevant bullets, and a reminder to use `--full` whenever you need the complete log.
- `--details` flag: available for any command, showing a truncated preview of stdout/stderr before falling back to `--full`.
- Reusable `blocks` utility to keep formatting consistent across plugins.

### Changed
- The npm plugin now captures audit metrics, vulnerabilities, funding info, and deprecated packages inside the premium block.
- Generic summaries automatically add a muted-output bullet (stdout/stderr counts plus flags).
- README rewritten in a product-style layout (TL;DR, quickstart, recipes, troubleshooting, roadmap).
- Documentation refreshed to showcase the new flow and real examples of the compact block.

### Fixed
- Regression tests updated to lock the new format in place so future plugins follow the compact pattern.

### Documentation
- Dedicated `LICENSE` file added to the repo and referenced in both the README and the published package.
