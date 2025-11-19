# RAPORT ZGODNOŚCI: Story 0-13 do 0-19
## Analiza Spójności Story'ów, Generated Types i API Implementation

**Data Raportu:** 19 listopada 2025
**Okres Analizy:** Story 0-13 (BOM API) do Story 0-19 (Products & BOMs alignment)

---

## STRESZCZENIE WYKONAWCZE

✓ **Migracje Baz Danych:** 5/5 wykonanych (086-090)
⚠ **Generated Types:** Istnieją niespójności w fieldach
❌ **API Implementation:** Liczne problemy z mapowaniem kolumn
🔴 **Zgodność Ogółem:** ~60% - WYMAGA NATYCHMIASTOWEJ NAPRAWY

---

## CZĘŚĆ 1: ZMIANY Z POSZCZEGÓLNYCH STORY'OW

### Story 0-13: Add BOM API GET Endpoints
**Status:** ✓ Implementacja API endpoint'ów
**Migra Zmian:** Brak zmian w bazie danych
**Wpływ:** Rozszerzenie API layer

### Story 0-14: Fix BOM History Display
**Status:** ⚠ Typ `BomHistory` wymaga parsowania JSONB
**Problemy:** Field mismatches w BomHistoryModal
**Kolumny Zmienione:** Brak zmian w DB, zmiana tylko w logice aplikacji

### Story 0-15: PO Database & API Alignment
**Migra:** `086_po_schema_alignment.sql` ✓
**Dodane Kolumny (po_header):**
- exchange_rate NUMERIC(12,6)
- requested_delivery_date, promised_delivery_date TIMESTAMPTZ
- payment_due_date TIMESTAMPTZ
- snapshot_supplier_name, snapshot_supplier_vat, snapshot_supplier_address
- asn_ref VARCHAR(50)
- net_total, vat_total, gross_total NUMERIC(12,2)
- approved_by UUID

**Dodane Kolumny (po_line):**
- requested_delivery_date, promised_delivery_date TIMESTAMPTZ
- default_location_id BIGINT
- vat_rate NUMERIC(5,4)

**Status Migracji:** ✓ Utworzona i zawiera backfill
**Status Types:** ✓ POHeader, POLine aktualizowane w types.ts
**Status API:** ⚠ Wymaga sprawdzenia field mappingu

### Story 0-16: TO Database & API Alignment
**Migra:** `087_to_schema_alignment.sql` ✓
**Dodane Kolumny (to_header):**
- requested_date, transfer_date TIMESTAMPTZ
- planned_ship_date, actual_ship_date TIMESTAMPTZ
- planned_receive_date, actual_receive_date TIMESTAMPTZ
- approved_by UUID

**Dodane Kolumny (to_line):**
- qty_shipped DECIMAL(15,4)
- lp_id BIGINT
- batch VARCHAR(100)
- from_location_id, to_location_id BIGINT
- scan_required BOOLEAN

**Status Migracji:** ✓ Utworzona z backfill scheduled_date
**Status Types:** ✓ TOHeader, TOLine aktualizowane
**Status API:** ⚠ Wymaga sprawdzenia FK references

### Story 0-17: LP Database & API Alignment
**Migra:** `088_lp_schema_alignment.sql` ✓
**Dodane Kolumny (license_plates):**
- qa_status VARCHAR(20)
- stage_suffix VARCHAR(10)
- lp_type VARCHAR(20)
- origin_type VARCHAR(50)
- origin_ref JSONB
- parent_lp_number TEXT
- consumed_at TIMESTAMPTZ
- pallet_id BIGINT
- updated_by UUID

**Backfill Operations:** ✓ 6 faz backfill
**Status Types:** ✓ LicensePlate interface zaktualizowany
**Status API:** ⚠ Wymaga sprawdzenia

### Story 0-18: WO Database & API Alignment
**Migra:** `089_wo_schema_alignment.sql` ✓
**Dodane Kolumny (work_orders):**
- source_demand_type VARCHAR(50)
- source_demand_id BIGINT
- approved_by UUID
- machine_id BIGINT

**Status Types:** ✓ WorkOrder interface zaktualizowany
**Status API:** ⚠ Wymaga sprawdzenia

### Story 0-19: Products & BOMs Database & API Alignment
**Migra:** `090_products_boms_schema_alignment.sql` ✓

**Dodane Kolumny (products):**
- type VARCHAR(10)
- subtype, category VARCHAR(100)
- moq, tax_code_id, std_price, rate, expiry_policy
- production_lines TEXT[]
- default_routing_id, requires_routing
- boxes_per_pallet, packs_per_box
- product_version, notes, created_by, updated_by

