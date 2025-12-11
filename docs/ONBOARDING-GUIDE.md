# Onboarding Guide: Agent Methodology Pack

**Welcome to your AI-powered development team!**

This guide helps you learn the Agent Methodology Pack through hands-on practice. By the end, you'll be confidently working with 14 specialized AI agents to build software faster and with better quality.

---

## 1. Welcome

### What is Agent Methodology Pack?

Instead of using Claude AI as a single assistant, the Agent Methodology Pack gives you an entire development team:

- **6 Planning Agents** - Define what to build
- **4 Development Agents** - Build it with TDD
- **3 Quality Agents** - Ensure it's excellent
- **1 Orchestrator** - Routes work to the right agent

Think of it as having a Product Manager, Architect, Developers, QA Engineers, and Tech Writers all powered by Claude, working together through proven workflows.

### How It Helps Your Work

**Before Agent Pack:**
- You: "Claude, build me authentication"
- Claude: *Does everything, no structure, hard to maintain*

**With Agent Pack:**
- PM-AGENT: Creates user stories with acceptance criteria
- ARCHITECT-AGENT: Designs secure auth architecture
- TEST-ENGINEER: Writes tests first (TDD Red)
- BACKEND-DEV: Implements to pass tests (TDD Green)
- QA-AGENT: Validates all scenarios
- CODE-REVIEWER: Reviews for security and quality
- TECH-WRITER: Documents the API

Result: **Structured, tested, documented, production-ready code.**

### What You'll Learn

1. **Quick Overview** (5 min) - Meet the agents and understand the structure
2. **Your First Task** (30 min) - Hands-on: Fix a bug from start to finish
3. **Understanding Agents** - Deep dive into each agent's role
4. **Daily Workflow** - How to use agents in your day-to-day work
5. **Common Tasks** - Step-by-step guides for typical scenarios
6. **Tips & Troubleshooting** - Best practices and problem-solving

---

## 2. Quick Overview (5 min read)

### 14 Agents and What They Do

#### Planning Agents (Before coding starts)

| Agent | When to Use | What They Do |
|-------|-------------|--------------|
| **ORCHESTRATOR** | Start of every session | Routes your request to the right agent |
| **RESEARCH-AGENT** | Unknown territory | Researches markets, tech, best practices |
| **PM-AGENT** | New feature ideas | Creates PRD, epics, user stories |
| **UX-DESIGNER** | UI/UX work | Designs screens, flows, interactions |
| **ARCHITECT-AGENT** | Technical design | System architecture, database, APIs |
| **PRODUCT-OWNER** | Prioritization | Decides what to build next |
| **SCRUM-MASTER** | Sprint planning | Creates sprints, assigns tasks |

#### Development Agents (During coding)

| Agent | When to Use | What They Do |
|-------|-------------|--------------|
| **TEST-ENGINEER** | Start of every story | Writes tests FIRST (TDD Red) |
| **BACKEND-DEV** | API/database work | Implements backend to pass tests |
| **FRONTEND-DEV** | UI work | Implements frontend to pass tests |
| **SENIOR-DEV** | Complex features | Leads complex implementations |

#### Quality Agents (After coding)

| Agent | When to Use | What They Do |
|-------|-------------|--------------|
| **QA-AGENT** | After implementation | Tests everything, finds bugs |
| **CODE-REVIEWER** | Before merging | Reviews code quality and security |
| **TECH-WRITER** | After completion | Documents features and APIs |

### Documentation Structure

All project files are organized in this structure:

```
project-root/
├── CLAUDE.md              # Main file Claude reads (keep under 70 lines!)
├── PROJECT-STATE.md       # Current sprint status
│
├── .claude/               # Methodology files
│   ├── agents/           # 14 agent definitions
│   ├── workflows/        # Process flows (Epic, Story, Bug, Sprint)
│   └── state/            # Runtime state (Task queue, handoffs, metrics)
│
└── docs/                 # Organized structure
    ├── 1-BASELINE/       # Requirements, architecture, research
    ├── 2-MANAGEMENT/     # Epics, stories, sprints
    ├── 3-ARCHITECTURE/   # UX designs, technical specs
    ├── 4-DEVELOPMENT/    # Implementation docs, API docs
    └── 5-ARCHIVE/        # Completed work
```

