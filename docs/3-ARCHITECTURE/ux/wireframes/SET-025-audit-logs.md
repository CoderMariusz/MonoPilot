# SET-025: Audit Logs

**Module**: Settings
**Feature**: Audit Trail
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State (Main Audit Logs View)

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
│                                                                       │
│  [⚙ Admin Settings] [🔔 Critical Alerts]  [⏱ Retention Policy]       │
└─────────────────────────────────────────────────────────────────────┘
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

## Screen 2: Retention Policy Configuration (Admin Only)

**Access**: Admin role only - Click [⏱ Retention Policy] button on main screen

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Retention Policy Configuration                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Audit Log Retention Period                                          │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                       │
│  Current Setting: 3 Years (36 months)                                │
│                                                                       │
│  Select Retention Duration:                                          │
│                                                                       │
│    ( ) 1 Year   - Cost: ~$50/month  [Minimal compliance]             │
│    (●) 3 Years  - Cost: ~$150/month [✓ Recommended for most orgs]    │
│    ( ) 5 Years  - Cost: ~$250/month [FDA/FSMA compliance]            │
│    ( ) 10 Years - Cost: ~$500/month [Long-term audit trail]          │
│    ( ) Indefinite - Cost: ~$1000/month [Permanent archival]          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚠ WARNING                                                  │   │
│  │ Changing retention policy affects storage costs and will   │   │
│  │ apply to new logs only. Existing logs beyond the new       │   │
│  │ retention period will be archived to cold storage.         │   │
│  │                                                             │   │
│  │ Logs older than retention period are NOT deleted but are   │   │
│  │ moved to cold storage (recoverable within 30 days).        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Archival Strategy:                                                  │
│    [✓] Archive to cold storage (S3 Glacier)                          │
│    [✓] Maintain 30-day recovery window                               │
│    [ ] Auto-delete after recovery window (GDPR)                      │
│                                                                       │
│  Last Policy Change: 2025-11-15 by System Admin                      │
│  Next Review Date:   2025-12-15 (recommended quarterly)              │
│                                                                       │
│                              [Save Changes] [Cancel]                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Loading State (Policy Fetch)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Retention Policy Configuration                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [████████████░░░░░░░░░░░░░░░░░░░]                                   │
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░]                                  │
│  [████████████████░░░░░░░░░░░░░░░░]                                  │
│                                                                       │
│  Loading retention policy...                                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State (Policy Load Error)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Retention Policy Configuration                                      │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│              Failed to Load Retention Policy                          │
│      Unable to retrieve current policy settings. Try again.           │
│                 Error: RETENTION_POLICY_FETCH_FAILED                  │
│                       [Retry]  [Cancel]                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Success State (After Save)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         [✓ Success]                                  │
│                                                                       │
│          Retention Policy Updated Successfully                        │
│   New setting will apply to logs generated after today.              │
│          Confirmation sent to admin@company.com                      │
│                                                                       │
│                           [Close]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screen 3: Critical Event Alerts Configuration (Admin Only)

