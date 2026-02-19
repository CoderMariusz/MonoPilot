# New Tables Summary (Migrations 131-144)

This document lists all new tables added in migrations 131-144 for Epic 06 (Quality) and Epic 07 (Shipping).

## Quick Reference

**Total Tables Added:** 37
**Quality Module:** 21 tables
**Shipping Module:** 16 tables

---

## Quality Module Tables (Epic 06)

### Quality Settings & Status (Story 06.1, 06.2)
1. **quality_settings** - Organization quality control settings
   - Primary key: id
   - Key fields: org_id, auto_create_inspections, default_sampling_plan_id
   - RLS: Enabled (org isolation)

2. **quality_status_transitions** - Allowed status change workflows
   - Primary key: id
   - Key fields: from_status, to_status, requires_approval
   - RLS: Enabled

3. **quality_status_history** - Audit trail for status changes
   - Primary key: id
   - Key fields: entity_type, entity_id, from_status, to_status, changed_by
   - RLS: Enabled

### Quality Specifications (Story 06.3, 06.4)
4. **quality_specifications** - Product quality specifications
   - Primary key: id
   - Key fields: org_id, product_id, spec_number, status, version
   - RLS: Enabled
   - Features: Versioning, approval workflow

5. **quality_spec_parameters** - Test parameters for specifications
   - Primary key: id
   - Key fields: spec_id, parameter_name, parameter_type, min_value, max_value
   - RLS: Enabled
   - Features: Drag-to-reorder sequence, critical parameter flagging

### Quality Holds (Story 06.6)
6. **quality_holds** - Quality hold records
   - Primary key: id
   - Key fields: org_id, hold_number, reason, status
   - RLS: Enabled

7. **quality_hold_items** - Items under quality hold (polymorphic)
   - Primary key: id
   - Key fields: hold_id, item_type, item_id (LP, WO, batch)
   - RLS: Enabled

8. **quality_hold_sequences** - Hold number generation
   - Primary key: id
   - Key fields: org_id, year, current_value
   - RLS: Enabled

### Quality Inspections (Story 06.5, 06.10)
9. **quality_inspections** - Inspection records (incoming, in-process, final)
   - Primary key: id
   - Key fields: org_id, inspection_number, inspection_type, reference_type, status
   - RLS: Enabled
   - Features: Polymorphic references (PO, GRN, WO, LP, batch)

10. **inspection_number_sequences** - Inspection number generation
    - Primary key: id
    - Key fields: org_id, year, current_value
    - RLS: Enabled

### Test Results & Sampling (Story 06.7, 06.8)
11. **quality_test_results** - Test result records
    - Primary key: id
    - Key fields: inspection_id, parameter_id, result_value, pass_fail
    - RLS: Enabled

12. **sampling_plans** - AQL sampling plans
    - Primary key: id
    - Key fields: org_id, plan_code, inspection_type, aql_level
    - RLS: Enabled

13. **sampling_records** - Sample test execution records
    - Primary key: id
    - Key fields: inspection_id, sample_number, result
    - RLS: Enabled

14. **iso_2859_reference** - ISO 2859 AQL lookup table
    - Primary key: id
    - Key fields: lot_size_min, lot_size_max, sample_size_code, aql
    - RLS: Enabled

### Batch Release (Story 06.9)
15. **batch_release_records** - Batch release approval records
    - Primary key: id
    - Key fields: org_id, release_number, batch_number, status
    - RLS: Enabled

16. **release_number_sequences** - Release number generation
    - Primary key: id
    - Key fields: org_id, year, current_value
    - RLS: Enabled

17. **batch_release_lps** - LPs included in batch release
    - Primary key: id
    - Key fields: release_id, lp_id
    - RLS: Enabled

### NCR & Offline (Story 06.11, 06.12)
18. **ncr_reports** - Non-conformance reports
    - Primary key: id
    - Key fields: org_id, ncr_number, severity, status
    - RLS: Enabled

19. **ncr_number_sequences** - NCR number generation
    - Primary key: id
    - Key fields: org_id, year, current_value
    - RLS: Enabled

20. **scanner_offline_queue** - Offline scanner sync queue
    - Primary key: id
    - Key fields: org_id, device_id, action_type, sync_status
    - RLS: Enabled

21. **quality_audit_log** - Quality module audit trail
    - Primary key: id
    - Key fields: org_id, entity_type, entity_id, action, user_id
    - RLS: Enabled

---

## Shipping Module Tables (Epic 07)

### Customer Management (Story 07.1)
1. **customers** - Customer master records
   - Primary key: id
   - Key fields: org_id, customer_code, name, category
   - RLS: Enabled (role-based: sales, manager, admin)
   - Features: Allergen restrictions, credit limits

2. **customer_contacts** - Customer contact persons
   - Primary key: id
   - Key fields: customer_id, name, email, is_primary
   - RLS: Enabled

3. **customer_addresses** - Shipping/billing addresses
   - Primary key: id
   - Key fields: customer_id, address_type, is_default
   - RLS: Enabled

### Sales Orders (Story 07.2)
4. **sales_orders** - Sales order headers
   - Primary key: id
   - Key fields: org_id, order_number, customer_id, status
   - RLS: Enabled
   - Features: Auto-numbering (SO-YYYY-NNNNN), workflow status

