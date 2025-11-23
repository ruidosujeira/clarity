const { createBlock, bullets } = require('../utils/blocks');

function summarizeKubectl(stdout = '', stderr = '', args = []) {
  const text = `${stdout}\n${stderr}`;
  const lower = text.toLowerCase();

  let error;
  const nextSteps = [];

  if (/error:/i.test(text) || /forbidden/i.test(lower)) {
    error = 'kubectl command failed.';
    nextSteps.push('Check your kubeconfig/context and RBAC permissions.');
    nextSteps.push('Run again with --full to inspect the full log.');
  }

  // Basic apply/create feedback
  const created = (stdout.match(/created/gi) || []).length;
  const configured = (stdout.match(/configured/gi) || []).length;
  const unchanged = (stdout.match(/unchanged/gi) || []).length;
  const deleted = (stdout.match(/deleted/gi) || []).length;

  let block;
  if (!error) {
    if (args[0] === 'apply' || /apply/i.test(stdout)) {
      const items = bullets([
        created ? `${created} created` : null,
        configured ? `${configured} configured` : null,
        unchanged ? `${unchanged} unchanged` : null,
        deleted ? `${deleted} deleted` : null
      ]);
      block = createBlock({ headline: '✔ kubectl apply succeeded', items });
    } else if (args[0] === 'rollout' && /successfully rolled out/i.test(stdout)) {
      block = createBlock({ headline: '✔ Rollout completed', items: bullets([]) });
    }
  }

  return { block, error, nextSteps: nextSteps.length ? nextSteps : undefined };
}

module.exports = {
  id: 'kubectl',
  supports(ctx) {
    return ctx.command === 'kubectl';
  },
  summarize(ctx) {
    const s = summarizeKubectl(ctx.stdout || '', ctx.stderr || '', ctx.args || []);
    if (!s.block && !s.error) {
      return { result: 'kubectl command completed successfully.' };
    }
    return s;
  }
};
