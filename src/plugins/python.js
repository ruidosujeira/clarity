function isPip(ctx) {
  if (ctx.command === 'pip' || ctx.command === 'pip3') {
    return true;
  }
  if (ctx.command === 'python') {
    const idx = ctx.args.indexOf('-m');
    return idx !== -1 && ctx.args[idx + 1] === 'pip';
  }
  return false;
}

function isPytest(ctx) {
  if (ctx.command === 'pytest') {
    return true;
  }
  if (ctx.command === 'python') {
    const idx = ctx.args.indexOf('-m');
    return idx !== -1 && ctx.args[idx + 1] === 'pytest';
  }
  return false;
}

function collectWarnings(text) {
  const lines = (text || '').split('\n');
  return lines.filter((line) => /DEPRECATION|WARNING/i.test(line));
}

module.exports = {
  supports(ctx) {
    return isPip(ctx) || isPytest(ctx);
  },
  summarize(ctx) {
    if (isPip(ctx)) {
      const warnings = collectWarnings(ctx.stdout).concat(collectWarnings(ctx.stderr));
      const summary = {};

      if (ctx.exitCode === 0) {
        summary.result = 'Packages installed/updated successfully via pip.';
      }

      if (warnings.length) {
        summary.warnings = warnings;
      }

      if (/ERROR: Could not find a version that satisfies the requirement/i.test(ctx.stderr)) {
        summary.error = 'Package or version not found while installing with pip.';
        summary.nextSteps = ['Check the package name/version and try again.'];
      } else if (ctx.exitCode !== 0 && !summary.error) {
        summary.error = 'pip command failed.';
        summary.nextSteps = ['Run again with --full to review the full log.'];
      }

      return summary;
    }

    if (isPytest(ctx)) {
      if (ctx.exitCode === 0) {
        return { result: 'All pytest suites passed.' };
      }

      const combined = `${ctx.stdout}\n${ctx.stderr}`;
      const failureLines = combined.split('\n').filter((line) => /FAILED|ERROR/.test(line)).slice(-5);

      return {
        error: 'Some tests failed while running pytest.',
        warnings: failureLines.length ? failureLines : undefined,
        nextSteps: ['Review the tests marked as FAILED/ERROR in the full log.']
      };
    }

    return {};
  }
};