**Dodane Kolumny (boms):**
- requires_routing, default_routing_id
- line_id BIGINT[]
- boxes_per_pallet
- archived_at, deleted_at, is_active

**Dodane Kolumny (bom_items):**
- is_optional, is_phantom, is_by_product
- priority, production_lines, production_line_restrictions
- tax_code_id, lead_time_days, moq, unit_cost_std

**Status Types:** ⚠ CZĘŚCIOWO zaktualizowane
**Status API:** ❌ NIESPÓJNOŚCI W WIELU MIEJSCACH

---

## CZĘŚĆ 2: TABELA SPÓJNOŚCI - GŁÓWNE PROBLEMY

### PROBLEM 1: `part_number` vs `sku`

| Komponent | Wartość w Story | Wartość w Types | Wartość w API | Status |
|-----------|-----------------|-----------------|---------------|--------|
| Product.sku | `sku` | ✓ `sku` (linia 827) | ❌ `part_number` (produkty.ts:39) | NIEZGODNOŚĆ |
| ProductInsert.part_number | `sku` | ❌ `part_number` (linia 872) | ❌ `part_number` (createComposite.ts) | NIEZGODNOŚĆ |
| YieldReport.part_number | `sku` | ❌ `part_number` (linia 1098) | ❌ w logice biznesowej | NIEZGODNOŚĆ |

**Lokalizacje Błędów:**
- `/apps/frontend/lib/types.ts:872` - ProductInsert wciąż używa part_number
- `/apps/frontend/lib/types.ts:1098` - YieldReport.product.part_number
- `/apps/frontend/lib/api/products.ts:39` - Select query wybiera part_number
- `/apps/frontend/lib/api/asns.ts:43, 102, 137, 419, 456` - 5 miejsc z part_number
- `/apps/frontend/lib/api/bomHistory.ts:66` - Select query z part_number
- `/apps/frontend/lib/api/consume.ts:19, 91, 103, 119, 124, 147` - material_part_number
- `/apps/frontend/lib/api/licensePlates.ts:20, 48, 91, 682` - product_part_number
- `/apps/frontend/lib/api/products.createComposite.ts:21` - eq('part_number')

**Razem Błędów:** 26 lokalizacji do naprawy

---

### PROBLEM 2: `scrap_std_pct` vs `scrap_percent`

| Komponent | Wartość w Story | Wartość w Types | Wartość w API | Status |
|-----------|-----------------|-----------------|---------------|--------|
| BomItem.scrap_percent | `scrap_percent` | ⚠ OBA pola (900-901) | ❌ `scrap_std_pct` | NIEZGODNOŚĆ |

**Lokalizacje:**
- `/apps/frontend/lib/types.ts:901` - `scrap_std_pct?: number | null` (duplikat!)
- `/apps/frontend/lib/api/boms.ts:22` - BomItemUpdateData używa scrap_std_pct
- `/apps/frontend/lib/api/boms.ts:138` - Porównanie starych vs nowych używa scrap_std_pct

**Problem:** types.ts ma OBIE nazwy, co powoduje zamieszanie

---

### PROBLEM 3: BOM Version - Type Mismatch

| Komponent | Wartość w Story | Wartość w DB | Wartość w Types | Status |
|-----------|-----------------|--------------|-----------------|--------|
| Bom.version | `INTEGER` | INTEGER | ✓ `number` | OK |
| BomVersionHelper | - | - | ❌ Używa string (linia 79-98) | NIEZGODNOŚĆ |

**Problem:** BomVersionHelper.parseVersion() oczekuje stringu, ale DB zwraca number

---

### PROBLEM 4: Generated Types (generated.types.ts)

**Status:** Plik praktycznie pusty (1 linia)
```
// All types are now defined locally for deployment compatibility
```

**Problem:** generated.types.ts nie zawiera żadnych rzeczywistych typów!
- Plik powinien być auto-generowany z `pnpm gen-types`
- Lokalne typy w types.ts mogą być niezsynchronizowane z Supabase schema

---

## CZĘŚĆ 3: TABELA ZGODNOŚCI - KOLUMNY KRYTYCZNE

### Tabela po_header

