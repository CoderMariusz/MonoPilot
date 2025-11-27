# Detail Page Pattern - Shared Across All Modules

**Status:** v1.0 - Template for all detail pages
**Used by:** Planning, Production, Warehouse, Quality, Shipping, NPD, Settings
**Design principle:** Similar pattern = easy user navigation across modules

---

## Overview

All detail pages (PO detail, WO detail, LP detail, NCR detail, SO detail, NPD project detail, etc.) follow this consistent pattern to ensure users can easily find information regardless of module.

---

## Standard Detail Page Layout

### Header Section (Fixed)
```
┌─────────────────────────────────────────────────────┐
│ [◄ Back] TITLE (e.g., "PO-001") │ [Status Badge] │ [Actions ▼]
├─────────────────────────────────────────────────────┤
│ Key Info Row: Supplier: ABC | Date: 2025-11-27 | Total: €5,000
└─────────────────────────────────────────────────────┘
```

**Components:**
- **Back button** (◄) - Navigate back to list
- **Title** - Document ID + name (e.g., "PO-001 | Supplier ABC")
- **Status Badge** - Color-coded status (green/yellow/red)
- **Actions dropdown** (▼) - Edit, Delete, Print, Download, etc.
- **Key Info Row** - Most important fields at a glance

**Heights:**
- Header: 80px (fixed)
- Key Info: 40px

---

### Content Tabs/Sections (DESKTOP: Tabs | MOBILE: Accordions)

```
┌─────────────────────────────────────────────────────┐
│ [Overview] [Items] [History] [Audit Trail]         │  ← Desktop tabs
├─────────────────────────────────────────────────────┤
│ Content area (scrollable)                          │
│                                                    │
│ [Section content based on active tab]              │
│                                                    │
│                                                    │
└─────────────────────────────────────────────────────┘
```

**Standard Tabs (all modules):**
1. **Overview** - Main details (always first)
2. **Items/Lines** - Child records (if applicable)
3. **History** - Changes log (who changed what when)
4. **Audit Trail** - System logs (optional, for sensitive data)

**Module-specific tabs:**
- Production: Overview | Operations | Materials | Yields | History
- NPD: Overview | Formulations | Compliance | Costing | History
- Warehouse: Overview | Movements | QA | Expiry | History
- Quality: Overview | Testing | NCRs | Certificates | History

---

### DESKTOP VERSION (lg+)

**Layout:**
```
┌──────────────────────────────┐
│ [Header: Fixed 80px]         │
├──────────────────────────────┤
│ Key Info [40px]              │
├──────────────────────────────┤
│ [Tab1] [Tab2] [Tab3] [Tab4] │ ← Horizontal tabs
├──────────────────────────────┤
│                              │
│ Content Area (scrollable)    │
│ - Sections/Tables/Forms      │
│ - Lazy loaded if >2KB        │
│                              │
│                              │
├──────────────────────────────┤
│ [Edit] [Save] [Cancel]       │ ← Footer buttons (if editing)
└──────────────────────────────┘
```

---

### MOBILE VERSION (< 768px)

**Layout:**
```
┌──────────────────────────────┐
│ [Back] TITLE [Status] [... ]│ ← Compact header
├──────────────────────────────┤
│ Key Info (1 line per mobile) │
│ Supplier: ABC | Date: 2025-11
├──────────────────────────────┤
│ ▼ Overview                   │ ← Accordions (collapsed by default)
│                              │
│ ▼ Items                      │
│   (closed)                   │
│                              │
│ ▼ History                    │
│   (closed)                   │
│                              │
├──────────────────────────────┤
│ [Edit] [Delete]              │ ← Full-width buttons
└──────────────────────────────┘
```

**Accordions:**
- Only first tab (Overview) expanded by default
- Click to expand/collapse others
- Smooth animation (200ms)
- Tab content lazy-loads on expand

---

## Standard Tab Content Patterns

### Overview Tab (always first)

