# Code Review Summary - Stories in Review Status

**Reviewer:** Mariusz (AI-assisted)
**Date:** 2025-12-02
**Stories Reviewed:** 13 (statusem "review" w sprint-status.yaml)

---

## 🔴 CRITICAL ISSUES - BLOCKED

### Batch 02A-2 (BOM Restructure)

| Story | Issue | Severity | Action |
|-------|-------|----------|--------|
| **2-26** | Schema mismatch - migracja 025 ma starą strukturę (`product_id`, `is_by_product`), ale serwis używa nowych kolumn (`component_id`, `operation_seq`, `is_output`, `line_ids`) | 🔴 HIGH | Wymaga migracji DROP+CREATE |
| **2-27** | Tabela `bom_item_alternatives` NIE ISTNIEJE w migracji! Serwis zaimplementowany, ale brak tabeli | 🔴 HIGH | Wymaga nowej migracji |
| **2-28** | Status: Todo, brak implementacji - zależy od 2.24 | 🟡 MED | Nie gotowe do review |
| **2-29** | Status: Todo, brak implementacji - zależy od 2.24-2.28 | 🟡 MED | Nie gotowe do review |

**Wniosek Batch 02A-2:** ❌ **BLOCKED** - schemat bom_items jest rozsynchronizowany

---

### Batch 03A-1 (Purchase Orders)

| Story | Status w pliku | Implementation | Notes |
|-------|----------------|----------------|-------|
| **3-2** | Ready for Dev | ✅ API istnieje (`/api/planning/purchase-orders/[id]/lines`) | Wymaga weryfikacji ACs |
| **3-4** | Ready for Dev | ✅ API istnieje (`/api/planning/purchase-orders/[id]/approvals`) | Wymaga weryfikacji ACs |
| **3-5** | Ready for Dev | ✅ API istnieje (`/api/planning/purchase-orders/[id]/status`) | Wymaga weryfikacji ACs |

**Wniosek Batch 03A-1:** 🟡 **NEEDS VERIFICATION** - pliki istnieją, wymagana weryfikacja AC

---

### Batch 04A-1 (WO Lifecycle)

| Story | Status w pliku | Implementation | Notes |
|-------|----------------|----------------|-------|
| **4-1** | drafted | ❓ Wymaga weryfikacji | Brak Dev Agent Record |
| **4-2** | drafted | ✅ API istnieje (`/start/route.ts`) | Wymaga weryfikacji ACs |
| **4-3** | drafted | ✅ API istnieje (`/pause`, `/resume`) | Wymaga weryfikacji ACs |
| **4-4** | drafted | ✅ API istnieje (`/operations/[opId]/start`) | Wymaga weryfikacji ACs |
| **4-5** | drafted | ✅ API istnieje (`/operations/[opId]/complete`) | Wymaga weryfikacji ACs |
| **4-6** | drafted | ✅ API istnieje (`/complete`) | Wymaga weryfikacji ACs |

**Wniosek Batch 04A-1:** 🟡 **NEEDS VERIFICATION** - pliki istnieją, wymagana weryfikacja AC

---

### Batch 04C-1 (Config & Traceability)

| Story | Status w pliku | Implementation | Notes |
|-------|----------------|----------------|-------|
| **4-17** | ✅ Tasks [x] complete | Wszystkie taski `[x]`, Dev Agent Record complete | **APPROVE → done** |

**Wniosek Batch 04C-1:** ✅ Story 4-17 gotowe do zatwierdzenia

---

## 📊 Podsumowanie

| Status | Count | Stories |
|--------|-------|---------|
| 🔴 BLOCKED (schema) | 2 | 2-26, 2-27 |
| 🟡 NOT READY (todo) | 2 | 2-28, 2-29 |
| 🟡 NEEDS VERIFICATION | 9 | 3-2, 3-4, 3-5, 4-1, 4-2, 4-3, 4-4, 4-5, 4-6 |
| ✅ APPROVE | 1 | 4-17 |

