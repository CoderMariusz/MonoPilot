# Story 0.4: RLS Policy Test Suite

**Epic:** Sprint 0 (Gap 4: RLS Policy Test Suite Missing)
**Type:** Security Test Suite
**Priority:** Critical (P0) - Multi-Tenant Security
**Effort:** 3-4 days
**Owner:** Senior Dev + Security Engineer

---

## User Story

As a **Security Engineer**,
I want automated tests for RLS policies on all database tables,
So that we prevent data leakage between tenants (organizations).

---

## Business Context

Row Level Security (RLS) is the **foundation of multi-tenancy** in MonoPilot:
- **40+ tables** with `org_id` column (organization isolation)
- **RLS Policies** enforce `WHERE org_id = current_user_org_id()` on all queries
- **Critical Security Requirement:** Org A cannot see/modify Org B's data

**Without RLS Tests:**
- ❌ Risk: Developer adds new table without RLS policy
- ❌ Risk: RLS policy misconfigured (wrong column, missing predicate)
- ❌ Risk: Data leakage during JOIN queries (tables without RLS)
- ❌ Risk: Admin user bypass accidentally exposed to normal users

**With Automated RLS Tests:**
- ✅ CI/CD fails if new table lacks RLS policy
- ✅ Every table tested for org isolation
- ✅ Cross-org access blocked and logged
- ✅ 100% confidence in multi-tenant security

---

## RLS Policy Coverage

### Tables Requiring RLS (40+ Total)

**Epic 1: Settings Module (11 tables)**
1. organizations (special: NO RLS, foundation table)
2. users (RLS: users.org_id = current_user_org_id())
3. user_sessions (RLS via users FK)
4. warehouses (RLS: warehouses.org_id)
5. locations (RLS: locations.org_id)
6. machines (RLS: machines.org_id)
7. production_lines (RLS: production_lines.org_id)
8. allergens (SHARED TABLE - no RLS, global data)
9. tax_codes (RLS: tax_codes.org_id)
10. module_activations (RLS: module_activations.org_id)
11. settings (RLS: settings.org_id)

**Epic 2: Technical Module (8 tables)**
12. products (RLS: products.org_id)
13. product_versions (RLS via products FK)
14. product_allergens (RLS via products FK)
15. boms (RLS: boms.org_id)
16. bom_items (RLS via boms FK)
17. routings (RLS: routings.org_id)
18. routing_operations (RLS via routings FK)
19. product_types (RLS: product_types.org_id)

**Epic 3: Planning Module (9 tables)**
20. purchase_orders (RLS: purchase_orders.org_id)
21. po_lines (RLS via purchase_orders FK)
22. asns (RLS: asns.org_id)
23. asn_items (RLS via asns FK)
24. transfer_orders (RLS: transfer_orders.org_id)
25. to_lines (RLS via transfer_orders FK)
26. work_orders (RLS: work_orders.org_id)
27. wo_materials (RLS via work_orders FK)
28. suppliers (RLS: suppliers.org_id)

**Epic 4: Production Module (5 tables)**
29. wo_consumption (RLS via work_orders FK)
30. wo_operations (RLS via work_orders FK)
31. wo_output (RLS via work_orders FK)
32. production_logs (RLS via work_orders FK)
33. by_products (RLS via work_orders FK)

**Epic 5: Warehouse Module (8 tables)**
34. license_plates (RLS: license_plates.org_id)
35. lp_genealogy (RLS via license_plates FK - both parent and child)
36. lp_movements (RLS via license_plates FK)
37. grns (RLS: grns.org_id)
38. grn_items (RLS via grns FK)
39. pallets (RLS: pallets.org_id)
40. pallet_items (RLS via pallets FK)
41. inventory_counts (RLS: inventory_counts.org_id)

**Epic 6: Quality Module (6 tables)**
42. qa_tests (RLS: qa_tests.org_id)
43. qa_test_results (RLS via qa_tests FK)
44. quality_holds (RLS via license_plates FK)
45. ncrs (RLS: ncrs.org_id)
46. certificates (RLS via license_plates FK)
47. qa_status_history (RLS via license_plates FK)

