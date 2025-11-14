# Production Module Documentation

## 1. Cel i zakres modułu

Moduł Produkcji odpowiada za realizację zleceń produkcyjnych (WO), egzekwowanie sekwencji operacji, rejestrację zużyć i wydań, raportowanie wydajności (yield) oraz spójność traceability.

**W tym dokumencie:**

- Model danych (WO, operacje, materiały, wyniki, LP)
- Reguły biznesowe (kolejność operacji, 1:1, rezerwacje, cross‑WO)
- Interfejsy i komponenty UI
- Luki/niespójności i zalecenia

## 2. Model danych (DB)

### 2.1 `work_orders`

**Kluczowe pola:** `wo_number`, `product_id`, `bom_id`, `quantity`, `uom`, `priority`, `status`, `scheduled_start/end`, `actual_start/end`, `line_id`, `machine_id`, `source_demand_type/id`, `created_by`, `approved_by`.
**Uwagi:** WO jest źródłem prawdy dla kontekstu produkcji; snapshot BOM powstaje przy utworzeniu WO.

### 2.2 `wo_operations`

**Kluczowe pola:** `wo_id`, `sequence_number`, `operation_name`, `machine_id`, `status`, `started_at`, `finished_at`, `expected_yield_pct`.
**Uwagi:** Wymuszona kolejność; możliwość definicji słownika operacji w Settings.

### 2.3 `wo_materials`

**Kluczowe pola:** `wo_id`, `material_id`, `qty_planned`, `qty_required`, `uom`, `scrap_pct`, `one_to_one_flag`.
**Uwagi:** Snapshot z BOM w momencie utworzenia WO; brak konwersji jednostek po starcie.

### 2.4 `production_outputs`

**Kluczowe pola:** `wo_id`, `product_id`, `quantity`, `uom`, `operation_seq`, `qa_status`, `created_at`.
**Uwagi:** Służy do liczenia KPI (Made, Progress %, Yield).

### 2.5 Trace & LP

- `license_plates` – nośnik partii i jednostek logistycznych
- `lp_reservations` – rezerwacje LP per WO/operacja
- `lp_compositions`, `lp_genealogy` – skład/pochodzenie (forward/backward trace)

## 3. Reguły biznesowe

### 3.1 Sekwencja operacji (routing)

- Operacje muszą postępować zgodnie z `sequence_number`
- Blokada startu operacji N+1, jeśli N nie zakończona

### 3.2 Zasada „1:1” (consume_whole_lp)

- Jeśli pozycja ma flagę 1:1, LP musi zostać zużyta w całości (brak częściowego rozchodu)
- Skaner egzekwuje spójność UoM oraz 1:1 podczas zapisu zużyć

### 3.3 Rezerwacje i bezpieczeństwo

- Rezerwacje LP tworzone przy „Stage/Assign”
- Operacje zużycia i produkcji transakcyjne (brak podwójnego zużycia)

### 3.4 Cross‑WO PR validation

- Surowce PR nie mogą być konsumowane przez WO z innego produktu/serii, jeśli reguła jest włączona (konfig)

### 3.5 Snapshot BOM

- Tworzy się przy `create WO` i jest niezmienny dla danego WO
- Zawiera: material_id, qty, scrap%, 1:1, UoM, allergens, product_version, bom_version, line_id

## 4. UI – główne komponenty

### 4.1 WorkOrdersTable

- Kolumny: `wo_number`, produkt, ilość+UoM, status, linia, priorytet, daty planowane/realne, Made, Progress, Shortages
- Akcje: Create, Edit (zakres ograniczony), Cancel, Release

### 4.2 WorkOrderDetailsModal

- Szczegóły: snapshot BOM, operacje, KPI, historia zmian

### 4.3 StageBoard / OperationsTab

- Przydział zadań i monitorowanie statusów operacji

### 4.4 YieldReportTab / ConsumeReportTab / TraceTab

- Tabele z KPI i ścieżkami trace; na razie minimalne (brak wykresów)

## 5. Luki i niespójności (⚠️)

- ⚠️ Brak Production Dashboard (KPI, realtime)
- ⚠️ Brak wizualizacji yield i trendów (same tabele)
- ⚠️ Niespójności nazw typów (np. `PR` vs `WIP`) – do ujednolicenia w types/validation
- ⚠️ Niezaimplementowane akcje wersjonowania BOM w UI (przyciski placeholder)
- ⚠️ Braki testów E2E i integracyjnych (flow WO → outputs → yield)

## 6. Zalecenia (P0)

- Dodać kolumny i metryki Made/Progress do WorkOrdersTable
- Wdrożyć Production Dashboard (KPI, realtime, alerty)
- Ujednolicić typy produktu (`PR`/`WIP`) i walidacje schematów
- Zaimplementować w pełni wersjonowanie BOM po stronie UI/API
- Rozszerzyć TraceTab o pełną siatkę genealogii (LP, batch, depth, op_seq)

## 7. Integracje i zależności

- **Technical**: BOM, routings, allergens (snapshot)
- **Planning**: WO tworzone z planu; statusy powiązane z dostępnością materiałów
- **Warehouse & Scanner**: rezerwacje LP, skanowania, split/merge LP, moves
- **Settings**: machines, locations, routings dictionary

## 8. Testy i akceptacja – checklisty

- [ ] WO → snapshot BOM poprawny (UoM, 1:1, line_id)
- [ ] Sekwencja operacji egzekwowana (blokady)
- [ ] Made/Progress liczone z `production_outputs`
- [ ] Skaner blokuje LP w złym UoM lub naruszenie 1:1
- [ ] Trace forward/backward pokazuje kompletne relacje

## 9. Otwarte punkty do doprecyzowania

- Zakres cross‑WO ograniczeń (konfigurowalność per produkt/operacja)
- Model wyjątków (override QA / manual consume) i audyt
- Zakres realtime (subskrypcje, wskaźniki SLA)
