# Database Schema Documentation

## Overview

This document describes the complete database schema for the MonoPilot MES system, including all tables, relationships, constraints, and business rules.

**Last Updated**: 2025-11-04 (auto-generated)
**Version**: Auto-generated from migrations

## Tables

### products

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| part_number | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NOT NULL |
| type | VARCHAR(10) | NOT NULL |
| category | VARCHAR(100) | - |
| subtype | VARCHAR(100) | - |
| uom | VARCHAR(20) | NOT NULL |
| expiry_policy | VARCHAR(50) | - |
| shelf_life_days | INTEGER | - |
| production_lines | TEXT | DEFAULT '{}' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| preferred_supplier_id | INTEGER | REFERENCES suppliers(id) |
| tax_code_id | INTEGER | REFERENCES settings_tax_codes(id) |
| lead_time_days | INTEGER | - |
| moq | NUMERIC(12,4) | - |
| std_price | NUMERIC(12,4) | - |
| requires_routing | BOOLEAN | DEFAULT false |
| default_routing_id | INTEGER | - |
| notes | TEXT | - |
| allergen_ids | INTEGER | - |
| created_by | UUID | REFERENCES users(id) |
| updated_by | UUID | REFERENCES users(id) |
| product_type | product_type | NOT NULL, DEFAULT 'FG' |
| packs_per_box | INTEGER | - |

**Foreign Keys**:

- `preferred_supplier_id` → `suppliers.id`
- `tax_code_id` → `settings_tax_codes.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_products_part_number ON (part_number)
- idx_products_product_group ON (product_group)
- idx_products_product_type ON (product_type)
- idx_products_is_active ON (is_active)
- idx_products_preferred_supplier ON (preferred_supplier_id)
- idx_products_tax_code ON (tax_code_id)
- idx_products_group ON (group)
- idx_products_supplier_id ON (supplier_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(10) NOT NULL, -- RM, PR, FG
  category VARCHAR(100),
  subtype VARCHAR(100),
  uom VARCHAR(20) NOT NULL,
  expiry_policy VARCHAR(50),
  shelf_life_days INTEGER,
  production_lines TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### boms

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| product_id | INTEGER | REFERENCES products(id) |
| version | VARCHAR(50) | NOT NULL |
| status | VARCHAR(20) | DEFAULT 'active' |
| effective_from | TIMESTAMPTZ | - |
| effective_to | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| archived_at | TIMESTAMPTZ | - |
| deleted_at | TIMESTAMPTZ | - |
| requires_routing | BOOLEAN | DEFAULT false |
| default_routing_id | INTEGER | - |
| notes | TEXT | - |
| boxes_per_pallet | INTEGER | - |

**Foreign Keys**:

- `product_id` → `products.id`

**Indexes**:

- idx_boms_product_status ON (product_id, status)
- idx_boms_status ON (status)
- idx_boms_routing ON (default_routing_id)
- boms_single_active_idx ON (product_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS boms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### bom_items

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| bom_id | INTEGER | REFERENCES boms(id) |
| material_id | INTEGER | REFERENCES products(id) |
| uom | VARCHAR(20) | NOT NULL |
| quantity | DECIMAL(12, 4) | NOT NULL |
| production_line_restrictions | TEXT | DEFAULT '{}' |
| sequence | INTEGER | - |
| priority | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| unit_cost_std | NUMERIC(12,4) | - |
| scrap_std_pct | NUMERIC(5,2) | DEFAULT 0 |
| is_optional | BOOLEAN | DEFAULT false |
| is_phantom | BOOLEAN | DEFAULT false |
| consume_whole_lp | BOOLEAN | DEFAULT false |
| production_lines | TEXT | - |
| tax_code_id | INTEGER | REFERENCES settings_tax_codes(id) |
| lead_time_days | INTEGER | - |
| moq | NUMERIC(12,4) | - |
| packages_per_box | NUMERIC(12,4) | NOT NULL, DEFAULT 1 |

**Foreign Keys**:

- `bom_id` → `boms.id`
- `material_id` → `products.id`
- `tax_code_id` → `settings_tax_codes.id`

**Indexes**:

- idx_bom_items_bom ON (bom_id)
- idx_bom_items_material ON (material_id)
- idx_bom_items_tax_code ON (tax_code_id)
- idx_bom_items_lead_time ON (lead_time_days)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  uom VARCHAR(20) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  sequence INTEGER,
  priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### work_orders

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_number | VARCHAR(50) | NOT NULL, UNIQUE |
| product_id | INTEGER | REFERENCES products(id) |
| bom_id | INTEGER | REFERENCES boms(id) |
| quantity | DECIMAL(12, 4) | NOT NULL |
| uom | VARCHAR(20) | NOT NULL |
| priority | INTEGER | DEFAULT 3 |
| status | VARCHAR(20) | NOT NULL |
| scheduled_start | TIMESTAMPTZ | - |
| scheduled_end | TIMESTAMPTZ | - |
| actual_start | TIMESTAMPTZ | - |
| actual_end | TIMESTAMPTZ | - |
| machine_id | INTEGER | - |
| line_number | VARCHAR(50) | - |
| source_demand_type | VARCHAR(50) | - |
| source_demand_id | INTEGER | - |
| created_by | INTEGER | - |
| approved_by | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| actual_boxes | INTEGER | - |
| box_weight_kg | NUMERIC(10,4) | - |
| closed_at | TIMESTAMPTZ | - |
| closed_source | move_source_enum | - |
| actual_output_qty | NUMERIC(10,4) | - |

**Foreign Keys**:

- `product_id` → `products.id`
- `bom_id` → `boms.id`
- `machine_id` → `machines.id`

**Indexes**:

- idx_wo_status_scheduled ON (status, scheduled_start)
- idx_wo_product_status ON (product_id, status)
- idx_wo_bom_id ON (bom_id)
- idx_work_orders_status_date ON (status, scheduled_start)
- idx_work_orders_routing_id ON (routing_id)
- idx_work_orders_kpi_scope ON (kpi_scope)
- idx_work_orders_closed_at ON (closed_at)
- idx_work_orders_actual_start ON (actual_start)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  bom_id INTEGER REFERENCES boms(id),
  quantity DECIMAL(12, 4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(20) NOT NULL, -- draft, planned, released, in_progress, completed, cancelled
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  machine_id INTEGER,
  line_number VARCHAR(50),
  source_demand_type VARCHAR(50),
  source_demand_id INTEGER,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### wo_materials

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_id | INTEGER | REFERENCES work_orders(id) |
| material_id | INTEGER | REFERENCES products(id) |
| qty_per_unit | DECIMAL(12, 4) | NOT NULL |
| total_qty_needed | DECIMAL(12, 4) | NOT NULL |
| uom | VARCHAR(20) | NOT NULL |
| production_line_restrictions | TEXT | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| quantity | NUMERIC(10,4) | NOT NULL |
| sequence | INTEGER | NOT NULL |
| one_to_one | BOOLEAN | NOT NULL, DEFAULT false |
| is_optional | BOOLEAN | NOT NULL, DEFAULT false |
| substitution_group | TEXT | - |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_by | UUID | REFERENCES users(id) |
| updated_by | UUID | REFERENCES users(id) |
| consume_whole_lp | BOOLEAN | DEFAULT false |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `material_id` → `products.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_wo_materials_wo ON (wo_id)
- idx_wo_materials_wo_id ON (wo_id)
- idx_wo_materials_material_id ON (material_id)
- idx_wo_materials_one_to_one ON (one_to_one)
- idx_wo_materials_sequence ON (wo_id, sequence)
- idx_wo_materials_wo_material_unique ON (wo_id, material_id, sequence)
- idx_wo_materials_material ON (material_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  qty_per_unit DECIMAL(12, 4) NOT NULL,
  total_qty_needed DECIMAL(12, 4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### suppliers

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(200) | NOT NULL |
| tax_number | VARCHAR(50) | - |
| default_tax_code_id | INTEGER | - |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| incoterms | VARCHAR(50) | - |
| lead_time_days | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| legal_name | VARCHAR(200) | - |
| vat_number | VARCHAR(50) | - |
| country | VARCHAR(3) | - |
| payment_terms | VARCHAR(100) | - |
| email | VARCHAR(200) | - |
| phone | VARCHAR(50) | - |
| address | JSONB | - |
| notes | TEXT | - |
| is_active | BOOLEAN | DEFAULT true |

**Indexes**:

- idx_suppliers_active ON (is_active)
- idx_suppliers_name ON (name)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tax_number VARCHAR(50),
  default_tax_code_id INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  incoterms VARCHAR(50),
  lead_time_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### purchase_orders

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| po_number | VARCHAR(50) | NOT NULL, UNIQUE |
| supplier_id | INTEGER | REFERENCES suppliers(id) |
| warehouse_id | INTEGER | - |
| status | VARCHAR(20) | NOT NULL |
| request_delivery_date | TIMESTAMPTZ | - |
| expected_delivery_date | TIMESTAMPTZ | - |
| due_date | TIMESTAMPTZ | - |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| exchange_rate | DECIMAL(10, 4) | - |
| buyer_id | INTEGER | - |
| notes | TEXT | - |
| created_by | INTEGER | - |
| approved_by | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`

**Indexes**:

- idx_po_status_date ON (status, expected_delivery_date)
- idx_po_supplier_status ON (supplier_id, status)
- idx_purchase_orders_buyer ON (buyer_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  warehouse_id INTEGER,
  status VARCHAR(20) NOT NULL, -- draft, submitted, confirmed, received, closed, cancelled
  request_delivery_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10, 4),
  buyer_id INTEGER,
  notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### purchase_order_items

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| po_id | INTEGER | REFERENCES purchase_orders(id) |
| product_id | INTEGER | REFERENCES products(id) |
| uom | VARCHAR(20) | NOT NULL |
| quantity | DECIMAL(12, 4) | NOT NULL |
| unit_price_excl_tax | DECIMAL(12, 4) | NOT NULL |
| tax_code_id | INTEGER | - |
| tax_rate | DECIMAL(5, 2) | - |
| tax_amount | DECIMAL(12, 4) | - |
| discount_percent | DECIMAL(5, 2) | - |
| description_cache | TEXT | - |
| confirmed | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `po_id` → `purchase_orders.id`
- `product_id` → `products.id`

**Indexes**:

- idx_po_items_po ON (po_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  unit_price_excl_tax DECIMAL(12, 4) NOT NULL,
  tax_code_id INTEGER,
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(12, 4),
  discount_percent DECIMAL(5, 2),
  description_cache TEXT,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### grns

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| grn_number | VARCHAR(50) | NOT NULL, UNIQUE |
| po_id | INTEGER | REFERENCES purchase_orders(id) |
| status | VARCHAR(20) | NOT NULL |
| received_date | TIMESTAMPTZ | NOT NULL |
| received_by | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| supplier_id | INTEGER | REFERENCES suppliers(id) |
| notes | TEXT | - |

**Foreign Keys**:

- `po_id` → `purchase_orders.id`
- `supplier_id` → `suppliers.id`

**Indexes**:

- idx_grns_po ON (po_id)
- idx_grns_po_id ON (po_id)
- idx_grns_status ON (status)
- idx_grns_supplier ON (supplier_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS grns (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  status VARCHAR(20) NOT NULL, -- draft, posted, cancelled
  received_date TIMESTAMPTZ NOT NULL,
  received_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### grn_items

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| grn_id | INTEGER | REFERENCES grns(id) |
| product_id | INTEGER | REFERENCES products(id) |
| quantity_ordered | DECIMAL(12, 4) | NOT NULL |
| quantity_received | DECIMAL(12, 4) | NOT NULL |
| location_id | INTEGER | - |
| batch | VARCHAR(100) | - |
| mfg_date | TIMESTAMPTZ | - |
| expiry_date | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| quantity_accepted | NUMERIC(12,4) | - |
| unit_price | NUMERIC(12,4) | - |
| batch_number | VARCHAR(100) | - |

**Foreign Keys**:

- `grn_id` → `grns.id`
- `product_id` → `products.id`
- `location_id` → `locations.id`

**Indexes**:

- idx_grn_items_grn ON (grn_id)
- idx_grn_items_product ON (product_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity_ordered DECIMAL(12, 4) NOT NULL,
  quantity_received DECIMAL(12, 4) NOT NULL,
  location_id INTEGER,
  batch VARCHAR(100),
  mfg_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### transfer_orders

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| to_number | VARCHAR(50) | NOT NULL, UNIQUE |
| from_location_id | INTEGER | - |
| to_location_id | INTEGER | - |
| status | VARCHAR(20) | NOT NULL |
| planned_ship_date | TIMESTAMPTZ | - |
| actual_ship_date | TIMESTAMPTZ | - |
| planned_receive_date | TIMESTAMPTZ | - |
| actual_receive_date | TIMESTAMPTZ | - |
| created_by | INTEGER | - |
| received_by | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**:

- idx_to_status_date ON (status, planned_ship_date)
- idx_to_locations ON (from_location_id, to_location_id)
- idx_transfer_orders_warehouses ON (from_warehouse_id, to_warehouse_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS transfer_orders (
  id SERIAL PRIMARY KEY,
  to_number VARCHAR(50) UNIQUE NOT NULL,
  from_location_id INTEGER,
  to_location_id INTEGER,
  status VARCHAR(20) NOT NULL, -- draft, submitted, in_transit, received, cancelled
  planned_ship_date TIMESTAMPTZ,
  actual_ship_date TIMESTAMPTZ,
  planned_receive_date TIMESTAMPTZ,
  actual_receive_date TIMESTAMPTZ,
  created_by INTEGER,
  received_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### transfer_order_items

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| to_id | INTEGER | REFERENCES transfer_orders(id) |
| product_id | INTEGER | REFERENCES products(id) |
| uom | VARCHAR(20) | NOT NULL |
| quantity_planned | DECIMAL(12, 4) | NOT NULL |
| quantity_actual | DECIMAL(12, 4) | - |
| lp_id | INTEGER | - |
| batch | VARCHAR(100) | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `to_id` → `transfer_orders.id`
- `product_id` → `products.id`

**Indexes**:

- idx_to_items_to ON (to_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS transfer_order_items (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES transfer_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity_planned DECIMAL(12, 4) NOT NULL,
  quantity_actual DECIMAL(12, 4),
  lp_id INTEGER,
  batch VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### audit_events

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | VARCHAR(50) | NOT NULL |
| event_type | VARCHAR(50) | NOT NULL |
| old_value | JSONB | - |
| new_value | JSONB | - |
| user_id | INTEGER | - |
| reason | TEXT | - |
| timestamp | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**:

- idx_audit_entity ON (entity_type, entity_id)
- idx_audit_timestamp ON (timestamp)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS audit_events (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id INTEGER,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### asns

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| asn_number | VARCHAR(50) | NOT NULL, UNIQUE |
| supplier_id | INTEGER | REFERENCES suppliers(id) |
| po_id | INTEGER | REFERENCES purchase_orders(id) |
| status | VARCHAR(20) | NOT NULL |
| expected_arrival | TIMESTAMPTZ | NOT NULL |
| attachments | JSONB | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `po_id` → `purchase_orders.id`

**Indexes**:

- idx_asns_supplier_status ON (supplier_id, status)
- idx_asns_supplier ON (supplier_id)
- idx_asns_po ON (po_id)
- idx_asns_status ON (status)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  po_id INTEGER REFERENCES purchase_orders(id),
  status VARCHAR(20) NOT NULL, -- draft, submitted, validated, posted, cancelled
  expected_arrival TIMESTAMPTZ NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### asn_items

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| asn_id | INTEGER | REFERENCES asns(id) |
| product_id | INTEGER | REFERENCES products(id) |
| uom | VARCHAR(20) | NOT NULL |
| quantity | DECIMAL(12, 4) | NOT NULL |
| batch | VARCHAR(100) | - |
| pack | JSONB | - |
| pallet | JSONB | - |
| notes | TEXT | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `asn_id` → `asns.id`
- `product_id` → `products.id`

**Indexes**:

- idx_asn_items_asn ON (asn_id)
- idx_asn_items_product ON (product_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### warehouses

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| code | VARCHAR(50) | NOT NULL, UNIQUE |
| name | VARCHAR(200) | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**:

- idx_warehouses_active ON (is_active)
- idx_warehouses_code ON (code)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### production_outputs

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_id | INTEGER | NOT NULL, REFERENCES work_orders(id) |
| product_id | INTEGER | NOT NULL, REFERENCES products(id) |
| quantity | NUMERIC(12, 4) | NOT NULL |
| uom | VARCHAR(20) | NOT NULL |
| lp_id | INTEGER | - |
| created_by | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| boxes | INTEGER | - |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_by | UUID | REFERENCES users(id) |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `product_id` → `products.id`
- `lp_id` → `license_plates.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_production_outputs_wo ON (wo_id)
- idx_production_outputs_wo_id ON (wo_id)
- idx_production_outputs_lp_id ON (lp_id)
- idx_production_outputs_product_id ON (product_id)
- idx_production_outputs_created_at ON (created_at)
- idx_production_outputs_product ON (product_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS production_outputs (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(12, 4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### settings_tax_codes

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| code | VARCHAR(20) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| rate | NUMERIC(5,4) | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**:

- idx_tax_codes_code ON (code)
- idx_tax_codes_active ON (is_active)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### product_allergens

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| product_id | INTEGER | NOT NULL, REFERENCES products(id) |
| allergen_id | INTEGER | NOT NULL, REFERENCES allergens(id) |
| contains | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `product_id` → `products.id`
- `allergen_id` → `allergens.id`

**Indexes**:

- idx_product_allergens_product ON (product_id)
- idx_product_allergens_allergen ON (allergen_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id INTEGER NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  contains BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);
```

</details>

---

### supplier_products

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| supplier_id | INTEGER | NOT NULL, REFERENCES suppliers(id) |
| product_id | INTEGER | NOT NULL, REFERENCES products(id) |
| supplier_sku | VARCHAR(100) | - |
| lead_time_days | INTEGER | - |
| moq | NUMERIC(12,4) | - |
| price_excl_tax | NUMERIC(12,4) | - |
| tax_code_id | INTEGER | REFERENCES settings_tax_codes(id) |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `product_id` → `products.id`
- `tax_code_id` → `settings_tax_codes.id`

**Indexes**:

- idx_supplier_products_supplier ON (supplier_id)
- idx_supplier_products_product ON (product_id)
- idx_supplier_products_active ON (is_active)
- idx_supplier_products_tax_code ON (tax_code_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE supplier_products (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(100),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  price_excl_tax NUMERIC(12,4),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);
```

</details>

---

### routings

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(200) | NOT NULL |
| product_id | INTEGER | REFERENCES products(id) |
| is_active | BOOLEAN | DEFAULT true |
| notes | TEXT | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_by | UUID | REFERENCES users(id) |
| updated_by | UUID | REFERENCES users(id) |

**Foreign Keys**:

- `product_id` → `products.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_routings_product ON (product_id)
- idx_routings_active ON (is_active)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE routings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### routing_operations

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| routing_id | INTEGER | NOT NULL, REFERENCES routings(id) |
| sequence_number | INTEGER | NOT NULL |
| operation_name | VARCHAR(200) | NOT NULL |
| code | VARCHAR(50) | - |
| description | TEXT | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| machine_id | INTEGER | REFERENCES machines(id) |
| estimated_duration_minutes | INTEGER | - |
| setup_time_minutes | INTEGER | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |

**Foreign Keys**:

- `routing_id` → `routings.id`
- `machine_id` → `machines.id`

**Indexes**:

- idx_routing_operations_routing ON (routing_id)
- idx_routing_ops_routing ON (routing_id)
- idx_routing_ops_machine ON (machine_id)
- idx_routing_ops_sequence ON (routing_id, sequence_number)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  operation_name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routing_id, sequence_number)
);
```

</details>

---

### wo_operations

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_id | INTEGER | NOT NULL, REFERENCES work_orders(id) |
| routing_operation_id | INTEGER | REFERENCES routing_operations(id) |
| seq_no | INTEGER | NOT NULL |
| status | VARCHAR(20) | DEFAULT 'PENDING' CHECK (status IN ('PENDING' |
| operator_id | UUID | REFERENCES users(id) |
| device_id | INTEGER | REFERENCES machines(id) |
| started_at | TIMESTAMPTZ | - |
| finished_at | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| planned_output_weight | NUMERIC(10,4) | - |
| actual_output_weight | NUMERIC(10,4) | - |
| trim_loss_weight | NUMERIC(10,4) | - |
| marinade_gain_weight | NUMERIC(10,4) | - |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `routing_operation_id` → `routing_operations.id`
- `operator_id` → `users.id`
- `device_id` → `machines.id`

**Indexes**:

- idx_wo_operations_wo ON (wo_id)
- idx_wo_operations_status ON (status)
- idx_wo_operations_wo_id ON (wo_id)
- idx_wo_operations_weights ON (actual_input_weight, actual_output_weight)
- idx_wo_operations_losses ON (cooking_loss_weight, trim_loss_weight)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE wo_operations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  routing_operation_id INTEGER REFERENCES routing_operations(id),
  seq_no INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  operator_id UUID REFERENCES users(id),
  device_id INTEGER REFERENCES machines(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wo_id, seq_no)
);
```

</details>

---

### lp_reservations

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| lp_id | INTEGER | NOT NULL, REFERENCES license_plates(id) |
| wo_id | INTEGER | NOT NULL, REFERENCES work_orders(id) |
| qty | NUMERIC(10,4) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| expires_at | TIMESTAMPTZ | - |
| consumed_at | TIMESTAMPTZ | - |
| cancelled_at | TIMESTAMPTZ | - |
| created_by | UUID | REFERENCES users(id) |
| consumed_by | UUID | REFERENCES users(id) |
| cancelled_by | UUID | REFERENCES users(id) |
| reason | TEXT | - |
| operation_id | INTEGER | REFERENCES wo_operations(id) |
| quantity_reserved | NUMERIC(10,4) | NOT NULL |
| status | TEXT | NOT NULL, DEFAULT 'active' CHECK (status IN ('active' |
| reserved_by | UUID | NOT NULL, REFERENCES users(id) |
| reserved_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| notes | TEXT | - |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `lp_id` → `license_plates.id`
- `wo_id` → `work_orders.id`
- `created_by` → `users.id`
- `consumed_by` → `users.id`
- `cancelled_by` → `users.id`
- `operation_id` → `wo_operations.id`
- `reserved_by` → `users.id`

**Indexes**:

- idx_lp_reservations_lp_id ON (lp_id)
- idx_lp_reservations_wo_id ON (wo_id)
- idx_lp_reservations_status ON (status)
- idx_lp_reservations_active ON (lp_id, status) WHERE status = 'active';
CREATE INDEX idx_lp_reservations_expires ON lp_reservations(expires_at) WHERE expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE lp_reservations IS 'Tracks reserved quantities for work orders to prevent double-booking';
COMMENT ON COLUMN lp_reservations.lp_id IS 'License plate being reserved';
COMMENT ON COLUMN lp_reservations.wo_id IS 'Work order reserving the material';
COMMENT ON COLUMN lp_reservations.qty IS 'Quantity reserved';
COMMENT ON COLUMN lp_reservations.status IS 'Reservation status lifecycle';
COMMENT ON COLUMN lp_reservations.expires_at IS 'Reservation expiration time';
COMMENT ON COLUMN lp_reservations.reason IS 'Reason for reservation or cancellation';

-- Add check constraints
ALTER TABLE lp_reservations 
ADD CONSTRAINT check_qty_positive 
CHECK (qty > 0)
- idx_lp_reservations_expires_at ON (expires_at)
- idx_lp_reservations_active ON (lp_id, status) WHERE status = 'active';

-- Add unique constraint to prevent duplicate active reservations for same LP+WO+Operation
CREATE UNIQUE INDEX idx_lp_reservations_unique_active 
ON lp_reservations(lp_id, wo_id, operation_id) 
WHERE status = 'active';

-- Add comments for documentation
COMMENT ON TABLE lp_reservations IS 'License plate reservations to prevent double-allocation in production';
COMMENT ON COLUMN lp_reservations.quantity_reserved IS 'Quantity reserved from the license plate';
COMMENT ON COLUMN lp_reservations.status IS 'Reservation status: active, consumed, or cancelled';
COMMENT ON COLUMN lp_reservations.expires_at IS 'Optional expiration time for the reservation';

-- Create function to get available quantity for a license plate
CREATE OR REPLACE FUNCTION get_available_quantity(lp_id_param INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    lp_quantity NUMERIC;
    reserved_quantity NUMERIC;
BEGIN
    -- Get total quantity of the license plate
    SELECT quantity INTO lp_quantity
    FROM license_plates
    WHERE id = lp_id_param;
    
    -- If LP not found, return 0
    IF lp_quantity IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get total reserved quantity (active reservations only)
    SELECT COALESCE(SUM(quantity_reserved), 0) INTO reserved_quantity
    FROM lp_reservations
    WHERE lp_id = lp_id_param AND status = 'active';
    
    -- Return available quantity
    RETURN lp_quantity - reserved_quantity;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if reservation is valid (no conflicts)
CREATE OR REPLACE FUNCTION validate_reservation(
    lp_id_param INTEGER,
    quantity_param NUMERIC,
    wo_id_param INTEGER,
    operation_id_param INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    available_qty NUMERIC;
BEGIN
    -- Get available quantity
    available_qty := get_available_quantity(lp_id_param)
- idx_lp_reservations_lp ON (lp_id)
- idx_lp_reservations_wo ON (wo_id)
- idx_lp_reservations_active ON (lp_id, status)
- idx_lp_reservations_expires ON (expires_at)
- idx_lp_reservations_unique_active ON (lp_id, wo_id, operation_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE lp_reservations (
    id SERIAL PRIMARY KEY,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    qty NUMERIC(10,4) NOT NULL,
    status reservation_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    consumed_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_by UUID REFERENCES users(id),
    consumed_by UUID REFERENCES users(id),
    cancelled_by UUID REFERENCES users(id),
    reason TEXT NULL
);
```

</details>

---

### wo_bom_snapshots

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_id | INTEGER | NOT NULL, REFERENCES work_orders(id) |
| bom_id | INTEGER | NOT NULL, REFERENCES boms(id) |
| bom_version | TEXT | NOT NULL |
| snapshot_data | JSONB | NOT NULL |
| one_to_one_flags | JSONB | DEFAULT '{}' |
| standard_yields | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_by | UUID | REFERENCES users(id) |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `bom_id` → `boms.id`
- `created_by` → `users.id`

**Indexes**:

- idx_wo_bom_snapshots_wo_id ON (wo_id)
- idx_wo_bom_snapshots_bom_id ON (bom_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE wo_bom_snapshots (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    bom_id INTEGER NOT NULL REFERENCES boms(id),
    bom_version TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    one_to_one_flags JSONB DEFAULT '{}',
    standard_yields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

</details>

---

### lp_compositions

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| output_lp_id | INTEGER | NOT NULL, REFERENCES license_plates(id) |
| input_lp_id | INTEGER | NOT NULL, REFERENCES license_plates(id) |
| qty | NUMERIC(10,4) | NOT NULL |
| uom | TEXT | NOT NULL |
| op_seq | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_by | UUID | REFERENCES users(id) |
| quantity_consumed | NUMERIC(10,4) | NOT NULL |
| operation_id | INTEGER | REFERENCES wo_operations(id) |

**Foreign Keys**:

- `output_lp_id` → `license_plates.id`
- `input_lp_id` → `license_plates.id`
- `created_by` → `users.id`
- `operation_id` → `wo_operations.id`

**Indexes**:

- idx_lp_compositions_output_lp_id ON (output_lp_id)
- idx_lp_compositions_input_lp_id ON (input_lp_id)
- idx_lp_compositions_op_seq ON (op_seq)
- idx_lp_compositions_created_at ON (created_at)
- idx_lp_compositions_operation_id ON (operation_id)
- idx_lp_compositions_output ON (output_lp_id)
- idx_lp_compositions_input ON (input_lp_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE lp_compositions (
    id SERIAL PRIMARY KEY,
    output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    qty NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    op_seq INTEGER NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

</details>

---

### pallets

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_id | INTEGER | NOT NULL, REFERENCES work_orders(id) |
| line | TEXT | NOT NULL |
| code | TEXT | NOT NULL, UNIQUE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_by | UUID | REFERENCES users(id) |
| updated_by | UUID | REFERENCES users(id) |
| pallet_number | TEXT | NOT NULL, UNIQUE |
| line_id | INTEGER | REFERENCES machines(id) |
| status | TEXT | NOT NULL, DEFAULT 'building' CHECK (status IN ('building' |
| target_boxes | INTEGER | - |
| actual_boxes | INTEGER | - |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`
- `line_id` → `machines.id`

**Indexes**:

- idx_pallets_wo_id ON (wo_id)
- idx_pallets_line ON (line)
- idx_pallets_code ON (code)
- idx_pallets_created_at ON (created_at)
- idx_pallets_line_id ON (line_id)
- idx_pallets_status ON (status)
- idx_pallets_pallet_number ON (pallet_number)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE pallets (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    line TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

</details>

---

### pallet_items

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| pallet_id | INTEGER | NOT NULL, REFERENCES pallets(id) |
| box_lp_id | INTEGER | NOT NULL, REFERENCES license_plates(id) |
| sequence | INTEGER | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_by | UUID | REFERENCES users(id) |
| added_at | TIMESTAMPTZ | DEFAULT NOW() |
| added_by | UUID | REFERENCES users(id) |
| box_count | NUMERIC(12,4) | NOT NULL |
| material_snapshot | JSONB | - |

**Foreign Keys**:

- `pallet_id` → `pallets.id`
- `box_lp_id` → `license_plates.id`
- `created_by` → `users.id`
- `added_by` → `users.id`

**Indexes**:

- idx_pallet_items_pallet_id ON (pallet_id)
- idx_pallet_items_box_lp_id ON (box_lp_id)
- idx_pallet_items_sequence ON (pallet_id, sequence)
- idx_pallet_items_pallet_box_unique ON (pallet_id, box_lp_id)
- idx_pallet_items_unique_sequence ON (pallet_id, sequence)
- idx_pallet_items_unique_box ON (box_lp_id)
- idx_pallet_items_pallet ON (pallet_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE pallet_items (
    id SERIAL PRIMARY KEY,
    pallet_id INTEGER NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    box_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

</details>

---

### work_orders_audit

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_id | INTEGER | NOT NULL, REFERENCES work_orders(id) |
| action | TEXT | NOT NULL |
| details | JSONB | - |
| created_by | UUID | REFERENCES users(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `created_by` → `users.id`

**Indexes**:

- idx_work_orders_audit_wo_id ON (wo_id)
- idx_work_orders_audit_action ON (action)
- idx_work_orders_audit_created_at ON (created_at)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS work_orders_audit (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### qa_override_log

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| lp_id | INTEGER | NOT NULL, REFERENCES license_plates(id) |
| operation_id | INTEGER | REFERENCES wo_operations(id) |
| old_status | TEXT | NOT NULL |
| new_status | TEXT | NOT NULL |
| reason | TEXT | NOT NULL |
| override_by | UUID | NOT NULL, REFERENCES users(id) |
| pin_hash | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| ip_address | TEXT | - |
| user_agent | TEXT | - |

**Foreign Keys**:

- `lp_id` → `license_plates.id`
- `operation_id` → `wo_operations.id`
- `override_by` → `users.id`

**Indexes**:

- idx_qa_override_log_lp_id ON (lp_id)
- idx_qa_override_log_operation_id ON (operation_id)
- idx_qa_override_log_override_by ON (override_by)
- idx_qa_override_log_created_at ON (created_at)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE qa_override_log (
    id SERIAL PRIMARY KEY,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    operation_id INTEGER REFERENCES wo_operations(id),
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT NOT NULL,
    override_by UUID NOT NULL REFERENCES users(id),
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);
```

</details>

---

### po_header

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| number | VARCHAR(50) | NOT NULL, UNIQUE |
| supplier_id | INTEGER | REFERENCES suppliers(id) |
| status | VARCHAR(20) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| exchange_rate | DECIMAL(10,4) | - |
| order_date | TIMESTAMPTZ | NOT NULL |
| requested_delivery_date | TIMESTAMPTZ | - |
| promised_delivery_date | TIMESTAMPTZ | - |
| snapshot_supplier_name | VARCHAR(200) | - |
| snapshot_supplier_vat | VARCHAR(50) | - |
| snapshot_supplier_address | TEXT | - |
| asn_ref | VARCHAR(50) | - |
| net_total | DECIMAL(12,4) | - |
| vat_total | DECIMAL(12,4) | - |
| gross_total | DECIMAL(12,4) | - |
| created_by | UUID | REFERENCES users(id) |
| approved_by | UUID | REFERENCES users(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `created_by` → `users.id`
- `approved_by` → `users.id`

**Indexes**:

- idx_po_header_number ON (number)
- idx_po_header_status ON (status)
- idx_po_header_supplier ON (supplier_id)
- idx_po_header_dates ON (promised_delivery_date)
- idx_po_header_created_by ON (created_by)
- idx_po_payment_due ON (payment_due_date)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,4),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address TEXT,
  asn_ref VARCHAR(50),
  net_total DECIMAL(12,4),
  vat_total DECIMAL(12,4),
  gross_total DECIMAL(12,4),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### po_line

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| po_id | INTEGER | REFERENCES po_header(id) |
| line_no | INTEGER | NOT NULL |
| item_id | INTEGER | REFERENCES products(id) |
| uom | VARCHAR(20) | NOT NULL |
| qty_ordered | DECIMAL(12,4) | NOT NULL |
| qty_received | DECIMAL(12,4) | DEFAULT 0 |
| unit_price | DECIMAL(12,4) | NOT NULL |
| vat_rate | DECIMAL(5,2) | DEFAULT 0 |
| requested_delivery_date | TIMESTAMPTZ | - |
| promised_delivery_date | TIMESTAMPTZ | - |
| default_location_id | INTEGER | REFERENCES locations(id) |
| note | TEXT | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `po_id` → `po_header.id`
- `item_id` → `products.id`
- `default_location_id` → `locations.id`

**Indexes**:

- idx_po_line_po_id ON (po_id)
- idx_po_line_item_id ON (item_id)
- idx_po_line_location ON (default_location_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_ordered DECIMAL(12,4) NOT NULL,
  qty_received DECIMAL(12,4) DEFAULT 0,
  unit_price DECIMAL(12,4) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  default_location_id INTEGER REFERENCES locations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: line_no per po_id
  CONSTRAINT po_line_unique_line UNIQUE (po_id, line_no)
);
```

</details>

---

### po_correction

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| po_id | INTEGER | REFERENCES po_header(id) |
| po_line_id | INTEGER | REFERENCES po_line(id) |
| reason | TEXT | NOT NULL |
| delta_amount | DECIMAL(12,4) | NOT NULL |
| created_by | UUID | REFERENCES users(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `po_id` → `po_header.id`
- `po_line_id` → `po_line.id`
- `created_by` → `users.id`

**Indexes**:

- idx_po_correction_po_id ON (po_id)
- idx_po_correction_po_line_id ON (po_line_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id) ON DELETE CASCADE,
  po_line_id INTEGER REFERENCES po_line(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  delta_amount DECIMAL(12,4) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### to_header

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| number | VARCHAR(50) | NOT NULL, UNIQUE |
| status | VARCHAR(20) | NOT NULL |
| from_wh_id | INTEGER | REFERENCES warehouses(id) |
| to_wh_id | INTEGER | REFERENCES warehouses(id) |
| requested_date | TIMESTAMPTZ | - |
| created_by | UUID | REFERENCES users(id) |
| approved_by | UUID | REFERENCES users(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| actual_ship_date | TIMESTAMPTZ | - |
| planned_receive_date | TIMESTAMPTZ | - |
| actual_receive_date | TIMESTAMPTZ | - |

**Foreign Keys**:

- `from_wh_id` → `warehouses.id`
- `to_wh_id` → `warehouses.id`
- `created_by` → `users.id`
- `approved_by` → `users.id`

**Indexes**:

- idx_to_header_number ON (number)
- idx_to_header_status ON (status)
- idx_to_header_from_wh ON (from_wh_id)
- idx_to_header_to_wh ON (to_wh_id)
- idx_to_header_requested_date ON (requested_date)
- idx_to_header_warehouses ON (from_wh_id, to_wh_id)
- idx_to_header_ship_dates ON (planned_ship_date, actual_ship_date)
- idx_to_header_receive_dates ON (planned_receive_date, actual_receive_date)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS to_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  from_wh_id INTEGER REFERENCES warehouses(id),
  to_wh_id INTEGER REFERENCES warehouses(id),
  requested_date TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### to_line

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| to_id | INTEGER | REFERENCES to_header(id) |
| line_no | INTEGER | NOT NULL |
| item_id | INTEGER | REFERENCES products(id) |
| uom | VARCHAR(20) | NOT NULL |
| qty_planned | DECIMAL(12,4) | NOT NULL |
| qty_moved | DECIMAL(12,4) | DEFAULT 0 |
| from_location_id | INTEGER | REFERENCES locations(id) |
| to_location_id | INTEGER | REFERENCES locations(id) |
| scan_required | BOOLEAN | DEFAULT false |
| approved_line | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| batch | VARCHAR(100) | - |

**Foreign Keys**:

- `to_id` → `to_header.id`
- `item_id` → `products.id`
- `from_location_id` → `locations.id`
- `to_location_id` → `locations.id`

**Indexes**:

- idx_to_line_to_id ON (to_id)
- idx_to_line_item_id ON (item_id)
- idx_to_line_from_location ON (from_location_id)
- idx_to_line_to_location ON (to_location_id)
- idx_to_line_locations ON (from_location_id, to_location_id)
- idx_to_line_lp ON (lp_id)
- idx_to_line_batch ON (batch)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned DECIMAL(12,4) NOT NULL,
  qty_moved DECIMAL(12,4) DEFAULT 0,
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  scan_required BOOLEAN DEFAULT false,
  approved_line BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: line_no per to_id
  CONSTRAINT to_line_unique_line UNIQUE (to_id, line_no)
);
```

</details>

---

### audit_log

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| entity | VARCHAR(50) | NOT NULL |
| entity_id | INTEGER | NOT NULL |
| action | VARCHAR(50) | NOT NULL |
| before | JSONB | - |
| after | JSONB | - |
| actor_id | UUID | REFERENCES users(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `actor_id` → `users.id`

**Indexes**:

- idx_audit_log_entity ON (entity, entity_id)
- idx_audit_log_actor ON (actor_id)
- idx_audit_log_created_at ON (created_at)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### users

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| role | TEXT | NOT NULL |
| status | TEXT | NOT NULL, DEFAULT 'Active' CHECK (status IN ('Active' |
| avatar_url | TEXT | - |
| phone | TEXT | - |
| department | TEXT | - |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |
| last_login | TIMESTAMP | - |
| created_by | UUID | REFERENCES users(id) |
| updated_by | UUID | REFERENCES users(id) |

**Foreign Keys**:

- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_users_email ON (email)
- idx_users_role ON (role)
- idx_users_status ON (status)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Operator', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC', 'Admin')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### locations

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| warehouse_id | INTEGER | REFERENCES warehouses(id) |
| code | VARCHAR(50) | NOT NULL, UNIQUE |
| name | VARCHAR(200) | NOT NULL |
| type | VARCHAR(50) | - |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `warehouse_id` → `warehouses.id`

**Indexes**:

- idx_locations_warehouse ON (warehouse_id)
- idx_locations_code ON (code)
- idx_locations_active ON (is_active)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER REFERENCES warehouses(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### allergens

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| code | VARCHAR(20) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | - |
| icon | VARCHAR(50) | - |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**:

- idx_allergens_code ON (code)
- idx_allergens_active ON (is_active)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE allergens (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### machines

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(200) | NOT NULL |
| code | VARCHAR(50) | NOT NULL, UNIQUE |
| type | VARCHAR(50) | - |
| location_id | INTEGER | REFERENCES locations(id) |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `location_id` → `locations.id`

**Indexes**:

- idx_machines_code ON (code)
- idx_machines_location ON (location_id)
- idx_machines_active ON (is_active)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50),
  location_id INTEGER REFERENCES locations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### license_plates

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| lp_number | VARCHAR(50) | NOT NULL, UNIQUE |
| product_id | INTEGER | REFERENCES products(id) |
| quantity | NUMERIC(12,4) | NOT NULL |
| uom | VARCHAR(20) | NOT NULL |
| location_id | INTEGER | REFERENCES locations(id) |
| status | VARCHAR(20) | DEFAULT 'available' |
| qa_status | VARCHAR(20) | DEFAULT 'pending' |
| stage_suffix | VARCHAR(10) | - |
| batch_number | VARCHAR(100) | - |
| lp_type | VARCHAR(20) | - |
| consumed_by_wo_id | INTEGER | REFERENCES work_orders(id) |
| consumed_at | TIMESTAMPTZ | - |
| parent_lp_id | INTEGER | REFERENCES license_plates(id) |
| parent_lp_number | VARCHAR(50) | - |
| origin_type | VARCHAR(50) | - |
| origin_ref | JSONB | - |
| created_by | VARCHAR(50) | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `product_id` → `products.id`
- `location_id` → `locations.id`
- `consumed_by_wo_id` → `work_orders.id`
- `parent_lp_id` → `license_plates.id`

**Indexes**:

- idx_license_plates_product ON (product_id)
- idx_license_plates_location ON (location_id)
- idx_license_plates_status ON (status)
- idx_license_plates_qa_status ON (qa_status)
- idx_license_plates_parent_lp ON (parent_lp_id)
- idx_license_plates_consumed_by_wo ON (consumed_by_wo_id)
- idx_license_plates_lp_type ON (lp_type)
- idx_license_plates_parent_lp_id ON (parent_lp_id)
- idx_license_plates_parent_lp_number ON (parent_lp_number)
- idx_license_plates_stage_suffix ON (stage_suffix)
- idx_license_plates_origin_type ON (origin_type)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE license_plates (
  id SERIAL PRIMARY KEY,
  lp_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  location_id INTEGER REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'available',
  qa_status VARCHAR(20) DEFAULT 'pending',
  stage_suffix VARCHAR(10) CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  batch_number VARCHAR(100),
  
  -- NEW FIELD: LP Type for filtering (PR, FG, PALLET)
  lp_type VARCHAR(20) CHECK (lp_type IN ('PR', 'FG', 'PALLET')),
  
  -- Traceability
  consumed_by_wo_id INTEGER REFERENCES work_orders(id),
  consumed_at TIMESTAMPTZ,
  parent_lp_id INTEGER REFERENCES license_plates(id),
  parent_lp_number VARCHAR(50),
  origin_type VARCHAR(50),
  origin_ref JSONB,
  
  -- Metadata
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### lp_genealogy

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| child_lp_id | INTEGER | NOT NULL, REFERENCES license_plates(id) |
| parent_lp_id | INTEGER | REFERENCES license_plates(id) |
| quantity_consumed | NUMERIC(12,4) | NOT NULL |
| uom | VARCHAR(20) | NOT NULL |
| wo_id | INTEGER | REFERENCES work_orders(id) |
| operation_sequence | INTEGER | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `child_lp_id` → `license_plates.id`
- `parent_lp_id` → `license_plates.id`
- `wo_id` → `work_orders.id`

**Indexes**:

- idx_lp_genealogy_child ON (child_lp_id)
- idx_lp_genealogy_parent ON (parent_lp_id)
- idx_lp_genealogy_wo ON (wo_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE lp_genealogy (
  id SERIAL PRIMARY KEY,
  child_lp_id INTEGER NOT NULL REFERENCES license_plates(id),
  parent_lp_id INTEGER REFERENCES license_plates(id),
  quantity_consumed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  wo_id INTEGER REFERENCES work_orders(id),
  operation_sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### stock_moves

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| move_number | VARCHAR(50) | NOT NULL, UNIQUE |
| product_id | INTEGER | REFERENCES products(id) |
| from_location_id | INTEGER | REFERENCES locations(id) |
| to_location_id | INTEGER | REFERENCES locations(id) |
| quantity | NUMERIC(12,4) | NOT NULL |
| uom | VARCHAR(20) | NOT NULL |
| move_type | VARCHAR(20) | NOT NULL |
| move_source | VARCHAR(20) | DEFAULT 'portal' |
| move_status | VARCHAR(20) | DEFAULT 'completed' |
| reference_type | VARCHAR(50) | - |
| reference_id | INTEGER | - |
| created_by | VARCHAR(50) | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Foreign Keys**:

- `product_id` → `products.id`
- `from_location_id` → `locations.id`
- `to_location_id` → `locations.id`

**Indexes**:

- idx_stock_moves_product ON (product_id)
- idx_stock_moves_locations ON (from_location_id, to_location_id)
- idx_stock_moves_reference ON (reference_type, reference_id)
- idx_stock_moves_wo_id ON (wo_id)
- idx_stock_moves_lp_id ON (lp_id)
- idx_stock_moves_move_type_date ON (move_type, move_date)
- idx_stock_moves_status ON (status)
- idx_stock_moves_source ON (source)
- idx_stock_moves_move_type ON (move_type)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE stock_moves (
  id SERIAL PRIMARY KEY,
  move_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  move_type VARCHAR(20) NOT NULL,
  move_source VARCHAR(20) DEFAULT 'portal',
  move_status VARCHAR(20) DEFAULT 'completed',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### bom_history

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| bom_id | INTEGER | NOT NULL, REFERENCES boms(id) |
| version | VARCHAR(50) | NOT NULL |
| changed_by | UUID | REFERENCES users(id) |
| changed_at | TIMESTAMPTZ | DEFAULT NOW() |
| status_from | VARCHAR(20) | - |
| status_to | VARCHAR(20) | - |
| changes | JSONB | NOT NULL |
| description | TEXT | - |

**Foreign Keys**:

- `bom_id` → `boms.id`
- `changed_by` → `users.id`

**Indexes**:

- idx_bom_history_bom_id ON (bom_id)
- idx_bom_history_changed_at ON (changed_at DESC)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_from VARCHAR(20),
  status_to VARCHAR(20),
  changes JSONB NOT NULL,
  description TEXT,
  CONSTRAINT fk_bom_history_bom FOREIGN KEY (bom_id) REFERENCES boms(id)
);
```

</details>

---

