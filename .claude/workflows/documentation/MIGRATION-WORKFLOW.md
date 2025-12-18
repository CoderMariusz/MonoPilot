# Migration Workflow

> **Version:** 2.0
> **Definition:** @.claude/workflows/definitions/engineering/migration-workflow.yaml
> **Updated:** 2025-12-10

---

## Overview

Complete 10-phase workflow for migrating existing projects to the Agent Methodology Pack. Handles discovery, planning, architecture assessment, epic/story breakdown, execution, and sprint planning.

**Use when:**
- Integrating methodology into existing project
- Setting up new project with methodology
- Re-migrating after major changes

**Duration:** 1-3 days depending on project size

---

## 10-Phase Flow

```
                         MIGRATION WORKFLOW v2.0
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
   ┌─────────┐              ┌──────────┐              ┌──────────┐
   │  SMALL  │              │  MEDIUM  │              │  LARGE   │
   │  AUTO   │              │  HYBRID  │              │  MANUAL  │
   │ <50 files│              │ 50-200   │              │  >200    │
   └────┬────┘              └────┬─────┘              └────┬─────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  PHASE 1: AUDIT + DISCOVERY (30-60 min)              ║
║  Agents: DOC-AUDITOR + DISCOVERY-AGENT                               ║
║                                                                       ║
║  1A. Project Scan (DOC-AUDITOR)                                      ║
║      → Scan entire project, inventory files                          ║
║      → Identify large files (>500 lines)                             ║
║      → Detect tech stack, orphaned docs                              ║
║                                                                       ║
║  1B. Context Interview (DISCOVERY-AGENT)                             ║
║      → Quick interview to fill context gaps                          ║
║      → Migration goals, pain points, constraints                     ║
║      → Business logic gaps                                           ║
║                                                                       ║
║  Output: AUDIT-REPORT.md, MIGRATION-CONTEXT.md                       ║
║  Commit: 🔍 checkpoint: Complete migration audit and discovery       ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  PHASE 2: PRD/BASELINE CREATION (1-2 hours)          ║
║  Agent: PM-AGENT                                                     ║
║                                                                       ║
║  → Analyze existing documentation                                    ║
║  → Verify understanding with user                                    ║
║  → Define scope: stays/changes/new/removes                           ║
║  → Document assumptions for validation                               ║
║                                                                       ║
║  Output: prd.md, prd-assumptions.md, migration-scope.md              ║
║  Commit: 📋 checkpoint: Complete PRD for migration - scope defined   ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║              PHASE 3: ARCHITECTURE ASSESSMENT (1-2 hours)            ║
║  Agent: ARCHITECT-AGENT                                              ║
║                                                                       ║
║  → Assess current architecture                                       ║
║  → Document existing patterns                                        ║
║  → Identify technical debt                                           ║
║  → Map integration points                                            ║
║  → Create ADRs for changes needed                                    ║
║                                                                       ║
║  Output: system-overview.md, adrs/*.md, tech-debt.md                 ║
║  Commit: 🏗️ checkpoint: Complete architecture assessment            ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                PHASE 4: UX AUDIT (1-2 hours) [CONDITIONAL]           ║
║  Agent: UX-DESIGNER                                                  ║
║  Condition: project.has_ui_component == true                         ║
║                                                                       ║
║  → Audit existing UI/UX (skip if backend-only)                       ║
║  → Document current user flows                                       ║
║  → Identify UX debt/issues                                           ║
║  → Propose improvements (if any)                                     ║
║  → USER approval for UX changes                                      ║
║                                                                       ║
║  Output: ux-audit.md, user-flows-current.md, ux-improvements.md      ║
║  Commit: 🎨 checkpoint: Complete UX audit                            ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  PHASE 5: EPIC BREAKDOWN (2-3 hours)                 ║
║  PARALLEL EXECUTION: ARCHITECT-AGENT ∥ TEST-ENGINEER                 ║
║                                                                       ║
║  5A. Epic Structure (ARCHITECT-AGENT)                                ║
║      → Create migration epics with dependencies                      ║
║      → Clarify business logic per epic                               ║
║      → Output: epic-catalog.md, {XX}.0.epic-overview.md              ║
║                                                                       ║
║  5B. Test Strategy (TEST-ENGINEER)                                   ║
║      → Audit existing tests                                          ║
║      → Define test strategy per epic                                 ║
║      → Output: {XX}.0.test-strategy.md                               ║
║                                                                       ║
║  Commit: 📦 checkpoint: Complete epic breakdown - {epic_count} epics ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  PHASE 6: STORY BREAKDOWN (2-4 hours)                ║
║  Agent: ARCHITECT-AGENT                                              ║
║                                                                       ║
║  → Break NOW epics into INVEST-compliant stories                     ║
║  → Write AC in Given/When/Then format                                ║
║  → Map test scenarios from strategy                                  ║
║  → Follow hierarchical naming: {XX}.{N}.{story-slug}.md              ║
║                                                                       ║
║  Output: {XX}.{N}.{story-slug}.md per story                          ║
║  Commit: 📝 checkpoint: Complete story breakdown - {story_count}     ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  PHASE 7: SCOPE VALIDATION (30-60 min)               ║
║  Agent: PRODUCT-OWNER                                                ║
║                                                                       ║
║  → Validate INVEST compliance                                        ║
║  → Check for scope creep                                             ║
║  → Verify AC testability                                             ║
║  → Prioritize: P0 quick wins first                                   ║
║                                                                       ║
║  Output: scope-review-migration.md                                   ║
║  Commit: ✅ checkpoint: Scope validated - stories ready              ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                    PHASE 8: EXECUTION (2-6 hours)                    ║
║  Agents: TECH-WRITER + ARCHITECT-AGENT + DEVOPS-AGENT               ║
║                                                                       ║
║  8.1 Setup Structure (TECH-WRITER)                                   ║
║      → Create .claude/ directory structure                           ║
║      → Setup docs/ directory structure                               ║
║                                                                       ║
║  8.2 Create Core Files (TECH-WRITER)                                 ║
║      → Generate CLAUDE.md (<70 lines)                                ║
║      → Create PROJECT-STATE.md                                       ║
║                                                                       ║
║  8.3 Migrate Documentation (TECH-WRITER)                             ║
║      → Map docs to standard structure                                ║
║      → Update cross-references                                       ║
║                                                                       ║
║  8.4 Shard Large Files (TECH-WRITER)                                 ║
║      → Split files >500 lines                                        ║
║      → Create index files                                            ║
║                                                                       ║
║  8.5 Generate Workspaces (ARCHITECT-AGENT)                           ║
║      → Create agent workspace definitions                            ║
║                                                                       ║
║  8.6 Infrastructure Setup (DEVOPS-AGENT) [CONDITIONAL]               ║
║      → Migrate CI/CD pipeline                                        ║
║      → Setup deployment configs                                      ║
║                                                                       ║
║  Commit: 🔧 checkpoint: Execute migration - structure ready          ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                   PHASE 9: VERIFICATION (30-60 min)                  ║
║  Agent: DOC-AUDITOR + DEVOPS-AGENT                                   ║
║                                                                       ║
║  9.1 Validation Script                                               ║
║      → bash scripts/validate-migration.sh                            ║
║      → Check .claude/ directory exists                               ║
║      → Verify CLAUDE.md < 70 lines                                   ║
║      → Validate all @references                                      ║
║      → Confirm no files > 500 lines                                  ║
║                                                                       ║
║  9.2 Test Agent Loading                                              ║
║      → All agents can load                                           ║
║      → @references resolve                                           ║
║      → Context within budget                                         ║
║                                                                       ║
║  9.3 Deployment Validation (DEVOPS-AGENT) [CONDITIONAL]              ║
║      → Validate CI/CD pipeline                                       ║
║      → Test deployment configs                                       ║
║                                                                       ║
║  Commit: ✅ checkpoint: Verification passed                          ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  PHASE 10: SPRINT PLANNING (1 hour)                  ║
║  Agent: SCRUM-MASTER                                                 ║
║                                                                       ║
║  → Create Sprint 1 backlog                                           ║
║  → Prioritize P0 quick wins first                                    ║
║  → Plan capacity                                                     ║
║  → Finalize rollback plan                                            ║
║  → Define Definition of Done                                         ║
║                                                                       ║
║  Output: sprint-01-plan.md                                           ║
║  Commit: 🏃 checkpoint: Sprint 1 planned - migration ready           ║
╚══════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
                        MIGRATION COMPLETE ✅
```

