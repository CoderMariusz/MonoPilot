# Migration Workflow

## Overview

Complete workflow for migrating existing projects to the Agent Methodology Pack. This workflow handles discovery, planning, execution, and verification phases to seamlessly integrate the methodology into your current project without disrupting ongoing work.

## ASCII Flow Diagram

```
                                MIGRATION WORKFLOW
                                        |
                                        v
+=====================================================================================+
|                            PHASE 1: DISCOVERY (30-45 min)                          |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+     +------------------+            |
|   | DOC-AUDITOR      |---->| Generate Report  |---->| GATE: Audit      |            |
|   | (Sonnet)         |     |                  |     | Complete?        |            |
|   +------------------+     +------------------+     +--------+---------+            |
|   | - Scan project   |     | AUDIT-REPORT.md: |              |                      |
|   | - File analysis  |     | - File inventory |         YES  |  NO                  |
|   | - Find orphans   |     | - Large files    |              |   |                  |
|   | - Tech stack     |     | - Tech stack     |              |   +---> Re-scan      |
|   | - Dependencies   |     | - Issues found   |              |                      |
|   | - Flag gaps      |     | - Context gaps   |              |                      |
|   +------------------+     +------------------+              |                      |
|                                                              v                      |
|   +-------------------------------------------------------------------------+      |
|   | OPTIONAL: Quick Context Interview (DISCOVERY-AGENT, depth=quick)        |      |
|   +-------------------------------------------------------------------------+      |
|   | Trigger: scan.has_gaps OR scan.missing_context                          |      |
|   | Skip if: complete docs found OR --skip-interview                        |      |
|   |                                                                          |      |
|   | - Max 7 questions about blocking unknowns                                |      |
|   | - Focus: pain points, priorities, what NOT to touch                      |      |
|   | - Output: MIGRATION-CONTEXT.md                                           |      |
|   +-------------------------------------------------------------------------+      |
|                                                                                     |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                            PHASE 2: PLANNING (1 hour)                              |
+=====================================================================================+
|                                                                                     |
|   +--------------------+                    +--------------------+                  |
|   | ORCHESTRATOR       |                    | SCRUM-MASTER       |                  |
|   | (Opus)             |                    | (Sonnet)           |                  |
|   +--------------------+                    +--------------------+                  |
|   | - Review audit     |                    | - Create plan      |                  |
|   | - Assess scope     |                    | - Prioritize       |                  |
|   | - Risk analysis    |                    | - Set timeline     |                  |
|   | - Strategy choice  |                    | - Define phases    |                  |
|   +--------------------+                    +--------------------+                  |
|            |                                         |                              |
|            +-------------------+---------------------+                              |
|                                |                                                    |
|                                v                                                    |
|                    +---------------------------+                                    |
|                    | MIGRATION-PLAN.md         |                                    |
|                    | - Strategy: Auto/Manual   |                                    |
|                    | - Priority order          |                                    |
|                    | - Risk mitigation         |                                    |
|                    | - Rollback plan           |                                    |
|                    +-------------+-------------+                                    |
|                                  |                                                  |
|                                  v                                                  |
|                    +---------------------------+                                    |
|                    | GATE: Plan Approved?      |                                    |
|                    | - Strategy clear          |                                    |
|                    | - Risks identified        |                                    |
|                    | - Timeline realistic      |                                    |
|                    +-------------+-------------+                                    |
|                                  |                                                  |
+=====================================================================================+
                                   |
                                   v
+=====================================================================================+
|                        PHASE 3: EXECUTION (1-3 days)                               |
+=====================================================================================+
|                                                                                     |
|   +-----------------------------------------------------------------------+        |
|   |                   STEP 3.1: SETUP STRUCTURE (2 hours)                 |        |
|   +-----------------------------------------------------------------------+        |
|   |                                                                        |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | TECH-WRITER (Sonnet)                                       |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | 1. Create .claude/ directory structure                     |      |        |
|   |   | 2. Copy agent definitions                                  |      |        |
|   |   | 3. Copy workflow files                                     |      |        |
|   |   | 4. Create state files                                      |      |        |
|   |   | 5. Setup docs/ BMAD structure                              |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |                            |                                           |        |
|   |                            v                                           |        |
|   |   CHECKPOINT: [ ] Structure complete                                  |        |
|   +-----------------------------------------------------------------------+        |
|                                    |                                                |
|                                    v                                                |
|   +-----------------------------------------------------------------------+        |
|   |                   STEP 3.2: CREATE CORE FILES (1 hour)                |        |
|   +-----------------------------------------------------------------------+        |
|   |                                                                        |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | TECH-WRITER (Sonnet)                                       |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | 1. Generate CLAUDE.md (<70 lines)                          |      |        |
|   |   | 2. Create PROJECT-STATE.md                                 |      |        |
|   |   | 3. Initialize state files                                  |      |        |
|   |   | 4. Create README updates                                   |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |                            |                                           |        |
|   |                            v                                           |        |
|   |   CHECKPOINT: [ ] Core files valid                                    |        |
|   +-----------------------------------------------------------------------+        |
|                                    |                                                |
|                                    v                                                |
|   +-----------------------------------------------------------------------+        |
|   |                STEP 3.3: MIGRATE DOCUMENTATION (4-8 hours)            |        |
|   +-----------------------------------------------------------------------+        |
|   |                                                                        |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | TECH-WRITER (Sonnet)                                       |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | 1. Map existing docs to BMAD structure                     |      |        |
|   |   | 2. Move/copy files to appropriate locations                |      |        |
|   |   | 3. Create missing baseline docs                            |      |        |
|   |   | 4. Update cross-references                                 |      |        |
|   |   | 5. Archive old docs                                        |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |                            |                                           |        |
|   |                            v                                           |        |
|   |   CHECKPOINT: [ ] Docs migrated & organized                           |        |
|   +-----------------------------------------------------------------------+        |
|                                    |                                                |
|                                    v                                                |
|   +-----------------------------------------------------------------------+        |
|   |                   STEP 3.4: SHARD LARGE FILES (2-4 hours)             |        |
|   +-----------------------------------------------------------------------+        |
|   |                                                                        |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | TECH-WRITER (Sonnet)                                       |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | For each large file (>500 lines):                          |      |        |
|   |   | 1. Analyze file structure                                  |      |        |
|   |   | 2. Identify logical sections                               |      |        |
|   |   | 3. Split into smaller modules                              |      |        |
|   |   | 4. Create index/overview file                              |      |        |
|   |   | 5. Update references                                       |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |                            |                                           |        |
|   |                            v                                           |        |
|   |   CHECKPOINT: [ ] All files < 500 lines or sharded                    |        |
|   +-----------------------------------------------------------------------+        |
|                                    |                                                |
|                                    v                                                |
|   +-----------------------------------------------------------------------+        |
|   |                   STEP 3.5: GENERATE WORKSPACES (1 hour)              |        |
|   +-----------------------------------------------------------------------+        |
|   |                                                                        |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | ARCHITECT-AGENT (Opus)                                      |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |   | 1. Analyze project architecture                            |      |        |
|   |   | 2. Create agent workspace definitions                      |      |        |
|   |   | 3. Map files to agent responsibilities                     |      |        |
|   |   | 4. Define context loading strategies                       |      |        |
|   |   +------------------------------------------------------------+      |        |
|   |                            |                                           |        |
|   |                            v                                           |        |
|   |   CHECKPOINT: [ ] Workspaces defined                                  |        |
|   +-----------------------------------------------------------------------+        |
|                                                                                     |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                          PHASE 4: VERIFICATION (30 min)                            |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+     +------------------+            |
|   | Run Validation   |---->| Test Agent Load  |---->| GATE: Migration  |            |
|   | Scripts          |     |                  |     | Complete?        |            |
|   +------------------+     +------------------+     +--------+---------+            |
|   | validate-        |     | Load each agent  |              |                      |
|   | migration.sh     |     | Verify @refs     |         YES  |  NO                  |
|   |                  |     | Check context    |              |   |                  |
|   | Checks:          |     | Test workflows   |              |   +---> Fix Issues   |
|   | - Structure      |     |                  |              |          & Re-verify |
|   | - Files exist    |     |                  |              |                      |
|   | - CLAUDE.md size |     |                  |              v                      |
|   | - @refs valid    |     |                  |        MIGRATION                   |
|   | - No orphans     |     |                  |        SUCCESS                     |
|   +------------------+     +------------------+                                     |
|                                                                                     |
+=====================================================================================+
```

