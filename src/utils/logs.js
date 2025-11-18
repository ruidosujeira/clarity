const fs = require('fs');
const path = require('path');
const os = require('os');

const LOGS_DIR = path.join(os.homedir(), '.clarity', 'logs');

function getLogsDir() {
  return LOGS_DIR;
}

function ensureLogsDir() {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function safeSegment(value) {
  return String(value || '').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/:/g, '-');
}

function writeLog({ command, args, stdout, stderr, exitCode }) {
  ensureLogsDir();
  const timestamp = timestampForFilename();
  const firstArg = args && args.length ? args[0] : 'run';
  const filename = `${timestamp}-${safeSegment(command)}-${safeSegment(firstArg)}.log`;
  const filePath = path.join(LOGS_DIR, filename);
  const lines = [
    `Command: ${command} ${args.join(' ')}`.trim(),
    `Exit code: ${exitCode}`,
    '',
    '--- STDOUT ---',
    stdout || '',
    '',
    '--- STDERR ---',
    stderr || ''
  ];
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

module.exports = {
  getLogsDir,
  ensureLogsDir,
  writeLog
};
