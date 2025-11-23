const { createBlock, bullets } = require('../utils/blocks');

function parsePlan(stdout = '') {
  const m = stdout.match(/Plan:\s*(\d+)\s+to\s+add,\s*(\d+)\s+to\s+change,\s*(\d+)\s+to\s+destroy\./i);
  if (!m) return null;
  return { add: Number(m[1]), change: Number(m[2]), destroy: Number(m[3]) };
}

function parseApply(stdout = '') {
  const m = stdout.match(/Apply complete!\s+Resources:\s*(\d+)\s+added,\s*(\d+)\s+changed,\s*(\d+)\s+destroyed\./i);
  if (!m) return null;
  return { added: Number(m[1]), changed: Number(m[2]), destroyed: Number(m[3]) };
}

module.exports = {
  id: 'terraform',
  supports(ctx) {
    return ctx.command === 'terraform';
  },
  summarize(ctx) {
    const stdout = ctx.stdout || '';
    const stderr = ctx.stderr || '';

    let error;
    let result;
    let nextSteps = [];
    let warnings = [];
    let block;

    const isPlan = ctx.args && ctx.args[0] === 'plan';
    const isApply = ctx.args && (ctx.args[0] === 'apply' || ctx.args[0] === 'destroy');

    const plan = parsePlan(stdout);
    const apply = parseApply(stdout);

    if (ctx.exitCode === 0) {
      if (isPlan && plan) {
        const items = bullets([
          `${plan.add} to add, ${plan.change} to change, ${plan.destroy} to destroy`
        ]);
        block = createBlock({ headline: '✔ Terraform plan generated', items });
      } else if (isApply && apply) {
        const items = bullets([
          `${apply.added} added, ${apply.changed} changed, ${apply.destroyed} destroyed`
        ]);
        block = createBlock({ headline: '✔ Terraform apply complete', items });
      } else if (!block) {
        result = 'Terraform command completed successfully.';
      }
    } else {
      if (/Error:/i.test(stderr) || /Error:/i.test(stdout)) {
        error = 'Terraform encountered an error.';
        nextSteps.push('Review provider credentials and configuration.');
        nextSteps.push('Run again with --full to inspect the full log.');
      } else {
        error = 'Terraform command failed.';
        nextSteps.push('Run again with --full to inspect the full log.');
      }
    }

    return {
      block,
      result,
      warnings: warnings.length ? warnings : undefined,
      error,
      nextSteps: nextSteps.length ? nextSteps : undefined
    };
  }
};
