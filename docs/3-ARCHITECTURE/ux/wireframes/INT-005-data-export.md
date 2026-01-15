# INT-005: Data Export Page

**Module**: Integrations
**Feature**: Export Templates & Async Jobs
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Export                                            [+ Create Export]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────┐                     │
│  │ Export Templates                  [+ New Template]  │                     │
│  ├─────────────────────────────────────────────────────┤                     │
│  │ 📊 Orders Export                                    │                     │
│  │    Format: CSV | Fields: 12 | Last used: 2d ago    │                     │
│  │    [Export Now] [Edit] [Delete]                     │                     │
│  │                                                     │                     │
│  │ 📊 Inventory Snapshot                               │                     │
│  │    Format: XLSX | Fields: 18 | Last used: 5h ago   │                     │
│  │    [Export Now] [Edit] [Delete]                     │                     │
│  │                                                     │                     │
│  │ 📊 Production Schedule                              │                     │
│  │    Format: JSON | Fields: 25 | Last used: Never    │                     │
│  │    [Export Now] [Edit] [Delete]                     │                     │
│  └─────────────────────────────────────────────────────┘                     │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Export Queue                                        [Clear Completed]   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Status     Export           Started    Progress  Actions                │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 🔄 Running Orders Export     14:23     ████░░░░░░ 67% (12,345/18,420)  │ │
│  │                              3m ago    Est: 2m left           [Cancel]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ⏳ Queued  Inventory Snap    14:25     Waiting... Position: 2nd        │ │
│  │                              1m ago                           [Cancel]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Done    Production Sch     14:15     100% (5,234 rows)               │ │
│  │                              8m ago    Completed in 45s [Download] [⋮] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Done    Orders Export      13:45     100% (18,420 rows)              │ │
│  │                              38m ago   Completed in 2m  [Download] [⋮] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✗ Failed  Customer List      13:30     Error: Timeout after 5m         │ │
│  │                              53m ago   (15,000/25,000) [Retry] [⋮]     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 12 export jobs                                   [View All]     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Create Export Modal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Create Data Export                                            [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 1: Select Data Source                                               │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Data Type *                                                               │ │
│  │ [Select data type...              ▼]                                      │ │
│  │   - Orders                                                                │ │
│  │   - Work Orders                                                           │ │
│  │   - Products                                                              │ │
│  │   - Inventory (Current Stock)                                             │ │
│  │   - Inventory Transactions                                                │ │
│  │   - Shipments                                                             │ │
│  │   - Quality Tests                                                         │ │
│  │   - Customers                                                             │ │
│  │   - Suppliers                                                             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 2: Filters & Date Range                                             │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Date Range                                                                │ │
│  │ ● Last 30 days                                                            │ │
│  │ ○ Last 90 days                                                            │ │
│  │ ○ Custom range: [01/01/2026] to [01/15/2026] 📅                          │ │
│  │                                                                           │ │
│  │ Status Filter (optional)                                                  │ │
│  │ [All statuses                     ▼]                                      │ │
│  │                                                                           │ │
│  │ Additional Filters (optional)                                             │ │
│  │ ☐ Only active records                                                     │ │
│  │ ☐ Exclude archived                                                        │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 3: Select Fields                                                    │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ☑ Order Number          ☑ Customer Name       ☑ Order Date               │ │
│  │ ☑ Status                ☑ Total Amount        ☐ Payment Terms            │ │
│  │ ☑ Delivery Date         ☐ Delivery Address    ☐ Special Instructions     │ │
│  │ ☑ Items (line items)    ☐ Tax Amount          ☐ Discount Amount          │ │
│  │                                                                           │ │
│  │ [Select All] [Clear All] [Use Template ▼]                                 │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 4: Export Format                                                    │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ● CSV (Comma-separated)         Max size: 100 MB | ~500,000 rows         │ │
│  │ ○ XLSX (Excel)                  Max size: 50 MB  | ~1,000,000 rows       │ │
│  │ ○ JSON (Structured data)        Max size: 100 MB | ~200,000 records      │ │
│  │ ○ XML (Enterprise systems)      Max size: 50 MB  | ~100,000 records      │ │
│  │                                                                           │ │
│  │ ☑ Save as template: [Orders Export Template____________]                 │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  Estimated rows: ~18,420  |  Est. file size: ~2.3 MB  |  Est. time: ~30s      │
│                                                                                │
│  [Cancel]                                              [Start Export]         │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Export                                            [+ Create Export]    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐                     │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │                     │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │                     │
│  └─────────────────────────────────────────────────────┘                     │
│  Loading export templates and jobs...                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Export                                            [+ Create Export]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [📤 Icon]                                            │
│                       No Export Templates Created                             │
│       Create export templates to quickly export data in various formats.     │
│       Supports CSV, XLSX, JSON, and XML for integration with external        │
│       systems.                                                                │
│                                                                               │
│                       [+ Create Export]                                       │
│                                                                               │
│       View Export Guide  |  Browse Template Examples                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Export                                            [+ Create Export]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load Export Data                                 │
│        Unable to retrieve templates and jobs. Check your connection.         │
│                    Error: EXPORT_FETCH_FAILED                                 │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Export Templates Section** - Template name, format icon, field count, last used, [Export Now] [Edit] [Delete] buttons
2. **Export Queue Table** - Status icon, Export name, Started time, Progress bar (for running), Estimated time remaining, Actions ([Download] [Retry] [Cancel])
3. **Create Export Modal** - 4-step wizard (Data Source → Filters → Fields → Format)
4. **Progress Indicator** - Real-time progress bar with percentage and row count (e.g., "67% (12,345/18,420)")
5. **Template Quick Actions** - [Export Now] instantly queues export with saved template
6. **Field Selector** - Checkboxes grouped by category, [Select All] [Clear All] helpers
7. **Format Selector** - Radio buttons with max size/row limits per format
8. **Status Icons** - 🔄 Running (blue), ⏳ Queued (gray), ✓ Done (green), ✗ Failed (red)
9. **Download Button** - Available for completed exports (auto-expires after 7 days)
10. **Clear Completed Button** - Removes completed/failed jobs from queue view

---

## Main Actions

### Primary
- **[+ Create Export]** - Opens modal (4-step wizard) → queues async export job
- **[+ New Template]** - Opens template creation (save field selection for reuse)

### Secondary (Template Actions)
- **Export Now** - Instantly queues export with saved template settings
- **Edit** - Opens template editor (modify fields, filters)
- **Delete** - Confirmation → removes template

### Secondary (Queue Actions)
- **[Download]** - Downloads completed export file (available for 7 days)
- **[Retry]** - Retries failed export (same params)
- **[Cancel]** - Cancels running/queued export
- **[Clear Completed]** - Removes all completed/failed jobs from view
- **[View All]** - Opens full export history page (last 90 days)

---

## States

- **Loading**: Skeleton templates + queue rows, "Loading..." text
- **Empty**: "No export templates created" message, "Create Export" CTA + documentation links
- **Error**: "Failed to load export data" warning, error code, Retry + Contact Support
- **Success**: Templates section + export queue with running/queued/completed jobs
- **Running**: Progress bar animates, updates every 5s
- **Queued**: Shows queue position (e.g., "Position: 2nd")
- **Completed**: Green checkmark, [Download] button enabled
- **Failed**: Red X, error message, [Retry] button enabled

---

## Data Fields

**Export Templates**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Template ID |
| name | string | Template name |
| data_type | enum | orders, work_orders, products, inventory, etc. |
| fields | jsonb | Selected field names |
| filters | jsonb | Saved filter criteria |
| format | enum | csv, xlsx, json, xml |
| last_used_at | timestamp | Last export time |

**Export Jobs**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Job ID |
| template_id | uuid | Template reference (nullable) |
| status | enum | queued, running, completed, failed |
| started_at | timestamp | Job start time |
| completed_at | timestamp | Completion time |
| progress | integer | Progress percentage (0-100) |
| total_rows | integer | Estimated total rows |
| processed_rows | integer | Rows processed so far |
| file_url | string | Download URL (S3/Supabase Storage, expires 7d) |
| error_message | text | Error details (if failed) |
| duration_seconds | integer | Total processing time |

---

## Export Formats

**CSV**:
- Max size: 100 MB
- Max rows: ~500,000
- Use case: Simple imports, Excel viewing

**XLSX**:
- Max size: 50 MB
- Max rows: ~1,000,000 (Excel limit)
- Use case: Complex formatting, pivot tables

**JSON**:
- Max size: 100 MB
- Max records: ~200,000
- Use case: API integrations, structured data

**XML**:
- Max size: 50 MB
- Max records: ~100,000
- Use case: Enterprise systems (EDI, ERP)

---

## Validation

- **Create**: Data type required, at least 1 field selected, date range valid
- **Template Name**: Required (max 100 chars), unique per org
- **Field Selection**: Min 1 field, max 50 fields
- **Date Range**: Max 1 year for large datasets
- **File Size**: Warn if estimated size > format limit
- **Concurrent Jobs**: Max 5 running exports per org (queue additional)

---

## Accessibility

- **Touch targets**: All buttons/checkboxes >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Progress announces "Export running: 67% complete, 12,345 of 18,420 rows processed"
- **Keyboard**: Tab navigation, Space to toggle checkboxes, Enter to start export
- **Progress Updates**: Screen reader announces milestones (25%, 50%, 75%, 100%)
- **Download Ready**: Toast notification "Export completed. Ready to download."

---

## Related Screens

- **INT-001**: Integrations Dashboard (links to Data Export)
- **INT-009**: Import Templates (import counterpart)

---

## Technical Notes

- **RLS**: Export templates and jobs filtered by `org_id`
- **API**:
  - `GET /api/integrations/exports/templates`
  - `POST /api/integrations/exports/templates` (create template)
  - `GET /api/integrations/exports/jobs?status={status}&limit={N}`
  - `POST /api/integrations/exports/jobs` (start export)
  - `POST /api/integrations/exports/jobs/{id}/cancel` (cancel running job)
  - `GET /api/integrations/exports/jobs/{id}/download` (get download URL)
- **Queue**: BullMQ/Supabase Edge Functions for async processing
- **Storage**: Supabase Storage with signed URLs (7-day expiry)
- **Progress**: WebSocket/Realtime updates every 5s
- **Concurrency**: Max 5 concurrent exports per org, additional jobs queued
- **Retry Logic**: Auto-retry failed exports (up to 3 attempts)
- **Cleanup**: Auto-delete files after 7 days, jobs after 90 days
- **Chunking**: Large exports streamed in chunks (10,000 rows per chunk)

---

**Status**: Draft - Ready for Review
