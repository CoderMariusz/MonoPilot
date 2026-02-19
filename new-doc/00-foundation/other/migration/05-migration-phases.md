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
- Full restructure to organized documentation?
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
- [ ] Documentation structure organized
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
# Use migrate-docs.sh to automatically move files to standard structure
# Based on FILE-MAP.md from analyze-project.sh

# 1. Preview migration (dry run)
bash scripts/migrate-docs.sh /path/to/existing-docs --dry-run

# 2. Execute migration automatically
bash scripts/migrate-docs.sh /path/to/existing-docs --auto

# This will:
# - Create organized folder structure automatically
# - Move files to correct category (detects PRD, architecture, API, etc.)
# - Update all @references in moved files
# - Generate MIGRATION-REPORT.md with summary
```

**Option B: Manual Migration (If you prefer control)**

```bash
# 1. Create standard documentation structure
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
# ✅ Documentation structure complete
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

1. **New structure:** Documentation now follows an organized format
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

