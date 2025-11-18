<div align="center">

<img src="assets/clarity-banner.png" alt="CLARITY banner" width="520" />


> Stop reading walls of logs. Keep only the signal after every command.

[![node](https://img.shields.io/badge/Node.js-%3E%3D18.0-3C873A?logo=node.js&logoColor=white)](#)
[![license](https://img.shields.io/badge/license-MIT-blue)](#)
[![tests](https://img.shields.io/badge/tests-node--test-green)](#development)

</div>

CLΛRITY is a minimalist terminal wrapper. It runs the real command, saves stdout/stderr to `~/.clarity/logs`, and prints an actionable summary: outcome, relevant warnings, blockers, and next steps. No more endless scrolling—just the context you need to decide what to do next.

## Why another wrapper?
- **Semantic summaries**: every ecosystem (npm, git, docker, etc.) has bespoke heuristics to detect silent success, warnings, conflicts, and recommended follow-ups.
- **Profile-aware**: the default `calm` mode stays minimal; `devops` always highlights the log path and adds technical next steps.
- **Integrated logs**: every run becomes a timestamped file you can list, open in a pager, or edit instantly.
- **Zero lock-in**: CLΛRITY executes the original command, preserves the exit code, and still gives you `--raw`/`--full` escapes for manual debugging.

## How it works
1. `clarity <command>` spawns the real binary via `child_process.spawn`, capturing stdout/stderr.
2. The full transcript is saved to `~/.clarity/logs/<timestamp>-<command>.log`.
3. That context flows through the plugin chain (`src/plugins/*`) which produces a structured summary.
4. The selected profile (`calm` or `devops`) can enrich the summary with extra warnings and next steps before printing.

## Installation

```bash
git clone https://github.com/ruidosujeira/clarity
cd clarity
npm install
npm link   # optional: exposes `clarity` globally while developing
```

Without `npm link`, run it via `node ./bin/clarity <command>`.

## Quick usage

```bash
clarity <command> [args...] [--full] [--raw] [--profile <name>]

clarity npm install
clarity --profile devops git push
clarity docker build .
clarity logs --limit 5
clarity logs --pager --latest
clarity logs --editor code --limit 1
```

### Output modes
- `calm` (default) – only the smart summary.
- `--full` – run, save the log, then dump stdout/stderr at the end.
- `--raw` – live-stream stdout/stderr while still archiving the log.

### `logs` command
```
clarity logs [--limit N] [--open] [--pager|--pager=<cmd>] [--editor|--editor=<cmd>] [--latest]
```
- `--open` / `--open-inline`: print the selected log inline.
- `--pager` / `--pager=bat`: open directly inside your pager (defaults to `$CLARITY_PAGER`, `$PAGER`, `$EDITOR`, or `less`).
- `--editor` / `--editor=code`: jump straight into your editor (`$CLARITY_EDITOR`, `$VISUAL`, `$EDITOR`, or `nano`).
- `--latest`: auto-pick the newest log (implied when `--limit 1`).

### Summary profiles

| Profile | Ideal for | Behavior |
| --- | --- | --- |
| `calm` | people who only need "did it work and what now?" | prints result/warnings/errors/next steps and nothing else.
| `devops` | engineers who want an immediate follow-up checklist | keeps warnings, flags stderr even on exit code 0, enforces next steps on failure, and always points to the log path.

Switch profiles via `--profile devops` or `CLARITY_PROFILE=devops`.

## Supported plugins

| Ecosystem | Detects | Delivered insights |
| --- | --- | --- |
| npm / yarn / pnpm | installs, audits, conflicts (`ERESOLVE`, network issues, deprecated packages) | install success, deprecated counts, conflicts, recommended actions (`npm audit fix`, adjust versions, etc.).
| git | `status`, `push`, `pull`, `commit` | pending files, rejected pushes, `git pull --rebase` hints, and more.
| docker | `build`, `compose`, `push` | highlights failing layers, final image name, next steps.
| bun | `bun install`, `bun run` | success state and warnings for the Bun toolchain.
| pip / pytest | requirements installs and test runs | counts of installed packages, failing suites, remediation tips.
| go | `go test`, `go build`, `go run` | compiled packages, produced binaries, common error causes.
| cargo (Rust) | `cargo build`, `cargo test`, `cargo clippy` | failing targets and suggested commands.
| generic | every other command | fallback summary that highlights exit codes, stderr, and the log path.

Adding a new plugin is as simple as creating `supports(ctx)` + `summarize(ctx)` inside `src/plugins/` and registering it in `src/core/plugins.js`.

## Development

```bash
npm install        # install CLI dependencies
npm test           # run unit + e2e suites (tests/*.test.js)

# When regenerating the GIF (optional)
# npm install imagemagick or reuse the container's convert binary
```

The e2e tests rely on fake binaries in `tests/fixtures/bin/*` to guarantee deterministic summaries.

## Contributing
- Open an issue describing the ecosystem/heuristic you want to support.
- Run `npm test` before opening a PR.
- Include real logs or transcripts so we can calibrate new summaries.
- Update this documentation whenever new modes or plugins ship.

## Assets & resources
- `assets/demo-raw.txt` and `assets/demo-clarity.txt` feed the demo GIF.
- Regenerate it with ImageMagick: `convert ... caption:@assets/demo-raw.txt ...` (see the commands in this README).
- The final GIF lives at `assets/clarity-demo.gif`; replace it to refresh the screenshot.

## Quick roadmap
- [ ] Publish the npm package (`clarity`) for global installs (`npm i -g clarity`).
- [ ] Add `terraform`, `kubectl`, and `ansible` plugins.
- [ ] Store log metadata to filter by status/profile.
- [ ] `clarity watch <cmd>` to follow long-running pipelines with incremental summaries.
