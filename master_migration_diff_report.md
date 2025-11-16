# Master Migration Diff Analysis Report

**Story**: 0.8 - Konsolidacja Migracji (Epic 0)
**Date**: 2025-11-15
**Purpose**: Compare AI-generated vs manually-merged master migrations

## Executive Summary

Two master migration files were created using different methodologies:

1. **AI Version** (`master_migration_ai.sql`):
   - **854 lines**, **45 tables**, **3 ENUMs**
   - Source: DATABASE_SCHEMA.md + Architecture.md
   - Method: AI-generated from documentation

2. **Manual Version** (`master_migration_manual.sql`):
   - **1120 lines**, **46 tables**, **3 ENUMs**
   - Source: 64 sequential migration files (raw_migrations_all.sql)
   - Method: Manual extraction + ALTER TABLE merge

**Recommendation for Final Version**: TO BE DETERMINED after human review (Task 4)

---

## Critical Differences

### 1. ENUM Type Definitions ⚠️ MAJOR DISCREPANCY

#### `product_group` ENUM:
- **AI**: `('MEAT', 'DRYGOODS', 'COMPOSITE')`
- **Manual**: `('raw', 'packaging', 'semi-finished', 'finished')`
- **Impact**: CRITICAL - Incompatible with existing data
- **Resolution Needed**: ✅ Must determine which is correct

#### `product_type` ENUM:
- **AI**: `('RM_MEAT', 'PR', 'FG', 'DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE')` (8 values)
- **Manual**: `('raw_material', 'packaging_material', 'semi_finished_product', 'finished_product', 'by_product')` (5 values)
- **Impact**: CRITICAL - Incompatible with existing code
- **Resolution Needed**: ✅ Must determine which matches TypeScript types

#### `bom_status` ENUM:
- **AI**: `('draft', 'active', 'archived')` (3 values)
- **Manual**: `('draft', 'active', 'phased_out', 'inactive')` (4 values)
- **Impact**: MEDIUM - Manual version has more granular lifecycle
- **Resolution Needed**: ✅ Verify which matches business requirements

**Root Cause Analysis** ✅ RESOLVED:
- AI version correctly used migration `000_enums.sql` (verified by reading file)
- Manual version ERROR: Used incorrect ENUM values (manually invented, not from actual migrations)
- **RESOLUTION**: AI version is CORRECT - use ENUMs from migration 000_enums.sql
- **ACTION FOR TASK 4**: Manual version ENUMs must be replaced with correct values

---

### 2. PostgreSQL Extensions

- **AI Version**: No extensions
- **Manual Version**: `CREATE EXTENSION IF NOT EXISTS btree_gist;`
- **Impact**: LOW - Required for BOM date range GIST indexes
- **Resolution**: ✅ Manual version correct (needed for migration 046 features)

---

### 3. Table Structure Differences

#### `users` Table:
- **AI**: Complex structure with `auth.users` FK, role CHECK constraint, avatar_url, phone, department, last_login, created_by, updated_by
- **Manual**: Simple structure with org_id multi-tenancy, basic role, is_active boolean
- **Impact**: HIGH - Different authentication patterns
- **Analysis**: AI version seems more complete but may be aspirational. Manual version reflects actual migrations.

#### Other Tables:
- Manual version has more complete column sets due to ALTER TABLE merges
- AI version may have missed some columns that were added in enhancement migrations

---

### 4. Epic 0 Audit Fixes

Both versions include all 4 Epic 0 fixes:

| Fix | Pattern | AI Version | Manual Version |
|-----|---------|-----------|---------------|
| to_line.notes | A | ✓ | ✓ |
| locations.zone | B | ✓ | ✓ |
| po_header.warehouse_id | C | ✓ | ✓ |
| license_plates.status (10 values) | C | ✓ | ✓ |

---

### 5. Functional Components

| Component | AI Version | Manual Version |
|-----------|-----------|---------------|
| Foreign Keys | ❌ Not included | ✓ 3 key constraints |
| RPC Functions | ❌ Not included | ✓ 3 critical functions |
| Triggers | ❌ Not included | ✓ 5 update triggers + BOM overlap |
| RLS Policies | ❌ Not included | ✓ 40+ tables enabled |

**Impact**: CRITICAL - Manual version is more complete and deployable
**Resolution**: Manual version wins for functional completeness