**Epic 7: Shipping Module (5 tables)**
48. sales_orders (RLS: sales_orders.org_id)
49. so_lines (RLS via sales_orders FK)
50. shipments (RLS: shipments.org_id)
51. shipment_picks (RLS via shipments FK)
52. packages (RLS via shipments FK)

**Total:** 52 tables (40 with RLS, 2 without: organizations, allergens)

---

## Acceptance Criteria

### AC 1: RLS Policy Test Framework Setup

**Given** PostgreSQL database with all tables created
**And** Test framework: SQL unit tests (pgTAP or custom SQL scripts)

**When** running RLS test suite
**Then** verify framework setup:
- ✅ Test runner script: `npm run test:rls` or `pnpm test:rls`
- ✅ Test output: Detailed pass/fail per table
- ✅ CI/CD integration: Fail build if any test fails
- ✅ Test execution time: <60 seconds for all 40+ tables

---

### AC 2: Basic RLS Policy Test (Per Table)

**Test Template for Each Table with `org_id`:**

**Given** 2 test organizations: Org A (ID: 123), Org B (ID: 456)
**And** Table: `products` with RLS policy enabled

**When** testing products table RLS:

1. **Setup:**
   - Insert test data:
     - Product A1: org_id = 123 (Org A)
     - Product A2: org_id = 123 (Org A)
     - Product B1: org_id = 456 (Org B)

2. **Test as Org A User:**
   ```sql
   SET app.current_user_org_id = '123';
   SELECT * FROM products;
   ```
   - ✅ Result: 2 rows (A1, A2 only)
   - ❌ NOT visible: Product B1 (different org)

3. **Test as Org B User:**
   ```sql
   SET app.current_user_org_id = '456';
   SELECT * FROM products;
   ```
   - ✅ Result: 1 row (B1 only)
   - ❌ NOT visible: Products A1, A2 (different org)

4. **Test Cross-Org Write Prevention:**
   ```sql
   SET app.current_user_org_id = '123'; -- Org A user
   UPDATE products SET name = 'Hacked!' WHERE id = 'Product B1'; -- Org B record
   ```
   - ❌ Update fails: 0 rows affected (RLS blocks cross-org write)
   - ✅ Product B1 unchanged

5. **Test Cross-Org Delete Prevention:**
   ```sql
   SET app.current_user_org_id = '123'; -- Org A user
   DELETE FROM products WHERE id = 'Product B1'; -- Org B record
   ```
   - ❌ Delete fails: 0 rows affected (RLS blocks cross-org delete)
   - ✅ Product B1 still exists

**Repeat for all 40 tables with `org_id` column.**

---

### AC 3: Foreign Key RLS Inheritance Test

**Given** Tables with FK relationships (no direct `org_id` column):
- `bom_items` (FK: bom_id → boms.org_id)
- `po_lines` (FK: po_id → purchase_orders.org_id)
- `grn_items` (FK: grn_id → grns.org_id)

**When** testing FK-based RLS:

**Example: bom_items table**
```sql
-- Setup
INSERT INTO boms (id, org_id) VALUES ('BOM-A', '123'), ('BOM-B', '456');
INSERT INTO bom_items (bom_id, product_id, qty) VALUES
  ('BOM-A', 'PROD-1', 10), -- Org A item
  ('BOM-B', 'PROD-2', 20); -- Org B item

-- Test as Org A
SET app.current_user_org_id = '123';
SELECT * FROM bom_items; -- Should see only BOM-A item
```

**Then** verify FK-based RLS:
- ✅ Org A sees: bom_items for BOM-A only
- ❌ Org A cannot see: bom_items for BOM-B (FK enforces org isolation)
- ✅ RLS policy: `bom_items.bom_id IN (SELECT id FROM boms WHERE org_id = current_user_org_id())`

**Repeat for all tables using FK-based RLS (12+ tables).**

---

### AC 4: Genealogy Table RLS (Dual FK Check)

