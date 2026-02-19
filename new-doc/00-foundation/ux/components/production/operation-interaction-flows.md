# Operation Start/Complete Interaction Flows

**Story**: 04.3 - Operation Start/Complete
**Status**: UX Design Complete
**Last Updated**: 2026-01-08

---

## Overview

Detailed interaction flows for operation start/complete feature, documenting user journeys, decision points, and error handling.

---

## Flow 1: Start Operation (Happy Path)

### Preconditions
- Work Order status = "in_progress"
- Operation status = "pending"
- Sequence requirements met (if applicable)

### Steps

```
User on WO Execution Detail page
           |
           v
+---------------------+
| 1. Click [Start]    |
|    on operation card|
+---------------------+
           |
           v
+---------------------+
| 2. Start Modal Opens|
|    - Shows op name  |
|    - Shows expected |
|      duration       |
+---------------------+
           |
           v
+---------------------+
| 3. User clicks      |
|    [Start Operation]|
+---------------------+
           |
           v
+---------------------+
| 4. API Call         |
|    POST /start      |
|    (spinner shown)  |
+---------------------+
           |
           v
+---------------------+
| 5. Success Response |
|    - Modal closes   |
|    - Toast: "Op     |
|      started"       |
|    - Card updates   |
|      to "In Progress"|
+---------------------+
           |
           v
+---------------------+
| 6. Timeline updates |
|    - Blue color     |
|    - Duration timer |
|      starts         |
+---------------------+
```

### Timing
- Modal open: Instant
- API call: < 1 second expected
- Toast duration: 3 seconds
- Timeline refresh: Real-time via refetch

---

## Flow 2: Start Operation (Sequence Blocked)

### Preconditions
- Work Order status = "in_progress"
- Operation status = "pending"
- require_operation_sequence = true
- Previous operation NOT completed

### Steps

```
User on WO Execution Detail page
           |
           v
+---------------------+
| 1. Sees [Start]     |
|    button DISABLED  |
|    on operation card|
+---------------------+
           |
           v
+---------------------+
| 2. Hovers/taps      |
|    disabled button  |
+---------------------+
           |
           v
+---------------------+
| 3. SequenceWarning  |
|    tooltip appears: |
|    "Complete Op1    |
|    first"           |
+---------------------+
           |
           v
+---------------------+
| 4. User must        |
|    complete previous|
|    operation first  |
+---------------------+
```

### Visual Indicators
- Disabled button: Greyed out, cursor: not-allowed
- Tooltip: Yellow warning icon + message
- Card: No visual change (still pending)

---

## Flow 3: Complete Operation (Happy Path)

### Preconditions
- Work Order status = "in_progress" OR "paused"
- Operation status = "in_progress"

### Steps

```
User on WO Execution Detail page
           |
           v
+---------------------+
| 1. Click [Complete] |
|    on in-progress   |
|    operation card   |
+---------------------+
           |
           v
+---------------------+
| 2. Complete Modal   |
|    Opens:           |
|    - Op name        |
|    - Started time   |
|    - Duration       |
|      (auto-calc)    |
|    - Yield input    |
|      (default 100%) |
|    - Notes field    |
+---------------------+
           |
           v
+---------------------+
| 3. User enters:     |
|    - Yield: 95%     |
|    - Notes: "Good   |
|      batch"         |
+---------------------+
           |
           v
+---------------------+
| 4. Click [Complete] |
+---------------------+
           |
           v
+---------------------+
| 5. API Call         |
|    POST /complete   |
|    (spinner shown)  |
+---------------------+
           |
           v
+---------------------+
| 6. Success Response |
|    - Modal closes   |
|    - Toast: "Op     |
|      completed with |
|      95% yield"     |
|    - Card updates   |
|      to "Completed" |
+---------------------+
           |
           v
+---------------------+
| 7. Timeline updates |
|    - Green color    |
|    - Final duration |
|    - Yield shown    |
+---------------------+
           |
           v
+---------------------+
| 8. Next operation   |
|    [Start] becomes  |
|    ENABLED          |
|    (if sequence     |
|    required)        |
+---------------------+
```

### Yield Input Behavior
- Default value: 100% (or expected_yield_percent from BOM)
- Slider + number input
- Color feedback: Green >= 95%, Yellow >= 85%, Red < 70%
- Step: 0.5%

---

## Flow 4: Complete Operation (Validation Error)

### Trigger
- User enters invalid yield (e.g., 150%, -5%)

### Steps

```
+---------------------+
| User enters: 150%   |
+---------------------+
           |
           v
+---------------------+
| Inline validation:  |
| "Yield must be      |
|  between 0-100%"    |
| (red text below     |
|  input)             |
+---------------------+
           |
           v
+---------------------+
| [Complete] button   |
| remains disabled    |
+---------------------+
           |
           v
+---------------------+
| User corrects to    |
| 95%                 |
+---------------------+
           |
           v
+---------------------+
| Error clears        |
| [Complete] enables  |
+---------------------+
```

### Validation Rules
```
yield:
  - required: true
  - type: number
  - min: 0
  - max: 100
  - step: 0.5
  - message: "Yield must be between 0% and 100%"

notes:
  - required: false
  - maxLength: 2000
  - message: "Notes cannot exceed 2000 characters"
```

