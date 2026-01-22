# SSCC & BOL Labels API Reference

> Story: 07.13 - SSCC Generation + BOL + Shipping Labels
> Module: Shipping
> Status: DEPLOYED

## Overview

The SSCC & BOL Labels API enables warehouse staff to generate GS1-compliant SSCC barcodes for shipment boxes, create Bill of Lading (BOL) documents, print shipping labels in ZPL format for Zebra printers, and generate packing slips. This is compliance-critical for food manufacturing traceability.

---

## Endpoints

### POST /api/shipping/shipments/:id/generate-sscc

Generate unique SSCC-18 codes for all boxes in a shipment. Idempotent - only generates for boxes without SSCC.

**Request**

```http
POST /api/shipping/shipments/sh-001/generate-sscc
Authorization: Bearer <token>
Content-Type: application/json
```

**Response**

```json
{
  "success": true,
  "generated_count": 3,
  "skipped_count": 0,
  "boxes": [
    {
      "box_id": "box-001",
      "box_number": 1,
      "sscc": "006141410000123452",
      "sscc_formatted": "00 6141 4100 0012 3452"
    },
    {
      "box_id": "box-002",
      "box_number": 2,
      "sscc": "006141410000123469",
      "sscc_formatted": "00 6141 4100 0012 3469"
    },
    {
      "box_id": "box-003",
      "box_number": 3,
      "sscc": "006141410000123476",
      "sscc_formatted": "00 6141 4100 0012 3476"
    }
  ]
}
```

**SSCC-18 Structure**

| Component | Length | Description |
|-----------|--------|-------------|
| Extension Digit | 1 | 0 = carton, 9 = pallet |
| GS1 Company Prefix | 7-10 | Unique prefix from GS1 |
| Serial Reference | 6-9 | Organization sequence |
| Check Digit | 1 | MOD 10 calculation |

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | SSCC generated successfully |
| 400 | GS1 Company Prefix not configured |
| 404 | Shipment not found |
| 409 | Shipment not in `packed` status |

**Error Response (GS1 Prefix Missing)**

```json
{
  "success": false,
  "error": {
    "code": "GS1_PREFIX_NOT_CONFIGURED",
    "message": "GS1 Company Prefix not configured for organization",
    "settings_url": "/settings/organization"
  }
}
```

---

### POST /api/shipping/shipments/:id/generate-bol

Generate Bill of Lading PDF document for a shipment.

**Request**

```http
POST /api/shipping/shipments/sh-001/generate-bol
Authorization: Bearer <token>
Content-Type: application/json

{
  "force_regenerate": false,
  "include_product_list": true
}
```

**Request Body**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| force_regenerate | boolean | false | Re-generate even if cached |
| include_product_list | boolean | true | Include detailed product summary |

**Response**

```json
{
  "success": true,
  "bol_number": "BOL-2026-000123",
  "pdf_url": "https://storage.supabase.co/bol/org-001/sh-001.pdf?token=...",
  "generated_at": "2026-01-22T14:30:00Z",
  "file_size_kb": 145,
  "cached": false
}
```

**BOL PDF Contents**

- **Header**: BOL number, date, carrier, pro number
- **Shipper Section**: Organization name, address, phone, email
- **Consignee Section**: Customer name, shipping address, phone
- **Freight Details Table**: SSCC, weight, dimensions, freight class, NMFC
- **Totals**: Total cartons, total weight, declared value
- **Product Summary**: Products per carton with lot numbers and BBD
- **Signature Section**: Shipper and carrier signature placeholders

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | BOL generated successfully |
| 400 | Missing SSCC codes or carrier not assigned |
| 404 | Shipment not found |
| 500 | PDF generation timeout |

**Error Response (Missing SSCC)**

```json
{
  "success": false,
  "error": {
    "code": "MISSING_SSCC",
    "message": "All boxes must have SSCC before generating BOL",
    "boxes_missing_sscc": 2
  }
}
```

---

### POST /api/shipping/shipments/:id/print-labels

Generate shipping labels in ZPL or PDF format for Zebra printers.

**Request**

