# Tests Directory - New Structure

> Reorganized: 2026-02-10
> All test-related files consolidated from root directory

---

## 📁 Directory Structure

```
tests/
├── README.md                    # E2E test framework docs (existing)
├── INDEX.md                     # YOU ARE HERE
├── playwright.config.ts         # E2E test configuration
│
├── plans/                       # Test planning documents
│   ├── TEST_PLAN_DASHBOARD.md
│   ├── TEST_PLAN_PLANNING.md
│   ├── TEST_PLAN_PRODUCTION.md
│   ├── TEST_PLAN_QUALITY.md
│   ├── TEST_PLAN_SCANNER.md
│   ├── TEST_PLAN_SETTINGS.md
│   ├── TEST_PLAN_SHIPPING.md
│   ├── TEST_PLAN_TECHNICAL.md
│   └── TEST_PLAN_WAREHOUSE.md
│
├── scripts/                     # Test scripts & utilities
│   ├── test-*.js / .mjs / .ts   # Module-specific test scripts (30+)
│   ├── run-qa-tests.js          # QA test runner
│   ├── run-qa-tests.mjs         # QA test runner (ESM)
│   ├── create-test-holds.mjs    # Test data creation
│   ├── insert-test-holds.mjs    # Test data insertion
│   ├── insert-test-holds.sql    # SQL for test data
│   └── debug-routings.mjs       # Debug routing scripts
│
├── artifacts/                   # Test screenshots & outputs
│   ├── test*.png                # Screenshots from test runs
│   ├── logout-test-*.png        # Auth-related screenshots
│   ├── debug-screenshot.png     # Debug artifacts
│   └── angela-test.md           # Manual test notes
│
├── reports/                     # Test execution reports
│   ├── test_output.txt          # Raw test output
│   ├── test-output.txt          # Test output log
│   ├── test_results.json        # Structured results
│   ├── test-po-output.txt       # Purchase order test output
│   ├── test-run-output.txt      # Run output
│   ├── test_backup.tar.gz       # Backup archive
│   └── test_backup.tar.gz.meta.json
│
├── archive/                     # Historical bug reports
│   ├── bugs.md                  # All bug reports (consolidated → CONSOLIDATED-BUG-TRACKER.md)
│   ├── BUG-018-FIX-VERIFICATION.md
│   ├── BUG-SC-002-FIX-SUMMARY.md
│   ├── BUG_B7_003_FIX_REPORT.md
│   ├── WAREHOUSE_BUG_FIXES.md
│   └── E2E_TEST_FIXES_SUMMARY.md
│
├── support/                     # Existing support infrastructure
│   └── (unchanged)
│
├── pages/                       # Existing page objects
│   └── (unchanged)
│
└── (E2E tests)                  # Existing test files
    └── (unchanged)
```

---

## 📖 File Guide

### Test Plans (`tests/plans/`)
Module-specific test strategies and acceptance criteria.

**Files:** `TEST_PLAN_*.md` (9 files)  
**Use:** Before implementing features, review acceptance criteria  
**Who:** QA, Developers, Product team

**Example:**
```bash
# Before starting Feature 03.10
cat tests/plans/TEST_PLAN_PLANNING.md
# → Review ACs, test scenarios, edge cases
```

### Test Scripts (`tests/scripts/`)
Executable scripts for test data creation, validation, and automation.

**Files:** `test-*.js/mjs/ts`, `run-qa-tests.*`, `create-test-holds.*`  
**Use:** Running automated QA, seeding test data, debugging  
**Who:** QA Engineers, Developers

**Example:**
```bash
# Seed test data for scanner
npm run seed:scanner

# Run QA tests for specific module
node tests/scripts/run-qa-tests.mjs --module=planning
```

### Test Artifacts (`tests/artifacts/`)
Screenshots, images, and manual test notes from test executions.

**Files:** `*.png`, `*.md`  
**Use:** Visual regression testing, documentation  
**Who:** QA team