**Access**: Admin role only - Click [🔔 Critical Alerts] button on main screen

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Critical Event Alerting                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Configure alerts for high-priority security and compliance events.  │
│  Alerts are sent to configured recipients in real-time.              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ EVENT ALERTS (Enable/Disable)                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ [✓] Failed Login Attempts (Critical)                        │   │
│  │     Trigger: >5 failed attempts in 1 hour                   │   │
│  │     Recipients: Admin email, Slack #security                │   │
│  │     Last Alert: 2025-12-11 14:30 (3 failed attempts)       │   │
│  │     [View Details]                                          │   │
│  │                                                             │   │
│  │ [✓] Permission Changes (High)                               │   │
│  │     Trigger: Any user role/permission modification          │   │
│  │     Recipients: Admin email, Slack #security                │   │
│  │     Last Alert: 2025-12-10 09:15 (John granted Manager)    │   │
│  │     [View Details]                                          │   │
│  │                                                             │   │
│  │ [✓] Data Exports (Medium)                                   │   │
│  │     Trigger: Audit logs or user data exported               │   │
│  │     Recipients: Admin email                                 │   │
│  │     Last Alert: 2025-12-08 16:45 (CSV export by Admin)     │   │
│  │     [View Details]                                          │   │
│  │                                                             │   │
│  │ [ ] Mass Deletions (High)                                   │   │
│  │     Trigger: >10 entities deleted in 1 hour                 │   │
│  │     Recipients: Admin email, Slack #security                │   │
│  │     [Configure]                                             │   │
│  │                                                             │   │
│  │ [ ] API Key Creation (Medium)                               │   │
│  │     Trigger: New API key generated                          │   │
│  │     Recipients: Admin email                                 │   │
│  │     [Configure]                                             │   │
│  │                                                             │   │
│  │ [ ] System Configuration Changes (High)                     │   │
│  │     Trigger: Settings, integrations, or policies modified   │   │
│  │     Recipients: Admin email, Slack #security                │   │
│  │     [Configure]                                             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ NOTIFICATION RECIPIENTS                                    │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │ Email Recipients:                                           │   │
│  │ [✓] admin@company.com                       [Remove]        │   │
│  │ [✓] security@company.com                    [Remove]        │   │
│  │ [ ] finance@company.com                     [Remove]        │   │
│  │                                                             │   │
│  │ Add Email: [security-team@company.com        ] [+ Add]      │   │
│  │                                                             │   │
│  │ Slack Integration:                                          │   │
│  │ [✓] #security webhook connected (2025-12-01)              │   │
│  │     Endpoint: https://hooks.slack.com/...                  │   │
│  │     [Test Message] [Disconnect]                            │   │
│  │                                                             │   │
│  │ Add Slack Webhook:                                          │   │
│  │ [https://hooks.slack.com/services/... ] [+ Connect]        │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                           [Save Settings] [Cancel]                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Critical Event Alerting                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [████████████░░░░░░░░░░░░░░░░░░░]                                   │
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░]                                  │
│  [████████████████░░░░░░░░░░░░░░░░]                                  │
│                                                                       │
│  Loading alert configuration...                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Critical Event Alerting                                             │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│              Failed to Load Alert Configuration                       │
│      Unable to retrieve alert settings. Check your connection.        │
│                Error: ALERT_CONFIG_FETCH_FAILED                       │
│                       [Retry]  [Cancel]                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Success State (After Save)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         [✓ Success]                                  │
│                                                                       │
│            Critical Alert Settings Updated Successfully              │
│      All enabled alerts will trigger upon event conditions.          │
│      Confirmation sent to admin@company.com                          │
│                                                                       │
│                           [Close]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### Main Audit Logs Screen
1. **Data Table (Read-only)** - Timestamp (date + time), User (name + role badge), Action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT), Entity (type + ID), Details (summary of changes), IP Address (last octet visible)
2. **Search Bar** - Full-text search across all fields (user, entity, details)
3. **Filter Dropdowns** - User (multi-select), Action (multi-select: CREATE/UPDATE/DELETE/LOGIN/LOGOUT/LOGIN_FAILED/SESSION_EXPIRED), Entity Type (multi-select: Product/Warehouse/Machine/User/etc.)
4. **Date Range Filter** - Presets: Today, Last 7 days, Last 30 days, Custom range (date picker)
5. **Export CSV Button** - Downloads filtered results (respects active filters, max 10k rows per export)
6. **Expandable Row ([>])** - Click to reveal full details panel (before/after values, user agent, session info)
7. **Infinite Scroll** - Load 100 entries at a time, [Load More] button at bottom
8. **Timestamp Format** - "YYYY-MM-DD HH:mm" + milliseconds on expand
9. **IP Masking** - Last octet visible (e.g., 192.168.1.•••), full IP on expand (admin only)

### Retention Policy Screen (Admin Only - FR-SET-145)
1. **Current Setting Display** - Shows active retention period and estimated monthly cost
2. **Radio Button Options** - 1yr, 3yr, 5yr, 10yr, Indefinite (with compliance notes)
3. **Warning Box** - Explains impact on storage costs and archive behavior
4. **Archival Strategy Checkboxes** - Cold storage (S3 Glacier), recovery window, GDPR auto-delete
5. **Policy Change Audit Trail** - Shows when last changed and by whom
6. **Save/Cancel Buttons** - Apply or discard retention policy changes

### Critical Event Alerts Screen (Admin Only - FR-SET-146)
1. **Event Alert Toggles** - Enable/disable per-event alerting (Failed Logins, Permission Changes, Data Exports, Mass Deletions, API Key Creation, System Config Changes)
2. **Threshold Configuration** - Customize trigger conditions (e.g., >5 failed attempts in 1 hour)
3. **Alert History** - Show last alert time and context for each enabled event
4. **Email Recipients** - Multi-select with add/remove actions, email validation
5. **Slack Integration** - Webhook URL input, test message button, connection status
6. **Notification Preview** - Show how alerts will appear in email/Slack

---

## Main Actions

### Primary (Audit Logs Main Screen)
- **[Export CSV]** - Exports filtered audit logs to CSV (columns: timestamp, user, action, entity_type, entity_id, details, IP, user_agent)
- **[⏱ Retention Policy]** - Opens modal to configure audit log retention period (Admin only)
- **[🔔 Critical Alerts]** - Opens modal to configure critical event alerting (Admin only)

