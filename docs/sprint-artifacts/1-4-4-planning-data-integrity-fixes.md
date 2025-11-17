# Story 1.4.4: Planning Data Integrity Fixes

Status: drafted

## Story

As a **System Administrator / Data Quality Manager**,
I want **comprehensive data integrity validation and cleanup for Planning Module (PO/TO/WO)**,
so that **orphaned records, invalid statuses, and missing required fields are eliminated before UX redesign rollout**.

## Acceptance Criteria

### AC-1: Work Orders Data Validation
- Validate all WOs have required fields: product_id, quantity, scheduled_date, status, line_id
- Detect orphaned WO materials: `wo_materials` where `work_order_id` references deleted WO
- Detect orphaned WO operations: `wo_operations` where `work_order_id` references deleted WO
- Detect invalid status transitions: WO status != ('planned', 'released', 'in_progress', 'completed', 'closed', 'cancelled')
- Detect missing BOM snapshot: WO with 0 rows in `wo_materials` (violates BOM snapshot pattern)
- Detect invalid line assignment: WO.line_id not in `machines` table OR product has allergen conflict with line
- Generate validation report: CSV export with all detected issues (wo_id, issue_type, description, suggested_fix)

### AC-2: Purchase Orders Data Validation
- Validate all POs have required fields: supplier_id, warehouse_id (Story 0.1 fix), status, order_date
- Detect orphaned PO lines: `po_line` where `po_header_id` references deleted PO
- Detect invalid status: PO status != ('draft', 'submitted', 'partially_received', 'received', 'closed', 'cancelled')
- Detect missing supplier: PO where `supplier_id` IS NULL or not in `suppliers` table
- Detect missing warehouse: PO where `warehouse_id` IS NULL (post-Story 0.1 validation)
- Detect invalid line totals: PO where SUM(po_line.total_amount) != po_header.total_amount (within 0.01 tolerance)
- Generate validation report: CSV export

### AC-3: Transfer Orders Data Validation
- Validate all TOs have required fields: from_wh_id, to_wh_id, status, transfer_date
- Detect orphaned TO lines: `to_line` where `to_header_id` references deleted TO
- Detect invalid status: TO status != ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled')
- Detect same warehouse transfer: TO where `from_wh_id` = `to_wh_id` (invalid business rule)
- Detect missing transit location: Warehouse where `warehouse_transit_location` IS NULL (required for TOs)
- Detect invalid line quantities: TO line where `quantity_shipped` > `quantity_ordered`
- Generate validation report: CSV export

### AC-4: Database Constraints & Triggers
- Add NOT NULL constraints: work_orders.line_id, work_orders.scheduled_date, po_header.warehouse_id, to_header.from_wh_id, to_header.to_wh_id
- Add CHECK constraints: work_orders.quantity > 0, po_line.quantity > 0, to_line.quantity_ordered > 0
- Add FK validation triggers: Prevent deleting supplier if POs exist, prevent deleting warehouse if POs/TOs exist
- Add status transition trigger: Validate WO status transitions (planned → released → in_progress → completed → closed), reject invalid transitions
- Add BOM snapshot trigger: ON WO INSERT → if wo_materials is empty after insert → raise error "BOM snapshot required"
- Migration file: `XXX_planning_data_integrity_constraints.sql`

### AC-5: Automated Validation Tests
- Create `validatePlanningData()` test suite (Vitest)
- Unit test: Validate WO required fields → insert WO without line_id → expect error
- Unit test: Validate PO required fields → insert PO without warehouse_id → expect error
- Unit test: Validate TO business rules → insert TO with same warehouse → expect error
- Unit test: Validate status transitions → update WO from 'planned' to 'completed' (skip 'released') → expect error
- E2E test: Create WO via API → verify wo_materials snapshot created (non-empty)
- E2E test: Delete supplier with existing POs → verify FK constraint prevents deletion

