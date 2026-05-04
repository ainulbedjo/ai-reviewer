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

module.exports = { buildReviewPrompt };
