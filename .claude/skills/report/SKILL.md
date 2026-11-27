---
name: report
description: Collect a structured bug report (steps to reproduce, expected vs actual) and investigate/fix the issue. Use when reporting a bug.
disable-model-invocation: true
argument-hint: "[brief bug summary]"
---

1. If any details are missing, ask the user for:
   - **Steps to reproduce** (exact sequence)
   - **Expected behavior** vs. **Actual behavior**
   - **Context** (screen/tab, game state/cash/week if relevant)
2. Create an issue in the repo with the bug summary, steps to reproduce, expected vs actual behavior, and context. Use GitHub CLI `gh` to create the issue.
3. Create a new branch `bugfix/<kebab-case-summary>` off `the current branch` and implement a fix. 
4. Trace the root cause in the codebase and fix the issue. Make clear, focused commits on the bugfix branch as logical milestones finish. Do not merge yet.
5. After implementing, run the `validate` skill to generate a manual test checklist for the bug fix. Use it to verify correctness and catch edge cases.
6. After validating, merge the bugfix branch into the original branch and close the issue.
