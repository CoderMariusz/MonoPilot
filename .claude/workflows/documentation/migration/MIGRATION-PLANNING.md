# Migration Planning Phase

> **Part of:** @.claude/workflows/documentation/MIGRATION-WORKFLOW.md
> **Phase:** 2 of 4
> **Duration:** 1 hour

---

## Overview

Planning phase reviews the audit report, chooses migration strategy, creates detailed task breakdown, and prepares rollback procedures.

## Flow Diagram

```
+=====================================================================================+
|                            PHASE 2: PLANNING (1 hour)                              |
+=====================================================================================+
|                                                                                     |
|   +--------------------+                    +--------------------+                  |
|   | ORCHESTRATOR       |                    | scrum-master       |                  |
|   | (opus)             |                    | (opus)             |                  |
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
```

---

## Step 2.1: Review and Strategy

**Agent:** ORCHESTRATOR
**Model:** opus
**Duration:** 30 minutes

### Activities

1. Review AUDIT-REPORT.md
2. Assess migration complexity
3. Choose migration strategy
4. Identify risks and dependencies
5. Create high-level migration plan
6. Route to scrum-master for detailed planning

### Migration Strategies

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **AUTO** | Small projects, simple structure | Fast, consistent | Less control |
| **MANUAL** | Complex projects, custom structure | Full control | Time-consuming |
| **HYBRID** | Medium projects, mixed needs | Balanced | Requires planning |

### Complexity Assessment

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

---

## Step 2.2: Detailed Planning

**Agent:** scrum-master
**Model:** opus
**Duration:** 30 minutes

### Activities

1. Break down migration into tasks
2. Prioritize tasks using MoSCoW
3. Estimate time for each task
4. Identify parallel work opportunities
5. Create migration timeline
6. Define success criteria
7. Plan rollback strategy

### Output

`MIGRATION-PLAN.md`

---

## Migration Plan Template

```markdown
# Migration Plan

**Project:** {project-name}
**Strategy:** AUTO | MANUAL | HYBRID
**Estimated Duration:** {hours/days}
**Start Date:** {YYYY-MM-DD}
**Owner:** tech-writer

## Migration Strategy

### Approach
{Describe chosen strategy and why}

### Success Criteria
- [ ] All core files created
- [ ] CLAUDE.md < 70 lines
- [ ] All docs in standard documentation structure
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
| Setup docs/ structure | MUST | 15m | None |

### Phase 3.2: Core Files (1 hour)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Generate CLAUDE.md | MUST | 30m | Audit complete |
| Create PROJECT-STATE.md | MUST | 15m | CLAUDE.md |
| Initialize state files | MUST | 15m | Structure setup |

### Phase 3.3: Migrate Docs (4-8 hours)
| Task | Priority | Time | Dependencies |
|------|----------|------|--------------|
| Map docs to documentation structure | MUST | 1h | Structure setup |
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

## Quality Gates

| Gate | Checkpoint | Criteria |
|------|------------|----------|
| Plan Approval | Before Phase 3 | Strategy clear, timeline realistic |
| Structure Complete | After 3.1 | All directories created |
| Core Files Valid | After 3.2 | CLAUDE.md < 70 lines, valid syntax |
| Docs Migrated | After 3.3 | All docs in documentation structure |
| Files Sharded | After 3.4 | No files > 500 lines |
| Validation Pass | Phase 4 | All checks green |
```

---

## Quality Gate 2: Plan Approved

- [ ] Strategy chosen and justified
- [ ] Tasks broken down and estimated
- [ ] Timeline is realistic
- [ ] Risks identified and mitigated
- [ ] Rollback plan defined
- [ ] Backup created

**Pass:** → Proceed to MIGRATION-EXECUTION.md
**Fail:** → Revise plan or escalate

---

**Previous:** @.claude/workflows/documentation/migration/MIGRATION-DISCOVERY.md
**Next:** @.claude/workflows/documentation/migration/MIGRATION-EXECUTION.md
