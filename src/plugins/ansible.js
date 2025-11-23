const { createBlock, bullets } = require('../utils/blocks');

function parseRecap(text = '') {
  // Look for ok=, changed=, unreachable=, failed=, skipped=
  const m = text.match(/ok=(\d+)\s+changed=(\d+)\s+unreachable=(\d+)\s+failed=(\d+)(?:\s+skipped=(\d+))?/i);
  if (!m) return null;
  return {
    ok: Number(m[1]),
    changed: Number(m[2]),
    unreachable: Number(m[3]),
    failed: Number(m[4]),
    skipped: m[5] !== undefined ? Number(m[5]) : undefined
  };
}

module.exports = {
  id: 'ansible',
  supports(ctx) {
    return ctx.command === 'ansible-playbook' || ctx.command === 'ansible';
  },
  summarize(ctx) {
    const text = `${ctx.stdout || ''}\n${ctx.stderr || ''}`;
    const recap = parseRecap(text);

    if (recap) {
      const items = bullets([
        `ok=${recap.ok}`,
        `changed=${recap.changed}`,
        `unreachable=${recap.unreachable}`,
        `failed=${recap.failed}`,
        recap.skipped !== undefined ? `skipped=${recap.skipped}` : null
      ]);
      if (recap.failed > 0 || recap.unreachable > 0 || ctx.exitCode !== 0) {
        return {
          error: 'Ansible playbook reported failures.',
          nextSteps: [
            'Inspect the failed tasks/hosts in the log.',
            'Re-run with --full for detailed output.'
          ],
          warnings: items
        };
      }
      return {
        block: createBlock({ headline: '✔ Ansible playbook completed', items })
      };
    }

    if (ctx.exitCode !== 0) {
      return {
        error: 'Ansible command failed.',
        nextSteps: ['Run again with --full to inspect the full log.']
      };
    }

    return { result: 'Ansible command completed successfully.' };
  }
};
