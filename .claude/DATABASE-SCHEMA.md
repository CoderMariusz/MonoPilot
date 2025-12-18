# MonoPilot Database Schema Reference

> Last Updated: 2025-12-14
> Total Tables: 43
> Status: Active Development

## Overview

This document provides a quick reference for the MonoPilot database schema, organized by module. For detailed architecture, see module-specific docs in `docs/1-BASELINE/architecture/modules/`.

---

## Core Tables by Module

### Settings Module (Epic 1)

#### organizations
```sql
id                  UUID PRIMARY KEY
name                TEXT NOT NULL
subdomain           TEXT UNIQUE
status              TEXT DEFAULT 'active'
created_at          TIMESTAMPTZ
```

#### users
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
email               TEXT UNIQUE
role                TEXT
created_at          TIMESTAMPTZ
```

#### allergens
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
code                TEXT NOT NULL
name                TEXT NOT NULL
is_active           BOOLEAN DEFAULT true
UNIQUE(org_id, code)
```

#### tax_codes
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
code                TEXT NOT NULL
rate                DECIMAL(5,2)
description         TEXT
UNIQUE(org_id, code)
```

#### warehouses
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
code                TEXT NOT NULL
name                TEXT NOT NULL
warehouse_type      TEXT
is_active           BOOLEAN DEFAULT true
UNIQUE(org_id, code)
```

#### production_lines
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
code                TEXT NOT NULL
name                TEXT NOT NULL
warehouse_id        UUID REFERENCES warehouses(id)
is_active           BOOLEAN DEFAULT true
UNIQUE(org_id, code)
```

#### machines
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
code                TEXT NOT NULL
name                TEXT NOT NULL
production_line_id  UUID REFERENCES production_lines(id)
is_active           BOOLEAN DEFAULT true
UNIQUE(org_id, code)
```

---

### Technical Module (Epic 2)

#### products
```sql
id                      UUID PRIMARY KEY
org_id                  UUID REFERENCES organizations(id)
code                    TEXT NOT NULL              -- Immutable SKU
name                    TEXT NOT NULL
description             TEXT
product_type_id         UUID REFERENCES product_types(id)
uom                     TEXT NOT NULL              -- kg, L, pcs
status                  TEXT DEFAULT 'active'
version                 INTEGER DEFAULT 1
barcode                 TEXT
gtin                    TEXT                       -- GS1 GTIN-14
category_id             UUID
-- Procurement fields (MOVED FROM suppliers)
lead_time_days          INTEGER DEFAULT 7          -- Procurement lead time
moq                     DECIMAL(10,2)              -- Minimum order quantity
-- Costing fields
expiry_policy           TEXT DEFAULT 'none'        -- fixed, rolling, none
shelf_life_days         INTEGER
std_price               DECIMAL(15,4)              -- Standard selling price
cost_per_unit           DECIMAL(15,4)              -- Production cost
min_stock               DECIMAL(15,4)
max_stock               DECIMAL(15,4)
storage_conditions      TEXT
is_perishable           BOOLEAN DEFAULT false
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
created_by              UUID REFERENCES users(id)
updated_by              UUID REFERENCES users(id)

UNIQUE(org_id, code)
CHECK (expiry_policy IN ('fixed', 'rolling', 'none'))
CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0)
```

**SCHEMA CHANGE (2025-12-14):**
- **ADDED**: `lead_time_days` - procurement lead time (default 7 days)
- **ADDED**: `moq` - minimum order quantity
- **RATIONALE**: Lead time and MOQ are product-specific, not supplier-specific. Enables per-product procurement control.

