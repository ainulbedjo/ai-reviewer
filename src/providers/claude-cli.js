const { spawn } = require('child_process');

function generateReview(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`claude -p failed (exit ${code}): ${stderr.trim()}`));
        return;
      }
      try {
        const json = JSON.parse(stdout);
        resolve(json.result || '');
      } catch (e) {
        // Not JSON — fall back to raw stdout.
        resolve(stdout.trim());
      }
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('Claude Code CLI not found on PATH. Install it or use --provider claude-api.'));
      } else {
        reject(new Error(`Failed to spawn claude: ${err.message}`));
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

module.exports = { generateReview };
