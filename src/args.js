const { resolveRepoPath } = require('./config');

function parseArgs(argv = process.argv) {
  const args = argv.slice(2);
  const result = { prUrl: null, repoPath: resolveRepoPath(), aiReview: true };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr' || args[i] === '-p') {
      result.prUrl = args[++i];
    } else if (args[i] === '--repo' || args[i] === '-r') {
      result.repoPath = resolveRepoPath(args[++i]);
    } else if (args[i] === '--no-ai-review') {
      result.aiReview = false;
    }
  }

  if (!result.prUrl) {
    console.error('Usage: bb-review --pr <bitbucket-pr-url> [--repo <path-to-cloned-repo>] [--no-ai-review]');
    console.error('Example: bb-review --pr https://bitbucket.org/myworkspace/myrepo/pull-requests/123 --repo ~/projects/myrepo');
    process.exit(1);
  }

  return result;
}

module.exports = { parseArgs };
