# Database Schema Documentation

## Overview

This document describes the complete database schema for the MonoPilot MES system, including all tables, relationships, constraints, and business rules.

**Last Updated**: 2025-11-14 (auto-generated)
**Version**: Auto-generated from migrations

## Tables

### users

**Columns**:

| Column     | Type        | Constraints                                           |
| ---------- | ----------- | ----------------------------------------------------- |
| id         | UUID        | PRIMARY KEY                                           |
| name       | TEXT        | NOT NULL                                              |
| email      | TEXT        | NOT NULL                                              |
| role       | TEXT        | NOT NULL                                              |
| status     | TEXT        | NOT NULL, DEFAULT 'Active' CHECK (status IN ('Active' |
| avatar_url | TEXT        | -                                                     |
| phone      | TEXT        | -                                                     |
| department | TEXT        | -                                                     |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                                         |
| updated_at | TIMESTAMPTZ | DEFAULT NOW()                                         |
| last_login | TIMESTAMPTZ | -                                                     |
| created_by | UUID        | REFERENCES users(id)                                  |
| updated_by | UUID        | REFERENCES users(id)                                  |

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### suppliers

**Columns**:

| Column              | Type         | Constraints   |
| ------------------- | ------------ | ------------- |
| id                  | SERIAL       | PRIMARY KEY   |
| name                | VARCHAR(200) | NOT NULL      |
| legal_name          | VARCHAR(200) | -             |
| vat_number          | VARCHAR(50)  | -             |
| tax_number          | VARCHAR(50)  | -             |
| country             | VARCHAR(3)   | -             |
| currency            | VARCHAR(3)   | DEFAULT 'USD' |
| payment_terms       | VARCHAR(100) | -             |
| incoterms           | VARCHAR(50)  | -             |
| email               | VARCHAR(200) | -             |
| phone               | VARCHAR(50)  | -             |
| address             | JSONB        | -             |
| default_tax_code_id | INTEGER      | -             |
| lead_time_days      | INTEGER      | -             |
| notes               | TEXT         | -             |
| is_active           | BOOLEAN      | DEFAULT true  |
| created_at          | TIMESTAMPTZ  | DEFAULT NOW() |
| updated_at          | TIMESTAMPTZ  | DEFAULT NOW() |

**Indexes**:

- idx_suppliers_active ON (is_active)
- idx_suppliers_name ON (name)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  vat_number VARCHAR(50),
  tax_number VARCHAR(50),
  country VARCHAR(3),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(100),
  incoterms VARCHAR(50),
  email VARCHAR(200),
  phone VARCHAR(50),
  address JSONB,
  default_tax_code_id INTEGER,
  lead_time_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### warehouses

**Columns**:

| Column     | Type         | Constraints      |
| ---------- | ------------ | ---------------- |
| id         | SERIAL       | PRIMARY KEY      |
| code       | VARCHAR(50)  | NOT NULL, UNIQUE |
| name       | VARCHAR(200) | NOT NULL         |
| is_active  | BOOLEAN      | DEFAULT true     |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()    |
| updated_at | TIMESTAMPTZ  | DEFAULT NOW()    |

**Indexes**:

- idx_warehouses_active ON (is_active)
- idx_warehouses_code ON (code)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE warehouses (
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

### locations

**Columns**:

| Column       | Type         | Constraints               |
| ------------ | ------------ | ------------------------- |
| id           | SERIAL       | PRIMARY KEY               |
| warehouse_id | INTEGER      | REFERENCES warehouses(id) |
| code         | VARCHAR(50)  | NOT NULL, UNIQUE          |
| name         | VARCHAR(200) | NOT NULL                  |
| type         | VARCHAR(50)  | -                         |
| is_active    | BOOLEAN      | DEFAULT true              |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()             |
| updated_at   | TIMESTAMPTZ  | DEFAULT NOW()             |

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

### settings_tax_codes

**Columns**:

| Column     | Type         | Constraints      |
| ---------- | ------------ | ---------------- |
| id         | SERIAL       | PRIMARY KEY      |
| code       | VARCHAR(20)  | NOT NULL, UNIQUE |
| name       | VARCHAR(100) | NOT NULL         |
| rate       | NUMERIC(5,4) | NOT NULL         |
| is_active  | BOOLEAN      | DEFAULT true     |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()    |
| updated_at | TIMESTAMPTZ  | DEFAULT NOW()    |

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

### settings_warehouse

**Columns**:

| Column                        | Type        | Constraints                                 |
| ----------------------------- | ----------- | ------------------------------------------- |
| id                            | SERIAL      | PRIMARY KEY                                 |
| warehouse_id                  | INTEGER     | NOT NULL, UNIQUE, REFERENCES warehouses(id) |
| default_receiving_location_id | INTEGER     | REFERENCES locations(id)                    |
| default_shipping_location_id  | INTEGER     | REFERENCES locations(id)                    |
| allow_negative_stock          | BOOLEAN     | DEFAULT false                               |
| auto_assign_location          | BOOLEAN     | DEFAULT true                                |
| created_at                    | TIMESTAMPTZ | DEFAULT NOW()                               |
| updated_at                    | TIMESTAMPTZ | DEFAULT NOW()                               |

**Foreign Keys**:

- `warehouse_id` → `warehouses.id`
- `default_receiving_location_id` → `locations.id`
- `default_shipping_location_id` → `locations.id`

**Indexes**:

- idx_settings_warehouse_warehouse ON (warehouse_id)
- idx_settings_warehouse_receiving_loc ON (default_receiving_location_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE settings_warehouse (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER UNIQUE NOT NULL REFERENCES warehouses(id),
  default_receiving_location_id INTEGER REFERENCES locations(id),
  default_shipping_location_id INTEGER REFERENCES locations(id),
  allow_negative_stock BOOLEAN DEFAULT false,
  auto_assign_location BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### allergens

**Columns**:

| Column      | Type         | Constraints      |
| ----------- | ------------ | ---------------- |
| id          | SERIAL       | PRIMARY KEY      |
| code        | VARCHAR(20)  | NOT NULL, UNIQUE |
| name        | VARCHAR(100) | NOT NULL         |
| description | TEXT         | -                |
| icon        | VARCHAR(50)  | -                |
| is_active   | BOOLEAN      | DEFAULT true     |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()    |
| updated_at  | TIMESTAMPTZ  | DEFAULT NOW()    |

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

| Column      | Type         | Constraints              |
| ----------- | ------------ | ------------------------ |
| id          | SERIAL       | PRIMARY KEY              |
| name        | VARCHAR(200) | NOT NULL                 |
| code        | VARCHAR(50)  | NOT NULL, UNIQUE         |
| type        | VARCHAR(50)  | -                        |
| location_id | INTEGER      | REFERENCES locations(id) |
| is_active   | BOOLEAN      | DEFAULT true             |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()            |
| updated_at  | TIMESTAMPTZ  | DEFAULT NOW()            |

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

### production_lines

**Columns**:

| Column       | Type         | Constraints                                 |
| ------------ | ------------ | ------------------------------------------- |
| id           | SERIAL       | PRIMARY KEY                                 |
| code         | VARCHAR(50)  | NOT NULL, UNIQUE                            |
| name         | VARCHAR(200) | NOT NULL                                    |
| status       | VARCHAR(20)  | DEFAULT 'active' CHECK (status IN ('active' |
| warehouse_id | INTEGER      | REFERENCES warehouses(id)                   |
| is_active    | BOOLEAN      | DEFAULT true                                |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()                               |
| updated_at   | TIMESTAMPTZ  | DEFAULT NOW()                               |
| created_by   | UUID         | REFERENCES users(id)                        |
| updated_by   | UUID         | REFERENCES users(id)                        |

**Foreign Keys**:

- `warehouse_id` → `warehouses.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_production_lines_code ON (code)
- idx_production_lines_status ON (status)
- idx_production_lines_warehouse ON (warehouse_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE production_lines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### products

**Columns**:

| Column             | Type          | Constraints                       |
| ------------------ | ------------- | --------------------------------- |
| id                 | SERIAL        | PRIMARY KEY                       |
| part_number        | VARCHAR(100)  | NOT NULL, UNIQUE                  |
| description        | TEXT          | NOT NULL                          |
| type               | VARCHAR(10)   | NOT NULL                          |
| subtype            | VARCHAR(100)  | -                                 |
| uom                | VARCHAR(20)   | NOT NULL                          |
| expiry_policy      | VARCHAR(50)   | -                                 |
| shelf_life_days    | INTEGER       | -                                 |
| production_lines   | TEXT          | -                                 |
| is_active          | BOOLEAN       | DEFAULT true                      |
| supplier_id        | INTEGER       | REFERENCES suppliers(id)          |
| tax_code_id        | INTEGER       | REFERENCES settings_tax_codes(id) |
| lead_time_days     | INTEGER       | -                                 |
| moq                | NUMERIC(12,4) | -                                 |
| std_price          | NUMERIC(12,4) | -                                 |
| requires_routing   | BOOLEAN       | DEFAULT false                     |
| default_routing_id | INTEGER       | -                                 |
| notes              | TEXT          | -                                 |
| allergen_ids       | INTEGER       | -                                 |
| boxes_per_pallet   | INTEGER       | -                                 |
| packs_per_box      | INTEGER       | -                                 |
| product_version    | VARCHAR(20)   | DEFAULT '1.0'                     |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()                     |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()                     |
| created_by         | UUID          | REFERENCES users(id)              |
| updated_by         | UUID          | REFERENCES users(id)              |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `tax_code_id` → `settings_tax_codes.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_products_part_number ON (part_number)
- idx_products_product_group ON (product_group)
- idx_products_product_type ON (product_type)
- idx_products_is_active ON (is_active)
- idx_products_supplier ON (supplier_id)
- idx_products_tax_code ON (tax_code_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('RM', 'DG', 'PR', 'FG', 'WIP')),
  subtype VARCHAR(100),
  uom VARCHAR(20) NOT NULL,
  expiry_policy VARCHAR(50) CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  shelf_life_days INTEGER,
  production_lines TEXT[],
  is_active BOOLEAN DEFAULT true,

  -- App taxonomy (using ENUMs)
  product_group product_group NOT NULL DEFAULT 'COMPOSITE',
  product_type product_type NOT NULL DEFAULT 'FG',

  -- Planning & commercial
  supplier_id INTEGER REFERENCES suppliers(id),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  std_price NUMERIC(12,4),

  -- Routing
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,

  -- Metadata
  notes TEXT,
  allergen_ids INTEGER[],

  -- Packaging
  boxes_per_pallet INTEGER,
  packs_per_box INTEGER,

  -- Versioning
  product_version VARCHAR(20) DEFAULT '1.0',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### boms

**Columns**:

| Column             | Type        | Constraints             |
| ------------------ | ----------- | ----------------------- |
| id                 | SERIAL      | PRIMARY KEY             |
| product_id         | INTEGER     | REFERENCES products(id) |
| version            | VARCHAR(50) | NOT NULL                |
| archived_at        | TIMESTAMPTZ | -                       |
| deleted_at         | TIMESTAMPTZ | -                       |
| requires_routing   | BOOLEAN     | DEFAULT false           |
| default_routing_id | INTEGER     | -                       |
| notes              | TEXT        | -                       |
| effective_from     | TIMESTAMPTZ | -                       |
| effective_to       | TIMESTAMPTZ | -                       |
| boxes_per_pallet   | INTEGER     | -                       |
| line_id            | INTEGER     | -                       |
| created_at         | TIMESTAMPTZ | DEFAULT NOW()           |
| updated_at         | TIMESTAMPTZ | DEFAULT NOW()           |

**Foreign Keys**:

- `product_id` → `products.id`

**Indexes**:

- idx_boms_product_status ON (product_id, status)
- idx_boms_status ON (status)
- idx_boms_routing ON (default_routing_id)
- idx_boms_product_date_range ON (product_id, effective_from, effective_to)
- idx_boms_current ON (product_id, effective_from)
- idx_bom_product_status ON (product_id, bom_status)
- idx_bom_effective_dates ON (effective_from, effective_to)
- idx_bom_version ON (product_id, version_number)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE boms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  version VARCHAR(50) NOT NULL,

  -- BOM Lifecycle
  status bom_status NOT NULL DEFAULT 'draft',
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- BOM Configuration
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,
  notes TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,

  -- Packaging
  boxes_per_pallet INTEGER,

  -- Line restrictions
  line_id INTEGER[],

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Single active BOM per product
  CONSTRAINT boms_single_active UNIQUE (product_id) WHERE status = 'active'
);
```

</details>

---

### bom_items

**Columns**:

| Column                       | Type          | Constraints                                      |
| ---------------------------- | ------------- | ------------------------------------------------ |
| id                           | SERIAL        | PRIMARY KEY                                      |
| bom_id                       | INTEGER       | REFERENCES boms(id)                              |
| material_id                  | INTEGER       | REFERENCES products(id)                          |
| uom                          | VARCHAR(20)   | NOT NULL                                         |
| quantity                     | NUMERIC(12,4) | NOT NULL                                         |
| production_line_restrictions | TEXT          | DEFAULT '{}'                                     |
| sequence                     | INTEGER       | NOT NULL                                         |
| priority                     | INTEGER       | -                                                |
| unit_cost_std                | NUMERIC(12,4) | -                                                |
| scrap_std_pct                | NUMERIC(5,2)  | DEFAULT 0                                        |
| is_optional                  | BOOLEAN       | DEFAULT false                                    |
| is_phantom                   | BOOLEAN       | DEFAULT false                                    |
| consume_whole_lp             | BOOLEAN       | DEFAULT false                                    |
| production_lines             | TEXT          | -                                                |
| tax_code_id                  | INTEGER       | REFERENCES settings_tax_codes(id)                |
| lead_time_days               | INTEGER       | -                                                |
| moq                          | NUMERIC(12,4) | -                                                |
| packages_per_box             | NUMERIC(10,4) | NOT NULL, DEFAULT 1 CHECK (packages_per_box > 0) |
| line_id                      | INTEGER       | -                                                |
| created_at                   | TIMESTAMPTZ   | DEFAULT NOW()                                    |
| updated_at                   | TIMESTAMPTZ   | DEFAULT NOW()                                    |

**Foreign Keys**:

- `bom_id` → `boms.id`
- `material_id` → `products.id`
- `tax_code_id` → `settings_tax_codes.id`

**Indexes**:

- idx_bom_items_bom ON (bom_id)
- idx_bom_items_material ON (material_id)
- idx_bom_items_sequence ON (bom_id, sequence)
- idx_bom_items_bom_material ON (bom_id, material_id)
- idx_bom_items_by_product ON (is_by_product)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id),
  material_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  quantity NUMERIC(12,4) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  sequence INTEGER NOT NULL,
  priority INTEGER,

  -- Costing
  unit_cost_std NUMERIC(12,4),
  scrap_std_pct NUMERIC(5,2) DEFAULT 0,

  -- Flags
  is_optional BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  consume_whole_lp BOOLEAN DEFAULT false,

  -- Planning
  production_lines TEXT[],
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days > 0),
  moq NUMERIC(12,4) CHECK (moq IS NULL OR moq > 0),

  -- Packaging
  packages_per_box NUMERIC(10,4) NOT NULL DEFAULT 1 CHECK (packages_per_box > 0),

  -- Line-specific materials
  line_id INTEGER[],

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### bom_history

**Columns**:

| Column      | Type        | Constraints                   |
| ----------- | ----------- | ----------------------------- |
| id          | SERIAL      | PRIMARY KEY                   |
| bom_id      | INTEGER     | NOT NULL, REFERENCES boms(id) |
| version     | VARCHAR(50) | NOT NULL                      |
| changed_by  | UUID        | REFERENCES users(id)          |
| changed_at  | TIMESTAMPTZ | DEFAULT NOW()                 |
| status_from | VARCHAR(20) | -                             |
| status_to   | VARCHAR(20) | -                             |
| changes     | JSONB       | NOT NULL                      |
| description | TEXT        | -                             |

**Foreign Keys**:

- `bom_id` → `boms.id`
- `changed_by` → `users.id`

**Indexes**:

- idx_bom_history_bom ON (bom_id)
- idx_bom_history_changed_at ON (changed_at)
- idx_bom_history_changed_by ON (changed_by)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id),
  version VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_from VARCHAR(20),
  status_to VARCHAR(20),
  changes JSONB NOT NULL,
  description TEXT
);
```

</details>

---

### routings

**Columns**:

| Column     | Type         | Constraints             |
| ---------- | ------------ | ----------------------- |
| id         | SERIAL       | PRIMARY KEY             |
| name       | VARCHAR(200) | NOT NULL                |
| product_id | INTEGER      | REFERENCES products(id) |
| is_active  | BOOLEAN      | DEFAULT true            |
| notes      | TEXT         | -                       |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()           |
| updated_at | TIMESTAMPTZ  | DEFAULT NOW()           |
| created_by | UUID         | REFERENCES users(id)    |
| updated_by | UUID         | REFERENCES users(id)    |

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

| Column                     | Type         | Constraints                                                                 |
| -------------------------- | ------------ | --------------------------------------------------------------------------- |
| id                         | SERIAL       | PRIMARY KEY                                                                 |
| routing_id                 | INTEGER      | REFERENCES routings(id)                                                     |
| operation_name             | VARCHAR(200) | NOT NULL                                                                    |
| sequence_number            | INTEGER      | NOT NULL                                                                    |
| machine_id                 | INTEGER      | REFERENCES machines(id)                                                     |
| estimated_duration_minutes | INTEGER      | -                                                                           |
| setup_time_minutes         | INTEGER      | DEFAULT 0                                                                   |
| is_active                  | BOOLEAN      | DEFAULT true                                                                |
| created_at                 | TIMESTAMPTZ  | DEFAULT NOW()                                                               |
| updated_at                 | TIMESTAMPTZ  | DEFAULT NOW()                                                               |
| requirements               | TEXT         | DEFAULT '{}'                                                                |
| code                       | VARCHAR(50)  | -                                                                           |
| description                | TEXT         | -                                                                           |
| expected_yield_pct         | NUMERIC(5,2) | DEFAULT 100.0 CHECK (expected_yield_pct >= 0 AND expected_yield_pct <= 100) |

**Foreign Keys**:

- `routing_id` → `routings.id`
- `machine_id` → `machines.id`

**Indexes**:

- idx_routing_operations_routing ON (routing_id)
- idx_routing_operations_machine ON (machine_id)
- idx_routing_operations_sequence ON (routing_id, sequence_number)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER REFERENCES routings(id),
  operation_name VARCHAR(200) NOT NULL,
  sequence_number INTEGER NOT NULL,
  machine_id INTEGER REFERENCES machines(id),
  estimated_duration_minutes INTEGER,
  setup_time_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  requirements TEXT[] DEFAULT '{}',
  code VARCHAR(50),
  description TEXT,
  expected_yield_pct NUMERIC(5,2) DEFAULT 100.0 CHECK (expected_yield_pct >= 0 AND expected_yield_pct <= 100)
);
```

</details>

---

### routing_operation_names

**Columns**:

| Column      | Type         | Constraints          |
| ----------- | ------------ | -------------------- |
| id          | SERIAL       | PRIMARY KEY          |
| name        | VARCHAR(200) | NOT NULL, UNIQUE     |
| alias       | VARCHAR(100) | -                    |
| description | TEXT         | -                    |
| is_active   | BOOLEAN      | DEFAULT true         |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()        |
| updated_at  | TIMESTAMPTZ  | DEFAULT NOW()        |
| created_by  | UUID         | REFERENCES users(id) |
| updated_by  | UUID         | REFERENCES users(id) |

**Foreign Keys**:

- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_routing_operation_names_name ON (name)
- idx_routing_operation_names_active ON (is_active)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE routing_operation_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  alias VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### po_header

**Columns**:

| Column                    | Type          | Constraints              |
| ------------------------- | ------------- | ------------------------ |
| id                        | SERIAL        | PRIMARY KEY              |
| number                    | VARCHAR(50)   | NOT NULL, UNIQUE         |
| supplier_id               | INTEGER       | REFERENCES suppliers(id) |
| status                    | VARCHAR(20)   | NOT NULL                 |
| currency                  | VARCHAR(3)    | DEFAULT 'USD'            |
| exchange_rate             | NUMERIC(12,6) | -                        |
| order_date                | TIMESTAMPTZ   | NOT NULL                 |
| requested_delivery_date   | TIMESTAMPTZ   | -                        |
| promised_delivery_date    | TIMESTAMPTZ   | -                        |
| payment_due_date          | TIMESTAMPTZ   | -                        |
| snapshot_supplier_name    | VARCHAR(200)  | -                        |
| snapshot_supplier_vat     | VARCHAR(50)   | -                        |
| snapshot_supplier_address | TEXT          | -                        |
| asn_ref                   | VARCHAR(50)   | -                        |
| net_total                 | NUMERIC(12,2) | -                        |
| vat_total                 | NUMERIC(12,2) | -                        |
| gross_total               | NUMERIC(12,2) | -                        |
| created_by                | UUID          | REFERENCES users(id)     |
| approved_by               | UUID          | REFERENCES users(id)     |
| created_at                | TIMESTAMPTZ   | DEFAULT NOW()            |
| updated_at                | TIMESTAMPTZ   | DEFAULT NOW()            |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `created_by` → `users.id`
- `approved_by` → `users.id`

**Indexes**:

- idx_po_header_number ON (number)
- idx_po_header_supplier ON (supplier_id)
- idx_po_header_status ON (status)
- idx_po_header_order_date ON (order_date)
- idx_po_supplier_status ON (supplier_id, status)
- idx_po_order_date ON (order_date)
- idx_po_expected_delivery ON (expected_delivery_date)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate NUMERIC(12,6),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  payment_due_date TIMESTAMPTZ,

  -- Supplier snapshot (for historical accuracy)
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address TEXT,

  -- ASN reference
  asn_ref VARCHAR(50),

  -- Totals
  net_total NUMERIC(12,2),
  vat_total NUMERIC(12,2),
  gross_total NUMERIC(12,2),

  -- Audit
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

| Column                  | Type          | Constraints              |
| ----------------------- | ------------- | ------------------------ |
| id                      | SERIAL        | PRIMARY KEY              |
| po_id                   | INTEGER       | REFERENCES po_header(id) |
| line_no                 | INTEGER       | NOT NULL                 |
| item_id                 | INTEGER       | REFERENCES products(id)  |
| uom                     | VARCHAR(20)   | NOT NULL                 |
| qty_ordered             | NUMERIC(12,4) | NOT NULL                 |
| qty_received            | NUMERIC(12,4) | DEFAULT 0                |
| unit_price              | NUMERIC(12,4) | NOT NULL                 |
| vat_rate                | NUMERIC(5,4)  | DEFAULT 0                |
| requested_delivery_date | TIMESTAMPTZ   | -                        |
| promised_delivery_date  | TIMESTAMPTZ   | -                        |
| default_location_id     | INTEGER       | REFERENCES locations(id) |
| note                    | TEXT          | -                        |
| created_at              | TIMESTAMPTZ   | DEFAULT NOW()            |
| updated_at              | TIMESTAMPTZ   | DEFAULT NOW()            |

**Foreign Keys**:

- `po_id` → `po_header.id`
- `item_id` → `products.id`
- `default_location_id` → `locations.id`

**Indexes**:

- idx_po_line_po ON (po_id)
- idx_po_line_item ON (item_id)
- idx_po_line_location ON (default_location_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_ordered NUMERIC(12,4) NOT NULL,
  qty_received NUMERIC(12,4) DEFAULT 0,
  unit_price NUMERIC(12,4) NOT NULL,
  vat_rate NUMERIC(5,4) DEFAULT 0,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  default_location_id INTEGER REFERENCES locations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### po_correction

**Columns**:

| Column       | Type          | Constraints              |
| ------------ | ------------- | ------------------------ |
| id           | SERIAL        | PRIMARY KEY              |
| po_id        | INTEGER       | REFERENCES po_header(id) |
| po_line_id   | INTEGER       | REFERENCES po_line(id)   |
| reason       | TEXT          | NOT NULL                 |
| delta_amount | NUMERIC(12,2) | NOT NULL                 |
| created_by   | UUID          | REFERENCES users(id)     |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW()            |

**Foreign Keys**:

- `po_id` → `po_header.id`
- `po_line_id` → `po_line.id`
- `created_by` → `users.id`

**Indexes**:

- idx_po_correction_po ON (po_id)
- idx_po_correction_line ON (po_line_id)
- idx_po_correction_created_at ON (created_at)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  po_line_id INTEGER REFERENCES po_line(id),
  reason TEXT NOT NULL,
  delta_amount NUMERIC(12,2) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### to_header

**Columns**:

| Column               | Type        | Constraints               |
| -------------------- | ----------- | ------------------------- |
| id                   | SERIAL      | PRIMARY KEY               |
| number               | VARCHAR(50) | NOT NULL, UNIQUE          |
| status               | VARCHAR(20) | NOT NULL                  |
| from_wh_id           | INTEGER     | REFERENCES warehouses(id) |
| to_wh_id             | INTEGER     | REFERENCES warehouses(id) |
| requested_date       | TIMESTAMPTZ | -                         |
| planned_ship_date    | TIMESTAMPTZ | -                         |
| actual_ship_date     | TIMESTAMPTZ | -                         |
| planned_receive_date | TIMESTAMPTZ | -                         |
| actual_receive_date  | TIMESTAMPTZ | -                         |
| notes                | TEXT        | -                         |
| created_by           | UUID        | REFERENCES users(id)      |
| approved_by          | UUID        | REFERENCES users(id)      |
| created_at           | TIMESTAMPTZ | DEFAULT NOW()             |
| updated_at           | TIMESTAMPTZ | DEFAULT NOW()             |

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
- idx_to_from_warehouse ON (from_wh_id, status)
- idx_to_to_warehouse ON (to_wh_id, status)
- idx_to_transfer_date ON (transfer_date)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE to_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled')),
  from_wh_id INTEGER REFERENCES warehouses(id),
  to_wh_id INTEGER REFERENCES warehouses(id),
  requested_date TIMESTAMPTZ,
  planned_ship_date TIMESTAMPTZ,
  actual_ship_date TIMESTAMPTZ,
  planned_receive_date TIMESTAMPTZ,
  actual_receive_date TIMESTAMPTZ,
  notes TEXT,
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

| Column       | Type          | Constraints              |
| ------------ | ------------- | ------------------------ |
| id           | SERIAL        | PRIMARY KEY              |
| to_id        | INTEGER       | REFERENCES to_header(id) |
| line_no      | INTEGER       | NOT NULL                 |
| item_id      | INTEGER       | REFERENCES products(id)  |
| uom          | VARCHAR(20)   | NOT NULL                 |
| qty_planned  | NUMERIC(12,4) | NOT NULL                 |
| qty_shipped  | NUMERIC(12,4) | DEFAULT 0                |
| qty_received | NUMERIC(12,4) | DEFAULT 0                |
| lp_id        | INTEGER       | -                        |
| batch        | VARCHAR(100)  | -                        |
| notes        | TEXT          | -                        |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW()            |
| updated_at   | TIMESTAMPTZ   | DEFAULT NOW()            |

**Foreign Keys**:

- `to_id` → `to_header.id`
- `item_id` → `products.id`

**Indexes**:

- idx_to_line_to ON (to_id)
- idx_to_line_item ON (item_id)
- idx_to_line_lp ON (lp_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned NUMERIC(12,4) NOT NULL,
  qty_shipped NUMERIC(12,4) DEFAULT 0,
  qty_received NUMERIC(12,4) DEFAULT 0,
  lp_id INTEGER,
  batch VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### work_orders

**Columns**:

| Column             | Type          | Constraints                               |
| ------------------ | ------------- | ----------------------------------------- |
| id                 | SERIAL        | PRIMARY KEY                               |
| wo_number          | VARCHAR(50)   | NOT NULL, UNIQUE                          |
| product_id         | INTEGER       | REFERENCES products(id)                   |
| bom_id             | INTEGER       | REFERENCES boms(id)                       |
| quantity           | NUMERIC(12,4) | NOT NULL                                  |
| uom                | VARCHAR(20)   | NOT NULL                                  |
| priority           | INTEGER       | DEFAULT 3                                 |
| status             | VARCHAR(20)   | NOT NULL                                  |
| scheduled_start    | TIMESTAMPTZ   | -                                         |
| scheduled_end      | TIMESTAMPTZ   | -                                         |
| actual_start       | TIMESTAMPTZ   | -                                         |
| actual_end         | TIMESTAMPTZ   | -                                         |
| machine_id         | INTEGER       | REFERENCES machines(id)                   |
| line_id            | INTEGER       | NOT NULL, REFERENCES production_lines(id) |
| source_demand_type | VARCHAR(50)   | -                                         |
| source_demand_id   | INTEGER       | -                                         |
| created_by         | INTEGER       | -                                         |
| approved_by        | INTEGER       | -                                         |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()                             |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()                             |

**Foreign Keys**:

- `product_id` → `products.id`
- `bom_id` → `boms.id`
- `machine_id` → `machines.id`
- `line_id` → `production_lines.id`

**Indexes**:

- idx_wo_number ON (wo_number)
- idx_wo_status_scheduled ON (status, scheduled_start)
- idx_wo_product_status ON (product_id, status)
- idx_wo_bom ON (bom_id)
- idx_wo_line ON (line_id)
- idx_work_orders_customer_id ON (customer_id)
- idx_work_orders_order_type ON (order_type)
- idx_wo_status ON (status)
- idx_wo_scheduled_date ON (scheduled_date)
- idx_wo_bom_id ON (bom_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  bom_id INTEGER REFERENCES boms(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(20) NOT NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  machine_id INTEGER REFERENCES machines(id),
  line_id INTEGER NOT NULL REFERENCES production_lines(id),
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

| Column                       | Type          | Constraints                |
| ---------------------------- | ------------- | -------------------------- |
| id                           | SERIAL        | PRIMARY KEY                |
| wo_id                        | INTEGER       | REFERENCES work_orders(id) |
| material_id                  | INTEGER       | REFERENCES products(id)    |
| qty_per_unit                 | NUMERIC(12,4) | NOT NULL                   |
| total_qty_needed             | NUMERIC(12,4) | NOT NULL                   |
| uom                          | VARCHAR(20)   | NOT NULL                   |
| production_line_restrictions | TEXT          | DEFAULT '{}'               |
| consume_whole_lp             | BOOLEAN       | DEFAULT false              |
| created_at                   | TIMESTAMPTZ   | DEFAULT NOW()              |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `material_id` → `products.id`

**Indexes**:

- idx_wo_materials_wo ON (wo_id)
- idx_wo_materials_material ON (material_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  qty_per_unit NUMERIC(12,4) NOT NULL,
  total_qty_needed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  production_line_restrictions TEXT[] DEFAULT '{}',
  consume_whole_lp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### wo_operations

**Columns**:

| Column               | Type        | Constraints                                   |
| -------------------- | ----------- | --------------------------------------------- |
| id                   | SERIAL      | PRIMARY KEY                                   |
| wo_id                | INTEGER     | NOT NULL, REFERENCES work_orders(id)          |
| routing_operation_id | INTEGER     | REFERENCES routing_operations(id)             |
| seq_no               | INTEGER     | NOT NULL                                      |
| status               | VARCHAR(20) | DEFAULT 'PENDING' CHECK (status IN ('PENDING' |
| operator_id          | UUID        | REFERENCES users(id)                          |
| device_id            | INTEGER     | -                                             |
| started_at           | TIMESTAMPTZ | -                                             |
| finished_at          | TIMESTAMPTZ | -                                             |
| created_at           | TIMESTAMPTZ | DEFAULT NOW()                                 |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `routing_operation_id` → `routing_operations.id`
- `operator_id` → `users.id`

**Indexes**:

- idx_wo_operations_wo ON (wo_id)
- idx_wo_operations_status ON (status)
- idx_wo_operations_operator ON (operator_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE wo_operations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  routing_operation_id INTEGER REFERENCES routing_operations(id),
  seq_no INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  operator_id UUID REFERENCES users(id),
  device_id INTEGER,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### production_outputs

**Columns**:

| Column     | Type          | Constraints                          |
| ---------- | ------------- | ------------------------------------ |
| id         | SERIAL        | PRIMARY KEY                          |
| wo_id      | INTEGER       | NOT NULL, REFERENCES work_orders(id) |
| product_id | INTEGER       | NOT NULL, REFERENCES products(id)    |
| quantity   | NUMERIC(12,4) | NOT NULL                             |
| uom        | VARCHAR(20)   | NOT NULL                             |
| lp_id      | INTEGER       | -                                    |
| created_by | INTEGER       | -                                    |
| created_at | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `product_id` → `products.id`

**Indexes**:

- idx_production_outputs_wo ON (wo_id)
- idx_production_outputs_product ON (product_id)
- idx_production_outputs_lp ON (lp_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE production_outputs (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### license_plates

**Columns**:

| Column            | Type          | Constraints                                       |
| ----------------- | ------------- | ------------------------------------------------- |
| id                | SERIAL        | PRIMARY KEY                                       |
| lp_number         | VARCHAR(50)   | NOT NULL, UNIQUE                                  |
| product_id        | INTEGER       | REFERENCES products(id)                           |
| quantity          | NUMERIC(12,4) | NOT NULL                                          |
| uom               | VARCHAR(20)   | NOT NULL                                          |
| location_id       | INTEGER       | REFERENCES locations(id)                          |
| status            | VARCHAR(20)   | DEFAULT 'available' CHECK (status IN ('available' |
| qa_status         | VARCHAR(20)   | DEFAULT 'pending' CHECK (qa_status IN ('pending'  |
| stage_suffix      | VARCHAR(10)   | -                                                 |
| batch_number      | VARCHAR(100)  | -                                                 |
| lp_type           | VARCHAR(20)   | -                                                 |
| consumed_by_wo_id | INTEGER       | REFERENCES work_orders(id)                        |
| consumed_at       | TIMESTAMPTZ   | -                                                 |
| parent_lp_id      | INTEGER       | REFERENCES license_plates(id)                     |
| parent_lp_number  | VARCHAR(50)   | -                                                 |
| origin_type       | VARCHAR(50)   | -                                                 |
| origin_ref        | JSONB         | -                                                 |
| created_by        | VARCHAR(50)   | -                                                 |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                                     |
| updated_at        | TIMESTAMPTZ   | DEFAULT NOW()                                     |

**Foreign Keys**:

- `product_id` → `products.id`
- `location_id` → `locations.id`
- `consumed_by_wo_id` → `work_orders.id`
- `parent_lp_id` → `license_plates.id`

**Indexes**:

- idx_license_plates_number ON (lp_number)
- idx_license_plates_product ON (product_id)
- idx_license_plates_location ON (location_id)
- idx_license_plates_status ON (status)
- idx_license_plates_qa_status ON (qa_status)
- idx_license_plates_parent_lp ON (parent_lp_id)
- idx_license_plates_consumed_by_wo ON (consumed_by_wo_id)
- idx_license_plates_lp_type ON (lp_type)
- idx_license_plates_batch ON (batch)
- idx_license_plates_expiry ON (expiry_date)
- idx_license_plates_parent ON (parent_lp_id)
- idx_license_plates_consumed ON (is_consumed, consumed_at)
- idx_license_plates_asn ON (asn_id)
- idx_license_plates_fifo ON (product_id, location_id, expiry_date, created_at)
- idx_lp_location_status ON (location_id, status)
- idx_lp_expiry_date ON (expiry_date)
- idx_lp_product_location ON (product_id, location_id)
- idx_lp_batch ON (batch)
- idx_lp_qa_status ON (qa_status)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE license_plates (
  id SERIAL PRIMARY KEY,
  lp_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  location_id INTEGER REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged')),
  qa_status VARCHAR(20) DEFAULT 'pending' CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold')),
  stage_suffix VARCHAR(10) CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  batch_number VARCHAR(100),
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

### lp_reservations

**Columns**:

| Column     | Type          | Constraints                                 |
| ---------- | ------------- | ------------------------------------------- |
| id         | SERIAL        | PRIMARY KEY                                 |
| lp_id      | INTEGER       | NOT NULL, REFERENCES license_plates(id)     |
| wo_id      | INTEGER       | NOT NULL, REFERENCES work_orders(id)        |
| qty        | NUMERIC(12,4) | NOT NULL                                    |
| status     | VARCHAR(20)   | DEFAULT 'active' CHECK (status IN ('active' |
| created_at | TIMESTAMPTZ   | DEFAULT NOW()                               |
| expires_at | TIMESTAMPTZ   | -                                           |
| created_by | VARCHAR(50)   | -                                           |

**Foreign Keys**:

- `lp_id` → `license_plates.id`
- `wo_id` → `work_orders.id`

**Indexes**:

- idx_lp_reservations_lp ON (lp_id)
- idx_lp_reservations_wo ON (wo_id)
- idx_lp_reservations_status ON (status)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE lp_reservations (
  id SERIAL PRIMARY KEY,
  lp_id INTEGER NOT NULL REFERENCES license_plates(id),
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  qty NUMERIC(12,4) NOT NULL CHECK (qty > 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by VARCHAR(50)
);
```

</details>

---

### lp_compositions

**Columns**:

| Column       | Type          | Constraints                             |
| ------------ | ------------- | --------------------------------------- |
| id           | SERIAL        | PRIMARY KEY                             |
| output_lp_id | INTEGER       | NOT NULL, REFERENCES license_plates(id) |
| input_lp_id  | INTEGER       | NOT NULL, REFERENCES license_plates(id) |
| qty          | NUMERIC(12,4) | NOT NULL                                |
| uom          | VARCHAR(50)   | NOT NULL                                |
| op_seq       | INTEGER       | -                                       |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW()                           |

**Foreign Keys**:

- `output_lp_id` → `license_plates.id`
- `input_lp_id` → `license_plates.id`

**Indexes**:

- idx_lp_compositions_output ON (output_lp_id)
- idx_lp_compositions_input ON (input_lp_id)
- idx_lp_compositions_op_seq ON (op_seq)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE lp_compositions (
  id SERIAL PRIMARY KEY,
  output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  qty NUMERIC(12,4) NOT NULL,
  uom VARCHAR(50) NOT NULL,
  op_seq INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### lp_genealogy

**Columns**:

| Column             | Type          | Constraints                             |
| ------------------ | ------------- | --------------------------------------- |
| id                 | SERIAL        | PRIMARY KEY                             |
| child_lp_id        | INTEGER       | NOT NULL, REFERENCES license_plates(id) |
| parent_lp_id       | INTEGER       | REFERENCES license_plates(id)           |
| quantity_consumed  | NUMERIC(12,4) | NOT NULL                                |
| uom                | VARCHAR(20)   | NOT NULL                                |
| wo_id              | INTEGER       | REFERENCES work_orders(id)              |
| operation_sequence | INTEGER       | -                                       |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()                           |

**Foreign Keys**:

- `child_lp_id` → `license_plates.id`
- `parent_lp_id` → `license_plates.id`
- `wo_id` → `work_orders.id`

**Indexes**:

- idx_lp_genealogy_child ON (child_lp_id)
- idx_lp_genealogy_parent ON (parent_lp_id)
- idx_lp_genealogy_wo ON (wo_id)
- idx_lp_genealogy_parent_child ON (parent_lp_id, child_lp_id)

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

### pallets

**Columns**:

| Column       | Type        | Constraints                                  |
| ------------ | ----------- | -------------------------------------------- |
| id           | SERIAL      | PRIMARY KEY                                  |
| wo_id        | INTEGER     | NOT NULL, REFERENCES work_orders(id)         |
| line         | VARCHAR(50) | -                                            |
| code         | VARCHAR(50) | NOT NULL, UNIQUE                             |
| target_boxes | INTEGER     | -                                            |
| actual_boxes | INTEGER     | -                                            |
| created_at   | TIMESTAMPTZ | DEFAULT NOW()                                |
| created_by   | VARCHAR(50) | -                                            |
| pallet_type  | VARCHAR(20) | DEFAULT 'EURO' CHECK (pallet_type IN ('EURO' |
| location_id  | INTEGER     | REFERENCES locations(id)                     |
| status       | VARCHAR(20) | DEFAULT 'open' CHECK (status IN ('open'      |
| closed_at    | TIMESTAMPTZ | -                                            |
| closed_by    | UUID        | -                                            |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `location_id` → `locations.id`

**Indexes**:

- idx_pallets_wo ON (wo_id)
- idx_pallets_code ON (code)
- idx_pallets_pallet_number ON (pallet_number)
- idx_pallets_status ON (status)
- idx_pallets_location ON (location_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE pallets (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  line VARCHAR(50),
  code VARCHAR(50) UNIQUE NOT NULL,
  target_boxes INTEGER,
  actual_boxes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50)
);
```

</details>

---

### pallet_items

**Columns**:

| Column            | Type          | Constraints                      |
| ----------------- | ------------- | -------------------------------- |
| id                | SERIAL        | PRIMARY KEY                      |
| pallet_id         | INTEGER       | NOT NULL, REFERENCES pallets(id) |
| box_count         | NUMERIC(12,4) | NOT NULL                         |
| material_snapshot | JSONB         | -                                |
| sequence          | INTEGER       | -                                |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                    |
| quantity          | NUMERIC(12,4) | -                                |
| uom               | VARCHAR(20)   | -                                |
| added_at          | TIMESTAMPTZ   | DEFAULT NOW()                    |
| added_by          | UUID          | -                                |

**Foreign Keys**:

- `pallet_id` → `pallets.id`

**Indexes**:

- idx_pallet_items_pallet ON (pallet_id)
- idx_pallet_items_lp ON (lp_id)
- idx_pallet_items_pallet_lp ON (pallet_id, lp_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER NOT NULL REFERENCES pallets(id),
  box_count NUMERIC(12,4) NOT NULL,
  material_snapshot JSONB,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### grns

**Columns**:

| Column        | Type        | Constraints              |
| ------------- | ----------- | ------------------------ |
| id            | SERIAL      | PRIMARY KEY              |
| grn_number    | VARCHAR(50) | NOT NULL, UNIQUE         |
| po_id         | INTEGER     | REFERENCES po_header(id) |
| status        | VARCHAR(20) | NOT NULL                 |
| received_date | TIMESTAMPTZ | NOT NULL                 |
| received_by   | INTEGER     | -                        |
| supplier_id   | INTEGER     | REFERENCES suppliers(id) |
| notes         | TEXT        | -                        |
| created_at    | TIMESTAMPTZ | DEFAULT NOW()            |
| updated_at    | TIMESTAMPTZ | DEFAULT NOW()            |

**Foreign Keys**:

- `po_id` → `po_header.id`
- `supplier_id` → `suppliers.id`

**Indexes**:

- idx_grns_number ON (grn_number)
- idx_grns_po ON (po_id)
- idx_grns_supplier ON (supplier_id)
- idx_grns_received_date ON (received_date)
- idx_grns_asn ON (asn_id)
- idx_grns_grn_date ON (grn_date)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE grns (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
  received_date TIMESTAMPTZ NOT NULL,
  received_by INTEGER,
  supplier_id INTEGER REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### grn_items

**Columns**:

| Column            | Type          | Constraints              |
| ----------------- | ------------- | ------------------------ |
| id                | SERIAL        | PRIMARY KEY              |
| grn_id            | INTEGER       | REFERENCES grns(id)      |
| product_id        | INTEGER       | REFERENCES products(id)  |
| quantity_ordered  | NUMERIC(12,4) | NOT NULL                 |
| quantity_received | NUMERIC(12,4) | NOT NULL                 |
| quantity_accepted | NUMERIC(12,4) | -                        |
| location_id       | INTEGER       | REFERENCES locations(id) |
| unit_price        | NUMERIC(12,4) | -                        |
| batch             | VARCHAR(100)  | -                        |
| batch_number      | VARCHAR(100)  | -                        |
| mfg_date          | TIMESTAMPTZ   | -                        |
| expiry_date       | TIMESTAMPTZ   | -                        |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()            |
| updated_at        | TIMESTAMPTZ   | DEFAULT NOW()            |
| notes             | TEXT          | -                        |

**Foreign Keys**:

- `grn_id` → `grns.id`
- `product_id` → `products.id`
- `location_id` → `locations.id`

**Indexes**:

- idx_grn_items_grn ON (grn_id)
- idx_grn_items_product ON (product_id)
- idx_grn_items_location ON (location_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id),
  product_id INTEGER REFERENCES products(id),
  quantity_ordered NUMERIC(12,4) NOT NULL,
  quantity_received NUMERIC(12,4) NOT NULL,
  quantity_accepted NUMERIC(12,4),
  location_id INTEGER REFERENCES locations(id),
  unit_price NUMERIC(12,4),
  batch VARCHAR(100),
  batch_number VARCHAR(100),
  mfg_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### asns

**Columns**:

| Column           | Type        | Constraints              |
| ---------------- | ----------- | ------------------------ |
| id               | SERIAL      | PRIMARY KEY              |
| asn_number       | VARCHAR(50) | NOT NULL, UNIQUE         |
| supplier_id      | INTEGER     | REFERENCES suppliers(id) |
| po_id            | INTEGER     | REFERENCES po_header(id) |
| status           | VARCHAR(20) | NOT NULL                 |
| expected_arrival | TIMESTAMPTZ | NOT NULL                 |
| attachments      | JSONB       | -                        |
| created_at       | TIMESTAMPTZ | DEFAULT NOW()            |
| updated_at       | TIMESTAMPTZ | DEFAULT NOW()            |
| actual_arrival   | TIMESTAMPTZ | -                        |
| notes            | TEXT        | -                        |
| created_by       | UUID        | REFERENCES users(id)     |
| updated_by       | UUID        | REFERENCES users(id)     |

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `po_id` → `po_header.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_asns_number ON (asn_number)
- idx_asns_supplier ON (supplier_id)
- idx_asns_po ON (po_id)
- idx_asns_expected_arrival ON (expected_arrival)
- idx_asns_asn_number ON (asn_number)
- idx_asns_po_id ON (po_id) WHERE po_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_asns_supplier_id ON asns(supplier_id)
- idx_asns_status ON (status)
- idx_asns_status_expected ON (status, expected_arrival)
- idx_asns_po_id ON (po_id)
- idx_asns_supplier_id ON (supplier_id)
- idx_asns_expected_arrival ON (expected_arrival_date)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
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

| Column      | Type          | Constraints             |
| ----------- | ------------- | ----------------------- |
| id          | SERIAL        | PRIMARY KEY             |
| asn_id      | INTEGER       | REFERENCES asns(id)     |
| product_id  | INTEGER       | REFERENCES products(id) |
| uom         | VARCHAR(20)   | NOT NULL                |
| quantity    | NUMERIC(12,4) | NOT NULL                |
| batch       | VARCHAR(100)  | -                       |
| pack        | JSONB         | -                       |
| pallet      | JSONB         | -                       |
| notes       | TEXT          | -                       |
| created_at  | TIMESTAMPTZ   | DEFAULT NOW()           |
| expiry_date | DATE          | -                       |
| lp_number   | VARCHAR(50)   | -                       |

**Foreign Keys**:

- `asn_id` → `asns.id`
- `product_id` → `products.id`

**Indexes**:

- idx_asn_items_asn ON (asn_id)
- idx_asn_items_product ON (product_id)
- idx_asn_items_asn_id ON (asn_id)
- idx_asn_items_product_id ON (product_id)
- idx_asn_items_batch ON (batch) WHERE batch IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full access to authenticated users
CREATE POLICY "Allow full access to asns for authenticated users"
ON asns TO authenticated
USING (TRUE)
WITH CHECK (TRUE)

- idx_asn_items_batch ON (batch)
- idx_asn_items_po_line ON (po_line_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id),
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### stock_moves

**Columns**:

| Column           | Type          | Constraints              |
| ---------------- | ------------- | ------------------------ |
| id               | SERIAL        | PRIMARY KEY              |
| move_number      | VARCHAR(50)   | NOT NULL, UNIQUE         |
| product_id       | INTEGER       | REFERENCES products(id)  |
| from_location_id | INTEGER       | REFERENCES locations(id) |
| to_location_id   | INTEGER       | REFERENCES locations(id) |
| quantity         | NUMERIC(12,4) | NOT NULL                 |
| uom              | VARCHAR(20)   | NOT NULL                 |
| move_type        | VARCHAR(50)   | NOT NULL                 |
| move_source      | VARCHAR(50)   | DEFAULT 'portal'         |
| move_status      | VARCHAR(20)   | DEFAULT 'completed'      |
| reference_type   | VARCHAR(50)   | -                        |
| reference_id     | INTEGER       | -                        |
| created_by       | VARCHAR(50)   | -                        |
| created_at       | TIMESTAMPTZ   | DEFAULT NOW()            |

**Foreign Keys**:

- `product_id` → `products.id`
- `from_location_id` → `locations.id`
- `to_location_id` → `locations.id`

**Indexes**:

- idx_stock_moves_number ON (move_number)
- idx_stock_moves_product ON (product_id)
- idx_stock_moves_from_location ON (from_location_id)
- idx_stock_moves_to_location ON (to_location_id)
- idx_stock_moves_created_at ON (created_at)
- idx_stock_moves_lp ON (lp_id)
- idx_stock_moves_date ON (move_date)

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
  move_type VARCHAR(50) NOT NULL,
  move_source VARCHAR(50) DEFAULT 'portal',
  move_status VARCHAR(20) DEFAULT 'completed',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### product_allergens

**Columns**:

| Column      | Type        | Constraints                        |
| ----------- | ----------- | ---------------------------------- |
| id          | SERIAL      | PRIMARY KEY                        |
| product_id  | INTEGER     | NOT NULL, REFERENCES products(id)  |
| allergen_id | INTEGER     | NOT NULL, REFERENCES allergens(id) |
| contains    | BOOLEAN     | NOT NULL, DEFAULT true             |
| created_at  | TIMESTAMPTZ | DEFAULT NOW()                      |
| updated_at  | TIMESTAMPTZ | DEFAULT NOW()                      |

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
  product_id INTEGER NOT NULL REFERENCES products(id),
  allergen_id INTEGER NOT NULL REFERENCES allergens(id),
  contains BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);
```

</details>

---

### audit_log

**Columns**:

| Column     | Type         | Constraints          |
| ---------- | ------------ | -------------------- |
| id         | SERIAL       | PRIMARY KEY          |
| entity     | VARCHAR(100) | NOT NULL             |
| entity_id  | INTEGER      | NOT NULL             |
| action     | VARCHAR(20)  | NOT NULL             |
| before     | JSONB        | -                    |
| after      | JSONB        | -                    |
| actor_id   | UUID         | REFERENCES users(id) |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()        |

**Foreign Keys**:

- `actor_id` → `users.id`

**Indexes**:

- idx_audit_log_entity ON (entity, entity_id)
- idx_audit_log_actor ON (actor_id)
- idx_audit_log_created_at ON (created_at)
- idx_audit_log_table ON (table_name)
- idx_audit_log_timestamp ON (changed_at DESC)
- idx_audit_log_table_record ON (table_name, record_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### warehouse_settings

**Columns**:

| Column                         | Type        | Constraints                                 |
| ------------------------------ | ----------- | ------------------------------------------- |
| id                             | SERIAL      | PRIMARY KEY                                 |
| warehouse_id                   | INTEGER     | NOT NULL, UNIQUE, REFERENCES warehouses(id) |
| default_to_receive_location_id | INTEGER     | REFERENCES locations(id)                    |
| default_po_receive_location_id | INTEGER     | REFERENCES locations(id)                    |
| default_transit_location_id    | INTEGER     | REFERENCES locations(id)                    |
| notes                          | TEXT        | -                                           |
| created_at                     | TIMESTAMPTZ | DEFAULT NOW()                               |
| updated_at                     | TIMESTAMPTZ | DEFAULT NOW()                               |

**Foreign Keys**:

- `warehouse_id` → `warehouses.id`
- `default_to_receive_location_id` → `locations.id`
- `default_po_receive_location_id` → `locations.id`
- `default_transit_location_id` → `locations.id`

**Indexes**:

- idx_warehouse_settings_warehouse ON (warehouse_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE warehouse_settings (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) UNIQUE,
  default_to_receive_location_id INTEGER REFERENCES locations(id),
  default_po_receive_location_id INTEGER REFERENCES locations(id),
  default_transit_location_id INTEGER REFERENCES locations(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### wo_by_products

**Columns**:

| Column            | Type          | Constraints                          |
| ----------------- | ------------- | ------------------------------------ |
| id                | SERIAL        | PRIMARY KEY                          |
| wo_id             | INTEGER       | NOT NULL, REFERENCES work_orders(id) |
| product_id        | INTEGER       | NOT NULL, REFERENCES products(id)    |
| expected_quantity | NUMERIC(12,4) | NOT NULL                             |
| actual_quantity   | NUMERIC(12,4) | DEFAULT 0                            |
| uom               | VARCHAR(20)   | NOT NULL                             |
| lp_id             | INTEGER       | REFERENCES license_plates(id)        |
| notes             | TEXT          | -                                    |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                        |
| updated_at        | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `product_id` → `products.id`
- `lp_id` → `license_plates.id`

**Indexes**:

- idx_wo_by_products_wo ON (wo_id)
- idx_wo_by_products_product ON (product_id)
- idx_wo_by_products_lp ON (lp_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS wo_by_products (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_quantity NUMERIC(12,4) NOT NULL,
  actual_quantity NUMERIC(12,4) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER REFERENCES license_plates(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_by_products_expected_qty_positive CHECK (expected_quantity > 0),
  CONSTRAINT wo_by_products_actual_qty_non_negative CHECK (actual_quantity >= 0)
);
```

</details>

---

### wo_reservations

**Columns**:

| Column             | Type          | Constraints                                                                         |
| ------------------ | ------------- | ----------------------------------------------------------------------------------- |
| id                 | SERIAL        | PRIMARY KEY                                                                         |
| wo_id              | INTEGER       | NOT NULL, REFERENCES work_orders(id)                                                |
| material_id        | INTEGER       | NOT NULL, REFERENCES products(id)                                                   |
| lp_id              | INTEGER       | NOT NULL, REFERENCES license_plates(id)                                             |
| quantity_reserved  | NUMERIC(12,4) | NOT NULL                                                                            |
| quantity_consumed  | NUMERIC(12,4) | DEFAULT 0 CHECK (quantity_consumed >= 0 AND quantity_consumed <= quantity_reserved) |
| uom                | VARCHAR(20)   | NOT NULL                                                                            |
| operation_sequence | INTEGER       | -                                                                                   |
| reserved_at        | TIMESTAMPTZ   | DEFAULT NOW()                                                                       |
| reserved_by        | UUID          | -                                                                                   |
| consumed_at        | TIMESTAMPTZ   | -                                                                                   |
| consumed_by        | UUID          | -                                                                                   |
| status             | VARCHAR(20)   | DEFAULT 'active' CHECK (status IN ('active'                                         |
| notes              | TEXT          | -                                                                                   |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `material_id` → `products.id`
- `lp_id` → `license_plates.id`

**Indexes**:

- idx_wo_reservations_wo ON (wo_id)
- idx_wo_reservations_lp ON (lp_id)
- idx_wo_reservations_material ON (material_id)
- idx_wo_reservations_status ON (status)
- idx_wo_reservations_lp ON (lp_id, status)
- idx_wo_reservations_material ON (material_id, status)
- idx_wo_reservations_wo_material ON (wo_id, material_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS wo_reservations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES products(id), -- Material from BOM
  lp_id INTEGER NOT NULL REFERENCES license_plates(id), -- Actual LP reserved
  quantity_reserved NUMERIC(12,4) NOT NULL CHECK (quantity_reserved > 0),
  quantity_consumed NUMERIC(12,4) DEFAULT 0 CHECK (quantity_consumed >= 0 AND quantity_consumed <= quantity_reserved),
  uom VARCHAR(20) NOT NULL,
  operation_sequence INTEGER, -- Which BOM operation
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES auth.users(id),
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  notes TEXT
);
```

</details>

---

### material_costs

**Columns**:

| Column         | Type           | Constraints                                           |
| -------------- | -------------- | ----------------------------------------------------- |
| id             | BIGSERIAL      | PRIMARY KEY                                           |
| product_id     | BIGINT         | NOT NULL, REFERENCES products(id)                     |
| org_id         | BIGINT         | NOT NULL, REFERENCES organizations(id)                |
| cost           | DECIMAL(15, 4) | NOT NULL                                              |
| currency       | VARCHAR(3)     | NOT NULL, DEFAULT 'USD'                               |
| uom            | VARCHAR(10)    | NOT NULL                                              |
| effective_from | TIMESTAMP      | NOT NULL, DEFAULT NOW()                               |
| effective_to   | TIMESTAMP      | -                                                     |
| source         | VARCHAR(20)    | NOT NULL, DEFAULT 'manual' CHECK (source IN ('manual' |
| notes          | TEXT           | -                                                     |
| created_by     | BIGINT         | REFERENCES users(id)                                  |
| created_at     | TIMESTAMP      | DEFAULT NOW()                                         |
| updated_by     | BIGINT         | -                                                     |
| updated_at     | TIMESTAMP      | DEFAULT NOW()                                         |
| effective_to   | IS             | -                                                     |

**Foreign Keys**:

- `product_id` → `products.id`
- `org_id` → `organizations.id`
- `created_by` → `users.id`

**Indexes**:

- idx_material_costs_product ON (product_id)
- idx_material_costs_org ON (org_id)
- idx_material_costs_effective_date ON (product_id, effective_from)
- idx_material_costs_date_range ON (effective_from, effective_to)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS material_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost information
  cost DECIMAL(15, 4) NOT NULL CHECK (cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  uom VARCHAR(10) NOT NULL,

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Source tracking
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'supplier', 'average', 'import')),
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT material_costs_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);
```

</details>

---

### bom_costs

**Columns**:

| Column              | Type           | Constraints                                     |
| ------------------- | -------------- | ----------------------------------------------- |
| id                  | BIGSERIAL      | PRIMARY KEY                                     |
| bom_id              | BIGINT         | NOT NULL, REFERENCES boms(id)                   |
| org_id              | BIGINT         | NOT NULL, REFERENCES organizations(id)          |
| total_cost          | DECIMAL(15, 4) | NOT NULL                                        |
| material_costs      | DECIMAL(15, 4) | NOT NULL, DEFAULT 0 CHECK (material_costs >= 0) |
| labor_cost          | DECIMAL(15, 4) | NOT NULL, DEFAULT 0 CHECK (labor_cost >= 0)     |
| overhead_cost       | DECIMAL(15, 4) | NOT NULL, DEFAULT 0 CHECK (overhead_cost >= 0)  |
| currency            | VARCHAR(3)     | NOT NULL, DEFAULT 'USD'                         |
| material_costs_json | JSONB          | -                                               |
| calculated_at       | TIMESTAMP      | NOT NULL, DEFAULT NOW()                         |
| calculated_by       | BIGINT         | REFERENCES users(id)                            |
| calculation_method  | VARCHAR(50)    | DEFAULT 'standard'                              |
| notes               | TEXT           | -                                               |
| created_at          | TIMESTAMP      | DEFAULT NOW()                                   |

**Foreign Keys**:

- `bom_id` → `boms.id`
- `org_id` → `organizations.id`
- `calculated_by` → `users.id`

**Indexes**:

- idx_bom_costs_bom ON (bom_id)
- idx_bom_costs_org ON (org_id)
- idx_bom_costs_calculated_at ON (calculated_at DESC)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS bom_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost breakdown
  total_cost DECIMAL(15, 4) NOT NULL CHECK (total_cost >= 0),
  material_costs DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (material_costs >= 0),
  labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (overhead_cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Detailed breakdown (JSONB for flexibility)
  material_costs_json JSONB,

  -- Calculation metadata
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  calculated_by BIGINT REFERENCES users(id),
  calculation_method VARCHAR(50) DEFAULT 'standard',
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

</details>

---

### product_prices

**Columns**:

| Column         | Type           | Constraints                            |
| -------------- | -------------- | -------------------------------------- |
| id             | BIGSERIAL      | PRIMARY KEY                            |
| product_id     | BIGINT         | NOT NULL, REFERENCES products(id)      |
| org_id         | BIGINT         | NOT NULL, REFERENCES organizations(id) |
| price          | DECIMAL(15, 4) | NOT NULL                               |
| currency       | VARCHAR(3)     | NOT NULL, DEFAULT 'USD'                |
| effective_from | TIMESTAMP      | NOT NULL, DEFAULT NOW()                |
| effective_to   | TIMESTAMP      | -                                      |
| price_type     | VARCHAR(20)    | NOT NULL, DEFAULT 'wholesale' CHECK (  |
| price_type     | IN             | -                                      |
| customer_id    | BIGINT         | -                                      |
| notes          | TEXT           | -                                      |
| created_by     | BIGINT         | REFERENCES users(id)                   |
| created_at     | TIMESTAMP      | DEFAULT NOW()                          |
| updated_by     | BIGINT         | -                                      |
| updated_at     | TIMESTAMP      | DEFAULT NOW()                          |
| effective_to   | IS             | -                                      |

**Foreign Keys**:

- `product_id` → `products.id`
- `org_id` → `organizations.id`
- `created_by` → `users.id`

**Indexes**:

- idx_product_prices_product ON (product_id)
- idx_product_prices_org ON (org_id)
- idx_product_prices_effective_date ON (product_id, effective_from)
- idx_product_prices_type ON (price_type)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS product_prices (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Price information
  price DECIMAL(15, 4) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Price type
  price_type VARCHAR(20) NOT NULL DEFAULT 'wholesale' CHECK (
    price_type IN ('wholesale', 'retail', 'export', 'internal', 'custom')
  ),
  customer_id BIGINT, -- Optional: for customer-specific pricing

  -- Additional info
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_prices_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);
```

</details>

---

### wo_costs

**Columns**:

| Column                | Type           | Constraints                                   |
| --------------------- | -------------- | --------------------------------------------- |
| id                    | BIGSERIAL      | PRIMARY KEY                                   |
| wo_id                 | BIGINT         | NOT NULL, REFERENCES work_orders(id)          |
| org_id                | BIGINT         | NOT NULL, REFERENCES organizations(id)        |
| planned_cost          | DECIMAL(15, 4) | NOT NULL, DEFAULT 0 CHECK (planned_cost >= 0) |
| planned_material_cost | DECIMAL(15, 4) | NOT NULL, DEFAULT 0                           |
| planned_labor_cost    | DECIMAL(15, 4) | NOT NULL, DEFAULT 0                           |
| planned_overhead_cost | DECIMAL(15, 4) | NOT NULL, DEFAULT 0                           |
| actual_cost           | DECIMAL(15, 4) | DEFAULT 0 CHECK (actual_cost >= 0)            |
| actual_material_cost  | DECIMAL(15, 4) | DEFAULT 0                                     |
| actual_labor_cost     | DECIMAL(15, 4) | DEFAULT 0                                     |
| actual_overhead_cost  | DECIMAL(15, 4) | DEFAULT 0                                     |
| cost_variance         | DECIMAL(15, 4) | -                                             |
| variance_percent      | DECIMAL(8, 4)  | -                                             |
| currency              | VARCHAR(3)     | NOT NULL, DEFAULT 'USD'                       |
| planned_calculated_at | TIMESTAMP      | DEFAULT NOW()                                 |
| actual_calculated_at  | TIMESTAMP      | -                                             |
| created_at            | TIMESTAMP      | DEFAULT NOW()                                 |
| updated_at            | TIMESTAMP      | DEFAULT NOW()                                 |

**Foreign Keys**:

- `wo_id` → `work_orders.id`
- `org_id` → `organizations.id`

**Indexes**:

- idx_wo_costs_wo ON (wo_id)
- idx_wo_costs_org ON (org_id)
- idx_wo_costs_variance ON (cost_variance)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS wo_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Planned costs (from BOM at WO creation)
  planned_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (planned_cost >= 0),
  planned_material_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,

  -- Actual costs (from actual consumption)
  actual_cost DECIMAL(15, 4) DEFAULT 0 CHECK (actual_cost >= 0),
  actual_material_cost DECIMAL(15, 4) DEFAULT 0,
  actual_labor_cost DECIMAL(15, 4) DEFAULT 0,
  actual_overhead_cost DECIMAL(15, 4) DEFAULT 0,

  -- Variance
  cost_variance DECIMAL(15, 4) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
  variance_percent DECIMAL(8, 4) GENERATED ALWAYS AS (
    CASE
      WHEN planned_cost > 0 THEN ((actual_cost - planned_cost) / planned_cost * 100)
      ELSE 0
    END
  ) STORED,

  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Calculation metadata
  planned_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actual_calculated_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

</details>

---
