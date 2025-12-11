# GATE ENFORCEMENT PATTERN

> Design Document for ORCHESTRATOR Gate Enforcement and Agent Tracking

**Version:** 1.0
**Status:** PROPOSED
**Author:** ARCHITECT-AGENT
**Date:** 2025-12-10

---

## 1. Overview

This document defines how ORCHESTRATOR enforces quality gates and tracks agent completion across all 12 workflow definitions. The pattern ensures:

1. **Visibility** - Clear status at any point in workflow execution
2. **Enforcement** - Gates cannot be bypassed without explicit override
3. **Traceability** - All agent outputs and gate decisions are logged
4. **Recovery** - Clear paths when gates fail

---

## 2. Gate Type Taxonomy

### 2.1 Standard Gate Types

| Type | Enforcer | Criteria | Auto-Pass | Manual Override |
|------|----------|----------|-----------|-----------------|
| `QUALITY_GATE` | Agent | Objective criteria met | Yes | No |
| `APPROVAL_GATE` | Human/Agent | Explicit approval | No | N/A |
| `TEST_GATE` | Automated | Tests pass | Yes | No |
| `REVIEW_GATE` | Agent | Review completed | No | No |

### 2.2 Gate Structure (Standard Schema)

```yaml
gate:
  id: "GATE_NAME"                    # Unique identifier (SCREAMING_SNAKE_CASE)
  type: QUALITY_GATE | APPROVAL_GATE | TEST_GATE | REVIEW_GATE
  enforcer: agent-name | user | automated

  criteria:                          # All must be true to pass
    - criterion_1: "description"
    - criterion_2: "description"

  on_pass:
    next: phase_id                   # Next phase to execute
    actions: []                      # Optional actions on pass

  on_fail:
    action: wait | retry | escalate | return_to_phase
    target: phase_id                 # For return_to_phase
    max_retries: 2                   # For retry action
    escalate_to: agent | user        # For escalate action
    message: "Failure explanation"

  timeout:
    duration: "30m"                  # Optional timeout
    on_timeout: escalate | fail
```

---

## 3. Agent Tracking Format

### 3.1 Agent State Record

Each agent execution is tracked with the following structure:

```yaml
agent_execution:
  id: "exec-{workflow}-{phase}-{agent}-{timestamp}"
  workflow: epic-workflow
  phase: discovery

  agent:
    name: doc-auditor
    started_at: "2025-12-10T10:00:00Z"
    status: pending | running | completed | failed | blocked

  input:
    context_refs:
      - "docs/1-BASELINE/product/prd.md"
    parameters: {}

  output:
    status: success | blocked | failed | needs_input
    deliverables:
      - path: "docs/reviews/epic-1-baseline.md"
        created: true
        validated: false
    summary: "Baseline audit completed. 3 gaps identified."

  metrics:
    duration_seconds: 1847
    tokens_used: 4200
    retries: 0
```

### 3.2 Phase Tracking Record

```yaml
phase_tracking:
  workflow: epic-workflow
  phase:
    id: discovery
    name: "Discovery"
    started_at: "2025-12-10T10:00:00Z"
    status: in_progress | completed | blocked | failed

  agents:
    - agent: doc-auditor
      status: completed
      output_path: "docs/reviews/epic-1-baseline.md"
      completion_time: "2025-12-10T10:30:00Z"

    - agent: discovery-agent
      status: running
      progress: "3/5 questions answered"
      estimated_completion: "2025-12-10T11:15:00Z"

    - agent: research-agent
      status: pending
      depends_on: discovery-agent

  gate:
    id: DISCOVERY_COMPLETE
    status: blocked | passed | failed
    criteria_status:
      - criterion: "doc-auditor.status == completed"
        met: true
      - criterion: "discovery-agent.status == completed"
        met: false
      - criterion: "output.clarity_score >= 70%"
        met: pending
        current_value: null
```

### 3.3 Completion Tracking Pattern

```yaml
track_completion:
  workflow: epic-workflow
  phase: discovery

  required_agents:
    doc-auditor:
      status: completed
      output: "docs/reviews/epic-1-doc-baseline.md"
      validation: passed

    discovery-agent:
      status: running
      output: null
      validation: pending

    research-agent:
      status: pending
      output: null
      validation: pending
      depends_on: [discovery-agent]

  parallel_agents:
    - [doc-auditor]              # Can run immediately
    - [discovery-agent]          # Can run immediately
    - [research-agent]           # Waits for discovery-agent

  gate: DISCOVERY_COMPLETE
  gate_status: blocked
  blocking_reason: "discovery-agent still running"
```

---

## 4. Gate Check Pattern

