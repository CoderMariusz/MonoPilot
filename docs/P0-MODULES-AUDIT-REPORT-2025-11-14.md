# Raport Audytu Modułów P0 - MonoPilot

**Data:** 2025-11-14
**Audytor:** Mariusz
**Wersja:** 1.0
**Status:** 🔴 **KRYTYCZNE NIESPÓJNOŚCI ZNALEZIONE**

---

## Streszczenie Wykonawcze

### Cel Audytu

Weryfikacja spójności między schematem bazy danych (migrations), definicjami typów (TypeScript), API (purchaseOrders.ts, etc.) i komponentami UI dla wszystkich modułów P0 (Technical, Planning, Production, Warehouse, Scanner, Settings).

### Wynik Audytu

**Status:** ❌ **NIEPOWODZENIE** - Znaleziono **7 krytycznych niespójności** wymagających natychmiastowej naprawy przed rozpoczęciem Phase 1 (Epic 1.1).

### Krytyczne Problemy

1. ❌ **PO Header**: Brakuje kolumny `warehouse_id` w DB, ale API `quick_create_pos` próbuje ją wstawić
2. ❌ **TO Header**: DB ma status 'closed', TypeScript nie ma tego statusu
3. ❌ **License Plate Status**: DB i TypeScript mają różne wartości enum
4. ❌ **License Plate QA Status**: DB i TypeScript mają różne wartości enum
5. ❌ **License Plate UoM**: DB ma ograniczony CHECK constraint (tylko 4 jednostki)
6. ⚠️ **Work Orders**: Nieznane czy są problemy - wymaga głębszej weryfikacji
7. ⚠️ **Products/BOMs**: Nieznane czy są problemy - wymaga głębszej weryfikacji

### Rekomendacje

**PRIORYTET P0 (KRYTYCZNY):**

- ✅ **Utworzyć Epic 0: "P0 Modules Data Integrity Audit & Fix"** PRZED rozpoczęciem Epic 1.1
- ✅ **Naprawić wszystkie 7 niespójności** w ramach Epic 0
- ✅ **Zweryfikować pozostałe moduły** (WO, Products, BOMs, Suppliers, Machines, Locations)
- ✅ **Utworzyć automated validation tests** aby zapobiec przyszłym niespójnościom

---

## Szczegółowe Wyniki Audytu

### 1. Purchase Orders (PO) Module

#### Problem #1: Brakująca kolumna `warehouse_id` w `po_header`

**Priorytet:** 🔴 **KRYTYCZNY**

**Opis:**
API `quick_create_pos` przyjmuje parametr `warehouse_id` (linia 11, 300 w purchaseOrders.ts) i próbuje go wstawić do tabeli `po_header` (linia 304 w migrations/039_rpc_functions.sql), ale kolumna NIE ISTNIEJE w schemacie bazy danych.

**Lokalizacje:**

- **DB Schema:** `migrations/016_po_header.sql` - BRAK `warehouse_id`
- **RPC Function:** `migrations/039_rpc_functions.sql:304` - INSERT zawiera `warehouse_id`
- **API:** `lib/api/purchaseOrders.ts:11, 300` - `warehouse_id` w interfejsie i wywołaniu RPC
- **TypeScript:** `lib/types.ts:414` - `POHeader` interface NIE MA `warehouse_id`

**Szczegóły problemu:**

```sql
-- migrations/016_po_header.sql (AKTUALNY SCHEMAT)
CREATE TABLE po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate NUMERIC(12,6),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  payment_due_date TIMESTAMPTZ,
  -- ... inne pola
  -- ❌ BRAK warehouse_id
);
```

```sql
-- migrations/039_rpc_functions.sql:302-316 (RPC FUNCTION)
INSERT INTO po_header (
  number,
  supplier_id,
  status,
  currency,
  exchange_rate,
  order_date,
  requested_delivery_date,
  promised_delivery_date,
  payment_due_date,
  net_total,
  vat_total,
  gross_total,
  warehouse_id  -- ❌ PRÓBA WSTAWIENIA KOLUMNY, KTÓRA NIE ISTNIEJE
)
```

