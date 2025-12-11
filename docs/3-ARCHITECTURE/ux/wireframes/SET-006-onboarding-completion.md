# SET-006: Onboarding Wizard - Completion

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 6 of 6 (Final)
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## Overview

Final step of the 15-minute onboarding wizard. Shows success confirmation, summary of what was created, and guides user to dashboard to start using MonoPilot.

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [6/6] 100%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                         ✓                                     │
│                    [Success Icon]                             │
│                                                               │
│              Setup Complete! Welcome to MonoPilot             │
│                                                               │
│     Your organization is ready to start food manufacturing    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  What We Created                                        │ │
│  │                                                         │ │
│  │  ✓ Organization: Acme Food Manufacturing                │ │
│  │  ✓ Warehouse: MAIN (4 locations configured)             │ │
│  │  ✓ Modules: Technical, Planning, Production, Warehouse  │ │
│  │  ✓ Users: 3 invitations sent                            │ │
│  │                                                         │ │
│  │  [View Details ▼]                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Next Steps                                             │ │
│  │                                                         │ │
│  │  1. Check your email for confirmation                   │ │
│  │  2. Your team will receive invitation emails            │ │
│  │  3. Create your first product in Technical module       │ │
│  │  4. Set up a production order in Planning               │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]                         [Go to Dashboard →]        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [6/6] 100%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                      [Spinner]                                │
│                                                               │
│                Setting Up Your Organization...                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✓ Creating organization profile                        │ │
│  │  ✓ Configuring regional settings                        │ │
│  │  ⏳ Creating warehouse MAIN...                           │ │
│  │  ○ Setting up locations                                 │ │
│  │  ○ Enabling modules                                     │ │
│  │  ○ Sending user invitations                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│               This may take 15-30 seconds...                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [6/6] 100%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                         ⚠                                     │
│                    [Error Icon]                               │
│                                                               │
│                   Setup Incomplete                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ❌ Error Details                                        │ │
│  │                                                         │ │
│  │  Failed to create warehouse: MAIN                       │ │
│  │  Error code: WH_CREATE_FAILED                           │ │
│  │                                                         │ │
│  │  Completed steps:                                       │ │
│  │  ✓ Organization profile                                 │ │
│  │  ✓ Regional settings                                    │ │
│  │  ❌ Warehouse creation (failed)                          │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Your progress has been saved. You can retry the setup.      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [◀ Back]              [Retry Setup]      [Skip for Now]     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
(Not applicable - final step has no empty state)
```

---

## Key Components

### 1. Success Icon
- **Type**: Large checkmark icon (48x48dp)
- **Color**: Green (#10B981)
- **Purpose**: Visual confirmation of success

### 2. Summary Card
- **Title**: "What We Created"
- **Content**: Bulleted list of created entities
- **Expand**: Collapsible "View Details" shows full config
- **Data**:
  - Organization name
  - Warehouse code + location count
  - Enabled modules (comma-separated)
  - User invitation count

### 3. Next Steps Card
- **Title**: "Next Steps"
- **Content**: Numbered list (1-4)
- **Purpose**: Guide user to first actions
- **Links**: Optional inline links to modules

### 4. Progress Tracker
- **Display**: "6/6" + 100% bar
- **State**: Complete (green)
- **Purpose**: Confirm wizard completion

---

## Main Actions

### Primary Action
- **Button**: "Go to Dashboard →"
- **Behavior**:
  - Set `organizations.wizard_completed = true`
  - Redirect to `/dashboard`
  - Show welcome toast: "Setup complete! Start creating products."
- **Size**: Large (48dp height)
- **Color**: Primary blue

### Secondary Actions
- **Button**: "◀ Back"
- **Behavior**: Return to Step 5 (Module Selection)
- **Disabled**: If in loading state

### Error Actions
- **Button**: "Retry Setup"
- **Behavior**: Re-run Step 6 completion logic
- **Button**: "Skip for Now"
- **Behavior**: Save progress, redirect to dashboard (wizard incomplete)

---

## What Happens After Completion

### 1. Database Updates
```sql
-- Mark wizard as completed
UPDATE organizations
SET wizard_completed = true,
    wizard_progress = NULL
