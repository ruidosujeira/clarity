function isDebug() {
  const v = process.env.CLARITY_DEBUG;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function debug(...args) {
  if (!isDebug()) return;
  const prefix = '[clarity:debug]';
  try {
    // Ensure messages go to stderr and do not interfere with normal summary
    process.stderr.write(prefix + ' ' + args.map(stringify).join(' ') + '\n');
  } catch {
    // best effort only
  }
}

function stringify(v) {
  if (v instanceof Error) return v.stack || v.message;
  if (typeof v === 'object') {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

module.exports = { debug, isDebug };
