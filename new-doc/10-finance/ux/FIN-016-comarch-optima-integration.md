# FIN-016: Comarch Optima Integration Page

**Module**: Finance
**Feature**: Comarch Optima ERP Integration (PRD Section 9.14)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Connected)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Integrations > Comarch Optima                    Last Sync: 2 minutes ago  [Sync Now]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Connection Status                                                              [Configure]  |   |
|  |                                                                                            |   |
|  |  Status: [✓ Connected]          Environment: [Production]                                 |   |
|  |  Server: https://optima-api.example.com                                                    |   |
|  |  Company: MonoPilot Manufacturing Ltd. | Tenant ID: MP-2026-001                           |   |
|  |  Last Connected: Jan 15, 2026 10:28 AM | Uptime: 99.8% (last 30 days)                     |   |
|  |                                                                                            |   |
|  |  [Test Connection] [Disconnect]                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Sync Summary (Last 24 Hours)                                                              |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | GL Entries         |  | Invoices Exported  |  | Payments Synced    |  | Sync Errors   | |   |
|  |  | 247 synced         |  | 18 exported        |  | 12 synced          |  | 0             | |   |
|  |  | Last: 2 min ago    |  | Last: 15 min ago   |  | Last: 1 hour ago   |  | ✓ All clear   | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Sync Configuration] [GL Mapping] [Sync Log] [Error Resolution]                                |
|  ^^^^^^^^^^^^^^^^^^^^                                                                            |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Automatic Sync Configuration                                                               |   |
|  |                                                                                            |   |
|  | Sync Schedule: [Enabled ✓]                                                                |   |
|  | Frequency:      [Every 15 minutes v]                                                      |   |
|  | Peak Hours:     [6:00 AM - 6:00 PM v] Sync every 15 min                                   |   |
|  | Off-Peak:       [6:00 PM - 6:00 AM v] Sync every 1 hour                                   |   |
|  | Batch Size:     [100 records v]                                                           |   |
|  |                                                                                            |   |
|  | What to Sync:                                                                              |   |
|  | [✓] GL Entries (journal entries from production costs, sales, inventory)                  |   |
|  | [✓] Sales Invoices (export invoices to Optima AR module)                                  |   |
|  | [✓] Purchase Orders (export POs to Optima AP module)                                      |   |
|  | [✓] Payments (sync payment records both ways)                                             |   |
|  | [✓] Inventory Adjustments (sync stock movements to Optima inventory)                      |   |
|  | [ ] Chart of Accounts (import COA from Optima - manual trigger only)                      |   |
|  |                                                                                            |   |
|  | Conflict Resolution:                                                                       |   |
|  | If duplicate detected: [Optima takes precedence v] [MonoPilot wins] [Manual review]       |   |
|  |                                                                                            |   |
|  | [Save Configuration]                                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Recent Sync Activity                                                                       |   |
|  |                                                                                            |   |
|  | Time           Type               Direction  Records  Status        Details               |   |
|  | --------------------------------------------------------------------------------------    |   |
|  | 10:28 AM       GL Entries         → Optima   47       ✓ Completed   [View Log]           |   |
|  | 10:15 AM       Sales Invoices     → Optima   3        ✓ Completed   [View Log]           |   |
|  | 10:00 AM       Payments           ← Optima   2        ✓ Completed   [View Log]           |   |
|  | 9:45 AM        GL Entries         → Optima   52       ✓ Completed   [View Log]           |   |
|  | 9:30 AM        Inventory Adj      → Optima   8        ✓ Completed   [View Log]           |   |
|  | 9:15 AM        GL Entries         → Optima   41       ✓ Completed   [View Log]           |   |
|  | 9:00 AM        Purchase Orders    → Optima   5        ✓ Completed   [View Log]           |   |
|  | 8:45 AM        GL Entries         → Optima   39       ✓ Completed   [View Log]           |   |
|  |                                                                                            |   |
|  | [View Full Sync Log (247 records)]                                                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|  | Quick Actions               |  | Connection Health          |  | Support                   |   |
|  |                             |  |                            |  |                           |   |
|  | [Manual Sync Now]           |  | Response Time: 142ms       |  | [Integration Guide]       |   |
|  | [Export Sync Report]        |  | Success Rate: 100%         |  | [API Documentation]       |   |
|  | [Reset Sync Cursor]         |  | Last Error: None           |  | [Contact Support]         |   |
|  | [Import COA from Optima]    |  | Queue Size: 0              |  | [View Changelog]          |   |
|  | [Retry Failed Syncs]        |  |                            |  |                           |   |
|  |                             |  | [View Diagnostics]         |  |                           |   |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### GL Mapping Tab (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Integrations > Comarch Optima                    Last Sync: 2 minutes ago  [Sync Now]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [Sync Configuration] [GL Mapping] [Sync Log] [Error Resolution]                                |
|                       ^^^^^^^^^^^^                                                               |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | General Ledger Account Mapping                                       [Import from Optima]  |   |
|  |                                                                                            |   |
|  | Map MonoPilot accounts to Comarch Optima Chart of Accounts                                |   |
|  |                                                                                            |   |
|  | Filters: [All Categories v] [Search MonoPilot or Optima accounts...]        [Add Mapping]|   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | MonoPilot Account                           Optima Account                      Actions   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | COGS - Direct Materials                     400-001 Raw Materials              [Edit]    |   |
|  | 4000.10.001                                 (Koszty bezpośrednie - Surowce)    [Delete]  |   |
|  |                                                                                            |   |
|  | COGS - Direct Labor                         400-002 Direct Labor               [Edit]    |   |
|  | 4000.20.001                                 (Koszty bezpośrednie - Robocizna) [Delete]  |   |
|  |                                                                                            |   |
|  | Finished Goods Inventory                    130-001 Finished Goods             [Edit]    |   |
|  | 1300.01.001                                 (Wyroby gotowe)                    [Delete]  |   |
|  |                                                                                            |   |
|  | Raw Materials Inventory                     131-001 Raw Materials              [Edit]    |   |
|  | 1300.02.001                                 (Materiały)                        [Delete]  |   |
|  |                                                                                            |   |
|  | Accounts Receivable                         200-001 Trade Receivables          [Edit]    |   |
|  | 1200.01.001                                 (Należności z tytułu dostaw)      [Delete]  |   |
|  |                                                                                            |   |
|  | Accounts Payable                            201-001 Trade Payables             [Edit]    |   |
|  | 2000.01.001                                 (Zobowiązania z tytułu dostaw)    [Delete]  |   |
|  |                                                                                            |   |
|  | Sales Revenue                               700-001 Product Sales              [Edit]    |   |
|  | 7000.01.001                                 (Przychody ze sprzedaży produktów)[Delete]  |   |
|  |                                                                                            |   |
|  | Manufacturing Overhead                      500-001 Overhead Costs             [Edit]    |   |
|  | 5000.01.001                                 (Koszty pośrednie produkcji)      [Delete]  |   |
|  |                                                                                            |   |
|  | [Showing 8 of 47 mappings] [Load More]                                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Mapping Coverage                                                                           |   |
|  |                                                                                            |   |
|  | MonoPilot Accounts: 47 total | 47 mapped (100%) | 0 unmapped                            |   |
|  | Optima Accounts: 342 total | 47 in use                                                   |   |
|  |                                                                                            |   |
|  | ✓ All critical accounts mapped (COGS, Inventory, AR, AP, Revenue)                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Sync Log Tab (Desktop - with Errors)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Integrations > Comarch Optima                    Last Sync: 2 minutes ago  [Sync Now]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [Sync Configuration] [GL Mapping] [Sync Log] [Error Resolution]                                |
|                                   ^^^^^^^^^^                                                     |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Sync Log                                                                   [Export CSV]   |   |
|  |                                                                                            |   |
|  | Filters: [Last 24 Hours v] [All Types v] [All Statuses v] [Search...]                     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Time      | Type            | Dir    | Records | Status      | Details                   |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | 10:28 AM  | GL Entries      | → OPT  | 47      | ✓ Success   | [View] [Download JSON]    |   |
|  | 10:15 AM  | Sales Invoices  | → OPT  | 3       | ✓ Success   | [View] [Download JSON]    |   |
|  | 10:10 AM  | GL Entries      | → OPT  | 5       | ⚠️ Partial  | 1 error (duplicate) [Fix]|   |
|  | 10:00 AM  | Payments        | ← OPT  | 2       | ✓ Success   | [View] [Download JSON]    |   |
|  | 9:45 AM   | GL Entries      | → OPT  | 52      | ✓ Success   | [View] [Download JSON]    |   |
|  | 9:40 AM   | Inventory Adj   | → OPT  | 1       | ❌ Failed   | Mapping error [Fix]       |   |
|  | 9:30 AM   | Inventory Adj   | → OPT  | 8       | ✓ Success   | [View] [Download JSON]    |   |
|  | 9:15 AM   | GL Entries      | → OPT  | 41      | ✓ Success   | [View] [Download JSON]    |   |
|  |                                                                                            |   |
|  | [Showing 8 of 247 sync operations] [Load More]                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  Sync ID: SYN-2026-00157 (10:10 AM - GL Entries - Partial Success)                              |
|  +-------------------------------------------------------------------------------------------+   |
|  | Status: ⚠️ Partial Success (4/5 records synced)                                           |   |
|  |                                                                                            |   |
|  | Error Details:                                                                             |   |
|  | Record 5 of 5 failed: Duplicate entry detected in Optima                                  |   |
|  | GL Entry ID: GLE-2026-00248                                                               |   |
|  | Optima Error Code: E_DUPLICATE_ENTRY                                                      |   |
|  | Optima Message: "Duplikowany zapis księgowy dla tej daty i konta"                        |   |
|  |                                                                                            |   |
|  | Affected Record:                                                                           |   |
|  | Date: 2026-01-15 | Account: 4000.10.001 (COGS - Direct Materials)                        |   |
|  | Amount: $1,245.50 | Description: "WO-2026-00125 material costs"                          |   |
|  |                                                                                            |   |
|  | Resolution Options:                                                                        |   |
|  | [Skip & Mark Synced] - Assume already in Optima                                           |   |
|  | [Retry with Override] - Force update in Optima                                            |   |
|  | [Delete & Retry] - Delete from MonoPilot and re-create                                    |   |
|  | [Manual Review] - Send to Finance Manager for review                                      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Comarch Optima                |
|  [Sync Now]                      |
+----------------------------------+
|                                  |
|  Status: ✓ Connected             |
|  Last Sync: 2 min ago            |
|                                  |
|  +----------------------------+  |
|  | GL Entries      247        |  |
|  | Last: 2 min ago            |  |
|  +----------------------------+  |
|  | Invoices        18         |  |
|  | Last: 15 min ago           |  |
|  +----------------------------+  |
|  | Payments        12         |  |
|  | Last: 1 hour ago           |  |
|  +----------------------------+  |
|  | Errors          0 ✓        |  |
|  +----------------------------+  |
|                                  |
|  [Config] [Mapping] [Log]        |
|  ^^^^^^^^                        |
|                                  |
|  Sync Schedule                   |
|  +----------------------------+  |
|  | Enabled: Yes               |  |
|  | Frequency: Every 15 min    |  |
|  | Last: 10:28 AM             |  |
|  | Next: 10:45 AM             |  |
|  +----------------------------+  |
|                                  |
|  What to Sync                    |
|  [✓] GL Entries                  |
|  [✓] Sales Invoices              |
|  [✓] Purchase Orders             |
|  [✓] Payments                    |
|  [✓] Inventory Adjustments       |
|                                  |
|  [Save Changes]                  |
|                                  |
|  Recent Sync (8)                 |
|  +----------------------------+  |
|  | 10:28 AM  GL Entries       |  |
|  | → Optima  47 records  ✓    |  |
|  +----------------------------+  |
|  | 10:15 AM  Invoices         |  |
|  | → Optima  3 records  ✓     |  |
|  +----------------------------+  |
|                                  |
|  [Manual Sync] [Test Connection] |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Integrations > Comarch Optima                    Last Sync: --  [Sync Now]           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Connection Status                                                                          |   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  Loading integration status...                                                                   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (Not Connected)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Integrations > Comarch Optima                                                         |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Link Icon]                                              |
|                                                                                                  |
|                               Comarch Optima Not Connected                                       |
|                                                                                                  |
|                     Connect MonoPilot to your Comarch Optima ERP system to                       |
|                     automatically sync GL entries, invoices, payments, and                       |
|                     inventory data.                                                              |
|                                                                                                  |
|                                                                                                  |
|                                    [Connect to Optima]                                           |
|                                                                                                  |
|                                                                                                  |
|                     Integration Benefits:                                                        |
|                     - Automatic GL entry export from production costs                            |
|                     - Two-way invoice and payment sync                                           |
|                     - Real-time inventory updates                                                |
|                     - Eliminates manual data entry                                               |
|                                                                                                  |
|                              [View Integration Guide]                                            |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State (Connection Failed)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Integrations > Comarch Optima                    Last Sync: 45 min ago  [Sync Now]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Connection Status                                                              [Configure]  |   |
|  |                                                                                            |   |
|  |  Status: [❌ Connection Failed]     Environment: [Production]                             |   |
|  |  Server: https://optima-api.example.com                                                    |   |
|  |  Last Error: Authentication failed - invalid API key                                       |   |
|  |  Last Successful Sync: Jan 15, 2026 9:45 AM (45 minutes ago)                              |   |
|  |                                                                                            |   |
|  |  [Test Connection] [Reconfigure]                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Comarch Optima Connection Lost                                     |
|                                                                                                  |
|                     Unable to sync with Comarch Optima. Authentication failed.                   |
|                     Please verify your API credentials and try again.                            |
|                                                                                                  |
|                                Error: OPTIMA_AUTH_FAILED                                         |
|                                                                                                  |
|                                                                                                  |
|                                  [Reconfigure] [Test Connection]                                 |
|                                                                                                  |
|                                                                                                  |
|  Troubleshooting:                                                                                |
|  - Verify API key is valid and not expired                                                       |
|  - Check Optima server status                                                                    |
|  - Ensure IP whitelisting is configured in Optima                                                |
|  - Contact Optima support if issue persists                                                      |
|                                                                                                  |
|                                    [Contact Support]                                             |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Connection Status Panel