```typescript
// lib/api/purchaseOrders.ts:9-12 (API INTERFACE)
export interface QuickPOCreateRequest {
  lines: QuickPOEntryLine[];
  warehouse_id?: number; // ✅ API przyjmuje warehouse_id
}

// lib/api/purchaseOrders.ts:297-301 (API CALL)
const { data, error } = await supabase.rpc('quick_create_pos', {
  p_product_entries: request.lines,
  p_user_id: user.id,
  p_warehouse_id: request.warehouse_id || null, // ✅ Przekazuje warehouse_id do RPC
});
```

**Konsekwencje:**

- ❌ **Quick PO Entry workflow NIE DZIAŁA** - funkcja `quick_create_pos` zwróci błąd SQL: `column "warehouse_id" of relation "po_header" does not exist`
- ❌ **Nie można określić docelowego warehouse** dla Purchase Order
- ❌ **GRN creation** nie wie, do którego warehouse dostarczyć materiały
- ❌ **Quick PO functionality** (docs/QUICK_PO_ENTRY_IMPLEMENTATION.md) jest zepsuta

**Napraw wymaganych:**

1. ✅ **Dodać kolumnę `warehouse_id` do `po_header`** via migracja
2. ✅ **Zaktualizować TypeScript interface `POHeader`** - dodać `warehouse_id?: number`
3. ✅ **Zweryfikować UI components** - czy formularz PO create pokazuje pole warehouse_id
4. ✅ **Zaktualizować dokumentację** - potwierdzić politykę PO → warehouse assignment

**Proponowana naprawa (migration):**

```sql
-- NEW MIGRATION: 0XX_add_warehouse_id_to_po_header.sql
ALTER TABLE po_header ADD COLUMN warehouse_id INTEGER REFERENCES warehouses(id);

-- Add index for query performance
CREATE INDEX idx_po_header_warehouse_id ON po_header(warehouse_id);

-- Optionally set default warehouse for existing POs (if any)
-- UPDATE po_header SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'MAIN' LIMIT 1) WHERE warehouse_id IS NULL;
```

---

### 2. Transfer Orders (TO) Module

#### Problem #2: DB status 'closed' nie istnieje w TypeScript enum

**Priorytet:** 🟡 **ŚREDNI**

**Opis:**
Tabela `to_header` ma CHECK constraint ze statusem 'closed' (migration 019), ale TypeScript `TOStatus` nie zawiera tego statusu.

**Lokalizacje:**

- **DB Schema:** `migrations/019_to_header.sql:9` - CHECK constraint zawiera 'closed'
- **TypeScript:** `lib/types.ts:406-411` - `TOStatus` NIE MA 'closed'

**Szczegóły problemu:**

```sql
-- migrations/019_to_header.sql:9 (DB SCHEMA)
CREATE TABLE to_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled')),
  -- ✅ DB POZWALA NA 'closed'
  ...
);
```

```typescript
// lib/types.ts:406-411 (TYPESCRIPT)
export type TOStatus =
  | 'draft'
  | 'submitted'
  | 'in_transit'
  | 'received'
  | 'cancelled';
// ❌ BRAK 'closed'
```

**Konsekwencje:**

- ⚠️ **Możliwa niespójność danych** - jeśli jakiś kod SQL ustawia status='closed', TypeScript nie rozpozna tego statusu
- ⚠️ **UI może nie wyświetlić poprawnie** statusu 'closed'
- ⚠️ **Filtrowanie i wyszukiwanie** może nie działać dla zamkniętych TO

**Napraw wymaganych:**

