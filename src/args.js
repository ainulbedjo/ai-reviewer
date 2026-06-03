const { resolveRepoPath, config } = require('./config');

function parseArgs(argv = process.argv) {
  const args = argv.slice(2);
  const result = { prUrl: null, repoPath: resolveRepoPath(), provider: config.provider };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr' || args[i] === '-p') {
      result.prUrl = args[++i];
    } else if (args[i] === '--repo' || args[i] === '-r') {
      result.repoPath = resolveRepoPath(args[++i]);
    } else if (args[i] === '--provider') {
      result.provider = args[++i];
    }
  }

  if (!result.prUrl) {
    console.error('Usage: ai-review --pr <bitbucket-pr-url> [--repo <path-to-cloned-repo>] [--provider ollama|claude-api|claude-cli]');
    console.error('Example: ai-review --pr https://bitbucket.org/myworkspace/myrepo/pull-requests/123 --repo ~/projects/myrepo');
    process.exit(1);
  }

  return result;
}

module.exports = { parseArgs };