Displays integration connection health.

| Field | Source | Display |
|-------|--------|---------|
| Status | integration_status.connected | "✓ Connected" / "❌ Connection Failed" |
| Environment | integration_config.environment | "Production" / "Sandbox" |
| Server URL | integration_config.server_url | "https://optima-api.example.com" |
| Company | integration_config.company_name | "MonoPilot Manufacturing Ltd." |
| Tenant ID | integration_config.tenant_id | "MP-2026-001" |
| Last Connected | integration_status.last_connected | "Jan 15, 2026 10:28 AM" |
| Uptime | Calculated | "99.8% (last 30 days)" |

**Actions:**
- [Test Connection]: Ping Optima API, verify credentials
- [Disconnect]: Disable integration
- [Configure]: Edit integration settings

### 2. Sync Summary Metrics

24-hour sync statistics.

| Metric | Calculation | Display |
|--------|-------------|---------|
| GL Entries | COUNT(sync_log WHERE type = 'gl_entry') | "247 synced" |
| Invoices Exported | COUNT(sync_log WHERE type = 'invoice') | "18 exported" |
| Payments Synced | COUNT(sync_log WHERE type = 'payment') | "12 synced" |
| Sync Errors | COUNT(sync_log WHERE status = 'error') | "0" / "3" with alert |

