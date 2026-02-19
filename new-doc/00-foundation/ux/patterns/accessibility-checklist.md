# Accessibility Checklist

**Status**: Reference Document
**Last Updated**: 2025-12-11

---

## Overview

All MonoPilot screens MUST pass this accessibility checklist before handoff to FRONTEND-DEV. This ensures WCAG 2.1 AA compliance and usability in industrial environments (gloves, noise, poor lighting).

---

## Touch Targets

### Mobile/Scanner Screens (Primary)

- [ ] All buttons >= 48x48dp (ADR-006 requirement)
- [ ] List items >= 64dp height for easy tapping
- [ ] Spacing between touch targets >= 8dp
- [ ] No targets smaller than 44x44dp (iOS minimum)
- [ ] Touch targets tested with gloves (if physical device available)

### Desktop Screens

- [ ] Buttons >= 36x36px
- [ ] Links >= 24px height
- [ ] Form inputs >= 40px height
- [ ] Adequate spacing for mouse precision

---

## Color Contrast

### Text Contrast (WCAG AA)

- [ ] Normal text: >= 4.5:1 contrast ratio
- [ ] Large text (18px+ or 14px+ bold): >= 3:1 contrast ratio
- [ ] Text on colored backgrounds tested with contrast checker
- [ ] UI components (borders, icons): >= 3:1 contrast ratio

### Scanner-Specific (High Contrast)

