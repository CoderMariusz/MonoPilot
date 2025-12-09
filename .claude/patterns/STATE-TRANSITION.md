# State Transition Pattern

## Overview

Agent state transitions define how agents move between operational states during project execution. Proper state management ensures:

- Clear visibility into agent availability and workload
- Predictable handoff coordination between agents
- Early detection of blockers and impediments
- Efficient resource allocation by the Scrum Master
- Accurate project status tracking

State transitions are the foundation of multi-agent coordination, enabling the team to function as a coherent unit rather than isolated workers.

## Agent States

### 1. Inactive
Agent is not currently engaged with any project work.

**Characteristics:**
- No active session
- No assigned tasks
- Definition loaded but not executing
- Available for assignment

**Entry Conditions:**
- Agent completed all assigned work
- Agent released from project
- Session expired without new assignment

### 2. Ready
Agent is prepared and available to accept new tasks.

**Characteristics:**
- Definition loaded and validated
- Context initialized
- Awaiting task assignment
- Can accept work immediately

**Entry Conditions:**
- Agent definition loaded successfully
- Previous task completed
- Unblocked after impediment resolved

### 3. Active
Agent is currently executing assigned work.

**Characteristics:**
- Working on specific task/story
- Context actively being used
- Producing artifacts
- May be consuming token budget

**Entry Conditions:**
- Task assigned by Scrum Master
- Story pulled from sprint backlog
- Dependency resolved and work resumed

### 4. Waiting
Agent is paused, awaiting external dependency or handoff.

**Characteristics:**
- Task in progress but paused
- Waiting for input from another agent
- Waiting for external resource
- Cannot proceed without resolution

**Entry Conditions:**
- Handoff initiated to another agent
- Waiting for approval/review
- Waiting for dependency completion
- Waiting for external API/resource

### 5. Blocked
Agent cannot proceed due to impediment.

**Characteristics:**
- Work halted
- Impediment requires intervention
- May need escalation
- Previous state preserved for return

**Entry Conditions:**
- Technical impediment discovered
- Missing critical information
- Access/permission issues
- Conflicting requirements

## Valid Transitions

| From | To | Trigger | Description |
|------|-----|---------|-------------|
| Inactive | Ready | Definition Loaded | Agent initialized and prepared for work |
| Ready | Active | Task Assigned | Work begins on assigned story/task |
| Active | Waiting | Dependency Required | Work paused pending external input |
| Active | Ready | Task Complete | Work finished, available for new task |
| Waiting | Active | Dependency Resolved | Input received, work resumes |
| Any | Blocked | Impediment Detected | Work cannot continue |
| Blocked | Previous | Impediment Resolved | Return to state before blocking |

### Invalid Transitions

The following transitions are NOT allowed:

- Inactive -> Active (must go through Ready first)
- Inactive -> Waiting (cannot wait without first being active)
- Waiting -> Ready (must return to Active first to complete or hand off)
- Ready -> Waiting (cannot wait without task assignment)

## State Transition Diagram

```
                          +-------------+
                          |  INACTIVE   |
                          +------+------+
                                 |
                    Definition   |
                      Loaded     v
                          +------+------+
          +-------------->|    READY    |<--------------+
          |               +------+------+               |
          |                      |                      |
     Task |            Task      |                      | Task
  Complete|          Assigned    v                      | Complete
          |               +------+------+               |
          +---------------|   ACTIVE    |---------------+
                          +------+------+
                                 |
                    Dependency   |   Dependency
                     Required    |   Resolved
                                 v
                          +------+------+
                          |   WAITING   |
                          +-------------+

    ============================================

    ANY STATE can transition to BLOCKED:

         +-----------------------------------+
         |           ANY STATE              |
         +----------------+------------------+
                          |
             Impediment   |   Impediment
              Detected    |   Resolved
                          v
                  +-------+-------+
                  |    BLOCKED    |-------> Previous State
                  +---------------+
```

## State Update Protocol

### Who Updates State

| Transition | Updated By | Verified By |
|------------|------------|-------------|
| Inactive -> Ready | Agent (self) | Scrum Master |
| Ready -> Active | Scrum Master | Agent (confirms) |
| Active -> Waiting | Agent (self) | Scrum Master |
| Active -> Ready | Agent (self) | Scrum Master |
| Waiting -> Active | Scrum Master | Agent (confirms) |
| Any -> Blocked | Agent or Scrum Master | Both verify |
| Blocked -> Previous | Scrum Master | Agent (confirms) |

### When to Update

Update state IMMEDIATELY when:
1. Transition trigger occurs
2. Before starting new work
3. After completing work
4. When blocked/unblocked
5. During handoff initiation/completion

