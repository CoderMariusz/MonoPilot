# MonoPilot QA Pipeline v2.0

**Status**: 🔄 ACTIVE (Phase 2: Element-Level Testing)
**Start**: 2026-02-08 16:05 GMT
**Current Session**: Dashboard ✅ | Planning ✅ | Production 🔄 | Remaining: 5 modules ⏳

---

## Architecture

### Tester Agent (Opus)
- **Task**: Test module element-by-element sequentially
- **Method**: Browser automation (localhost:3000, full click coverage)
- **Marking**: Edit TEST_PLAN_*.md directly
  - ✅ Passed: `- [ ]` → `- [✓]`
  - ❌ Failed: `- [ ]` → `- [✗]` + add to bugs.md
- **Reporting**: Every 10 checkboxes with file edit proof
- **No Parallel**: 1 tester per module at a time

### Fixer Agent (Opus)
- **Task**: Fix bugs from bugs.md
- **Method**: sessions_spawn with full project context
- **Output**: Code fix + git commit + update bugs.md
  - Status: ⏳ Reported → ✅ Fixed
  - Add commit hash + date to bugs.md
- **Parallel OK**: Fixers work while testers test other modules

### Orchestration
1. **Tester-Dashboard** → finds bugs → writes to bugs.md
2. **Fixer-Dashboard** (parallel) → fixes bugs → updates bugs.md
3. **Tester-Planning** (parallel) → tests while Fixer-Dashboard works
4. **Fixer-Planning** (if needed) → fixes Planning bugs
5. **Tester-Production** → tests Production module
6. ... repeat for Settings, Technical, Scanner, Warehouse, Quality, Shipping

### Final Phase
**Tester-Retry**: Re-tests all [✗] checkboxes → [✓] until complete coverage

---

## Workflow

```
START
  ↓
Tester-Module-1 (test 5-10 elements per batch)
  ├→ Mark [✓] or [✗] in TEST_PLAN_*.md
  ├→ Add [✗] to bugs.md
  └→ Report every 10 checkboxes
  ↓
Fixer-Module-1 (parallel, if bugs found)
  ├→ Read bugs.md
  ├→ Fix code
  ├→ Commit + push
  └→ Update bugs.md (Status: ✅ Fixed)
  ↓
Tester-Module-2 (next module)
  └→ Repeat...
  ↓
(All modules tested + bugs found)
  ↓
Tester-Retry (parallel retesting)
  ├→ For each [✗] checkpoint
  ├→ Test after fix
  └→ Mark [✓] if passed
  ↓
COMPLETE (All checkboxes [✓])
```

---

## Status Tracker

| Module | Tester Status | Bugs Found | Fixer Status | [✓] Coverage |
|--------|---------------|-----------|--------------|--------------|
| Dashboard | ✅ DONE | 1 (Bug-001) | ✅ DONE | 28/31 + pending |
| Planning | ✅ DONE | ? | ⏳ Pending | ? |
| Production | 🔄 IN PROGRESS | 0 (so far) | - | 0/149 |
| Settings | ⏳ QUEUED | - | - | - |
| Technical | ⏳ QUEUED | - | - | - |
| Scanner | ⏳ QUEUED | - | - | - |
| Warehouse | ⏳ QUEUED | - | - | - |
| Quality | ⏳ QUEUED | - | - | - |
| Shipping | ⏳ QUEUED | - | - | - |

---

## Files

- **TEST_PLAN_*.md** (9 files) — Element checklists with [✓][✗] marks
- **bugs.md** — Bug registry with Status (⏳ Reported / ✅ Fixed)
- **pages.md** — Module index (reference only, not edited by testers)
- **PIPELINE.md** (this file) — Workflow documentation

---

## Key Rules

✅ **MUST:**
- 1 tester per module (no parallel testers)
- Edit TEST_PLAN_*.md directly (mark every checkbox)
- Report every 10 checkboxes with proof
- Add [✗] bugs to bugs.md immediately
- No skipping checkboxes
- Parallel fixers OK (they work while testers test other modules)

❌ **MUST NOT:**
- Skip checkboxes
- Leave checkboxes unmarked
- Test multiple modules simultaneously
- Run fixers and testers on same module parallel
- Stop early

---

## Dashboard Results

### Bug-001 (FIXED) ✅
- **Issue**: Create menu (WO, NCR, TO) navigate to list pages instead of create pages
- **Root**: `/new` pages redirect to list with `?action=create`, but list pages didn't handle it
- **Fix**: Added useEffect hooks to detect `?action=create` and open form modal automatically
- **Commit**: b25ba410
- **Status**: ✅ Fixed on 2026-02-08 16:26 UTC

### Tests Passed: 28/31
- Dashboard loads correctly
- Authentication works
- Modules visible/hidden based on org settings
- Create dropdown displays
- Search works with debounce
- Analytics/Reports pages exist
- Navigation works

### Tests Failed: 3
- Create WO menu item (FIXED)
- Create NCR menu item (FIXED)
- Create TO menu item (FIXED)

---

## Current Pipeline Activity

**Active Now:**
- 🔄 **Tester-Production-Phase2-Proper** (Production module testing, Batch 1 in progress)

**Waiting on Reports:**
- Planning test results (bugs.md update pending)
- Production Batch 1 report (due ~16:48 GMT)

**Next Actions:**
- Fixer-Planning (if bugs found)
- Tester-Settings
- Tester-Technical
- ... etc

---

## Notes

- **Environment**: localhost:3000 (admin@monopilot.com / test1234)
- **Test Method**: Browser automation, full click coverage, 5-10 elements per batch
- **Commit Strategy**: Every fix gets git commit + bugs.md update
- **Reporting**: Every 10 checkboxes, with file edit proof shown
- **Timeline**: Estimated 2-4 hours for full 9-module coverage (if 2-3 bugs per module)

---

**Pipeline Owner**: Mariusz Krawczyk  
**Last Updated**: 2026-02-08 16:46 GMT
