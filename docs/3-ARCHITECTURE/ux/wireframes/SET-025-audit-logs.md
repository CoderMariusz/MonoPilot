# SET-025: Audit Logs

**Module**: Settings
**Feature**: Audit Trail
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Audit Logs                                 [Export CSV]  │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search logs...        ] [User ▼] [Action ▼] [Entity ▼]          │
│  [Date: Last 7 days ▼]                                                │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Timestamp         User      Action  Entity      Details    IP  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 2025-12-11 14:23  Sarah M   DELETE  Machine     "Mixer-3"   ::1│   │
│  │ 14:23:45          Admin            ID: M-003    Removed     :ab│   │
│  │                                                             [>]│   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 2025-12-11 14:15  John D    UPDATE  Product     Price: $10  192│   │
│  │ 14:15:12          Manager          ID: P-042    → $12.50    .16│   │
│  │                                                  SKU:PRD-042 8.1│   │
│  │                                                             [>]│   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 2025-12-11 14:08  Mike T    CREATE  Warehouse   "WH-SOUTH"  192│   │
│  │ 14:08:33          Operator          ID: WH-005  Code:WH-005 .16│   │
│  │                                                             [>]│   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 2025-12-11 13:45  Sarah M   LOGIN   Session     Success     ::1│   │
│  │ 13:45:01          Admin            Duration:    IP: ::1     :ab│   │
│  │                                     38m                     [>]│   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 2025-12-11 12:30  John D    LOGOUT  Session     Duration:    192│   │
│  │ 12:30:18          Manager          2h 15m       IP: 192.16  .16│   │
│  │                                                  8.1.10      [>]│   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Showing 1-100 of 12,453 entries                      [Load More]    │
└─────────────────────────────────────────────────────────────────────┘

[>] Click row to expand full details:
  - Before/after values (UPDATE actions)
  - Full entity data (DELETE actions)
  - User agent, browser info
  - Session details
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Audit Logs                                 [Export CSV]  │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [User ▼] [Action ▼] [Entity ▼] [Date ▼]            │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │   │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading audit logs...                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Audit Logs                                 [Export CSV]  │
├─────────────────────────────────────────────────────────────────────┤
│                          [📋 Icon]                                    │
│                       No Audit Logs Found                             │
│      No activity recorded yet, or filters returned no results.        │
│      All user actions, logins, and data changes are logged here.      │
│                       [Clear Filters]                                 │
│                                                                       │
│       HACCP-compliant audit trail for regulatory compliance.          │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Audit Logs                                 [Export CSV]  │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                    Failed to Load Audit Logs                          │
│        Unable to retrieve audit logs. Check your connection.          │
│                    Error: AUDIT_LOGS_FETCH_FAILED                     │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table (Read-only)** - Timestamp (date + time), User (name + role badge), Action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT), Entity (type + ID), Details (summary of changes), IP Address (last octet visible)
2. **Search Bar** - Full-text search across all fields (user, entity, details)
3. **Filter Dropdowns** - User (multi-select), Action (multi-select: CREATE/UPDATE/DELETE/LOGIN/LOGOUT/LOGIN_FAILED/SESSION_EXPIRED), Entity Type (multi-select: Product/Warehouse/Machine/User/etc.)
4. **Date Range Filter** - Presets: Today, Last 7 days, Last 30 days, Custom range (date picker)
5. **Export CSV Button** - Downloads filtered results (respects active filters, max 10k rows per export)
6. **Expandable Row ([>])** - Click to reveal full details panel (before/after values, user agent, session info)
7. **Infinite Scroll** - Load 100 entries at a time, [Load More] button at bottom
8. **Timestamp Format** - "YYYY-MM-DD HH:mm" + milliseconds on expand
9. **IP Masking** - Last octet visible (e.g., 192.168.1.•••), full IP on expand (admin only)

---

## Main Actions

### Primary
- **[Export CSV]** - Exports filtered audit logs to CSV (columns: timestamp, user, action, entity_type, entity_id, details, IP, user_agent)

### Secondary
- **Search** - Real-time filter (debounced 300ms) across all text fields
- **Filter by User** - Multi-select dropdown (all users in org)
- **Filter by Action** - Multi-select: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, SESSION_EXPIRED
- **Filter by Entity** - Multi-select: Product, Warehouse, Machine, User, Role, Production Line, etc.
- **Filter by Date** - Presets (Today/7d/30d/90d/Custom)
- **Expand Row** - Click [>] to show full change details, before/after JSON diff, user agent, session ID
- **[Load More]** - Pagination, loads next 100 entries
- **[Clear Filters]** - Resets all filters to defaults (Last 7 days, All users/actions/entities)

### Read-only Features
- **No editing** - Audit logs are immutable
- **No deletion** - Logs cannot be deleted (retention policy handles archival)
- **No manual creation** - Logs generated automatically by system

---

## States

