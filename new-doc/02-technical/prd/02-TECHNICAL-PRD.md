# PRD 02-Technical — MonoPilot MES
**Wersja**: 3.2 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Moduł Technical zarządza cyklem życia produktu od definicji receptury (BOM) przez marszruty produkcyjne do pełnej trasowalności i kalkulacji kosztów. Jest fundamentem danych technicznych systemu — każdy moduł operacyjny (Planning, Production, Warehouse, Quality, Shipping) opiera się na danych zdefiniowanych w Technical.

**Zakres modułu**: Product Master, BOM/Receptury, Routingi/Marszruty, Alergeny, Trasowalność (forward/backward), Costing, Shelf Life, Nutrition, Dashboard techniczny.

**Kluczowe rozszerzenia v3.0** (z PRD-UPDATE-LIST): Pola wagowe (net/tare/gross), catch weight, shelf life rozszerzony (best_before, shelf_advice), yield_percent na produkcie, preferred_supplier, tolerancje dostaw, BOM versioning z zatwierdzaniem, co-products, flushing principle, item_group klasyfikacja, formula audit trail.

**Zależności**: M01 Settings (alergeny, maszyny, linie, magazyny) → **M02 Technical** → M03 Warehouse, M04 Planning, M06 Production, M08 Quality.

---

## 2. Objectives

### Cel główny
Zapewnienie kompletnych, wersjonowanych danych technicznych produktów spożywczych — od receptury przez routing do kosztów — z pełną zgodnością regulacyjną (trasowalność < 30 s, alergeny EU-14, audit trail).

### Cele szczegółowe
1. **Product Master kompletny** — wszystkie pola wymagane przez D365-equivalent (wagi, catch weight, shelf life, yield, procurement)
2. **BOM/Receptura z wersjonowaniem** — wersje z datami ważności, zatwierdzanie, co-products, audit trail zmian
3. **Routing z kosztami** — pełna kalkulacja kosztów (materiał + praca + setup + overhead), ADR-009
4. **Trasowalność end-to-end** — forward/backward < 30 s, recall simulation, genealogia lotów
5. **Zgodność regulacyjna** — alergeny EU-14 z auto-propagacją, lot tracking 100%, audit trail

### Metryki sukcesu (12 miesięcy)

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Produkty z kompletnym BOM | ≥ 80% | Dashboard |
| Produkty z routingiem | ≥ 70% | Dashboard |
| Pokrycie trasowalności | ≥ 90% | Audit |
| Kompletność danych kosztowych | ≥ 60% | Dashboard |
| Czas tworzenia BOM | < 5 min | UX metrics |
| Czas zapytania trasowalności | < 30 s (regulacyjny) | APM |
| Poprawność alergenów | 100% | QA audits |
| Routingi z kosztami | ≥ 50% | Dashboard |

---

## 3. Personas

| Persona | Rola w module Technical | Uprawnienia |
|---------|------------------------|-------------|
| **Kierownik produkcji** | Tworzenie/edycja produktów, BOM, routingów. Przegląd kosztów. | CRUD products, BOMs, routings |
| **Kierownik jakości** | Przegląd alergenów, trasowalność, recall simulation. Shelf life. | READ all, trasowalność EXECUTE |
| **Technolog żywności** | Receptury (BOM), wersjonowanie, co-products, nutrition. | CRUD BOMs, routings |
| **Planista** | Przegląd BOM dla MRP, dane procurement na produkcie. | READ products, BOMs |
| **Operator produkcji** | Podgląd receptury/instrukcji na hali (read-only). | READ BOMs, routings |
| **Dyrektor zakładu** | Dashboard, KPI, koszty (read-only). | READ all |
| **Administrator** | Pełny dostęp, konfiguracja typów, flag warunkowych. | FULL |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Obszar | Zakres | Priorytet |
|--------|--------|-----------|
| Product Master | CRUD, SKU, GTIN, typy, status, wersjonowanie, audit log | Must Have |
| Product — pola wagowe | net_weight, tare_weight, gross_weight [2.1] | Must Have |
| Product — shelf life | shelf_life_days (dni od produkcji), best_before_days (data ważności), shelf_advice_days (min shelf life wymagany przez klienta) [2.2] | Must Have |
| Product — catch weight | is_catch_weight, cw_unit, nominal_qty, min_qty, max_qty [2.3] | Must Have |
| Product — yield | yield_percent (oczekiwany) [2.4] | Must Have |
| Product — supplier | preferred_supplier_id [2.5] | Must Have |
| Product — tolerancje | over_delivery_tolerance_pct, under_delivery_tolerance_pct [2.6] | Must Have |
| Product — item_group | custom `item_groups` table (seeded: RawMeat, Packaging, Consumables, FinGoods, WIP) [2.15] | Must Have |
| Product — procurement | lead_time_days, moq (ADR-010) | Must Have |
| BOM basic | CRUD, wersje z datami ważności, items z qty/uom/scrap%, alergeny | Must Have |
| BOM — alternatywy | Zamienniki składników (same UoM class) | Must Have |
| BOM — conditional items | Flagi warunkowe (organic, vegan, kosher) | Must Have |
| BOM — by-products | yield_percent na BOM item | Must Have |
| BOM — packaging | units_per_box, boxes_per_pallet | Must Have |
| BOM — explosion | Multi-level (do 10 poziomów) | Must Have |
| BOM — clone/compare | Klonowanie BOM, porównanie wersji (diff) | Must Have |
| BOM — routing ref | routing_id na BOM (ADR-009) | Must Have |
| BOM — cost rollup | Material + labor + routing costs | Must Have |
| Routing | CRUD, code, is_reusable, operacje z sequence/time/machine | Must Have |
| Routing — koszty | setup_cost, working_cost_per_unit, overhead_percent (ADR-009) | Must Have |
| Routing — operations | setup_time, duration, cleanup_time, labor_cost, instructions | Must Have |
| Alergeny | EU-14, contains/may_contain, auto-inheritance z BOM | Must Have |
| Trasowalność | Forward/backward, recall simulation, genealogia, lot tracking | Must Have |
| Costing | Recipe costing, cost rollup multi-level, routing costs | Must Have |
| Shelf Life | Kalkulacja z BOM (min składników), override, product_shelf_life | Must Have |
| Dashboard | Product stats, allergen matrix | Should Have |

