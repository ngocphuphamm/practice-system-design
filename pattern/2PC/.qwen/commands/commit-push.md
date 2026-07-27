---
description: Generates an AI commit message based on your diff and optional brief description, then asks for review.
---

Analyze the staged changes, combine them with any user-provided hints, generate a commit message, and present it for review before committing.

### Process Flow
1. Fetch the staged changes using this diff output:
   !`git diff --cached`

2. If there are no staged changes, run `git status` to see unstaged changes, alert the user, and stop.

3. Draft a Git commit message using **Gitmoji** and **Conventional Commits** structure:
   - Format: `<emoji> <type>(<scope>): <short description>`
   - Emojis: ✨ `feat`, 🐛 `fix`, 📝 `docs`, 🎨 `style`, ♻️ `refactor`, 🧪 `test`, 🔧 `chore`

4. **Incorporate User Context ($ARGUMENTS):**
   - Check if the user provided additional context via `$ARGUMENTS`.
   - If `$ARGUMENTS` is present, strictly prioritize this hint to determine the `<type>`, `<scope>`, and correct context of the message. Combine it with your code diff analysis to ensure technical accuracy.
   - If `$ARGUMENTS` is empty, rely entirely on your deep analysis of the code diff to understand **what** changed and **why**.

5. Present the drafted message to the user and explicitly ask: 
   *"Do you want to proceed with this commit message?"*

6. **Wait for user confirmation.**
   - If approved, execute: `git commit -m "<generated_message>"`. Do not include any AI co-authoring metadata strings.
   - If the user provides feedback, adjust the message accordingly before executing.
   - After the commit completes successfully, explicitly ask the user:
     *"Do you want to push these changes to the remote repository?"*
   - Wait for user confirmation.
   - If approved, execute: `git push`.
   - If rejected or feedback is provided, stop or follow the user's instructions.