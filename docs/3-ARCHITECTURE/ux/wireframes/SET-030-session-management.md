# SET-030: Session Management

**Module**: Settings
**Feature**: User Session Management (FR-SET-013)
**Priority**: P0 (MVP)
**Phase**: 1A
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

Session Management allows users to view and manage their active authentication sessions across multiple devices. Admins can view and terminate sessions for all users. Provides security control over multi-device access with device identification, IP masking, location detection, and secure termination with confirmation.

**Key Features:**
- View active sessions with device, browser, IP (masked), login time, last active
- Geographic location detection (city/country)
- Terminate own sessions
- Terminate all other sessions (keep current session active)
- Admin: View/manage all users' sessions
- Session termination requires confirmation
- Audit logging of all terminations
- Real-time session updates

---

## ASCII Wireframes

### Success State (User View - Desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settings > Session Management                    [Terminate All Others]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Active Sessions (2)                                                       │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ 🖥 Chrome on Mac                      [Current Session] [⋮ Menu]    │   │
│  │ IP: 192.168.*.* | Warsaw, Poland | Last active: 2 minutes ago      │   │
│  │ Logged in: Today at 09:15                                           │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │ 📱 Safari on iPhone                                 [⋮ Menu]        │   │
│  │ IP: 185.47.*.* | Warsaw, Poland | Last active: 45 minutes ago     │   │
│  │ Logged in: Today at 08:30                                           │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [⋮] Menu (per session):                                                  │
│    - View Details                                                         │
│    - Terminate Session (confirmation required)                            │
│    - Terminate All Other Sessions (current user only)                     │
│                                                                            │
│  ┌─ Session Details Modal ──────────────────────────────────────────┐   │
│  │ Close [X]                                                         │   │
│  │                                                                   │   │
│  │ Chrome on Mac                                                     │   │
│  │                                                                   │   │
│  │ Device Information:                                              │   │
│  │   Device Type:     Computer (Desktop)                            │   │
│  │   Browser:         Chrome 131.0                                  │   │
│  │   Operating System: macOS 14.5                                   │   │
│  │   User Agent:      Mozilla/5.0 [truncated]...                   │   │
│  │                                                                   │   │
│  │ Connection Information:                                          │   │
│  │   IP Address:      192.168.*.* (Warsaw, Poland)                 │   │
│  │   Country:         Poland                                        │   │
│  │   City:            Warsaw                                        │   │
│  │                                                                   │   │
│  │ Session Timeline:                                                │   │
│  │   Logged in:       Today at 09:15:32                             │   │
│  │   Last active:     Today at 09:17:48 (2 minutes ago)             │   │
│  │   Token expires:   Tomorrow at 09:15                             │   │
│  │                                                                   │   │
│  │ Session Status:    Active • Idle for 2 minutes                  │   │
│  │                                                                   │   │
│  │                            [Close]  [Terminate]                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─ Terminate Confirmation ─────────────────────────────────────────┐   │
│  │ Close [X]                                                         │   │
│  │                                                                   │   │
│  │ Terminate Session?                                               │   │
│  │                                                                   │   │
│  │ You will be logged out of Chrome on Mac (Warsaw).                │   │
│  │ You'll need to log in again on that device.                      │   │
│  │                                                                   │   │
│  │ ☑ This is a device I don't recognize                            │   │
│  │                                                                   │   │
│  │                    [Cancel]  [Terminate]                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Success State (User View - Mobile)

```
┌─────────────────────────────────┐
│ Settings > Sessions             │
├─────────────────────────────────┤
│                                 │
│ Active Sessions (2)             │
│                                 │
│ 🖥 Chrome on Mac                │
│ [Current]  [⋮]                  │
│ 192.168.*.* • Warsaw, Poland    │
│ Last active: 2 min ago          │
│ Logged in: Today 09:15          │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ 📱 Safari on iPhone             │
│ [⋮]                             │
│ 185.47.*.* • Warsaw, Poland     │
│ Last active: 45 min ago         │
│ Logged in: Today 08:30          │
│                                 │
│                                 │
│ [Terminate All Others]          │
│                                 │
└─────────────────────────────────┘
```

