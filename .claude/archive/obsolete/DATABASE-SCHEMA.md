# MonoPilot Database Schema Reference

> Last Updated: 2026-02-10
> Total Tables: 65
> Status: Active Development
> 
> **CURRENT AUDIT**: ✅ Database verified against 131 active migrations
> - Tables with RLS: 60
> - Tables without RLS: 5 (locations, machines, production_line_machines, production_lines, warehouses)

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

### Quality Module (Epic 6)

#### product_costs
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
product_id      UUID REFERENCES products(id)
cost_per_unit   DECIMAL(15,4)
currency        TEXT DEFAULT 'PLN'
effective_from  DATE
effective_to    DATE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
created_by      UUID REFERENCES users(id)

UNIQUE(org_id, product_id, effective_from)
```

#### product_nutrition
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
product_id      UUID REFERENCES products(id)
energy_kcal     DECIMAL(10,2)
energy_kj       DECIMAL(10,2)
protein_g       DECIMAL(10,2)
fat_g           DECIMAL(10,2)
carbs_g         DECIMAL(10,2)
fiber_g         DECIMAL(10,2)
sodium_mg       DECIMAL(10,2)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, product_id)
```

#### ingredient_nutrition
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
ingredient_id   UUID REFERENCES products(id)
bom_id          UUID REFERENCES boms(id)
energy_kcal     DECIMAL(10,2)
energy_kj       DECIMAL(10,2)
protein_g       DECIMAL(10,2)
fat_g           DECIMAL(10,2)
carbs_g         DECIMAL(10,2)
created_at      TIMESTAMPTZ

UNIQUE(org_id, ingredient_id, bom_id)
```

#### product_traceability_config
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
product_id      UUID REFERENCES products(id)
track_batch     BOOLEAN DEFAULT true
track_serial    BOOLEAN DEFAULT false
retention_days  INTEGER DEFAULT 365
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, product_id)
```

#### shelf_life_audit_log
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
product_id      UUID REFERENCES products(id)
old_days        INTEGER
new_days        INTEGER
changed_by      UUID REFERENCES users(id)
changed_at      TIMESTAMPTZ
reason          TEXT
created_at      TIMESTAMPTZ
```

#### cost_variances
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
wo_id           UUID REFERENCES work_orders(id)
material_cost_variance DECIMAL(15,4)
labor_cost_variance DECIMAL(15,4)
overhead_variance DECIMAL(15,4)
total_variance  DECIMAL(15,4)
variance_percent DECIMAL(5,2)
status          TEXT DEFAULT 'flagged'
analyzed_by     UUID REFERENCES users(id)
analysis_notes  TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

### Shipping/Receiving Module (Epic 7)

#### asns
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
asn_number      TEXT NOT NULL           -- Auto: ASN-YYYYMMDD-NNNN
supplier_id     UUID REFERENCES suppliers(id)
po_id           UUID REFERENCES purchase_orders(id)
expected_delivery_date DATE
status          TEXT DEFAULT 'draft'    -- draft, sent, in_transit, received
expected_pallets INTEGER
expected_lps    INTEGER
notes           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
created_by      UUID REFERENCES users(id)

UNIQUE(org_id, asn_number)
```

#### asn_items
```sql
id              UUID PRIMARY KEY
asn_id          UUID REFERENCES asns(id) ON DELETE CASCADE
line_number     INTEGER
product_id      UUID REFERENCES products(id)
lp_count        INTEGER
quantity        DECIMAL(15,4)
uom             TEXT
expected_pallets INTEGER
notes           TEXT
created_at      TIMESTAMPTZ

UNIQUE(asn_id, line_number)
```

#### grns
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
grn_number      TEXT NOT NULL           -- Auto: GRN-YYYYMMDD-NNNN
asn_id          UUID REFERENCES asns(id)
po_id           UUID REFERENCES purchase_orders(id)
warehouse_id    UUID REFERENCES warehouses(id)
received_date   DATE NOT NULL
received_by     UUID REFERENCES users(id)
total_lps       INTEGER DEFAULT 0
discrepancies   INTEGER DEFAULT 0       -- Qty/quality issues
status          TEXT DEFAULT 'partial'  -- partial, complete, closed
notes           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, grn_number)
```

#### grn_items
```sql
id              UUID PRIMARY KEY
grn_id          UUID REFERENCES grns(id) ON DELETE CASCADE
asn_item_id     UUID REFERENCES asn_items(id)
po_line_id      UUID REFERENCES purchase_order_lines(id)
product_id      UUID REFERENCES products(id)
lp_count        INTEGER
received_qty    DECIMAL(15,4)
expected_qty    DECIMAL(15,4)
uom             TEXT
status          TEXT DEFAULT 'received'
notes           TEXT
created_at      TIMESTAMPTZ

