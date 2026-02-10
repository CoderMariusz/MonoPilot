# Model Routing

## Overview
Guidelines for routing tasks to appropriate model capabilities.

## Task-Model Mapping

### Complex Reasoning
**Best for:** Architecture, design decisions, complex debugging
**Model tier:** High capability (Opus)
**Examples:**
- System architecture design
- Complex algorithm implementation
- Root cause analysis

### Standard Development
**Best for:** Implementation, testing, documentation
**Model tier:** Standard (Sonnet)
**Examples:**
- Feature implementation
- Test writing
- Code review

### Simple Tasks
**Best for:** Formatting, simple edits, lookups
**Model tier:** Fast (Haiku)
**Examples:**
- Code formatting
- Simple refactoring
- Documentation updates

## Routing Decision Tree
```
Is task complex/ambiguous?
├── Yes -> Use high capability model
└── No
    Is task creative/nuanced?
    ├── Yes -> Use standard model
    └── No -> Use fast model
```

## Agent Default Routing
| Agent | Default Model | Override When |
|-------|---------------|---------------|
| ARCHITECT | High | - |
| SENIOR-DEV | High | Simple fixes |
| PM-AGENT | Standard | Complex PRD |
| BACKEND-DEV | Standard | Complex logic |
| FRONTEND-DEV | Standard | Complex UI |
| QA-AGENT | Standard | - |
| CODE-REVIEWER | Standard | Architecture review |
| TECH-WRITER | Standard | Simple updates |

## Cost Optimization
- Start with standard model
- Upgrade if task is struggling
- Downgrade for routine tasks
- Monitor quality vs cost

## Quality Thresholds
- If error rate > 10%: upgrade model
- If task takes > 3 attempts: upgrade
- If simple edits only: downgrade
