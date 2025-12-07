# Plan-Act Mode Pattern

## Overview
Two-phase approach to task execution: plan first, then act.

## When to Use
- Complex multi-step tasks
- Tasks with dependencies
- High-risk changes
- New/unfamiliar domains

## Plan Phase

### Structure
```markdown
## Plan: {Task Title}

### Goal
{What we're trying to achieve}

### Current State
{Where we are now}

### Target State
{Where we want to be}

### Steps
1. {step 1}
   - Files: {affected files}
   - Risk: {low/medium/high}
2. {step 2}
   ...

### Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| {risk} | {prob} | {impact} | {mitigation} |

### Verification
- {how to verify success}

### Rollback
- {how to undo if needed}
```

### Plan Approval
- Simple tasks: Self-approve
- Complex tasks: Request user review
- High-risk: Require explicit approval

## Act Phase

### Execution
1. Follow plan step by step
2. Document any deviations
3. Verify after each step
4. Update state on completion

### Deviation Handling
1. Stop if significant deviation
2. Document what changed
3. Update plan if needed
4. Continue or escalate

## Benefits
- Reduced errors
- Better documentation
- Easier rollback
- Clearer communication
