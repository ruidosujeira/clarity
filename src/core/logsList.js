const fs = require('fs');
const path = require('path');
const { getLogsDir, ensureLogsDir } = require('../utils/logs');

function parseMetadata(content) {
  const lines = content.split('\n');
  const commandLine = lines[0] ? lines[0].replace(/^Command:\s*/i, '').trim() : '';
  const exitLine = lines[1] ? lines[1].replace(/^Exit code:\s*/i, '').trim() : '';
  const exitCode = exitLine === '' ? undefined : Number(exitLine);
  return { commandLine, exitCode: Number.isNaN(exitCode) ? undefined : exitCode };
}

function loadEntry(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const meta = parseMetadata(content);
    return {
      path: filePath,
      fileName: path.basename(filePath),
      commandLine: meta.commandLine || '(unknown)',
      exitCode: typeof meta.exitCode === 'number' ? meta.exitCode : undefined
    };
  } catch (err) {
    return {
      path: filePath,
      fileName: path.basename(filePath),
      commandLine: '(failed to read log)',
      exitCode: undefined
    };
  }
}

function readLogFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

function listLogs({ limit = 10 } = {}) {
  ensureLogsDir();
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(logsDir)
    .filter((name) => name.endsWith('.log'))
    .sort()
    .reverse()
    .slice(0, limit);

  return files.map((name) => loadEntry(path.join(logsDir, name)));
}

function formatEntries(entries) {
  if (!entries.length) {
    return 'No logs found in ~/.clarity/logs.';
  }

  const lines = ['Recent logs:'];
  entries.forEach((entry, index) => {
    const prefix = `${index + 1}.`;
    const exitInfo = typeof entry.exitCode === 'number' ? ` (exit ${entry.exitCode})` : '';
    lines.push(`${prefix} ${entry.fileName}${exitInfo}`);
    lines.push(`   command: ${entry.commandLine}`);
    lines.push(`   path: ${entry.path}`);
  });
  return lines.join('\n');
}

module.exports = {
  listLogs,
  formatEntries,
  readLogFile
};
