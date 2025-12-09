# Migration Guide

Complete guide for migrating existing projects to the Agent Methodology Pack.

**Version:** 1.0.0
**Last Updated:** 2025-12-05
**Estimated Reading Time:** 20 minutes

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Quick Migration (15 minutes)](#3-quick-migration-15-minutes)
4. [Full Migration (1-3 days)](#4-full-migration-1-3-days)
5. [Migration Phases](#5-migration-phases)
6. [Document Sharding Guide](#6-document-sharding-guide)
7. [BMAD Structure Mapping](#7-bmad-structure-mapping)
8. [Agent Workspace Setup](#8-agent-workspace-setup)
9. [Troubleshooting](#9-troubleshooting)
10. [Migration Checklist](#10-migration-checklist)
11. [Examples](#11-examples)
12. [FAQ](#12-faq)

---

## Available Migration Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `analyze-project.sh` | Analyze existing project, detect tech stack, find large files | `bash scripts/analyze-project.sh /path/to/project` |
| `migrate-docs.sh` | Automatically move docs to BMAD structure | `bash scripts/migrate-docs.sh ./docs --auto` |
| `find-large-files.sh` | Find files >500 lines that need sharding | `bash scripts/find-large-files.sh /path/to/project` |
| `shard-document.sh` | Split large files into smaller chunks | `bash scripts/shard-document.sh file.md --strategy smart` |
| `generate-workspaces.sh` | Create per-agent workspace files | `bash scripts/generate-workspaces.sh /path/to/project` |
| `validate-migration.sh` | Validate migration, with auto-fix option | `bash scripts/validate-migration.sh --fix` |
| `init-interactive.sh` | Interactive wizard (NEW/EXISTING/AUDIT) | `bash scripts/init-interactive.sh` |

**Quick Start:**
```bash
# Interactive mode - asks NEW or EXISTING project
bash scripts/init-interactive.sh
```

---

## 1. Overview

### What is Migration?

Migration is the process of adapting your existing project to use the Agent Methodology Pack's multi-agent development system. This involves:

- Restructuring documentation to the BMAD format
- Creating agent workspace files
- Setting up state management
- Breaking large files into manageable chunks
- Establishing agent workflows

### When to Migrate vs Start Fresh

**Migrate when:**
- ✅ You have an active project with existing code
- ✅ You have documentation you want to preserve
- ✅ You have team members familiar with current structure
- ✅ Project is mid-development (not just starting)
- ✅ You want to improve development workflow

**Start fresh when:**
- ⛔ New project with no code yet
- ⛔ Existing documentation is outdated or incorrect
- ⛔ Major rewrite/refactor planned anyway
- ⛔ Small prototype (<100 lines of code)
- ⛔ No existing team workflows to preserve

**Hybrid approach:**
- Use init-project.sh for structure
- Manually migrate key documentation
- Let agents handle the rest

### Time Estimates by Project Size

| Project Size | Files | LOC | Migration Time | Recommended Approach |
|--------------|-------|-----|----------------|---------------------|
| **Tiny** | <10 | <1K | 15 min | Quick Migration |
| **Small** | 10-50 | 1K-10K | 1-2 hours | Quick Migration + validation |
| **Medium** | 50-200 | 10K-50K | 4-8 hours | Phase 1-2 in 1 day |
| **Large** | 200-500 | 50K-200K | 1-3 days | Full phased approach |
| **Enterprise** | 500+ | 200K+ | 1-2 weeks | Incremental migration |

**Note:** Times assume one person migrating. Add 50% time for team coordination.

---

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

## 4. Full Migration (1-3 days)

For larger projects (50+ files), use this comprehensive phased approach.

### Overview

Full migration is broken into 4 phases:

1. **Discovery** (2-4 hours) - Understand current state
2. **Planning** (2-4 hours) - Design migration strategy
3. **Execution** (1-2 days) - Perform migration
4. **Verification** (2-4 hours) - Validate and test

**Total time:** 1-3 days depending on project size and complexity

### Week-by-Week Plan

**For very large projects, spread over 2 weeks:**

#### Week 1: Foundation

**Monday-Tuesday:** Discovery Phase
- Audit project structure
- Document current state
- Identify all documentation
- Map dependencies

**Wednesday-Thursday:** Planning Phase
- Design migration strategy
- Create file mapping
- Plan document sharding
- Schedule execution

**Friday:** Setup
- Install methodology pack
- Create core files
- Initialize state management
- Team briefing

#### Week 2: Execution & Validation

**Monday-Wednesday:** Execution Phase
- Migrate documentation
- Shard large files
- Setup agent workspaces
- Create missing docs

**Thursday:** Verification Phase
- Run validation scripts
- Test agent workflows
- Fix broken references
- Team training

**Friday:** Launch
- Final validation
- Team onboarding
- First sprint planning
- Retrospective

### Team Coordination

**For team migrations:**

1. **Communication Plan**
   - Announce migration 1 week in advance
   - Daily standup during migration
   - Slack/Teams channel for questions
   - Document all decisions

2. **Roles**
   - **Migration Lead:** Coordinates overall effort
   - **Documentation Lead:** Handles doc migration
   - **Technical Lead:** Code structure changes
   - **Team Members:** Review and validate

3. **Parallel Work**
   - Freeze new features during migration
   - Bug fixes on separate branch
   - Merge strategy for ongoing work

4. **Training Schedule**
   ```
   Day 1: Introduction to Agent Methodology Pack (1 hour)
   Day 2: Agent workflows demonstration (1 hour)
   Day 3: Hands-on practice session (2 hours)
   Day 4: Team Q&A and refinement (1 hour)
   ```

### Risk Management

**Common risks and mitigation:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Lost documentation | Medium | High | Git backups, incremental commits |
| Team resistance | Medium | Medium | Early training, show benefits |
| Broken workflows | High | Low | Gradual adoption, fallback plan |
| Time overrun | Medium | Medium | Buffer time, phased approach |
| Tool incompatibility | Low | High | Test early, have alternatives |

---

## 5. Migration Phases

### Phase 1: Discovery

**Goal:** Understand current project state and identify what needs migration.

**Time:** 2-4 hours (small-medium projects), 1 day (large projects)

#### Step 1.1: Run Analysis Script

```bash
# Run project analysis script
bash scripts/analyze-project.sh /path/to/your-project

# This creates:
# - .claude/migration/AUDIT-REPORT.md - Full project analysis
# - .claude/migration/FILE-MAP.md - Category mapping for all files
# - Identifies large files needing sharding
# - Detects tech stack automatically
```

**Alternative: Manual analysis (if you prefer):**

```bash
# Create analysis manually
cd /path/to/your-project

# Count files by type
echo "=== Project Analysis ===" > AUDIT-REPORT.md
echo "" >> AUDIT-REPORT.md
echo "## File Counts" >> AUDIT-REPORT.md
find . -type f | wc -l >> AUDIT-REPORT.md
find . -name "*.md" | wc -l >> AUDIT-REPORT.md
find . -name "*.js" -o -name "*.ts" | wc -l >> AUDIT-REPORT.md

# List large files
echo "" >> AUDIT-REPORT.md
echo "## Large Files (>500 lines)" >> AUDIT-REPORT.md
find . -type f -name "*.md" -exec wc -l {} + | sort -rn | head -20 >> AUDIT-REPORT.md

# List all markdown files
echo "" >> AUDIT-REPORT.md
echo "## All Documentation" >> AUDIT-REPORT.md
find . -name "*.md" -type f >> AUDIT-REPORT.md
```

#### Step 1.2: Document Current Structure

Create `CURRENT-STRUCTURE.md`:

```markdown
# Current Project Structure

## Overview
[Brief description of project]

## Directory Layout
```
[Paste output of: tree -L 3]
```

## Documentation Files
| File | Location | Purpose | Size (lines) |
|------|----------|---------|--------------|
| README.md | root | Overview | 150 |
| API.md | docs/ | API docs | 450 |
| ARCHITECTURE.md | docs/ | System design | 320 |
[... continue for all docs ...]

## Code Organization
- Source: [path]
- Tests: [path]
- Config: [path]

## Current Workflows
[Describe how team currently works]

## Pain Points
[List current challenges]
```

#### Step 1.3: Identify Migration Candidates

Create `MIGRATION-CANDIDATES.md`:

```markdown
# Migration Candidates

## Documentation to Migrate

### High Priority
- [ ] README.md → docs/1-BASELINE/product/overview.md
- [ ] ARCHITECTURE.md → docs/1-BASELINE/architecture/overview.md
- [ ] API.md → docs/4-DEVELOPMENT/api/

### Medium Priority
- [ ] CONTRIBUTING.md → docs/4-DEVELOPMENT/guides/
- [ ] CHANGELOG.md → Keep in root

### Low Priority
- [ ] Old meeting notes → docs/5-ARCHIVE/

## Files to Shard (>300 lines)
- [ ] README.md (450 lines) → Split into multiple files
- [ ] API.md (780 lines) → Split by endpoint groups
- [ ] ARCHITECTURE.md (520 lines) → Split by component

## Files to Create
- [ ] CLAUDE.md
- [ ] PROJECT-STATE.md
- [ ] Epic files for current features
- [ ] Sprint documentation
```

#### Step 1.4: Review AUDIT-REPORT.md

Analyze the audit report:

- **File counts:** Understand project size
- **Large files:** Identify sharding candidates
- **Documentation gaps:** What's missing?
- **Structure issues:** Inconsistencies to fix

**Decision points:**

- Keep existing structure and add methodology pack?
- Full restructure to BMAD?
- Hybrid approach?

### Phase 2: Planning

**Goal:** Create detailed migration plan and file mapping.

**Time:** 2-4 hours

#### Step 2.1: Review MIGRATION-PLAN.md Template

The methodology pack should generate `MIGRATION-PLAN.md`:

```markdown
# Migration Plan

## Migration Strategy
- [ ] Approach: [Full / Incremental / Hybrid]
- [ ] Timeline: [Date range]
- [ ] Team size: [N people]

## File Mapping

### Documentation Migration
| Current Location | New Location | Action | Priority |
|------------------|--------------|--------|----------|
| README.md | docs/1-BASELINE/product/overview.md | Move + shard | P0 |
| ARCHITECTURE.md | docs/1-BASELINE/architecture/ | Move + shard | P0 |
| API.md | docs/4-DEVELOPMENT/api/ | Move + shard | P1 |

### Files to Create
| File | Purpose | Template | Priority |
|------|---------|----------|----------|
| CLAUDE.md | Project context | Yes | P0 |
| PROJECT-STATE.md | Current state | Yes | P0 |
| Epic 1 | Current work | Yes | P0 |

## Sharding Strategy
[Document how large files will be split]

## Validation Criteria
- [ ] All files referenced in CLAUDE.md exist
- [ ] CLAUDE.md <70 lines
- [ ] All @references valid
- [ ] Validation script passes
- [ ] Team can use agents

## Rollback Plan
[How to undo migration if needed]
```

#### Step 2.2: Decide What to Migrate

**Decision matrix:**

| Document | Migrate? | Priority | Reason |
|----------|----------|----------|--------|
| README.md | ✅ Yes | P0 | Core overview |
| Old meeting notes | ⛔ No | - | Outdated |
| API docs | ✅ Yes | P1 | Still relevant |
| v1 architecture | 🟡 Archive | P2 | Historical reference |

**Rules of thumb:**

- ✅ **Migrate:** Current, accurate, actively used
- 🟡 **Archive:** Historical, reference only
- ⛔ **Skip:** Outdated, wrong, redundant

#### Step 2.3: Set Priorities

Use MoSCoW method:

- **Must Have (P0):** Project can't function without
- **Should Have (P1):** Important but not critical
- **Could Have (P2):** Nice to have
- **Won't Have (P3):** Explicitly out of scope

**Example prioritization:**

```markdown
## P0 (Must Have) - Day 1
- CLAUDE.md
- PROJECT-STATE.md
- Core architecture docs
- Current epic documentation

## P1 (Should Have) - Day 2
- API documentation
- Development guides
- Test documentation

## P2 (Could Have) - Day 3
- Historical decisions
- Old sprint notes
- Research documents

## P3 (Won't Have)
- Old v1 documentation
- Deprecated API docs
- Unused templates
```

#### Step 2.4: Create File Mapping Table

Detailed mapping for execution phase:

```markdown
## Detailed File Mapping

| # | Current | New | Action | Lines | Shard? | Notes |
|---|---------|-----|--------|-------|--------|-------|
| 1 | README.md | docs/1-BASELINE/product/overview.md | Move+Edit | 450 | Yes | Split overview from setup |
| 2 | docs/setup.md | INSTALL.md | Move | 120 | No | Promote to root |
| 3 | ARCHITECTURE.md | docs/1-BASELINE/architecture/overview.md | Move+Shard | 520 | Yes | Split by component |
| 4 | docs/api/*.md | docs/4-DEVELOPMENT/api/ | Move | Varies | Some | Large files only |
```

### Phase 3: Execution

**Goal:** Perform the actual migration according to plan.

**Time:** 1-2 days (varies by project size)

#### Step 3.1: Install Methodology Pack

```bash
# Navigate to your project
cd /path/to/your-project

# Install as submodule (recommended)
git submodule add https://github.com/your-org/agent-methodology-pack.git .agent-pack
git submodule update --init

# OR copy directly
cp -r /path/to/agent-methodology-pack/.claude ./
cp -r /path/to/agent-methodology-pack/scripts ./
cp -r /path/to/agent-methodology-pack/templates ./
```

#### Step 3.2: Create Core Files

**CLAUDE.md:**

```bash
# Start from template
cp templates/CLAUDE.md.template CLAUDE.md

# Edit to match your project
vim CLAUDE.md
```

**Best practices for CLAUDE.md:**

1. **Keep it under 70 lines**
   - Use @references liberally
   - No inline details
   - Bullet points, not paragraphs

2. **Include only essentials:**
   - Project name and type
   - Current phase/sprint
   - Tech stack (brief)
   - Key file references

3. **Example:**

```markdown
# MyProject - E-Commerce Platform

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | MyProject |
| Type | Web Application (SaaS) |
| Version | 2.3.1 |
| Status | Active Development |

## Current Focus
See: @PROJECT-STATE.md

## Documentation Map
- **Overview:** @docs/1-BASELINE/product/overview.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md
- **Current Epic:** @docs/2-MANAGEMENT/epics/current/epic-04.md
- **API Docs:** @docs/4-DEVELOPMENT/api/

## Tech Stack
- Frontend: React 18 + TypeScript
- Backend: Node.js + Express + PostgreSQL
- Deployment: Docker + AWS

## Agent System
- **Orchestrator:** @.claude/agents/ORCHESTRATOR.md
- **Workflows:** @.claude/workflows/
- **State:** @.claude/state/AGENT-STATE.md

## Current Sprint
Sprint 8 | Epic 4: Payment Integration
See: @docs/2-MANAGEMENT/sprints/sprint-08.md

---
*Agent Methodology Pack v1.0.0*
```

**PROJECT-STATE.md:**

```markdown
# Project State

**Project:** MyProject - E-Commerce Platform
**Phase:** Development
**Last Updated:** 2025-12-05

## Current Status
- Sprint 8 of 10 (planned)
- Epic 4: Payment Integration
- 3 stories in progress, 2 completed this sprint

## Active Work

### Epic 4: Payment Integration
- Story 4.1: Stripe integration - **Complete** ✅
- Story 4.2: Payment UI components - **In Progress** (Frontend Dev)
- Story 4.3: Refund workflow - **In Progress** (Backend Dev)
- Story 4.4: Payment history - **Queued**

## Recent Completions
- 2025-12-04: Story 4.1 completed and merged
- 2025-12-03: Epic 3 (User Profiles) completed
- 2025-12-01: Sprint 7 retrospective held

## Next Steps
1. Complete Story 4.2 (today)
2. Complete Story 4.3 (tomorrow)
3. Begin Story 4.4 (end of week)
4. Sprint 8 review (Friday)

## Blockers
- Story 4.3 waiting on Stripe API sandbox access (requested 12/04)

## Metrics
- Sprint velocity: 13 story points/sprint
- Test coverage: 87%
- Bug count: 3 (all P2)

---
*See @.claude/state/TASK-QUEUE.md for detailed task queue*
```

#### Step 3.3: Migrate Documentation

**Option A: Automatic Migration (Recommended)**

```bash
# Use migrate-docs.sh to automatically move files to BMAD structure
# Based on FILE-MAP.md from analyze-project.sh

# 1. Preview migration (dry run)
bash scripts/migrate-docs.sh /path/to/existing-docs --dry-run

# 2. Execute migration automatically
bash scripts/migrate-docs.sh /path/to/existing-docs --auto

# This will:
# - Create BMAD folder structure automatically
# - Move files to correct category (detects PRD, architecture, API, etc.)
# - Update all @references in moved files
# - Generate MIGRATION-REPORT.md with summary
```

**Option B: Manual Migration (If you prefer control)**

```bash
# 1. Create BMAD structure
mkdir -p docs/{1-BASELINE/{product,architecture,research},2-MANAGEMENT/{epics/{current,completed},sprints},3-ARCHITECTURE/ux/{flows,wireframes,specs},4-DEVELOPMENT/{api,guides,notes},5-ARCHIVE}

# 2. Move files manually
mv README.md docs/1-BASELINE/product/overview.md
mv ARCHITECTURE.md docs/1-BASELINE/architecture/overview.md
mv docs/api docs/4-DEVELOPMENT/api
mv old-docs/* docs/5-ARCHIVE/
```

#### Step 3.4: Shard Large Files

**Use shard-document.sh for automatic sharding:**

```bash
# Find large files first
bash scripts/find-large-files.sh /path/to/project

# Shard a specific large file
bash scripts/shard-document.sh docs/large-file.md --strategy smart

# This creates:
# - docs/large-file/00-index.md (table of contents)
# - docs/large-file/01-section-name.md
# - docs/large-file/02-section-name.md
# - etc.
```

**Strategies available:**
- `heading` - Split at H2 headings (default)
- `fixed` - Split every N lines (--lines 100)
- `smart` - Intelligent split by content type

See [Section 6: Document Sharding Guide](#6-document-sharding-guide) for detailed instructions.

#### Step 3.5: Create Missing Files

Based on MIGRATION-PLAN.md, create files that don't exist:

**Epic files for current features:**

```bash
# Create Epic 4 (current work)
cat > docs/2-MANAGEMENT/epics/current/epic-04-payment-integration.md << 'EOF'
# Epic 4: Payment Integration

## Overview
Integrate payment processing using Stripe API.

## Goal
Enable users to purchase products with credit card payments.

## Stories
- [x] 4.1: Stripe API integration
- [ ] 4.2: Payment UI components
- [ ] 4.3: Refund workflow
- [ ] 4.4: Payment history

## Acceptance Criteria
- User can complete purchase
- Refunds are processed correctly
- Payment history is visible

## Status
**In Progress** - 2 of 4 stories complete

---
*Epic started: 2025-11-28*
*Target completion: 2025-12-15*
EOF
```

**Sprint documentation:**

```bash
# Create Sprint 8 doc
cat > docs/2-MANAGEMENT/sprints/sprint-08.md << 'EOF'
# Sprint 8

**Duration:** 2025-12-02 to 2025-12-13 (2 weeks)
**Sprint Goal:** Complete payment integration MVP

## Committed Stories
- [x] Story 4.1: Stripe integration (8 pts)
- [ ] Story 4.2: Payment UI (5 pts)
- [ ] Story 4.3: Refund workflow (5 pts)
- [ ] Story 4.4: Payment history (3 pts)

**Total:** 21 points (on track for 20-point velocity)

## Daily Updates
See @.claude/state/TASK-QUEUE.md

## Retrospective
[To be held on 2025-12-13]

---
EOF
```

#### Step 3.6: Setup Agent Workspaces

**Use generate-workspaces.sh for automatic setup:**

```bash
# Generate per-agent workspace files with relevant file links
bash scripts/generate-workspaces.sh /path/to/your-project

# This creates for each agent:
# - .claude/state/workspaces/BACKEND-DEV/CONTEXT.md (relevant files)
# - .claude/state/workspaces/BACKEND-DEV/RECENT-WORK.md (history)
# - .claude/state/workspaces/BACKEND-DEV/NOTES.md (agent-specific notes)
```

**Initialize core state files:**

```bash
cd .claude/state

# AGENT-STATE.md
cat > AGENT-STATE.md << 'EOF'
# Agent State

**Last Updated:** 2025-12-05 10:30

## Active Agents

| Agent | Task | Story | Started | ETA |
|-------|------|-------|---------|-----|
| FRONTEND-DEV | Payment UI components | 4.2 | 12/05 09:00 | 12/05 15:00 |
| BACKEND-DEV | Refund workflow | 4.3 | 12/05 08:30 | 12/06 12:00 |

## Available Agents
All other agents ready for tasks

## Recent Agent History
- 12/04: SENIOR-DEV completed Story 4.1
- 12/04: CODE-REVIEWER approved Story 4.1
- 12/04: QA-AGENT validated Story 4.1
EOF

# TASK-QUEUE.md
cat > TASK-QUEUE.md << 'EOF'
# Task Queue

**Last Updated:** 2025-12-05 10:30

## Active Tasks
| Priority | Agent | Task | Story | Status |
|----------|-------|------|-------|--------|
| P0 | FRONTEND-DEV | Build payment form UI | 4.2 | In Progress |
| P0 | BACKEND-DEV | Implement refund API | 4.3 | In Progress |

## Queued Tasks
| Priority | Task | Story | Assigned To | Dependencies |
|----------|------|-------|-------------|--------------|
| P1 | Payment history UI | 4.4 | FRONTEND-DEV | 4.2, 4.3 |
| P1 | Integration tests | 4.4 | QA-AGENT | 4.2, 4.3 |

## Blocked Tasks
None

---
EOF
```

### Phase 4: Verification

**Goal:** Validate migration and ensure everything works.

**Time:** 2-4 hours

#### Step 4.1: Run Validation

```bash
# 1. Validate pack structure
bash scripts/validate-docs.sh

# 2. Validate migration specifically (includes auto-fix option)
bash scripts/validate-migration.sh

# Or with auto-fix for simple issues:
bash scripts/validate-migration.sh --fix

# Expected output:
# ✅ CLAUDE.md exists and <70 lines
# ✅ PROJECT-STATE.md exists
# ✅ BMAD structure complete
# ✅ All @references valid
# ✅ No large files (>500 lines)
# ✅ Agent workspaces initialized
```

**Fix common issues:**

```bash
# validate-migration.sh can auto-fix:
# - Create missing directories
# - Fix simple @references
# - Generate missing state files

# Manual fixes needed for:
# - CLAUDE.md too long → move content to referenced files
# - Large files → use shard-document.sh
# - Broken complex references → update manually
```

#### Step 4.2: Test Agent Workflows

**Test 1: Orchestrator**

```bash
claude --project . "
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

Analyze current state and recommend next action."
```

**Expected:** Orchestrator should:
- Load all files successfully
- Identify active work (Story 4.2, 4.3)
- Recommend next steps
- Provide task queue update

**Test 2: Development Agent**

```bash
claude --project . "
@CLAUDE.md
@docs/2-MANAGEMENT/epics/current/epic-04-payment-integration.md
@.claude/agents/development/FRONTEND-DEV.md

Review Story 4.2 and provide implementation plan."
```

**Expected:** Frontend Dev should:
- Understand story context
- Provide component breakdown
- Suggest testing approach
- Follow TDD workflow

**Test 3: Reference Resolution**

Verify all @references work:

```bash
# Test each reference in CLAUDE.md
# Should load without errors
```

#### Step 4.3: Fix Broken References

**Common issues:**

1. **Wrong file path**
   ```markdown
   # Wrong:
   @.claude/agents/pm-agent.md

   # Correct:
   @.claude/agents/planning/PM-AGENT.md
   ```

2. **Case sensitivity (Linux/macOS)**
   ```markdown
   # Wrong:
   @PROJECT-state.md

   # Correct:
   @PROJECT-STATE.md
   ```

3. **Missing files**
   ```markdown
   # Error: @docs/1-BASELINE/product/PRD.md not found

   # Solution: Create the file
   touch docs/1-BASELINE/product/PRD.md
   ```

#### Step 4.4: Team Onboarding

**Create onboarding doc:**

```markdown
# Team Onboarding: Agent Methodology Pack

## What Changed?

1. **New structure:** Documentation now follows BMAD format
2. **Agent system:** We use AI agents for development workflow
3. **New files:** CLAUDE.md, PROJECT-STATE.md are our entry points

## Quick Start for Team

### Finding Documentation
- **Before:** README.md had everything
- **After:** See docs/00-START-HERE.md for navigation

### Starting Work
1. Read @PROJECT-STATE.md for current sprint
2. Check @.claude/state/TASK-QUEUE.md for tasks
3. Load appropriate agent for your work

### Examples

**Starting a story:**
```
@CLAUDE.md
@docs/2-MANAGEMENT/epics/current/epic-04-payment-integration.md
@.claude/agents/development/BACKEND-DEV.md

I'm working on Story 4.3: Refund workflow. Please help me implement.
```

**Code review:**
```
@CLAUDE.md
@.claude/agents/quality/CODE-REVIEWER.md

Review my changes in src/payments/refund.ts
```

## Training Sessions

- **Session 1:** Overview and structure (30 min)
- **Session 2:** Using agents (1 hour)
- **Session 3:** Q&A and practice (30 min)

## Support

Ask questions in #agent-methodology Slack channel
```

---

## 6. Document Sharding Guide

### Why Shard Documents?

**Sharding** means splitting large documents into smaller, focused files.

**Benefits:**

- ✅ **Token efficiency:** Load only what you need
- ✅ **Better organization:** Logical separation of concerns
- ✅ **Easier maintenance:** Update small sections
- ✅ **Faster loading:** Smaller files load quicker
- ✅ **Clearer context:** Each file has single purpose

**When to shard:**

| Document Size | Action | Reason |
|---------------|--------|--------|
| <100 lines | ✅ Keep as-is | Small enough |
| 100-300 lines | 🟡 Consider sharding | Getting large |
| 300-500 lines | 🟠 Should shard | Hard to navigate |
| >500 lines | 🔴 Must shard | Too large |

**CLAUDE.md exception:** Must be <70 lines regardless

### How to Identify Candidates

**Run analysis:**

```bash
# Find large markdown files
find . -name "*.md" -type f -exec wc -l {} + | sort -rn | head -20

# Output shows:
# 1247 ./docs/API.md          <- MUST shard
#  823 ./README.md             <- MUST shard
#  456 ./ARCHITECTURE.md       <- Should shard
#  287 ./CONTRIBUTING.md       <- Consider sharding
```

**Manual review:**

Look for documents with multiple distinct sections:

```markdown
# README.md (850 lines) - TOO LARGE

## Overview (50 lines)
## Features (200 lines)
## Installation (150 lines)
## Quick Start (100 lines)
## API Reference (300 lines)
## Contributing (50 lines)

⬇️ SHARD INTO ⬇️

# 1. docs/1-BASELINE/product/overview.md (60 lines)
## Overview
## Features

# 2. INSTALL.md (150 lines)
## Installation

# 3. QUICK-START.md (100 lines)
## Quick Start

# 4. docs/4-DEVELOPMENT/api/README.md (300 lines)
## API Reference

# 5. docs/4-DEVELOPMENT/guides/contributing.md (50 lines)
## Contributing
```

### Sharding Best Practices

**1. Logical boundaries**

Split by conceptual sections, not arbitrary line counts:

✅ **Good:**
```
- product-overview.md (Product description)
- features.md (Feature list)
- architecture-overview.md (High-level design)
- database-schema.md (Data model)
```

⛔ **Bad:**
```
- part-1.md (First 300 lines)
- part-2.md (Next 300 lines)
- part-3.md (Remaining lines)
```

**2. Descriptive names**

File names should indicate content:

✅ **Good:**
```
api-authentication.md
api-user-endpoints.md
api-payment-endpoints.md
```

⛔ **Bad:**
```
api-1.md
api-2.md
api-3.md
```

**3. Clear hierarchy**

Use folder structure to group related shards:

```
docs/4-DEVELOPMENT/api/
├── README.md           # Overview + index
├── authentication.md
├── endpoints/
│   ├── users.md
│   ├── payments.md
│   ├── orders.md
│   └── analytics.md
└── webhooks/
    ├── payment-events.md
    └── user-events.md
```

**4. Index files**

Create README.md in each folder as index:

```markdown
# API Documentation

## Contents

- [Authentication](authentication.md) - API key and JWT auth
- [User Endpoints](endpoints/users.md) - User CRUD operations
- [Payment Endpoints](endpoints/payments.md) - Payment processing
- [Order Endpoints](endpoints/orders.md) - Order management
- [Webhooks](webhooks/) - Event notifications

## Quick Start

See @docs/QUICK-START.md for getting started with the API.

## Authentication

All endpoints require authentication. See [authentication.md](authentication.md).
```

### Example Before/After

**Before: README.md (820 lines)**

```markdown
# MyProject - E-Commerce Platform

## Table of Contents
[50 lines of TOC]

## Overview
[100 lines describing product]

## Features
[150 lines listing features]

## Architecture
[200 lines of system design]

## Installation
### Prerequisites
### Step 1: Clone
### Step 2: Install
### Step 3: Configure
[120 lines total]

## Quick Start
[80 lines of tutorial]

## API Reference
### Authentication
### User Endpoints
### Product Endpoints
[200 lines total]

## Contributing
[40 lines]

## License
[10 lines]
```

**After: Sharded into 8 files**

**1. Root: CLAUDE.md (45 lines)**
```markdown
# MyProject - E-Commerce Platform

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | MyProject |
| Type | E-Commerce SaaS |
| Status | Production |

## Documentation Map
- **Overview:** @docs/1-BASELINE/product/overview.md
- **Features:** @docs/1-BASELINE/product/features.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md
- **Installation:** @INSTALL.md
- **Quick Start:** @QUICK-START.md
- **API:** @docs/4-DEVELOPMENT/api/README.md

## Tech Stack
React + Node.js + PostgreSQL + Docker

## Current State
@PROJECT-STATE.md

---
*Agent Methodology Pack v1.0.0*
```

**2. docs/1-BASELINE/product/overview.md (100 lines)**
```markdown
# MyProject Overview

## What is MyProject?

[Product description]

## Target Users

[User personas]

## Value Proposition

[Key benefits]

## Market Position

[Competitive analysis]
```

**3. docs/1-BASELINE/product/features.md (150 lines)**
```markdown
# Features

## Core Features

### User Management
- User registration
- Profile management
- Authentication

### Product Catalog
- Product browsing
- Search and filters
- Categories

[... etc ...]
```

**4. docs/1-BASELINE/architecture/overview.md (200 lines)**
```markdown
# Architecture Overview

## System Design

[High-level architecture]

## Components

[Component descriptions]

## Data Flow

[Data flow diagrams]

## Infrastructure

[Infrastructure overview]
```

**5. INSTALL.md (120 lines)**
```markdown
# Installation Guide

## Prerequisites

[Requirements]

## Installation Steps

### Step 1: Clone Repository
```bash
git clone [repo]
```

### Step 2: Install Dependencies
```bash
npm install
```

[... etc ...]
```

**6. QUICK-START.md (80 lines)**
```markdown
# Quick Start

Get up and running in 5 minutes.

## 1. Install
[Quick install]

## 2. Configure
[Basic config]

## 3. Run
```bash
npm start
```

## 4. Test
[First steps]
```

**7. docs/4-DEVELOPMENT/api/README.md (200 lines)**
```markdown
# API Reference

## Overview
[API overview]

## Authentication
See [authentication.md](authentication.md)

## Endpoints

- [User Endpoints](endpoints/users.md)
- [Product Endpoints](endpoints/products.md)
- [Order Endpoints](endpoints/orders.md)

[... details ...]
```

**8. docs/4-DEVELOPMENT/guides/contributing.md (40 lines)**
```markdown
# Contributing Guide

## How to Contribute

[Contribution process]

## Code Standards

[Coding standards]

## Pull Request Process

[PR guidelines]
```

**Benefits of sharding:**

- **Before:** 820-line monolith, hard to navigate
- **After:** 8 focused files, clear purpose each
- **CLAUDE.md:** 45 lines (under 70 limit) ✅
- **Token usage:** Load only needed sections
- **Maintenance:** Update specific sections easily

### Sharding Workflow

**Step-by-step process:**

```bash
# 1. Make backup
cp README.md README.md.backup

# 2. Analyze structure
# Identify logical sections in document

# 3. Create target files
touch docs/1-BASELINE/product/overview.md
touch docs/1-BASELINE/product/features.md
touch INSTALL.md
touch QUICK-START.md

# 4. Copy content section by section
# Use editor to copy each section to appropriate file

# 5. Create index (new README.md if sharding README)
cat > README.md << 'EOF'
# MyProject

Quick links:
- [Overview](docs/1-BASELINE/product/overview.md)
- [Installation](INSTALL.md)
- [Quick Start](QUICK-START.md)

See @CLAUDE.md for full documentation map.
EOF

# 6. Update references
# Update any docs that referenced old structure

# 7. Validate
bash scripts/validate-docs.sh
```

---

## 7. BMAD Structure Mapping

### What is BMAD?

**BMAD** = **B**aseline, **M**anagement, **A**rchitecture, **D**evelopment

A documentation organization pattern that separates concerns:

- **1-BASELINE:** Foundation (requirements, architecture, research)
- **2-MANAGEMENT:** Execution (epics, stories, sprints)
- **3-ARCHITECTURE:** Design (UX, wireframes, specs)
- **4-DEVELOPMENT:** Implementation (code docs, APIs, guides)
- **5-ARCHIVE:** History (old sprints, deprecated docs)

### Mapping Common Structures to BMAD

#### Typical Project → BMAD Mapping

| Your Current File | BMAD Location | Notes |
|-------------------|---------------|-------|
| **Root Files** |  |  |
| README.md | docs/1-BASELINE/product/overview.md | Product overview |
| CHANGELOG.md | Keep in root | Version history |
| LICENSE | Keep in root | Legal |
| .gitignore | Keep in root | Config |
| **Documentation** |  |  |
| docs/overview.md | docs/1-BASELINE/product/overview.md | Product info |
| docs/architecture.md | docs/1-BASELINE/architecture/overview.md | System design |
| docs/database.md | docs/1-BASELINE/architecture/database-schema.md | Data model |
| docs/requirements.md | docs/1-BASELINE/product/requirements.md | Requirements |
| docs/api.md | docs/4-DEVELOPMENT/api/README.md | API docs |
| docs/setup.md | INSTALL.md → root | Installation |
| docs/tutorial.md | QUICK-START.md → root | Quick start |
| **Project Management** |  |  |
| docs/roadmap.md | docs/2-MANAGEMENT/roadmap.md | Product roadmap |
| docs/backlog.md | docs/2-MANAGEMENT/backlog.md | Story backlog |
| docs/sprint-notes.md | docs/2-MANAGEMENT/sprints/sprint-NN.md | Sprint docs |
| **Design** |  |  |
| docs/ux/*.png | docs/3-ARCHITECTURE/ux/wireframes/ | Wireframes |
| docs/user-flows.md | docs/3-ARCHITECTURE/ux/flows/ | User flows |
| **Development** |  |  |
| docs/dev-guide.md | docs/4-DEVELOPMENT/guides/README.md | Dev guide |
| docs/testing.md | docs/4-DEVELOPMENT/guides/testing.md | Test guide |
| docs/deployment.md | docs/4-DEVELOPMENT/guides/deployment.md | Deploy guide |
| docs/contributing.md | docs/4-DEVELOPMENT/guides/contributing.md | Contribution |
| **Archive** |  |  |
| docs/old-* | docs/5-ARCHIVE/ | Old versions |
| docs/deprecated-* | docs/5-ARCHIVE/deprecated/ | Deprecated |

#### Framework-Specific Mappings

**React/Vue/Angular Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| src/README.md | docs/4-DEVELOPMENT/code-structure.md |
| docs/components.md | docs/3-ARCHITECTURE/ux/specs/components.md |
| docs/state-management.md | docs/1-BASELINE/architecture/state-management.md |
| docs/routing.md | docs/1-BASELINE/architecture/routing.md |
| .storybook/README.md | docs/4-DEVELOPMENT/storybook.md |

**Node.js/Express API Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| docs/api-spec.md | docs/4-DEVELOPMENT/api/README.md |
| docs/authentication.md | docs/4-DEVELOPMENT/api/authentication.md |
| docs/database.md | docs/1-BASELINE/architecture/database-schema.md |
| docs/deployment.md | docs/4-DEVELOPMENT/guides/deployment.md |

**Python/Django Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| docs/models.md | docs/1-BASELINE/architecture/data-models.md |
| docs/views.md | docs/4-DEVELOPMENT/views.md |
| docs/admin.md | docs/4-DEVELOPMENT/admin-guide.md |
| docs/deployment.md | docs/4-DEVELOPMENT/guides/deployment.md |

**Mobile (React Native / Flutter) Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| docs/screens.md | docs/3-ARCHITECTURE/ux/specs/screens.md |
| docs/navigation.md | docs/1-BASELINE/architecture/navigation.md |
| docs/state.md | docs/1-BASELINE/architecture/state-management.md |
| docs/build.md | docs/4-DEVELOPMENT/guides/building.md |

#### Decision Tree: Where Does This Go?

```
Is this document about...

├─ What we're building & why?
│  └─ docs/1-BASELINE/product/
│
├─ How the system is designed?
│  └─ docs/1-BASELINE/architecture/
│
├─ What we learned from research?
│  └─ docs/1-BASELINE/research/
│
├─ What features we're building (epics/stories)?
│  └─ docs/2-MANAGEMENT/epics/
│
├─ Sprint planning & tracking?
│  └─ docs/2-MANAGEMENT/sprints/
│
├─ User interface design?
│  └─ docs/3-ARCHITECTURE/ux/
│
├─ How to implement/code/deploy?
│  └─ docs/4-DEVELOPMENT/
│
└─ Old/deprecated/historical?
   └─ docs/5-ARCHIVE/
```

### Creating BMAD Structure

```bash
# Full BMAD structure
mkdir -p docs/{1-BASELINE/{product,architecture,research},2-MANAGEMENT/{epics/{current,completed},sprints},3-ARCHITECTURE/ux/{flows,wireframes,specs},4-DEVELOPMENT/{api,guides,notes},5-ARCHIVE/{old-sprints,deprecated}}

# Create index file
cat > docs/00-START-HERE.md << 'EOF'
# Start Here

## Documentation Structure (BMAD)

### 1-BASELINE - What & Why
Foundation documents defining the product and system.

- **product/** - PRD, features, requirements
- **architecture/** - System design, ADRs, schemas
- **research/** - User research, technical research

### 2-MANAGEMENT - Plan & Track
Project management and execution tracking.

- **epics/** - Feature specifications
  - current/ - Active epics
  - completed/ - Finished epics
- **sprints/** - Sprint documentation
- **backlog.md** - Story backlog

### 3-ARCHITECTURE - Design
User experience and interface design.

- **ux/** - UX documentation
  - flows/ - User flow diagrams
  - wireframes/ - UI wireframes
  - specs/ - Component specifications

### 4-DEVELOPMENT - How
Implementation guides and code documentation.

- **api/** - API documentation
- **guides/** - Development guides
- **notes/** - Implementation notes

### 5-ARCHIVE - History
Completed work and deprecated documents.

- **old-sprints/** - Past sprint docs
- **deprecated/** - Outdated documentation

## Getting Started

1. **New to project?** Read docs/1-BASELINE/product/overview.md
2. **Starting development?** Check docs/2-MANAGEMENT/epics/current/
3. **Need API docs?** See docs/4-DEVELOPMENT/api/
4. **Current sprint?** Check @PROJECT-STATE.md

---
*See @CLAUDE.md for project overview*
EOF
```

---

## 8. Agent Workspace Setup

### What are Workspaces?

**Agent workspaces** are the state files that agents use to coordinate work:

- **AGENT-STATE.md** - Which agents are doing what
- **TASK-QUEUE.md** - Prioritized task list
- **HANDOFFS.md** - Agent-to-agent transitions
- **DEPENDENCIES.md** - Task dependencies
- **DECISION-LOG.md** - Architectural decisions
- **AGENT-MEMORY.md** - Context and history
- **METRICS.md** - Progress tracking

### How They Help

**Without workspaces:**
- 😞 No visibility into what's happening
- 😞 Duplicate work
- 😞 Lost context between sessions
- 😞 No coordination

**With workspaces:**
- 😊 Clear task ownership
- 😊 Visible progress
- 😊 Persistent memory
- 😊 Smooth handoffs

### Initial Setup

**Step 1: Create State Directory**

```bash
mkdir -p .claude/state
cd .claude/state
```

**Step 2: Create Core State Files**

**AGENT-STATE.md:**

```markdown
# Agent State

**Last Updated:** [Date Time]
**Updated By:** [Human / Agent Name]

## Active Agents

| Agent | Task | Story | Started | ETA | Status |
|-------|------|-------|---------|-----|--------|
| - | - | - | - | - | - |

_No active agents yet - migration in progress_

## Available Agents

All agents available:
- Planning: RESEARCH, PM, UX, ARCHITECT, PRODUCT-OWNER, SCRUM-MASTER
- Development: TEST-ENGINEER, BACKEND-DEV, FRONTEND-DEV, SENIOR-DEV
- Quality: QA-AGENT, CODE-REVIEWER, TECH-WRITER

## Agent History

| Date | Agent | Task | Duration | Outcome |
|------|-------|------|----------|---------|
| [Date] | Human | Project migration | - | In progress |

## Notes

Project migrated to Agent Methodology Pack on [Date].
Ready to begin agent-based development.

---
```

**TASK-QUEUE.md:**

```markdown
# Task Queue

**Last Updated:** [Date Time]
**Managed By:** ORCHESTRATOR / SCRUM-MASTER

## Active Tasks

| Priority | Agent | Task | Story | Status | Blocking | ETA |
|----------|-------|------|-------|--------|----------|-----|
| - | - | - | - | - | - | - |

_No active tasks - add tasks as work begins_

## Queued Tasks

| Priority | Task | Story | Assigned To | Dependencies | Wait Reason |
|----------|------|-------|-------------|--------------|-------------|
| P0 | Complete migration validation | - | Human | None | - |
| P1 | Document current features as epics | - | PM-AGENT | Migration complete | - |
| P2 | Set up first sprint | - | SCRUM-MASTER | Epics documented | - |

## Blocked Tasks

| Task | Story | Agent | Blocked By | Since | Resolution Plan |
|------|-------|-------|------------|-------|-----------------|
| - | - | - | - | - | - |

_No blocked tasks_

## Completed Today

| Task | Agent | Completed | Duration |
|------|-------|-----------|----------|
| - | - | - | - |

## Task Priorities

- **P0 (Critical):** Must complete today, blocking other work
- **P1 (High):** Current sprint, important
- **P2 (Medium):** Current sprint, nice-to-have
- **P3 (Low):** Backlog, future work

---
```

**HANDOFFS.md:**

```markdown
# Handoffs

Tracks work handoffs between agents.

**Last Updated:** [Date]

## Pending Handoffs

| From | To | Artifact | Context | Scheduled | Status |
|------|----| ---------|---------|-----------|--------|
| - | - | - | - | - | - |

_No pending handoffs_

## Recent Handoffs

| Date | From | To | Artifact | Success |
|------|------|----|-----------| --------|
| [Date] | Human | System | Migration | ✅ In Progress |

## Handoff Template

```markdown
### Handoff: [From Agent] → [To Agent]

**Date:** [Date Time]
**Artifact:** [What is being handed off]

**Context:**
[Summary of work completed]

**Next Steps for [To Agent]:**
1. [Step 1]
2. [Step 2]

**Files:**
- [File 1]
- [File 2]

**Status:** [Pending / Complete / Blocked]
```

---
```

**DEPENDENCIES.md:**

```markdown
# Task Dependencies

Maps dependencies between tasks and stories.

**Last Updated:** [Date]

## Dependency Graph

```
[To be populated as work begins]
```

## Blocked Items

| Item | Blocked By | Impact | Owner | Resolution ETA |
|------|------------|--------|-------|----------------|
| - | - | - | - | - |

_No blocked items_

## Dependency Rules

1. **Story dependencies:**
   - Technical: Story A must complete before Story B can start
   - Business: Priority order defined by Product Owner

2. **Task dependencies:**
   - Sequential: Tests before implementation (TDD)
   - Parallel: Independent tasks can run simultaneously

3. **Epic dependencies:**
   - Foundation epics before feature epics
   - Infrastructure before applications

---
```

**DECISION-LOG.md:**

```markdown
# Decision Log

Architectural and technical decisions made during development.

**Last Updated:** [Date]

## Active Decisions

| ID | Date | Decision | Rationale | Owner | Status |
|----|------|----------|-----------|-------|--------|
| D-001 | [Date] | Adopt Agent Methodology Pack | Improve dev workflow | Team | ✅ Approved |

## Decision Details

### D-001: Adopt Agent Methodology Pack

**Date:** [Date]
**Status:** Approved ✅
**Owner:** [Your Name]

**Context:**
Project needs better organization and workflow management.

**Decision:**
Migrate to Agent Methodology Pack for multi-agent development.

**Rationale:**
- Structured documentation (BMAD)
- Clear agent workflows
- Better state management
- Token budget optimization

**Alternatives Considered:**
1. Continue with current structure (rejected - disorganized)
2. Custom workflow (rejected - too much effort)

**Consequences:**
- Positive: Better organization, clearer workflows
- Negative: Initial migration time investment

**Related Decisions:**
None

---

## Decision Template

```markdown
### D-XXX: [Decision Title]

**Date:** [Date]
**Status:** [Proposed / Approved / Rejected / Superseded]
**Owner:** [Name]

**Context:**
[What problem are we solving?]

**Decision:**
[What did we decide?]

**Rationale:**
[Why did we decide this?]

**Alternatives Considered:**
1. [Alternative 1] - [Why rejected]
2. [Alternative 2] - [Why rejected]

**Consequences:**
- **Positive:** [Benefits]
- **Negative:** [Drawbacks]

**Related Decisions:**
[Link to related decisions]
```

---
```

**AGENT-MEMORY.md:**

```markdown
# Agent Memory

Persistent context and memory across agent sessions.

**Last Updated:** [Date]

## Project Context

**Project Name:** [Your Project]
**Project Type:** [Type]
**Tech Stack:** [Stack]
**Current Phase:** Migration to Agent Methodology Pack

## Key Facts

- Migration started: [Date]
- Team size: [N people]
- Current sprint: [Sprint N or "Not started"]
- Active epics: [N or "None yet"]

## Important Patterns

_To be populated as development begins_

## Learnings

### Migration Phase

- Successfully migrated to Agent Methodology Pack
- BMAD structure implemented
- State files initialized

## Context Budget

**Session Token Usage:**
- Reserved: ~1,500 tokens (CLAUDE.md, PROJECT-STATE.md, agent def)
- Available: ~198,500 tokens (for 200K context window)

**High-Value Context:**
- @CLAUDE.md - Always load
- @PROJECT-STATE.md - Always load
- @docs/2-MANAGEMENT/epics/current/ - Load for active work

## Notes

[Any additional notes or reminders for agents]

---
```

**METRICS.md:**

```markdown
# Metrics

Tracks project progress and performance.

**Last Updated:** [Date]

## Sprint Metrics

| Sprint | Start | End | Stories | Points | Velocity | Completion |
|--------|-------|-----|---------|--------|----------|------------|
| - | - | - | - | - | - | - |

_Metrics will populate as sprints begin_

## Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | [%] | 80% | [Status] |
| Bug Count | [N] | <10 | [Status] |
| Code Review Time | [hours] | <24h | [Status] |

## Agent Metrics

| Agent | Tasks Completed | Avg Duration | Success Rate |
|-------|-----------------|--------------|--------------|
| - | - | - | - |

_Agent metrics tracked automatically_

## Trends

[Charts and trend analysis to be added]

---
```

### Customizing Per Project

**Small project customization:**

```markdown
# Simplified AGENT-STATE.md for small projects

## Current Work
- [ ] Task 1
- [ ] Task 2
- [x] Task 3 (completed)

## Next Up
- Task 4
- Task 5

Simple and lightweight.
```

**Enterprise project customization:**

```markdown
# Detailed AGENT-STATE.md for enterprise

## Active Agents by Team

### Team A (Frontend)
| Agent | Task | Story | Started | ETA |
|-------|------|-------|---------|-----|
| FRONTEND-DEV | Login UI | 1.2 | 12/05 | 12/06 |

### Team B (Backend)
| Agent | Task | Story | Started | ETA |
|-------|------|-------|---------|-----|
| BACKEND-DEV | Auth API | 1.1 | 12/04 | 12/05 |

## Capacity Planning

- Team A: 40 hours/week available, 32 allocated
- Team B: 40 hours/week available, 38 allocated

Complex coordination.
```

**Recommended customizations by project type:**

| Project Type | Customize | How |
|--------------|-----------|-----|
| Solo project | TASK-QUEUE | Simplify to personal todo list |
| Team project | HANDOFFS | Add team member names |
| Open source | DECISION-LOG | Public-facing ADRs |
| Enterprise | METRICS | Add SLA tracking |
| Startup | TASK-QUEUE | Add business metrics |

---

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

## 10. Migration Checklist

### Pre-Migration Checklist

**Before starting migration:**

- [ ] **Backup created**
  ```bash
  tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/project
  ```

- [ ] **Git repository clean**
  ```bash
  git status  # Should show "nothing to commit"
  ```

- [ ] **Migration branch created**
  ```bash
  git checkout -b migration/agent-methodology-pack
  ```

- [ ] **Agent Methodology Pack downloaded**
  ```bash
  ls -la agent-methodology-pack/
  ```

- [ ] **Team notified** (if applicable)
  - Migration schedule communicated
  - Freeze on new features agreed
  - Training session scheduled

- [ ] **Time allocated**
  - Small project: 2-4 hours blocked
  - Medium project: 1 day blocked
  - Large project: 2-3 days blocked

- [ ] **Prerequisites installed**
  ```bash
  claude --version  # Claude CLI installed
  git --version     # Git installed
  ```

### During Migration Checklist

**Phase 1: Discovery**

- [ ] **Project analyzed**
  - File count documented
  - Large files identified
  - Current structure mapped

- [ ] **AUDIT-REPORT.md created**
  ```bash
  ls AUDIT-REPORT.md
  ```

- [ ] **Migration candidates identified**
  - High priority files listed
  - Sharding candidates noted
  - Files to create planned

**Phase 2: Planning**

- [ ] **MIGRATION-PLAN.md created**
  - File mapping complete
  - Priorities set
  - Timeline defined

- [ ] **Sharding strategy defined**
  - Large files identified
  - Split points determined
  - New file names decided

- [ ] **Team alignment** (if applicable)
  - Plan reviewed with team
  - Concerns addressed
  - Roles assigned

**Phase 3: Execution**

- [ ] **Methodology pack installed**
  ```bash
  ls -la .claude/
  ```

- [ ] **Core files created**
  - [ ] CLAUDE.md (< 70 lines)
  - [ ] PROJECT-STATE.md
  - [ ] docs/00-START-HERE.md

- [ ] **BMAD structure created**
  ```bash
  ls -la docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}
  ```

- [ ] **Documentation migrated**
  - [ ] Product docs → 1-BASELINE/product/
  - [ ] Architecture docs → 1-BASELINE/architecture/
  - [ ] Management docs → 2-MANAGEMENT/
  - [ ] Development docs → 4-DEVELOPMENT/
  - [ ] Old docs → 5-ARCHIVE/

- [ ] **Large files sharded**
  - [ ] Files split logically
  - [ ] Index files created
  - [ ] References updated

- [ ] **State files initialized**
  - [ ] AGENT-STATE.md
  - [ ] TASK-QUEUE.md
  - [ ] HANDOFFS.md
  - [ ] DEPENDENCIES.md
  - [ ] DECISION-LOG.md
  - [ ] AGENT-MEMORY.md
  - [ ] METRICS.md

- [ ] **References updated**
  - [ ] CLAUDE.md references valid
  - [ ] Cross-references checked
  - [ ] Dead links removed

**Phase 4: Verification**

- [ ] **Validation passed**
  ```bash
  bash scripts/validate-docs.sh  # All checks pass
  ```

- [ ] **CLAUDE.md validated**
  ```bash
  wc -l CLAUDE.md  # < 70 lines
  ```

- [ ] **References tested**
  - [ ] All @references load in Claude
  - [ ] No broken links
  - [ ] Paths correct

- [ ] **Agent workflows tested**
  - [ ] ORCHESTRATOR loads successfully
  - [ ] Test development agent
  - [ ] Test quality agent

- [ ] **Documentation accessible**
  - [ ] Team can find documents
  - [ ] WHERE-IS-EVERYTHING.md created
  - [ ] Navigation clear

### Post-Migration Checklist

**After migration complete:**

- [ ] **Git committed**
  ```bash
  git add .
  git commit -m "Complete migration to Agent Methodology Pack"
  git tag migration-complete-$(date +%Y%m%d)
  ```

- [ ] **Backup verified**
  ```bash
  ls -lh backup-*.tar.gz  # Backup exists
  ```

- [ ] **Team trained** (if applicable)
  - [ ] Onboarding session held
  - [ ] Documentation shared
  - [ ] Q&A session completed

- [ ] **First epic created**
  - [ ] Current work documented as Epic
  - [ ] Stories broken down
  - [ ] Sprint planned

- [ ] **Agent workflows active**
  - [ ] First task assigned to agent
  - [ ] State files being updated
  - [ ] Handoffs working

- [ ] **Metrics baseline established**
  ```bash
  # Initial metrics captured in METRICS.md
  ```

- [ ] **Retrospective held**
  - Migration process reviewed
  - Improvements identified
  - Lessons documented

- [ ] **Documentation finalized**
  - [ ] All files in correct locations
  - [ ] No TODO placeholders
  - [ ] Quality check passed

### Quality Checklist

**Final quality verification:**

- [ ] **Structure**
  - [ ] BMAD folders exist
  - [ ] Files in correct locations
  - [ ] Naming conventions followed

- [ ] **Content**
  - [ ] CLAUDE.md accurate and concise
  - [ ] PROJECT-STATE.md current
  - [ ] No placeholder content
  - [ ] No broken references

- [ ] **Validation**
  - [ ] scripts/validate-docs.sh passes
  - [ ] CLAUDE.md < 70 lines
  - [ ] All @references work
  - [ ] Claude CLI can load all files

- [ ] **Functionality**
  - [ ] ORCHESTRATOR routes tasks
  - [ ] Agents can access docs
  - [ ] State files update
  - [ ] Workflows functional

- [ ] **Team Readiness**
  - [ ] Team knows new structure
  - [ ] Team can use agents
  - [ ] Support channel established
  - [ ] Documentation accessible

---

## 11. Examples

### Example 1: React + Node.js Full-Stack Project

**Project Profile:**
- **Name:** TaskMaster (Todo app with real-time collaboration)
- **Size:** 180 files, 15K LOC
- **Stack:** React + TypeScript frontend, Node.js + Express + PostgreSQL backend
- **Team:** 3 developers
- **Current State:** Mid-development, v2.0 in progress

**Migration Approach:** Full migration over 2 days

#### Day 1: Discovery & Planning (4 hours)

**Morning (2 hours): Discovery**

```bash
# 1. Create audit
cd /path/to/taskmaster
find . -type f | wc -l  # 180 files
find . -name "*.md" | wc -l  # 12 markdown files
find . -name "*.ts" -o -name "*.tsx" | wc -l  # 87 TypeScript files

# 2. Identify large docs
find . -name "*.md" -exec wc -l {} + | sort -rn
# Output:
# 842 README.md
# 456 docs/API.md
# 234 docs/ARCHITECTURE.md
# 123 docs/SETUP.md
# 89 docs/CONTRIBUTING.md

# 3. Document findings
cat > AUDIT-REPORT.md << 'EOF'
# TaskMaster Migration Audit

## Project Stats
- Total files: 180
- Documentation: 12 markdown files
- Code: 87 TypeScript, 23 test files
- Largest doc: README.md (842 lines) - MUST SHARD

## Current Structure
```
taskmaster/
├── README.md (842 lines)
├── docs/
│   ├── API.md (456 lines)
│   ├── ARCHITECTURE.md (234 lines)
│   ├── SETUP.md (123 lines)
│   └── CONTRIBUTING.md (89 lines)
├── client/ (React app)
└── server/ (Node.js API)
```

## Migration Candidates
- README.md → Shard into 5 files
- API.md → Move to 4-DEVELOPMENT/api/
- ARCHITECTURE.md → Move to 1-BASELINE/architecture/
- SETUP.md → Rename to INSTALL.md
- CONTRIBUTING.md → Move to 4-DEVELOPMENT/guides/
EOF
```

**Afternoon (2 hours): Planning**

```bash
# Create migration plan
cat > MIGRATION-PLAN.md << 'EOF'
# TaskMaster Migration Plan

## Timeline
- **Day 1 AM:** Discovery & Planning
- **Day 1 PM:** Core files & structure
- **Day 2 AM:** Doc migration & sharding
- **Day 2 PM:** Validation & team training

## File Mapping

### Root Files
| Current | New | Action |
|---------|-----|--------|
| README.md | Shard (see below) | Split into 5 files |
| package.json | Keep in root | No change |
| CHANGELOG.md | Keep in root | No change |

### README.md Sharding (842 lines → 5 files)
1. CLAUDE.md (50 lines) - Entry point
2. docs/1-BASELINE/product/overview.md (150 lines) - Product overview
3. docs/1-BASELINE/product/features.md (200 lines) - Feature list
4. INSTALL.md (300 lines) - Setup instructions
5. QUICK-START.md (142 lines) - Quick start tutorial

### Documentation Migration
| Current | New | Lines |
|---------|-----|-------|
| docs/API.md | docs/4-DEVELOPMENT/api/README.md | 456 |
| docs/ARCHITECTURE.md | docs/1-BASELINE/architecture/overview.md | 234 |
| docs/SETUP.md | INSTALL.md (merged with README setup) | 123 |
| docs/CONTRIBUTING.md | docs/4-DEVELOPMENT/guides/contributing.md | 89 |

### New Files to Create
- PROJECT-STATE.md
- docs/00-START-HERE.md
- docs/2-MANAGEMENT/epics/current/epic-03-realtime.md (current work)
- All state files (.claude/state/*)

## Priority
P0: Core files, structure, current work documentation
P1: All doc migration
P2: Historical documentation archival

## Rollback Plan
Git tag: `pre-migration-20251205`
Can revert with: `git reset --hard pre-migration-20251205`
EOF

# Commit plan
git add AUDIT-REPORT.md MIGRATION-PLAN.md
git commit -m "Migration planning complete"
```

#### Day 1 Afternoon: Core Files & Structure (4 hours)

```bash
# 1. Install methodology pack
git submodule add https://github.com/your-org/agent-methodology-pack.git .agent-pack
cp -r .agent-pack/.claude ./
cp -r .agent-pack/scripts ./
cp -r .agent-pack/templates ./

# 2. Create BMAD structure
mkdir -p docs/{1-BASELINE/{product,architecture},2-MANAGEMENT/{epics/{current,completed},sprints},3-ARCHITECTURE/ux,4-DEVELOPMENT/{api,guides},5-ARCHIVE}

# 3. Create CLAUDE.md
cat > CLAUDE.md << 'EOF'
# TaskMaster - Real-Time Collaboration Todo App

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | TaskMaster |
| Type | Full-Stack Web Application |
| Version | 2.0.0-beta |
| Status | Active Development |

## Current Focus
See: @PROJECT-STATE.md

## Documentation Map
- **Overview:** @docs/1-BASELINE/product/overview.md
- **Features:** @docs/1-BASELINE/product/features.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md
- **API:** @docs/4-DEVELOPMENT/api/README.md
- **Installation:** @INSTALL.md
- **Quick Start:** @QUICK-START.md

## Tech Stack
- Frontend: React 18 + TypeScript + Material-UI
- Backend: Node.js 18 + Express + PostgreSQL 15
- Real-time: Socket.io
- Deployment: Docker + AWS

## Current Sprint
Sprint 6 | Epic 3: Real-Time Collaboration
See: @docs/2-MANAGEMENT/epics/current/epic-03-realtime.md

## Agent System
@.claude/agents/ORCHESTRATOR.md

---
*Agent Methodology Pack v1.0.0*
EOF

# Verify <70 lines
wc -l CLAUDE.md  # Should be ~45 lines ✅

# 4. Create PROJECT-STATE.md
cat > PROJECT-STATE.md << 'EOF'
# Project State

**Project:** TaskMaster v2.0
**Phase:** Development - Real-Time Features
**Last Updated:** 2025-12-05

## Current Status
- Sprint 6 of 8 (planned for v2.0)
- Epic 3: Real-Time Collaboration
- 2 stories completed, 3 in progress

## Active Work

### Epic 3: Real-Time Collaboration
- [x] Story 3.1: WebSocket server setup - **Complete**
- [x] Story 3.2: Real-time task updates - **Complete**
- [ ] Story 3.3: Collaborative editing - **In Progress** (Frontend)
- [ ] Story 3.4: Presence indicators - **In Progress** (Backend)
- [ ] Story 3.5: Conflict resolution - **Queued**

## Team
- Alice: Frontend Developer (Story 3.3)
- Bob: Backend Developer (Story 3.4)
- Charlie: Full-Stack (Code review, testing)

## Recent Completions
- 2025-12-04: Story 3.2 merged to main
- 2025-12-01: Epic 2 (User Profiles) completed
- 2025-11-29: Sprint 5 retrospective

## Next Steps
1. Complete Story 3.3 (today)
2. Complete Story 3.4 (tomorrow)
3. Begin Story 3.5 (Monday)
4. Sprint 6 review (Friday 12/13)

## Blockers
- Story 3.4 waiting on Socket.io scaling research (in progress)

## Metrics
- Sprint velocity: 18 points/sprint
- Test coverage: 92%
- Open bugs: 2 (both P2)

---
*See @.claude/state/TASK-QUEUE.md for detailed task tracking*
EOF

# 5. Initialize state files
cd .claude/state
for file in AGENT-STATE.md TASK-QUEUE.md HANDOFFS.md DEPENDENCIES.md DECISION-LOG.md AGENT-MEMORY.md METRICS.md; do
  cp ../../templates/state/$file.template $file
done
cd ../..

# 6. Commit progress
git add CLAUDE.md PROJECT-STATE.md .claude/ docs/
git commit -m "Core files and structure created"
```

**End of Day 1:** Structure ready, core files created

#### Day 2 Morning: Documentation Migration & Sharding (4 hours)

```bash
# 1. Shard README.md

# Extract overview section (lines 1-150)
head -n 150 README.md > docs/1-BASELINE/product/overview.md

# Extract features section (lines 151-350)
sed -n '151,350p' README.md > docs/1-BASELINE/product/features.md

# Extract installation (lines 351-650)
sed -n '351,650p' README.md > INSTALL.md

# Extract quick start (lines 651-792)
sed -n '651,792p' README.md > QUICK-START.md

# Create new minimal README
cat > README.md << 'EOF'
# TaskMaster

Real-time collaboration todo app built with React and Node.js.

## Quick Links

- **Get Started:** See [INSTALL.md](INSTALL.md) and [QUICK-START.md](QUICK-START.md)
- **Documentation:** See [docs/00-START-HERE.md](docs/00-START-HERE.md)
- **Project Overview:** See [@CLAUDE.md](CLAUDE.md)

## Current Version

v2.0.0-beta - Real-time collaboration features

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

For full documentation, start at @CLAUDE.md
EOF

# 2. Move API documentation
mv docs/API.md docs/4-DEVELOPMENT/api/README.md

# Split API doc if needed (456 lines)
# Create docs/4-DEVELOPMENT/api/authentication.md
# Create docs/4-DEVELOPMENT/api/endpoints/tasks.md
# Create docs/4-DEVELOPMENT/api/endpoints/users.md
# Create docs/4-DEVELOPMENT/api/websockets.md
# Update docs/4-DEVELOPMENT/api/README.md to reference them

# 3. Move architecture docs
mv docs/ARCHITECTURE.md docs/1-BASELINE/architecture/overview.md

# 4. Move contributing guide
mv docs/CONTRIBUTING.md docs/4-DEVELOPMENT/guides/contributing.md

# 5. Create START-HERE
cat > docs/00-START-HERE.md << 'EOF'
# TaskMaster Documentation

## Getting Started

1. **New to TaskMaster?** Read [1-BASELINE/product/overview.md](1-BASELINE/product/overview.md)
2. **Want to install?** See [INSTALL.md](../INSTALL.md)
3. **Quick tutorial?** See [QUICK-START.md](../QUICK-START.md)
4. **Architecture?** See [1-BASELINE/architecture/overview.md](1-BASELINE/architecture/overview.md)

## Documentation Structure (BMAD)

### 1-BASELINE - What & Why
- **product/** - Product overview, features, requirements
- **architecture/** - System design, technical decisions

### 2-MANAGEMENT - Plan & Track
- **epics/current/** - Active feature development
- **sprints/** - Sprint planning and tracking

### 3-ARCHITECTURE - Design
- **ux/** - User experience design, wireframes

### 4-DEVELOPMENT - How
- **api/** - API documentation
- **guides/** - Development guides

### 5-ARCHIVE - History
- **old-sprints/** - Completed sprint documentation

## Current Work

See [@PROJECT-STATE.md](../PROJECT-STATE.md) for current sprint and active work.

---
*Entry point: @CLAUDE.md*
EOF

# 6. Create Epic 3 (current work)
cat > docs/2-MANAGEMENT/epics/current/epic-03-realtime.md << 'EOF'
# Epic 3: Real-Time Collaboration

**Status:** In Progress (60% complete)
**Start Date:** 2025-11-20
**Target:** 2025-12-15

## Goal

Enable multiple users to collaborate on tasks in real-time with live updates and presence indicators.

## Stories

- [x] **3.1:** WebSocket server setup (8 pts) - Complete
- [x] **3.2:** Real-time task updates (5 pts) - Complete
- [ ] **3.3:** Collaborative editing (8 pts) - In Progress
- [ ] **3.4:** Presence indicators (5 pts) - In Progress
- [ ] **3.5:** Conflict resolution (8 pts) - Queued

**Total:** 34 points | Completed: 13 | Remaining: 21

## Acceptance Criteria

- [ ] Multiple users can edit same task simultaneously
- [ ] Changes appear in real-time (<100ms)
- [ ] User presence shown (who's online, who's editing)
- [ ] Conflicts detected and resolved gracefully
- [ ] Works with 10+ concurrent users

## Technical Details

- **Technology:** Socket.io for WebSocket communication
- **Architecture:** Event-driven, pub/sub pattern
- **Data Sync:** Operational Transform for conflict resolution

## Dependencies

- Infrastructure: WebSocket server (complete)
- Database: PostgreSQL with row-level security (complete)

## Related

- Epic 2: User Profiles (provides user info for presence)
- Epic 4: Notifications (will use real-time infrastructure)

---
*See stories in docs/2-MANAGEMENT/epics/current/epic-03/*
EOF

# 7. Commit migration
git add .
git commit -m "Documentation migrated and sharded"
```

#### Day 2 Afternoon: Validation & Team Training (4 hours)

```bash
# 1. Run validation
bash scripts/validate-docs.sh

# Fix any issues found:
# - Broken references → update paths
# - Missing files → create or remove reference
# - CLAUDE.md too long → move content to referenced files

# 2. Verify line counts
wc -l CLAUDE.md  # Should be <70 ✅
wc -l PROJECT-STATE.md
wc -l docs/1-BASELINE/product/overview.md

# 3. Test with Claude CLI
echo "Test migration:

@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

Please analyze the project and recommend next steps for Epic 3." | claude --project .

# 4. Create team onboarding doc
cat > MIGRATION-NOTES.md << 'EOF'
# Migration Complete! 🎉

## What Changed

1. **New structure:** Documentation now uses BMAD format
2. **Entry point:** Start at @CLAUDE.md instead of README.md
3. **AI agents:** We can now use specialized agents for development

## Where Is Everything?

| Old Location | New Location |
|--------------|--------------|
| README.md (overview) | docs/1-BASELINE/product/overview.md |
| README.md (features) | docs/1-BASELINE/product/features.md |
| README.md (setup) | INSTALL.md |
| docs/API.md | docs/4-DEVELOPMENT/api/README.md |
| docs/ARCHITECTURE.md | docs/1-BASELINE/architecture/overview.md |
| docs/CONTRIBUTING.md | docs/4-DEVELOPMENT/guides/contributing.md |

## Quick Start for Team

### Finding Docs
- Start at [docs/00-START-HERE.md](docs/00-START-HERE.md)
- Or use @CLAUDE.md as entry point

### Using Agents

**Example: Get help implementing Story 3.3**
```
@CLAUDE.md
@docs/2-MANAGEMENT/epics/current/epic-03-realtime.md
@.claude/agents/development/FRONTEND-DEV.md

Help me implement Story 3.3: Collaborative editing
```

**Example: Code review**
```
@CLAUDE.md
@.claude/agents/quality/CODE-REVIEWER.md

Review my changes in client/src/components/TaskEditor.tsx
```

## Team Training

**Friday 12/6, 2:00 PM** - Team room
- 30 min overview of new structure
- 30 min hands-on with agents
- 30 min Q&A

## Questions?

#dev-team Slack channel or DM Charlie
EOF

# 5. Create WHERE-IS-EVERYTHING quick reference
cat > docs/WHERE-IS-EVERYTHING.md << 'EOF'
# Quick Finder: Where Is Everything?

## Common Searches

| Looking for... | Location |
|----------------|----------|
| Project overview | docs/1-BASELINE/product/overview.md |
| Feature list | docs/1-BASELINE/product/features.md |
| Setup guide | INSTALL.md |
| Quick tutorial | QUICK-START.md |
| API docs | docs/4-DEVELOPMENT/api/README.md |
| Architecture | docs/1-BASELINE/architecture/overview.md |
| Current work | PROJECT-STATE.md |
| Current epic | docs/2-MANAGEMENT/epics/current/epic-03-realtime.md |

## Can't Find Something?

```bash
# Search all docs
grep -r "search term" docs/

# Find file by name
find docs/ -name "*keyword*"
```

## Structure Overview

See [docs/00-START-HERE.md](00-START-HERE.md) for full BMAD structure explanation.

---
EOF

# 6. Final commit
git add .
git commit -m "Migration complete and validated"
git tag migration-complete-20251205

# 7. Team training session (in person)
# - Show new structure
# - Demo agent usage
# - Answer questions
# - Update team wiki
```

**Migration Complete!** TaskMaster successfully migrated in 2 days.

**Results:**
- ✅ 842-line README → 5 focused files
- ✅ BMAD structure implemented
- ✅ All documentation organized
- ✅ Agents functional
- ✅ Team trained

---

### Example 2: Python Django REST API Project

**Project Profile:**
- **Name:** HealthTracker API
- **Size:** 95 files, 8K LOC
- **Stack:** Python 3.11 + Django 4.2 + PostgreSQL + Docker
- **Team:** 2 developers
- **Current State:** Production app, adding v2 API

**Migration Approach:** Quick migration (1 day)

```bash
# Quick migration for smaller Python project

# 1. Audit (30 min)
find . -name "*.py" | wc -l  # 62 Python files
find . -name "*.md" | wc -l  # 6 docs
cat docs/API.md | wc -l      # 320 lines (shard)

# 2. Install (30 min)
cp -r /path/to/agent-methodology-pack/.claude ./
cp -r /path/to/agent-methodology-pack/scripts ./
mkdir -p docs/{1-BASELINE/{product,architecture},2-MANAGEMENT/epics/current,4-DEVELOPMENT/{api,guides}}

# 3. Create core files (1 hour)
cat > CLAUDE.md << 'EOF'
# HealthTracker API

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | HealthTracker API |
| Type | REST API |
| Version | 2.0.0-alpha |
| Status | Production + V2 Development |

## Documentation
- **API v1:** @docs/4-DEVELOPMENT/api/v1/README.md
- **API v2:** @docs/4-DEVELOPMENT/api/v2/README.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md

## Tech Stack
Python 3.11 + Django 4.2 + DRF + PostgreSQL + Docker

## Current Work
@PROJECT-STATE.md

---
EOF

# 4. Migrate docs (2 hours)
mv docs/API.md docs/4-DEVELOPMENT/api/v1/README.md
mv docs/ARCHITECTURE.md docs/1-BASELINE/architecture/overview.md
# Split API.md into endpoints
# Create v2 API docs

# 5. Create Epic for v2 API work (1 hour)
cat > docs/2-MANAGEMENT/epics/current/epic-05-api-v2.md << 'EOF'
# Epic 5: API v2

## Goal
Build v2 of API with improved authentication and GraphQL support.

## Stories
- [ ] 5.1: GraphQL schema design
- [ ] 5.2: JWT authentication
- [ ] 5.3: Rate limiting
- [ ] 5.4: API versioning

## Status
Planning phase
EOF

# 6. Validate (30 min)
bash scripts/validate-docs.sh
wc -l CLAUDE.md  # Verify <70 lines

# Total: ~6 hours (1 day)
```

**Key differences from React example:**
- Smaller project = faster migration
- Less sharding needed
- Simpler team coordination (2 people)
- Focus on API documentation organization

---

### Example 3: Monorepo (Multiple Projects)

**Project Profile:**
- **Name:** AcmeCorp Monorepo
- **Size:** 850 files across 5 sub-projects
- **Stack:** Mixed (React, Node.js, Python, Go)
- **Team:** 12 developers across 3 teams
- **Current State:** Active development, multiple teams

**Migration Approach:** Incremental (2 weeks, one project at a time)

#### Week 1: Infrastructure + Project 1

**Monday: Monorepo setup**

```bash
# Root structure
acme-corp/
├── CLAUDE.md (monorepo overview)
├── PROJECT-STATE.md (overall state)
├── .claude/ (shared agents)
├── docs/ (shared docs)
├── projects/
│   ├── web-app/
│   ├── mobile-app/
│   ├── api-gateway/
│   ├── auth-service/
│   └── analytics/
```

**Root CLAUDE.md:**

```markdown
# AcmeCorp Monorepo

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | AcmeCorp Products |
| Type | Monorepo (5 projects) |
| Status | Active Development |

## Projects

- **web-app:** @projects/web-app/CLAUDE.md
- **mobile-app:** @projects/mobile-app/CLAUDE.md
- **api-gateway:** @projects/api-gateway/CLAUDE.md
- **auth-service:** @projects/auth-service/CLAUDE.md
- **analytics:** @projects/analytics/CLAUDE.md

## Shared Resources

- **Agents:** @.claude/agents/
- **Patterns:** @.claude/patterns/
- **Shared Docs:** @docs/

## Current State

@PROJECT-STATE.md

---
```

**Tuesday-Friday: Migrate web-app (first project)**

```bash
cd projects/web-app

# Create project-specific CLAUDE.md
cat > CLAUDE.md << 'EOF'
# AcmeCorp Web App

## Project
Web application for customer portal

## Documentation
@docs/00-START-HERE.md

## Shared Agents
@../../.claude/agents/

## Tech Stack
React + TypeScript

## Current Work
@PROJECT-STATE.md

---
EOF

# Migrate web-app docs to BMAD
mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT}
# ... migrate web-app docs ...

# Commit
git add .
git commit -m "web-app: Migrated to Agent Methodology Pack"
```

#### Week 2: Projects 2-5

**Monday-Tuesday:** Migrate mobile-app
**Wednesday:** Migrate api-gateway
**Thursday:** Migrate auth-service
**Friday:** Migrate analytics + final validation

**Benefits of incremental approach:**
- ✅ Teams learn gradually
- ✅ Each project is a learning experience
- ✅ Minimal disruption
- ✅ Can adjust strategy between projects

**Challenges:**
- 🟡 Coordination across teams
- 🟡 Shared documentation organization
- 🟡 Monorepo-specific tooling

---

## 12. FAQ

### General Questions

**Q1: Do I have to migrate my whole project at once?**

**A:** No. You can:
- Migrate incrementally (one component at a time)
- Start with just core files and add the rest later
- Use methodology pack for new work, keep old structure for legacy code
- Hybrid approach: New epics use BMAD, old docs stay as-is

**Q2: What if I don't use all the agents?**

**A:** That's fine! Use only what you need:
- Solo developer: Use 3-4 key agents (Orchestrator, Senior Dev, Code Reviewer)
- Small team: Add PM and QA agents
- Full team: Use all 13 agents

The pack is flexible - customize to your needs.

**Q3: Can I customize the BMAD structure?**

**A:** Yes, BMAD is a guideline, not a strict requirement:
- Keep the general structure (1-Baseline, 2-Management, etc.)
- Add custom folders as needed (e.g., 6-OPERATIONS)
- Rename to match your terminology (e.g., 1-REQUIREMENTS instead of 1-BASELINE)
- Document changes in your CLAUDE.md

**Q4: How do I handle existing Git history?**

**A:** Git history is preserved:
- Use `git mv` instead of `mv` to maintain file history
- Git tracks renames automatically (usually)
- Check history with `git log --follow filename`
- Large migrations: commit frequently to track changes

**Q5: What if my CLAUDE.md is still too long after trimming?**

**A:**
1. Move all details to referenced files
2. Use tables instead of prose
3. Remove unnecessary sections
4. Create a "project facts" file: @docs/project-facts.md
5. Keep ONLY: name, tech stack (one line), current state reference, key file references

Aim for 40-50 lines, leaving buffer for growth.

### Technical Questions

**Q6: Do I need to use all the state files?**

**A:** No, start minimal:
- **Essential:** AGENT-STATE.md, TASK-QUEUE.md
- **Recommended:** DECISION-LOG.md
- **Optional:** HANDOFFS.md, DEPENDENCIES.md, METRICS.md
- **Advanced:** AGENT-MEMORY.md (for complex projects)

Add more as needed.

**Q7: How do I migrate a wiki or Notion docs?**

**A:**
1. Export wiki to markdown
2. Map pages to BMAD structure:
   - Overview pages → 1-BASELINE/product/
   - Technical specs → 1-BASELINE/architecture/
   - How-to guides → 4-DEVELOPMENT/guides/
3. Convert internal links to @references
4. Import into docs/ folder
5. Create index in docs/00-START-HERE.md

**Q8: Can I use this with GitHub/GitLab wikis?**

**A:** Yes:
- **Option 1:** Migrate wiki content to docs/ folder (recommended)
- **Option 2:** Keep wiki, reference from CLAUDE.md:
  ```markdown
  ## External Documentation
  - Wiki: https://github.com/org/repo/wiki
  - (See @docs/ for BMAD-structured docs)
  ```
- **Option 3:** Hybrid - key docs in BMAD, supplementary in wiki

**Q9: How do I handle generated documentation (JSDoc, Sphinx)?**

**A:**
- Keep generated docs in their usual location
- Reference from CLAUDE.md:
  ```markdown
  ## API Documentation
  - Reference: @docs/4-DEVELOPMENT/api/README.md
  - Auto-generated: ./build/docs/api/ (not in @references)
  ```
- Don't reference generated files directly (they change often)
- Create a stable reference file that links to generated docs

**Q10: What about binary files (images, PDFs)?**

**A:**
- Store in docs structure:
  ```
  docs/3-ARCHITECTURE/ux/wireframes/login-page.png
  docs/1-BASELINE/research/user-survey.pdf
  ```
- Reference from markdown:
  ```markdown
  ![Login wireframe](wireframes/login-page.png)
  See [user survey results](../research/user-survey.pdf)
  ```
- Claude can read images and PDFs when referenced

### Workflow Questions

**Q11: How do I coordinate migration with active development?**

**A:**
- **Option 1: Feature freeze** (recommended for small projects)
  - Freeze new features for 1-2 days
  - Complete migration
  - Resume development

- **Option 2: Parallel development** (for large teams)
  - Create migration branch
  - Continue development on main
  - Merge strategy:
    ```bash
    # Daily: merge main into migration branch
    git checkout migration/agent-pack
    git merge main
    # Resolve conflicts

    # When ready: merge migration into main
    git checkout main
    git merge migration/agent-pack
    ```

- **Option 3: Incremental** (least disruption)
  - Migrate docs only (1 hour)
  - Use agents for new work
  - Gradually improve structure over weeks

**Q12: How do I migrate in-progress work?**

**A:**
1. Document current work as Epic:
   ```bash
   cat > docs/2-MANAGEMENT/epics/current/epic-current-work.md << 'EOF'
   # Epic: [Current Feature Name]

   ## Status
   In Progress (started before migration)

   ## Current State
   - [x] Part A complete
   - [ ] Part B in progress
   - [ ] Part C planned

   ## Next Steps
   Continue with Part B...
   EOF
   ```

2. Update PROJECT-STATE.md with current status
3. Continue work using agents
4. Retroactively add stories if needed

**Q13: What if team resists the change?**

**A:**
- **Education:** Show benefits with examples
- **Gradual adoption:** Don't force all at once
- **Quick wins:** Demonstrate value with small tasks
- **Listen:** Gather feedback, adjust approach
- **Support:** Provide training and ongoing help
- **Flexibility:** Customize to team preferences

**Q14: How often should I update state files?**

**A:**
- **AGENT-STATE.md:** When agent starts/completes task (multiple times per day)
- **TASK-QUEUE.md:** Daily (morning standup, end of day)
- **PROJECT-STATE.md:** When sprint status changes (every few days)
- **DECISION-LOG.md:** When architectural decision made (as needed)
- **METRICS.md:** End of sprint

Automate updates where possible.

**Q15: Can I automate any of this?**

**A:** Yes, several opportunities:
- **Validation:** Run `validate-docs.sh` in pre-commit hook
- **State updates:** Script to update TASK-QUEUE from GitHub issues
- **Metrics:** Auto-calculate from git commits
- **Token counting:** Pre-commit hook to warn if CLAUDE.md >70 lines
- **Documentation generation:** Script to generate MODULE-INDEX from codebase

See scripts/README.md for automation examples.

### Troubleshooting Questions

**Q16: Migration took longer than estimated. Why?**

**Common causes:**
- Underestimated documentation size (run audit first!)
- Many large files requiring sharding (>500 lines each)
- Team coordination overhead (more people = more time)
- Unfamiliar with BMAD structure (learning curve)
- Discovered missing/outdated docs during migration

**Prevention:**
- Thorough audit before starting
- Add 50% buffer to estimates
- Account for team coordination time
- Practice with small folder first

**Q17: Agents can't find my files even though paths look correct.**

**Troubleshooting:**
```bash
# 1. Verify file exists
ls -la PROJECT-STATE.md

# 2. Check working directory
pwd  # Should be project root

# 3. Test reference explicitly
echo "Test: @PROJECT-STATE.md" | claude --project .

# 4. Check for hidden characters
cat -A CLAUDE.md | grep "@PROJECT-STATE"

# 5. Try absolute path temporarily
# In CLAUDE.md: @/full/path/to/PROJECT-STATE.md

# 6. Verify Claude CLI project path
claude config  # Check project path setting
```

**Q18: I broke something during migration. How do I rollback?**

**A:**
```bash
# Option 1: Git reset to pre-migration tag
git tag  # Find your pre-migration tag
git reset --hard pre-migration-20251205

# Option 2: Restore from backup
rm -rf project/
tar -xzf project-backup-20251205.tar.gz

# Option 3: Revert specific commit
git log --oneline  # Find bad commit
git revert abc1234

# Option 4: Cherry-pick good commits to new branch
git checkout -b recovery main
git cherry-pick <good-commit-1> <good-commit-2>
```

**Prevention:** Commit frequently, tag milestones, keep backups.

**Q19: Team says they can't find anything. What do I do?**

**A:**
1. **Create finding guide** (see Example 1 above)
2. **Pair with team members** - show them in person
3. **Update onboarding** - add to team wiki
4. **Search tools:**
   ```bash
   # Add to .bashrc or .zshrc
   alias docfind='grep -r "$1" docs/'
   alias docmap='cat docs/WHERE-IS-EVERYTHING.md'
   ```
5. **Slack bot** (advanced): Bot responds with file locations

**Q20: Migration complete but validation still fails. Why?**

**Common issues:**
- **Broken @references:** File moved but reference not updated
  - Fix: Search CLAUDE.md for all @, verify each exists

- **CLAUDE.md >70 lines:** Still too much inline content
  - Fix: More aggressive sharding, move everything to referenced files

- **Missing directories:** BMAD structure incomplete
  - Fix: `mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}`

- **Wrong file permissions:** Scripts not executable
  - Fix: `chmod +x scripts/*.sh`

- **State files empty:** Templates not filled in
  - Fix: Populate AGENT-STATE.md, TASK-QUEUE.md with actual data

Run validation with verbose mode:
```bash
bash scripts/validate-docs.sh --verbose
```

---

## Summary

Migration to Agent Methodology Pack transforms your project structure for AI-powered development. Whether you choose quick migration (15 minutes) or full migration (1-3 days), the result is:

- ✅ Organized documentation (BMAD structure)
- ✅ Clear agent workflows
- ✅ Persistent state management
- ✅ Token-optimized context files
- ✅ Team collaboration framework

**Key Takeaways:**

1. **Start small:** Use quick migration for <50 files, full migration for larger projects
2. **Plan first:** Audit project, create file mapping, set priorities
3. **Shard large files:** Keep docs <300 lines, CLAUDE.md <70 lines
4. **Use BMAD wisely:** Map existing structure to Baseline/Management/Architecture/Development
5. **Setup workspaces:** Initialize state files for agent coordination
6. **Validate frequently:** Run validation script after each phase
7. **Train your team:** Provide onboarding and finding guides
8. **Iterate:** Improve structure as you use it

**Next Steps:**

1. Review this guide
2. Choose migration approach (quick vs full)
3. Create backup and migration branch
4. Follow appropriate workflow
5. Validate and test
6. Start using agents!

**Need Help?**

- Reread relevant sections
- Check examples for your stack
- Ask in project discussions
- Review FAQ

Good luck with your migration! 🚀

---

**Migration Guide Version:** 1.0.0
**Last Updated:** 2025-12-05
**Maintained by:** Agent Methodology Pack Team

**Feedback:** Help us improve this guide by reporting issues or suggesting improvements.

---

**Word Count:** ~12,500 words | **Line Count:** ~1,850 lines
**Estimated Reading Time:** 45-60 minutes
**Estimated Migration Time:** 15 minutes to 2 weeks (varies by project size)
