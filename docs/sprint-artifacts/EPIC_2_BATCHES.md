# Epic 2: Technical Core - Batch Implementation Plan

**Cel:** Podzielenie Epic 2 (24 stories) na mniejsze, wykonalne batches
**Data utworzenia:** 2025-11-23
**Status:** Ready to execute

---

## Dlaczego Batches?

Epic 2 ma 24 stories - to za dużo na jedną konwersację. Podział na batches:
- ✅ Mniejsze batches = mniejsze zużycie tokenów (60-80k per batch)
- ✅ Łatwiejsze testowanie po każdej fazie
- ✅ Możliwość odpalenia retrospective między batches
- ✅ Stopniowe budowanie złożonego systemu

---

## 📦 Podział na Batches

### **BATCH 1: Product Foundation (6 stories)**
**Czas trwania:** 2-3 dni
**Token budget:** 60-70k
**Priorytet:** P0 (fundament dla wszystkich innych)

#### Stories (w kolejności):
1. **Story 2.22: Technical Settings** ← ZACZNIJ OD TEGO!
   - Tabela `technical_settings`
   - API: GET/PUT /api/technical/settings
   - UI: /settings/technical
   - Seed: domyślne ustawienia
   - **Dlaczego pierwsze?** Inne stories zależą od konfiguracji

2. **Story 2.5: Product Types Configuration**
   - Tabela `product_types` (RM, WIP, FG, PKG, BP)
   - API: GET/POST/PUT /api/technical/product-types
   - Seed: 5 default types + 2 custom
   - **Dependency:** 2.22 (settings)

3. **Story 2.1: Product CRUD**
   - Tabela `products` (code, name, type, version, status)
   - API: GET/POST/PUT/DELETE /api/technical/products
   - UI: /technical/products (lista + modal)
   - Seed: 10 przykładowych produktów (2 RM, 3 WIP, 5 FG)
   - **Dependency:** 2.5 (product types)

4. **Story 2.2: Product Versioning**
   - Kolumna `version` (X.Y format)
   - Tabela `product_version_history`
   - Auto-increment przy edycji (1.9 → 2.0)
   - **Dependency:** 2.1

5. **Story 2.3: Product History**
   - API: GET /api/technical/products/:id/history
   - UI: History modal z timeline
   - Display: changed_fields (old → new)
   - **Dependency:** 2.2

6. **Story 2.4: Product Allergens**
   - Tabela `product_allergens` (join table)
   - API: POST/DELETE /api/technical/products/:id/allergens
   - UI: Allergen checkboxes (Contains + May Contain)
   - **Dependency:** 2.1, 1.9 (allergens from Epic 1)

#### Deliverables:
- ✅ Products z pełnym versioningiem
- ✅ Product types konfiguracja
- ✅ Allergen assignments
- ✅ Technical settings UI
- ✅ Seed data: 10 produktów + typy + settings

#### Acceptance:
- [ ] Wszystkie 6 stories DONE
- [ ] API tests passing (>95%)
- [ ] Manual testing w UI przeszło OK
- [ ] Type check: `pnpm type-check` ✅
- [ ] Seed script: `node scripts/seed-epic2-batch1-data.mjs`

---

### **BATCH 2: BOM System (9 stories)**
**Czas trwania:** 3-4 dni
**Token budget:** 80-90k
**Priorytet:** P0 (core dla Production)

#### Stories (w kolejności):
1. **Story 2.6: BOM CRUD**
   - Tabela `boms` (product_id, version, effective_from, effective_to, status)
   - API: GET/POST/PUT/DELETE /api/technical/boms
   - UI: /technical/boms
   - **Dependency:** 2.1 (products)

2. **Story 2.7: BOM Items Management**
   - Tabela `bom_items` (bom_id, product_id, quantity, uom, scrap_percent, sequence)
   - API: POST/PUT/DELETE /api/technical/boms/:id/items
   - UI: Items table z drag-drop reorder
   - Logic: effective_qty = qty * (1 + scrap_percent/100)
   - **Dependency:** 2.6

3. **Story 2.8: BOM Date Overlap Validation**
   - Database trigger lub application validation
   - Error: "Date range overlaps with BOM vX.X"
   - API: 400 response
   - **Dependency:** 2.6

