# DISCOVERY-FLOW

> **Version:** 1.0
> **Definition:** @.claude/workflows/definitions/product/new-project.yaml
> **Updated:** 2025-12-10

---

## Purpose

Ensure complete project understanding before planning or development begins.
This workflow is MANDATORY before:
- New project initialization
- Existing project migration
- New epic planning
- Major feature additions

**IMPORTANT:** Discovery is NOT optional. Skipping discovery leads to wrong assumptions, wasted effort, and costly rework. This workflow ensures we always ask questions and understand the project before acting.

> **NOTE: UX Design is NOT part of Discovery.** Discovery gathers basic UI/UX context (platforms, accessibility needs, UI preference) but actual UX Design happens LATER in the Planning flow, AFTER Architecture is defined. UX Design requires technical context from Architecture to make informed decisions.
>
> **Correct flow sequence:** Discovery -> PRD -> Architecture -> UX Design -> Epic Breakdown -> Stories -> Sprint

## ASCII Flow Diagram

```
                              DISCOVERY-FLOW
                                    |
                                    v
                     +-----------------------------+
                     |       TRIGGER               |
                     | - New project               |
                     | - Migration                 |
                     | - New Epic                  |
                     | - Unclear requirements      |
                     +-------------+---------------+
                                   |
                                   v
+=========================================================================+
|                     PHASE 1: INITIAL SCAN (Quick)                       |
+=========================================================================+
|                                                                         |
|   +------------------------------------------------------------------+ |
|   | DOC-AUDITOR (quick mode)                                          | |
|   +------------------------------------------------------------------+ |
|   |                                                                   | |
|   |  1. Scan project structure                                        | |
|   |  2. Identify existing documentation                               | |
|   |  3. List key files and directories                                | |
|   |  4. Create initial overview                                       | |
|   |                                                                   | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
|                              v                                          |
|   +------------------------------------------------------------------+ |
|   | GATE: SCAN_COMPLETE                                               | |
|   | [ ] Project structure mapped                                      | |
|   | [ ] Existing docs identified                                      | |
|   | [ ] Initial file list created                                     | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
+=========================================================================+
                               |
                               v SCAN_COMPLETE
+=========================================================================+
|                     PHASE 2: DISCOVERY INTERVIEW                        |
+=========================================================================+
|                                                                         |
|   +------------------------------------------------------------------+ |
|   | DISCOVERY-AGENT                                                   | |
|   +------------------------------------------------------------------+ |
|   |                                                                   | |
|   |  1. Conduct structured interview with user                        | |
|   |  2. Ask clarifying questions about:                               | |
|   |     - Project goals and vision                                    | |
|   |     - Target users and personas                                   | |
|   |     - Key features and requirements                               | |
|   |     - Constraints and limitations                                 | |
|   |     - Timeline expectations                                       | |
|   |  3. Document all answers                                          | |
|   |  4. Identify follow-up questions                                  | |
|   |                                                                   | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
|                              v                                          |
|   +------------------------------------------------------------------+ |
|   | GATE: INTERVIEW_COMPLETE                                          | |
|   | [ ] All structured questions answered                             | |
|   | [ ] Goals and vision documented                                   | |
|   | [ ] Target users identified                                       | |
|   | [ ] Key requirements captured                                     | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
+=========================================================================+
                               |
                               v INTERVIEW_COMPLETE
+=========================================================================+
|                     PHASE 3: DOMAIN-SPECIFIC QUESTIONS (Parallel)       |
+=========================================================================+
|                                                                         |
|   +--------------------+    +--------------------+    +----------------+ |
|   | ARCHITECT-AGENT    |    | PM-AGENT           |    | RESEARCH-AGENT | |
|   | (Opus)             |    | (Sonnet)           |    | (Sonnet)       | |
|   +--------------------+    +--------------------+    +----------------+ |
|   | Technical questions|    | Business questions |    | Identify       | |
|   | - Tech stack       |    | - Market context   |    | unknowns       | |
|   | - Integrations     |    | - Competitors      |    | - Knowledge    | |
|   | - Scale needs      |    | - Business model   |    |   gaps         | |
|   | - Security reqs    |    | - Success metrics  |    | - Research     | |
|   | - Performance      |    | - Priorities       |    |   needed       | |
|   +--------------------+    +--------------------+    +----------------+ |
|            |                         |                        |         |
|            +------------+------------+------------+-----------+         |
|                         |                                               |
|                         v                                               |
|   +------------------------------------------------------------------+ |
|   | GATE: DOMAINS_COVERED                                             | |
|   | [ ] Technical requirements understood                             | |
|   | [ ] Business context clear                                        | |
|   | [ ] Unknowns documented                                           | |
|   | [ ] All domain sections complete                                  | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
+=========================================================================+
                               |
                               v DOMAINS_COVERED
+=========================================================================+
|                     PHASE 4: GAP ANALYSIS                               |
+=========================================================================+
|                                                                         |
|   +------------------------------------------------------------------+ |
|   | DOC-AUDITOR + DISCOVERY-AGENT                                     | |
|   +------------------------------------------------------------------+ |
|   |                                                                   | |
|   |  1. Identify remaining gaps                                       | |
|   |  2. List open questions                                           | |
|   |  3. Prioritize unknowns by impact                                 | |
|   |  4. Determine if gaps are blocking                                | |
|   |  5. Propose resolution strategies                                 | |
|   |                                                                   | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
|                              v                                          |
|   +------------------------------------------------------------------+ |
|   | GATE: GAPS_IDENTIFIED                                             | |
|   | [ ] All gaps documented                                           | |
|   | [ ] Open questions listed                                         | |
|   | [ ] Priorities assigned                                           | |
|   | [ ] Resolution strategies proposed                                | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
+=========================================================================+
                               |
                               v GAPS_IDENTIFIED
+=========================================================================+
|                     PHASE 5: CONFIRMATION                               |
+=========================================================================+
|                                                                         |
|   +------------------------------------------------------------------+ |
|   | ORCHESTRATOR (Opus 4.5)                                           | |
|   +------------------------------------------------------------------+ |
|   |                                                                   | |
|   |  1. Present understanding summary to user                         | |
|   |  2. Highlight key decisions captured                              | |
|   |  3. List any assumptions made                                     | |
|   |  4. Ask for user confirmation                                     | |
|   |  5. Handle corrections and additions                              | |
|   |  6. Finalize PROJECT-UNDERSTANDING.md                             | |
|   |                                                                   | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
|                              v                                          |
|   +------------------------------------------------------------------+ |
|   | GATE: USER_CONFIRMED                                              | |
|   | [ ] Summary presented to user                                     | |
|   | [ ] User confirmed understanding is correct                       | |
|   | [ ] Corrections incorporated                                      | |
|   | [ ] PROJECT-UNDERSTANDING.md approved                             | |
|   +------------------------------------------------------------------+ |
|                              |                                          |
+=========================================================================+
                               |
                               v USER_CONFIRMED
                    +-----------------------------+
                    |   DISCOVERY COMPLETE        |
                    | - Next workflow:            |
                    |   - PLANNING-FLOW           |
                    |   - EPIC-WORKFLOW           |
                    |   - MIGRATION-FLOW          |
                    +-----------------------------+
```

