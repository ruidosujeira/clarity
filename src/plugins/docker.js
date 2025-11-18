function findLastDockerStep(text) {
  const regex = /Step\s+(\d+)(?:\/(\d+))?/g;
  let match;
  let last;
  while ((match = regex.exec(text)) !== null) {
    last = { current: match[1], total: match[2] };
  }
  return last;
}

function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'docker';
  },
  summarize(ctx) {
    const summary = {};
    const nextSteps = [];

    if (ctx.args[0] === 'build') {
      if (ctx.exitCode === 0) {
        summary.result = 'Docker image built successfully.';
      } else {
        const logs = `${ctx.stdout}\n${ctx.stderr}`;
        const step = findLastDockerStep(logs);
        if (step) {
          const total = step.total ? `${step.current}/${step.total}` : step.current;
          summary.error = `Docker build failed at step ${total}.`;
        } else {
          summary.error = 'Docker build failed.';
        }

        if (includes(logs, 'COPY failed')) {
          nextSteps.push('Check if the files referenced in COPY exist in the build context.');
        } else if (includes(logs, 'returned a non-zero code')) {
          nextSteps.push('Inspect the RUN instruction that failed in the Dockerfile.');
        } else {
          nextSteps.push('Run again with --full to review the full log.');
        }
      }
    } else if (ctx.exitCode === 0) {
      summary.result = 'Docker command completed successfully.';
    } else {
      summary.error = 'Docker command failed.';
      nextSteps.push('Run again with --full to review the full log.');
    }

    if (nextSteps.length) {
      summary.nextSteps = nextSteps;
    }

    return summary;
  }
};
