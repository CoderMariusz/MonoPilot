# Feature Flow

> **Version:** 1.0
> **Definition:** @.claude/workflows/definitions/engineering/feature-flow.yaml
> **Updated:** 2025-12-10

---

## Overview

Lightweight workflow for adding features to existing projects. Faster than STORY-WORKFLOW but maintains quality through streamlined TDD. Includes automatic PRD/Architecture updates to keep documentation in sync.

**Use when:**
- Adding single feature to existing codebase
- Scope is clear or needs quick clarification
- No major architectural changes needed
- Estimated: 1-4 hours

**Don't use when:**
- New project (use DISCOVERY-FLOW → EPIC-FLOW)
- Major refactoring (use STORY-WORKFLOW)
- Architectural changes needed (use EPIC-FLOW with ADR)

## Phase System Integration

Features are always assigned to a project phase:

| Phase | Priority | Description | Gate |
|-------|----------|-------------|------|
| **MVP** | P0 | Minimum viable product - core functionality | Must complete before P1 |
| **P1** | P1 | Essential improvements - high value | Must complete before P2 |
| **P2** | P2 | Nice to have - medium value | Must complete before P3 |
| **P3** | P3 | Future enhancements - low priority | Backlog |

### Phase Rules
```
╔══════════════════════════════════════════════════════════════════════════════╗
║  CRITICAL: Complete current phase before starting next!                       ║
║                                                                              ║
║  1. MVP features MUST be done before ANY P1 work                             ║
║  2. P1 features MUST be done before ANY P2 work                              ║
║  3. Exception: Bug fixes can happen in any phase                             ║
║  4. Exception: User explicitly requests phase skip (document reason)         ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## ASCII Flow Diagram

```
                              FEATURE FLOW
                                   |
                                   v
+=========================================================================+
|                        PHASE 0: INTAKE & ROUTING                         |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | ORCHESTRATOR                                                   |    |
|   +---------------------------------------------------------------+    |
|   | 1. Receive feature request                                     |    |
|   | 2. Check current project phase (MVP/P1/P2/P3)                  |    |
|   | 3. Validate phase alignment                                    |    |
|   | 4. Route to clarification or implementation                    |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
|                              v                                          |
|   +---------------------------------------------------------------+    |
|   | PHASE CHECK                                                    |    |
|   +---------------------------------------------------------------+    |
|   | Current Phase: {phase}                                         |    |
|   | Feature Phase: {requested_phase}                               |    |
|   |                                                                |    |
|   | If feature_phase > current_phase:                              |    |
|   |   → WARN: "MVP not complete. Add to backlog or override?"      |    |
|   |   → Options: [Add to backlog] [Override with reason]           |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
|                    ALIGNED   |   NOT ALIGNED                            |
|                       |      |        |                                 |
|                       v      |        v                                 |
|                  Continue    |   Add to phase backlog                   |
|                              |   or get override                        |
+=========================================================================+
                               |
                               v
+=========================================================================+
|                    PHASE 1: QUICK CLARIFICATION                          |
|                         (If needed)                                      |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | DECISION: Is request clear?                                    |    |
|   +---------------------------------------------------------------+    |
|   |                                                                |    |
|   | CLEAR if ALL true:                                             |    |
|   |   - What to build is obvious                                   |    |
|   |   - Where it goes is known                                     |    |
|   |   - No UX decisions needed                                     |    |
|   |   - No integration questions                                   |    |
|   |                                                                |    |
|   | UNCLEAR if ANY true:                                           |    |
|   |   - Multiple interpretations possible                          |    |
|   |   - UI/UX decisions needed                                     |    |
|   |   - Integration points unknown                                 |    |
|   |   - Edge cases unclear                                         |    |
|   +---------------------------------------------------------------+    |
|                    |                    |                               |
|                  CLEAR              UNCLEAR                             |
|                    |                    |                               |
|                    |                    v                               |
|                    |   +-------------------------------------------+   |
|                    |   | DISCOVERY-AGENT (depth=quick)              |   |
|                    |   +-------------------------------------------+   |
|                    |   | - Max 7 questions, 1 round                 |   |
|                    |   | - Focus on: what, where, how it looks      |   |
|                    |   | - Output: FEATURE-BRIEF.md                 |   |
|                    |   +-------------------------------------------+   |
|                    |                    |                               |
|                    +--------+-----------+                               |
|                             |                                           |
+=========================================================================+
                              |
                              v
