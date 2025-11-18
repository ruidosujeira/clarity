const { spawn } = require('child_process');
const { writeLog } = require('../utils/logs');
const { getSummary } = require('./plugins');
const { applyProfile } = require('./profiles');

function execute(command, args, { raw }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env,
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (raw) {
        process.stdout.write(text);
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (raw) {
        process.stderr.write(text);
      }
    });

    child.on('error', (error) => {
      const message = error.code === 'ENOENT'
        ? `Command not found: ${command}`
        : error.message;
      resolve({ stdout, stderr: `${stderr}${message}\n`, exitCode: 127 });
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

function printFull({ stdout, stderr }) {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
}

function printSummary(summary) {
  if (summary.result) {
    console.log(`✔ Result: ${summary.result}`);
  }
  if (summary.warnings && summary.warnings.length) {
    console.log('⚠ Warnings:');
    summary.warnings.forEach((warn) => console.log(`- ${warn}`));
  }
  if (summary.error) {
    console.log(`❌ Error: ${summary.error}`);
  }
  if (summary.nextSteps && summary.nextSteps.length) {
    console.log('→ Next steps:');
    summary.nextSteps.forEach((step) => console.log(`- ${step}`));
  }
}

async function runClarity({ command, args, options = {} }) {
  const mode = options.raw ? 'raw' : options.full ? 'full' : 'calm';
  const profile = options.profile || 'calm';

  const { stdout, stderr, exitCode } = await execute(command, args, { raw: mode === 'raw' });

  const logPath = writeLog({ command, args, stdout, stderr, exitCode });

  if (mode === 'raw') {
    return exitCode;
  }

  if (mode === 'full') {
    printFull({ stdout, stderr });
    return exitCode;
  }

  const context = {
    command,
    args,
    stdout,
    stderr,
    exitCode,
    profile,
    logPath
  };

  const summary = getSummary(context);
  const profiledSummary = applyProfile(context, summary);

  printSummary(profiledSummary);
  return exitCode;
}

module.exports = runClarity;
