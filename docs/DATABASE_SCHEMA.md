# Database Schema Documentation

## Overview

This document describes the complete database schema for the MonoPilot MES system, including all tables, relationships, constraints, and business rules.

**Last Updated**: 2025-11-17 (auto-generated)
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

- idx_products_npd_project_id ON (npd_project_id)
- idx_products_source ON (source)

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

- idx_boms_npd_formulation_id ON (npd_formulation_id)
- idx_boms_source ON (source)

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

- idx_work_orders_npd_project_id ON (npd_project_id)
- idx_work_orders_type ON (type)

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

**Foreign Keys**:

- `supplier_id` → `suppliers.id`
- `po_id` → `po_header.id`

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

- idx_production_outputs_type ON (type)

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

### asn_items

**Columns**:

| Column     | Type          | Constraints             |
| ---------- | ------------- | ----------------------- |
| id         | SERIAL        | PRIMARY KEY             |
| asn_id     | INTEGER       | REFERENCES asns(id)     |
| product_id | INTEGER       | REFERENCES products(id) |
| uom        | VARCHAR(20)   | NOT NULL                |
| quantity   | NUMERIC(12,4) | NOT NULL                |
| batch      | VARCHAR(100)  | -                       |
| pack       | JSONB         | -                       |
| pallet     | JSONB         | -                       |
| notes      | TEXT          | -                       |
| created_at | TIMESTAMPTZ   | DEFAULT NOW()           |

**Foreign Keys**:

- `asn_id` → `asns.id`
- `product_id` → `products.id`

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

**Foreign Keys**:

- `grn_id` → `grns.id`
- `product_id` → `products.id`
- `location_id` → `locations.id`

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

### pallets

**Columns**:

| Column       | Type        | Constraints                          |
| ------------ | ----------- | ------------------------------------ |
| id           | SERIAL      | PRIMARY KEY                          |
| wo_id        | INTEGER     | NOT NULL, REFERENCES work_orders(id) |
| line         | VARCHAR(50) | -                                    |
| code         | VARCHAR(50) | NOT NULL, UNIQUE                     |
| target_boxes | INTEGER     | -                                    |
| actual_boxes | INTEGER     | -                                    |
| created_at   | TIMESTAMPTZ | DEFAULT NOW()                        |
| created_by   | VARCHAR(50) | -                                    |

**Foreign Keys**:

- `wo_id` → `work_orders.id`

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

**Foreign Keys**:

- `pallet_id` → `pallets.id`

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

### pgaudit_log

**Columns**:

| Column          | Type        | Constraints             |
| --------------- | ----------- | ----------------------- |
| id              | BIGSERIAL   | PRIMARY KEY             |
| audit_type      | VARCHAR(10) | NOT NULL                |
| statement_id    | TEXT        | -                       |
| substatement_id | TEXT        | -                       |
| class           | TEXT        | -                       |
| command         | TEXT        | -                       |
| object_type     | TEXT        | -                       |
| object_name     | TEXT        | -                       |
| statement       | TEXT        | -                       |
| parameter       | TEXT        | -                       |
| user_id         | UUID        | -                       |
| session_id      | TEXT        | -                       |
| timestamp       | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| org_id          | INTEGER     | -                       |

**Indexes**:

