# ORCHESTRATOR Story Implementation Template

> **Version:** 1.0
> **Created:** 2025-12-17
> **Validated:** Stories 01.1 (Backend), 01.2 (Frontend) - Both SUCCESS
> **Success Rate:** 2/2 (100%)

---

## Quick Start

### Single Story Execution

```
ORCHESTRATOR: Implement Story {STORY_ID} [{STORY_NAME}]

Context Path: docs/2-MANAGEMENT/epics/current/{EPIC}/context/{STORY_ID}/
Mode: {single-track | dual-track | quad-track}
Type: {backend | frontend | fullstack}

Workflow: 3-STORY-DELIVERY.md (7 phases TDD)
- Phase 1: UX (skip if backend)
- Phase 2: RED (tests)
- Phase 3: GREEN (implementation with tracks)
- Phase 4: REFACTOR (parallel with Phase 5)
- Phase 5: CODE REVIEW (parallel with Phase 4)
- Phase 6: QA VALIDATION
- Phase 7: DOCUMENTATION

Update PROJECT-STATE.md after each phase.
```

### Example Usage

**Backend Story:**
```
ORCHESTRATOR: Implement Story 01.1 [Org Context + Base RLS]

Context Path: docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/
Mode: quad-track
Type: backend
```

**Frontend Story:**
```
ORCHESTRATOR: Implement Story 01.2 [Settings Shell: Navigation + Role Guards]

Context Path: docs/2-MANAGEMENT/epics/current/01-settings/context/01.2/
Mode: single-track
Type: frontend
```

**Full-Stack Story:**
```
ORCHESTRATOR: Implement Story 01.5a [User Management CRUD MVP]

Context Path: docs/2-MANAGEMENT/epics/current/01-settings/context/01.5a/
Mode: quad-track
Type: fullstack
```

---

## Template Parameters

### Required Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `{STORY_ID}` | `XX.Y` format | Story identifier (e.g., `01.2`, `02.3`) |
| `{STORY_NAME}` | String | Story name from _index.yaml |
| `{EPIC}` | `XX-slug` format | Epic folder name (e.g., `01-settings`) |
| `{MODE}` | `single-track`, `dual-track`, `quad-track` | Parallel execution mode |
| `{TYPE}` | `backend`, `frontend`, `fullstack` | Story type |

### Mode Selection Guide

**Single-Track (Sequential):**
- Use for: Frontend-only stories, simple backend stories
- Example: Story 01.2 (frontend navigation components)
- Agents: 1 developer at a time
- Timeline: Linear execution

**Dual-Track (2 Parallel):**
- Use for: Independent frontend + backend work
- Example: API endpoint + corresponding UI page
- Agents: 2 developers simultaneously
- Timeline: ~50% faster than single-track

**Quad-Track (4 Parallel):**
- Use for: Complex full-stack stories, large backend stories
- Example: Story 01.1 (DB + Services + API + Types)
- Agents: Up to 4 developers simultaneously
- Timeline: ~75% faster than single-track
- Tracks: A (Database), B (Services), C (API), D (Frontend/Types)

---

## Workflow Phases

### Phase 1: UX Design
**Agent:** UX-DESIGNER
**Skip Condition:** `story.type == "backend"`
**Output:** Wireframes, component specs
**Duration:** 0.5-1 day

**Actions:**
1. Verify existing wireframes
2. Create missing component specs
3. Define UI states (loading, error, empty, success)

---

### Phase 2: RED (Test First)
**Agent:** TEST-WRITER
**Always Required:** MANDATORY
**Output:** Failing tests (15-70+ depending on complexity)
**Duration:** 15-30% of story estimate

**Test Files Created:**
- Unit tests (hooks, services, components)
- Integration tests (API endpoints)
- E2E tests (user flows)
- SQL tests (RLS policies - if backend)

**Exit Criteria:**
- All tests written
- All tests FAIL (implementation not exist)
- Coverage targets defined

---