**Key Insight:** CLAUDE.md must stay under 70 lines. Use `@references` to load other files.

### Key Files to Know

| File | Purpose | Read It When... |
|------|---------|-----------------|
| `CLAUDE.md` | Project overview | Every session (auto-loaded) |
| `PROJECT-STATE.md` | Current sprint state | Starting work |
| `.claude/agents/ORCHESTRATOR.md` | Task router | Not sure which agent to use |
| `.claude/state/TASK-QUEUE.md` | What's pending | Planning your day |
| `.claude/workflows/STORY-WORKFLOW.md` | How to implement a story | Implementing a feature |

---

## 3. Your First Task (30 min hands-on)

Let's fix a bug together. This gives you hands-on experience with multiple agents.

### Scenario

You've discovered a bug: "User profile doesn't save when email contains a plus sign (+)."

### Step 1: Report the Bug (5 min)

**Load the QA-AGENT:**

```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/quality/QA-AGENT.md

Bug Report:

**Issue:** User profile save fails with email containing + sign
**Steps to Reproduce:**
1. Navigate to profile settings
2. Change email to "john+test@example.com"
3. Click Save
**Expected:** Profile saves successfully
**Actual:** Error message "Invalid email format"
**Impact:** Users cannot use + addressing (common for filtering)
```

**What happens:**
- QA-AGENT analyzes the bug
- Creates structured bug report
- Suggests severity (likely Medium)
- Routes to appropriate agent via Orchestrator

### Step 2: Reproduce with Tests (10 min)

**QA-AGENT hands off to TEST-ENGINEER:**

```
@.claude/agents/development/TEST-ENGINEER.md
@docs/4-DEVELOPMENT/features/user-profile/

Task: Write a failing test that reproduces the bug

Acceptance Criteria:
- Test fails with current code
- Test passes when bug is fixed
- Test covers edge cases (emails with +, dots, etc.)
```

**What happens:**
- TEST-ENGINEER examines existing tests
- Writes new test case for + in email
- Runs it - confirms it fails
- Hands off to DEV with failing test

**Output you'll see:**
```typescript
describe('User Profile Email Validation', () => {
  it('should save email with plus sign', async () => {
    const email = 'user+tag@example.com';
    const result = await profileService.updateEmail(userId, email);
    expect(result.success).toBe(true);
    expect(result.email).toBe(email);
  });
  // Test currently FAILS ✗
});
```

### Step 3: Fix the Bug (10 min)

**TEST-ENGINEER hands off to BACKEND-DEV:**

```
@.claude/agents/development/BACKEND-DEV.md
@lib/services/profile-service.ts
@tests/profile.test.ts

Task: Fix email validation to allow + sign

Current failing test shows the issue.
Implement minimal fix to make test pass.
```

**What happens:**
- BACKEND-DEV finds the validation regex
- Updates it to allow + sign
- Runs tests - now passes
- Ensures no other tests broke

**Output you'll see:**
```typescript
// Before (broken)
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// After (fixed)
const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//                               ^ Added + to allowed characters

// Test now PASSES ✓
```

### Step 4: Complete and Document (5 min)

**BACKEND-DEV hands off to TECH-WRITER:**

```
@.claude/agents/quality/TECH-WRITER.md
@CHANGELOG.md

Task: Document the bug fix

Fixed: User profile email validation now supports + addressing
Files changed: lib/services/profile-service.ts
```

**What happens:**
- TECH-WRITER adds changelog entry
- Updates API documentation if needed
- Marks task complete in PROJECT-STATE.md

**Output you'll see:**
```markdown
## [1.2.1] - 2025-12-05

### Fixed
- User profile email validation now accepts + sign for email filtering
- Updated email regex to follow RFC 5322 standards
```

### Reflection