1. ✅ **Dodać 'closed' do `TOStatus` enum** w lib/types.ts
2. ✅ **Zweryfikować czy jest workflow** dla zamykania TO (TO → closed transition)
3. ✅ **Zaktualizować UI components** - dodać obsługę statusu 'closed'

**Proponowana naprawa:**

```typescript
// lib/types.ts
export type TOStatus =
  | 'draft'
  | 'submitted'
  | 'in_transit'
  | 'received'
  | 'closed' // ✅ DODAĆ
  | 'cancelled';
```

---

### 3. License Plates Module

#### Problem #3: Niespójność wartości enum `status`

**Priorytet:** 🔴 **KRYTYCZNY**

**Opis:**
DB i TypeScript mają całkowicie różne wartości dla `license_plates.status`.

**Lokalizacje:**

- **DB Schema:** `migrations/025_license_plates.sql:13` - CHECK constraint
- **TypeScript:** `lib/types.ts:172-179` - `LicensePlateStatus` enum

**Szczegóły problemu:**

```sql
-- migrations/025_license_plates.sql:13 (DB SCHEMA)
status VARCHAR(20) DEFAULT 'available' CHECK (status IN
  ('available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged')
)
```

```typescript
// lib/types.ts:172-179 (TYPESCRIPT)
export type LicensePlateStatus =
  | 'Available' // ✅ Pasuje do DB 'available' (case-insensitive?)
  | 'Reserved' // ✅ Pasuje do DB 'reserved'
  | 'In Production' // ❌ NIE ISTNIEJE W DB
  | 'QA Hold' // ❌ NIE ISTNIEJE W DB
  | 'QA Released' // ❌ NIE ISTNIEJE W DB
  | 'QA Rejected' // ❌ NIE ISTNIEJE W DB
  | 'Shipped'; // ❌ NIE ISTNIEJE W DB
// ❌ BRAK: 'consumed', 'in_transit', 'quarantine', 'damaged'
```

**Analiza:**

- **DB ma:** available, reserved, consumed, in_transit, quarantine, damaged
- **TypeScript ma:** Available, Reserved, In Production, QA Hold, QA Released, QA Rejected, Shipped
- **Wspólne:** Available/available, Reserved/reserved
- **Tylko DB:** consumed, in_transit, quarantine, damaged
- **Tylko TypeScript:** In Production, QA Hold, QA Released, QA Rejected, Shipped

**Konsekwencje:**

- ❌ **CAŁKOWITA NIESPÓJNOŚĆ** - TypeScript i DB mówią "różnymi językami"
- ❌ **UI nie może wyświetlić** statusów: consumed, in_transit, quarantine, damaged
- ❌ **API nie może ustawić** statusów: In Production, QA Hold, QA Released, QA Rejected, Shipped
- ❌ **Warehouse workflow** (consume LP, ship LP) NIE DZIAŁA poprawnie

**Napraw wymaganych:**

1. ✅ **Określić WŁAŚCIWE wartości enum** (business requirement - co powinno być?)
2. ✅ **Zaktualizować DB schema** - dodać brakujące statusy lub usunąć niepotrzebne
3. ✅ **Zaktualizować TypeScript enum** - zsynchronizować z DB
4. ✅ **Zweryfikować API i UI** - czy używają poprawnych statusów
5. ✅ **Migracja danych** - jeśli są istniejące LPs z "złymi" statusami

**Proponowana decyzja architektoniczna:**
Użyć **rozszerzonych statusów** z obu źródeł:

```sql
-- Proposed DB schema
status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
  'available',    -- LP dostępny do użycia
  'reserved',     -- LP zarezerwowany dla WO
  'in_production',-- LP w trakcie produkcji (was: "In Production")
  'consumed',     -- LP skonsumowany przez WO
  'in_transit',   -- LP w transporcie (between warehouses)
  'quarantine',   -- LP w kwarantannie (QA hold, was: "QA Hold")
  'qa_passed',    // LP przeszedł kontrolę jakości (was: "QA Released")
  'qa_rejected',  // LP odrzucony przez QA (was: "QA Rejected")
  'shipped',      -- LP wysłany do klienta
  'damaged'       -- LP uszkodzony
))
```

