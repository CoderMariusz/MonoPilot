# Database Tables Reference

**Last Updated:** 2026-01-23
**Total Tables:** 80+ tables (37 new from migrations 131-144)
**Database:** PostgreSQL (Supabase)
**Schema:** public

---

## Table of Contents

1. [Settings Module (Epic 01)](#settings-module-epic-01)
2. [Technical Module (Epic 02)](#technical-module-epic-02)
3. [Planning Module (Epic 03)](#planning-module-epic-03)
4. [Production Module (Epic 04)](#production-module-epic-04)
5. [Warehouse Module (Epic 05)](#warehouse-module-epic-05)
6. [Quality Module (Epic 06) - NEW](#quality-module-epic-06)
7. [Shipping Module (Epic 07) - NEW](#shipping-module-epic-07)
8. [Common Tables](#common-tables)

---

## Settings Module (Epic 01)

### organizations
**Purpose:** Organization master records (multi-tenant)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Organization ID |
| name | TEXT | NOT NULL | Organization name |
| slug | TEXT | UNIQUE | URL-friendly identifier |
| logo_url | TEXT | | Organization logo |
| settings | JSONB | | Organization settings JSON |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**RLS:** Enabled (users can only see their own org)
**Indexes:** slug, is_active

---

### users
**Purpose:** User accounts with role-based access

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | User ID (from auth.users) |
| org_id | UUID | FK → organizations | Organization |
| role_id | UUID | FK → roles | User role |
| email | TEXT | UNIQUE | Email address |
| name | TEXT | NOT NULL | Full name |
| is_active | BOOLEAN | DEFAULT true | Active status |
| preferences | JSONB | | User preferences |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, role_id, email, is_active

---

### roles
**Purpose:** Role definitions (owner, admin, manager, operator, viewer)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Role ID |
| code | TEXT | UNIQUE | Role code |
| name | TEXT | NOT NULL | Role display name |
| permissions | JSONB | | Role permissions |
| is_system | BOOLEAN | DEFAULT false | System role flag |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Disabled (shared across orgs)
**Indexes:** code

---

### allergens
**Purpose:** Allergen definitions (FDA 14 + EU 14)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Allergen ID |
| code | TEXT | UNIQUE | Allergen code |
| name | TEXT | NOT NULL | Allergen name |
| category | TEXT | | Allergen category |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Disabled (shared)
**Indexes:** code

---

### tax_codes
**Purpose:** Tax codes per organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Tax code ID |
| org_id | UUID | FK → organizations | Organization |
| code | TEXT | NOT NULL | Tax code |
| name | TEXT | NOT NULL | Tax name |
| rate | DECIMAL(5,2) | NOT NULL | Tax rate % |
| is_default | BOOLEAN | DEFAULT false | Default tax |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, code
**Unique:** (org_id, code)

---

### locations
**Purpose:** Warehouse locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Location ID |
| org_id | UUID | FK → organizations | Organization |
| warehouse_id | UUID | FK → warehouses | Warehouse |
| code | TEXT | NOT NULL | Location code |
| name | TEXT | NOT NULL | Location name |
| location_type | TEXT | NOT NULL | rack/bin/floor/staging |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, warehouse_id, code

---

### machines
**Purpose:** Production machines/equipment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Machine ID |
| org_id | UUID | FK → organizations | Organization |
| code | TEXT | NOT NULL | Machine code |
| name | TEXT | NOT NULL | Machine name |
| machine_type | TEXT | | Machine type |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, code

---

### production_lines
**Purpose:** Production lines

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Line ID |
| org_id | UUID | FK → organizations | Organization |
| code | TEXT | NOT NULL | Line code |
| name | TEXT | NOT NULL | Line name |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, code

---

## Technical Module (Epic 02)

### products
**Purpose:** Product master records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Product ID |
| org_id | UUID | FK → organizations | Organization |
| product_code | TEXT | NOT NULL | Product code |
| name | TEXT | NOT NULL | Product name |
| product_type | TEXT | NOT NULL | raw/wip/finished |
| gtin | TEXT | | GTIN-14 barcode |
| shelf_life_days | INTEGER | | Shelf life |
| allergens | UUID[] | | Allergen IDs |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, product_code, product_type, gtin
**Unique:** (org_id, product_code)

---

### boms
**Purpose:** Bill of Materials

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | BOM ID |
| org_id | UUID | FK → organizations | Organization |
| product_id | UUID | FK → products | Finished product |
| bom_number | TEXT | NOT NULL | BOM number |
| version | INTEGER | DEFAULT 1 | BOM version |
| status | TEXT | DEFAULT 'draft' | draft/active/archived |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, product_id, status

---

### bom_items
**Purpose:** BOM line items (ingredients)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | BOM item ID |
| org_id | UUID | FK → organizations | Organization |
| bom_id | UUID | FK → boms | Parent BOM |
| product_id | UUID | FK → products | Ingredient product |
| sequence | INTEGER | NOT NULL | Line sequence |
| quantity | DECIMAL(15,4) | NOT NULL | Quantity required |
| unit | TEXT | NOT NULL | Unit of measure |
| is_critical | BOOLEAN | DEFAULT false | Critical ingredient |

**RLS:** Enabled (org isolation)
**Indexes:** bom_id, product_id, sequence

---

### routings
**Purpose:** Production routings (process steps)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Routing ID |
| org_id | UUID | FK → organizations | Organization |
| product_id | UUID | FK → products | Product |
| routing_number | TEXT | NOT NULL | Routing number |
| version | INTEGER | DEFAULT 1 | Routing version |
| status | TEXT | DEFAULT 'draft' | draft/active/archived |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, product_id, status

---

### routing_operations
**Purpose:** Individual routing steps

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Operation ID |
| org_id | UUID | FK → organizations | Organization |
| routing_id | UUID | FK → routings | Parent routing |
| sequence | INTEGER | NOT NULL | Operation sequence |
| operation_name | TEXT | NOT NULL | Operation name |
| machine_id | UUID | FK → machines | Required machine |
| duration_minutes | INTEGER | | Estimated duration |
| instructions | TEXT | | Work instructions |

**RLS:** Enabled (org isolation)
**Indexes:** routing_id, sequence

---

## Planning Module (Epic 03)

### purchase_orders
**Purpose:** Purchase order headers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | PO ID |
| org_id | UUID | FK → organizations | Organization |
| po_number | TEXT | NOT NULL | PO number |
| supplier_id | UUID | FK → suppliers | Supplier |
| status | TEXT | DEFAULT 'draft' | draft/confirmed/received |
| order_date | DATE | NOT NULL | Order date |
| expected_date | DATE | | Expected delivery |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| created_by | UUID | FK → users | Creator |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, po_number, status, supplier_id

---

### purchase_order_lines
**Purpose:** PO line items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | PO line ID |
| org_id | UUID | FK → organizations | Organization |
| po_id | UUID | FK → purchase_orders | Parent PO |
| line_number | INTEGER | NOT NULL | Line number |
| product_id | UUID | FK → products | Product |
| quantity_ordered | DECIMAL(15,4) | NOT NULL | Quantity ordered |
| quantity_received | DECIMAL(15,4) | DEFAULT 0 | Quantity received |
| unit_price | DECIMAL(15,4) | | Unit price |

**RLS:** Enabled (org isolation)
**Indexes:** po_id, product_id

---

### grns
**Purpose:** Goods Receipt Notes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | GRN ID |
| org_id | UUID | FK → organizations | Organization |
| grn_number | TEXT | NOT NULL | GRN number |
| po_id | UUID | FK → purchase_orders | Related PO |
| po_line_id | UUID | FK → purchase_order_lines | PO line |
| product_id | UUID | FK → products | Product |
| quantity_received | DECIMAL(15,4) | NOT NULL | Quantity received |
| lot_number | TEXT | | Lot number |
| expiry_date | DATE | | Expiry date |
| status | TEXT | DEFAULT 'pending' | pending/inspected/received |
| received_at | TIMESTAMPTZ | DEFAULT now() | Receipt timestamp |
| received_by | UUID | FK → users | Receiver |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, grn_number, po_id, status

---

### work_orders
**Purpose:** Work order (production jobs)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | WO ID |
| org_id | UUID | FK → organizations | Organization |
| wo_number | TEXT | NOT NULL | WO number |
| product_id | UUID | FK → products | Product to produce |
| bom_id | UUID | FK → boms | BOM snapshot |
| routing_id | UUID | FK → routings | Routing snapshot |
| quantity_planned | DECIMAL(15,4) | NOT NULL | Planned quantity |
| quantity_produced | DECIMAL(15,4) | DEFAULT 0 | Produced quantity |
| status | TEXT | DEFAULT 'planned' | planned/released/in_progress/completed |
| scheduled_start | TIMESTAMPTZ | | Scheduled start |
| actual_start | TIMESTAMPTZ | | Actual start |
| actual_end | TIMESTAMPTZ | | Actual end |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, wo_number, status, product_id

---

### transfer_orders
**Purpose:** Inventory transfer orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | TO ID |
| org_id | UUID | FK → organizations | Organization |
| to_number | TEXT | NOT NULL | TO number |
| from_warehouse_id | UUID | FK → warehouses | Source warehouse |
| to_warehouse_id | UUID | FK → warehouses | Dest warehouse |
| status | TEXT | DEFAULT 'draft' | draft/in_transit/completed |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, to_number, status

---

## Production Module (Epic 04)

### wo_operations
**Purpose:** Work order operation execution

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | WO operation ID |
| org_id | UUID | FK → organizations | Organization |
| wo_id | UUID | FK → work_orders | Parent WO |
| operation_id | UUID | FK → routing_operations | Routing operation |
| sequence | INTEGER | NOT NULL | Operation sequence |
| status | TEXT | DEFAULT 'pending' | pending/in_progress/completed |
| started_at | TIMESTAMPTZ | | Start timestamp |
| completed_at | TIMESTAMPTZ | | Completion timestamp |
| operator_id | UUID | FK → users | Operator |

**RLS:** Enabled (org isolation)
**Indexes:** wo_id, status, sequence

---

## Warehouse Module (Epic 05)

### warehouses
**Purpose:** Warehouse master records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Warehouse ID |
| org_id | UUID | FK → organizations | Organization |
| code | TEXT | NOT NULL | Warehouse code |
| name | TEXT | NOT NULL | Warehouse name |
| is_default | BOOLEAN | DEFAULT false | Default warehouse |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, code

---

### license_plates
**Purpose:** Atomic inventory units (LP = pallet/case/unit)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | LP ID |
| org_id | UUID | FK → organizations | Organization |
| lp_number | TEXT | NOT NULL | LP number (SSCC-18) |
| product_id | UUID | FK → products | Product |
| quantity | DECIMAL(15,4) | NOT NULL | Quantity |
| unit | TEXT | NOT NULL | Unit of measure |
| lot_number | TEXT | | Lot number |
| production_date | DATE | | Production date |
| expiry_date | DATE | | Expiry date |
| location_id | UUID | FK → locations | Current location |
| status | TEXT | DEFAULT 'available' | available/allocated/picked/qa_hold |
| qa_status | TEXT | DEFAULT 'pending' | pending/passed/failed/released |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, lp_number, product_id, status, qa_status, location_id
**Unique:** lp_number

---

### lp_genealogy
**Purpose:** LP parent-child relationships (traceability)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Genealogy ID |
| org_id | UUID | FK → organizations | Organization |
| parent_lp_id | UUID | FK → license_plates | Parent LP |
| child_lp_id | UUID | FK → license_plates | Child LP |
| relationship_type | TEXT | NOT NULL | split/merge/transform |
| wo_id | UUID | FK → work_orders | Related WO |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** parent_lp_id, child_lp_id, wo_id

---

### inventory_transactions
**Purpose:** Inventory movement audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Transaction ID |
| org_id | UUID | FK → organizations | Organization |
| lp_id | UUID | FK → license_plates | LP |
| transaction_type | TEXT | NOT NULL | receipt/issue/transfer/adjustment |
| quantity | DECIMAL(15,4) | NOT NULL | Quantity moved |
| from_location_id | UUID | FK → locations | Source location |
| to_location_id | UUID | FK → locations | Dest location |
| reference_type | TEXT | | grn/wo/so/to |
| reference_id | UUID | | Reference ID |
| created_at | TIMESTAMPTZ | DEFAULT now() | Transaction timestamp |
| created_by | UUID | FK → users | User |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, lp_id, transaction_type, created_at

---

## Quality Module (Epic 06)

### quality_settings
**Purpose:** Organization quality control settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Settings ID |
| org_id | UUID | FK → organizations | Organization |
| auto_create_inspections | BOOLEAN | DEFAULT true | Auto-create inspections |
| default_sampling_plan_id | UUID | FK → sampling_plans | Default sampling plan |
| require_inspector_assignment | BOOLEAN | DEFAULT true | Require assignment |
| enable_batch_release | BOOLEAN | DEFAULT true | Enable batch release |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

**RLS:** Enabled (org isolation)
**Indexes:** org_id

---

### quality_status_transitions
**Purpose:** Valid QA status transitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Transition ID |
| from_status | TEXT | NOT NULL | Source status |
| to_status | TEXT | NOT NULL | Target status |
| requires_approval | BOOLEAN | DEFAULT false | Approval required |
| requires_reason | BOOLEAN | DEFAULT false | Reason required |

**RLS:** Disabled (shared)
**Indexes:** from_status, to_status

---

### quality_status_history
**Purpose:** QA status change audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | History ID |
| org_id | UUID | FK → organizations | Organization |
| entity_type | TEXT | NOT NULL | lp/batch/inspection |
| entity_id | UUID | NOT NULL | Entity ID |
| from_status | TEXT | | Previous status |
| to_status | TEXT | NOT NULL | New status |
| reason | TEXT | | Change reason |
| changed_by | UUID | FK → users | User |
| changed_at | TIMESTAMPTZ | DEFAULT now() | Change timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, entity_type, entity_id, changed_at

---

### quality_specifications
**Purpose:** Product quality specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Spec ID |
| org_id | UUID | FK → organizations | Organization |
| spec_number | TEXT | NOT NULL | Spec number |
| product_id | UUID | FK → products | Product |
| version | INTEGER | DEFAULT 1 | Version number |
| status | TEXT | DEFAULT 'draft' | draft/active/archived |
| effective_date | DATE | | Effective date |
| expiry_date | DATE | | Expiry date |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| created_by | UUID | FK → users | Creator |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, product_id, status, spec_number

---

### quality_spec_parameters
**Purpose:** Test parameters for specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Parameter ID |
| spec_id | UUID | FK → quality_specifications | Parent spec |
| sequence | INTEGER | NOT NULL | Display sequence |
| parameter_name | TEXT | NOT NULL | Parameter name |
| parameter_type | TEXT | NOT NULL | numeric/text/boolean/range |
| target_value | TEXT | | Target value |
| min_value | DECIMAL(15,6) | | Min value (numeric/range) |
| max_value | DECIMAL(15,6) | | Max value (numeric/range) |
| unit | TEXT | | Unit (°C, kg, pH, %) |
| test_method | TEXT | | Test method (AOAC 942.15) |
| is_critical | BOOLEAN | DEFAULT false | Critical parameter |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (via spec_id)
**Indexes:** spec_id, sequence, is_critical

---

### quality_holds
**Purpose:** Quality hold records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Hold ID |
| org_id | UUID | FK → organizations | Organization |
| hold_number | TEXT | NOT NULL | Hold number |
| reason | TEXT | NOT NULL | Hold reason |
| status | TEXT | DEFAULT 'active' | active/released/cancelled |
| placed_by | UUID | FK → users | User who placed hold |
| placed_at | TIMESTAMPTZ | DEFAULT now() | Hold timestamp |
| released_by | UUID | FK → users | User who released |
| released_at | TIMESTAMPTZ | | Release timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, hold_number, status

---

### quality_hold_items
**Purpose:** Items under quality hold (polymorphic)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Hold item ID |
| hold_id | UUID | FK → quality_holds | Parent hold |
| item_type | TEXT | NOT NULL | lp/wo/batch |
| item_id | UUID | NOT NULL | Item ID |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (via hold_id)
**Indexes:** hold_id, item_type, item_id

---

### quality_inspections
**Purpose:** Quality inspection records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Inspection ID |
| org_id | UUID | FK → organizations | Organization |
| inspection_number | TEXT | NOT NULL | Inspection number |
| inspection_type | TEXT | NOT NULL | incoming/in_process/final |
| reference_type | TEXT | NOT NULL | po/grn/wo/lp/batch |
| reference_id | UUID | NOT NULL | Reference ID |
| product_id | UUID | FK → products | Product |
| spec_id | UUID | FK → quality_specifications | Spec |
| lp_id | UUID | FK → license_plates | LP (incoming) |
| grn_id | UUID | FK → grns | GRN (incoming) |
| wo_id | UUID | FK → work_orders | WO (in-process/final) |
| batch_number | TEXT | | Batch number |
| lot_size | INTEGER | | Lot size |
| sample_size | INTEGER | | Sample size |
| inspector_id | UUID | FK → users | Inspector |
| status | TEXT | DEFAULT 'scheduled' | scheduled/in_progress/completed/cancelled |
| result | TEXT | | passed/failed/conditional |
| scheduled_date | DATE | | Scheduled date |
| started_at | TIMESTAMPTZ | | Start timestamp |
| completed_at | TIMESTAMPTZ | | Completion timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, inspection_number, inspection_type, status, product_id

---

### quality_test_results
**Purpose:** Individual test results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Result ID |
| inspection_id | UUID | FK → quality_inspections | Parent inspection |
| parameter_id | UUID | FK → quality_spec_parameters | Test parameter |
| result_value | TEXT | NOT NULL | Test result |
| pass_fail | TEXT | NOT NULL | pass/fail |
| notes | TEXT | | Result notes |
| tested_at | TIMESTAMPTZ | DEFAULT now() | Test timestamp |
| tested_by | UUID | FK → users | Tester |

**RLS:** Enabled (via inspection_id)
**Indexes:** inspection_id, parameter_id, pass_fail

---

### sampling_plans
**Purpose:** AQL sampling plans

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Plan ID |
| org_id | UUID | FK → organizations | Organization |
| plan_code | TEXT | NOT NULL | Plan code |
| plan_name | TEXT | NOT NULL | Plan name |
| inspection_type | TEXT | NOT NULL | incoming/in_process/final |
| aql_level | DECIMAL(5,2) | NOT NULL | AQL % (e.g., 1.5) |
| inspection_level | TEXT | DEFAULT 'II' | I/II/III |
| is_active | BOOLEAN | DEFAULT true | Active status |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, plan_code, inspection_type

---

### sampling_records
**Purpose:** Sample test execution records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Record ID |
| inspection_id | UUID | FK → quality_inspections | Parent inspection |
| sample_number | INTEGER | NOT NULL | Sample number |
| result | TEXT | NOT NULL | pass/fail |
| defects_found | INTEGER | DEFAULT 0 | Defect count |
| notes | TEXT | | Sample notes |
| tested_at | TIMESTAMPTZ | DEFAULT now() | Test timestamp |

**RLS:** Enabled (via inspection_id)
**Indexes:** inspection_id, sample_number

---

### iso_2859_reference
**Purpose:** ISO 2859 AQL lookup table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Reference ID |
| lot_size_min | INTEGER | NOT NULL | Lot size min |
| lot_size_max | INTEGER | NOT NULL | Lot size max |
| sample_size_code | TEXT | NOT NULL | Sample size code (A-R) |
| inspection_level | TEXT | NOT NULL | I/II/III |
| aql | DECIMAL(5,2) | NOT NULL | AQL % |
| sample_size | INTEGER | NOT NULL | Sample size |
| accept | INTEGER | NOT NULL | Accept threshold |
| reject | INTEGER | NOT NULL | Reject threshold |

**RLS:** Disabled (shared reference)
**Indexes:** lot_size_min, lot_size_max, aql

---

### batch_release_records
**Purpose:** Batch release approval records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Release ID |
| org_id | UUID | FK → organizations | Organization |
| release_number | TEXT | NOT NULL | Release number |
| batch_number | TEXT | NOT NULL | Batch number |
| product_id | UUID | FK → products | Product |
| status | TEXT | DEFAULT 'pending' | pending/approved/rejected |
| approved_by | UUID | FK → users | Approver |
| approved_at | TIMESTAMPTZ | | Approval timestamp |
| notes | TEXT | | Release notes |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, release_number, batch_number, status

---

### batch_release_lps
**Purpose:** LPs included in batch release

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Release LP ID |
| release_id | UUID | FK → batch_release_records | Parent release |
| lp_id | UUID | FK → license_plates | LP |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (via release_id)
**Indexes:** release_id, lp_id

---

### ncr_reports
**Purpose:** Non-conformance reports

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | NCR ID |
| org_id | UUID | FK → organizations | Organization |
| ncr_number | TEXT | NOT NULL | NCR number |
| title | TEXT | NOT NULL | NCR title |
| description | TEXT | NOT NULL | NCR description |
| severity | TEXT | NOT NULL | minor/major/critical |
| status | TEXT | DEFAULT 'open' | open/investigating/closed |
| reference_type | TEXT | | lp/wo/grn/inspection |
| reference_id | UUID | | Reference ID |
| reported_by | UUID | FK → users | Reporter |
| reported_at | TIMESTAMPTZ | DEFAULT now() | Report timestamp |
| assigned_to | UUID | FK → users | Assignee |
| closed_at | TIMESTAMPTZ | | Close timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, ncr_number, status, severity

---

### scanner_offline_queue
**Purpose:** Offline scanner sync queue

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Queue ID |
| org_id | UUID | FK → organizations | Organization |
| device_id | TEXT | NOT NULL | Device ID |
| action_type | TEXT | NOT NULL | inspection/pick/pack |
| action_data | JSONB | NOT NULL | Action payload |
| sync_status | TEXT | DEFAULT 'pending' | pending/synced/failed |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| synced_at | TIMESTAMPTZ | | Sync timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, device_id, sync_status, created_at

---

### quality_audit_log
**Purpose:** Quality module audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Log ID |
| org_id | UUID | FK → organizations | Organization |
| entity_type | TEXT | NOT NULL | Table name |
| entity_id | UUID | NOT NULL | Record ID |
| action | TEXT | NOT NULL | create/update/delete |
| old_values | JSONB | | Previous values |
| new_values | JSONB | | New values |
| user_id | UUID | FK → users | User |
| created_at | TIMESTAMPTZ | DEFAULT now() | Log timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, entity_type, entity_id, created_at

---

## Shipping Module (Epic 07)

### customers
**Purpose:** Customer master records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Customer ID |
| org_id | UUID | FK → organizations | Organization |
| customer_code | TEXT | NOT NULL | Customer code |
| name | TEXT | NOT NULL | Customer name |
| email | TEXT | | Email |
| phone | TEXT | | Phone |
| tax_id | TEXT | | Tax ID (VAT/EIN) |
| credit_limit | DECIMAL(15,2) | | Credit limit |
| payment_terms_days | INTEGER | DEFAULT 30 | Payment terms |
| category | TEXT | NOT NULL | retail/wholesale/distributor |
| allergen_restrictions | JSONB | | Allergen IDs |
| is_active | BOOLEAN | DEFAULT true | Active status |
| notes | TEXT | | Customer notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| created_by | UUID | FK → users | Creator |

**RLS:** Enabled (org isolation + role checks)
**Indexes:** org_id, customer_code, category, is_active
**Unique:** (org_id, LOWER(customer_code))

---

### customer_contacts
**Purpose:** Customer contact persons

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Contact ID |
| org_id | UUID | FK → organizations | Organization |
| customer_id | UUID | FK → customers | Parent customer |
| name | TEXT | NOT NULL | Contact name |
| title | TEXT | | Job title |
| email | TEXT | | Email |
| phone | TEXT | | Phone |
| is_primary | BOOLEAN | DEFAULT false | Primary contact |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** customer_id, is_primary
**Unique:** (customer_id, LOWER(email)) WHERE email IS NOT NULL

---

### customer_addresses
**Purpose:** Shipping/billing addresses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Address ID |
| org_id | UUID | FK → organizations | Organization |
| customer_id | UUID | FK → customers | Parent customer |
| address_type | TEXT | NOT NULL | billing/shipping |
| is_default | BOOLEAN | DEFAULT false | Default address |
| address_line1 | TEXT | NOT NULL | Address line 1 |
| address_line2 | TEXT | | Address line 2 |
| city | TEXT | NOT NULL | City |
| state | TEXT | | State |
| postal_code | TEXT | NOT NULL | Postal code |
| country | TEXT | NOT NULL | Country |
| dock_hours | JSONB | | Dock hours {mon: "8-17"} |
| notes | TEXT | | Delivery notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** customer_id, address_type, is_default

---

### sales_orders
**Purpose:** Sales order headers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | SO ID |
| org_id | UUID | FK → organizations | Organization |
| order_number | TEXT | NOT NULL | SO number (SO-YYYY-NNNNN) |
| customer_id | UUID | FK → customers | Customer |
| customer_po | TEXT | | Customer PO number |
| shipping_address_id | UUID | FK → customer_addresses | Shipping address |
| order_date | DATE | NOT NULL | Order date |
| promised_ship_date | DATE | | Promised ship date |
| required_delivery_date | DATE | | Required delivery |
| status | TEXT | DEFAULT 'draft' | draft/confirmed/allocated/picking/packing/shipped/delivered/cancelled |
| total_amount | DECIMAL(15,2) | | Order total |
| allergen_validated | BOOLEAN | DEFAULT false | Allergen check |
| notes | TEXT | | Order notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| created_by | UUID | FK → users | Creator |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |
| confirmed_at | TIMESTAMPTZ | | Confirmation timestamp |
| shipped_at | TIMESTAMPTZ | | Ship timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, order_number, customer_id, status, order_date
**Unique:** (org_id, order_number)

---

### sales_order_lines
**Purpose:** Sales order line items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | SO line ID |
| org_id | UUID | FK → organizations | Organization |
| sales_order_id | UUID | FK → sales_orders | Parent SO |
| line_number | INTEGER | NOT NULL | Line number |
| product_id | UUID | FK → products | Product |
| quantity_ordered | DECIMAL(15,4) | NOT NULL | Quantity ordered |
| quantity_allocated | DECIMAL(15,4) | DEFAULT 0 | Quantity allocated |
| quantity_picked | DECIMAL(15,4) | DEFAULT 0 | Quantity picked |
| quantity_packed | DECIMAL(15,4) | DEFAULT 0 | Quantity packed |
| quantity_shipped | DECIMAL(15,4) | DEFAULT 0 | Quantity shipped |
| unit_price | DECIMAL(15,4) | NOT NULL | Unit price |
| line_total | DECIMAL(15,2) | | Line total (auto-calc) |
| requested_lot | TEXT | | Requested lot |
| notes | TEXT | | Line notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** sales_order_id, product_id
**Unique:** (sales_order_id, line_number)
**Trigger:** Auto-calculate line_total = quantity_ordered * unit_price

---

### inventory_allocations
**Purpose:** LP allocations to SO lines

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Allocation ID |
| org_id | UUID | FK → organizations | Organization |
| sales_order_line_id | UUID | FK → sales_order_lines | SO line |
| license_plate_id | UUID | FK → license_plates | LP |
| quantity_allocated | DECIMAL(15,4) | NOT NULL | Quantity allocated |
| quantity_picked | DECIMAL(15,4) | DEFAULT 0 | Quantity picked |
| allocated_at | TIMESTAMPTZ | DEFAULT now() | Allocation timestamp |
| allocated_by | UUID | FK → users | Allocator |
| released_at | TIMESTAMPTZ | | Release timestamp |
| released_by | UUID | FK → users | Releaser |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

**RLS:** Enabled (org isolation)
**Indexes:** sales_order_line_id, license_plate_id, org_id
**Unique:** (sales_order_line_id, license_plate_id)

---

### pick_lists
**Purpose:** Pick list headers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Pick list ID |
| org_id | UUID | FK → organizations | Organization |
| pick_list_number | TEXT | NOT NULL | Pick list number (PL-YYYY-NNNNN) |
| pick_type | TEXT | DEFAULT 'single_order' | single_order/wave |
| status | TEXT | DEFAULT 'pending' | pending/assigned/in_progress/completed/cancelled |
| priority | TEXT | DEFAULT 'normal' | low/normal/high/urgent |
| assigned_to | UUID | FK → users | Assigned picker |
| wave_id | UUID | | Wave grouping ID |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| created_by | UUID | FK → users | Creator |
| started_at | TIMESTAMPTZ | | Start timestamp |
| completed_at | TIMESTAMPTZ | | Completion timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, pick_list_number, status, assigned_to, priority
**Unique:** (org_id, pick_list_number)

---

### pick_list_lines
**Purpose:** Pick list line items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Pick line ID |
| org_id | UUID | FK → organizations | Organization |
| pick_list_id | UUID | FK → pick_lists | Parent pick list |
| sales_order_line_id | UUID | FK → sales_order_lines | SO line |
| license_plate_id | UUID | FK → license_plates | Suggested LP |
| location_id | UUID | FK → locations | Pick location |
| product_id | UUID | FK → products | Product |
| lot_number | TEXT | | Lot number |
| quantity_to_pick | DECIMAL(15,4) | NOT NULL | Quantity to pick |
| quantity_picked | DECIMAL(15,4) | DEFAULT 0 | Quantity picked |
| pick_sequence | INTEGER | DEFAULT 0 | Pick sequence (route) |
| status | TEXT | DEFAULT 'pending' | pending/picked/short |
| picked_license_plate_id | UUID | FK → license_plates | Actual picked LP |
| picked_at | TIMESTAMPTZ | | Pick timestamp |
| picked_by | UUID | FK → users | Picker |
| short_pick_reason | TEXT | | Short pick reason |
| notes | TEXT | | Pick notes |

**RLS:** Enabled (org isolation)
**Indexes:** pick_list_id, sales_order_line_id, location_id, status, pick_sequence

---

### pick_list_sales_orders
**Purpose:** Pick list to SO junction table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Junction ID |
| pick_list_id | UUID | FK → pick_lists | Pick list |
| sales_order_id | UUID | FK → sales_orders | Sales order |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (via pick_list_id)
**Indexes:** pick_list_id, sales_order_id
**Unique:** (pick_list_id, sales_order_id)

---

### rma_requests
**Purpose:** RMA request headers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | RMA ID |
| org_id | UUID | FK → organizations | Organization |
| rma_number | TEXT | NOT NULL | RMA number (RMA-YYYY-NNNNN) |
| customer_id | UUID | FK → customers | Customer |
| sales_order_id | UUID | FK → sales_orders | Original SO |
| reason | TEXT | NOT NULL | Return reason |
| status | TEXT | DEFAULT 'requested' | requested/approved/in_transit/received/closed |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| created_by | UUID | FK → users | Creator |
| approved_by | UUID | FK → users | Approver |
| approved_at | TIMESTAMPTZ | | Approval timestamp |

**RLS:** Enabled (org isolation)
**Indexes:** org_id, rma_number, customer_id, status
**Unique:** (org_id, rma_number)

---

### rma_lines
**Purpose:** RMA line items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | RMA line ID |
| rma_request_id | UUID | FK → rma_requests | Parent RMA |
| sales_order_line_id | UUID | FK → sales_order_lines | Original SO line |
| product_id | UUID | FK → products | Product |
| quantity_requested | DECIMAL(15,4) | NOT NULL | Quantity to return |
| quantity_received | DECIMAL(15,4) | DEFAULT 0 | Quantity received |
| reason | TEXT | | Line reason |
| disposition | TEXT | | scrap/restock/rework |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**RLS:** Enabled (via rma_request_id)
**Indexes:** rma_request_id, product_id

---

### shipping_settings
**Purpose:** Organization shipping configuration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Settings ID |
| org_id | UUID | FK → organizations | Organization |
| default_carrier | TEXT | | Default carrier |
| auto_allocate_enabled | BOOLEAN | DEFAULT false | Auto allocate |
| fifo_fefo_strategy | TEXT | DEFAULT 'FIFO' | FIFO/FEFO |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

**RLS:** Enabled (org isolation)
**Indexes:** org_id

---

## Common Tables

### Sequence Tables
All numbering sequence tables follow the same pattern:

**Pattern:**
- `{entity}_number_sequences`
- Fields: id, org_id, year, current_value, updated_at
- RLS: Enabled (org isolation)
- Unique: (org_id, year)

**Examples:**
- sales_order_number_sequences
- pick_list_number_sequences
- rma_number_sequences
- inspection_number_sequences
- ncr_number_sequences
- release_number_sequences
- quality_hold_sequences

---

## Database Statistics

| Category | Count |
|----------|-------|
| **Total Tables** | 80+ |
| **Settings Module** | 8 tables |
| **Technical Module** | 6 tables |
| **Planning Module** | 6 tables |
| **Production Module** | 2 tables |
| **Warehouse Module** | 4 tables |
| **Quality Module** | 21 tables |
| **Shipping Module** | 16 tables |
| **Sequence Tables** | 7 tables |
| **Total RLS Policies** | 200+ |
| **Total Indexes** | 150+ |
| **Total Triggers** | 30+ |

---

## Key Patterns

### 1. Multi-Tenancy
All tables (except shared reference) include:
- `org_id UUID FK → organizations`
- RLS policies filtering by org_id
- Unique constraints scoped to org_id

### 2. Audit Columns
Standard audit columns:
- `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_at TIMESTAMPTZ DEFAULT now()`
- `created_by UUID FK → users`
- `updated_by UUID FK → users`

### 3. Soft Deletes
Tables use `is_active` instead of hard deletes:
- `is_active BOOLEAN DEFAULT true`
- Indexes on `(org_id, is_active)`

### 4. Sequential Numbering
Format: `{PREFIX}-YYYY-NNNNN`
- Per organization per year
- Thread-safe with ON CONFLICT handling
- Functions: `generate_{entity}_number(org_id)`

### 5. Polymorphic References
Used for flexible entity relationships:
- `reference_type TEXT` (table name)
- `reference_id UUID` (record id)
- Indexed together: `(reference_type, reference_id)`

### 6. Status Enums
Consistent status naming:
- Draft workflow: draft → confirmed → completed
- Process workflow: pending → in_progress → completed
- Quality workflow: scheduled → in_progress → completed → result

---

## Migration History

**Latest Migrations:** 131-144 (2026-01-23)
- Added 37 new tables for Quality and Shipping modules
- Combined some migrations to resolve dependencies
- All migrations in sync with remote database

**For detailed migration history, see:**
- `MIGRATION-VERIFICATION.md`
- `NEW-TABLES-SUMMARY.md`
- `supabase/migrations/` directory

---

**Document Version:** 2.0
**Last Updated:** 2026-01-23
**Maintained By:** Development Team
