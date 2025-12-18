# UI Navigation Patterns

**Status**: Approved
**Last Updated**: 2025-12-11

---

## Core Principle: Modals Over Page Reloads

MonoPilot prioritizes **lightweight modal interactions** over full page navigation to reduce cognitive load and improve user experience.

---

## Navigation Rules

### Pages (Full Navigation)

Use dedicated pages for:

| Pattern | Example | URL |
|---------|---------|-----|
| **List/Table views** | User List, Warehouse List, Product List | `/settings/users`, `/warehouse/products` |
| **Dashboard views** | Production Dashboard, OEE Dashboard | `/production/dashboard` |
| **Complex workflows** | Onboarding Wizard, Import/Export | `/onboarding/step/1` |
| **Multi-tab views** | Organization Profile, Security Settings | `/settings/organization` |
| **Read-only matrices** | Roles & Permissions, Audit Logs | `/settings/roles` |

### Modals (No Page Reload)

Use modals for:

| Pattern | Example | Trigger |
|---------|---------|---------|
| **Create entity** | Create User, Create Warehouse, Create Product | `[+ Add]` button |
| **Edit entity** | Edit User, Edit Warehouse, Edit Product | `[Edit]` action or row click |
| **View entity details** | View Product Details, View User Details | Row click or `[View]` action |
| **Quick actions** | Confirm Delete, Resend Invite, Test Webhook | Action button |
| **Forms < 10 fields** | API Key Create, Webhook Config, Tax Code | `[+ Add]` button |
| **Inline editing** | Change Status, Assign Role, Set Default | Dropdown/toggle in row |

---

## Modal Types

### 1. Create Modal
- Opens empty form
- Title: "Add [Entity]" or "Create [Entity]"
- Primary button: "Create [Entity]" / "Add [Entity]"
- Secondary button: "Cancel"
- Closes on success with toast notification

### 2. Edit Modal
- Pre-fills form with existing data
- Title: "Edit [Entity]" or "Edit [Entity Name]"
- Primary button: "Save Changes" / "Update"
- Secondary button: "Cancel"
- Shows "Unsaved changes" warning on close if dirty

### 3. View Modal (Detail View)
- Read-only display of entity details
- Title: "[Entity Name]" or "View [Entity]"
- Sections: Basic Info, Related Data, Actions, History
- Primary button: "Edit" (opens Edit Modal)
- Secondary button: "Close"
- Actions: Context-specific (Disable, Delete, Export, etc.)

### 4. Confirmation Modal
- Simple yes/no decision
- Title: "[Action] [Entity]?"
- Description: Consequences of action
- Primary button: "[Action]" (e.g., "Delete", "Disable")
- Secondary button: "Cancel"
- Destructive actions: Red primary button

### 5. Side Panel (Slide-over)
- For complex views that need more space
- Opens from right side (400-600px width)
- Title: "[Entity Name]"
- Used for: Activity logs, Related items list, Extended details
- Close: X button or click outside

---

## Modal Behavior

### Opening
```
1. Click trigger (button, row, action)
2. Modal overlay appears (fade in, 150ms)
3. Modal content slides up (ease-out, 200ms)
4. Focus moves to first input (or close button for view)
5. Background scrolling disabled
```

### Closing
```
1. Click Cancel/Close/X OR click outside OR press Escape
2. If form dirty: Show "Unsaved changes" confirmation
3. Modal slides down + fades out (150ms)
4. Focus returns to trigger element
5. Background scrolling restored
```

### Success
```
1. Form submitted successfully
2. Modal closes immediately
3. Toast notification appears (bottom-right)
4. Table/list refreshes (optimistic or refetch)
5. New row highlighted briefly (if created)
```

### Error
```
1. Form submission fails
2. Modal stays open
3. Error banner at top of modal
4. Inline errors on invalid fields
5. Focus moves to first error field
6. Retry button available
```

---

## Row Click Behavior

### Default: View Modal
Clicking a row opens the **View Modal** for that entity.

```
User clicks row → View [Entity] Modal opens
```

### With Actions Column
If table has actions column (`[...]` menu), row click still opens View Modal.
Actions menu provides: Edit, View Details, Delete, etc.

