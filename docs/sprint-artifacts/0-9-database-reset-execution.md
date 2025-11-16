# Story 0.9: Database Reset Execution (CRITICAL)

Status: ready-for-dev

## Story

As a **Developer / Database Administrator**,
I want **to execute database reset with master migration on test DB first, then production**,
so that **100% schema consistency is achieved with validation before production deployment**.

## Acceptance Criteria

### AC-1: Test Database Dry Run
- Fresh test database created (separate from production)
- Master migration executed successfully on test DB
- Zero errors, all tables/constraints/indexes created
- Schema inspection confirms expectations
- Test DB remains available for validation

### AC-2: Schema Validation
- Query `information_schema.columns` to verify all expected columns
- Verify all 40+ tables exist
- Check all foreign keys, indexes, constraints
- Compare with Architecture.md expectations
- Validate Epic 0 audit fixes:
  - to_line.notes present ✓
  - locations.zone present ✓
  - po_header.warehouse_id present ✓
  - license_plates.status has 10 values ✓

### AC-3: TypeScript Types Regeneration
- Run `pnpm gen-types` successfully
- No TypeScript compilation errors
- Generated types match master migration schema
- All API files type-check correctly

### AC-4: Production Database Reset
- Backup existing production DB (if any critical data)
- DROP ALL tables in correct order (reverse FK dependencies)
- Execute master migration on production DB
- Verify zero errors, all objects created
- Confirm production schema matches test DB

### AC-5: UI/API Verification
- Start dev server (`pnpm frontend:dev`)
- Test critical workflows manually:
  - Login/Authentication
  - PO Create (Quick Entry)
  - TO Create (verify to_line.notes works)
  - Location management (verify zone field)
  - LP Create (verify status enum)
- No console errors, no 400 Bad Request
- Data loads correctly, no schema cache errors

### AC-6: E2E Test Suite
- Run `pnpm test:e2e:critical`
- All auth, PO, TO tests pass
- No schema-related failures
- Regression test: previously failing tests now pass

### AC-7: Documentation
- Update DATABASE_SCHEMA.md (regenerate from new DB)
- Document reset process in Epic 0 retrospective notes
- Record metrics: time taken, issues encountered

## Tasks / Subtasks

### Task 1: Test Database Setup (AC-1) - 1 hour
- [ ] 1.1: Create fresh test database (Supabase or local PostgreSQL)
- [ ] 1.2: Configure connection string for test DB
- [ ] 1.3: Verify test DB is empty and accessible

### Task 2: Test DB Migration Execution (AC-1) - 1 hour
- [ ] 2.1: Execute `master_migration.sql` on test DB
- [ ] 2.2: Monitor execution, capture any errors
- [ ] 2.3: Verify all tables created (query `pg_tables`)
- [ ] 2.4: Check logs for warnings or issues

### Task 3: Schema Validation on Test DB (AC-2) - 2 hours
- [ ] 3.1: Query all tables and columns
- [ ] 3.2: Verify to_line.notes exists
- [ ] 3.3: Verify locations.zone exists
- [ ] 3.4: Verify po_header.warehouse_id exists
- [ ] 3.5: Verify license_plates.status has 10 enum values
- [ ] 3.6: Check all foreign keys and indexes
- [ ] 3.7: Generate validation report

### Task 4: TypeScript Regeneration (AC-3) - 1 hour
- [ ] 4.1: Point `pnpm gen-types` to test DB (or use production after reset)
- [ ] 4.2: Run `pnpm gen-types`
- [ ] 4.3: Review generated `lib/supabase/generated.types.ts`
- [ ] 4.4: Run `pnpm type-check` - verify zero errors
- [ ] 4.5: Commit regenerated types

### Task 5: Production DB Reset (AC-4) - 2 hours
- [ ] 5.1: Backup production DB (export schema + data if needed)
- [ ] 5.2: Generate DROP ALL tables script (reverse order)
- [ ] 5.3: Execute DROP ALL on production
- [ ] 5.4: Execute `master_migration.sql` on production
- [ ] 5.5: Verify zero errors
- [ ] 5.6: Confirm schema matches test DB

