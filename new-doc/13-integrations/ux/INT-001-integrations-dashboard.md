# INT-001: Integrations Dashboard

**Module**: Integrations
**Feature**: Integration Overview & Health Monitoring
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations Dashboard                              [+ Add Integration]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ System Health Overview                                                   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  ✓ 8 Active    ⚠ 2 Warning    ✗ 1 Error    ⏸ 3 Paused                  │ │
│  │  Last sync: 2 minutes ago                    [Sync All Now]              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐       │
│  │ ✓ Comarch Optima   │ │ ✓ Shopify Store   │ │ ⚠ EDI Partner     │       │
│  │ Status: Active     │ │ Status: Active     │ │ Status: Warning    │       │
│  │ Last Sync: 5m ago  │ │ Last Sync: 2m ago  │ │ Last Sync: 45m ago │       │
│  │ Orders: 234 synced │ │ Orders: 89 synced  │ │ Orders: 12 pending │       │
│  │ [View Details]     │ │ [View Details]     │ │ [View Details]     │       │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘       │
│                                                                               │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐       │
│  │ ✓ Supplier Portal  │ │ ✗ Custom API      │ │ ⏸ Legacy ERP       │       │
│  │ Status: Active     │ │ Status: Error      │ │ Status: Paused     │       │
│  │ Last Sync: 1h ago  │ │ Last Sync: 3h ago  │ │ Disabled by admin  │       │
│  │ POs: 45 received   │ │ ❌ Auth failed      │ │ [Resume] [Delete]  │       │
│  │ [View Details]     │ │ [View Logs] [Fix]  │ │                    │       │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Recent Activity Feed                                    [View All Logs]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 🔄 2m ago  │ Shopify Store synced 12 orders successfully                │ │
│  │ ⚠ 15m ago  │ EDI Partner sync delayed - retrying in 10 minutes          │ │
│  │ ✓ 45m ago  │ Comarch Optima exported 234 invoices                       │ │
│  │ ✗ 3h ago   │ Custom API authentication failed - check credentials       │ │
│  │ 🔄 5h ago  │ Supplier Portal received 8 new purchase orders             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Error Summary (Last 24 Hours)                          [View DLQ →]      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Custom API           │ 12 failures │ Auth error (401)    │ [Retry All]  │ │
│  │ EDI Partner          │ 5 failures  │ Timeout (504)       │ [Retry All]  │ │
│  │ Webhook: ShipNotify  │ 3 failures  │ Endpoint down (503) │ [Retry All]  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations Dashboard                              [+ Add Integration]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │ [████████░░░░]  │ │ [████████░░░░]  │ │ [████████░░░░]  │               │
│  │ [██████░░░░░░]  │ │ [██████░░░░░░]  │ │ [██████░░░░░░]  │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                               │
│  Loading integrations...                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations Dashboard                              [+ Add Integration]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [🔗 Icon]                                            │
│                    No Integrations Configured                                 │
│       Connect external systems to automate data exchange with MonoPilot.     │
│       Available integrations: Comarch Optima, EDI, Shopify, Custom APIs      │
│                                                                               │
│                       [+ Add Integration]                                     │
│                                                                               │
│       Browse Integration Catalog  |  View Documentation                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations Dashboard                              [+ Add Integration]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│               Failed to Load Integration Dashboard                            │
│        Unable to retrieve integration status. Check your connection.         │
│                    Error: INTEGRATION_FETCH_FAILED                            │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **System Health Overview** - Counts by status (Active, Warning, Error, Paused), Last sync timestamp, Sync All button
2. **Integration Cards** - Integration name with status icon, Status label (color-coded), Last sync time, Key metrics (orders/invoices synced), Quick actions (View Details, Fix, Pause/Resume, Delete)
3. **Status Icons** - ✓ Active (green), ⚠ Warning (yellow), ✗ Error (red), ⏸ Paused (gray)
4. **Activity Feed** - Recent events (last 20), Event type icon, Timestamp (relative), Event description, [View All Logs] link
5. **Error Summary** - Integration name, Failure count (last 24h), Error type/code, [Retry All] button per integration, [View DLQ] link
6. **Add Integration Button** - Primary CTA (top-right), opens integration catalog modal
7. **Sync All Button** - Triggers manual sync for all active integrations

