# ReAct Pattern

## Overview
Reasoning and Acting pattern for complex problem-solving.

## Structure
```
Thought: {reasoning about current situation}
Action: {what to do next}
Observation: {result of action}
... repeat ...
Final Answer: {conclusion}
```

## When to Use
- Complex problem solving
- Debugging
- Research tasks
- Multi-step analysis

## Implementation

### Thought
- Analyze current state
- Consider options
- Evaluate risks
- Plan next action

### Action
- Execute one step
- Keep actions atomic
- Document what was done

### Observation
- Record results
- Note unexpected outcomes
- Update understanding

### Iteration
- Continue until goal reached
- Adjust approach based on observations
- Know when to stop

## Example
```markdown
## Task: Debug authentication failure

Thought: User reports login failing. Need to check logs first.
Action: Read authentication service logs
Observation: Logs show "invalid token" error

Thought: Token validation failing. Check token generation.
Action: Review token creation code
Observation: Token expiry set to 0 instead of 3600

Thought: Found the bug - token immediately expires.
Action: Fix token expiry value
Observation: Tests now pass

Final Answer: Fixed bug in token expiry configuration.
```

## Best Practices
- Keep thoughts explicit
- Actions should be verifiable
- Observations should be factual
- Know when to escalate
