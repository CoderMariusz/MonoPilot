---
id: 004
title: Purchase Orders — Quick Entry (code+qty) + auto-split by supplier
module: PLAN
priority: P0
owner: @mariusz
status: draft
created: 2025-11-08
updated: 2025-11-08
tags: [auto, rls-on, next15, supabase, filament-style, PO, quick-entry]
---

## Brief
Wprowadzamy „Quick PO Entry”: jeden modal z prostą tabelą wejściową (kolumny: product_code, qty), bez ręcznego wybierania dostawców ani walut. Po wpisaniu kodu produkt automatycznie wyświetla nazwę (read-only) z products. Po zatwierdzeniu system grupuje pozycje po supplier_id (z products) i tworzy oddzielne zamówienia PO — jedno PO per supplier. Każde PO uzupełnia pola nagłówka/linii z products (waluta, ceny, VAT, jednostka) oraz wylicza sumy; użytkownik dostaje linki do utworzonych PO. UI ma być szybkie, minimalne i jednoznaczne.
sprawdz sprawdz tez plik general_rules.md

## Constraints
- RLS ON (odczyt/zapis wg ról; brak wycieków między firmami/tenantami).
- W modalu użytkownik podaje **tylko**: product_code, qty (liczba dodatnia). Reszta **auto** z `products`.
- Jedno PO = jeden supplier. Jeśli wśród pozycji tego samego supplier występują różne waluty → **zablokuj** z jasnym komunikatem (w tej iteracji **bez** miksu walut w jednym PO).
- Totals (net/VAT/gross) liczone po stronie serwera (źródło prawdy). UI wyświetla wynik.
- Status na starcie: `draft`; brak integracji z fakturą/platnościami w tym planie.

## Notes
- Modal: „Quick PO Entry” (Filament-style). Tabela wejściowa:  
  - **Editable**: `product_code`, `qty`  
  - **Auto (read-only)** po wpisaniu kodu: `product_name`, opcjonalnie `unit` i `supplier_name` (dla potwierdzenia)  
- Walidacje w locie: nieistniejący `product_code`, produkt nieaktywny, brak `supplier_id` lub `currency` w products → oznacz wiersz i blokuj submit.
- Po „Zatwierdź”: backend pobiera produkty, **grupuje po supplier_id**, zakłada PO per supplier, tworzy linie (qty, unit_price, vat, currency, unit), liczy totals, zapisuje.
- Po sukcesie: lista utworzonych PO (np. „PO-1023 (2 lines), PO-1024 (1), PO-1025 (1)”) z linkami.
- Edge cases: duplikaty kodów w wejściu → agreguj qty w ramach tego samego supplier; `qty = 0` lub ujemne → blokada; brak uprawnień do produktu → blokada.
- Dokumentacja i testy: zaktualizować sekcje PO w `API_REFERENCE.md`, `DATABASE_SCHEMA.md`, `PLANNING_MODULE_GUIDE.md`; utworzyć/rozszerzyć `purchaseOrders.test.ts` dla logiki splitu i walut.

--- poniższe sekcje uzupełnia Cursor (AUTO) ---

## Impact Analysis
## File Plan
## DB & RLS
## Contracts
## Algorithm / Flow
## Tests First
## DoD
## Risks & Notes
## Links