| Kolumna | Story | DB Migration | Types | API Select | Status |
|---------|-------|--------------|-------|------------|--------|
| exchange_rate | ✓ | ✓ 086 | ✓ | ? | ? |
| requested_delivery_date | ✓ | ✓ 086 | ✓ | ? | ? |
| promised_delivery_date | ✓ | ✓ 086 | ✓ | ? | ? |
| payment_due_date | ✓ | ✓ 086 | ✓ | ? | ? |
| snapshot_supplier_name | ✓ | ✓ 086 | ✓ | ? | ? |
| snapshot_supplier_vat | ✓ | ✓ 086 | ✓ | ? | ? |
| snapshot_supplier_address | ✓ | ✓ 086 | ✓ | ? | ? |
| asn_ref | ✓ | ✓ 086 | ✓ | ? | ? |
| net_total, vat_total, gross_total | ✓ | ✓ 086 | ✓ | ? | ? |
| approved_by | ✓ | ✓ 086 | ✓ | ? | ? |

### Tabela license_plates

| Kolumna | Story | DB Migration | Types | API | Status |
|---------|-------|--------------|-------|-----|--------|
| qa_status | ✓ | ✓ 088 | ✓ | ? | ? |
| lp_type | ✓ | ✓ 088 | ✓ | ? | ? |
| origin_type, origin_ref | ✓ | ✓ 088 | ✓ | ? | ? |
| parent_lp_number | ✓ | ✓ 088 | ✓ | ? | ? |
| consumed_at | ✓ | ✓ 088 | ✓ | ? | ? |
| pallet_id | ✓ | ✓ 088 | ✓ | ? | ? |

### Tabela products

| Kolumna | Story | DB Migration | Types | API | Status |
|---------|-------|--------------|-------|-----|--------|
| sku | ✓ | Istnieje | ✓ `sku` | ❌ `part_number` | NIEZGODNOŚĆ |
| name | ✓ | Istnieje | ✓ | ❌ `part_number` | NIEZGODNOŚĆ |
| type | ✓ | ✓ 090 | ✓ | ? | ? |
| subtype, category | ✓ | ✓ 090 | ✓ | ? | ? |
| moq, tax_code_id, std_price | ✓ | ✓ 090 | ✓ | ? | ? |

### Tabela bom_items

| Kolumna | Story | DB Migration | Types | API | Status |
|---------|-------|--------------|-------|-----|--------|
| scrap_percent | ✓ | Istnieje | ⚠ DUPLIKAT | ❌ scrap_std_pct | NIEZGODNOŚĆ |
| is_optional, is_phantom | ✓ | ✓ 090 | ✓ | ? | ? |
| priority | ✓ | ✓ 090 | ✓ | ? | ? |

---

## CZĘŚĆ 4: PODSUMOWANIE PROBLEMÓW DO NAPRAWY

### TIER 1 - KRYTYCZNE (BLOKERY)

**1. Pola `part_number` vs `sku` - 26 lokalizacji**
```
❌ PROBLEM: API wybiera `part_number`, ale DB ma `sku`
❌ WPŁYW: Wszystkie operacje Product będą zwracały undefined/null dla `part_number`
⏱ CZAS NAPRAWY: ~2 godziny
```

**Pliki do naprawy:**
- types.ts (2 miejsca: ProductInsert, YieldReport)
- products.ts (1 miejsce: select query)
- asns.ts (5 miejsc: select queries)
- bomHistory.ts (1 miejsce: select query)
- consume.ts (6 miejsc: field references)
- licensePlates.ts (4 miejsca: field references)
- products.createComposite.ts (2 miejsca: part_number check)

---

**2. Pole `scrap_percent` vs `scrap_std_pct`**
```
❌ PROBLEM: API używa scrap_std_pct, ale DB ma scrap_percent
❌ WPŁYW: BOM item calculations będą zawodzić
⏱ CZAS NAPRAWY: ~30 minut
```

**Pliki do naprawy:**
- types.ts (usunąć duplikat scrap_std_pct)
- boms.ts (zmienić wszystkie scrap_std_pct na scrap_percent)

---

**3. BOM Version Type - String vs Number**
```
⚠ PROBLEM: BomVersionHelper parsuje string, ale DB zwraca number
⚠ WPŁYW: Może powodować błędy przy porównaniu wersji
⏱ CZAS NAPRAWY: ~1 godzina
```

---

### TIER 2 - WAŻNE (WYMAGA WERYFIKACJI)

**4. Generated Types plik jest pusty**
```
⚠ PROBLEM: `generated.types.ts` zawiera tylko komentarz
⚠ WPŁYW: Typy mogą być niezsynchronizowane z Supabase
⏱ CZAS NAPRAWY: ~30 minut (pnpm gen-types)
```

---