**What you just learned:**
1. ✓ How to invoke agents with `@` references
2. ✓ How agents hand off work to each other
3. ✓ TDD workflow (Test First, then Fix)
4. ✓ How bugs move through the system
5. ✓ How documentation stays updated

**Next:** Let's understand each agent deeply.

---

## 4. Understanding Agents

### Planning Agents (6)

#### ORCHESTRATOR
**When:** Start of every session
**Model:** Opus 4.5 (most powerful)

```
[ORCHESTRATOR - Opus 4.5]

Read:
@CLAUDE.md
@PROJECT-STATE.md
@.claude/state/TASK-QUEUE.md

Analyze current state and recommend next action.
```

**What it does:**
- Reads current project state
- Identifies highest priority task
- Routes to appropriate agent
- Manages task queue
- Monitors token budget

**Example output:**
```markdown
## Recommended Next Action

**Agent:** BACKEND-DEV
**Task:** Implement Story 2.3 - User logout endpoint
**Priority:** HIGH (blocking frontend work)
**Estimated Time:** 2 hours

**Context to load:**
- @docs/2-MANAGEMENT/epics/current/epic-2/story-2.3.md
- @docs/1-BASELINE/architecture/api-spec.md
```

#### RESEARCH-AGENT
**When:** Starting new projects, exploring unknowns
**Model:** Opus/Sonnet

**Use for:**
- Market research before building features
- Technology evaluation (which database? which framework?)
- Competitive analysis
- Best practices research

**Example:**
```
@.claude/agents/planning/RESEARCH-AGENT.md

Research: Best real-time notification systems for web apps

Requirements:
- Need to support 10K concurrent users
- Push notifications to browser
- Low latency (<100ms)
- Works with React frontend, Node.js backend
```

**Output:** Research report comparing WebSockets, Server-Sent Events, Firebase, Pusher, etc.

#### PM-AGENT
**When:** Defining features, creating epics and stories
**Model:** Sonnet

**Use for:**
- Creating Product Requirements Documents (PRD)
- Breaking down features into user stories
- Writing acceptance criteria
- Defining success metrics

**Example:**
```
@.claude/agents/planning/PM-AGENT.md

Create Epic: User Notification System

Requirements:
- Users get notified of messages
- Users can configure notification preferences
- Notifications work in-app and via email
```

**Output:** PRD with user stories:
- Story 1: As a user, I can see in-app notifications
- Story 2: As a user, I can configure email preferences
- Story 3: As a user, I receive email summaries

#### UX-DESIGNER
**When:** Before implementing any UI
**Model:** Sonnet

**Use for:**
- Wireframes and mockups
- User flows
- Component specifications
- Accessibility requirements

**Example:**
```
@.claude/agents/planning/UX-DESIGNER.md
@docs/2-MANAGEMENT/epics/current/epic-3/story-3.1.md

Design UI for notification center dropdown

Requirements from story:
- Shows last 10 notifications
- Marks as read on click
- "See all" link
- Unread badge on bell icon
```

**Output:** ASCII wireframes, component specs, interaction notes

#### ARCHITECT-AGENT
**When:** Before implementing complex features
**Model:** Opus

**Use for:**
- System architecture design
- Database schema design
- API design
- Architecture Decision Records (ADRs)
- Technology choices

**Example:**
```
@.claude/agents/planning/ARCHITECT-AGENT.md
@docs/1-BASELINE/product/prd-notifications.md

Design architecture for notification system

Requirements:
- Real-time delivery
- Persistent storage
- Scalable to 100K users
- Support push, email, SMS in future
```

**Output:**
- Architecture diagram
- Database schema
- API endpoint design
- Technology recommendations
- ADR for key decisions

#### PRODUCT-OWNER
**When:** Prioritizing backlog, grooming stories
**Model:** Sonnet

**Use for:**
- Prioritizing user stories
- Refining backlog
- Accepting completed work
- Adjusting scope

**Example:**
```
@.claude/agents/planning/PRODUCT-OWNER.md
@docs/2-MANAGEMENT/backlog.md

Review Epic 3 stories and prioritize for Sprint 5

Team capacity: 40 story points
Must have: Real-time notifications
Nice to have: Email digest, SMS (future)
```