---

## Next Workflows

After migration completes, continue with these workflows:

| Workflow | Purpose | When |
|----------|---------|------|
| **2-SPRINT-WORKFLOW** | Plan implementation: tracks, dependencies, roadmap | IMMEDIATELY after migration |
| **3-STORY-DELIVERY** | Implement each story using TDD (RED→GREEN→REFACTOR) | For each story in sprint backlog |
| **1-EPIC-DELIVERY** | Continue with next epic | When all stories in epic are done |

**Flow:** migration → 2-SPRINT-WORKFLOW → 3-STORY-DELIVERY

---

## Naming Conventions

All documentation follows hierarchical naming pattern: **{XX}.{N}.{M}.{slug}**

| Component | Description | Example |
|-----------|-------------|---------|
| **XX** | Epic number (2 digits) | 01, 02, 03 |
| **N** | Story number | 1, 2, 3 |
| **M** | Subtask number (optional) | 1, 2 |
| **slug** | kebab-case description | setup-structure |

### Examples

**Epic Folder:**
```
docs/2-MANAGEMENT/epics/01-structure-setup/
```

**Epic Files:**
```
01.0.epic-overview.md       # Epic definition
01.0.test-strategy.md       # Test strategy for epic
01.0.clarifications.md      # Business logic clarifications
```

