# Batch 5A-3: Receiving - Technical Specification

**Batch:** 5A-3 (Receiving)
**Stories:** 5.8-5.13
**Status:** Solutioning

---

## Overview

This batch covers the receiving workflow:
- **ASN (Advanced Shipping Notice)**: **OPTIONAL** pre-arrival notification from supplier
- **GRN (Goods Received Note)**: Actual receipt of goods with LP creation
- **Direct PO Receiving**: GRN can be created directly from PO without ASN
- **Over-Receipt Validation**: Per-warehouse configurable tolerance
- **Auto-Print Labels**: Generate ZPL labels for received inventory (per-warehouse config)
- **Status Updates**: Update PO/TO received quantities

**Key Concept:** GRN + LP creation is **atomic** (Sprint 0 Gap 6) - all-or-nothing guarantee.

**Important:** ASN is OPTIONAL. Users can receive goods:
1. Via ASN → GRN flow (pre-notified shipments)
2. Directly from PO → GRN (ad-hoc receiving)

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

### grn_items Table (with LP link)

```sql
CREATE TABLE grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  grn_id UUID NOT NULL REFERENCES grn(id) ON DELETE CASCADE,
  po_line_id UUID REFERENCES po_lines(id),
  asn_item_id UUID REFERENCES asn_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  received_qty DECIMAL(15,4) NOT NULL CHECK (received_qty > 0),
  uom VARCHAR(10) NOT NULL,

  -- LP Link (grn_items → LP, not LP → grn_items)
  lp_id UUID REFERENCES license_plates(id),

  -- Batch/Expiry captured at receiving
  batch_number VARCHAR(50),
  supplier_batch_number VARCHAR(50),
  manufacture_date DATE,
  expiry_date DATE,
  location_id UUID REFERENCES locations(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_grn_items_org ON grn_items(org_id);
CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product ON grn_items(product_id);
CREATE INDEX idx_grn_items_po_line ON grn_items(po_line_id);
CREATE INDEX idx_grn_items_lp ON grn_items(lp_id);
```

**LP Link Pattern:** `grn_items.lp_id` → `license_plates.id`
- Each GRN item creates exactly ONE LP
- LP can be traced back to GRN via grn_items join
- No `grn_id` column needed in license_plates table

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

**Receiving Modes:**
1. **From ASN**: `asn_id` provided → items pre-filled from ASN
2. **From PO (direct)**: `po_id` provided, no `asn_id` → ad-hoc receiving
3. **Both**: `asn_id` + `po_id` → ASN linked to PO

```json
Request:
{
  "asn_id": "UUID (OPTIONAL - for ASN-based receiving)",
  "po_id": "UUID (OPTIONAL - for direct PO receiving)",
  "warehouse_id": "UUID (required)",
  "grn_items": [
    {
      "asn_item_id": "UUID (optional, if from ASN)",
      "po_line_id": "UUID (optional, for PO qty update)",
      "product_id": "UUID",
      "received_qty": 50,
      "batch_number": "BATCH-001",
      "supplier_batch_number": "SUP-BATCH-001",
      "manufacture_date": "2025-01-01",
      "expiry_date": "2025-12-31",
      "location_id": "UUID",
      "qa_status": "pending|passed (optional, default from warehouse_settings)"
    }
  ],
  "notes": "Received in good condition"
}

Response (201):
{
  "grn_id": "UUID",
  "grn_number": "GRN-WH01-20250120-0001",
  "grn_items": [
    {
      "grn_item_id": "UUID",
      "product_id": "UUID",
      "received_qty": 50,
      "lp_id": "UUID",
      "lp_number": "LP-WH01-20250120-0001"
    }
  ],
  "license_plates_created": 1,
  "asn_status_updated": "completed (if from ASN, else null)",
  "po_received_qty_updated": true
}
```

**Validation:**
- At least one of `asn_id` or `po_id` should be provided (but not required)
- `warehouse_id` is required
- Over-receipt check uses `warehouse_settings.allow_over_receipt`

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

**Configuration in `warehouse_settings`:**
- `allow_over_receipt BOOLEAN DEFAULT false` - if false, block over-receipt
- `over_receipt_tolerance_percent DECIMAL(5,2) DEFAULT 0` - allowed overage (e.g., 5.00 = 5%)

```sql
FUNCTION check_over_receipt(
  p_po_line_id UUID,
  p_received_qty DECIMAL,
  p_warehouse_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_ordered_qty DECIMAL;
  v_total_received DECIMAL;
  v_allow_over BOOLEAN;
  v_tolerance DECIMAL;
  v_max_allowed DECIMAL;
BEGIN
  -- Get warehouse settings
  SELECT allow_over_receipt, over_receipt_tolerance_percent
  INTO v_allow_over, v_tolerance
  FROM warehouse_settings WHERE warehouse_id = p_warehouse_id;

  -- If over-receipt allowed, skip check
  IF v_allow_over THEN
    RETURN true;
  END IF;

  -- Get ordered qty
  SELECT quantity INTO v_ordered_qty FROM po_lines WHERE id = p_po_line_id;

  -- Get total received so far
  SELECT COALESCE(SUM(received_qty), 0) INTO v_total_received
  FROM grn_items WHERE po_line_id = p_po_line_id;

  -- Calculate max allowed (with tolerance)
  v_max_allowed := v_ordered_qty * (1 + COALESCE(v_tolerance, 0) / 100);

  IF (v_total_received + p_received_qty) > v_max_allowed THEN
    RETURN false; -- Over-receipt detected
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

---

## Label Printing (ZPL Format)

**Configuration in `warehouse_settings` (per warehouse):**
- `printer_ip VARCHAR(50)` - IP address of Zebra printer
- `auto_print_on_receive BOOLEAN DEFAULT false` - auto-print on GRN creation
- `copies_per_label INTEGER DEFAULT 1` - copies per LP (1-5)

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
