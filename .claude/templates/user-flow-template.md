# User Flow: {Flow Name}

## Flow Info
| Field | Value |
|-------|-------|
| Feature | {feature_name} |
| Story | {N}.{M} |
| User Goal | {what user wants to accomplish} |

## Overview
{Brief description of what this flow enables users to do}

---

## Entry Points
- {How user arrives at this flow - e.g., "Tap 'Create' button on home screen"}
- {Alternative entry point if any}

---

## Flow Diagram

```
                    [Start: {entry point}]
                            |
                            v
                    +---------------+
                    |   Screen 1    |
                    |   {name}      |
                    +-------+-------+
                            |
                            | action: {user action}
                            v
                    +---------------+
                    |   Screen 2    |
                    |   {name}      |
                    +-------+-------+
                            |
            +---------------+---------------+
            |                               |
            | condition: {if success}       | condition: {if error}
            v                               v
    +---------------+               +---------------+
    |   Screen 3    |               |  Error State  |
    |   {success}   |               |   {handle}    |
    +---------------+               +-------+-------+
                                            |
                                            | action: retry
                                            v
                                    [Back to Screen 2]
```

---

## Steps Detail

### Step 1: {Screen Name}
| Aspect | Description |
|--------|-------------|
| User sees | {What is displayed on screen} |
| User does | {Action user takes} |
| System responds | {What happens in response} |
| Next | {Where user goes next} |

### Step 2: {Screen Name}
| Aspect | Description |
|--------|-------------|
| User sees | {description} |
| User does | {action} |
| System responds | {response} |
| Next | {destination} |

### Step 3: {Screen Name}
| Aspect | Description |
|--------|-------------|
| User sees | {description} |
| User does | {action} |
| System responds | {response} |
| Next | {destination or end} |

---

## Decision Points

| Condition | True Path | False Path |
|-----------|-----------|------------|
| {condition 1} | → {outcome A} | → {outcome B} |
| {condition 2} | → {outcome A} | → {outcome B} |

---

## Edge Cases

### User Cancels
- **When:** {at which step}
- **Action:** {what happens}
- **Destination:** {where user goes}

### Validation Fails
- **When:** {trigger condition}
- **Display:** {error message}
- **Recovery:** {how to fix}

### Network Error
- **When:** {during which action}
- **Display:** {error state}
- **Retry:** {retry mechanism}

### Session Expires
- **When:** {during flow}
- **Action:** {save draft / redirect}
- **Recovery:** {re-auth flow}

---

## Success State
- **User sees:** {final confirmation}
- **System state:** {what changed}
- **Next options:** {where user can go next}

---

## Metrics / Analytics

| Event | Trigger | Parameters |
|-------|---------|------------|
| flow_started | Enter step 1 | source, user_id |
| step_completed | Complete each step | step_name, duration |
| flow_completed | Reach success | total_duration |
| flow_abandoned | Exit before success | last_step, reason |
| error_encountered | Any error | error_type, step |

---

## Wireframe References
- Screen 1: @wireframes/wireframe-{screen1}.md
- Screen 2: @wireframes/wireframe-{screen2}.md
- Screen 3: @wireframes/wireframe-{screen3}.md

---

## Notes
{Any additional context or implementation notes}
