# Checklist Niezgodności i Poprawek

Ten dokument służy do śledzenia niezgodności między kodem, bazą danych, dokumentacją i rzeczywistym flow biznesowym.

**Ostatnia aktualizacja**: 2025-01-11  
**Projekt**: MonoPilot ERP System

---

## 📋 Status

- ✅ **Zakończone**: Poprawka została zaimplementowana
- 🔄 **W trakcie**: Poprawka jest w trakcie realizacji
- ⚠️ **Znane**: Problem zidentyfikowany, oczekuje na poprawkę
- 🔍 **Do weryfikacji**: Wymaga sprawdzenia

---

## 🗂️ Kategorie Niezgodności

### 1. Schema vs Migracje
### 2. Kod Frontend vs Schema
### 3. Kod Backend vs Schema
### 4. Dokumentacja vs Implementacja
### 5. Business Logic vs Flow
### 6. API vs Types
### 7. RLS Policies vs Security Requirements

---

## ✅ Naprawione Niezgodności

### [2025-01-11] Transfer Orders - Lokacje vs Magazyny

**Kategoria**: Business Logic vs Flow, Schema vs Migracje

**Problem**:
- Tabela `to_line` miała pola `from_location_id` i `to_location_id`
- TO było traktowane jako transfer między lokacjami
- Rzeczywisty flow: TO = transport między magazynami, nie lokacjami

**Symptomy**:
- Nieprawidłowa struktura danych w `to_line`
- Brak możliwości obsługi stanu "transit"
- Brak default locations dla receiving

**Poprawka**:
1. Usunięto z `to_line`: `from_location_id`, `to_location_id`, `scan_required`, `approved_line`, `qty_moved`
2. Dodano do `to_line`: `qty_shipped`, `qty_received`, `notes`
3. Utworzono nową tabelę `warehouse_settings` z polami:
   - `default_to_receive_location_id`
   - `default_po_receive_location_id`
   - `default_transit_location_id`
4. Zaktualizowano dokumentację (12, 13)

**Migracje**:
- `020_to_line.sql` - zmieniona struktura
- `043_warehouse_settings.sql` - nowa tabela

**Pliki kodu do aktualizacji**:
- [x] `apps/frontend/lib/api/transferOrders.ts` - API calls (NAPRAWIONE 2025-01-11)
  - Usunięto from_location_id, to_location_id z queries
  - Zmieniono qty_moved na qty_shipped/qty_received
  - Usunięto scan_required, approved_line
  - Zunifikowano queries w getAll() i getById()
- [ ] `apps/frontend/lib/types.ts` - interface TransferOrderItem
- [ ] `apps/frontend/components/TransferOrdersTable.tsx` - wyświetlanie
- [ ] `apps/frontend/components/EditTransferOrderModal.tsx` - edycja
- [ ] `apps/frontend/components/CreateTransferOrderModal.tsx` - tworzenie
- [ ] `apps/frontend/components/TransferOrderDetailsModal.tsx` - szczegóły

**Status**: ✅ Schema naprawione, 🔄 API naprawione, 🔄 Komponenty frontend wymagają aktualizacji

---

## ⚠️ Znane Niezgodności

### [Priorytet: Wysoki] TransferOrders API - Niezgodne queries (NAPRAWIONE)

**Kategoria**: API vs Types, Kod Frontend vs Schema

**Problem**:
W `transferOrders.ts` metody `getAll()` i `getById()` miały różne queries:
- `getAll()` - pobierała location relationships z warehouse (niepotrzebne dla TO)
- `getById()` - też pobierała location relationships
- Obie używały przestarzałych pól: `from_location_id`, `to_location_id`, `qty_moved`, `scan_required`, `approved_line`

**Symptomy**:
- Niezgodność między `getAll()` i `getById()` queries
- Używanie przestarzałych pól z przed reorganizacji (TO = magazyn→magazyn, nie lokacja→lokacja)
- Potencjalne błędy przy tworzeniu/edycji TO

**Poprawka**:
1. Usunięto location queries z `getAll()`, `getById()`, `create()`, `update()`
2. Zmieniono `qty_moved` → `qty_shipped` + `qty_received` we wszystkich mappingach
3. Usunięto `from_location_id`, `to_location_id`, `scan_required`, `approved_line` z line records
4. Dodano pole `notes` do line records
5. Zunifikowano wszystkie queries do tej samej struktury

**Pliki**:
- `apps/frontend/lib/api/transferOrders.ts` - wszystkie metody

**Status**: ✅ Naprawione 2025-01-11

---

### [Priorytet: Wysoki] Frontend Types vs Database Schema

**Kategoria**: API vs Types

**Problem**:
Po reorganizacji migracji i poprawce TO, interfejsy TypeScript w `apps/frontend/lib/types.ts` mogą nie odpowiadać aktualnej strukturze bazy danych.

**Do sprawdzenia**:
- [ ] Interface `TransferOrder` - czy zawiera `actual_ship_date`, `actual_receive_date`?
- [ ] Interface `TransferOrderItem` - czy ma `qty_shipped`, `qty_received` zamiast `qty_moved`?
- [ ] Interface `PurchaseOrder` - czy ma wszystkie pola z `po_header`?
- [ ] Interface `PurchaseOrderItem` - czy ma wszystkie pola z `po_line`?
- [ ] Interface `WorkOrder` - czy ma `line_id` (production_lines)?
- [ ] Interface `LicensePlate` - czy ma `lp_type`, `stage_suffix`?

