---
name: git-workflow
description: Apply when establishing team branching strategy, PR workflows, and release management.
version: 1.0.0
tokens: ~550
confidence: high
sources:
  - https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
  - https://docs.github.com/en/get-started/quickstart/github-flow
last_validated: 2025-01-10
next_review: 2025-01-24
tags: [git, workflow, branching, collaboration]
---

## When to Use

Apply when establishing team branching strategy, PR workflows, and release management.

## Patterns

### Pattern 1: GitHub Flow (Simple)
```
main ──────●──────●──────●──────●──────
            \    /        \    /
feature-a    ●──●          \  /
                   feature-b ●

Steps:
1. Create branch from main
2. Commit changes
3. Open PR
4. Review + CI
5. Merge to main
6. Deploy
```
Source: https://docs.github.com/en/get-started/quickstart/github-flow

### Pattern 2: Branch Naming
```bash
# Feature branches
feature/user-authentication
feature/JIRA-123-add-search

# Bug fixes
fix/login-redirect-loop
fix/JIRA-456-null-pointer

# Hotfixes (production issues)
hotfix/security-patch

# Releases
release/v1.2.0
```

### Pattern 3: Common Git Commands
```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/my-feature

# Keep branch updated
git fetch origin
git rebase origin/main  # or merge

# Stage and commit
git add -p              # Interactive staging
git commit -m "feat: add user search"

# Push and create PR
git push -u origin feature/my-feature
gh pr create --fill     # GitHub CLI

# After PR merged
git checkout main
git pull origin main
git branch -d feature/my-feature
```

### Pattern 4: Rebase vs Merge
```bash
# Rebase (clean linear history)
git checkout feature-branch
git rebase main
# Resolve conflicts if any
git push --force-with-lease  # Safe force push

# Merge (preserves branch history)
git checkout main
git merge feature-branch
```

**When to use:**
- Rebase: Local feature branches before PR
- Merge: Integrating PRs to main

### Pattern 5: PR Checklist
```markdown
## PR Description
- [ ] Descriptive title (type: description)
- [ ] Linked issue/ticket
- [ ] Summary of changes
- [ ] Screenshots (if UI)

## Before Requesting Review
- [ ] Self-reviewed diff
- [ ] Tests pass locally
- [ ] No console.log / debug code
- [ ] Documentation updated
- [ ] Rebased on latest main
```

### Pattern 6: Release Workflow
```bash
# Create release branch
git checkout -b release/v1.2.0

# Version bump
npm version minor

# Tag and push
git tag v1.2.0
git push origin release/v1.2.0 --tags

# Merge to main
git checkout main
git merge release/v1.2.0
git push origin main
```

## Anti-Patterns

- **Committing to main directly** - Always use branches
- **Large PRs** - Keep under 400 lines if possible
- **Force push to shared branches** - Only on personal branches
- **Merge conflicts in PRs** - Rebase before review

## Verification Checklist

- [ ] Branch created from latest main
- [ ] Commits follow conventional format
- [ ] PR is focused (one feature/fix)
- [ ] CI passes before merge
- [ ] Branch deleted after merge
