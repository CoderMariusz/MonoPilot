# Agent Methodology Pack

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/agent-methodology-pack)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude CLI](https://img.shields.io/badge/Claude_CLI-Required-purple.svg)](https://claude.ai/cli)
[![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.svg)]()

> A comprehensive multi-agent development methodology for building software with Claude AI. Transform your development workflow with specialized AI agents that handle planning, development, and quality assurance.

---

## What is Agent Methodology Pack?

The Agent Methodology Pack is a structured framework for software development using Claude AI as a multi-agent system. Instead of using Claude as a single assistant, this pack configures specialized agents that work together through defined workflows, state management, and clear handoff protocols.

**Think of it as:** A complete development team powered by Claude, with each agent having specific expertise and responsibilities.

### Key Benefits

- **Structured Development**: Follow proven workflows from planning to deployment
- **Context Management**: Intelligent token budget allocation keeps Claude focused
- **State Persistence**: Maintain project state across sessions with clear documentation
- **Quality Assurance**: Built-in code review, testing, and documentation agents
- **Flexible Integration**: Works with any tech stack, adapts to your project
- **Best Practices**: Incorporates BMAD documentation structure and agile methodologies

---

## Key Features

### Multi-Agent Architecture
- **13 Specialized Agents**: Planning, Development, and Quality agents
- **Orchestrator**: Routes tasks to the appropriate agent
- **Clear Handoffs**: Defined transition points between agents
- **State Management**: Persistent agent memory and task queues

### Comprehensive Workflows
- **Epic Workflow**: End-to-end feature development from concept to deployment
- **Story Workflow**: Individual user story implementation with TDD
- **Bug Workflow**: Systematic bug reproduction, fixing, and verification
- **Sprint Workflow**: Agile sprint planning, execution, and retrospectives

### Documentation Framework
- **BMAD Structure**: Baseline, Management, Architecture, Development, Archive
- **Auto-generated Templates**: Consistent documentation across all artifacts
- **Context Budget Management**: Keep CLAUDE.md under 70 lines for optimal performance
- **Reference System**: `@file.md` syntax for dynamic file loading

### Developer Tools
- **Validation Scripts**: Verify project structure and references
- **Token Counter**: Monitor context usage across files
- **Sprint Transition**: Automated sprint archival and setup
- **Init Project**: One-command project initialization

---

## Quick Start

Get up and running in 5 steps:

### 1. Install Prerequisites

```bash
# Install Claude CLI
# Follow instructions at https://claude.ai/cli

# Verify installation
claude --version
```

### 2. Clone the Repository

```bash
git clone https://github.com/your-org/agent-methodology-pack.git
cd agent-methodology-pack
```

### 3. Initialize Your Project

```bash
bash scripts/init-project.sh my-awesome-project
```

This creates:
- `CLAUDE.md` - Your project configuration
- `PROJECT-STATE.md` - Current sprint state
- Complete folder structure
- Initial git repository

### 4. Customize Project Files

Edit `CLAUDE.md` with your project details:

```markdown
# My Awesome Project

## Overview
A web application for [your purpose]

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Current Phase
Phase: Planning | Sprint: 1

## Key Files
- @PROJECT-STATE.md - Sprint status
- @.claude/agents/ORCHESTRATOR.md - Agent router
```

### 5. Start with the Orchestrator

Load the Orchestrator and describe your task:

```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

I need to plan a new feature for user authentication.
```

The Orchestrator will route you to the appropriate agent (likely PM-AGENT or ARCHITECT-AGENT).

**That's it!** You're now running agent-based development.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR                            │
│                    (Routes tasks to agents)                     │
└──────────────┬──────────────────────────┬──────────────────────┘
               │                          │
       ┌───────▼────────┐        ┌────────▼────────┐
       │   PLANNING     │        │  DEVELOPMENT    │
       │    AGENTS      │        │     AGENTS      │
       ├────────────────┤        ├─────────────────┤
       │ Product Owner  │        │  Frontend Dev   │
       │ PM Agent       │        │  Backend Dev    │
       │ Scrum Master   │◄──────►│  Senior Dev     │
       │ Architect      │        │  Test Engineer  │
       │ UX Designer    │        └────────┬────────┘
       │ Research       │                 │
       └────────┬───────┘                 │
                │                         │
                └────────┬────────────────┘
                         │
                ┌────────▼─────────┐
                │    QUALITY       │
                │     AGENTS       │
                ├──────────────────┤
                │  QA Agent        │
                │  Code Reviewer   │
                │  Tech Writer     │
                └──────────────────┘

                         │
        ┌────────────────▼────────────────┐
        │        STATE MANAGEMENT         │
        ├─────────────────────────────────┤
        │ AGENT-STATE.md                  │
        │ TASK-QUEUE.md                   │
        │ HANDOFFS.md                     │
        │ DECISION-LOG.md                 │
        │ AGENT-MEMORY.md                 │
        └─────────────────────────────────┘
```

---

## Agent Overview

### Planning Agents

| Agent | Role | Input Files | Output Files |
|-------|------|-------------|--------------|
| **Product Owner** | Define vision & requirements | Market research, user needs | PRD, personas, requirements |
| **PM Agent** | Epic & story creation | PRD, requirements | Epics, user stories, acceptance criteria |
| **Scrum Master** | Sprint management | Backlog, team capacity | Sprint plan, daily updates |
| **Architect Agent** | Technical design | Requirements, constraints | Architecture docs, ADRs, schemas |
| **UX Designer** | User experience | User research, flows | Wireframes, UI specs, design system |
| **Research Agent** | Technical research | Problem statement | Research findings, recommendations |

### Development Agents

| Agent | Role | Input Files | Output Files |
|-------|------|-------------|--------------|
| **Frontend Dev** | UI/UX implementation | Designs, stories | UI components, screens |
| **Backend Dev** | Server logic & APIs | Architecture, stories | API endpoints, business logic |
| **Senior Dev** | Integration & complex features | All dev artifacts | Full-stack implementations |
| **Test Engineer** | Testing strategy | Stories, code | Test plans, test suites |

### Quality Agents

| Agent | Role | Input Files | Output Files |
|-------|------|-------------|--------------|
| **QA Agent** | Quality assurance | Code, tests, stories | Bug reports, test results |
| **Code Reviewer** | Code review | Implementation files | Review feedback, approval |
| **Tech Writer** | Documentation | Implementation, decisions | Updated docs, changelog |

---

## Documentation Structure

```
project-root/
│
├── CLAUDE.md                      # Main project file (70 lines max)
├── PROJECT-STATE.md               # Current sprint state
├── README.md                      # Project overview
├── INSTALL.md                     # Installation instructions
├── QUICK-START.md                 # 5-minute setup guide
│
├── .claude/                       # Agent methodology pack
│   ├── agents/                    # Agent definitions
│   │   ├── planning/              # Planning phase agents
│   │   │   ├── PRODUCT-OWNER.md
│   │   │   ├── PM-AGENT.md
│   │   │   ├── SCRUM-MASTER.md
│   │   │   ├── ARCHITECT-AGENT.md
│   │   │   ├── UX-DESIGNER.md
│   │   │   └── RESEARCH-AGENT.md
│   │   ├── development/           # Development agents
│   │   │   ├── FRONTEND-DEV.md
│   │   │   ├── BACKEND-DEV.md
│   │   │   ├── SENIOR-DEV.md
│   │   │   └── TEST-ENGINEER.md
│   │   ├── quality/               # Quality assurance agents
│   │   │   ├── QA-AGENT.md
│   │   │   ├── CODE-REVIEWER.md
│   │   │   └── TECH-WRITER.md
│   │   └── ORCHESTRATOR.md        # Main orchestrator
│   │
│   ├── patterns/                  # Development patterns
│   │   ├── PLAN-ACT-MODE.md
│   │   ├── REACT-PATTERN.md
│   │   ├── ERROR-RECOVERY.md
│   │   ├── QUALITY-RUBRIC.md
│   │   └── TASK-TEMPLATE.md
│   │
│   ├── state/                     # Runtime state files
│   │   ├── AGENT-STATE.md         # Current agent status
│   │   ├── AGENT-MEMORY.md        # Agent context memory
│   │   ├── TASK-QUEUE.md          # Pending tasks
│   │   ├── HANDOFFS.md            # Agent transitions
│   │   ├── DECISION-LOG.md        # Architectural decisions
│   │   ├── DEPENDENCIES.md        # Task dependencies
│   │   └── METRICS.md             # Performance tracking
│   │
│   ├── workflows/                 # Process workflows
│   │   ├── EPIC-WORKFLOW.md
│   │   ├── STORY-WORKFLOW.md
│   │   ├── BUG-WORKFLOW.md
│   │   └── SPRINT-WORKFLOW.md
│   │
│   ├── PATTERNS.md                # Pattern index
│   ├── MODULE-INDEX.md            # Module catalog
│   ├── TABLES.md                  # Database schemas
│   ├── PROMPTS.md                 # Reusable prompts
│   ├── CONTEXT-BUDGET.md          # Token management
│   └── MODEL-ROUTING.md           # Model selection guide
│
├── docs/                          # BMAD documentation structure
│   ├── 00-START-HERE.md          # Documentation index
│   │
│   ├── 1-BASELINE/               # Foundation documents
│   │   ├── product/              # Product requirements
│   │   │   ├── PRD.md
│   │   │   ├── personas.md
│   │   │   └── requirements.md
│   │   ├── architecture/         # System architecture
│   │   │   ├── overview.md
│   │   │   ├── ADRs/            # Architecture Decision Records
│   │   │   └── schemas/         # Data schemas
│   │   └── research/            # Research findings
│   │
│   ├── 2-MANAGEMENT/            # Project management
│   │   ├── backlog.md
│   │   ├── epics/
│   │   │   ├── current/         # Active epics
│   │   │   └── completed/       # Done epics
│   │   └── sprints/             # Sprint documentation
│   │       ├── sprint-01/
│   │       └── sprint-02/
│   │
│   ├── 3-ARCHITECTURE/          # Design artifacts
│   │   └── ux/                  # UX documentation
│   │       ├── flows/           # User flows
│   │       ├── wireframes/      # UI wireframes
│   │       └── specs/           # Component specs
│   │
│   ├── 4-DEVELOPMENT/           # Implementation docs
│   │   ├── api/                 # API documentation
│   │   ├── guides/              # How-to guides
│   │   └── notes/               # Dev notes
│   │
│   └── 5-ARCHIVE/               # Historical documents
│       └── old-sprints/
│
├── scripts/                      # Automation scripts
│   ├── init-project.sh          # Project initialization
│   ├── validate-docs.sh         # Structure validation
│   ├── token-counter.sh         # Context usage tracking
│   ├── sprint-transition.sh     # Sprint archival
│   └── README.md                # Script documentation
│
└── templates/                    # Document templates
    ├── CLAUDE.md.template
    ├── PROJECT-STATE.md.template
    └── epic-template.md
```

---

## Common Workflows

### Starting a New Feature

1. **Plan with PM-AGENT**
   ```
   @CLAUDE.md
   @.claude/agents/planning/PM-AGENT.md

   Create an epic for: [feature description]
   ```

2. **Design with ARCHITECT-AGENT**
   ```
   @docs/2-MANAGEMENT/epics/current/epic-N.md
   @.claude/agents/planning/ARCHITECT-AGENT.md

   Design the architecture for epic N
   ```

3. **Break into Stories with PM-AGENT**
   ```
   @docs/1-BASELINE/architecture/epic-N-architecture.md
   @.claude/agents/planning/PM-AGENT.md

   Break epic N into user stories
   ```

4. **Implement with Development Agents**
   ```
   @docs/2-MANAGEMENT/epics/current/epic-N/story-N.M.md
   @.claude/agents/development/SENIOR-DEV.md

   Implement story N.M
   ```

5. **Review with CODE-REVIEWER**
   ```
   @lib/features/feature-name/
   @.claude/agents/quality/CODE-REVIEWER.md

   Review implementation of story N.M
   ```

### Running a Sprint

1. **Sprint Planning with SCRUM-MASTER**
2. **Daily standups via AGENT-STATE.md updates**
3. **Story implementation via development agents**
4. **Sprint review with QA-AGENT**
5. **Retrospective documented in sprint folder**
6. **Archive sprint with `sprint-transition.sh`**

### Fixing a Bug

1. **Report via BUG-WORKFLOW.md**
2. **Reproduce with TEST-ENGINEER**
3. **Fix with appropriate dev agent**
4. **Verify with QA-AGENT**
5. **Document in DECISION-LOG.md**

---

## Configuration

### Context Budget Management

The pack manages Claude's context window efficiently:

- **Reserved**: CLAUDE.md (~500 tokens), PROJECT-STATE.md (~300 tokens)
- **Task-Specific**: Stories, code files (2-8K tokens)
- **Reference**: Architecture docs, loaded as needed

See `@.claude/CONTEXT-BUDGET.md` for details.

### Model Routing

Choose the right Claude model for each task:

- **Opus**: Complex architecture, critical code review
- **Sonnet**: Most development tasks, documentation
- **Haiku**: Quick checks, simple tasks (if available)

See `@.claude/MODEL-ROUTING.md` for routing logic.

---

## Validation & Monitoring

### Validate Project Structure

```bash
bash scripts/validate-docs.sh
```

Checks:
- All required files exist
- CLAUDE.md is under 70 lines
- All @references are valid
- Folder structure is complete

### Monitor Token Usage

```bash
# Basic count
bash scripts/token-counter.sh

# Detailed breakdown
bash scripts/token-counter.sh --verbose
```

Helps you stay within context limits and optimize file sizes.

---

## Best Practices

### CLAUDE.md Optimization

**DO:**
- Keep under 70 lines
- Use `@references` for details
- Update current phase regularly
- List only essential key files

**DON'T:**
- Inline large sections
- Include full tech stack details
- Embed documentation
- Add comments longer than content

### Agent Handoffs

**Clear Transitions:**
```markdown
## Handoff to ARCHITECT-AGENT

**Context:**
- Epic: Epic 1 - User Authentication
- Requirements: @docs/1-BASELINE/product/requirements.md

**Task:**
Design the authentication system architecture

**Expected Output:**
- Architecture overview
- Component diagram
- Security considerations
```

### State Management

Update `PROJECT-STATE.md` after significant progress:
- Sprint goal changes
- Blockers encountered
- Major completions
- Phase transitions

---

## Examples

### Example Project Initialization

```bash
# Create new project
bash scripts/init-project.sh my-saas-app

# Customize CLAUDE.md
vim CLAUDE.md

# Start planning
# Load: @CLAUDE.md, @.claude/agents/ORCHESTRATOR.md
# Prompt: "I want to build a SaaS for project management"
```

### Example Epic Creation

```
@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/planning/PM-AGENT.md

Create Epic 1: User Authentication

Requirements:
- Email/password login
- OAuth (Google, GitHub)
- JWT tokens
- Password reset
- Email verification
```

### Example Story Implementation

```
@CLAUDE.md
@docs/2-MANAGEMENT/epics/current/epic-1/story-1.1.md
@.claude/agents/development/BACKEND-DEV.md

Implement Story 1.1: Email/Password Login API

Using TDD, create the login endpoint.
```

---

## Contributing

We welcome contributions to improve the Agent Methodology Pack!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes**
4. **Test with validation**: `bash scripts/validate-docs.sh`
5. **Commit**: `git commit -m "Add: your feature description"`
6. **Push**: `git push origin feature/your-feature`
7. **Submit a Pull Request**

### Contribution Areas

- **New Agents**: Specialized agents for specific domains
- **Workflow Templates**: Additional workflow patterns
- **Scripts**: Automation and tooling improvements
- **Documentation**: Examples, tutorials, guides
- **Patterns**: New development patterns
- **Integrations**: IDE plugins, CI/CD integration

### Guidelines

- Follow existing file structure
- Keep agents focused and single-purpose
- Document all new features
- Include examples where helpful
- Test with validation scripts

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Links & Resources

### Documentation
- [Onboarding Guide](docs/ONBOARDING-GUIDE.md) - **NEW!** Complete guide for new team members
- [Quick Start](QUICK-START.md) - 5-minute setup
- [Installation Guide](INSTALL.md) - Detailed installation instructions
- [Documentation Index](docs/00-START-HERE.md) - Full documentation overview

### Agent Definitions
- [Orchestrator](.claude/agents/ORCHESTRATOR.md) - Task routing
- [All Agents](.claude/agents/) - Complete agent library

### Workflows
- [Epic Workflow](.claude/workflows/EPIC-WORKFLOW.md) - Feature development
- [Story Workflow](.claude/workflows/STORY-WORKFLOW.md) - Story implementation
- [Sprint Workflow](.claude/workflows/SPRINT-WORKFLOW.md) - Sprint management

### Patterns
- [All Patterns](.claude/PATTERNS.md) - Development pattern catalog
- [Plan-Act Mode](.claude/patterns/PLAN-ACT-MODE.md) - Planning pattern
- [Quality Rubric](.claude/patterns/QUALITY-RUBRIC.md) - Quality standards

### Tools
- [Scripts Documentation](scripts/README.md) - Script usage guide
- [Context Budget](.claude/CONTEXT-BUDGET.md) - Token management
- [Model Routing](.claude/MODEL-ROUTING.md) - Model selection

---

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/your-org/agent-methodology-pack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/agent-methodology-pack/discussions)
- **Documentation**: This repository's `/docs` folder

---

## Acknowledgments

Built with insights from:
- BMAD (Baseline, Management, Architecture, Development) documentation structure
- Agile/Scrum methodologies
- Test-Driven Development (TDD) practices
- Domain-Driven Design (DDD) principles
- Claude AI best practices

---

**Version:** 1.1.0
**Last Updated:** 2025-12-05
**Maintained by:** Agent Methodology Pack Team

**Ready to transform your development workflow?**
- **New to the pack?** [Start with the Onboarding Guide!](docs/ONBOARDING-GUIDE.md)
- **Need quick setup?** [Get started in 5 minutes!](QUICK-START.md)
