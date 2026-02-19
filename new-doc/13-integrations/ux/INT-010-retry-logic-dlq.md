# INT-010: Retry Logic & Dead Letter Queue

**Module**: Integrations
**Feature**: Failed Message Management & Manual Retry
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dead Letter Queue (Failed Messages)                    [Clear Resolved]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search messages...        ] [Integration: All ▼] [Type: All ▼]             │
│  [Time Range: Last 7d ▼]                                  [🔄 Auto-refresh]  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Summary                                                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ❌ Failed: 12  |  ⏳ Retrying: 3  |  ✓ Resolved: 45 (last 24h)           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Time      Integration    Type        Error              Retries  Actions│ │
│  │                                                                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 14:23:45  Custom API     Webhook     401 Unauthorized   3/3      [⋮]   │ │
│  │ Jan 15                   Outbound    Auth failed        Failed          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 13:45:12  Shopify Store  Order Sync  429 Rate Limit     2/3      [⋮]   │ │
│  │ Jan 15                   Import      Retry in 5m        Retrying        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 13:30:09  EDI Partner    ORDERS      Parse error        1/3      [⋮]   │ │
│  │ Jan 15                   Inbound     Invalid segment    Retrying        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 12:58:21  Email Notif.   Email       SMTP timeout       3/3      [⋮]   │ │
│  │ Jan 15                   Outbound    Connection lost    Failed          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 12:15:44  Comarch ERP    Invoice     504 Gateway TO     2/3      [⋮]   │ │
│  │ Jan 15                   Export      Retry in 10m       Retrying        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 11:45:02  Webhook        Shipment    503 Service Down   3/3      [⋮]   │ │
│  │ Jan 15    ShipNotify     Outbound    Endpoint offline   Failed          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 6 of 12 failed messages                            [1] 2 [Next →]   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details (full error trace, payload)
  - Retry Now (manual retry, bypasses retry schedule)
  - Edit & Retry (modify payload before retry)
  - Mark as Resolved (remove from DLQ)
  - View Integration Logs (related messages)
  - Archive (move to archive, keep for audit)
