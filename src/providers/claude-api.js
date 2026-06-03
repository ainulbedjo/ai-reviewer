const https = require('https');
const { URL } = require('url');

function generateReview(model, prompt, apiKey, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY is not set. Add it to your .env to use the claude-api provider.'));
      return;
    }

    const url = new URL('https://api.anthropic.com/v1/messages');
    const postData = JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            const text = (json.content || [])
              .filter((block) => block.type === 'text')
              .map((block) => block.text)
              .join('');
            resolve(text);
          } catch (e) {
            reject(new Error(`Failed to parse Anthropic response: ${e.message}`));
          }
        } else {
          reject(new Error(`Anthropic returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Anthropic request failed: ${err.message}`)));
    req.write(postData);
    req.end();
  });
}

module.exports = { generateReview };
