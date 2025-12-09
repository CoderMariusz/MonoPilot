## 2. Prerequisites

### What You Need Before Starting

#### Required

- ✅ **Claude CLI installed and configured**
  ```bash
  claude --version  # Should show version 1.x or higher
  ```

- ✅ **Git repository** (recommended for rollback)
  ```bash
  git status  # Should be in a git repo
  ```

- ✅ **Backup of current project**
  ```bash
  # Create backup
  cp -r /path/to/project /path/to/project-backup
  ```

- ✅ **Clean working directory** (no uncommitted changes)
  ```bash
  git status  # Should show "nothing to commit, working tree clean"
  ```

- ✅ **Agent Methodology Pack downloaded**
  ```bash
  git clone https://github.com/your-org/agent-methodology-pack.git
  ```

#### Recommended

- ✅ **Understanding of current project structure**
  - List all major components
  - Identify key documentation files
  - Map dependencies

- ✅ **Team buy-in** (if working with team)
  - Brief team on changes
  - Schedule migration time
  - Plan handoff sessions

- ✅ **Time blocked** (based on project size)
  - Small: 1-2 hours uninterrupted
  - Medium: Half day
  - Large: 1-3 full days

### Backup Recommendations

**Critical backups:**

```bash
# 1. Full project backup
tar -czf project-backup-$(date +%Y%m%d).tar.gz /path/to/project

# 2. Git commit current state
cd /path/to/project
git add .
git commit -m "Pre-migration snapshot"
git tag pre-migration-$(date +%Y%m%d)

# 3. Export important databases (if applicable)
# Example for PostgreSQL:
pg_dump database_name > backup-$(date +%Y%m%d).sql

# 4. Document current structure
tree -L 3 > structure-before.txt
find . -name "*.md" > docs-before.txt
```

**Verification:**

```bash
# Verify backups exist
ls -lh project-backup-*.tar.gz
git tag | grep pre-migration
```

### Git Considerations

**Create a migration branch:**

```bash
# Create and switch to migration branch
git checkout -b migration/agent-methodology-pack

# This allows easy rollback:
# git checkout main  # if migration fails
```

**Commit strategy:**

1. Initial commit: "Start migration to Agent Methodology Pack"
2. Per-phase commits: "Phase 1: Discovery complete"
3. Final commit: "Migration complete, validated"

**Branching strategy for teams:**

```
main
  └── migration/agent-methodology-pack
        ├── migration/phase-1-discovery
        ├── migration/phase-2-planning
        └── migration/phase-3-execution
```

---

