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
7. **Audit Log Mini** - Last 5 security events, timestamp + action + user, [View Full Log] link
8. **Save/Cancel Buttons** - Standard form actions, unsaved changes warning on navigate
9. **Validation Warnings** - Inline warnings for policy changes affecting users (e.g., "12 users will need to reset passwords")
10. **2FA Status Counter** - "X/Y users enabled (Z%)" with visual indicator (red <30%, yellow 30-70%, green >70%)
11. **IP Whitelist Warning** - Red alert banner when enabling (risk of lockout)

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

### Validation/Warnings
- **Password Policy Stronger** - "12 users have passwords shorter than new minimum. They'll be forced to reset on next login."
- **Enable IP Whitelist** - "⚠ Warning: Only listed IPs can access the system. Your current IP (192.168.1.50) will be added automatically. Continue?"
- **2FA Required (All)** - "Changing to Required will force all 45 users to set up 2FA on next login. This may cause support load. Continue?"
- **Session Timeout Shorter** - "Reducing timeout to 15 minutes will log out 8 currently active users. Continue?"
- **Disable IP Whitelist** - "Removing IP restrictions. All IPs will be allowed. Continue?"
- **Terminate Session Warning** - "Terminating this session will immediately log out the device. Continue?"
- **Terminate All Warning** - "This will log out all your other devices immediately. Your current session will remain active. Continue?"

---

## States

- **Loading**: Skeleton sections (6), "Loading security settings..." text
- **Empty**: "No security policies configured" message, "Set up defaults" CTA (12-char, 30min, 2FA optional)
- **Error**: "Failed to load security settings" warning, Retry + Contact Support buttons
- **Success**: All sections populated with current values, dropdowns/checkboxes reflect saved state, audit log shows recent events, status counters accurate, active sessions table shows current + other sessions

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

---

## Permissions

| Role | Can View | Can Edit | Can Enable IP Whitelist | Can View Sessions | Can Terminate Sessions | Affected by 2FA Required |
|------|----------|----------|-------------------------|-------------------|------------------------|--------------------------|
| Super Admin | Yes | Yes | Yes | Own only | Own only | Yes (if set to All or Admins) |
| Admin | Yes | Yes | Yes | Own only | Own only | Yes (if set to All or Admins) |
| Manager | Yes | No | No | Own only | Own only | Yes (if set to All) |
| Operator | No | No | No | Own only | Own only | Yes (if set to All) |
| Viewer | No | No | No | Own only | Own only | Yes (if set to All) |

**Note**: All users can view and terminate their own sessions, regardless of role. Only security policy configuration is role-restricted.

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

---

## Accessibility

- **Touch targets**: All dropdowns, checkboxes, toggles, terminate buttons >= 48x48dp
- **Contrast**: WCAG AA compliant (warning banners: red bg + white text 4.5:1)
- **Screen reader**: "Password minimum length: 12 characters, Complexity: Uppercase required, Lowercase required, Numbers required, Special characters required, Expiry: 90 days, Prevent reuse: 5 passwords"
- **Screen reader (sessions)**: "Active session on Chrome/Windows in Warsaw, Poland, last active now, current session. Active session on Safari/iPhone in Krakow, Poland, last active 2 hours ago, terminate button."
- **Keyboard**: Tab navigation, Space to toggle checkboxes, Enter to open dropdowns, Enter to activate terminate buttons
- **Focus indicators**: Clear 2px outline on all interactive elements
- **Color independence**: Icons + text for status (not color-only), 2FA status uses %, not just color, session status uses ● Current / ○ Active symbols
- **ARIA labels**: Terminate buttons labeled "Terminate session on [Device]", bulk button "Terminate all other sessions"

---

## Related Screens

- **Audit Log Page**: Full security event history (login attempts, policy changes, lockouts, 2FA changes, session terminations)
- **IP Whitelist Management Modal**: Add/edit/delete IPs, bulk import, test connectivity
- **User Lockout Management**: Admin view of locked accounts, manual unlock button, lockout history
- **2FA Setup Wizard (User)**: Step-by-step TOTP setup (scan QR, enter code, backup codes)
- **Session Details Modal** (future): Detailed session info (full user agent, IP address, login time, activity history)

---

## Technical Notes

- **RLS**: Security settings filtered by `org_id`, only org admins can view/edit
- **API**: `GET /api/settings/security` → returns current policy
- **API**: `PUT /api/settings/security` → body: policy object → validates → updates → audit log
- **API**: `POST /api/settings/security/send-2fa-reminder` → sends bulk email to users without 2FA
- **API**: `GET /api/settings/security/sessions` → returns active sessions for current user (user_id from JWT)
- **API**: `POST /api/settings/security/sessions/{session_id}/terminate` → terminates specific session → removes session → audit log
- **API**: `POST /api/settings/security/sessions/terminate-all` → terminates all sessions except current → removes sessions → audit log
- **Database**: `org_security_policies` table (org_id, password_min_length, complexity_flags, session_timeout, etc.)
- **Database**: `password_history` table (user_id, password_hash, created_at) for reuse prevention
- **Database**: `ip_whitelist` table (org_id, ip_address, label, created_by, created_at)
- **Database**: `security_audit_log` table (org_id, event_type, user_id, ip_address, metadata, created_at)
- **Database**: `user_sessions` table (session_id, user_id, org_id, device_info, ip_address, location, last_activity_at, created_at, expires_at)
- **Validation**: Server-side password validation on user creation/update (check min length, complexity, history)
- **Session Enforcement**: Middleware checks inactivity (last_activity_at) and absolute duration (session_started_at)
- **Session Tracking**: Middleware updates `last_activity_at` on every authenticated request, parses user agent for device info
- **Failed Login Tracking**: `login_attempts` table (user_id, ip_address, success, created_at) → lock account after threshold
- **IP Whitelist Check**: Middleware checks `ip_whitelist` table if enabled → block if not in list
- **2FA Enforcement**: On login, check user.has_2fa_enabled → if required and false, redirect to 2FA setup wizard
- **Audit Logging**: All policy changes, login failures, lockouts, 2FA changes, session terminations logged to `security_audit_log`
- **Geolocation**: IP-to-location lookup using MaxMind GeoLite2 or similar (cached 24h)
- **Session Termination**: DELETE from `user_sessions` + invalidate JWT (add to blacklist if using stateless JWTs)
- **Real-time Updates**: Active sessions list refreshes every 60s (polling) or uses WebSocket for real-time updates

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

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-026-security-settings]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