## Detailed Steps

### Phase 1: Discovery

#### Step 1.1: Project Scanning (DOC-AUDITOR)

**Agent:** DOC-AUDITOR (virtual role - can be TECH-WRITER)
**Model:** Sonnet
**Duration:** 30 minutes

**Activities:**
1. Scan entire project directory
2. Inventory all documentation files
3. Identify large files (>500 lines)
4. Detect orphaned documentation
5. Analyze tech stack from code
6. Map existing documentation structure
7. Identify potential issues
8. **Flag context gaps** for optional interview

#### Step 1.2: Quick Context Interview (OPTIONAL)

**Agent:** DISCOVERY-AGENT
**Model:** Sonnet
**Duration:** 5-15 minutes
**Depth:** quick

**When to run:**
- Scan found significant gaps in documentation
- Project context unclear from files alone
- User explicitly requests interview
- First-time migration (no prior knowledge)

**When to skip:**
- Scan found complete PRD with goals
- Documentation is comprehensive
- User passed `--skip-interview` flag
- Re-migration of known project

**Activities:**
1. Read AUDIT-REPORT.md to understand gaps
2. Ask ONLY about blocking unknowns (max 7 questions)
3. Focus on: pain points, priorities, what NOT to touch
4. Stop as soon as basic understanding achieved
5. Save to MIGRATION-CONTEXT.md