### 3. Sync Configuration Panel

Automated sync settings.

| Setting | Options | Default |
|---------|---------|---------|
| Sync Schedule | Enabled/Disabled | Enabled |
| Frequency | 5/10/15/30/60 minutes | 15 minutes |
| Peak Hours | Time range | 6:00 AM - 6:00 PM |
| Off-Peak Frequency | 15/30/60 minutes, 2/4 hours | 1 hour |
| Batch Size | 50/100/200/500 | 100 records |

**What to Sync (Checkboxes):**
- ✓ GL Entries
- ✓ Sales Invoices
- ✓ Purchase Orders
- ✓ Payments
- ✓ Inventory Adjustments
- ☐ Chart of Accounts (manual trigger only)

**Conflict Resolution:**
- Optima takes precedence (default)
- MonoPilot wins
- Manual review

### 4. GL Account Mapping Table

MonoPilot ↔ Optima account mapping.

| Column | Source | Display |
|--------|--------|---------|
| MonoPilot Account | chart_of_accounts.name + code | "COGS - Direct Materials (4000.10.001)" |
| Optima Account | optima_mapping.account_code + name | "400-001 Raw Materials" |
| Optima Name (Polish) | optima_mapping.account_name_pl | "(Koszty bezpośrednie - Surowce)" |
| Actions | - | [Edit] [Delete] buttons |

