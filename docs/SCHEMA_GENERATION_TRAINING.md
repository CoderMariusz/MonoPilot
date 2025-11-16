# Schema Generation Training Guide

**Audience**: New developers, technical leads, database administrators
**Time**: 30-45 minutes hands-on
**Prerequisites**: Basic SQL knowledge, familiarity with PostgreSQL
**Story**: 0.12 - Architecture.md Auto-Generation Setup

---

## Learning Objectives

After completing this training, you will be able to:

✅ Understand Architecture.md as single source of truth
✅ Generate master migration from Architecture.md
✅ Validate generated migrations
✅ Make schema changes safely
✅ Troubleshoot common issues
✅ Maintain schema consistency across layers

---

## Part 1: Understanding the "Why" (10 minutes)

### The Problem We Solved

**Before Story 0.12:**
- ❌ Schema drift between DB, types, API, documentation
- ❌ Manual migration writing (error-prone, time-consuming)
- ❌ Inconsistent table definitions across 85+ migration files
- ❌ 22% schema coverage in Architecture.md (10/45 tables)
- ❌ Type mismatches (UUID vs SERIAL, TEXT vs VARCHAR)

**After Story 0.12:**
- ✅ Architecture.md = single source of truth (100% coverage)
- ✅ Automated migration generation (1 command)
- ✅ Zero drift (all layers derive from one source)
- ✅ Type safety guaranteed
- ✅ 45/45 tables documented with complete SQL

### The Solution: First Principles Approach

```
Architecture.md (Human edits HERE)
    ↓ Automated generation
Master Migration SQL
    ↓ Execute
PostgreSQL Database
    ↓ pnpm gen-types
TypeScript Types
    ↓ Build
UI/API (Type-safe)
```

**Key Principle**: Humans edit Architecture.md ONLY. Everything else is automated.

**Why This Works**:
- Single source eliminates drift
- Automation eliminates human error
- Type generation ensures stack-wide consistency
- Documentation is always accurate (it IS the source)

---

## Part 2: Hands-On Exercise (20 minutes)

### Exercise 1: Generate Master Migration (5 min)

**Goal**: Generate complete migration from Architecture.md

**Steps**:

1. **Navigate to project root**:
   ```bash
   cd /path/to/MonoPilot
   ```

2. **Run generation script**:
   ```bash
   node scripts/generate-master-migration.mjs
   ```

3. **Observe output**:
   ```
   📖 Reading Architecture.md...
     Extracting users (level 0)...
     Extracting suppliers (level 0)...
     ...
   ✅ Generated migration with 45 tables
   💾 Saving to master_migration.sql...
   ✨ Done!
   ```

4. **Verify output file**:
   ```bash
   ls -lh master_migration.sql
   # Should be ~50KB, 1000+ lines
   ```

**✓ Checkpoint**: You should have a `master_migration.sql` file in project root.

---

### Exercise 2: Validate Migration (5 min)

**Goal**: Verify migration is correct and executable

**Steps**:

1. **Count tables**:
   ```bash
   grep -c "^CREATE TABLE" master_migration.sql
   # Expected: 45
   ```

2. **Check topological order**:
   ```bash
   grep -n "^-- Table:" master_migration.sql | head -10
   ```

   **Expected output** (Level 0 tables first):
   ```
   33:-- Table: users
   53:-- Table: suppliers
   78:-- Table: warehouses
   91:-- Table: allergens
   106:-- Table: settings_tax_codes
   ...
   ```

3. **Check ENUMs defined**:
   ```bash
   grep "CREATE TYPE" master_migration.sql
   ```

   **Expected**:
   ```sql
   CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
   CREATE TYPE product_group AS ENUM ('COMPOSITE', 'SIMPLE');
   CREATE TYPE product_type AS ENUM ('RM', 'DG', 'PR', 'FG', 'WIP');
   ```

4. **Check for syntax errors**:
   ```bash
   grep -i "error\|invalid" master_migration.sql || echo "✓ No errors"
   ```

**✓ Checkpoint**: All checks pass, no errors found.

---

### Exercise 3: Make a Schema Change (10 min)

**Scenario**: Product manager requests adding `minimum_stock_level` to `products` table

**Steps**:

1. **Open Architecture.md**:
   ```bash
   code docs/architecture.md
   # or: vim docs/architecture.md
   ```

2. **Find products table** (search for "#### products"):
   - Located in "Production & Core Tables" section
   - Around line 6098

3. **Add new column**:
   ```sql
   CREATE TABLE products (
     id SERIAL PRIMARY KEY,
     part_number VARCHAR(100) UNIQUE NOT NULL,
     description TEXT NOT NULL,
     ...
     minimum_stock_level NUMERIC(12,4),  -- ← ADD THIS LINE
     ...
   );
   ```

4. **Save file**

5. **Regenerate migration**:
   ```bash
   node scripts/generate-master-migration.mjs
   ```

6. **Verify change**:
   ```bash
   grep "minimum_stock_level" master_migration.sql
   ```

   **Expected**:
   ```sql
   minimum_stock_level NUMERIC(12,4),
   ```