```
┌─────────────────────────────────────────────────────────────┐
│  Name          Email              Role      Status       ⋮  │
│  ─────────────────────────────────────────────────────────  │
│  Jan Kowalski  jan@bakery.pl     Admin     ● Active     ⋮  │ ← Click row = View Modal
│                                                          │  │ ← Click ⋮ = Actions Menu
└─────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Modal Container
```
- Overlay: bg-black/50 (50% opacity)
- Container: bg-white rounded-lg shadow-xl
- Width: sm (400px), md (500px), lg (600px), xl (800px)
- Max height: 90vh
- Padding: p-6
- Header: border-b pb-4
- Footer: border-t pt-4
- Body: overflow-y-auto
```

### Modal Header
```
┌────────────────────────────────────────────────────┐
│  [Icon] Title                              [X]     │
│  Optional subtitle or entity info                  │
└────────────────────────────────────────────────────┘
```

### Modal Footer
```
┌────────────────────────────────────────────────────┐
│  [Secondary Action]                [Primary Action]│
│  (e.g., Cancel)                   (e.g., Save)     │
└────────────────────────────────────────────────────┘
```

### Side Panel
```
┌─────────────────────────────────┬────────────────────────┐
│                                 │ [X] Entity Name        │
│       Main Content              │ ─────────────────────  │
│       (Table/Page)              │ Section 1              │
│                                 │ Section 2              │
│                                 │ Section 3              │
│                                 │ ─────────────────────  │
│                                 │ [Actions]              │
└─────────────────────────────────┴────────────────────────┘
```

---

## Implementation Notes

### ShadCN Components
- Use `Dialog` for standard modals
- Use `Sheet` (side="right") for side panels
- Use `AlertDialog` for confirmations
- Use `DialogTrigger` for proper focus management

### State Management
- Modal state in URL query params for deep linking: `?modal=edit&id=123`
- Or React state with context for simple cases
- Preserve form state on accidental close (dirty check)

### Accessibility
- Focus trap inside modal
- Escape key closes modal
- ARIA labels: `aria-modal="true"`, `role="dialog"`
- Announce modal opening to screen readers
- Return focus on close

### Performance
- Lazy load modal content
- Skeleton while loading entity data
- Optimistic updates for simple actions

---

## Settings Module Compliance

All SET-* wireframes follow these patterns:

| Screen | Type | Rationale |
|--------|------|-----------|
| SET-007 Organization Profile | Page | Multi-section form, tabs |
| SET-008 User List | Page | Table view |
| SET-009 User Create/Edit | **Modal** | Form < 10 fields |
| SET-011 Roles & Permissions | Page | Read-only matrix |
| SET-012 Warehouse List | Page | Table view |
| SET-013 Warehouse Create/Edit | **Modal** | Form < 10 fields |
| SET-014 Location Hierarchy | Page | Tree view |
| SET-015 Location Create/Edit | **Modal** | Form < 10 fields |
| SET-016 Machine List | Page | Table view |
| SET-017 Machine Create/Edit | **Modal** | Form < 10 fields |
| SET-018 Production Line List | Page | Table view |
| SET-019 Line Create/Edit | **Modal** | Form < 10 fields |
| SET-020 Allergen List | Page | Table view |
| SET-021 Tax Code List | Page | Table view |
| SET-022 Module Toggles | Page | Settings page |
| SET-023 API Keys List | Page | Table view |
| SET-024 Webhooks List | Page | Table view |
| SET-025 Audit Logs | Page | Read-only table |
| SET-026 Security Settings | Page | Multi-section form |
| SET-027 Notification Settings | Page | Matrix/checkboxes |
| SET-028 Subscription & Billing | Page | Dashboard view |
| SET-029 Import/Export | Page | Complex workflow |

---

## View Modals (To Add)

These View Modals need wireframes:

| Entity | Opens From | Content |
|--------|------------|---------|
| View User | User List row click | Profile, role, permissions, activity, actions |
| View Warehouse | Warehouse List row click | Details, locations summary, inventory stats |
| View Location | Location Tree row click | Details, LP count, capacity, path |
| View Machine | Machine List row click | Details, line assignment, maintenance history |
| View Production Line | Line List row click | Details, machines sequence, WO history |
| View Allergen | Allergen List row click | Details, products using, EU14 info |
| View Tax Code | Tax Code List row click | Details, products using |
| View API Key | API Key List row click | Details (masked), permissions, usage stats |
| View Webhook | Webhook List row click | Details, events, delivery history |

---

_Last Updated: 2025-12-11_
