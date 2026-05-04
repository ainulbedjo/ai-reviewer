const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  bitbucket: {
    username: process.env.BITBUCKET_USERNAME,
    apiToken: process.env.BITBUCKET_API_TOKEN,
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'kimi-k2.6:cloud',
  },
};

function resolveRepoPath(input) {
  return path.resolve(input || process.cwd());
}

module.exports = { config, resolveRepoPath };