#### SCRUM-MASTER
**When:** Sprint planning, daily progress tracking
**Model:** Sonnet

**Use for:**
- Creating sprint plans
- Daily standup updates
- Identifying blockers
- Managing task queue
- Sprint retrospectives

**Example:**
```
@.claude/agents/planning/SCRUM-MASTER.md

Plan Sprint 5

Available stories: Epic 3 Stories 1-5
Team: 2 backend devs, 1 frontend dev, 1 QA
Duration: 2 weeks
Velocity: 40 points/sprint
```

**Output:** Sprint plan with assigned stories, dependencies identified, daily task breakdown

### Development Agents (4)

#### TEST-ENGINEER
**When:** Start of EVERY story (TDD Red phase)
**Model:** Sonnet

**Use for:**
- Writing tests BEFORE implementation
- Test strategy design
- Coverage analysis

**Example:**
```
@.claude/agents/development/TEST-ENGINEER.md
@docs/2-MANAGEMENT/epics/current/epic-3/story-3.1.md

Write tests for Story 3.1: Display notification dropdown

Acceptance Criteria:
- Given unread notifications, when I click bell, then dropdown shows
- Given 0 notifications, when I click bell, then "No notifications" shown
- Given I click a notification, when dropdown updates, then it's marked read
```

**Output:** Test files that FAIL (nothing implemented yet)

#### BACKEND-DEV
**When:** Implementing APIs, databases, business logic
**Model:** Sonnet

**Use for:**
- Building API endpoints
- Database operations
- Business logic
- Authentication/Authorization
- Integration with external services

**Example:**
```
@.claude/agents/development/BACKEND-DEV.md
@tests/notifications.test.ts (failing tests)
@docs/1-BASELINE/architecture/api-spec.md

Implement Story 3.1 backend:
GET /api/notifications - List user notifications
PATCH /api/notifications/:id/read - Mark as read
```

**Output:** Implementation that makes tests pass

#### FRONTEND-DEV
**When:** Implementing UI components
**Model:** Sonnet

**Use for:**
- Building UI components
- Integrating with APIs
- State management
- Styling
- User interactions

**Example:**
```
@.claude/agents/development/FRONTEND-DEV.md
@docs/3-ARCHITECTURE/ux/notification-dropdown-spec.md
@tests/NotificationDropdown.test.tsx (failing tests)

Implement NotificationDropdown component

Specs: @docs/3-ARCHITECTURE/ux/notification-dropdown-spec.md
API: GET /api/notifications (already implemented)
```

**Output:** React component that passes tests and matches UX specs

#### SENIOR-DEV
**When:** Complex features, integration work, architecture changes
**Model:** Opus (for complexity)

**Use for:**
- Full-stack features
- Complex algorithms
- Performance optimization
- Architecture refactoring
- Mentoring other agents (reviewing their work)

**Example:**
```
@.claude/agents/development/SENIOR-DEV.md

Story 3.4: Real-time notification delivery via WebSockets

Complex requirements:
- WebSocket connection management
- Reconnection logic
- Message queuing during disconnect
- Browser notification API integration
```

### Quality Agents (3)

#### QA-AGENT
**When:** After implementation, before code review
**Model:** Sonnet

**Use for:**
- Running test suites
- Manual testing
- Exploratory testing
- Bug reporting
- Edge case validation

**Example:**
```
@.claude/agents/quality/QA-AGENT.md
@docs/2-MANAGEMENT/epics/current/epic-3/story-3.1.md

Validate Story 3.1: Notification dropdown

Test:
- All acceptance criteria
- Edge cases (100+ notifications, slow network)
- Cross-browser (Chrome, Firefox, Safari)
- Mobile responsive
```

**Output:** QA report with PASS/FAIL and any bugs found

#### CODE-REVIEWER
**When:** After QA passes, before merging
**Model:** Sonnet (Haiku for simple fixes)

**Use for:**
- Code quality review
- Security review
- Best practices validation
- Test quality review

