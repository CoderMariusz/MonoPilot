# Story 3.3: Bulk PO Creation

**Epic:** 3 - Planning Operations (Batch 3A)
**Story ID:** 3.3
**Priority:** P1
**Effort:** 8 points
**Status:** Ready for Development

---

## User Story

**As a** Purchasing user,
**I want to** bulk create POs from an Excel/CSV file,
**So that** I can quickly order from multiple suppliers without manual entry.

---

## Acceptance Criteria

### AC-3.1: Bulk PO Upload Interface

**When** clicking "Bulk Create POs" button
**Then** Bulk PO modal opens with:
- **Option 1**: Upload Excel/CSV file
  - File dropzone (drag & drop or click to browse)
  - Accepted formats: `.xlsx`, `.csv`
  - Max file size: 5MB
  - Max rows: 1000
- **Option 2**: Download template button
  - Template Excel file with columns: `Product Code`, `Quantity`, `Warehouse Code (optional)`, `Expected Date (optional)`

### AC-3.2: Excel/CSV Template Format

**Template Columns:**
1. `Product Code` (required) - Product code to order
2. `Quantity` (required) - Quantity to order
3. `Warehouse Code` (optional) - Defaults to org default warehouse
4. `Expected Date` (optional) - Defaults to today + 7 days

**Example:**
```
Product Code | Quantity | Warehouse Code | Expected Date
FLOUR-001    | 100      | WH-01          | 2025-02-01
SUGAR-001    | 50       | WH-01          | 2025-02-01
COCOA-001    | 30       | WH-02          | 2025-02-05
```

### AC-3.3: File Parsing and Validation

**When** user uploads file
**Then** system:
1. Parses Excel/CSV rows
2. For each row:
   - Lookup product by `product_code`
   - If product not found → Add to `errors[]`
   - If product found → Lookup default supplier from `supplier_products WHERE is_default = true`
   - If no default supplier → Add to `errors[]`
   - If supplier found → Add to `items[]`

3. Group valid items by `supplier_id`
4. Show results in Review Screen

**Error Handling:**
- Show errors in separate table with columns: `Row #`, `Product Code`, `Error Message`
- Common errors:
  - "Product not found"
  - "No default supplier configured for this product"
  - "Invalid quantity (must be > 0)"
  - "Invalid warehouse code"
  - "Invalid date format"

### AC-3.4: Review Draft POs Screen

**After** parsing completes
**Then** show Review Screen with:

**Draft POs Table:**
- One row per supplier
- Columns: `Supplier`, `Currency`, `Product Count`, `Total Lines`, `Estimated Total`
- Expandable rows showing line items

**Errors Table** (if any):
- Columns: `Row #`, `Product Code`, `Quantity`, `Error Message`

**Actions:**
- Edit button per draft PO (opens edit modal)
- Remove button per draft PO
- "Create All POs" button (creates all drafts)
- "Cancel" button (discards all drafts)

### AC-3.5: Edit Draft PO

**When** clicking Edit on draft PO
**Then** modal opens with:
- Supplier (read-only)
- Warehouse (dropdown, editable)
- Expected Delivery Date (date picker, editable)
- Lines table (can remove lines)

**When** saving changes
**Then** draft PO updated in memory (not yet persisted to DB)

### AC-3.6: Confirm and Create POs

**When** clicking "Create All POs"
**Then** system creates all draft POs in single transaction:
1. For each draft PO:
   - Generate PO number
   - Create PO header (status = Draft)
   - Create all PO lines
   - Calculate totals via trigger
2. If any creation fails → Rollback all (atomic operation)
3. If all succeed → Show success message with PO numbers list

**Success Message:**
```
✅ Created 3 Purchase Orders:
- PO-2025-0010 (Supplier A, €1,230)
- PO-2025-0011 (Supplier B, $850)
- PO-2025-0012 (Supplier C, PLN 2,500)
```

**And** redirect to PO list with filter showing newly created POs

### AC-3.7: Grouping Logic

**Given** parsed rows with suppliers:
```
FLOUR-001  → Supplier A
SUGAR-001  → Supplier A
COCOA-001  → Supplier B
MILK-001   → Supplier C
EGGS-001   → Supplier A
```

**Then** group into 3 draft POs:
- **Draft PO 1** (Supplier A): FLOUR-001, SUGAR-001, EGGS-001
- **Draft PO 2** (Supplier B): COCOA-001
- **Draft PO 3** (Supplier C): MILK-001

### AC-3.8: Performance Requirements

- Parse file <2s dla 100 rows
- Parse file <5s dla 1000 rows
- Show progress indicator during parsing
- Show row count: "Processing row 50/200..."