**Mapping Coverage:**
- Total MonoPilot accounts: 47
- Mapped: 47 (100%)
- Unmapped: 0
- Critical accounts status: ✓ All mapped

### 5. Sync Log Table

Historical sync operation log.

| Column | Source | Display |
|--------|--------|---------|
| Time | sync_log.synced_at | "10:28 AM" |
| Type | sync_log.type | "GL Entries" / "Sales Invoices" / etc. |
| Direction | sync_log.direction | "→ Optima" / "← Optima" |
| Records | sync_log.record_count | "47" |
| Status | sync_log.status | "✓ Success" / "⚠️ Partial" / "❌ Failed" |
| Details | - | [View] [Download JSON] buttons |

**Status Indicators:**
- ✓ Success (green): All records synced
- ⚠️ Partial (orange): Some records failed
- ❌ Failed (red): Sync operation failed

### 6. Error Detail Panel

Expanded view of sync errors.

| Field | Display |
|-------|---------|
| Sync ID | "SYN-2026-00157" |
| Status | "⚠️ Partial Success (4/5 records synced)" |
| Error Details | Full error message from Optima API |
| Optima Error Code | "E_DUPLICATE_ENTRY" |
| Optima Message | Polish error message from Optima |
| Affected Record | Full record details |

**Resolution Options:**
- [Skip & Mark Synced]: Mark as synced, don't retry
- [Retry with Override]: Force update in Optima
- [Delete & Retry]: Delete from MonoPilot, re-create
- [Manual Review]: Flag for Finance Manager

