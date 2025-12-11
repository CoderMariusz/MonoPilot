# Migration Execution Phase

> **Part of:** @.claude/workflows/documentation/MIGRATION-WORKFLOW.md
> **Phase:** 3 of 4
> **Duration:** 1-3 days

---

## Overview

Execution phase implements the migration plan: creates directory structure, core files, migrates documentation, shards large files, and generates workspaces.

## Flow Diagram

```
+=====================================================================================+
|                        PHASE 3: EXECUTION (1-3 days)                               |
+=====================================================================================+
|                                                                                     |
|   Step 3.1: SETUP STRUCTURE (2 hours)                                              |
|   +------------------------------------------------------------+                   |
|   | tech-writer (sonnet)                                       |                   |
|   | 1. Create .claude/ directory structure                     |                   |
|   | 2. Copy agent definitions                                  |                   |
|   | 3. Copy workflow files                                     |                   |
|   | 4. Create state files                                      |                   |
|   | 5. Setup docs/ directory structure                         |                   |
|   +------------------------------------------------------------+                   |
|                            ↓                                                        |
|   Step 3.2: CREATE CORE FILES (1 hour)                                             |
|   +------------------------------------------------------------+                   |
|   | tech-writer (sonnet)                                       |                   |
|   | 1. Generate CLAUDE.md (<70 lines)                          |                   |
|   | 2. Create PROJECT-STATE.md                                 |                   |
|   | 3. Initialize state files                                  |                   |
|   +------------------------------------------------------------+                   |
|                            ↓                                                        |
|   Step 3.3: MIGRATE DOCUMENTATION (4-8 hours)                                      |
|   +------------------------------------------------------------+                   |
|   | tech-writer (sonnet)                                       |                   |
|   | 1. Map existing docs to documentation structure            |                   |
|   | 2. Move/copy files to appropriate locations                |                   |
|   | 3. Create missing baseline docs                            |                   |
|   | 4. Update cross-references                                 |                   |
|   | 5. Archive old docs                                        |                   |
|   +------------------------------------------------------------+                   |
|                            ↓                                                        |
|   Step 3.4: SHARD LARGE FILES (2-4 hours)                                          |
|   +------------------------------------------------------------+                   |
|   | tech-writer (sonnet)                                       |                   |
|   | For each large file (>500 lines):                          |                   |
|   | 1. Analyze file structure                                  |                   |
|   | 2. Identify logical sections                               |                   |
|   | 3. Split into smaller modules                              |                   |
|   | 4. Create index/overview file                              |                   |
|   | 5. Update references                                       |                   |
|   +------------------------------------------------------------+                   |
|                            ↓                                                        |
|   Step 3.5: GENERATE WORKSPACES (1 hour)                                           |
|   +------------------------------------------------------------+                   |
|   | architect-agent (opus)                                     |                   |
|   | 1. Analyze project architecture                            |                   |
|   | 2. Create agent workspace definitions                      |                   |
|   | 3. Map files to agent responsibilities                     |                   |
|   | 4. Define context loading strategies                       |                   |
|   +------------------------------------------------------------+                   |
|                                                                                     |
+=====================================================================================+
```

---

## Step 3.1: Setup Structure

**Agent:** tech-writer
**Model:** sonnet
**Duration:** 2 hours

### Activities

1. **Create .claude/ directory structure:**
```bash
mkdir -p .claude/{agents,workflows,patterns,state,templates,skills,checklists}
```

2. **Copy agent definitions:**
```bash
cp -r agent-methodology-pack/.claude/agents/* .claude/agents/
```

3. **Copy workflow files:**
```bash
cp -r agent-methodology-pack/.claude/workflows/* .claude/workflows/
```

4. **Copy pattern files:**
```bash
cp -r agent-methodology-pack/.claude/patterns/* .claude/patterns/
```

5. **Create state files:**
```bash
touch .claude/state/{AGENT-STATE.md,TASK-QUEUE.md,DEPENDENCIES.md,HANDOFFS.md,METRICS.md}
```