4. **Story 2.13: By-Products in BOM**
   - Kolumny: `is_by_product`, `yield_percent` w `bom_items`
   - UI: By-product checkbox + yield input
   - Display: Separate section dla by-products
   - **Dependency:** 2.7

5. **Story 2.12: Conditional BOM Items**
   - Kolumny: `condition_flags` (JSONB), `condition_logic` (AND/OR)
   - UI: Condition multi-select
   - Flags: organic, gluten_free, vegan, kosher, halal, etc.
   - **Dependency:** 2.7

6. **Story 2.14: Allergen Inheritance**
   - Logic: Roll-up allergens z BOM items
   - API: GET /api/technical/boms/:id/allergens
   - UI: Show inherited vs direct allergens + warning jeśli mismatch
   - **Dependency:** 2.7, 2.4

7. **Story 2.9: BOM Timeline Visualization**
   - UI: Gantt-style timeline (recharts)
   - Display: BOM versions na osi czasu
   - Color by status (green=Active, gray=Draft, orange=Phased Out)
   - **Dependency:** 2.6

8. **Story 2.10: BOM Clone**
   - API: POST /api/technical/boms/:id/clone
   - Logic: Copy all items + new dates + new version
   - Status: Draft
   - **Dependency:** 2.7

9. **Story 2.11: BOM Compare**
   - API: GET /api/technical/boms/compare?v1=X&v2=Y
   - UI: Diff view (green=added, red=removed, yellow=changed)
   - **Dependency:** 2.7

#### Deliverables:
- ✅ BOM system z date-based validity
- ✅ BOM items z by-products
- ✅ Conditional BOM items
- ✅ Allergen inheritance
- ✅ Timeline visualization
- ✅ Clone + Compare functionality
- ✅ Seed data: 5 BOMs dla FG products

#### Acceptance:
- [ ] Wszystkie 9 stories DONE
- [ ] BOM date overlap validation działa
- [ ] Allergen inheritance poprawnie rolluje
- [ ] Timeline wyświetla się poprawnie
- [ ] API tests passing (>95%)
- [ ] Seed script: `node scripts/seed-epic2-batch2-data.mjs`

---

### **BATCH 3: Routing (3 stories)**
**Czas trwania:** 2 dni
**Token budget:** 50-60k
**Priorytet:** P0 (required dla Work Orders)

#### Stories (w kolejności):
1. **Story 2.15: Routing CRUD**
   - Tabela `routings` (code, name, status, is_reusable)
   - API: GET/POST/PUT/DELETE /api/technical/routings
   - UI: /technical/routings
   - **Dependency:** Epic 1 (machines, lines)

2. **Story 2.16: Routing Operations**
   - Tabela `routing_operations` (routing_id, sequence, operation_name, machine_id, line_id, expected_duration, expected_yield)
   - API: POST/PUT/DELETE /api/technical/routings/:id/operations
   - UI: Operations table z drag-drop
   - **Dependency:** 2.15, 1.7 (machines), 1.8 (lines)

3. **Story 2.17: Routing-Product Assignment**
   - Tabela `product_routings` (many-to-many)
   - API: PUT /api/technical/routings/:id/products
   - UI: Assign products modal + is_default flag
   - **Dependency:** 2.16, 2.1 (products)

#### Deliverables:
- ✅ Routing system kompletny
- ✅ Operations z machines/lines
- ✅ Product-routing assignments
- ✅ Seed data: 3 routings dla różnych produktów

#### Acceptance:
- [ ] Wszystkie 3 stories DONE
- [ ] Routing operations drag-drop działa
- [ ] Product assignments poprawnie zapisują
- [ ] API tests passing (>95%)
- [ ] Seed script: `node scripts/seed-epic2-batch3-data.mjs`

---

### **BATCH 4: Traceability & Dashboards (6 stories)**
**Czas trwania:** 2-3 dni
**Token budget:** 60-70k
**Priorytet:** P0 (compliance - FDA requirements)

