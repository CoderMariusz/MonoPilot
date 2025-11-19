# Epic 0: Missing Database Columns

**Generated**: 2025-11-18
**Purpose**: List of columns that APIs expect but database doesn't have

---

## Summary

The APIs were written expecting a richer schema than what currently exists in the database. This document lists all missing columns that need to be added via migration.

---

## Tables with Missing Columns

### 1. po_header (Purchase Order Header)

**Database has**: `po_number`, `expected_date`, `currency`, `order_date`, `warehouse_id`, `supplier_id`, `status`, `notes`, `org_id`, `created_at`, `created_by`, `updated_at`, `updated_by`

**API expects but missing**:
- `promised_delivery_date` (timestamp)
- `requested_delivery_date` (timestamp)
- `payment_due_date` (timestamp)
- `gross_total` (numeric)
- `net_total` (numeric)
- `vat_total` (numeric)
- `exchange_rate` (numeric, default 1.0)

### 2. po_line (Purchase Order Line)

**Database has**: `po_id`, `line_number`, `product_id`, `quantity`, `uom`, `unit_price`, `received_qty`, `tax_code_id`, `notes`, `created_at`, `updated_at`

**API expects but missing**:
- `default_location_id` (integer, FK to locations)
- `vat_rate` (numeric)

### 3. to_header (Transfer Order Header)

**Database has**: `to_number`, `from_warehouse_id`, `to_warehouse_id`, `scheduled_date`, `status`, `notes`, `org_id`, `created_at`, `created_by`, `updated_at`, `updated_by`

**API expects but missing**:
- `requested_date` (timestamp)
- `planned_ship_date` (timestamp)
- `actual_ship_date` (timestamp)
- `planned_receive_date` (timestamp)
- `actual_receive_date` (timestamp)
- `approved_by` (uuid, FK to auth.users)

### 4. to_line (Transfer Order Line)

**Database has**: `to_id`, `line_number`, `product_id`, `quantity`, `uom`, `transferred_qty`, `notes`, `created_at`, `updated_at`

**API expects but missing**:
- `lp_id` (integer, FK to license_plates)
- `batch` (text)

### 5. bom_history

**Database has**: `bom_id`, `change_type`, `changed_by`, `created_at`, `old_values`, `new_values`

**API expects but missing**:
- `version` (text) - can be derived from old_values/new_values
- `status_from` (text) - can be derived from old_values
- `status_to` (text) - can be derived from new_values
- `description` (text)
- `changed_at` (timestamp) - use created_at instead

**Note**: These can be stored in old_values/new_values JSON, no schema change needed.

### 6. work_orders

**Database has**: `bom_id`, `completed_qty`, `created_at`, `created_by`, `end_date`, `id`, `notes`, `org_id`, `planned_qty`, `priority`, `product_id`, `production_line_id`, `routing_id`, `scheduled_date`, `start_date`, `status`, `uom`, `updated_at`

**API expects but missing**:
- `wo_number` (text, unique) - **CRITICAL**
- `scheduled_start` (timestamp) - can use start_date
- `scheduled_end` (timestamp) - can use end_date
- `actual_start` (timestamp)
- `actual_end` (timestamp)
- `actual_output_qty` (numeric)
- `machine_id` (integer, FK to machines)
- `line_number` (text) - duplicate of production_line_id?
- `kpi_scope` (text)
- `planned_boxes` (integer)
- `actual_boxes` (integer)
- `box_weight_kg` (numeric)
- `current_operation_seq` (integer)
- `closed_by` (uuid)
- `closed_at` (timestamp)
- `closed_source` (text)
- `source_demand_type` (text)
- `source_demand_id` (integer)
- `approved_by` (uuid)

### 7. routing_operations

**Database has**: `routing_id`, `sequence`, `operation_name`, `machine_id`, `run_time_mins`, `setup_time_mins`, `work_center`, `notes`, `created_at`, `updated_at`

**API originally expected but removed**:
- `code` (text) - removed from API
- `requirements` (text[]) - removed from API
- `expected_yield_pct` (numeric) - removed from API

**Note**: API was fixed to match database. No changes needed.

---

## Priority Classification

### P0 - Critical (Required for basic functionality)