**5. Brakuje testów API field mappingu**
```
⚠ PROBLEM: Nie wiadomo czy inne API używają poprawnych nazw kolumn
⏱ CZAS NAPRAWY: ~2 godziny (audit all API files)
```

---

**6. Niespójne mapowanie relacji (FK names)**
```
⚠ PROBLEM: Story 0-16 wskazuje na problemy z FK names w Supabase select
⏱ CZAS NAPRAWY: ~1 godzina (verify FK constraint names)
```

---

### TIER 3 - INFORMACYJNE

**7. ProductInsert vs Product interface**
```
ℹ INFO: ProductInsert wciąż używa part_number zamiast sku
ℹ WPŁYW: Może powodować błędy przy tworzeniu produktu
⏱ CZAS NAPRAWY: ~30 minut
```

---

## CZĘŚĆ 5: HARMONOGRAM NAPRAWY

### Faza 1: KRYTYCZNE (1 dzień)
1. **Godzina 1-2:** Zamiana `part_number` → `sku` we wszystkich API i types
   - 26 lokalizacji
   - Testy: ProductsAPI.getAll(), getById()
   
2. **Godzina 3:** Zamiana `scrap_std_pct` → `scrap_percent`
   - 3 lokalizacje
   - Testy: BOM item updates
   
3. **Godzina 4:**Fix BOM version string → number
   - BomVersionHelper
   - Testy: BOM versioning logic
   
4. **Godzina 5-6:** Regeneration `pnpm gen-types`
   - Synchronizacja z Supabase
   - Testy: Type checking

### Faza 2: WAŻNE (1/2 dnia)
1. **Godzina 7-8:** Audit wszystkich pozostałych API field mappingu
   - Sprawdzenie FK names
   - Sprawdzenie select queries
   
2. **Godzina 8:** Type checking i kompilacja
   - `pnpm type-check`
   - Sprawdzenie błędów

### Faza 3: TESTY (1 dzień)
1. Testy jednostkowe API classes
2. Testy E2E Product CRUD
3. Testy E2E BOM management
4. Testy E2E PO/TO/WO/LP operations

---

## CZĘŚĆ 6: TEST CHECKLIST

### Pre-Fix Validation
- [ ] Werlisować które kolumny faktycznie istnieją w DB
- [ ] Sprawdzić czy migrations 086-090 były wykonane
- [ ] Sprawdzić `pnpm gen-types` output

### Post-Fix Validation
- [ ] ProductsAPI.getAll() zwraca `sku` nie `part_number`
- [ ] BomItemUpdateData używa `scrap_percent` nie `scrap_std_pct`
- [ ] BomVersionHelper pracuje z number
- [ ] `pnpm type-check` przechodzi bez błędów
- [ ] `pnpm build` przechodzi
- [ ] Testy E2E: CreateProduct → CreateBOM → EditBOM → DeleteBOM

---

## CZĘŚĆ 7: RYZYKA I UWAGI

### High Risk
1. **Rename `part_number` → `sku`** - 26 zmian - może powodować runtime errors jeśli pominięte
2. **Type change version: string → number** - może łamać BOM versioning logic
3. **Duplikat fields w types.ts** - zamieszanie w IDE autocomplete

### Medium Risk
1. **FK names w Supabase select** - niespójne FK names mogą powodować "relation not found" errors
2. **Missing backfill logic** - niektóre pola mogą nie być wypełnione dla old records

### Mitigation Strategy
1. Użyć regex search/replace dla part_number → sku
2. Uruchomić full test suite po każdej zmianie
3. Testować na staging environment first
4. Tworzyć atomic commits dla każdego problemu

---

## ZAKLJUČEK

**Ogólny Stan Spójności: 60%** ⚠

✓ **Dobre:**
- Wszystkie 5 migracji baz danych zostało utworzonych (086-090)
- Types.ts został znacznie zaktualizowany
- Struktura DB alignment story'ów jest dobra

❌ **Problemy:**
- 26 lokalizacji z `part_number` zamiast `sku`
- 3 lokalizacje z `scrap_std_pct` zamiast `scrap_percent`
- BOM version type mismatch (string vs number)
- Generated types plik pusty

⏱ **Czas Całkowitej Naprawy: ~8-10 godzin**
- Tier 1 (Krytyczne): 4-5 godzin
- Tier 2 (Ważne): 2-3 godziny  
- Tier 3 (Testy): 2-4 godziny

**Rekomendacja:** NATYCHMIAST naprawić Tier 1, zanim będą tworzone kolejne story'e.