### 7. Connection Health Panel

Real-time integration metrics.

| Metric | Display |
|--------|---------|
| Response Time | "142ms" (API latency) |
| Success Rate | "100%" (last 24 hours) |
| Last Error | "None" / Error description |
| Queue Size | "0" (pending sync operations) |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Sync Now | Header | Trigger immediate manual sync |
| Configure | Connection status | Opens ConfigureIntegrationModal |
| Test Connection | Connection status | Ping Optima API, verify credentials |
| Disconnect | Connection status | Disable integration (confirmation modal) |

### Tab Navigation

| Tab | Content |
|-----|---------|
| Sync Configuration | Sync schedule, what to sync, conflict resolution |
| GL Mapping | MonoPilot ↔ Optima account mapping table |
| Sync Log | Historical sync operations, error details |
| Error Resolution | List of failed syncs needing resolution |

### Quick Actions Panel

| Action | Trigger | Behavior |
|--------|---------|----------|
| Manual Sync Now | Button | Trigger immediate sync (all enabled types) |
| Export Sync Report | Button | Generate PDF report of sync activity |
| Reset Sync Cursor | Button | Reset last sync timestamp (re-sync all) |
| Import COA from Optima | Button | Fetch Optima Chart of Accounts |
| Retry Failed Syncs | Button | Re-attempt all failed sync operations |

### Mapping Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Add Mapping | Button | Opens AddMappingModal |
| Edit Mapping | Row action | Opens EditMappingModal |
| Delete Mapping | Row action | Confirmation modal, delete mapping |
| Import from Optima | Header button | Fetch Optima accounts, auto-suggest mappings |

---

## States

### Loading State
- Skeleton connection status
- Skeleton sync metrics
- "Loading integration status..." text

### Empty State (Not Connected)
- Link illustration
- "Comarch Optima Not Connected" headline
- Integration benefits list
- [Connect to Optima] CTA
- [View Integration Guide] link

### Connected State (Success)
- All connection details visible
- Sync summary metrics
- Recent sync activity log
- Connection health metrics
- Quick actions available

