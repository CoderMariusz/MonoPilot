# Story 0.8: Konsolidacja Migracji (64 → 1 Master) (CRITICAL)

Status: ready-for-dev

## Story

As a **Developer / Database Administrator**,
I want **all 64 migration files consolidated into 1 master migration file with dual validation**,
so that **database schema can be reset with 100% confidence and future maintenance is simplified**.

## Acceptance Criteria

### AC-1: Dual Generation Process
- AI (Mary) generates master migration FROM Architecture.md
- Manual merge of 64 existing migration files into single file
- Both approaches produce complete schema definitions
- All CREATE TABLE, INDEX, COMMENT, CONSTRAINT statements included

### AC-2: Diff Validation
- Automated diff between AI-generated vs manually-merged
- Identify discrepancies (missing tables, columns, constraints)
- Document differences with explanations
- Human review decides correct version for each discrepancy

### AC-3: Master Migration Quality
- Single file: `master_migration.sql` (~2000-3000 lines)
- Proper ordering: tables before foreign keys, types before tables
- All 40+ tables included with complete definitions
- Comments preserved from original migrations
- Readable structure with clear sections

### AC-4: Schema Completeness Verification
- All tables from DATABASE_SCHEMA.md present
- All columns from TypeScript types present
- All known issues from Epic 0 audit addressed:
  - to_line.notes (Pattern A)
  - locations.zone (Pattern B)
  - po_header.warehouse_id (Pattern C)
  - license_plates.status enum (Pattern C)

### AC-5: Documentation
- Migration header with purpose, date, Epic 0 reference
- Section comments for each module (Planning, Warehouse, Technical, etc.)
- Cross-reference to Architecture.md sections
- Rollback strategy documented

### AC-6: Validation Report
- Diff report saved to `docs/sprint-artifacts/0-8-migration-diff-report.md`
- List of all discrepancies found
- Decisions made for each discrepancy
- Final master migration approved and ready for 0.9

## Tasks / Subtasks

### Task 1: AI Generation from Architecture.md (AC-1) - 3 hours
- [ ] 1.1: Mary reads complete Architecture.md
- [ ] 1.2: Extract all SQL CREATE TABLE snippets
- [ ] 1.3: Generate complete schema with proper ordering
- [ ] 1.4: Add indexes, constraints, comments
- [ ] 1.5: Save as `master_migration_ai.sql`

### Task 2: Manual Merge of 64 Migrations (AC-1) - 4 hours
- [ ] 2.1: List all 64 migration files in order
- [ ] 2.2: Concatenate CREATE TABLE statements
- [ ] 2.3: Merge ALTER TABLE changes into CREATE statements
- [ ] 2.4: Consolidate indexes, constraints, comments
- [ ] 2.5: Save as `master_migration_manual.sql`

### Task 3: Diff Analysis (AC-2) - 2 hours
- [ ] 3.1: Run diff tool: `master_migration_ai.sql` vs `master_migration_manual.sql`
- [ ] 3.2: Categorize differences (missing table, column, type mismatch, etc.)
- [ ] 3.3: Document each discrepancy with context
- [ ] 3.4: Generate diff report

### Task 4: Human Review & Reconciliation (AC-2, AC-4) - 3 hours
- [ ] 4.1: Review diff report line by line
- [ ] 4.2: For each discrepancy, decide: AI version, manual version, or hybrid
- [ ] 4.3: Verify Epic 0 audit issues are addressed
- [ ] 4.4: Create final `master_migration.sql`

### Task 5: Quality Check (AC-3, AC-5) - 2 hours
- [ ] 5.1: Verify all 40+ tables present
- [ ] 5.2: Check proper ordering (no FK before table exists)
- [ ] 5.3: Validate SQL syntax (dry run parse)
- [ ] 5.4: Add header comments and documentation
- [ ] 5.5: Section organization and readability

### Task 6: Validation Report (AC-6) - 1 hour
- [ ] 6.1: Write diff report with all findings
- [ ] 6.2: Document decisions made
- [ ] 6.3: Save to `docs/sprint-artifacts/0-8-migration-diff-report.md`
- [ ] 6.4: Mark story as ready for review

**Total Estimated Effort:** 15 hours (~2 days)

## Dev Notes

### Context from Brainstorming Session

**Source:** `docs/brainstorming-session-results-2025-11-15.md`

**Audit Findings:**
- Pattern A: Migration 020 has `to_line.notes` but never executed
- Pattern B: TypeScript has `locations.zone` but migration 004 missing it
- Pattern C: Fix migrations 057, 058 exist but unknown if applied

**Drift Patterns:**
1. Migrations written but not executed
2. TypeScript updated but migrations not
3. Fix migrations status unclear

**Solution:** Reset DB with 1 master migration = 100% known state

### Dual Validation Strategy

**Why two approaches?**
- AI generation: Architecture.md as source of truth (what SHOULD be)
- Manual merge: Existing migrations (what WAS intended)
- Diff reveals: Drift, missing pieces, errors

**Expected Discrepancies:**
- locations.zone: AI will have it (from Architecture), manual won't (missing in 004)
- po_header.warehouse_id: Both should have it (migration 057 adds it)
- license_plates.status: Both should have 10 values (migration 058 fixes it)

### Success Criteria

✅ Master migration file created
✅ Diff report shows <10 discrepancies
✅ All Epic 0 audit issues addressed in final version
✅ Human review complete with documented decisions
✅ Ready for Story 0.9 (Test DB execution)

### Dependencies

**Inputs:**
- Architecture.md (source of truth)
- 64 migration files in `apps/frontend/lib/supabase/migrations/`
- Epic 0 audit findings

**Outputs:**
- `master_migration.sql` (final consolidated migration)
- `docs/sprint-artifacts/0-8-migration-diff-report.md` (validation report)

**Blocks:**
- Story 0.9 (cannot reset DB without master migration)