### 4.2 Out of Scope — Phase 2

| Obszar | Zakres | Numer |
|--------|--------|-------|
| BOM versioning rozszerzony | version_id, active, approved flags, approval workflow [2.8] | HIGH |
| Co-products | Tabela co-products, formula → main + co-products [2.9] | HIGH |
| Variable scrap | variable_scrap_pct per BOM line [2.10] | HIGH |
| Flushing principle | BACKFLUSH/MANUAL per BOM line [2.11] | HIGH |
| Formula audit trail | Pełny audit trail zmian BOM/receptury [2.14] | HIGH |
| Default purchase price advanced | Cost scenario modeling, historical price tracking [2.7] | MEDIUM |
| BOM line priority | priority (kolejność konsumpcji) [2.12] | MEDIUM |
| BOM line valid dates | valid_from/valid_to per BOM line [2.13] | MEDIUM |
| Cost variance analysis | Standard vs actual (z Production) | Phase 2 |
| Historical cost tracking | Historia kosztów z datami | Phase 2 |
| Cost scenario modeling | Multiple cost sets per routing | Phase 2 |
| Nutrition calculation | Kalkulacja z BOM, label FDA, per serving | Phase 2 |
| Nutrition claims | Walidacja claim (low fat, organic) | Phase 2 |
| Cross-contamination tracking | Śledzenie zanieczyszczeń krzyżowych | Phase 2 |
| Ingredient origin | Pochodzenie składników | Phase 2 |
| Routing templates | Szablony routingów | Phase 2 |
| Product image upload | Zdjęcia produktów | Phase 2 |
| Product barcode generation | Generowanie kodów kreskowych | Phase 2 |
| Product categories/tags | Kategorie i tagi | Phase 2 |
| BOM version timeline viz | Wizualizacja osi czasu wersji | Phase 2 |
| Cost trend analysis | Dashboard trendów kosztowych | Phase 2 |

### 4.3 Exclusions (Nigdy w Technical)

- **Operacyjne quality checkpoints** — przeniesione do M08 Quality (FR-2.49)
- **Planowanie produkcji** — M04 Planning (WO, PO, TO)
- **Fizyczne ruchy magazynowe** — M03 Warehouse (LP, GRN, moves)
- **Pełna księgowość kosztów** — M10 Finance
- **NPD stage-gate** — M09 NPD

---

## 5. Constraints

### Techniczne
- **org_id + RLS** na WSZYSTKICH tabelach (ADR-003, ADR-013). Brak wyjątków.
- **site_id** opcjonalny na tabelach (przygotowanie Multi-Site M11), nullable w Phase 1.
- **Supabase PostgreSQL** — trigery, RLS policies, indeksy. Service role z filtrowaniem org_id.
- **Service Layer** — logika w `lib/services/*-service.ts`, walidacja Zod. API → serwis → DB (ADR-015, ADR-016, ADR-018).
- **BOM explosion** — recursive CTE z limitem 10 poziomów, max 1000 węzłów.
- **Waluta** — GBP domyślnie (pole `currency` na routing), multi-currency w Phase 2.

### Biznesowe
- **Catch weight** — cross-cutting: produkty CW muszą być obsługiwane w WO, TO, SO. Technical definiuje dane master, inne moduły konsumują.
- **Alergeny EU-14** — obowiązkowe, auto-propagacja z BOM. Brak kompromisów.
- **BOM snapshot** — niezmienny po utworzeniu WO (ADR-002). Kluczowe dla compliance.

### Regulacyjne
- **Trasowalność forward/backward < 30 s** — wymaganie FSMA 204, EU Food Safety.
- **Lot tracking 100%** — każda transakcja z lot_id.
- **Audit trail** — immutable, old_data/new_data, user_id, timestamp (ADR-008).
- **Alergeny EU-14** — deklaracja contains/may_contain, inheritance z BOM.
- **Shelf life** — obliczeniowy lub ręczny, wpływ na FEFO (M03).

---

## 6. Decisions

### D1. BOM Snapshot Pattern (ADR-002)
**Status**: ACCEPTED | **Wpływ**: Planning, Production

Przy tworzeniu Work Order:
1. Wybór aktywnego BOM na podstawie effective date
2. Kopiowanie `bom_items` → `wo_materials` ze skalowaniem: `required_qty = bom_item.qty × (wo.planned_qty / bom.output_qty)`
3. Kopiowanie `routing_operations` → `wo_operations` (wraz z kosztami, cleanup_time, instructions)
4. Zapis `bom_id` + `bom_version` + `routing_snapshot` dla audytu

**Reguła**: WO operuje na własnej kopii. Zmiany BOM po utworzeniu WO NIE wpływają na istniejące WO.

### D2. Routing-Level Costs (ADR-009)
**Status**: ACCEPTED + IMPLEMENTED | **Wpływ**: Costing, BOM Snapshot