```

### Failed Message Detail Modal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Failed Message Details: Custom API Webhook                    [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Message Information                                                       │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Message ID: DLQ-2026-001234              Status: ❌ Failed (3/3 retries) │ │
│  │ Integration: Custom API                  Type: Webhook Outbound          │ │
│  │ Event: order.created                     First Failed: Jan 15, 14:23:45  │ │
│  │ Last Retry: Jan 15, 14:35:12             Next Retry: None (max retries)  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Error Details                                                             │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Error Type: Authentication Error (401 Unauthorized)                       │ │
│  │ Error Message: Invalid bearer token - token may have expired             │ │
│  │                                                                           │ │
│  │ HTTP Response:                                                            │ │
│  │ {                                                                         │ │
│  │   "error": "unauthorized",                                                │ │
│  │   "message": "Bearer token is invalid or expired",                        │ │
│  │   "timestamp": "2026-01-15T14:23:45.123Z"                                 │ │
│  │ }                                                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Retry History                                                             │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Attempt  Time             Delay  Result                                  │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ 1        Jan 15, 14:23:45  0s    ❌ 401 Unauthorized                      │ │
│  │ 2        Jan 15, 14:28:45  5m    ❌ 401 Unauthorized                      │ │
│  │ 3        Jan 15, 14:35:12  10m   ❌ 401 Unauthorized                      │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Original Payload                                        [📋 Copy]         │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ {                                                                         │ │
│  │   "event": "order.created",                                               │ │
│  │   "timestamp": "2026-01-15T14:23:45.123Z",                                │ │
│  │   "data": {                                                               │ │
│  │     "order_id": "ORD-001234",                                             │ │
│  │     "customer": "ACME Corp",                                              │ │
│  │     "total": 1234.56                                                      │ │
│  │   }                                                                       │ │
│  │ }                                                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ℹ️  Suggested Fix: Update bearer token in Custom API integration settings.   │
│                                                                                │
│  [View Integration Settings]  [Edit & Retry]  [Retry Now]  [Mark Resolved]   │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Edit & Retry Modal

```
┌──────────────────────────────────────────┐
│  Edit & Retry Message          [X Close] │
├──────────────────────────────────────────┤
│                                          │
│  Message ID: DLQ-2026-001234             │
│  Integration: Custom API                 │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Edit Payload                       │  │
│  ├────────────────────────────────────┤  │
│  │ {                                  │  │
│  │   "event": "order.created",        │  │
│  │   "timestamp": "2026-01-15T...",   │  │
│  │   "data": {                        │  │
│  │     "order_id": "ORD-001234",      │  │
│  │     "customer": "ACME Corp",       │  │
│  │     "total": 1234.56               │  │
│  │   }                                │  │
│  │ }                                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ℹ️  Edit the payload if needed, then    │
│     retry. This will bypass retry        │
│     limits.                              │
│                                          │
│  [Cancel]              [Retry with Edit] │
│                                          │
└──────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dead Letter Queue (Failed Messages)                    [Clear Resolved]    │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Integration ▼] [Type ▼] [Time ▼]                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  Loading failed messages...                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dead Letter Queue (Failed Messages)                    [Clear Resolved]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [✅ Icon]                                            │
│                       No Failed Messages                                      │
│       All integrations are running smoothly.                                 │
│       Failed messages will appear here for manual review and retry.          │
│                                                                               │
│       View Integration Logs  |  View Dashboard                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dead Letter Queue (Failed Messages)                    [Clear Resolved]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load DLQ Messages                                │
│        Unable to retrieve failed messages. Check your connection.            │
│                    Error: DLQ_FETCH_FAILED                                    │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Summary Cards** - Failed count, Retrying count, Resolved count (last 24h)
2. **Data Table** - Timestamp, Integration name, Type, Error message, Retries (X/3), Status (Failed/Retrying), Actions menu
3. **Search/Filter Bar** - Text search (message ID, error message), integration filter, type filter, time range filter
4. **Auto-refresh Toggle** - Checkbox to enable/disable auto-refresh (every 30s)
5. **Clear Resolved Button** - Removes resolved messages from view (archives them)
6. **Status Badges** - ❌ Failed (red), ⏳ Retrying (yellow), ✓ Resolved (green)
7. **Message Detail Modal** - Full error details, retry history, original payload, suggested fix
8. **Edit & Retry Modal** - Editable JSON payload, retry button
9. **Retry History Table** - Attempt #, timestamp, delay, result (status code + message)

---

## Main Actions

### Primary
- **[Clear Resolved]** - Archives all resolved messages (removes from DLQ view)

### Secondary (Row Actions - via [⋮] menu)
- **View Details** - Opens message detail modal (full error trace, payload, retry history)
- **Retry Now** - Manually retries message immediately (bypasses retry schedule and max retry limit)
- **Edit & Retry** - Opens modal to edit payload before retrying (for fixing data issues)
- **Mark as Resolved** - Manually marks message as resolved (removes from DLQ)
- **View Integration Logs** - Opens INT-003 filtered to this integration
- **Archive** - Moves message to archive (keeps for audit, removes from active DLQ)

### Filters/Search
- **Search** - Real-time filter by message ID, integration name, error message
- **Filter by Integration** - Dropdown (All, or specific integration)
- **Filter by Type** - All, Webhook, API Call, EDI, Email, Export, Import
- **Filter by Time Range** - Last 1h, 24h, 7d, 30d, All

---

## States

- **Loading**: Skeleton rows (6), "Loading failed messages..." text
- **Empty**: "No failed messages" message (success state), links to logs/dashboard
- **Error**: "Failed to load DLQ messages" warning, error code, Retry + Contact Support
- **Success**: Summary cards + table with failed/retrying messages
- **Auto-refresh Active**: Visual indicator (spinning icon) when enabled
- **Retrying**: Status badge shows "Retrying" + countdown (e.g., "Retry in 5m")
- **Failed**: Status badge shows "Failed" + retry count (e.g., "3/3 retries")
- **Resolved**: Message removed from view (unless viewing archived)