### Error State (Connection Failed)
- Warning icon
- "❌ Connection Failed" status
- Error message from Optima API
- Last successful sync timestamp
- [Reconfigure] and [Test Connection] buttons
- Troubleshooting tips

---

## Data Fields

### Integration Status Response

```json
{
  "connection": {
    "connected": true,
    "environment": "production",
    "server_url": "https://optima-api.example.com",
    "company_name": "MonoPilot Manufacturing Ltd.",
    "tenant_id": "MP-2026-001",
    "last_connected": "2026-01-15T10:28:00Z",
    "uptime_pct": 99.8
  },
  "sync_summary": {
    "period": "last_24_hours",
    "gl_entries": { "count": 247, "last_sync": "2026-01-15T10:28:00Z" },
    "invoices": { "count": 18, "last_sync": "2026-01-15T10:15:00Z" },
    "payments": { "count": 12, "last_sync": "2026-01-15T09:00:00Z" },
    "errors": { "count": 0 }
  },
  "config": {
    "schedule_enabled": true,
    "frequency_minutes": 15,
    "peak_hours": { "start": "06:00", "end": "18:00" },
    "off_peak_frequency_minutes": 60,
    "batch_size": 100,
    "sync_types": ["gl_entries", "invoices", "purchase_orders", "payments", "inventory"],
    "conflict_resolution": "optima_wins"
  },
  "health": {
    "response_time_ms": 142,
    "success_rate_pct": 100,
    "last_error": null,
    "queue_size": 0
  }
}
```

### GL Mapping Response

```json
{
  "mappings": [
    {
      "monopilot_account": {
        "code": "4000.10.001",
        "name": "COGS - Direct Materials"
      },
      "optima_account": {
        "code": "400-001",
        "name": "Raw Materials",
        "name_pl": "Koszty bezpośrednie - Surowce"
      }
    }
  ],
  "coverage": {
    "total_monopilot_accounts": 47,
    "mapped_accounts": 47,
    "unmapped_accounts": 0,
    "critical_accounts_mapped": true
  }
}
```

---

## API Endpoints

### Get Integration Status

```
GET /api/finance/integrations/comarch-optima/status

Response: { ... } (see Data Fields above)
```

### Trigger Manual Sync

```
POST /api/finance/integrations/comarch-optima/sync
Content-Type: application/json

Request:
{
  "types": ["gl_entries", "invoices"],  // optional, defaults to all enabled
  "force": false  // force re-sync even if already synced
}

Response:
{
  "sync_id": "SYN-2026-00158",
  "status": "in_progress",
  "queued_at": "2026-01-15T10:30:00Z"
}
```

### Update Sync Configuration

```
PUT /api/finance/integrations/comarch-optima/config
Content-Type: application/json

Request:
{
  "schedule_enabled": true,
  "frequency_minutes": 15,
  "sync_types": ["gl_entries", "invoices", "payments"],
  "conflict_resolution": "optima_wins"
}

Response:
{
  "config": { ... },
  "updated_at": "2026-01-15T10:30:00Z"
}
```

### Add/Edit GL Mapping