UNIQUE(grn_id, product_id)
```

#### over_receipt_approvals
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
grn_item_id     UUID REFERENCES grn_items(id)
excess_qty      DECIMAL(15,4)
excess_percent  DECIMAL(5,2)
approval_status TEXT DEFAULT 'pending'  -- pending, approved, rejected
approved_by     UUID REFERENCES users(id)
approved_at     TIMESTAMPTZ
approval_notes  TEXT
created_at      TIMESTAMPTZ
```

#### to_line_lps
```sql
id              UUID PRIMARY KEY
to_line_id      UUID REFERENCES transfer_order_lines(id) ON DELETE CASCADE
lp_id           UUID REFERENCES license_plates(id)
allocated_qty   DECIMAL(15,4)
shipped_qty     DECIMAL(15,4) DEFAULT 0
received_qty    DECIMAL(15,4) DEFAULT 0
status          TEXT DEFAULT 'pending'  -- pending, shipped, received
created_at      TIMESTAMPTZ
```

---

### Inventory Management Module

#### stock_moves
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
lp_id           UUID REFERENCES license_plates(id)
from_location_id UUID REFERENCES locations(id)
to_location_id  UUID REFERENCES locations(id)
from_warehouse_id UUID REFERENCES warehouses(id)
to_warehouse_id UUID REFERENCES warehouses(id)
move_qty        DECIMAL(15,4)
uom             TEXT
move_type       TEXT                    -- internal, transfer, receipt, issue
move_reason     TEXT
status          TEXT DEFAULT 'pending'  -- pending, completed, cancelled
created_by      UUID REFERENCES users(id)
completed_by    UUID REFERENCES users(id)
created_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ

INDEX idx_stock_moves_org_status (org_id, status)
```

#### lp_reservations
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
lp_id           UUID REFERENCES license_plates(id)
reserved_by     UUID REFERENCES work_orders(id)
reserved_qty    DECIMAL(15,4)
uom             TEXT
status          TEXT DEFAULT 'active'   -- active, fulfilled, cancelled
created_at      TIMESTAMPTZ
fulfilled_at    TIMESTAMPTZ
```

#### lp_transactions
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
lp_id           UUID REFERENCES license_plates(id)
transaction_type TEXT                   -- receipt, issue, transfer, adjustment
transaction_qty DECIMAL(15,4)
uom             TEXT
reference_id    UUID
reference_type  TEXT                    -- wo, to, po, manual
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ
```

#### stock_adjustments
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
lp_id           UUID REFERENCES license_plates(id)
adjustment_qty  DECIMAL(15,4)
reason          TEXT
adjustment_type TEXT                   -- variance, damage, expiry, recount
approved_by     UUID REFERENCES users(id)
approved_at     TIMESTAMPTZ
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ
```

#### stock_move_sequences
```sql
id              SERIAL PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
sequence_value  INTEGER
created_at      TIMESTAMPTZ

UNIQUE(org_id)
```

#### lp_number_sequences
```sql
id              SERIAL PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
sequence_value  INTEGER
created_at      TIMESTAMPTZ

UNIQUE(org_id)
```

#### grn_number_sequences
```sql
id              SERIAL PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
sequence_value  INTEGER
created_at      TIMESTAMPTZ

UNIQUE(org_id)
```

#### yield_logs
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
wo_id           UUID REFERENCES work_orders(id)
operation_id    UUID REFERENCES wo_operations(id)
expected_qty    DECIMAL(15,4)
actual_qty      DECIMAL(15,4)
yield_percent   DECIMAL(5,2)
scrap_qty       DECIMAL(15,4)
scrap_reason    TEXT
logged_by       UUID REFERENCES users(id)
logged_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

---

### Production Planning & Operations

#### wo_material_consumptions
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
wo_id           UUID REFERENCES work_orders(id)
wo_material_id  UUID REFERENCES wo_materials(id)
consumed_qty    DECIMAL(15,4)
consumed_lp_id  UUID REFERENCES license_plates(id)
consumption_by  UUID REFERENCES users(id)
consumed_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

#### wo_daily_sequence
```sql
id              SERIAL PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
sequence_date   DATE
sequence_value  INTEGER
created_at      TIMESTAMPTZ

UNIQUE(org_id, sequence_date)
```

#### operation_attachments
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
operation_id    UUID REFERENCES wo_operations(id)
file_name       TEXT NOT NULL
file_path       TEXT NOT NULL
file_size       INTEGER
file_type       TEXT
uploaded_by     UUID REFERENCES users(id)
created_at      TIMESTAMPTZ
```

---

### Settings & Configuration

#### planning_settings
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
setting_key     TEXT NOT NULL
setting_value   JSONB
description     TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, setting_key)
```