+=========================================================================+
|                    PHASE 2: UX QUICK CHECK                               |
|                       (If UI component)                                  |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | DECISION: Has UI component?                                    |    |
|   +---------------------------------------------------------------+    |
|                    |                    |                               |
|                   YES                   NO                              |
|                    |                    |                               |
|                    v                    |                               |
|   +-------------------------------+     |                               |
|   | UX-DESIGNER (quick mode)      |     |                               |
|   +-------------------------------+     |                               |
|   | - Quick wireframe/sketch      |     |                               |
|   | - Key interactions only       |     |                               |
|   | - No full mockups             |     |                               |
|   | - Duration: 15-30 min         |     |                               |
|   +-------------------------------+     |                               |
|                    |                    |                               |
|                    +--------+-----------+                               |
|                             |                                           |
+=========================================================================+
                              |
                              v
+=========================================================================+
|                    PHASE 3: STREAMLINED TDD                              |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | TEST-ENGINEER (Sonnet)                                         |    |
|   +---------------------------------------------------------------+    |
|   | - Write focused tests for feature                              |    |
|   | - Cover happy path + key edge cases                            |    |
|   | - Skip exhaustive edge case testing                            |    |
|   | - Duration: 15-30 min                                          |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
|                              v                                          |
|   +---------------------------------------------------------------+    |
|   | DEV AGENT (Sonnet)                                             |    |
|   | BACKEND-DEV | FRONTEND-DEV                                     |    |
|   +---------------------------------------------------------------+    |
|   | - Implement to pass tests                                      |    |
|   | - Minimal code, no gold-plating                                |    |
|   | - Duration: 30 min - 2 hours                                   |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
|                              v                                          |
|   +---------------------------------------------------------------+    |
|   | CODE-REVIEWER (Sonnet)                                         |    |
|   +---------------------------------------------------------------+    |
|   | - Quick review, focus on:                                      |    |
|   |   - Security issues                                            |    |
|   |   - Obvious bugs                                               |    |
|   |   - AC met                                                     |    |
|   | - Skip style nitpicks                                          |    |
|   | - Flag doc_update_required                                     |    |
|   | - Duration: 15-30 min                                          |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
+=========================================================================+
                              |
                              v
+=========================================================================+
|                    PHASE 4: QUICK QA                                     |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | QA-AGENT (Sonnet, focused scope)                               |    |
|   +---------------------------------------------------------------+    |
|   | - Test new feature only                                        |    |
|   | - Quick smoke test of related areas                            |    |
|   | - No full regression                                           |    |
|   | - Duration: 15-30 min                                          |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
+=========================================================================+
                              |
                              v
+=========================================================================+
|                    PHASE 5: DOC SYNC                                     |
|                      (Automatic)                                         |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | TECH-WRITER (Sonnet)                                           |    |
|   +---------------------------------------------------------------+    |
|   | Updates (in parallel):                                         |    |
|   |                                                                |    |
|   | 1. PRD Updates Section                                         |    |
|   |    @docs/1-BASELINE/product/prd.md                             |    |
|   |    - Add to "## Updates Log"                                   |    |
|   |    - Format: date, feature, phase, brief                       |    |
|   |                                                                |    |
|   | 2. Architecture Updates (if applicable)                        |    |
|   |    @docs/1-BASELINE/architecture/                              |    |
|   |    - Add to relevant doc's "## Updates" section                |    |
|   |    - Only if feature impacts architecture                      |    |
|   |                                                                |    |
|   | 3. Feature Documentation                                       |    |
|   |    - API docs if new endpoints                                 |    |
|   |    - User guide if user-facing                                 |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
+=========================================================================+
                              |
                              v
