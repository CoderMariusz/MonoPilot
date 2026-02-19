# Operation States Reference

**Story**: 04.3 - Operation Start/Complete
**Status**: UX Design Complete
**Last Updated**: 2026-01-08

---

## Overview

Complete state definitions for all operation-related screens and components per Story 04.3.

---

## Screen: Operations Timeline

### Loading State

**Trigger**: Page mount, fetching operations

**Visual**:
```
+------------------------------------------------------------------+
| Operation Timeline                                                |
| +--------------------------------------------------------------+ |
| | [Skeleton Block] [Skeleton Block] [Skeleton Block]           | |
| +--------------------------------------------------------------+ |
| [Skeleton progress bar]                                          |
+------------------------------------------------------------------+
```

**Behavior**:
- Show 3-4 skeleton blocks matching expected operation count
- Pulse animation (0.75s cycle)
- aria-busy="true"
- aria-label="Loading operations"

**Duration**: < 1 second expected

---

### Empty State

**Trigger**: WO has no wo_operations records

**Visual**:
```
+------------------------------------------------------------------+
| Operation Timeline                                                |
|                                                                   |
|                   [ClipboardList Icon - Gray]                    |
|                                                                   |
|                   No operations defined                          |
|                                                                   |
|    This work order routing has no operations to track.          |
|    Operations are defined in the product routing.                |
|                                                                   |
|                   [Go to Routing] [Close]                        |
|                                                                   |
+------------------------------------------------------------------+
```

**Components**:
- Icon: ClipboardList, 48px, text-gray-400
- Heading: text-lg, font-semibold
- Description: text-sm, text-muted-foreground
- Action: Link to routing editor (if permissions allow)

---

### Error State

**Trigger**: API error fetching operations

**Visual**:
```
+------------------------------------------------------------------+
| Operation Timeline                                    [Retry]     |
|                                                                   |
|                   [AlertCircle Icon - Red]                       |
|                                                                   |
|                   Failed to load operations                      |
|                                                                   |
|    Could not fetch operations for this work order.              |
|    Error: [error message]                                        |
|                                                                   |
|                   [Retry] [Contact Support]                      |
|                                                                   |
+------------------------------------------------------------------+
```

**Components**:
- Icon: AlertCircle, 48px, text-red-500
- Heading: text-lg, font-semibold
- Description: text-sm, includes error message
- Actions: Retry (primary), Contact Support (secondary)

**Error Messages**:
| Code | Message |
|------|---------|
| 401 | "Session expired. Please log in again." |
| 403 | "You don't have permission to view operations." |
| 404 | "Work order not found." |
| 500 | "Server error. Please try again later." |
| Network | "Unable to connect. Check your internet connection." |

---

### Success State

**Trigger**: Operations loaded successfully

**Visual**: See Operations Timeline component spec

**Behavior**:
- Display all operations in sequence order
- Color-code by status
- Show duration and yield (if completed)
- Interactive: click to see details

---

## Screen: Complete Operation Modal

### Loading State (Submitting)

**Trigger**: User clicked [Complete], API call in progress

**Visual**:
```
+------------------------------------------------------------------+
| Complete Operation: Op2 Baking                              [X]  |
+------------------------------------------------------------------+
|                                                                   |
| [Operation details - dimmed/disabled]                            |
|                                                                   |
| Yield: [Input - disabled]                                        |
| Notes: [Textarea - disabled]                                     |
|                                                                   |
|           [Cancel - disabled]    [Spinner] Completing...         |
+------------------------------------------------------------------+
```

**Behavior**:
- All inputs disabled
- Cancel button disabled
- Complete button: spinner + "Completing..."
- Overlay: none (just disabled state)

---

### Empty State

**N/A** - Modal always has an operation context

---

### Error State (Validation)

**Trigger**: Invalid yield value entered

**Visual**:
```
+------------------------------------------------------------------+
| Complete Operation: Op2 Baking                              [X]  |
+------------------------------------------------------------------+
|                                                                   |
| Actual Yield (%) *                                               |
| +--------------------------------------------------+             |
| |  150                                             |             |
| +--------------------------------------------------+             |
| [X] Yield must be between 0% and 100%                           |
|                                                                   |
|                              [Cancel]    [Complete - Disabled]   |
+------------------------------------------------------------------+
```

**Behavior**:
- Input border: red (border-destructive)
- Error message: text-destructive, below input
- Complete button: disabled until fixed
- aria-describedby links input to error message

---

### Error State (API)

**Trigger**: API call failed