7. **Create incremental migration**:
   ```bash
   echo "ALTER TABLE products ADD COLUMN minimum_stock_level NUMERIC(12,4);" > migrations/058_add_minimum_stock_level.sql
   ```

8. **Test on local DB** (if available):
   ```bash
   psql monopilot_dev < migrations/058_add_minimum_stock_level.sql
   ```

9. **Regenerate types**:
   ```bash
   pnpm gen-types
   ```

10. **Verify TypeScript type updated**:
    ```typescript
    // lib/supabase/generated.types.ts
    export interface Product {
      id: number
      part_number: string
      description: string
      ...
      minimum_stock_level: number | null  // ← NEW!
    }
    ```

**✓ Checkpoint**: Schema change propagated to DB → Types → Code

---

## Part 3: Common Scenarios (10 minutes)

### Scenario A: Adding a New Table

**Request**: "Add a `batches` table to track raw material batches"

**Solution**:

1. **Determine dependencies**:
   - Batches links to `products` (which product)
   - Batches links to `suppliers` (batch origin)
   - **Level**: 3 (depends on products, suppliers from Level 0-2)

2. **Add to Architecture.md**:
   ```markdown
   #### batches

   \`\`\`sql
   CREATE TABLE batches (
     id SERIAL PRIMARY KEY,
     batch_number VARCHAR(100) UNIQUE NOT NULL,
     product_id INTEGER REFERENCES products(id),
     supplier_id INTEGER REFERENCES suppliers(id),
     received_date TIMESTAMPTZ NOT NULL,
     expiry_date TIMESTAMPTZ,
     quantity NUMERIC(12,4) NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   \`\`\`
   ```

3. **Update generation script**:
   ```javascript
   // scripts/generate-master-migration.mjs
   const TABLE_LEVELS = {
     ...
     3: [
       'product_allergens', 'boms', 'bom_history', 'batches',  // ← ADD HERE
       ...
     ],
   };
   ```

4. **Regenerate and test**:
   ```bash
   node scripts/generate-master-migration.mjs
   grep "batches" master_migration.sql  # Verify placement
   ```

---

### Scenario B: Changing a Column Type

**Request**: "Change `po_header.exchange_rate` from NUMERIC(12,6) to NUMERIC(15,8)"

**Solution**:

1. **Update Architecture.md**:
   ```sql
   CREATE TABLE po_header (
     ...
     exchange_rate NUMERIC(15,8),  -- Changed from (12,6)
     ...
   );
   ```

2. **Create migration**:
   ```sql
   -- migrations/059_update_exchange_rate_precision.sql
   ALTER TABLE po_header ALTER COLUMN exchange_rate TYPE NUMERIC(15,8);
   ```

3. **Regenerate master migration** (for new installs):
   ```bash
   node scripts/generate-master-migration.mjs
   ```

4. **Test carefully** (data migration!):
   ```sql
   -- Check existing data fits new type
   SELECT MAX(exchange_rate) FROM po_header;
   -- If > 999999.99999999 → data loss risk!
   ```

---

### Scenario C: Handling Circular Dependencies

**Request**: "Table A needs FK to B, Table B needs FK to A"

**Problem**: Can't create A (references B which doesn't exist), can't create B (references A which doesn't exist)

**Solution Pattern**:

```sql
-- Create tables WITHOUT circular FKs
CREATE TABLE table_a (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  -- b_id INTEGER,  -- DON'T add FK yet
  ...
);

CREATE TABLE table_b (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  -- a_id INTEGER,  -- DON'T add FK yet
  ...
);

-- NOW add FK constraints
ALTER TABLE table_a ADD COLUMN b_id INTEGER REFERENCES table_b(id);
ALTER TABLE table_b ADD COLUMN a_id INTEGER REFERENCES table_a(id);
```

**In Generation Script**:
- Create both tables at same level
- Add note: "Circular FK - see manual migration for ALTER TABLE"

---

## Part 4: Troubleshooting Practice (5 minutes)

### Problem 1: "FK references undefined table"

**Symptom**:
```
ERROR: relation "products" does not exist
```

**Diagnosis**:
- FK created before referenced table
- Topological order wrong

**Fix**:
1. Check TABLE_LEVELS in generation script
2. Ensure referenced table is in earlier level
3. Regenerate

---

### Problem 2: "ENUM type not found"

**Symptom**:
```
ERROR: type "bom_status" does not exist
```

**Diagnosis**:
- Table uses ENUM before it's defined

**Fix**:
1. Ensure ENUMs defined at top of migration (lines 15-20)
2. Check ENUM name matches exactly
3. Regenerate

---

### Problem 3: "Column ambiguity"

**Symptom**:
Architecture.md has column, but generated migration doesn't

**Diagnosis**:
- Malformed SQL in Architecture.md
- Extraction regex didn't match

**Fix**:
1. Validate SQL syntax in Architecture.md
2. Check column definition format
3. Run extraction script with --debug flag (if available)

---

## Part 5: Best Practices & Pitfalls (5 minutes)

### ✅ DO

1. **Always edit Architecture.md first**
   - THEN regenerate migration
   - NEVER edit migration directly