## Trigger Points

| Trigger | Source | Entry Phase | Depth | Notes |
|---------|--------|-------------|-------|-------|
| New project | init-interactive.sh | Phase 1 | deep | Full discovery required |
| Migration | migrate-docs.sh | Phase 1 | quick | Quick context, then migrate |
| New Epic | ORCHESTRATOR | Phase 2 | standard | Project known, focus on epic |
| Unclear requirements | Any agent | Phase 4 | quick | Fast-track to gaps |

### Depth Selection Logic

```
IF new_project AND greenfield:
    depth = deep
    clarity_target = 85%

ELIF migration:
    depth = quick
    clarity_target = 50%
    skip_if: scan found complete docs

ELIF new_epic:
    depth = standard
    clarity_target = 70%

ELIF clarification:
    depth = quick (targeted)
    clarity_target = 90% (for specific topic)
```

## Phase Details

---

### Phase 1: Initial Scan (Quick)

**Agent:** DOC-AUDITOR (quick mode)
**Model:** Sonnet
**Duration:** 5-10 minutes

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Quick overview of project structure and existing documentation |
| **If skipped** | Miss existing docs, duplicate work, overlook constraints |
| **Problems prevented** | Reinventing the wheel, conflicting with existing decisions |

#### Activities
1. Scan project directory structure
2. Identify existing documentation files
3. List key configuration files
4. Note technology indicators (package.json, requirements.txt, etc.)
5. Create initial overview document

#### Output
- `docs/0-DISCOVERY/INITIAL-SCAN.md`

#### Gate: SCAN_COMPLETE