---

## Technical Implementation

### Excel Parsing Service

```typescript
// apps/frontend/lib/services/bulk-po-parser.ts

import * as XLSX from 'xlsx'

interface ParsedRow {
  row_number: number
  product_code: string
  quantity: number
  warehouse_code?: string
  expected_date?: Date
}

interface ParseResult {
  items: ParsedRow[]
  errors: { row: number; product_code: string; error: string }[]
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet)

  const items: ParsedRow[] = []
  const errors: any[] = []

  rows.forEach((row, index) => {
    const row_number = index + 2 // +2 for header + 0-index

    // Validate required fields
    if (!row['Product Code']) {
      errors.push({ row: row_number, product_code: '', error: 'Product Code is required' })
      return
    }

    if (!row['Quantity'] || row['Quantity'] <= 0) {
      errors.push({ row: row_number, product_code: row['Product Code'], error: 'Quantity must be > 0' })
      return
    }

    items.push({
      row_number,
      product_code: row['Product Code'],
      quantity: parseFloat(row['Quantity']),
      warehouse_code: row['Warehouse Code'],
      expected_date: row['Expected Date'] ? new Date(row['Expected Date']) : undefined,
    })
  })

  return { items, errors }
}
```

### Bulk PO API

```typescript
// apps/frontend/app/api/planning/purchase-orders/bulk/route.ts

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { items } = body // Parsed rows from Excel

  const drafts: any[] = []
  const errors: any[] = []

  // Step 1: Lookup products and default suppliers
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('id, code, uom, unit_price')
      .eq('code', item.product_code)
      .single()

    if (!product) {
      errors.push({ row: item.row_number, product_code: item.product_code, error: 'Product not found' })
      continue
    }

    const { data: supplierProduct } = await supabase
      .from('supplier_products')
      .select('supplier_id, unit_price')
      .eq('product_id', product.id)
      .eq('is_default', true)
      .single()

    if (!supplierProduct) {
      errors.push({ row: item.row_number, product_code: item.product_code, error: 'No default supplier' })
      continue
    }

    drafts.push({
      ...item,
      product_id: product.id,
      supplier_id: supplierProduct.supplier_id,
      unit_price: supplierProduct.unit_price || product.unit_price,
      uom: product.uom,
    })
  }

  // Step 2: Group by supplier
  const grouped = drafts.reduce((acc, item) => {
    if (!acc[item.supplier_id]) {
      acc[item.supplier_id] = []
    }
    acc[item.supplier_id].push(item)
    return acc
  }, {})

  // Step 3: Create draft POs (return to client for review, don't persist yet)
  const draftPOs = Object.entries(grouped).map(([supplier_id, lines]: any) => ({
    supplier_id,
    lines,
    warehouse_code: lines[0].warehouse_code, // Use first line's warehouse or default
    expected_date: lines[0].expected_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }))

  return NextResponse.json({ draft_pos: draftPOs, errors })
}

// Confirm and create all POs
export async function PUT(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { draft_pos } = body

  const created_pos: any[] = []

  // Transaction: Create all POs or rollback
  for (const draft of draft_pos) {
    // Create PO header (similar to Story 3.1)
    // Create PO lines (similar to Story 3.2)
    // ... (omitted for brevity)
    created_pos.push(/* created PO */)
  }

  return NextResponse.json({ created_pos })
}
```

---

## Testing Requirements

### Unit Tests
- Excel parsing logic
- Grouping by supplier
- Error handling (product not found, no default supplier)

### Integration Tests
- Bulk PO creation API
- Transaction rollback if any PO fails
- Default supplier lookup

### E2E Tests
- Upload Excel file (10 products, 3 suppliers)
- Review drafts
- Edit draft PO
- Confirm creation → verify PO numbers

---

## Definition of Done

- [ ] Excel parsing service implemented
- [ ] API routes (POST /bulk, PUT /bulk/confirm)
- [ ] Frontend components (Upload modal, Review screen, Edit draft modal)
- [ ] Error handling (show errors table)
- [ ] Transaction atomicity (all or none)
- [ ] E2E test (bulk PO flow)
- [ ] Template download functionality
- [ ] Code reviewed and approved

---

## Dependencies

- Story 3.1 (PO CRUD) - uses PO creation logic
- Story 3.2 (PO Lines) - uses line creation logic
- Story 3.17 (Suppliers) - requires default supplier lookup

---

## Notes

- File size limit: 5MB, 1000 rows
- Defaults: warehouse (org default), expected_date (today + 7 days)
- Atomic transaction: all POs created or none
