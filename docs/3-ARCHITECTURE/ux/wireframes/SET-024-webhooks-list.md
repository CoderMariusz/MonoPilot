# SET-024: Webhooks List

**Module**: Settings
**Feature**: Webhook Management (Integrations)
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Webhooks                              [+ Add Webhook]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Search webhooks...            ] [Filter: All ▼] [Sort: Name ▼]     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Name         URL                Events      Last Triggered     │   │
│  │              Status                                            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ERP Sync     https://erp.example.com/webhooks   5 events       │   │
│  │  ✓ Active    (Production)       2025-12-11 14:32    200 OK [⋮]│   │
│  │              work_order.created, work_order.completed,         │   │
│  │              inventory.updated, shipment.dispatched...         │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ WMS Notify   https://wms.company.io/api/events   3 events      │   │
│  │  ✓ Active    (Warehouse)        2025-12-11 08:15    200 OK [⋮]│   │
│  │              inventory.updated, lot.created,                   │   │
│  │              material.reserved                                 │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ QC Alert     https://qa.internal.com/hooks      2 events       │   │
│  │  ✓ Active    (Quality)          2025-12-10 16:45    200 OK [⋮]│   │
│  │              quality.failed, quality.hold                      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Shipping     https://3pl.logistics.com/notify   1 event        │   │
│  │  ⚠ Disabled  (Logistics)        2025-12-05 11:22    200 OK [⋮]│   │
│  │              shipment.dispatched                               │   │
│  │              Disabled 2025-12-08 by Jane Doe (Testing)         │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Test Hook    https://webhook.site/abc123       8 events        │   │
│  │  ⨯ Error     (Development)      2025-12-11 12:10    500 ERR [⋮]│   │
│  │              All production events subscribed                  │   │
│  │              Last error: Connection timeout (retry 3/3 failed) │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Showing 5 of 5 webhooks                                [1] [2] [>]  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Webhook
  - Test Webhook (sends test event)
  - View Logs (delivery history)
  - Disable / Enable Webhook
  - Delete Webhook
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Webhooks                              [+ Add Webhook]    │
├─────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Filter ▼] [Sort ▼]                                │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading webhooks...                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Webhooks                              [+ Add Webhook]    │
├─────────────────────────────────────────────────────────────────────┤
│                          [🔔 Icon]                                    │
│                     No Webhooks Configured                            │
│      Connect external systems to receive real-time event updates.    │
│         Webhooks notify your systems when events occur in MonoPilot. │
│                        [+ Add Webhook]                                │
│                                                                       │
│         Available events: production, inventory, quality,             │
│         shipping, and more.                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Webhooks                              [+ Add Webhook]    │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                  Failed to Load Webhooks                              │
│       Unable to retrieve webhook list. Check your connection.        │
│                   Error: WEBHOOK_FETCH_FAILED                        │
│                       [Retry]  [Contact Support]                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Name, URL (truncated), Event count, Last triggered (timestamp + HTTP status), Status badge, Actions menu
2. **Search/Filter Bar** - Text search (name/URL), status filter (All/Active/Disabled/Error), sort dropdown
3. **Add Webhook Button** - Primary CTA (top-right), opens create modal
4. **Actions Menu ([⋮])** - Edit, Test, View Logs, Disable/Enable, Delete
5. **Status Badges** - Active (✓ green), Disabled (⚠ gray), Error (⨯ red)
6. **Event List** - Second row shows subscribed events (truncated with "...")
7. **Last Triggered** - Timestamp + HTTP response code (200 OK, 500 ERR, etc.)
8. **Error Info** - Third row for error status (last error message + retry count)
9. **Category Tags** - (Production), (Warehouse), (Quality), etc. - visual grouping

---

## Main Actions

### Primary
- **[+ Add Webhook]** - Opens create modal (name, URL, events, secret, status) → creates webhook

### Secondary (Row Actions)
- **Edit Webhook** - Opens edit modal (name, URL, events, secret, status)
- **Test Webhook** - Sends test event to URL → shows delivery result (success/failure)
- **View Logs** - Opens logs panel (delivery history: timestamp, event, status, response, retry count)
- **Disable Webhook** - Confirmation → sets status to 'disabled' (stops sending events)
- **Enable Webhook** - Re-activates disabled webhook
- **Delete Webhook** - Confirmation (warning: logs will be deleted) → deletes webhook

### Filters/Search
- **Search** - Real-time filter by name or URL
- **Filter by Status** - All, Active, Disabled, Error (recent failures)
- **Sort** - Name, Last Triggered (most recent), Event Count, Status (asc/desc)

---

## States