```http
POST /api/shipping/shipments/sh-001/print-labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "4x6",
  "output": "zpl",
  "box_ids": ["box-001", "box-002"]
}
```

**Request Body**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| format | enum | "4x6" | Label size: "4x6" or "4x8" |
| output | enum | "zpl" | Output format: "zpl" or "pdf" |
| box_ids | string[] | all | Optional: specific boxes only |

**Response (ZPL Output)**

```json
{
  "success": true,
  "labels": [
    {
      "box_id": "box-001",
      "box_number": 1,
      "sscc": "006141410000123452",
      "zpl": "^XA\n^FO50,50^BY3^BCN,100,Y,N,N^FD00006141410000123452^FS\n^FO50,180^A0N,30,30^FD00 6141 4100 0012 3452^FS\n^FO50,230^A0N,25,25^FDSHIP TO:^FS\n^FO50,260^A0N,25,25^FDBlue Mountain Restaurant^FS\n^FO50,290^A0N,25,25^FD789 Main Street^FS\n^FO50,320^A0N,25,25^FDDenver, CO 80210^FS\n^FO50,370^A0N,25,25^FDORDER: SO-2026-00123^FS\n^FO50,400^A0N,25,25^FDBOX: 1 of 3^FS\n^FO50,430^A0N,25,25^FDWEIGHT: 48.5 kg^FS\n^XZ"
    },
    {
      "box_id": "box-002",
      "box_number": 2,
      "sscc": "006141410000123469",
      "zpl": "^XA\n..."
    }
  ]
}
```

**Response (PDF Output)**

```json
{
  "success": true,
  "labels": [
    {
      "box_id": "box-001",
      "box_number": 1,
      "sscc": "006141410000123452",
      "pdf_url": "https://storage.supabase.co/labels/org-001/sh-001/box-001.pdf"
    }
  ]
}
```

**ZPL Label Contents**

- GS1-128 barcode with SSCC (AI 00)
- Human-readable SSCC with spaces
- Ship To: customer address
- Order number
- Box X of Y
- Weight in kg
- Handling instructions

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Labels generated successfully |
| 400 | No SSCC codes found |
| 404 | Shipment or box not found |

---

### POST /api/shipping/shipments/:id/print-packing-slip

Generate packing slip PDF for a shipment.

**Request**

```http
POST /api/shipping/shipments/sh-001/print-packing-slip
Authorization: Bearer <token>
Content-Type: application/json

{
  "force_regenerate": false
}
```

**Response**

```json
{
  "success": true,
  "pdf_url": "https://storage.supabase.co/packing-slip/org-001/sh-001.pdf?token=...",
  "generated_at": "2026-01-22T14:35:00Z",
  "file_size_kb": 82,
  "cached": true
}
```

**Packing Slip PDF Contents**

- **Header**: "PACKING SLIP", SO number, shipment number, date, tracking
- **Ship To / Ship From**: Customer address and warehouse address
- **Line Items Table**: Product, qty ordered, qty shipped, backorder, lot, BBD
- **Carton Summary**: Box X of Y, SSCC, weight, dimensions
- **Special Instructions**: Customer notes, temperature handling, allergen warnings
- **Signature Section**: Shipped By/Date, Received By/Date

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Packing slip generated successfully |
| 404 | Shipment not found |
| 500 | PDF generation error |

---

### GET /api/shipping/shipments/:id/boxes/:boxId/label-preview

Get label preview data for a specific box.

**Request**

