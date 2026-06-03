# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A CLI tool that fetches Bitbucket PR details, compares branches, and optionally uses an AI provider (Ollama, the Claude cloud API, or the local Claude Code CLI) to generate code reviews posted as PR comments.

**AI providers:** There is no Claude HTTP server on localhost like Ollama's `:11434`. Claude is reached either via the cloud API (`https://api.anthropic.com`, needs `ANTHROPIC_API_KEY`) or via the local `claude` CLI subprocess (reuses existing Claude Code auth, no key). Provider is chosen with `--provider` / `AI_PROVIDER` (`ollama` | `claude-api` | `claude-cli`).

## Commands

```bash
# Run with a PR URL
node index.js --pr https://bitbucket.org/workspace/repo/pull-requests/123

# AI review is on by default; disable with --no-ai-review
node index.js --pr <url> --no-ai-review

# Choose the AI provider (default: ollama, or AI_PROVIDER env var)
node index.js --pr <url> --provider claude-api    # Claude cloud API (needs ANTHROPIC_API_KEY)
node index.js --pr <url> --provider claude-cli    # local `claude` CLI (no API key)

# Specify repo path (defaults to current directory)
node index.js --pr <url> --repo /path/to/repo
```

## Architecture

**Entry flow:** `index.js` → `src/args.js` (parse CLI) → `src/review.js` (orchestrate)

**Main modules:**
- `src/review.js` - Orchestrates the review workflow (fetch PR, checkout branches, get diff/commits, optionally run AI review)
- `src/bitbucket.js` - Bitbucket API client (fetch PR details, post comments). Wraps API calls with `ensureAuthenticated` from auth.js
- `src/git.js` - Git operations via child_process spawn (verify repo, fetch/checkout branches, get diff, get commit log)
- `src/providers/index.js` - `getProvider(name)` returns a `{ name, generate(prompt) }` object for the selected backend. `review.js` calls `ai.generate(prompt)` and stays provider-agnostic
- `src/ollama.js` - HTTP client for local Ollama `/api/generate` endpoint (wrapped by the ollama provider)
- `src/providers/claude-api.js` - HTTPS client for the Anthropic Messages API (`/v1/messages`)
- `src/providers/claude-cli.js` - Spawns the local `claude -p --output-format json` CLI, feeding the prompt over stdin
- `src/auth.js` - On 401/403 errors, prompts for Bitbucket credentials and saves to `.env`
- `src/prompts.js` - Builds the AI review prompt by embedding `skills/code-reviewer.md` template
- `src/config.js` - Loads `.env` file, exports `config` object with bitbucket/provider/ollama/claude settings
- `src/args.js` - Parses `--pr`, `--repo`, `--no-ai-review`, `--provider` flags

**Review workflow (review.js:runReview):**
1. Parse PR URL for workspace, repo, prId
2. Fetch PR details from Bitbucket API to get source/target branches
3. Fetch PR source branch into local `pr-{prId}` branch
4. Checkout and pull target branch
5. Get diff and commit log between target and PR branch
6. If AI review is enabled: send diff+commits to the selected provider, prompt to post as PR comment
7. Delete local PR branch

**Skill prompt:** `skills/code-reviewer.md` defines the code review output format (Strengths, Issues by severity, Recommendations, Assessment). This file is embedded into the review prompt by `prompts.js:buildReviewPrompt`.

## Configuration

Create `.env` from `.env.example`:
```
BITBUCKET_USERNAME=...
BITBUCKET_API_TOKEN=...        # Required for private repos
AI_PROVIDER=ollama            # ollama | claude-api | claude-cli
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=kimi-k2.6:cloud
ANTHROPIC_API_KEY=...         # Required for claude-api
ANTHROPIC_MODEL=claude-opus-4-8
ANTHROPIC_MAX_TOKENS=4096
```

The `claude-cli` provider needs no config — it reuses your existing Claude Code login.

Credentials can also be entered interactively on first auth failure (saved to `.env`).
