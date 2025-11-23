// Centralized command execution for CLARITY.
// Responsible for spawning the real command, managing stdio/TTY behavior,
// streaming in --raw mode, and returning collected outputs and exit information.

const { spawn } = require('child_process');

/**
 * Execute a command and collect its stdout/stderr.
 * - In raw mode, mirrors output to the parent process while still capturing it.
 * - Preserves exit code and exposes terminating signal (if any).
 * - Handles ENOENT as exit code 127 with a clear message.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {{ raw?: boolean, env?: NodeJS.ProcessEnv, cwd?: string, shell?: boolean|string }} options
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number, signal: NodeJS.Signals | null }>}
 */
function exec(command, args = [], options = {}) {
  const { raw = false, env = process.env, cwd = undefined, shell = false } = options;

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env,
      cwd,
      shell
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (raw) process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (raw) process.stderr.write(text);
    });

    child.on('error', (error) => {
      const message = error && error.code === 'ENOENT'
        ? `Command not found: ${command}`
        : (error && error.message) || 'Unknown error while starting the process';
      // Follow common convention: 127 for command not found
      resolve({ stdout, stderr: `${stderr}${message}\n`, exitCode: 127, signal: null });
    });

    child.on('close', (exitCode, signal) => {
      resolve({ stdout, stderr, exitCode, signal: signal || null });
    });
  });
}

module.exports = {
  exec
};