- idx_pgaudit_log_timestamp ON (timestamp DESC)
- idx_pgaudit_log_user ON (user_id)
- idx_pgaudit_log_object_name ON (object_name)
- idx_pgaudit_log_command ON (command)
- idx_pgaudit_log_org_id ON (org_id)
- idx_pgaudit_log_user_timestamp ON (user_id, timestamp DESC)
- idx_pgaudit_log_object_timestamp ON (object_name, timestamp DESC)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS pgaudit_log (
  id BIGSERIAL PRIMARY KEY,
  audit_type VARCHAR(10) NOT NULL,           -- SESSION or OBJECT
  statement_id TEXT,                         -- Unique statement identifier
  substatement_id TEXT,                      -- For complex statements
  class TEXT,                                -- Audit class (READ, WRITE, DDL, etc.)
  command TEXT,                              -- SQL command (SELECT, INSERT, UPDATE, etc.)
  object_type TEXT,                          -- Type of object (TABLE, INDEX, etc.)
  object_name TEXT,                          -- Fully qualified object name
  statement TEXT,                            -- Full SQL statement
  parameter TEXT,                            -- Statement parameters
  user_id UUID,                              -- User who executed the statement
  session_id TEXT,                           -- Database session ID
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  org_id INTEGER                             -- Multi-tenant isolation
);
```

</details>

---

### lp_sequence_state

**Columns**:

| Column               | Type        | Constraints                           |
| -------------------- | ----------- | ------------------------------------- |
| id                   | INTEGER     | PRIMARY KEY, DEFAULT 1 CHECK (id = 1) |
| last_reset_date      | DATE        | NOT NULL, DEFAULT CURRENT_DATE        |
| last_sequence_number | INTEGER     | NOT NULL, DEFAULT 0                   |
| updated_at           | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()               |

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS lp_sequence_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Enforce single row
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_sequence_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

</details>

---

### wo_templates

**Columns**:

| Column        | Type      | Constraints                            |
| ------------- | --------- | -------------------------------------- |
| id            | SERIAL    | PRIMARY KEY                            |
| org_id        | INTEGER   | NOT NULL, REFERENCES organizations(id) |
| template_name | TEXT      | NOT NULL                               |
| description   | TEXT      | -                                      |
| product_id    | INTEGER   | NOT NULL, REFERENCES products(id)      |
| config_json   | JSONB     | NOT NULL                               |
| is_default    | BOOLEAN   | DEFAULT FALSE                          |
| usage_count   | INTEGER   | DEFAULT 0                              |
| last_used_at  | TIMESTAMP | -                                      |
| created_by    | INTEGER   | REFERENCES users(id)                   |
| created_at    | TIMESTAMP | DEFAULT NOW()                          |
| updated_at    | TIMESTAMP | DEFAULT NOW()                          |
| is_default    | IS        | NOT NULL                               |

**Foreign Keys**:

- `org_id` → `organizations.id`
- `product_id` → `products.id`
- `created_by` → `users.id`

**Indexes**:

- idx_wo_templates_org_id ON (org_id)
- idx_wo_templates_product_id ON (org_id, product_id)
- idx_wo_templates_created_by ON (created_by)
- idx_wo_templates_usage_count ON (usage_count DESC)
- idx_wo_templates_last_used ON (last_used_at DESC NULLS LAST)
- idx_wo_templates_one_default_per_product ON (org_id, product_id)
  WHERE is_default = TRUE;

-- RLS Policies for multi-tenant isolation
ALTER TABLE wo_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates from their org
CREATE POLICY wo_templates_select_policy ON wo_templates
FOR SELECT
USING (org_id = current_setting('app.current_org_id')::INTEGER)

- idx_wo_templates_one_default_per_product ON (org_id, product_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS wo_templates (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  config_json JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_templates_unique_name_per_org UNIQUE (org_id, template_name),
  CONSTRAINT wo_templates_one_default_per_product CHECK (
    -- Only one default template per product per org
    -- This is enforced by a unique partial index below
    is_default IS NOT NULL
  )
);
```

</details>

---

### npd_projects

**Columns**:

