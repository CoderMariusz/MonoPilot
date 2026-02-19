# Scanner Output API Reference

**Story:** 04.7b - Output Registration Scanner
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

This document describes the API endpoints for scanner-based production output registration. All endpoints require authentication and respect RLS policies for multi-tenancy.

---

## API Endpoints

### POST /api/production/output/validate-wo

Validate a Work Order barcode for scanner output registration.

**Performance Target:** 500ms p95

**Request:**

```json
{
  "barcode": "WO-2026-0156"
}
```

**Success Response (200):**

```json
{
  "valid": true,
  "wo": {
    "id": "uuid-...",
    "wo_number": "WO-2026-0156",
    "status": "in_progress",
    "product_id": "uuid-...",
    "product_name": "Chocolate Cookies",
    "product_code": "CHOC-COOK-001",
    "planned_qty": 1000,
    "registered_qty": 800,
    "remaining_qty": 200,
    "progress_percent": 80,
    "uom": "kg",
    "batch_number": "WO-2026-0156",
    "line_name": "Production Line 1",
    "shelf_life_days": 30
  },
  "by_products": [
    {
      "id": "uuid-...",
      "name": "Cookie Crumbs",
      "code": "BP-CRUMB-001",
      "yield_percent": 5,
      "expected_qty": 50,
      "uom": "kg"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Invalid barcode format` | Barcode doesn't match WO-YYYY-NNNN pattern |
| 404 | `Work order not found` | WO doesn't exist or belongs to different org |
| 409 | `Work order is not in progress or paused` | WO status is completed/cancelled |
| 409 | `Work order must be started first` | WO status is draft/released |

**Example Error (409):**

```json
{
  "valid": false,
  "error": "Work order is not in progress or paused"
}
```

---

### POST /api/production/output/register

Register production output and create an LP.

**Request:**