**Special Case:** `lp_genealogy` has 2 FKs (parent_lp_id, child_lp_id)

**Given** genealogy records:
- LP-A1 (Org A) → LP-A2 (Org A) - Valid link
- LP-B1 (Org B) → LP-B2 (Org B) - Valid link
- LP-A1 (Org A) → LP-B2 (Org B) - Cross-org link (should not exist)

**When** testing lp_genealogy RLS:
```sql
SET app.current_user_org_id = '123'; -- Org A
SELECT * FROM lp_genealogy;
```

**Then** verify dual FK RLS:
- ✅ Sees: LP-A1 → LP-A2 (both LPs in Org A)
- ❌ Does NOT see: LP-B1 → LP-B2 (both LPs in Org B)
- ❌ Does NOT see: Any cross-org links (data integrity violation)

**RLS Policy:**
```sql
CREATE POLICY lp_genealogy_select ON lp_genealogy
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM license_plates
    WHERE id = parent_lp_id AND org_id = current_user_org_id()
  )
  OR EXISTS (
    SELECT 1 FROM license_plates
    WHERE id = child_lp_id AND org_id = current_user_org_id()
  )
);
```

---

### AC 5: Admin User Bypass (Super Admin)

**Given** Super Admin user (org_id = NULL, bypasses RLS)
**When** Super Admin queries any table:
```sql
SET app.current_user_org_id = NULL; -- Super Admin
SELECT * FROM products;
```

**Then** verify bypass behavior:
- ✅ Sees ALL products from ALL orgs (no RLS filtering)
- ⚠️ Warning: Super Admin access logged to audit trail
- ✅ Use case: Support team troubleshooting cross-org issues

**Security Check:** Ensure normal users cannot set `app.current_user_org_id = NULL`

---

### AC 6: RLS Performance Test

**Given** Large dataset: 10,000 products across 100 orgs
**When** querying products as Org A:
```sql
SET app.current_user_org_id = '123';
SELECT * FROM products LIMIT 100;
```

