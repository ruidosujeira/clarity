/**
 * @typedef {Object} ClarityContext
 * @property {string} command
 * @property {string[]} args
 * @property {string} stdout
 * @property {string} stderr
 * @property {number} exitCode
 * @property {string} profile
 * @property {string} [logPath]
 *
 * @typedef {Object} ClaritySummary
 * @property {string} [result]
 * @property {string[]} [warnings]
 * @property {string} [error]
 * @property {string[]} [nextSteps]
 */

const npmPlugin = require('../plugins/npm');
const yarnPlugin = require('../plugins/yarn');
const pnpmPlugin = require('../plugins/pnpm');
const gitPlugin = require('../plugins/git');
const dockerPlugin = require('../plugins/docker');
const bunPlugin = require('../plugins/bun');
const pythonPlugin = require('../plugins/python');
const goPlugin = require('../plugins/go');
const rustPlugin = require('../plugins/rust');
const genericPlugin = require('../plugins/generic');

const registeredPlugins = [
  npmPlugin,
  yarnPlugin,
  pnpmPlugin,
  gitPlugin,
  dockerPlugin,
  bunPlugin,
  pythonPlugin,
  goPlugin,
  rustPlugin,
  genericPlugin
];

function getSummary(ctx) {
  const plugin = registeredPlugins.find((item) => {
    try {
      return item.supports(ctx);
    } catch (err) {
      return false;
    }
  }) || genericPlugin;

  const summary = plugin.summarize(ctx) || {};
  if (typeof summary !== 'object') {
    return genericPlugin.summarize(ctx);
  }

  const hasContent = Boolean(
    summary.result ||
      summary.error ||
      (summary.warnings && summary.warnings.length) ||
      (summary.nextSteps && summary.nextSteps.length)
  );

  if (!hasContent && plugin !== genericPlugin) {
    return genericPlugin.summarize(ctx);
  }

  return summary;
}

module.exports = {
  getSummary,
  registeredPlugins
};
