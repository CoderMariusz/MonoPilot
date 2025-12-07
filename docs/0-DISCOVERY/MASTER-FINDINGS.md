# MonoPilot - Master Findings Report

**Discovery Session:** DS-002
**Date:** 2025-12-06
**Status:** Complete - Ready for Action

---

## Executive Summary

Przeprowadzono równoległą analizę projektu MonoPilot w 3 track-ach. Zidentyfikowano **16 issues** do naprawienia przed kontynuacją Epic 4.

| Track | Agent | Issues Found |
|-------|-------|--------------|
| A | ARCHITECT | 5 (1 HIGH, 3 MED, 1 LOW) |
| B | FRONTEND-DEV | 10 (2 CRITICAL, 3 HIGH, 3 MED, 2 LOW) |
| C | DOC-AUDITOR | 8 files needing update |

---

## Priority Matrix

### P0 - BLOCKING (Fix First)

| ID | Track | Issue | Effort |
|----|-------|-------|--------|
| A-1 | RLS | Missing RLS on `production_outputs` | 1h |
| B-1 | UI | BOMItemFormModal brakuje byproducts/conditional flags | 4h |
| B-2 | UI | BOMFormModal brakuje routing_id, packaging fields | 2h |

### P1 - HIGH (Fix This Sprint)

| ID | Track | Issue | Effort |
|----|-------|-------|--------|
| A-2 | RLS | Duplicate auth logic in API routes | 4h |
| A-3 | RLS | Redundant org_id lookups in services | 2h |
| B-3 | UI | BOMItemFormModal brakuje line_ids assignment | 2h |
| B-4 | UI | ProductFormModal brakuje Supplier selection | 1h |
| C-1 | Docs | .claude/TABLES.md is template only | 4h |
| C-2 | Docs | .claude/FILE-MAP.md outdated | 2h |

### P2 - MEDIUM (Next Sprint)

| ID | Track | Issue | Effort |
|----|-------|-------|--------|
| A-4 | RLS | Inconsistent service patterns | 4h |
| A-5 | RLS | Missing RLS on wo_materials, lp_genealogy | 2h |
| B-5 | UI | POLineFormModal brakuje tax calculation | 1h |
| B-6 | UI | WorkOrderFormModal machines vs production_lines | 1h |
| C-3 | Docs | 6 OLD UX files need archiving | 0.5h |
| C-4 | Docs | 39 context/ directories empty | 4h |

### P3 - LOW (Backlog)

| ID | Track | Issue | Effort |
|----|-------|-------|--------|
| B-7 | UI | TransferOrderFormModal location selection | 2h |
| B-8 | UI | LocationDetailModal zone/capacity fields | 1h |
| C-5 | Docs | Consolidate duplicate files | 0.5h |

---

## Recommended Action Plan

### Phase 1: Fix Blockers (Day 1)
```
1. Add RLS to production_outputs table (A-1)
2. Fix BOMItemFormModal - add byproducts/conditional UI (B-1)
3. Fix BOMFormModal - add routing_id, packaging fields (B-2)
```

### Phase 2: High Priority Fixes (Day 2-3)
```
4. Create auth middleware (A-2)
5. Refactor org_id lookups to use JWT (A-3)
6. Add line_ids to BOMItemFormModal (B-3)
7. Add Supplier selection to ProductFormModal (B-4)
8. Update .claude/TABLES.md with actual schema (C-1)
9. Update .claude/FILE-MAP.md (C-2)
```

### Phase 3: Medium Priority (Day 4-5)
```
10. Standardize service patterns (A-4)
11. Add missing RLS policies (A-5)
12. Add tax calculation to POLineFormModal (B-5)
13. Fix machines/production_lines naming (B-6)
14. Archive OLD UX files (C-3)
15. Generate context.xml files (C-4)
```

### Phase 4: Resume Epic 4 (Day 6+)
```
16. Implement remaining stories: 4-15, 4-16, 4-18, 4-19, 4-20
```

---

## Quick Wins (< 1h each)

1. Archive 6 OLD UX files → `docs/5-ARCHIVE/ux/`
2. Add Supplier selection to ProductFormModal
3. Add tax display to POLineFormModal
4. Remove duplicate .claude/audit/FILE-MAP.md

---

## Technical Debt Created

| Category | Items | Estimated Total |
|----------|-------|-----------------|
| RLS fixes | 3 migrations | 4h |
| UI fixes | 8 components | 12h |
| Doc updates | 5 files | 8h |
| Refactoring | Auth middleware + services | 8h |
| **TOTAL** | - | **32h (~4 days)** |

---

## Files Created This Session

```
docs/0-DISCOVERY/
├── INITIAL-SCAN.md          # Project structure scan
├── PROJECT-UNDERSTANDING.md  # Goals and context
├── GAPS-AND-QUESTIONS.md     # All identified gaps
├── TRACK-A-RLS-REPORT.md     # RLS investigation
├── TRACK-B-UI-REPORT.md      # UI audit
├── TRACK-C-DOC-REPORT.md     # Documentation sync
└── MASTER-FINDINGS.md        # This file
```

---

## Next Steps

1. **User decision:** Start with P0 blockers or different priority?
2. **Create migration:** For production_outputs RLS
3. **Start UI fixes:** BOMItemFormModal first
4. **Update helper files:** .claude/TABLES.md, FILE-MAP.md

---

## Gate: DISCOVERY_COMPLETE ✅

```
Validation:
- [x] Project structure understood
- [x] All modules audited (Settings, Technical, Planning, Production)
- [x] RLS issues identified
- [x] UI gaps documented
- [x] Documentation gaps listed
- [x] Priority matrix created
- [x] Action plan proposed

Status: PASSED
Ready for: Implementation Phase
```

---
**Discovery completed:** 2025-12-06
**Total issues:** 16 (3 P0, 6 P1, 5 P2, 2 P3)
**Estimated fix time:** 32 hours (~4 days)