| Column             | Type        | Constraints                                 |
| ------------------ | ----------- | ------------------------------------------- |
| id                 | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()      |
| org_id             | INTEGER     | NOT NULL                                    |
| project_number     | TEXT        | NOT NULL, UNIQUE                            |
| project_name       | TEXT        | NOT NULL                                    |
| description        | TEXT        | -                                           |
| status             | TEXT        | DEFAULT 'idea' CHECK (status IN ('idea'     |
| current_gate       | TEXT        | DEFAULT 'G0' CHECK (current_gate IN ('G0'   |
| priority           | TEXT        | DEFAULT 'medium' CHECK (priority IN ('high' |
| portfolio_category | TEXT        | -                                           |
| owner_id           | UUID        | REFERENCES users(id)                        |
| target_launch_date | DATE        | -                                           |
| created_at         | TIMESTAMPTZ | DEFAULT NOW()                               |
| updated_at         | TIMESTAMPTZ | DEFAULT NOW()                               |
| created_by         | UUID        | REFERENCES users(id)                        |
| updated_by         | UUID        | REFERENCES users(id)                        |

**Foreign Keys**:

- `owner_id` → `users.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_npd_projects_org_id_status ON (org_id, status)
- idx_npd_projects_owner ON (owner_id)
- idx_npd_projects_target_launch ON (target_launch_date)
- idx_npd_projects_number ON (project_number)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id INTEGER NOT NULL,
  project_number TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'concept', 'development', 'testing', 'on_hold', 'launched', 'cancelled')),
  current_gate TEXT DEFAULT 'G0' CHECK (current_gate IN ('G0', 'G1', 'G2', 'G3', 'G4', 'Launched')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  portfolio_category TEXT,
  owner_id UUID REFERENCES users(id),
  target_launch_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### npd_formulations

**Columns**:

| Column                | Type        | Constraints                               |
| --------------------- | ----------- | ----------------------------------------- |
| id                    | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()    |
| org_id                | INTEGER     | NOT NULL                                  |
| npd_project_id        | UUID        | NOT NULL, REFERENCES npd_projects(id)     |
| version               | TEXT        | NOT NULL                                  |
| effective_from        | DATE        | -                                         |
| effective_to          | DATE        | -                                         |
| status                | TEXT        | DEFAULT 'draft' CHECK (status IN ('draft' |
| locked_at             | TIMESTAMPTZ | -                                         |
| locked_by             | UUID        | REFERENCES users(id)                      |
| parent_formulation_id | UUID        | REFERENCES npd_formulations(id)           |
| created_at            | TIMESTAMPTZ | DEFAULT NOW()                             |
| updated_at            | TIMESTAMPTZ | DEFAULT NOW()                             |
| created_by            | UUID        | REFERENCES users(id)                      |
| updated_by            | UUID        | REFERENCES users(id)                      |

**Foreign Keys**:

- `npd_project_id` → `npd_projects.id`
- `locked_by` → `users.id`
- `parent_formulation_id` → `npd_formulations.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes**:

- idx_npd_formulations_org_id ON (org_id)
- idx_npd_formulations_project_id_version ON (npd_project_id, version)
- idx_npd_formulations_status ON (status)
- idx_npd_formulations_effective_dates ON (effective_from, effective_to)
- idx_npd_formulations_parent ON (parent_formulation_id)
- idx_npd_formulations_current ON (npd_project_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_formulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id INTEGER NOT NULL,
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  effective_from DATE,
  effective_to DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'superseded')),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  parent_formulation_id UUID REFERENCES npd_formulations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

</details>

---

### npd_formulation_items

**Columns**:

| Column             | Type          | Constraints                               |
| ------------------ | ------------- | ----------------------------------------- |
| id                 | UUID          | PRIMARY KEY, DEFAULT gen_random_uuid()    |
| npd_formulation_id | UUID          | NOT NULL, REFERENCES npd_formulations(id) |
| product_id         | INTEGER       | NOT NULL, REFERENCES products(id)         |
| qty                | NUMERIC(12,4) | NOT NULL                                  |
| uom                | TEXT          | NOT NULL                                  |
| sequence           | INTEGER       | -                                         |
| notes              | TEXT          | -                                         |
| created_at         | TIMESTAMPTZ   | DEFAULT NOW()                             |
| updated_at         | TIMESTAMPTZ   | DEFAULT NOW()                             |

**Foreign Keys**:

- `npd_formulation_id` → `npd_formulations.id`
- `product_id` → `products.id`

**Indexes**:

- idx_npd_formulation_items_formulation_id ON (npd_formulation_id)
- idx_npd_formulation_items_product_id ON (product_id)
- idx_npd_formulation_items_sequence ON (npd_formulation_id, sequence)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_formulation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_formulation_id UUID NOT NULL REFERENCES npd_formulations(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,4) NOT NULL CHECK (qty > 0),
  uom TEXT NOT NULL,
  sequence INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### npd_costing

**Columns**:

| Column         | Type          | Constraints                            |
| -------------- | ------------- | -------------------------------------- |
| id             | UUID          | PRIMARY KEY, DEFAULT gen_random_uuid() |
| npd_project_id | UUID          | NOT NULL, REFERENCES npd_projects(id)  |
| target_cost    | NUMERIC(15,4) | -                                      |
| estimated_cost | NUMERIC(15,4) | -                                      |
| actual_cost    | NUMERIC(15,4) | -                                      |
| variance_pct   | NUMERIC(8,2)  | -                                      |
| ELSE           | NULL          | -                                      |
| currency       | TEXT          | DEFAULT 'USD'                          |
| notes          | TEXT          | -                                      |
| created_at     | TIMESTAMPTZ   | DEFAULT NOW()                          |
| updated_at     | TIMESTAMPTZ   | DEFAULT NOW()                          |

**Foreign Keys**:

- `npd_project_id` → `npd_projects.id`

**Indexes**:

- idx_npd_costing_project_id ON (npd_project_id)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_costing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  target_cost NUMERIC(15,4),
  estimated_cost NUMERIC(15,4),
  actual_cost NUMERIC(15,4),
  variance_pct NUMERIC(8,2) GENERATED ALWAYS AS (
    CASE
      WHEN target_cost IS NOT NULL AND target_cost != 0
      THEN ((actual_cost - target_cost) / target_cost * 100)
      ELSE NULL
    END
  ) STORED,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### npd_risks

**Columns**:

| Column           | Type        | Constraints                             |
| ---------------- | ----------- | --------------------------------------- |
| id               | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()  |
| npd_project_id   | UUID        | NOT NULL, REFERENCES npd_projects(id)   |
| risk_description | TEXT        | NOT NULL                                |
| likelihood       | TEXT        | -                                       |
| impact           | TEXT        | -                                       |
| risk_score       | INTEGER     | -                                       |
| mitigation_plan  | TEXT        | -                                       |
| status           | TEXT        | DEFAULT 'open' CHECK (status IN ('open' |
| created_at       | TIMESTAMPTZ | DEFAULT NOW()                           |
| updated_at       | TIMESTAMPTZ | DEFAULT NOW()                           |

**Foreign Keys**:

- `npd_project_id` → `npd_projects.id`

**Indexes**:

- idx_npd_risks_project_id ON (npd_project_id)
- idx_npd_risks_score ON (risk_score DESC)
- idx_npd_risks_status ON (status)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  risk_description TEXT NOT NULL,
  likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')),
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  risk_score INTEGER GENERATED ALWAYS AS (
    (CASE likelihood
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END) *
    (CASE impact
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END)
  ) STORED,
  mitigation_plan TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'accepted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### npd_documents

**Columns**:

| Column         | Type        | Constraints                            |
| -------------- | ----------- | -------------------------------------- |
| id             | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() |
| org_id         | INTEGER     | NOT NULL                               |
| npd_project_id | UUID        | NOT NULL, REFERENCES npd_projects(id)  |
| file_name      | TEXT        | NOT NULL                               |
| file_type      | TEXT        | -                                      |
| file_path      | TEXT        | NOT NULL                               |
| version        | TEXT        | DEFAULT '1.0'                          |
| file_size      | BIGINT      | -                                      |
| mime_type      | TEXT        | -                                      |
| uploaded_by    | UUID        | REFERENCES users(id)                   |
| uploaded_at    | TIMESTAMPTZ | DEFAULT NOW()                          |
| created_at     | TIMESTAMPTZ | DEFAULT NOW()                          |
| updated_at     | TIMESTAMPTZ | DEFAULT NOW()                          |

**Foreign Keys**:

- `npd_project_id` → `npd_projects.id`
- `uploaded_by` → `users.id`

**Indexes**:

- idx_npd_documents_org_id ON (org_id)
- idx_npd_documents_project_id ON (npd_project_id)
- idx_npd_documents_file_type ON (file_type)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id INTEGER NOT NULL,
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_path TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

</details>

---

### npd_events

**Columns**:

| Column          | Type        | Constraints                                   |
| --------------- | ----------- | --------------------------------------------- |
| id              | BIGSERIAL   | PRIMARY KEY                                   |
| org_id          | INTEGER     | NOT NULL                                      |
| type            | TEXT        | NOT NULL                                      |
| payload         | JSONB       | NOT NULL                                      |
| status          | TEXT        | DEFAULT 'pending' CHECK (status IN ('pending' |
| retry_count     | INTEGER     | DEFAULT 0                                     |
| error_message   | TEXT        | -                                             |
| sequence_number | BIGSERIAL   | -                                             |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                 |
| processed_at    | TIMESTAMPTZ | -                                             |

**Indexes**:

- idx_npd_events_org_id ON (org_id)
- idx_npd_events_type ON (type)
- idx_npd_events_status ON (status)
- idx_npd_events_sequence ON (sequence_number)
- idx_npd_events_created_at ON (created_at)

<details>
<summary>SQL Definition</summary>

```sql
CREATE TABLE IF NOT EXISTS npd_events (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  sequence_number BIGSERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

</details>

---