**Content structure:**
```
┌─────────────────────────────────────────┐
│ SECTION 1: Header Fields                │
│ Supplier: ABC Meats                     │
│ Status: Confirmed                       │
│ Date: 2025-11-27                        │
├─────────────────────────────────────────┤
│ SECTION 2: Details Fields               │
│ Expected Delivery: 2025-12-15           │
│ Total: €5,000                           │
│ Notes: Special handling required        │
├─────────────────────────────────────────┤
│ SECTION 3: Actions/Related              │
│ [View Supplier] [View Related POs]      │
└─────────────────────────────────────────┘
```

**Field display:**
- Label: 12px, gray-600
- Value: 14px, gray-900
- 2 fields per row on desktop, 1 per row on mobile
- Read-only (no edit on overview - use Edit modal)

### Items/Lines Tab (if applicable)

**Standard table:**
```
[Checkbox] Column1 | Column2 | Column3 | Status | Actions
──────────────────────────────────────────────────────
[ ] Item-001 | Details | 100 | Active | [View] [Delete]
[ ] Item-002 | Details | 50 | Active | [View] [Delete]
```

- Sortable headers (↕)
- Inline actions (View, Delete)
- Bulk actions if checkboxes selected
- Pagination if >20 items

### History Tab (audit trail)

**Timeline format:**
```
2025-11-27 14:30 - Status changed: Draft → Confirmed
  By: John (john@company.com)
  Details: [View more]

2025-11-27 10:15 - Created
  By: Sarah (sarah@company.com)
```

- Descending chronological order (newest first)
- User info (name + email)
- Field changes logged
- Expandable details

---

## Actions & Buttons

### Header Actions (Dropdown Menu)

**Standard actions (in dropdown):**
```
[Actions ▼]
├─ Edit (pencil icon)
├─ Print (printer icon)
├─ Download PDF (download icon)
├─ ─────────────
├─ Delete (trash icon, red-600)
└─ Archive (archive icon, optional)
```

**Edit action:** Opens Edit Modal (not full page)

**Delete action:** Shows confirmation modal, then deletes + returns to list

### Footer Buttons (if editing)

```
[Cancel] [Save]
```

**Cancel:** Discard changes + return to detail view (no confirmation if no changes)

**Save:** Validate fields + update + show toast + return to detail view

---

## Responsive Grid

**Desktop (lg+):** 2 columns for fields
```
│ Supplier: ABC      │ Status: Confirmed  │
│ Date: 2025-11-27   │ Total: €5,000      │
```

**Mobile (< 768px):** 1 column
```
Supplier: ABC
Status: Confirmed
Date: 2025-11-27
Total: €5,000
```

---

## Empty States & Loading

### Loading State (initial page load)
```
┌──────────────────────────────┐
│ [Header skeleton]             │
├──────────────────────────────┤
│ Key Info (skeleton)           │
├──────────────────────────────┤
│ [Tab1] [Tab2] [Tab3]         │
├──────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░         │ ← Content loading
│ ░░░░░░░░░░░░░░░░░░░░         │
│ ░░░░░░░░░░░░░░░░░░░░         │
└──────────────────────────────┘
```

**Skeleton:** Placeholder bars, 200ms fade-in animation

### Empty Tab Content
```
┌──────────────────────────────┐
│ [Overview tab selected]       │
├──────────────────────────────┤
│                              │
│         [📄 Empty icon]       │
│     No data in this section   │
│                              │
│     [Learn more] link         │
│                              │
└──────────────────────────────┘
```

### Error State
```
┌──────────────────────────────┐
│ [Overview tab]                │
├──────────────────────────────┤
│          [⚠️ Error]           │
│  Failed to load this section  │
│                              │
│  [Retry] button              │
│                              │
└──────────────────────────────┘
```

---

## Implementation Checklist

- [ ] Header with back button, title, status badge, actions dropdown
- [ ] Key info row (most important fields)
- [ ] Tab component (desktop) / Accordion component (mobile)
- [ ] Overview tab with read-only fields (2-col desktop, 1-col mobile)
- [ ] Items/Lines tab with table (if applicable)
- [ ] History tab with timeline
- [ ] Lazy loading for tab content (loads on click)
- [ ] Edit modal (opens from Actions dropdown)
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Error state with retry
- [ ] Responsive breakpoints (lg+ = tabs, < 768px = accordions)
- [ ] Apply colors from app-colors.ts (status badges, action icons)

---

**All detail pages across ALL modules follow this pattern!** 🎯
