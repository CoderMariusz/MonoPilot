# INT-002: API Keys Management

**Module**: Integrations
**Feature**: API Keys & Authentication
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > API Keys                                [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search keys...            ] [Filter: All ▼] [Sort: Created ▼]              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Name             Key (Masked)      Scopes       Expires     Last Used   │ │
│  │                                                                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Shopify          pk_live_••••X7K9  orders:rw    Dec 20      1h ago      │ │
│  │ Integration      [📋 Copy]         products:r   2026        John S      │ │
│  │                                     inventory:r ⚠️ 5 days   [⋮]         │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Mobile App       pk_live_••••P8L1  production:  Mar 15      3h ago      │ │
│  │ Warehouse        [📋 Copy]         rw, quality: 2026        Sarah M     │ │
│  │                                     rw, wh:rw              [⋮]          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Analytics        pk_live_••••R3N5  all:r        Never       1d ago      │ │
│  │ Dashboard        [📋 Copy]         (Read-only)  (No expiry) Mike T      │ │
│  │                                                             [⋮]          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Comarch ERP      pk_live_••••K9W4  finance:rw   Jun 30      2h ago      │ │
│  │ Integration      [📋 Copy]         orders:r     2026        System      │ │
│  │                                                             [⋮]          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Legacy API       pk_live_••••B2X7  orders:r     Never       Never       │ │
│  │ (Deprecated)     [📋 Copy]         products:r   (No expiry) used        │ │
│  │                                                  🔴 Revoked  [⋮]         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 5 API keys                                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details (scopes breakdown, rate limits, activity)
  - Regenerate Key (confirmation + show new key once)
  - Revoke Key (immediate invalidation)
  - Edit Scopes/Expiration
  - View Activity Log
  - Test API Key (validation tool)
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > API Keys                                [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  Loading API keys...                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > API Keys                                [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [🔑 Icon]                                            │
│                       No API Keys Created                                     │
│       Create API keys to integrate external systems with MonoPilot.          │
│       Each key can have specific scopes (permissions) and expiration.        │
│                                                                               │
│                       [+ Create API Key]                                      │
│                                                                               │
│       View API Documentation  |  See Integration Examples                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > API Keys                                [+ Create API Key]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load API Keys                                    │
│        Unable to retrieve API keys. Check your connection.                    │
│                    Error: API_KEYS_FETCH_FAILED                               │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Create API Key Modal

```
┌──────────────────────────────────────────┐
│  Create API Key                 [X Close] │
├──────────────────────────────────────────┤
│                                          │
│  Key Name *                              │
│  [Shopify Integration____________]       │
│                                          │
│  Description (optional)                  │
│  [For syncing orders and products_____]  │
│  [__________________________________]    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Scopes (Permissions) *             │  │
│  ├────────────────────────────────────┤  │
│  │ ☑ Orders                           │  │
│  │   ☑ Read   ☑ Write                 │  │
│  │ ☑ Products                         │  │
│  │   ☑ Read   ☐ Write                 │  │
│  │ ☑ Inventory                        │  │
│  │   ☑ Read   ☐ Write                 │  │
│  │ ☐ Production                       │  │
│  │ ☐ Quality                          │  │
│  │ ☐ Warehouse                        │  │
│  │ ☐ Shipping                         │  │
│  │ ☐ Finance                          │  │
│  │                                    │  │
│  │ [Select All Read] [Select All RW]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Expiration (optional)                   │
│  ○ Never expires                         │
│  ● Set expiration date                   │
│  [Dec 20, 2026________________] 📅       │
│                                          │
│  Rate Limit                              │
│  [1000___] requests per hour             │
│  (Leave blank for unlimited)             │
│                                          │
│  [Cancel]              [Create API Key]  │
│                                          │
└──────────────────────────────────────────┘
```

---

## Show API Key Once Modal

```
┌──────────────────────────────────────────┐
│  API Key Created                [X Close] │
├──────────────────────────────────────────┤
│                                          │
│  ⚠️ Copy this key now. You won't see it  │
│     again after closing this window.     │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ pk_live_aB3dE5fG7hI9jK1lM2nO3pQ4  │  │
│  │ rS5tU6vW                           │  │
│  │                      [📋 Copy Key]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Key Name: Shopify Integration           │
│  Created: Jan 15, 2026 at 14:23          │
│  Expires: Dec 20, 2026                   │
│                                          │
│  Scopes:                                 │
│  - orders:read, orders:write             │
│  - products:read                         │
│  - inventory:read                        │
│                                          │
│  ✓ Key copied to clipboard               │
│                                          │
│  [I've Copied the Key - Close]           │
│                                          │
└──────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Name, Masked Key + Copy button, Scopes (abbreviated), Expires (date or "Never"), Last Used (relative time), Status (Active/Revoked), Actions menu
2. **Search/Filter Bar** - Text search (name), status filter (All/Active/Revoked), sort (Created, Name, Last Used, Expires)
3. **Create API Key Button** - Primary CTA, opens modal with name + scope checkboxes + expiration + rate limit
4. **Masked Key Display** - Format: `pk_live_••••XXXX` (last 4 chars visible)
5. **Copy Button** - One-click copy, toast confirmation "API key copied"
6. **Scopes Column** - Abbreviated format (e.g., "orders:rw, products:r"), hover for full list
7. **Expiration Warning** - ⚠️ icon if expiring within 30 days
8. **Show Key Once Modal** - Displays full key after creation (one-time view)
9. **Scope Selector** - Hierarchical checkboxes (module → read/write), quick select buttons
10. **Test API Key Tool** - Validates key with test API call (from actions menu)

---

## Main Actions

### Primary
- **[+ Create API Key]** - Opens modal → select scopes, set expiration/rate limit → generates key → shows key ONCE

### Secondary (Row Actions)
- **Copy Key** - Copies full key to clipboard (toast: "API key copied")
- **View Details** - Opens panel/modal (full scopes, rate limit status, usage stats, activity log)
- **Regenerate Key** - Confirmation → generates new key → shows new key ONCE (old key invalidated)
- **Revoke Key** - Confirmation → immediate invalidation (cannot be undone)
- **Edit Scopes/Expiration** - Opens edit modal (adjust scopes, extend/remove expiration)
- **Test API Key** - Makes test API call to validate key (shows result modal)
- **View Activity Log** - Shows API call history for this key

### Filters/Search
- **Search** - Real-time filter by key name
- **Filter by Status** - All, Active, Revoked
- **Sort** - Created (newest/oldest), Name (A-Z), Last Used, Expires (soonest first)

---

## States

- **Loading**: Skeleton rows (4), "Loading API keys..." text
- **Empty**: "No API keys created" message, explanation, "Create API Key" CTA + documentation links
- **Error**: "Failed to load API keys" warning, error code, Retry + Contact Support
- **Success**: Table with API key rows, search/filter controls, pagination if >20
- **Expiration Warning**: ⚠️ indicator where expires_at < today + 30 days
- **Rate Limit Alert**: In View Details, color-coded (Green <50%, Yellow 50-80%, Red >80%)

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | User-friendly name |
| description | text | Optional description |
| key_prefix | string | "pk_live_" (production) or "pk_test_" (sandbox) |
| key_hash | string | Hashed key (bcrypt), never show after creation |
| key_last4 | string | Last 4 chars for display |
| scopes | jsonb | {module: [permissions]} e.g., {"orders": ["read", "write"]} |
| status | enum | active, revoked |
| expires_at | timestamp | Expiration date (nullable = never) |
| rate_limit_per_hour | integer | API call limit (nullable = unlimited) |
| current_usage_count | integer | API calls this hour |
| last_used_at | timestamp | Last API call time |
| created_at | timestamp | Creation time |
| created_by | user_id | Creator |

---

## Scopes Structure

**Available Scopes** (module-based):
```json
{
  "orders": ["read", "write"],
  "products": ["read", "write"],
  "inventory": ["read", "write"],
  "production": ["read", "write"],
  "quality": ["read", "write"],
  "warehouse": ["read", "write"],
  "shipping": ["read", "write"],
  "finance": ["read", "write"],
  "all": ["read"]  // Special: read-only to all modules
}
```

**Display Format**:
- Table: "orders:rw, products:r" (abbreviated)
- Details: "orders:read, orders:write, products:read" (expanded)
- Modal: Checkboxes grouped by module

---

## Validation

- **Create**: Name required (max 100 chars), at least one scope selected, expiration must be future date
- **Edit**: Name required, at least one scope must remain, expiration can be extended or removed
- **Revoke**: Confirmation required ("Type REVOKE to confirm"), warn if last active key
- **Regenerate**: Confirmation, warn old key invalidated immediately
- **Rate Limit**: Positive integer or null (unlimited)

---

## Accessibility

- **Touch targets**: All buttons/checkboxes >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Row announces "API key: {name}, Created {time}, Scopes: {scopes}, Expires: {date or 'Never'}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to copy key, Space to toggle checkboxes
- **Copy Feedback**: Visual + screen reader "API key copied to clipboard"
- **Warning Indicators**: Screen reader announces "Warning: expires in {N} days"

---

## Related Screens

- **INT-001**: Integrations Dashboard (links to API Keys)
- **INT-003**: Integration Logs (View Activity Log per key)

---

## Technical Notes

- **RLS**: API keys filtered by `org_id`
- **API**:
  - `GET /api/integrations/api-keys?search={query}&status={status}&sort={field}`
  - `POST /api/integrations/api-keys` (create with scopes, expiration, rate limit)
  - `PATCH /api/integrations/api-keys/{id}` (edit name/scopes/expiration)
  - `POST /api/integrations/api-keys/{id}/regenerate`
  - `POST /api/integrations/api-keys/{id}/revoke`
  - `POST /api/integrations/api-keys/{id}/test` (validate key)
  - `GET /api/integrations/api-keys/{id}/usage-stats`
- **Key Generation**: `crypto.randomBytes(24).toString('base64url')` (32 chars)
- **Hash**: bcrypt (10 rounds)
- **Expiration Check**: Background job hourly + check on every API call
- **Rate Limiting**: Track in Redis with hourly window, return 429 when exceeded
- **Real-time**: Subscribe to key updates via Supabase Realtime

---

**Status**: Draft - Ready for Review