- [ ] Primary text: White (#ffffff) on Slate-900 (#0f172a) = 18.96:1 ✅
- [ ] Secondary text: Slate-300 (#cbd5e1) on Slate-900 = 11.63:1 ✅
- [ ] Error text: Red-400 (#f87171) on Slate-900 = 6.32:1 ✅
- [ ] Success text: Green-400 (#4ade80) on Slate-900 = 8.44:1 ✅

### Status Colors

| Status | Background | Text | Contrast | Pass |
|--------|------------|------|----------|------|
| Available | Green-50 | Green-800 | 7.21:1 | ✅ |
| Reserved | Blue-50 | Blue-800 | 8.59:1 | ✅ |
| Consumed | Gray-50 | Gray-800 | 11.63:1 | ✅ |
| Blocked | Red-50 | Red-800 | 6.54:1 | ✅ |
| Pending QA | Yellow-50 | Yellow-900 | 8.82:1 | ✅ |

---

## Keyboard Navigation

### All Interactive Elements

- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] All focusable elements have visible focus indicator
- [ ] Focus indicator contrast >= 3:1
- [ ] Keyboard shortcuts documented (if any)
- [ ] Escape key closes modals/dialogs
- [ ] Enter key submits forms

### Scanner Screens

- [ ] Auto-focus on scan input field on page load
- [ ] Enter key triggers scan action
- [ ] Tab moves between input and manual entry toggle
- [ ] Barcode scanner input does not require keyboard (hardware scanner)

---

## Screen Reader Compatibility

### ARIA Labels

- [ ] All images have alt text
- [ ] Icons have aria-label or aria-labelledby
- [ ] Form inputs have associated labels
- [ ] Buttons have descriptive text or aria-label
- [ ] Status messages use aria-live regions

### Semantic HTML

- [ ] Headings follow hierarchy (h1 → h2 → h3, no skips)
- [ ] Lists use `<ul>`, `<ol>`, `<li>` tags
- [ ] Tables use proper `<thead>`, `<tbody>`, `<th>` structure
- [ ] Forms use `<fieldset>` and `<legend>` for grouping
- [ ] Landmarks (header, nav, main, footer, aside) used correctly

### Dynamic Content

- [ ] Loading states announced with aria-live="polite"
- [ ] Error messages announced with aria-live="assertive"
- [ ] Success confirmations announced with aria-live="polite"
- [ ] Page title updates on route changes

---

## Mobile-First Responsive Design

### Breakpoints

| Breakpoint | Width | Target Device | Priority |
|------------|-------|---------------|----------|
| Mobile | < 768px | Phones, scanners | P0 |
| Tablet | 768-1024px | Tablets | P1 |
| Desktop | > 1024px | Desktop | P1 |

### Scanner Screens (Mobile-First)

- [ ] Single column layout (no horizontal scroll)
- [ ] Font sizes: 24px primary, 18px secondary
- [ ] Touch targets 48px minimum
- [ ] No hover-only interactions
- [ ] Gestures (swipe, pinch) not required for core functions

### Desktop Screens

- [ ] Multi-column layout where appropriate
- [ ] Font sizes: 16px primary, 14px secondary
- [ ] Hover states for interactive elements
- [ ] Keyboard shortcuts available
- [ ] Sidebars collapse on tablet

---

## Loading States

### Visual Indicators

- [ ] Skeleton loaders for content (not spinners alone)
- [ ] Progress indicators show % or steps (if known)
- [ ] Loading text describes what's loading ("Scanning barcode...")
- [ ] Loading indicators have aria-busy="true"
- [ ] Minimum display time: 300ms (avoid flicker)

### Scanner-Specific

- [ ] Barcode lookup shows "Scanning..." with spinner
- [ ] API calls show "Loading [resource]..." text
- [ ] Offline mode shows "Queued for sync" status
- [ ] Long operations (>3s) show progress bar

---

## Empty States

### Required Elements

- [ ] Illustration or icon (visual explanation)
- [ ] Heading: What's empty ("No pending receipts")
- [ ] Explanation: Why it's empty ("All POs have been received")
- [ ] Action: What user can do next ("Create new PO" or "Refresh")
- [ ] Alternative: Link to related workflow (if applicable)

### Examples

```
Empty State: No Active Work Orders

Icon: Factory (gray)
Heading: "No active work orders"
Explanation: "All work orders for today are completed."
Action: [View Completed WOs] [Create New WO]
```

---

## Error States

### Required Elements

- [ ] Error icon (red, attention-grabbing)
- [ ] Specific error message (not "Error occurred")
- [ ] Root cause explanation (if known)
- [ ] Recovery action (retry, go back, contact support)
- [ ] Help link (if available)
- [ ] Error logged for support (if critical)

### Error Types

| Type | Message Pattern | Action |
|------|-----------------|--------|
| Not Found | "[Resource] not found for barcode [X]" | "Scan again" or "Enter manually" |
| Validation | "[Field] is required / invalid" | "Fix and retry" |
| Permission | "You don't have permission to [action]" | "Contact admin" |
| Network | "Unable to connect. Changes saved offline." | "Retry when online" |
| Server | "Server error. Please try again later." | "Retry" or "Contact support" |

### Scanner-Specific Errors

- [ ] Barcode not found: Show scanned value, suggest manual entry
- [ ] Wrong barcode: Explain expected vs. actual
- [ ] QA hold: Explain status, show next steps
- [ ] Over-receipt: Show tolerance, allow/block based on settings
- [ ] Offline: Confirm action queued, show sync status

### Audible Feedback (Scanner)

- [ ] Error beep: 2 short beeps (distinct from success)
- [ ] Success beep: 1 long beep
- [ ] Warning beep: 1 short beep
- [ ] Vibration feedback (if device supports)

---

## Success States

### Required Elements

- [ ] Success icon (green checkmark)
- [ ] Confirmation message (what happened)
- [ ] Summary: Key details (LP created, qty confirmed)
- [ ] Next steps: What to do next ("Scan next material")
- [ ] Alternative action: "View details" or "Print label"

### Auto-Advance vs. Manual

| Scenario | Auto-Advance | Manual Confirm |
|----------|--------------|----------------|
| Scanner workflow (repetitive) | Yes (after 2s) | No |
| Critical action (delete, approve) | No | Yes (require click) |
| Batch operations | Yes (show progress) | No |
| Single action | No | Yes (require next step) |

### Scanner-Specific Success

- [ ] Visual: Green background flash (300ms)
- [ ] Audible: Success beep
- [ ] Text: "LP created: [LP-12345]"
- [ ] Auto-clear input field for next scan
- [ ] Show "Scan next" prompt after 2s

---

## Forms

### Input Fields

- [ ] Labels above inputs (mobile-friendly)
- [ ] Required fields marked with asterisk (*)
- [ ] Placeholder text is guidance, not label
- [ ] Error messages below field (inline validation)
- [ ] Help text below field (if needed)
- [ ] Input width matches expected content (e.g., date field narrower than address)

### Validation

- [ ] Inline validation on blur (not on every keystroke)
- [ ] Submit button disabled until required fields filled
- [ ] Error summary at top of form (if multiple errors)
- [ ] First error field auto-focused
- [ ] Success confirmation shown on submit

### Scanner Forms

- [ ] Auto-focus scan input on page load
- [ ] Manual entry toggle below scan input
- [ ] Quantity inputs: Large (48px), number keyboard on mobile
- [ ] Date inputs: Date picker with keyboard fallback
- [ ] Dropdown alternatives: Large buttons for 2-3 options

---

## Tables & Lists

### Desktop Tables

- [ ] Sticky header on scroll
- [ ] Sortable columns (if >10 rows)
- [ ] Filterable (if >50 rows)
- [ ] Row actions accessible via keyboard
- [ ] Mobile: Converts to cards (no horizontal scroll)

### Scanner Lists

- [ ] Single column (no table on mobile)
- [ ] Large list items (64px height)
- [ ] Touch-friendly checkboxes (if selectable)
- [ ] Swipe actions (if delete/archive)
- [ ] Infinite scroll or pagination

---

## Modals & Dialogs

### Accessibility

- [ ] Focus trapped within modal
- [ ] Escape key closes modal
- [ ] Close button (X) in top-right
- [ ] Overlay dims background (70% opacity)
- [ ] Modal centered on screen
- [ ] Scrollable content if exceeds viewport height

### Mobile/Scanner

- [ ] Full-screen on mobile (<768px)
- [ ] Bottom action bar (fixed)
- [ ] Large close button (48px target)
- [ ] Swipe down to dismiss (optional)

---

## Notifications & Toasts

### Toast Patterns

| Type | Duration | Position | Dismissible |
|------|----------|----------|-------------|
| Success | 3s | Top-right | Yes |
| Error | 5s (or manual) | Top-right | Yes (required) |
| Warning | 5s | Top-right | Yes |
| Info | 3s | Top-right | Yes |

### Scanner Notifications

- [ ] Larger text (18px minimum)
- [ ] High contrast colors
- [ ] Audible feedback (success/error beep)
- [ ] Vibration (if supported)
- [ ] Auto-dismiss only for success

---

## Offline Support (Scanner Priority)

### Offline Indicators

- [ ] Offline banner at top (persistent)
- [ ] "Queued for sync" status on actions
- [ ] Sync icon with pending count
- [ ] Auto-retry when connection restored
- [ ] Conflict resolution UI (if applicable)

### Offline Actions

- [ ] All scanner workflows work offline
- [ ] Actions queued in IndexedDB
- [ ] Timestamps preserved
- [ ] User notified of queued actions
- [ ] Sync progress shown when online

---

## Testing Checklist

### Manual Tests

- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test with 200% zoom (no content cut off)
- [ ] Test on mobile device (real hardware, not just emulator)
- [ ] Test with gloves (if scanner workflow)
- [ ] Test in poor lighting (warehouse simulation)
- [ ] Test offline mode (disable network)

### Automated Tests

- [ ] Axe DevTools scan (0 critical issues)
- [ ] Lighthouse accessibility score >= 90
- [ ] Contrast ratio checks (WebAIM tool)
- [ ] WAVE tool scan (0 errors)
- [ ] HTML validation (W3C validator)

---

## Quick Reference: State Definitions

Every screen MUST have:

1. **Loading**: Skeleton/spinner + progress indicator + "Loading [X]..." text
2. **Empty**: Icon + heading + explanation + action button
3. **Error**: Error icon + specific message + recovery action + help link
4. **Success**: Checkmark + confirmation + summary + next steps

---

## Handoff Requirements

Before wireframe approval:

- [ ] All 4 states defined for each screen
- [ ] Touch targets verified (48px scanner, 36px desktop)
- [ ] Color contrast verified (4.5:1 minimum)
- [ ] Keyboard navigation flow documented
- [ ] Screen reader labels documented
- [ ] Responsive breakpoints defined
- [ ] Offline behavior specified (if applicable)

---

_Last Updated: 2025-12-11_
_UX-DESIGNER: Mandatory checklist for all wireframes_
