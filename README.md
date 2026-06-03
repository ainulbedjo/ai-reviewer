# ai-review

CLI tool to checkout Bitbucket PR branches, compare diffs, and get AI-powered code reviews. Supports three AI providers: local **Ollama**, the **Claude cloud API**, and the local **Claude Code CLI**. Since this tool relies on git, this should run inside the project local path.

## Setup

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```
BITBUCKET_USERNAME=your-username
BITBUCKET_API_TOKEN=your-api-token
AI_PROVIDER=ollama            # ollama | claude-api | claude-cli
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=kimi-k2.6:cloud
ANTHROPIC_API_KEY=            # required for claude-api
ANTHROPIC_MODEL=claude-opus-4-8
ANTHROPIC_MAX_TOKENS=4096
```

For private repositories, create a Bitbucket access token at:
`https://bitbucket.org/[workspace]/[repo]/admin/access-tokens`

## AI providers

There is **no Claude server on localhost** like Ollama's `:11434`. Pick a provider with `--provider` (or the `AI_PROVIDER` env var):

| Provider | How it reaches Claude/AI | Auth | Cost |
| --- | --- | --- | --- |
| `ollama` (default) | Local Ollama HTTP server (`:11434`) | none | free, local |
| `claude-api` | Anthropic cloud API (`api.anthropic.com`) | `ANTHROPIC_API_KEY` | paid per token |
| `claude-cli` | Local `claude -p` subprocess | reuses your Claude Code login | per your plan |

## Usage

```bash
# Review a PR (diff + AI code review by default)
node index.js --pr https://bitbucket.org/workspace/repo/pull-requests/123

# Skip AI review and only show diff/commits
node index.js --pr <url> --no-ai-review

# Choose the AI provider (default: ollama)
node index.js --pr <url> --provider claude-api    # Claude cloud API (needs ANTHROPIC_API_KEY)
node index.js --pr <url> --provider claude-cli    # local `claude` CLI (no API key)

# Specify repo path (defaults to current directory)
node index.js --pr <url> --repo /path/to/repo

# Or run globally after linking
npm link
ai-reviewer --pr https://bitbucket.org/workspace/repo/pull-requests/123
```

## How It Works

1. Fetches PR details from Bitbucket API to get source/target branches
2. Fetches the PR branch into a local `pr-{prId}` branch
3. Checks out the target branch
4. Displays diff and commit log between target and PR branch
5. Sends diff + commits to the selected AI provider for review (by default)
6. Prompts to post the AI review as a PR comment; if declined, saves it to `comment.md` in the repo
7. On the next run, reads existing `comment.md` and asks the provider to update the review based on new changes
8. Cleans up the local PR branch

## Requirements

- Node.js >= 18.0.0
- An AI provider (unless using `--no-ai-review`):
  - `ollama`: [Ollama](https://ollama.ai/) running locally
  - `claude-api`: an `ANTHROPIC_API_KEY`
  - `claude-cli`: the [Claude Code](https://claude.com/claude-code) CLI on your PATH

## Demo

```bash
$ node index.js --pr https://bitbucket.org/acme/app/pull-requests/42

[INFO] PR: https://bitbucket.org/acme/app/pull-requests/42
[INFO] Repo directory: /Users/dev/projects/app
[INFO] Fetching PR details from Bitbucket API...
[INFO] Target branch: main
[INFO] Source branch: feature/auth-fix
[INFO] Fetched PR into local branch "pr-42"
[INFO] Checking out "main"...

========== DIFF ==========

diff --git a/src/auth.js b/src/auth.js
index 3a4f5c..8b9d2e 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -10,7 +10,7 @@ function validateToken(token) {
-  return token.length > 0;
+  return token && token.length > 0;
 }

========== COMMITS ==========

a1b2c3d fix: handle null token in validateToken
e4f5g6h refactor: extract regex into constant

[INFO] Sending diff to Ollama for AI review...

========== AI REVIEW ==========

## Summary
Brief review of auth null-check fix.

**PR Size:** Small (~4 lines)
**Review Time:** 2 minutes

## Strengths
- Good defensive null check added
- Clean commit history

## Required Changes
(none)

## Important Suggestions
(none)

## Minor Suggestions
🟢 **[nit]** Consider adding a unit test for the null token case

## Questions
❓ Should we also validate token type (string) here?

## Security Considerations
- [x] No hardcoded secrets
- [ ] Input validation present
- [x] Authorization checks in place
- [x] No SQL/XSS injection risks

## Test Coverage
- [ ] Unit tests added/updated
- [ ] Edge cases covered
- [ ] Error cases tested

## Verdict
**[ ] 💬 Comment** - Minor suggestions, can merge

Post this review as a PR comment? (y/n): n
[INFO] Review saved to /Users/dev/projects/app/comment.md.

[INFO] Cleaning up local branch "pr-42"...

[SUCCESS] Review complete. Target branch "main" is checked out and up to date.
```
