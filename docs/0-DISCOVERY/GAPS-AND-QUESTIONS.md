# GAPS-AND-QUESTIONS: MonoPilot

## Document Info
- **Version:** 2.0
- **Created:** 2025-12-06
- **Phase:** Gap Analysis (Phase 4)
- **Discovery Session:** DS-002

---

## Executive Summary

Projekt MonoPilot ma **systemowe problemy** wynikające z szybkiej implementacji bez wystarczającej walidacji. Główne kategorie problemów:

1. **DB/RLS** - Błędy autoryzacji, permission denied, puste dane
2. **UI/UX** - Brakujące pola, niezaimplementowana logika
3. **Doc vs Code** - Dokumentacja niezgodna z rzeczywistą implementacją
4. **Pominięte AC** - Acceptance Criteria nie zostały w pełni zaimplementowane

---

## Gap Categories

### BLOCKING - Uniemożliwiają pracę

| ID | Category | Issue | Impact | Resolution |
|----|----------|-------|--------|------------|
| B-001 | DB/RLS | 401/403 errors w API routes | Nie można zapisywać/czytać danych | Audit wszystkich RLS policies |
| B-002 | DB/RLS | Brak permission przy zapisie | Users nie mogą tworzyć rekordów | Sprawdzić service role vs anon key |
| B-003 | Auth | Błędy autoryzacji przy różnych operacjach | Użytkownicy nie mogą pracować | Audit auth flow + org_id propagation |

### IMPORTANT - Wpływają na funkcjonalność

| ID | Category | Issue | Impact | Resolution |
|----|----------|-------|--------|------------|
| I-001 | UI | Brakujące input fields w formularzach | Użytkownicy nie mogą wprowadzić danych | Audit formularzy vs DB schema |
| I-002 | Logic | Niezaimplementowana logika w niektórych miejscach | Funkcje nie działają | Audit implementacji vs AC |
| I-003 | Docs | Dokumentacja niezgodna z kodem | Trudność w kontynuacji prac | Sync docs z aktualnym kodem |
| I-004 | AC | Pominięte Acceptance Criteria | Funkcjonalność niekompletna | Review każdego story vs kod |

### MINOR - Do naprawienia, ale nie blokują

| ID | Category | Issue | Impact | Resolution |
|----|----------|-------|--------|------------|
| M-001 | UX | Niespójność UI między modułami | Słabe UX | Standaryzacja komponentów |
| M-002 | Docs | Stara dokumentacja (OLD) pliki | Confusion | Archiwizacja starych docs |

---

## Module-by-Module Analysis

### Settings Module (Epic 1)
**Status:** Supposedly complete, but needs verification

**Potential Issues:**
- [ ] Organization form - wszystkie pola działają?
- [ ] User management - CRUD pełny?
- [ ] Warehouse/Location - relacje poprawne?
- [ ] Machines/Lines - wszystkie pola z DB?
- [ ] Allergens - seeding EU14 działa?
- [ ] Tax codes - CRUD kompletny?

### Technical Module (Epic 2)
**Status:** Supposedly complete, but needs verification

**Potential Issues:**
- [ ] Products - wszystkie typy produktów (RM, WIP, FG, PKG, BP)?
- [ ] Product versioning - historia wersji działa?
- [ ] BOMs - date overlap validation?
- [ ] BOM items - conditional flags, by-products?
- [ ] Routings - operations assignment?
- [ ] Traceability - forward/backward trace?

### Planning Module (Epic 3)
**Status:** Supposedly ~95% complete

**Potential Issues:**
- [ ] Suppliers - CRUD z default supplier?
- [ ] Purchase Orders - full lifecycle?
- [ ] PO Lines - calculations correct?
- [ ] Work Orders - BOM/routing copy?
- [ ] Material availability check?

### Production Module (Epic 4)
**Status:** ~85% complete, 5 stories remaining

**Known Gaps:**
- [ ] 4-15: Yield Tracking - not implemented
- [ ] 4-16: Multiple Outputs - not implemented
- [ ] 4-18: LP Updates - not implemented
- [ ] 4-19: Genealogy Creation - not implemented
- [ ] 4-20: Operation Timeline - not implemented