```typescript
// Proposed TypeScript enum
export type LicensePlateStatus =
  | 'available'
  | 'reserved'
  | 'in_production'
  | 'consumed'
  | 'in_transit'
  | 'quarantine'
  | 'qa_passed'
  | 'qa_rejected'
  | 'shipped'
  | 'damaged';
```

---

#### Problem #4: Niespójność wartości enum `qa_status`

**Priorytet:** 🟡 **ŚREDNI**

**Opis:**
DB i TypeScript mają różne wartości dla `license_plates.qa_status`.

**Lokalizacje:**

- **DB Schema:** `migrations/025_license_plates.sql:14` - CHECK constraint
- **TypeScript:** `lib/types.ts:181` - `QAStatus` enum

**Szczegóły problemu:**

```sql
-- migrations/025_license_plates.sql:14 (DB SCHEMA)
qa_status VARCHAR(20) DEFAULT 'pending' CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold'))
```

```typescript
// lib/types.ts:181 (TYPESCRIPT)
export type QAStatus = 'Passed' | 'Failed' | 'Pending' | 'Hold' | 'Quarantine';
```

**Analiza:**

- **DB ma:** pending, passed, failed, on_hold
- **TypeScript ma:** Passed, Failed, Pending, Hold, Quarantine
- **Wspólne:** passed/Passed, failed/Failed, pending/Pending
- **DB ma on_hold**, TypeScript ma **Hold** (semantycznie to samo, różna nazwa)
- **TypeScript ma Quarantine**, DB NIE MA (ale `status` ma 'quarantine')

**Konsekwencje:**

- ⚠️ **Umiarkowana niespójność** - większość wartości pasuje (case-insensitive)
- ⚠️ **Możliwa konfuzja**: qa_status='Quarantine' vs status='quarantine'
- ⚠️ **UI może używać złych wartości** przy ustawianiu qa_status

**Napraw wymaganych:**

1. ✅ **Usunąć 'Quarantine' z `QAStatus`** (to jest wartość `status`, nie `qa_status`)
2. ✅ **Zmienić 'Hold' na 'on_hold'** w TypeScript (lub odwrotnie - zmienić DB na 'hold')
3. ✅ **Zdecydować: case-sensitive czy case-insensitive?** (lowercase w DB, PascalCase w TS?)

**Proponowana naprawa:**

```typescript
// lib/types.ts - LOWERCASE (match DB)
export type QAStatus = 'pending' | 'passed' | 'failed' | 'on_hold';
```

---

#### Problem #5: Ograniczony CHECK constraint dla `uom`

**Priorytet:** 🟡 **ŚREDNI**

**Opis:**
DB ma CHECK constraint ograniczający `uom` tylko do 4 wartości: KG, EACH, METER, LITER. To może być problem dla produktów wymagających innych jednostek (np. BOX, PALLET, CASE, GALLON, POUND, etc.).

**Lokalizacje:**

- **DB Schema:** `migrations/025_license_plates.sql:11` - CHECK constraint

**Szczegóły problemu:**

```sql
-- migrations/025_license_plates.sql:11 (DB SCHEMA)
uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER'))
```

**Konsekwencje:**

- ⚠️ **Niemożność utworzenia LP** dla produktów z innymi jednostkami (np. GALLON, POUND, BOX, PALLET)
- ⚠️ **Ograniczenie biznesowe** - klient może potrzebować więcej jednostek
- ⚠️ **Niekompatybilność z międzynarodowymi standardami** (US Customary Units, Imperial Units)

**Napraw wymaganych:**

