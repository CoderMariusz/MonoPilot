# INT-004: Webhook Configuration

**Module**: Integrations
**Feature**: Webhook Management & Testing
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Webhooks                                [+ Create Webhook]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search webhooks...        ] [Event: All ▼] [Status: All ▼]                 │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Name             Event Type       URL                Status    Last     │ │
│  │                                                                  Fired   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Order Created    order.created    https://api.shop   ✓ Active  5m ago   │ │
│  │ Notify           (Production)     ify.com/webhook                [⋮]    │ │
│  │                                   [🔗 Copy]          Last: 200 OK        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Shipment Sent    shipment.sent    https://erp.cli    ⚠️ Warning 2h ago   │ │
│  │                  (Production)     ent.com/notify                [⋮]     │ │
│  │                                   [🔗 Copy]          Last: 504 Timeout   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Inventory Low    inventory.low    https://wms.pa     ✓ Active  1d ago   │ │
│  │ Alert            (Warehouse)      rtner.com/alerts              [⋮]     │ │
│  │                                   [🔗 Copy]          Last: 200 OK        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Quality Fail     quality.fail     https://qa.sys     ⏸ Paused  Never    │ │
│  │                  (Quality)        tem.com/hook                  [⋮]     │ │
│  │                                   [🔗 Copy]          Disabled by admin   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Test Webhook     order.created    https://webhook.   ✗ Error   3h ago   │ │
│  │ (Dev)            (Test)           site/abc123                   [⋮]     │ │
│  │                                   [🔗 Copy]          Last: 401 Auth      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 5 webhooks                                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details (full config, delivery history)
  - Test Webhook (send test payload)
  - Edit Configuration
  - Pause/Resume
  - Delete Webhook
  - View Delivery Log