**Story Files:**
```
01.1.create-claude-dir.md
01.2.migrate-docs.md
02.1.create-claude-md.md
```

**Test Files:**
```
tests/01-structure-setup/01.1.create-claude-dir.test.ts
tests/01-structure-setup/01.2.migrate-docs.test.ts
```

---

## Migration Strategies

| Strategy | Files | Duration | Use When |
|----------|-------|----------|----------|
| **AUTO** | <50 | 4-6 hours | Simple structure, minimal docs |
| **HYBRID** | 50-200 | 1-2 days | Moderate complexity |
| **MANUAL** | >200 | 2-3 days | Complex structure, extensive docs |

---

## State Updates & Commits

Each phase updates PROJECT-STATE.md and creates a commit:

| Phase | State Update | Commit Message |
|-------|--------------|----------------|
| 1. Audit + Discovery | phase: "discovery" | 🔍 checkpoint: Complete migration audit and discovery |
| 2. PRD/Baseline | phase: "prd" | 📋 checkpoint: Complete PRD for migration - scope defined |
| 3. Architecture | phase: "architecture" | 🏗️ checkpoint: Complete architecture assessment |
| 4. UX Audit | phase: "ux_design" | 🎨 checkpoint: Complete UX audit |
| 5. Epic Breakdown | phase: "epic" | 📦 checkpoint: Complete epic breakdown - {epic_count} epics |
| 6. Story Breakdown | phase: "stories" | 📝 checkpoint: Complete story breakdown - {story_count} stories |
| 7. Scope Validation | phase: "scope_validation" | ✅ checkpoint: Scope validated - stories ready |
| 8. Execution | phase: "development" | 🔧 checkpoint: Execute migration - structure ready |
| 9. Verification | phase: "testing" | ✅ checkpoint: Verification passed |
| 10. Sprint Planning | phase: "sprint_planning", set_active_sprint: 1 | 🏃 checkpoint: Sprint 1 planned - migration ready |

All state updates sync to root PROJECT-STATE.md via `scripts/sync-state.sh`.

---

## Quality Gates