#### product_types
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
is_default      BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
UNIQUE(org_id, code)
```

#### product_allergens
```sql
id              UUID PRIMARY KEY
product_id      UUID REFERENCES products(id) ON DELETE CASCADE
allergen_id     UUID REFERENCES allergens(id)
relation_type   TEXT NOT NULL              -- contains, may_contain
created_at      TIMESTAMPTZ
UNIQUE(product_id, allergen_id)
```

#### product_version_history
```sql
id              UUID PRIMARY KEY
product_id      UUID REFERENCES products(id)
version         INTEGER NOT NULL
changed_fields  JSONB NOT NULL             -- {field: {old, new}}
changed_by      UUID REFERENCES users(id)
changed_at      TIMESTAMPTZ
```

#### product_shelf_life
```sql
id                      UUID PRIMARY KEY
org_id                  UUID REFERENCES organizations(id) ON DELETE CASCADE
product_id              UUID REFERENCES products(id) ON DELETE CASCADE
calculated_days         INTEGER                -- From min(ingredient shelf lives)
override_days           INTEGER                -- User manual override
final_days              INTEGER NOT NULL       -- Used value (override ?? calculated)
calculation_method      TEXT                   -- manual, auto_min_ingredients
shortest_ingredient_id  UUID REFERENCES products(id)
storage_conditions      TEXT
calculated_at           TIMESTAMPTZ DEFAULT now()
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
created_by              UUID REFERENCES auth.users(id)

UNIQUE(org_id, product_id)
CHECK (calculated_days IS NULL OR calculated_days > 0)
CHECK (override_days IS NULL OR override_days > 0)
CHECK (final_days > 0)
```

#### boms
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
product_id      UUID REFERENCES products(id)
version         INTEGER DEFAULT 1
bom_type        TEXT DEFAULT 'standard'    -- standard, engineering, costing
routing_id      UUID REFERENCES routings(id) ON DELETE SET NULL
effective_from  DATE NOT NULL
effective_to    DATE                       -- NULL = no end date
status          TEXT DEFAULT 'draft'       -- draft, active, inactive
output_qty      DECIMAL(15,4) DEFAULT 1
output_uom      TEXT NOT NULL
units_per_box   INTEGER
boxes_per_pallet INTEGER
notes           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
created_by      UUID REFERENCES users(id)
updated_by      UUID REFERENCES users(id)
```

**SCHEMA RELATIONSHIP:**
- **BOM has default routing**: `routing_id` links to `routings(id)`
- **WO inherits routing from BOM**: When Work Order is created, it uses BOM's routing_id
- **Routing snapshot**: WO captures full routing at creation (immutable)

#### bom_items
```sql
id              UUID PRIMARY KEY
bom_id          UUID REFERENCES boms(id) ON DELETE CASCADE
product_id      UUID REFERENCES products(id)
operation_seq   INTEGER
is_output       BOOLEAN DEFAULT false
quantity        DECIMAL(15,6) NOT NULL
uom             TEXT NOT NULL
sequence        INTEGER DEFAULT 0
line_ids        UUID[]
scrap_percent   DECIMAL(5,2) DEFAULT 0
consume_whole_lp BOOLEAN DEFAULT false
is_by_product   BOOLEAN DEFAULT false
yield_percent   DECIMAL(5,2)
condition_flags JSONB
notes           TEXT
created_at      TIMESTAMPTZ

CHECK (quantity > 0)
```

#### bom_alternatives
```sql
id                      UUID PRIMARY KEY
bom_item_id             UUID REFERENCES bom_items(id) ON DELETE CASCADE
org_id                  UUID REFERENCES organizations(id)
alternative_product_id  UUID REFERENCES products(id)
quantity                DECIMAL(15,6) NOT NULL
uom                     TEXT NOT NULL
preference_order        INTEGER DEFAULT 0
notes                   TEXT
created_at              TIMESTAMPTZ
```

