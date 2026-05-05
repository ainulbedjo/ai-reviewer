# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A CLI tool that fetches Bitbucket PR details, compares branches, and optionally uses local Ollama AI to generate code reviews posted as PR comments.

## Commands

```bash
# Run with a PR URL
node index.js --pr https://bitbucket.org/workspace/repo/pull-requests/123

# With AI review (requires Ollama running locally)
node index.js --pr <url> --ai-review

# Specify repo path (defaults to current directory)
node index.js --pr <url> --repo /path/to/repo
```

## Architecture

**Entry flow:** `index.js` → `src/args.js` (parse CLI) → `src/review.js` (orchestrate)

**Main modules:**
- `src/review.js` - Orchestrates the review workflow (fetch PR, checkout branches, get diff/commits, optionally run AI review)
- `src/bitbucket.js` - Bitbucket API client (fetch PR details, post comments). Wraps API calls with `ensureAuthenticated` from auth.js
- `src/git.js` - Git operations via child_process spawn (verify repo, fetch/checkout branches, get diff, get commit log)
- `src/ollama.js` - HTTP client for local Ollama `/api/generate` endpoint
- `src/auth.js` - On 401/403 errors, prompts for Bitbucket credentials and saves to `.env`
- `src/prompts.js` - Builds the AI review prompt by embedding `skills/code-reviewer.md` template
- `src/config.js` - Loads `.env` file, exports `config` object with bitbucket/ollama settings
- `src/args.js` - Parses `--pr`, `--repo`, `--ai-review` flags

**Review workflow (review.js:runReview):**
1. Parse PR URL for workspace, repo, prId
2. Fetch PR details from Bitbucket API to get source/target branches
3. Fetch PR source branch into local `pr-{prId}` branch
4. Checkout and pull target branch
5. Get diff and commit log between target and PR branch
6. If `--ai-review`: send diff+commits to Ollama, prompt to post as PR comment
7. Delete local PR branch

**Skill prompt:** `skills/code-reviewer.md` defines the code review output format (Strengths, Issues by severity, Recommendations, Assessment). This file is embedded into the Ollama prompt by `prompts.js:buildReviewPrompt`.

## Configuration

Create `.env` from `.env.example`:
```
BITBUCKET_USERNAME=...
BITBUCKET_API_TOKEN=...        # Required for private repos
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=kimi-k2.6:cloud
```

Credentials can also be entered interactively on first auth failure (saved to `.env`).