| Gate ID | Phase | Enforcer | Key Criteria |
|---------|-------|----------|--------------|
| **DISCOVERY_COMPLETE** | 1. Audit + Discovery | DOC-AUDITOR + DISCOVERY-AGENT | All files scanned, context gaps addressed |
| **PRD_APPROVED** | 2. PRD/Baseline | PM-AGENT + PRODUCT-OWNER + USER | PRD complete, assumptions validated |
| **ARCHITECTURE_ASSESSED** | 3. Architecture | ARCHITECT-AGENT | Architecture documented, tech debt identified |
| **UX_AUDITED** | 4. UX Audit | UX-DESIGNER + USER | UX audit complete OR backend-only skip |
| **EPICS_DEFINED** | 5. Epic Breakdown | ARCHITECT + PRODUCT-OWNER + TEST-ENGINEER | Epics mapped, dependencies clear, test strategy defined |
| **STORIES_CREATED** | 6. Story Breakdown | ARCHITECT-AGENT | Stories INVEST compliant, AC in Given/When/Then |
| **STORIES_READY** | 7. Scope Validation | PRODUCT-OWNER | All stories validated, no scope creep |
| **MIGRATION_EXECUTED** | 8. Execution | ORCHESTRATOR | .claude/ structure complete, docs migrated |
| **VERIFICATION_PASSED** | 9. Verification | DOC-AUDITOR | All validation checks pass, agents load |
| **SPRINT_PLANNED** | 10. Sprint Planning | SCRUM-MASTER | Sprint backlog defined, P0 items prioritized |

---

## Quick Start Checklist

### Pre-Migration
- [ ] Backup entire project
- [ ] Create Git branch: `feature/agent-methodology-migration`
- [ ] Review audit report
- [ ] Approve migration plan

### Phase 1: Audit + Discovery
- [ ] Project scan complete (DOC-AUDITOR)
- [ ] Context interview done (DISCOVERY-AGENT)
- [ ] AUDIT-REPORT.md generated
- [ ] MIGRATION-CONTEXT.md created
- [ ] State committed

### Phase 2: PRD/Baseline
- [ ] PRD created from existing docs
- [ ] Current vs target state documented
- [ ] Migration scope defined (stays/changes/new/removes)
- [ ] Assumptions validated with user
- [ ] State committed

### Phase 3: Architecture Assessment
- [ ] Current architecture documented
- [ ] Tech debt inventoried
- [ ] Integration points mapped
- [ ] ADRs for major changes
- [ ] State committed

### Phase 4: UX Audit (conditional)
- [ ] UX audit complete OR backend-only skip
- [ ] User approved findings
- [ ] State committed

### Phase 5: Epic Breakdown
- [ ] Migration work mapped to epics
- [ ] Epic dependencies identified
- [ ] Test strategy per epic
- [ ] Business logic clarified
- [ ] State committed

### Phase 6: Story Breakdown
- [ ] NOW epics broken into stories
- [ ] Stories follow INVEST
- [ ] AC in Given/When/Then
- [ ] Hierarchical naming followed
- [ ] State committed

### Phase 7: Scope Validation
- [ ] INVEST compliance validated
- [ ] No scope creep
- [ ] AC testable
- [ ] Priority assigned
- [ ] State committed

### Phase 8: Execution
- [ ] Structure setup complete
- [ ] Core files created
- [ ] CLAUDE.md < 70 lines
- [ ] Docs migrated to docs/ structure
- [ ] Large files sharded
- [ ] Workspaces defined
- [ ] Infrastructure setup (if needed)
- [ ] State committed

### Phase 9: Verification
- [ ] Validation script passes
- [ ] Agent loading works
- [ ] @references valid
- [ ] Deployment validated (if applicable)
- [ ] State committed

### Phase 10: Sprint Planning
- [ ] Sprint 1 backlog created
- [ ] P0 quick wins prioritized
- [ ] Capacity allocated
- [ ] Rollback plan ready
- [ ] Definition of Done defined
- [ ] State committed

---

## Artifacts by Phase