```markdown
## Gate: SCAN_COMPLETE

Condition: Initial project scan completed
Validation:
- [ ] Project structure mapped
- [ ] Existing documentation identified
- [ ] Key files listed
- [ ] Technology stack indicators noted

Blocking: Cannot proceed to Phase 2 until passed
Recovery: Re-run scan with expanded scope
```

---

### Phase 2: Discovery Interview

**Agent:** DISCOVERY-AGENT
**Model:** Sonnet (Opus for complex domains)
**Duration:** 15-30 minutes

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Core understanding of project goals, users, and requirements |
| **If skipped** | Building wrong product, misaligned expectations |
| **Problems prevented** | Scope creep, wasted development, user dissatisfaction |

#### Interview Structure

```markdown
## Discovery Interview Template

### Vision & Goals
1. What is the primary purpose of this project?
2. What problem does it solve?
3. What does success look like?

### Users & Personas
1. Who are the target users?
2. What are their main pain points?
3. How tech-savvy are they?

### Features & Requirements
1. What are the must-have features?
2. What are nice-to-have features?
3. Are there any features explicitly out of scope?

### Constraints
1. What is the timeline?
2. What is the budget (if applicable)?
3. Are there technical constraints?
4. Are there regulatory/compliance requirements?

### Context
1. Is this a new project or replacing something?
2. Are there existing systems to integrate with?
3. Who are the stakeholders?

### UI/UX Context (Basic - NOT full UX design)
1. Does this project need a user interface?
2. What platforms are required? (web, mobile, desktop)
3. Are there accessibility requirements? (WCAG level)
4. Any existing brand guidelines or design system to follow?
5. Preference for UI approach? (minimalist, feature-rich, etc.)

> Note: These questions gather CONTEXT only. Full UX Design happens
> after Architecture is defined in the Planning flow.
```

#### Output
- `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md` (initial)
- OR `docs/0-DISCOVERY/MIGRATION-CONTEXT.md` (for migrations)

#### Gate: INTERVIEW_COMPLETE

```markdown
## Gate: INTERVIEW_COMPLETE

Condition: Structured interview completed
Validation:
- [ ] All structured questions answered
- [ ] Goals and vision documented
- [ ] Target users identified
- [ ] Key requirements captured
- [ ] Constraints documented

Blocking: Cannot proceed to Phase 3 until passed
Recovery: Schedule follow-up interview session
```

---

### Phase 3: Domain-Specific Questions (Parallel)

**Agents:** ARCHITECT-AGENT, PM-AGENT, RESEARCH-AGENT (parallel)
**Models:** Opus (Architect), Sonnet (PM, Research)
**Duration:** 10-20 minutes

> **Note:** UX-DESIGNER is intentionally NOT included in Discovery parallel agents.
> UX Design requires technical context from Architecture decisions (tech stack, platform constraints,
> performance budgets) to make informed design choices. UX Design phase occurs AFTER Architecture
> in the Planning flow.

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Deep domain understanding from technical, business, and research perspectives |
| **If skipped** | Miss critical technical/business requirements |
| **Problems prevented** | Architecture mismatches, market misalignment, unknown unknowns |

#### Parallel Execution

```
+------------------+     +------------------+     +------------------+
|  ARCHITECT       |     |  PM              |     |  RESEARCH        |
|  (Technical)     |     |  (Business)      |     |  (Unknowns)      |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
  Tech questions          Business questions       Knowledge gaps
         |                        |                        |
         +------------------------+------------------------+
                                  |
                                  v
                    PROJECT-UNDERSTANDING.md
                    (updated with all domains)
```

#### ARCHITECT-AGENT Questions
```markdown
## Technical Discovery

1. What is the preferred tech stack?
2. Are there existing systems to integrate with?
3. What are the scale requirements?
   - Expected users (concurrent/total)
   - Data volume
   - Transaction volume
4. What are the security requirements?
   - Authentication method
   - Data sensitivity
   - Compliance needs
5. What are the performance requirements?
   - Response time expectations
   - Availability requirements
6. What is the deployment environment?
   - Cloud provider preference
   - On-premise requirements
   - CI/CD preferences
```

#### PM-AGENT Questions
```markdown
## Business Discovery

1. What is the market context?
   - Target market
   - Market size
   - Growth expectations
2. Who are the competitors?
   - Direct competitors
   - Indirect alternatives
   - Competitive advantages
3. What is the business model?
   - Revenue model
   - Pricing strategy
4. What are the success metrics?
   - KPIs
   - Measurement approach
5. What are the priorities?
   - Time-to-market vs features
   - Quality vs speed
   - Cost vs capability
```

