# SET-027: Notification Settings

**Module**: Settings
**Feature**: User Notification Preferences
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Notifications                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Configure which notifications you receive and how you receive them. │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ NOTIFICATION PREFERENCES                                      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │                        Email    In-App    SMS (Premium)       │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🏭 PRODUCTION ALERTS                                          │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Work Order Started         [✓]     [✓]      [──○]            │   │
│  │ Work Order Completed       [✓]     [✓]      [──○]            │   │
│  │ Work Order Delayed         [✓]     [✓]      [🔒]             │   │
│  │ Material Shortage          [✓]     [✓]      [🔒]             │   │
│  │ Quality Hold Applied       [✓]     [✓]      [──○]            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📦 INVENTORY ALERTS                                           │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Low Stock Warning          [✓]     [✓]      [──○]            │   │
│  │ Out of Stock               [✓]     [✓]      [🔒]             │   │
│  │ Expiry Alert (7 days)      [✓]     [✓]      [──○]            │   │
│  │ Expiry Alert (1 day)       [✓]     [✓]      [🔒]             │   │
│  │ Stock Transfer Complete    [──○]   [✓]      [──○]            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ✅ QUALITY ALERTS                                             │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Inspection Due             [✓]     [✓]      [──○]            │   │
│  │ Inspection Overdue         [✓]     [✓]      [🔒]             │   │
│  │ NCR Created                [✓]     [✓]      [──○]            │   │
│  │ CAPA Action Assigned       [✓]     [✓]      [──○]            │   │
│  │ Certificate Expiring       [✓]     [✓]      [──○]            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ⚙ SYSTEM ALERTS                                               │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Scheduled Maintenance      [✓]     [✓]      [──○]            │   │
│  │ System Downtime            [✓]     [✓]      [🔒]             │   │
│  │ User Invitation            [✓]     [──○]    [──○]            │   │
│  │ New Feature Available      [──○]   [✓]      [──○]            │   │
│  │ Monthly Usage Report       [✓]     [──○]    [──○]            │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ DELIVERY SETTINGS                                             │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Email Address:     user@example.com               [Verified ✓]│   │
│  │ SMS Phone Number:  +48 123 456 789         [🔒 Premium Only] │   │
│  │ Quiet Hours:       22:00 - 07:00                      [ON ●──]│   │
│  │ Batch Digest:      Daily at 08:00                     [ON ●──]│   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  🔒 SMS notifications require Premium subscription ($50/user/mo)     │
│                                         [Upgrade to Premium]          │
│                                                                       │
│  [Select All]  [Deselect All]  [Reset to Defaults]  [Save Changes]   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Click checkbox: Toggle notification on/off for that channel
- Click [🔒]: Opens premium upgrade modal (SMS requires subscription)
- Click [Upgrade to Premium]: Opens subscription upgrade flow
- Click [Quiet Hours]: Opens time picker modal (no notifications during these hours)
- Click [Batch Digest]: Combines low-priority notifications into single email
- Hover over notification: Shows tooltip with description and example
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Notifications                                            │
├─────────────────────────────────────────────────────────────────────┤
│  Configure which notifications you receive and how you receive them. │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]       │   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]       │   │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]       │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading notification preferences...                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Notifications                                            │
├─────────────────────────────────────────────────────────────────────┤
│                          [🔔 Icon]                                    │
│                 No Notification Preferences Set                       │
│     Configure how you'd like to receive alerts and updates.          │
│      We recommend enabling Production and Inventory alerts.          │
│                                                                       │
│               [Enable Recommended Notifications]                      │
│                                                                       │
│  Note: All notifications are disabled by default for new users.      │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Notifications                                            │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│          Failed to Load Notification Preferences                      │
│      Unable to retrieve your settings. Check your connection.        │
│              Error: NOTIFICATION_PREFS_FETCH_FAILED                   │
│                                                                       │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Notification Matrix** - Grid layout: Categories (rows) × Channels (columns), checkbox for each combination
2. **Category Headers** - Production (🏭), Inventory (📦), Quality (✅), System (⚙), collapsible sections
3. **Channel Columns** - Email (always available), In-App (always available), SMS (Premium only with 🔒 icon)
4. **Checkboxes** - Three states: checked [✓], unchecked [──○], locked [🔒] for premium
5. **Premium Badge** - [🔒] on SMS column, "Premium Only" label, upgrade CTA at bottom
6. **Delivery Settings** - Email address (with verification status), Phone number (premium), Quiet Hours toggle, Batch Digest toggle
7. **Bulk Actions** - Select All, Deselect All, Reset to Defaults buttons
8. **Save Button** - Primary CTA, shows unsaved changes indicator (*)
9. **Quiet Hours** - Time range picker, blocks all notifications during specified hours
10. **Batch Digest** - Combines low-priority alerts into single email at specified time