| Phase | Artifact | Path |
|-------|----------|------|
| 1. Audit + Discovery | Audit Report | `AUDIT-REPORT.md` |
| 1. Audit + Discovery | Migration Context | `docs/0-DISCOVERY/MIGRATION-CONTEXT.md` |
| 1. Audit + Discovery | Clarifications | `docs/0-DISCOVERY/CLARIFICATIONS.md` |
| 2. PRD/Baseline | PRD | `docs/1-BASELINE/product/prd.md` |
| 2. PRD/Baseline | PRD Assumptions | `docs/1-BASELINE/product/prd-assumptions.md` |
| 2. PRD/Baseline | Migration Scope | `docs/1-BASELINE/product/migration-scope.md` |
| 3. Architecture | System Overview | `docs/1-BASELINE/architecture/system-overview.md` |
| 3. Architecture | ADRs | `docs/1-BASELINE/architecture/adrs/*.md` |
| 3. Architecture | Tech Debt | `docs/1-BASELINE/architecture/tech-debt.md` |
| 3. Architecture | Integration Map | `docs/1-BASELINE/architecture/integration-map.md` |
| 4. UX Audit | UX Audit | `docs/3-ARCHITECTURE/ux/ux-audit.md` |
| 4. UX Audit | User Flows | `docs/3-ARCHITECTURE/ux/user-flows-current.md` |
| 4. UX Audit | UX Improvements | `docs/3-ARCHITECTURE/ux/ux-improvements.md` |
| 5. Epic Breakdown | Epic Catalog | `docs/2-MANAGEMENT/epics/epic-catalog.md` |
| 5. Epic Breakdown | Dependency Graph | `docs/2-MANAGEMENT/epics/dependency-graph.md` |
| 5. Epic Breakdown | Epic Overview | `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.0.epic-overview.md` |
| 5. Epic Breakdown | Epic Clarifications | `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.0.clarifications.md` |
| 5. Epic Breakdown | Test Strategy | `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.0.test-strategy.md` |
| 6. Story Breakdown | Story Files | `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.{N}.{story-slug}.md` |
| 7. Scope Validation | Scope Review | `docs/2-MANAGEMENT/reviews/scope-review-migration.md` |
| 8. Execution | CLAUDE.md | `CLAUDE.md` |
| 8. Execution | PROJECT-STATE.md | `PROJECT-STATE.md` |
| 8. Execution | Workspaces | `.claude/agents/workspaces/` |
| 10. Sprint Planning | Sprint Plan | `docs/2-MANAGEMENT/sprints/sprint-01-plan.md` |

---

## Rollback Procedures

### Any Phase Failure

1. **STOP** migration
2. **Document** issue
3. **Revert** to backup
4. **Adjust** plan
5. **Re-attempt**

### Emergency Rollback

```bash
git checkout main
rm -rf .claude/
cp -r backup/. .
```

### Phase-Specific Rollback

| Phase | Rollback Action |
|-------|-----------------|
| 1-2 | Delete generated docs, restart phase |
| 3-7 | Return to previous phase gate |
| 8 | Remove .claude/ structure, restore backup |
| 9 | Fix validation failures, re-run verification |
| 10 | Revise sprint plan |

---

## Error Recovery Summary

| Error | Recovery |
|-------|----------|
| CLAUDE.md > 70 lines | Extract to @references |
| Broken @references | Fix paths, re-validate |
| Large file not sharded | Re-split, update index |
| Agent load failure | Check workspace, fix paths |
| Validation script fails | Fix reported issues, re-run |
| Epic dependencies unclear | Return to Phase 5, clarify |
| Stories not INVEST | Return to Phase 6, rewrite |
| Major failure | Rollback to backup, revise plan |

---

## Related Documentation

- **Workflow Definition:** @.claude/workflows/definitions/engineering/migration-workflow.yaml
- **Sprint Planning:** @.claude/workflows/documentation/2-SPRINT-WORKFLOW.md
- **Story Delivery:** @.claude/workflows/documentation/3-STORY-DELIVERY.md
- **Epic Management:** @.claude/workflows/documentation/1-EPIC-DELIVERY.md
- **Orchestrator Agent:** @.claude/agents/ORCHESTRATOR.md
- **Tech Writer Agent:** @.claude/agents/TECH-WRITER.md
- **Doc Auditor Agent:** @.claude/agents/DOC-AUDITOR.md

---

**Migration Workflow Version:** 2.0
**Last Updated:** 2025-12-10
**Maintained by:** Agent Methodology Pack Team