### Success State (Admin View)

```
┌────────────────────────────────────────────────────────────────────────┐
│  Settings > Session Management > All Users          [Filter User ▼]     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Search users...               ]                                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ User: John Smith (john@acme.com)  [3 Sessions]                  │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ 🖥 Chrome on Mac         Warsaw, Poland | 2 min ago  [⋮]         │   │
│  │ 📱 Safari on iPhone      Warsaw, Poland | 1 hour ago [⋮]         │   │
│  │ 🖥 Firefox on Windows    New York, USA | 8 hours ago [⋮]         │   │
│  │                                                                    │   │
│  │ [⋮] Menu: View Details | Terminate Session | Terminate All Sessions│   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ User: Jane Doe (jane@acme.com)    [1 Session]                   │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ 📱 Chrome Mobile          Dublin, Ireland | 20 min ago [⋮]       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Showing 2 of 12 users                              [1] [2] [3] [>]     │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settings > Session Management                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Active Sessions                                                           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │   │
│  │                                                                     │   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Loading your sessions...                                                  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settings > Session Management                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                            [🔒 Icon]                                       │
│                                                                            │
│                        No Active Sessions                                  │
│                                                                            │
│     You are not currently logged in. This shouldn't happen.               │
│          If you're seeing this, please refresh the page.                  │
│                                                                            │
│                           [Refresh Page]                                   │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settings > Session Management                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                            [⚠ Icon]                                        │
│                                                                            │
│                    Failed to Load Sessions                                 │
│                                                                            │
│        Unable to retrieve your active sessions. Please check your         │
│              connection and try again.                                     │
│                                                                            │
│                    Error: SESSION_FETCH_FAILED                            │
│                                                                            │
│                        [Retry]  [Contact Support]                          │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Error State - Termination Failed

```
┌─────────────────────────────────────────────────────────────────────┐
│ Close [X]                                                            │
│                                                                      │
│ [⚠] Failed to Terminate Session                                    │
│                                                                      │
│ Unable to terminate the session. Please try again later.            │
│                                                                      │
│ Error Code: SESSION_TERMINATE_FAILED                               │
│                                                                      │
│                    [Retry]  [Contact Support]                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Success State - Termination Confirmed