---

## Main Actions

### Primary
- **Toggle Notification** - Click checkbox → enable/disable for that event+channel combination → show unsaved indicator → user clicks Save
- **Save Changes** - Validates email verified → saves all preferences → shows success toast → removes unsaved indicator

### Secondary
- **Select All** - Checks all available (non-premium) notifications across all channels
- **Deselect All** - Unchecks all notifications (confirmation modal: "You won't receive any alerts. Continue?")
- **Reset to Defaults** - Restores recommended notification settings (Production+Inventory alerts via Email+In-App)
- **[Upgrade to Premium]** - Opens subscription upgrade modal for SMS access
- **Configure Quiet Hours** - Time picker modal → set start/end time → notifications queued until quiet hours end
- **Configure Batch Digest** - Toggle ON → select time → select which categories to batch (low-priority only)

### Validation
- **Unsaved Changes Warning** - "You have unsaved notification preferences. Save changes before leaving?"
- **Email Unverified** - "Verify your email address to receive email notifications" → [Resend Verification Email]
- **Premium SMS** - "SMS notifications require Premium subscription. Upgrade now?" → [Upgrade] [Cancel]
- **All Notifications Off** - "Disabling all notifications may cause you to miss critical alerts. Continue?" → [Yes] [Cancel]

---

## States

- **Loading**: Skeleton grid (4 categories × 3 channels), "Loading notification preferences..." text
- **Empty**: "No notification preferences set" message, "Enable recommended notifications" CTA (Production+Inventory Email+In-App)
- **Error**: "Failed to load notification preferences" warning, Retry + Contact Support buttons
- **Success**: Notification matrix with current preferences, checkboxes reflect saved state, no unsaved changes indicator

---

## Notification Categories & Events

### 🏭 Production Alerts (5 events)
| Event | Description | Default | Priority |
|-------|-------------|---------|----------|
| Work Order Started | WO status changed to "In Progress" | Email+In-App | Low |
| Work Order Completed | WO status changed to "Completed" | Email+In-App | Low |
| Work Order Delayed | WO past due date, not completed | Email+In-App | High |
| Material Shortage | Insufficient stock for WO consumption | Email+In-App | High |
| Quality Hold Applied | Output LP put on QA hold | Email+In-App | Medium |

### 📦 Inventory Alerts (5 events)
| Event | Description | Default | Priority |
|-------|-------------|---------|----------|
| Low Stock Warning | Stock below reorder point | Email+In-App | Medium |
| Out of Stock | Stock quantity = 0 | Email+In-App | High |
| Expiry Alert (7 days) | LP expires in 7 days | Email+In-App | Medium |
| Expiry Alert (1 day) | LP expires in 1 day | Email+In-App | High |
| Stock Transfer Complete | TO status changed to "Completed" | In-App only | Low |