#### RESEARCH-AGENT Questions
```markdown
## Knowledge Gap Discovery

1. What do we NOT know yet?
   - Technical unknowns
   - Market unknowns
   - User unknowns
2. What needs research?
   - Technology evaluation
   - Competitor analysis
   - User research
3. What assumptions are we making?
   - Technical assumptions
   - Business assumptions
   - User assumptions
4. What could invalidate our approach?
   - Risk factors
   - Dependencies
   - External factors
```

#### Output
- `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md` (updated with domain sections)

#### Gate: DOMAINS_COVERED

```markdown
## Gate: DOMAINS_COVERED

Condition: All domain perspectives captured
Validation:
- [ ] Technical requirements understood
- [ ] Business context clear
- [ ] Unknowns documented
- [ ] All domain sections complete

Blocking: Cannot proceed to Phase 4 until passed
Recovery: Schedule focused session for incomplete domains
```

---

### Phase 4: Gap Analysis

**Agents:** DOC-AUDITOR + DISCOVERY-AGENT
**Model:** Sonnet
**Duration:** 10-15 minutes

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Clear list of what we still don't know and how to resolve it |
| **If skipped** | Proceed with hidden gaps, face surprises later |
| **Problems prevented** | Late-stage discoveries, blocked development, incorrect assumptions |

#### Activities
1. Review all discovery outputs
2. Identify remaining gaps
3. List open questions
4. Prioritize unknowns by:
   - Impact on architecture
   - Impact on timeline
   - Risk if wrong
5. Determine if gaps are blocking
6. Propose resolution strategies

#### Gap Categories

| Category | Examples | Resolution Strategy |
|----------|----------|---------------------|
| **Blocking** | Missing security requirements | Must resolve before planning |
| **Important** | Unclear performance targets | Resolve during planning |
| **Minor** | Nice-to-have feature details | Resolve during development |
| **Deferred** | Future integrations | Document for later |

#### Output
- `docs/0-DISCOVERY/GAPS-AND-QUESTIONS.md`

#### Gate: GAPS_IDENTIFIED

```markdown
## Gate: GAPS_IDENTIFIED

Condition: Gap analysis completed
Validation:
- [ ] All gaps documented
- [ ] Open questions listed
- [ ] Priorities assigned (Blocking/Important/Minor/Deferred)
- [ ] Resolution strategies proposed
- [ ] No blocking gaps remaining OR resolution plan in place

Blocking: Cannot proceed to Phase 5 until passed
Recovery: Return to Phase 2/3 for specific gap resolution
```

---

### Phase 5: Confirmation

**Agent:** ORCHESTRATOR
**Model:** Opus 4.5
**Duration:** 5 minutes

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | User-validated understanding document |
| **If skipped** | Proceed with unvalidated assumptions |
| **Problems prevented** | Misunderstandings, wrong direction, wasted effort |

#### Activities
1. Compile understanding summary
2. Present to user in clear format
3. Highlight key decisions and assumptions
4. Ask for explicit confirmation
5. Handle corrections and additions
6. Finalize documentation

#### Confirmation Summary Template

```markdown
## Discovery Summary for User Confirmation

### Project Overview
{Brief description of what we understand}

### Key Goals
1. {Goal 1}
2. {Goal 2}
3. {Goal 3}

### Target Users
- Primary: {user type}
- Secondary: {user type}

### Must-Have Features
1. {Feature 1}
2. {Feature 2}
3. {Feature 3}

### Technical Approach
- Stack: {tech stack summary}
- Architecture: {high-level approach}
- Integrations: {key integrations}

### Business Context
- Market: {target market}
- Model: {business model}
- Success Metrics: {key KPIs}

### Key Assumptions
1. {Assumption 1}
2. {Assumption 2}

### Open Questions (Non-Blocking)
1. {Question 1}
2. {Question 2}

---

**Please confirm this understanding is correct or provide corrections.**
```

#### Output
- `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md` (approved)

#### Gate: USER_CONFIRMED

```markdown
## Gate: USER_CONFIRMED

Condition: User explicitly confirmed understanding
Validation:
- [ ] Summary presented to user
- [ ] User reviewed all sections
- [ ] User confirmed accuracy OR provided corrections
- [ ] Corrections incorporated
- [ ] PROJECT-UNDERSTANDING.md marked as approved

Blocking: Cannot proceed to next workflow until passed
Recovery: Address user corrections, re-present summary
```