+=========================================================================+
|                    PHASE 6: PHASE TRACKING                               |
+=========================================================================+
|                                                                         |
|   +---------------------------------------------------------------+    |
|   | Update PROJECT-STATE.md                                        |    |
|   +---------------------------------------------------------------+    |
|   | - Mark feature as DONE in phase tracker                        |    |
|   | - Update phase completion percentage                           |    |
|   | - Check if phase complete → notify for phase transition        |    |
|   +---------------------------------------------------------------+    |
|                              |                                          |
|                              v                                          |
|   +---------------------------------------------------------------+    |
|   | PHASE COMPLETION CHECK                                         |    |
|   +---------------------------------------------------------------+    |
|   | If all features in current phase DONE:                         |    |
|   |   → "Phase {X} complete! Ready to start {X+1}?"                |    |
|   |   → Update PROJECT-STATE.md phase status                       |    |
|   +---------------------------------------------------------------+    |
|                                                                         |
+=========================================================================+
                              |
                              v
                    +------------------+
                    |  FEATURE DONE    |
                    +------------------+
```

## Detailed Steps

### Phase 0: Intake & Routing

**Agent:** ORCHESTRATOR
**Duration:** 2-5 minutes

1. **Receive Request**
   ```
   User: "Add dark mode toggle to settings"
   ```

2. **Check Phase Alignment**
   ```markdown
   Current Project Phase: MVP
   Feature requested: Dark mode toggle
   Feature phase: P2 (nice to have)

   ⚠️ WARNING: Project is in MVP phase.
   Dark mode is P2 feature.

   Options:
   [1] Add to P2 backlog (recommended)
   [2] Override and implement now (requires reason)
   ```

3. **Route Decision**
   - If aligned → Continue to Phase 1
   - If not aligned → Add to backlog or get override

### Phase 1: Quick Clarification

**Agent:** DISCOVERY-AGENT (depth=quick)
**Duration:** 5-15 minutes
**Trigger:** Request is unclear

**Quick Clarification Questions (max 7):**
```markdown
## Feature Clarification: {feature_name}

1. **Scope**: What exactly should this feature do?
2. **Location**: Where in the app does this go?
3. **UI**: Does this need new UI? What should it look like?
4. **Data**: What data does this need? New or existing?
5. **Integration**: Does this connect to other features?
6. **Edge cases**: What happens when X?
7. **Success**: How do we know it works?
```

**Output:** `FEATURE-BRIEF.md`
```markdown
## Feature Brief: {name}

**Phase:** MVP | P1 | P2 | P3
**Requested:** {date}
**Clarified:** {date}

### What
{clear description}

### Where
{location in app}

### UI (if applicable)
{quick sketch or description}

### Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}

