# INT-009: Import Templates

**Module**: Integrations
**Feature**: CSV/Excel Import with Validation
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Import                                            [+ New Import]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────┐                     │
│  │ Import Templates                  [+ New Template]  │                     │
│  ├─────────────────────────────────────────────────────┤                     │
│  │ 📄 Products Import                                  │                     │
│  │    Format: CSV | Required fields: 8 | Last used: 1d│                     │
│  │    [Use Template] [Download Sample] [Edit] [Delete]│                     │
│  │                                                     │                     │
│  │ 📄 Customers Import                                 │                     │
│  │    Format: XLSX | Required fields: 6 | Last: 5d ago│                     │
│  │    [Use Template] [Download Sample] [Edit] [Delete]│                     │
│  │                                                     │                     │
│  │ 📄 Inventory Adjustment                             │                     │
│  │    Format: CSV | Required fields: 5 | Last: Never  │                     │
│  │    [Use Template] [Download Sample] [Edit] [Delete]│                     │
│  └─────────────────────────────────────────────────────┘                     │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Recent Imports                                      [View All]           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Status     Import           Started    Progress  Results                │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 🔄 Running Products Import   14:23     ████░░░░░░ 67% (234/350 rows)   │ │
│  │                              3m ago    Validating...          [Cancel]  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Done    Customers Import   13:45     100% (89 rows)                   │ │
│  │                              38m ago   ✓ 89 created  [View Report] [⋮] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ⚠️ Warning Products Import    12:30     100% (150 rows)                  │ │
│  │                              1h ago    ✓ 142 created [View Report] [⋮] │ │
│  │                                        ⚠️ 8 warnings                     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ✗ Failed  Inventory Adj.     11:15     50% (25/50 rows)                 │ │
│  │                              3h ago    ❌ Validation errors [View] [⋮]  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 4 of 12 import jobs                                   [View All]     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Import Wizard Step 1: Upload File

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Import Data - Step 1 of 4: Upload File                       [X Close]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Select Import Template                                                    │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Template *                                                                │ │
│  │ [Select template...               ▼]                                      │ │
│  │   - Products Import                                                       │ │
│  │   - Customers Import                                                      │ │
│  │   - Inventory Adjustment                                                  │ │
│  │   - Work Orders Import                                                    │ │
│  │   - Custom (manual field mapping)                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Upload File                                                               │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │                         📁 Drag and drop file here                        │ │
│  │                              or [Choose File]                             │ │
│  │                                                                           │ │
│  │                     Supported formats: CSV, XLSX, XLS                     │ │
│  │                     Max file size: 25 MB (~100,000 rows)                  │ │
│  │                                                                           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ℹ️  Don't have a file? [Download Sample Template]                            │
│                                                                                │
│  [Cancel]                                                        [Next Step →]│
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Import Wizard Step 2: Map Fields

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Import Data - Step 2 of 4: Map Fields                        [X Close]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  File: products_import.csv  |  Rows detected: 350  |  Columns: 12             │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Field Mapping                                                             │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ CSV Column             →    MonoPilot Field      Required  Sample Data   │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Product Code           →    [Product Code    ▼]  ✓         PROD-001      │ │
│  │ Product Name           →    [Product Name    ▼]  ✓         Chocolate Bar │ │
│  │ Category               →    [Category        ▼]  ✓         Confectionery │ │
│  │ Unit Price             →    [Unit Price      ▼]           $12.50        │ │
│  │ Unit of Measure        →    [Unit (UOM)      ▼]  ✓         EA (Each)     │ │
│  │ GTIN                   →    [GTIN-14         ▼]           00012345678905│ │
│  │ Shelf Life Days        →    [Shelf Life      ▼]           365           │ │
│  │ Allergens              →    [Allergens       ▼]           Milk, Soy     │ │
│  │ Active                 →    [Status          ▼]           TRUE          │ │
│  │ Notes                  →    [Description     ▼]           Bestseller    │ │
│  │ Supplier Code          →    [Ignore          ▼]           -             │ │
│  │ Internal ID            →    [Ignore          ▼]           -             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [Auto-Map Fields] - Automatically map by column name similarity               │
│                                                                                │
│  [← Back]                                                      [Next Step →]  │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Import Wizard Step 3: Validate Data

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Import Data - Step 3 of 4: Validate Data                     [X Close]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Validating 350 rows...  ████████████████████████░░  92% complete             │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Validation Summary                                                        │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Valid rows: 342 (97.7%)                                                │ │
│  │ ⚠️ Warnings: 8 (2.3%) - Can proceed with import                          │ │
│  │ ❌ Errors: 0 (0%) - Must fix before import                                │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Issues Found                                       [Filter: All ▼]       │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Row  Type     Field         Issue                          Action        │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ 12   Warning  GTIN           Missing - will skip            [Edit Row]   │ │
│  │ 34   Warning  Unit Price     $0.00 - unusually low          [Edit Row]   │ │
│  │ 45   Warning  Shelf Life     Missing - will default to 365  [Edit Row]   │ │
│  │ 67   Warning  Product Code   Duplicate - will skip          [Edit Row]   │ │
│  │ 89   Warning  Category       Unknown - will create new      [Edit Row]   │ │
│  │ 123  Warning  Allergens      Invalid format (use commas)    [Edit Row]   │ │
│  │ 156  Warning  GTIN           Invalid checksum - will skip   [Edit Row]   │ │
│  │ 234  Warning  Product Name   Truncated (max 100 chars)      [Edit Row]   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  Options:                                                                      │
│  ☑ Skip rows with errors (continue with valid rows only)                      │
│  ☑ Create missing categories automatically                                    │
│  ☐ Update existing products (if Product Code matches)                         │
│                                                                                │
│  [← Back]  [Download Error Report (CSV)]                   [Proceed to Import]│
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Import Wizard Step 4: Review & Confirm

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Import Data - Step 4 of 4: Review & Confirm                  [X Close]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Import Summary                                                            │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ File: products_import.csv                                                 │ │
│  │ Template: Products Import                                                 │ │
│  │ Total rows: 350                                                           │ │
│  │                                                                           │ │
│  │ Actions:                                                                  │ │
│  │ ✓ Create 342 new products                                                │ │
│  │ ⚠️ Skip 8 rows with warnings                                              │ │
│  │ ✓ Create 3 new categories (auto-created)                                 │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Sample Data Preview (first 5 rows)                                       │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Product Code │ Product Name      │ Category       │ Price    │ UOM      │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ PROD-001     │ Chocolate Bar 100g│ Confectionery  │ $12.50   │ EA       │ │
│  │ PROD-002     │ Gummy Bears 500g  │ Confectionery  │ $8.90    │ EA       │ │
│  │ PROD-003     │ Hard Candy Mix    │ Confectionery  │ $15.30   │ KG       │ │
│  │ PROD-004     │ Lollipops 50pk    │ Confectionery  │ $22.00   │ EA       │ │
│  │ PROD-005     │ Fruit Chews 250g  │ Confectionery  │ $6.75    │ EA       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ⚠️  This import will create 342 new records. This action cannot be undone.   │
│                                                                                │
│  [← Back]  [Save as Template]                       [Start Import]            │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Import                                            [+ New Import]       │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
│  Loading import templates and jobs...                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Import                                            [+ New Import]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [📥 Icon]                                            │
│                       No Import Templates Created                             │
│       Create import templates to quickly import CSV/Excel data.              │
│       Supports products, customers, inventory, and custom data types.        │
│                                                                               │
│                       [+ New Import]                                          │
│                                                                               │
│       View Import Guide  |  Download Sample Files                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Import                                            [+ New Import]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load Import Data                                 │
│        Unable to retrieve templates and jobs. Check your connection.         │
│                    Error: IMPORT_FETCH_FAILED                                 │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Import Templates Section** - Template name, format, required fields count, last used, [Use Template] [Download Sample] [Edit] [Delete] buttons
2. **Recent Imports Table** - Status icon, Import name, Started time, Progress bar (for running), Results summary, Actions ([View Report] [Cancel])
3. **Import Wizard** - 4-step modal (Upload → Map → Validate → Confirm)
4. **File Upload Area** - Drag-and-drop zone, file type/size limits
5. **Field Mapping Table** - CSV column → MonoPilot field dropdowns, required indicator, sample data preview
6. **Validation Results** - Summary (valid/warnings/errors), issue list table (row, type, field, issue, action)
7. **Data Preview Table** - Shows first 5 rows of mapped data
8. **Progress Indicator** - Real-time progress bar with percentage and row count
9. **Status Icons** - 🔄 Running (blue), ✓ Done (green), ⚠️ Warning (yellow), ✗ Failed (red)

