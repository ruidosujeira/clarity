const test = require('node:test');
const assert = require('node:assert');

const npmPlugin = require('../src/plugins/npm');
const pnpmPlugin = require('../src/plugins/pnpm');
const yarnPlugin = require('../src/plugins/yarn');
const bunPlugin = require('../src/plugins/bun');
const gitPlugin = require('../src/plugins/git');
const dockerPlugin = require('../src/plugins/docker');
const pythonPlugin = require('../src/plugins/python');
const goPlugin = require('../src/plugins/go');
const rustPlugin = require('../src/plugins/rust');

function ctx(overrides) {
  return Object.assign(
    {
      command: '',
      args: [],
      stdout: '',
      stderr: '',
      exitCode: 0,
      profile: 'calm'
    },
    overrides
  );
}

test('npm plugin detects success and deprecated warnings', () => {
  const summary = npmPlugin.summarize(
    ctx({
      command: 'npm',
      stdout: 'added 5 packages\ndeprecated foo',
      exitCode: 0
    })
  );

  assert.strictEqual(summary.result, 'Dependencies installed or updated successfully.');
  assert.ok(summary.warnings && summary.warnings[0].includes('deprecated'));
  assert.ok(!summary.error);
});

test('npm plugin surfaces ERESOLVE conflicts', () => {
  const summary = npmPlugin.summarize(
    ctx({
      command: 'npm',
      stderr: 'npm ERR! code ERESOLVE',
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'Dependency conflict while installing packages (ERESOLVE).');
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('package.json'));
});

test('git plugin explains push conflicts', () => {
  const summary = gitPlugin.summarize(
    ctx({
      command: 'git',
      args: ['push'],
      stderr: 'rejected non-fast-forward',
      exitCode: 1
    })
  );

  assert.strictEqual(
    summary.error,
    'Push rejected because the remote branch has commits you do not have locally.'
  );
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('git pull --rebase'));
});

test('docker plugin captures failing build step', () => {
  const summary = dockerPlugin.summarize(
    ctx({
      command: 'docker',
      args: ['build'],
      stdout: 'Step 3/10 : RUN make build',
      stderr: 'Step 3/10 : RUN make build\nreturned a non-zero code: 2',
      exitCode: 1
    })
  );

  assert.ok(summary.error && summary.error.includes('step 3/10'));
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('RUN'));
});

test('python plugin flags missing package errors', () => {
  const summary = pythonPlugin.summarize(
    ctx({
      command: 'pip',
      stderr: 'ERROR: Could not find a version that satisfies the requirement foo==99.0',
      exitCode: 1
    })
  );

  assert.strictEqual(
    summary.error,
    'Package or version not found while installing with pip.'
  );
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('package name'));
});

test('python plugin summarizes pytest failures', () => {
  const summary = pythonPlugin.summarize(
    ctx({
      command: 'pytest',
      stdout: 'FAILED tests/test_app.py::TestApp::test_logic',
      stderr: '',
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'Some tests failed while running pytest.');
  assert.ok(summary.warnings && summary.warnings[0].includes('FAILED'));
});

test('pnpm plugin reports conflicts', () => {
  const summary = pnpmPlugin.summarize(
    ctx({
      command: 'pnpm',
      stderr: 'ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL foo',
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'pnpm encountered conflicts during execution.');
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('--full'));
});

test('yarn plugin points to unexpected error', () => {
  const summary = yarnPlugin.summarize(
    ctx({
      command: 'yarn',
      stderr: 'error An unexpected error occurred: Something bad',
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'Yarn hit an unexpected error.');
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('--full'));
});

test('bun plugin flags errors', () => {
  const summary = bunPlugin.summarize(
    ctx({
      command: 'bun',
      stderr: 'error: reference error',
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'bun command encountered an error.');
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes('--full'));
});

test('go plugin highlights test failures', () => {
  const summary = goPlugin.summarize(
    ctx({
      command: 'go',
      args: ['test'],
      stdout: 'FAIL example.com/project',
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'Some Go tests failed.');
  assert.ok(summary.warnings && summary.warnings[0].startsWith('FAIL '));
});

test('rust plugin reports compile errors', () => {
  const summary = rustPlugin.summarize(
    ctx({
      command: 'cargo',
      args: ['build'],
      stderr: "error[E0599]: no method named 'foo'",
      exitCode: 1
    })
  );

  assert.strictEqual(summary.error, 'Rust build failed due to a compilation error.');
  assert.ok(summary.nextSteps && summary.nextSteps[0].includes("error[E..."));
});
