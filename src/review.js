const fs = require('fs');
const path = require('path');
const { parseBitbucketUrl, fetchPrDetails, postPrComment } = require('./bitbucket');
const { verifyRepo, fetchPrBranch, checkoutAndPull, getDiff, getCommits, deleteLocalBranch } = require('./git');
const { generateReview } = require('./ollama');
const { buildReviewPrompt, buildUpdatePrompt } = require('./prompts');
const { config } = require('./config');
const { ask } = require('./utils');

async function runReview(prUrl, repoPath, aiReview = true) {
  const { workspace, repoSlug, prId } = parseBitbucketUrl(prUrl);

  console.log(`[INFO] PR: ${prUrl}`);
  console.log(`[INFO] Repo directory: ${repoPath}`);

  console.log(`[INFO] Fetching PR details from Bitbucket API... `);
  const prDetails = await fetchPrDetails(workspace, repoSlug, prId);

  const targetBranch = prDetails.destination.branch.name;
  const sourceBranch = prDetails.source.branch.name;

  console.log(`[INFO] Target branch: ${targetBranch}`);
  console.log(`[INFO] Source branch: ${sourceBranch}`);

  await verifyRepo(repoPath);

  const localPrBranch = await fetchPrBranch(repoPath, prId, sourceBranch);
  console.log(`[INFO] Fetched PR into local branch "${localPrBranch}"`);

  console.log(`[INFO] Checking out "${targetBranch}"...`);
  await checkoutAndPull(repoPath, targetBranch);

  const diffOutput = await getDiff(repoPath, targetBranch, localPrBranch);
  console.log('\n========== DIFF ==========\n');
  console.log(diffOutput || '(no diff)');

  const logOutput = await getCommits(repoPath, targetBranch, localPrBranch);
  console.log(`\n========== COMMITS ==========\n`);
  console.log(logOutput || '(no commits)');

  let review = null;
  if (aiReview) {
    const commentPath = path.join(repoPath, 'comment.md');
    let previousReview = null;
    if (fs.existsSync(commentPath)) {
      const content = fs.readFileSync(commentPath, 'utf-8');
      if (content.trim()) {
        previousReview = content;
        console.log('[INFO] Found previous review in comment.md. Asking Ollama to update it...');
      }
    }

    console.log('\n[INFO] Sending diff to Ollama for AI review...');
    const prompt = previousReview
      ? buildUpdatePrompt(previousReview, diffOutput, logOutput, targetBranch, localPrBranch)
      : buildReviewPrompt(diffOutput, logOutput, targetBranch, localPrBranch);
    review = await generateReview(config.ollama.host, config.ollama.model, prompt);
    console.log('\n========== AI REVIEW ==========\n');
    console.log(review);

    fs.writeFileSync(commentPath, review, 'utf-8');
    console.log(`[INFO] Review saved to ${commentPath}.`);

    const answer = await ask('\nPost this review as a PR comment? (y/n): ');
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('[INFO] Posting review comment to Bitbucket PR...');
      await postPrComment(workspace, repoSlug, prId, review);
      console.log('[SUCCESS] Review posted as PR comment.');
    }
  }

  console.log(`\n[INFO] Cleaning up local branch "${localPrBranch}"...`);
  await deleteLocalBranch(repoPath, localPrBranch);

  console.log(`\n[SUCCESS] Review complete. Target branch "${targetBranch}" is checked out and up to date.`);
}

module.exports = { runReview };