2. **Test on dev database first**
   - `monopilot_dev` before `monopilot_prod`
   - Use transactions: `BEGIN; ... ROLLBACK;`

3. **Version control everything**
   - Commit Architecture.md changes
   - Commit generated migration
   - Commit incremental migrations

4. **Document WHY, not WHAT**
   - SQL shows WHAT
   - Comments explain WHY

5. **Use meaningful names**
   - `migrations/058_add_minimum_stock_level.sql` ✅
   - `migrations/058_update.sql` ❌

### ❌ DON'T

1. **Don't skip regeneration**
   - After editing Architecture.md, MUST regenerate
   - Otherwise drift starts immediately

2. **Don't edit generated files manually**
   - `master_migration.sql` is auto-generated
   - Edit source (Architecture.md) instead

3. **Don't deploy without validation**
   - Always run validation steps (Part 2, Exercise 2)
   - Check table count, ordering, syntax

4. **Don't ignore warnings**
   - Script warnings indicate real problems
   - "Table not found" → fix it!

5. **Don't commit sensitive data**
   - Migrations should only have structure
   - No passwords, keys, PII

---

## Part 6: Reference Links

### Essential Documents

1. **SCHEMA_GENERATION.md** - Complete technical guide
   - Location: `docs/SCHEMA_GENERATION.md`
   - Topics: Workflow, validation, troubleshooting

2. **Architecture.md** - Single source of truth
   - Location: `docs/architecture.md`
   - Section: "Database Schema Reference" (line ~5197)

3. **Story 0.12 Documentation** - Implementation details
   - Location: `docs/sprint-artifacts/0-12-architecture-auto-generation-setup.md`
   - Contains: Story context, tasks, completion notes

4. **Audit Report** - Historical context
   - Location: `docs/sprint-artifacts/0-11-architecture-audit-report.md`
   - Shows: Why we implemented this solution

### Tools & Scripts

- **Generation Script**: `scripts/generate-master-migration.mjs`
- **Extraction Script**: `scripts/extract-schema-to-architecture.mjs`
- **POC Migration**: `master_migration_poc.sql` (5 tables example)
- **Full Migration**: `master_migration.sql` (45 tables)

### External Resources

- PostgreSQL 15 Docs: https://www.postgresql.org/docs/15/
- Supabase Schema Management: https://supabase.com/docs/guides/database
- Topological Sorting: https://en.wikipedia.org/wiki/Topological_sorting

---

## Part 7: Quick Reference

### Commands Cheat Sheet

```bash
# Generate master migration
node scripts/generate-master-migration.mjs

# Validate migration
grep -c "^CREATE TABLE" master_migration.sql  # Should be 45

# Check table order
grep -n "^-- Table:" master_migration.sql | head

# Test migration
createdb test_db && psql test_db < master_migration.sql && dropdb test_db

# Regenerate TypeScript types
pnpm gen-types

# Update documentation
pnpm docs:update
```

### File Locations

```
docs/
  architecture.md                     # SOURCE OF TRUTH
  SCHEMA_GENERATION.md                # Technical guide
  SCHEMA_GENERATION_TRAINING.md       # This file
  sprint-artifacts/
    0-12-architecture-auto-generation-setup.md  # Story docs

scripts/
  generate-master-migration.mjs       # Generation script
  extract-schema-to-architecture.mjs  # Extraction script

master_migration.sql                  # Generated migration (DO NOT EDIT)
master_migration_poc.sql              # POC example (5 tables)

migrations/
  058_add_feature.sql                 # Incremental migrations
  058_add_feature_rollback.sql        # Rollback scripts
```

---

## Completion Checklist

After completing this training, you should be able to:

- [ ] Explain why Architecture.md is single source of truth
- [ ] Generate master migration from Architecture.md
- [ ] Validate generated migration (6-step process)
- [ ] Add a new column to existing table
- [ ] Add a new table with correct dependencies
- [ ] Identify and fix FK ordering issues
- [ ] Identify and fix ENUM definition issues
- [ ] Create incremental migrations
- [ ] Test migrations on dev database
- [ ] Regenerate TypeScript types after schema changes
- [ ] Know where to find help (docs, scripts, story context)

---

## Next Steps

**For New Developers**:
1. Complete hands-on exercises (Part 2)
2. Read SCHEMA_GENERATION.md in detail
3. Review Architecture.md structure
4. Shadow experienced developer on first schema change

**For Technical Leads**:
1. Review generation script internals
2. Understand topological sorting algorithm
3. Plan schema evolution strategy
4. Set up CI/CD validation (optional)

**For Database Administrators**:
1. Review migration validation steps
2. Set up backup/rollback procedures
3. Monitor schema drift
4. Plan database versioning strategy

---

## Training Completion

**Date Completed**: _______________
**Trainer**: _______________
**Trainee**: _______________

**Questions?**
- Story 0.12 context: `docs/sprint-artifacts/0-12-architecture-auto-generation-setup.md`
- Technical guide: `docs/SCHEMA_GENERATION.md`
- Ask team in #database-schema Slack channel

**Feedback**:
Please provide feedback on this training to improve it for future developers.

---

**Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Ready for Use ✅
