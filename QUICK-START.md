# Quick Start Guide

Get your AI-powered development team running in 10 minutes.

## Prerequisites

- **Claude CLI**: Installed and configured with API access
- **Git**: Version control for your project
- **Text Editor**: VS Code or similar for viewing markdown files
- **Bash/Terminal**: For running initialization scripts
- **Project Understanding**: Basic knowledge of your project goals

## Installation

### Step 1: Copy Methodology Pack
```bash
# Clone or copy the agent-methodology-pack to your project root
cp -r agent-methodology-pack /path/to/your/project/
cd /path/to/your/project
```

### Step 2: Initialize Project
```bash
# Run the initialization script
./agent-methodology-pack/scripts/init-project.sh your-project-name

# This will:
# - Create CLAUDE.md from template
# - Create PROJECT-STATE.md from template
# - Set up docs/ structure
# - Initialize state files
# - Configure agent access
```

### Step 3: Configure Project Context
Edit the generated files:
- `CLAUDE.md`: Add project-specific context
- `PROJECT-STATE.md`: Set initial state and goals
- `.claude/state/AGENT-STATE.md`: Review agent availability

### Step 4: Verify Setup
```bash
# Run validation script
./agent-methodology-pack/scripts/validate-docs.sh

# Should show: All checks passed
```

## Project Structure Overview

After initialization, your project will have:

```
your-project/
├── CLAUDE.md                    # Main context file for Claude
├── PROJECT-STATE.md             # Current project state
├── CHANGELOG.md                 # Version history
├── agent-methodology-pack/      # This methodology pack
│   ├── .claude/
│   │   ├── agents/              # 14 specialized agents
│   │   │   ├── ORCHESTRATOR.md
│   │   │   ├── planning/        # Research, PM, UX, Architect, PO, SM
│   │   │   ├── development/     # Test Engineer, Backend, Frontend, Senior
│   │   │   └── quality/         # QA, Code Reviewer, Tech Writer
│   │   ├── workflows/           # Process flows
│   │   │   ├── EPIC-WORKFLOW.md
│   │   │   ├── STORY-WORKFLOW.md
│   │   │   ├── BUG-WORKFLOW.md
│   │   │   └── SPRINT-WORKFLOW.md
│   │   ├── state/               # System state
│   │   │   ├── AGENT-STATE.md
│   │   │   ├── TASK-QUEUE.md
│   │   │   ├── DEPENDENCIES.md
│   │   │   ├── HANDOFFS.md
│   │   │   └── METRICS.md
│   │   ├── patterns/            # Reusable patterns
│   │   └── CONTEXT-BUDGET.md    # Token management
│   ├── templates/               # Project templates
│   └── scripts/                 # Automation scripts
└── docs/                        # Organized documentation structure
    ├── 0-INBOX/                 # Raw inputs
    ├── 1-BASELINE/              # Requirements & design
    ├── 2-MANAGEMENT/            # Epics & sprints
    ├── 3-IMPLEMENTATION/        # Code & tests
    └── 4-RELEASE/               # Deployment & docs
```

## Agent Quick Reference

The methodology provides 14 specialized agents organized into three groups:

### Planning Agents (6)

| Agent | Model | Trigger | Purpose |
|-------|-------|---------|---------|
| **ORCHESTRATOR** | Opus 4.5 | Start of session | Routes tasks, manages queue, monitors system |
| **RESEARCH-AGENT** | Opus/Sonnet | New project, unknowns | Research markets, tech, gather requirements |
| **PM-AGENT** | Sonnet | Need PRD | Create Product Requirements Document |
| **UX-DESIGNER** | Sonnet | UI/UX work | Design interfaces, user flows, mockups |
| **ARCHITECT-AGENT** | Opus | Technical design | System architecture, ADRs, API design |
| **PRODUCT-OWNER** | Sonnet | Backlog management | Prioritize stories, manage backlog |
| **SCRUM-MASTER** | Sonnet | Sprint planning | Create sprints, manage tasks, track progress |

### Development Agents (4)

| Agent | Model | Trigger | Purpose |
|-------|-------|---------|---------|
| **TEST-ENGINEER** | Sonnet | Story starts (RED) | Write tests first, TDD approach |
| **BACKEND-DEV** | Sonnet | Backend work | Implement APIs, services, database |
| **FRONTEND-DEV** | Sonnet | Frontend work | Implement UI, components, interactions |
| **SENIOR-DEV** | Opus | Complex tasks | Lead complex implementations, architecture |

