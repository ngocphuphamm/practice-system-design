---
description: Perform a senior-level code review of your currently staged Git changes.
---

Review the staged Git changes as if you are a Senior Staff Engineer conducting a rigorous pull request review. 

Analyze the changes provided below:
!`git diff --cached`

Evaluate the diff explicitly against these criteria:
- **Critical Bugs**: Edge cases, race conditions, or broken logic.
- **Security Vulnerabilities**: Missing sanitization, exposed secrets, or authorization flaws.
- **Performance**: N+1 queries, unoptimized loops, or heavy blocking code blocks.
- **Maintainability**: Missing error handling, confusing variable names, or unwritten tests.

### Output Format
Group your feedback using these strict prefixes:
- 🛑 **BLOCKER**: Critical defects that must be resolved before committing.
- ⚠️ **WARNING**: Smells or technical debt that should be addressed if time permits.
- 💡 **SUGGESTION**: Style cleanups or optional architectural improvements.

Be direct, brutal, and highly specific. reference file names and line numbers.