WHERE id = :org_id;
```

### 2. User Invitations Sent
- Email sent to each user with signup link
- Email includes organization name and role assignment
- Link format: `/signup?token={token}&org={org_id}`

### 3. Dashboard Redirect
- User redirected to `/dashboard`
- Dashboard shows welcome banner (first-time only)
- Quick links to next actions:
  - Create Product (Technical module)
  - Create Production Order (Planning module)
  - Receive Inventory (Warehouse module)

### 4. Wizard Accessibility
- Wizard can be re-run from Settings → "Onboarding Wizard"
- Use case: Create additional warehouses, invite more users
- Opens in review mode with existing data pre-filled

---

## State Transitions

```
Step 5 (Module Selection)
  ↓ [Complete Setup]
LOADING (Creating entities)
  ↓ Success
SUCCESS (Show summary)
  ↓ [Go to Dashboard]
Dashboard (/dashboard)

OR

LOADING
  ↓ Failure
ERROR (Show error + retry)
  ↓ [Retry Setup]
LOADING (retry)
```

---

## Validation

No validation required on Step 6 - all validation completed in Steps 1-5.

---

## Data Created

From wizard completion (Step 6):

1. **Organization** (Step 1 data):
   - `company_name`, `logo`, `address`, `city`, `postal_code`, `country`

2. **Regional Settings** (Step 2 data):
   - `timezone`, `currency`, `language`, `date_format`, `number_format`

3. **Warehouse** (Step 3 data):
   - `code`, `name`, `address`
   - `default_receiving_location_id` (updated in Step 4)
   - `default_shipping_location_id` (updated in Step 4)
   - `transit_location_id` (updated in Step 4)

4. **Locations** (Step 4 data):
   - Receiving location (`type: 'RECEIVING'`)
   - Shipping location (`type: 'SHIPPING'`)
   - Transit location (`type: 'TRANSIT'`)
   - Production location (`type: 'PRODUCTION'`)

5. **Modules** (Step 5 data):
   - `modules_enabled` array updated with selected module codes

6. **User Invitations** (Step 6 data):
   - User records created with `status: 'INVITED'`
   - Invitation emails sent via Supabase Auth

---

## Technical Notes

### Transaction Handling
- All Step 6 operations run in single database transaction
- On error: rollback all changes, show error state
- Prevents partial setup (all-or-nothing)

### Error Recovery
- Step 6 can be retried without re-entering data
- Progress saved in `wizard_progress` JSON
- User can also skip and complete setup later from Settings

### Performance
- Expected completion time: 15-30 seconds
- Loading state shows progress per entity
- No timeout (wizard waits for completion)

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp
- **Contrast**: Success icon green passes WCAG AA (4.5:1)
- **Screen reader**: Announces "Setup complete" on success
- **Keyboard**: Tab navigation, Enter to proceed to dashboard
- **Focus**: Primary button auto-focused on success state

---

## Related Screens

- **Step 5**: [SET-005-module-selection.md] (previous step)
- **Dashboard**: `/dashboard` (next destination)
- **Settings Wizard**: `/settings/wizard` (re-run entry point)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use `CompleteWizard` component from `/components/onboarding/`
2. Call `POST /api/settings/wizard/complete` with full wizard data
3. Handle loading state with progress indicators (6 steps)
4. On success: redirect with `router.push('/dashboard')`
5. On error: show retry button, preserve wizard state

### API Endpoint:
```
POST /api/settings/wizard/complete
Body: WizardData (all 6 steps)
Response: { success: true, redirect: '/dashboard' }
```

---

**Status**: Ready for user approval
**Approval Required**: Yes (Step 6 is critical path)
**Iterations**: 0 of 3
