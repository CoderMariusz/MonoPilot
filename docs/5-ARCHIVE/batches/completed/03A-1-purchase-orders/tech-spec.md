# Batch 03A-1: Purchase Orders - Technical Specification

**Batch ID:** 03A-1
**Epic:** 3 - Planning Operations
**Stories:** 3.1-3.5
**Prerequisites:** Epic 1 (Organizations, Users, Warehouses), Epic 2 Batch 2A (Products), Story 3.17 (Suppliers)
**Token Budget:** ~35-45k tokens

---

## Overview

This batch implements the complete Purchase Order (PO) module including:
- PO CRUD operations
- PO Line management with tax calculation
- Bulk PO creation (deferred to P2)
- Approval workflow
- Configurable statuses

---

## Database Schema

### Table: purchase_orders

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_number VARCHAR(20) NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  payment_terms VARCHAR(100),
  shipping_method VARCHAR(100),
  notes TEXT,

  -- Financial fields (all in supplier currency)
  currency VARCHAR(3) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Approval fields (Story 3.4)
  approval_status VARCHAR(20), -- null, 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_po_org_number ON purchase_orders(org_id, po_number);
CREATE INDEX idx_po_org ON purchase_orders(org_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_expected_date ON purchase_orders(expected_delivery_date);
```

### Table: po_lines

```sql
CREATE TABLE po_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL,

  quantity NUMERIC(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,

  -- Calculated fields
  line_subtotal NUMERIC(15,2) NOT NULL,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total_with_tax NUMERIC(15,2) NOT NULL,

  expected_delivery_date DATE,
  received_qty NUMERIC(15,3) DEFAULT 0, -- Epic 5

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_po_lines_sequence ON po_lines(po_id, sequence);
CREATE INDEX idx_po_lines_org ON po_lines(org_id);
CREATE INDEX idx_po_lines_po ON po_lines(po_id);
CREATE INDEX idx_po_lines_product ON po_lines(product_id);
```

### Table: po_approvals (Audit Trail)

```sql
CREATE TABLE po_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rejection_reason TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_po_approvals_po ON po_approvals(po_id);
```

### Table: planning_settings (PO Statuses)

```sql
CREATE TABLE planning_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- PO Configuration
  po_statuses JSONB NOT NULL DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "submitted", "label": "Submitted", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "confirmed", "label": "Confirmed", "color": "green", "is_default": false, "sequence": 3},
    {"code": "receiving", "label": "Receiving", "color": "yellow", "is_default": false, "sequence": 4},
    {"code": "closed", "label": "Closed", "color": "purple", "is_default": false, "sequence": 5}
  ]'::jsonb,
  po_default_status VARCHAR(50) DEFAULT 'draft',
  po_require_approval BOOLEAN DEFAULT false,
  po_approval_threshold NUMERIC(15,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_planning_settings_org ON planning_settings(org_id);
```

---

## Database Trigger: PO Totals Recalculation

```sql
CREATE OR REPLACE FUNCTION recalculate_po_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_po_id UUID;
BEGIN
  -- Get po_id from OLD or NEW depending on operation
  IF TG_OP = 'DELETE' THEN
    target_po_id := OLD.po_id;
  ELSE
    target_po_id := NEW.po_id;
  END IF;

  UPDATE purchase_orders
  SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM po_lines WHERE po_id = target_po_id),
    tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM po_lines WHERE po_id = target_po_id),
    total = (SELECT COALESCE(SUM(line_total_with_tax), 0) FROM po_lines WHERE po_id = target_po_id),
    updated_at = NOW()
  WHERE id = target_po_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalc_po_totals
AFTER INSERT OR UPDATE OR DELETE ON po_lines
FOR EACH ROW
EXECUTE FUNCTION recalculate_po_totals();
```

---

## RLS Policies

```sql
-- purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON purchase_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON purchase_orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON purchase_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON purchase_orders
  FOR DELETE TO authenticated USING (true);

-- po_lines
ALTER TABLE po_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON po_lines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON po_lines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON po_lines
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON po_lines
  FOR DELETE TO authenticated USING (true);

-- po_approvals
ALTER TABLE po_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON po_approvals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON po_approvals
  FOR INSERT TO authenticated WITH CHECK (true);

-- planning_settings
ALTER TABLE planning_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON planning_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users" ON planning_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

---

## API Endpoints

