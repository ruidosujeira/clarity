function countDeprecated(text) {
  const matches = text.match(/deprecated/gi);
  return matches ? matches.length : 0;
}

function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'npm';
  },
  summarize(ctx) {
    const warnings = [];
    const nextSteps = [];
    let error;
    let result;

    const stdout = ctx.stdout || '';
    const stderr = ctx.stderr || '';

    if (ctx.exitCode === 0 && (/added/i.test(stdout) || /up to date/i.test(stdout))) {
      result = 'Dependencies installed or updated successfully.';
    }

    const deprecatedCount = countDeprecated(stdout);
    if (deprecatedCount > 0) {
      warnings.push(`${deprecatedCount} packages are deprecated but still functional.`);
    }

    if (includes(stderr, 'ERR! code ERESOLVE')) {
      error = 'Dependency conflict while installing packages (ERESOLVE).';
      nextSteps.push('Adjust dependency versions in package.json to resolve the conflict.');
    } else if (includes(stderr, 'ERR! network')) {
      error = 'Network failure while downloading packages.';
      nextSteps.push('Check your internet connection and try again.');
    } else if (ctx.exitCode !== 0 && !error) {
      error = 'npm command failed.';
      nextSteps.push('Run again with --full to review the full log.');
    }

    return {
      result,
      warnings: warnings.length ? warnings : undefined,
      error,
      nextSteps: nextSteps.length ? nextSteps : undefined
    };
  }
};
