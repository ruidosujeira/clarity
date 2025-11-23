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
const { debug } = require('../utils/debug');
const yarnPlugin = require('../plugins/yarn');
const pnpmPlugin = require('../plugins/pnpm');
const gitPlugin = require('../plugins/git');
const dockerPlugin = require('../plugins/docker');
const bunPlugin = require('../plugins/bun');
const pythonPlugin = require('../plugins/python');
const goPlugin = require('../plugins/go');
const rustPlugin = require('../plugins/rust');
const terraformPlugin = require('../plugins/terraform');
const kubectlPlugin = require('../plugins/kubectl');
const ansiblePlugin = require('../plugins/ansible');
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
  terraformPlugin,
  kubectlPlugin,
  ansiblePlugin,
  genericPlugin
];

function getSummary(ctx) {
  const plugin = registeredPlugins.find((item) => {
    try {
      return item.supports(ctx);
    } catch (err) {
      debug('plugin supports() threw, falling back later:', item && (item.id || item.name), err && err.message);
      return false;
    }
  }) || genericPlugin;

  let summary = {};
  try {
    summary = plugin.summarize(ctx) || {};
  } catch (err) {
    debug('plugin summarize() threw, using generic fallback:', plugin && (plugin.id || plugin.name), err && err.message);
    return genericPlugin.summarize(ctx);
  }
  if (typeof summary !== 'object') {
    return genericPlugin.summarize(ctx);
  }

  const hasContent = Boolean(
    summary.result ||
      summary.error ||
      (summary.warnings && summary.warnings.length) ||
      (summary.nextSteps && summary.nextSteps.length) ||
      summary.block
  );

  if (!hasContent && plugin !== genericPlugin) {
    return genericPlugin.summarize(ctx);
  }

  return summary;
}

module.exports = {
  getSummary,
  registeredPlugins,
  /**
   * Return the first plugin that supports the context, or the generic plugin.
   */
  getSelectedPlugin(ctx) {
    return registeredPlugins.find((item) => {
      try { return item.supports(ctx); } catch { return false; }
    }) || genericPlugin;
  },
  /**
   * Best-effort identifier for a plugin (function name or explicit id property)
   */
  getPluginId(plugin) {
    return plugin && (plugin.id || plugin.name || 'generic');
  }
};
