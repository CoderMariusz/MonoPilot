# Batch 5A-3: Receiving - Technical Specification

**Batch:** 5A-3 (Receiving)
**Stories:** 5.8-5.13
**Status:** Solutioning

---

## Overview

This batch covers the receiving workflow:
- **ASN (Advanced Shipping Notice)**: Pre-arrival notification from supplier
- **GRN (Goods Received Note)**: Actual receipt of goods with LP creation
- **Over-Receipt Validation**: Prevent receiving more than ordered
- **Auto-Print Labels**: Generate ZPL labels for received inventory
- **Status Updates**: Update PO/TO received quantities

**Key Concept:** GRN + LP creation is **atomic** (Sprint 0 Gap 6) - all-or-nothing guarantee.

---

## Database Schema

### asn Table (Advanced Shipping Notice)

```sql
CREATE TABLE asn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  asn_number VARCHAR(50) NOT NULL UNIQUE,
  po_id UUID REFERENCES purchase_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  expected_arrival_date DATE,
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
    -- Enum: 'pending', 'received', 'completed'
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),

  UNIQUE(org_id, asn_number),
  INDEX(org_id),
  INDEX(po_id),
  INDEX(supplier_id),
  INDEX(status)
);
```

### asn_items Table

```sql
CREATE TABLE asn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  asn_id UUID NOT NULL REFERENCES asn(id),
  po_line_id UUID REFERENCES po_lines(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  supplier_batch_number VARCHAR(50),
  manufacture_date DATE,
  expiry_date DATE,

  INDEX(org_id),
  INDEX(asn_id),
  INDEX(product_id)
);
```

### grn Table (Goods Received Note)

```sql
CREATE TABLE grn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  grn_number VARCHAR(50) NOT NULL,
  asn_id UUID REFERENCES asn(id),
  po_id UUID REFERENCES purchase_orders(id),
  to_id UUID REFERENCES transfer_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  receiving_date TIMESTAMP DEFAULT now(),
  status VARCHAR(20) DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),

  UNIQUE(org_id, grn_number),
  INDEX(org_id),
  INDEX(po_id),
  INDEX(to_id),
  INDEX(asn_id),
  INDEX(supplier_id),
  INDEX(warehouse_id)
);
```

### grn_items Table

```sql
CREATE TABLE grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  grn_id UUID NOT NULL REFERENCES grn(id),
  po_line_id UUID REFERENCES po_lines(id),
  asn_item_id UUID REFERENCES asn_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  received_qty DECIMAL(15,4) NOT NULL,
  uom VARCHAR(10) NOT NULL,

  INDEX(org_id),
  INDEX(grn_id),
  INDEX(product_id),
  INDEX(po_line_id)
);
```

**RLS:** Standard org_id isolation on all tables.

---

## API Endpoints

### ASN Management

#### POST /api/warehouse/asns
**Create ASN from PO**

```json
Request:
{
  "po_id": "UUID",
  "expected_arrival_date": "2025-02-01",
  "carrier": "FedEx",
  "tracking_number": "1234567890"
}

Response (201):
{
  "asn_id": "UUID",
  "asn_number": "ASN-20250120-0001",
  "po_id": "UUID",
  "asn_items": [
    { "product_id": "UUID", "product_name": "Flour", "qty": 100, "uom": "kg" },
    ...
  ],
  "supplier_name": "Acme Mills",
  "expected_arrival_date": "2025-02-01"
}
```

#### GET /api/warehouse/asns
**Fetch ASNs with filtering**

```json
Request:
{
  "status": "pending|received|completed",
  "supplier_id": "UUID (optional)",
  "date_from": "YYYY-MM-DD (optional)",
  "date_to": "YYYY-MM-DD (optional)"
}
```

#### PUT /api/warehouse/asns/:id
**Update ASN items (batch/expiry/qty)**

```json
Request:
{
  "asn_items": [
    { "asn_item_id": "UUID", "supplier_batch_number": "...", "expiry_date": "..." },
    ...
  ]
}
```

### GRN Management (Receiving)

#### POST /api/warehouse/grns
**Create GRN + LP (Atomic Transaction - Gap 6)**