---

## Output Files

| Phase | Output File | Location | Purpose |
|-------|-------------|----------|---------|
| 1 | INITIAL-SCAN.md | docs/0-DISCOVERY/ | Quick project overview |
| 2 | PROJECT-UNDERSTANDING.md | docs/0-DISCOVERY/ | Core understanding (initial) |
| 2 (migration) | MIGRATION-CONTEXT.md | docs/0-DISCOVERY/ | Migration-specific context |
| 3 | PROJECT-UNDERSTANDING.md | docs/0-DISCOVERY/ | Updated with domain sections |
| 4 | GAPS-AND-QUESTIONS.md | docs/0-DISCOVERY/ | Open items and resolutions |
| 5 | PROJECT-UNDERSTANDING.md | docs/0-DISCOVERY/ | Final approved version |

## Parallel Opportunities

```
PHASE         PARALLEL OPPORTUNITIES
------        ----------------------
Phase 1       Sequential (single agent)
Phase 2       Sequential (interactive)
Phase 3       ARCHITECT + PM + RESEARCH can work in parallel
Phase 4       DOC-AUDITOR + DISCOVERY-AGENT can work in parallel
Phase 5       Sequential (requires user interaction)
```

### Parallel Execution in Phase 3

```
                    INTERVIEW_COMPLETE
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   +------------+   +------------+   +------------+
   | ARCHITECT  |   | PM-AGENT   |   | RESEARCH   |
   | Questions  |   | Questions  |   | Questions  |
   +-----+------+   +-----+------+   +-----+------+
         |                |                |
         +----------------+----------------+
                          |
                          v
              PROJECT-UNDERSTANDING.md
                   (merged)
```

## Gate Enforcement Summary

| Gate | Phase Transition | Type | Enforcer | Blocking |
|------|------------------|------|----------|----------|
| SCAN_COMPLETE | 1 -> 2 | QUALITY_GATE | DOC-AUDITOR | Phase 2 |
| INTERVIEW_COMPLETE | 2 -> 3 | QUALITY_GATE | DISCOVERY-AGENT | Phase 3 |
| DOMAINS_COVERED | 3 -> 4 | QUALITY_GATE | ORCHESTRATOR | Phase 4 |
| GAPS_IDENTIFIED | 4 -> 5 | QUALITY_GATE | DOC-AUDITOR | Phase 5 |
| USER_CONFIRMED | 5 -> Next Workflow | APPROVAL_GATE | User | Next Workflow |

## Integration with Other Workflows

### DISCOVERY-FLOW -> PLANNING-FLOW

```
DISCOVERY-FLOW completes
        |
        v
USER_CONFIRMED gate passes
        |
        v
Outputs passed to PLANNING-FLOW:
- PROJECT-UNDERSTANDING.md
- GAPS-AND-QUESTIONS.md
        |
        v
PLANNING-FLOW begins
        |
        v
    +-------+
    |  PRD  |  (Product Requirements Document)
    +---+---+
        |
        v
+-------------+
| ARCHITECTURE |  (Technical decisions, constraints)
+------+------+
        |
        v
+-------------+
|  UX DESIGN  |  <-- UX Design happens HERE, AFTER Architecture
+------+------+    (needs tech context: platform, performance, constraints)
        |
        v
+--------------+
| EPIC BREAKDOWN|
+------+-------+
        |
        v
   STORIES -> SPRINT
```

### DISCOVERY-FLOW -> EPIC-WORKFLOW

```
DISCOVERY-FLOW completes (for new Epic)
        |
        v
USER_CONFIRMED gate passes
        |
        v
Outputs passed to EPIC-WORKFLOW:
- PROJECT-UNDERSTANDING.md (Epic section)
- Domain requirements
        |
        v
EPIC-WORKFLOW Phase 1 (Discovery) can be shortened
```

### DISCOVERY-FLOW -> MIGRATION-FLOW

```
DISCOVERY-FLOW completes (migration trigger)
        |
        v
USER_CONFIRMED gate passes
        |
        v
Outputs passed to MIGRATION-FLOW:
- MIGRATION-CONTEXT.md
- GAPS-AND-QUESTIONS.md
        |
        v
MIGRATION-FLOW begins
```

## Error Recovery Paths

