const https = require('https');
const { config } = require('./config');
const { ensureAuthenticated } = require('./auth');

function parseBitbucketUrl(url) {
  const match = url.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)\/pull-requests\/(\d+)/);
  if (!match) {
    throw new Error('Unsupported Bitbucket URL format. Expected: https://bitbucket.org/<workspace>/<repo>/pull-requests/<id>');
  }
  return { workspace: match[1], repoSlug: match[2], prId: match[3] };
}

function buildAuthHeaders() {
  const headers = {
    'User-Agent': 'bb-code-review',
    'Accept': 'application/json',
  };
  if (config.bitbucket.username && config.bitbucket.apiToken) {
    const auth = Buffer.from(`${config.bitbucket.username}:${config.bitbucket.apiToken}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }
  return headers;
}

function apiRequest(urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const headers = buildAuthHeaders();
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const options = {
      hostname: 'api.bitbucket.org',
      path: urlPath,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse API response: ${e.message}`));
          }
        } else {
          reject(new Error(`Bitbucket API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Request failed: ${err.message}`)));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function fetchPrDetails(workspace, repoSlug, prId) {
  return ensureAuthenticated(() =>
    apiRequest(`/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`)
  );
}

async function postPrComment(workspace, repoSlug, prId, content) {
  return ensureAuthenticated(() =>
    apiRequest(
      `/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      'POST',
      { content: { raw: content } }
    )
  );
}

module.exports = { parseBitbucketUrl, fetchPrDetails, postPrComment };