```json
Request:
{
  "asn_id": "UUID (optional, for receiving from ASN)",
  "po_id": "UUID (optional, for ad-hoc receiving)",
  "grn_items": [
    {
      "asn_item_id": "UUID (optional)",
      "product_id": "UUID",
      "received_qty": 50,
      "batch_number": "BATCH-001",
      "supplier_batch_number": "SUP-BATCH-001",
      "manufacture_date": "2025-01-01",
      "expiry_date": "2025-12-31",
      "location_id": "UUID",
      "qa_status": "pending|passed (optional, default pending)"
    },
    ...
  ],
  "notes": "Received in good condition"
}

Response (201):
{
  "grn_id": "UUID",
  "grn_number": "GRN-20250120-0001",
  "grn_items": [...],
  "license_plates": [
    {
      "lp_id": "UUID",
      "lp_number": "LP-20250120-0001",
      "product_id": "UUID",
      "qty": 50,
      "location_id": "UUID"
    },
    ...
  ],
  "asn_status_updated": "completed (if from ASN)",
  "po_received_qty_updated": true
}
```

---

## Transaction Flow (Gap 6: Atomicity)

**GRN + LP creation is atomic (all-or-nothing):**

```
1. START database transaction
2. INSERT grn record (validate: asn_id/po_id/supplier/warehouse)
3. INSERT grn_items for each line (validate: product_id, qty)
4. FOR each grn_item:
   a. Auto-generate lp_number
   b. INSERT license_plates (with qty, batch, expiry, location, qa_status)
5. UPDATE asn.status → 'completed' (if from ASN)
6. UPDATE po_line.received_qty += grn_qty (if from PO)
7. Check for PO completion (all lines received >= ordered)
8. If PO complete: UPDATE po.status → 'closed'
9. COMMIT transaction

If ANY step fails:
   - ROLLBACK: no GRN, no LP, no ASN update, no PO update
   - Error message to user with specific failure reason
```

---

## Over-Receipt Handling

```sql
FUNCTION check_over_receipt(po_line_id, received_qty) RETURNS BOOLEAN AS $$
DECLARE
  ordered_qty DECIMAL;
  total_received DECIMAL;
BEGIN
  SELECT quantity INTO ordered_qty FROM po_lines WHERE id = po_line_id;
  SELECT COALESCE(SUM(received_qty), 0) INTO total_received
    FROM grn_items WHERE po_line_id = po_line_id;

  IF (total_received + received_qty) > ordered_qty THEN
    RETURN false; -- Over-receipt detected
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

**warehouse_settings table:**
```sql
ALTER TABLE warehouse_settings ADD COLUMN allow_over_receipt BOOLEAN DEFAULT false;
```

---

## Label Printing (ZPL Format)

**ZPL Template for LP Labels:**

```zpl
^XA
^FO50,50^ADN,36,20^FD{lp_number}^FS
^BY3,3,120^FO50,100^BC^FD{lp_barcode}^FS
^FO50,250^ADN,18,10^FDProduct: {product_name}^FS
^FO50,280^ADN,18,10^FDQty: {quantity} {uom}^FS
^FO50,310^ADN,18,10^FDBatch: {batch_number}^FS
^FO50,340^ADN,18,10^FDExpiry: {expiry_date}^FS
^FO50,370^ADN,18,10^FDLoc: {location_code}^FS
^XZ
```

**Printer Configuration:**
- warehouse_settings.printer_ip: IP address of Zebra printer
- warehouse_settings.auto_print_on_receive: Boolean (enable/disable)
- warehouse_settings.copies_per_label: Integer (1-5)

---

## RLS Policies

Standard org_id isolation:
```sql
ALTER TABLE asn ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

-- SELECT, INSERT, UPDATE, DELETE policies with:
-- org_id = (auth.jwt() ->> 'org_id')::uuid
```

---

## Dependencies

**Requires:**
- Story 5.1 (License Plate Creation)
- Story 5.4 (LP Number Generation)
- Story 3.1 (Purchase Orders)

**Blocks:**
- Story 5.28 (Forward/Backward Traceability)
- Story 5.13 (Update PO/TO Received Qty) - depends on GRN creation

---

## Implementation Notes

- **Gap 6 Alert**: Story 5.11 has complex atomicity requirements. Requires careful transaction handling and rollback logic.
- **Performance**: Large receiving operations (100+ items) may require batch processing.
- **Validation**: Over-receipt logic depends on warehouse_settings. Coordinate with Story 5.31.
- **Label Printing**: Requires ZPL printer integration. Test with Zebra printers.
- **Idempotency**: GRN creation should handle duplicate ASN receives gracefully.