#### routings
```sql
id                      UUID PRIMARY KEY
org_id                  UUID REFERENCES organizations(id)
code                    VARCHAR(50) NOT NULL       -- Unique identifier (e.g., RTG-BREAD-01)
name                    TEXT NOT NULL
description             TEXT
version                 INTEGER DEFAULT 1
is_active               BOOLEAN DEFAULT true
is_reusable             BOOLEAN DEFAULT true       -- Can be shared across products
-- Routing-level cost fields (ADR-009)
setup_cost              DECIMAL(10,2) DEFAULT 0    -- Fixed cost per routing run
working_cost_per_unit   DECIMAL(10,4) DEFAULT 0    -- Variable cost per output unit
overhead_percent        DECIMAL(5,2) DEFAULT 0     -- Overhead % on subtotal
currency                TEXT DEFAULT 'PLN'
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
created_by              UUID REFERENCES users(id)

UNIQUE(org_id, code)
UNIQUE(org_id, name, version)
```

#### routing_operations
```sql
id                  UUID PRIMARY KEY
routing_id          UUID REFERENCES routings(id) ON DELETE CASCADE
sequence            INTEGER NOT NULL
name                TEXT NOT NULL
description         TEXT
machine_id          UUID REFERENCES machines(id)
duration            INTEGER                    -- Run time minutes
setup_time          INTEGER DEFAULT 0          -- Setup time minutes
cleanup_time        INTEGER DEFAULT 0          -- Cleanup time minutes
labor_cost_per_hour DECIMAL(15,4)
instructions        TEXT                       -- Max 2000 chars
created_at          TIMESTAMPTZ

UNIQUE(routing_id, sequence)
```

#### traceability_links
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
parent_lot_id   UUID NOT NULL
child_lot_id    UUID
work_order_id   UUID REFERENCES work_orders(id)
quantity_consumed DECIMAL(15,4)
unit            TEXT
operation_id    UUID
consumed_at     TIMESTAMPTZ DEFAULT now()
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### Planning Module (Epic 3)

#### suppliers
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
code                VARCHAR(50) NOT NULL
name                VARCHAR(255) NOT NULL
contact_person      VARCHAR(255)
email               VARCHAR(255)
phone               VARCHAR(50)
address             TEXT
city                VARCHAR(100)
postal_code         VARCHAR(20)
country             VARCHAR(2)              -- ISO 3166-1 alpha-2
currency            VARCHAR(3) NOT NULL     -- PLN, EUR, USD, GBP
tax_code_id         UUID REFERENCES tax_codes(id)
payment_terms       VARCHAR(100) NOT NULL
-- REMOVED: lead_time_days (moved to products)
-- REMOVED: moq (moved to products)
is_active           BOOLEAN DEFAULT true
created_by          UUID REFERENCES users(id)
updated_by          UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
CHECK (code ~ '^[A-Z0-9-]+$')
CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'))
CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

**SCHEMA CHANGE (2025-12-14):**
- **REMOVED**: `lead_time_days INTEGER` - moved to products table
- **REMOVED**: `moq DECIMAL(15,3)` - moved to products table
- **RATIONALE**: Lead time and MOQ are product-specific, not supplier-specific

#### supplier_products
```sql
id                  UUID PRIMARY KEY
supplier_id         UUID REFERENCES suppliers(id) ON DELETE CASCADE
product_id          UUID REFERENCES products(id)
is_default          BOOLEAN DEFAULT false
supplier_product_code TEXT
-- NOTE: lead_time_days override removed (use products.lead_time_days)
unit_price          DECIMAL(15,4)
currency            TEXT
-- NOTE: moq override removed (use products.moq)
order_multiple      DECIMAL(15,4)
last_purchase_date  DATE
last_purchase_price DECIMAL(15,4)
notes               TEXT
created_at          TIMESTAMPTZ

UNIQUE(supplier_id, product_id)
```

#### purchase_orders
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
po_number           TEXT NOT NULL           -- Auto: PO-YYYY-NNNNN
supplier_id         UUID REFERENCES suppliers(id)
currency            TEXT NOT NULL
tax_code_id         UUID REFERENCES tax_codes(id)
expected_delivery_date DATE NOT NULL
warehouse_id        UUID REFERENCES warehouses(id)
status              TEXT DEFAULT 'draft'
payment_terms       TEXT
shipping_method     TEXT
notes               TEXT
internal_notes      TEXT
approval_status     TEXT
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMPTZ
approval_notes      TEXT
subtotal            DECIMAL(15,4)
tax_amount          DECIMAL(15,4)
total               DECIMAL(15,4)
discount_total      DECIMAL(15,4)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
created_by          UUID REFERENCES users(id)
updated_by          UUID REFERENCES users(id)

