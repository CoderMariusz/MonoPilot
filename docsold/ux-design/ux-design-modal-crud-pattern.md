# Modal CRUD Pattern - Create/Edit/Delete

**Status:** v1.0 - Standard modals across all modules
**Principle:** Fast, no page navigation, clear and consistent

---

## Overview

All Create/Edit/Delete operations use modals instead of full-page forms. This keeps users in context and speeds up workflows (no page reload, no navigation overhead).

---

## Create Modal Pattern

### Layout
```
┌─────────────────────────────────────────────────┐
│ Create [Entity Name]                    [✕]     │ ← Title + close
├─────────────────────────────────────────────────┤
│                                                 │
│ [Form fields - 1 column on all sizes]           │
│                                                 │
│ Label: [Input field]                            │
│ Label: [Dropdown ▼]                             │
│ Label: [Date picker 📅]                         │
│ Label: [Text area]                              │
│                                                 │
│ [Validation errors if submit failed]            │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Cancel]  [Create] (right-aligned)              │ ← Footer buttons
└─────────────────────────────────────────────────┘
```

**Modal specs:**
- **Width:** 500px (desktop), full-width (mobile)
- **Max height:** 80vh (scrollable if needed)
- **Close:** [✕] button top-right OR [Cancel] button
- **Backdrop:** Click outside = cancel (with confirmation if dirty)

### Form Structure

**Rules:**
- Single column layout (no 2-col even on desktop)
- Required fields marked with * (red)
- Placeholder text showing example (gray-400)
- Helper text below field (12px, gray-500)
- Validation errors inline (red-200 bg, red-600 text)

**Example:**
```
┌─────────────────────────────────────────────────┐
│ Create Purchase Order                       [✕] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Supplier * (required, red asterisk)             │
│ [Select supplier ▼]                             │
│ Select a supplier from your contacts            │
│                                                 │
│ Expected Delivery *                             │
│ [📅 2025-12-15]                                 │
│ Earliest: tomorrow                              │
│                                                 │
│ ❌ Expected Delivery is required                │ ← Error inline
│                                                 │
│ Notes (optional)                                │
│ [Text area - multiline...]                      │
│ Max 500 characters                              │
│                                                 │
│ ─────────────────────────────────────────────   │
│ [Cancel]  [Create]                              │
└─────────────────────────────────────────────────┘
```

### Error Handling (Pattern A - Inline)

**When user submits with errors:**
1. Show red border on invalid fields
2. Show error message below field (12px, red-600)
3. Scroll to first error
4. Prevent form submission

**Example errors:**
```
Email *
[user@example.com        ]
❌ Email is not valid

Password *
[••••••••••            ]
❌ Password must be at least 8 characters
```

### Success Flow

1. User fills form
2. Clicks [Create]
3. Validation passes
4. API request (show loading spinner on button)
5. Success toast: "PO-001 created successfully"
6. Modal closes
7. Return to list OR detail page (depending on context)

---

## Edit Modal Pattern

**Very similar to Create, but:**
- Title: "Edit [Entity] (PO-001)"
- Fields pre-filled with current values
- Additional action: "Reset to original" link (if dirty)
- Validation on blur (not just submit)

```
┌─────────────────────────────────────────────────┐
│ Edit Purchase Order (PO-001)                [✕] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Supplier *                                      │
│ [ABC Meats ▼] (current value)                   │
│                                                 │
│ Expected Delivery *                             │
│ [📅 2025-12-15] (current value)                 │
│                                                 │
│ Notes                                           │
│ [Current notes text...]                         │
│ [Reset to original] (if changed)                │
│                                                 │
│ ─────────────────────────────────────────────   │
│ [Cancel]  [Save]                                │
└─────────────────────────────────────────────────┘
```

**Differences from Create:**
- [Save] instead of [Create]
- Pre-filled values
- Reset link if changed
- Validation on blur (smoother UX)
- "Unsaved changes" warning if close without save

---

## Delete Confirmation Modal

**Minimal and clear:**

```
┌─────────────────────────────────────────────────┐
│ Delete PO-001?                              [✕] │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⚠️ This action cannot be undone.                │
│                                                 │
│ Are you sure you want to delete:                │
│ • PO-001 (Supplier: ABC Meats)                  │
│ • Lines: 3 items                                │
│                                                 │
│ ─────────────────────────────────────────────   │
│ [Keep it]  [Delete] (red button)                │
└─────────────────────────────────────────────────┘
```