### 4.1 Gate Evaluation Algorithm

```
FUNCTION evaluate_gate(gate_id):
    gate = load_gate_definition(gate_id)
    results = []

    FOR EACH criterion IN gate.criteria:
        result = evaluate_criterion(criterion)
        results.append({
            criterion: criterion.description,
            met: result.passed,
            current_value: result.value,
            expected_value: criterion.expected
        })

    all_met = ALL(r.met FOR r IN results)

    IF all_met:
        RETURN gate_passed(gate, results)
    ELSE:
        RETURN gate_blocked(gate, results)
```

### 4.2 Gate Check Structure

```yaml
gate_check:
  id: "check-{gate_id}-{timestamp}"
  gate_id: DISCOVERY_COMPLETE
  checked_at: "2025-12-10T11:00:00Z"

  criteria_evaluation:
    - criterion: "doc-auditor.status == completed"
      expected: completed
      actual: completed
      met: true

    - criterion: "discovery-agent.status == completed"
      expected: completed
      actual: running
      met: false

    - criterion: "output.clarity_score >= 70%"
      expected: ">=70%"
      actual: pending
      met: false
      reason: "Awaiting discovery-agent completion"

  overall_result: blocked

  on_pass:
    action: proceed_to_design

  on_fail:
    action: wait
    retry_in: "5m"
    message: |
      Cannot proceed to Design phase:
      - DOC-AUDITOR: completed
      - DISCOVERY-AGENT: still running (45 min estimated)
      - Clarity score: pending
```

### 4.3 Criterion Types

| Type | Syntax | Example |
|------|--------|---------|
| Agent Status | `{agent}.status == {status}` | `doc-auditor.status == completed` |
| Output Exists | `{agent}.output.exists` | `pm-agent.output.exists` |
| Metric Threshold | `{metric} >= {value}` | `clarity_score >= 70%` |
| Boolean Flag | `{flag} == true` | `prd_complete == true` |
| Count Check | `count({collection}) >= {n}` | `count(stories) >= 1` |
| All Complete | `all({agents}).completed` | `all(phase.agents).completed` |

---

## 5. User Status Message Templates

### 5.1 Workflow Status Template

```
WORKFLOW STATUS: {WORKFLOW_NAME}
================================================================================
Phase: {PHASE_NAME} ({completed_agents}/{total_agents} agents complete)

{FOR EACH agent IN phase.agents}
{status_icon} {AGENT_NAME}: {status_description}
   {output_line}
   {progress_line}
{END FOR}

GATE: {GATE_ID}
{gate_criteria_tree}
================================================================================
```

### 5.2 Status Icons

| Status | Icon | Description |
|--------|------|-------------|
| completed | `[DONE]` | Agent finished successfully |
| running | `[....]` | Agent currently executing |
| pending | `[WAIT]` | Agent waiting for dependencies |
| blocked | `[STOP]` | Agent blocked by issue |
| failed | `[FAIL]` | Agent execution failed |

### 5.3 Example Status Message

```
WORKFLOW STATUS: EPIC-WORKFLOW
================================================================================
Phase: DISCOVERY (2/3 agents complete)

[DONE] DOC-AUDITOR: Baseline audit done
       Output: docs/reviews/epic-1-baseline.md

[....] DISCOVERY-AGENT: Running interviews (45 min estimated)
       Progress: 3/5 questions answered

[WAIT] RESEARCH-AGENT: Waiting
       Depends on: DISCOVERY-AGENT completion

GATE: DISCOVERY_COMPLETE
+-- DOC-AUDITOR complete ............. [DONE]
+-- DISCOVERY-AGENT complete ......... [....] (in progress)
+-- Clarity score >= 70% ............. [WAIT] (pending)
+-- Status: BLOCKED - waiting for interviews
================================================================================
```

### 5.4 Gate Status Message Template

```
GATE CHECK: {GATE_ID}
--------------------------------------------------------------------------------
Type: {gate_type}
Enforcer: {enforcer}

Criteria:
{FOR EACH criterion IN criteria}
  {met_icon} {criterion.description}
     Expected: {criterion.expected}
     Actual: {criterion.actual}
{END FOR}

Result: {PASSED | BLOCKED | FAILED}
{IF blocked}
  Blocking: {blocking_reasons}
  Action: {on_fail.action}
  {retry_info}
{END IF}
--------------------------------------------------------------------------------
```

### 5.5 Example Gate Check Message