### Out of Scope
- {what this doesn't include}
```

### Phase 2: UX Quick Check

**Agent:** UX-DESIGNER (quick mode)
**Duration:** 15-30 minutes
**Trigger:** Feature has UI component

**Quick Mode Output:**
```markdown
## UX Quick Check: {feature}

### Wireframe
{ASCII or simple sketch}

### Key Interactions
1. User clicks X → Y happens
2. ...

### States
- Default: {description}
- Loading: {description}
- Error: {description}

### Notes for Dev
- {implementation hints}
```

### Phase 3: Streamlined TDD

**Agents:** TEST-ENGINEER → DEV → CODE-REVIEWER
**Duration:** 1-2 hours total

**Streamlined = Skip:**
- Exhaustive edge case tests (cover key ones)
- Full refactor phase (keep code clean as you go)
- Multiple review rounds (one pass)

**Keep:**
- Test-first approach
- Security review
- AC verification

### Phase 4: Quick QA

**Agent:** QA-AGENT
**Duration:** 15-30 minutes

**Focused Scope:**
- Test new feature thoroughly
- Smoke test adjacent features
- Skip full regression

### Phase 5: Doc Sync (CRITICAL)

**Agent:** TECH-WRITER
**Duration:** 15-30 minutes

**PRD Update Format:**
```markdown
## Updates Log

| Date | Feature | Phase | Description | Impact |
|------|---------|-------|-------------|--------|
| 2025-12-08 | Dark mode | P2 | Added toggle in settings | UI, storage |
| 2025-12-05 | Export CSV | P1 | Added data export | API |
| 2025-12-01 | User auth | MVP | Basic login/logout | Core |
```

**Architecture Update Format:**
```markdown
## Updates

### 2025-12-08: Dark mode support
- Added: ThemeContext for state management
- Modified: App wrapper with ThemeProvider
- Storage: localStorage for preference persistence
```

### Phase 6: Phase Tracking

**Update PROJECT-STATE.md:**
```markdown
## Phase Progress

### MVP (Current)
| Feature | Status | Date |
|---------|--------|------|
| User auth | ✅ Done | 2025-12-01 |
| Core dashboard | ✅ Done | 2025-12-03 |
| Data entry | 🔄 In Progress | - |
| Basic reports | ⬜ Todo | - |

**Progress:** 50% (2/4 features)
**Status:** IN PROGRESS

### P1 (Blocked by MVP)
| Feature | Status | Date |
|---------|--------|------|
| Export CSV | ⬜ Todo | - |
| Advanced filters | ⬜ Todo | - |

**Progress:** 0% (0/2 features)
**Status:** BLOCKED - Complete MVP first

### P2 (Blocked by P1)
...
```

## Quality Gates

| Phase | Gate | Criteria |
|-------|------|----------|
| Intake | Phase Check | Feature aligns with current phase |
| Clarification | Clear Brief | Requirements unambiguous |
| UX | Dev Ready | Dev can implement from spec |
| TDD | Tests Pass | All tests green |
| Review | Approved | No critical/major issues |
| QA | Verified | Feature works as expected |
| Doc Sync | Updated | PRD/Arch docs updated |
| Tracking | Recorded | Phase tracker updated |

## Integration with Other Flows

| Scenario | Integration |
|----------|-------------|
| Feature too big | Escalate to STORY-WORKFLOW |
| Needs architecture change | Escalate to EPIC-FLOW for ADR |
| Bug found during feature | BUG-WORKFLOW (can interrupt) |
| Phase complete | Notify SCRUM-MASTER for transition |
| PRD needs major update | Route to PM-AGENT |

## ORCHESTRATOR Routing

```yaml
# Trigger FEATURE-FLOW when:
- match:
    keywords: ["add feature", "implement", "create", "build", "add"]
    scope_indicators:
      - "small"
      - "quick"
      - "simple"
      - estimated_hours: "<4"
    NOT:
      - "refactor"
      - "redesign"
      - "migrate"
  workflow: "engineering/feature.yaml"

# Override to full STORY-WORKFLOW if:
- feature_grows_beyond: "4 hours estimate"
- requires: "ADR"
- impacts: "multiple epics"
```

## Error Recovery

| Situation | Recovery |
|-----------|----------|
| Feature scope grows | Pause, convert to Story, restart |
| Phase violation requested | Document reason, get approval, proceed |
| UX unclear after quick check | Escalate to full UX-DESIGNER session |
| Tests keep failing | May need SENIOR-DEV involvement |
| Doc sync missed | DOC-AUDITOR catches in sprint check |

## Metrics

Track per feature:
- Time from request to done
- Phase alignment (on-phase vs override)
- Rework rate (features that needed fixes)
- Doc sync compliance

## Example Scenarios

### Scenario 1: Clear MVP Feature
```
Request: "Add logout button to navbar"
Phase: MVP (aligned)
Clarification: Not needed (clear)
UX: Quick check → "Button in top-right, standard icon"
TDD: 45 minutes
QA: 15 minutes
Doc: PRD updated, no architecture impact
Total: ~1.5 hours
```

### Scenario 2: Unclear P1 Feature
```
Request: "Add data export"
Phase: P1 (aligned, MVP complete)
Clarification: Needed
  - Q: "What formats?" A: "CSV and JSON"
  - Q: "What data?" A: "Current view"
  - Q: "Where?" A: "Button in toolbar"
UX: Quick wireframe
TDD: 2 hours
QA: 30 minutes
Doc: PRD + API docs updated
Total: ~3.5 hours
```

### Scenario 3: Phase Override
```
Request: "Add dark mode" (P2)
Phase: MVP (not aligned)

ORCHESTRATOR: "Dark mode is P2. MVP not complete.
              Add to P2 backlog or override?"

User: "Override - client demo needs it"

Proceed with documented override:
  reason: "Client demo requirement"
  approved_by: "User"
  date: "2025-12-08"
```