### Phase 3: GREEN (Implementation)
**Agent:** BACKEND-DEV | FRONTEND-DEV | SENIOR-DEV
**Track Mode:** Depends on `{MODE}` parameter
**Output:** Working implementation (all tests GREEN)
**Duration:** 50-60% of story estimate

**Track Assignments (Quad-Track Example):**

| Track | Focus | Agent | Dependencies |
|-------|-------|-------|--------------|
| A | Database (migrations, RLS) | BACKEND-DEV | None |
| B | Services (business logic) | BACKEND-DEV | After Track A |
| C | API (endpoints) | BACKEND-DEV | After Track B |
| D | Frontend/Types | FRONTEND-DEV | Parallel with A |

**Single-Track (Frontend Example):**
- All components created sequentially by FRONTEND-DEV
- Order: Foundation (services, hooks) → Components → Pages

**Exit Criteria:**
- All tests GREEN
- No TypeScript errors
- Build succeeds

---

### Phase 4: REFACTOR
**Agent:** SENIOR-DEV
**Can Run Parallel:** YES (with Phase 5)
**Output:** Improved code quality
**Duration:** 15-25% of story estimate

**Checks:**
- DRY violations
- Pattern compliance (ADRs)
- Performance optimization
- Documentation completeness

---

### Phase 5: CODE REVIEW
**Agent:** CODE-REVIEWER
**Can Run Parallel:** YES (with Phase 4)
**Output:** Review report, decision (APPROVED / CHANGES REQUESTED)
**Duration:** 0.5-2 hours

**Review Areas:**
- Security (for backend: RLS, SQL injection, auth; for frontend: XSS, CSRF)
- Accessibility (WCAG 2.1 AA)
- Performance (load time targets)
- TypeScript strict mode
- ADR compliance
- Test coverage

**Exit Criteria:**
- Security: PASS
- All critical issues resolved
- Decision: APPROVED

---

### Phase 6: QA VALIDATION
**Agent:** QA-AGENT
**Output:** QA report, deployment recommendation
**Duration:** 0.5-1 day

**Testing:**
- Acceptance criteria validation (all ACs)
- Manual testing scenarios
- Cross-browser testing (if frontend)
- Mobile testing (if frontend)
- Performance testing

**Exit Criteria:**
- All ACs validated
- No critical/high bugs
- Performance targets met

---

### Phase 7: DOCUMENTATION
**Agent:** TECH-WRITER
**Output:** API docs, guides, CHANGELOG entry
**Duration:** 0.25-0.5 day

**Deliverables:**
- API documentation (if backend)
- Component documentation (if frontend)
- Hook documentation (if frontend)
- Developer guides
- CHANGELOG entry
- README updates

**Exit Criteria:**
- All docs created
- Code examples tested
- Cross-references verified

---

## Context Files Structure

Every story MUST have context files in:
```
docs/2-MANAGEMENT/epics/current/{EPIC}/context/{STORY_ID}/
├── _index.yaml       # Metadata, dependencies, deliverables
├── database.yaml     # Tables, RLS, migrations (backend)
├── api.yaml          # Endpoints, auth, patterns (backend/fullstack)
├── frontend.yaml     # Components, pages, hooks (frontend/fullstack)
├── tests.yaml        # Acceptance criteria, test specs
└── gaps.yaml         # Known gaps, workarounds
```

**Read Priority:**
1. `_index.yaml` - Start here (metadata, dependencies)
2. `tests.yaml` - Acceptance criteria
3. Type-specific: `database.yaml`, `api.yaml`, or `frontend.yaml`
4. `gaps.yaml` - Last (known limitations)

---

## Handoff Protocol Between Agents

### Standard Handoff Format