**Potential Issues in "done" stories:**
- [ ] WO Start/Complete - atomicity?
- [ ] Consumption - over-consumption control?
- [ ] Output registration - genealogy links?

---

## RLS/Auth Investigation Areas

### 1. Supabase Client Usage
```
Pattern to check:
- createServerSupabase() - for auth only
- createServerSupabaseAdmin() - for DB operations

Potential issues:
- Mixing clients incorrectly
- Not using service role for writes
- org_id not being set correctly
```

### 2. RLS Policies
```
Standard policy pattern:
CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );

Potential issues:
- Policy missing on some tables
- Incorrect org_id extraction
- Service role not bypassing correctly
```

### 3. Auth Flow
```
Check points:
- Login sets correct JWT claims
- org_id propagated to all requests
- Session refresh maintains org_id
- Middleware validates correctly
```

---

## Documentation Gaps

### Files Needing Update
| File | Issue | Priority |
|------|-------|----------|
| `docs/reference/database-schema.md` | May not reflect actual migrations | HIGH |
| `docs/reference/code-architecture.md` | May not reflect actual patterns | HIGH |
| `.claude/TABLES.md` | Quick reference may be outdated | MEDIUM |
| `.claude/FILE-MAP.md` | May miss new files | MEDIUM |
| `PROJECT-STATE.md` | Template, not actual state | HIGH |
| `sprint-status.yaml` | May not reflect true status | HIGH |

### Stories Needing AC Verification
All stories marked as "done" need verification that:
1. All Acceptance Criteria implemented
2. Edge cases handled
3. Error states covered
4. Validation complete

---

## Recommended Audit Plan

### Phase 1: Quick Wins (1-2 hours)
1. Run `pnpm build` - check for TypeScript errors
2. Run `pnpm type-check` - verify types
3. Check Supabase dashboard for RLS policy status
4. Verify basic auth flow works

### Phase 2: RLS Deep Dive (2-4 hours)
1. List all tables and their RLS status
2. Review each policy for correctness
3. Test CRUD operations per table with different roles
4. Fix permission issues

### Phase 3: UI Audit (4-8 hours)
1. Navigate each module
2. Check each form has all required fields
3. Test each CRUD operation
4. Document missing/broken features

### Phase 4: Doc Sync (2-4 hours)
1. Update database-schema.md from actual Supabase
2. Update code-architecture.md if patterns changed
3. Archive OLD files
4. Update PROJECT-STATE.md

---

## Open Questions

### For User
1. Czy masz dostęp do Supabase dashboard?
2. Czy możesz uruchomić aplikację i pokazać konkretne błędy?
3. Które moduły są najbardziej krytyczne do naprawienia najpierw?
4. Czy masz logi błędów z konsoli przeglądarki?

### Technical Questions
1. Czy wszystkie migracje są zastosowane w Supabase?
2. Czy zmienne środowiskowe są poprawne (.env)?
3. Czy service role key jest aktualny?

---

## Priority Matrix

| Priority | Category | Items | Effort |
|----------|----------|-------|--------|
| P0 | DB/RLS | Fix auth/permission issues | 4-8h |
| P1 | UI | Fix missing fields/logic | 8-16h |
| P2 | Docs | Sync docs with code | 4-8h |
| P3 | Epic 4 | Complete remaining stories | 8-16h |

---

## Gate: GAPS_IDENTIFIED

```
Condition: Gap analysis completed
Validation:
- [x] All gaps documented
- [x] Open questions listed
- [x] Priorities assigned (Blocking/Important/Minor)
- [x] Resolution strategies proposed
- [x] Resolution plan in place

Status: PASSED
Next: Proceed to Phase 5 (User Confirmation)
```

---
**Gap Analysis completed:** 2025-12-06
**Total gaps identified:** 10+ (3 blocking, 4 important, 2+ minor)
**Next Phase:** User Confirmation