---

## 🛠️ Recommended Actions

### Immediate (P0):

1. **Fix bom_items schema** - Story 2-26 wymaga nowej migracji:
   ```sql
   -- Option A: ALTER TABLE (zachowaj dane)
   ALTER TABLE bom_items
     RENAME COLUMN product_id TO component_id;
   ALTER TABLE bom_items
     ADD COLUMN operation_seq INTEGER NOT NULL DEFAULT 1,
     ADD COLUMN is_output BOOLEAN DEFAULT false,
     ADD COLUMN line_ids UUID[];
   -- Usuń stare kolumny
   ALTER TABLE bom_items DROP COLUMN IF EXISTS is_by_product;
   ALTER TABLE bom_items DROP COLUMN IF EXISTS yield_percent;
   ALTER TABLE bom_items DROP COLUMN IF EXISTS condition_flags;
   ALTER TABLE bom_items DROP COLUMN IF EXISTS condition_logic;

   -- Indeksy
   CREATE INDEX idx_bom_items_operation ON bom_items(bom_id, operation_seq);
   CREATE INDEX idx_bom_items_line_ids ON bom_items USING GIN(line_ids);
   ```

2. **Create bom_item_alternatives table** - Story 2-27:
   ```sql
   CREATE TABLE bom_item_alternatives (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
     alternative_component_id UUID NOT NULL REFERENCES products(id),
     priority INTEGER NOT NULL DEFAULT 1,
     quantity_ratio DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(bom_item_id, alternative_component_id)
   );

   CREATE INDEX idx_bom_item_alternatives_item ON bom_item_alternatives(bom_item_id);
   ALTER TABLE bom_item_alternatives ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Enable all for authenticated" ON bom_item_alternatives
     FOR ALL TO authenticated USING (true) WITH CHECK (true);
   ```

3. **Update .claude/TABLES.md** - przestarzała dokumentacja schematu bom_items

### Short-term (P1):

4. Przeprowadź szczegółową weryfikację AC dla stories 3-2, 3-4, 3-5
5. Przeprowadź szczegółową weryfikację AC dla stories 4-1 do 4-6

### Status Update (w sprint-status.yaml):

```yaml
# Zmień:
2-26-bom-items-operation-assignment: review → in-progress  # blocked - needs migration
2-27-bom-item-alternatives: review → in-progress           # blocked - needs table
2-28-bom-packaging-fields: review → drafted                # not implemented
2-29-bom-routing-ui-update: review → drafted               # not implemented
4-17-production-settings: review → done                    # APPROVE
```

---

## 📝 Notes

- **sprint-status.yaml** jest niespójny z rzeczywistym statusem stories w plikach .md
- Wiele stories ma status "review" w YAML ale "Todo" lub "drafted" w plikach
- Story 4-17 jest jedynym story z kompletnym Dev Agent Record i wszystkimi taskami zaznaczonymi
- Batch 02A-2 wymaga naprawy schematu zanim można kontynuować

---

## ⚠️ Schema Mismatch Details (Story 2-26)

**Migracja 025 (stara):**
```sql
-- EXISTING
product_id UUID NOT NULL    -- powinno być: component_id
is_by_product BOOLEAN       -- powinno być: is_output
yield_percent DECIMAL       -- do usunięcia (tylko w 2.13)
condition_flags TEXT[]      -- do usunięcia (2.12)
condition_logic TEXT        -- do usunięcia (2.12)

-- MISSING
operation_seq INTEGER       -- brakuje
line_ids UUID[]             -- brakuje
```

**BomItemService (nowy) używa:**
```typescript
component_id: input.component_id,      // ❌ nie istnieje
operation_seq: input.operation_seq,    // ❌ nie istnieje
is_output: input.is_output ?? false,   // kolumna = is_by_product
line_ids: input.line_ids || null,      // ❌ nie istnieje
```

---

**Wykonano:** 2025-12-02