Koszty bezpośrednio na tabeli `routings`:
- `setup_cost` — koszt stały per run (tooling, przezbrojenie)
- `working_cost_per_unit` — koszt zmienny per jednostkę output
- `overhead_percent` — % narzutu fabrycznego

**Formuła kosztu całkowitego**:
```
Total = Material Cost (BOM)
      + Operation Labor (duration × rate)
      + Operation Setup (setup_time × rate)
      + Operation Cleanup (cleanup_time × rate)
      + Routing Setup (fixed per run)
      + Routing Working (per unit × qty)
      + Overhead (subtotal × overhead_percent / 100)
```

### D3. Product-Level Procurement Fields (ADR-010)
**Status**: ACCEPTED | **Wpływ**: Planning MRP

`lead_time_days` i `moq` na tabeli `products` (NIE na suppliers). Uzasadnienie: lead time i MOQ różnią się per produkt, nie per dostawca.

### D4. RLS + org_id (ADR-003, ADR-013)
Wszystkie tabele Technical mają `org_id UUID NOT NULL`. RLS policy:
```sql
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
```

### D5. LP-only Inventory (ADR-001)
Brak luźnych ilości. Każda operacja na atomowych License Plates. Technical definiuje produkty; Warehouse operuje na LP.

### D6. GS1 Compliance (ADR-004)
- `gtin` (GTIN-14) na produkcie
- GS1-128 dla LP (lot, expiry)
- SSCC-18 dla palet

### D7. Audit Trail (ADR-008)
- `product_version_history` — JSONB changed_fields per wersja
- `audit_log` — trigery PG + app context (old_data, new_data, user_id, ip, reason)
- **Formula audit trail** [2.14] — Phase 2: dedykowany `formula_audit_log`

### Decyzje biznesowe (bez ADR)
- **BOM snapshot obowiązkowy** — dla zgodności regulacyjnej (FDA 21 CFR Part 11, FSMA 204)
- **Catch weight = opt-in** — `is_catch_weight` per produkt, produkty non-CW nie dotknięte. Enforcement: **WARN** (nie block) gdy qty poza [min, max]
- **Shelf life vs best before** — `shelf_life_days` = dni od produkcji, `best_before_days` = data ważności (to dwa osobne koncepty, nie constraint między nimi)
- **Item group = custom table** — `item_groups` (org_id, code, name). Seeded: RawMeat, Packaging, Consumables, FinGoods, WIP. User może dodawać custom grupy
- **Preferred supplier** — FK do `suppliers(id)`. 1 domyślny dostawca per produkt. Produkt bez dostawcy dozwolony (NULL)
- **Flushing principle** — domyślnie **BACKFLUSH** (automatyczna konsumpcja). MANUAL tylko w wyjątkowych sytuacjach. Phase 2
- **Co-products cost allocation** — **manualne %** (nie wg yield). User ustawia % alokacji kosztów per co-product. Phase 2
- **Waluta domyślna** — **GBP** (potwierdzone). Schema `routings.currency DEFAULT 'GBP'`

---

## 7. Module Map — Sub-areas Technical

```
M02 Technical
├── E02.1 Product Master (MVP)
│   ├── Product CRUD + versioning
│   ├── Weight fields (net/tare/gross) [2.1]
│   ├── Shelf life extended [2.2]
│   ├── Catch weight [2.3]
│   ├── Yield, supplier, tolerances [2.4-2.6]
│   ├── Item group [2.15]
│   └── Procurement (lead_time, moq) [ADR-010]
│
├── E02.2 BOM & Recipes (MVP)
│   ├── BOM CRUD + date validity
│   ├── BOM items (qty, uom, scrap%, operation_seq)
│   ├── Alternatives, conditionals, by-products
│   ├── Packaging (units_per_box, boxes_per_pallet)
│   ├── BOM explosion (multi-level)
│   ├── BOM clone/compare
│   ├── Allergen inheritance
│   └── BOM-routing reference
│
├── E02.3 Routings & Costs (MVP)
│   ├── Routing CRUD (code, is_reusable)
│   ├── Operations (sequence, time, machine, instructions)
│   ├── Routing-level costs (ADR-009)
│   ├── BOM cost rollup
│   └── Costing service
│
├── E02.4 Traceability (MVP)
│   ├── Forward/backward trace
│   ├── Recall simulation
│   ├── Genealogy tree
│   └── Lot tracking
│
├── E02.5 Shelf Life & Nutrition (MVP partial)
│   ├── Shelf life calculation + override
│   └── [Phase 2] Nutrition engine + labels
│
├── E02.6 BOM Advanced (Phase 2)
│   ├── BOM versioning z approval [2.8]
│   ├── Co-products [2.9]
│   ├── Variable scrap [2.10]
│   ├── Flushing principle [2.11]
│   ├── BOM line priority [2.12]
│   ├── BOM line valid dates [2.13]
│   └── Formula audit trail [2.14]
│
├── E02.7 Advanced Costing (Phase 2)
│   ├── Cost variance analysis
│   ├── Historical cost tracking
│   ├── Cost scenario modeling
│   └── Advanced purchase price tracking [2.7]
│
└── E02.8 Dashboard & Analytics (MVP partial)
    ├── Product stats dashboard
    ├── Allergen matrix
    └── [Phase 2] BOM timeline, cost trends
```

---

## 8. Requirements

### E02.1 — Product Master (Phase 1 / MVP)

#### Backend

**Tabele** (rozszerzenie `products`):

