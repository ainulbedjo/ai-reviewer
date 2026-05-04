const { spawn } = require('child_process');

function runGit(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`git ${args.join(' ')} failed (exit ${code}): ${stderr.trim()}`));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn git: ${err.message}`));
    });
  });
}

async function verifyRepo(repoPath) {
  await runGit(repoPath, ['rev-parse', '--git-dir']);
}

async function fetchPrBranch(repoPath, prId, sourceBranch) {
  const localPrBranch = `pr-${prId}`;
  await runGit(repoPath, ['fetch', 'origin', sourceBranch]);
  await runGit(repoPath, ['branch', '-f', localPrBranch, `origin/${sourceBranch}`]);
  return localPrBranch;
}

async function checkoutAndPull(repoPath, branch) {
  await runGit(repoPath, ['checkout', branch]);
  await runGit(repoPath, ['pull', 'origin', branch]);
}

async function getDiff(repoPath, targetBranch, prBranch) {
  return runGit(repoPath, ['diff', `${targetBranch}...${prBranch}`]);
}

async function getCommits(repoPath, targetBranch, prBranch) {
  return runGit(repoPath, [
    'log',
    '--oneline',
    '--graph',
    '--left-right',
    `${targetBranch}...${prBranch}`,
  ]);
}

async function deleteLocalBranch(repoPath, branch) {
  await runGit(repoPath, ['branch', '-D', branch]);
}

module.exports = {
  runGit,
  verifyRepo,
  fetchPrBranch,
  checkoutAndPull,
  getDiff,
  getCommits,
  deleteLocalBranch,
};
