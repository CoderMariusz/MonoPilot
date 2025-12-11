# Task Template Pattern

## Overview
Standardized task format for consistent agent operations.

## Task Structure
```markdown
## TASK-{ID}: {Title}

### Metadata
- **Type:** {Feature | Bug | Task | Spike}
- **Priority:** {P0 | P1 | P2 | P3}
- **Complexity:** {S | M | L | XL}
- **Agent:** {assigned agent}
- **Status:** {Todo | In Progress | Review | Done}

### Description
{What needs to be done}

### Context
{Background information}
{Related files/documentation}

### Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}

### Technical Notes
- {implementation detail}
- {pattern to use}

### Dependencies
- Blocked by: {task IDs}
- Blocks: {task IDs}

### Deliverables
- [ ] {deliverable 1}
- [ ] {deliverable 2}

### Verification
- [ ] {how to verify completion}
```

## Task Types

### Feature
New functionality to implement

### Bug
Defect to fix

### Task
Technical work (refactoring, setup)

### Spike
Research/investigation task

## Complexity Guidelines
| Size | Duration | Risk |
|------|----------|------|
| S | < 2 hours | Low |
| M | 2-4 hours | Medium |
| L | 4-8 hours | High |
| XL | > 8 hours | Split |