**Visual**:
```
+------------------------------------------------------------------+
| Complete Operation: Op2 Baking                              [X]  |
+------------------------------------------------------------------+
|                                                                   |
| [Form remains as user entered]                                   |
|                                                                   |
|           [Cancel]    [Complete]                                |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| [Toast - Top Right]                                              |
| [X] Error                                                        |
|     Failed to complete operation: Sequence not met              |
|                                              [Dismiss]           |
+------------------------------------------------------------------+
```

**Behavior**:
- Modal stays open
- Form state preserved
- Toast notification: destructive variant
- User can retry or cancel

---

### Success State

**Trigger**: API call succeeded

**Visual**:
```
[Modal closes]

+------------------------------------------------------------------+
| [Toast - Top Right]                                              |
| [Check] Success                                                  |
|     Operation 'Baking' completed with 95% yield                 |
|                                              [Dismiss]           |
+------------------------------------------------------------------+
```

**Behavior**:
- Modal closes immediately
- Toast: success variant, 3 second auto-dismiss
- Timeline refreshes
- Next operation becomes available (if sequence required)

---

## Screen: Start Operation Modal

### Loading State (Submitting)

**Trigger**: User clicked [Start Operation], API call in progress

**Visual**:
```
+------------------------------------------------------------------+
| Start Operation                                             [X]  |
+------------------------------------------------------------------+
|                                                                   |
| [Operation details - dimmed/disabled]                            |
|                                                                   |
|           [Cancel - disabled]    [Spinner] Starting...           |
+------------------------------------------------------------------+
```

---

### Empty State

**N/A** - Modal always has an operation context

---

### Error State

**Trigger**: API call failed (e.g., sequence not met)

**Visual**:
```
+------------------------------------------------------------------+
| Start Operation                                             [X]  |
+------------------------------------------------------------------+
|                                                                   |
| [Operation details]                                              |
|                                                                   |
|           [Cancel]    [Start Operation]                         |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| [Toast - Top Right]                                              |
| [X] Error                                                        |
|     Cannot start: Previous operation not completed              |
|                                              [Dismiss]           |
+------------------------------------------------------------------+
```

---

### Success State

**Trigger**: API call succeeded

**Visual**:
```
[Modal closes]

+------------------------------------------------------------------+
| [Toast - Top Right]                                              |
| [Check] Success                                                  |
|     Operation 'Baking' started                                  |
|                                              [Dismiss]           |
+------------------------------------------------------------------+
```

---

## Component: OperationCard

### Pending State (Can Start)

**Visual**:
```
+------------------------------------------------------------------+
| [1] Mixing                                            [Pending]  |
|     Expected: 30 min                                             |
|                                                                   |
|                              [Start]                            |
+------------------------------------------------------------------+
```

**Behavior**:
- Badge: gray background
- Start button: enabled, primary color
- Card: normal cursor, hover effect

---

### Pending State (Sequence Blocked)

**Visual**:
```
+------------------------------------------------------------------+
| [1] Mixing                                            [Pending]  |
|     Expected: 30 min                                             |
|     [Warning] Complete previous operation first                  |
|                                                                   |
|                              [Start - Disabled]                  |
+------------------------------------------------------------------+
```

**Behavior**:
- Badge: gray background
- Start button: disabled, greyed out
- Warning text: text-yellow-600, small
- Tooltip on hover: "Complete Op1 first"
- cursor: not-allowed on button

---

### In Progress State

**Visual**:
```
+------------------------------------------------------------------+
| [2] Baking                                       [In Progress]   |
|     Expected: 60 min | Running: 45 min                          |
|     Started: 09:30 AM by Sarah L.                                |
|                                                                   |
|                              [Complete]                          |
+------------------------------------------------------------------+
```

**Behavior**:
- Badge: blue background
- Duration: live updating (every minute)
- Complete button: enabled, green color
- Card: subtle blue border/highlight

---

### Completed State

**Visual**:
```
+------------------------------------------------------------------+
| [3] Cooling                                         [Completed]  |
|     Duration: 45 min (+15m over expected)                       |
|     Yield: 95%                                                   |
|     Completed: 10:15 AM by Sarah L.                              |
|                                                                   |
|                              [View Details]                      |
+------------------------------------------------------------------+
```

**Behavior**:
- Badge: green background with checkmark icon
- Duration: shows variance (color-coded)
- Yield: shown with color indicator
- No Start/Complete buttons
- View Details: opens detail panel

---

### Skipped State (04.3b)

