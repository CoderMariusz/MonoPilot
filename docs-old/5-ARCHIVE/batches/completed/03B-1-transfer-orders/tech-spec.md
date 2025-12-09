# Batch 03B-1: Transfer Orders - Technical Specification

**Batch ID:** 03B-1
**Epic:** 3 - Planning Operations
**Stories:** 3.6-3.9
**Prerequisites:** Epic 1 (Organizations, Warehouses), Epic 2 Batch 2A (Products)
**Token Budget:** ~30-40k tokens

---

## Overview

This batch implements the complete Transfer Order (TO) module including:
- TO CRUD operations with auto-generated TO numbers
- TO Line management with UoM inheritance
- Partial shipment tracking
- Optional LP (License Plate) selection for inventory reservation

---

## Database Schema

### Table: transfer_orders

```sql
CREATE TABLE transfer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  to_number VARCHAR(20) NOT NULL,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  planned_ship_date DATE NOT NULL,
  planned_receive_date DATE NOT NULL,
  actual_ship_date DATE,
  actual_receive_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_transfer_orders_to_number ON transfer_orders(org_id, to_number);
ALTER TABLE transfer_orders ADD CONSTRAINT check_different_warehouses
  CHECK (from_warehouse_id != to_warehouse_id);
ALTER TABLE transfer_orders ADD CONSTRAINT check_receive_after_ship
  CHECK (planned_receive_date >= planned_ship_date);

-- Indexes
CREATE INDEX idx_transfer_orders_from_warehouse ON transfer_orders(from_warehouse_id);
CREATE INDEX idx_transfer_orders_to_warehouse ON transfer_orders(to_warehouse_id);
CREATE INDEX idx_transfer_orders_status ON transfer_orders(org_id, status);
CREATE INDEX idx_transfer_orders_ship_date ON transfer_orders(org_id, planned_ship_date);
```

### Table: to_lines

```sql
CREATE TABLE to_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  shipped_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0 AND shipped_qty <= quantity),
  received_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0 AND received_qty <= shipped_qty),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_to_lines_transfer_order ON to_lines(transfer_order_id);
CREATE INDEX idx_to_lines_product ON to_lines(product_id);
```

### Table: to_line_lps (Story 3.9 - Optional LP Selection)

```sql
CREATE TABLE to_line_lps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_line_id UUID NOT NULL REFERENCES to_lines(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,
  reserved_qty NUMERIC(10, 2) NOT NULL CHECK (reserved_qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_to_line_lps_unique ON to_line_lps(to_line_id, lp_id);
CREATE INDEX idx_to_line_lps_to_line ON to_line_lps(to_line_id);
CREATE INDEX idx_to_line_lps_lp ON to_line_lps(lp_id);
```

---

## RLS Policies

```sql
-- transfer_orders
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY transfer_orders_org_isolation ON transfer_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- to_lines (inherit from transfer_orders)
ALTER TABLE to_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY to_lines_org_isolation ON to_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE transfer_orders.id = to_lines.transfer_order_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- to_line_lps (inherit from to_lines -> transfer_orders)
ALTER TABLE to_line_lps ENABLE ROW LEVEL SECURITY;

CREATE POLICY to_line_lps_org_isolation ON to_line_lps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM to_lines
      JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
      WHERE to_lines.id = to_line_lps.to_line_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );
```

---

## Status Workflow

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| draft | TO created, editing allowed | Edit, Delete, Add Lines, Plan |
| planned | Locked for shipping | Ship, Cancel |
| partially_shipped | Some lines shipped | Ship more, Receive |
| shipped | All lines shipped | Receive |
| partially_received | Some lines received | Receive more |
| received | All lines received | None (final) |
| cancelled | TO cancelled | None (final) |

**Status Badge Colors:**
- draft: Gray
- planned: Blue
- partially_shipped: Yellow
- shipped: Green
- partially_received: Orange
- received: Green
- cancelled: Red

---

## API Endpoints

