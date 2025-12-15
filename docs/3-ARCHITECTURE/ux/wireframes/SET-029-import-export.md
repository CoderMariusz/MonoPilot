# SET-029: Import/Export

**Module**: Settings
**Feature**: Bulk Data Import/Export + Configuration Restore
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export                                            │
├─────────────────────────────────────────────────────────────────────┤
│  [Import Data] [Export Data] [Restore Config]                        │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ IMPORT DATA                                                   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📤 Upload CSV File                                            │   │
│  │                                                               │   │
│  │  Select Data Type:                                            │   │
│  │  [Products ▼] [Materials ▼] [Recipes/BOMs ▼] [Locations ▼]   │   │
│  │  [Customers ▼] [Suppliers ▼] [Work Orders ▼] [Stock ▼]       │   │
│  │  [Users ▼]                                                    │   │
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
│  │ RESTORE CONFIGURATION                                        │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🔄 Restore System Settings                                    │   │
│  │                                                               │   │
│  │  Upload a configuration backup file to restore settings:     │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 📁 Select backup file (.json, max 50MB)                │ │   │
│  │  │    or [Browse Files]                                   │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ⚠️  WARNING: Restore will overwrite current settings        │   │
│  │  [Restore Settings]                                           │   │
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
- [Restore Config]: Backup restoration interface
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