**Quick Interview Questions (dynamic, pick relevant):**
```
Based on scan gaps, ask about:
- "What's the main goal of this migration?"
- "Are there areas we should NOT touch?"
- "What's causing the most pain currently?"
- "Which files/features are most critical?"
- "Any recent changes we should know about?"
- "Who should we contact if questions arise?"
- "What's the priority order for migration?"
```

**Output:** `docs/0-DISCOVERY/MIGRATION-CONTEXT.md` (if interview conducted)

#### Quality Gate 1.5: Context Complete
- [ ] Scan completed
- [ ] Context gaps assessed
- [ ] Interview conducted (if needed) OR skipped (if not needed)
- [ ] Basic project understanding achieved

**Scan Checklist:**
```markdown
## Project Scan Checklist

### File Inventory
- [ ] Count all markdown files
- [ ] Count all code files
- [ ] Identify documentation directories
- [ ] List README files
- [ ] Find architecture docs

### Large File Detection
- [ ] Files > 500 lines: {count}
- [ ] Files > 1000 lines: {count}
- [ ] Largest file: {name} ({lines} lines)

### Tech Stack Detection
- [ ] Languages identified
- [ ] Frameworks identified
- [ ] Dependencies analyzed
- [ ] Build tools identified

### Issue Detection
- [ ] Orphaned docs: {count}
- [ ] Broken links: {count}
- [ ] Missing READMEs: {locations}
- [ ] Duplicate content: {files}
```

**Output:** `AUDIT-REPORT.md`

#### Audit Report Template

```markdown
# Migration Audit Report

**Project:** {project-name}
**Scan Date:** {YYYY-MM-DD}
**Generated By:** DOC-AUDITOR

## Executive Summary
- Total files: {count}
- Documentation files: {count}
- Code files: {count}
- Large files needing sharding: {count}
- Migration complexity: SMALL | MEDIUM | LARGE

## File Inventory

### Documentation Files
| File | Location | Lines | Type | Issues |
|------|----------|-------|------|--------|
| README.md | root | 150 | Main | Too long |
| CONTRIBUTING.md | root | 80 | Dev | OK |
| API.md | docs/ | 600 | Tech | Needs sharding |

### Large Files Requiring Sharding
| File | Lines | Suggested Splits |
|------|-------|------------------|
| API.md | 600 | api-overview.md, api-endpoints.md, api-examples.md |
| ARCHITECTURE.md | 800 | arch-overview.md, arch-components.md, arch-decisions.md |

### Tech Stack Detected
- **Language:** {language}
- **Framework:** {framework}
- **Database:** {database}
- **Build Tool:** {build-tool}
- **Package Manager:** {pm}

### Existing Documentation Structure
```
current-project/
├── README.md
├── docs/
│   ├── api/
│   ├── guides/
│   └── architecture/
└── ...
```

### Issues Found

#### Critical Issues
- [ ] Missing CLAUDE.md
- [ ] Missing PROJECT-STATE.md
- [ ] No .claude/ structure

#### Medium Issues
- [ ] Large files need sharding: {count}
- [ ] Broken documentation links: {count}
- [ ] Orphaned documentation: {count}

#### Minor Issues
- [ ] Inconsistent file naming
- [ ] Missing table of contents
- [ ] Outdated documentation

## Migration Recommendations

### Strategy
**RECOMMEND:** AUTO | MANUAL | HYBRID

**Justification:**
{Why this strategy}

### Estimated Effort
- **Small Project** (<50 files): 4-6 hours
- **Medium Project** (50-200 files): 1-2 days
- **Large Project** (>200 files): 2-3 days

### Priority Order
1. Setup core structure (CLAUDE.md, PROJECT-STATE.md)
2. Migrate baseline documentation
3. Shard large files
4. Organize existing docs into BMAD
5. Generate agent workspaces

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | Backup before start |
| Broken references | Medium | Medium | Validation script |
| Large file issues | High | Low | Systematic sharding |

## Next Steps
1. Review this audit report
2. Create MIGRATION-PLAN.md
3. Backup project
4. Begin Phase 2: Planning
```

#### Quality Gate 1: Audit Complete
- [ ] All project files scanned
- [ ] Large files identified
- [ ] Tech stack detected
- [ ] Issues documented
- [ ] Report generated
- [ ] Strategy recommended

---

### Phase 2: Planning

#### Step 2.1: Review and Strategy (ORCHESTRATOR)

**Agent:** ORCHESTRATOR
**Model:** Opus 4.5
**Duration:** 30 minutes

**Activities:**
1. Review AUDIT-REPORT.md
2. Assess migration complexity
3. Choose migration strategy
4. Identify risks and dependencies
5. Create high-level migration plan
6. Route to SCRUM-MASTER for detailed planning