```yaml
From: {FROM_AGENT}
To: {TO_AGENT}
Story: {STORY_ID} - {STORY_NAME}
Phase: {COMPLETED_PHASE} → {NEXT_PHASE}

Artifact: {ARTIFACT_DESCRIPTION}
Tests: {X/Y passing}
Files Changed: {FILE_LIST}
Coverage: {COVERAGE_%}

Ready for:
  - {NEXT_PHASE_ACTION_1}
  - {NEXT_PHASE_ACTION_2}

Gaps: {IDENTIFIED_GAPS}
Next Action: {NEXT_PHASE_DESCRIPTION}
```

### Example Handoffs

**From TEST-WRITER to BACKEND-DEV:**
```yaml
From: TEST-WRITER
To: BACKEND-DEV
Story: 01.1 - Org Context + Base RLS
Phase: 2 RED → 3 GREEN

Tests Written: 71 test cases (49 unit + 22 integration)
Status: ALL FAILING (RED phase complete)

Implementation Order:
  1. Database migrations (Track A)
  2. Services (Track B)
  3. API endpoint (Track C)
  4. Types (Track D)

Coverage Targets:
  - Unit: 95% (security-critical)
  - Integration: 80%

Next Action: Implement to make all tests GREEN
```

**From CODE-REVIEWER to QA-AGENT:**
```yaml
From: CODE-REVIEWER
To: QA-AGENT
Story: 01.2 - Settings Shell: Navigation + Role Guards
Phase: 5 CODE REVIEW → 6 QA VALIDATION

Review Status: APPROVED
Security: PASS (0 critical, 0 major, 0 minor)
Accessibility: PASS (5 non-blocking recommendations)
Performance: PASS (160ms vs 300ms target)

Tests: 23/23 passing
Coverage: 80-90%

Ready for QA:
  - Role-based navigation filtering
  - Permission checks
  - Loading/error/empty states
  - Keyboard accessibility

Next Action: Validate all 6 acceptance criteria
```

---

## Quality Gates Checklist