### Secondary (Audit Logs Main Screen)
- **Search** - Real-time filter (debounced 300ms) across all text fields
- **Filter by User** - Multi-select dropdown (all users in org)
- **Filter by Action** - Multi-select: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, SESSION_EXPIRED
- **Filter by Entity** - Multi-select: Product, Warehouse, Machine, User, Role, Production Line, etc.
- **Filter by Date** - Presets (Today/7d/30d/90d/Custom)
- **Expand Row** - Click [>] to show full change details, before/after JSON diff, user agent, session ID
- **[Load More]** - Pagination, loads next 100 entries
- **[Clear Filters]** - Resets all filters to defaults (Last 7 days, All users/actions/entities)

### Retention Policy (Admin Only - FR-SET-145)
- **Select Retention Duration** - Radio button: 1yr, 3yr, 5yr, 10yr, Indefinite
- **Configure Archival Strategy** - Checkboxes: Cold storage, recovery window, GDPR auto-delete
- **[Save Changes]** - Apply new retention policy, confirm via email
- **[Cancel]** - Discard retention policy changes

### Critical Event Alerts (Admin Only - FR-SET-146)
- **Toggle Event Alerts** - Enable/disable per alert type (Failed Logins, Permission Changes, Data Exports, etc.)
- **Add Email Recipient** - Input email, validate, add to recipients list
- **Remove Email Recipient** - Click [Remove] to delete from notification list
- **Connect Slack Webhook** - Input Slack webhook URL, test connection, display status
- **[Test Message]** - Send test alert to Slack to verify integration
- **[Disconnect]** - Remove Slack webhook integration
- **[Save Settings]** - Apply alert configuration changes
- **[Cancel]** - Discard alert configuration changes

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

### Retention Policy Fields

| Field | Type | Notes |
|-------|------|-------|
| org_id | uuid | Multi-tenant isolation |
| retention_years | int | 1, 3, 5, 10, or null (indefinite) |
| retention_months | int | Computed: retention_years * 12 |
| archive_strategy | enum | cold_storage, delete_after_recovery, indefinite |
| recovery_window_days | int | Default: 30 days for cold storage recovery |
| gdpr_auto_delete | boolean | Automatically delete after recovery window (GDPR) |
| last_updated_by | uuid | Admin user ID |
| last_updated_at | timestamptz | When policy was last changed |
| estimated_monthly_cost | decimal | Estimated storage cost in USD |

### Critical Alert Configuration Fields

| Field | Type | Notes |
|-------|------|-------|
| org_id | uuid | Multi-tenant isolation |
| alert_type | enum | failed_login, permission_change, data_export, mass_deletion, api_key_creation, system_config_change |
| enabled | boolean | Whether alert is active |
| threshold | jsonb | Trigger conditions (e.g., {"max_attempts": 5, "window_minutes": 60}) |
| email_recipients | jsonb | Array of email addresses |
| slack_webhook_url | text | Encrypted Slack webhook URL |
| slack_channel | text | Target Slack channel |
| last_triggered_at | timestamptz | Timestamp of last alert |
| last_triggered_context | jsonb | Details of last trigger event |
| created_by | uuid | Admin user ID |
| created_at | timestamptz | When alert config created |

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
- **Encryption**: Encrypted at rest (database-level), Slack webhooks encrypted
- **Retention**: Default 3 years (configurable: 1y/3y/5y/10y/indefinite) via Admin panel (FR-SET-145)
- **Cold Storage**: Old logs moved to S3 Glacier, recoverable for 30 days
- **HACCP Compliance**: Full traceability for food safety regulations
- **Access Control**:
  - View audit logs requires `audit:read` permission (admin/manager roles)
  - Retention policy configuration requires `audit:manage` permission (admin only)
  - Critical alerts configuration requires `audit:alerts` permission (admin only)
- **IP Privacy**: Last octet masked by default, full IP visible to admins on expand
- **Sensitive Data Redaction**: Password hashes, API keys show as "[REDACTED]"
- **Critical Event Alerts**: Real-time notifications for security events (Failed Logins >5 in 1h, Permission Changes, Data Exports) (FR-SET-146)

---

## Performance

- **Load Time**: <1s for 100 entries
- **Filter/Search**: <2s for 100k records (indexed on timestamp, user_id, entity_type, action)
- **Export**: <5s for 10k rows
- **Pagination**: Infinite scroll, 100 entries per load
- **Indexing**: Composite index on (org_id, timestamp DESC), separate indexes on user_id, entity_type, action
- **Alert Trigger**: <5 seconds from event occurrence to notification delivery

---

## Accessibility

