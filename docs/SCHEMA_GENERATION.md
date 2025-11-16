# Schema Generation from Architecture.md

**Purpose**: Complete guide for generating PostgreSQL migrations from Architecture.md
**Story**: 0.12 - Architecture.md Auto-Generation Setup
**Status**: ✅ PRODUCTION READY
**Last Updated**: 2025-11-15

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture.md as Single Source of Truth](#architecturemd-as-single-source-of-truth)
3. [Generation Workflow](#generation-workflow)
4. [Validation Steps](#validation-steps)
5. [Future Schema Changes](#future-schema-changes)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Topics](#advanced-topics)

---

## Overview

MonoPilot uses **Architecture.md as the single source of truth** for database schema. All migrations, TypeScript types, and API definitions derive from this one document.

**Benefits**:
- ✅ No schema drift between layers
- ✅ Single source to maintain
- ✅ Automated migration generation
- ✅ Type safety across stack
- ✅ Clear documentation

**Workflow**:
```
Architecture.md (Single Source)
    ↓ Generate migration (automated)
Master Migration SQL
    ↓ Execute
PostgreSQL Database
    ↓ pnpm gen-types
TypeScript Types
    ↓ Build
UI/API
```

---

## Architecture.md as Single Source of Truth

### Location

File: `docs/architecture.md`
Section: **Database Schema Reference** (starts at line ~5197)

### Structure

The schema reference contains:
- **45 tables** organized by module
- Complete CREATE TABLE statements
- SQL constraints, indexes, comments
- Business logic annotations

**Modules**:
1. Planning Module (9 tables) - PO, TO, WO
2. Technical Module (5 tables) - BOM, Routing
3. Warehouse Module (13 tables) - LP, ASN, GRN
4. Settings Module (4 tables) - Tax, Allergens
5. Cost Module (4 tables) - Costing, Pricing
6. Production/Core (10 tables) - Users, Products, Machines

### Example Table Definition

```markdown
#### suppliers

\`\`\`sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  vat_number VARCHAR(50),
  ...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`
```

---

## Generation Workflow

### Method 1: Automated Script (Recommended)

**Script**: `scripts/generate-master-migration.mjs`

```bash
# Generate complete master migration
node scripts/generate-master-migration.mjs
```

**Output**: `master_migration.sql` (1000+ lines, all 45 tables)

**What it does**:
1. Reads Architecture.md Database Schema Reference section
2. Extracts all CREATE TABLE statements
3. Analyzes FK dependencies
4. Sorts tables topologically (7 levels)
5. Adds ENUM types, extensions, comments
6. Generates complete migration file

**Topological Levels**:
- **Level 0**: users, suppliers, warehouses, allergens (no deps)
- **Level 1**: locations, machines, production_lines (→ Level 0)
- **Level 2**: products, routings (→ Level 0+1)
- **Level 3**: boms, bom_items, routing_operations (→ Level 0-2)
- **Level 4**: work_orders, po_header, to_header (→ Level 0-3)
- **Level 5**: wo_materials, po_line, to_line, grn_items (→ Level 0-4)
- **Level 6**: license_plates, lp_genealogy, stock_moves (→ Level 0-5)

### Method 2: Manual AI Prompt

If script unavailable, use this prompt with Claude/GPT-4:

```
Extract all CREATE TABLE statements from docs/architecture.md section "Database Schema Reference".
Sort tables topologically by FK dependencies.
Generate complete PostgreSQL 15 migration file with:
- Extensions (uuid-ossp, pgcrypto)
- ENUM types (bom_status, product_group, product_type)
- All 45 tables in correct order
- Indexes and constraints
Output to: master_migration.sql
```

See `docs/SCHEMA_GENERATION_PROMPT.md` for detailed AI prompt.

---

## Validation Steps

### Step 1: Table Count

```bash
grep -c "^CREATE TABLE" master_migration.sql
# Expected: 45
```

### Step 2: Topological Order Check

```bash
# Verify foundation tables come first
grep -n "^-- Table:" master_migration.sql | head -10

# Should show: users, suppliers, warehouses, allergens, settings_tax_codes, etc.
```

### Step 3: FK Reference Validation

```bash
# Extract all FK references
grep "REFERENCES" master_migration.sql > fk_refs.txt

# Manually verify no table references another before it's created
# Or use: scripts/validate-fk-order.mjs (if exists)
```

### Step 4: Syntax Validation

```bash
# Dry run with PostgreSQL (if available)
psql --dry-run -f master_migration.sql

# Or use online SQL validator
```

### Step 5: Test Database Run

```bash
# Create test database
createdb monopilot_test

# Run migration
psql monopilot_test < master_migration.sql

# Verify all tables created
psql monopilot_test -c "\dt"
# Expected: 45 tables

# Drop test database
dropdb monopilot_test
```

### Step 6: Compare with Current Schema

```bash
# If DATABASE_SCHEMA.md exists
diff <(grep "^###" docs/DATABASE_SCHEMA.md | sort) \
     <(grep "^-- Table:" master_migration.sql | sed 's/^-- Table: //' | sort)

# Should show no differences (all tables match)
```

---

## Future Schema Changes

### Workflow for Adding New Column

**Example**: Add `shelf_life_days` to `products` table

#### Step 1: Edit Architecture.md

Find products table in Database Schema Reference section:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  ...
  shelf_life_days INTEGER,  -- ← ADD THIS LINE
  ...
);
```

#### Step 2: Regenerate Migration

```bash
node scripts/generate-master-migration.mjs
```

#### Step 3: Generate Incremental Migration

```bash
# Compare old vs new master migration
diff master_migration_old.sql master_migration.sql > schema_changes.diff

# Extract just the ALTER TABLE statement
# CREATE incremental migration: migrations/XXX_add_shelf_life_days.sql
```

**Incremental Migration**:
```sql
-- Migration: Add shelf_life_days to products
-- Date: 2025-11-15
-- Story: 1.5.3

ALTER TABLE products ADD COLUMN shelf_life_days INTEGER;
```

#### Step 4: Apply to Database

```bash
# Development
psql monopilot_dev < migrations/XXX_add_shelf_life_days.sql

# Production (via Supabase)
npx supabase db push
```

#### Step 5: Regenerate Types

```bash
pnpm gen-types
```

#### Step 6: Update Code

TypeScript types now include `shelf_life_days`:

```typescript
const product: Product = {
  id: 1,
  part_number: 'RM-001',
  shelf_life_days: 365  // ✓ Type-safe!
};
```

### Workflow for Adding New Table

**Example**: Add `customers` table

#### Step 1: Add to Architecture.md

Insert new table definition in appropriate module section:

```markdown
#### customers

\`\`\`sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`
```

#### Step 2: Update Generation Script

Edit `scripts/generate-master-migration.mjs`:

```javascript
const TABLE_LEVELS = {
  0: [
    'users', 'suppliers', 'warehouses', 'customers',  // ← ADD HERE
    ...
  ],
  ...
};
```

Determine correct level based on FK dependencies.

#### Step 3-6: Same as "Adding New Column"

---

## Troubleshooting

### Issue: "Table not found in Architecture.md"

**Cause**: Table name mismatch or missing table definition

**Solution**:
1. Check table name spelling (case-sensitive in some contexts)
2. Verify table exists in Database Schema Reference section
3. Check format: `#### table_name` followed by ` \`\`\`sql CREATE TABLE ... \`\`\``

### Issue: "FK references undefined table"

**Cause**: Topological ordering incorrect

**Solution**:
1. Check `TABLE_LEVELS` in generation script
2. Ensure referenced table is in earlier level
3. Example: If `products → suppliers`, then suppliers must be Level 0-1, products Level 2+

**Circular FK**:
If true circular dependency (rare), use this pattern:
```sql
-- Create table WITHOUT FK
CREATE TABLE table_a (...);
CREATE TABLE table_b (...);

-- Add FK constraint AFTER both tables exist
ALTER TABLE table_a ADD CONSTRAINT fk_a_b FOREIGN KEY (b_id) REFERENCES table_b(id);
ALTER TABLE table_b ADD CONSTRAINT fk_b_a FOREIGN KEY (a_id) REFERENCES table_a(id);
```

### Issue: "ENUM type not found"

**Cause**: ENUM used before definition

**Solution**:
- ENUMs MUST be defined before any CREATE TABLE that uses them
- In generation script, ENUMs are hardcoded at top
- If adding new ENUM, add to script:

```javascript
output += `CREATE TYPE my_new_enum AS ENUM ('value1', 'value2');\n`;
```

### Issue: "Syntax error in generated SQL"

**Cause**: Malformed SQL in Architecture.md

**Solution**:
1. Validate SQL in Architecture.md manually
2. Check for unmatched parentheses, missing commas
3. Ensure proper constraint syntax
4. Test SQL snippet in psql:
   ```sql
   CREATE TEMP TABLE test_table (id SERIAL PRIMARY KEY, ...);
   ```

### Issue: "Migration too large"

**Cause**: Single migration file > 10MB (rare)

**Solution**:
- Split into multiple migrations by module
- Run sequentially: `001_foundation.sql`, `002_planning.sql`, etc.

---

## Advanced Topics

### Idempotent Migrations

Use `IF NOT EXISTS` and `IF EXISTS` for safe re-runs:

```sql
CREATE TABLE IF NOT EXISTS products (...);
CREATE INDEX IF NOT EXISTS idx_products_part_number ON products(part_number);
DROP TABLE IF EXISTS deprecated_table;
```

### Rollback Migrations

For every migration, create rollback:

**Up**: `001_add_feature.sql`
```sql
CREATE TABLE new_table (...);
```

**Down**: `001_add_feature_rollback.sql`
```sql
DROP TABLE IF EXISTS new_table;
```

### Schema Versioning

Track schema version in database:

```sql
CREATE TABLE schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('2025-11-15-master');
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Schema Validation
on: [pull_request]

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Check Architecture.md changed
        id: check
        run: |
          git diff --name-only origin/main | grep "docs/architecture.md" && echo "changed=true" >> $GITHUB_OUTPUT

      - name: Regenerate migration
        if: steps.check.outputs.changed == 'true'
        run: node scripts/generate-master-migration.mjs

      - name: Validate migration
        run: |
          docker run --rm -v $(pwd):/work postgres:15 \
            psql --dry-run -f /work/master_migration.sql
```

### Full Stack Auto-Generation (Future)

**Vision** (Story 0.12 Moonshot):

```
Architecture.md
    ↓ AI generates
Master Migration + TypeScript Types + Zod Schemas + API Boilerplate + UI Forms
```

**Phase 1** (Current): Migration generation ✅
**Phase 2** (Future): Type generation from Architecture.md
**Phase 3** (Future): API scaffold generation
**Phase 4** (Future): UI form generation

---

## Summary Checklist

**Before making schema changes**:
- [ ] Architecture.md is up to date
- [ ] All team members aware of change
- [ ] Backup current database
- [ ] Test migration on dev environment

**Schema change process**:
- [ ] Edit Architecture.md Database Schema Reference
- [ ] Run `node scripts/generate-master-migration.mjs`
- [ ] Validate generated SQL (steps 1-6 above)
- [ ] Create incremental migration (if needed)
- [ ] Test on local/dev database
- [ ] Run `pnpm gen-types`
- [ ] Update code to use new schema
- [ ] Commit Architecture.md + migration files
- [ ] Deploy to production
- [ ] Verify production schema

**Maintenance**:
- [ ] Keep Architecture.md synced with production
- [ ] Document all schema changes in git commits
- [ ] Review topological ordering quarterly
- [ ] Update generation script for new dependencies
- [ ] Archive old migrations (>6 months)

---

## Questions & Support

**Common Questions**:

**Q: Do I edit migrations manually?**
A: NO. Edit Architecture.md only. Regenerate migration from it.

**Q: What if I need a quick fix?**
A: For emergencies, can apply manual migration, but MUST update Architecture.md afterward to stay in sync.

**Q: How do I handle data migrations?**
A: Data migrations are separate from schema migrations. Create `data_migration_XXX.sql` files. Architecture.md only defines structure, not data.

**Q: Can I use migration tools like Flyway/Liquibase?**
A: Yes, but Architecture.md remains source of truth. Migration tools apply the generated SQL files.

**Support**:
- Story 0.12 documentation: `docs/sprint-artifacts/0-12-architecture-auto-generation-setup.md`
- Audit report: `docs/sprint-artifacts/0-11-architecture-audit-report.md`
- AI prompt reference: `docs/SCHEMA_GENERATION_PROMPT.md`
- GitHub issues: Report problems with generation workflow

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Status**: Production Ready ✅