1. ✅ **Usunąć CHECK constraint** - pozwolić na dowolne wartości VARCHAR(20)
2. ✅ **Utworzyć tabelę referencyjną `uom_master`** (opcjonalne, jeśli chcemy walidacji)
3. ✅ **Zweryfikować UI** - czy ma dropdown z jednostkami? Skąd bierze wartości?

**Proponowana naprawa (Option A - Usunąć CHECK):**

```sql
-- Migration: Remove UoM CHECK constraint
ALTER TABLE license_plates DROP CONSTRAINT license_plates_uom_check;
```

**Proponowana naprawa (Option B - Rozszerzyć listę):**

```sql
-- Migration: Extend UoM list
ALTER TABLE license_plates DROP CONSTRAINT license_plates_uom_check;
ALTER TABLE license_plates ADD CONSTRAINT license_plates_uom_check
  CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER', 'GALLON', 'POUND', 'BOX', 'PALLET', 'CASE', 'DRUM'));
```

**Proponowana naprawa (Option C - UoM Master Table):**

```sql
-- Migration: Create UoM master table
CREATE TABLE uom_master (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'weight', 'volume', 'length', 'count'
  is_active BOOLEAN DEFAULT true
);

-- Seed with common units
INSERT INTO uom_master (code, name, category) VALUES
  ('KG', 'Kilogram', 'weight'),
  ('POUND', 'Pound', 'weight'),
  ('EACH', 'Each', 'count'),
  ('BOX', 'Box', 'count'),
  ('PALLET', 'Pallet', 'count'),
  ('LITER', 'Liter', 'volume'),
  ('GALLON', 'Gallon', 'volume'),
  ('METER', 'Meter', 'length');

-- Change license_plates FK
ALTER TABLE license_plates DROP CONSTRAINT license_plates_uom_check;
ALTER TABLE license_plates ADD CONSTRAINT fk_license_plates_uom
  FOREIGN KEY (uom) REFERENCES uom_master(code);
```

---

### 4. Work Orders Module

**Status:** ⚠️ **WYMAGA GŁĘBSZEJ WERYFIKACJI**

**Podsumowanie:**

- ✅ Schemat `work_orders` wydaje się OK (ma wszystkie podstawowe pola)
- ⚠️ Wymaga weryfikacji: czy TypeScript `WorkOrder` interface pasuje do DB schema
- ⚠️ Wymaga weryfikacji: czy API używa poprawnych pól
- ⚠️ Wymaga weryfikacji: czy UI components mają wszystkie potrzebne pola

**Następne kroki:**

1. Porównać DB schema `work_orders` vs TypeScript `WorkOrder` interface
2. Sprawdzić API `WorkOrdersAPI` - czy używa poprawnych kolumn
3. Zweryfikować UI components - formularz Create WO, WO details page

---

### 5. Products/BOMs Module

**Status:** ⚠️ **WYMAGA GŁĘBSZEJ WERYFIKACJI**

**Podsumowanie:**

- ⚠️ Wymaga weryfikacji: czy schemat `products`, `boms`, `bom_items` pasuje do TypeScript
- ⚠️ Wymaga weryfikacji: Multi-version BOM implementation (date overlaps, triggers)
- ⚠️ Wymaga weryfikacji: By-products implementation (wo_by_products table)

**Następne kroki:**

1. Porównać DB schemas vs TypeScript interfaces
2. Zweryfikować BOM version management logic
3. Sprawdzić by-products workflow

---

## Podsumowanie Napraw Wymaganych

### Epic 0: P0 Modules Data Integrity Audit & Fix

**Priorytet:** 🔴 **P0 (KRYTYCZNY - PRZED PHASE 1)**

**Cel:** Naprawić wszystkie znalezione niespójności między DB schema, TypeScript, API i UI w modułach P0.

**Stories:**

#### Epic 0.1: Fix PO Header `warehouse_id` (KRYTYCZNY)

