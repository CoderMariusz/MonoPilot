# SET-001: Onboarding Wizard - Launcher

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 0 of 6 (Entry Point)
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

Entry screen for 15-minute onboarding wizard. Shown to new organizations on first login. Presents overview of setup process, time estimate, and option to skip. Sets expectations and gathers user consent to proceed.

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot                                      [Welcome]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    [MonoPilot Logo]                           │
│                                                               │
│           Welcome to MonoPilot Food Manufacturing MES         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Quick Onboarding Wizard                                │ │
│  │                                                         │ │
│  │  Let's get your organization ready in 15 minutes:      │ │
│  │                                                         │ │
│  │  Step 1: Organization Profile (2 min)                  │ │
│  │  Step 2: First Warehouse (3 min)                       │ │
│  │  Step 3: Storage Locations (4 min)                     │ │
│  │  Step 4: First Product (3 min)                         │ │
│  │  Step 5: Demo Work Order (2 min)                       │ │
│  │  Step 6: Review & Complete (1 min)                     │ │
│  │                                                         │ │
│  │  You can skip any step and configure later.            │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✓ Organization profile created                         │ │
│  │  ✓ First admin user configured (you)                   │ │
│  │                                                         │ │
│  │  Next: Set up your first warehouse and locations       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Skip Onboarding]                [Start Onboarding Wizard →]   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot                                      [Welcome]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                      [Spinner]                                │
│                                                               │
│                Loading your organization...                   │
│                                                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Skeleton: Logo]                                       │ │
│  │                                                         │ │
│  │  [Skeleton: Title text]                                 │ │
│  │                                                         │ │
│  │  [Skeleton: 6 step boxes]                               │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot                                      [Welcome]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                         ⚠                                     │
│                    [Error Icon]                               │
│                                                               │
│              Failed to Load Onboarding Wizard                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ❌ Error Details                                        │ │
│  │                                                         │ │
│  │  Unable to retrieve organization settings.              │ │
│  │  Error code: ORG_LOAD_FAILED                            │ │
│  │                                                         │ │
│  │  Possible causes:                                       │ │
│  │  • Network connection lost                              │ │
│  │  • Session expired                                      │ │
│  │  • Database error                                       │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Please try again or contact support if the issue persists.  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Contact Support]                              [Try Again]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
(Not applicable - launcher always shows wizard overview)
```

---

## Key Components

### 1. MonoPilot Logo
- **Type**: Brand logo (200x60dp)
- **Purpose**: Brand recognition and trust
- **Location**: Top center

### 2. Wizard Overview Card
- **Title**: "Quick Onboarding Wizard"
- **Content**: 6-step list with time estimates
- **Total Time**: 15 minutes
- **Format**: "Step N: Title (X min)"

### 3. Progress Status Card
- **Shows**: What's already completed
- **Items**: Organization profile, first admin user
- **Purpose**: Confirm registration successful

### 4. Skip Option
- **Display**: "Skip Onboarding" button (secondary)
- **Purpose**: Allow opt-out of wizard
- **Behavior**: Trigger confirmation dialog (see below)

---

## Main Actions

### Primary Action
- **Button**: "Start Onboarding Wizard →"
- **Behavior**:
  - Set `organizations.wizard_progress = { step: 1 }`
  - Navigate to Step 1 (Organization Profile)
- **Size**: Large (48dp height)
- **Color**: Primary blue

### Secondary Action
- **Button**: "Skip Onboarding"
- **Behavior**:
  - Display confirmation dialog (see "Skip Confirmation Dialog" below)
- **Size**: Medium (40dp height)
- **Color**: Neutral gray

### Error Actions
- **Button**: "Try Again"
- **Behavior**: Reload launcher screen
- **Button**: "Contact Support"
- **Behavior**: Open support email or chat

---

## Skip Confirmation Dialog

**Status**: Modal overlay on launcher screen
**Triggered by**: "Skip Onboarding" button

### Dialog Content

```
┌─────────────────────────────────────┐
│  Skip Onboarding Wizard?            │
├─────────────────────────────────────┤
│                                     │
│  We'll create a demo warehouse and  │
│  default location so you can start  │
│  exploring MonoPilot immediately.   │
│                                     │
│  You can configure everything       │
│  manually in Settings.              │
│                                     │
│  [Skip Wizard]   [Continue Setup]   │
│                                     │
└─────────────────────────────────────┘
```

### Dialog Actions

**"Skip Wizard" Button**:
- **Behavior**:
  1. Create warehouse: `DEMO-WH` (Demo Warehouse) [FR-SET-187]
  2. Create location: `DEFAULT` (Default Location) in DEMO-WH [FR-SET-187]
  3. Set `organizations.onboarding_skipped = true`
  4. Close dialog
  5. Navigate to `/dashboard`
  6. Show banner: "Setup skipped - Configure anytime from Settings"

**"Continue Setup" Button**:
- **Behavior**:
  1. Close dialog
  2. Return to launcher (or current wizard step if not on launcher)

---

## State Transitions

```
Registration Complete
  ↓