| Kolumna | Typ | Domyślnie | Opis | Źródło |
|---------|-----|-----------|------|--------|
| net_weight | DECIMAL(15,4) | NULL | Waga netto (edytowalne) | [2.1] |
| tare_weight | DECIMAL(15,4) | NULL | Waga opakowania (edytowalne) | [2.1] |
| gross_weight | DECIMAL(15,4) | NULL | Waga brutto — **auto-computed**: net + tare (read-only) | [2.1] |
| shelf_life_days | INTEGER | NULL | Dni od daty produkcji do końca przydatności | [2.2] |
| best_before_days | INTEGER | NULL | Dni do daty ważności (best before — osobny koncept od shelf life) | [2.2] |
| shelf_advice_days | INTEGER | NULL | Minimalny shelf life wymagany przez klienta przy dostawie (np. Tesco wymaga min 70% shelf life) | [2.2] |
| is_catch_weight | BOOLEAN | false | Czy produkt CW | [2.3] |
| cw_unit | TEXT | NULL | Jednostka CW (kg, lb) | [2.3] |
| nominal_qty | DECIMAL(15,4) | NULL | Nominalna ilość CW | [2.3] |
| min_qty | DECIMAL(15,4) | NULL | Minimalna ilość CW | [2.3] |
| max_qty | DECIMAL(15,4) | NULL | Maksymalna ilość CW | [2.3] |
| yield_percent | DECIMAL(5,2) | NULL | Oczekiwany yield % | [2.4] |
| preferred_supplier_id | UUID FK suppliers | NULL | Preferowany dostawca | [2.5] |
| over_delivery_tolerance_pct | DECIMAL(5,2) | NULL | Tolerancja nadwyżki (%) | [2.6] |
| under_delivery_tolerance_pct | DECIMAL(5,2) | NULL | Tolerancja niedoboru (%) | [2.6] |
| item_group_id | UUID FK item_groups | NOT NULL | Grupa produktowa (custom). **Migration**: ADD COLUMN with DEFAULT (seed 'General' group), then ALTER to NOT NULL. UI enforces selection on product create/edit. | [2.15] |
| lead_time_days | INTEGER | 7 | Lead time procurement | ADR-010 |
| moq | DECIMAL(10,2) | NULL | Min order quantity | ADR-010 |

**Nowa tabela `item_groups`** (seeded, custom dozwolone):
```
id UUID PK, org_id UUID FK, code TEXT NOT NULL, name TEXT NOT NULL,
is_default BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at
UNIQUE(org_id, code)
Seed: RawMeat, Packaging, Consumables, FinGoods, WIP
```

**Istniejące pola** (już w DB): code, name, description, product_type_id, uom, status, version, barcode, gtin, category_id, expiry_policy, std_price, default_purchase_price, min_stock, max_stock, storage_conditions, is_perishable.

> **REC-M3 — Field Ownership**: `default_purchase_price` is OWNED by M02 Technical. M10 Finance reads it for cost calculations but does not write to it. Any updates to purchase price are made through the Technical product form only.

**Walidacje Zod**:
- `gross_weight` **auto-computed** = `net_weight` + `tare_weight` (pole read-only, obliczane przez trigger/service)
- Jeśli `is_catch_weight = true` → wymagane: `cw_unit`, `nominal_qty`; `min_qty` < `nominal_qty` < `max_qty` (**WARN** jeśli qty poza [min, max], NIE block)
- `yield_percent` ∈ [0, 200] (uwzględnia co-products)
- `over_delivery_tolerance_pct` ∈ [0, 100]; `under_delivery_tolerance_pct` ∈ [0, 100]
- `item_group_id` → FK do `item_groups` (custom table, user może dodawać grupy). NOT NULL — UI musi wymuszać wybór grupy przy tworzeniu/edycji produktu. Seeded: RawMeat, Packaging, Consumables, FinGoods, WIP
- Perishable → `shelf_life_days` required, `expiry_policy` ≠ 'none'
- RM/PKG → warning jeśli `default_purchase_price` = 0 lub brak

**API**:
```
GET    /api/technical/products              — List (filters: type, status, item_group, is_catch_weight)
POST   /api/technical/products              — Create (z nowymi polami)
GET    /api/technical/products/:id          — Detail
PUT    /api/technical/products/:id          — Update (auto-version)
DELETE /api/technical/products/:id          — Soft delete
GET    /api/technical/products/:id/versions — Version history
GET    /api/technical/products/:id/history  — Audit log
POST   /api/technical/products/:id/clone    — Clone
GET    /api/technical/products/:id/allergens     — Deklaracja alergenów
POST   /api/technical/products/:id/allergens     — Ustaw alergen
DELETE /api/technical/products/:id/allergens/:id — Usuń alergen
```

**Reguły biznesowe**:
- SKU (code) immutable po utworzeniu
- Wersja auto-inkrementacja przy każdej edycji
- Product type immutable po utworzeniu
- Alergeny auto-kalkulowane z aktywnego BOM (inheritance)

#### Frontend/UX
- Formularz produktu: dodanie sekcji „Weight", „Catch Weight", „Shelf Life", „Procurement", „Classification"
- Tabela produktów: filtry item_group, is_catch_weight
- Detail view: wyświetlenie nowych pól w sekcjach
- Walidacja inline (CW fields conditional)

#### Zależności
- M01 Settings: `allergens` (EU-14), `suppliers`, `product_types`
- M04 Planning: konsumuje `lead_time_days`, `moq` dla MRP
- M03 Warehouse: konsumuje `is_catch_weight`, shelf life dla FEFO

---

### E02.2 — BOM & Recipes (Phase 1 / MVP)

#### Backend

**Tabele**: `boms`, `bom_items`, `bom_alternatives`, `bom_production_lines`, `conditional_flags` — schema istniejący (patrz technical-arch.md).