### Test Reports (`tests/reports/`)
Test execution outputs, results, and logs.

**Files:** `*.txt`, `*.json`, `*.tar.gz`  
**Use:** Analyzing test failures, archiving results  
**Who:** QA lead, CI/CD systems

### Historical Archives (`tests/archive/`)
Old bug reports and fix summaries (for reference).

**Consolidated Into:** `CONSOLIDATED-BUG-TRACKER.md` (root directory)

---

## 🔍 What Moved From Root?

### Test Files (60 files moved to `tests/`)
✅ TEST_PLAN_*.md (10 files) → `tests/plans/`  
✅ test-*.mjs, test-*.js, test-*.ts (30+ files) → `tests/scripts/`  
✅ test*.png, logout-test*.png (images) → `tests/artifacts/`  
✅ test_output.txt, test-results.json (reports) → `tests/reports/`  
✅ test_backup.tar.gz → `tests/reports/`  
✅ create-test-holds.mjs, insert-test-holds.* → `tests/scripts/`  
✅ run-qa-tests.js/mjs → `tests/scripts/`  
✅ debug-routings.mjs → `tests/scripts/`  

### Bug Files (Consolidated to 1)
✅ bugs.md (649 lines) → `ROOT/CONSOLIDATED-BUG-TRACKER.md`  
✅ BUG-018-FIX-VERIFICATION.md → Archive  
✅ BUG-SC-002-FIX-SUMMARY.md → Archive  
✅ BUG_B7_003_FIX_REPORT.md → Archive  
✅ WAREHOUSE_BUG_FIXES.md → Archive  
✅ E2E_TEST_FIXES_SUMMARY.md → Archive  

Original files preserved in `tests/archive/` for historical reference.

---

## 📊 Cleanup Results

| Type | Before | After |
|------|--------|-------|
| **Test files in root** | 60 | 0 |
| **Bug files in root** | 5+ | 0 (consolidated to 1) |
| **Root directory clutter** | EXTREME | CLEAN ✅ |
| **Test organization** | Chaos | Structured ✅ |

---

## 🎯 How to Use

### Finding Test Plans
```bash
# View all test plans
ls tests/plans/

# Read specific module plan (before implementing)
cat tests/plans/TEST_PLAN_WAREHOUSE.md
```

### Running Test Scripts
```bash
# See available test scripts
ls tests/scripts/

# Run a test script
node tests/scripts/test-dashboard.js

# Or use npm run if setup in package.json
npm run test:dashboard
```

### Accessing Test Results
```bash
# View latest test output
cat tests/reports/test_output.txt

# View structured results
cat tests/reports/test_results.json | jq .

# Check test backups
ls -lh tests/reports/*.tar.gz
```

### Bug Tracking
```bash
# See all consolidated bugs (root directory)
cat CONSOLIDATED-BUG-TRACKER.md

# Historical individual reports (if needed)
cat tests/archive/bugs.md
```

---

## 📝 Next Steps

### For Developers
1. Before implementing feature → Check `tests/plans/TEST_PLAN_YOURMODULE.md`
2. Follow acceptance criteria
3. Create tests based on test plan
4. Run test scripts during development

### For QA
1. Use test plans as baseline
2. Run test scripts with `npm run test:*`
3. Capture artifacts in `tests/artifacts/`
4. Log results in `tests/reports/`

### For Tracking Bugs
1. Check `CONSOLIDATED-BUG-TRACKER.md` in root for all bug history
2. Add new bugs with status/severity
3. Keep reports for ~6 months then move to `tests/archive/`

---

## References

- **E2E Test Docs:** `tests/README.md`
- **Bug Tracker:** `CONSOLIDATED-BUG-TRACKER.md` (root)
- **Project Dashboard:** `.claude/PROJECT-DASHBOARD.md`
- **Implementation Roadmap:** `.claude/IMPLEMENTATION-ROADMAP.yaml`
