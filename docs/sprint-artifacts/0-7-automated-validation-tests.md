# Story 0.7: Automated Validation Tests (PREVENTION)

Status: ready-for-dev

## Story

As a **Development Team / DevOps Engineer**,
I want **automated validation scripts that verify DB ↔ TypeScript ↔ API consistency in CI/CD pipeline**,
so that **future data integrity issues are caught before they reach production**.

## Acceptance Criteria

### AC-1: Schema Validation Script
- Script compares database CHECK constraints with TypeScript enums
- Detects mismatches (missing values, case differences, extra values)
- Exits with error code if inconsistencies found
- Outputs detailed report with file:line references

### AC-2: API Contract Tests
- Tests verify API method signatures match TypeScript types
- Tests verify RPC functions use correct column names
- Tests verify API validation logic matches DB constraints
- Tests run in CI/CD pipeline

### AC-3: Enum Consistency Tests
- Unit tests for each enum verify completeness
- Tests compare enum values with DB query results
- Tests fail if DB and TypeScript are out of sync

### AC-4: Pre-Commit Hook Integration
- Git hook runs schema validation before commit
- Hook prevents commit if inconsistencies detected
- Hook provides clear error messages with fix instructions
- Hook can be bypassed with --no-verify (emergency only)

### AC-5: CI/CD Pipeline Integration
- Schema validation runs in GitHub Actions / GitLab CI
- Validation runs on: pre-commit, pre-push, pull request
- Failed validation blocks merge
- Validation report attached to PR

### AC-6: Documentation
- `docs/AUTOMATED_VALIDATION.md` created - explains validation system
- README.md updated with validation commands
- CONTRIBUTING.md updated with pre-commit requirements
- Architecture.md documents Pattern 18: Automated Schema Validation

### AC-7: Developer Experience
- Clear error messages with actionable fixes
- Fast execution (< 5 seconds for validation)
- Easy to run locally: `pnpm validate:schema`
- Easy to fix: Suggests which file to update

### AC-8: Quality Gates
- All validation scripts working
- Pre-commit hook installed on all dev machines
- CI/CD pipeline blocks inconsistent merges
- Zero false positives in validation

## Tasks / Subtasks

### Task 1: Schema Validation Script (AC-1) - 8 hours
- [ ] 1.1: Create `scripts/validate-schema.ts` script
- [ ] 1.2: Parse all migration files for CHECK constraints
- [ ] 1.3: Parse `lib/types.ts` for enum definitions
- [ ] 1.4: Compare DB constraints with TS enums (exact match)
- [ ] 1.5: Detect case mismatches, missing values, extra values
- [ ] 1.6: Generate detailed report with file:line references
- [ ] 1.7: Exit with error code if inconsistencies found
- [ ] 1.8: Add command to package.json: `pnpm validate:schema`

### Task 2: API Contract Tests (AC-2) - 6 hours
- [ ] 2.1: Create `__tests__/api-contracts.test.ts`
- [ ] 2.2: For each API class: Verify method signatures match types
- [ ] 2.3: Test RPC functions use correct column names
- [ ] 2.4: Verify API validation logic matches DB constraints
- [ ] 2.5: Add to CI test suite

### Task 3: Enum Consistency Tests (AC-3) - 4 hours
- [ ] 3.1: Create `__tests__/enum-consistency.test.ts`
- [ ] 3.2: For each enum: Query DB for valid values
- [ ] 3.3: Compare DB results with TypeScript enum
- [ ] 3.4: Fail test if mismatch detected
- [ ] 3.5: Add clear error messages

### Task 4: Pre-Commit Hook (AC-4) - 3 hours
- [ ] 4.1: Update `.husky/pre-commit` to run schema validation
- [ ] 4.2: Add clear error messages if validation fails
- [ ] 4.3: Provide fix instructions in error output
- [ ] 4.4: Test hook with intentional mismatch
- [ ] 4.5: Document --no-verify bypass (emergency only)

### Task 5: CI/CD Integration (AC-5) - 4 hours
- [ ] 5.1: Add schema validation job to `.github/workflows/ci.yml`
- [ ] 5.2: Run validation on: push, pull_request, pre-merge
- [ ] 5.3: Block merge if validation fails
- [ ] 5.4: Attach validation report to PR comments
- [ ] 5.5: Test CI workflow with failing validation

### Task 6: Documentation (AC-6) - 3 hours
- [ ] 6.1: Create `docs/AUTOMATED_VALIDATION.md`
- [ ] 6.2: Update `README.md` with validation commands
- [ ] 6.3: Update `CONTRIBUTING.md` with pre-commit requirements
- [ ] 6.4: Document Pattern 18 in `docs/architecture.md`
- [ ] 6.5: Add troubleshooting guide

### Task 7: Developer Experience (AC-7) - 2 hours
- [ ] 7.1: Improve error messages (actionable, clear)
- [ ] 7.2: Optimize script performance (< 5 seconds)
- [ ] 7.3: Add verbose mode for debugging
- [ ] 7.4: Create quick-fix suggestions in error output