```json
{
  "wo_id": "uuid-...",
  "quantity": 250,
  "qa_status": "approved",
  "batch_number": "WO-2026-0156",
  "expiry_date": "2026-02-20T00:00:00.000Z",
  "location_id": "uuid-...",
  "operator_badge": "OP-12345"
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `wo_id` | Required, valid UUID |
| `quantity` | Required, positive number |
| `qa_status` | Required, one of: `approved`, `pending`, `rejected` |
| `batch_number` | Required, min 1 character |
| `expiry_date` | Required, ISO datetime |
| `location_id` | Required, valid UUID |
| `operator_badge` | Optional string |

**Success Response (201):**

```json
{
  "lp": {
    "id": "uuid-...",
    "lp_number": "LP-20260121-0001",
    "qty": 250,
    "uom": "kg",
    "batch_number": "WO-2026-0156",
    "qa_status": "approved",
    "expiry_date": "2026-02-20"
  },
  "wo_progress": {
    "output_qty": 750,
    "progress_percent": 75,
    "remaining_qty": 250
  },
  "genealogy": {
    "parent_count": 3,
    "child_lp_id": "uuid-..."
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Quantity must be greater than 0` | Invalid quantity |
| 404 | `Work order not found` | WO doesn't exist |
| 422 | Validation error | Zod schema validation failed |

---

### GET /api/production/output/by-products/:woId

Get by-products for a work order.

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `woId` | UUID | Work order ID |

**Success Response (200):**

```json
{
  "by_products": [
    {
      "id": "uuid-...",
      "name": "Cookie Crumbs",
      "code": "BP-CRUMB-001",
      "yield_percent": 5,
      "expected_qty": 50,
      "uom": "kg"
    },
    {
      "id": "uuid-...",
      "name": "Broken Cookies",
      "code": "BP-BROKEN-001",
      "yield_percent": 2,
      "expected_qty": 20,
      "uom": "kg"
    }
  ]
}
```

**Note:** `expected_qty` is calculated as `planned_qty * yield_percent / 100`

---

### POST /api/production/output/register-by-product

Register a by-product and create an LP.

**Request:**

```json
{
  "wo_id": "uuid-...",
  "main_output_lp_id": "uuid-...",
  "by_product_id": "uuid-...",
  "quantity": 45,
  "qa_status": "approved",
  "batch_number": "WO-2026-0156",
  "expiry_date": "2026-02-20T00:00:00.000Z",
  "location_id": "uuid-...",
  "zero_qty_confirmed": false
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `wo_id` | Required, valid UUID |
| `main_output_lp_id` | Required, valid UUID |
| `by_product_id` | Required, valid UUID |
| `quantity` | Required, >= 0 |
| `qa_status` | Required, one of: `approved`, `pending`, `rejected` |
| `batch_number` | Required, min 1 character |
| `expiry_date` | Required, ISO datetime |
| `location_id` | Required, valid UUID |
| `zero_qty_confirmed` | Required if quantity = 0 |

**Zero Quantity Rule:**

If `quantity = 0` and `zero_qty_confirmed = false`, validation fails with:
```json
{
  "error": "Quantity is 0 and not confirmed",
  "path": ["quantity"]
}
```

**Success Response (201):**

```json
{
  "lp": {
    "id": "uuid-...",
    "lp_number": "LP-20260121-0002",
    "qty": 45,
    "uom": "kg",
    "batch_number": "WO-2026-0156",
    "qa_status": "approved"
  },
  "genealogy": {
    "main_lp_id": "uuid-...",
    "child_lp_id": "uuid-..."
  }
}
```

---

### POST /api/production/output/generate-label

Generate ZPL label content for an LP.

**Request:**

```json
{
  "lp_id": "uuid-...",
  "template_id": "uuid-..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "zpl_content": "^XA\n^FO50,30^A0N,30,30^FDChocolate Cookies^FS\n^FO50,70^A0N,24,24^FDQty: 250 kg^FS\n^FO50,100^A0N,24,24^FDBatch: WO-2026-0156^FS\n^FO50,130^A0N,24,24^FDExpiry: 2026-02-20^FS\n^FO50,160^A0N,24,24^FDQA: APPROVED^FS\n^FO50,200^BY3^BCN,100,Y,N,N^FDLP-20260121-0001^FS\n^FO50,320^A0N,20,20^FDLP-20260121-0001^FS\n^XZ",
  "label_fields": {
    "lp_number": "LP-20260121-0001",
    "barcode_type": "Code128",
    "product_name": "Chocolate Cookies",
    "qty_with_uom": "250 kg",
    "batch_number": "WO-2026-0156",
    "expiry_date": "2026-02-20",
    "qa_status": "approved"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "LP not found"
}
```

---

### POST /api/production/output/print-label

Send ZPL content to printer.

**Performance Target:** 2000ms p95

**Request:**

```json
{
  "zpl_content": "^XA...^XZ",
  "printer_id": "uuid-..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "printer_name": "Production Line Printer",
  "sent_at": "2026-01-21T14:30:00.000Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | `No printer configured` | No default printer or specified printer not found |
| 503 | `Printer not responding` | Printer offline |
| 504 | `Print timeout` | Print took longer than 2s |

---

### GET /api/production/output/printer-status

Check printer availability for a location.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `location_id` | UUID | Optional. Location to check. Uses default printer if not provided. |

**Success Response (200):**

```json
{
  "configured": true,
  "printer": {
    "id": "uuid-...",
    "name": "Production Line Printer",
    "ip": "192.168.1.100",
    "status": "online"
  }
}
```

**No Printer Response (200):**

```json
{
  "configured": false,
  "error": {
    "message": "No printer configured"
  }
}
```

---

## Service Layer

### ScannerOutputService

Location: `lib/services/scanner-output-service.ts`

```typescript
// WO Validation
async function validateWO(barcode: string): Promise<WOValidationResult>

// Output Registration
async function registerOutput(input: ScannerRegisterInput): Promise<RegisterOutputResponse>

// By-Products
async function getByProducts(woId: string): Promise<ByProductInfo[]>
async function registerByProduct(input: ScannerByProductInput): Promise<RegisterByProductResponse>
```

### LabelService

Location: `lib/services/label-service.ts`

```typescript
// ZPL Generation
async function generateZPL(lpId: string, templateId?: string): Promise<ZPLResult>

// Printing
async function sendToPrinter(zpl: string, printerId?: string): Promise<PrintResult>
async function getPrinterStatus(locationId?: string): Promise<PrinterStatus>
```

### OfflineQueueService

Location: `lib/services/offline-queue-service.ts`

```typescript
// Queue Management
async function queueOperation(operation: OfflineOperation): Promise<void>
async function syncQueue(): Promise<SyncResult>
function getPendingCount(): number
function clearQueue(): void
```

---

## Validation Schemas

Location: `lib/validation/scanner-output.ts`

```typescript
import { z } from 'zod'

// WO Barcode validation
export const validateWOSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
})

// Scanner output registration
export const scannerOutputSchema = z.object({
  wo_id: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  qa_status: z.enum(['approved', 'pending', 'rejected'], {
    required_error: 'QA status is required',
  }),
  batch_number: z.string().min(1, 'Batch number is required'),
  expiry_date: z.string().datetime(),
  location_id: z.string().uuid('Invalid location ID'),
  operator_badge: z.string().optional(),
})

// By-product registration
export const byProductSchema = z.object({
  wo_id: z.string().uuid(),
  main_output_lp_id: z.string().uuid(),
  by_product_id: z.string().uuid(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  qa_status: z.enum(['approved', 'pending', 'rejected']),
  batch_number: z.string().min(1),
  expiry_date: z.string().datetime(),
  location_id: z.string().uuid(),
  zero_qty_confirmed: z.boolean().optional(),
}).refine(
  (data) => data.quantity > 0 || data.zero_qty_confirmed === true,
  { message: 'Quantity is 0 and not confirmed', path: ['quantity'] }
)

// Print label request
export const printLabelSchema = z.object({
  zpl_content: z.string().min(1, 'ZPL content is required'),
  printer_id: z.string().uuid().optional(),
})
```

---

## Database Tables

### printer_configs

Stores printer configuration per location.

```sql
CREATE TABLE printer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  printer_name TEXT NOT NULL,
  printer_ip TEXT NOT NULL,
  printer_port INTEGER NOT NULL DEFAULT 9100,
  printer_type TEXT NOT NULL DEFAULT 'zebra',
  is_default BOOLEAN NOT NULL DEFAULT false,
  location_id UUID REFERENCES locations(id),
  label_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### offline_queue

Stores operations for offline sync.

```sql
CREATE TABLE offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);
```

---

## RLS Policies

```sql
-- printer_configs: Org-level access
CREATE POLICY "printer_configs_org_isolation" ON printer_configs
FOR ALL USING (org_id = auth.jwt() ->> 'org_id');

-- offline_queue: User-level access only
CREATE POLICY "offline_queue_user_isolation" ON offline_queue
FOR ALL USING (user_id = auth.uid());
```

---

## Rate Limiting

| Endpoint | Rate Limit |
|----------|------------|
| POST /validate-wo | 100 req/min |
| POST /register | 60 req/min |
| POST /print-label | 30 req/min |

---

## Multi-tenancy

All endpoints enforce org-level isolation:
- WO validation only returns WOs belonging to user's organization
- LP creation automatically assigns `org_id` from WO
- Printer configs filtered by `org_id`
- Cross-org access returns 404 (not 403) to prevent information disclosure

---

## Related Documentation

- [Scanner Output Components Guide](./scanner-output-components.md)
- [ZPL Label Generation Guide](./zpl-label-guide.md)
- [Offline Queue Guide](./offline-queue-guide.md)

---

## Support

**Story:** 04.7b
**Last Updated:** 2026-01-21
