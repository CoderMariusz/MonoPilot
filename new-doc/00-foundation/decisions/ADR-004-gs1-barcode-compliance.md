# ADR-004: GS1 Barcode Compliance

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related PRDs**: Warehouse (Epic 5), Shipping (Epic 7), Technical (Epic 2)

---

## Context

Food manufacturers require standardized barcode systems for:
1. Supply chain interoperability (customers, distributors, retailers)
2. Regulatory traceability (FSMA Section 204, EU 178/2002)
3. Internal inventory tracking and picking
4. Label generation for products, pallets, and shipments

Barcode standards in food industry:
- **Proprietary**: Internal codes, no external interop
- **UPC/EAN**: Consumer products, limited data capacity
- **GS1-128**: Full Application Identifier support, lot/expiry encoding
- **GS1 DataMatrix**: 2D, high density, same AI system

GS1 provides a comprehensive framework with Application Identifiers (AIs) for encoding product, lot, dates, quantities, and logistics unit identifiers.

---

## Decision

**Adopt GS1 barcode standards throughout MonoPilot:**

| Entity | Standard | Format |
|--------|----------|--------|
| Products | GTIN-14 | 14-digit global trade item number |
| License Plates (LPs) | GS1-128 | Variable, with AIs for lot, expiry, qty |
| Pallets/Shipping Units | SSCC-18 | 18-digit Serial Shipping Container Code |

All barcode generation, parsing, and label printing will follow GS1 specifications.

---

## Implementation

### GTIN-14 for Products

```typescript
// Product barcode structure
interface ProductGTIN {
  indicator: string       // 1 digit (0-8 packaging level)
  companyPrefix: string   // 6-10 digits (assigned by GS1)
  itemReference: string   // 2-5 digits (assigned by company)
  checkDigit: string      // 1 digit (mod-10 calculated)
}

// Example: 10614141000012
// Indicator(1) + Company(061414) + Item(00001) + Check(2)

function generateGTIN14(companyPrefix: string, itemRef: string, indicator = '1'): string {
  const base = indicator + companyPrefix.padEnd(6, '0') + itemRef.padStart(5, '0')
  const checkDigit = calculateGS1CheckDigit(base)
  return base + checkDigit
}
```

### GS1-128 for License Plates

Application Identifiers used:
| AI | Description | Format |
|----|-------------|--------|
| (01) | GTIN | 14 digits |
| (10) | Batch/Lot Number | up to 20 alphanumeric |
| (17) | Expiry Date | YYMMDD |
| (11) | Production Date | YYMMDD |
| (37) | Count/Quantity | up to 8 digits |
| (00) | SSCC | 18 digits |

```typescript
// LP barcode encoding
interface LPBarcode {
  gtin: string           // AI (01)
  lotNumber: string      // AI (10)
  expiryDate?: Date      // AI (17)
  productionDate?: Date  // AI (11)
  quantity?: number      // AI (37)
}

function encodeLPBarcode(lp: LPBarcode): string {
  let barcode = `(01)${lp.gtin}`
  barcode += `(10)${lp.lotNumber}`
  if (lp.expiryDate) {
    barcode += `(17)${formatGS1Date(lp.expiryDate)}`
  }
  if (lp.productionDate) {
    barcode += `(11)${formatGS1Date(lp.productionDate)}`
  }
  if (lp.quantity) {
    barcode += `(37)${lp.quantity}`
  }
  return barcode
}

// Example output: (01)10614141000012(10)LOT2024-001(17)251231(37)100
```

### SSCC-18 for Pallets

```typescript
// Serial Shipping Container Code
interface SSCC {
  extensionDigit: string  // 1 digit (0-9)
  companyPrefix: string   // 6-10 digits
  serialReference: string // 6-10 digits (total 17 + check)
  checkDigit: string      // 1 digit
}

function generateSSCC(companyPrefix: string, serialRef: string): string {
  const extension = '0'  // Default extension digit
  const base = extension + companyPrefix.padEnd(7, '0') + serialRef.padStart(9, '0')
  const checkDigit = calculateGS1CheckDigit(base)
  return base + checkDigit  // 18 digits total
}

// Example: 006141411234567890
```

### Barcode Parsing Service

```typescript
// barcode-parser-service.ts
interface ParsedBarcode {
  type: 'GTIN' | 'GS1-128' | 'SSCC' | 'UNKNOWN'
  gtin?: string
  lotNumber?: string
  expiryDate?: Date
  productionDate?: Date
  quantity?: number
  sscc?: string
  raw: string
}

function parseGS1Barcode(input: string): ParsedBarcode {
  const result: ParsedBarcode = { type: 'UNKNOWN', raw: input }

  // Strip FNC1 characters and parentheses
  const cleaned = input.replace(/[\(\)]/g, '')

  // Parse Application Identifiers
  const aiPatterns = [
    { ai: '01', length: 14, field: 'gtin' },
    { ai: '10', variable: true, maxLength: 20, field: 'lotNumber' },
    { ai: '17', length: 6, field: 'expiryDate', isDate: true },
    { ai: '11', length: 6, field: 'productionDate', isDate: true },
    { ai: '37', variable: true, maxLength: 8, field: 'quantity', isNumeric: true },
    { ai: '00', length: 18, field: 'sscc' },
  ]

  // Extract each AI value...

  return result
}
```