LOADING (Loading org data)
  ↓ Success
SUCCESS (Show wizard overview)
  ↓ [Start Onboarding Wizard]
Step 1 (Organization Profile)

OR

SUCCESS
  ↓ [Skip Onboarding]
MODAL (Show confirmation dialog)
  ↓ [Skip Wizard]
  ↓ Create DEMO-WH + DEFAULT location
Dashboard (/dashboard)

OR

MODAL
  ↓ [Continue Setup]
SUCCESS (Return to launcher)

OR

LOADING
  ↓ Failure
ERROR (Show retry)
  ↓ [Try Again]
LOADING (retry)
```

---

## Validation

No validation required - informational screen only.

---

## Data Required

From session/context:
- Organization ID (from registration)
- Organization name (pre-filled from signup)
- User email (current user)
- Wizard completion status (`wizard_completed`)

---

## Technical Notes

### When to Show
- **Show if**: `organizations.wizard_completed = false` AND `onboarding_skipped = false`
- **Don't show if**: `wizard_completed = true` OR `onboarding_skipped = true`

### Skip Behavior (Creates Minimal Viable Setup)

When user clicks "Skip Wizard", create:

```sql
-- 1. Create demo warehouse
INSERT INTO warehouses (org_id, name, code, address, city, state, country)
VALUES (:org_id, 'Demo Warehouse', 'DEMO-WH', 'N/A', 'N/A', 'N/A', 'N/A');

-- 2. Create default location in DEMO-WH
INSERT INTO locations (warehouse_id, code, name, type, capacity, is_active)
VALUES (:warehouse_id, 'DEFAULT', 'Default Location', 'STORAGE', NULL, true);

-- 3. Set location as default for warehouse
UPDATE warehouses
SET default_receiving_location_id = :location_id, transit_location_id = :location_id
WHERE id = :warehouse_id;

-- 4. Mark wizard as skipped
UPDATE organizations
SET onboarding_skipped = true, wizard_completed = true
WHERE id = :org_id;
```

### Persistence
```sql
-- Track wizard start
UPDATE organizations
SET wizard_progress = jsonb_build_object('step', 0, 'started_at', now())
WHERE id = :org_id;

-- Track wizard skip
UPDATE organizations
SET onboarding_skipped = true, wizard_completed = true, skipped_at = now()
WHERE id = :org_id;
```

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp
- **Contrast**: Text on white background passes WCAG AA (4.5:1)
- **Screen reader**: Announces "Welcome to MonoPilot Onboarding Wizard"
- **Keyboard**: Tab navigation, Enter to start wizard or open dialog
- **Focus**: Primary button auto-focused on load
- **Modal**: Dialog has focus trap, escape key closes dialog

---

## Related Screens

- **Previous**: Registration flow (external to wizard)
- **Next**: [SET-002-onboarding-organization.md] (Step 1)
- **Alternative**: `/dashboard` (if skipped)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `WizardLauncher` component from `/components/onboarding/`
2. Check `wizard_completed` flag before showing
3. Load organization data via `GET /api/settings/organization`
4. On "Start": save wizard progress, navigate to Step 1
5. On "Skip": show confirmation modal
6. On "Skip Wizard" in modal: call `POST /api/settings/wizard/skip` endpoint
7. On "Continue Setup" in modal: close modal, stay on launcher

### API Endpoints:
```
GET /api/settings/organization
Response: { id, name, wizard_completed, onboarding_skipped, wizard_progress }

POST /api/settings/wizard/start
Response: { success: true, next_step: '/wizard/organization' }

POST /api/settings/wizard/skip
Response: {
  success: true,
  warehouse: { id, code: "DEMO-WH" },
  location: { id, code: "DEFAULT" },
  redirect: '/dashboard'
}
```

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve (Concise Format)
**Iterations**: 0 of 3
**Last Fixed**: 2025-12-15 (FR-SET-187 alignment)