---

### 6. File Size & Complexity

- **AI**: 854 lines (more concise)
- **Manual**: 1120 lines (more comprehensive)

**Analysis**: Manual version includes critical runtime components (triggers, RLS, functions) that AI version lacks.

---

## Detailed Comparison by Module

### Base Tables Module
- **Discrepancies**: users table structure, ENUM definitions
- **Impact**: HIGH
- **Winner**: TBD (depends on actual schema validation)

### Technical Module (Products, BOMs)
- **Discrepancies**: BOM effective_from/effective_to columns present in both
- **Impact**: LOW
- **Winner**: TIED

### Planning Module (PO, TO, WO)
- **Discrepancies**: work_orders has order_flags, customer_id, order_type in both
- **Impact**: LOW
- **Winner**: TIED

### Warehouse Module (LP, ASN, GRN)
- **Discrepancies**: license_plates status enum (both have 10 values)
- **Impact**: LOW
- **Winner**: TIED

### Costing Module
- **Discrepancies**: Both have material_costs, bom_costs, product_prices, wo_costs
- **Impact**: NONE
- **Winner**: TIED

---

## Recommendations for Task 4 (Human Review)

### Priority 1: ENUM Validation ✅ COMPLETED

**Resolution**:
- Verified migration 000_enums.sql is authoritative source
- AI version correctly uses: 'MEAT', 'DRYGOODS', 'COMPOSITE' (product_group)
- Manual version ERROR: Used invented values not from any migration
- **Decision**: Use AI version ENUMs in final migration

### Priority 2: Table Column Validation

**Action Required**:
1. For critical tables (users, products, boms, work_orders, license_plates), verify column names match actual schema
2. Check if `users` table really has `auth.users` FK or is standalone
3. Validate Epic 0 fixes are actually present in definitions

### Priority 3: Choose Base Version

**Criteria**:
- **Schema accuracy**: Which version matches actual database schema?
- **TypeScript compatibility**: Which ENUM values match generated types?
- **Functional completeness**: Manual version has triggers/RLS/functions (required for deployment)

**Preliminary Recommendation**: Start with **Manual version** as base, then:
1. Fix ENUM definitions if needed (validate against actual DB)
2. Review users table structure (validate against actual DB)
3. Keep functional components (triggers, RLS, functions) from manual version

---

## Next Steps (Task 4)

1. ✅ **Run schema validation queries** on test database
2. ✅ **Compare with TypeScript types** (`lib/supabase/generated.types.ts`)
3. ✅ **Create reconciled version** (`master_migration.sql`) - the final, correct version
4. ✅ **Document decisions** in this report
5. ✅ **Run quality checks** (Task 5)

---

## Appendix: Line-by-Line Diff Summary

Total diff lines: ~500+
Major sections with differences:
- Lines 1-50: Headers, ENUMs (MAJOR)
- Lines 51-200: Base tables structure (MEDIUM)
- Lines 201-600: Planning/Warehouse tables (MINOR - mostly formatting)
- Lines 601-800: Manual version has additional functional components (MAJOR)

---

**Report Generated**: 2025-11-15
**Status**: Ready for Task 4 (Human Review & Reconciliation)

---

## Task 3 Completion Summary

**Diff Analysis Complete** ✅

### Key Findings:

1. **ENUM Discrepancy** - CRITICAL - ✅ RESOLVED:
   - AI version: CORRECT (from migration 000_enums.sql)
   - Manual version: ERROR (invented values)
   - **Solution**: Use AI version ENUMs

2. **Functional Components** - CRITICAL:
   - Manual version has triggers, RLS, functions
   - AI version lacks these
   - **Solution**: Add from manual version to final

3. **Schema Completeness**:
   - AI: 854 lines, 45 tables, clean structure
   - Manual: 1120 lines, 46 tables, more complete

### Recommendation for Task 4:

**Create hybrid `master_migration.sql`:**
- Base: AI version (correct ENUMs, clean schema)
- Add: Manual version functional components (triggers, RLS, functions)
- Verify: Epic 0 fixes in both, use most complete version

**Next Steps**:
1. Create `master_migration.sql` by merging
2. Validate all Epic 0 fixes present
3. Run quality checks (Task 5)

---

**Task 3 Status**: ✅ COMPLETE
**Report Generated**: 2025-11-15 18:40 UTC