---

## Main Actions

### Primary
- **[+ New Import]** - Opens import wizard (4-step process)
- **[+ New Template]** - Opens template creation (define data type + field mappings)

### Secondary (Template Actions)
- **Use Template** - Opens import wizard with template pre-selected
- **Download Sample** - Downloads CSV/XLSX template with headers and example rows
- **Edit** - Opens template editor (modify field mappings, validation rules)
- **Delete** - Confirmation → removes template

### Secondary (Import Job Actions)
- **[View Report]** - Opens import report (success/warning/error summary + affected records)
- **[Cancel]** - Cancels running import (confirmation required)
- **[Download Error Report]** - Downloads CSV with validation errors (row, field, issue)

### Wizard Actions
- **[Next Step]** - Proceeds to next wizard step (validates current step)
- **[← Back]** - Returns to previous wizard step
- **[Auto-Map Fields]** - Automatically maps CSV columns to MonoPilot fields (by name similarity)
- **[Edit Row]** - Opens inline editor to fix validation issue
- **[Proceed to Import]** - Starts import with valid rows (skips rows with errors if option checked)
- **[Start Import]** - Confirms and starts async import job

---

## States

- **Loading**: Skeleton templates + import rows, "Loading..." text
- **Empty**: "No import templates created" message, "New Import" CTA + documentation links
- **Error**: "Failed to load import data" warning, error code, Retry + Contact Support
- **Success**: Templates section + recent imports table with running/completed jobs
- **Running**: Progress bar animates, updates every 5s
- **Validation**: Shows validation progress bar, updates in real-time
- **Completed**: Green checkmark, [View Report] button enabled
- **Failed**: Red X, error message, [View Report] button enabled

