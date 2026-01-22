# SO Clone/Import API Reference

**Story:** 07.5 - SO Clone/Template + CSV Import
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

The SO Clone/Import API provides endpoints for quickly creating sales orders by cloning existing orders or importing from CSV files. These features reduce order entry time from 5 minutes to under 30 seconds for repeat customers and migration scenarios.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles:**

| Operation | Roles |
|-----------|-------|
| Clone order | `sales`, `manager`, `admin`, `owner` |
| Import orders | `sales`, `manager`, `admin`, `owner` |

---

## Endpoints

### POST /api/shipping/sales-orders/:id/clone

Clone an existing sales order to create a new draft order with the same customer and products.

**What is preserved:**
- Customer ID
- Shipping address ID
- All line items (product, quantity, unit_price)
- Line notes
- Order notes

**What is reset:**
- `order_number` - New auto-generated (SO-YYYY-NNNNN)
- `status` - Always 'draft'
- `order_date` - Today's date
- `allergen_validated` - Set to false
- All quantity fields (allocated, picked, packed, shipped) - Reset to 0
- `customer_po` - Cleared (must be re-entered)
- `promised_ship_date` - Cleared
- `required_delivery_date` - Cleared
- `confirmed_at`, `shipped_at` - Cleared
- Line numbers - Renumbered sequentially (1, 2, 3...)

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/550e8400-e29b-41d4-a716-446655440000/clone \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID of the sales order to clone |

#### Response (201 Created)

```json
{
  "success": true,
  "original_order_number": "SO-2025-00123",
  "cloned_order": {
    "id": "660f9511-f30c-52e5-b827-557766551111",
    "order_number": "SO-2025-00456",
    "status": "draft",
    "customer_id": "cust-001",
    "shipping_address_id": "addr-001",
    "order_date": "2026-01-22",
    "total_amount": 1575.00,
    "allergen_validated": false,
    "notes": "Original order notes preserved",
    "lines": [
      {
        "id": "line-001",
        "line_number": 1,
        "product_id": "prod-001",
        "quantity_ordered": 100,
        "quantity_allocated": 0,
        "quantity_picked": 0,
        "quantity_packed": 0,
        "quantity_shipped": 0,
        "unit_price": 10.50,
        "line_total": 1050.00,
        "discount": null,
        "notes": "Line notes preserved"
      },
      {
        "id": "line-002",
        "line_number": 2,
        "product_id": "prod-002",
        "quantity_ordered": 50,
        "quantity_allocated": 0,
        "quantity_picked": 0,
        "quantity_packed": 0,
        "quantity_shipped": 0,
        "unit_price": 10.50,
        "line_total": 525.00,
        "discount": null,
        "notes": null
      }
    ]
  }
}
```

#### Error Responses

**Status: 404 Not Found - Order Not Found**

```json
{
  "error": "Sales order not found",
  "code": "NOT_FOUND"
}
```

**Status: 403 Forbidden - Access Denied**

```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

---

### POST /api/shipping/sales-orders/import

Import sales orders from CSV file. Creates one sales order per unique customer, with all their lines grouped together.

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@orders.csv"
```