```
GATE CHECK: DESIGN_REVIEW
--------------------------------------------------------------------------------
Type: REVIEW_GATE
Enforcer: architect-agent

Criteria:
  [DONE] Architecture supports all PRD requirements
         Expected: true
         Actual: true

  [DONE] ADRs documented for key decisions
         Expected: >=1 ADR
         Actual: 2 ADRs created

  [FAIL] UX flows cover all user stories
         Expected: 5 stories covered
         Actual: 3 stories covered

  [DONE] No blocking technical questions
         Expected: 0 blockers
         Actual: 0 blockers

Result: BLOCKED
  Blocking: UX flows incomplete (3/5 user stories)
  Action: return_to_phase
  Target: design.ux_design
  Message: UX-DESIGNER needs to complete flows for stories 4 and 5
--------------------------------------------------------------------------------
```

---

## 6. ORCHESTRATOR Enforcement Rules

### 6.1 Core Enforcement Rules

```yaml
enforcement_rules:
  # Rule 1: No phase skip
  - id: NO_PHASE_SKIP
    rule: "Cannot proceed to phase N+1 until phase N gate passes"
    exception: "User explicit override with --force flag"

  # Rule 2: Agent completion required
  - id: AGENTS_MUST_COMPLETE
    rule: "All required agents in phase must complete before gate check"
    exception: "Optional agents marked in workflow"

  # Rule 3: Gate criteria atomic
  - id: CRITERIA_ATOMIC
    rule: "ALL criteria must pass for gate to pass"
    exception: "None - partial passes not allowed"

  # Rule 4: Retry limits
  - id: RETRY_LIMITS
    rule: "Failed gates retry max 2 times before escalation"
    escalate_to: "user | senior-dev | architect-agent"

  # Rule 5: Output validation
  - id: OUTPUT_VALIDATION
    rule: "Agent outputs must exist at declared paths"
    check: "File existence and non-empty"

  # Rule 6: Timeout enforcement
  - id: TIMEOUT_ENFORCEMENT
    rule: "Agents exceeding timeout are marked blocked"
    default_timeout: "30m"
    action: "escalate | retry"
```

### 6.2 Enforcement Flow

```
ORCHESTRATOR Gate Enforcement Flow:

1. PHASE START
   |
   +-> Load phase definition
   +-> Identify required agents
   +-> Check dependencies resolved
   +-> Start parallel agents where allowed
   |
2. AGENT EXECUTION
   |
   +-> Track each agent status
   +-> Update progress metrics
   +-> Collect outputs
   +-> Handle failures with retry
   |
3. GATE CHECK (triggered when all agents complete OR timeout)
   |
   +-> Evaluate all criteria
   +-> Generate status report
   |
   +-> IF all criteria met:
   |      +-> Mark gate PASSED
   |      +-> Log success
   |      +-> Proceed to next phase
   |
   +-> IF criteria not met:
          +-> Mark gate BLOCKED
          +-> Identify blocking criteria
          +-> Execute on_fail action:
               - wait: Schedule re-check
               - retry: Re-run failing agent
               - escalate: Notify user/agent
               - return_to_phase: Go back
```

### 6.3 Override Protocol

```yaml
override_protocol:
  trigger: "User requests bypass of blocked gate"

  steps:
    1. Log override request:
       - gate_id
       - blocking_criteria
       - user_justification

    2. Require explicit confirmation:
       message: |
         WARNING: Gate {gate_id} is blocked.
         Blocking criteria:
         {criteria_list}

         Bypassing this gate may cause:
         {risk_assessment}

         Type 'OVERRIDE {gate_id}' to proceed anyway.

    3. On confirmation:
       - Log override with timestamp
       - Mark gate as OVERRIDDEN (not PASSED)
       - Proceed to next phase
       - Add warning to all subsequent reports

    4. Track debt:
       - Add to TECHNICAL-DEBT.md
       - Schedule revisit in next sprint
```

---

## 7. State Persistence

### 7.1 State File Location

```
.claude/state/
  |-- WORKFLOW-STATE.md      # Active workflow tracking
  |-- AGENT-STATE.md         # Agent execution records
  |-- GATE-HISTORY.md        # Gate check history
  |-- METRICS.md             # Performance metrics
```

### 7.2 WORKFLOW-STATE.md Format