### Task 6: Manual UI/API Verification (AC-5) - 2 hours
- [ ] 6.1: Start dev server
- [ ] 6.2: Test authentication flow
- [ ] 6.3: Test PO Create (Quick Entry)
- [ ] 6.4: Test TO Create (verify notes field works)
- [ ] 6.5: Test Location create/edit (verify zone field)
- [ ] 6.6: Test LP Create (verify status options)
- [ ] 6.7: Inspect browser console - no errors

### Task 7: E2E Test Suite (AC-6) - 1 hour
- [ ] 7.1: Run `pnpm test:e2e:auth`
- [ ] 7.2: Run `pnpm test:e2e:po`
- [ ] 7.3: Run `pnpm test:e2e:to`
- [ ] 7.4: Run `pnpm test:e2e:critical`
- [ ] 7.5: Verify all tests pass
- [ ] 7.6: Document any new failures

### Task 8: Documentation (AC-7) - 1 hour
- [ ] 8.1: Run `pnpm docs:update` (regenerate DATABASE_SCHEMA.md)
- [ ] 8.2: Verify DATABASE_SCHEMA.md reflects new schema
- [ ] 8.3: Add reset notes to Epic 0 retrospective
- [ ] 8.4: Record metrics: execution time, tables created, tests passed

**Total Estimated Effort:** 11 hours (~1.5 days)

## Dev Notes

### Pre-Requisites

**Must Complete First:**
- ✅ Story 0.8 (Master migration file ready)

**Required Resources:**
- Test database environment
- Production database access
- ~2 hours of focused, uninterrupted time for production reset

### Risk Mitigation

**Test DB First:**
- Validate migration on test DB before touching production
- Catch errors early, iterate if needed
- Provides confidence before production apply

**Backup Strategy:**
- Export production schema before DROP
- If critical data exists, export data too
- Rollback plan: restore from backup if catastrophic failure

**Validation Checkpoints:**
1. Test DB execution success
2. Schema inspection passes
3. Types regenerate correctly
4. UI/API manual tests pass
5. E2E tests pass

Only proceed to next checkpoint if previous passes!

### Expected Outcomes

**Schema Consistency:**
- 100% match between:
  - Architecture.md (source of truth)
  - Master migration (SQL definition)
  - Runtime database (actual schema)
  - TypeScript types (code expectations)

**Epic 0 Audit Issues RESOLVED:**
- ✅ to_line.notes exists and works
- ✅ locations.zone exists and works
- ✅ po_header.warehouse_id exists and works
- ✅ license_plates.status has 10 correct values

**Confidence Level:**
- Before reset: 50% (unknown state, drift issues)
- After reset: 100% (known state, validated)

### Rollback Plan

**If Test DB Fails:**
1. Review error messages
2. Fix master migration
3. Re-run Story 0.8 validation
4. Retry test DB

**If Production Reset Fails Mid-Execution:**
1. DO NOT PANIC
2. Review error message
3. If FK constraint issue: fix ordering, continue
4. If data issue: restore from backup
5. If syntax error: fix migration, DROP partial tables, retry

**If Post-Reset Tests Fail:**
1. Investigate which test/workflow fails
2. Check if schema issue or code issue
3. If schema: may need ALTER TABLE hotfix
4. If code: fix code, not schema

### Success Criteria

✅ Test DB migration executes cleanly
✅ Production DB migration executes cleanly
✅ All Epic 0 audit issues verified fixed
✅ TypeScript types regenerated correctly
✅ UI/API manual tests all pass
✅ E2E critical tests all pass
✅ Zero schema cache errors
✅ Zero 400 Bad Request errors

**Story Complete When:** Production DB reset, validated, and system working 100%

### Dependencies

**Inputs:**
- `master_migration.sql` from Story 0.8
- Test database environment
- Production database access

**Outputs:**
- Production database with 100% correct schema
- Regenerated TypeScript types
- Updated DATABASE_SCHEMA.md
- Validation report

**Blocks:**
- Story 0.11, 0.12 (need clean baseline before architecture work)