**Request Body (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | CSV file (.csv extension, max 5MB) |

#### CSV Format

**Required Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `customer_code` | string | Customer code (must exist in customers table) |
| `product_code` | string | Product code (must exist in products table) |
| `quantity` | number | Quantity ordered (must be > 0) |

**Optional Columns:**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `unit_price` | number | product.std_price | Unit price (>= 0) |
| `customer_po` | string | null | Customer PO reference (max 100 chars) |
| `promised_ship_date` | date | null | Promised ship date (YYYY-MM-DD) |
| `required_delivery_date` | date | null | Required delivery date (YYYY-MM-DD) |
| `notes` | string | null | Line or order notes (max 1000 chars) |

**Example CSV (Minimal):**

```csv
customer_code,product_code,quantity,unit_price
ACME001,FLOUR-25KG,100,10.50
ACME001,SUGAR-10KG,50,25.00
BETA002,FLOUR-25KG,200,10.00
```

**Example CSV (Extended):**

```csv
customer_code,product_code,quantity,unit_price,customer_po,promised_ship_date,notes
ACME001,FLOUR-25KG,100,10.50,PO-12345,2026-02-01,Rush order
ACME001,SUGAR-10KG,50,25.00,,,
BETA002,FLOUR-25KG,200,10.00,PO-67890,2026-02-15,Standard delivery
```

#### Response (200 OK)

```json
{
  "success": true,
  "summary": {
    "orders_created": 2,
    "lines_imported": 3,
    "rows_processed": 3,
    "errors_count": 0
  },
  "created_orders": [
    {
      "id": "so-001",
      "order_number": "SO-2026-00100",
      "customer_code": "ACME001",
      "lines_count": 2
    },
    {
      "id": "so-002",
      "order_number": "SO-2026-00101",
      "customer_code": "BETA002",
      "lines_count": 1
    }
  ],
  "errors": []
}
```

#### Response with Validation Errors

```json
{
  "success": true,
  "summary": {
    "orders_created": 1,
    "lines_imported": 2,
    "rows_processed": 4,
    "errors_count": 2
  },
  "created_orders": [
    {
      "id": "so-001",
      "order_number": "SO-2026-00100",
      "customer_code": "ACME001",
      "lines_count": 2
    }
  ],
  "errors": [
    {
      "row": 3,
      "customer_code": "INVALID",
      "product_code": "FLOUR-25KG",
      "error": "Customer 'INVALID' not found"
    },
    {
      "row": 4,
      "customer_code": "ACME001",
      "product_code": "NOTEXIST",
      "error": "Product 'NOTEXIST' not found"
    }
  ]
}
```

#### Error Responses

**Status: 400 Bad Request - Empty File**

```json
{
  "error": "CSV file is empty",
  "code": "VALIDATION_ERROR"
}
```

**Status: 400 Bad Request - Missing Header**

```json
{
  "error": "CSV must have header row: customer_code, product_code, quantity",
  "code": "VALIDATION_ERROR"
}
```

**Status: 400 Bad Request - Missing Required Columns**

```json
{
  "error": "Missing required columns: quantity",
  "code": "VALIDATION_ERROR"
}
```

**Status: 400 Bad Request - Invalid File Type**

```json
{
  "error": "Only CSV files (.csv) are supported",
  "code": "VALIDATION_ERROR"
}
```

**Status: 400 Bad Request - File Too Large**

```json
{
  "error": "File size must be between 1 byte and 5MB",
  "code": "VALIDATION_ERROR"
}
```

---

### POST /api/shipping/sales-orders/import/preview

Preview CSV import without creating orders. Returns validated rows with errors identified.

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/import/preview \
  -H "Content-Type: multipart/form-data" \
  -F "file=@orders.csv"
```

#### Response (200 OK)

```json
{
  "success": true,
  "total_rows": 4,
  "valid_rows": 2,
  "error_rows": 2,
  "rows": [
    {
      "row": 1,
      "customer_code": "ACME001",
      "product_code": "FLOUR-25KG",
      "quantity": 100,
      "unit_price": 10.50,
      "valid": true,
      "error": null,
      "customer_name": "ACME Corporation",
      "product_name": "Flour 25kg Bag"
    },
    {
      "row": 2,
      "customer_code": "ACME001",
      "product_code": "SUGAR-10KG",
      "quantity": 50,
      "unit_price": 25.00,
      "valid": true,
      "error": null,
      "customer_name": "ACME Corporation",
      "product_name": "Sugar 10kg Bag"
    },
    {
      "row": 3,
      "customer_code": "INVALID",
      "product_code": "FLOUR-25KG",
      "quantity": 100,
      "unit_price": 10.50,
      "valid": false,
      "error": "Customer 'INVALID' not found",
      "customer_name": null,
      "product_name": null
    },
    {
      "row": 4,
      "customer_code": "ACME001",
      "product_code": "NOTEXIST",
      "quantity": 0,
      "unit_price": null,
      "valid": false,
      "error": "Product 'NOTEXIST' not found; Quantity must be greater than zero",
      "customer_name": "ACME Corporation",
      "product_name": null
    }
  ],
  "orders_to_create": [
    {
      "customer_code": "ACME001",
      "customer_name": "ACME Corporation",
      "lines_count": 2,
      "estimated_total": 1300.00
    }
  ]
}
```

---

## Validation Rules

### Clone Validation

| Rule | Error |
|------|-------|
| Source order must exist | "Sales order not found" |
| Source order must be in user's org | "Sales order not found" (RLS) |
| User must have clone permission | "Access denied" |

### CSV Row Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `customer_code` | Must exist in org | "Customer 'X' not found" |
| `product_code` | Must exist in org | "Product 'X' not found" |
| `quantity` | Must be > 0 | "Quantity must be greater than zero" |
| `quantity` | Must be numeric | "Invalid quantity format" |
| `unit_price` | Must be >= 0 if provided | "Unit price cannot be negative" |
| `unit_price` | Must be numeric if provided | "Invalid unit price format" |
| `promised_ship_date` | Must be YYYY-MM-DD if provided | "Invalid promised_ship_date format (use YYYY-MM-DD)" |
| `required_delivery_date` | Must be YYYY-MM-DD if provided | "Invalid required_delivery_date format (use YYYY-MM-DD)" |
| `customer_po` | Max 100 characters | "Customer PO exceeds 100 characters" |
| `notes` | Max 1000 characters | "Notes exceeds 1000 characters" |

### CSV File Validation

| Rule | Error Message |
|------|---------------|
| File not empty | "CSV file is empty" |
| Has header row | "CSV must have header row: customer_code, product_code, quantity" |
| Required columns present | "Missing required columns: X" |
| File extension .csv | "Only CSV files (.csv) are supported" |
| File size <= 5MB | "File size must be between 1 byte and 5MB" |

---

## Import Behavior

### Customer Grouping

CSV rows are grouped by `customer_code`. One sales order is created per unique customer.

**Example:** 5 rows with 3 customers creates 3 sales orders.

```csv
customer_code,product_code,quantity
ACME001,PROD-001,100    # -> SO-1 for ACME001
ACME001,PROD-002,50     # -> SO-1 for ACME001 (same customer)
BETA002,PROD-001,200    # -> SO-2 for BETA002
BETA002,PROD-003,75     # -> SO-2 for BETA002 (same customer)
GAMMA003,PROD-004,300   # -> SO-3 for GAMMA003
```

### Line Numbering

Lines are numbered sequentially (1, 2, 3...) in the order they appear in the CSV for each customer.

### Default Values

| Field | Default Value |
|-------|---------------|
| `status` | 'draft' |
| `order_date` | Today |
| `allergen_validated` | false |
| `unit_price` | product.std_price (if not specified) |
| `shipping_address_id` | customer.default_shipping_address_id |

### Error Handling

- Import continues for valid rows even if some rows fail
- Rows with validation errors are skipped
- Error summary includes row numbers and specific error messages
- No partial orders (if any row for a customer fails, all rows for that customer are skipped)

---

## Service Methods

### SalesOrderService

```typescript
import {
  cloneSalesOrder,
  importSalesOrdersFromCSV,
  previewCSVImport,
  validateCSVRow,
} from '@/lib/services/sales-order-service'

// Clone an existing order
const cloned = await cloneSalesOrder('original-so-id')
// Returns: { original_order_number, cloned_order }

// Import from CSV string
const result = await importSalesOrdersFromCSV(orgId, csvData)
// Returns: { success, summary, created_orders, errors }

// Preview without creating
const preview = await previewCSVImport(orgId, csvData)
// Returns: { rows, orders_to_create }

// Validate single row
const validation = await validateCSVRow(orgId, {
  customer_code: 'ACME001',
  product_code: 'PROD-001',
  quantity: '100',
  unit_price: '10.50',
})
// Returns: { valid, data?, error? }
```

---

## Zod Validation Schemas

### CSV Row Schema

```typescript
import { csvRowSchema } from '@/lib/validation/sales-order-schema'

const row = csvRowSchema.parse({
  customer_code: 'ACME001',
  product_code: 'PROD-001',
  quantity: '100',
  unit_price: '10.50',  // optional
  customer_po: 'PO-123',  // optional
  promised_ship_date: '2026-02-01',  // optional
  notes: 'Rush order',  // optional
})
```

### CSV File Schema

```typescript
import { csvFileSchema } from '@/lib/validation/sales-order-schema'

const fileInput = csvFileSchema.parse({
  file: fileObject,  // File with .csv extension, <= 5MB
})
```

---

## Code Examples

### TypeScript: Clone Order

```typescript
async function cloneOrder(orderId: string): Promise<ClonedOrder> {
  const response = await fetch(
    `/api/shipping/sales-orders/${orderId}/clone`,
    { method: 'POST' }
  )

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to clone order')
  }

  return {
    originalOrderNumber: data.original_order_number,
    newOrder: data.cloned_order,
  }
}