**Example:**
```
@.claude/agents/quality/CODE-REVIEWER.md
@lib/features/notifications/

Review notification feature implementation

Focus on:
- Security (XSS in notification content?)
- Performance (N+1 queries?)
- Code quality (duplicated logic?)
- Test coverage (edge cases covered?)
```

**Output:** Review feedback with APPROVED or CHANGES REQUESTED

#### TECH-WRITER
**When:** After code review approval
**Model:** Sonnet

**Use for:**
- API documentation
- User guides
- Developer documentation
- Changelog updates
- Release notes

**Example:**
```
@.claude/agents/quality/TECH-WRITER.md
@CHANGELOG.md

Document completed Story 3.1: Notification dropdown

Update:
- CHANGELOG.md with new feature
- API docs for notification endpoints
- User guide with screenshot of dropdown
```

---

## 5. Daily Workflow

### Morning: Check PROJECT-STATE.md

**Start your day:**
```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/state/TASK-QUEUE.md

What should I work on today?
```

**ORCHESTRATOR will tell you:**
- Current sprint progress
- Highest priority tasks
- Any blockers to address
- Your assigned tasks

### During Work: Follow Agent Guidance

**For each task:**

1. **Load the appropriate agent**
   ```
   @CLAUDE.md
   @.claude/agents/{category}/{AGENT}.md
   @{relevant-files}
   ```

2. **Describe the task**
   - Reference the story or bug
   - Mention acceptance criteria
   - Note any constraints

3. **Follow the agent's workflow**
   - Planning agents: Create documents
   - Dev agents: Write tests, implement, refactor
   - Quality agents: Review, test, document

4. **Record handoffs**
   - Update `.claude/state/HANDOFFS.md`
   - Update `.claude/state/TASK-QUEUE.md`

### End of Day: Update State Files

**Before finishing:**
```
@.claude/agents/planning/SCRUM-MASTER.md
@PROJECT-STATE.md

End of day update:

Completed today:
- Story 3.1 backend implemented
- Story 3.2 tests written

In progress:
- Story 3.1 frontend (70% done)

Blockers:
- Need UX design for Story 3.3
```

**SCRUM-MASTER updates:**
- PROJECT-STATE.md
- TASK-QUEUE.md
- METRICS.md (tracks velocity)

---

## 6. Common Tasks

### Task: Fix a Bug

**Step-by-step:**

1. **Report it (QA-AGENT)**
   ```
   @.claude/agents/quality/QA-AGENT.md

   Bug: {description}
   Steps to reproduce: {steps}
   Expected: {expected}
   Actual: {actual}
   ```

2. **Write failing test (TEST-ENGINEER)**
   ```
   @.claude/agents/development/TEST-ENGINEER.md

   Write test that reproduces bug #{id}
   ```

3. **Fix it (BACKEND-DEV or FRONTEND-DEV)**
   ```
   @.claude/agents/development/{AGENT}.md
   @tests/{test-file}

   Fix bug - make failing test pass
   ```

4. **Verify (QA-AGENT)**
   ```
   @.claude/agents/quality/QA-AGENT.md

   Verify bug #{id} is fixed
   Test edge cases
   ```

5. **Document (TECH-WRITER)**
   ```
   @.claude/agents/quality/TECH-WRITER.md

   Add to changelog: Bug fix #{id}
   ```

### Task: Add a Feature

**Step-by-step from epic to done:**

1. **Create Epic (PM-AGENT)**
   ```
   @.claude/agents/planning/PM-AGENT.md

   Create epic: {feature name}
   {High-level requirements}
   ```

2. **Design Architecture (ARCHITECT-AGENT)**
   ```
   @.claude/agents/planning/ARCHITECT-AGENT.md
   @docs/1-BASELINE/product/prd-{epic}.md

   Design architecture for Epic {N}
   ```

3. **Design UX (UX-DESIGNER)** (if UI)
   ```
   @.claude/agents/planning/UX-DESIGNER.md

   Design screens for Epic {N}
   ```