---

## Data Fields

**DLQ Messages**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | DLQ message ID |
| integration_id | uuid | Integration reference |
| integration_name | string | Cached for display |
| message_type | enum | webhook, api_call, edi, email, export, import |
| direction | enum | inbound, outbound |
| event_type | string | Event name (e.g., "order.created") |
| status | enum | failed, retrying, resolved |
| error_type | string | Error category (auth, timeout, parse, validation, etc.) |
| error_message | text | Error description |
| error_response | jsonb | Full HTTP response (if applicable) |
| original_payload | jsonb | Original message payload |
| retry_count | integer | Number of retry attempts (0-3) |
| max_retries | integer | Max retry limit (default: 3) |
| first_failed_at | timestamp | First failure time |
| last_retry_at | timestamp | Last retry attempt time |
| next_retry_at | timestamp | Next scheduled retry time |
| retry_history | jsonb | Array of retry attempts (timestamp, delay, result) |
| resolved_at | timestamp | Resolution time (if resolved) |
| resolved_by | user_id | Who resolved (if manual) |

---

## Retry Logic

**Retry Schedule** (Exponential Backoff):
- Attempt 1: Immediate (0s delay)
- Attempt 2: 5 minutes delay
- Attempt 3: 15 minutes delay
- Attempt 4+: Manual retry only (moved to DLQ)

**Retry Conditions**:
- **Retry Automatically**: 429 Rate Limit, 503 Service Unavailable, 504 Gateway Timeout, Network timeout, Connection refused
- **Do Not Retry**: 401 Unauthorized, 403 Forbidden, 400 Bad Request, 404 Not Found, Parse errors (invalid payload)
- **Manual Retry Only**: After 3 failed attempts (moved to DLQ for manual review)

**Bypass Retry Limit**:
- **Retry Now**: Bypasses max retry limit (resets retry count)
- **Edit & Retry**: Allows editing payload before retry (bypasses limit)

---

## Validation

- **Edit Payload**: Must be valid JSON, max 100 KB
- **Mark as Resolved**: Confirmation required ("Are you sure? This will archive the message.")
- **Retry Now**: Confirmation if error is auth-related ("Fix authentication before retrying?")

---

## Accessibility

- **Touch targets**: All buttons/filters >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Row announces "Failed message from {integration} at {time}, Error: {error_message}, Retries: {count}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open detail modal
- **Error Feedback**: Screen reader announces "Message retried" or "Retry failed: {error}"

---

## Related Screens

- **INT-001**: Integrations Dashboard (Error Summary → View DLQ)
- **INT-003**: Integration Logs (View Integration Logs per failed message)
- **INT-004**: Webhook Configuration (webhook failures appear in DLQ)

---

## Technical Notes

- **RLS**: DLQ messages filtered by `org_id`
- **API**:
  - `GET /api/integrations/dlq?integration={id}&type={type}&time_range={range}&search={query}&page={N}`
  - `GET /api/integrations/dlq/{id}` (message details)
  - `POST /api/integrations/dlq/{id}/retry` (manual retry)
  - `POST /api/integrations/dlq/{id}/retry-with-edit` (edit payload + retry)
  - `POST /api/integrations/dlq/{id}/resolve` (mark as resolved)
  - `POST /api/integrations/dlq/{id}/archive` (archive message)
  - `POST /api/integrations/dlq/clear-resolved` (archive all resolved)
- **Queue**: BullMQ/Supabase Edge Functions for retry scheduling
- **Retry Scheduler**: Background job checks `next_retry_at` every minute
- **Real-time**: Subscribe to DLQ updates via Supabase Realtime
- **Pagination**: 20 messages per page
- **Auto-refresh**: Polls every 30s when enabled
- **Retention**: DLQ messages kept for 90 days, archived messages kept for 7 years (compliance)
- **Alerts**: Email/Slack notification when critical integration fails (configurable per integration)

---

**Status**: Draft - Ready for Review
