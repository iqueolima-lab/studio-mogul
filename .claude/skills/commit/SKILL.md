---
name: commit
description: Stage/commit remaining feature work and merge the current feature branch into dev. Use when a feature is validated and ready for dev.
disable-model-invocation: true
---

1. Check `git status` and current branch. If uncommitted changes remain, summarize them and commit them cleanly to the feature branch first.
2. Check the issue for the feature.
3. Switch to `dev` (create `dev` if it doesn't exist yet), merge the feature branch (`git merge --no-ff <branch>`). Use the issue number in the merge commit message
4. Use `git push` to push the updated `dev` branch to the remote repository.
5. Close the feature issue in the repo.