### Quality Agents (3)

| Agent | Model | Trigger | Purpose |
|-------|-------|---------|---------|
| **QA-AGENT** | Sonnet | After implementation | Execute tests, validate quality |
| **CODE-REVIEWER** | Sonnet/Haiku | Before merge | Review code, ensure standards |
| **TECH-WRITER** | Sonnet | After completion | Update docs, changelog, guides |

## Workflow Quick Start

### Starting an Epic (New Feature)

```markdown
[ORCHESTRATOR - Opus 4.5]

New Epic: "User Authentication System"

Please orchestrate the Epic Workflow:
1. Route to RESEARCH-AGENT for initial research
2. Manage handoffs through all phases
3. Track progress in state files
4. Recommend next actions

Read: @CLAUDE.md, @PROJECT-STATE.md
```

**Orchestrator will guide you through:**
1. Discovery (RESEARCH-AGENT -> PM-AGENT)
2. Design (ARCHITECT-AGENT + UX-DESIGNER in parallel)
3. Planning (PRODUCT-OWNER -> SCRUM-MASTER)
4. Implementation (TEST -> DEV -> QA -> REVIEW loop)
5. Quality (QA-AGENT validation)
6. Documentation (TECH-WRITER)

### Starting a Story (Single Task)

```markdown
[SCRUM-MASTER - Sonnet]

Review story readiness and assign to appropriate agent:

Story 3.2: "User can login with email/password"

Acceptance Criteria:
- Given valid credentials, user is authenticated
- Given invalid credentials, error shown
- Login form is accessible

Read: @docs/2-MANAGEMENT/epics/current/epic-03.md
```

**Scrum Master will verify story is ready, then route to TEST-ENGINEER to start RED-GREEN-REFACTOR cycle.**

### Fixing a Bug

```markdown
[QA-AGENT - Sonnet]

Investigate and route bug to appropriate developer:

Bug: Login fails with special characters in password

Steps to reproduce:
1. Enter email: test@example.com
2. Enter password with @#$ characters
3. Click login
Expected: Login succeeds
Actual: 500 error

Read: @docs/3-IMPLEMENTATION/features/auth/
```

**QA will diagnose, create bug report, and route to appropriate DEV agent via Orchestrator.**

## Token Budget Guide

Each Claude model has different context windows:

| Model | Context Window | Best For | Cost |
|-------|----------------|----------|------|
| Haiku | 200K tokens | Simple reviews, quick fixes | $ |
| Sonnet 4.5 | 200K tokens | Most development tasks | $$ |
| Opus 4.5 | 200K tokens | Architecture, complex planning | $$$ |

### Budget Guidelines

**Always Loaded (Reserved ~1,500 tokens):**
- CLAUDE.md (~500 tokens)
- PROJECT-STATE.md (~300 tokens)
- Current agent definition (~500 tokens)
- Current task details (~200 tokens)

**Task-Specific (2,000-8,000 tokens):**
- Relevant code files
- Test files
- Design docs
- Related stories

**Reference (Load as needed):**
- Architecture docs
- API specifications
- Previous decisions

### Token Management Tips
- Use `./scripts/token-counter.sh file.md` to estimate token usage
- Summarize long documents before loading
- Load only relevant sections of large files
- Start fresh chat if session exceeds 10,000 tokens
- Orchestrator monitors and warns about token usage

## Common Commands

### Validation
```bash
# Validate all documentation references
./scripts/validate-docs.sh

# Count tokens in a file
./scripts/token-counter.sh docs/1-BASELINE/architecture/overview.md
```

### Sprint Management
```bash
# Transition to next sprint
./scripts/sprint-transition.sh

# Creates new sprint file
# Archives completed sprint
# Updates PROJECT-STATE.md
```

### Project Initialization
```bash
# Initialize new project
./scripts/init-project.sh project-name

# Re-initialize documentation structure only
./scripts/init-project.sh --docs-only
```

### Quick Agent Invocation
```bash
# Start orchestrator
claude --project . "[ORCHESTRATOR] Analyze current state and recommend next action"

# Quick code review
claude --project . "[CODE-REVIEWER] Review changes in src/auth/login.ts"

# Get metrics
claude --project . "Read @.claude/state/METRICS.md and summarize progress"
```

