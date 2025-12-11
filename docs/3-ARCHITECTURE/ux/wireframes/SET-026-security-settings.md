# SET-026: Security Settings

**Module**: Settings
**Feature**: Security Configuration
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

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
3. **2FA Configuration** - Enforcement radio (4 options), allowed methods checkboxes (3), status counter, reminder button
4. **Failed Login Protection** - Lockout attempts dropdown (3-Never), duration dropdown (15-Manual), notification checkboxes (2)
5. **IP Whitelist Section** - Enable toggle, warning banner, IP list (empty/populated), Add IP button, format examples
6. **Audit Log Mini** - Last 5 security events, timestamp + action + user, [View Full Log] link
7. **Save/Cancel Buttons** - Standard form actions, unsaved changes warning on navigate
8. **Validation Warnings** - Inline warnings for policy changes affecting users (e.g., "12 users will need to reset passwords")
9. **2FA Status Counter** - "X/Y users enabled (Z%)" with visual indicator (red <30%, yellow 30-70%, green >70%)
10. **IP Whitelist Warning** - Red alert banner when enabling (risk of lockout)

---

## Main Actions

### Primary
- **Save Changes** - Validate all settings → check conflicts → update database → audit log entry → toast "Security settings updated" → notify affected users if needed

### Secondary
- **Send 2FA Reminder** - Count users without 2FA → confirmation "Send to X users?" → bulk email → toast "Reminders sent to X users"
- **Add IP to Whitelist** - Input modal (IP/range + label) → validate format → add to list → show in table
- **View Full Audit Log** - Navigate to dedicated audit log page (filtered to security events)
- **Set Up Security Defaults** (Empty state) - Apply recommended policy (12-char, 30min, 2FA optional) → Save

### Validation/Warnings
- **Password Policy Stronger** - "12 users have passwords shorter than new minimum. They'll be forced to reset on next login."
- **Enable IP Whitelist** - "⚠ Warning: Only listed IPs can access the system. Your current IP (192.168.1.50) will be added automatically. Continue?"
- **2FA Required (All)** - "Changing to Required will force all 45 users to set up 2FA on next login. This may cause support load. Continue?"
- **Session Timeout Shorter** - "Reducing timeout to 15 minutes will log out 8 currently active users. Continue?"
- **Disable IP Whitelist** - "Removing IP restrictions. All IPs will be allowed. Continue?"

---

## States

- **Loading**: Skeleton sections (5), "Loading security settings..." text
- **Empty**: "No security policies configured" message, "Set up defaults" CTA (12-char, 30min, 2FA optional)
- **Error**: "Failed to load security settings" warning, Retry + Contact Support buttons
- **Success**: All sections populated with current values, dropdowns/checkboxes reflect saved state, audit log shows recent events, status counters accurate

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

---

## Permissions

| Role | Can View | Can Edit | Can Enable IP Whitelist | Affected by 2FA Required |
|------|----------|----------|-------------------------|--------------------------|
| Super Admin | Yes | Yes | Yes | Yes (if set to All or Admins) |
| Admin | Yes | Yes | Yes | Yes (if set to All or Admins) |
| Manager | Yes | No | No | Yes (if set to All) |
| Operator | No | No | No | Yes (if set to All) |
| Viewer | No | No | No | Yes (if set to All) |

---

## Validation Rules

- **Password Length**: Must be >= 8, <= 20
- **Complexity**: At least 1 checkbox must be checked (can't disable all requirements)
- **Session Timeout**: If set to Never, show warning ("Not recommended for security")
- **2FA Required → Optional**: Show confirmation ("Users may disable 2FA. Continue?")
- **IP Whitelist Enable**: Must have at least 1 IP before enabling, current admin IP auto-added
- **IP Format Validation**: IPv4 (x.x.x.x), IPv4 CIDR (x.x.x.x/y), IPv6 (xxxx:xxxx::/y)
- **Lockout Duration**: If "Manual only", show warning ("Admins must manually unlock all locked accounts")

---

## Accessibility

- **Touch targets**: All dropdowns, checkboxes, toggles >= 48x48dp
- **Contrast**: WCAG AA compliant (warning banners: red bg + white text 4.5:1)
- **Screen reader**: "Password minimum length: 12 characters, Complexity: Uppercase required, Lowercase required, Numbers required, Special characters required, Expiry: 90 days, Prevent reuse: 5 passwords"
- **Keyboard**: Tab navigation, Space to toggle checkboxes, Enter to open dropdowns
- **Focus indicators**: Clear 2px outline on all interactive elements
- **Color independence**: Icons + text for status (not color-only), 2FA status uses %, not just color

---

## Related Screens

- **Audit Log Page**: Full security event history (login attempts, policy changes, lockouts, 2FA changes)
- **IP Whitelist Management Modal**: Add/edit/delete IPs, bulk import, test connectivity
- **User Lockout Management**: Admin view of locked accounts, manual unlock button, lockout history
- **2FA Setup Wizard (User)**: Step-by-step TOTP setup (scan QR, enter code, backup codes)

---

## Technical Notes

- **RLS**: Security settings filtered by `org_id`, only org admins can view/edit
- **API**: `GET /api/settings/security` → returns current policy
- **API**: `PUT /api/settings/security` → body: policy object → validates → updates → audit log
- **API**: `POST /api/settings/security/send-2fa-reminder` → sends bulk email to users without 2FA
- **Database**: `org_security_policies` table (org_id, password_min_length, complexity_flags, session_timeout, etc.)
- **Database**: `password_history` table (user_id, password_hash, created_at) for reuse prevention
- **Database**: `ip_whitelist` table (org_id, ip_address, label, created_by, created_at)
- **Database**: `security_audit_log` table (org_id, event_type, user_id, ip_address, metadata, created_at)
- **Validation**: Server-side password validation on user creation/update (check min length, complexity, history)
- **Session Enforcement**: Middleware checks inactivity (last_activity_at) and absolute duration (session_started_at)
- **Failed Login Tracking**: `login_attempts` table (user_id, ip_address, success, created_at) → lock account after threshold
- **IP Whitelist Check**: Middleware checks `ip_whitelist` table if enabled → block if not in list
- **2FA Enforcement**: On login, check user.has_2fa_enabled → if required and false, redirect to 2FA setup wizard
- **Audit Logging**: All policy changes, login failures, lockouts, 2FA changes logged to `security_audit_log`

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

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-026-security-settings]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
