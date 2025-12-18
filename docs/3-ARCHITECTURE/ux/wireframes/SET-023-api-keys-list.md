# SET-023: API Keys List

**Module**: Settings
**Feature**: API Keys Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                                    [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search keys...            ] [Filter: All ▼] [Sort: Created ▼]              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Name             Key (Masked)      Permissions   Expires     Last Used  │ │
│  │                                                                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Shopify          pk_live_••••X7K9  Read/Write    Dec 20      1h ago     │ │
│  │ Integration      [📋 Copy]         Orders,       2025        John S     │ │
│  │                                     Products      ⚠️ 5 days left [⋮]    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ WMS Sync         pk_live_••••B4M2  Read-only     Never       2d ago     │ │
│  │                  [📋 Copy]         Inventory     (No expiry) Sarah M    │ │
│  │                                     Warehouse                  [⋮]      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Mobile App       pk_live_••••P8L1  Read/Write    Mar 15      3h ago     │ │
│  │                  [📋 Copy]         Production,   2025        John S     │ │
│  │                                     Quality                    [⋮]      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Analytics        pk_live_••••R3N5  Read-only     Jan 10      1d ago     │ │
│  │ Dashboard        [📋 Copy]         All modules   2025        Mike T     │ │
│  │                                                   ⚠️ 26 days left [⋮]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Legacy ERP       pk_live_••••K9W4  Read-only     Never       Never      │ │
│  │ (Deprecated)     [📋 Copy]         Finance       (No expiry) used       │ │
│  │                                                  🔴 Revoked   [⋮]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 5 API keys                                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details (full permissions, rate limit status, activity log)
  - Regenerate Key (confirmation + show new key once)
  - Revoke Key (confirmation, immediate invalidation)
  - Edit Name/Permissions/Expiration
  - View Activity Log
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                                    [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  Loading API keys...                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                                    [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [🔑 Icon]                                            │
│                       No API Keys Created                                     │
│       Create API keys to integrate external systems with MonoPilot.          │
│       Each key can have specific permissions and expiration settings.        │
│                       [+ Create API Key]                                      │
│                                                                               │
│       Need help? View API Documentation                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                                    [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load API Keys                                    │
│        Unable to retrieve API keys. Check your connection.                    │
│                    Error: API_KEYS_FETCH_FAILED                               │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## View Details Panel (New Section - Rate Limit Visibility)

### Details Panel Layout

```
┌──────────────────────────────────────────┐
│  Shopify Integration API Key             │  [X Close]
├──────────────────────────────────────────┤
│                                          │
│  Key: pk_live_••••X7K9  [📋 Copy]        │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Key Information                    │  │
│  ├────────────────────────────────────┤  │
│  │ Status: ✓ Active                   │  │
│  │ Created: Dec 2024 by John S        │  │
│  │ Last Used: 1 hour ago              │  │
│  │ Expires: Dec 20, 2025 (5d left)    │  │
│  │ ⚠️ EXPIRATION WARNING: 30 days     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Rate Limit Status                  │  │
│  ├────────────────────────────────────┤  │
│  │ Limit: 1000 requests per hour      │  │
│  │ Current Usage (last 24h):          │  │
│  │ ▓▓▓░░░░░░░░░░░░░░░░ 234/1000      │  │
│  │ Peak Usage: 89 req/min (2h ago)    │  │
│  │ Status: Normal                     │  │
│  │ Next Reset: in 47 minutes          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Permissions                        │  │
│  ├────────────────────────────────────┤  │
│  │ ✓ Orders: read, write              │  │
│  │ ✓ Products: read                   │  │
│  │ ✗ Inventory: no access             │  │
│  │ ✗ Production: no access            │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Regenerate]  [Revoke]  [Edit]          │
│                                          │
└──────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Name, Masked Key + Copy button, Permissions (comma-separated), **Expires** (date or "Never"), Last Used (relative time or "Never"), Status (badge: Active/Revoked), Actions menu, **Expiration Warning** (⚠️ indicator for keys expiring within 30 days)
2. **Search/Filter Bar** - Text search (name), status filter (All/Active/Revoked), sort dropdown (Created, Name, Last Used, Expires)
3. **Create API Key Button** - Primary CTA (top-right), opens create modal with name + permission selection + optional expiration date
4. **Masked Key Display** - Format: `pk_live_••••XXXX` (last 4 chars visible)
5. **Copy Button** - One-click copy full key to clipboard (toast confirmation: "API key copied")
6. **Permissions Column** - Read/Write or Read-only + module list (truncated if >2, hover for full list)
7. **Expires Column** - Shows expiration date (e.g., "Dec 20, 2025") or "Never" (if no expiry), with ⚠️ warning icon if expiring within 30 days
8. **Status Indicators** - Active (green dot), Revoked (red dot + "Revoked" badge)
9. **Actions Menu ([⋮])** - View Details, Regenerate, Revoke, Edit, Activity Log
10. **Relative Time** - "2d ago", "3h ago", "Never" (for last used)
11. **View Details Panel** - Shows full key info, rate limit status (limit, current usage %, peak usage, next reset), permissions list, expiration with countdown

---

## Main Actions

### Primary
- **[+ Create API Key]** - Opens modal (name, description, select permissions by module/scope, optional expiration date) → generates key → shows key ONCE in modal (must copy immediately)

### Secondary (Row Actions)
- **View Details** - Opens panel/modal (full key details, **rate limit status**, complete permissions list, creation info, **expiration countdown**, usage stats, activity log)
- **Copy Key** - Copies full key to clipboard (toast: "API key copied to clipboard")
- **Regenerate Key** - Confirmation dialog (warning: old key invalidated immediately) → generates new key → shows new key ONCE
- **Revoke Key** - Confirmation dialog (warning: permanent action, systems using this key will fail) → sets status to revoked → immediate invalidation
- **Edit Name/Permissions/Expiration** - Opens edit modal (change name, description, adjust permissions, **set/modify expiration date**) → cannot change key itself
- **View Activity Log** - Shows key usage history (API calls, timestamps, endpoints, IP addresses)

### Filters/Search
- **Search** - Real-time filter by key name
- **Filter by Status** - All, Active, Revoked
- **Sort** - Created (newest/oldest), Name (A-Z), Last Used (recent/never), **Expires** (soonest first)

---

## States

- **Loading**: Skeleton rows (4), "Loading API keys..." text
- **Empty**: "No API keys created" message, "Create API key to integrate" explanation, "Create API Key" CTA + "View API Documentation" link
- **Error**: "Failed to load API keys" warning, error code, Retry + Contact Support buttons
- **Success**: Table with API key rows (active + revoked), search/filter controls, pagination if >20
- **Expiration Warning**: ⚠️ indicator on rows where expiration_date < today + 30 days (always visible in table)
- **Rate Limit Alert**: In View Details panel, color-coded status (Green: <50%, Yellow: 50-80%, Red: >80%)

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | User-friendly name (e.g., "Shopify Integration") |
| description | text | Optional description |
| key_prefix | string | "pk_live_" (production) or "pk_test_" (sandbox) |
| key_hash | string | Hashed key (bcrypt), never show full key after creation |
| key_last4 | string | Last 4 characters for display (••••X7K9) |
| permissions | jsonb | {module: [scopes]} e.g., {"orders": ["read", "write"], "products": ["read"]} |
| status | enum | active, revoked |
| created_at | timestamp | Creation time |
| created_by | user_id | Creator |
| last_used_at | timestamp | Last API call using this key |
| revoked_at | timestamp | Revocation time (if revoked) |
| revoked_by | user_id | Who revoked |
| **expires_at** | timestamp | **(NEW)** Expiration date for this API key (nullable = never expires) |
| **rate_limit_per_hour** | integer | **(NEW)** API call limit per hour (default: 1000, nullable = unlimited) |
| **rate_limit_reset_at** | timestamp | **(NEW)** When the rate limit counter resets |
| **current_usage_count** | integer | **(NEW)** Current API calls this hour (cached, updated every 5 min) |

---

## Permissions Structure

**Format**: Module-based scopes
```json
{
  "orders": ["read", "write"],
  "products": ["read"],
  "inventory": ["read", "write"],
  "production": ["read"],
  "quality": ["read"],
  "warehouse": ["read", "write"],
  "shipping": ["read", "write"],
  "finance": ["read"],
  "all": ["read"]  // Special: read-only access to all modules
}
```

**Scopes**:
- `read` - GET endpoints
- `write` - POST, PUT, PATCH, DELETE endpoints

**Display**:
- "Read/Write: Orders, Products"
- "Read-only: All modules"
- "Read/Write: Production, Quality"

---

## Security

- **Key Display**: Full key shown ONLY once at creation (modal: "Copy this key now. You won't see it again.")
- **Key Storage**: Hash key with bcrypt, store only hash + last 4 chars
- **Key Format**: `pk_live_` + 32-char random alphanumeric (e.g., `pk_live_aB3dE5fG7hI9jK1lM2nO3pQ4rS5tU6vW`)
- **Regeneration**: Old key invalidated immediately, new key generated with same permissions and expiration
- **Revocation**: Immediate invalidation, cannot be undone (must create new key)
- **Expiration** (FR-SET-122): Keys can have optional expiration date; expired keys return 401 Unauthorized; auto-revoked after expiration
- **Rate Limiting** (FR-SET-125): API calls limited per key (configurable, default 1000 req/hour), show rate limit status and current usage in View Details panel; warn users when >80% of limit reached
- **IP Whitelisting**: Optional IP restriction (future enhancement)

---

## Validation

- **Create**: Name required (max 100 chars), at least one permission scope selected, optional expiration date (must be future date)
- **Edit**: Name required, permissions cannot all be removed (must have at least read access to 1 module), expiration date can be extended or removed
- **Revoke**: Confirmation required ("Type REVOKE to confirm"), cannot revoke if it's the last active key (warning)
- **Regenerate**: Confirmation required, warns systems using old key will break immediately
- **Expiration**: Cannot set past date; warning if setting expiration <30 days from now; auto-revoke if system date passes expiry

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status badges and warning indicators pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "API key: {name}, Created {time} by {user}, Last used {time}, Expires: {date or 'Never'}, Status: {status}, Permissions: {permissions}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Ctrl+C on focused row to copy key
- **Copy Feedback**: Visual + screen reader announcement "API key copied to clipboard"
- **Warning Indicators**: Screen reader announces "Warning: API key expires in {N} days" for items with ⚠️ icon
- **Rate Limit Status**: Color coded (Green/Yellow/Red) with text fallback (e.g., "Normal", "High", "Critical")

---

## Related Screens

- **Create API Key Modal**: Opens from [+ Create API Key] button
- **Show API Key Once Modal**: Displays new key immediately after creation (copy warning)
- **Edit API Key Modal**: Opens from Actions menu → Edit Name/Permissions/Expiration
- **Regenerate Confirmation**: Opens from Actions menu → Regenerate Key
- **Revoke Confirmation**: Opens from Actions menu → Revoke Key
- **API Key Details Panel**: Opens from Actions menu → View Details (includes rate limit status and expiration countdown)
- **Activity Log Panel**: Opens from Actions menu → View Activity Log

---

## Technical Notes

- **RLS**: API keys filtered by `org_id` automatically
- **API**:
  - `GET /api/settings/api-keys?search={query}&status={status}&sort={field}` (returns expires_at, rate_limit_per_hour, current_usage_count)
  - `POST /api/settings/api-keys` (create with optional expires_at, rate_limit_per_hour)
  - `PATCH /api/settings/api-keys/{id}` (edit name/permissions/expires_at)
  - `POST /api/settings/api-keys/{id}/regenerate` (regenerate, preserve expires_at)
  - `POST /api/settings/api-keys/{id}/revoke` (revoke)
  - `GET /api/settings/api-keys/{id}/usage-stats` (get current usage count and rate limit status)
- **Key Generation**: `crypto.randomBytes(24).toString('base64url')` (32 chars)
- **Hash**: bcrypt with 10 rounds
- **Activity Log**: Track all API calls (endpoint, method, status, IP, timestamp) per key
- **Expiration Check** (FR-SET-122): Background job every hour to revoke expired keys; check on every API call
- **Rate Limiting** (FR-SET-125): Track API calls per key in Redis with hourly window; return 429 Too Many Requests when limit exceeded; cache current_usage_count, update every 5 minutes
- **Pagination**: 20 keys per page
- **Real-time**: Subscribe to key updates (revocations, new keys, expirations) via Supabase Realtime

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-023-api-keys-list]
**Iterations Used**: 1 (visibility gaps fixed)
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff (with FR-SET-122 and FR-SET-125 visibility enhancements)