### ✅ Quality Alerts (5 events)
| Event | Description | Default | Priority |
|-------|-------------|---------|----------|
| Inspection Due | QA inspection scheduled for today | Email+In-App | Medium |
| Inspection Overdue | QA inspection past due date | Email+In-App | High |
| NCR Created | Non-Conformance Report opened | Email+In-App | High |
| CAPA Action Assigned | Corrective action assigned to you | Email+In-App | Medium |
| Certificate Expiring | Supplier/product certificate expires in 30 days | Email+In-App | Medium |

### ⚙ System Alerts (5 events)
| Event | Description | Default | Priority |
|-------|-------------|---------|----------|
| Scheduled Maintenance | System maintenance in 24 hours | Email+In-App | High |
| System Downtime | Unplanned system outage | Email+In-App | High |
| User Invitation | Invited to new organization | Email only | Medium |
| New Feature Available | Product update with new features | In-App only | Low |
| Monthly Usage Report | Usage summary sent monthly | Email only | Low |

---

## Channel Comparison

| Channel | Availability | Typical Delay | Use Case | Cost |
|---------|--------------|---------------|----------|------|
| **Email** | All users | 1-5 minutes | Non-urgent alerts, batch digest | Free |
| **In-App** | All users | Real-time | Active session alerts, low-priority | Free |
| **SMS** | Premium only | <30 seconds | Critical alerts, off-hours | $50/user/mo |

---

## Delivery Settings Details

### Email Address
- Displays current user email (from auth)
- Shows verification status: [Verified ✓] or [Not Verified ⚠]
- If unverified: [Resend Verification Email] button
- Cannot change email here (must update in Account Settings)

### SMS Phone Number (Premium Only)
- Input field disabled if not premium (shows [🔒 Premium Only])
- If premium: E.164 format validation (+country code required)
- Verification flow: Enter number → receive verification code → confirm
- Shows verification status: [Verified ✓] or [Not Verified ⚠]

### Quiet Hours
- Toggle switch ON/OFF
- When ON: time picker shows start/end time (default 22:00-07:00)
- Notifications queued during quiet hours, delivered at end time
- Exception: High-priority alerts (System Downtime) ignore quiet hours

### Batch Digest
- Toggle switch ON/OFF
- When ON: select time (default 08:00), select categories to batch
- Low-priority notifications batched into single email per day
- High/Medium priority alerts sent immediately (not batched)

---

## Permissions

| Role | Can View | Can Edit Own Prefs | Can Edit Others' Prefs |
|------|----------|-------------------|------------------------|
| Super Admin | Yes | Yes | Yes |
| Admin | Yes | Yes | No |
| Manager | Yes | Yes | No |
| Operator | Yes | Yes | No |
| Viewer | Yes | Yes | No |

**Note**: All users can manage their own notification preferences (user-level, not org-level)

---

## Validation Rules

- **Email Verified**: Email notifications require verified email address → if unverified, show warning banner
- **SMS Premium**: SMS channel requires premium subscription → if free plan, show [🔒] and disable SMS checkboxes
- **Phone Verified**: SMS notifications require verified phone number → if unverified, show warning banner
- **Quiet Hours Range**: End time must be after start time (if same day) or wrap to next day (e.g., 22:00-07:00)
- **Batch Digest Time**: Valid 24-hour format (00:00-23:59)
- **Save Validation**: At least one notification enabled OR explicit confirmation if all disabled

---

## Accessibility

- **Touch targets**: All checkboxes >= 48x48dp, toggle switches >= 48x48dp
- **Contrast**: Checkbox labels pass WCAG AA, checked [✓] uses green with sufficient contrast
- **Screen reader**: "Production: Work Order Started, Email: checked, In-App: checked, SMS: locked, requires premium"
- **Keyboard**: Tab navigation through checkboxes, Space to toggle, Enter to save
- **Focus indicators**: Clear 2px outline on checkboxes and buttons
- **Color independence**: Icons + text labels (not color-only for category differentiation)
- **Tooltip on hover**: Each notification shows description and example on hover/focus

---

## Related Screens

