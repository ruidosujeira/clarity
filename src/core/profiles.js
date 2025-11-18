function cloneSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return {};
  }
  return {
    result: summary.result,
    warnings: summary.warnings ? [...summary.warnings] : undefined,
    error: summary.error,
    nextSteps: summary.nextSteps ? [...summary.nextSteps] : undefined
  };
}

function pushUnique(list, value) {
  if (!value) {
    return;
  }
  if (!list.includes(value)) {
    list.push(value);
  }
}

function applyDevopsProfile(ctx, summary) {
  const enriched = cloneSummary(summary);
  const nextSteps = enriched.nextSteps ? [...enriched.nextSteps] : [];
  const warnings = enriched.warnings ? [...enriched.warnings] : [];

  if (ctx.exitCode === 0 && ctx.stderr && ctx.stderr.trim() && warnings.length === 0) {
    warnings.push('Command wrote to stderr even though it exited successfully. Review the log to ensure everything is fine.');
  }

  if (ctx.exitCode !== 0 && nextSteps.length === 0) {
    pushUnique(nextSteps, 'Run again with --full to inspect the technical details.');
  }

  if (ctx.logPath) {
    pushUnique(nextSteps, `Open the full log at ${ctx.logPath}`);
  }

  enriched.warnings = warnings.length ? warnings : undefined;
  enriched.nextSteps = nextSteps.length ? nextSteps : undefined;
  return enriched;
}

function applyProfile(ctx, summary) {
  switch ((ctx.profile || 'calm').toLowerCase()) {
    case 'devops':
      return applyDevopsProfile(ctx, summary);
    case 'calm':
    default:
      return summary;
  }
}

module.exports = {
  applyProfile
};