// Usage
const { originalOrderNumber, newOrder } = await cloneOrder('so-123')
console.log(`Cloned ${originalOrderNumber} -> ${newOrder.order_number}`)
```

### TypeScript: Import from CSV

```typescript
async function importOrders(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/shipping/sales-orders/import', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  if (!data.success && data.summary.orders_created === 0) {
    throw new Error(data.error || 'Import failed')
  }

  return {
    ordersCreated: data.summary.orders_created,
    linesImported: data.summary.lines_imported,
    errors: data.errors,
    createdOrders: data.created_orders,
  }
}

// Usage
const file = document.getElementById('csv-input').files[0]
const result = await importOrders(file)
console.log(`Created ${result.ordersCreated} orders`)
```

### TypeScript: Preview Import

```typescript
async function previewImport(file: File): Promise<PreviewResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/shipping/sales-orders/import/preview', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  return {
    validRows: data.valid_rows,
    errorRows: data.error_rows,
    rows: data.rows,
    ordersToCreate: data.orders_to_create,
  }
}

// Usage
const preview = await previewImport(file)
if (preview.errorRows > 0) {
  const errors = preview.rows.filter(r => !r.valid)
  console.log('Errors found:', errors)
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Sales order not found |
| `VALIDATION_ERROR` | 400 | Invalid request data or CSV format |
| `INTERNAL_ERROR` | 500 | Server error during import |

---

## Related Documentation

- [Sales Orders API Reference](./sales-orders.md)
- [SO Status Workflow API](./so-status-workflow.md)
- [SO Line Pricing API](./so-line-pricing.md)
- [SO Clone/Import Guide](../../guides/shipping/so-clone-import-guide.md)
- [Sales Order Workflow Guide](../../guides/shipping/sales-order-workflow.md)

---

## Support

**Story:** 07.5
**Last Updated:** 2026-01-22