### AC-6: Data Cleanup Script
- Create `cleanupPlanningData.ts` script (one-time migration)
- Cleanup orphaned wo_materials: DELETE FROM wo_materials WHERE work_order_id NOT IN (SELECT id FROM work_orders)
- Cleanup orphaned po_line: DELETE FROM po_line WHERE po_header_id NOT IN (SELECT id FROM po_header)
- Cleanup orphaned to_line: DELETE FROM to_line WHERE to_header_id NOT IN (SELECT id FROM to_header)
- Fix invalid statuses: UPDATE work_orders SET status = 'cancelled' WHERE status NOT IN (valid_statuses)
- Fix missing required fields: UPDATE po_header SET warehouse_id = default_warehouse_id WHERE warehouse_id IS NULL
- Log all changes: Output CSV with cleaned records (entity_type, entity_id, field, old_value, new_value, cleanup_date)

### AC-7: Validation Dashboard (Admin UI)
- Create `/settings/data-integrity` page (Admin only)
- Tab 1: Validation Report - Table view: entity (WO/PO/TO), issue type, count, severity (🔴 critical, ⚠️ warning)
- Tab 2: Orphaned Records - List of orphaned wo_materials, po_line, to_line with "Delete" button
- Tab 3: Invalid Records - List of WOs/POs/TOs with invalid data, "Fix" button (auto-correct), "Delete" button
- "Run Validation" button: Triggers validation scan, shows results in real-time
- Export report: Download CSV with all validation issues
- Fix button: Auto-apply suggested fixes (e.g., set default warehouse, delete orphaned records)

### AC-8: Documentation
- Update `docs/architecture.md` with data integrity constraints and business rules
- Document validation rules for WO/PO/TO
- Update `docs/DATABASE_SCHEMA.md` with new constraints (auto-generated via pnpm docs:update)
- Create troubleshooting guide: "Common Planning Data Issues and How to Fix Them"

## Tasks / Subtasks

### Task 1: WO Data Validation (AC-1) - 6 hours
- [ ] 1.1: Write SQL queries to detect missing required fields (product_id, line_id, scheduled_date)
- [ ] 1.2: Detect orphaned wo_materials and wo_operations (JOIN check)
- [ ] 1.3: Detect invalid statuses (NOT IN valid_statuses)
- [ ] 1.4: Detect missing BOM snapshot (COUNT(wo_materials) = 0)
- [ ] 1.5: Detect invalid line assignment (FK + allergen conflict check)
- [ ] 1.6: Generate validation report CSV

### Task 2: PO Data Validation (AC-2) - 4 hours
- [ ] 2.1: Write SQL queries to detect missing required fields (supplier_id, warehouse_id, status)
- [ ] 2.2: Detect orphaned po_line
- [ ] 2.3: Detect invalid statuses
- [ ] 2.4: Detect missing supplier/warehouse (FK validation)
- [ ] 2.5: Detect invalid line totals (SUM check)
- [ ] 2.6: Generate validation report CSV

### Task 3: TO Data Validation (AC-3) - 4 hours
- [ ] 3.1: Write SQL queries to detect missing required fields (from_wh_id, to_wh_id, status)
- [ ] 3.2: Detect orphaned to_line
- [ ] 3.3: Detect invalid statuses
- [ ] 3.4: Detect same warehouse transfer (business rule violation)
- [ ] 3.5: Detect missing transit location
- [ ] 3.6: Detect invalid line quantities
- [ ] 3.7: Generate validation report CSV

### Task 4: Database Constraints & Triggers (AC-4) - 8 hours
- [ ] 4.1: Create migration `XXX_planning_data_integrity_constraints.sql`
- [ ] 4.2: Add NOT NULL constraints (line_id, scheduled_date, warehouse_id, from_wh_id, to_wh_id)
- [ ] 4.3: Add CHECK constraints (quantity > 0 for all entities)
- [ ] 4.4: Add FK validation triggers (prevent deleting supplier/warehouse if POs/TOs exist)
- [ ] 4.5: Add status transition trigger (validate WO status transitions)
- [ ] 4.6: Add BOM snapshot trigger (ensure wo_materials non-empty after WO insert)
- [ ] 4.7: Test migration on staging database (verify no breaking changes)