**Kluczowe pola BOM**:
- `routing_id UUID FK routings` — odniesienie do marszruty (migration 045)
- `output_qty`, `output_uom` — ilość i jednostka wyjściowa
- `units_per_box`, `boxes_per_pallet` — dane opakowaniowe
- `effective_from`, `effective_to` — daty ważności (trigger: brak overlappingu)

**Kluczowe pola BOM Item**:
- `quantity > 0` (CHECK constraint, migration 049)
- `uom` — walidacja vs base UoM komponentu (trigger, migration 049)
- `scrap_percent` — stały % odpadów
- `operation_seq` — przypisanie do operacji routingu
- `line_ids UUID[]` — specyficzne linie (NULL = wszystkie)
- `is_by_product`, `yield_percent` — by-producty
- `condition_flags JSONB` — flagi warunkowe
- `consume_whole_lp BOOLEAN` — konsumpcja całego LP

**API**: Istniejący zestaw (patrz sekcja 4.3 technical.md) — 20+ endpointów BOM.

**Reguły biznesowe**:
- Effective dates BOM NIE mogą się nakładać dla tego samego produktu (DB trigger)
- Tylko JEDEN aktywny BOM per produkt w danym momencie
- BOM snapshot przy tworzeniu WO (ADR-002) — niezmienny
- Allergen inheritance: **multi-level kaskada** — alergeny propagują przez WSZYSTKIE poziomy BOM explosion (A ← B ← C). Przeliczenie automatyczne przy zmianie BOM items na dowolnym poziomie
- Conditional items: ewaluacja przy kalkulacji materiałów WO
- Zamienniki (alternatives): ta sama klasa UoM
- Clone kopiuje: items, routing reference, notes (FR-2.24 DONE)
- BOM item UoM powinien pasować do base UoM komponentu (warning przy mismatch)

#### Frontend/UX
- BOM list z clone action
- BOM detail: items table, cost summary panel, allergen inheritance indicator
- BOM explosion tree view (multi-level)
- BOM compare view (diff dwóch wersji)
- Timeline osi czasu wersji

#### Zależności
- E02.1 Products: komponenty/składniki to produkty
- E02.3 Routings: BOM referuje routing (routing_id)
- M06 Production: WO konsumuje BOM snapshot

---

### E02.3 — Routings & Costs (Phase 1 / MVP)

#### Backend

**Tabela `routings`** (schema final — ADR-009):

| Kolumna | Typ | Domyślnie | Opis |
|---------|-----|-----------|------|
| code | VARCHAR(50) NOT NULL | — | Unikalny identyfikator (RTG-BREAD-01) |
| name | TEXT NOT NULL | — | Nazwa opisowa |
| version | INTEGER | 1 | Auto-increment |
| is_active | BOOLEAN | true | Czy aktywny |
| is_reusable | BOOLEAN | true | Współdzielony między produktami |
| setup_cost | DECIMAL(10,2) | 0 | Koszt stały per run |
| working_cost_per_unit | DECIMAL(10,4) | 0 | Koszt zmienny per unit |
| overhead_percent | DECIMAL(5,2) | 0 | Narzut % |
| currency | TEXT | 'GBP' | Waluta kosztów (GBP potwierdzone) |

Constraints: `UNIQUE(org_id, code)`, `UNIQUE(org_id, name, version)`.

**Tabela `routing_operations`**:

| Kolumna | Typ | Domyślnie | Opis |
|---------|-----|-----------|------|
| sequence | INTEGER NOT NULL | — | Kolejność operacji |
| name | TEXT NOT NULL | — | Nazwa operacji |
| machine_id | UUID FK machines | NULL | Maszyna/work center |
| setup_time | INTEGER | 0 | Czas przygotowania (min) |
| duration | INTEGER | NULL | Czas pracy (min) |
| cleanup_time | INTEGER | 0 | Czas czyszczenia (min) |
| labor_cost_per_hour | DECIMAL(15,4) | NULL | Stawka robocza override |
| instructions | TEXT | NULL | Instrukcje operatorskie (max 2000 znaków) |

Constraint: `UNIQUE(routing_id, sequence)`.

**Costing Service** (`lib/services/costing-service.ts` — IMPLEMENTED):
- `calculateRoutingCost()` — oblicza labor + setup + cleanup + routing costs + overhead
- `calculateTotalBOMCost()` — material + routing
- `calculateUnitCost()` — total / output_qty
- `compareBOMCosts()` — porównanie dwóch BOM wersji

**API**:
```
GET    /api/technical/routings                    — List
POST   /api/technical/routings                    — Create
GET    /api/technical/routings/:id                — Detail
PUT    /api/technical/routings/:id                — Update
DELETE /api/technical/routings/:id                — Delete
GET    /api/technical/routings/:id/operations     — Operations
POST   /api/technical/routings/:id/operations     — Add operation
PUT    /api/technical/routings/:id/operations/:id — Update operation
DELETE /api/technical/routings/:id/operations/:id — Remove operation
POST   /api/technical/routings/:id/clone          — Clone (code + "-COPY")
GET    /api/technical/routings/:id/products       — BOMs using this routing
GET    /api/technical/routings/:id/cost           — Calculate routing cost
GET    /api/technical/boms/:id/cost               — BOM total cost
POST   /api/technical/boms/:id/recalculate-cost   — Force recalculation
```

**Reguły biznesowe**:
- Routing code: uppercase alfanumeryczny + hyphens, UNIQUE per org
- Reusable routing: shared across BOMs; non-reusable: 1:1 z produktem
- Labor cost hierarchy: BOM line override > routing operation default > org default (50/h)
- Koszty wersjonowane z routing version
- Clone: kopiuje operacje, koszty; code += "-COPY"
- Total operation time = setup_time + duration + cleanup_time
- **BOM Snapshot** musi zawierać pełny routing_snapshot (koszty, operacje, instructions)