- **Subscription Upgrade Modal**: Opens from [Upgrade to Premium] button (unlocks SMS channel)
- **Email Verification Modal**: Opens from [Resend Verification Email] button (send code → enter code → verify)
- **SMS Verification Modal**: Opens when entering phone number (send code → enter code → verify)
- **Quiet Hours Time Picker**: Inline modal with start/end time selectors (24-hour format)
- **Unsaved Changes Modal**: "You have unsaved changes. Save before leaving?" (Save/Discard/Cancel)

---

## Technical Notes

- **RLS**: Notification preferences filtered by `user_id` (user-level, not org-level)
- **API**: `GET /api/settings/notifications` → returns current user's preferences (20 events × 3 channels = 60 booleans)
- **API**: `PUT /api/settings/notifications` → body: `{event_id, channel, enabled}` → validates premium/verification → updates
- **Real-time**: No real-time sync needed (user-specific settings, not collaborative)
- **Database**: `notification_preferences` table (user_id, event_id, channel, enabled, created_at, updated_at)
- **Database**: `notification_events` table (id, code, category, name, description, priority, default_channels[])
- **Email Service**: SendGrid/AWS SES for email delivery (template-based)
- **SMS Service**: Twilio for SMS delivery (premium only, per-message billing)
- **In-App Notifications**: Stored in `notifications` table (id, user_id, event_id, message, read, created_at)
- **Quiet Hours Logic**: Server-side check before sending → if in quiet hours + not high-priority → queue for later
- **Batch Digest Logic**: Cron job runs at user's specified time → aggregates unread low-priority notifications → sends single email
- **Verification**: Email verified via magic link, SMS verified via 6-digit code (Twilio Verify API)
- **Default Preferences**: On user creation, copy from `notification_events.default_channels` array

---

## User Flows

### Enable Email Notification (Simple)
1. User checks "Work Order Delayed" → Email column
2. Checkbox turns [✓], unsaved indicator appears (*)
3. User clicks [Save Changes]
4. System validates email verified ✓
5. Preference saved
6. Toast: "Notification preferences saved"

### Enable SMS Notification (Premium Required)
1. User clicks SMS checkbox for "Out of Stock"
2. System detects free plan
3. Modal: "SMS notifications require Premium ($50/user/mo). Upgrade now?"
4. User clicks [Upgrade]
5. Subscription upgrade flow → payment → success
6. User returns to Notifications screen
7. SMS column unlocked (no more 🔒 icons)
8. User checks "Out of Stock" → SMS column
9. System prompts for phone number (if not set)
10. User enters phone, receives verification code
11. User enters code, phone verified
12. User clicks [Save Changes]
13. Toast: "SMS notifications enabled for Out of Stock"

### Configure Quiet Hours
1. User toggles Quiet Hours [ON]
2. Time picker appears: Start [22:00] End [07:00]
3. User changes End to [08:00]
4. User clicks [Save Changes]
5. Preferences saved
6. Toast: "Quiet hours enabled: 22:00-08:00. High-priority alerts will still be sent."

### Disable All Notifications (Warning)
1. User clicks [Deselect All]
2. All checkboxes turn [──○]
3. Modal: "Disabling all notifications may cause you to miss critical alerts. Continue?"
4. User clicks [Yes, Disable All]
5. User clicks [Save Changes]
6. System saves all preferences as disabled
7. Toast: "All notifications disabled. You can re-enable them anytime."

### Email Unverified (Blocked)
1. User checks "Low Stock Warning" → Email column
2. User clicks [Save Changes]
3. System detects email unverified
4. Error banner appears: "Verify your email to receive email notifications"
5. User clicks [Resend Verification Email]
6. Email sent, user checks inbox
7. User clicks verification link
8. Redirected back, email verified ✓
9. User clicks [Save Changes] again
10. Preference saved
11. Toast: "Notification preferences saved. Email verified!"

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-027-notification-settings]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
