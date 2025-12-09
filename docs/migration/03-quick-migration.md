## 3. Quick Migration (15 minutes)

For small projects (<50 files), use this fast-track approach.

### Prerequisites Check

```bash
# Verify you have:
cd /path/to/your-project
git status                    # Clean working directory
ls -1 | wc -l                # <50 files
find . -name "*.md" | wc -l  # Count existing docs
```

### Step 1: Copy Methodology Pack (2 min)

```bash
# Navigate to your project
cd /path/to/your-project

# Copy agent methodology pack
cp -r /path/to/agent-methodology-pack/.claude ./
cp -r /path/to/agent-methodology-pack/templates ./
cp -r /path/to/agent-methodology-pack/scripts ./

# Verify copy
ls -la .claude/agents/
```

### Step 2: Create Core Files (3 min)

**Create CLAUDE.md:**

```bash
cat > CLAUDE.md << 'EOF'
# [Your Project Name]

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | [Project Name] |
| Type | [Web App / Mobile / API / etc] |
| Version | [Current Version] |
| Status | Migration in progress |

## Current Focus
See: @PROJECT-STATE.md

## Documentation Map
- **Current State:** @PROJECT-STATE.md
- **Orchestrator:** @.claude/agents/ORCHESTRATOR.md
- **Workflows:** @.claude/workflows/

## Tech Stack
- [Primary Language]
- [Framework]
- [Database]

## Quick Commands
See @scripts/README.md for all commands

---
*Migrated to Agent Methodology Pack on [Date]*
EOF
```

**Create PROJECT-STATE.md:**

```bash
cat > PROJECT-STATE.md << 'EOF'
# Project State

**Project:** [Your Project Name]
**Phase:** Migration / Planning
**Last Updated:** [Today's Date]

## Current Status
- Migrating to Agent Methodology Pack
- Existing codebase: [Brief description]
- Active features: [List main features]

## Active Work
- Migration Phase 1: Complete
- Migration Phase 2: In progress

## Recent Completions
- Installed Agent Methodology Pack
- Created core files

## Next Steps
1. Organize existing docs into BMAD structure
2. Create initial epic for current work
3. Run validation

## Blockers
None

---
*See @.claude/state/TASK-QUEUE.md for detailed tasks*
EOF
```

### Step 3: Initialize State Files (2 min)

```bash
# Create state files
cd .claude/state

cat > AGENT-STATE.md << 'EOF'
# Agent State

**Last Updated:** [Date]

## Active Agents
None - migration in progress

## Available Agents
All agents available for use

## Agent History
- [Date]: Migration started
EOF

cat > TASK-QUEUE.md << 'EOF'
# Task Queue

**Last Updated:** [Date]

## Active Tasks
| Priority | Task | Agent | Status |
|----------|------|-------|--------|
| P0 | Complete migration | Human | In Progress |

## Queued Tasks
| Task | Dependencies |
|------|--------------|
| Organize docs | Migration complete |
| Create first epic | Docs organized |
EOF

# Return to project root
cd ../..
```

### Step 4: Organize Existing Docs (5 min)

**Option A: Automatic Migration (Recommended)**

```bash
# Use migrate-docs.sh for automatic migration
# Dry run first to preview changes:
bash scripts/migrate-docs.sh ./existing-docs --dry-run

# If satisfied, run for real:
bash scripts/migrate-docs.sh ./existing-docs --auto

# This will:
# - Auto-detect file categories (PRD, architecture, API, etc.)
# - Create BMAD folder structure
# - Move files to correct locations
# - Update @references in all files
# - Generate migration report
```

**Option B: Manual Migration (If you prefer control)**

```bash
# Create BMAD structure
mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}
mkdir -p docs/2-MANAGEMENT/{epics/current,sprints}
mkdir -p docs/1-BASELINE/{product,architecture,research}

# Move existing docs (adjust paths as needed)
mv README.md docs/1-BASELINE/product/ 2>/dev/null || true
mv ARCHITECTURE.md docs/1-BASELINE/architecture/ 2>/dev/null || true
mv API.md docs/4-DEVELOPMENT/ 2>/dev/null || true
```

**Create START-HERE:**

```bash
cat > docs/00-START-HERE.md << 'EOF'
# Start Here

## Project Documentation

Migrated to BMAD structure on [Date]

## Structure
- **1-BASELINE** - Requirements and architecture
- **2-MANAGEMENT** - Epics and sprints
- **3-ARCHITECTURE** - Design artifacts
- **4-DEVELOPMENT** - Implementation docs
- **5-ARCHIVE** - Historical documents

## Getting Started
1. Review @PROJECT-STATE.md
2. Check current epics in 2-MANAGEMENT/epics/current/
3. See @CLAUDE.md for project overview
EOF
```

### Step 5: Validate (3 min)

```bash
# Run validation
bash scripts/validate-docs.sh

# Check CLAUDE.md line count
wc -l CLAUDE.md  # Should be <70

# Test with Claude CLI
echo "Quick test:

@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

Please confirm you can see all files and summarize the project."
```

### What You Have Now

After 15 minutes, you should have:

✅ Agent Methodology Pack integrated
✅ Core files created (CLAUDE.md, PROJECT-STATE.md)
✅ State management initialized
✅ BMAD documentation structure
✅ Basic validation passing

### Next Steps

1. **Refine CLAUDE.md** - Add project-specific details
2. **Create first epic** - Document current work as Epic 1
3. **Start using agents** - Invoke ORCHESTRATOR for guidance
4. **Iterate** - Improve structure as you use it

---

