# Label Print Service - API Documentation
**Story**: 05.14 - LP Label Printing (ZPL)
**Author**: TECH-WRITER (Claude - Scenario A)
**Phase**: 7/7

---

## Overview

The Label Print Service generates Zebra ZPL II code for printing License Plate labels with barcodes, QR codes, and product information.

---

## API Reference

### `LabelPrintService.generateZPL()`

Generate ZPL code for a single LP label.

#### Signature
```typescript
static generateZPL(
  lp: LicensePlate,
  options: PrintLabelOptions
): string
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lp` | `LicensePlate` | Yes | License plate object with product, location, warehouse data |
| `options` | `PrintLabelOptions` | Yes | Print configuration |
| `options.size` | `'4x6' \| '4x3' \| '3x2'` | Yes | Label size in inches |
| `options.copies` | `number` | Yes | Number of copies (1-100) |
| `options.includeQR` | `boolean` | No | Include QR code (default: true) |

#### Returns
- **Type**: `string`
- **Description**: ZPL II formatted code ready to send to Zebra printer

#### Throws
- `Error`: "Invalid label size" - if size not in ['4x6', '4x3', '3x2']
- `Error`: "Copies must be between 1 and 100" - if copies out of range

#### Example
```typescript
import { LabelPrintService } from '@/lib/services/label-print-service';

const lp = await LicensePlateService.getById('lp-id');

const zpl = LabelPrintService.generateZPL(lp, {
  size: '4x6',
  copies: 2,
  includeQR: true
});

// Send to printer or download
console.log(zpl);
// Output:
// ^XA
// ^PW812
// ^LL1218
// ^PQ2
// ^FO600,50
// ^BQN,2,6
// ^FD{"lp_number":"LP..."}^FS
// ...
// ^XZ
```

---

### `LabelPrintService.generateBulkZPL()`

Generate ZPL for multiple LPs in one print job.

#### Signature
```typescript
static generateBulkZPL(
  lps: LicensePlate[],
  options: PrintLabelOptions
): string
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lps` | `LicensePlate[]` | Yes | Array of license plates (max 100) |
| `options` | `PrintLabelOptions` | Yes | Print configuration (applied to all) |

#### Returns
- **Type**: `string`
- **Description**: Concatenated ZPL for all LPs

#### Throws
- `Error`: "Maximum 100 license plates per bulk print" - if lps.length > 100
- Same validation errors as `generateZPL()`

#### Example
```typescript
const lps = await LicensePlateService.list({ warehouse_id: 'wh-123' });

const zpl = LabelPrintService.generateBulkZPL(lps.data, {
  size: '4x3',
  copies: 1
});

// Send all labels to printer queue
downloadZPL(zpl, 'bulk-labels.zpl');
```

---

## Label Specifications

### Supported Label Sizes

| Size | Width | Height | Dots (203 DPI) | Use Case |
|------|-------|--------|----------------|----------|
| **4x6"** | 4" | 6" | 812 x 1218 | Standard LP labels (recommended) |
| **4x3"** | 4" | 3" | 812 x 609 | Compact labels for small items |
| **3x2"** | 3" | 2" | 609 x 406 | Minimal labels for very small containers |

### Label Layout

All labels include:
1. **QR Code** (top right) - JSON metadata for scanner apps
2. **CODE128 Barcode** (bottom) - LP number for barcode scanners
3. **Text Fields**:
   - Product name (truncated to 40 chars)
   - LP number
   - Batch number (or "--")
   - Expiry date (or "N/A")
   - Manufacture date (if present)
   - Quantity with UOM
   - Warehouse code
   - Location name

---

## QR Code Data Structure

The QR code contains LP metadata as JSON:

```json
{
  "lp_number": "LP20251201-000123",
  "product_code": "FLR-00-IT",
  "product_name": "Flour Type 00 Premium Grade Italian Import",
  "batch": "BCH-456-2024",
  "expiry": "2025-06-15",
  "quantity": 500.0,
  "uom": "kg",
  "warehouse": "WH-001",
  "location": "A-01-02"
}
```

**Scanner Integration**: Mobile apps can scan QR to instantly pull LP data without API call.

---

## Usage Guide

### Basic Usage

```typescript
// 1. Fetch LP
const lp = await LicensePlateService.getById(lpId);

// 2. Generate ZPL
const zpl = LabelPrintService.generateZPL(lp, {
  size: '4x6',
  copies: 1,
});

// 3. Send to printer (browser API or backend)
await printZPL(zpl);
```

### Bulk Printing

```typescript
// Print all available LPs for a product
const lps = await LicensePlateService.list({
  product_id: productId,
  status: 'available',
  limit: 100
});

const zpl = LabelPrintService.generateBulkZPL(lps.data, {
  size: '4x3',
  copies: 2
});

downloadZPL(zpl, `labels-${productId}.zpl`);
```

### Without QR Code

```typescript
const zpl = LabelPrintService.generateZPL(lp, {
  size: '4x6',
  copies: 1,
  includeQR: false  // Omit QR code
});
```

---

## Integration

### API Endpoint

```
POST /api/warehouse/license-plates/:id/print-label
```

**Request Body**:
```json
{
  "size": "4x6",
  "copies": 1,
  "includeQR": true
}
```

**Response** (200 OK):
```json
{
  "zpl": "^XA\n^PW812\n...",
  "lp_number": "LP20251201-000123",
  "label_count": 1
}
```

---

## Testing

All tests located in:
- Unit: `apps/frontend/lib/services/__tests__/label-print-service.test.ts`
- Integration: `__tests__/integration/api/warehouse/label-printing.test.ts`
- E2E: `__tests__/e2e/warehouse/label-printing.spec.ts`

Run tests:
```bash
pnpm test label-print-service
```

---

## Technical Notes

- **ZPL Version**: ZPL II (compatible with all Zebra printers since 2000)
- **DPI**: 203 dots per inch (standard for most Zebra printers)
- **Font**: ZPL native fonts (A = Sans Serif)
- **Barcode Type**: CODE128 (high density, supports alphanumeric)
- **QR Code**: Model 2, Error Correction Level M

---

**Documentation Complete** ✓