---

## Data Fields

**Import Templates**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Template ID |
| name | string | Template name |
| data_type | enum | products, customers, inventory, work_orders, custom |
| format | enum | csv, xlsx |
| field_mappings | jsonb | {csv_column: monopilot_field} |
| required_fields | jsonb | Array of required field names |
| validation_rules | jsonb | Custom validation rules |
| last_used_at | timestamp | Last import time |

**Import Jobs**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Job ID |
| template_id | uuid | Template reference (nullable) |
| status | enum | running, completed, warning, failed |
| started_at | timestamp | Job start time |
| completed_at | timestamp | Completion time |
| total_rows | integer | Total rows in file |
| processed_rows | integer | Rows processed |
| created_count | integer | Records created |
| updated_count | integer | Records updated |
| skipped_count | integer | Rows skipped (errors/duplicates) |
| warnings | jsonb | Array of warning messages |
| errors | jsonb | Array of error messages |
| file_name | string | Uploaded file name |

---

## Validation Rules

**Products Import**:
- Product Code: Required, unique, alphanumeric, max 50 chars
- Product Name: Required, max 100 chars
- Category: Required, must exist or auto-create
- Unit Price: Numeric, ≥ 0
- UOM: Required, valid unit code (EA, KG, L, etc.)
- GTIN: Optional, 14 digits, valid checksum
- Shelf Life: Numeric, ≥ 0 (days)
- Allergens: Comma-separated list, valid allergen names

**Customers Import**:
- Customer Code: Required, unique, max 50 chars
- Customer Name: Required, max 100 chars
- Email: Valid email format
- Phone: Valid phone format (optional)
- Address: Max 200 chars

**Inventory Adjustment**:
- Product Code: Required, must exist
- Warehouse: Required, must exist
- Quantity: Required, numeric (positive for add, negative for remove)
- Reason: Required, max 200 chars

---

## Accessibility

- **Touch targets**: All buttons/dropdowns >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Import job announces "Import: {name}, Status: {status}, Progress: {percent}%, {created_count} created, {warnings} warnings, {errors} errors"
- **Keyboard**: Tab navigation, Enter to proceed to next step, Escape to close wizard
- **Progress Updates**: Screen reader announces milestones (25%, 50%, 75%, 100%)
- **Validation Feedback**: Visual + screen reader announces validation errors/warnings

---

## Related Screens

- **INT-001**: Integrations Dashboard (links to Data Import)
- **INT-005**: Data Export (export counterpart)

---

## Technical Notes

- **RLS**: Import templates and jobs filtered by `org_id`
- **API**:
  - `GET /api/integrations/imports/templates`
  - `POST /api/integrations/imports/templates` (create template)
  - `GET /api/integrations/imports/templates/{id}/sample` (download sample CSV/XLSX)
  - `GET /api/integrations/imports/jobs?status={status}&limit={N}`
  - `POST /api/integrations/imports/jobs` (start import - uploads file)
  - `POST /api/integrations/imports/jobs/{id}/cancel` (cancel running job)
  - `GET /api/integrations/imports/jobs/{id}/report` (get import report)
  - `GET /api/integrations/imports/jobs/{id}/errors` (download error report CSV)
- **File Upload**: Supabase Storage (temp bucket, auto-delete after 24h)
- **File Parsing**: CSV parser (csv-parse), XLSX parser (xlsx)
- **Queue**: BullMQ/Supabase Edge Functions for async processing
- **Progress**: WebSocket/Realtime updates every 5s
- **Max File Size**: 25 MB (~100,000 rows)
- **Chunking**: Large imports processed in chunks (1,000 rows per chunk)
- **Transaction**: Atomic commits per chunk (rollback on error)
- **Auto-map**: String similarity algorithm (Levenshtein distance) to match CSV columns to MonoPilot fields
- **Cleanup**: Auto-delete import jobs after 90 days, temp files after 24h

---

**Status**: Draft - Ready for Review