```markdown
# Workflow State

## Active Workflow

| Field | Value |
|-------|-------|
| Workflow | epic-workflow |
| Started | 2025-12-10T10:00:00Z |
| Current Phase | discovery |
| Status | in_progress |

## Phase Progress

| Phase | Status | Gate | Started | Completed |
|-------|--------|------|---------|-----------|
| discovery | in_progress | DISCOVERY_COMPLETE | 10:00 | - |
| design | pending | DESIGN_REVIEW | - | - |
| planning | pending | SPRINT_READY | - | - |
| implementation | pending | STORY_DONE | - | - |
| quality | pending | QUALITY_APPROVED | - | - |
| documentation | pending | DOCS_COMPLETE | - | - |
| deployment | pending | DEPLOYMENT_COMPLETE | - | - |

## Current Agents

| Agent | Status | Progress | Output |
|-------|--------|----------|--------|
| doc-auditor | completed | 100% | docs/reviews/epic-1-baseline.md |
| discovery-agent | running | 60% | - |
| research-agent | pending | 0% | - |

## Blocking Issues

- DISCOVERY-AGENT: Awaiting user response to question 4

## Next Actions

1. Complete discovery-agent interview
2. Start research-agent when discovery complete
3. Check DISCOVERY_COMPLETE gate
```

---

## 8. Integration with Existing Workflows

### 8.1 Workflow Gate Inventory

| Workflow | Phase Count | Gate Count | Critical Gates |
|----------|-------------|------------|----------------|
| epic-workflow | 7 | 7 | PRD_REVIEW, DESIGN_REVIEW, SPRINT_READY |
| story-delivery | 6 | 4 | RED_COMPLETE, GREEN_COMPLETE, REVIEW_APPROVED |
| sprint-workflow | 4 | 3 | SPRINT_READY, DAILY_GATES, END_GATES |
| bug-workflow | 3 | 12 | SEVERITY_ASSIGNED, FIX_COMPLETE, QA_PASSED |
| discovery-flow | 5 | 5 | SCAN_COMPLETE, INTERVIEW_COMPLETE, USER_CONFIRMED |
| planning-flow | 5 | 4 | OUTCOMES_DEFINED, EPICS_IDENTIFIED, PRIORITIZED |
| migration-workflow | 3 | 3 | AUDIT_COMPLETE, PLAN_APPROVED, MIGRATION_COMPLETE |
| feature-flow | 4 | 4 | DESIGN_COMPLETE, IMPL_COMPLETE, QA_PASSED |
| ad-hoc-flow | 4 | 4 | CODE_COMPLETE, TESTS_PASS, REVIEW_APPROVED |
| quick-fix | 4 | 4 | BUG_REPRODUCED, FIX_IMPLEMENTED, QA_VERIFIED |
| skill-development | 5 | 4 | DESIGN_APPROVED, IMPL_COMPLETE, VALIDATION_PASSED |
| new-project | 3 | 3 | PROJECT_CREATED, STRUCTURE_READY, HANDOFF_COMPLETE |

### 8.2 Gate ID Naming Convention

```
Format: {PHASE}_{CHECKPOINT}

Examples:
  DISCOVERY_COMPLETE     - Discovery phase completed
  DESIGN_REVIEW          - Design review passed
  RED_TESTS_WRITTEN      - TDD red phase complete
  GREEN_TESTS_PASS       - TDD green phase complete
  QA_VERIFIED            - QA testing passed
  USER_CONFIRMED         - User approval received
```

---

## 9. Error Recovery Patterns

### 9.1 Recovery Actions

| Situation | Action | Recovery |
|-----------|--------|----------|
| Agent timeout | escalate | Notify user, offer retry or skip |
| Agent failure | retry | Retry once, then escalate |
| Gate blocked | wait | Re-check in 5 minutes |
| Criteria impossible | escalate | User must resolve or override |
| Output missing | return_to_phase | Re-run agent that produces output |
| Dependency cycle | fail | Log error, require manual fix |

### 9.2 Recovery Message Template

```
RECOVERY REQUIRED: {situation}
--------------------------------------------------------------------------------
Phase: {phase_name}
Agent: {agent_name}
Issue: {issue_description}

Recovery Options:
  1. [RETRY] Re-run {agent_name}
  2. [SKIP] Mark as optional and proceed (if allowed)
  3. [ESCALATE] Request help from {escalate_to}
  4. [OVERRIDE] Force proceed (creates tech debt)

Enter choice [1-4]:
--------------------------------------------------------------------------------
```

---

## 10. Metrics and Reporting

### 10.1 Gate Metrics

```yaml
gate_metrics:
  - name: gate_pass_rate
    formula: "passed_gates / total_gate_checks"
    target: ">= 80%"

  - name: avg_retry_count
    formula: "total_retries / total_gate_checks"
    target: "<= 0.5"

  - name: override_rate
    formula: "overridden_gates / total_gate_checks"
    target: "<= 5%"

  - name: avg_block_duration
    formula: "sum(block_durations) / blocked_gates"
    target: "<= 30 minutes"
```

### 10.2 Report Generation

ORCHESTRATOR generates these reports:

1. **Phase Completion Report** - After each phase
2. **Gate Check Report** - After each gate evaluation
3. **Workflow Summary** - At workflow completion
4. **Daily Status** - During multi-day workflows

---

## 11. Implementation Checklist

- [ ] Add gate tracking to ORCHESTRATOR agent definition
- [ ] Create WORKFLOW-STATE.md template
- [ ] Add gate status icons to agent response templates
- [ ] Implement gate evaluation function
- [ ] Add override protocol to ORCHESTRATOR
- [ ] Update all 12 workflows with standard gate schema
- [ ] Create GATE-HISTORY.md logging
- [ ] Add metrics tracking to METRICS.md

---

## 12. ADR Reference

This pattern supports the following decisions:

- **ADR-001**: Multi-track parallel execution (gates per track)
- **ADR-002**: TDD workflow (RED/GREEN/REFACTOR gates)
- **ADR-003**: Quality gates at phase boundaries

---

## Appendix A: Full Status Message Example

```
================================================================================
                          EPIC WORKFLOW STATUS
================================================================================

Workflow: epic-workflow
Epic: User Authentication System
Started: 2025-12-10T10:00:00Z
Duration: 2h 15m

PHASE PROGRESS
================================================================================

Phase 1: DISCOVERY ....................................... [DONE]
  [DONE] DOC-AUDITOR: Baseline audit completed
         Output: docs/reviews/epic-1-doc-baseline.md
  [DONE] RESEARCH-AGENT: Market research completed
         Output: docs/1-BASELINE/research/research-report.md
  [DONE] PM-AGENT: PRD created
         Output: docs/1-BASELINE/product/prd.md
  Gate: PRD_REVIEW ...................................... [PASSED]

Phase 2: DESIGN (Parallel) ............................... [....]
  [DONE] ARCHITECT-AGENT: Architecture designed
         Output: docs/1-BASELINE/architecture/architecture-overview.md
         Output: docs/1-BASELINE/architecture/decisions/ADR-001.md
  [....] UX-DESIGNER: Wireframes in progress (70%)
         Progress: 7/10 screens designed
         Output: docs/1-BASELINE/ux/wireframes/ (partial)
  Gate: DESIGN_REVIEW ................................... [BLOCKED]

Phase 3: PLANNING ........................................ [WAIT]
Phase 4: IMPLEMENTATION .................................. [WAIT]
Phase 5: QUALITY ......................................... [WAIT]
Phase 6: DOCUMENTATION ................................... [WAIT]
Phase 7: DEPLOYMENT ...................................... [WAIT]

CURRENT GATE CHECK: DESIGN_REVIEW
================================================================================
Type: REVIEW_GATE
Enforcer: architect-agent

Criteria:
  [DONE] Architecture supports all PRD requirements
  [DONE] ADRs documented for key decisions (1 ADR created)
  [FAIL] UX flows cover all user stories (7/10 screens)
  [DONE] No blocking technical questions

Result: BLOCKED
Blocking: UX-DESIGNER needs to complete 3 more screens
Action: WAIT - Re-checking in 15 minutes
Estimated Completion: 2025-12-10T12:45:00Z

NEXT ACTIONS
================================================================================
1. UX-DESIGNER completing remaining wireframes
2. Gate re-check scheduled for 12:30
3. Planning phase starts after gate passes

================================================================================
```

---

## Appendix B: Gate Schema JSON

For programmatic gate definition:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Gate Definition",
  "type": "object",
  "required": ["id", "type", "enforcer", "criteria"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Z][A-Z0-9_]*$"
    },
    "type": {
      "enum": ["QUALITY_GATE", "APPROVAL_GATE", "TEST_GATE", "REVIEW_GATE"]
    },
    "enforcer": {
      "type": "string"
    },
    "criteria": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["criterion"],
        "properties": {
          "criterion": { "type": "string" },
          "expected": { "type": ["string", "number", "boolean"] }
        }
      }
    },
    "on_pass": {
      "type": "object",
      "properties": {
        "next": { "type": "string" },
        "actions": { "type": "array", "items": { "type": "string" } }
      }
    },
    "on_fail": {
      "type": "object",
      "properties": {
        "action": { "enum": ["wait", "retry", "escalate", "return_to_phase"] },
        "target": { "type": "string" },
        "max_retries": { "type": "integer", "default": 2 },
        "escalate_to": { "type": "string" },
        "message": { "type": "string" }
      }
    },
    "timeout": {
      "type": "object",
      "properties": {
        "duration": { "type": "string" },
        "on_timeout": { "enum": ["escalate", "fail"] }
      }
    }
  }
}
```
