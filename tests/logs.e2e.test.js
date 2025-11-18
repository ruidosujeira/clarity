const test = require('node:test');
const assert = require('node:assert');
const { createTempHome, writeLog, runClarity } = require('./helpers/e2e');

test('clarity logs lists stored files', async () => {
  const home = createTempHome();
  writeLog(home, '2025-01-01T00-00-00Z-npm-install.log', {
    command: 'npm',
    args: 'install',
    exitCode: 0
  });

  const result = await runClarity(['logs', '--limit', '1'], { env: { HOME: home } });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /Recent logs/);
  assert.match(result.stdout, /npm-install/);
});

test('clarity logs --open prints the log inline', async () => {
  const home = createTempHome();
  writeLog(home, '2025-01-02T00-00-00Z-git-push.log', {
    command: 'git',
    args: 'push',
    exitCode: 1
  });

  const result = await runClarity(['logs', '--open', '--limit', '1'], {
    env: { HOME: home },
    input: '1\n'
  });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /=== 2025-01-02T00-00-00Z-git-push.log ===/);
  assert.match(result.stdout, /Command: git push/);
});

test('clarity logs --pager honors CLARITY_PAGER', async () => {
  const home = createTempHome();
  writeLog(home, '2025-01-03T00-00-00Z-docker-build.log', {
    command: 'docker',
    args: 'build .',
    exitCode: 0
  });

  const result = await runClarity(['logs', '--pager', '--limit', '1'], {
    env: { HOME: home, CLARITY_PAGER: 'cat' },
    input: '1\n'
  });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /Opening 2025-01-03T00-00-00Z-docker-build.log with cat/);
  assert.match(result.stdout, /sample output/);
});

test('clarity logs --editor honors CLARITY_EDITOR', async () => {
  const home = createTempHome();
  writeLog(home, '2025-01-04T00-00-00Z-pnpm-install.log', {
    command: 'pnpm',
    args: 'install',
    exitCode: 0
  });

  const result = await runClarity(['logs', '--editor', '--limit', '1'], {
    env: { HOME: home, CLARITY_EDITOR: 'cat' },
    input: '1\n'
  });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /Opening 2025-01-04T00-00-00Z-pnpm-install.log with cat/);
  assert.match(result.stdout, /Command: pnpm install/);
});

test('clarity logs --editor --latest skips the prompt', async () => {
  const home = createTempHome();
  writeLog(home, '2025-01-05T00-00-00Z-bun-run.log', {
    command: 'bun',
    args: 'install',
    exitCode: 1
  });

  const result = await runClarity(['logs', '--editor', '--latest', '--limit', '1'], {
    env: { HOME: home, CLARITY_EDITOR: 'cat' }
  });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /Opening 2025-01-05T00-00-00Z-bun-run.log with cat/);
  assert.match(result.stdout, /Command: bun install/);
});
