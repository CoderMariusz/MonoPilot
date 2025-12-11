# SET-029: Import/Export

**Module**: Settings
**Feature**: Bulk Data Import/Export
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export                                            │
├─────────────────────────────────────────────────────────────────────┤
│  [Import Data] [Export Data]                                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ IMPORT DATA                                                   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📤 Upload CSV File                                            │   │
│  │                                                               │   │
│  │  Select Data Type:                                            │   │
│  │  [Products ▼] [Materials ▼] [Recipes/BOMs ▼] [Locations ▼]   │   │
│  │  [Customers ▼] [Suppliers ▼] [Work Orders ▼] [Stock ▼]       │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 📁 Drag & drop CSV file here, or [Browse Files]        │ │   │
│  │  │    Accepted: .csv, .xlsx (max 10MB, 10,000 rows)        │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  [Download CSV Template]                                      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ EXPORT DATA                                                   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📥 Download Data                                              │   │
│  │                                                               │   │
│  │  Full System Backup:                                          │   │
│  │  [Export All Data (ZIP)]  Last backup: 2025-12-10 08:30      │   │
│  │                                                               │   │
│  │  Module-Specific Export:                                      │   │
│  │  [Products] [Materials] [BOMs] [Locations] [Customers]       │   │
│  │  [Suppliers] [Work Orders] [Stock] [Audit Logs]              │   │
│  │                                                               │   │
│  │  Format: [CSV ▼] [Excel ▼] [JSON ▼]                          │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ IMPORT HISTORY                                [Clear History] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Date         Type      Status    Records   User       Actions │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Dec 11, 14:23 Products Success ✓ 245      Sarah M   [View]   │   │
│  │ Dec 10, 09:15 Materials Failed ⚠ 0/120    John D    [Retry]  │   │
│  │ Dec 09, 16:45 Locations Success ✓ 87      Mike T    [View]   │   │
│  │                                            [Load More (15)]   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Tabs:
- [Import Data]: Upload interface + mapping tool
- [Export Data]: Download options
- Import History: Inline table below main sections
```

### Import Mapping/Validation Preview (After CSV Upload)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export > Products Import                          │
├─────────────────────────────────────────────────────────────────────┤
│  📄 File: products_2025-12-11.csv (245 rows)                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ COLUMN MAPPING                                                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ CSV Column         → MonoPilot Field        Status            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Product Code       → SKU (sku)              ✓ Mapped          │   │
│  │ Product Name       → Name (name)            ✓ Mapped          │   │
│  │ Description        → Description (desc)     ✓ Mapped          │   │
│  │ Price              → Unit Price (price)     ✓ Mapped          │   │
│  │ Category           → [Ignore] ▼             ⚠ Unmapped        │   │
│  │ Barcode (EAN-13)   → GTIN-14 (gtin)         ✓ Mapped          │   │
│  │                                              [Auto-Map All]   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ VALIDATION PREVIEW                                            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ✓ Valid: 240 rows                                             │   │
│  │ ⚠ Warnings: 3 rows (duplicate SKUs, will update existing)    │   │
│  │ ✗ Errors: 2 rows (missing required field: GTIN)              │   │
│  │                                                               │   │
│  │ [View Errors (2)] [View Warnings (3)]                         │   │
│  │                                                               │   │
│  │ Preview (first 5 rows):                                       │   │
│  │ ┌──────────────────────────────────────────────────────────┐ │   │
│  │ │ Row SKU      Name          Price   GTIN            Status│ │   │
│  │ ├──────────────────────────────────────────────────────────┤ │   │
│  │ │ 1   PRD-001  Wheat Flour   $5.50   12345678901234  ✓     │ │   │
│  │ │ 2   PRD-002  Sugar White   $3.20   12345678901235  ✓     │ │   │
│  │ │ 3   PRD-003  Cocoa Powder  $12.00  [MISSING]       ✗     │ │   │
│  │ │ 4   PRD-001  Flour (DUP)   $5.50   12345678901234  ⚠     │ │   │
│  │ │ 5   PRD-005  Vanilla Ext.  $18.00  12345678901237  ✓     │ │   │
│  │ └──────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Import Options:                                                      │
│  [✓] Update existing records (if SKU matches)                         │
│  [✓] Skip rows with errors                                            │
│  [ ] Send email when import completes                                 │
│                                                                       │
│  [Cancel]  [Fix Errors in CSV]  [Import 243 Valid Rows]              │
└─────────────────────────────────────────────────────────────────────┘
```