```http
GET /api/shipping/shipments/sh-001/boxes/box-001/label-preview?format=4x6
Authorization: Bearer <token>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| format | enum | "4x6" | Label format: "4x6" or "4x8" |

**Response**

```json
{
  "success": true,
  "sscc": "006141410000123452",
  "sscc_formatted": "00 6141 4100 0012 3452",
  "barcode_image_base64": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "label_content": {
    "ship_to": {
      "company": "Blue Mountain Restaurant",
      "contact": "John Smith",
      "address_line_1": "789 Main Street",
      "city": "Denver",
      "state": "CO",
      "postal_code": "80210",
      "country": "USA"
    },
    "order_number": "SO-2026-00123",
    "box_number": "1 of 3",
    "weight": "48.5 kg",
    "handling_instructions": "Keep Refrigerated (2-8C)"
  }
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Label preview retrieved |
| 404 | Shipment or box not found |

---

## Data Models

### GenerateSSCCInput

```typescript
interface GenerateSSCCInput {
  // No body required - generates for all boxes without SSCC
}
```

### GenerateBOLInput

```typescript
interface GenerateBOLInput {
  force_regenerate?: boolean;     // Re-generate even if cached
  include_product_list?: boolean; // Include product summary per carton
}
```

### PrintLabelsInput

```typescript
interface PrintLabelsInput {
  format: '4x6' | '4x8';          // Label size
  output: 'zpl' | 'pdf';          // Output format
  box_ids?: string[];             // Specific boxes (optional)
}
```

### SSCCResult

```typescript
interface SSCCResult {
  box_id: string;
  box_number: number;
  sscc: string;           // 18-digit SSCC
  sscc_formatted: string; // SSCC with spaces for readability
}
```

---

## MOD 10 Check Digit Algorithm

The SSCC-18 check digit is calculated using the GS1 MOD 10 algorithm:

1. Starting from the rightmost digit, multiply odd positions by 3 and even positions by 1
2. Sum all products
3. Check digit = (10 - (sum % 10)) % 10

**Example**

```
Base: 0 0614141 000012345 (17 digits)

Position:  17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1
Digit:      0  0  6  1  4  1  4  1  0  0  0  0  1  2  3  4  5
Multiplier: 3  1  3  1  3  1  3  1  3  1  3  1  3  1  3  1  3
Product:    0  0 18  1 12  1 12  1  0  0  0  0  3  2  9  4 15

Sum = 78
Check = (10 - (78 % 10)) % 10 = 2

Full SSCC: 006141410000123452
```

---

## GS1-128 Barcode Format

The shipping label barcode uses GS1-128 encoding with:

- **FNC1 Start**: Special character indicating GS1 format
- **Application Identifier (00)**: Identifies data as SSCC
- **18-digit SSCC**: Full SSCC number

```typescript
// bwip-js encoding
const barcode = await bwipjs.toBuffer({
  bcid: 'gs1-128',
  text: '(00)006141410000123452',  // AI (00) + SSCC
  scale: 3,
  height: 15,
  includetext: true,
  parsefnc: true  // Parse FNC1 characters
});
```

---

## Permission Model

| Role | Generate SSCC | Generate BOL | Print Labels | Print Packing Slip |
|------|---------------|--------------|--------------|-------------------|
| Packer | Yes | Yes | Yes | Yes |
| Warehouse | Yes | Yes | Yes | Yes |
| Shipping | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| GS1_PREFIX_NOT_CONFIGURED | 400 | Organization missing GS1 Company Prefix |
| MISSING_SSCC | 400 | Boxes missing SSCC codes |
| NO_CARRIER_ASSIGNED | 400 | Shipment has no carrier assigned |
| MISSING_BOX_DATA | 400 | Boxes missing weight or dimensions |
| SHIPMENT_NOT_PACKED | 409 | Shipment not in packed status |
| PDF_GENERATION_TIMEOUT | 500 | PDF generation exceeded timeout |
| NOT_FOUND | 404 | Shipment or box not found |
| FORBIDDEN | 403 | User not authorized |

---

## Multi-Tenant Isolation

All endpoints enforce RLS policies:

- SSCC generation scoped to organization
- PDFs stored with org_id path prefix: `/bol/{org_id}/{shipment_id}.pdf`
- Signed URLs include org_id verification
- Cross-tenant access returns 404

---

## Caching

BOL and packing slip PDFs are cached for 24 hours:

- Cached PDF URL returned if exists and not force_regenerate
- Cache invalidated on shipment update
- `cached: true` in response indicates cached version

---

## Related Documentation

- [SSCC & BOL Labels User Guide](../../guides/shipping/sscc-bol-labels.md)
- [Pick Confirmation API](./pick-confirmation.md)
- [Inventory Allocation API](./inventory-allocation.md)
