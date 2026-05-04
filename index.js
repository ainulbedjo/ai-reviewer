#!/usr/bin/env node

const { parseArgs } = require('./src/args');
const { runReview } = require('./src/review');

async function main() {
  const { prUrl, repoPath, aiReview } = parseArgs();
  await runReview(prUrl, repoPath, aiReview);
}

main().catch((err) => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