### Loading State (Import Processing)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export                                            │
├─────────────────────────────────────────────────────────────────────┤
│                          [⏳ Icon]                                    │
│                   Importing Products...                               │
│                                                                       │
│  [████████████████░░░░░░░░░░] 180/245 rows (73%)                     │
│                                                                       │
│  Processing: PRD-180 (Vanilla Extract)                                │
│  Est. time remaining: 15 seconds                                      │
│                                                                       │
│  [Cancel Import]                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State (No Import History)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export                                            │
├─────────────────────────────────────────────────────────────────────┤
│                          [📦 Icon]                                    │
│                    Migrate Data from Spreadsheets                     │
│    Import products, materials, recipes, locations in bulk via CSV.   │
│         Export all data for backups or external reporting.            │
│                                                                       │
│  [Upload First CSV]  [Download Sample Templates]                     │
│                                                                       │
│  Popular imports: Products (245), BOMs (87), Locations (34)           │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State (Import Failed)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export                                            │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                      Import Failed                                    │
│     2 rows contain errors that must be fixed before importing.        │
│                                                                       │
│  Errors:                                                              │
│  • Row 3: Missing required field "GTIN-14"                            │
│  • Row 87: Invalid price format "$12.5X" (must be decimal)            │
│                                                                       │
│  [Download Error Report (CSV)]  [Fix & Re-Upload]  [Contact Support] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Import Panel** - Data type selector (8 types: Products, Materials, BOMs, Locations, Customers, Suppliers, WOs, Stock), drag-drop CSV uploader, template download link
2. **Export Panel** - Full backup button (ZIP all data), module-specific export buttons (8 modules), format selector (CSV/Excel/JSON)
3. **Import History Table** - Date, Type, Status (Success/Failed/Partial), Records count, User, [View]/[Retry] actions, last 20 imports
4. **Column Mapping Tool** - CSV columns → MonoPilot fields, auto-mapping suggestions, [Ignore] option, manual dropdown selectors
5. **Validation Preview** - Valid/Warning/Error counts, expandable error details, preview table (first 5 rows), row-level status icons
6. **Import Options** - Checkboxes: Update existing (upsert mode), Skip errors, Email notification on completion
7. **Progress Modal** - Progress bar (%), current row/record, ETA, [Cancel] button
8. **Error Report** - Downloadable CSV (row number, error message, field, value), inline error list (up to 10, then "Download full report")
9. **CSV Templates** - Pre-formatted CSV files with headers + sample data, available for all 8 data types
10. **Backup History** - Full backup date/time, file size, download link (7-day retention)

---

## Main Actions

### Primary
- **[Upload CSV]** - Drag-drop or browse → parse → auto-map columns → validate → preview → import (upsert or insert-only)
- **[Export All Data]** - Generates full backup ZIP (all modules, CSV format) → ~5-30s depending on data size → download
- **[Import Valid Rows]** - Executes import (batch inserts/updates), skips error rows, logs to history, sends email if enabled

### Secondary
- **[Download Template]** - Pre-formatted CSV template (headers + 3 sample rows) for selected data type
- **[Auto-Map All]** - Attempts to match CSV column names to MonoPilot fields (fuzzy matching: "SKU"/"Product Code"/"Code" → sku)
- **[Export Module]** - Single-click export (Products/Materials/BOMs/etc.) → CSV download (includes all columns, filtered by org_id)
- **[View Import Details]** - Opens modal showing imported records, errors, warnings, duration, file name
- **[Retry Import]** - Re-uploads last CSV, skips to validation/mapping screen (pre-populated from history)
- **[Cancel Import]** - Stops in-progress import (rolls back all changes via transaction)
- **[Download Error Report]** - CSV file with error rows + error messages (row number, field, value, error)