```
┌─────────────────────────────────────────────────────────────────────┐
│ Close [X]                                                            │
│                                                                      │
│ [✓] Session Terminated                                             │
│                                                                      │
│ You have been logged out of Chrome on Mac.                          │
│ That device will need to log in again.                              │
│                                                                      │
│ This action has been logged in your audit trail.                    │
│                                                                      │
│                        [Close]  [View Audit Log]                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Session List (User View)

**Layout:**
- Card-based design, one session per card
- Desktop: Horizontal layout with info left, actions right
- Mobile: Vertical stack with actions below

**Per Session Card Shows:**
- Device icon (🖥 Computer, 📱 Mobile, 🍎 iPhone, etc.)
- Device type and browser (e.g., "Chrome on Mac", "Safari on iPhone")
- [Current Session] badge (if active session)
- IP address (masked: 192.168.*.*)
- Location (city, country)
- Last activity (relative time: "2 minutes ago")
- Logged in timestamp
- Actions menu ([⋮])

**Session Icon Mapping:**
| Device Type | Icon | Label |
|---|---|---|
| Desktop (Windows) | 🖥 | Computer (Windows) |
| Desktop (Mac) | 🖥 | Computer (Mac) |
| Desktop (Linux) | 🖥 | Computer (Linux) |
| iPhone/iPad | 🍎 | Apple Device |
| Android | 🤖 | Android Device |
| API Client | 🔌 | API Client |
| Web App | 🌐 | Web Browser |

### 2. Session Details Modal

**Content:**
- Close button (X, top-right)
- Device information section
  - Device type (Desktop, Mobile, etc.)
  - Browser name and version
  - Operating system and version
  - User agent (truncated with ellipsis)
- Connection information section
  - IP address (masked)
  - Geographic location (city, country)
  - Reverse DNS (if available)
- Session timeline section
  - Login timestamp (date + time)
  - Last activity timestamp
  - Token expiration time
- Session status badge
  - Active (green)
  - Idle for [X] minutes (yellow)
  - Expired (gray)
- Action buttons
  - Close (secondary)
  - Terminate (danger/red)

**Responsive:**
- Desktop: 500px wide modal
- Mobile: Full-screen modal with bottom action bar

### 3. Termination Confirmation Modal

**Content:**
- Warning icon (⚠)
- Heading: "Terminate Session?"
- Description: Device type, location, and impact
- Optional checkbox: "This is a device I don't recognize" (security signal)
- Action buttons:
  - Cancel (secondary)
  - Terminate (danger/red)

**Security Features:**
- Explicit confirmation required (not just one-click)
- Checkbox allows user to flag unrecognized device
- Logged to audit trail
- User cannot terminate current session (show error instead)

### 4. Admin View - User Session List

**Layout:**
- Filterable list of users with session counts
- Each user section shows all their active sessions
- Search box to find users
- Filter dropdown by user role/department (optional)

**Per User Section:**
- User name and email as header
- Session count badge: "[N] Sessions"
- List of sessions under each user
- Admin actions:
  - View session details
  - Terminate specific session
  - Terminate all sessions for user

**Permissions:**
- Only Super Admin and Admin can access
- Can terminate any user's sessions
- Cannot view other users' sessions if not admin

### 5. Actions Menu ([⋮])

**User View (Own Sessions):**
- View Details → Opens session details modal
- Terminate Session → Opens confirmation modal (disabled for current session)
- Terminate All Other Sessions → Opens confirmation for all except current
  - Message: "Terminate all other sessions?"
  - Shows count and devices affected

**Admin View (Other Users' Sessions):**
- View Details → Opens session details modal
- Terminate Session → Direct termination (no confirmation for admin)
- Terminate All Sessions → Terminates all including current if admin viewing

**Current Session:**
- Cannot be terminated (button disabled or hidden)
- Shows "[Current Session]" badge
- Tooltip: "You cannot terminate your current session here. Use Logout button in the header."

### 6. Terminate All Others Button

**Location:** Top-right, primary button
**Visibility:** Only on user's own session management view
**Behavior:**
- Opens confirmation modal listing devices that will be terminated
- Excludes current session
- Shows summary: "2 other sessions will be terminated"
- After confirmation, terminates all except current

---

## Main Actions

### Primary Actions

#### View Session Details
- **Trigger:** "View Details" in menu
- **Opens:** Session details modal
- **Info Displayed:**
  - Full device information (Device Type, Browser, OS, User Agent)
  - Connection info (IP, Location, Reverse DNS)
  - Session timeline (Login, Last Active, Expiration)
  - Session status badge
- **Actions in Modal:** Terminate, Close

#### Terminate Session
- **Trigger:** "Terminate Session" in menu
- **Flow:**
  1. Opens confirmation modal
  2. User confirms (required checkbox optional)
  3. Session revoked, user logged out on that device
  4. Shows success message
  5. Session removed from list after 1-2 seconds
- **Result:** User cannot use terminated device without re-login
- **Audit:** Logged with user ID, session ID, timestamp, admin ID (if admin action)

#### Terminate All Other Sessions
- **Trigger:** "Terminate All Other Sessions" button or menu item
- **Flow:**
  1. Opens confirmation modal listing sessions
  2. User confirms
  3. All sessions except current revoked
  4. Shows success message
  5. List updates, showing only current session
- **Use Case:** User suspects account compromise or wants to log out everywhere

### Secondary Actions

#### View Activity/Audit Trail
- **Trigger:** "View Audit Log" link in termination success modal
- **Opens:** Audit trail filtered to this user's session activity
- **Shows:** Session creation, termination, failed logins

#### Refresh Sessions List
- **Trigger:** Manual refresh button or auto-refresh every 30s
- **Updates:** Session list with latest last-activity times
- **Indicators:** Subtle refresh animation or "Last refreshed 30 seconds ago"

### Admin Actions

#### View All Users' Sessions (Admin Only)
- **Trigger:** Settings > Session Management (admin role)
- **View:** All users with session lists
- **Actions:** Can terminate any session

#### Filter Sessions by User (Admin)
- **Filter Options:**
  - User name/email search
  - Role filter
  - Department filter (if configured)
- **Behavior:** Filters the user list, not individual sessions

---

## States

### 1. Loading State
- **Visual:** Skeleton cards (2-3 session rows)
- **Text:** "Loading your sessions..."
- **Duration:** Show until sessions loaded
- **Minimum display:** 300ms (avoid flicker)
- **ARIA:** `aria-busy="true"` on container

### 2. Empty State
- **Icon:** Lock icon (gray)
- **Heading:** "No Active Sessions"
- **Message:** "You are not currently logged in. This shouldn't happen. If you're seeing this, please refresh the page."
- **Action:** [Refresh Page] button
- **Accessibility:** Clear explanation of why list is empty

### 3. Error State
- **Icon:** Warning icon (red)
- **Heading:** "Failed to Load Sessions"
- **Message:** "Unable to retrieve your active sessions. Please check your connection and try again."
- **Error Code:** Displayed (e.g., SESSION_FETCH_FAILED)
- **Actions:** [Retry] [Contact Support]
- **Accessibility:** Announced with aria-live="assertive"

### 4. Success State
- **Sessions Table/Cards:** Populated with active sessions
- **Visual Indicators:**
  - Device icons for quick identification
  - Badge for current session
  - Green "Active" status badge
  - Yellow "Idle" status badge
- **User Feedback:** All interactions show success/error toasts

### 5. Termination States

#### Success - Session Terminated
- **Icon:** Checkmark (green)
- **Heading:** "Session Terminated"
- **Message:** "[Device Name] has been logged out."
- **Additional Info:** "This action has been logged in your audit trail."
- **Actions:** [Close] [View Audit Log]
- **Auto-dismiss:** No (require manual close)

#### Success - All Others Terminated
- **Message:** "All other sessions have been terminated. You remain logged in on this device."
- **List Update:** Shows only current session
- **Toast:** Green success toast "All other sessions terminated"

#### Error - Cannot Terminate Current Session
- **Trigger:** User attempts to terminate current session
- **Message:** "You cannot terminate your current session here. Use the Logout button in the header."
- **UI:** Button hidden or disabled with tooltip on user view

#### Error - Termination Failed
- **Icon:** Warning (red)
- **Heading:** "Failed to Terminate Session"
- **Message:** "Unable to terminate the session. Please try again later."
- **Error Code:** Displayed
- **Actions:** [Retry] [Contact Support]

---

## Data Fields

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| session_id | UUID | Yes | Unique session identifier | `ses_3f8b9c2a7d1e` |
| user_id | UUID | Yes | Session owner | `usr_abc123` |
| device_type | enum | Yes | desktop\|mobile\|api | `desktop` |
| browser_name | string | Yes | Browser or client name | `Chrome`, `Safari`, `API Client` |
| browser_version | string | No | Browser version | `131.0.6778.204` |
| os_name | string | Yes | Operating system | `macOS`, `Windows`, `iOS` |
| os_version | string | No | OS version | `14.5`, `11` |
| user_agent | string | Yes | Full user agent string | `Mozilla/5.0...` |
| ip_address | string | Yes | Source IP (stored masked) | `192.168.*.* ` |
| ip_country | string | Yes | Country code (GeoIP) | `PL` |
| ip_city | string | Yes | City (GeoIP) | `Warsaw` |
| ip_latitude | float | No | Latitude for advanced mapping | `52.229675` |
| ip_longitude | float | No | Longitude for advanced mapping | `21.012228` |
| created_at | timestamp | Yes | Session creation time | `2025-12-15T09:15:32Z` |
| last_activity_at | timestamp | Yes | Last request timestamp | `2025-12-15T09:17:48Z` |
| expires_at | timestamp | Yes | Session expiration time | `2025-12-16T09:15:32Z` |
| is_current | boolean | Computed | True if session ID matches current user | `true` |
| status | enum | Computed | active\|idle\|expired | `active` |

### Computed Fields

| Field | Logic | Example |
|---|---|---|
| is_current | session_id === currentSessionId | true |
| device_display | `${browser_name} on ${os_name}` | "Chrome on Mac" |
| device_icon | Map device_type → emoji | 🖥 \| 📱 \| 🍎 |
| location_display | `${ip_city}, ${ip_country}` | "Warsaw, Poland" |
| last_activity_relative | Relative time format | "2 minutes ago" |
| time_idle | now - last_activity_at | "2 minutes" |
| status | Computed from expires_at and last_activity | "active" \| "idle for 5 min" \| "expired" |

---

## Permissions

### User View (Own Sessions)

| Action | Super Admin | Admin | Managers | Operators | Viewer |
|---|---|---|---|---|---|
| View own sessions | Yes | Yes | Yes | Yes | Yes |
| View session details | Yes | Yes | Yes | Yes | Yes |
| Terminate own session | Yes | Yes | Yes | Yes | Yes |
| Terminate all others | Yes | Yes | Yes | Yes | Yes |
| View other users | No | No | No | No | No |

### Admin View (All Users)

| Action | Super Admin | Admin | Others |
|---|---|---|---|
| View all sessions | Yes | Yes | No |
| Search/filter users | Yes | Yes | No |
| View session details | Yes | Yes | No |
| Terminate any session | Yes | Yes | No |
| Terminate all user sessions | Yes | Yes | No |

**Access Control:**
- `/settings/sessions` - All authenticated users (own sessions only)
- `/settings/sessions/admin` - Super Admin + Admin only
- API: `GET /api/settings/sessions` - All users (scoped to self)
- API: `DELETE /api/settings/sessions/:id` - Owner + Admin
- API: `GET /api/settings/admin/sessions` - Admin only

---

## API Endpoints

### Get User's Own Sessions

```
GET /api/settings/sessions