| Method | Endpoint | Description | Story |
|--------|----------|-------------|-------|
| GET | `/api/planning/transfer-orders` | List TOs with filters | 3.6 |
| POST | `/api/planning/transfer-orders` | Create TO | 3.6 |
| GET | `/api/planning/transfer-orders/:id` | Get TO detail | 3.6 |
| PUT | `/api/planning/transfer-orders/:id` | Update TO | 3.6 |
| DELETE | `/api/planning/transfer-orders/:id` | Delete TO (draft only) | 3.6 |
| PUT | `/api/planning/transfer-orders/:id/status` | Change TO status | 3.6 |
| GET | `/api/planning/transfer-orders/:id/lines` | List TO lines | 3.7 |
| POST | `/api/planning/transfer-orders/:id/lines` | Add TO line | 3.7 |
| PUT | `/api/planning/transfer-orders/:id/lines/:lineId` | Update TO line | 3.7 |
| DELETE | `/api/planning/transfer-orders/:id/lines/:lineId` | Delete TO line | 3.7 |
| POST | `/api/planning/transfer-orders/:id/ship` | Record shipment | 3.8 |
| GET | `/api/planning/transfer-orders/:id/lines/:lineId/lps` | Get selected LPs | 3.9 |
| PUT | `/api/planning/transfer-orders/:id/lines/:lineId/lps` | Select LPs | 3.9 |

---

## Frontend Routes

| Route | Component | Description | Story |
|-------|-----------|-------------|-------|
| `/planning/transfer-orders` | TransferOrdersPage | TO list with filters | 3.6 |
| `/planning/transfer-orders/:id` | TransferOrderDetailPage | TO detail with lines | 3.6 |

---

## Components

| Component | Location | Description | Story |
|-----------|----------|-------------|-------|
| TransferOrdersTable | `components/planning/` | TO list table | 3.6 |
| TOCreateModal | `components/planning/` | Create TO modal | 3.6 |
| TOEditDrawer | `components/planning/` | Edit TO drawer | 3.6 |
| TOLinesTable | `components/planning/` | TO lines table | 3.7 |
| TOLineFormModal | `components/planning/` | Add/Edit line modal | 3.7 |
| ShipTOModal | `components/planning/` | Partial shipment modal | 3.8 |
| LPSelectionModal | `components/planning/` | LP selection modal | 3.9 |

---

## Validation Schemas

```typescript
// lib/validation/transfer-order-schemas.ts

export const CreateTransferOrderSchema = z.object({
  from_warehouse_id: z.string().uuid('Invalid warehouse ID'),
  to_warehouse_id: z.string().uuid('Invalid warehouse ID'),
  planned_ship_date: z.string().datetime('Invalid date format'),
  planned_receive_date: z.string().datetime('Invalid date format'),
  notes: z.string().max(500).optional()
}).refine(data => data.from_warehouse_id !== data.to_warehouse_id, {
  message: 'Source and destination warehouse must be different',
  path: ['to_warehouse_id']
}).refine(data => new Date(data.planned_receive_date) >= new Date(data.planned_ship_date), {
  message: 'Receive date must be on or after ship date',
  path: ['planned_receive_date']
})

// lib/validation/to-line-schemas.ts

export const CreateToLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be > 0').max(999999),
  notes: z.string().max(200).optional()
})

// lib/validation/ship-to-schemas.ts

export const ShipToSchema = z.object({
  actual_ship_date: z.string().datetime('Invalid date format'),
  lines: z.array(z.object({
    line_id: z.string().uuid('Invalid line ID'),
    shipped_qty: z.number().min(0)
  })).min(1)
}).refine(data => data.lines.some(line => line.shipped_qty > 0), {
  message: 'At least one line must have shipped quantity > 0'
})
```

---

## Key Business Rules

1. **TO Number Format:** `TO-YYYY-NNN` (e.g., TO-2025-001), resets each year
2. **Different Warehouses:** from_warehouse_id ≠ to_warehouse_id
3. **Date Validation:** receive_date >= ship_date
4. **UoM Inheritance:** Line UoM inherited from product
5. **Partial Shipments:** shipped_qty cumulative, auto-calculates status
6. **LP Selection:** Optional feature, controlled by planning_settings

---

## Stories Summary

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| 3.6 | TO CRUD | 5 | Ready |
| 3.7 | TO Lines | 3 | Ready |
| 3.8 | Partial Shipments | 5 | Ready |
| 3.9 | LP Selection | 3 | Ready (Optional) |

**Total:** 16 points