4. **Break into Stories (PM-AGENT)**
   ```
   @.claude/agents/planning/PM-AGENT.md
   @docs/1-BASELINE/architecture/epic-{N}-architecture.md

   Create user stories for Epic {N}
   ```

5. **Prioritize (PRODUCT-OWNER)**
   ```
   @.claude/agents/planning/PRODUCT-OWNER.md

   Prioritize stories for Epic {N}
   ```

6. **Plan Sprint (SCRUM-MASTER)**
   ```
   @.claude/agents/planning/SCRUM-MASTER.md

   Add Epic {N} stories to next sprint
   ```

7. **Implement Each Story** (see Story Workflow)
   - TEST-ENGINEER: Write tests
   - DEV: Implement
   - QA-AGENT: Test
   - CODE-REVIEWER: Review
   - TECH-WRITER: Document

### Task: Write Documentation

**Step-by-step:**

1. **API Documentation**
   ```
   @.claude/agents/quality/TECH-WRITER.md
   @lib/api/routes/

   Update API docs for {feature}

   Include:
   - Endpoint descriptions
   - Request/response examples
   - Error codes
   ```

2. **User Guide**
   ```
   @.claude/agents/quality/TECH-WRITER.md
   @docs/4-DEVELOPMENT/guides/

   Create user guide for {feature}

   Target audience: End users
   Include screenshots
   ```

3. **Developer Guide**
   ```
   @.claude/agents/quality/TECH-WRITER.md

   Create developer guide for {feature}

   Target audience: Other developers
   Include code examples
   ```

### Task: Review Code

**Step-by-step:**

1. **Initial Review**
   ```
   @.claude/agents/quality/CODE-REVIEWER.md
   @lib/features/{feature}/
   @tests/{feature}/

   Review {feature} implementation

   Focus on:
   - Code quality
   - Security
   - Test coverage
   - Performance
   ```

2. **Address Feedback**
   ```
   @.claude/agents/development/{DEV-AGENT}.md

   Address code review feedback for {feature}

   Feedback: {paste reviewer comments}
   ```

3. **Re-review**
   ```
   @.claude/agents/quality/CODE-REVIEWER.md

   Re-review {feature} after changes
   ```

---

## 7. Tips for Success

### Token Management (Clear Context Often)

**Problem:** Claude's context window fills up, slowing down responses.

**Solution:**
- **Start fresh every 5-10 tasks**
- **Use ORCHESTRATOR to check token budget:**
  ```
  @.claude/agents/ORCHESTRATOR.md

  Check token budget status
  ```
- **Load only what you need:**
  ```
  # Too much
  @docs/1-BASELINE/  # Don't load entire folders

  # Just right
  @docs/1-BASELINE/architecture/api-spec.md  # Specific file
  ```

**Token Budget Guidelines:**
- **Reserved (always loaded):** ~2K tokens
  - CLAUDE.md (~500)
  - PROJECT-STATE.md (~300)
  - Agent definition (~500)
- **Task-specific:** ~3-8K tokens
  - Story files
  - Code files
  - Test files
- **Total target:** Under 10K tokens per session

**Check token usage:**
```bash
bash scripts/token-counter.sh CLAUDE.md
bash scripts/token-counter.sh PROJECT-STATE.md
```

### File Organization

**Keep CLAUDE.md lean:**
```markdown
# Good (35 lines)
# My Project

## Tech Stack
See @docs/1-BASELINE/architecture/tech-stack.md

## Current Sprint
Sprint 3 - User Notifications

## Key Files
- @PROJECT-STATE.md
- @.claude/agents/ORCHESTRATOR.md

---

# Bad (100 lines)
# My Project

## Tech Stack
Frontend:
- React 18.2.0
- TypeScript 5.0
- Redux Toolkit
- React Router 6
- Material-UI
... [50 more lines of details]
```

**Use @references:**
```markdown
# Instead of inlining
Here's our API design: [huge JSON schema]

# Use references
API design: @docs/1-BASELINE/architecture/api-spec.md
```

### Communication with Agents