UNIQUE(org_id, po_number)
```

#### purchase_order_lines
```sql
id                  UUID PRIMARY KEY
po_id               UUID REFERENCES purchase_orders(id) ON DELETE CASCADE
line_number         INTEGER NOT NULL
product_id          UUID REFERENCES products(id)
quantity            DECIMAL(15,4) NOT NULL
uom                 TEXT NOT NULL
unit_price          DECIMAL(15,4) NOT NULL
discount_percent    DECIMAL(5,2) DEFAULT 0
discount_amount     DECIMAL(15,4)
line_total          DECIMAL(15,4)
expected_delivery_date DATE
confirmed_delivery_date DATE
received_qty        DECIMAL(15,4) DEFAULT 0
notes               TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ

UNIQUE(po_id, line_number)
```

#### transfer_orders
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
to_number           TEXT NOT NULL           -- Auto: TO-YYYY-NNNNN
from_warehouse_id   UUID REFERENCES warehouses(id)
to_warehouse_id     UUID REFERENCES warehouses(id)
planned_ship_date   DATE NOT NULL
planned_receive_date DATE NOT NULL
actual_ship_date    DATE
actual_receive_date DATE
status              TEXT DEFAULT 'draft'
priority            TEXT DEFAULT 'normal'
notes               TEXT
shipped_by          UUID REFERENCES users(id)
received_by         UUID REFERENCES users(id)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, to_number)
```

#### transfer_order_lines
```sql
id              UUID PRIMARY KEY
to_id           UUID REFERENCES transfer_orders(id) ON DELETE CASCADE
line_number     INTEGER NOT NULL
product_id      UUID REFERENCES products(id)
quantity        DECIMAL(15,4) NOT NULL
uom             TEXT NOT NULL
shipped_qty     DECIMAL(15,4) DEFAULT 0
received_qty    DECIMAL(15,4) DEFAULT 0
notes           TEXT
created_at      TIMESTAMPTZ

UNIQUE(to_id, line_number)
```

#### work_orders
```sql
id                  UUID PRIMARY KEY
org_id              UUID REFERENCES organizations(id)
wo_number           TEXT NOT NULL           -- Auto: WO-YYYYMMDD-NNNN
product_id          UUID REFERENCES products(id)
bom_id              UUID REFERENCES boms(id)
routing_id          UUID REFERENCES routings(id)  -- Inherited from BOM
planned_quantity    DECIMAL(15,4) NOT NULL
produced_quantity   DECIMAL(15,4) DEFAULT 0
uom                 TEXT NOT NULL
status              TEXT DEFAULT 'draft'
planned_start_date  DATE
planned_end_date    DATE
scheduled_start_time TIME
scheduled_end_time  TIME
production_line_id  UUID REFERENCES production_lines(id)
machine_id          UUID REFERENCES machines(id)
priority            TEXT DEFAULT 'normal'
source_of_demand    TEXT
source_reference    TEXT
expiry_date         DATE
notes               TEXT
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
paused_at           TIMESTAMPTZ
pause_reason        TEXT
actual_qty          DECIMAL(15,4)
yield_percent       DECIMAL(5,2)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, wo_number)
```

**RELATIONSHIP NOTE:**
- WO inherits `routing_id` from BOM (not directly from product)
- WO creation captures BOM snapshot (including routing operations)
- Routing snapshot is immutable once WO is created

