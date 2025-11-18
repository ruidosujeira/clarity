function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'git';
  },
  summarize(ctx) {
    const summary = {};
    const nextSteps = [];
    const args = ctx.args || [];

    if (ctx.exitCode === 0 && args[0] === 'push') {
      summary.result = 'Push completed successfully.';
    }

    if (includes(ctx.stdout + ctx.stderr, 'nothing to commit')) {
      summary.result = 'Nothing to commit.';
    }

    if (includes(ctx.stderr, 'non-fast-forward') || includes(ctx.stderr, 'rejected')) {
      summary.error = 'Push rejected because the remote branch has commits you do not have locally.';
      nextSteps.push("Run 'git pull --rebase' and then try 'git push' again.");
    } else if (includes(ctx.stdout + ctx.stderr, 'CONFLICT')) {
      summary.error = 'Merge conflicts detected that must be resolved.';
      nextSteps.push('Resolve the conflicted files and complete the merge before continuing.');
    } else if (ctx.exitCode !== 0 && !summary.error) {
      summary.error = 'git command failed.';
      nextSteps.push('Run again with --full to review the full log.');
    }

    if (nextSteps.length) {
      summary.nextSteps = nextSteps;
    }

    return summary;
  }
};