### Label Templates

```typescript
// Label specifications by entity
const labelSpecs = {
  product: {
    barcode: 'GS1-128',
    ais: ['01', '10', '17'],
    size: '4x6 inch',
    humanReadable: true,
  },
  pallet: {
    barcode: 'GS1-128',
    ais: ['00'],  // SSCC
    size: '4x6 inch',
    humanReadable: true,
  },
  case: {
    barcode: 'GS1-128',
    ais: ['01', '10', '17', '37'],
    size: '4x3 inch',
    humanReadable: true,
  },
}
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Proprietary codes** | Full control; simple | No interop; customer rejection; recall complexity |
| **UPC/EAN only** | Retail compatible | No lot/expiry encoding; limited data |
| **Code 128 (non-GS1)** | Flexible encoding | No standard AIs; parsing varies |
| **GS1-128 (chosen)** | Industry standard; full AI support; global interop | Complexity; GS1 membership cost; validation rules |
| **GS1 DataMatrix** | High density; 2D | Scanner compatibility; printing complexity |

---

## Consequences

### Positive

1. **Supply Chain Interoperability**: Customers can scan and integrate directly
2. **Regulatory Compliance**: FSMA/EU traceability requires standardized encoding
3. **Recall Efficiency**: Lot encoded in barcode enables rapid identification
4. **EDI Compatibility**: GS1 identifiers map to ASN/856 transactions
5. **Future-Proof**: GS1 Digital Link ready for QR code evolution

### Negative

1. **GS1 Membership**: Company prefix requires GS1 membership ($250-$10K/year)
2. **Implementation Complexity**: AI parsing, validation, check digit calculation
3. **Scanner Requirements**: Industrial scanners needed for GS1-128
4. **Label Printing**: Specific barcode symbology requirements
5. **Training**: Staff must understand GTIN, lot, expiry encoding

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| GS1 membership | Most food manufacturers already have; cost passed to customer |
| Implementation | Dedicated barcode service; well-tested parser library |
| Scanners | Recommend compatible models; scanner API abstraction |
| Label printing | ZPL templates; label preview before print |
| Training | Barcode wizard UI; auto-detection on scan |

---

## Validation Rules

```typescript
// GS1 validation functions
function validateGTIN14(gtin: string): boolean {
  if (gtin.length !== 14) return false
  if (!/^\d{14}$/.test(gtin)) return false
  return validateCheckDigit(gtin)
}

function validateSSCC(sscc: string): boolean {
  if (sscc.length !== 18) return false
  if (!/^\d{18}$/.test(sscc)) return false
  return validateCheckDigit(sscc)
}

function calculateGS1CheckDigit(digits: string): string {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i])
    const multiplier = (digits.length - i) % 2 === 0 ? 1 : 3
    sum += digit * multiplier
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}
```

---

## Scanner Integration

```typescript
// Scanner service abstraction
interface ScannerEvent {
  raw: string
  parsed: ParsedBarcode
  timestamp: Date
  deviceId?: string
}

// Handle scanned barcode
async function handleScan(event: ScannerEvent): Promise<ScanResult> {
  const { parsed } = event

  switch (parsed.type) {
    case 'GTIN':
      // Product lookup
      return await lookupProductByGTIN(parsed.gtin!)
    case 'GS1-128':
      // LP or receiving
      return await processLPBarcode(parsed)
    case 'SSCC':
      // Pallet/shipment lookup
      return await lookupPalletBySSCC(parsed.sscc!)
    default:
      // Fallback to internal code lookup
      return await lookupByInternalCode(parsed.raw)
  }
}
```

---

## Validation

This decision was validated against:
- [x] GS1 General Specifications v24.0
- [x] FSMA Section 204 Key Data Elements
- [x] Major retailer requirements (Walmart, Kroger, Sysco)
- [x] EDI 856 ASN interoperability

---

## References

- GS1 General Specifications: https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications
- Barcode Service: `apps/frontend/lib/services/barcode-service.ts`
- Label Templates: `apps/frontend/lib/labels/`
- PRD Warehouse Module: `docs/1-BASELINE/product/modules/warehouse.md`
- PRD Shipping Module: `docs/1-BASELINE/product/modules/shipping.md`