#### Frontend/UX
- Routing list z code, name, is_reusable badge
- Routing form: code (uppercase auto), is_reusable checkbox, cost fields
- Operations timeline z drag-drop reorder
- Operation modal: setup_time, duration, cleanup_time, instructions, machine selector
- BOM cost summary panel (material + routing breakdown)
- Routing cost panel (breakdown per component)

#### Zależności
- M01 Settings: `machines`, `production_lines`
- E02.2 BOMs: `boms.routing_id`
- M06 Production: WO snapshot routingu

---

### E02.4 — Traceability (Phase 1 / MVP)

#### Backend

**Tabele**:
- `traceability_links` — (parent_lot_id, child_lot_id, work_order_id, quantity_consumed, unit, operation_id, consumed_at)
- `lot_genealogy` — (lot_id, ancestor_lot_id, descendant_lot_id, generation_level, path)

**API**:
```
POST   /api/technical/tracing/forward           — Where-used
POST   /api/technical/tracing/backward          — What-consumed
POST   /api/technical/tracing/recall            — Recall simulation
GET    /api/technical/tracing/recall/:id/export  — Export recall
GET    /api/technical/tracing/genealogy/:lotId   — Genealogy tree
```

**Reguły biznesowe**:
- Linki tworzone automatycznie przy consumption registration (M06 Production)
- Forward trace: lot → wszystkie produkty które go konsumowały
- Backward trace: lot ← wszystkie składniki z których powstał
- Recall simulation: lot/batch ID → wszystkie dotknięte downstream lots
- Genealogy tree: depth limit 10 poziomów
- **Wydajność: < 30 s** nawet przy 100k+ lotów (regulatory requirement)
- Materialized path w `lot_genealogy` dla szybkiego tree retrieval

#### Frontend/UX
- Traceability search (lot ID / product / date range)
- Forward/backward trace results (tree/list view)
- Genealogy tree visualization (expandable)
- Recall simulation workflow + export (CSV/PDF)

#### Zależności
- M06 Production: tworzenie linków przy konsumpcji
- M03 Warehouse: lot tracking, LP genealogy
- M08 Quality: recall → QA hold

---

### E02.5 — Shelf Life (Phase 1 / MVP partial)

#### Backend

**Tabela `product_shelf_life`** (migration 047):
- `calculated_days` — z min(ingredient shelf lives)
- `override_days` — manual override
- `final_days` — used value (override ?? calculated)
- `calculation_method` — manual / auto_min_ingredients
- `shortest_ingredient_id` — FK products
- `storage_conditions` — np. "Refrigerated 2-8C"

**API**:
```
GET    /api/technical/shelf-life/products/:id           — Dane shelf life
POST   /api/technical/shelf-life/products/:id/calculate — Oblicz z BOM
PUT    /api/technical/shelf-life/products/:id/override  — Manual override
```

**Reguły**:
- Domyślnie = min(shelf_life_days składników w BOM)
- Override dozwolony (z audit flag)
- Expiry date = production date + final_days
- Automatyczny przeliczenie przy zmianie BOM
- Wpływ na FEFO picking w Warehouse (M03)

**Nutrition** — Phase 2:
- `product_nutrition`, `ingredient_nutrition` — tabele gotowe w schema
- Kalkulacja z BOM items weighted by quantity
- Label generation (FDA format)
- Manual override z audit

---

### E02.6 — BOM Advanced (Phase 2)

#### [2.8] BOM Versioning rozszerzony — HIGH

**Backend**:
- Nowe pola na `boms`: `approval_status` (draft/pending_approval/approved/rejected), `approved_by`, `approved_at`
- Tabela `product_versions` — pełna historia wersji z approval workflow
- Workflow: Draft → Pending Approval → Approved → Active
- Tylko approved BOM może mieć status=active

**Frontend**: Approval UI (approve/reject z komentarzem), version history z approval status.

#### [2.9] Co-products — HIGH

**Backend**:
- Nowa tabela `co_products`:
  ```
  id, org_id, bom_id, product_id, output_qty, output_uom, yield_percent,
  is_primary, cost_allocation_pct, created_at
  ```
- Formula → main product (is_primary=true) + co-products (is_primary=false)
- Sum yield_percent = 100% (walidacja)
- Cost allocation: **manualne %** per co-product (user ustawia `cost_allocation_pct`; SUM = 100%)

**Frontend**: Co-products section w BOM detail, allocation editor.

#### [2.10] Variable scrap — HIGH

**Backend**: Nowe pole `bom_items.variable_scrap_pct DECIMAL(5,2)` — jeśli ustawione, **zastępuje** `scrap_percent` (nie additive). Jedno albo drugie — variable ma priorytet. Effective scrap = `variable_scrap_pct ?? scrap_percent`.

#### [2.11] Flushing principle — HIGH

**Backend**: Nowe pole `bom_items.flushing_principle TEXT DEFAULT 'BACKFLUSH'` — CHECK IN ('BACKFLUSH', 'MANUAL').
- BACKFLUSH (domyślne): automatyczna konsumpcja przy report-as-finished — preferowany tryb
- MANUAL: wymagana ręczna rejestracja konsumpcji — tylko w wyjątkowych sytuacjach

**Wpływ**: M06 Production — logika konsumpcji musi respektować flushing principle.

#### [2.12] BOM line priority — MEDIUM