#### Stories (w kolejności):
1. **Story 2.18: Forward Traceability**
   - API: POST /api/technical/tracing/forward
   - Recursive query na `lp_genealogy`
   - UI: Tree view (LP → child LPs → WOs → outputs)
   - Performance target: <1 min dla 1000+ LPs
   - **Dependency:** Epic 5 (LP Genealogy)

2. **Story 2.19: Backward Traceability**
   - API: POST /api/technical/tracing/backward
   - Recursive query (reverse)
   - UI: Tree view (FG → parent LPs → raw materials → supplier)
   - **Dependency:** Epic 5 (LP Genealogy)

3. **Story 2.20: Recall Simulation**
   - API: POST /api/technical/tracing/recall
   - Logic: Forward + Backward trace combined
   - Summary: affected LPs, qty, locations, shipped, cost
   - Export: PDF, FDA JSON/XML
   - Performance target: <30 seconds
   - **Dependency:** 2.18, 2.19

4. **Story 2.21: Genealogy Tree View**
   - UI: Interactive tree diagram (D3.js lub react-flow)
   - Nodes: LP ID, Product, Qty, Batch, Expiry, Location
   - Color by status (green=available, blue=consumed, gray=shipped)
   - Lazy load dla performance
   - **Dependency:** 2.18, 2.19, 2.20

5. **Story 2.23: Grouped Product Dashboard**
   - UI: /technical/products (Dashboard View)
   - 3 grupy: Raw Materials, WIP, Finished Goods
   - Każda grupa: count, filters, recent changes
   - **Dependency:** 2.1

6. **Story 2.24: Allergen Matrix Visualization**
   - UI: /technical/products (Allergen Matrix view)
   - Matrix: Products × Allergens
   - Cells: Contains (red), May Contain (yellow), None (green)
   - Export to Excel
   - **Dependency:** 2.4

#### Deliverables:
- ✅ Forward/Backward traceability działa
- ✅ Recall simulation z FDA export
- ✅ Interactive genealogy tree
- ✅ Product dashboard z grupami
- ✅ Allergen matrix

#### Acceptance:
- [ ] Wszystkie 6 stories DONE
- [ ] Traceability performance targets met
- [ ] Recall simulation <30s
- [ ] Tree view lazy-loads poprawnie
- [ ] API tests passing (>95%)

---

## 📊 Podsumowanie Epic 2

| Batch | Stories | Czas | Token Budget | Priorytet | Status |
|-------|---------|------|--------------|-----------|--------|
| **1: Product Foundation** | 6 | 2-3 dni | 60-70k | P0 | ⏳ TODO |
| **2: BOM System** | 9 | 3-4 dni | 80-90k | P0 | ⏳ TODO |
| **3: Routing** | 3 | 2 dni | 50-60k | P0 | ⏳ TODO |
| **4: Traceability** | 6 | 2-3 dni | 60-70k | P0 | ⏳ TODO |
| **TOTAL** | **24** | **9-12 dni** | **250-290k** | | |

---

## 🔗 Dependencies & Kolejność

```
Epic 1 (Settings) ✅ DONE
    ↓
Batch 1: Product Foundation (2.22, 2.5, 2.1, 2.2, 2.3, 2.4)
    ↓
Batch 2: BOM System (2.6, 2.7, 2.8, 2.13, 2.12, 2.14, 2.9, 2.10, 2.11)
    ↓
Batch 3: Routing (2.15, 2.16, 2.17)
    ↓
Batch 4: Traceability (2.18, 2.19, 2.20, 2.21, 2.23, 2.24)
    ↓
Epic 3: Planning ⏳ (Work Orders wymagają BOMs + Routings)
```

**UWAGA:** Batch 4 (Traceability) wymaga Epic 5 (LP Genealogy) - to jest dependency z przodu!
**Rozwiązanie:** Albo zrobić Epic 5 najpierw, albo defer Batch 4 do później.

---

## 🎯 Sprint Planning dla Epic 2

### Czy istnieje Sprint Planning?

**Sprawdź:** `docs/sprint-artifacts/sprint-status.yaml`

**Status Epic 2 w sprint-status.yaml:**
```yaml
epic-2: backlog
2-1-product-crud: backlog
2-2-product-edit-with-versioning: backlog
...
```