### Task 5: Automated Validation Tests (AC-5) - 6 hours
- [ ] 5.1: Create `validatePlanningData.test.ts` test suite
- [ ] 5.2: Unit test: WO required fields validation (line_id, scheduled_date)
- [ ] 5.3: Unit test: PO required fields validation (warehouse_id)
- [ ] 5.4: Unit test: TO business rules validation (same warehouse check)
- [ ] 5.5: Unit test: Status transition validation (invalid transition rejected)
- [ ] 5.6: E2E test: WO creation → verify wo_materials snapshot
- [ ] 5.7: E2E test: Delete supplier → verify FK constraint prevents

### Task 6: Data Cleanup Script (AC-6) - 6 hours
- [ ] 6.1: Create `cleanupPlanningData.ts` script
- [ ] 6.2: Implement cleanup orphaned wo_materials
- [ ] 6.3: Implement cleanup orphaned po_line, to_line
- [ ] 6.4: Fix invalid statuses (set to 'cancelled')
- [ ] 6.5: Fix missing required fields (set defaults)
- [ ] 6.6: Log all changes to CSV (entity, field, old_value, new_value)
- [ ] 6.7: Dry-run mode (preview changes without commit)

### Task 7: Validation Dashboard UI (AC-7) - 8 hours
- [ ] 7.1: Create `/settings/data-integrity` page
- [ ] 7.2: Implement RBAC check (Admin only)
- [ ] 7.3: Tab 1: Validation Report table (entity, issue type, count, severity)
- [ ] 7.4: Tab 2: Orphaned Records list with Delete button
- [ ] 7.5: Tab 3: Invalid Records list with Fix/Delete buttons
- [ ] 7.6: "Run Validation" button (trigger scan, show real-time results)
- [ ] 7.7: Export report to CSV
- [ ] 7.8: Auto-fix logic (apply suggested fixes on button click)

### Task 8: E2E Tests (4 hours)
- [ ] 8.1: E2E test: Run validation → orphaned records detected → delete button works
- [ ] 8.2: E2E test: Invalid status detected → fix button applies correction
- [ ] 8.3: E2E test: Create WO without BOM snapshot → trigger prevents creation
- [ ] 8.4: E2E test: Export validation report → CSV downloaded

### Task 9: Documentation (AC-8) - 2 hours
- [ ] 9.1: Run `pnpm docs:update` to regenerate schema docs
- [ ] 9.2: Update `docs/architecture.md` with data integrity constraints
- [ ] 9.3: Document validation rules for WO/PO/TO
- [ ] 9.4: Create troubleshooting guide (common issues + fixes)

**Total Estimated Effort:** 48 hours (~6 days)

## Dev Notes

### Requirements Source
[Source: docs/P0-MODULES-AUDIT-REPORT-2025-11-14.md, lines 26-27]