**Backend**: Nowe pole `bom_items.consumption_priority INTEGER DEFAULT 0` — kolejność konsumpcji (niższy = pierwszy).

#### [2.13] BOM line valid dates — MEDIUM

**Backend**: Nowe pola `bom_items.valid_from DATE`, `bom_items.valid_to DATE` — daty ważności per linia BOM. Linie poza zakresem pomijane w WO snapshot.

#### [2.14] Formula audit trail — HIGH

**Backend**: Nowa tabela `formula_audit_log`:
```
id, org_id, bom_id, bom_version, change_type (item_added/item_removed/item_modified/
  routing_changed/status_changed), old_data JSONB, new_data JSONB,
  changed_by, changed_at, change_reason TEXT
```

**Frontend**: Timeline audit zmian BOM (kto, co, kiedy, dlaczego).

---

### E02.7 — Advanced Costing (Phase 2)

#### [2.7] Advanced purchase price tracking — MEDIUM

**Backend** (Phase 1 — field already defined on `products`): `default_purchase_price DECIMAL(15,4) NOT NULL DEFAULT 0.00` — price per 1 unit of the product's UOM. If the product UOM is `kg`, this is the price per kg; if `box`, price per box; if `unit`, price per unit. This is the single source of truth for purchase pricing — there is no separate `cost_per_kg` field. This field is OWNED by M02 Technical (see REC-M3); M10 Finance reads it for cost calculations.

**Phase 2 additions**: Historical purchase price tracking (with effective dates), multi-supplier price lists, cost scenario modeling.

#### Cost variance analysis

**Backend**:
- Tabela `cost_variances` (existing schema) — standard vs actual per WO
- Variance = actual_cost - standard_cost
- Breakdown: material/labor/overhead split

#### Historical cost tracking

**Backend**: Tabela `product_costs` (existing schema) z effective_from/to.

#### Cost scenario modeling (Future)

Wiele zestawów kosztów per routing (np. standard, optimistic, pessimistic).

---

### E02.8 — Dashboard & Analytics (Phase 1 partial)

#### Phase 1 (MVP)
- **Product stats**: Liczba produktów per type, status, item_group, % z BOM, % z routingiem
- **Allergen matrix**: Produkty × alergeny EU-14 (contains/may_contain)

#### Phase 2
- BOM version timeline visualization
- Cost trend analysis (koszt per produkt w czasie)
- Catch weight coverage stats

**API**:
```
GET /api/technical/dashboard/stats
GET /api/technical/dashboard/allergen-matrix
GET /api/technical/dashboard/version-timeline  (Phase 2)
GET /api/technical/dashboard/cost-trends       (Phase 2)
```

---

## 9. KPIs

### Funkcjonalne

| KPI | Cel | Pomiar |
|-----|-----|--------|
| % produktów z kompletnym BOM | ≥ 80% | Dashboard → products JOIN boms |
| % produktów z routingiem | ≥ 70% | Dashboard → boms WHERE routing_id IS NOT NULL |
| % routingów z kosztami | ≥ 50% | Dashboard → routings WHERE setup_cost > 0 OR working_cost > 0 |
| % routingów z unikalnym code | 100% | DB constraint |
| Poprawność alergenów (inheritance) | 100% | QA audit — brak manual override po auto-calc |
| Pokrycie trasowalności | ≥ 90% | % transakcji z lot_id |
| Kompletność danych kosztowych | ≥ 60% | % produktów z material+routing cost |
| % produktów z item_group | 100% | DB — NOT NULL po migracji |
| % CW produktów z pełnymi danymi | 100% | Walidacja: cw_unit + nominal + min + max |

### Wydajnościowe

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Product list load | < 1 s (10k produktów) | APM P95 |
| BOM explosion | < 2 s (5-level) | APM P95 |
| Traceability query | < 3 s (100k lots) / < 30 s (regulatory) | APM P95 |
| Routing cost calculation | < 500 ms | APM P95 |
| BOM cost rollup | < 2 s (multi-level) | APM P95 |
| Product search | < 1 s | APM P95 |

### Jakościowe

| KPI | Cel |
|-----|-----|
| Allergen accuracy | 100% |
| Cost variance avg | < 5% |
| BOM data errors | < 1% |
| Traceability gaps | Zero |
| Czas tworzenia BOM | < 5 min |
| Czas konfiguracji routingu | < 10 min |

---

## 10. Risks

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| **Złożoność BOM versioning + approval** | Średnie | Wysoki | Phase 2; MVP = wersje bez approval workflow |
| **Catch weight cross-cutting** | Wysokie | Wysoki | Opt-in per produkt; shared util `isCatchWeight()`; testowanie cross-module |
| **Niespójność UoM** | Średnie | Średni | Trigger walidacyjny (migration 049); warning, nie block |
| **Brak danych shelf life** | Średnie | Średni | Pole opcjonalne; warning dla perishable bez shelf_life |
| **Błędy w kalkulacji kosztów** | Niskie | Wysoki | Unit testy costing-service.ts; compareBOMCosts() |
| **BOM explosion performance** | Niskie | Średni | Recursive CTE z depth limit 10; cache 5 min |
| **Trasowalność > 30 s** | Niskie | Wysoki | Indeksy; materialized path; monitoring APM |
| **Co-products yield math** | Średnie | Średni | Phase 2; walidacja sum yield = 100% |
| **Item group brak danych** | Średnie | Niski | Migration z DEFAULT; UI wymuszenie przy edycji |
| **Flushing principle + Production** | Średnie | Średni | Phase 2; wymaga koordynacji z M06 |
| **Formula audit trail volume** | Niskie | Niski | Retencja per tabela; archiwizacja po 2 latach |

