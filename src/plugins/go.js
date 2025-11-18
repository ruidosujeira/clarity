function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'go';
  },
  summarize(ctx) {
    const subcommand = ctx.args[0];

    if (subcommand === 'test') {
      if (ctx.exitCode === 0) {
        return { result: 'All Go tests passed.' };
      }
      const failures = (ctx.stdout + '\n' + ctx.stderr)
        .split('\n')
        .filter((line) => line.startsWith('FAIL'));
      return {
        error: 'Some Go tests failed.',
        warnings: failures.length ? failures : undefined,
        nextSteps: ['Inspect the packages marked as FAIL in the full log.']
      };
    }

    if (subcommand === 'build') {
      if (ctx.exitCode === 0) {
        return { result: 'Go build completed successfully.' };
      }

      if (includes(ctx.stderr, 'undefined:') || includes(ctx.stderr, 'cannot find package')) {
        return {
          error: 'Go build failed with a compilation error.',
          nextSteps: ['Run again with --full to identify the file that triggered the error.']
        };
      }

      return {
        error: 'Go build failed.',
        nextSteps: ['Run again with --full to review the full log.']
      };
    }

    if (ctx.exitCode === 0) {
      return { result: 'go command completed successfully.' };
    }

    return {
      error: 'go command failed.',
      nextSteps: ['Run again with --full to review the full log.']
    };
  }
};