**Wszystkie stories są w statusie `backlog`** - oznacza to że:
- ❌ Nie ma story context files
- ❌ Nie ma story files w `docs/sprint-artifacts/stories/`
- ❌ Trzeba stworzyć tech spec
- ❌ Trzeba stworzyć story files

---

## 🚀 Jak zacząć Batch 1?

### Krok 1: Stwórz Tech Spec
```bash
# Uruchom workflow
/bmad:bmm:workflows:epic-tech-context

# Lub manualnie stwórz:
docs/sprint-artifacts/tech-spec-epic-2-batch1.md
```

**Tech spec powinien zawierać:**
1. Database schema (products, product_versions, product_allergens, technical_settings, product_types)
2. API endpoints
3. Business rules (versioning, allergen inheritance)
4. Architecture decisions

### Krok 2: Stwórz Story Files
```bash
# Dla każdej story w Batch 1:
/bmad:bmm:workflows:create-story

# Lub manualnie:
docs/sprint-artifacts/stories/story-2-22-technical-settings.md
docs/sprint-artifacts/stories/story-2-5-product-types.md
docs/sprint-artifacts/stories/story-2-1-product-crud.md
docs/sprint-artifacts/stories/story-2-2-product-versioning.md
docs/sprint-artifacts/stories/story-2-3-product-history.md
docs/sprint-artifacts/stories/story-2-4-product-allergens.md
```

### Krok 3: Story Context
```bash
# Dla każdej story:
/bmad:bmm:workflows:story-context

# To stworzy context.xml file
```

### Krok 4: Implementacja
```bash
# Dla każdej story:
/bmad:bmm:workflows:dev-story

# Lub manualnie:
# 1. Database migration
# 2. Service layer
# 3. API routes
# 4. Frontend components
# 5. Tests
# 6. Seed data
```

### Krok 5: Mark Done
```bash
# Po zakończeniu story:
/bmad:bmm:workflows:story-done
```

---

## 📋 Checklist przed każdym Batch

- [ ] Tech spec created
- [ ] Story files created (wszystkie stories w batch)
- [ ] Story context created (dla wszystkich)
- [ ] Architecture docs updated (jeśli potrzebne)
- [ ] Seed data strategy defined
- [ ] Dependencies verified (Epic 1 done? Previous batch done?)

---

## 📋 Checklist po każdym Batch

- [ ] All stories DONE
- [ ] API tests passing (>95%)
- [ ] Type check passing (`pnpm type-check`)
- [ ] Manual testing completed
- [ ] Seed script works
- [ ] Code review done (`/bmad:bmm:workflows:code-review`)
- [ ] Git commit + push
- [ ] Retrospective optional (`/bmad:bmm:workflows:retrospective`)
- [ ] Update sprint-status.yaml

---

## ❓ FAQ

**Q: Czy muszę robić wszystkie batches po kolei?**
A: TAK! Są dependencies między batches. Batch 2 wymaga Batch 1, etc.

**Q: Czy mogę zrobić Batch 4 (Traceability) bez Epic 5?**
A: NIE! Traceability wymaga `lp_genealogy` table z Epic 5. Albo zrób Epic 5 najpierw, albo defer Batch 4.

**Q: Czy wszystkie stories mają context?**
A: NIE! Obecnie wszystkie stories Epic 2 są w statusie `backlog`. Trzeba stworzyć:
- Tech spec
- Story files
- Story context files

**Q: Ile czasu zajmie cały Epic 2?**
A: 9-12 dni roboczych (4 batches × 2-3 dni każdy)

**Q: Czy mogę zrobić Epic 3 równolegle z Epic 2?**
A: NIE! Epic 3 (Work Orders) wymaga Epic 2 (Products, BOMs, Routings). Zobacz IMPLEMENTATION_PLAN_EPIC_2_3.md.

---

## 📝 Notes

- Keep each batch conversation focused (~60-80k tokens)
- Test after each story, nie czekaj do końca batch
- Seed data incrementally (nie wszystko na końcu)
- Document architecture decisions immediately
- Update sprint-status.yaml regularnie

---

**Last Updated:** 2025-11-23
**Next Review:** Po Batch 1
**Owner:** Mariusz K
