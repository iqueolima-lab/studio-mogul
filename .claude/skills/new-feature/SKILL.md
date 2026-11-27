---
name: new-feature
description: Guide a new feature from clarification and spec doc to a feature branch with commits. Use when starting a new feature.
disable-model-invocation: true
argument-hint: "[feature-name-or-idea]"
---

1. **Clarify first:** Before writing code or creating branches, ask concise, high-impact questions about scope, edge cases, UI placement, and tycoon economy/state impact. Wait for the user's answers.
2. **Write the spec:** Using GitHub CLI `gh`, write an issue in the repo with:
   - Problem & user story ("As a player, I want...")
3. **Branch & implement:** Ensure working tree is clean, create/switch to a new branch `feature/<kebab-case-feature>` off `dev` (or current base branch), and implement cleanly in React/TypeScript.
4. **Commit:** Make clear, focused commits on the feature branch as logical milestones finish. Do not merge into `dev` yet.
5. **Validate:** After implementing, run the `validate` skill to generate a manual test checklist for the feature. Use it to verify correctness and catch edge cases.
6. Use the `commit` skill to merge the feature branch into `dev` when the feature is validated and ready for dev.