const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');

function createTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-home-'));
}

function writeLog(homeDir, name, { command = 'cmd', args = '', exitCode = 0 } = {}) {
  const logsDir = path.join(homeDir, '.clarity', 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const filePath = path.join(logsDir, name);
  const content = [
    `Command: ${command} ${args}`.trim(),
    `Exit code: ${exitCode}`,
    '',
    '--- STDOUT ---',
    'sample output',
    '',
    '--- STDERR ---',
    'sample error'
  ].join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function runClarity(args, { env: extraEnv = {}, input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['bin/clarity', ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, ...extraEnv }
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

module.exports = {
  createTempHome,
  writeLog,
  runClarity,
  REPO_ROOT
};
