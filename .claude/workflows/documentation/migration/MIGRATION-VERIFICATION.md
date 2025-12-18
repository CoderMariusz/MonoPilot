# Migration Verification Phase

> **Part of:** @.claude/workflows/documentation/MIGRATION-WORKFLOW.md
> **Phase:** 4 of 4
> **Duration:** 30 minutes

---

## Overview

Verification phase validates the migration, tests agent loading, runs workflows, and confirms the migration was successful.

## Flow Diagram

```
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

---

## Step 4.1: Run Validation Script

**Duration:** 15 minutes

### Validation Checks

```markdown
## Migration Validation

### Structure Checks
- [ ] .claude/ directory exists
- [ ] .claude/agents/ subdirectories present
- [ ] .claude/workflows/ files present
- [ ] .claude/state/ files present
- [ ] docs/ structure present

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

---

## Step 4.2: Test Agent Loading

**Duration:** 15 minutes

### Test Commands

```bash
# Test Orchestrator
claude --project . "[ORCHESTRATOR] Read @CLAUDE.md, @PROJECT-STATE.md and summarize."

# Test Frontend Dev
claude --project . "[frontend-dev] Read @CLAUDE.md and your workspace definition."

# Test Backend Dev
claude --project . "[backend-dev] Read @CLAUDE.md and your workspace definition."
```

### Verification Checklist

- [ ] All agents can load their definitions
- [ ] @references resolve correctly
- [ ] Context stays within budget
- [ ] No errors or warnings

---

## Step 4.3: Test Workflows (Optional)

**Duration:** 10 minutes

Create a simple test story and verify workflow:

```markdown
[ORCHESTRATOR]

Test Story: "Update README with migration notice"

Please route this story through the story workflow to verify:
1. Story assignment works
2. Agent handoffs function
3. State updates work
```

---

## Quality Gate 4: Migration Complete

- [ ] All validation checks pass
- [ ] All agents can load successfully
- [ ] All @references work
- [ ] CLAUDE.md < 70 lines
- [ ] No orphaned files
- [ ] Workflows tested
- [ ] Team can use methodology

---

## Error Recovery

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

---

## Common Error Recovery

### Error: CLAUDE.md Exceeds 70 Lines

**Recovery:**
1. Identify verbose sections
2. Extract to referenced files
3. Replace with `@reference.md` syntax
4. Re-validate line count

### Error: Broken @References After Migration

**Recovery:**
1. Run reference validation
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

---

## State Updates

### After Verification Success

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

---

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

---

## Post-Migration Checklist

### Immediate
- [ ] Update team documentation
- [ ] Train team on methodology
- [ ] Archive migration artifacts
- [ ] Begin first epic/sprint

### Integration with Other Workflows

| Scenario | Integration |
|----------|-------------|
| After migration, start first epic | → 1-EPIC-DELIVERY.md |
| Need to fix migration issues | → BUG-WORKFLOW.md |
| Define first sprint | → 2-SPRINT-WORKFLOW.md |
| Implement first story | → 3-STORY-DELIVERY.md |
| Ongoing doc maintenance | → tech-writer agent |

---

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

---

**Previous:** @.claude/workflows/documentation/migration/MIGRATION-EXECUTION.md
**Back to Index:** @.claude/workflows/documentation/MIGRATION-WORKFLOW.md