## First Sprint in 10 Minutes

Follow these steps to start your first development sprint:

### 1. Define Your Epic (2 min)
```markdown
Create: docs/2-MANAGEMENT/epics/current/epic-01-mvp.md

# Epic 01: MVP Launch

## Goal
Launch minimum viable product with core features

## User Stories
1. User can sign up
2. User can login
3. User can view dashboard
4. User can logout
```

### 2. Invoke Orchestrator (1 min)
```bash
claude --project . "[ORCHESTRATOR] New epic created at docs/2-MANAGEMENT/epics/current/epic-01-mvp.md. Please analyze and recommend workflow."
```

### 3. Follow Research Phase (2 min)
Orchestrator routes to RESEARCH-AGENT. Provide context:
```markdown
[RESEARCH-AGENT]
Project: SaaS productivity tool
Target: Small teams, 5-50 people
Tech: React frontend, Node.js backend
Timeline: 4 weeks to MVP
```

### 4. Review PRD (1 min)
PM-AGENT creates PRD. Review and approve:
- Check user stories match your vision
- Verify acceptance criteria are clear
- Confirm scope is achievable

### 5. Architecture Design (2 min)
ARCHITECT-AGENT proposes architecture. Review:
- Database schema makes sense
- API design is RESTful
- Tech stack matches your skills

### 6. Sprint Planning (1 min)
SCRUM-MASTER creates Sprint 1:
```markdown
Sprint 1: Auth & Core UI
- Story 1.1: User signup
- Story 1.2: User login
- Story 1.3: Dashboard skeleton
```

### 7. Start First Story (1 min)
```bash
claude --project . "[SCRUM-MASTER] Assign Story 1.1 to appropriate agent and begin implementation"
```

### 8. You're Running!
From here, follow the agent's guidance:
- TEST-ENGINEER writes tests (RED)
- DEV implements (GREEN)
- DEV refactors (REFACTOR)
- QA validates
- CODE-REVIEWER approves
- TECH-WRITER documents

## Troubleshooting

### Issue: Agent references missing file
**Solution:** Create the file or update CLAUDE.md to reflect actual file locations

### Issue: Token limit warnings
**Solution:** Start a fresh chat and load only essential context

### Issue: Agent unsure which workflow to follow
**Solution:** Explicitly reference the workflow file:
```markdown
[AGENT-NAME] Follow @.claude/workflows/STORY-WORKFLOW.md for this task
```

### Issue: Handoff not happening automatically
**Solution:** Update `.claude/state/HANDOFFS.md` manually and notify next agent

### Issue: Orchestrator not routing tasks
**Solution:** Update `.claude/state/TASK-QUEUE.md` with current tasks and re-invoke

### Issue: Quality gates being skipped
**Solution:** Explicitly reference quality checklist in task description

### Issue: Documentation out of sync
**Solution:** Invoke TECH-WRITER to audit and update all docs

## Links to Detailed Documentation

- **Full Setup Guide**: `INSTALL.md`
- **Agent Definitions**: `.claude/agents/`
- **Workflow Details**: `.claude/workflows/`
- **Pattern Library**: `.claude/patterns/`
- **Context Management**: `.claude/CONTEXT-BUDGET.md`
- **Model Selection**: `.claude/MODEL-ROUTING.md`
- **State Management**: `.claude/state/`
- **Scripts Documentation**: `scripts/README.md`

## Next Steps

1. **Customize CLAUDE.md** with your project specifics
2. **Review agents** in `.claude/agents/` to understand capabilities
3. **Study workflows** in `.claude/workflows/` to understand process
4. **Create your first epic** using the Epic Workflow
5. **Monitor state files** to track progress
6. **Iterate and improve** based on your team's needs

## Getting Help

- Check `README.md` for comprehensive overview
- Review specific agent files for detailed responsibilities
- Examine workflow files for step-by-step processes
- Look at `templates/` for examples
- Review `docs/` structure for organization patterns

**Remember:** The Orchestrator is your main entry point. When in doubt, invoke it to analyze current state and recommend next actions.

---

Ready to build with AI? Start with the Orchestrator and let your agent team guide you!