6. **Setup docs/ directory structure:**
```bash
mkdir -p docs/{0-DISCOVERY,1-BASELINE,2-MANAGEMENT,3-IMPLEMENTATION,4-RELEASE}
mkdir -p docs/1-BASELINE/{product,architecture,ux}
mkdir -p docs/2-MANAGEMENT/{epics/current,sprints,risks,reviews}
```

### Checkpoint 3.1

```markdown
## Structure Setup Verification

- [ ] .claude/ directory exists
- [ ] All agent subdirectories present
- [ ] All workflow files copied
- [ ] All pattern files copied
- [ ] State files created
- [ ] docs/ structure created
- [ ] Directory permissions correct
```

---

## Step 3.2: Create Core Files

**Agent:** tech-writer
**Model:** sonnet
**Duration:** 1 hour

### CLAUDE.md Template (<70 lines)

```markdown
# {Project Name}

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | {project-name} |
| Type | {project-type} |
| Tech Stack | {main-tech} |
| Status | {status} |

## Current Focus
See: @PROJECT-STATE.md

## Documentation Map
- **Current State:** @PROJECT-STATE.md
- **Agents:** @.claude/agents/ORCHESTRATOR.md
- **Workflows:** @.claude/workflows/
- **Baseline Docs:** @docs/1-BASELINE/

## Tech Stack
- **Framework:** {framework}
- **Language:** {language}
- **Database:** {database}

## Quick Commands
```bash
# Run tests
{test-command}

# Build
{build-command}
```

## AI Workflow
1. Read @PROJECT-STATE.md first
2. Check @.claude/state/TASK-QUEUE.md
3. Follow agent workflows
4. Update state after work

---
*Last updated: {date}*
```

### PROJECT-STATE.md Template

```markdown
# Project State

**Project:** {project-name}
**Phase:** Migration Complete → {next-phase}
**Last Updated:** {YYYY-MM-DD}

## Current Status
- Migrated to Agent Methodology Pack
- {current-work}

## Active Work
{describe current sprint or tasks}

## Recent Completions
- {YYYY-MM-DD}: Completed migration to Agent Methodology Pack
- {previous-items}

## Next Steps
1. {next-task-1}
2. {next-task-2}

## Blockers
{list-blockers or "None"}

---
*Migration completed: {date}*
```

### Checkpoint 3.2

```markdown
## Core Files Verification

- [ ] CLAUDE.md exists
- [ ] CLAUDE.md < 70 lines
- [ ] PROJECT-STATE.md exists
- [ ] All state files initialized
- [ ] No syntax errors
- [ ] All @references valid
```

---

## Step 3.3: Migrate Documentation

**Agent:** tech-writer
**Model:** sonnet
**Duration:** 4-8 hours (varies by project size)

### Documentation Mapping Example

```markdown
## Documentation Mapping

### 1-BASELINE (Requirements & Design)
Current Location → New Location
- README.md → docs/1-BASELINE/product/overview.md
- ARCHITECTURE.md → docs/1-BASELINE/architecture/architecture-overview.md
- API.md → docs/1-BASELINE/architecture/api-spec.md

### 2-MANAGEMENT (Epics & Sprints)
- issues/ → docs/2-MANAGEMENT/epics/
- ROADMAP.md → docs/2-MANAGEMENT/roadmap.md

### 3-IMPLEMENTATION (Code & Tests)
- CODE_GUIDE.md → docs/3-IMPLEMENTATION/code-standards.md
- TESTING.md → docs/3-IMPLEMENTATION/testing-guide.md

### 4-RELEASE (Deployment & Docs)
- CHANGELOG.md → docs/4-RELEASE/changelog.md
- DEPLOYMENT.md → docs/4-RELEASE/deployment-guide.md
```

*Documentation structure uses standard docs/ organization based on project phases*

### Checkpoint 3.3

```markdown
## Documentation Migration Verification

- [ ] All docs mapped to documentation structure
- [ ] Files moved to new locations
- [ ] Missing baseline docs created
- [ ] All cross-references updated
- [ ] Old docs archived
- [ ] No broken links
```

---

## Step 3.4: Shard Large Files

**Agent:** tech-writer
**Model:** sonnet
**Duration:** 2-4 hours (30min per large file)