**Be specific:**
```
# Vague
"Make the notification system"

# Specific
"Implement Story 3.1: Display notification dropdown
Location: @docs/2-MANAGEMENT/epics/current/epic-3/story-3.1.md
Acceptance criteria are in the story file"
```

**Provide context:**
```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/development/BACKEND-DEV.md
@docs/2-MANAGEMENT/epics/current/epic-3/story-3.1.md

Story 3.1: Backend for notification dropdown
```

**Reference the workflow:**
```
@.claude/workflows/STORY-WORKFLOW.md

Follow Story Workflow for this task
Currently in: RED phase (write tests)
```

### When to Ask for Help

**Ask ORCHESTRATOR when:**
- Unsure which agent to use
- Need to prioritize multiple tasks
- Stuck on a blocker
- Token budget concerns

**Ask SCRUM-MASTER when:**
- Sprint planning questions
- Task dependencies unclear
- Need to report blockers
- Daily standup updates

**Ask ARCHITECT-AGENT when:**
- Technical design questions
- Technology choices
- Performance concerns
- Security questions

---

## 8. Troubleshooting

### Agent Not Understanding Context

**Symptom:** Agent gives generic responses or misunderstands the task

**Solution:**
1. **Check files loaded:**
   - Did you load CLAUDE.md?
   - Did you load the agent definition?
   - Did you load relevant story/files?

2. **Be more specific:**
   ```
   # Too vague
   "Fix the bug"

   # Better
   "Fix Bug #23: Email validation failing
   Reproduce: @tests/profile.test.ts line 45
   Code: @lib/services/profile-service.ts"
   ```

3. **Reference the workflow:**
   ```
   @.claude/workflows/BUG-WORKFLOW.md

   Follow Bug Workflow Phase 2: Write failing test
   ```

### Too Many Tokens

**Symptom:** "Context window full" or slow responses

**Solution:**
1. **Start fresh chat:**
   - Save any important output
   - Close chat
   - Start new chat
   - Load only essentials

2. **Use summaries:**
   ```
   # Instead of loading entire epic file

   Epic 3 Summary:
   - Goal: Add notification system
   - Current story: 3.1 (Display dropdown)
   - Backend: Complete
   - Frontend: In progress
   ```

3. **Load incrementally:**
   ```
   # First, get overview
   @PROJECT-STATE.md

   # Then, load specific story
   @docs/2-MANAGEMENT/epics/current/epic-3/story-3.1.md

   # Then, load code
   @lib/features/notifications/dropdown.tsx
   ```

### Conflicting Guidance

**Symptom:** One agent says X, another says Y

**Solution:**
1. **Check workflow order:**
   - ARCHITECT-AGENT designs first
   - Then DEV implements the design
   - Don't redesign during implementation

2. **Escalate to ORCHESTRATOR:**
   ```
   @.claude/agents/ORCHESTRATOR.md

   Conflict: ARCHITECT-AGENT designed REST API,
   but SENIOR-DEV suggests GraphQL.

   Arbitrate this decision.
   ```

3. **Document decisions:**
   - Use Architecture Decision Records (ADRs)
   - Update `.claude/state/DECISION-LOG.md`

---

## 9. Quick Reference Card

### Agent Cheat Sheet

| Need to... | Use Agent | File |
|------------|-----------|------|
| Start session | ORCHESTRATOR | `.claude/agents/ORCHESTRATOR.md` |
| Plan feature | PM-AGENT | `.claude/agents/planning/PM-AGENT.md` |
| Design architecture | ARCHITECT-AGENT | `.claude/agents/planning/ARCHITECT-AGENT.md` |
| Design UI | UX-DESIGNER | `.claude/agents/planning/UX-DESIGNER.md` |
| Plan sprint | SCRUM-MASTER | `.claude/agents/planning/SCRUM-MASTER.md` |
| Write tests | TEST-ENGINEER | `.claude/agents/development/TEST-ENGINEER.md` |
| Build backend | BACKEND-DEV | `.claude/agents/development/BACKEND-DEV.md` |
| Build frontend | FRONTEND-DEV | `.claude/agents/development/FRONTEND-DEV.md` |
| Complex feature | SENIOR-DEV | `.claude/agents/development/SENIOR-DEV.md` |
| Test feature | QA-AGENT | `.claude/agents/quality/QA-AGENT.md` |
| Review code | CODE-REVIEWER | `.claude/agents/quality/CODE-REVIEWER.md` |
| Write docs | TECH-WRITER | `.claude/agents/quality/TECH-WRITER.md` |