**Spec:**
- Warning icon (⚠️)
- Clear consequences ("cannot be undone")
- List what will be deleted
- Confirm button red-600
- Cancel button gray-600
- No default focus (force conscious choice)

---

## Quick Action Modals

**Smaller modals for single-action operations:**

### Status Change Modal
```
┌─────────────────────────────────┐
│ Change Status: WO-001       [✕] │
├─────────────────────────────────┤
│ Current: In Progress            │
│ New Status: [Completed ▼]       │
│                                 │
│ Notes (optional):               │
│ [Multiline text area]           │
│                                 │
│ ─────────────────────────────   │
│ [Cancel]  [Update]              │
└─────────────────────────────────┘
```

### Reason Modal (for Pause/Hold)
```
┌─────────────────────────────────┐
│ Pause Work Order: WO-045     [✕] │
├─────────────────────────────────┤
│ Reason:                         │
│ ☐ Breakdown                     │
│ ☐ Break                         │
│ ☐ Material Wait                 │
│ ☐ Quality Hold                  │
│ ☐ Other                         │
│                                 │
│ Notes:                          │
│ [Text area]                     │
│                                 │
│ [Cancel]  [Pause]               │
└─────────────────────────────────┘
```

---

## Mobile Optimizations

**On mobile (< 640px):**
- Modal takes full viewport width (padding 16px each side)
- Modal height: fit content, scroll if overflow
- Single column always
- Buttons stack vertically (full width)

```
┌─────────────────────────────┐
│ Create PO          [✕]      │ ← Compact header
├─────────────────────────────┤
│                             │
│ [Form fields]               │
│                             │
├─────────────────────────────┤
│ [Cancel] (full width)       │ ← Stacked buttons
│ [Create] (full width)       │
└─────────────────────────────┘
```

---

## Modal Behaviors

### Opening
- Fade-in animation (200ms)
- Backdrop darkens (30% opacity)
- Focus trapped inside modal (keyboard navigation)
- Esc key closes (if no unsaved changes)

### Closing
- Fade-out animation (150ms)
- Backdrop fades
- Return to list/previous view
- If dirty: show "Unsaved changes?" confirmation

### Validation
- Real-time validation on blur (Edit modals)
- Validation on submit (Create modals)
- Show error inline immediately
- Focus first error field on submit failure

### Loading States
- Show spinner on button during submit
- Disable form fields during API call
- Show error toast if API fails
- Keep modal open if error (user can retry)

---

## Standard Modal Sizes

| Type | Width | Max Height | Use Case |
|------|-------|-----------|----------|
| **Full Form** | 500px | 80vh | Create PO, Create WO |
| **Short Form** | 400px | 60vh | Update Status, Add Note |
| **Confirmation** | 350px | 40vh | Delete, Confirm Action |
| **Quick Action** | 300px | 30vh | Quick filters, Selections |

---

## Accessibility

- ✅ Labels associated with inputs (`<label for="field-id">`)
- ✅ Required fields marked (`*` + aria-required)
- ✅ Error messages linked to fields (aria-describedby)
- ✅ Keyboard navigable (Tab between fields)
- ✅ Focus visible (blue outline)
- ✅ WCAG AA contrast (all text 4.5:1)
- ✅ Escape key closes modal
- ✅ Screen reader announces modal title

---

## Implementation Checklist

- [ ] Modal wrapper component (handles open/close/overlay)
- [ ] Form wrapper (handles validation, submission)
- [ ] Field component (input, label, error, helper text)
- [ ] Dropdown/Select component
- [ ] Date picker component
- [ ] Text area component
- [ ] Button components (primary, secondary, danger)
- [ ] Validation logic (required, email, min length, etc.)
- [ ] Error display (inline below field)
- [ ] Success toast integration
- [ ] Loading spinner on submit button
- [ ] Unsaved changes confirmation
- [ ] Mobile responsiveness (full width, stacked buttons)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Accessibility features (labels, ARIA, focus)

---

**All modals across ALL modules follow this pattern!** 🎯
