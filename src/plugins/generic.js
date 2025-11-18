module.exports = {
  supports() {
    return true;
  },
  summarize(ctx) {
    if (ctx.exitCode === 0) {
      return {
        result: 'Command completed successfully.'
      };
    }
    return {
      error: 'Command failed.',
      nextSteps: ['Run again with --full to review the full log.']
    };
  }
};