**Remaining Validation Gaps:**
- ⚠️ Work Orders: Requires deeper verification (Epic 0 didn't audit WO module)
- ⚠️ Products/BOMs: Requires deeper verification (Epic 0 didn't audit Technical module)

[Source: Epic 0 Retrospective]
**Epic 0 Completed Fixes:**
- ✅ Story 0.1: PO Header warehouse_id - DONE
- ✅ Story 0.3: LP status enum - DONE
- ✅ Story 0.4: LP QA status enum - DONE
- ✅ Story 0.5: LP UoM constraint - DONE

**Story 1.4.4 Focus:**
- Work Orders data validation (not covered in Epic 0)
- Purchase Orders validation (post-warehouse_id fix)
- Transfer Orders validation (not covered in Epic 0)
- Automated validation tests (prevent future drift)

### Architecture Constraints

**Business Rules to Validate:**

1. **Work Orders:**
   - BOM snapshot pattern: Every WO MUST have wo_materials rows (immutability requirement)
   - Status lifecycle: planned → released → in_progress → completed → closed (no skipping)
   - Line assignment: product.allergens must not conflict with line.allergen_restrictions
   - Quantity: quantity > 0

2. **Purchase Orders:**
   - Warehouse routing: Every PO MUST have warehouse_id (Story 0.1 requirement)
   - Supplier required: Every PO MUST have valid supplier_id
   - Line totals: SUM(po_line.total_amount) = po_header.total_amount (within 0.01 tolerance)
   - Quantity: quantity > 0

3. **Transfer Orders:**
   - Different warehouses: from_wh_id != to_wh_id (cannot transfer to same warehouse)
   - Transit location: Every warehouse MUST have warehouse_transit_location (for in-transit inventory)
   - Line quantities: quantity_shipped <= quantity_ordered
   - Quantity: quantity_ordered > 0

**Validation Query Examples:**

```sql
-- Detect missing BOM snapshot (violates immutability pattern)
SELECT wo.id, wo.wo_number, wo.product_id, COUNT(wm.id) AS material_count
FROM work_orders wo
LEFT JOIN wo_materials wm ON wm.work_order_id = wo.id
WHERE wo.status NOT IN ('draft', 'cancelled') -- non-draft WOs require BOM snapshot
GROUP BY wo.id
HAVING COUNT(wm.id) = 0;

-- Detect orphaned wo_materials
SELECT wm.id, wm.work_order_id, wm.product_id
FROM wo_materials wm
WHERE wm.work_order_id NOT IN (SELECT id FROM work_orders);

-- Detect same warehouse transfer (invalid business rule)
SELECT to.id, to.to_number, to.from_wh_id, to.to_wh_id
FROM to_header to
WHERE to.from_wh_id = to.to_wh_id;

-- Detect invalid PO line totals
SELECT po.id, po.po_number,
       po.total_amount AS header_total,
       SUM(pol.total_amount) AS line_total,
       ABS(po.total_amount - SUM(pol.total_amount)) AS delta
FROM po_header po
JOIN po_line pol ON pol.po_header_id = po.id
GROUP BY po.id
HAVING ABS(po.total_amount - SUM(pol.total_amount)) > 0.01; -- tolerance 1 cent
```

**Database Constraints to Add:**

```sql
-- Migration: XXX_planning_data_integrity_constraints.sql

-- NOT NULL constraints
ALTER TABLE work_orders
  ALTER COLUMN line_id SET NOT NULL,
  ALTER COLUMN scheduled_date SET NOT NULL,
  ALTER COLUMN product_id SET NOT NULL;

ALTER TABLE po_header
  ALTER COLUMN warehouse_id SET NOT NULL,
  ALTER COLUMN supplier_id SET NOT NULL;

ALTER TABLE to_header
  ALTER COLUMN from_wh_id SET NOT NULL,
  ALTER COLUMN to_wh_id SET NOT NULL;

-- CHECK constraints
ALTER TABLE work_orders
  ADD CONSTRAINT chk_wo_quantity_positive CHECK (quantity > 0);

ALTER TABLE po_line
  ADD CONSTRAINT chk_po_line_quantity_positive CHECK (quantity > 0);

ALTER TABLE to_line
  ADD CONSTRAINT chk_to_line_quantity_positive CHECK (quantity_ordered > 0),
  ADD CONSTRAINT chk_to_line_shipped_lte_ordered CHECK (quantity_shipped <= quantity_ordered);

ALTER TABLE to_header
  ADD CONSTRAINT chk_to_different_warehouses CHECK (from_wh_id != to_wh_id);

-- FK validation trigger (prevent orphaned data)
CREATE OR REPLACE FUNCTION prevent_delete_supplier_with_pos()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM po_header WHERE supplier_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete supplier: % Purchase Orders exist', (SELECT COUNT(*) FROM po_header WHERE supplier_id = OLD.id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_delete_supplier_with_pos
BEFORE DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION prevent_delete_supplier_with_pos();

-- Status transition validation trigger
CREATE OR REPLACE FUNCTION validate_wo_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions TEXT[][] := ARRAY[
    ['planned', 'released'],
    ['released', 'in_progress'],
    ['in_progress', 'completed'],
    ['completed', 'closed'],
    ['planned', 'cancelled'],
    ['released', 'cancelled']
  ];
BEGIN
  -- Allow transitions defined in valid_transitions array
  IF OLD.status = ANY(valid_transitions[1]) AND NEW.status = ANY(valid_transitions[2]) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid WO status transition: % → %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_wo_status_transition
BEFORE UPDATE OF status ON work_orders
FOR EACH ROW EXECUTE FUNCTION validate_wo_status_transition();
```

### Testing Strategy

**Risk-Based E2E Coverage:**
- HIGH RISK: Database constraints (prevent invalid data entry) = E2E required
- HIGH RISK: Data cleanup script (mass delete/update) = E2E + manual verification required
- COMPLEX: Validation dashboard (multi-tab UI, auto-fix logic) = E2E required
- Simple: Validation queries (SELECT only) = unit test sufficient

**E2E Test Scenarios:**
1. Create WO without BOM snapshot → trigger prevents creation (error shown)
2. Update WO status from 'planned' to 'completed' (skip 'released') → trigger rejects
3. Delete supplier with existing POs → FK constraint prevents deletion
4. Create TO with same from/to warehouse → CHECK constraint rejects
5. Run validation dashboard → orphaned records detected → delete button removes them
6. Export validation report → CSV downloaded with correct data

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/lib/supabase/migrations/XXX_planning_data_integrity_constraints.sql` - Constraints + triggers
- `apps/frontend/scripts/cleanupPlanningData.ts` - One-time cleanup script
- `apps/frontend/scripts/validatePlanningData.ts` - Validation queries + report generation
- `apps/frontend/app/settings/data-integrity/page.tsx` - Validation dashboard UI
- `apps/frontend/components/ValidationReport.tsx` - Validation report table
- `apps/frontend/components/OrphanedRecordsList.tsx` - Orphaned records list
- `apps/frontend/components/InvalidRecordsList.tsx` - Invalid records list with fix buttons
- `apps/frontend/__tests__/validatePlanningData.test.ts` - Unit tests
- `apps/frontend/e2e/planning-data-integrity.spec.ts` - E2E tests
- `docs/architecture.md` - Data integrity documentation
- `docs/TROUBLESHOOTING_PLANNING_DATA.md` - Troubleshooting guide

### MVP Scope

✅ **MVP Features** (ship this):
- WO/PO/TO validation queries (detect issues)
- Database constraints (NOT NULL, CHECK, FK triggers)
- Validation dashboard UI (view issues, export CSV)
- Manual fix buttons (delete orphaned, fix invalid)
- Validation report export (CSV)

❌ **Growth Phase** (defer):
- Auto-fix all issues (one-click bulk fix) - manual per-record in MVP
- Real-time validation (continuous monitoring) - on-demand "Run Validation" in MVP
- Validation history (track issues over time) - single snapshot in MVP
- Email alerts for data issues - dashboard only in MVP
- Advanced validation rules (cross-entity consistency) - basic rules in MVP

### Dependencies

**Prerequisites:**
- Epic 0 completed (PO warehouse_id, LP status/QA enums fixed)
- Existing work_orders, po_header, to_header tables
- Admin RBAC roles (for /settings/data-integrity page)

**Blocks:**
- None (independent story, can run in parallel with 1.4.1-1.4.3)

### Learnings from Epic 0

**From Epic 0 Retrospective:**
- Database reset strategy → avoid if possible, use targeted fixes in 1.4.4
- Automated validation tests → prevent future drift (Action Item #5)
- Risk-Based E2E Strategy → database constraints are HIGH RISK
- MVP Discipline → defer auto-fix-all, real-time monitoring to Growth

**Reuse Patterns:**
- Epic 0 migration pattern → apply to new constraints migration
- Epic 0 validation queries → extend to WO/PO/TO
- Epic 0 enum fix pattern → apply to status transition validation

## Dev Agent Record

### Context Reference

<!-- Will be added by story-context workflow -->

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
