const http = require('http');
const { URL } = require('url');

function generateReview(host, model, prompt) {
  return new Promise((resolve, reject) => {
    const url = new URL(host);
    const postData = JSON.stringify({ model, prompt, stream: false });

    const options = {
      hostname: url.hostname,
      port: url.port || 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json.response || '');
          } catch (e) {
            reject(new Error(`Failed to parse Ollama response: ${e.message}`));
          }
        } else {
          reject(new Error(`Ollama returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Ollama request failed: ${err.message}`)));
    req.write(postData);
    req.end();
  });
}

module.exports = { generateReview };