### User Import Validation Preview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export > Users Import                             │
├─────────────────────────────────────────────────────────────────────┤
│  📄 File: users_2025-12-11.csv (25 rows)                             │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ COLUMN MAPPING                                                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ CSV Column         → MonoPilot Field        Status            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Employee Code      → Code (code)            ✓ Mapped          │   │
│  │ Email              → Email (email)          ✓ Mapped          │   │
│  │ Full Name          → Full Name (full_name)  ✓ Mapped          │   │
│  │ Role               → Role (role)            ✓ Mapped          │   │
│  │ Language           → Language (language)    ✓ Mapped          │   │
│  │ Status             → Status (status)        ✓ Mapped          │   │
│  │                                              [Auto-Map All]   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ VALIDATION PREVIEW                                            │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ✓ Valid: 23 rows                                              │   │
│  │ ⚠ Warnings: 1 row (email exists, will reactivate)             │   │
│  │ ✗ Errors: 1 row (invalid role "Supervisor")                  │   │
│  │                                                               │   │
│  │ Valid Roles: Admin, Manager, Operator, Viewer, Finance       │   │
│  │                                                               │   │
│  │ [View Errors (1)] [View Warnings (1)]                         │   │
│  │                                                               │   │
│  │ Preview (first 5 rows):                                       │   │
│  │ ┌──────────────────────────────────────────────────────────┐ │   │
│  │ │ Row Code Email          Role      Language Status       │ │   │
│  │ ├──────────────────────────────────────────────────────────┤ │   │
│  │ │ 1   EMP001 john@acme.com Manager  English  active   ✓   │ │   │
│  │ │ 2   EMP002 sarah@acme.com Admin    English  active   ✓   │ │   │
│  │ │ 3   EMP003 mike@acme.com  Supervisor English  active   ✗ │ │   │
│  │ │ 4   EMP001 john@acme.com Manager  English  active   ⚠   │ │   │
│  │ │ 5   EMP004 lisa@acme.com  Operator Spanish  active   ✓   │ │   │
│  │ └──────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Import Options:                                                      │
│  [✓] Send invitation emails to new users                             │
│  [✓] Skip rows with errors                                            │
│  [ ] Add users to default team                                        │
│                                                                       │
│  [Cancel]  [Fix Errors in CSV]  [Import 23 Valid Users]              │
└─────────────────────────────────────────────────────────────────────┘
```

### Configuration Restore Preview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export > Restore Configuration                    │
├─────────────────────────────────────────────────────────────────────┤
│  📄 File: monopilot-config-ACME-2025-12-11.json (2.4 MB)             │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ RESTORE PREVIEW - What will be restored?                     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Organization Settings:                                        │   │
│  │   • Company Name: ACME Foods Inc.                             │   │
│  │   • Tax ID: 12-3456789                                        │   │
│  │   • Time Zone: America/New_York                               │   │
│  │                                                               │   │
│  │ System Settings:                                              │   │
│  │   • Audit Log Retention: 365 days                             │   │
│  │   • Import Batch Size: 100 rows                               │   │
│  │   • Backup Retention: 30 days                                 │   │
│  │                                                               │   │
│  │ Products: 245 records (will replace current 250)              │   │
│  │ Materials: 120 records (will replace current 115)             │   │
│  │ Locations: 34 records (will replace current 40)               │   │
│  │ Customers: 87 records (will replace current 92)               │   │
│  │                                                               │   │
│  │ Total Impact: 486 records affected                            │   │
│  │                                                               │   │
│  │ Created: 2025-12-10 14:30 UTC by Sarah M.                     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ ⚠️  WARNING                                                     │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ This action CANNOT be undone.                                 │   │
│  │ Current configuration will be permanently replaced.           │   │
│  │ Make a backup of current settings before proceeding.          │   │
│  │                                                               │   │
│  │ Type "CONFIRM RESTORE" to proceed:                            │   │
│  │ [___________________________]                                  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  [Cancel]  [Restore Configuration]                                   │
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
│    Import products, materials, recipes, locations, users in bulk.    │
│    Export all data for backups. Restore previous configurations.     │
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

### Restore Configuration Error State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Import/Export > Restore Configuration                    │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                      Restore Failed                                   │
│      The backup file is corrupted or incompatible with your system.   │
│                                                                       │
│  Error Details:                                                       │
│  • Invalid JSON format                                                │
│  • Expected backup version 2.0, got version 1.5                       │
│                                                                       │
│  [Upload Different File]  [Contact Support]  [View Requirements]      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Import Panel** - Data type selector (9 types: Products, Materials, BOMs, Locations, Customers, Suppliers, WOs, Stock, Users), drag-drop CSV uploader, template download link
2. **Export Panel** - Full backup button (ZIP all data), module-specific export buttons (8 modules), format selector (CSV/Excel/JSON)
3. **Restore Config Panel** - Backup file upload, restore preview (org settings, affected modules, record counts), warning message, confirmation input field
4. **Import History Table** - Date, Type, Status (Success/Failed/Partial), Records count, User, [View]/[Retry] actions, last 20 imports
5. **Column Mapping Tool** - CSV columns → MonoPilot fields, auto-mapping suggestions, [Ignore] option, manual dropdown selectors
6. **Validation Preview** - Valid/Warning/Error counts, expandable error details, preview table (first 5 rows), row-level status icons
7. **Import Options** - Checkboxes: Update existing (upsert mode), Skip errors, Email notification on completion
8. **Restore Preview Modal** - What will be restored (org settings, affected modules, record counts), creation date/user, warning banner
9. **Progress Modal** - Progress bar (%), current row/record, ETA, [Cancel] button
10. **Error Report** - Downloadable CSV (row number, error message, field, value), inline error list (up to 10, then "Download full report")
11. **CSV Templates** - Pre-formatted CSV files with headers + sample data, available for all 9 data types
12. **Backup History** - Full backup date/time, file size, download link (7-day retention)

---

## Main Actions

### Primary
- **[Upload CSV]** - Drag-drop or browse → parse → auto-map columns → validate → preview → import (upsert or insert-only)
- **[Export All Data]** - Generates full backup ZIP (all modules, CSV format) → ~5-30s depending on data size → download
- **[Import Valid Rows]** - Executes import (batch inserts/updates), skips error rows, logs to history, sends email if enabled
- **[Restore Settings]** - Validates backup → previews changes → executes restore → logs to history → confirmation

### Secondary
- **[Download Template]** - Pre-formatted CSV template (headers + 3 sample rows) for selected data type
- **[Auto-Map All]** - Attempts to match CSV column names to MonoPilot fields (fuzzy matching: "SKU"/"Product Code"/"Code" → sku)
- **[Export Module]** - Single-click export (Products/Materials/BOMs/etc.) → CSV download (includes all columns, filtered by org_id)
- **[View Import Details]** - Opens modal showing imported records, errors, warnings, duration, file name
- **[Retry Import]** - Re-uploads last CSV, skips to validation/mapping screen (pre-populated from history)
- **[Cancel Import]** - Stops in-progress import (rolls back all changes via transaction)
- **[Download Error Report]** - CSV file with error rows + error messages (row number, field, value, error)
- **[Send Invitations]** - Bulk email invitations to newly imported users

### Validation/Warnings
- **Duplicate Detection** - Warns if SKU/Code/Email exists (offers update mode or skip)
- **Required Fields** - Blocks import if missing required columns (SKU, Name, GTIN for products; Code, Email, Role for users)
- **Data Type Validation** - Price must be decimal, dates ISO 8601, GTINs 14 digits, emails valid, roles in allowed list, etc.
- **Role Validation** - User import validates roles (Admin, Manager, Operator, Viewer, Finance) + case-insensitive matching
- **Email Uniqueness** - Warns if email already exists in system (can reactivate inactive user or skip)
- **Foreign Key Validation** - Checks if referenced IDs exist (e.g., BOM references valid product IDs)
- **File Size Limits** - Max 10MB file, max 10,000 rows per import (warn at 5k, hard limit at 10k)
- **Backup Compatibility** - Validates backup file version, JSON structure, required fields before restore

---

## States

- **Loading**: Progress modal during import (progress bar, ETA, current row), "Generating export..." spinner for large exports, "Processing restore..." spinner
- **Empty**: "Migrate data from spreadsheets" message, "Upload First CSV" + "Download Templates" CTAs, no import history
- **Error**: Import failed alert, error list (up to 10 inline), "Download Error Report" + "Fix & Re-Upload" buttons; Restore failed alert with compatibility/format errors
- **Success**: Import/Export panels, import history table (last 20), module export buttons, backup status (last backup date), restore confirmation + log entry

---

## Supported Data Types (Import)

| Data Type | Required Fields | Optional Fields | Template | Validation |
|-----------|-----------------|-----------------|----------|-----------|
| Products | SKU, Name, GTIN-14 | Description, Price, Category, Unit | [products_template.csv] | GTIN format (14 digits), unique SKU |
| Materials | Code, Name, Unit | Description, Cost, Supplier, Min/Max Stock | [materials_template.csv] | Unique code, cost >= 0 |
| BOMs/Recipes | Product SKU, Material Code, Quantity | Unit, Yield%, Version, Notes | [boms_template.csv] | SKU exists, quantity > 0 |
| Locations | Code, Warehouse Code, Type | Aisle, Shelf, Bin, Capacity | [locations_template.csv] | Unique code, valid warehouse |
| Customers | Code, Name, Tax ID | Email, Phone, Address, Payment Terms | [customers_template.csv] | Unique code, valid email format |
| Suppliers | Code, Name, Tax ID | Email, Phone, Address, Lead Time | [suppliers_template.csv] | Unique code, valid email format |
| Work Orders | WO Number, Product SKU, Qty | Scheduled Date, Priority, Notes | [work_orders_template.csv] | Unique WO #, SKU exists |
| Stock | LP Number, Material Code, Qty, Location | Lot, Expiry, Received Date, Status | [stock_template.csv] | Unique LP, qty > 0, location exists |
| **Users** (NEW) | Code, Email, Role | Full Name, Language, Status | [users_template.csv] | **Email unique**, valid role, language code (en/es/fr), status in [active/inactive] |

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

### Configuration Backup (.json)
- Organization settings (name, tax ID, time zone)
- System settings (audit retention, batch size, backup retention)
- All master data as embedded arrays (products, materials, locations, customers, suppliers, BOMs)
- Version: 2.0
- Filename: `monopilot-config-{org_code}-{YYYY-MM-DD-HHmm}.json`

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

## Configuration Restore Logic

1. **Upload** → Validate JSON format, check version (must be 2.0)
2. **Parse** → Extract org settings, system settings, master data arrays
3. **Preview** → Show what will be replaced (org name, affected modules, record counts)
4. **Confirm** → User types "CONFIRM RESTORE" to proceed
5. **Backup** → Auto-create backup of current config before restoring
6. **Restore** → Transaction-wrapped: update org settings, upsert master data (by code/SKU)
7. **Validate** → Verify all foreign keys, RLS, data integrity post-restore
8. **Log** → Save restore history (file name, user, status, timestamp, affected records)
9. **Notify** → Confirmation toast + restore log entry in import history

---

## User Import (FR-SET-154)

### User CSV Template
```
Code,Email,Full Name,Role,Language,Status
EMP001,john.doe@acme.com,John Doe,Manager,en,active
EMP002,sarah.smith@acme.com,Sarah Smith,Admin,en,active
EMP003,miguel.garcia@acme.com,Miguel Garcia,Operator,es,active
EMP004,lisa.johnson@acme.com,Lisa Johnson,Finance,en,active
```

### Validation Rules for User Import
- **Email**: Must be unique across org, valid email format (RFC 5322)
- **Code**: Must be unique across org, alphanumeric + hyphens
- **Role**: Must be one of: Admin, Manager, Operator, Viewer, Finance (case-insensitive)
- **Language**: Valid language codes (en, es, fr, de, it, pt, zh)
- **Status**: Must be active or inactive
- **Full Name**: Required, 2-255 characters
- **Duplicate Email**: If email exists (active user), warn but allow re-activate if status=active

### User Import Actions
- **[Send Invitations]** - After import, send email to all new users with signup link (24h expiry)
- **[Add to Team]** - Optional: Assign imported users to default team
- **[Set Password Policy]** - Enforce password reset on first login

### User Import Permissions
- Only Super Admin or Admin can bulk import users
- Imported users receive invitation email (SMTP configured)
- User status = "pending_activation" until they set password

---

## Configuration Restore (FR-SET-155)

### Restore File Format
- JSON file exported from previous MonoPilot backup
- Contains: org_id, org_name, tax_id, time_zone, product_code, system_settings, master_data arrays
- Version: 2.0 (validates on upload)
- Max size: 50 MB

### What Gets Restored
1. **Organization Settings**: Company name, tax ID, time zone (OVERWRITES current)
2. **System Settings**: Audit log retention (days), import batch size, backup retention (days)
3. **Master Data**: Products, Materials, BOMs, Locations, Customers, Suppliers (UPSERT by code/SKU)
4. **Does NOT restore**: User accounts, work orders, inventory stock, audit logs

### Restore Workflow
1. User selects [Restore Config] tab
2. User uploads config backup file (monopilot-config-*.json)
3. System validates: JSON structure, version, required fields
4. System shows preview: what will be replaced (org settings, affected modules, record counts)
5. System shows warning: "This action CANNOT be undone. Make a backup first."
6. User types "CONFIRM RESTORE" in input field (prevents accidental restore)
7. System creates automatic backup of current config (stored 7 days)
8. System executes restore in transaction: update org → upsert products → upsert materials → etc.
9. System validates all foreign keys post-restore
10. Toast notification: "Configuration restored successfully (245 products, 120 materials, ...)"
11. Restore logged in import history: "Configuration Restore - Success - User (Sarah M) - 486 records affected"

### Restore Safety
- **Auto-backup**: Current config saved before restore (with timestamp)
- **Validation**: All foreign keys checked post-restore
- **Transaction**: All-or-nothing (rollback if any step fails)
- **Audit Trail**: Restore logged with user, timestamp, affected record counts
- **Recovery**: Can restore from auto-backup (7-day retention) if needed

### Restore Error Cases
- **Invalid JSON**: Show error "File is not valid JSON format"
- **Wrong Version**: Show error "Backup version 1.5 not compatible, expected 2.0"
- **Corrupted Data**: Show error "Missing required field: org_name in backup"
- **Foreign Key Failures**: Show error "Product code XYZ references missing supplier"

---

## Permissions

| Role | Can Import Data | Can Export Data | Can Restore Config | Can View History |
|------|-----------------|-----------------|-------------------|------------------|
| Super Admin | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes (own modules) | Yes (own modules) | No | Yes |
| Operator | No | No | No | No |
| Viewer | No | No | No | No |
| Finance | No | Yes (Finance only) | No | Yes |

---

## Validation Rules

- **SKU/Code Uniqueness**: Check against existing records (per org), warn if duplicate (offer upsert)
- **GTIN Format**: 14 digits for products, 13 for EAN-13, validate check digit
- **Price/Cost**: Decimal format, non-negative, max 2 decimal places
- **Email Format**: RFC 5322, must be unique per org
- **Role**: Must be in allowed list (Admin, Manager, Operator, Viewer, Finance), case-insensitive
- **Language**: Must be valid language code (en, es, fr, de, it, pt, zh)
- **Dates**: ISO 8601 (YYYY-MM-DD) or US format (MM/DD/YYYY), auto-detect
- **Foreign Keys**: Validate referenced IDs exist (e.g., BOM references valid Product SKU, Location references valid Warehouse)
- **File Size**: Max 10MB per file, max 10,000 rows per import (warn at 5k, hard limit at 10k)
- **CSV Structure**: Must have header row, at least one data row, no empty columns
- **Backup File**: Max 50MB, must be JSON, version 2.0, valid org_id

---

## Accessibility

- **Touch targets**: Upload area >= 120x120dp, buttons >= 48x48dp, import history rows >= 48dp
- **Contrast**: Validation status icons (✓ green, ⚠ orange, ✗ red) + text labels (not color-only)
- **Screen reader**: "Upload CSV for {data_type}, drop file or click to browse", "Row 3 error: missing GTIN-14 field", "User email must be unique"
- **Keyboard**: Tab to upload area, Enter to activate, Spacebar to toggle checkboxes, Arrow keys for table navigation
- **Focus indicators**: Clear 2px outline on upload area, mapping dropdowns, buttons
- **Progress announcements**: Live region announces "180 of 245 rows imported, 73% complete"
- **Confirmation**: Text input "CONFIRM RESTORE" prevents accidental configuration restore

---

## Related Screens

- **Import Mapping Modal**: Column mapping interface (CSV column → MonoPilot field dropdowns)
- **Validation Preview Panel**: Expandable error/warning details, preview table (first 10 rows)
- **Progress Modal**: Import/export progress bar, ETA, cancel button
- **Error Report Download**: Generates CSV with row-level errors (row #, field, value, error message)
- **Template Library**: List of all CSV templates (9 types), download links, sample data preview
- **Restore Preview Modal**: Shows what will be restored (org settings, affected modules, record counts, creation date/user)
- **Configuration Backup History**: List of previous backups (auto and manual), restore links, creation date/user

---

## Technical Notes

- **API**: `POST /api/settings/import/{data_type}` → body: FormData (CSV file) → returns validation results
- **API**: `POST /api/settings/import/{data_type}/execute` → body: {mapping, options} → executes import
- **API**: `POST /api/settings/import/users` → body: FormData (CSV file) → returns validation results with email uniqueness check (NEW)
- **API**: `POST /api/settings/import/users/execute` → body: {mapping, options, send_invitations} → creates users + sends emails (NEW)
- **API**: `GET /api/settings/export/{module}?format={csv|xlsx|json}` → returns file download
- **API**: `GET /api/settings/export/full-backup` → generates ZIP file (async job if >1GB data)
- **API**: `POST /api/settings/export/config-backup` → generates JSON backup (org settings + master data) (NEW)
- **API**: `POST /api/settings/restore/config` → body: {backup_file} → validates + previews restore (NEW)
- **API**: `POST /api/settings/restore/config/execute` → body: {backup_file, confirm_token} → executes restore + creates auto-backup (NEW)
- **Database**: `import_history` table (id, org_id, data_type, file_name, status, records_imported, errors, user_id, created_at)
- **Database**: `restore_history` table (id, org_id, file_name, status, affected_records, user_id, created_at, auto_backup_path) (NEW)
- **Storage**: Uploaded CSVs stored in Supabase Storage (7-day retention), full backups stored 30 days, config backups stored 7 days
- **Batch Processing**: Import 100 rows per batch (to avoid timeouts), wrap in transaction (rollback on error)
- **Validation**: Zod schemas for each data type (reuse existing schemas from `lib/validation/`)
- **User Validation** (NEW): Email uniqueness check, role validation, language code validation via Zod schema
- **Auto-Mapping**: Fuzzy match CSV headers to DB fields (Levenshtein distance, common aliases: "SKU"/"Code"/"Product Code" → sku)
- **Upsert Logic**: If SKU/Code exists + upsert enabled → UPDATE, else → INSERT
- **Error Handling**: Collect all errors, generate report, show first 10 inline + download full CSV
- **Export Performance**: Stream large exports (avoid loading all data into memory), use database cursors
- **RLS**: All imports/exports filtered by `org_id` automatically
- **Caching**: No caching (real-time data), imports/restores invalidate relevant module caches
- **File Formats**: Support CSV (RFC 4180), Excel (.xlsx via SheetJS), JSON (pretty-printed)
- **Email**: SMTP integration for user invitations (SES or SendGrid), 24h expiry on signup links

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
8. Repeat for Materials (120), BOMs (87), Locations (34), Users (12)

### Bulk User Onboarding (NEW)
1. HR prepares users.csv with 25 new employees
2. Admin downloads users template, provides to HR
3. HR fills in: Code, Email, Full Name, Role (Manager/Operator), Language, Status
4. Admin uploads users.csv
5. System validates: 23 valid, 1 duplicate email (reactivate), 1 invalid role
6. Admin fixes CSV, re-uploads
7. System validates → all green → admin clicks [Import 23 Valid Users]
8. System creates users, sends invitation emails to all 23
9. Toast: "23 users imported, invitations sent to john@acme.com, sarah@acme.com, ..."

### Daily Backup & Configuration Export
1. Admin clicks [Export All Data] → system generates ZIP (245 products, 120 materials, ...)
2. Admin clicks [Export Config] → system generates JSON (org settings + master data)
3. Both files downloaded, stored in cloud backup (S3/Google Drive)
4. Daily automated backup (midnight) via Supabase cron

### Configuration Restore (Disaster Recovery)
1. System failure → admin needs to restore previous config
2. Admin goes to [Restore Config] tab
3. Admin uploads monopilot-config-ACME-2025-12-10.json
4. System shows preview: "Will restore 245 products, 120 materials, 34 locations, ..."
5. System shows warning: "This cannot be undone, current config will be backed up"
6. Admin types "CONFIRM RESTORE" → clicks [Restore Configuration]
7. System creates auto-backup of current state → restores config from file
8. Toast: "Configuration restored successfully (486 records affected)"
9. System auto-emails admin log: "Restore completed by John D., backup saved to monopilot-config-auto-2025-12-15-1430.json"

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
**Screens Approved**: [SET-029-import-export (UPDATED with Users + Config Restore)]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff (FR-SET-154, FR-SET-155 compliance achieved)
