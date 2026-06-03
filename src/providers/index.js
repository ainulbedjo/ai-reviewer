const { config } = require('../config');
const ollama = require('../ollama');
const claudeApi = require('./claude-api');
const claudeCli = require('./claude-cli');

const PROVIDERS = ['ollama', 'claude-api', 'claude-cli'];

function getProvider(name) {
  const provider = name || config.provider;

  switch (provider) {
    case 'ollama':
      return {
        name: 'ollama',
        generate: (prompt) => ollama.generateReview(config.ollama.host, config.ollama.model, prompt),
      };
    case 'claude-api':
      return {
        name: 'claude-api',
        generate: (prompt) => claudeApi.generateReview(config.claude.model, prompt, config.claude.apiKey, config.claude.maxTokens),
      };
    case 'claude-cli':
      return {
        name: 'claude-cli',
        generate: (prompt) => claudeCli.generateReview(prompt),
      };
    default:
      throw new Error(`Unknown provider "${provider}". Valid options: ${PROVIDERS.join(', ')}.`);
  }
}

module.exports = { getProvider, PROVIDERS };
