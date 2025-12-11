# Error Recovery Pattern

## Overview
Strategies for handling errors and recovering from failures.

## Error Categories

### Recoverable Errors
- Temporary failures (retry)
- Invalid input (validate and retry)
- Missing dependency (wait or fetch)

### Non-Recoverable Errors
- Configuration errors
- Permission denied
- Critical resource unavailable

## Recovery Strategies

### Retry
```markdown
1. Detect failure
2. Check retry count
3. Wait (exponential backoff)
4. Retry operation
5. Log outcome
```

### Rollback
```markdown
1. Detect failure mid-operation
2. Stop current action
3. Identify completed steps
4. Reverse completed steps
5. Restore previous state
6. Report failure
```

### Escalate
```markdown
1. Detect unrecoverable error
2. Document state
3. Notify appropriate agent
4. Provide context for resolution
5. Wait for guidance
```

### Graceful Degradation
```markdown
1. Detect partial failure
2. Identify working components
3. Continue with reduced functionality
4. Document limitations
5. Plan full recovery
```

## Error Documentation
```markdown
## Error Report

**Time:** {timestamp}
**Agent:** {agent}
**Task:** {task}

### Error
{error message}

### Context
{what was happening}

### Impact
{what is affected}

### Recovery Attempted
{what was tried}

### Resolution
{how it was resolved or current status}
```

## Best Practices
- Always log errors
- Preserve context
- Don't hide failures
- Learn from errors
- Update patterns based on learnings
