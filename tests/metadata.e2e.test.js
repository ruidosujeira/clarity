const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createTempHome, runClarity } = require('./helpers/e2e');

const FIXTURE_BIN = path.join(__dirname, 'fixtures', 'bin');

function createTempDir(prefix = 'clarity-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('writes .log and sidecar .json metadata with required fields', async () => {
  const home = createTempHome();
  const result = await runClarity(['npm', 'install'], {
    env: { HOME: home, PATH: `${FIXTURE_BIN}:${process.env.PATH}` }
  });

  assert.strictEqual(result.code, 0);

  const logsDir = path.join(home, '.clarity', 'logs');
  const files = fs.readdirSync(logsDir).filter((f) => f.endsWith('.log'));
  assert.ok(files.length > 0, 'should create a .log file');
  const base = files[0].replace(/\.log$/, '');
  const metaPath = path.join(logsDir, `${base}.json`);
  assert.ok(fs.existsSync(metaPath), 'should create sidecar .json');

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  assert.match(meta.status, /^(success|fail)$/);
  assert.strictEqual(typeof meta.command, 'string');
  assert.ok(Array.isArray(meta.args));
  assert.strictEqual(typeof meta.exitCode, 'number');
  assert.ok(typeof meta.stdoutLines === 'number');
  assert.ok(typeof meta.stderrLines === 'number');
});

test('respects CLARITY_LOGS_DIR override for log and metadata files', async () => {
  const home = createTempHome();
  const override = createTempDir('clarity-logs-');
  const result = await runClarity(['git', 'push'], {
    env: { HOME: home, PATH: `${FIXTURE_BIN}:${process.env.PATH}`, CLARITY_LOGS_DIR: override }
  });
  assert.strictEqual(typeof result.code, 'number');
  const files = fs.readdirSync(override);
  assert.ok(files.some((f) => f.endsWith('.log')));
  assert.ok(files.some((f) => f.endsWith('.json')));
});

test('when FS write fails, shows a clear message and preserves exit code', async () => {
  const home = createTempHome();
  // Create a path that is a file, then use it as CLARITY_LOGS_DIR to force mkdir/write failure
  const tmp = createTempDir('clarity-bad-');
  const badPath = path.join(tmp, 'not-a-dir');
  fs.writeFileSync(badPath, 'x', 'utf8');

  const result = await runClarity(['yarn', 'build'], {
    env: { HOME: home, PATH: `${FIXTURE_BIN}:${process.env.PATH}`, CLARITY_LOGS_DIR: badPath }
  });

  // Our fixture returns exitCode 0 for yarn build
  assert.strictEqual(result.code, 0);
  assert.match(result.stderr, /\[clarity\] Failed to save transcript/);
});