| Method | Endpoint | Description | Story |
|--------|----------|-------------|-------|
| GET | `/api/planning/purchase-orders` | List POs with filters | 3.1 |
| POST | `/api/planning/purchase-orders` | Create PO | 3.1 |
| GET | `/api/planning/purchase-orders/:id` | Get PO detail | 3.1 |
| PUT | `/api/planning/purchase-orders/:id` | Update PO | 3.1 |
| DELETE | `/api/planning/purchase-orders/:id` | Delete PO | 3.1 |
| GET | `/api/planning/purchase-orders/:id/lines` | List PO lines | 3.2 |
| POST | `/api/planning/purchase-orders/:id/lines` | Add PO line | 3.2 |
| PUT | `/api/planning/purchase-orders/:id/lines/:lineId` | Update PO line | 3.2 |
| DELETE | `/api/planning/purchase-orders/:id/lines/:lineId` | Delete PO line | 3.2 |
| POST | `/api/planning/purchase-orders/bulk` | Parse bulk PO file | 3.3 |
| PUT | `/api/planning/purchase-orders/bulk/confirm` | Create bulk POs | 3.3 |
| PUT | `/api/planning/purchase-orders/:id/approve` | Approve/Reject PO | 3.4 |
| PUT | `/api/planning/purchase-orders/:id/status` | Change PO status | 3.5 |
| GET | `/api/planning/settings` | Get planning settings | 3.5 |
| PUT | `/api/planning/settings` | Update planning settings | 3.5 |

---

## Frontend Routes

| Route | Component | Description | Story |
|-------|-----------|-------------|-------|
| `/planning/purchase-orders` | PurchaseOrdersPage | PO list with filters | 3.1 |
| `/planning/purchase-orders/:id` | PurchaseOrderDetailPage | PO detail with tabs | 3.1 |
| `/settings/planning` | PlanningSettingsPage | PO statuses config | 3.5 |

---

## Components

| Component | Location | Description | Story |
|-----------|----------|-------------|-------|
| PurchaseOrdersTable | `components/planning/` | PO list table | 3.1 |
| POCreateModal | `components/planning/` | Create PO modal | 3.1 |
| POEditDrawer | `components/planning/` | Edit PO drawer | 3.1 |
| POLinesTable | `components/planning/` | PO lines table | 3.2 |
| POLineFormModal | `components/planning/` | Add/Edit line modal | 3.2 |
| POApprovalModal | `components/planning/` | Approve/Reject modal | 3.4 |
| POStatusBadge | `components/planning/` | Status badge | 3.5 |
| POStatusesSettings | `components/settings/` | Statuses config | 3.5 |

---

## Services

| Service | Location | Description |
|---------|----------|-------------|
| purchase-order-service.ts | `lib/services/` | PO CRUD operations |
| po-line-service.ts | `lib/services/` | PO line operations |
| po-approval-service.ts | `lib/services/` | Approval workflow |
| po-number-generator.ts | `lib/utils/` | PO number generation |
| bulk-po-parser.ts | `lib/services/` | Excel/CSV parsing |

---

## Validation Schemas

```typescript
// lib/validation/planning-schemas.ts

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier'),
  warehouse_id: z.string().uuid('Invalid warehouse'),
  expected_delivery_date: z.string().refine(d => new Date(d) >= new Date(), {
    message: 'Expected delivery date cannot be in the past'
  }),
  payment_terms: z.string().optional(),
  shipping_method: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export const poLineSchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  quantity: z.number().positive('Quantity must be > 0'),
  unit_price: z.number().min(0, 'Unit price must be >= 0'),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  expected_delivery_date: z.string().optional(),
})
```

---

## Key Business Rules

1. **PO Number Format:** `PO-YYYY-NNNN` (e.g., PO-2025-0001), resets each year
2. **Currency:** Inherited from supplier, locked after creation
3. **Tax Rate:** From supplier.tax_code_id → tax_codes.rate
4. **Line Calculation:** `line_total = qty × price × (1 - discount%/100)`
5. **Approval:** Optional, configurable threshold
6. **Status:** Configurable via planning_settings

---

## Stories Summary

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| 3.1 | PO CRUD | 8 | Ready |
| 3.2 | PO Lines | 8 | Ready |
| 3.3 | Bulk PO | 8 | Deferred (P2) |
| 3.4 | Approval | 5 | Ready |
| 3.5 | Statuses | 5 | Ready |

**Total:** 34 points (26 without 3.3)
