const fs = require('fs');
const path = require('path');
const os = require('os');
const { debug } = require('./debug');

function resolveDefaultLogsDir() {
  return path.join(os.homedir(), '.clarity', 'logs');
}

function getLogsDir() {
  const override = process.env.CLARITY_LOGS_DIR;
  if (override && override.trim()) {
    return path.resolve(override.trim());
  }
  return resolveDefaultLogsDir();
}

function ensureLogsDir() {
  const dir = getLogsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeSegment(value) {
  return String(value || '').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/:/g, '-');
}

/**
 * Write transcript .log and sidecar metadata .json.
 * This function never throws: on FS errors it prints a user-friendly message and debug details,
 * and returns null. The real command's behavior/exit code must not be affected.
 *
 * @param {Object} params
 * @param {string} params.command
 * @param {string[]} params.args
 * @param {string} params.stdout
 * @param {string} params.stderr
 * @param {number} params.exitCode
 * @param {string} [params.profile]
 * @param {string} [params.plugin]
 * @param {string|Date} [params.startedAt]
 * @param {string|Date} [params.finishedAt]
 * @returns {string|null} absolute path to the .log file, or null when saving failed
 */
function writeLog({ command, args, stdout, stderr, exitCode, profile, plugin, startedAt, finishedAt }) {
  try {
    const logsDir = ensureLogsDir();
    const timestamp = timestampForFilename();
    const firstArg = args && args.length ? args[0] : 'run';
    const base = `${timestamp}-${safeSegment(command)}-${safeSegment(firstArg)}`;
    const logPath = path.join(logsDir, `${base}.log`);

    const lines = [
      `Command: ${command} ${Array.isArray(args) ? args.join(' ') : ''}`.trim(),
      `Exit code: ${exitCode}`,
      '',
      '--- STDOUT ---',
      stdout || '',
      '',
      '--- STDERR ---',
      stderr || ''
    ];
    fs.writeFileSync(logPath, lines.join('\n'), 'utf8');

    // Sidecar metadata
    const meta = {
      status: exitCode === 0 ? 'success' : 'fail',
      command: String(command),
      args: Array.isArray(args) ? args : [],
      profile: profile || process.env.CLARITY_PROFILE || 'calm',
      startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
      finishedAt: finishedAt ? new Date(finishedAt).toISOString() : undefined,
      exitCode: typeof exitCode === 'number' ? exitCode : undefined,
      plugin: plugin || undefined,
      stdoutLines: countLines(stdout),
      stderrLines: countLines(stderr)
    };
    const metaPath = path.join(logsDir, `${base}.json`);
    try {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    } catch (err) {
      // Metadata write failure should not block main log
      console.error(`[clarity] Could not write metadata file: ${metaPath} (${err && err.message})`);
      debug('metadata write error stack:', err && err.stack);
    }

    return logPath;
  } catch (err) {
    const attempted = `${getLogsDir()}`;
    console.error(`[clarity] Failed to save transcript to ${attempted}: ${err && err.message}`);
    debug('log write error stack:', err && err.stack);
    return null;
  }
}

function countLines(output) {
  if (!output) return 0;
  const normalized = String(output).replace(/\r\n/g, '\n').replace(/\n+$/g, '');
  if (!normalized) return 0;
  return normalized.split('\n').length;
}

module.exports = {
  getLogsDir,
  ensureLogsDir,
  writeLog
};