- **Zadanie:** Dodać kolumnę `warehouse_id` do `po_header`
- **Deliverables:**
  - ✅ Migration: `0XX_add_warehouse_id_to_po_header.sql`
  - ✅ Update TypeScript: `lib/types.ts` - dodać `warehouse_id` do `POHeader`
  - ✅ Verify RPC: `quick_create_pos` działa poprawnie
  - ✅ Verify UI: Formularz PO create ma pole warehouse_id
  - ✅ Test: E2E test dla Quick PO Entry workflow
- **Effort:** 8 SP (16 godzin)

#### Epic 0.2: Fix TO Status enum (ŚREDNI)

- **Zadanie:** Dodać status 'closed' do TypeScript `TOStatus`
- **Deliverables:**
  - ✅ Update TypeScript: `lib/types.ts` - dodać 'closed'
  - ✅ Update UI: Obsługa statusu 'closed' w TO components
  - ✅ Test: Weryfikacja czy TO może być zamknięty
- **Effort:** 3 SP (6 godzin)

#### Epic 0.3: Fix License Plate Status enum (KRYTYCZNY)

- **Zadanie:** Zsynchronizować wartości enum `status` między DB i TypeScript
- **Deliverables:**
  - ✅ Decision: Określić właściwe wartości enum (business requirement)
  - ✅ Migration: `0XX_fix_lp_status_enum.sql` - zaktualizować CHECK constraint
  - ✅ Update TypeScript: `lib/types.ts` - zsynchronizować `LicensePlateStatus`
  - ✅ Data migration: Zmapować stare wartości na nowe (jeśli są dane)
  - ✅ Update API: Zweryfikować wszystkie miejsca używające LP status
  - ✅ Update UI: Zweryfikować wszystkie komponenty LP
  - ✅ Test: E2E tests dla LP lifecycle (create, reserve, consume, ship)
- **Effort:** 13 SP (26 godzin)

#### Epic 0.4: Fix License Plate QA Status enum (ŚREDNI)

- **Zadanie:** Zsynchronizować wartości enum `qa_status` między DB i TypeScript
- **Deliverables:**
  - ✅ Update TypeScript: `lib/types.ts` - usunąć 'Quarantine', zmienić 'Hold' na 'on_hold'
  - ✅ Update UI: Zweryfikować komponenty używające QA status
  - ✅ Test: Weryfikacja QA workflow
- **Effort:** 5 SP (10 godzin)

#### Epic 0.5: Fix License Plate UoM constraint (ŚREDNI)

- **Zadanie:** Rozszerzyć dozwolone wartości `uom` w `license_plates`
- **Deliverables:**
  - ✅ Decision: Wybrać opcję A (remove CHECK), B (extend list), lub C (UoM master table)
  - ✅ Migration: `0XX_fix_lp_uom_constraint.sql` - zaimplementować wybraną opcję
  - ✅ Update UI: Dropdown UoM - skąd bierze wartości?
  - ✅ Test: Weryfikacja tworzenia LP z różnymi jednostkami
- **Effort:** 8 SP (16 godzin)

#### Epic 0.6: Deep Audit - Work Orders, Products, BOMs (WERYFIKACJA)

- **Zadanie:** Przeprowadzić głęboki audyt pozostałych modułów P0
- **Deliverables:**
  - ✅ Audit: Work Orders (schema vs TypeScript vs API vs UI)
  - ✅ Audit: Products (schema vs TypeScript vs API vs UI)
  - ✅ Audit: BOMs (schema vs TypeScript vs API vs UI, multi-version logic)
  - ✅ Audit: By-products (wo_by_products implementation)
  - ✅ Audit: Suppliers, Machines, Locations, Warehouses
  - ✅ Report: Dodatkowe niespójności (jeśli znajdą się)
  - ✅ Fix: Naprawić wszystkie znalezione problemy
- **Effort:** 21 SP (42 godzin)

#### Epic 0.7: Automated Validation Tests (PREWENCJA)