5. **sales_order_lines** - Sales order line items
   - Primary key: id
   - Key fields: sales_order_id, product_id, quantity_ordered
   - RLS: Enabled
   - Features: Auto-calculate line_total trigger

6. **sales_order_number_sequences** - SO number generation
   - Primary key: id
   - Key fields: org_id, year, current_value
   - RLS: Enabled

### Inventory Allocation (Story 07.7)
7. **inventory_allocations** - LP allocations to SO lines
   - Primary key: id
   - Key fields: sales_order_line_id, license_plate_id, quantity_allocated
   - RLS: Enabled
   - Features: FIFO/FEFO support, picked quantity tracking

### Pick Lists (Story 07.8)
8. **pick_lists** - Pick list headers
   - Primary key: id
   - Key fields: org_id, pick_list_number, pick_type, status
   - RLS: Enabled
   - Features: Wave picking support, priority levels

9. **pick_list_lines** - Pick list line items
   - Primary key: id
   - Key fields: pick_list_id, sales_order_line_id, quantity_to_pick
   - RLS: Enabled
   - Features: Pick sequence, short pick tracking

10. **pick_list_number_sequences** - Pick list number generation
    - Primary key: id
    - Key fields: org_id, year, current_value
    - RLS: Enabled

11. **pick_list_sales_orders** - Pick list to SO junction table
    - Primary key: id
    - Key fields: pick_list_id, sales_order_id
    - RLS: Enabled

### RMA (Story 07.16)
12. **rma_requests** - RMA request headers
    - Primary key: id
    - Key fields: org_id, rma_number, customer_id, status
    - RLS: Enabled

13. **rma_lines** - RMA line items
    - Primary key: id
    - Key fields: rma_request_id, product_id, quantity_requested
    - RLS: Enabled

14. **rma_number_sequences** - RMA number generation
    - Primary key: id
    - Key fields: org_id, year, current_value
    - RLS: Enabled

### Shipping Settings (Story 07.1)
15. **shipping_settings** - Organization shipping configuration
    - Primary key: id
    - Key fields: org_id, default_carrier, auto_allocate_enabled
    - RLS: Enabled

---

## Database Features

### Common Patterns Across All Tables

#### 1. RLS (Row Level Security)
All tables implement org-based RLS with policies for:
- SELECT: `org_id = (SELECT org_id FROM users WHERE id = auth.uid())`
- INSERT: org_id + role checks
- UPDATE: org_id + role checks
- DELETE: org_id + role checks

#### 2. Indexes
Standard indexes on:
- `org_id` (all tables)
- Foreign keys
- Status fields
- Date fields for filtering
- Composite indexes for common query patterns

#### 3. Triggers
- `updated_at` - Auto-update timestamp on row modification
- Auto-numbering - Generate sequential numbers per org per year
- Status validation - Enforce valid status transitions
- Cascade updates - Update related records on status change

#### 4. Sequences
Number generation tables follow pattern:
- Format: `{PREFIX}-YYYY-NNNNN`
- Per organization per year
- Thread-safe with `ON CONFLICT` handling

### Key Functions Added

#### Numbering Functions
- `generate_sales_order_number(org_id)` → 'SO-2026-00001'
- `generate_pick_list_number(org_id)` → 'PL-2026-00001'
- `generate_rma_number(org_id)` → 'RMA-2026-00001'
- `generate_inspection_number(org_id)` → 'INS-2026-00001'
- `generate_ncr_number(org_id)` → 'NCR-2026-00001'
- `generate_release_number(org_id)` → 'REL-2026-00001'
- `generate_hold_number(org_id)` → 'HOLD-2026-00001'

#### Business Logic Functions
- `get_lp_allocated_qty_so(lp_id)` - Calculate total allocated qty for LP
- `create_incoming_inspection_on_grn()` - Auto-create inspection on GRN
- `update_lp_qa_status()` - Update LP QA status based on inspection
- `validate_status_transition()` - Validate quality status changes

---

## Migration Notes

### Combined Migrations
Some stories were merged into single migrations to resolve dependencies:

**Migration 135** (Combined):
- Story 07.2: sales_orders, sales_order_lines
- Story 07.7: inventory_allocations
- Reason: allocations table requires sales_order_lines FK

**Migration 141** (Combined):
- Story 06.5: quality_inspections
- Story 06.4: quality_spec_parameters
- Reason: Resolved duplicate migration number

**Migration 142** (Combined):
- Story 06.8: quality_test_results
- Story 06.7: sampling_plans
- Reason: Resolved duplicate migration number

**Migration 143** (Combined):
- Story 06.9: batch_release_records
- Story 06.11: ncr_reports
- Story 06.12: scanner_offline_queue
- Reason: Resolved duplicate migration number

---

## Next Steps

1. **Update `.claude/TABLES.md`** - Add all 37 new tables with detailed schemas
2. **Performance Tuning** - Monitor query performance on new indexes
3. **Data Seeding** - Create test data for development
4. **Integration Tests** - Write comprehensive API tests
5. **Documentation** - Update architecture docs with new ERDs

---

**Document Created:** 2026-01-23
**Migrations Covered:** 131-144
**Total Tables:** 37 (21 Quality + 16 Shipping)
