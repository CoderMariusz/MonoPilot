# SET-006: Onboarding Wizard - Completion

**Module**: Settings
**Feature**: Onboarding Wizard (Story 1.12)
**Step**: 6 of 6 (Final)
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

Final step of the 15-minute onboarding wizard. Shows success confirmation, celebration animation, completion time, conditional achievement badge, summary of what was created, and guides user to dashboard to start using MonoPilot.

---

## ASCII Wireframe

### Success State (with Celebration & Timer)

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [6/6] 100%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    ✨ [Confetti Animation] ✨                │
│                         ✓                                     │
│                    [Success Icon]                             │
│                                                               │
│              Setup Complete! Welcome to MonoPilot             │
│                                                               │
│         Setup completed in: 12 minutes 34 seconds             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🏆 Speed Setup Champion - Under 15 minutes!            │ │
│  │                                                         │ │
│  │  Congratulations! You're lightning fast!                │ │
│  └─────────────────────────────────────────────────────────┘ │
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

### Success State WITHOUT Speed Badge (>15 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│  MonoPilot Onboarding Wizard                    [6/6] 100%  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    ✨ [Confetti Animation] ✨                │
│                         ✓                                     │
│                    [Success Icon]                             │
│                                                               │
│              Setup Complete! Welcome to MonoPilot             │
│                                                               │
│         Setup completed in: 18 minutes 5 seconds              │
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
│                Timer starting at: HH:MM:SS                    │
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
- **Animation**: Bounces in with scale animation on load

### 2. Celebration Animation
- **Type**: Confetti effect (canvas-based or library)
- **Library Options**:
  - `canvas-confetti` (18KB, popular)
  - Custom CSS animation
  - Lottie animation file
- **Duration**: 3-4 seconds
- **Trigger**: On step 6 success state load
- **Timing**: Fires after success icon animation completes
- **Accessibility**: No blocker to interaction (animation is visual only)