### Sharding Process

For each file > 500 lines:

1. **Analyze file structure:**
```markdown
## File: api-documentation.md (850 lines)

### Sections Identified:
- Overview (50 lines)
- Authentication (150 lines)
- Endpoints (500 lines)
  - User endpoints (150 lines)
  - Product endpoints (200 lines)
  - Order endpoints (150 lines)
- Examples (100 lines)
- Error Codes (50 lines)

### Sharding Strategy:
Split into:
1. api-overview.md (100 lines) - Overview + Auth
2. api-user-endpoints.md (200 lines)
3. api-product-endpoints.md (250 lines)
4. api-order-endpoints.md (200 lines)
5. api-examples.md (100 lines)
```

2. **Create index file:**
```markdown
# API Documentation

Complete API documentation for {project}.

## Sections

- **Overview & Authentication:** @api-overview.md
- **User Endpoints:** @api-user-endpoints.md
- **Product Endpoints:** @api-product-endpoints.md
- **Order Endpoints:** @api-order-endpoints.md
- **Examples:** @api-examples.md

## Quick Navigation

| Endpoint | Method | Section |
|----------|--------|---------|
| /api/users | GET, POST | @api-user-endpoints.md |
| /api/products | GET, POST | @api-product-endpoints.md |
| /api/orders | GET, POST | @api-order-endpoints.md |
```

### Checkpoint 3.4

```markdown
## File Sharding Verification

For each large file:
- [ ] File analyzed and sections identified
- [ ] Split into modules < 500 lines each
- [ ] Index file created
- [ ] References updated
- [ ] Original archived
- [ ] No content lost
```

---

## Step 3.5: Generate Agent Workspaces

**Agent:** architect-agent
**Model:** opus
**Duration:** 1 hour

### Architecture Analysis Example

```markdown
## Architecture Analysis

### Components
- Frontend (React)
- Backend API (Node.js)
- Database (PostgreSQL)
- Auth Service (separate)

### Agent Workspace Mapping
- frontend-dev: src/components/, src/pages/, docs/1-BASELINE/ux/
- backend-dev: src/api/, src/services/, docs/1-BASELINE/architecture/api-spec.md
- database-dev: src/database/, migrations/, docs/1-BASELINE/architecture/database-schema.md
```

### Workspace Definition Template

```markdown
# {AGENT}-DEV Workspace

## Scope
{description}

## Key Files
- @src/{directory}/
- @docs/1-BASELINE/{area}/

## Context Loading Strategy
**Always Load (< 2000 tokens):**
- @CLAUDE.md
- @PROJECT-STATE.md
- @.claude/agents/{agent}.md

**Task-Specific:**
- Component being worked on
- Related tests
- Specs for the component

## Dependencies
- {dependency}: @docs/1-BASELINE/{path}
```

### File-to-Agent Mapping

```markdown
## File-to-Agent Mapping

| Directory/File | Primary Agent | Support Agent |
|----------------|---------------|---------------|
| src/components/ | frontend-dev | ux-designer |
| src/api/ | backend-dev | - |
| src/database/ | backend-dev | architect-agent |
| tests/unit/ | test-engineer | Primary dev |
| docs/1-BASELINE/architecture/ | architect-agent | - |
| docs/1-BASELINE/ux/ | ux-designer | frontend-dev |
```

### Checkpoint 3.5

```markdown
## Workspace Generation Verification

- [ ] Project architecture analyzed
- [ ] All major agents have workspace definitions
- [ ] File-to-agent mapping complete
- [ ] Context loading strategies defined
- [ ] Token budgets considered
```

---

## Parallel Work Opportunities

```
PHASE         PARALLEL OPPORTUNITIES
------        ----------------------
3.1           - Create .claude/ structure
              - Create docs/ structure
              ↓ These can run in parallel

3.3           - Migrate multiple doc categories in parallel
              - Shard multiple large files in parallel

3.5           - Define workspaces while verifying previous steps
```

---

**Previous:** @.claude/workflows/documentation/migration/MIGRATION-PLANNING.md
**Next:** @.claude/workflows/documentation/migration/MIGRATION-VERIFICATION.md
