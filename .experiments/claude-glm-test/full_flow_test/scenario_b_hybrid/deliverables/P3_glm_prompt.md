# Task: Implement LabelPrintService for ZPL Label Generation

## Context
You are implementing the GREEN phase of TDD for Story 05.14 - LP Label Printing.

**Your goal**: Make all 25 failing tests pass by implementing `LabelPrintService`.

## Test File (RED Phase)
See the test file for all 25 test cases that must pass. Key requirements:

### Service Methods to Implement:
1. `generateZPL(lp: LicensePlate, options: PrintLabelOptions): string`
   - Generate Zebra ZPL II code for a single LP label
   - Support label sizes: 4x6", 4x3", 3x2"
   - Include QR code with LP metadata JSON
   - Include CODE128 barcode for LP number
   - Truncate product name to 40 chars
   - Show "--" for missing batch, "N/A" for missing expiry
   - Print quantity command: ^PQ{copies}

2. `generateBulkZPL(lps: LicensePlate[], options: PrintLabelOptions): string`
   - Generate ZPL for multiple LPs (max 100)
   - Apply same config to all labels

3. `validatePrintRequest(options: PrintLabelOptions): void`
   - Validate label size (must be 4x6, 4x3, or 3x2)
   - Validate copies (1-100 range)

## ZPL II Template Structure

```zpl
^XA                          // Start format
^PW812                       // Print width (dots)
^LL1218                      // Label length (dots)
^PQ1                         // Print quantity (copies)

// QR Code
^FO600,50                    // Field Origin (x,y position)
^BQN,2,6                     // QR Code command
^FD{json_data}^FS            // Field Data with JSON

// Barcode (CODE128)
^FO50,500                    // Field Origin
^BCN,100,Y,N,N               // CODE128 command
^FD{lp_number}^FS            // LP number

// Text fields
^FO50,150                    // Position
^A,N,24,24                   // Font (medium)
^FDProduct: {name}^FS        // Product name (truncated to 40 chars)

^FO50,200
^A,N,18,18                   // Font (small)
^FDLP#: {lp_number}^FS

^FO50,240
^A,N,18,18
^FDBatch: {batch_or_--}^FS

^FO50,280
^A,N,18,18
^FDExp: {expiry_or_N/A}^FS

^FO50,320
^A,N,18,18
^FDMfg: {mfg_date}^FS        // Only if present

^FO50,360
^A,N,24,24
^FDQty: {qty} {uom}^FS       // e.g. "500.0 kg"

^FO50,400
^A,N,18,18
^FDWH: {warehouse_code}^FS

^FO50,440
^A,N,18,18
^FDLoc: {location_name}^FS

^XZ                          // End format
```

## Label Dimensions (203 DPI)
- 4x6": width=812, length=1218 dots
- 4x3": width=812, length=609 dots
- 3x2": width=609, length=406 dots

## QR Code JSON Structure
```json
{
  "lp_number": "LP20251201-000123",
  "product_code": "FLR-00-IT",
  "product_name": "Flour Type 00 Premium...",
  "batch": "BCH-456-2024",
  "expiry": "2025-06-15",
  "quantity": 500.0,
  "uom": "kg",
  "warehouse": "WH-001",
  "location": "A-01-02"
}
```

## TypeScript Types

```typescript
export type LabelSize = '4x6' | '4x3' | '3x2';

export interface PrintLabelOptions {
  size: LabelSize;
  copies: number;
  includeQR?: boolean;  // default true
}

export interface LicensePlate {
  id: string;
  lp_number: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  quantity: number;
  uom: string;
  batch_number: string | null;
  expiry_date: string | null;
  manufacture_date: string | null;
  location: {
    id: string;
    name: string;
    full_path: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  status: string;
  qa_status: string;
  // ... other fields
}
```

## Requirements
1. **File structure**: Service class with static methods
2. **Validation**: Throw clear errors for invalid inputs
3. **ZPL compliance**: Must be valid Zebra ZPL II
4. **Test coverage**: All 25 tests must pass
5. **Type safety**: Full TypeScript types
6. **Error messages**: Match test expectations exactly

## Output Format
Write complete TypeScript file:
- Imports
- Type definitions
- LabelPrintService class with all methods
- Private helper methods
- Export statement

**Make all tests GREEN!**
