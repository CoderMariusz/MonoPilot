# SET-026: Security Settings

**Module**: Settings
**Feature**: Security Configuration
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Security                                      [Save]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Configure security policies for your organization.                  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ PASSWORD POLICY                                               │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Minimum Length                                               │   │
│  │  [12                ▼] characters                             │   │
│  │  Options: 8, 10, 12, 14, 16, 20                               │   │
│  │                                                               │   │
│  │  Complexity Requirements                                      │   │
│  │  ☑ Uppercase letters (A-Z)                                    │   │
│  │  ☑ Lowercase letters (a-z)                                    │   │
│  │  ☑ Numbers (0-9)                                              │   │
│  │  ☑ Special characters (!@#$%^&*)                              │   │
│  │                                                               │   │
│  │  Password Expiry                                              │   │
│  │  [90                ▼] days (0 = never expires)               │   │
│  │  Options: 0, 30, 60, 90, 180, 365                             │   │
│  │                                                               │   │
│  │  Prevent Reuse                                                │   │
│  │  [5                 ▼] last passwords                         │   │
│  │  Options: 0, 3, 5, 10, 15                                     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ SESSION MANAGEMENT                                            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Session Timeout (Inactivity)                                 │   │
│  │  [30                ▼] minutes                                │   │
│  │  Options: 15, 30, 60, 120, 240, Never                         │   │
│  │                                                               │   │
│  │  Absolute Session Duration                                    │   │
│  │  [24                ▼] hours (max time before re-login)       │   │
│  │  Options: 8, 12, 24, 48, 168 (7 days)                         │   │
│  │                                                               │   │
│  │  Concurrent Sessions                                          │   │
│  │  [3                 ▼] devices max per user                   │   │
│  │  Options: 1, 2, 3, 5, Unlimited                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ ACTIVE SESSIONS                                               │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Your Active Sessions                                         │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ Device            Location       Last Active    Status  │ │   │
│  │  │ Chrome/Windows    Warsaw, PL     Now           ● Current│ │   │
│  │  │ Safari/iPhone     Krakow, PL     2h ago        ○ Active │✕││  │
│  │  │ Firefox/Mac       Remote         3d ago        ○ Active │✕││  │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  [Terminate All Other Sessions]                               │   │
│  │                                                               │   │
│  │  ⓘ Your current session on Chrome/Windows will remain active.│   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ TWO-FACTOR AUTHENTICATION (2FA)                               │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  2FA Enforcement                                              │   │
│  │  ○ Disabled        Users can optionally enable 2FA            │   │
│  │  ● Optional        Users encouraged (banner), not required    │   │
│  │  ○ Required (All)  All users must enable 2FA                  │   │
│  │  ○ Required (Admins) Only Admins/Super Admins must use 2FA    │   │
│  │                                                               │   │
│  │  2FA Methods Allowed                                          │   │
│  │  ☑ Authenticator App (TOTP)         Recommended              │   │
│  │  ☑ SMS (less secure)                +1 (555) 123-4567        │   │
│  │  ☐ Email (least secure)             admin@company.com        │   │
│  │                                                               │   │
│  │  Status: 12/45 users have 2FA enabled (27%)                   │   │
│  │  [Send Reminder Email to Users Without 2FA]                   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ FAILED LOGIN PROTECTION                                       │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Account Lockout After                                        │   │
│  │  [5                 ▼] failed attempts                        │   │
│  │  Options: 3, 5, 10, 15, Never                                 │   │
│  │                                                               │   │
│  │  Lockout Duration                                             │   │
│  │  [30                ▼] minutes                                │   │
│  │  Options: 15, 30, 60, 120, Manual unlock only                 │   │
│  │                                                               │   │
│  │  ☑ Send email to user when account is locked                 │   │
│  │  ☑ Notify admins of repeated lockouts (3+ in 24h)            │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ IP WHITELIST (Optional)                                       │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Restrict Access by IP Address                                │   │
│  │  [OFF ──●] Enable IP Whitelist                                │   │
│  │                                                               │   │
│  │  When enabled, only IPs on this list can access the system.   │   │
│  │  ⚠ Warning: Misconfiguration may lock out all users.          │   │
│  │                                                               │   │
│  │  Allowed IP Addresses/Ranges                    [+ Add IP]    │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ (Empty - Add IPs after enabling whitelist)             │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  Example formats: 192.168.1.100, 10.0.0.0/24, 2001:db8::/32  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ GDPR COMPLIANCE (Phase 3)                                     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Your GDPR Rights                                             │   │
│  │  Under the General Data Protection Regulation, you have the   │   │
│  │  right to access, control, and delete your personal data.     │   │
│  │                                                               │   │
│  │  Download My Data                                             │   │
│  │  Export all your personal information (JSON/CSV)              │   │
│  │  Includes: Profile, accounts, activity, preferences           │   │
│  │  Last export: 2025-11-15 at 10:32 AM                          │   │
│  │  [Download Personal Data]                                     │   │
│  │                                                               │   │
│  │  Request Account Deletion                                     │   │
│  │  Start GDPR "right to be forgotten" process                   │   │
│  │  ⓘ Account will be deleted after 30-day grace period          │   │
│  │  Scheduled deletion: None active                              │   │
│  │  [Request Account Deletion]                                   │   │
│  │                                                               │   │
│  │  Data Processing Consent                                      │   │
│  │  ☑ Essential Services (Required)                              │   │
│  │    Account management, security, system operations            │   │
│  │    Status: Accepted | Accepted: 2025-01-15                    │   │
│  │                                                               │   │
│  │  ☑ Analytics & Improvements (Optional)                        │   │
│  │    Anonymous usage data to improve our service                │   │
│  │    Status: Consented | Consented: 2025-06-10                  │   │
│  │    [Change]                                                   │   │
│  │                                                               │   │
│  │  ☐ Marketing Communications (Optional)                        │   │
│  │    Product updates, features, promotions                      │   │
│  │    Status: Not Consented | Can opt in at any time             │   │
│  │    [Change]                                                   │   │
│  │                                                               │   │
│  │  Privacy Policy & Terms                                       │   │
│  │  Current Version: 2.1 | Last Updated: 2025-10-01              │   │
│  │  Your Acceptance: Version 2.1 | Accepted: 2025-10-15          │   │
│  │  [View Current Policy]  [View My Acceptance History]          │   │
│  │                                                               │   │
│  │  ⓘ New privacy policy version available (v2.2)                │   │
│  │  [Review Changes] [Accept New Version]                        │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ AUDIT LOG                                                     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Recent Security Events                      [View Full Log]  │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 2025-12-11 14:32  Password policy updated  (Admin)     │ │   │
│  │  │ 2025-12-11 09:15  User locked (5 fails)    jsmith      │ │   │
│  │  │ 2025-12-10 16:20  2FA enabled              mjohnson    │ │   │
│  │  │ 2025-12-10 11:05  Session timeout changed  (Admin)     │ │   │
│  │  │ 2025-12-09 13:40  Failed login attempt     unknown IP  │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Last updated: 2025-12-11 14:32 by Admin                             │
│                                                                       │
│                                              [Cancel]  [Save Changes] │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Change dropdown: Preview shows validation (e.g., "Stronger policy will affect 12 users")
- Toggle 2FA: Shows confirmation if changing to Required (forces all users)
- Toggle IP Whitelist: Warning modal before enable, requires current IP in list
- [Send Reminder]: Bulk email to users without 2FA (shows count before send)
- [Terminate Session ✕]: Confirmation "Terminate session on Safari/iPhone?" → Yes → session ended → removed from list
- [Terminate All Other Sessions]: Confirmation "Terminate 2 other sessions?" → Yes → all other sessions ended → list shows only current
- [Download Personal Data]: Shows modal with format options (JSON/CSV) → Submit → begins export → background job → email with download link (24h expiry)
- [Request Account Deletion]: Shows modal with 30-day countdown warning and checklist (will lose: data, team access, automation) → checkbox to confirm → Submit → scheduling entry created → displays "Scheduled deletion: 2026-01-15" → cancel link (available until day 25) → on day 30: account + all personal data deleted
- [Change] (Consent): Modal to change consent status for category → toggle → [Update Preference] → saved → audit log entry
- [Review Changes]: Opens comparison modal showing old v2.1 vs new v2.2 (highlights: new consent categories, updated retention policy) → [Accept New Version] → saves acceptance + timestamp → removes notification banner
- [View Current Policy]: Opens PDF/web viewer of current privacy policy v2.1
- [View My Acceptance History]: Timeline showing all policy versions user has accepted with dates
- [Save Changes]: Validates all settings → updates → audit log entry → toast confirmation
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Security                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ PASSWORD POLICY                                               │   │
│  │ [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ SESSION MANAGEMENT                                            │   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ ACTIVE SESSIONS                                               │   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ GDPR COMPLIANCE                                               │   │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading security settings...                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Security                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                          [🔒 Icon]                                    │
│                No Security Policies Configured                        │
│         Configure password, session, and access policies              │
│              to secure your organization's data.                      │
│                                                                       │
│                  [Set Up Security Defaults]                           │
│                                                                       │
│  Default Policy: 12-char passwords, 30min timeout, 2FA optional       │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Security                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│              Failed to Load Security Settings                         │
│      Unable to retrieve security configuration. Check network.        │
│                Error: SECURITY_CONFIG_FETCH_FAILED                    │
│                                                                       │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Password Policy Section** - Min length dropdown (8-20), 4 complexity checkboxes, expiry dropdown (0-365 days), reuse prevention dropdown (0-15)
2. **Session Management Section** - Inactivity timeout (15-Never), absolute duration (8-168h), concurrent sessions (1-Unlimited)
3. **Active Sessions Section** - Table showing device/browser, location (city, country), last active time, status indicator (● Current / ○ Active), individual terminate buttons [✕], bulk terminate button
4. **2FA Configuration** - Enforcement radio (4 options), allowed methods checkboxes (3), status counter, reminder button
5. **Failed Login Protection** - Lockout attempts dropdown (3-Never), duration dropdown (15-Manual), notification checkboxes (2)
6. **IP Whitelist Section** - Enable toggle, warning banner, IP list (empty/populated), Add IP button, format examples
7. **GDPR Compliance Section** (Phase 3 NEW)
   - **Download My Data Button** - Generates personal data export in JSON/CSV format, shows last export timestamp
   - **Request Account Deletion Button** - Initiates GDPR "right to be forgotten" with 30-day grace period, shows scheduled deletion date if active, cancel link available until day 25
   - **Data Processing Consent Toggles** - Essential (required), Analytics (optional), Marketing (optional) with status (Accepted/Consented/Not Consented), dates, and change action
   - **Privacy Policy Tracking** - Current version + last updated date, user's accepted version + date, view policy/history links, banner for new policy version with review + accept CTAs
8. **Audit Log Mini** - Last 5 security events, timestamp + action + user, [View Full Log] link
9. **Save/Cancel Buttons** - Standard form actions, unsaved changes warning on navigate
10. **Validation Warnings** - Inline warnings for policy changes affecting users (e.g., "12 users will need to reset passwords")
11. **2FA Status Counter** - "X/Y users enabled (Z%)" with visual indicator (red <30%, yellow 30-70%, green >70%)
12. **IP Whitelist Warning** - Red alert banner when enabling (risk of lockout)

---

## Main Actions

### Primary
- **Save Changes** - Validate all settings → check conflicts → update database → audit log entry → toast "Security settings updated" → notify affected users if needed

### Secondary
- **Send 2FA Reminder** - Count users without 2FA → confirmation "Send to X users?" → bulk email → toast "Reminders sent to X users"
- **Add IP to Whitelist** - Input modal (IP/range + label) → validate format → add to list → show in table
- **View Full Audit Log** - Navigate to dedicated audit log page (filtered to security events)
- **Set Up Security Defaults** (Empty state) - Apply recommended policy (12-char, 30min, 2FA optional) → Save
- **Terminate Individual Session** - Confirmation modal "Terminate session on [Device]?" → Yes → POST /api/settings/security/sessions/{session_id}/terminate → remove from list → audit log → toast "Session terminated"
- **Terminate All Other Sessions** - Confirmation modal "Terminate X other sessions?" → Yes → POST /api/settings/security/sessions/terminate-all → keep current session → remove others from list → audit log → toast "X sessions terminated"

### GDPR Actions (Phase 3 NEW)
- **Download Personal Data** - Show modal: "Select format: [JSON / CSV]" → [Download] → backend generates encrypted ZIP with personal data (user profile, accounts, activity, settings, preferences) → triggers async job → email sent with 24h download link → toast "Download link sent to your email" → audit log "GDPR_DATA_EXPORT_REQUESTED"
- **Request Account Deletion** - Show modal with 30-day countdown warning: "Your account will be permanently deleted along with all personal data. You will lose: account access, team membership, automation, all data. This action cannot be undone after the grace period. Schedule deletion?" → checkbox "I understand and want to proceed" → [Schedule Deletion] → creates deletion_request record (scheduled_for = now + 30 days) → displays "Scheduled deletion: 2026-01-15 at 14:32" → provides [Cancel Deletion] link (clickable until day 25) → audit log "GDPR_DELETION_REQUESTED" → day 25: [Cancel] button disabled → day 30: cron job deletes account, all personal data, audit log entry "GDPR_ACCOUNT_DELETED"
- **Change Consent** (Analytics/Marketing) - Modal: Category name + current status + rationale for use → radio buttons (Consent/Withdraw) → [Update Preference] → saves to consent_log table → audit log "GDPR_CONSENT_CHANGED" → toast "Preference updated"
- **Review New Policy Version** - Modal: "New Privacy Policy Available (v2.2)" → side-by-side diff highlighting: new sections, updated retention policy, new consent categories → [Review Full Text] (opens PDF) → [Accept v2.2] → saves acceptance → audit log "GDPR_POLICY_ACCEPTED" → removes notification banner
- **View Policy** - Opens current privacy policy document (v2.1) in PDF viewer or dedicated page
- **View Acceptance History** - Timeline modal showing all policy versions user has accepted with dates (v2.0 - 2025-03-10, v2.1 - 2025-10-15, etc.)

### Validation/Warnings
- **Password Policy Stronger** - "12 users have passwords shorter than new minimum. They'll be forced to reset on next login."
- **Enable IP Whitelist** - "⚠ Warning: Only listed IPs can access the system. Your current IP (192.168.1.50) will be added automatically. Continue?"
- **2FA Required (All)** - "Changing to Required will force all 45 users to set up 2FA on next login. This may cause support load. Continue?"
- **Session Timeout Shorter** - "Reducing timeout to 15 minutes will log out 8 currently active users. Continue?"
- **Disable IP Whitelist** - "Removing IP restrictions. All IPs will be allowed. Continue?"
- **Terminate Session Warning** - "Terminating this session will immediately log out the device. Continue?"
- **Terminate All Warning** - "This will log out all your other devices immediately. Your current session will remain active. Continue?"
- **Schedule Deletion Warning** (GDPR NEW) - "⚠ Warning: Your account will be permanently deleted in 30 days. You will lose all data and team access. This cannot be undone after the grace period. Continue?"
- **Cancel Deletion Too Late** - "⚠ You can only cancel deletion requests up to 5 days before deletion date. Your deletion is scheduled for 2026-01-15, cancellation available until 2026-01-10."
- **New Policy Notification** (GDPR NEW) - "⚠ New Privacy Policy Available: Version 2.2 (updated with new features description, updated data retention policy). Review and accept to continue using the service."

---

## States

- **Loading**: Skeleton sections (7 including GDPR), "Loading security settings..." text
- **Empty**: "No security policies configured" message, "Set up defaults" CTA (12-char, 30min, 2FA optional)
- **Error**: "Failed to load security settings" warning, Retry + Contact Support buttons
- **Success**: All sections populated with current values, dropdowns/checkboxes reflect saved state, audit log shows recent events, status counters accurate, active sessions table shows current + other sessions, GDPR section displays: last export date, deletion status (none/scheduled with date/canceled), consent statuses with dates, policy version acceptance, new policy notification if applicable

---

## Security Policy Details

### Password Policy

| Setting | Options | Default | Impact |
|---------|---------|---------|--------|
| Min Length | 8, 10, 12, 14, 16, 20 chars | 12 | Users with shorter passwords must reset |
| Uppercase Required | ☑/☐ | ☑ | Must have A-Z |
| Lowercase Required | ☑/☐ | ☑ | Must have a-z |
| Numbers Required | ☑/☐ | ☑ | Must have 0-9 |
| Special Chars Required | ☑/☐ | ☑ | Must have !@#$%^&* |
| Password Expiry | 0, 30, 60, 90, 180, 365 days | 90 | Users get reset prompt X days before expiry |
| Prevent Reuse | 0, 3, 5, 10, 15 passwords | 5 | System stores hash history |

### Session Management

| Setting | Options | Default | Impact |
|---------|---------|---------|--------|
| Inactivity Timeout | 15, 30, 60, 120, 240 min, Never | 30 | Auto-logout after idle time |
| Absolute Duration | 8, 12, 24, 48, 168 hours | 24 | Max session length (re-login required) |
| Concurrent Sessions | 1, 2, 3, 5, Unlimited | 3 | Max devices logged in simultaneously |

### Active Sessions

| Field | Description | Source |
|-------|-------------|--------|
| Device | Browser + OS (e.g., "Chrome/Windows", "Safari/iPhone") | User agent parsing |
| Location | City, Country (e.g., "Warsaw, PL", "Remote") | IP geolocation |
| Last Active | Relative time (e.g., "Now", "2h ago", "3d ago") | session.last_activity_at |
| Status | ● Current (this session) / ○ Active (other sessions) | session.id == current_session.id |
| Actions | [✕] Terminate button for non-current sessions | Only for other sessions |

**Notes**:
- Current session is marked with ● and cannot be terminated individually
- Location shows "Remote" if geolocation fails or VPN detected
- Timestamps update in real-time (refresh every 60s)
- Terminated sessions are removed immediately from list

### Two-Factor Authentication

| Enforcement | Description | User Impact |
|-------------|-------------|-------------|
| Disabled | 2FA not available | No 2FA option in user settings |
| Optional | Users can enable 2FA | Banner encourages setup, not required |
| Required (All) | All users must use 2FA | Forced setup on next login |
| Required (Admins) | Only Admins/Super Admins | Admin roles forced, others optional |

**Methods**:
- **TOTP (Authenticator App)**: Google Authenticator, Authy, 1Password (recommended)
- **SMS**: Text message code (less secure, SIM swap risk)
- **Email**: Email code (least secure, email compromise risk)

### Failed Login Protection

| Setting | Options | Default | Impact |
|---------|---------|---------|--------|
| Lockout After | 3, 5, 10, 15, Never | 5 | Account locked after X failed attempts |
| Lockout Duration | 15, 30, 60, 120 min, Manual | 30 | Auto-unlock after duration OR admin unlock |
| Email User | ☑/☐ | ☑ | User gets "account locked" email |
| Notify Admins (3+) | ☑/☐ | ☑ | Admins notified if same user locked 3+ times in 24h |

### IP Whitelist

| Mode | Description | Risk |
|------|-------------|------|
| OFF | All IPs allowed | Default, no restrictions |
| ON | Only whitelisted IPs | **High risk**: Misconfiguration = total lockout |

**IP Formats Accepted**:
- Single IP: `192.168.1.100`
- CIDR Range: `10.0.0.0/24` (10.0.0.1 - 10.0.0.254)
- IPv6: `2001:db8::/32`

**Auto-Add**: When enabling, current admin's IP added automatically to prevent self-lockout.

### GDPR Compliance (Phase 3 NEW - FR-SET-174)

| Feature | Description | Implementation |
|---------|-------------|-----------------|
| Download My Data | User data export in JSON/CSV format | Includes: profile, accounts, activity, settings, preferences. Backend ZIP encrypted. 24h download link via email. Async job. Audit logged as GDPR_DATA_EXPORT_REQUESTED. |
| Request Deletion | "Right to be forgotten" with 30-day grace | Creates deletion_request (scheduled_for = now + 30 days). Status: "Scheduled deletion: DATE". [Cancel] link available until day 25. Day 30: cron deletes account + all personal data. Audit logged GDPR_DELETION_REQUESTED / GDPR_ACCOUNT_DELETED. |
| Essential Consent | Required (cannot withdraw) | Account management, security, system operations. Status always "Accepted". Accepted date tracked. Non-optional. |
| Analytics Consent | Optional toggle | Anonymous usage data. Consent tracked with date. User can withdraw at any time. |
| Marketing Consent | Optional toggle | Product updates, promotions, newsletters. Consent tracked with date. User can withdraw. |
| Privacy Policy Version | Current version + user's acceptance | Tracks: policy_version (current v2.1), last_updated (2025-10-01), user_accepted_version (2.1), user_acceptance_date (2025-10-15). |
| Policy Acceptance History | Timeline of all versions user accepted | Modal showing: v2.0 (2025-03-10), v2.1 (2025-10-15), etc. Hyperlinks to view each version's text. |
| New Policy Notification | Banner for new policy version | Shows: "New Privacy Policy Available (v2.2, updated OCT 1)" with [Review Changes] + [Accept New Version] buttons. Dismissible until accepted. Highlight: new sections, updated retention, new consent categories. |

**Grace Period Logic**:
- User requests deletion at 2025-12-15 14:32 → scheduled_for = 2026-01-15 14:32
- User can [Cancel Deletion] anytime until 2026-01-10 (5 days before)
- After 2026-01-10, [Cancel] button disabled, cannot cancel
- On 2026-01-15 14:32, cron job executes: DELETE FROM users WHERE id = user_id, DELETE FROM all tables WHERE user_id = user_id

**Data Included in Export**:
- User profile (name, email, phone, address, preferences)
- Organization membership (org_id, role, joined_date)
- Account activity (logins, 2FA status, password changes, session history)
- Settings (security preferences, notification preferences, language, timezone)
- GDPR consents (all consent records with dates and versions)
- Audit log entries (user's own actions)
- Export timestamp, file hash, encryption key metadata

**Consent Withdrawal Rules**:
- Essential: Cannot be withdrawn (always required)
- Analytics: Can toggle on/off → updates consent_log with status + timestamp
- Marketing: Can toggle on/off → updates consent_log + triggers unsubscribe from marketing emails

---

## Permissions

| Role | Can View | Can Edit | Can Enable IP Whitelist | Can View Sessions | Can Terminate Sessions | Affected by 2FA Required | Can Request Own Deletion | Can Download Own Data |
|------|----------|----------|-------------------------|-------------------|------------------------|--------------------------|-------------------------|------------------------|
| Super Admin | Yes | Yes | Yes | Own only | Own only | Yes (if set to All or Admins) | Yes | Yes |
| Admin | Yes | Yes | Yes | Own only | Own only | Yes (if set to All or Admins) | Yes | Yes |
| Manager | Yes | No | No | Own only | Own only | Yes (if set to All) | Yes | Yes |
| Operator | No | No | No | Own only | Own only | Yes (if set to All) | Yes | Yes |
| Viewer | No | No | No | Own only | Own only | Yes (if set to All) | Yes | Yes |

**Notes**:
- All users can view and terminate their own sessions, regardless of role
- All users can download their own data (GDPR requirement)
- All users can request account deletion (GDPR requirement)
- Only security policy configuration is role-restricted (Super Admin / Admin only)
- Consent preferences are personal and managed by individual users

---

## Validation Rules

- **Password Length**: Must be >= 8, <= 20
- **Complexity**: At least 1 checkbox must be checked (can't disable all requirements)
- **Session Timeout**: If set to Never, show warning ("Not recommended for security")
- **2FA Required → Optional**: Show confirmation ("Users may disable 2FA. Continue?")
- **IP Whitelist Enable**: Must have at least 1 IP before enabling, current admin IP auto-added
- **IP Format Validation**: IPv4 (x.x.x.x), IPv4 CIDR (x.x.x.x/y), IPv6 (xxxx:xxxx::/y)
- **Lockout Duration**: If "Manual only", show warning ("Admins must manually unlock all locked accounts")
- **Terminate Current Session**: Blocked - users cannot terminate their own active session (redirect to logout instead)
- **Concurrent Sessions Limit**: If reducing below current active sessions count, show warning ("X sessions will be terminated immediately")
- **Download Data Format**: User must select JSON or CSV before export
- **Delete Request Validation**: Checkbox "I understand consequences" must be checked before [Schedule Deletion] enabled
- **Delete Cancellation Timing**: Can only cancel if deletion_scheduled_for > now + 5 days
- **Policy Acceptance**: New policy cannot be dismissed without acceptance (except existing accepted versions)
- **Consent Required**: Essential consent always true, cannot toggle, other consents can toggle freely

---

## Accessibility

- **Touch targets**: All dropdowns, checkboxes, toggles, terminate buttons, GDPR action buttons >= 48x48dp
- **Contrast**: WCAG AA compliant (warning banners: red bg + white text 4.5:1, GDPR section heading clear visual hierarchy)
- **Screen reader**: "Password minimum length: 12 characters, Complexity: Uppercase required, Lowercase required, Numbers required, Special characters required, Expiry: 90 days, Prevent reuse: 5 passwords" + "GDPR Compliance section: Download My Data button, Request Account Deletion button with 30-day grace period, Data Processing Consent: Essential (required), Analytics (consented 2025-06-10), Marketing (not consented)"
- **Screen reader (sessions)**: "Active session on Chrome/Windows in Warsaw, Poland, last active now, current session. Active session on Safari/iPhone in Krakow, Poland, last active 2 hours ago, terminate button."
- **Screen reader (GDPR)**: "Download Personal Data: export all your personal information in JSON or CSV format, last export 2025-11-15 at 10:32 AM, download button. Request Account Deletion: start GDPR right to be forgotten process, scheduled deletion none active, request button. Essential Services (Required): account management and security, accepted 2025-01-15. Analytics & Improvements (Optional): consented 2025-06-10, change button. Marketing Communications (Optional): not consented, change button."
- **Keyboard**: Tab navigation, Space to toggle checkboxes/consent radios, Enter to open dropdowns, Enter to activate buttons, Escape to close modals
- **Focus indicators**: Clear 2px outline on all interactive elements, including GDPR buttons and consent toggles
- **Color independence**: Icons + text for status (not color-only), 2FA status uses %, not just color, session status uses ● Current / ○ Active symbols, consent status uses text + icons (checkmark/X) not just color, GDPR section uses icons + descriptive text
- **ARIA labels**: Terminate buttons labeled "Terminate session on [Device]", bulk button "Terminate all other sessions", GDPR buttons "Download my personal data as JSON or CSV", "Schedule account deletion (30-day grace period)", consent toggles "Toggle analytics consent", policy link "View current privacy policy version 2.1"
- **Semantic HTML**: Use <section>, <button>, <label>, <input type="checkbox">, <input type="radio"> for proper nesting
- **Readability**: GDPR section uses clear language, explains terms (e.g., "right to be forgotten", "30-day grace period"), provides context (e.g., "You will lose: data, team access, automation")

---

## Related Screens

- **Audit Log Page**: Full security event history (login attempts, policy changes, lockouts, 2FA changes, session terminations, GDPR data exports, deletion requests)
- **IP Whitelist Management Modal**: Add/edit/delete IPs, bulk import, test connectivity
- **User Lockout Management**: Admin view of locked accounts, manual unlock button, lockout history
- **2FA Setup Wizard (User)**: Step-by-step TOTP setup (scan QR, enter code, backup codes)
- **Session Details Modal** (future): Detailed session info (full user agent, IP address, login time, activity history)
- **GDPR Data Export Modal** (NEW): Format selection (JSON/CSV), starts export, email confirmation
- **GDPR Deletion Request Modal** (NEW): Warning with checklist, 30-day grace period explanation, consequences confirmation
- **Privacy Policy Viewer** (NEW): Current policy document, version history, acceptance records
- **Consent Manager Modal** (NEW): Per-category consent toggle, history, withdrawal confirmation
- **Policy Diff Modal** (NEW): Side-by-side comparison of old vs new policy versions, highlights changes

---

## Technical Notes

- **RLS**: Security settings filtered by `org_id`, only org admins can view/edit. GDPR data access restricted to user's own record (user_id from JWT).
- **API**: `GET /api/settings/security` → returns current policy + GDPR consent status
- **API**: `PUT /api/settings/security` → body: policy object → validates → updates → audit log
- **API**: `POST /api/settings/security/send-2fa-reminder` → sends bulk email to users without 2FA
- **API**: `GET /api/settings/security/sessions` → returns active sessions for current user (user_id from JWT)
- **API**: `POST /api/settings/security/sessions/{session_id}/terminate` → terminates specific session → removes session → audit log
- **API**: `POST /api/settings/security/sessions/terminate-all` → terminates all sessions except current → removes sessions → audit log
- **API (GDPR NEW)**: `POST /api/gdpr/export` → body: {format: "json"|"csv"} → validates user → triggers async job (Bull/BullMQ queue) → returns job_id → user gets email with download link (24h) → response: {status: "processing", job_id: "uuid", email: "user@company.com"}
- **API (GDPR NEW)**: `POST /api/gdpr/deletion-request` → body: {confirm: true} → validates → creates deletion_request record (scheduled_for = now + 30 days) → sends confirmation email → response: {status: "scheduled", deletion_date: "2026-01-15T14:32:00Z", can_cancel_until: "2026-01-10T14:32:00Z"}
- **API (GDPR NEW)**: `DELETE /api/gdpr/deletion-request` → cancels pending deletion (only if > 5 days remaining) → response: {status: "canceled", deleted_request_id: "uuid"}
- **API (GDPR NEW)**: `PUT /api/gdpr/consent/{consent_type}` → body: {status: "consented"|"withdrawn"} → updates consent_log → response: {type: "analytics"|"marketing", status: "consented"|"withdrawn", updated_at: "2025-12-15T14:32:00Z"}
- **API (GDPR NEW)**: `GET /api/gdpr/policy/current` → returns current privacy policy version + user's accepted version + acceptance history
- **API (GDPR NEW)**: `POST /api/gdpr/policy/accept` → body: {version: "2.2"} → validates version exists → creates policy_acceptance record → response: {policy_version: "2.2", accepted_at: "2025-12-15T14:32:00Z"}
- **Database**: `org_security_policies` table (org_id, password_min_length, complexity_flags, session_timeout, etc.)
- **Database**: `password_history` table (user_id, password_hash, created_at) for reuse prevention
- **Database**: `ip_whitelist` table (org_id, ip_address, label, created_by, created_at)
- **Database**: `security_audit_log` table (org_id, event_type, user_id, ip_address, metadata, created_at)
- **Database**: `user_sessions` table (session_id, user_id, org_id, device_info, ip_address, location, last_activity_at, created_at, expires_at)
- **Database (GDPR NEW)**: `gdpr_data_exports` table (user_id, format, job_id, download_link, link_expires_at, completed_at, file_hash, encryption_key)
- **Database (GDPR NEW)**: `gdpr_deletion_requests` table (user_id, requested_at, scheduled_for, canceled_at, deleted_at, status)
- **Database (GDPR NEW)**: `gdpr_consents` table (user_id, consent_type: "essential"|"analytics"|"marketing", status, accepted_at, withdrawn_at, policy_version)
- **Database (GDPR NEW)**: `privacy_policies` table (version, content, published_at, retired_at, created_by)
- **Database (GDPR NEW)**: `policy_acceptances` table (user_id, policy_version, accepted_at, ip_address, user_agent)
- **Async Job (GDPR NEW)**: Bull/BullMQ queue for data exports (zip → encrypt → upload to S3 → email link with 24h TTL)
- **Cron Job (GDPR NEW)**: Daily cron at midnight UTC checks `gdpr_deletion_requests` where status = "scheduled" AND scheduled_for <= now → execute deletion → mark as deleted → audit log
- **Validation**: Server-side password validation on user creation/update (check min length, complexity, history)
- **Session Enforcement**: Middleware checks inactivity (last_activity_at) and absolute duration (session_started_at)
- **Session Tracking**: Middleware updates `last_activity_at` on every authenticated request, parses user agent for device info
- **Failed Login Tracking**: `login_attempts` table (user_id, ip_address, success, created_at) → lock account after threshold
- **IP Whitelist Check**: Middleware checks `ip_whitelist` table if enabled → block if not in list
- **2FA Enforcement**: On login, check user.has_2fa_enabled → if required and false, redirect to 2FA setup wizard
- **Audit Logging**: All policy changes, login failures, lockouts, 2FA changes, session terminations, GDPR requests logged to `security_audit_log` with event types: GDPR_DATA_EXPORT_REQUESTED, GDPR_DELETION_REQUESTED, GDPR_DELETION_CANCELED, GDPR_ACCOUNT_DELETED, GDPR_CONSENT_CHANGED, GDPR_POLICY_ACCEPTED
- **Geolocation**: IP-to-location lookup using MaxMind GeoLite2 or similar (cached 24h)
- **Session Termination**: DELETE from `user_sessions` + invalidate JWT (add to blacklist if using stateless JWTs)
- **Real-time Updates**: Active sessions list refreshes every 60s (polling) or uses WebSocket for real-time updates
- **Data Export Encryption**: Use AES-256-GCM for ZIP file, store encryption_key (salted) in gdpr_data_exports table, download link includes decryption context
- **Policy Versioning**: Privacy policies must be versioned (v2.0, v2.1, v2.2), each user's acceptance tracked separately, new versions require explicit re-acceptance

---

## User Flows

### Change Password Policy (Stronger)
1. Admin opens Security Settings
2. Changes min length from 8 to 12 characters
3. System shows warning: "12 users have passwords <12 chars. They'll reset on next login."
4. Admin clicks [Save Changes]
5. Policy updated in database
6. Audit log entry created
7. Toast: "Password policy updated. 12 users will be prompted to reset."
8. Affected users see password reset prompt on next login

### Enable 2FA (Required for All)
1. Admin opens Security Settings
2. Selects 2FA Enforcement: "Required (All)"
3. Modal: "This will force all 45 users to set up 2FA. Continue?"
4. Admin clicks "Yes, Require 2FA"
5. Policy updated
6. Audit log entry created
7. Toast: "2FA now required for all users"
8. Users without 2FA see setup wizard on next login

### Enable IP Whitelist
1. Admin opens Security Settings
2. Toggles "Enable IP Whitelist" to ON
3. Warning modal: "Only whitelisted IPs can access. Your IP (192.168.1.50) will be added. Continue?"
4. Admin clicks "Yes, Enable"
5. Current IP added to whitelist automatically
6. IP Whitelist section expands
7. Admin adds office IP range: `10.0.0.0/24`
8. Admin clicks [Save Changes]
9. IP whitelist enabled
10. Audit log entry created
11. Toast: "IP whitelist enabled. 2 IPs allowed."
12. Users from non-whitelisted IPs get "Access Denied" on next request

### Account Locked (Failed Logins)
1. User enters wrong password 5 times
2. System locks account for 30 minutes
3. User gets email: "Your account has been locked due to failed login attempts"
4. Admin gets notification: "User jsmith locked (5 failed attempts)"
5. Admin opens User Management → Locked Accounts tab
6. Admin clicks [Unlock] next to jsmith
7. Account unlocked immediately
8. Audit log entry created
9. User can login again

### Send 2FA Reminder
1. Admin opens Security Settings
2. Sees "12/45 users have 2FA enabled (27%)"
3. Clicks [Send Reminder Email to Users Without 2FA]
4. Modal: "Send 2FA setup reminder to 33 users?"
5. Admin clicks "Send"
6. Bulk email sent (33 emails)
7. Toast: "2FA reminders sent to 33 users"
8. Audit log entry created

### View Active Sessions
1. User opens Security Settings
2. Scrolls to "Active Sessions" section
3. Sees table with:
   - Current session: Chrome/Windows, Warsaw PL, Now, ● Current
   - Other sessions: Safari/iPhone, Krakow PL, 2h ago, ○ Active [✕]
   - Other sessions: Firefox/Mac, Remote, 3d ago, ○ Active [✕]
4. User notes suspicious session (Firefox/Mac from unknown location)

### Terminate Individual Session
1. User sees suspicious session: "Firefox/Mac, Remote, 3d ago"
2. User clicks [✕] button next to session
3. Modal: "Terminate session on Firefox/Mac? This will immediately log out the device."
4. User clicks "Yes, Terminate"
5. POST /api/settings/security/sessions/{session_id}/terminate
6. Session removed from database
7. Session removed from list (real-time update)
8. Audit log entry: "Session terminated - Firefox/Mac from [IP]"
9. Toast: "Session terminated successfully"
10. If device still logged in, next request fails with 401, redirects to login

### Terminate All Other Sessions
1. User has 3 active sessions (including current)
2. User clicks [Terminate All Other Sessions]
3. Modal: "Terminate 2 other sessions? This will log out all your other devices. Your current session on Chrome/Windows will remain active."
4. User clicks "Yes, Terminate All"
5. POST /api/settings/security/sessions/terminate-all
6. All sessions except current removed from database
7. List updates to show only current session
8. Audit log entry: "All other sessions terminated (2 sessions)"
9. Toast: "2 sessions terminated successfully"
10. Other devices logged out on next request

### Session Auto-Refresh
1. User opens Security Settings
2. Active Sessions section shows current data
3. After 60 seconds, list auto-refreshes (polling)
4. "Last Active" times update (e.g., "2h ago" → "2h 1m ago")
5. If new session detected (user logged in on another device), it appears in list
6. If session expired or terminated elsewhere, it's removed from list

### Download My Data (GDPR NEW)
1. User opens Security Settings → GDPR Compliance section
2. Clicks [Download Personal Data]
3. Modal appears: "Export Format" with radio buttons [JSON] [CSV]
4. User selects JSON format
5. User clicks [Download]
6. Backend receives POST /api/gdpr/export {format: "json"}
7. Async job queued (Bull/BullMQ) → returns job_id
8. Response: {status: "processing", job_id: "abc123", email: "user@company.com"}
9. Toast: "Preparing your data export. Download link will be emailed soon."
10. Backend job runs:
    - Queries all user personal data (profile, accounts, activity, settings, preferences)
    - Creates ZIP with multiple JSON files + README
    - Encrypts ZIP with AES-256-GCM
    - Uploads to S3 with TTL (24h)
    - Sends email with secure download link
11. User receives email: "Your Data Export is Ready - Download link expires in 24 hours"
12. User clicks link → downloads encrypted ZIP
13. Audit log entry: "GDPR_DATA_EXPORT_REQUESTED" with timestamp

### Request Account Deletion (GDPR NEW)
1. User opens Security Settings → GDPR Compliance section
2. User sees: "Scheduled deletion: None active" with [Request Account Deletion] button
3. User clicks [Request Account Deletion]
4. Modal appears with warning: "⚠ Your account will be permanently deleted in 30 days along with all personal data. You will lose: account access, team membership, all data. This action cannot be undone after the grace period ends."
5. Checklist visible:
   - [ ] "I understand my account will be deleted"
   - [ ] "I understand all my data will be permanently removed"
   - [ ] "I understand I cannot recover my account after 30 days"
6. User checks all boxes → [Schedule Deletion] button becomes enabled
7. User clicks [Schedule Deletion]
8. Backend receives POST /api/gdpr/deletion-request {confirm: true}
9. Server validates all checkboxes confirmed
10. Creates deletion_request record: {user_id, requested_at: now, scheduled_for: now + 30 days, status: "scheduled"}
11. Response: {status: "scheduled", deletion_date: "2026-01-15T14:32:00Z", can_cancel_until: "2026-01-10T14:32:00Z"}
12. Toast: "Account deletion scheduled for 2026-01-15. You can cancel until 2026-01-10."
13. GDPR section updates: "Scheduled deletion: 2026-01-15" + [Cancel Deletion] link
14. User receives confirmation email: "Your account deletion is scheduled for January 15, 2026. You can cancel by [date]."
15. Audit log entry: "GDPR_DELETION_REQUESTED" with deletion_date
16. User continues using account normally until deletion date

### Cancel Deletion Request (GDPR NEW)
1. User sees "Scheduled deletion: 2026-01-15" + [Cancel Deletion] link
2. User decides to keep account, clicks [Cancel Deletion]
3. Modal: "Cancel Account Deletion? Your account will remain active. This deletion request will be permanently removed."
4. User clicks [Yes, Cancel Deletion]
5. Backend receives DELETE /api/gdpr/deletion-request
6. Validates: now < scheduled_for - 5 days (must be > 5 days before scheduled deletion)
7. Updates deletion_request: {canceled_at: now, status: "canceled"}
8. Response: {status: "canceled", message: "Deletion request canceled"}
9. Toast: "Deletion request canceled. Your account will remain active."
10. GDPR section updates: "Scheduled deletion: None active" + [Request Account Deletion] button
11. User receives confirmation email: "Your account deletion request has been canceled."
12. Audit log entry: "GDPR_DELETION_CANCELED" with request_id

### Cannot Cancel Deletion (Too Late - GDPR NEW)
1. User sees "Scheduled deletion: 2026-01-12" (3 days away)
2. User clicks [Cancel Deletion]
3. Modal appears: "⚠ You can only cancel deletion requests up to 5 days before deletion date. Your deletion is scheduled for 2026-01-15, cancellation available until 2026-01-10."
4. [Cancel Deletion] button is disabled/grayed out
5. User can only contact support to request extension or admin intervention

### Account Deleted (Automatic - GDPR NEW)
1. Scheduled deletion date arrives: 2026-01-15 14:32 UTC
2. Daily cron job runs (Agenda/Bull/node-cron)
3. Queries: SELECT * FROM gdpr_deletion_requests WHERE status = "scheduled" AND scheduled_for <= now
4. For each deletion_request:
   - Get user_id
   - DELETE FROM users WHERE id = user_id → cascades to all user records
   - DELETE FROM user_sessions WHERE user_id = user_id
   - DELETE FROM gdpr_* tables WHERE user_id = user_id (except audit log)
   - UPDATE deletion_request SET deleted_at = now, status = "deleted"
5. Audit log entry: "GDPR_ACCOUNT_DELETED" with user_id, deletion_request_id, timestamp
6. If user tries to login after deletion → "Account not found"
7. No recovery possible

### Change Analytics Consent (GDPR NEW)
1. User opens Security Settings → GDPR Compliance section
2. Sees "Analytics & Improvements (Optional)" with status "Consented" and date "2025-06-10"
3. User clicks [Change] button
4. Modal appears: "Analytics & Improvements - Anonymous usage data to improve our service"
   - Current status: "Consented"
   - Radio buttons: [● Consent] [○ Withdraw]
5. User selects [○ Withdraw]
6. User clicks [Update Preference]
7. Backend receives PUT /api/gdpr/consent/analytics {status: "withdrawn"}
8. Updates consent_log: {user_id, consent_type: "analytics", status: "withdrawn", withdrawn_at: now, policy_version: "2.1"}
9. Response: {type: "analytics", status: "withdrawn", updated_at: "2025-12-15T14:32:00Z"}
10. Toast: "Analytics consent withdrawn. Your usage data will no longer be collected."
11. Modal closes
12. GDPR section updates: "Analytics & Improvements" shows "Not Consented"
13. Audit log entry: "GDPR_CONSENT_CHANGED" with type + new_status
14. User's activity no longer tracked for analytics (opt-out at pixel/event level)

### Withdraw Marketing Consent (GDPR NEW)
1. User opens Security Settings → GDPR Compliance section
2. Sees "Marketing Communications (Optional)" with status "Not Consented"
3. User clicks [Change] button
4. Modal: "Marketing Communications - Product updates, features, promotions"
   - Current status: "Not Consented"
   - Radio buttons: [● Consent] [○ Withdraw]
5. [Consent] button is enabled, [Withdraw] is disabled (already withdrawn)
6. User clicks [● Consent] to opt-in
7. User clicks [Update Preference]
8. Backend updates consent_log: {status: "consented", accepted_at: now}
9. Response: {type: "marketing", status: "consented", updated_at: "2025-12-15T14:32:00Z"}
10. Toast: "Marketing consent provided. You will receive product updates and promotions."
11. GDPR section updates: "Marketing Communications" shows "Consented | Consented: 2025-12-15"
12. Audit log entry: "GDPR_CONSENT_CHANGED" with type + new_status
13. User added to marketing email lists

### Accept New Privacy Policy (GDPR NEW)
1. User opens Security Settings
2. Notification banner appears: "⚠ New Privacy Policy Available: Version 2.2 (October 1, 2025) - Updated with new features description, revised data retention policy, new consent categories. [Review Changes] [Accept New Version]"
3. User clicks [Review Changes]
4. Modal opens: "Privacy Policy Changes - v2.1 → v2.2" with side-by-side diff
   - Left column: v2.1 (old)
   - Right column: v2.2 (new)
   - Highlights in yellow: new sections, changed text, deleted sections
5. User scrolls through changes, sees:
   - "NEW: AI/ML processing section"
   - "CHANGED: Data retention from 3 years → 5 years"
   - "NEW: Marketing consent category"
6. User clicks [View Full Text] → opens new policy PDF
7. User returns to diff modal, clicks [Accept v2.2]
8. Backend receives POST /api/gdpr/policy/accept {version: "2.2"}
9. Validates: privacy_policy.version = "2.2" exists
10. Creates policy_acceptance: {user_id, policy_version: "2.2", accepted_at: now, ip_address, user_agent}
11. Response: {policy_version: "2.2", accepted_at: "2025-12-15T14:32:00Z"}
12. Toast: "Privacy Policy v2.2 accepted. Thank you for reviewing."
13. Notification banner disappears
14. GDPR section updates: "Your Acceptance: Version 2.2 | Accepted: 2025-12-15"
15. Audit log entry: "GDPR_POLICY_ACCEPTED" with version
16. User's account marked as compliant with new policy

### View Policy Acceptance History (GDPR NEW)
1. User opens Security Settings → GDPR Compliance section
2. Sees "Current Version: 2.1 | Last Updated: 2025-10-01"
3. Sees "Your Acceptance: Version 2.1 | Accepted: 2025-10-15"
4. User clicks [View My Acceptance History]
5. Modal opens: "Privacy Policy Acceptance Timeline"
   - v2.0 | Published: 2025-03-10 | Your Acceptance: 2025-03-15 | [View v2.0]
   - v2.1 | Published: 2025-10-01 | Your Acceptance: 2025-10-15 | [View v2.1]
   - v2.2 | Published: 2025-12-01 | Not yet accepted | [View v2.2]
6. User clicks [View v2.0] → opens PDF of v2.0 policy
7. User can review all historical policy versions and when they accepted each

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-026-security-settings]
**Iterations Used**: 0
**Ready for Handoff**: Yes
**Phase**: 3 - GDPR Compliance (FR-SET-174)

---

**Status**: Approved for FRONTEND-DEV handoff (updated with GDPR Compliance section)