### Validation/Warnings
- **Duplicate Detection** - Warns if SKU/Code exists (offers update mode or skip)
- **Required Fields** - Blocks import if missing required columns (SKU, Name, GTIN for products)
- **Data Type Validation** - Price must be decimal, dates ISO 8601, GTINs 14 digits, etc.
- **Foreign Key Validation** - Checks if referenced IDs exist (e.g., BOM references valid product IDs)
- **File Size Limits** - Max 10MB file, max 10,000 rows per import (warn at 5k, hard limit at 10k)

---

## States

- **Loading**: Progress modal during import (progress bar, ETA, current row), "Generating export..." spinner for large exports
- **Empty**: "Migrate data from spreadsheets" message, "Upload First CSV" + "Download Templates" CTAs, no import history
- **Error**: Import failed alert, error list (up to 10 inline), "Download Error Report" + "Fix & Re-Upload" buttons
- **Success**: Import/Export panels, import history table (last 20), module export buttons, backup status (last backup date)

---

## Supported Data Types (Import)

| Data Type | Required Fields | Optional Fields | Template |
|-----------|-----------------|-----------------|----------|
| Products | SKU, Name, GTIN-14 | Description, Price, Category, Unit | [products_template.csv] |
| Materials | Code, Name, Unit | Description, Cost, Supplier, Min/Max Stock | [materials_template.csv] |
| BOMs/Recipes | Product SKU, Material Code, Quantity | Unit, Yield%, Version, Notes | [boms_template.csv] |
| Locations | Code, Warehouse Code, Type | Aisle, Shelf, Bin, Capacity | [locations_template.csv] |
| Customers | Code, Name, Tax ID | Email, Phone, Address, Payment Terms | [customers_template.csv] |
| Suppliers | Code, Name, Tax ID | Email, Phone, Address, Lead Time | [suppliers_template.csv] |
| Work Orders | WO Number, Product SKU, Qty | Scheduled Date, Priority, Notes | [work_orders_template.csv] |
| Stock | LP Number, Material Code, Qty, Location | Lot, Expiry, Received Date, Status | [stock_template.csv] |

---

## Export Formats

### CSV (Default)
- Headers row + data rows
- UTF-8 encoding
- Comma-separated, quoted strings
- Filename: `{module}-{org_code}-{YYYY-MM-DD}.csv`

### Excel (.xlsx)
- Single worksheet per module
- Formatted headers (bold, color)
- Auto-column width
- Filename: `{module}-{org_code}-{YYYY-MM-DD}.xlsx`

### JSON
- Array of objects (one per record)
- All fields included (including IDs, timestamps)
- Filename: `{module}-{org_code}-{YYYY-MM-DD}.json`

### Full Backup (ZIP)
- One CSV file per module (11 files)
- README.txt with export metadata (date, user, org, record counts)
- Filename: `monopilot-backup-{org_code}-{YYYY-MM-DD-HHmm}.zip`

---

## Import Processing Logic

1. **Upload** → Parse CSV (detect delimiter, encoding)
2. **Auto-Map** → Match CSV headers to DB fields (fuzzy matching)
3. **Validate** → Check required fields, data types, foreign keys
4. **Preview** → Show first 5 rows + error/warning counts
5. **Confirm** → User reviews, adjusts mapping, enables upsert mode
6. **Import** → Batch insert/update (100 rows per batch, transaction-wrapped)
7. **Log** → Save import history (file name, user, status, counts, errors)
8. **Notify** → Toast notification + optional email (if enabled)

---

## Permissions

| Role | Can Import | Can Export | Can Download Backups | Can View History |
|------|------------|------------|----------------------|------------------|
| Super Admin | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes (own modules) | Yes (own modules) | Yes | Yes |
| Operator | No | No | No | No |
| Viewer | No | No | No | No |

---

## Validation Rules

- **SKU/Code Uniqueness**: Check against existing records (per org), warn if duplicate (offer upsert)
- **GTIN Format**: 14 digits for products, 13 for EAN-13, validate check digit
- **Price/Cost**: Decimal format, non-negative, max 2 decimal places
- **Dates**: ISO 8601 (YYYY-MM-DD) or US format (MM/DD/YYYY), auto-detect
- **Foreign Keys**: Validate referenced IDs exist (e.g., BOM references valid Product SKU)
- **File Size**: Max 10MB per file, max 10,000 rows
- **CSV Structure**: Must have header row, at least one data row, no empty columns

