# INT-011: Comarch Optima Configuration

**Module**: Integrations
**Feature**: Comarch Optima ERP Integration Setup
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Comarch Optima                          [Disconnect]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Connection Status                                                        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Connected to Comarch Optima                                           │ │
│  │ Database: OPTIMA_PROD  |  Version: 2024.1.5  |  Last sync: 5m ago       │ │
│  │ [Test Connection]  [Sync Now]                                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Sync Configuration                                                       │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ☑ Auto-sync enabled (every 30 minutes)                                  │ │
│  │ ☑ Sync on demand available                                              │ │
│  │ ☐ Real-time sync (requires Optima API Premium)                          │ │
│  │                                                                          │ │
│  │ Sync Direction:                                                          │ │
│  │ ● Bidirectional (MonoPilot ↔ Optima)                                    │ │
│  │ ○ MonoPilot → Optima only (export)                                      │ │
│  │ ○ Optima → MonoPilot only (import)                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Data Mapping                                                  [Edit All] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ MonoPilot                  ↔  Comarch Optima          Status    Actions │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Customers                  ↔  Kontrahenci             ✓ Active  [Edit]  │ │
│  │ Last sync: 5m ago (234 records)                                [Sync]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Products                   ↔  Towary                  ✓ Active  [Edit]  │ │
│  │ Last sync: 5m ago (456 records)                                [Sync]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Orders                     ↔  Zamówienia              ✓ Active  [Edit]  │ │
│  │ Last sync: 5m ago (89 records)                                 [Sync]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Invoices                   ↔  Faktury Sprzedaży      ✓ Active  [Edit]  │ │
│  │ Last sync: 5m ago (145 records)                                [Sync]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Purchase Orders            ↔  Zamówienia Zakupu      ⏸ Paused  [Edit]  │ │
│  │ Sync disabled by admin                                         [Sync]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ GL Accounts                ↔  Konta Księgowe         ✓ Active  [Edit]  │ │
│  │ Last sync: 5m ago (67 records)                                 [Sync]  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Sync History (Last 10)                                   [View All Logs] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Time      Entity      Direction   Records  Status                       │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 14:25     Invoices    → Optima    12       ✓ Success (2.3s)             │ │
│  │ 14:00     Customers   ← Optima    3        ✓ Success (1.2s)             │ │
│  │ 13:30     Products    ↔ Both      45       ✓ Success (5.1s)             │ │
│  │ 13:00     Orders      → Optima    8        ✓ Success (1.8s)             │ │
│  │ 12:30     GL Accounts ← Optima    2        ⚠️ Warning (1 skipped)        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Setup Wizard Step 1: Connection

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Connect to Comarch Optima - Step 1 of 3: Database Connection [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Connection Method                                                         │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ● Direct SQL Connection (recommended for on-premise)                     │ │
│  │ ○ Comarch Optima API (requires API license)                              │ │
│  │ ○ ODBC Connection (legacy)                                               │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ SQL Server Connection                                                     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Server Address *                                                          │ │
│  │ [192.168.1.100___________________]  or [server.local____________]        │ │
│  │                                                                           │ │
│  │ Port                                                                      │ │
│  │ [1433____]  (default: 1433)                                               │ │
│  │                                                                           │ │
│  │ Database Name *                                                           │ │
│  │ [OPTIMA_PROD_________________]                                            │ │
│  │                                                                           │ │
│  │ Authentication                                                            │ │
│  │ ● SQL Server Authentication                                              │ │
│  │ ○ Windows Authentication (requires domain integration)                   │ │
│  │                                                                           │ │
│  │ Username *                                                                │ │
│  │ [sa__________________________]                                            │ │
│  │                                                                           │ │
│  │ Password *                                                                │ │
│  │ [••••••••••••••••••••••••••]  [👁 Show]                                  │ │
│  │                                                                           │ │
│  │ ☑ Use encrypted connection (SSL/TLS)                                     │ │
│  │ ☑ Trust server certificate (for self-signed certs)                       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ⚠️  Credentials are encrypted and stored securely in Supabase Vault.         │
│                                                                                │
│  [Cancel]  [Test Connection]                                    [Next Step →]│
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Setup Wizard Step 2: Entity Mapping

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Connect to Comarch Optima - Step 2 of 3: Entity Mapping      [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Select which entities to synchronize between MonoPilot and Comarch Optima.   │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Entity Selection                                                          │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ MonoPilot Entity       Comarch Optima Table  Sync Direction  Enable      │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Customers              Kontrahenci           ↔ Bidirectional  ☑          │ │
│  │ Products               Towary                ↔ Bidirectional  ☑          │ │
│  │ Orders                 Zamówienia            → Export only    ☑          │ │
│  │ Invoices               Faktury Sprzedaży     → Export only    ☑          │ │
│  │ Purchase Orders        Zamówienia Zakupu     ← Import only    ☐          │ │
│  │ Suppliers              Dostawcy              ↔ Bidirectional  ☑          │ │
│  │ GL Accounts            Konta Księgowe        ← Import only    ☑          │ │
│  │ Cost Centers           Centra Kosztów        ← Import only    ☐          │ │
│  │ Payments               Płatności             → Export only    ☐          │ │
│  │ Inventory              Stany Magazynowe      ↔ Bidirectional  ☐          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ℹ️  Sync Direction:                                                           │
│     ↔ Bidirectional: Sync changes in both directions                          │
│     → Export only: MonoPilot → Optima (Optima is read-only)                   │
│     ← Import only: Optima → MonoPilot (MonoPilot is read-only)                │
│                                                                                │
│  [← Back]                                                       [Next Step →] │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Setup Wizard Step 3: Field Mapping (Example: Customers)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Connect to Comarch Optima - Step 3 of 3: Field Mapping       [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Entity: Customers ↔ Kontrahenci                          [Save & Next Entity]│
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Field Mapping                                                             │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ MonoPilot Field     →  Comarch Optima Field       Required  Auto-Map     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Customer Code       →  [Akronim            ▼]     ✓         ✓            │ │
│  │ Customer Name       →  [Nazwa              ▼]     ✓         ✓            │ │
│  │ Tax ID (NIP)        →  [NIP                ▼]               ✓            │ │
│  │ Email               →  [Email              ▼]               ✓            │ │
│  │ Phone               →  [Telefon            ▼]               ✓            │ │
│  │ Address Line 1      →  [Ulica              ▼]               ✓            │ │
│  │ City                →  [Miasto             ▼]               ✓            │ │
│  │ Postal Code         →  [KodPocztowy        ▼]               ✓            │ │
│  │ Country             →  [Kraj               ▼]               ✓            │ │
│  │ Payment Terms       →  [TerminPlatnosci    ▼]               ✓            │ │
│  │ Credit Limit        →  [LimitKredytowy     ▼]               ✓            │ │
│  │ Active              →  [Aktywny            ▼]               ✓            │ │
│  │ Notes               →  [Uwagi              ▼]               ✓            │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Sync Options                                                              │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ☑ Skip records with missing required fields                              │ │
│  │ ☑ Create missing customers in Optima automatically                       │ │
│  │ ☑ Update existing customers if data changes                              │ │
│  │ ☐ Delete customers in MonoPilot if deleted in Optima (dangerous)         │ │
│  │                                                                           │ │
│  │ Conflict Resolution (if same record changed in both systems):            │ │
│  │ ● MonoPilot wins (Optima data overwritten)                               │ │
│  │ ○ Optima wins (MonoPilot data overwritten)                               │ │
│  │ ○ Newest timestamp wins (last modified)                                  │ │
│  │ ○ Manual review (flag for admin)                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [← Back]  [Auto-Map All Fields]  [Save & Next Entity]  [Finish Setup]       │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Comarch Optima                          [Disconnect]         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
│  Loading Comarch Optima configuration...                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State (Not Connected)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Comarch Optima                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [🔗 Icon]                                            │
│                    Not Connected to Comarch Optima                            │
│       Connect MonoPilot to Comarch Optima ERP to synchronize customers,      │
│       products, orders, invoices, and financial data.                        │
│                                                                               │
│       Features:                                                               │
│       • Bidirectional sync (MonoPilot ↔ Optima)                              │
│       • Auto-sync every 30 minutes or on-demand                              │
│       • Field-level mapping customization                                    │
│       • Conflict resolution rules                                            │
│                                                                               │
│                       [Connect to Comarch Optima]                             │
│                                                                               │
│       View Integration Guide  |  Download Technical Docs (PDF)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations > Comarch Optima                          [Disconnect]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Connection Error                                           │
│        Unable to connect to Comarch Optima database.                         │
│        Error: Connection timeout - check server address and firewall rules.  │
│                                                                               │
│       [Test Connection]  [Edit Settings]  [View Logs]  [Contact Support]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Connection Status Card** - Status (connected/disconnected), database name, version, last sync time, [Test Connection] [Sync Now] buttons
2. **Sync Configuration Panel** - Auto-sync toggle, sync interval, real-time sync toggle, sync direction radio buttons
3. **Data Mapping Table** - MonoPilot entity ↔ Optima entity, Status (Active/Paused), Last sync time, Records count, [Edit] [Sync] buttons
4. **Sync History Table** - Timestamp, Entity, Direction (→ ← ↔), Records count, Status (Success/Warning/Error), Duration
5. **Setup Wizard** - 3-step modal (Connection → Entity Mapping → Field Mapping)
6. **Field Mapping Table** - MonoPilot field → Optima field dropdowns, Required indicator, Auto-map status
7. **Sync Options Panel** - Checkboxes for skip/create/update/delete rules, Conflict resolution radio buttons
8. **Status Badges** - ✓ Active (green), ⏸ Paused (gray), ❌ Error (red)

---

## Main Actions

### Primary
- **[Connect to Comarch Optima]** - Opens setup wizard (3-step process)
- **[Sync Now]** - Manually triggers sync for all active entities

### Secondary (Connection)
- **[Test Connection]** - Tests database connection (shows success/error modal)
- **[Disconnect]** - Confirmation → disconnects from Optima (pauses all syncs)

### Secondary (Entity Actions)
- **[Edit]** - Opens field mapping editor for specific entity
- **[Sync]** - Manually syncs specific entity
- **[Edit All]** - Opens bulk field mapping editor

### Wizard Actions
- **[Next Step]** - Proceeds to next wizard step
- **[← Back]** - Returns to previous wizard step
- **[Auto-Map All Fields]** - Automatically maps fields by name similarity
- **[Save & Next Entity]** - Saves current entity mapping, proceeds to next entity
- **[Finish Setup]** - Completes setup, starts initial sync

---

## States

- **Loading**: Skeleton cards + table rows, "Loading configuration..." text
- **Empty**: "Not connected" message, feature list, "Connect to Comarch Optima" CTA + documentation links
- **Error**: "Connection error" warning, error message, action buttons (Test/Edit/Logs/Support)
- **Success**: Connection status + sync config + data mapping table + sync history
- **Syncing**: Progress indicator on entity row, "Syncing..." status
- **Connected**: Green checkmark, database info, last sync time

---

## Data Fields

**Comarch Optima Connection**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Connection ID |
| connection_type | enum | direct_sql, api, odbc |
| server_address | string | SQL Server IP/hostname |
| port | integer | SQL Server port (default: 1433) |
| database_name | string | Optima database name |
| username | string | SQL auth username |
| password_encrypted | string | Encrypted password (Supabase Vault) |
| use_ssl | boolean | Use encrypted connection |
| trust_cert | boolean | Trust self-signed certificates |
| status | enum | connected, disconnected, error |
| last_sync_at | timestamp | Last successful sync time |
| optima_version | string | Detected Optima version |

**Entity Mappings**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Mapping ID |
| monopilot_entity | string | MonoPilot entity name (customers, products, etc.) |
| optima_table | string | Optima table name (Kontrahenci, Towary, etc.) |
| sync_direction | enum | bidirectional, export_only, import_only |
| enabled | boolean | Enable/disable sync for this entity |
| field_mappings | jsonb | {monopilot_field: optima_field} |
| sync_options | jsonb | {skip_missing, create_new, update_existing, delete_if_removed} |
| conflict_resolution | enum | monopilot_wins, optima_wins, newest_wins, manual_review |
| last_sync_at | timestamp | Last sync for this entity |
| last_sync_records | integer | Records synced in last run |

---

## Sync Process

**Initial Sync** (after setup):
1. Fetch all records from Optima for enabled entities
2. Map fields according to field_mappings config
3. Create records in MonoPilot (insert-only, no updates)
4. Log sync results (success/warnings/errors)

**Incremental Sync** (scheduled):
1. Fetch changed records from Optima since last_sync_at (using timestamp columns)
2. Fetch changed records from MonoPilot since last_sync_at
3. Apply conflict resolution rules if same record changed in both systems
4. Update/create records according to sync_direction
5. Log sync results

**Sync Direction Logic**:
- **Bidirectional**: Changes in MonoPilot → Optima AND Optima → MonoPilot
- **Export only**: Changes in MonoPilot → Optima (Optima is read-only)
- **Import only**: Changes in Optima → MonoPilot (MonoPilot is read-only)

---

## Validation

- **Connection**: Server address required, database name required, username/password required if SQL auth
- **Port**: Integer 1-65535
- **Field Mapping**: All required fields must be mapped
- **Sync Options**: At least one option must be enabled (create/update)

---

## Accessibility

- **Touch targets**: All buttons/toggles >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Entity row announces "Entity: {monopilot_entity} synced with {optima_table}, Status: {status}, Last sync: {time}, {records} records"
- **Keyboard**: Tab navigation, Enter to open wizard/editor
- **Password Field**: Toggleable visibility (👁 Show/Hide button)

---

## Related Screens

- **INT-001**: Integrations Dashboard (Comarch Optima integration card)
- **INT-003**: Integration Logs (sync events logged)

---

## Technical Notes

- **RLS**: Comarch Optima connection filtered by `org_id`
- **API**:
  - `GET /api/integrations/comarch-optima/config` (get connection config)
  - `POST /api/integrations/comarch-optima/connect` (setup wizard step 1)
  - `POST /api/integrations/comarch-optima/test-connection` (test connection)
  - `POST /api/integrations/comarch-optima/entity-mappings` (save entity mappings)
  - `POST /api/integrations/comarch-optima/sync` (manual sync all)
  - `POST /api/integrations/comarch-optima/sync/{entity}` (manual sync specific entity)
  - `DELETE /api/integrations/comarch-optima/disconnect` (disconnect)
  - `GET /api/integrations/comarch-optima/sync-history?limit={N}` (sync history)
- **Database Connection**: MS SQL Server via node-mssql library
- **Credentials**: Encrypted with Supabase Vault (never stored in plain text)
- **Sync Scheduler**: Background job (cron) every 30 minutes (configurable)
- **Conflict Detection**: Compare last_modified_at timestamps in both systems
- **Error Handling**: Log sync errors, send email alert if critical entity fails
- **Optima Version Support**: Comarch Optima 2020.x - 2024.x
- **Performance**: Batch sync (1,000 records per batch), use transactions for atomicity

---

**Status**: Draft - Ready for Review