**Migration Strategies:**

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **AUTO** | Small projects, simple structure | Fast, consistent | Less control |
| **MANUAL** | Complex projects, custom structure | Full control | Time-consuming |
| **HYBRID** | Medium projects, mixed needs | Balanced | Requires planning |

**Complexity Assessment:**
```markdown
## Complexity Matrix

### SMALL (4-6 hours)
- < 50 files
- Simple structure
- Minimal documentation
- No large files
- Strategy: AUTO

### MEDIUM (1-2 days)
- 50-200 files
- Moderate structure
- Some documentation exists
- Few large files
- Strategy: HYBRID

### LARGE (2-3 days)
- > 200 files
- Complex structure
- Extensive documentation
- Many large files
- Multiple repos
- Strategy: MANUAL
```

#### Step 2.2: Detailed Planning (SCRUM-MASTER)

**Agent:** SCRUM-MASTER
**Model:** Sonnet
**Duration:** 30 minutes

**Activities:**
1. Break down migration into tasks
2. Prioritize tasks using MoSCoW
3. Estimate time for each task
4. Identify parallel work opportunities
5. Create migration timeline
6. Define success criteria
7. Plan rollback strategy

**Output:** `MIGRATION-PLAN.md`

#### Migration Plan Template

```markdown
# Migration Plan

**Project:** {project-name}
**Strategy:** AUTO | MANUAL | HYBRID
**Estimated Duration:** {hours/days}
**Start Date:** {YYYY-MM-DD}
**Owner:** TECH-WRITER

## Migration Strategy

### Approach
{Describe chosen strategy and why}

### Success Criteria
- [ ] All core files created
- [ ] CLAUDE.md < 70 lines
- [ ] All docs in BMAD structure
- [ ] No files > 500 lines (or sharded)
- [ ] All @references work
- [ ] Agent workspaces defined
- [ ] Validation passes

## Task Breakdown

### Phase 3.1: Setup Structure (2 hours)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Create .claude/ directories | MUST | 15m | None |
| Copy agent definitions | MUST | 30m | .claude/ exists |
| Copy workflow files | MUST | 30m | .claude/ exists |
| Create state files | MUST | 30m | .claude/ exists |
| Setup docs/ BMAD | MUST | 15m | None |

### Phase 3.2: Core Files (1 hour)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Generate CLAUDE.md | MUST | 30m | Audit complete |
| Create PROJECT-STATE.md | MUST | 15m | CLAUDE.md |
| Initialize state files | MUST | 15m | Structure setup |

### Phase 3.3: Migrate Docs (4-8 hours)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Map docs to BMAD | MUST | 1h | Structure setup |
| Move baseline docs | MUST | 2h | Mapping done |
| Create missing docs | SHOULD | 2h | Baseline moved |
| Update references | MUST | 2h | Docs moved |
| Archive old docs | COULD | 1h | Migration complete |

### Phase 3.4: Shard Files (2-4 hours)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Identify large files | MUST | 30m | Audit report |
| Shard each file | MUST | Varies | File identified |
| Create index files | MUST | 30m per file | Sharding done |
| Update references | MUST | 1h | All shards done |

### Phase 3.5: Workspaces (1 hour)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Analyze architecture | MUST | 30m | Docs migrated |
| Define agent workspaces | MUST | 30m | Analysis done |

## Timeline

### Day 1 (Morning)
- Phase 1: Discovery (30 min)
- Phase 2: Planning (1 hour)
- Phase 3.1: Setup (2 hours)
- Phase 3.2: Core files (1 hour)

### Day 1 (Afternoon)
- Phase 3.3: Migrate docs (4 hours)

### Day 2 (if needed)
- Phase 3.4: Shard files (2-4 hours)
- Phase 3.5: Workspaces (1 hour)
- Phase 4: Verification (30 min)

## Parallel Work Opportunities

**Can Run in Parallel:**
- Setup .claude/ structure + Setup docs/ structure
- Shard multiple large files simultaneously
- Create missing baseline docs + Archive old docs

**Must Be Sequential:**
- Audit → Planning → Execution
- Structure setup → File migration
- File migration → Validation

## Risk Mitigation

### Before Starting
- [ ] **Backup entire project**
- [ ] **Create Git branch:** `feature/agent-methodology-migration`
- [ ] **Document current state**
- [ ] **Test backup restore**

### During Migration
- [ ] Commit after each phase
- [ ] Validate references frequently
- [ ] Keep original files until verification passes
- [ ] Document any deviations from plan

### Rollback Plan
If migration fails:
1. Revert Git branch
2. Restore from backup
3. Review issues
4. Adjust plan
5. Retry

## Dependencies

### External
- [ ] Agent Methodology Pack installed
- [ ] Scripts executable
- [ ] Git initialized
- [ ] Backup created

### Internal
- [ ] Team review of audit report
- [ ] Approval to proceed
- [ ] Resource availability (agents)

## Quality Gates

| Gate | Checkpoint | Criteria |
|------|------------|----------|
| Plan Approval | Before Phase 3 | Strategy clear, timeline realistic |
| Structure Complete | After 3.1 | All directories created |
| Core Files Valid | After 3.2 | CLAUDE.md < 70 lines, valid syntax |
| Docs Migrated | After 3.3 | All docs in BMAD structure |
| Files Sharded | After 3.4 | No files > 500 lines |
| Validation Pass | Phase 4 | All checks green |

## Notes
- Estimated times are for {SMALL|MEDIUM|LARGE} project
- Adjust timeline based on project complexity
- Can pause between phases if needed
```