### What to Record in AGENT-STATE.md

```markdown
## State Update Record

**Timestamp:** {YYYY-MM-DD HH:MM}
**Agent:** {AGENT-NAME}
**Transition:** {FROM-STATE} -> {TO-STATE}

### Trigger
{What caused this transition}

### Context
- Story: {story ID if applicable}
- Task: {current task description}
- Previous Duration: {time in previous state}

### Artifacts (if completing)
- {artifact 1}
- {artifact 2}

### Dependencies (if waiting)
- Waiting For: {agent/resource}
- Expected Resolution: {estimate}

### Impediment (if blocked)
- Reason: {description}
- Impact: {what is affected}
- Resolution Plan: {proposed solution}
```

## Transition Events

### Inactive -> Ready

**Trigger:** Agent definition loaded and validated

**Required Data:**
- Agent ID
- Agent role/type
- Available skills
- Token budget allocation

**Actions:**
1. Load agent definition
2. Initialize context
3. Verify dependencies available
4. Register in AGENT-STATE.md
5. Notify Scrum Master of availability

### Ready -> Active

**Trigger:** Task assigned by Scrum Master

**Required Data:**
- Story ID
- Task description
- Acceptance criteria
- Dependencies list
- Priority level

**Actions:**
1. Receive task assignment
2. Load relevant context
3. Update AGENT-STATE.md
4. Begin work execution
5. Start session timer

### Active -> Waiting

**Trigger:** External dependency required

**Required Data:**
- What is needed
- Who provides it
- Expected wait time
- Current progress state

**Actions:**
1. Save current work state
2. Document dependency
3. Initiate handoff if needed
4. Update AGENT-STATE.md
5. Notify dependent agent/Scrum Master

### Active -> Ready

**Trigger:** Task completed successfully

**Required Data:**
- Completion status
- Artifacts produced
- Any follow-up needed
- Session duration

**Actions:**
1. Finalize artifacts
2. Document completion
3. Update AGENT-STATE.md
4. Clear task context
5. Notify Scrum Master of availability

### Waiting -> Active

**Trigger:** Dependency resolved

**Required Data:**
- Resolution details
- Received artifacts
- Any scope changes
- Updated context

**Actions:**
1. Receive dependency resolution
2. Restore work context
3. Update AGENT-STATE.md
4. Resume work execution
5. Acknowledge receipt

### Any -> Blocked

**Trigger:** Impediment prevents progress

**Required Data:**
- Impediment description
- Impact assessment
- Previous state (for return)
- Potential resolutions

**Actions:**
1. Halt current work
2. Document impediment
3. Preserve current state
4. Update AGENT-STATE.md
5. Escalate to Scrum Master
6. Propose resolution if possible

### Blocked -> Previous State

**Trigger:** Impediment resolved

**Required Data:**
- Resolution description
- Any changes to scope
- Updated dependencies
- Time lost to block

**Actions:**
1. Verify resolution complete
2. Restore previous state
3. Update AGENT-STATE.md
4. Resume from saved point
5. Document lessons learned

## Error Handling

### Invalid Transition Attempted

**Detection:**
- Transition not in valid transitions table
- Prerequisites not met
- Required data missing

**Response:**
```markdown
## Invalid Transition Error

**Attempted:** {FROM-STATE} -> {TO-STATE}
**Agent:** {AGENT-NAME}
**Timestamp:** {YYYY-MM-DD HH:MM}

### Reason Invalid
{Why this transition is not allowed}

### Current Valid Options
- {valid transition 1}
- {valid transition 2}

### Recommended Action
{What the agent should do instead}
```

**Recovery:**
1. Log the invalid attempt
2. Remain in current state
3. Notify Scrum Master
4. Evaluate correct transition path
5. Execute valid transition

### State Inconsistency

**Detection:**
- AGENT-STATE.md shows different state than actual
- Multiple agents claim same state
- Timestamps inconsistent

**Response:**
1. Halt affected agent(s)
2. Query actual current state
3. Reconcile with AGENT-STATE.md
4. Correct any discrepancies
5. Resume with verified state

**Recovery:**
```markdown
## State Reconciliation

**Agent:** {AGENT-NAME}
**Recorded State:** {what AGENT-STATE.md shows}
**Actual State:** {verified current state}

### Resolution
{How inconsistency was resolved}

### Root Cause
{Why inconsistency occurred}

### Prevention
{How to prevent recurrence}
```

### Stuck in Waiting

**Detection:**
- Wait time exceeds threshold
- No resolution in sight
- Dependency chain broken