- **Loading**: Skeleton rows (3), "Loading webhooks..." text
- **Empty**: "No webhooks configured" message, available events list, "Add Webhook" CTA
- **Error**: "Failed to load webhooks" warning, Retry + Contact Support buttons
- **Success**: Table with webhook rows (status indicators), search/filter controls, pagination if >20

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| name | string | Display name (e.g., "ERP Sync", "WMS Notify") |
| url | string | Endpoint URL (HTTPS required) |
| events | array | Event types subscribed (work_order.created, inventory.updated, etc.) |
| status | enum | active, disabled, error |
| last_triggered_at | timestamp | Last successful delivery time |
| last_status_code | int | HTTP response code (200, 500, etc.) |
| last_error | text | Error message (if status = error) |
| retry_count | int | Failed retry attempts (max 3) |
| secret | string | HMAC secret for signature verification (masked in UI) |
| category | string | Visual grouping tag (Production, Warehouse, Quality, etc.) |
| created_at | timestamp | When webhook was created |
| created_by | user_id | Who created |

---

## Available Events

### Production
- `work_order.created` - New work order created
- `work_order.started` - Work order started
- `work_order.completed` - Work order completed
- `work_order.cancelled` - Work order cancelled

### Inventory
- `inventory.updated` - Inventory quantity changed
- `lot.created` - New lot/batch created
- `material.reserved` - Material reserved for production
- `material.consumed` - Material consumed in production

### Quality
- `quality.test_created` - New quality test created
- `quality.test_completed` - Quality test completed
- `quality.failed` - Quality test failed
- `quality.hold` - Product placed on quality hold

### Shipping
- `shipment.created` - New shipment created
- `shipment.dispatched` - Shipment dispatched
- `shipment.delivered` - Shipment delivered
- `shipment.cancelled` - Shipment cancelled

### Warehouse
- `receiving.completed` - Material receiving completed
- `picking.completed` - Picking operation completed
- `transfer.completed` - Inventory transfer completed

---

## Permissions

| Role | Can View | Can Add | Can Edit | Can Test | Can Delete |
|------|----------|---------|----------|----------|------------|
| Super Admin | All | Yes | Yes | Yes | Yes |
| Admin | All | Yes | Yes | Yes | Yes |
| Manager | All | Yes | Yes | Yes | No |
| Operator | No | No | No | No | No |
| Viewer | No | No | No | No | No |

---

## Validation

- **Create**: Name required (max 100 chars), URL required (must be HTTPS), at least 1 event selected, secret optional (auto-generated if empty)
- **Edit**: Cannot edit URL after creation (security - delete & recreate instead), can edit name/events/status
- **Delete**: Confirmation required, warning that delivery logs will be deleted
- **Test**: Validates URL is reachable, sends sample event payload, shows HTTP response
- **URL Format**: Must be valid HTTPS URL (http:// not allowed in production mode)
- **Secret**: Auto-generated 32-char string, used for HMAC-SHA256 signature (sent in X-Webhook-Signature header)

---

## Accessibility

- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Webhook: {name}, URL: {url}, {event_count} events, Last triggered {timestamp}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open actions menu, Arrow keys for menu navigation
- **Status Icons**: ✓ (Active), ⚠ (Disabled), ⨯ (Error) with text alternatives

---

## Related Screens

- **Add Webhook Modal**: Opens from [+ Add Webhook] button
- **Edit Webhook Modal**: Opens from Actions menu → Edit Webhook
- **Test Webhook Modal**: Opens from Actions menu → Test Webhook (shows request/response)
- **Webhook Logs Panel**: Opens from Actions menu → View Logs (delivery history table)
- **Delete Webhook Confirmation**: Opens from Actions menu → Delete Webhook

---

## Technical Notes

- **RLS**: Webhooks filtered by `org_id` automatically
- **API**: `GET /api/settings/webhooks?search={query}&status={status}&page={N}`
- **Delivery**: Retry failed deliveries 3 times (exponential backoff: 1min, 5min, 15min)
- **Signature**: HMAC-SHA256 signature sent in `X-Webhook-Signature` header (verify with secret)
- **Timeout**: 10 second timeout for webhook delivery
- **Payload**: JSON format, includes `event_type`, `timestamp`, `org_id`, `data` (event-specific)
- **Logs**: Store last 100 delivery attempts per webhook (auto-prune older logs)
- **Real-time**: Subscribe to webhook updates via Supabase Realtime (status changes)
- **Security**: HTTPS required, rate limiting (max 1000 events/hour per webhook), IP allowlist optional
- **Status Update**: Auto-set status to 'error' if 3 consecutive deliveries fail, email alert to creator

---

## Example Payload

```json
{
  "event_type": "work_order.completed",
  "timestamp": "2025-12-11T14:32:00Z",
  "org_id": "org_123",
  "webhook_id": "webhook_456",
  "data": {
    "work_order_id": "wo_789",
    "work_order_number": "WO-2025-001",
    "product_id": "prod_abc",
    "product_name": "Strawberry Jam 500g",
    "quantity_completed": 1000,
    "completed_at": "2025-12-11T14:30:00Z",
    "completed_by": "user_xyz"
  }
}
```

**Headers**:
- `Content-Type: application/json`
- `X-Webhook-Signature: sha256=abc123...` (HMAC-SHA256 of payload using secret)
- `X-Webhook-ID: webhook_456`
- `X-Event-Type: work_order.completed`

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-024-webhooks-list]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