**Then** verify performance:
- ✅ Query executes in <100ms (RLS doesn't degrade performance)
- ✅ Query plan uses index: `products_org_id_idx`
- ✅ Explain plan shows: `Index Scan using products_org_id_idx`

**Performance Requirement:** RLS queries must use org_id index (not seq scan)

---

### AC 7: JOIN Query RLS Enforcement

**Given** JOIN across multiple tables:
```sql
SELECT p.name, b.bom_number
FROM products p
JOIN boms b ON p.id = b.product_id;
```

**When** Org A user executes JOIN
**Then** verify RLS on both tables:
- ✅ Products filtered: p.org_id = '123'
- ✅ BOMs filtered: b.org_id = '123'
- ✅ Result: Only products + BOMs from Org A
- ❌ NO cross-org data leakage via JOIN

---

### AC 8: Shared Tables Without RLS

**Given** Shared tables (global data, no org isolation):
- `allergens` (14 EU allergens + custom allergens)
- `countries` (country list for org settings)

**When** any user queries shared table:
```sql
SELECT * FROM allergens;
```

**Then** verify shared access:
- ✅ All orgs see same allergen list (no RLS policy)
- ✅ Custom allergens still org-specific (allergens.org_id = '123')

**RLS Policy for Shared Tables:**
```sql
-- Global allergens: NO RLS
-- Custom allergens: RLS on org_id
CREATE POLICY allergens_select ON allergens
FOR SELECT USING (
  is_global = TRUE OR org_id = current_user_org_id()
);
```

---

### AC 9: New Table Detection (CI/CD Enforcement)

**Given** Developer adds new table: `inventory_adjustments`
**And** Forgets to add RLS policy

**When** CI/CD runs RLS test suite
**Then** verify detection:
- ❌ Test fails: "Table 'inventory_adjustments' has 'org_id' column but NO RLS policy"
- ❌ Build fails (block merge to main)
- ✅ Error message: "Add RLS policy or add table to RLS_EXEMPT list if intentional"

**Test Implementation:**
```sql
-- Query to find tables with org_id but no RLS
SELECT tablename
FROM pg_tables t
WHERE schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = t.tablename AND column_name = 'org_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = t.tablename
  )
  AND tablename NOT IN ('organizations'); -- Exempt list
```

---

### AC 10: RLS Audit Logging

**Given** Cross-org access attempt (malicious or accidental)
**When** Org A user tries to access Org B data:
```sql
SET app.current_user_org_id = '123';
SELECT * FROM products WHERE id = 'PRODUCT-B1'; -- Org B product
```

**Then** verify audit logging:
- ❌ Query returns 0 rows (RLS blocks access)
- ✅ Audit log entry created:
  - `event: 'rls_blocked_access'`
  - `user_id`, `org_id`, `table: 'products'`, `attempted_id: 'PRODUCT-B1'`
  - `timestamp`
- ⚠️ Alert triggered if >10 blocked attempts in 1 minute (possible attack)

---

## Test Data Setup

### Test Fixture (SQL)

```sql
-- Create test orgs
INSERT INTO organizations (id, name) VALUES
  ('123', 'Test Org A'),
  ('456', 'Test Org B');

-- Create test users
INSERT INTO users (id, org_id, email) VALUES
  ('user-a', '123', 'usera@orga.com'),
  ('user-b', '456', 'userb@orgb.com');

-- For each table, insert 2 rows per org
-- Example for products:
INSERT INTO products (id, org_id, name) VALUES
  ('PROD-A1', '123', 'Product A1'),
  ('PROD-A2', '123', 'Product A2'),
  ('PROD-B1', '456', 'Product B1'),
  ('PROD-B2', '456', 'Product B2');

-- Repeat for all 40 tables...
```

---

## Success Criteria

- ✅ All 40+ tables with `org_id` tested
- ✅ All FK-based RLS policies tested (12+ tables)
- ✅ Genealogy dual-FK RLS tested
- ✅ Super Admin bypass verified
- ✅ Performance benchmarks met (<100ms per query)
- ✅ JOIN queries enforce RLS on all tables
- ✅ New table detection automated (CI/CD)
- ✅ Audit logging for blocked access attempts
- ✅ Test suite runs in <60 seconds
- ✅ 100% RLS coverage documented

---

## Technical Notes

**Test Framework:** PostgreSQL pgTAP or custom SQL scripts
**Test Runner:** `pnpm test:rls` (CI/CD integration)
**Test File:** `db/tests/rls_policies.test.sql`

**RLS Policy Template:**
```sql
-- Enable RLS on table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY products_select ON products
FOR SELECT USING (org_id = current_user_org_id());

-- INSERT policy
CREATE POLICY products_insert ON products
FOR INSERT WITH CHECK (org_id = current_user_org_id());

-- UPDATE policy
CREATE POLICY products_update ON products
FOR UPDATE USING (org_id = current_user_org_id());

-- DELETE policy
CREATE POLICY products_delete ON products
FOR DELETE USING (org_id = current_user_org_id());
```

**Database Function:**
```sql
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.current_user_org_id', TRUE);
$$ LANGUAGE SQL STABLE;
```

---

## Dependencies

**Database Tables:** All 40+ tables across Epic 1-7
**Supabase:** RLS policies managed via Supabase Dashboard or SQL migrations
**CI/CD:** GitHub Actions running `pnpm test:rls` on every PR

---

## Definition of Done

- [ ] Test script created: `db/tests/rls_policies.test.sql`
- [ ] All 40+ tables tested for RLS compliance
- [ ] CI/CD integration: `pnpm test:rls` runs on every PR
- [ ] New table detection automated (fails CI if missing RLS)
- [ ] Documentation: "RLS Policy Guide" with examples
- [ ] Security reviewed by Security Engineer + DBA
- [ ] 100% test coverage for multi-tenant isolation

---

**Created:** 2025-11-20
**Sprint:** Sprint 0 (Gap 4)
**Reference:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 4)
**Security Compliance:** Multi-Tenant Data Isolation (SOC 2 requirement)
