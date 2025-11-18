const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { createTempHome, runClarity } = require('./helpers/e2e');

const FIXTURE_BIN = path.join(__dirname, 'fixtures', 'bin');

function tempEnv() {
  const home = createTempHome();
  const logsDir = path.join(home, '.clarity', 'logs');
  return { home, logsDir };
}

test('clarity npm install prints success summary and warnings', async () => {
  const { home, logsDir } = tempEnv();
  const result = await runClarity(['npm', 'install'], {
    env: {
      HOME: home,
      PATH: `${FIXTURE_BIN}:${process.env.PATH}`
    }
  });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /✔ Result: Dependencies installed or updated successfully./);
  assert.match(result.stdout, /⚠ Warnings:/);
  assert.ok(fs.readdirSync(logsDir).length > 0);
});

test('clarity git push summarizes rejected push', async () => {
  const { home, logsDir } = tempEnv();
  const result = await runClarity(['git', 'push'], {
    env: {
      HOME: home,
      PATH: `${FIXTURE_BIN}:${process.env.PATH}`
    }
  });

  assert.strictEqual(result.code, 1);
  assert.match(result.stdout, /❌ Error: Push rejected because the remote branch has commits you do not have locally./);
  assert.match(result.stdout, /→ Next steps:/);
  assert.ok(fs.readdirSync(logsDir).length > 0);
});

test('clarity docker build reports failing step', async () => {
  const { home, logsDir } = tempEnv();
  const result = await runClarity(['docker', 'build', '.'], {
    env: {
      HOME: home,
      PATH: `${FIXTURE_BIN}:${process.env.PATH}`
    }
  });

  assert.strictEqual(result.code, 1);
  assert.match(result.stdout, /❌ Error: Docker build failed at step 2\/3/);
  assert.match(result.stdout, /Inspect the RUN instruction/);
  assert.ok(fs.readdirSync(logsDir).length > 0);
});

test('clarity pnpm install captures conflicts', async () => {
  const { home, logsDir } = tempEnv();
  const result = await runClarity(['pnpm', 'install'], {
    env: {
      HOME: home,
      PATH: `${FIXTURE_BIN}:${process.env.PATH}`
    }
  });

  assert.strictEqual(result.code, 1);
  assert.match(result.stdout, /pnpm encountered conflicts/);
  assert.match(result.stdout, /Run again with --full/);
  assert.ok(fs.readdirSync(logsDir).length > 0);
});

test('clarity yarn build reports silent success', async () => {
  const { home, logsDir } = tempEnv();
  const result = await runClarity(['yarn', 'build'], {
    env: {
      HOME: home,
      PATH: `${FIXTURE_BIN}:${process.env.PATH}`
    }
  });

  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /✔ Result: yarn command completed successfully./);
  assert.ok(fs.readdirSync(logsDir).length > 0);
});

test('clarity bun surfaces failures quickly', async () => {
  const { home, logsDir } = tempEnv();
  const result = await runClarity(['bun', 'install'], {
    env: {
      HOME: home,
      PATH: `${FIXTURE_BIN}:${process.env.PATH}`
    }
  });

  assert.strictEqual(result.code, 1);
  assert.match(result.stdout, /bun command encountered an error/);
  assert.ok(fs.readdirSync(logsDir).length > 0);
});