- **Zadanie:** Utworzyć automated tests zapobiegające przyszłym niespójnościom
- **Deliverables:**
  - ✅ Test: Schema validation script (porównuje DB schema vs TypeScript enums)
  - ✅ Test: API contract tests (czy API używa poprawnych typów)
  - ✅ CI/CD: Integracja z pre-commit hooks
  - ✅ Docs: Dokumentacja procesu walidacji
- **Effort:** 13 SP (26 godzin)

---

### Łączny Effort Epic 0

**Total Story Points:** 71 SP (142 godziny)

**Timeline:**

- Sprint 0.1 (2 tygodnie): Epic 0.1, 0.2 (11 SP)
- Sprint 0.2 (2 tygodnie): Epic 0.3, 0.4 (18 SP)
- Sprint 0.3 (2 tygodnie): Epic 0.5, 0.6 (29 SP)
- Sprint 0.4 (1 tydzień): Epic 0.7 (13 SP)

**Total Duration:** 7 tygodni (przed rozpoczęciem Phase 1 Epic 1.1)

---

## Następne Kroki

### Immediate Actions (Dzisiaj)

1. ✅ **Utworzyć Epic 0** w sprint-status.yaml
2. ✅ **Przedstawić raport audytu** użytkownikowi (Mariusz)
3. ✅ **Uzyskać akceptację** zakresu napraw
4. ✅ **Rozpocząć Epic 0.1** (Fix PO warehouse_id) - najbardziej krytyczny problem

### Phase 1 Planning

- ⏸️ **Wstrzymać rozpoczęcie Epic 1.1** do czasu ukończenia Epic 0
- ✅ **Zaktualizować timeline** - Phase 1 zaczyna się po Epic 0 (za 7 tygodni)
- ✅ **Zaktualizować bmm-workflow-status.yaml** - dodać Epic 0 jako prerequisite

### Quality Gates

- ✅ **All automated validation tests must pass** przed rozpoczęciem Phase 1
- ✅ **Zero critical inconsistencies** między DB, TypeScript, API, UI
- ✅ **E2E tests updated and passing** dla wszystkich naprawionych modułów

---

## Appendix: Analiza Przyczyn Źródłowych

### Dlaczego te niespójności powstały?

1. **Brak automated validation** - Nie ma testów weryfikujących spójność DB ↔ TypeScript
2. **Iteracyjny rozwój** - Schema DB ewoluował niezależnie od TypeScript types
3. **Brak single source of truth** - Enums definiowane w 2 miejscach (SQL + TS)
4. **Quick PO Entry dodany później** - Funkcja `quick_create_pos` założyła istnienie `warehouse_id`, którego nie było
5. **Multi-person development** - Różne osoby modyfikowały DB i TypeScript bez synchronizacji

### Jak zapobiec w przyszłości?

1. ✅ **Schema-first development** - DB schema jako source of truth
2. ✅ **Automated enum generation** - Generować TypeScript enums z DB schemas
3. ✅ **CI/CD validation** - Pre-commit hooks weryfikujące spójność
4. ✅ **Code review checklist** - "Czy TypeScript pasuje do DB schema?"
5. ✅ **Single source of truth for enums** - Przechowywać w YAML/JSON, generować SQL + TS

---

## Zatwierdzenie Raportu

**Przygotował:** Mariusz
**Data:** 2025-11-14
**Wersja:** 1.0

**Status:** ⏳ **OCZEKUJE NA ZATWIERDZENIE**

**Do zatwierdzenia:**

- [ ] Scope Epic 0 (71 SP, 7 tygodni)
- [ ] Priorytetyzacja (Epic 0 PRZED Phase 1)
- [ ] Timeline adjustment (Phase 1 zaczyna się po Epic 0)

---

_Ten raport został wygenerowany w ramach BMad Method Solutioning Gate Check workflow dla projektu MonoPilot._