**Jak sprawdzić**:
```bash
# Porównaj typy z migracjami
grep "CREATE TABLE" apps/frontend/lib/supabase/migrations/*.sql
code apps/frontend/lib/types.ts
```

**Status**: 🔍 Do weryfikacji

---

### [Priorytet: Średni] RPC Functions - Brak niektórych funkcji

**Kategoria**: Kod Backend vs Schema

**Problem**:
Migracja `039_rpc_functions.sql` zawiera tylko 4 funkcje podstawowe. Mogą brakować inne funkcje RPC używane w kodzie.

**Brakujące funkcje** (do sprawdzenia):
- [ ] `cancel_work_order` - czy jest używana w kodzie?
- [ ] `reserve_lp_for_wo` - rezerwacja LP dla WO
- [ ] `consume_lp_for_wo` - konsumpcja LP w produkcji
- [ ] `complete_wo_operation` - zamknięcie operacji
- [ ] `create_pallet` - tworzenie palety
- [ ] Inne funkcje z `052_enhanced_rpc_functions.sql` (stara migracja)

**Jak sprawdzić**:
```bash
# Znajdź wywołania RPC w kodzie
grep -r "\.rpc(" apps/frontend --include="*.ts" --include="*.tsx"
```

**Status**: 🔍 Do weryfikacji

---

### [Priorytet: Niski] Seed Data - Niekompletne dane testowe

**Kategoria**: Dokumentacja vs Implementacja

**Problem**:
`042_seed_data.sql` zawiera minimalne dane testowe. Dla pełnego testowania może brakować:
- Przykładowych produktów (tylko suppliers, bez products)
- Przykładowych BOM-ów
- Przykładowych routingów
- Przykładowych WO

**Do dodania**:
- [ ] 5-10 przykładowych produktów (RM, PR, FG)
- [ ] 2-3 przykładowe BOM-y
- [ ] 1-2 przykładowe routingi
- [ ] Przykładowe dane dla każdego modułu

**Status**: ⚠️ Znane

---

## 🔍 Do Weryfikacji

### Frontend API Calls - Zgodność z RPC

**Pytania**:
1. Czy wszystkie wywołania API w `apps/frontend/lib/api/*.ts` używają poprawnych nazw pól?
2. Czy queries w Supabase używają poprawnych relacji (foreign keys)?
3. Czy select queries zawierają wszystkie potrzebne pola?

**Pliki do sprawdzenia**:
- [ ] `apps/frontend/lib/api/transferOrders.ts`
- [ ] `apps/frontend/lib/api/purchaseOrders.ts`
- [ ] `apps/frontend/lib/api/workOrders.ts`
- [ ] `apps/frontend/lib/api/products.ts`
- [ ] `apps/frontend/lib/api/boms.ts`

---

### Components - Mapowanie danych

**Pytania**:
1. Czy komponenty poprawnie mapują dane z API?
2. Czy formularze wysyłają dane w poprawnym formacie?
3. Czy wyświetlanie danych używa poprawnych nazw pól?

**Komponenty do sprawdzenia**:
- [ ] `CreateTransferOrderModal.tsx`
- [ ] `EditTransferOrderModal.tsx`
- [ ] `TransferOrderDetailsModal.tsx`
- [ ] `CreatePurchaseOrderModal.tsx`
- [ ] `EditPurchaseOrderModal.tsx`
- [ ] `QuickPOEntryModal.tsx`

---

## 📝 Template dla Nowej Niezgodności

```markdown
### [Data] Tytuł Niezgodności

**Kategoria**: [Kategoria]

**Problem**:
[Szczegółowy opis problemu]

**Symptomy**:
- [Symptom 1]
- [Symptom 2]

**Poprawka**:
1. [Krok 1]
2. [Krok 2]

**Migracje**: [Lista migracji]

**Pliki kodu**: [Lista plików]

**Status**: [Status]
```

---

## 🔧 Procedura Naprawy

1. **Identyfikacja**:
   - Zapisz problem w sekcji "Znane Niezgodności"
   - Określ kategorię i priorytet
   - Przypisz status 🔍 lub ⚠️

2. **Analiza**:
   - Zidentyfikuj wszystkie miejsca wymagające zmiany
   - Sprawdź zależności (migracje, kod, dokumentacja)
   - Określ kolejność zmian

3. **Implementacja**:
   - Zmień status na 🔄
   - Wprowadź zmiany według planu
   - Przetestuj zmiany

4. **Weryfikacja**:
   - Sprawdź wszystkie checklisty
   - Zaktualizuj dokumentację
   - Zmień status na ✅

5. **Dokumentacja**:
   - Przenieś do sekcji "Naprawione Niezgodności"
   - Dodaj informacje o plikach i migracjach
   - Zaktualizuj datę

---

## 📊 Statystyki

- **Naprawione**: 1
- **W trakcie**: 0
- **Znane**: 2
- **Do weryfikacji**: 2

**Ostatnia aktualizacja statystyk**: 2025-01-11

---

## 🎯 Następne Kroki

1. Sprawdzić zgodność TypeScript types z schema (Priorytet: Wysoki)
2. Zweryfikować wszystkie RPC functions w kodzie (Priorytet: Średni)
3. Zaktualizować komponenty TO zgodnie z nowym flow (Priorytet: Wysoki)
4. Rozszerzyć seed data dla lepszego testowania (Priorytet: Niski)

---

**Utrzymanie**: Ten dokument powinien być aktualizowany przy każdej zmianie w:
- Schema bazy danych
- Migracjach
- API endpoints
- Business logic
- Dokumentacji technicznej

