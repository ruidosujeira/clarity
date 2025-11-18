function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

function collectWarnings(text) {
  const lines = (text || '').split('\n');
  return lines.filter((line) => /deprecated|warning/i.test(line));
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'yarn';
  },
  summarize(ctx) {
    const warnings = collectWarnings(ctx.stdout).concat(collectWarnings(ctx.stderr));
    const summary = {};

    if (ctx.exitCode === 0 && (/Done in/i.test(ctx.stdout) || /success/i.test(ctx.stdout))) {
      summary.result = 'yarn command completed successfully.';
    }

    if (warnings.length) {
      summary.warnings = warnings;
    }

    if (includes(ctx.stderr, 'error An unexpected error occurred')) {
      summary.error = 'Yarn hit an unexpected error.';
      summary.nextSteps = ['Run again with --full to inspect the error details.'];
    } else if (ctx.exitCode !== 0 && !summary.error) {
      summary.error = 'yarn command failed.';
      summary.nextSteps = ['Run again with --full to review the full log.'];
    }

    return summary;
  }
};