---

## Main Actions

### Primary
- **[+ Add Integration]** - Opens integration catalog modal (pre-built integrations + custom API builder)
- **[Sync All Now]** - Manually triggers sync for all active integrations (shows progress toast)

### Secondary (Card Actions)
- **View Details** - Opens integration detail page (config, logs, metrics)
- **Fix** - Opens troubleshooting wizard for failed integrations
- **Pause/Resume** - Toggles integration active status
- **Delete** - Confirmation dialog → removes integration (archives logs)
- **[Retry All]** - Retries all failed messages for specific integration (from Error Summary)
- **[View DLQ]** - Opens Dead Letter Queue screen (failed messages)
- **[View All Logs]** - Opens full activity log screen

### Activity Feed
- **View All Logs** - Opens INT-003 (Integration Logs) filtered to recent activity

---

## States

- **Loading**: Skeleton cards (6), "Loading integrations..." text
- **Empty**: "No integrations configured" message, explanation, "Add Integration" CTA + links to catalog and docs
- **Error**: "Failed to load dashboard" warning, error code, Retry + Contact Support buttons
- **Success**: Health overview + integration cards (active, warning, error, paused) + activity feed + error summary (if errors exist)
- **Partial Data**: Show available cards if some integrations load but not all

---

## Data Fields

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Integration ID |
| name | string | Integration name (e.g., "Comarch Optima") |
| type | enum | comarch_optima, edi, shopify, custom_api, supplier_portal, customer_portal, webhook |
| status | enum | active, warning, error, paused |
| last_sync_at | timestamp | Last successful sync time |
| last_error | text | Last error message (if status = error) |
| sync_count_24h | integer | Number of successful syncs in last 24 hours |
| error_count_24h | integer | Number of failures in last 24 hours |
| metrics | jsonb | Integration-specific metrics (e.g., {"orders_synced": 234}) |

---

## Accessibility

- **Touch targets**: All buttons/cards >= 48x48dp
- **Contrast**: Status colors pass WCAG AA (green #10b981, yellow #f59e0b, red #ef4444)
- **Screen reader**: Card announces "Integration: {name}, Status: {status}, Last sync: {time}, {metrics}"
- **Keyboard**: Tab navigation, Enter to activate buttons/links
- **Status Icons**: Always paired with text labels (not icon-only)

---

## Related Screens

- **INT-002**: API Keys Management (linked from integration config)
- **INT-003**: Integration Logs (Activity Feed → View All Logs)
- **INT-004**: Webhook Configuration (linked from webhook integrations)
- **INT-010**: Retry Logic & DLQ (Error Summary → View DLQ)
- **INT-011**: Comarch Optima Config (card → View Details)
- **INT-012**: Custom Integration Builder (Add Integration → Custom API)

---

## Technical Notes

- **RLS**: Integrations filtered by `org_id`
- **API**:
  - `GET /api/integrations/dashboard` (returns all integrations + health summary)
  - `POST /api/integrations/{id}/sync` (manual sync trigger)
  - `POST /api/integrations/sync-all` (sync all active integrations)
  - `PATCH /api/integrations/{id}/status` (pause/resume)
  - `DELETE /api/integrations/{id}` (delete integration)
- **Real-time**: Subscribe to integration status changes via Supabase Realtime
- **Activity Feed**: Recent 20 events from `integration_logs` table (last 24 hours)
- **Error Summary**: Aggregated from `integration_logs` where status = 'error' (last 24 hours)
- **Refresh**: Auto-refresh every 60 seconds (status updates)

---

**Status**: Draft - Ready for Review