Response:
{
  "data": [
    {
      "id": "ses_3f8b9c2a7d1e",
      "device_type": "desktop",
      "browser_name": "Chrome",
      "browser_version": "131.0",
      "os_name": "macOS",
      "os_version": "14.5",
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.*.*",
      "ip_city": "Warsaw",
      "ip_country": "PL",
      "created_at": "2025-12-15T09:15:32Z",
      "last_activity_at": "2025-12-15T09:17:48Z",
      "expires_at": "2025-12-16T09:15:32Z",
      "is_current": true,
      "status": "active"
    }
  ],
  "total": 2
}
```

### Get All Users' Sessions (Admin Only)

```
GET /api/settings/admin/sessions?user_id=abc&limit=20&offset=0

Response:
{
  "data": [
    {
      "user_id": "usr_abc123",
      "user_email": "john@acme.com",
      "user_name": "John Smith",
      "sessions": [
        {
          "id": "ses_3f8b9c2a7d1e",
          "device_type": "desktop",
          "browser_name": "Chrome",
          ...
        }
      ],
      "session_count": 3
    }
  ],
  "total": 12
}
```

### Get Session Details

```
GET /api/settings/sessions/:id

Response:
{
  "data": {
    "id": "ses_3f8b9c2a7d1e",
    "device_type": "desktop",
    "browser_name": "Chrome",
    "browser_version": "131.0.6778.204",
    "os_name": "macOS",
    "os_version": "14.5",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.*.*",
    "ip_reverse_dns": "example.com",
    "ip_city": "Warsaw",
    "ip_country": "PL",
    "ip_latitude": 52.229675,
    "ip_longitude": 21.012228,
    "created_at": "2025-12-15T09:15:32Z",
    "last_activity_at": "2025-12-15T09:17:48Z",
    "expires_at": "2025-12-16T09:15:32Z",
    "is_current": true
  }
}
```

### Terminate Session

```
DELETE /api/settings/sessions/:id