```

### Create Webhook Modal

```
┌──────────────────────────────────────────┐
│  Create Webhook                 [X Close] │
├──────────────────────────────────────────┤
│                                          │
│  Webhook Name *                          │
│  [Order Created Notification______]     │
│                                          │
│  Event Type *                            │
│  [Select event...             ▼]        │
│    Production Events:                   │
│    - order.created                      │
│    - order.updated                      │
│    - order.completed                    │
│    - workorder.started                  │
│    - workorder.completed                │
│    Warehouse Events:                    │
│    - shipment.created                   │
│    - shipment.sent                      │
│    - inventory.low                      │
│    Quality Events:                      │
│    - quality.test_failed                │
│    - quality.batch_released             │
│                                          │
│  Payload URL *                           │
│  [https://api.example.com/webhook___]   │
│  ℹ️  Must be HTTPS endpoint              │
│                                          │
│  Authentication                          │
│  ○ None                                  │
│  ● Bearer Token                          │
│  ○ Basic Auth                            │
│  ○ Custom Header                         │
│                                          │
│  Bearer Token *                          │
│  [abc123def456ghi789___________]         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Advanced Settings                  │  │
│  ├────────────────────────────────────┤  │
│  │ ☑ Retry on failure (3 attempts)   │  │
│  │ ☑ Send test event on save         │  │
│  │ ☐ Include metadata in payload     │  │
│  │                                    │  │
│  │ Timeout: [30___] seconds           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Cancel]              [Create Webhook]  │
│                                          │
└──────────────────────────────────────────┘
```

### Test Webhook Tool

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Test Webhook: Order Created Notify                            [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  This will send a test payload to the webhook URL.                            │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Test Payload Preview                                       [📋 Copy]     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ {                                                                         │ │
│  │   "event": "order.created",                                              │ │
│  │   "timestamp": "2026-01-15T14:23:45.123Z",                               │ │
│  │   "data": {                                                              │ │
│  │     "order_id": "ORD-TEST-001",                                          │ │
│  │     "customer_name": "Test Customer",                                    │ │
│  │     "order_date": "2026-01-15",                                          │ │
│  │     "total": 1234.56,                                                    │ │
│  │     "items": [                                                           │ │
│  │       {                                                                  │ │
│  │         "product_code": "PROD-001",                                      │ │
│  │         "quantity": 10                                                   │ │
│  │       }                                                                  │ │
│  │     ]                                                                    │ │
│  │   }                                                                      │ │
│  │ }                                                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  URL: https://api.shopify.com/webhook                                         │
│  Method: POST                                                                  │
│  Headers: Content-Type: application/json, Authorization: Bearer ***           │
│                                                                                │
│  [Edit Test Payload]                                    [Send Test Request]   │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Test Results                                                              │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Request sent successfully                                              │ │
│  │                                                                           │ │
│  │ Status Code: 200 OK                                                      │ │
│  │ Response Time: 234 ms                                                    │ │
│  │ Timestamp: Jan 15, 2026 14:30:12                                         │ │
│  │                                                                           │ │
│  │ Response Body:                                                           │ │
│  │ {                                                                         │ │
│  │   "status": "received",                                                  │ │
│  │   "message": "Webhook processed successfully"                            │ │
│  │ }                                                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [Close]                                                [Save Test as Draft]  │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Webhooks                                [+ Create Webhook]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Event ▼] [Status ▼]                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  Loading webhooks...                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Webhooks                                [+ Create Webhook]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [🔔 Icon]                                            │
│                       No Webhooks Configured                                  │
│       Create webhooks to receive real-time notifications when events occur.  │
│       Available events: orders, shipments, inventory, quality, production.   │
│                                                                               │
│                       [+ Create Webhook]                                      │
│                                                                               │
│       View Webhook Documentation  |  See Event Schema Reference              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Webhooks                                [+ Create Webhook]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load Webhooks                                    │
│        Unable to retrieve webhooks. Check your connection.                    │
│                    Error: WEBHOOKS_FETCH_FAILED                               │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Name, Event Type (with module badge), URL (truncated + copy), Status (icon + label + last response), Last Fired (relative time), Actions menu
2. **Search/Filter Bar** - Text search (name, URL), event type filter, status filter (All, Active, Warning, Error, Paused)
3. **Create Webhook Button** - Primary CTA, opens modal with name + event selection + URL + auth config
4. **Status Indicators** - ✓ Active (green), ⚠️ Warning (yellow, for timeouts/retries), ✗ Error (red), ⏸ Paused (gray)
5. **Test Webhook Tool** - Modal with payload preview, send test request, view response
6. **Event Type Selector** - Grouped dropdown (Production, Warehouse, Quality, etc.)
7. **Authentication Config** - Radio buttons (None, Bearer Token, Basic Auth, Custom Header)
8. **Copy URL Button** - One-click copy, toast confirmation
9. **Delivery History** - Shows last 10 deliveries (timestamp, status, response code)

---

## Main Actions

### Primary
- **[+ Create Webhook]** - Opens modal → configure name, event, URL, auth, advanced settings → saves webhook (optionally sends test)

### Secondary (Row Actions)
- **View Details** - Opens panel/modal (full config, delivery history, retry settings)
- **Test Webhook** - Opens test tool modal (send test payload, view response)
- **Edit Configuration** - Opens edit modal (change URL, auth, settings)
- **Pause/Resume** - Toggles webhook active status (confirmation for resume)
- **Delete Webhook** - Confirmation dialog → deletes webhook (archives delivery history)
- **View Delivery Log** - Opens INT-003 (Integration Logs) filtered to this webhook

### Filters/Search
- **Search** - Real-time filter by name, URL
- **Filter by Event Type** - All, order.*, shipment.*, inventory.*, quality.*, etc.
- **Filter by Status** - All, Active, Warning, Error, Paused

---

## States

- **Loading**: Skeleton rows (4), "Loading webhooks..." text
- **Empty**: "No webhooks configured" message, explanation, "Create Webhook" CTA + documentation links
- **Error**: "Failed to load webhooks" warning, error code, Retry + Contact Support
- **Success**: Table with webhook rows, search/filter controls, pagination if >20
- **Test Success**: Green checkmark + "200 OK" in test results
- **Test Failure**: Red X + error message + response details in test results

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Webhook ID |
| name | string | User-friendly name |
| event_type | string | Event trigger (e.g., "order.created") |
| url | string | HTTPS endpoint URL |
| auth_type | enum | none, bearer_token, basic_auth, custom_header |
| auth_config | jsonb | Auth credentials (encrypted) |
| status | enum | active, warning, error, paused |
| retry_enabled | boolean | Retry on failure (default: true) |
| retry_max_attempts | integer | Max retries (default: 3) |
| timeout_seconds | integer | Request timeout (default: 30) |
| last_fired_at | timestamp | Last successful delivery |
| last_status_code | integer | HTTP status from last delivery |
| last_error | text | Last error message (if status = error) |
| include_metadata | boolean | Include extra metadata in payload |

---

## Event Types

**Available Events** (grouped by module):
- **Production**: order.created, order.updated, order.completed, workorder.started, workorder.completed, workorder.paused
- **Warehouse**: shipment.created, shipment.sent, inventory.low, receipt.created, license_plate.created
- **Quality**: quality.test_failed, quality.batch_released, quality.batch_rejected, ncr.created
- **Planning**: mrp.run_completed, demand.forecast_updated
- **Shipping**: delivery.scheduled, delivery.completed, delivery.failed

---

## Payload Format

**Standard Payload**:
```json
{
  "event": "order.created",
  "timestamp": "2026-01-15T14:23:45.123Z",
  "webhook_id": "wh_aB3dE5fG7hI9",
  "data": {
    "order_id": "ORD-001",
    "customer_name": "ACME Corp",
    "order_date": "2026-01-15",
    "total": 1234.56,
    "items": [...]
  },
  "metadata": {
    "org_id": "org_xyz",
    "triggered_by": "user_id_abc"
  }
}
```

---

## Validation

- **Create**: Name required (max 100 chars), URL must be HTTPS, event type required, auth credentials required if auth type selected
- **URL**: Must be valid HTTPS URL, reachable endpoint (optional pre-validation on save)
- **Timeout**: Integer 5-300 seconds
- **Retry Attempts**: Integer 0-10
- **Auth**: Bearer token/basic auth credentials required if selected

---

## Accessibility

- **Touch targets**: All buttons/fields >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Row announces "Webhook: {name}, Event: {event_type}, Status: {status}, Last fired: {time}"
- **Keyboard**: Tab navigation, Enter to open modals/test tool
- **Copy Feedback**: Visual + screen reader "URL copied to clipboard"
- **Test Results**: Screen reader announces "Test successful: 200 OK" or "Test failed: {error}"

---

## Related Screens

- **INT-001**: Integrations Dashboard (links to Webhooks)
- **INT-003**: Integration Logs (View Delivery Log)
- **INT-010**: Retry Logic & DLQ (failed webhook deliveries)

---

## Technical Notes

- **RLS**: Webhooks filtered by `org_id`
- **API**:
  - `GET /api/integrations/webhooks?event={type}&status={status}&search={query}`
  - `POST /api/integrations/webhooks` (create)
  - `PATCH /api/integrations/webhooks/{id}` (edit)
  - `POST /api/integrations/webhooks/{id}/test` (send test payload)
  - `PATCH /api/integrations/webhooks/{id}/status` (pause/resume)
  - `DELETE /api/integrations/webhooks/{id}` (delete)
  - `GET /api/integrations/webhooks/{id}/deliveries` (delivery history)
- **Delivery**: Async queue (BullMQ/Supabase Edge Functions)
- **Retry Logic**: Exponential backoff (1s, 5s, 30s)
- **Timeout**: Configurable per webhook (default 30s)
- **Auth**: Encrypted storage for credentials (Supabase Vault)
- **Logs**: All deliveries logged to `integration_logs` table
- **Real-time**: Subscribe to webhook updates via Supabase Realtime

---

**Status**: Draft - Ready for Review
