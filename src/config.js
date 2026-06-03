const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  bitbucket: {
    username: process.env.BITBUCKET_USERNAME,
    apiToken: process.env.BITBUCKET_API_TOKEN,
  },
  provider: process.env.AI_PROVIDER || 'ollama',
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'kimi-k2.6:cloud',
  },
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
    maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
  },
};

function resolveRepoPath(input) {
  return path.resolve(input || process.cwd());
}

module.exports = { config, resolveRepoPath };