### Path 1: Incomplete Scan
```
Phase 1: Scan incomplete or failed
     |
     v
Expand scan scope
     |
     v
Re-run Phase 1
```

### Path 2: Interview Gaps
```
Phase 2: Key questions unanswered
     |
     v
Schedule follow-up interview
     |
     v
Continue Phase 2
```

### Path 3: Domain Conflicts
```
Phase 3: Conflicting information from domains
     |
     v
Joint session: ARCHITECT + PM + RESEARCH
     |
     v
Resolve conflicts
     |
     v
Update PROJECT-UNDERSTANDING.md
```

### Path 4: Blocking Gaps
```
Phase 4: Blocking gaps identified
     |
     v
Return to Phase 2 or 3 for specific resolution
     |
     v
Re-run Phase 4
```

### Path 5: User Rejects Summary
```
Phase 5: User indicates understanding is wrong
     |
     v
Identify incorrect sections
     |
     v
Return to appropriate phase (2, 3, or 4)
     |
     v
Re-present summary in Phase 5
```

## Example Scenario

### Scenario: New Project Discovery

```
Trigger: User runs init-interactive.sh

Phase 1: DOC-AUDITOR (quick mode)
- Scans empty project structure
- Notes: No existing docs
- Output: INITIAL-SCAN.md
- Gate: SCAN_COMPLETE (PASS)

Phase 2: DISCOVERY-AGENT
- Conducts structured interview
- User describes: "SaaS platform for team collaboration"
- Documents goals, users, features, constraints
- Output: PROJECT-UNDERSTANDING.md (initial)
- Gate: INTERVIEW_COMPLETE (PASS)

Phase 3: Parallel Agents
- ARCHITECT: Real-time sync, scale for 10k users, cloud-native
- PM: B2B market, freemium model, focus on SMBs
- RESEARCH: Identifies need for competitor analysis
- Output: PROJECT-UNDERSTANDING.md (updated)
- Gate: DOMAINS_COVERED (PASS)

Phase 4: DOC-AUDITOR + DISCOVERY-AGENT
- Gaps: Specific real-time tech not chosen, pricing tiers undefined
- Priorities: Real-time tech (Important), Pricing (Minor)
- Output: GAPS-AND-QUESTIONS.md
- Gate: GAPS_IDENTIFIED (PASS)

Phase 5: ORCHESTRATOR
- Presents summary to user
- User confirms with one correction
- Correction incorporated
- Output: PROJECT-UNDERSTANDING.md (approved)
- Gate: USER_CONFIRMED (PASS)

-> Proceeds to PLANNING-FLOW

Total time: ~45 minutes
```

## State Updates

After Discovery completes, update:

```markdown
## PROJECT-STATE.md Updates

After Discovery:
- Phase: Planning (or appropriate next phase)
- Last Activity: Discovery completed
- Discovery Status: COMPLETE
- Next: {PLANNING-FLOW | EPIC-WORKFLOW | MIGRATION-FLOW}
- Key Outputs:
  - PROJECT-UNDERSTANDING.md (approved)
  - GAPS-AND-QUESTIONS.md
```

## Metrics Tracking

Track for each Discovery run:

| Metric | Description | Update When |
|--------|-------------|-------------|
| Trigger type | new/migration/epic/unclear | Discovery start |
| Scan duration | Phase 1 time | Phase 1 complete |
| Interview duration | Phase 2 time | Phase 2 complete |
| Domain questions duration | Phase 3 time | Phase 3 complete |
| Gaps found | Count of gaps identified | Phase 4 complete |
| Blocking gaps | Count of blocking gaps | Phase 4 complete |
| Confirmation cycles | Times summary was rejected | Phase 5 complete |
| Total duration | Start to USER_CONFIRMED | Discovery complete |

Update in `.claude/state/METRICS.md`

---

## CRITICAL: Why Discovery Cannot Be Skipped

```
WITHOUT DISCOVERY:
- Build wrong product
- Miss critical requirements
- Make incorrect assumptions
- Face costly late-stage changes
- Frustrate users and stakeholders

WITH DISCOVERY:
- Clear understanding
- Validated requirements
- Documented assumptions
- Aligned expectations
- Smooth development
```

**Remember:** The cost of discovery is 45-60 minutes. The cost of building the wrong thing is weeks or months.

---

**DISCOVERY-FLOW Version:** 1.0
**Created:** 2025-12-06
**Maintained by:** Agent Methodology Pack