- **Loading**: Skeleton rows (5), "Loading audit logs..." text
- **Empty**: "No audit logs found" message, "Clear Filters" button if filters active, explanation of audit trail purpose (HACCP compliance)
- **Error**: "Failed to load audit logs" warning, error code, Retry + Contact Support buttons
- **Success**: Table with audit entries (100 per page), search/filter controls, infinite scroll [Load More], total entry count

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| org_id | uuid | Multi-tenant isolation |
| user_id | uuid | Actor (null for system actions) |
| action | enum | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, SESSION_EXPIRED |
| entity_type | string | products, warehouses, machines, users, etc. |
| entity_id | uuid | Reference to modified entity |
| changes | jsonb | Before/after values (UPDATE), created values (CREATE), deleted values (DELETE) |
| ip_address | inet | User IP address |
| user_agent | text | Browser/device info |
| session_id | uuid | Session reference |
| timestamp | timestamptz | Action time (UTC, millisecond precision) |
| metadata | jsonb | Additional context (e.g., failed login reason) |

---

## Change Tracking Format

**UPDATE Example**:
```json
{
  "before": {"price": 10.00, "sku": "PRD-042"},
  "after": {"price": 12.50, "sku": "PRD-042"},
  "changed_fields": ["price"]
}
```

**CREATE Example**:
```json
{
  "created": {"code": "WH-005", "name": "WH-SOUTH", "type": "Finished Goods"}
}
```

**DELETE Example**:
```json
{
  "deleted": {"code": "M-003", "name": "Mixer-3", "status": "active"}
}
```

**LOGIN_FAILED Example**:
```json
{
  "email": "user@example.com",
  "reason": "Invalid password",
  "attempt_count": 3
}
```

---

## Filters

| Filter | Options | Default |
|--------|---------|---------|
| Date Range | Today, 7d, 30d, 90d, Custom | Last 7 days |
| User | Multi-select (all org users) | All |
| Action | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, SESSION_EXPIRED | All |
| Entity Type | Product, Warehouse, Machine, User, Role, Line, etc. | All |
| Search | Full-text search | Empty |

**AND Logic**: All filters combine with AND (e.g., User=John AND Action=DELETE AND Date=Last 7 days)

---

## Export CSV Format

```csv
Timestamp,User,User Email,Action,Entity Type,Entity ID,Details,IP Address,User Agent
2025-12-11 14:23:45,Sarah Mitchell,sarah.m@company.com,DELETE,Machine,M-003,"Removed Mixer-3",192.168.1.10,Mozilla/5.0...
2025-12-11 14:15:12,John Doe,john.d@company.com,UPDATE,Product,P-042,"Price: $10.00 → $12.50",192.168.1.15,Chrome/120...
```

**Export Limits**:
- Max 10,000 rows per export
- If filtered results >10k, show warning: "Export limited to first 10,000 entries. Refine filters for complete export."
- Respects active filters
- Filename: `audit-logs-{org_name}-{YYYY-MM-DD}.csv`

---

## Security & Compliance

- **Immutability**: Audit logs cannot be edited or deleted (append-only)
- **Encryption**: Encrypted at rest (database-level)
- **Retention**: Default 3 years (configurable: 1y/3y/7y/indefinite)
- **HACCP Compliance**: Full traceability for food safety regulations
- **Access Control**: View audit logs requires `audit:read` permission (admin/manager roles)
- **IP Privacy**: Last octet masked by default, full IP visible to admins on expand
- **Sensitive Data Redaction**: Password hashes, API keys show as "[REDACTED]"

---

## Performance

- **Load Time**: <1s for 100 entries
- **Filter/Search**: <2s for 100k records (indexed on timestamp, user_id, entity_type, action)
- **Export**: <5s for 10k rows
- **Pagination**: Infinite scroll, 100 entries per load
- **Indexing**: Composite index on (org_id, timestamp DESC), separate indexes on user_id, entity_type, action

---

## Accessibility

- **Touch targets**: All buttons/filters >= 48x48dp
- **Contrast**: Text passes WCAG AA (4.5:1), action badges (CREATE/UPDATE/DELETE) use distinct colors
- **Screen reader**: Row announces "Timestamp {time}, User {name} performed {action} on {entity_type} ID {id}, IP {ip}"
- **Keyboard**: Tab navigation, Enter to expand row, Ctrl+F for search focus
- **Expandable Details**: Arrow keys to navigate expanded panels

---

## Related Screens

- **Audit Log Details Panel**: Opens when clicking [>] on a row (full change diff, user agent, session details)
- **Export Progress Modal**: Shows CSV generation progress (for large exports)
- **Date Range Picker**: Custom date range selection modal

---

## Technical Notes

- **RLS**: Audit logs filtered by `org_id` automatically (users can only see their org's logs)
- **API**:
  - `GET /api/settings/audit-logs?search={query}&user_id={id}&action={action}&entity_type={type}&date_from={date}&date_to={date}&limit=100&offset=0`
  - `GET /api/settings/audit-logs/export?[same_filters]` (returns CSV)
- **Database**: `audit_logs` table (partitioned by month for performance)
- **Real-time**: No real-time updates (static snapshot on load, manual refresh to see new entries)
- **Pagination**: Offset-based (limit=100, offset increments by 100)
- **Search**: PostgreSQL `ts_vector` full-text search on changes JSON + entity metadata
- **Change Tracking**: Triggered by DB triggers on UPDATE/DELETE, middleware on CREATE/LOGIN/LOGOUT

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-025-audit-logs]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