### Task 8: Testing & Rollout (AC-8) - 3 hours
- [ ] 8.1: Test validation with all existing enums
- [ ] 8.2: Verify zero false positives
- [ ] 8.3: Test CI/CD pipeline end-to-end
- [ ] 8.4: Install pre-commit hook on all dev machines
- [ ] 8.5: Run validation on entire codebase

**Total Estimated Effort:** 33 hours (~4-5 days)

## Dev Notes

### Validation Script Architecture

**Script: `scripts/validate-schema.ts`**

```typescript
// Pseudo-code
async function validateSchema() {
  // Step 1: Parse migrations for CHECK constraints
  const dbConstraints = await parseCheckConstraints('apps/frontend/lib/supabase/migrations/');

  // Step 2: Parse TypeScript for enums
  const tsEnums = await parseTypeScriptEnums('apps/frontend/lib/types.ts');

  // Step 3: Compare
  const mismatches = compare(dbConstraints, tsEnums);

  // Step 4: Report
  if (mismatches.length > 0) {
    console.error('Schema Validation Failed:');
    mismatches.forEach(m => {
      console.error(`- ${m.table}.${m.column}:`);
      console.error(`  DB has: ${m.dbValues.join(', ')}`);
      console.error(`  TS has: ${m.tsValues.join(', ')}`);
      console.error(`  Missing in TS: ${m.missingInTS.join(', ')}`);
      console.error(`  Extra in TS: ${m.extraInTS.join(', ')}`);
      console.error(`  Fix: Update lib/types.ts:${m.tsLine}`);
    });
    process.exit(1);
  }

  console.log('✅ Schema validation passed');
}
```

**Parsing Logic:**
- Use regex to extract CHECK constraints from SQL
- Use TypeScript AST parser (ts-morph) to extract enums
- Compare arrays of values (case-sensitive, exact match)

### Example Mismatch Detection

**Case 1: Missing Value in TypeScript**
```
DB: CHECK (status IN ('draft', 'submitted', 'closed'))
TS: type Status = 'draft' | 'submitted'
ERROR: TypeScript missing 'closed' (found in DB)
FIX: Add 'closed' to Status type in lib/types.ts:123
```

**Case 2: Extra Value in TypeScript**
```
DB: CHECK (status IN ('draft', 'submitted'))
TS: type Status = 'draft' | 'submitted' | 'archived'
ERROR: TypeScript has 'archived' (not in DB)
FIX: Remove 'archived' OR add to DB CHECK constraint
```

**Case 3: Case Mismatch**
```
DB: CHECK (status IN ('available', 'reserved'))
TS: type Status = 'Available' | 'Reserved'
ERROR: Case mismatch (DB lowercase, TS PascalCase)
FIX: Change TS to lowercase: 'available' | 'reserved'
```

### Learnings from Epic 0

Epic 0 discovered 7 critical inconsistencies. This story creates automated prevention:
- Story 0.1: PO warehouse_id (missing column)
- Story 0.2: TO 'closed' status (missing in TS)
- Story 0.3: LP status enum (severe mismatch)
- Story 0.4: LP qa_status enum (case/naming mismatch)
- Story 0.5: LP uom constraint (too restrictive)
- Story 0.6: Deep audit findings (TBD)

**Root Cause:** No automated validation between layers.

**Solution:** Automated schema validation catches issues before commit.

### Integration with Development Workflow

**Developer Workflow:**
1. Developer modifies DB migration → adds new enum value
2. Pre-commit hook runs → detects TS enum not updated
3. Hook blocks commit → shows error message
4. Developer updates TS enum
5. Pre-commit runs again → validation passes
6. Commit succeeds

**CI/CD Workflow:**
1. Developer pushes code
2. GitHub Actions runs schema validation
3. If validation fails → PR blocked, comment added
4. Developer fixes inconsistency
5. Pushes fix → validation passes
6. PR can be merged

### Performance Optimization

**Target:** < 5 seconds for full validation

**Strategies:**
- Cache parsed migration files
- Use fast parsers (regex for SQL, ts-morph for TS)
- Parallel processing where possible
- Skip unchanged files (git diff)

### False Positive Prevention

**Challenge:** Distinguish intentional differences from errors

**Solutions:**
- Whitelist file: `schema-validation-ignore.json` for known exceptions
- Comments in code: `// schema-validation-ignore` for specific lines
- Clear documentation of exceptions

### References

- Epic 0 Roadmap: `docs/bmm-roadmap-epic-0-p0-fixes.md` (Story 0.7 summary)
- Audit Report: `docs/P0-MODULES-AUDIT-REPORT-2025-11-14.md` (all 7 problems)
- Stories 0.1-0.6: Lessons learned from manual inconsistency fixes

### Change Log

- **2025-11-14**: Story drafted

## Dev Agent Record

### Context Reference

- **Story Context:** `docs/sprint-artifacts/0-7-automated-validation-tests.context.xml`

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

<!-- Will be filled during dev-story execution -->

### Completion Notes List

<!-- Will be filled during dev-story execution -->

### File List

<!-- Will be filled during dev-story execution -->