#### Quality Gate 2: Plan Approved
- [ ] Strategy chosen and justified
- [ ] Tasks broken down and estimated
- [ ] Timeline is realistic
- [ ] Risks identified and mitigated
- [ ] Rollback plan defined
- [ ] Backup created

---

### Phase 3: Execution

#### Step 3.1: Setup Structure

**Agent:** TECH-WRITER
**Model:** Sonnet
**Duration:** 2 hours

**Activities:**

1. **Create .claude/ directory structure:**
```bash
mkdir -p .claude/{agents/{planning,development,quality},workflows,patterns,state}
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

6. **Setup docs/ BMAD structure:**
```bash
mkdir -p docs/{0-INBOX,1-BASELINE,2-MANAGEMENT,3-IMPLEMENTATION,4-RELEASE}
mkdir -p docs/1-BASELINE/{product,architecture,ux}
mkdir -p docs/2-MANAGEMENT/{epics/current,sprints}
```

**Checkpoint:**
```markdown
## Structure Setup Verification

- [ ] .claude/ directory exists
- [ ] All agent subdirectories present
- [ ] All workflow files copied
- [ ] All pattern files copied
- [ ] State files created
- [ ] docs/ BMAD structure created
- [ ] Directory permissions correct
```

#### Step 3.2: Create Core Files

**Agent:** TECH-WRITER
**Model:** Sonnet
**Duration:** 1 hour

**Activities:**

1. **Generate CLAUDE.md (<70 lines):**

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

2. **Create PROJECT-STATE.md:**

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

3. **Initialize state files:**

Create initial content for:
- `AGENT-STATE.md` - Available agents
- `TASK-QUEUE.md` - Empty or migration tasks
- `DEPENDENCIES.md` - Project dependencies
- `HANDOFFS.md` - Future handoffs
- `METRICS.md` - Migration metrics

**Checkpoint:**
```markdown
## Core Files Verification