- **Touch targets**: All buttons/filters >= 48x48dp
- **Contrast**: Text passes WCAG AA (4.5:1), action badges (CREATE/UPDATE/DELETE) use distinct colors
- **Screen reader**: Row announces "Timestamp {time}, User {name} performed {action} on {entity_type} ID {id}, IP {ip}"
- **Keyboard**: Tab navigation, Enter to expand row, Ctrl+F for search focus
- **Expandable Details**: Arrow keys to navigate expanded panels
- **Modal Accessibility**: Retention policy and alert config modals have proper focus management, close buttons, escape key to dismiss

---

## Related Screens

- **Audit Log Details Panel**: Opens when clicking [>] on a row (full change diff, user agent, session details)
- **Export Progress Modal**: Shows CSV generation progress (for large exports)
- **Date Range Picker**: Custom date range selection modal
- **Retention Policy Modal**: Admin-only configuration for log retention periods (FR-SET-145)
- **Critical Alerts Modal**: Admin-only configuration for security event notifications (FR-SET-146)
- **Slack Test Modal**: Confirmation and status for Slack webhook test message

---

## Technical Notes

### Audit Logs
- **RLS**: Audit logs filtered by `org_id` automatically (users can only see their org's logs)
- **API**:
  - `GET /api/settings/audit-logs?search={query}&user_id={id}&action={action}&entity_type={type}&date_from={date}&date_to={date}&limit=100&offset=0`
  - `GET /api/settings/audit-logs/export?[same_filters]` (returns CSV)
  - `GET /api/settings/audit-logs/retention-policy` (Admin only, FR-SET-145)
  - `PUT /api/settings/audit-logs/retention-policy` (Admin only, FR-SET-145)
  - `GET /api/settings/audit-logs/critical-alerts` (Admin only, FR-SET-146)
  - `PUT /api/settings/audit-logs/critical-alerts` (Admin only, FR-SET-146)
  - `POST /api/settings/audit-logs/critical-alerts/test-slack` (Admin only, test Slack webhook)
- **Database**: `audit_logs` table (partitioned by month for performance)
- **Real-time**: No real-time updates (static snapshot on load, manual refresh to see new entries)
- **Pagination**: Offset-based (limit=100, offset increments by 100)
- **Search**: PostgreSQL `ts_vector` full-text search on changes JSON + entity metadata
- **Change Tracking**: Triggered by DB triggers on UPDATE/DELETE, middleware on CREATE/LOGIN/LOGOUT

### Retention Policy (FR-SET-145)
- **Table**: `audit_log_retention_policy` (one record per org)
- **RLS**: Admin-only access via `audit:manage` permission
- **Cold Storage**: Triggered via pg_cron job, moves logs older than retention period to S3 Glacier
- **Cost Estimation**: Calculated based on current log volume and retention duration
- **Audit Trail**: All policy changes logged in `audit_logs` table with `action: SYSTEM_CONFIG_CHANGE`

### Critical Event Alerting (FR-SET-146)
- **Table**: `audit_critical_alert_config` (one record per org per event type)
- **RLS**: Admin-only access via `audit:alerts` permission
- **Trigger Mechanism**:
  - Failed logins: Checked in auth middleware, increments counter, triggers if >5 in 1h
  - Permission changes: Triggered by UPDATE on `user_roles` table
  - Data exports: Triggered by CSV export action
  - Mass deletions: Triggered when >10 entities deleted in 1h window
  - API key creation: Triggered in API key generation function
  - System config changes: Triggered on settings updates
- **Notification Delivery**:
  - Email: Via SendGrid with templated alerts, 2-minute batch window
  - Slack: Via webhook, immediate delivery with retry logic
- **Slack Integration**: Webhook URL encrypted at rest, decrypted on-demand for sends
- **Alert Throttling**: Max 1 alert per event type per 5 minutes (prevents alert spam)

---

## Permissions Matrix

| Action | Guest | Operator | Manager | Admin |
|--------|-------|----------|---------|-------|
| View Audit Logs | ✗ | ✗ | ✓ (org only) | ✓ (org only) |
| Search/Filter Logs | ✗ | ✗ | ✓ | ✓ |
| Export Logs (CSV) | ✗ | ✗ | ✓ | ✓ |
| Configure Retention Policy | ✗ | ✗ | ✗ | ✓ |
| Configure Critical Alerts | ✗ | ✗ | ✗ | ✓ |
| View Alert History | ✗ | ✗ | ✗ | ✓ |
| Test Slack Integration | ✗ | ✗ | ✗ | ✓ |

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-025-audit-logs (main), SET-025-retention-policy (admin), SET-025-critical-alerts (admin)]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff - FR-SET-145 (Retention Policy) and FR-SET-146 (Critical Event Alerts) compliance complete
