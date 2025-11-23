const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { runClarity } = require('./helpers/e2e');

test('clarity doctor prints version, node and logs dir/envs', async () => {
  const result = await runClarity(['doctor']);
  assert.strictEqual(result.code, 0);
  assert.match(result.stdout, /CLΛRITY doctor/);
  assert.match(result.stdout, /Version: /);
  assert.match(result.stdout, /Node: v\d+/);
  assert.match(result.stdout, /Logs directory: /);
  assert.match(result.stdout, /Environment:/);
  assert.match(result.stdout, /CLARITY_PROFILE=/);
});