### Common Commands

```bash
# Initialize new project
bash scripts/init-project.sh my-project

# Validate structure
bash scripts/validate-docs.sh

# Check token usage
bash scripts/token-counter.sh CLAUDE.md

# Transition sprint
bash scripts/sprint-transition.sh

# Count tokens in file
bash scripts/token-counter.sh path/to/file.md
```

### File Locations

```
CLAUDE.md                                    # Main project file
PROJECT-STATE.md                             # Current state
.claude/agents/ORCHESTRATOR.md               # Task router
.claude/agents/{category}/{AGENT}.md         # Specific agents
.claude/workflows/{WORKFLOW}.md              # Process flows
.claude/state/TASK-QUEUE.md                  # Task queue
.claude/state/HANDOFFS.md                    # Agent handoffs
docs/1-BASELINE/                             # Requirements & architecture
docs/2-MANAGEMENT/epics/current/             # Active epics
docs/2-MANAGEMENT/sprints/                   # Sprint docs
```

### Typical Agent Invocation

```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/{category}/{AGENT}.md
@{relevant-files}

{Your specific task description}

{Context or constraints}
```

---

## 10. Getting Help

### Where to Ask Questions

1. **ORCHESTRATOR** - General routing, what to do next
   ```
   @.claude/agents/ORCHESTRATOR.md

   I'm stuck. What should I work on?
   ```

2. **SCRUM-MASTER** - Sprint planning, task management
   ```
   @.claude/agents/planning/SCRUM-MASTER.md

   How should I organize these tasks?
   ```

3. **Documentation** - Read the workflows
   - `.claude/workflows/EPIC-WORKFLOW.md`
   - `.claude/workflows/STORY-WORKFLOW.md`
   - `.claude/workflows/BUG-WORKFLOW.md`

### Escalation Path

1. **Try the specific agent first**
   - Example: BACKEND-DEV for backend questions

2. **If still stuck, ask ORCHESTRATOR**
   - Orchestrator can route to SENIOR-DEV or ARCHITECT-AGENT

3. **If architecture decision needed, ask ARCHITECT-AGENT**
   - Creates ADR (Architecture Decision Record)

4. **Document the resolution**
   - Update `.claude/state/DECISION-LOG.md`

### Resources

**Essential Reading:**
- `README.md` - Overview of the pack
- `QUICK-START.md` - 10-minute setup
- `INSTALL.md` - Detailed installation
- `.claude/workflows/` - All workflow files

**For Specific Tasks:**
- Planning: `.claude/agents/planning/`
- Development: `.claude/agents/development/`
- Quality: `.claude/agents/quality/`

**Scripts:**
- `scripts/README.md` - Script documentation
- All scripts in `scripts/` directory

**State Files:**
- `.claude/state/TASK-QUEUE.md` - What's pending
- `.claude/state/AGENT-STATE.md` - Agent availability
- `.claude/state/METRICS.md` - Performance tracking

---

## Conclusion

**You're ready to start!**

Remember:
1. Start every session with ORCHESTRATOR
2. Follow the workflows (Epic → Story → Bug)
3. Always load CLAUDE.md + agent definition + relevant files
4. Keep context under 10K tokens
5. Update state files as you progress
6. Don't hesitate to ask ORCHESTRATOR for guidance

**Your first real task:**
```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

I've completed the onboarding guide.
What should I work on first?
```

The Orchestrator will analyze your project state and recommend your first task.

**Welcome to agent-based development!**

---

**Onboarding Guide Version:** 1.0
**Last Updated:** 2025-12-05
**Estimated Reading Time:** 30 minutes
**Hands-on Time:** 30 minutes

**Questions?** Load ORCHESTRATOR and ask!