1. **work_orders.wo_number** - Required for WO identification
2. **po_line.default_location_id** - Required for receiving
3. **to_line.lp_id** - Required for LP tracking in transfers

### P1 - Important (Required for full workflow)

1. **work_orders**: actual_start, actual_end, actual_output_qty
2. **to_header**: actual_ship_date, actual_receive_date
3. **po_header**: promised_delivery_date, gross_total

### P2 - Nice to Have (Enhanced features)

1. **work_orders**: kpi_scope, planned_boxes, actual_boxes
2. **po_header**: exchange_rate, net_total, vat_total
3. **bom_history**: description (can use new_values instead)

---

## Recommended Migration Strategy

### Phase 1: Critical Columns (Immediate)

```sql
-- work_orders
ALTER TABLE work_orders ADD COLUMN wo_number text;
UPDATE work_orders SET wo_number = 'WO-' || id WHERE wo_number IS NULL;
ALTER TABLE work_orders ALTER COLUMN wo_number SET NOT NULL;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_wo_number_unique UNIQUE (org_id, wo_number);

-- po_line
ALTER TABLE po_line ADD COLUMN default_location_id integer REFERENCES locations(id);

-- to_line
ALTER TABLE to_line ADD COLUMN lp_id integer REFERENCES license_plates(id);
ALTER TABLE to_line ADD COLUMN batch text;
```

### Phase 2: Workflow Columns

```sql
-- work_orders
ALTER TABLE work_orders ADD COLUMN actual_start timestamp;
ALTER TABLE work_orders ADD COLUMN actual_end timestamp;
ALTER TABLE work_orders ADD COLUMN actual_output_qty numeric;
ALTER TABLE work_orders ADD COLUMN machine_id integer REFERENCES machines(id);

-- to_header
ALTER TABLE to_header ADD COLUMN actual_ship_date timestamp;
ALTER TABLE to_header ADD COLUMN actual_receive_date timestamp;
ALTER TABLE to_header ADD COLUMN planned_ship_date timestamp;
ALTER TABLE to_header ADD COLUMN planned_receive_date timestamp;

-- po_header
ALTER TABLE po_header ADD COLUMN promised_delivery_date timestamp;
ALTER TABLE po_header ADD COLUMN payment_due_date timestamp;
ALTER TABLE po_header ADD COLUMN gross_total numeric;
ALTER TABLE po_header ADD COLUMN net_total numeric;
ALTER TABLE po_header ADD COLUMN vat_total numeric;
```

### Phase 3: Enhanced Features

```sql
-- work_orders (KPI tracking)
ALTER TABLE work_orders ADD COLUMN kpi_scope text;
ALTER TABLE work_orders ADD COLUMN planned_boxes integer;
ALTER TABLE work_orders ADD COLUMN actual_boxes integer;
ALTER TABLE work_orders ADD COLUMN box_weight_kg numeric;
ALTER TABLE work_orders ADD COLUMN current_operation_seq integer;
ALTER TABLE work_orders ADD COLUMN closed_by uuid REFERENCES auth.users(id);
ALTER TABLE work_orders ADD COLUMN closed_at timestamp;
ALTER TABLE work_orders ADD COLUMN closed_source text;
ALTER TABLE work_orders ADD COLUMN source_demand_type text;
ALTER TABLE work_orders ADD COLUMN source_demand_id integer;
ALTER TABLE work_orders ADD COLUMN approved_by uuid REFERENCES auth.users(id);

-- po_header
ALTER TABLE po_header ADD COLUMN exchange_rate numeric DEFAULT 1.0;

-- po_line
ALTER TABLE po_line ADD COLUMN vat_rate numeric;
```

---

## Alternative: Fix APIs to Match Database

Instead of adding columns, we can update the APIs to work with what exists:

1. **work_orders**: Use `start_date`/`end_date` instead of scheduled_start/scheduled_end
2. **work_orders**: Generate wo_number dynamically from id
3. **po_header**: Use `expected_date` for all date fields
4. **to_header**: Use `scheduled_date` for all date tracking

This approach is faster but reduces functionality.

---

## Recommendation

**Recommended approach**: Phase 1 + Phase 2 migrations

- Adds critical missing columns for core functionality
- Enables full PO, TO, and WO workflows
- Can be done in one migration

Phase 3 can be added later when KPI features are needed.