### 3. Completion Timer Display
- **Format**: "Setup completed in: X minutes Y seconds"
- **Position**: Directly below main heading
- **Color**: Muted gray text (#6B7280)
- **Size**: 14px
- **Data Source**:
  - `wizard_started_at` (from organizations table, set when wizard_step = 1)
  - `wizard_completed_at` (set on successful completion)
  - Calculation: `wizard_completed_at - wizard_started_at`
- **Display**: Always shown on success state
- **Stored**: Completion time logged to database for analytics

### 4. Speed Setup Champion Badge
- **Type**: Conditional, appears ONLY if completion_time_seconds < 900 (15 minutes)
- **Content**:
  ```
  🏆 Speed Setup Champion - Under 15 minutes!
  Congratulations! You're lightning fast!
  ```
- **Styling**:
  - Background: Light gold/amber (#FEF3C7)
  - Border: Gold (#F59E0B)
  - Icon: Trophy emoji (🏆)
  - Border-radius: 8px
  - Padding: 12px 16px
- **Position**: Between timer and "What We Created" card
- **Visibility**: Hidden if time >= 15 minutes
- **Analytics**: Tracked separately for achievement metrics
- **Mobile**: Full width on mobile, auto-width on desktop

### 5. Summary Card
- **Title**: "What We Created"
- **Content**: Bulleted list of created entities
- **Expand**: Collapsible "View Details" shows full config
- **Data**:
  - Organization name
  - Warehouse code + location count
  - Enabled modules (comma-separated)
  - User invitation count

### 6. Next Steps Card
- **Title**: "Next Steps"
- **Content**: Numbered list (1-4)
- **Purpose**: Guide user to first actions
- **Links**: Optional inline links to modules

### 7. Progress Tracker
- **Display**: "6/6" + 100% bar
- **State**: Complete (green)
- **Purpose**: Confirm wizard completion

---

## Main Actions

### Primary Action
- **Button**: "Go to Dashboard →"
- **Behavior**:
  - Set `organizations.wizard_completed = true`
  - Set `organizations.wizard_completed_at = NOW()`
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

## Completion Time Calculation

### Database Schema Addition

```sql
-- organizations table additions (if not already present)
ALTER TABLE organizations ADD COLUMN wizard_started_at TIMESTAMP;
ALTER TABLE organizations ADD COLUMN wizard_completed_at TIMESTAMP;
ALTER TABLE organizations ADD COLUMN completion_time_seconds INTEGER;
ALTER TABLE organizations ADD COLUMN speed_champion BOOLEAN DEFAULT false;

-- Updated onboarding_step flow
-- 1 -> started, set wizard_started_at = NOW()
-- 6 -> completed, set wizard_completed_at = NOW()
-- completion_time_seconds = EXTRACT(EPOCH FROM (wizard_completed_at - wizard_started_at))
-- speed_champion = (completion_time_seconds < 900)
```

### Timer Logic Flow

```
Step 1: Org navigates to wizard
  └─ wizard_started_at = NULL

Step 1: User enters org profile
  └─ wizard_started_at = NOW()

Step 2-5: User progresses through wizard
  └─ Timer continues running (client-side or server-side)

Step 6 (Loading): User completes setup
  └─ Backend calculates completion_time_seconds
  └─ Backend sets completion_time_seconds = NOW() - wizard_started_at
  └─ Backend sets speed_champion = (completion_time_seconds < 900)

Step 6 (Success): Completion screen shows
  └─ Display timer: "Setup completed in: 12 minutes 34 seconds"
  └─ Show badge if speed_champion = true
  └─ Store completion_time_seconds for analytics
```

---

## API Response Updates

### POST /api/settings/wizard/complete

**Request:**
```json
{
  "org_id": "org_abc123",
  "wizard_data": { /* full wizard data from steps 1-5 */ }
}
```

**Response (Success):**
```json
{
  "success": true,
  "redirect": "/dashboard",
  "completion": {
    "completion_time_seconds": 754,
    "completion_time_display": "12 minutes 34 seconds",
    "speed_champion": true,
    "badge_earned": "Speed Setup Champion"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "WH_CREATE_FAILED",
  "message": "Failed to create warehouse",
  "completed_steps": [1, 2, 3],
  "failed_step": 4
}
```

---

## What Happens After Completion

### 1. Database Updates
```sql
-- Mark wizard as completed
UPDATE organizations
SET wizard_completed = true,
    wizard_completed_at = NOW(),
    completion_time_seconds = EXTRACT(EPOCH FROM (NOW() - wizard_started_at)),
    speed_champion = (EXTRACT(EPOCH FROM (NOW() - wizard_started_at)) < 900),
    wizard_progress = NULL
WHERE id = :org_id;
```

### 2. User Invitations Sent
- Email sent to each user with signup link
- Email includes organization name and role assignment
- Link format: `/signup?token={token}&org={org_id}`

### 3. Analytics Logged
- completion_time_seconds stored for product analytics
- speed_champion flag for achievement tracking
- Wizard completion event sent to analytics service

### 4. Dashboard Redirect
- User redirected to `/dashboard`
- Dashboard shows welcome banner (first-time only)
- Quick links to next actions:
  - Create Product (Technical module)
  - Create Production Order (Planning module)
  - Receive Inventory (Warehouse module)

### 5. Wizard Accessibility
- Wizard can be re-run from Settings → "Onboarding Wizard"
- Use case: Create additional warehouses, invite more users
- Opens in review mode with existing data pre-filled

---

## State Transitions

```
Step 5 (Module Selection)
  ↓ [Complete Setup]
LOADING (Creating entities + tracking time)
  ├─ wizard_completed_at = NOW()
  ├─ completion_time_seconds = NOW() - wizard_started_at
  ├─ speed_champion = (completion_time_seconds < 900)
  ↓ Success
SUCCESS (Show summary + timer + conditional badge)
  ├─ Display: "Setup completed in: X minutes Y seconds"
  ├─ If speed_champion: Show badge
  └─ [Go to Dashboard]
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
   - **NEW**: `wizard_started_at`, `wizard_completed_at`, `completion_time_seconds`, `speed_champion`

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
- Timer calculation happens within transaction BEFORE commit

### Timer Accuracy
- Start time: Captured when wizard_step = 1 (Step 1 entry)
- End time: Captured when step 6 completes
- Calculation: Server-side in database (timezone-agnostic)
- Stored in seconds (INTEGER) for analytics
- Display: Formatted as "X minutes Y seconds" in UI

### Error Recovery
- Step 6 can be retried without re-entering data
- Progress saved in `wizard_progress` JSON
- User can also skip and complete setup later from Settings
- Timer continues from original start time (not reset on retry)

### Performance
- Expected completion time: 15-30 seconds
- Loading state shows progress per entity
- No timeout (wizard waits for completion)
- Confetti animation non-blocking (runs async)

### Analytics Integration
- completion_time_seconds sent to analytics service
- speed_champion flag tracked separately
- Achievement: "Speed Setup Champion" trackable in user metrics
- Wizard completion event: {org_id, completion_time_seconds, speed_champion}

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp
- **Contrast**: Success icon green passes WCAG AA (4.5:1)
- **Screen reader**: Announces "Setup complete" on success + timer announcement
- **Keyboard**: Tab navigation, Enter to proceed to dashboard
- **Focus**: Primary button auto-focused on success state
- **Animation**: Confetti non-blocking, can be disabled via prefers-reduced-motion
- **Timer**: Screen-reader announces "Setup completed in X minutes Y seconds"
- **Badge**: Alt text "Speed Setup Champion badge earned"

---

## Mobile Responsiveness

### Mobile (<768px)
- Full-width cards (16px padding)
- Confetti animation adapted for small screen
- Timer text: 14px (slightly smaller)
- Badge: Full-width container
- Buttons: Full-width stacked

### Tablet (768-1024px)
- Cards: 80% width, centered
- Confetti: Standard animation
- Timer: 14px
- Badge: 80% width, centered
- Buttons: Side-by-side if space allows

### Desktop (>1024px)
- Cards: 600px max-width, centered
- Confetti: Full animation
- Timer: 16px
- Badge: Auto-width, inline-able
- Buttons: Side-by-side

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
3. **NEW**: Capture wizard start time on Step 1 entry
4. **NEW**: Add confetti animation library (canvas-confetti recommended)
5. **NEW**: Calculate timer on success: `(wizard_completed_at - wizard_started_at) / 1000`
6. **NEW**: Show badge conditionally: `if (completion_time_seconds < 900) { showBadge() }`
7. Handle loading state with progress indicators (6 steps)
8. On success: redirect with `router.push('/dashboard')`
9. On error: show retry button, preserve wizard state

### API Endpoint:
```
POST /api/settings/wizard/complete
Body: WizardData (all 6 steps)
Response: {
  success: true,
  redirect: '/dashboard',
  completion: {
    completion_time_seconds: NUMBER,
    completion_time_display: STRING,
    speed_champion: BOOLEAN,
    badge_earned: STRING (if applicable)
  }
}
```

### Implementation Checklist:
- [ ] Capture `wizard_started_at` on Step 1 entry
- [ ] Add confetti animation library
- [ ] Update `POST /api/settings/wizard/complete` endpoint
- [ ] Add completion_time calculation logic
- [ ] Add speed_champion badge conditional rendering
- [ ] Update organizations table schema (4 new columns)
- [ ] Test timer accuracy on slow/fast completion
- [ ] Test badge display (under 15min, over 15min)
- [ ] Test confetti on mobile/tablet/desktop
- [ ] Test accessibility: reduced-motion, screen readers

---

**Status**: Ready for user approval
**Approval Required**: Yes (Step 6 is critical path + NEW features)
**Iterations**: 0 of 3
**Requirements Covered**: FR-SET-188 (100% - Celebration animation, completion timer, speed champion badge)