**Visual**:
```
+------------------------------------------------------------------+
| [4] Packaging                                          [Skipped] |
|     Skipped by John S. at 10:30 AM                               |
|     Reason: Equipment unavailable                                |
|                                                                   |
|                              [View Details]                      |
+------------------------------------------------------------------+
```

**Behavior**:
- Badge: orange background with skip icon
- Reason shown
- No action buttons (finalized)

---

## Component: YieldInput

### Default State

**Visual**:
```
+------------------------------------------------------------------+
| Actual Yield (%)                                                  |
| +------------------------+---------------+                        |
| | [====================] |    [ 100.0 ]  |                        |
| +------------------------+---------------+                        |
|   Green slider, "Excellent" indicator                            |
+------------------------------------------------------------------+
```

---

### Warning State (Low Yield)

**Visual**:
```
+------------------------------------------------------------------+
| Actual Yield (%)                                                  |
| +------------------------+---------------+                        |
| | [===========---------] |    [ 75.0 ]   |                        |
| +------------------------+---------------+                        |
|   Yellow slider, "Below Target" indicator                        |
+------------------------------------------------------------------+
```

---

### Error State (Invalid Value)

**Visual**:
```
+------------------------------------------------------------------+
| Actual Yield (%)                                                  |
| +------------------------+---------------+                        |
| | [====================] |    [ 150 ]    |   <- Red border       |
| +------------------------+---------------+                        |
| [X] Must be between 0 and 100                                    |
+------------------------------------------------------------------+
```

---

## Component: OperationStatusBadge

### All States

| Status | Background | Text | Icon | Border |
|--------|------------|------|------|--------|
| pending | bg-gray-100 | text-gray-700 | Circle (outline) | border-gray-200 |
| in_progress | bg-blue-100 | text-blue-800 | PlayCircle | border-blue-200 |
| completed | bg-green-100 | text-green-800 | CheckCircle | border-green-200 |
| skipped | bg-orange-100 | text-orange-800 | SkipForward | border-orange-200 |

### Size Variants

| Size | Padding | Font | Icon |
|------|---------|------|------|
| sm | px-2 py-0.5 | text-xs | 12px |
| md | px-2.5 py-1 | text-sm | 14px |
| lg | px-3 py-1.5 | text-base | 16px |

---

## Component: SequenceWarning

### Visible State

**Trigger**: User attempts to start out-of-sequence operation

**Visual**:
```
+------------------------------------------------------------------+
| [AlertTriangle Icon - Yellow] Sequence Required                   |
|                                                                   |
| Cannot start "Baking" yet.                                       |
| Complete these operations first:                                  |
|   - Mixing (In Progress)                                         |
|                                                                   |
|                                              [OK, Got It]         |
+------------------------------------------------------------------+
```

**Behavior**:
- role="alert"
- aria-live="assertive"
- Auto-focus OK button
- Dismiss on Escape or button click

---

## Component: DurationDisplay

### Within Expected

**Visual**:
```
Expected: 30m | Actual: 28m (2m under)
                          ^^^^^^^^^^^
                          Green text
```

---

### Slightly Over

**Visual**:
```
Expected: 30m | Actual: 33m (+10% over)
                          ^^^^^^^^^^^^
                          Gray text
```

---

### Significantly Over

**Visual**:
```
Expected: 30m | Actual: 45m (+50% over)
                          ^^^^^^^^^^^^
                          Red text + AlertCircle icon
```

---

## Toast Notifications

### Success Toast

**Visual**:
```
+------------------------------------------------------------------+
| [CheckCircle - Green]                                    [X]     |
| Success                                                          |
| Operation 'Baking' completed with 95% yield                     |
+------------------------------------------------------------------+
```

**Behavior**:
- Position: Top-right
- Duration: 3 seconds
- Dismissible: Yes
- aria-live="polite"

---

### Error Toast

**Visual**:
```
+------------------------------------------------------------------+
| [XCircle - Red]                                          [X]     |
| Error                                                            |
| Failed to start operation: Sequence not met                     |
+------------------------------------------------------------------+
```

**Behavior**:
- Position: Top-right
- Duration: 5 seconds (or manual dismiss)
- Dismissible: Yes (required)
- aria-live="assertive"

---

## Accessibility Summary

All states include:
- [x] Color + icon (not color alone)
- [x] Text descriptions
- [x] ARIA attributes
- [x] Keyboard accessible actions
- [x] Screen reader announcements
- [x] Minimum touch targets (48dp)

---

**Status**: READY FOR FRONTEND IMPLEMENTATION
