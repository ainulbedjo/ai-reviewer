const fs = require('fs');
const path = require('path');

function buildReviewPrompt(diffOutput, logOutput, targetBranch, prBranch) {
  const skillPath = path.join(__dirname, '..', 'skills', 'code-reviewer.md');
  const skillContent = fs.readFileSync(skillPath, 'utf-8');

  return `You are a code review agent. You MUST follow the exact rules, checklist, and output format defined below. Do not deviate from the format.

---
${skillContent}
---

Git Range to Review:
Base: ${targetBranch}
Head: ${prBranch}

Code Diff:
\`\`\`diff
${diffOutput}
\`\`\`

Commits:
\`\`\`
${logOutput}
\`\`\`

Now perform the code review. Output strictly using the format from the rules above.`;
}

function buildUpdatePrompt(previousReview, diffOutput, logOutput, targetBranch, prBranch) {
  const skillPath = path.join(__dirname, '..', 'skills', 'code-reviewer.md');
  const skillContent = fs.readFileSync(skillPath, 'utf-8');

  return `You are a code review agent. You MUST follow the exact rules, checklist, and output format defined below. Do not deviate from the format.

---
${skillContent}
---

You previously wrote this review:
\`\`\`
${previousReview}
\`\`\`

Git Range to Review:
Base: ${targetBranch}
Head: ${prBranch}

Updated Code Diff:
\`\`\`diff
${diffOutput}
\`\`\`

Updated Commits:
\`\`\`
${logOutput}
\`\`\`

Please update the previous review based on the new changes. Keep feedback that is still relevant, add new issues found in the updated diff, and remove feedback for issues that have been resolved. Output the complete updated review strictly using the format from the rules above.`;
}

module.exports = { buildReviewPrompt, buildUpdatePrompt };
