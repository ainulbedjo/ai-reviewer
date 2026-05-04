# bb-review

CLI tool to checkout Bitbucket PR branches, compare diffs, and get AI-powered code reviews via local Ollama.

## Setup

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```
BITBUCKET_USERNAME=your-username
BITBUCKET_API_TOKEN=your-api-token
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=kimi-k2.6:cloud
```

For private repositories, create a Bitbucket access token at:
`https://bitbucket.org/[workspace]/[repo]/admin/access-tokens`

## Usage

```bash
# View diff and commits for a PR
node index.js --pr https://bitbucket.org/workspace/repo/pull-requests/123

# Get AI code review and post as PR comment
node index.js --pr https://bitbucket.org/workspace/repo/pull-requests/123 --ai-review

# Specify repo path (defaults to current directory)
node index.js --pr <url> --repo /path/to/repo
```

## How It Works

1. Fetches PR details from Bitbucket API to get source/target branches
2. Fetches the PR branch into a local `pr-{prId}` branch
3. Checks out the target branch
4. Displays diff and commit log between target and PR branch
5. (With `--ai-review`) Sends diff to Ollama for AI review
6. Optionally posts the AI review as a PR comment
7. Cleans up the local PR branch

## Requirements

- Node.js >= 18.0.0
- [Ollama](https://ollama.ai/) running locally (only if using `--ai-review`)
