function hasError(text) {
  return /\berror\b/i.test(text || '');
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'bun';
  },
  summarize(ctx) {
    if (ctx.exitCode === 0 && !hasError(ctx.stderr)) {
      return {
        result: 'bun command completed successfully.'
      };
    }

    return {
      error: 'bun command encountered an error.',
      nextSteps: ['Run again with --full to inspect the error details.']
    };
  }
};