#### wo_materials
```sql
id              UUID PRIMARY KEY
wo_id           UUID REFERENCES work_orders(id) ON DELETE CASCADE
organization_id UUID REFERENCES organizations(id)
product_id      UUID REFERENCES products(id)
material_name   TEXT NOT NULL
required_qty    DECIMAL(15,6) NOT NULL
consumed_qty    DECIMAL(15,6) DEFAULT 0
reserved_qty    DECIMAL(15,6) DEFAULT 0
uom             TEXT NOT NULL
sequence        INTEGER DEFAULT 0
consume_whole_lp BOOLEAN DEFAULT false
is_by_product   BOOLEAN DEFAULT false
yield_percent   DECIMAL(5,2)
scrap_percent   DECIMAL(5,2) DEFAULT 0
condition_flags JSONB
bom_item_id     UUID
bom_version     INTEGER
notes           TEXT
created_at      TIMESTAMPTZ
```

#### wo_operations
```sql
id                  UUID PRIMARY KEY
wo_id               UUID REFERENCES work_orders(id) ON DELETE CASCADE
organization_id     UUID REFERENCES organizations(id)
sequence            INTEGER NOT NULL
operation_name      TEXT NOT NULL
machine_id          UUID REFERENCES machines(id)
line_id             UUID REFERENCES production_lines(id)
expected_duration_minutes INTEGER
expected_yield_percent DECIMAL(5,2)
actual_duration_minutes INTEGER
actual_yield_percent DECIMAL(5,2)
status              TEXT DEFAULT 'pending'
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
started_by          UUID REFERENCES users(id)
completed_by        UUID REFERENCES users(id)
notes               TEXT
created_at          TIMESTAMPTZ

UNIQUE(wo_id, sequence)
```

---

### Warehouse Module (Epic 5)

#### license_plates
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
lp_number       TEXT NOT NULL           -- Auto: LP-YYYYMMDD-NNNNNN
product_id      UUID REFERENCES products(id)
lot_number      TEXT NOT NULL
quantity        DECIMAL(15,4) NOT NULL
uom             TEXT NOT NULL
warehouse_id    UUID REFERENCES warehouses(id)
location_id     UUID REFERENCES locations(id)
status          TEXT DEFAULT 'available'
received_date   DATE NOT NULL
expiry_date     DATE
sscc            TEXT                    -- GS1 SSCC-18
parent_lp_id    UUID REFERENCES license_plates(id)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, lp_number)
```

---

## Key Indexes

```sql
-- Performance indexes (critical)
CREATE INDEX idx_products_org_code ON products(org_id, code);
CREATE INDEX idx_products_org_type ON products(org_id, product_type_id);
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_routing_id ON boms(routing_id);
CREATE INDEX idx_routings_org_code ON routings(org_id, code);
CREATE INDEX idx_suppliers_org_active ON suppliers(org_id, is_active);
CREATE INDEX idx_po_org_status ON purchase_orders(org_id, status);
CREATE INDEX idx_wo_org_status ON work_orders(org_id, status);
CREATE INDEX idx_lp_org_product ON license_plates(org_id, product_id);
```

---

## Schema Change Log

### 2025-12-14: Move Lead Time and MOQ to Products

**Affected Tables:**
- `suppliers` - REMOVED: `lead_time_days`, `moq`
- `products` - ADDED: `lead_time_days INTEGER DEFAULT 7`, `moq DECIMAL(10,2)`

**Migration:** (To be created)
```sql
-- Migration: 052_move_lead_time_moq_to_products.sql
ALTER TABLE products ADD COLUMN lead_time_days INTEGER DEFAULT 7;
ALTER TABLE products ADD COLUMN moq DECIMAL(10,2);
ALTER TABLE suppliers DROP COLUMN lead_time_days;
ALTER TABLE suppliers DROP COLUMN moq;
```

**Rationale:**
- Lead time is product-specific, not supplier-specific
- MOQ varies by product SKU, not by supplier
- Enables per-product procurement planning

**Related ADR:** ADR-010-product-level-procurement-fields.md

---

## Related Documents

- Architecture: `docs/1-BASELINE/architecture/modules/`
- PRD Modules: `docs/1-BASELINE/product/modules/`
- ADRs: `docs/1-BASELINE/architecture/decisions/`
- Migrations: `supabase/migrations/`
