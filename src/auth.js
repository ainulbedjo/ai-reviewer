const fs = require('fs');
const path = require('path');
const { config } = require('./config');
const { ask } = require('./utils');

const ENV_PATH = path.join(__dirname, '..', '.env');

async function promptForCredentials() {
  console.log('[AUTH] Bitbucket credentials required (or invalid).');
  const username = await ask('Enter Bitbucket username: ');
  const token = await ask('Enter Bitbucket API token: ');
  return { username, token };
}

function updateEnvFile(username, token) {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const lines = content.split('\n');
  let foundUser = false;
  let foundToken = false;

  const cleaned = lines.filter((line) => {
    if (line.startsWith('BITBUCKET_USERNAME=')) {
      foundUser = true;
      return false;
    }
    if (line.startsWith('BITBUCKET_APP_PASSWORD=')) {
      return false;
    }
    if (line.startsWith('BITBUCKET_API_TOKEN=')) {
      foundToken = true;
      return false;
    }
    return true;
  });

  if (!foundUser) cleaned.push(`BITBUCKET_USERNAME=${username}`);
  if (!foundToken) cleaned.push(`BITBUCKET_API_TOKEN=${token}`);

  fs.writeFileSync(ENV_PATH, cleaned.join('\n') + '\n');
}

function looksLikeAuthError(message) {
  return (
    message.includes('401') ||
    message.includes('403') ||
    (message.includes('404') && /authenticated|access|not have access/i.test(message))
  );
}

async function ensureAuthenticated(requestFn) {
  try {
    return await requestFn();
  } catch (err) {
    if (!looksLikeAuthError(err.message)) throw err;

    const { username, token } = await promptForCredentials();

    // Update runtime config
    config.bitbucket.username = username;
    config.bitbucket.apiToken = token;

    // Persist for next runs
    updateEnvFile(username, token);
    console.log('[AUTH] Credentials saved to .env');

    // Retry once with new credentials
    return await requestFn();
  }
}

module.exports = { ensureAuthenticated };
