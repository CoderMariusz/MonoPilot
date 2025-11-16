# AI Migration Generation Prompt

**Purpose**: Generate PostgreSQL migration file from Architecture.md schema definitions

**Story**: 0.12 - Architecture.md Auto-Generation Setup
**Version**: 1.0 (POC)

---

## Prompt for AI (Claude / GPT-4)

```
You are a PostgreSQL migration generator. Your task is to extract CREATE TABLE statements from Architecture.md and generate a complete, executable migration file.

INPUT:
- File: docs/architecture.md
- Section: "Database Schema Reference" (starts at line ~5197)
- Contains: 45 CREATE TABLE statements organized by module

OUTPUT:
- File: Generated master migration SQL
- Format: PostgreSQL 15 compatible SQL
- Ordering: Topologically sorted (no FK errors)
- Includes: All tables, indexes, constraints, comments

INSTRUCTIONS:

1. READ Architecture.md section "Database Schema Reference"
2. EXTRACT all SQL CREATE TABLE statements (45 tables)
3. ANALYZE dependencies (foreign keys)
4. SORT tables topologically:
   - Tables with no FKs first (suppliers, warehouses, etc.)
   - Tables with FKs after their referenced tables
   - Example: warehouses → locations → license_plates
5. GENERATE migration file with:
   - Header comment (date, story, purpose)
   - Extension enablement (uuid-ossp, pgcrypto if needed)
   - Enum types (if any)
   - CREATE TABLE statements in correct order
   - Indexes for each table
   - Comments on tables/columns (if any)

VALIDATION:
- All 45 tables included
- No FK references undefined table
- Syntax valid PostgreSQL 15
- No duplicate table definitions

EXAMPLE OUTPUT STRUCTURE:
```sql
-- Migration: Master Schema (Generated from Architecture.md)
-- Date: 2025-11-15
-- Story: 0.12 - Architecture.md Auto-Generation Setup
-- Tables: 45

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
CREATE TYPE product_group AS ENUM ('COMPOSITE', 'SIMPLE');
CREATE TYPE product_type AS ENUM ('RM', 'DG', 'PR', 'FG', 'WIP');

-- Tables (topologically sorted)

-- Level 0: No dependencies
CREATE TABLE users (...);
CREATE TABLE suppliers (...);
CREATE TABLE warehouses (...);
CREATE TABLE allergens (...);

-- Level 1: Depend on Level 0
CREATE TABLE locations (...); -- FK to warehouses
CREATE TABLE products (...); -- FK to suppliers

-- Level 2: Depend on Level 0 + 1
CREATE TABLE boms (...); -- FK to products
CREATE TABLE license_plates (...); -- FK to products, locations

-- ... continue for all levels

-- Indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_locations_warehouse_id ON locations(warehouse_id);
-- ... all indexes

```

EDGE CASES:
- If ENUM types found in CREATE TABLE → extract and define FIRST
- If REFERENCES auth.users(id) → ensure auth schema exists
- If circular FKs (rare) → create table WITHOUT FK, then ALTER TABLE ADD CONSTRAINT
- If IF NOT EXISTS present → keep it
- If CHECK constraints inline → keep them
- If GENERATED ALWAYS AS → keep syntax exact

RUN THIS PROMPT ON:
1. POC: 5 sample tables first (settings_tax_codes, suppliers, locations, license_plates, work_orders)
2. Full: All 45 tables

OUTPUT FILE:
- POC: master_migration_poc.sql
- Full: master_migration.sql
```

---

## Test Cases for POC

### Test 1: Simple Table (settings_tax_codes)
- Expected: Table created with primary key, unique constraint, indexes
- No dependencies

### Test 2: Medium Table (suppliers)
- Expected: Table with JSONB column, default values
- No dependencies

### Test 3: Medium-Complex (locations)
- Expected: FK to warehouses, proper ordering
- Depends on: warehouses

### Test 4: Complex (license_plates)
- Expected: Multiple FKs, CHECK constraints, self-referential FK
- Depends on: products, locations, work_orders

### Test 5: Very Complex (work_orders)
- Expected: Multiple FKs, status enum, business logic constraints
- Depends on: products, boms, machines, production_lines

### Expected POC Output Order:
```sql
-- 1. settings_tax_codes (no deps)
-- 2. suppliers (no deps)
-- 3. warehouses (no deps)
-- 4. locations (deps: warehouses)
-- 5. products (deps: suppliers)
-- ... then license_plates, work_orders
```

---

## Validation Checklist

- [ ] All 5 POC tables extracted
- [ ] Topological ordering correct
- [ ] Syntax valid (run through psql --dry-run)
- [ ] No FK errors
- [ ] Indexes included
- [ ] Comments preserved
- [ ] ENUM types defined (if any)
- [ ] Extensions enabled (if needed)

---

## Next Steps After POC

1. Review POC output
2. Identify issues/errors
3. Refine prompt
4. Iterate 2-3 times
5. Scale to full 45 tables (Task 3)