**Response:**
1. Escalate to Scrum Master
2. Evaluate alternative paths
3. Consider task reassignment
4. Update wait timeout

**Recovery Options:**
- Assign alternative resource
- Decompose blocking task
- Temporary workaround
- Scope adjustment

### Blocked Without Resolution Path

**Detection:**
- Impediment has no clear resolution
- Required resource unavailable
- External blocker beyond team control

**Response:**
1. Escalate to Product Owner
2. Evaluate priority adjustment
3. Consider scope change
4. Reassign agent to other work

**Recovery:**
- Redefine blocked work
- Park task for future sprint
- Find alternative approach
- Accept reduced scope

## Best Practices

1. **Always Update State Immediately** - Delayed updates cause confusion
2. **Preserve Context on Transitions** - Don't lose work state
3. **Document Transition Reasons** - Future debugging aid
4. **Verify Transitions Bi-directionally** - Both parties confirm
5. **Track Time in Each State** - Identify bottlenecks
6. **Minimize Waiting Time** - Active work is valuable
7. **Escalate Blocks Quickly** - Don't let impediments linger
8. **Clean Up on Completion** - Release resources properly

## Fast-Track State Transitions

### Overview
Fast-track tasks follow an accelerated state transition path with reduced overhead for simple, well-defined tasks.

### Fast-Track Transition Flow

```
                     FAST-TRACK PATH (< 30 seconds total)

+------------+     Eligibility      +------------+     Immediate      +------------+
|   READY    | ----  Check   -----> |  ASSIGNED  | ----  Start  ----> |   ACTIVE   |
+------------+   (< 10 seconds)     +------------+                     +------------+
                                                                             |
                                                                        Completion
                                                                        (standard)
                                                                             |
                                                                             v
                                                                      +------------+
                                                                      |    DONE    |
                                                                      +------------+
```

### Fast-Track State: ASSIGNED

A new intermediate state for fast-track tasks:

**Characteristics:**
- Task passed eligibility check
- Agent selected based on direct match
- Minimal context loaded
- Ready for immediate execution

**Entry Conditions:**
- Fast-track eligibility check passed (3+ criteria met)
- Target agent available
- Single-file scope confirmed

**Duration:** < 20 seconds (transition to ACTIVE)

### Fast-Track Eligible Criteria

For a task to use fast-track transitions:

| Criterion | Required | Check Time |
|-----------|----------|------------|
| Complexity S/XS | Yes | < 2s |
| Single file | Yes | < 2s |
| Clear acceptance criteria | Yes | < 3s |
| No architecture decisions | Yes | < 2s |
| Known solution path | Preferred | < 1s |

**Total eligibility check:** < 10 seconds

### Fast-Track vs Standard Comparison

| Aspect | Standard Transition | Fast-Track Transition |
|--------|--------------------|-----------------------|
| Ready -> Active | 1-5 minutes | < 30 seconds |
| Context loading | Full | Minimal (target file only) |
| Agent selection | Skill evaluation | Direct match |
| Prompt generation | Complete template | Minimal template |
| State updates | Full documentation | Abbreviated |

### Fast-Track State Update Protocol

For fast-track tasks, use abbreviated state updates:

```markdown
## Fast-Track State Update

**Timestamp:** {HH:MM}
**Agent:** {AGENT-NAME}
**Task:** {one-line description}
**Transition:** READY -> ASSIGNED -> ACTIVE
**File:** {target file path}
**Fast-Track:** Yes
```

### When Fast-Track Fails

If a fast-track task encounters issues:

1. **Scope Expansion Detected**
   - Transition to standard flow immediately
   - Document reason for expansion
   - Full context loading required

2. **Complexity Increase**
   - Return task to queue
   - Re-evaluate as standard task
   - Update Fast-Track flag to No

3. **Blocker Discovered**
   - Standard Blocked state handling applies
   - Fast-track status does not change handling

### Metrics Integration

Track fast-track transitions in state files:

```markdown
## Transition Metrics

| Transition Type | Count | Avg Duration | Success Rate |
|-----------------|-------|--------------|--------------|
| Fast-Track | {N} | {seconds}s | {%} |
| Standard | {N} | {minutes}m | {%} |
```

## Integration with Other Patterns

- **HANDOFF-PROTOCOL.md** - Waiting state often involves handoffs
- **ERROR-RECOVERY.md** - Blocked state uses error recovery
- **PLAN-ACT-MODE.md** - Active state follows plan-act pattern
- **QUALITY-RUBRIC.md** - Task completion triggers quality checks
- **ORCHESTRATOR.md** - Fast-Track Delegation section defines eligibility