Request:
{
  "reason": "user_request" | "admin_termination" | "security_alert",
  "device_unrecognized": false
}

Response:
{
  "success": true,
  "message": "Session terminated successfully",
  "audit_id": "aud_xyz789"
}

Error:
{
  "error": "CANNOT_TERMINATE_CURRENT_SESSION",
  "message": "Cannot terminate your current session"
}
```

### Terminate All Other Sessions (User)

```
POST /api/settings/sessions/terminate-others

Response:
{
  "success": true,
  "terminated_count": 2,
  "message": "All other sessions have been terminated",
  "audit_id": "aud_xyz789"
}
```

### Terminate All User Sessions (Admin Only)

```
DELETE /api/settings/admin/sessions/:user_id

Response:
{
  "success": true,
  "terminated_count": 3,
  "message": "All sessions for user have been terminated",
  "audit_id": "aud_xyz789"
}
```

---

## Validation

### Session Termination

- User cannot terminate current session (show error)
- Session ID must be valid and belong to user (admin can terminate any)
- Confirmation required for user actions
- Admin can terminate without confirmation (optional in UI)
- Failed terminations show specific error codes

### Concurrent Requests

- If user terminates session while it's being used, show error: "Session already terminated"
- Refresh on error to sync state
- If current session terminated by admin, show "Your session has been terminated. Please log in again."

### Data Validation

- IP addresses masked in UI: `192.168.*.* `
- Timestamps in UTC, displayed in user's timezone
- Browser/OS versions validated before storing
- GeoIP data cached for 24h to avoid repeated lookups

---

## Responsive Design

### Desktop (>1024px)

- **Layout:** Table or horizontal cards
- **Session Cards:** Full width, horizontal info layout
- **Details Modal:** 500px wide, centered
- **Actions Menu:** Dropdown near cursor
- **Buttons:** 36x36px minimum

### Tablet (768-1024px)

- **Layout:** Vertical cards (narrower than desktop)
- **Session Cards:** Stacked info, actions below
- **Details Modal:** Full-width minus margins (80% width)
- **Touch targets:** 44px minimum
- **Buttons:** 40x40px minimum

### Mobile (<768px)

- **Layout:** Single column, vertical cards
- **Session Cards:** Full-width, vertical layout
- **Details Modal:** Full-screen modal with bottom action bar
- **Actions Menu:** Bottom sheet or modal
- **Touch targets:** 48px minimum
- **Font sizes:** 16px primary, 14px secondary
- **No horizontal scroll**

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Touch Targets
- [ ] All buttons/menu items >= 48x48dp (mobile) / 36x36px (desktop)
- [ ] Session list items >= 64dp height (easy tapping)
- [ ] Spacing between targets >= 8dp
- [ ] Tested with gloves (for warehouse scanners)

#### Color Contrast
- [ ] Text on background: >= 4.5:1 ratio
- [ ] Status badges: >= 3:1 contrast (not color alone)
- [ ] Links: Blue #1e40af on white >= 5.4:1
- [ ] Alerts: Red #dc2626 on white >= 4.86:1

#### Keyboard Navigation
- [ ] Tab order: Search → Filter → Sessions → Actions
- [ ] Enter opens session details or actions menu
- [ ] Escape closes modals/menus
- [ ] Arrow keys navigate session list (if applicable)
- [ ] All interactive elements have visible focus indicator

#### Screen Reader
- [ ] Session cards announce: "Chrome on Mac, current session, Warsaw Poland, 2 minutes ago"
- [ ] Status badges use aria-label (not color alone)
- [ ] Menu button uses aria-label="Actions for [device name]"
- [ ] Loading announced with aria-live="polite"
- [ ] Errors announced with aria-live="assertive"
- [ ] Confirmation modal has focus trap

#### Semantic HTML
- [ ] Headings follow hierarchy (h1 → h2, no skips)
- [ ] Buttons use `<button>` tag (not `<div>` with onClick)
- [ ] Form uses `<form>` tag with `<fieldset>` for groups
- [ ] Lists use `<ul>` or `<ol>` tags
- [ ] Landmarks: `<header>`, `<main>`, `<nav>` used correctly

#### Mobile Accessibility
- [ ] No hover-only interactions
- [ ] Touch feedback (visual + haptic)
- [ ] Large touch targets (48px minimum)
- [ ] Font size readable without zoom (16px+)
- [ ] Color not sole method to convey info (icons + text)

---

## Testing Checklist

### Unit Tests

- [ ] Session data correctly parsed from API
- [ ] Relative time formatting (2 minutes ago, Yesterday, etc.)
- [ ] Device icon mapping (desktop → 🖥, mobile → 📱)
- [ ] IP masking (192.168.*.*)
- [ ] Status computation (active, idle, expired)
- [ ] Permission checks (user vs admin)

### Integration Tests

- [ ] Load user's sessions API
- [ ] Load admin sessions API (admin only)
- [ ] Terminate session - success
- [ ] Terminate session - error (current session)
- [ ] Terminate all others - success
- [ ] Session list updates after termination
- [ ] Pagination works (if >20 sessions)
- [ ] Search/filter users (admin view)

### E2E Tests

- [ ] User navigates to session management page
- [ ] Loads sessions correctly
- [ ] Opens session details modal
- [ ] Closes modal (Escape key)
- [ ] Terminates session with confirmation
- [ ] Sees success message
- [ ] Session removed from list
- [ ] Admin views other user's sessions
- [ ] Admin can terminate any session

### Accessibility Tests

- [ ] Manual: Tab navigation (keyboard only)
- [ ] Manual: Screen reader (NVDA, VoiceOver)
- [ ] Manual: 200% zoom (no overflow)
- [ ] Manual: Mobile device (real hardware)
- [ ] Automated: Axe DevTools scan (0 critical)
- [ ] Automated: Lighthouse accessibility >= 90
- [ ] Automated: Contrast ratio checks (WCAG AA)

### Browser Compatibility

- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

---

## Security Considerations

### Session Termination

- **Confirmation Required:** All user terminations require explicit confirmation
- **Cannot Self-Terminate:** User cannot terminate current session (prevents accidents)
- **Audit Logging:** All terminations logged with timestamp, admin ID (if admin action), reason
- **Rate Limiting:** Limit termination requests to prevent abuse (e.g., 10/min per user)
- **Concurrent Termination:** If admin terminates user's session while user views page, show error

### IP Masking

- **Storage:** IP addresses masked in database: `192.168.*.*`
- **Display:** Masked IP shown to users and admins
- **Privacy:** Full IP only available to compliance/security team on audit trail
- **GDPR Compliance:** IP redaction after 90 days retention

### Unrecognized Device Flag

- **User Signal:** Checkbox "This is a device I don't recognize"
- **Stored:** Flag in audit log for security analysis
- **Alert:** Security team notified if multiple unrecognized terminations
- **Not Required:** Termination works with or without flag

### Session Timeout

- **Default:** 24 hours (configurable in SET-026 Security Settings)
- **Idle Timeout:** Can be configured separately
- **Last Activity:** Updated on any API request
- **Early Expiration:** If user changes password, all other sessions terminated immediately

---

## Audit Trail Integration

### Events Logged

| Event | Details | Severity |
|---|---|---|
| Session created | user_id, device, IP, browser, OS, timestamp | Info |
| Session accessed | session_id, last_activity, timestamp | Info |
| Session terminated | user_id, session_id, device, IP, terminated_by (if admin), reason, timestamp | Warning |
| Termination failed | session_id, error_code, timestamp | Error |
| All sessions terminated | user_id, count, timestamp | Warning |
| Unrecognized device flagged | session_id, user_id, device, timestamp | Warning |

### Audit Log Entry

```json
{
  "id": "aud_xyz789",
  "user_id": "usr_abc123",
  "action": "SESSION_TERMINATED",
  "entity_type": "session",
  "entity_id": "ses_3f8b9c2a7d1e",
  "changes": {
    "session_id": "ses_3f8b9c2a7d1e",
    "device": "Chrome on Mac",
    "ip_address": "192.168.*.*",
    "terminated_by": "usr_abc123",
    "reason": "user_request",
    "device_unrecognized": false
  },
  "ip_address": "192.168.*.*",
  "timestamp": "2025-12-15T09:18:00Z",
  "status": "success"
}
```

---

## Related Screens

- **SET-026:** Security Settings (session timeout config)
- **SET-008:** User List (user management)
- **SET-029:** Activity Log (general audit trail)

---

## Components Used

| Component | Source | Notes |
|---|---|---|
| Card | ShadCN UI | Session list items |
| Button | ShadCN UI | Primary/secondary/danger actions |
| Modal/Dialog | ShadCN UI | Details, confirmation, errors |
| Badge | ShadCN UI | Status, role, device type |
| Menu/Dropdown | ShadCN UI | Row actions ([⋮]) |
| Icon | Lucide React | Device icons, status icons |
| Toast | ShadCN UI | Success/error feedback |
| Skeleton | ShadCN UI | Loading state |
| Table | React | Desktop view (optional) |

---

## Implementation Notes

### Frontend (Next.js)

1. **Route:** `/settings/sessions` (user), `/settings/sessions/admin` (admin)
2. **Component:** `SessionManagement.tsx`
3. **Hooks:** `useSessionData()`, `useTerminateSession()`
4. **State:** React Query for caching + real-time updates
5. **Polling:** Refresh every 30s (session list may change if admin views)
6. **Realtime:** Consider WebSocket for immediate updates

### Backend (Supabase)

1. **Table:** `user_sessions` with org_id for multi-tenancy
2. **RLS Policy:** Users see own sessions, admins see all
3. **Indexes:** On (user_id, created_at), (org_id, user_id)
4. **Cleanup:** Scheduled job to delete expired sessions daily
5. **Edge Function:** `terminate-session` endpoint

### GeoIP Data

1. **Service:** MaxMind GeoLite2 or IP2Location
2. **Caching:** Redis cache (24h TTL)
3. **Fallback:** Show "Unknown" if lookup fails
4. **GDPR:** Respect users' privacy, optional location tracking

### Rate Limiting

1. **Termination:** 10 requests/min per user
2. **Session List:** 20 requests/min per user
3. **Admin Access:** 50 requests/min per admin

---

## Success Metrics

- [ ] Users can view and manage sessions within 2 clicks
- [ ] Session details load within 300ms
- [ ] Termination confirmation required (0 accidental terminations)
- [ ] 100% of terminations logged to audit trail
- [ ] Admin can manage all users' sessions without permission errors
- [ ] Mobile responsiveness: Touch targets >= 48px
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] Error handling: <1% failed terminations
- [ ] Performance: <200ms API response time

---

## Known Limitations & Future Work

### Phase 1A Scope

- Basic session list and termination
- Geographic location detection (city/country only)
- Manual refresh (no real-time updates)

### Future Enhancements (Phase 2+)

- Real-time WebSocket updates
- Session device fingerprinting (detect spoofed sessions)
- Device name customization (user can name devices)
- Trusted device feature (skip MFA on trusted devices)
- Remote logout notifications (notify user when session terminated)
- Session activity heatmap (when/where user is active)
- Suspicious activity alerts
- IP whitelist blocking
- Device trust scoring

---

## Approval Checklist

Before handoff to FRONTEND-DEV:

- [ ] User approves wireframe and layout
- [ ] All 4 states defined and approved
- [ ] API endpoints documented
- [ ] Accessibility requirements met
- [ ] Responsive breakpoints defined
- [ ] Audit trail integration planned
- [ ] Security considerations reviewed
- [ ] Permission matrix approved
- [ ] Error states approved
- [ ] Success messages approved

---

**Document Status:** Ready for Developer Review
**Quality Target:** 95%+
**Handoff Ready:** Upon user approval
**Last Updated:** 2025-12-15