- [ ] CLAUDE.md exists
- [ ] CLAUDE.md < 70 lines
- [ ] PROJECT-STATE.md exists
- [ ] All state files initialized
- [ ] No syntax errors
- [ ] All @references valid
```

#### Step 3.3: Migrate Documentation

**Agent:** TECH-WRITER
**Model:** Sonnet
**Duration:** 4-8 hours (varies by project size)

**Activities:**

1. **Map existing docs to BMAD structure:**

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

2. **Move/copy files to appropriate locations:**

```bash
# Example migration script
cp README.md docs/1-BASELINE/product/overview.md
cp ARCHITECTURE.md docs/1-BASELINE/architecture/architecture-overview.md
cp API.md docs/1-BASELINE/architecture/api-spec.md
# ... continue for all docs
```

3. **Create missing baseline docs:**

Required baseline documents:
- `docs/1-BASELINE/product/prd.md` (if missing)
- `docs/1-BASELINE/architecture/architecture-overview.md` (if missing)
- `docs/1-BASELINE/architecture/tech-stack.md` (if missing)

4. **Update cross-references:**

Find and replace all documentation links to point to new locations:
```bash
# Example: Update references
find docs/ -type f -name "*.md" -exec sed -i 's|@README.md|@docs/1-BASELINE/product/overview.md|g' {} +
```

5. **Archive old docs:**

Move original files to archive:
```bash
mkdir -p docs/5-ARCHIVE/pre-migration
mv old-docs/* docs/5-ARCHIVE/pre-migration/
```

**Checkpoint:**
```markdown
## Documentation Migration Verification

- [ ] All docs mapped to BMAD structure
- [ ] Files moved to new locations
- [ ] Missing baseline docs created
- [ ] All cross-references updated
- [ ] Old docs archived
- [ ] No broken links
```

#### Step 3.4: Shard Large Files

**Agent:** TECH-WRITER
**Model:** Sonnet
**Duration:** 2-4 hours (30min per large file)

**Activities:**

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

2. **Split into smaller modules:**

```bash
# Extract sections to separate files
# Use line numbers from analysis
sed -n '1,100p' api-documentation.md > docs/1-BASELINE/architecture/api-overview.md
sed -n '101,300p' api-documentation.md > docs/1-BASELINE/architecture/api-user-endpoints.md
# ... continue for all sections
```

3. **Create index/overview file:**

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

4. **Update references:**

Update all references to the old large file to point to appropriate shard.

**Checkpoint:**
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

#### Step 3.5: Generate Agent Workspaces

**Agent:** ARCHITECT-AGENT
**Model:** Opus
**Duration:** 1 hour

**Activities:**

1. **Analyze project architecture:**

```markdown
## Architecture Analysis

### Components
- Frontend (React)
- Backend API (Node.js)
- Database (PostgreSQL)
- Auth Service (separate)

### Agent Workspace Mapping
- FRONTEND-DEV: src/components/, src/pages/, docs/1-BASELINE/ux/
- BACKEND-DEV: src/api/, src/services/, docs/1-BASELINE/architecture/api-spec.md
- DATABASE-DEV: src/database/, migrations/, docs/1-BASELINE/architecture/database-schema.md
```

2. **Create agent workspace definitions:**

Create `.claude/agents/workspaces/AGENT-NAME-workspace.md` for each agent:

```markdown
# FRONTEND-DEV Workspace

## Scope
Frontend development - React components, pages, styling

## Key Files
- @src/components/
- @src/pages/
- @src/styles/
- @docs/1-BASELINE/ux/

## Context Loading Strategy
**Always Load (< 2000 tokens):**
- @CLAUDE.md
- @PROJECT-STATE.md
- @.claude/agents/development/FRONTEND-DEV.md

**Task-Specific:**
- Component being worked on
- Related tests
- UX specs for the component

## Dependencies
- Backend API specs: @docs/1-BASELINE/architecture/api-spec.md
- Design system: @docs/1-BASELINE/ux/design-system.md
```

3. **Map files to agent responsibilities:**

```markdown
## File-to-Agent Mapping

| Directory/File | Primary Agent | Support Agent |
|----------------|---------------|---------------|
| src/components/ | FRONTEND-DEV | UX-DESIGNER |
| src/api/ | BACKEND-DEV | - |
| src/database/ | BACKEND-DEV | ARCHITECT |
| tests/unit/ | TEST-ENGINEER | Primary dev |
| docs/1-BASELINE/architecture/ | ARCHITECT | - |
| docs/1-BASELINE/ux/ | UX-DESIGNER | FRONTEND-DEV |
```

4. **Define context loading strategies:**

Document token budget and loading strategies for each agent type.

**Checkpoint:**
```markdown
## Workspace Generation Verification

- [ ] Project architecture analyzed
- [ ] All major agents have workspace definitions
- [ ] File-to-agent mapping complete
- [ ] Context loading strategies defined
- [ ] Token budgets considered
```

---

### Phase 4: Verification

#### Step 4.1: Run Validation Script

**Duration:** 15 minutes

Run the migration validation script:

```bash
bash scripts/validate-migration.sh
```

**Validation Checks:**
```markdown
## Migration Validation

### Structure Checks
- [ ] .claude/ directory exists
- [ ] .claude/agents/ subdirectories present
- [ ] .claude/workflows/ files present
- [ ] .claude/state/ files present
- [ ] docs/ BMAD structure present

### File Checks
- [ ] CLAUDE.md exists
- [ ] CLAUDE.md < 70 lines
- [ ] PROJECT-STATE.md exists
- [ ] All agent definitions present
- [ ] All workflow files present

### Content Checks
- [ ] All @references valid
- [ ] No broken links
- [ ] No files > 500 lines (or properly sharded)
- [ ] All state files initialized

### Agent Workspace Checks
- [ ] Workspace definitions exist
- [ ] File mappings complete
- [ ] Context strategies defined
```

#### Step 4.2: Test Agent Loading

**Duration:** 15 minutes

Test loading each agent:

```bash
# Test Orchestrator
claude --project . "[ORCHESTRATOR] Read @CLAUDE.md, @PROJECT-STATE.md and summarize."

# Test Frontend Dev
claude --project . "[FRONTEND-DEV] Read @CLAUDE.md and your workspace definition."

# Test Backend Dev
claude --project . "[BACKEND-DEV] Read @CLAUDE.md and your workspace definition."
```

Verify:
- [ ] All agents can load their definitions
- [ ] @references resolve correctly
- [ ] Context stays within budget
- [ ] No errors or warnings

#### Step 4.3: Test Workflows

**Duration:** 10 minutes (optional)

Create a simple test story and verify workflow:

```markdown
[ORCHESTRATOR]

Test Story: "Update README with migration notice"

Please route this story through the story workflow to verify:
1. Story assignment works
2. Agent handoffs function
3. State updates work
```

#### Quality Gate 4: Migration Complete
- [ ] All validation checks pass
- [ ] All agents can load successfully
- [ ] All @references work
- [ ] CLAUDE.md < 70 lines
- [ ] No orphaned files
- [ ] Workflows tested
- [ ] Team can use methodology

---

## Parallel Work Opportunities

```
PHASE         PARALLEL OPPORTUNITIES
------        ----------------------
Discovery     Single-threaded (must scan completely)

Planning      Review audit + Strategy decision in sequence
              Then detailed planning tasks can parallel

Execution     Structure setup:
              - Create .claude/ structure
              - Create docs/ structure
              ↓ These can run in parallel

              File migration:
              - Migrate multiple doc categories in parallel
              - Shard multiple large files in parallel

Verification  Run validation while testing agent loads
```

## Migration Strategies

### AUTO Strategy (Small Projects)

**Best For:**
- < 50 files
- Simple structure
- Minimal existing docs
- Standard tech stack

**Process:**
1. Run automated migration script
2. Review generated files
3. Make minor adjustments
4. Validate

**Advantages:**
- Fast (4-6 hours total)
- Consistent structure
- Fewer errors

**Disadvantages:**
- Less customization
- May need manual tweaks

### MANUAL Strategy (Large/Complex Projects)

**Best For:**
- > 200 files
- Complex structure
- Extensive existing docs
- Custom needs

**Process:**
1. Carefully plan each step
2. Manually execute migration
3. Custom organization
4. Thorough validation

**Advantages:**
- Full control
- Customized to project
- Can handle complexity

**Disadvantages:**
- Time-consuming (2-3 days)
- Requires expertise
- More prone to errors

### HYBRID Strategy (Medium Projects)

**Best For:**
- 50-200 files
- Moderate complexity
- Some existing structure
- Standard + custom needs

**Process:**
1. Automate structure setup
2. Manually migrate docs
3. Auto-shard large files
4. Manual workspace definition

**Advantages:**
- Balanced speed and control
- Leverage automation where safe
- Customize where needed

**Disadvantages:**
- Requires decision-making
- Mixed approach complexity

## Rollback Procedures

### If Issues Discovered in Phase 3

```
1. STOP migration immediately
2. Document what went wrong
3. Revert to backup:
   - If Git branch: git checkout main
   - If backup: restore from backup
4. Review issue
5. Adjust MIGRATION-PLAN.md
6. Re-attempt with fixes
```

### If Validation Fails in Phase 4

```
1. Identify specific failures
2. Fix issues in place (if minor)
3. Re-run validation
4. If major issues:
   - Revert to backup
   - Adjust plan
   - Re-execute affected phases
```

### Emergency Rollback

```bash
# If Git branch used
git checkout main
git branch -D feature/agent-methodology-migration

# If backup used
rm -rf .claude/
rm -rf docs/
cp -r backup/. .

# Verify rollback
ls -la
```

## Error Handling

### Error: CLAUDE.md Exceeds 70 Lines

**Recovery:**
1. Identify verbose sections
2. Extract to referenced files
3. Replace with `@reference.md` syntax
4. Re-validate line count

**Example:**
```markdown
# Before (90 lines)
## Tech Stack
- Framework: React 18
  - Features: Hooks, Concurrent Mode
  - Routing: React Router v6
  ...

# After (40 lines)
## Tech Stack
See @docs/1-BASELINE/architecture/tech-stack.md
```

### Error: Broken @References After Migration

**Recovery:**
1. Run reference validation:
   ```bash
   bash scripts/validate-docs.sh
   ```
2. Fix each broken reference
3. Update relative paths
4. Re-validate

### Error: Large File Not Properly Sharded

**Recovery:**
1. Re-analyze file structure
2. Create better shard boundaries
3. Re-split file
4. Update index and references
5. Verify all shards < 500 lines

### Error: Agent Cannot Load Workspace

**Recovery:**
1. Check workspace definition exists
2. Verify all @references in workspace
3. Test loading manually
4. Fix path issues
5. Re-test with agent

## Example Scenarios

### Scenario 1: Small Open Source Project

```
Project: CLI tool
Files: 30
Documentation: Basic README, API docs
Complexity: SMALL

Migration:
- Strategy: AUTO
- Duration: 4 hours
- Process:
  1. Run auto-migration script
  2. Review CLAUDE.md (28 lines - OK)
  3. Manually add 2 baseline docs
  4. Validate - all checks pass
- Result: SUCCESS in 4 hours
```

### Scenario 2: Medium SaaS Application

```
Project: React + Node.js app
Files: 150
Documentation: Extensive, some outdated
Large Files: 3 (800+ lines each)
Complexity: MEDIUM

Migration:
- Strategy: HYBRID
- Duration: 1.5 days
- Process:
  1. Auto-setup structure (2h)
  2. Manual doc migration (6h)
  3. Shard 3 large files (2h)
  4. Generate workspaces (1h)
  5. Validate and fix (1h)
- Result: SUCCESS in 1.5 days
```

### Scenario 3: Enterprise Monorepo

```
Project: Multi-service platform
Files: 500+
Documentation: Scattered across repos
Large Files: 15+
Complexity: LARGE

Migration:
- Strategy: MANUAL
- Duration: 3 days
- Process:
  Day 1: Discovery, planning, structure setup
  Day 2: Document migration, sharding
  Day 3: Workspace generation, validation
- Challenges:
  - Multiple repos needed coordination
  - Complex workspace definitions
  - Extensive reference updates
- Result: SUCCESS in 3 days with custom workflow
```

### Scenario 4: Legacy Project with Minimal Docs

```
Project: Python Django app
Files: 80
Documentation: Sparse (only README)
Complexity: MEDIUM (but minimal docs)

Migration:
- Strategy: HYBRID + Documentation Creation
- Duration: 2 days
- Process:
  1. Auto-setup structure (2h)
  2. Create missing baseline docs (6h) ← EXTRA
     - Write PRD from codebase analysis
     - Document architecture from code
     - Create tech-stack.md
  3. Minimal migration (2h)
  4. Generate workspaces (1h)
  5. Validate (1h)
- Result: SUCCESS + Better documentation
```

## State Updates

### After Phase 1: Discovery
```markdown
## PROJECT-STATE.md Update

**Phase:** Migration - Discovery Complete
**Last Activity:** Audit report generated
**Next:** Review audit and create migration plan

## METRICS.md Update
- Migration started: {YYYY-MM-DD}
- Files scanned: {count}
- Large files found: {count}
```

### After Phase 2: Planning
```markdown
## PROJECT-STATE.md Update

**Phase:** Migration - Planning Complete
**Last Activity:** Migration plan approved
**Next:** Execute structure setup

## MIGRATION-PLAN.md
{Created in Phase 2}
```

### After Phase 3: Execution
```markdown
## PROJECT-STATE.md Update

**Phase:** Migration - Execution Complete
**Last Activity:** All files migrated and sharded
**Next:** Validation

## METRICS.md Update
- Structure setup: {duration}
- Docs migrated: {count}
- Files sharded: {count}
```

### After Phase 4: Verification
```markdown
## PROJECT-STATE.md Update

**Phase:** Migration Complete → Ready for Development
**Last Activity:** Migration validated successfully
**Next:** Begin first epic/sprint

## METRICS.md Update
- Migration completed: {YYYY-MM-DD}
- Total duration: {duration}
- Validation: PASSED
```

## Metrics Tracking

| Metric | Description | Track When |
|--------|-------------|------------|
| Discovery duration | Time to scan and audit | Phase 1 complete |
| Planning duration | Time to create plan | Phase 2 complete |
| Structure setup time | Time to create directories | Step 3.1 complete |
| Core files time | Time to create CLAUDE.md etc | Step 3.2 complete |
| Doc migration time | Time to reorganize docs | Step 3.3 complete |
| Sharding time | Time to shard large files | Step 3.4 complete |
| Workspace time | Time to define workspaces | Step 3.5 complete |
| Validation time | Time to validate | Phase 4 complete |
| Total migration time | Start to finish | Migration complete |
| Files migrated | Count of files moved | Phase 3 complete |
| Files sharded | Count of large files split | Phase 3 complete |
| Issues found | Count of problems | Throughout |
| Issues fixed | Count of fixes | Throughout |

Update in `.claude/state/METRICS.md`

## Checklist Summary

### Pre-Migration
- [ ] Backup entire project
- [ ] Create Git branch
- [ ] Install Agent Methodology Pack
- [ ] Review audit report
- [ ] Approve migration plan

### Phase 1: Discovery
- [ ] Scan project complete
- [ ] Audit report generated
- [ ] Issues identified
- [ ] Strategy recommended

### Phase 2: Planning
- [ ] Strategy chosen
- [ ] Tasks broken down
- [ ] Timeline estimated
- [ ] Risks identified
- [ ] Plan approved

### Phase 3: Execution
- [ ] Structure setup complete
- [ ] Core files created
- [ ] CLAUDE.md < 70 lines
- [ ] Docs migrated to BMAD
- [ ] Large files sharded
- [ ] Workspaces defined

### Phase 4: Verification
- [ ] Validation script passes
- [ ] Agent loading works
- [ ] @references valid
- [ ] No broken links
- [ ] Team can use methodology

### Post-Migration
- [ ] Update team documentation
- [ ] Train team on methodology
- [ ] Archive migration artifacts
- [ ] Begin first epic/sprint

---

## Integration with Other Workflows

| Scenario | Integration |
|----------|-------------|
| After migration, start first epic | → EPIC-WORKFLOW.md |
| Need to fix migration issues | → BUG-WORKFLOW.md |
| Define first sprint | → SPRINT-WORKFLOW.md |
| Implement first story | → STORY-WORKFLOW.md |
| Ongoing doc maintenance | → TECH-WRITER agent |

---

**Migration Workflow Version:** 1.0
**Last Updated:** 2025-12-05
**Maintained by:** Agent Methodology Pack Team
