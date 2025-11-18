# Changelog

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