---

## Accessibility

- **Touch targets**: Upload area >= 120x120dp, buttons >= 48x48dp, import history rows >= 48dp
- **Contrast**: Validation status icons (✓ green, ⚠ orange, ✗ red) + text labels (not color-only)
- **Screen reader**: "Upload CSV for {data_type}, drop file or click to browse", "Row 3 error: missing GTIN-14 field"
- **Keyboard**: Tab to upload area, Enter to activate, Spacebar to toggle checkboxes, Arrow keys for table navigation
- **Focus indicators**: Clear 2px outline on upload area, mapping dropdowns, buttons
- **Progress announcements**: Live region announces "180 of 245 rows imported, 73% complete"

---

## Related Screens

- **Import Mapping Modal**: Column mapping interface (CSV column → MonoPilot field dropdowns)
- **Validation Preview Panel**: Expandable error/warning details, preview table (first 10 rows)
- **Progress Modal**: Import/export progress bar, ETA, cancel button
- **Error Report Download**: Generates CSV with row-level errors (row #, field, value, error message)
- **Template Library**: List of all CSV templates (8 types), download links, sample data preview

---

## Technical Notes

- **API**: `POST /api/settings/import/{data_type}` → body: FormData (CSV file) → returns validation results
- **API**: `POST /api/settings/import/{data_type}/execute` → body: {mapping, options} → executes import
- **API**: `GET /api/settings/export/{module}?format={csv|xlsx|json}` → returns file download
- **API**: `GET /api/settings/export/full-backup` → generates ZIP file (async job if >1GB data)
- **Database**: `import_history` table (id, org_id, data_type, file_name, status, records_imported, errors, user_id, created_at)
- **Storage**: Uploaded CSVs stored in Supabase Storage (7-day retention), full backups stored 30 days
- **Batch Processing**: Import 100 rows per batch (to avoid timeouts), wrap in transaction (rollback on error)
- **Validation**: Zod schemas for each data type (reuse existing schemas from `lib/validation/`)
- **Auto-Mapping**: Fuzzy match CSV headers to DB fields (Levenshtein distance, common aliases: "SKU"/"Code"/"Product Code" → sku)
- **Upsert Logic**: If SKU/Code exists + upsert enabled → UPDATE, else → INSERT
- **Error Handling**: Collect all errors, generate report, show first 10 inline + download full CSV
- **Export Performance**: Stream large exports (avoid loading all data into memory), use database cursors
- **RLS**: All imports/exports filtered by `org_id` automatically
- **Caching**: No caching (real-time data), imports invalidate relevant module caches
- **File Formats**: Support CSV (RFC 4180), Excel (.xlsx via SheetJS), JSON (pretty-printed)

---

## Data Migration Use Cases

### Migrating from Spreadsheets (First-Time Setup)
1. User downloads product template CSV
2. User copies data from Excel → CSV template (match column headers)
3. User uploads products.csv (245 rows)
4. System auto-maps columns → validates → shows 2 errors (missing GTINs)
5. User fixes errors in CSV → re-uploads
6. System validates → all green → user clicks [Import 245 Rows]
7. Import completes → 245 products created → toast: "245 products imported successfully"
8. Repeat for Materials (120), BOMs (87), Locations (34)

### Daily Backup
1. Admin clicks [Export All Data]
2. System generates ZIP (11 CSV files + README)
3. Download completes → admin saves to local/cloud storage
4. Backup file: `monopilot-backup-ACME-2025-12-11-1430.zip` (12.4 MB)

### Updating Prices in Bulk
1. User exports Products → CSV
2. User updates Price column in Excel
3. User uploads updated CSV
4. System detects 245 duplicate SKUs → offers upsert mode
5. User enables [Update existing records]
6. System validates → previews changes (245 updates)
7. User confirms → import executes → 245 products updated (prices changed)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-029-import-export]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