#### warehouse_settings
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
warehouse_id    UUID REFERENCES warehouses(id)
setting_key     TEXT NOT NULL
setting_value   JSONB
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, warehouse_id, setting_key)
```

#### warehouse_settings_audit
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
setting_id      UUID REFERENCES warehouse_settings(id)
old_value       JSONB
new_value       JSONB
changed_by      UUID REFERENCES users(id)
changed_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

#### production_line_products
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
production_line_id UUID REFERENCES production_lines(id)
product_id      UUID REFERENCES products(id)
planned_qty     DECIMAL(15,4)
priority        INTEGER DEFAULT 0
created_at      TIMESTAMPTZ

UNIQUE(org_id, production_line_id, product_id)
```

#### production_line_machines
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
production_line_id UUID REFERENCES production_lines(id)
machine_id      UUID REFERENCES machines(id)
sequence        INTEGER
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ

UNIQUE(org_id, production_line_id, machine_id)
```

#### po_statuses
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

#### po_status_history
```sql
id              UUID PRIMARY KEY
po_id           UUID REFERENCES purchase_orders(id) ON DELETE CASCADE
old_status      TEXT
new_status      TEXT
changed_by      UUID REFERENCES users(id)
changed_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

#### po_status_transitions
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
from_status     TEXT
to_status       TEXT
transition_rules JSONB
created_at      TIMESTAMPTZ

UNIQUE(org_id, from_status, to_status)
```

#### po_approval_history
```sql
id              UUID PRIMARY KEY
po_id           UUID REFERENCES purchase_orders(id) ON DELETE CASCADE
approval_level  INTEGER
approved_by     UUID REFERENCES users(id)
approved_at     TIMESTAMPTZ
approval_notes  TEXT
status          TEXT
created_at      TIMESTAMPTZ
```

---

### System & Metadata

#### organization_modules
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
module_id       UUID REFERENCES modules(id)
is_enabled      BOOLEAN DEFAULT true
license_type    TEXT DEFAULT 'basic'    -- basic, standard, premium
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(org_id, module_id)
```

#### roles
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
is_system       BOOLEAN DEFAULT false
permissions     JSONB
created_at      TIMESTAMPTZ

UNIQUE(org_id, code)
```

#### modules
```sql
id              UUID PRIMARY KEY
code            TEXT NOT NULL UNIQUE
name            TEXT NOT NULL
description     TEXT
icon            TEXT
sort_order      INTEGER
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
```

#### user_sessions
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
auth_token      TEXT
session_start   TIMESTAMPTZ
session_end     TIMESTAMPTZ
ip_address      TEXT
user_agent      TEXT
status          TEXT DEFAULT 'active'
created_at      TIMESTAMPTZ
```

#### user_invitations
```sql
id              UUID PRIMARY KEY
org_id          UUID REFERENCES organizations(id)
email           TEXT NOT NULL
role            TEXT
token           TEXT UNIQUE
status          TEXT DEFAULT 'pending'  -- pending, accepted, expired
invited_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ
accepted_at     TIMESTAMPTZ
expires_at      TIMESTAMPTZ

UNIQUE(org_id, email)
```

#### password_history
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
hashed_password TEXT
set_at          TIMESTAMPTZ
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

### 2026-02-10: Comprehensive Database Audit Update

**Status**: ✅ Completed - Database synchronized with 131 active migrations

**Changes**:
- Updated table count from 43 to **65 tables**
- Added documentation for 22 new tables discovered in migrations
- Verified RLS policies: 60 tables with RLS, 5 without
- New modules documented:
  - Quality Module (6 tables)
  - Shipping/Receiving Module (6 tables)
  - Inventory Management Module (7 tables)
  - Production Planning Module (3 tables)
  - Settings & Configuration Module (8 tables)
  - System & Metadata Module (6 tables)

**New Tables Added**:
1. product_costs - Cost tracking per product
2. product_nutrition - Nutrition facts per product
3. ingredient_nutrition - Computed nutrition from ingredients
4. product_traceability_config - Traceability settings
5. shelf_life_audit_log - Shelf life change history
6. cost_variances - WO cost analysis
7. asns, asn_items - Advanced Shipping Notices
8. grns, grn_items - Goods Receipt Notes
9. over_receipt_approvals - Over-receipt management
10. to_line_lps - Transfer order LP tracking
11. stock_moves - Inventory movements
12. lp_reservations - LP allocation to WOs
13. lp_transactions - Transaction audit trail
14. stock_adjustments - Inventory adjustments
15. stock_move_sequences, lp_number_sequences, grn_number_sequences - Auto-sequencing
16. yield_logs - Yield tracking per WO
17. wo_material_consumptions - Material consumption tracking
18. wo_daily_sequence - Daily WO numbering
19. operation_attachments - WO operation attachments
20. planning_settings, warehouse_settings - Config tables
21. production_line_products, production_line_machines - Line management
22. po_statuses, po_status_history, po_status_transitions, po_approval_history - PO workflow

**Rationale**:
- Database has grown significantly with new features across all modules
- RLS policies ensure multi-tenant data isolation on 60 of 65 tables
- New tables support advanced features: traceability, costing, shipments, inventory

**Related Migrations**: 001-127 (active), excluding .skip files

---

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