---

## Flow 5: Complete Operation (API Error)

### Trigger
- API returns error (network, server, validation)

### Steps

```
+---------------------+
| User clicks         |
| [Complete]          |
+---------------------+
           |
           v
+---------------------+
| API call fails      |
| (500, 400, network) |
+---------------------+
           |
           v
+---------------------+
| Modal STAYS open    |
| Spinner stops       |
+---------------------+
           |
           v
+---------------------+
| Toast notification: |
| [X] Error           |
| "Failed to complete |
|  operation: [reason]"|
| (destructive, 5s)   |
+---------------------+
           |
           v
+---------------------+
| User can:           |
| - Retry [Complete]  |
| - [Cancel] to close |
+---------------------+
```

### Error Messages

| Error Code | Message |
|------------|---------|
| 400 | "Invalid yield value" |
| 403 | "You don't have permission to complete this operation" |
| 404 | "Operation not found" |
| 409 | "Operation already completed" |
| 422 | "Sequence not met - complete previous operations first" |
| 500 | "Server error. Please try again." |
| Network | "Unable to connect. Check your connection." |

---

## Flow 6: View Operation Details

### Trigger
- Click on operation card (not on buttons)

### Steps

```
+---------------------+
| Click operation     |
| card body           |
+---------------------+
           |
           v
+---------------------+
| Slide-over panel    |
| opens from right    |
+---------------------+
           |
           v
+---------------------+
| Panel shows:        |
| - Full description  |
| - Instructions      |
| - Expected vs       |
|   actual times      |
| - Yield details     |
| - Operator name     |
| - Operation logs    |
+---------------------+
           |
           v
+---------------------+
| User can:           |
| - Click [X] to close|
| - Click outside     |
| - Press Escape      |
+---------------------+
```

---

## Flow 7: Operation Sequence Enforcement

### Decision Tree

```
                    Start Operation?
                          |
           +--------------+---------------+
           |                              |
    require_operation_                    |
    sequence = true?                      |
           |                              |
    +------+------+                       |
    |             |                       |
   YES           NO                       |
    |             |                       |
    v             +--------> [Start Enabled]
    |
Previous Op
Completed?
    |
+---+---+
|       |
YES    NO
|       |
v       v
[Start  [Start
Enabled] Disabled
         + Warning]
```

### Sequence States

| Scenario | Operation 1 | Operation 2 | Operation 3 |
|----------|-------------|-------------|-------------|
| Initial | [Start] | Disabled | Disabled |
| Op1 Started | [Complete] | Disabled | Disabled |
| Op1 Completed | Done | [Start] | Disabled |
| Op2 Started | Done | [Complete] | Disabled |
| Op2 Completed | Done | Done | [Start] |
| Op3 Completed | Done | Done | Done |

---

## State Transitions

### Operation Status Machine

```
          +----------+
          | pending  |
          +----+-----+
               |
               | start_operation
               v
          +----+-----+
          |in_progress|
          +----+-----+
               |
     +---------+---------+
     |                   |
     | complete_op       | skip_operation (04.3b)
     v                   v
+----+-----+       +-----+----+
| completed|       | skipped  |
+----------+       +----------+
```

### Allowed Transitions

| From | To | Action | Validation |
|------|----|---------|-----------|
| pending | in_progress | start | WO=in_progress, sequence OK |
| in_progress | completed | complete | yield 0-100% |
| pending | skipped | skip (04.3b) | supervisor permission |

---

## Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| Enter | Submit form | Modal focused |
| Escape | Close modal | Modal open |
| Tab | Next focusable | Any |
| Shift+Tab | Previous focusable | Any |
| Arrow Up/Down | Adjust yield by step | Yield input focused |

---

## Touch Gestures (Mobile)

| Gesture | Action | Context |
|---------|--------|---------|
| Tap | Select/activate | Buttons, cards |
| Swipe left | Reveal actions | Operation card |
| Swipe down | Dismiss | Modal (optional) |
| Long press | Show tooltip | Disabled buttons |

---

## Loading States

### Button Loading
```
Before: [Complete]
During: [Spinner] Completing...
After:  [Complete] (modal closes)
```

### Card Loading (Refresh)
```
Before: Normal card
During: Subtle opacity (0.7) + shimmer
After:  Updated status badge
```

### Timeline Loading
```
Before: Normal timeline
During: Skeleton blocks
After:  Updated colors/positions
```

---

## Optimistic Updates (Future Enhancement)

Not implemented in 04.3. Consider for future:
- Update card status immediately on click
- Rollback on API error
- Show "syncing" indicator

---

## Error Recovery Matrix

| Error | User Action | System Response |
|-------|-------------|-----------------|
| Network timeout | Retry button | Re-attempt API call |
| Validation error | Fix input | Clear error on fix |
| Permission denied | Contact admin | Show admin contact |
| Sequence error | Complete previous | Highlight blocking op |
| Server error | Retry later | Log for support |

---

**Status**: READY FOR FRONTEND IMPLEMENTATION
