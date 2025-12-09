## 9. Troubleshooting

### Common Issues

#### Issue 1: Migration Script Fails

**Symptom:**
```
bash: scripts/init-project.sh: No such file or directory
```

**Cause:** Scripts not copied or wrong directory

**Solution:**
```bash
# Verify script exists
ls -la scripts/init-project.sh

# If missing, copy from methodology pack
cp -r /path/to/agent-methodology-pack/scripts ./

# Make executable
chmod +x scripts/*.sh
```

#### Issue 2: CLAUDE.md Over 70 Lines

**Symptom:**
```
Validation failed: CLAUDE.md has 127 lines (max 70)
```

**Cause:** Too much inline content

**Solution:**

```bash
# Check current line count
wc -l CLAUDE.md

# Identify what to move
# Move detailed sections to referenced files
# Example:

# Before (inline content):
## Tech Stack
- Frontend: React 18
  - TypeScript 5.0
  - Material-UI 5.11
  - Redux Toolkit 1.9
  - React Router 6.8
- Backend: Node.js 18
  - Express 4.18
  - PostgreSQL 15
  - Prisma 4.11
[... 30 more lines ...]

# After (reference):
## Tech Stack
See @docs/1-BASELINE/architecture/tech-stack.md

# Create the referenced file:
cat > docs/1-BASELINE/architecture/tech-stack.md << 'EOF'
# Technology Stack

## Frontend
- Framework: React 18
- Language: TypeScript 5.0
- UI Library: Material-UI 5.11
[... full details ...]
EOF
```

**General strategy:**
1. Keep only essentials in CLAUDE.md
2. Move details to domain-specific files
3. Use @references liberally
4. Validate: `wc -l CLAUDE.md`

#### Issue 3: Broken References

**Symptom:**
```
Warning: @docs/epic-1.md referenced but not found
```

**Cause:** File moved, renamed, or never created

**Solution:**

```bash
# Find all references in CLAUDE.md
grep "@" CLAUDE.md

# Output might show:
# - @docs/epic-1.md <- BROKEN
# - @PROJECT-STATE.md <- OK
# - @.claude/agents/ORCHESTRATOR.md <- OK

# Fix options:

# Option 1: Create missing file
touch docs/epic-1.md

# Option 2: Update reference to correct path
# Edit CLAUDE.md:
# @docs/epic-1.md -> @docs/2-MANAGEMENT/epics/current/epic-01.md

# Option 3: Remove reference if no longer needed

# Validate
bash scripts/validate-docs.sh
```

#### Issue 4: Git Merge Conflicts

**Symptom:**
```
CONFLICT (content): Merge conflict in docs/README.md
```

**Cause:** Migration branch and main branch diverged

**Solution:**

```bash
# View conflict
git status

# Resolve conflict
# Edit conflicted file, choose correct version
vim docs/README.md

# Look for:
# <<<<<<< HEAD
# [main branch content]
# =======
# [migration branch content]
# >>>>>>> migration/agent-methodology-pack

# Choose one or merge both

# Mark as resolved
git add docs/README.md
git commit -m "Resolve merge conflict in docs/README.md"
```

**Prevention:**
- Keep migration branch up to date: `git merge main`
- Small, frequent commits
- Clear commit messages

#### Issue 5: Lost Documentation During Migration

**Symptom:**
```
Can't find the API documentation anywhere!
```

**Cause:** File moved but location not documented

**Solution:**

```bash
# Search for content
grep -r "API endpoint" docs/

# Find file by name
find . -name "*api*" -o -name "*API*"

# Check git history
git log --all --full-history -- "**/API.md"

# Restore from backup if needed
git show main:docs/API.md > docs/API.md.recovered

# Update location mapping
echo "API.md -> docs/4-DEVELOPMENT/api/README.md" >> MIGRATION-NOTES.md
```

**Prevention:**
- Create MIGRATION-MAP.md before moving files
- Commit frequently
- Use git tags for pre-migration state

#### Issue 6: Team Can't Find Documentation

**Symptom:**
"Where did the setup guide go?"

**Cause:** New BMAD structure unfamiliar

**Solution:**

```bash
# Create finding guide
cat > docs/WHERE-IS-EVERYTHING.md << 'EOF'
# Where Is Everything?

## Quick Finder

| Looking for... | Old Location | New Location |
|----------------|--------------|--------------|
| Setup guide | docs/setup.md | INSTALL.md |
| API docs | docs/api.md | docs/4-DEVELOPMENT/api/README.md |
| Architecture | ARCHITECTURE.md | docs/1-BASELINE/architecture/overview.md |
| Roadmap | docs/roadmap.md | docs/2-MANAGEMENT/roadmap.md |

## Not Sure?

1. Check @docs/00-START-HERE.md
2. Search: `grep -r "keyword" docs/`
3. Ask in #agent-methodology Slack

## Documentation Structure

See @docs/00-START-HERE.md for full BMAD structure explanation.
EOF

# Share with team
# Post in Slack/Teams
# Add to onboarding docs
```

#### Issue 7: Validation Passes but Claude Can't Load Files

**Symptom:**
Claude says "I don't see @PROJECT-STATE.md"

**Cause:** File path issues, working directory mismatch

**Solution:**

```bash
# Verify file exists
ls -la PROJECT-STATE.md

# Check from Claude CLI working directory
cd /path/to/project
pwd  # Note this path

# Ensure Claude CLI running from project root
claude --project /path/to/project

# Test file loading explicitly
echo "@PROJECT-STATE.md" | claude --project /path/to/project

# If still failing, use absolute paths temporarily
# In CLAUDE.md:
@/full/path/to/PROJECT-STATE.md
```

#### Issue 8: State Files Not Updating

**Symptom:**
AGENT-STATE.md shows old information

**Cause:** Agents not updating state, or updates not committed

**Solution:**

```bash
# Check if file was modified recently
ls -l .claude/state/AGENT-STATE.md

# View recent changes
git log -p .claude/state/AGENT-STATE.md

# Manually update
vim .claude/state/AGENT-STATE.md

# Commit update
git add .claude/state/
git commit -m "Update agent state"

# Remind agents to update state
# Add to agent instructions:
echo "
## IMPORTANT
Update @.claude/state/AGENT-STATE.md after completing work
" >> .claude/agents/development/BACKEND-DEV.md
```

### When to Ask for Help

**Ask for help when:**

- ❓ Stuck on same issue >30 minutes
- ❓ Data loss or corruption risk
- ❓ Breaking changes needed
- ❓ Team blocked by migration
- ❓ Unclear how to proceed

**Where to ask:**

1. **Project Issues:** GitHub Issues (if available)
2. **Community:** Discussions forum
3. **Documentation:** Re-read relevant sections
4. **Team:** Internal Slack/Teams channel

**Information to provide:**

```markdown
## Issue Report

**Problem:**
[Clear description]

**Steps Taken:**
1. [Step 1]
2. [Step 2]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Environment:**
- OS: [Windows/Mac/Linux]
- Claude CLI version: [version]
- Project size: [files/LOC]

**Files:**
[Attach relevant files or excerpts]
```

---