### Tech Debt (z Technical)
- BOM explosion degrades > 5 levels → optymalizacja CTE
- Nutrition calc nie obsługuje unit conversions → Phase 2
- Cost variance brak granular breakdown → Phase 2
- Traceability tree UI: brak zoom/pan → Phase 2 UX

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] Product CRUD z nowymi polami (weight, CW, shelf life, yield, supplier, tolerances, item_group)
- [ ] BOM CRUD z date validity, items, alternatives, conditionals, by-products, packaging
- [ ] BOM explosion (multi-level, 5+ levels) działa < 2 s
- [ ] BOM clone/compare działają
- [ ] BOM cost rollup (material + routing) z poprawnym wynikiem
- [ ] BOM snapshot na WO — niezmienny, z routing costs
- [ ] Allergen inheritance auto-calculation — 100% poprawne
- [ ] Routing CRUD z code, is_reusable, cost fields
- [ ] Routing cost calculation per ADR-009
- [ ] Traceability forward/backward < 30 s (100k lots)
- [ ] Recall simulation — zwraca wszystkie affected lots
- [ ] Shelf life calculation z BOM + override
- [ ] Product dashboard + allergen matrix
- [ ] Catch weight fields na produkcie (walidacja, conditional fields)

### Niefunkcjonalne
- [ ] RLS na wszystkich tabelach Technical — test izolacji org_id
- [ ] Audit trail — immutable version history per product
- [ ] 80%+ test coverage (unit + integration)
- [ ] API P95 < 500 ms (wszystkie endpointy)
- [ ] 50k products per org — brak degradacji

### Regulacyjne
- [ ] Alergeny EU-14 — deklaracja i inheritance
- [ ] Lot tracking 100% (brak transakcji bez lot_id)
- [ ] Trasowalność end-to-end < 30 s
- [ ] Audit trail: old_data/new_data/user/timestamp

---

## 12. References

### Dokumenty źródłowe
- Foundation PRD: `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Technical PRD (v2.4): `new-doc/02-technical/prd/technical.md`
- Technical Architecture: `new-doc/02-technical/decisions/technical-arch.md`
- PRD Update List: `new-doc/_meta/PRD-UPDATE-LIST.md` (pozycje 2.1–2.15)
- Design Guidelines: `new-doc/_meta/DESIGN-GUIDELINES.md`
- D365 Analysis: `new-doc/_meta/D365-ANALYSIS.md`

### ADR (istotne dla Technical)
- **ADR-002**: BOM Snapshot Pattern → `new-doc/02-technical/decisions/ADR-002-bom-snapshot-pattern.md`
- **ADR-009**: Routing-Level Costs → `new-doc/02-technical/decisions/ADR-009-routing-level-costs.md`
- **ADR-010**: Product-Level Procurement → `new-doc/02-technical/decisions/ADR-010-product-level-procurement-fields.md`
- ADR-001: License Plate Inventory
- ADR-003: Multi-Tenancy RLS
- ADR-004: GS1 Compliance
- ADR-008: Audit Trail Strategy
- ADR-013: RLS org Isolation Pattern

### Implementacja (istniejąca)
- Costing Service: `apps/frontend/lib/services/costing-service.ts`
- BOM Cost API: `apps/frontend/app/api/technical/boms/[id]/cost/route.ts`
- Migrations: 043–049 (routing costs, routing fields, BOM routing FK, product shelf life, cost validation, UoM validation)

### UX Wireframes
- TEC-005: BOM List (clone action)
- TEC-006: BOM Modal (cost summary)
- TEC-008: Routing Modal (code, is_reusable, costs)
- TEC-010: Operation Modal (cleanup_time, instructions)

### Przeniesione
- **FR-2.49** (Operation quality checkpoints) → M08 Quality Module

---

## Wyjaśnione decyzje (z Q&A 2026-02-16)

| # | Pytanie | Decyzja |
|---|---------|---------|
| Q1 | shelf_life_days vs best_before_days | To osobne koncepty: shelf_life = dni od produkcji, best_before = data ważności. Brak hard constraint między nimi |
| Q2 | Catch weight min/max enforcement | **WARN** (ostrzeżenie), NIE block |
| Q3 | preferred_supplier_id FK | FK do `suppliers(id)`. Produkt bez dostawcy dozwolony (NULL) |
| Q4 | item_group — custom grupy | Tak, custom grupy dozwolone → tabela `item_groups`. Seeded: RawMeat, Packaging, Consumables, FinGoods, **WIP** |
| Q5 | Co-products cost allocation | **Manualne %** (user ustawia cost_allocation_pct per co-product) |
| Q6 | Waluta domyślna | **GBP** (potwierdzone, nie PLN) |
| Q7 | Flushing principle default | **BACKFLUSH** (automatyczny proces; MANUAL tylko wyjątkowo) |
| Q8 | shelf_advice_days znaczenie | Minimalny shelf life wymagany przez klienta przy dostawie (customer requirement, np. Tesco) |
| Q9 | Allergen inheritance depth | **Multi-level kaskada** — przez wszystkie poziomy BOM explosion |
| Q10 | gross_weight obliczanie | **Auto-computed** (net + tare). Pole gross_weight read-only |
| Q11 | variable_scrap_pct vs scrap_percent | **Variable zastępuje fixed** (nie additive). Effective = variable ?? fixed |

---

_PRD 02-Technical v3.2 — 8 epików, 15 zadań z PRD-UPDATE-LIST, 3 ADR, 11 wyjaśnionych decyzji. Zgodny z Foundation PRD v2.0._
_Data: 2026-02-18_
