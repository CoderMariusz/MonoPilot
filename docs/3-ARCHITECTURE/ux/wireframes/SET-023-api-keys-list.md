# SET-023: API Keys List

**Module**: Settings
**Feature**: API Keys Management
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                            [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search keys...            ] [Filter: All ▼] [Sort: Created ▼]      │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Name             Key (Masked)      Permissions   Created  Last  │   │
│  │                                                            Used  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Shopify          pk_live_••••X7K9  Read/Write    2d ago   1h    │   │
│  │ Integration      [📋 Copy]         Orders,       John S   ago   │   │
│  │                                     Products               [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WMS Sync         pk_live_••••B4M2  Read-only     5d ago   2d    │   │
│  │                  [📋 Copy]         Inventory     Sarah M  ago   │   │
│  │                                     Warehouse              [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Mobile App       pk_live_••••P8L1  Read/Write    12d ago  3h    │   │
│  │                  [📋 Copy]         Production,   John S   ago   │   │
│  │                                     Quality                [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Analytics        pk_live_••••R3N5  Read-only     18d ago  1d    │   │
│  │ Dashboard        [📋 Copy]         All modules   Mike T   ago   │   │
│  │                                                              [⋮]  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Legacy ERP       pk_live_••••K9W4  Read-only     45d ago  Never │   │
│  │ (Deprecated)     [📋 Copy]         Finance       Sarah M        │   │
│  │                                                  🔴 Revoked [⋮]  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 5 of 5 API keys                                              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details (full permissions, activity log)
  - Regenerate Key (confirmation + show new key once)
  - Revoke Key (confirmation, immediate invalidation)
  - Edit Name/Permissions
  - View Activity Log
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                            [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading API keys...                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                            [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────┤
│                          [🔑 Icon]                                    │
│                       No API Keys Created                             │
│       Create API keys to integrate external systems with MonoPilot.  │
│       Each key can have specific permissions for security control.   │
│                       [+ Create API Key]                              │
│                                                                       │
│       Need help? View API Documentation                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                            [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                    Failed to Load API Keys                            │
│        Unable to retrieve API keys. Check your connection.            │
│                    Error: API_KEYS_FETCH_FAILED                       │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Name, Masked Key + Copy button, Permissions (comma-separated), Created (relative time + creator), Last Used (relative time or "Never"), Status (badge: Active/Revoked), Actions menu
2. **Search/Filter Bar** - Text search (name), status filter (All/Active/Revoked), sort dropdown (Created, Name, Last Used)
3. **Create API Key Button** - Primary CTA (top-right), opens create modal with name + permission selection
4. **Masked Key Display** - Format: `pk_live_••••XXXX` (last 4 chars visible)
5. **Copy Button** - One-click copy full key to clipboard (toast confirmation: "API key copied")
6. **Permissions Column** - Read/Write or Read-only + module list (truncated if >2, hover for full list)
7. **Status Indicators** - Active (green dot), Revoked (red dot + "Revoked" badge)
8. **Actions Menu ([⋮])** - View Details, Regenerate, Revoke, Edit, Activity Log
9. **Relative Time** - "2d ago", "3h ago", "Never" (for last used)

---

## Main Actions

### Primary
- **[+ Create API Key]** - Opens modal (name, description, select permissions by module/scope) → generates key → shows key ONCE in modal (must copy immediately)

### Secondary (Row Actions)
- **View Details** - Opens panel/modal (full key details, complete permissions list, creation info, usage stats, activity log)
- **Copy Key** - Copies full key to clipboard (toast: "API key copied to clipboard")
- **Regenerate Key** - Confirmation dialog (warning: old key invalidated immediately) → generates new key → shows new key ONCE
- **Revoke Key** - Confirmation dialog (warning: permanent action, systems using this key will fail) → sets status to revoked → immediate invalidation
- **Edit Name/Permissions** - Opens edit modal (change name, description, adjust permissions) → cannot change key itself
- **View Activity Log** - Shows key usage history (API calls, timestamps, endpoints, IP addresses)

### Filters/Search
- **Search** - Real-time filter by key name
- **Filter by Status** - All, Active, Revoked
- **Sort** - Created (newest/oldest), Name (A-Z), Last Used (recent/never)

---

## States

- **Loading**: Skeleton rows (3), "Loading API keys..." text
- **Empty**: "No API keys created" message, "Create API key to integrate" explanation, "Create API Key" CTA + "View API Documentation" link
- **Error**: "Failed to load API keys" warning, error code, Retry + Contact Support buttons
- **Success**: Table with API key rows (active + revoked), search/filter controls, pagination if >20

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
- **Regeneration**: Old key invalidated immediately, new key generated with same permissions
- **Revocation**: Immediate invalidation, cannot be undone (must create new key)
- **Rate Limiting**: API calls limited per key (e.g., 1000 req/hour), show rate limit status in details
- **IP Whitelisting**: Optional IP restriction (future enhancement)

---

## Validation

- **Create**: Name required (max 100 chars), at least one permission scope selected
- **Edit**: Name required, permissions cannot all be removed (must have at least read access to 1 module)
- **Revoke**: Confirmation required ("Type REVOKE to confirm"), cannot revoke if it's the last active key (warning)
- **Regenerate**: Confirmation required, warns systems using old key will break immediately

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "API key: {name}, Created {time} by {user}, Last used {time}, Status: {status}, Permissions: {permissions}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Ctrl+C on focused row to copy key
- **Copy Feedback**: Visual + screen reader announcement "API key copied to clipboard"

---

## Related Screens

- **Create API Key Modal**: Opens from [+ Create API Key] button
- **Show API Key Once Modal**: Displays new key immediately after creation (copy warning)
- **Edit API Key Modal**: Opens from Actions menu → Edit Name/Permissions
- **Regenerate Confirmation**: Opens from Actions menu → Regenerate Key
- **Revoke Confirmation**: Opens from Actions menu → Revoke Key
- **API Key Details Panel**: Opens from Actions menu → View Details
- **Activity Log Panel**: Opens from Actions menu → View Activity Log

---

## Technical Notes

- **RLS**: API keys filtered by `org_id` automatically
- **API**:
  - `GET /api/settings/api-keys?search={query}&status={status}&sort={field}`
  - `POST /api/settings/api-keys` (create)
  - `PATCH /api/settings/api-keys/{id}` (edit name/permissions)
  - `POST /api/settings/api-keys/{id}/regenerate` (regenerate)
  - `POST /api/settings/api-keys/{id}/revoke` (revoke)
- **Key Generation**: `crypto.randomBytes(24).toString('base64url')` (32 chars)
- **Hash**: bcrypt with 10 rounds
- **Activity Log**: Track all API calls (endpoint, method, status, IP, timestamp) per key
- **Pagination**: 20 keys per page
- **Real-time**: Subscribe to key updates (revocations, new keys) via Supabase Realtime

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-023-api-keys-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
