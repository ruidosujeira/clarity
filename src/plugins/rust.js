function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'cargo';
  },
  summarize(ctx) {
    const subcommand = ctx.args[0];

    if (subcommand === 'build') {
      if (ctx.exitCode === 0) {
        return { result: 'Rust build completed successfully (cargo build).' };
      }

      if (/error\[E\d+\]/i.test(ctx.stderr)) {
        return {
          error: 'Rust build failed due to a compilation error.',
          nextSteps: ["Review the 'error[E...]' entries in the full log."]
        };
      }

      return {
        error: 'Rust build failed.',
        nextSteps: ['Run again with --full to review the full log.']
      };
    }

    if (subcommand === 'test') {
      if (ctx.exitCode === 0) {
        return { result: 'All Rust tests passed.' };
      }
      return {
        error: 'Some Rust tests failed while running cargo test.',
        nextSteps: ['Run again with --full to locate the failing tests.']
      };
    }

    if (ctx.exitCode === 0) {
      return { result: 'cargo command completed successfully.' };
    }

    return {
      error: 'cargo command failed.',
      nextSteps: ['Run again with --full to review the full log.']
    };
  }
};
