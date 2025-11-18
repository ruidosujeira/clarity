function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

function countDeprecated(text) {
  const matches = text.match(/deprecated/gi);
  return matches ? matches.length : 0;
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'pnpm';
  },
  summarize(ctx) {
    const summary = {};
    const warnings = [];
    const nextSteps = [];

    if (ctx.exitCode === 0 && /packages?/i.test(ctx.stdout)) {
      summary.result = 'Dependencies installed/updated successfully with pnpm.';
    }

    const deprecatedCount = countDeprecated(ctx.stdout);
    if (deprecatedCount > 0) {
      warnings.push(`${deprecatedCount} packages are deprecated but still functional.`);
    }

    if (warnings.length) {
      summary.warnings = warnings;
    }

    if (includes(ctx.stderr, 'ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL') || includes(ctx.stderr, 'conflict')) {
      summary.error = 'pnpm encountered conflicts during execution.';
      nextSteps.push('Run again with --full to identify which package conflicted.');
    } else if (ctx.exitCode !== 0 && !summary.error) {
      summary.error = 'pnpm command failed.';
      nextSteps.push('Run again with --full to review the full log.');
    }

    if (nextSteps.length) {
      summary.nextSteps = nextSteps;
    }

    return summary;
  }
};