```
POST /api/finance/integrations/comarch-optima/mappings
Content-Type: application/json

Request:
{
  "monopilot_account_code": "4000.10.001",
  "optima_account_code": "400-001"
}

Response:
{
  "mapping": { ... },
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

## Permissions

| Role | View Status | Configure | Sync Now | Map Accounts | Resolve Errors |
|------|-------------|-----------|----------|--------------|----------------|
| Finance Manager | Yes | Yes | Yes | Yes | Yes |
| Finance Director | Yes | Yes | Yes | Yes | Yes |
| Accountant | Yes | No | Yes | View only | No |
| Operations Manager | Yes | No | No | No | No |
| Admin | Yes | Yes | Yes | Yes | Yes |

---

## Validation

### Connection Configuration

| Field | Rule | Error Message |
|-------|------|---------------|
| Server URL | Valid HTTPS URL | "Server URL must be valid HTTPS URL" |
| API Key | 32-64 chars | "API key must be 32-64 characters" |
| Tenant ID | Alphanumeric, 6-20 chars | "Tenant ID must be 6-20 alphanumeric characters" |
| Frequency | 5-60 minutes | "Frequency must be between 5 and 60 minutes" |

### GL Mapping

| Rule | Error Message |
|------|---------------|
| MonoPilot account must exist | "MonoPilot account not found" |
| Optima account code required | "Optima account code is required" |
| No duplicate mappings | "This MonoPilot account is already mapped" |

---

## Business Rules

### Sync Direction

| Entity | Direction | Notes |
|--------|-----------|-------|
| GL Entries | MonoPilot → Optima | Export only |
| Sales Invoices | MonoPilot → Optima | Export only |
| Purchase Orders | MonoPilot → Optima | Export only |
| Payments | Bidirectional | Sync both ways |
| Inventory Adjustments | MonoPilot → Optima | Export only |
| Chart of Accounts | Optima → MonoPilot | Import only (manual trigger) |

### Sync Schedule

**Peak Hours (6 AM - 6 PM):**
- Sync every 15 minutes (default)
- Higher priority queue processing

**Off-Peak (6 PM - 6 AM):**
- Sync every 1 hour (default)
- Batch processing for efficiency

**Manual Sync:**
- Available anytime
- Bypasses schedule
- Immediate processing

### Conflict Resolution

**Duplicate Detection:**
- Check Optima for existing entry with same date + account + amount
- If found, apply conflict resolution rule

**Resolution Options:**
1. Optima Wins (default): Skip MonoPilot entry, mark as synced
2. MonoPilot Wins: Override Optima entry
3. Manual Review: Flag for Finance Manager approval

### Error Handling

| Error Type | Auto-Retry | Max Retries | Escalation |
|------------|------------|-------------|------------|
| Network timeout | Yes | 3 | Email Finance Manager |
| Authentication failed | No | 0 | Immediate alert |
| Duplicate entry | No | 0 | Manual resolution |
| Mapping missing | No | 0 | Email Finance Manager |
| Validation error | Yes | 1 | Manual resolution |

---

## Accessibility

### Touch Targets
- Action buttons: 48x48dp
- Tab navigation: 48dp height
- Table rows: 48dp height
- Status indicators: 24x24dp minimum

### Contrast
- Status indicators: Green #16A34A, Red #DC2626, Orange #F97316 (AA)
- Table text: 4.5:1
- Sync log status icons: 4.5:1

### Screen Reader
- **Page**: `aria-label="Comarch Optima Integration Page"`
- **Connection status**: `aria-label="Connection status: Connected, last sync 2 minutes ago"`
- **Sync log**: `role="table"` with proper headers
- **Error alerts**: `role="alert"` for critical errors

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate tabs, tables, buttons |
| Enter | Activate button, expand detail |
| Arrow keys | Navigate table rows, tabs |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full dashboard, side-by-side panels, detailed log |
| **Tablet (768-1024px)** | Stacked panels, condensed log |
| **Mobile (<768px)** | 1-column, tab navigation, simplified metrics |

---

## Performance Notes

### Query Optimization

```sql
-- Index for sync log
CREATE INDEX idx_sync_log_status
ON optima_sync_log(org_id, synced_at DESC, status);

-- Index for GL mappings
CREATE INDEX idx_gl_mappings
ON optima_gl_mappings(org_id, monopilot_account_code);
```

### Caching

```typescript
'org:{orgId}:finance:optima:status'       // 2 min TTL
'org:{orgId}:finance:optima:mappings'     // 1 hour TTL
'org:{orgId}:finance:optima:log:recent'   // 5 min TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial page load | < 1s |
| Manual sync trigger | < 500ms (queued) |
| GL mapping import | < 3s |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Comarch Optima Integration', () => {
  it('displays connection status correctly', async () => {});
  it('triggers manual sync', async () => {});
  it('shows sync errors with details', async () => {});
});
```

### E2E Tests
```typescript
describe('Optima Integration E2E', () => {
  it('loads integration status', async () => {});
  it('syncs GL entries to Optima', async () => {});
  it('resolves duplicate error', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Sync workflow documented
- [x] Error resolution defined
- [x] GL mapping specified

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (Finance PRD Section 9.14)