### After Phase 2 (RED)
- [ ] All test files created
- [ ] 15-70+ tests written (depending on complexity)
- [ ] All tests FAIL (implementation doesn't exist)
- [ ] Coverage targets defined

### After Phase 3 (GREEN)
- [ ] All tests PASS
- [ ] All deliverables created
- [ ] No TypeScript errors
- [ ] Build succeeds

### After Phase 4 (REFACTOR)
- [ ] DRY violations resolved
- [ ] Pattern compliance verified
- [ ] Performance optimizations applied
- [ ] All tests still GREEN

### After Phase 5 (CODE REVIEW)
- [ ] Security checklist complete
- [ ] Accessibility checklist complete (if frontend)
- [ ] Performance targets validated
- [ ] Decision: APPROVED

### After Phase 6 (QA)
- [ ] All acceptance criteria validated
- [ ] All Definition of Done items checked
- [ ] Test coverage targets met
- [ ] No critical/high bugs

### After Phase 7 (DOCUMENTATION)
- [ ] All documentation created
- [ ] Code examples tested
- [ ] Cross-references verified
- [ ] CHANGELOG updated

---

## Expected Deliverables by Story Type

### Backend Story (Example: 01.1)
- **Database:** Migrations, RLS policies, seed data
- **Services:** Business logic classes
- **API:** REST endpoints
- **Errors:** Custom error classes
- **Utils:** Validation, helpers
- **Tests:** Unit + Integration + SQL tests
- **Docs:** API docs, migration docs, developer guide

### Frontend Story (Example: 01.2)
- **Services:** Client-side business logic
- **Hooks:** React hooks (data fetching, state management)
- **Components:** UI components with all states
- **Pages:** Route pages and layouts
- **Tests:** Unit + Component + E2E tests
- **Docs:** Component docs, hook docs, usage guide

### Full-Stack Story (Example: 01.5a)
- **All Backend deliverables** (DB, services, API)
- **All Frontend deliverables** (hooks, components, pages)
- **Integration:** Full flow from DB to UI
- **Tests:** Unit + Integration + E2E across stack
- **Docs:** Complete API + Component documentation

---

## Parallel Execution Rules

### When to Parallelize

**ALWAYS parallel:**
- Phase 4 (REFACTOR) + Phase 5 (CODE REVIEW)
- Independent stories (different files, no dependencies)
- Frontend + Backend tracks (after tests written)
- Multiple bug fixes (unrelated)

**NEVER parallel:**
- Same file edits (conflict risk)
- Test writing + Implementation (TDD order: RED first)
- Stories with dependencies (wait for parent)

### Track Dependencies

```
Track A (DB)  ──────┐
                    │
Track D (Types) ────┼──▶ Track B (Services) ──▶ Track C (API)
                    │
                    └──▶ Track B can start after A + D complete
```

---

## Update PROJECT-STATE.md Protocol

**After EACH phase completion, update:**

```markdown
### ✅ STORY {STORY_ID} TDD IMPLEMENTATION - {PHASE_NAME}

**Phase {N}: {PHASE_NAME}** - COMPLETE ✅
- Agent: {AGENT_NAME}
- Deliverables: {SUMMARY}
- Status: {STATUS_DESCRIPTION}
```

**After story complete:**

```markdown
## Current Session (2025-MM-DD)

### ✅ STORY {STORY_ID} TDD IMPLEMENTATION COMPLETE - {STORY_NAME}

**Type:** Full TDD Cycle (All 7 Phases)
**Status:** **PRODUCTION-READY** ✅
**Completion Date:** {DATE}
**Duration:** ~{X} hours

#### Implementation Summary - All 7 TDD Phases

{PHASE_SUMMARIES}

#### Quality Metrics Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Security** | {ISSUES} | {STATUS} |
| **Test Pass Rate** | {X/Y} | {STATUS} |
| **Test Coverage** | {%} | {STATUS} |
| ... | ... | ... |

#### Files Created/Modified ({COUNT} files)

{FILE_LIST_BY_CATEGORY}

#### Next Steps

{NEXT_ACTIONS}
```

---

## Success Metrics (From Validation)

### Story 01.1 (Backend, M complexity)
- **Duration:** ~10 hours
- **Files:** 20 (6 migrations, 11 backend, 3 tests)
- **Tests:** 71 (100% pass)
- **Docs:** 4,865 lines
- **Quality:** EXCELLENT (0 blocking issues)
- **Agents:** 6 agents used

### Story 01.2 (Frontend, S complexity)
- **Duration:** ~8 hours
- **Files:** 11 (1 service, 3 hooks, 6 components, 1 page)
- **Tests:** 26 (100% pass)
- **Docs:** 2,300 lines
- **Quality:** EXCELLENT (0 blocking issues, 5 optional enhancements)
- **Agents:** 7 agents used

---

## Common Patterns

### Pattern 1: Backend Story (Database + Services + API)

```
Phase 1: SKIP (no UX)
Phase 2: Write 40-70 tests
  - Unit tests for services
  - Integration tests for API
  - SQL tests for RLS policies

Phase 3: Implement in 4 tracks (parallel)
  Track A: Database migrations
  Track B: Services (after A)
  Track C: API routes (after B)
  Track D: Types & utils (parallel with A)

Phase 4+5: Refactor + Review (parallel)
  Focus: Security (RLS, SQL injection), ADR compliance

Phase 6: QA
  Focus: Cross-tenant isolation, admin enforcement, performance

Phase 7: Docs
  - API documentation
  - Migration documentation
  - Developer guide
```

### Pattern 2: Frontend Story (Components + Hooks)

```
Phase 1: Verify wireframes, create component specs
Phase 2: Write 15-30 tests
  - Unit tests for hooks
  - Component tests
  - E2E tests

Phase 3: Implement single-track (sequential)
  Order: Services → Hooks → Components → Pages

Phase 4+5: Refactor + Review (parallel)
  Focus: Accessibility (WCAG AA), Performance, UX

Phase 6: QA
  Focus: Role filtering, keyboard nav, mobile responsive

Phase 7: Docs
  - Component documentation
  - Hook documentation
  - Usage guide
```

### Pattern 3: Full-Stack Story (Complete Feature)

```
Phase 1: Verify UX for frontend parts
Phase 2: Write 50-100 tests
  - Backend: Services, API, RLS
  - Frontend: Hooks, components, E2E

Phase 3: Implement quad-track (4 parallel)
  Track A: Database
  Track B: Services
  Track C: API
  Track D: Frontend (parallel)

Phase 4+5: Refactor + Review (parallel)
  Focus: End-to-end security, integration, UX

Phase 6: QA
  Focus: Complete user flows, integration testing

Phase 7: Docs
  - Full API + Component documentation
  - Integration guide
```

---

## Agent Responsibilities

| Phase | Agent | Model | Duration | Can Parallel |
|-------|-------|-------|----------|--------------|
| Planning | Plan | Opus | 0.5h | No |
| 1. UX | UX-DESIGNER | Sonnet | 0.5-1 day | No |
| 2. RED | TEST-WRITER | Sonnet | 15-30% estimate | No |
| 3. GREEN | BACKEND/FRONTEND-DEV | Sonnet | 50-60% estimate | Tracks can |
| 4. REFACTOR | SENIOR-DEV | Opus | 15-25% estimate | Yes (with P5) |
| 5. REVIEW | CODE-REVIEWER | Sonnet | 0.5-2h | Yes (with P4) |
| 6. QA | QA-AGENT | Sonnet | 0.5-1 day | No |
| 7. DOCS | TECH-WRITER | Sonnet | 0.25-0.5 day | No |

---

## Troubleshooting

### Issue: Tests fail after implementation
**Solution:** Return to Phase 3 (GREEN), fix implementation, re-run tests

### Issue: Code review rejected
**Solution:** Address "Must Fix" items, return to Phase 4 (REFACTOR), resubmit for review

### Issue: QA finds bugs
**Solution:** Create bug tickets, fix via BUG-WORKFLOW, return to Phase 6

### Issue: Context files missing
**Solution:** Create context files first using story markdown as source

### Issue: Too many parallel tracks causing confusion
**Solution:** Reduce to single-track or dual-track, execute sequentially

---

## Files Created During Execution

### Story 01.1 (Backend) - 30+ files
- Database: 6 migrations
- Code: 11 files (services, errors, utils, constants)
- Tests: 3 files (71 tests)
- Docs: 8 files (4,865 lines)
- Reviews: 6 files (code review, QA reports)

### Story 01.2 (Frontend) - 25+ files
- Code: 11 files (service, hooks, components, pages)
- Tests: 6 files (26 tests)
- UX: 4 files (wireframe verification, component specs)
- Docs: 4 files (2,300 lines)
- Reviews: 7 files (code review, QA reports, handoffs)

---

## Best Practices

### 1. Always Read Context Files First
- Start with `_index.yaml`
- Understand dependencies before starting
- Check for gaps documented in `gaps.yaml`

### 2. Run Tests Frequently
- After each file in Phase 3
- After each refactoring in Phase 4
- Ensure tests remain GREEN

### 3. Parallel Execution for Efficiency
- Phase 4 + 5 always parallel
- Independent tracks in Phase 3
- Multiple stories (if no file conflicts)

### 4. Update PROJECT-STATE.md After Each Phase
- Maintains context between sessions
- Enables progress tracking
- Facilitates handoffs

### 5. Quality Gates Are Mandatory
- No skipping phases without explicit user approval
- All tests must pass before moving to next phase
- Code review must approve before QA

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial template based on Stories 01.1 and 01.2 |

---

## Related Documentation

- **ORCHESTRATOR Agent:** `.claude/agents/ORCHESTRATOR.md`
- **Story Delivery Workflow:** `.claude/workflows/documentation/3-STORY-DELIVERY.md`
- **Master Map:** `.claude/workflows/documentation/0-WORKFLOW-MASTER-MAP.md`
- **Naming Conventions:** `.claude/workflows/documentation/NAMING-CONVENTIONS.md`
