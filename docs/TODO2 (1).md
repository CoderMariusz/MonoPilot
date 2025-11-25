MonoPilot MES - Implementation Status & TODO

📅 Last Updated: 2025-01-XX
🎯 Purpose: Complete checklist of what's been implemented and what's pending
📊 Progress: Based on code audit and documentation review
🔒 Type Safety: 100% deployment failures were TypeScript errors (see DEPLOYMENT_ERRORS_ANALYSIS.md)

Legend

✅ [x] - Completed and verified

🔄 [~] - In progress / partially done

⬜ [ ] - Not started / to be done

🟢 P0 - Critical for MVP

🟡 P1 - Post-MVP / PRO version

⚪ P2 - Future enhancements

Table of Contents

Foundation & Architecture

Technical Module - BOM Management

Planning Module - Orders

Production Module - Work Orders

Warehouse Module - Inventory

Scanner Module - Mobile Operations

Quality & Traceability

Exports & Reporting

Testing & Quality Assurance

Documentation & Deployment

Future Enhancements

Summary Statistics

Next Steps (Priority Order)


## 1.0 Foundation & Architecture

### 1.1 Database Schema

  - ⬜ 1.1.1 Core tables (products, boms, bom_items)

  - ⬜ 1.1.2 Planning tables (work_orders, purchase_orders, transfer_orders)

  - ⬜ 1.1.3 Warehouse tables (grns, license_plates, stock_moves, locations)

  - ⬜ 1.1.4 Production tables (wo_operations, wo_materials, production_outputs)

  - ⬜ 1.1.5 Traceability tables (lp_reservations, lp_compositions, lp_genealogy) only table

  - ⬜ 1.1.6 Master data (suppliers, warehouses, machines, routings) ???

  - ⬜ 1.1.7 Settings & configuration (location, machines, allergens, warehouses, tax_codes, routing settings)

**Status: ✅ Core schema complete (migrations 001-009)**

### 1.1 Database Schema — doprecyzowania P0 (NOWE)

  - ⬜ 1.1.6 Master data (suppliers, warehouses, machines, routings) — schema audit & align 🟢 P0 — 0.5 dnia
  Potwierdź FK, unikalności, indeksy; ujednolić nazwy kolumn z API.

  - ⬜ 1.1.7 Settings & configuration — zakres finalny 🟢 P0 — 0.25 dnia
  Settings obejmuje: locations, machines, allergens, warehouses, tax_codes, routing settings (potwierdzenie i opis w docs).

### 1.2 API Layer

  - ⬜ 1.2.1 Dual-mode pattern (mock vs Supabase) - not exsist any more to remove

  - ⬜ 1.2.2 ProductsAPI (CRUD operations)

  - ⬜ 1.2.3 WorkOrdersAPI (with filters and stage status)

  - ⬜ 1.2.4 PurchaseOrdersAPI (with cancel method)

  - ⬜ 1.2.5 TransferOrdersAPI (with cancel method)

  - ⬜ 1.2.6 SuppliersAPI (CRUD operations)

  - ⬜ 1.2.7 WarehousesAPI (CRUD operations)

  - ⬜ 1.2.8 LicensePlatesAPI (with composition tracking)

  - ⬜ 1.2.9 YieldAPI (PR/FG yield calculations)

  - ⬜ 1.2.10 ConsumeAPI (consumption tracking)

  - ⬜ 1.2.11 TraceabilityAPI (forward/backward trace)

  - ⬜ 1.2.12 RoutingsAPI (routing management)

  - ⬜ 1.2.13 AllergensAPI (allergen management)

  - ⬜ 1.2.14 TaxCodesAPI (tax code management)

  - ⬜ 1.2.15 LocationsAPI (location management)

  - ⬜ 1.2.16 MachinesAPI (machine management)

**Status: ✅ Core APIs complete**

### 1.3 RPC Functions & Business Logic (zastępuje poprzednie, pełna logika)

  - ⬜ 1.3.1 cancel_work_order(wo_id, user_id, reason, source) 🟢 P0 — 0.75 dnia
  Reguły: WO !∈ {completed,cancelled}; brak production_outputs; zamyka wo_operations; zwalnia lp_reservations; transakcja + advisory lock; idempotencja.
Output: { success, note? }

  - ⬜ 1.3.2 cancel_purchase_order(po_id, user_id, reason, source) 🟢 P0 — 0.5 dnia
  Reguły: PO !∈ {received,closed,cancelled}; brak GRN powiązanych; transakcja + lock; idempotencja.

  - ⬜ 1.3.3 cancel_transfer_order(to_id, user_id, reason, source) 🟢 P0 — 0.5 dnia
  Reguły: TO ∈ {draft,submitted}; actual_ship_date IS NULL; brak stock_moves wysyłkowych; transakcja + lock; idempotencja.

  - ⬜ 1.3.4 get_material_std_cost(product_id, as_of_date?, currency?) 🟢 P0 — 0.25 dnia
  Źródło: products.unit_price (MVP: 1 produkt = 1 cena); opcjonalnie przelicz wg Settings currency/exchange_rate.

  - ⬜ 1.3.5 set_po_buyer_snapshot(po_id, buyer_id, buyer_name, snapshot_ts?) 🟢 P0 — 0.25 dnia
  Snapshot danych kupca do kolumn PO; wołane przy create/update; audyt kompatybilny.

  - ⬜ 1.3.6 Multi-tenant RLS smoke-test (CI) 🟢 P0 — 0.75 dnia
  Skrypt SQL: 2 orgi, 2 userów; insert danych; verify SELECT/UPDATE blokowane cross-tenant; run w CI po migracjach.

Szacowany łączny czas sekcji 1.3: 3,0 dnia

**Status: 🔄 Core RPC functions done, RLS testing pending**

### 1.4 Authentication & Security

  - ⬜ 1.4.1 Basic RLS policies (read/write)

  - ⬜ 1.4.2 Supabase Auth integration

  - ⬜ 1.4.3 User sessions management

  - ⬜ 1.4.4 Role-based access control (RBAC) 🟡 P1

  - ⬜ 1.4.5 Multi-tenant data isolation testing 🟢 P0

  - ⬜ 1.4.6 Multi-tenant foundation (basic implementation) ✅ Completed
  Podstawy rozdzielenia na różne organizacje zostały zaimplementowane. System obsługuje podstawową infrastrukturę multi-tenant.

**Status: 🔄 Basic auth done, multi-tenant foundation implemented, RBAC and org management pending**

### 1.4 Multi-tenant & Organization Management — P0 doprecyzowania (NOWE)

  - ⬜ 1.4.6.1 Organization Settings page 🟢 P0 — 2.0 dnia
  Strona /settings/organization z pełnym zarządzaniem organizacją:

  - Wyświetlanie informacji o organizacji (nazwa, status, data utworzenia)
  - Edycja podstawowych danych organizacji
  - Lista członków organizacji
  - Zarządzanie użytkownikami (dodawanie, usuwanie, przypisywanie ról)

  - ⬜ 1.4.6.2 User management in organization 🟢 P0 — 1.5 dnia

  - Dodawanie użytkowników do organizacji (przez email/invite)
  - Przypisywanie ról per użytkownik per organizacja
  - Usuwanie/deaktywacja użytkowników
  - Zarządzanie uprawnieniami na poziomie organizacji

  - ⬜ 1.4.6.3 Role-based access control (RBAC) per organization 🟢 P0 — 2.0 dnia

  - System ról: Admin, Manager, Operator, Viewer
  - Definicja uprawnień per rola per moduł
  - UI do zarządzania rolami w organizacji
  - Enforce uprawnień w API i RLS policies

  - ⬜ 1.4.6.4 Complete org_id migration across all tables 🟢 P0 — 3.0 dnia
  AUDYT: Każda tabela musi mieć org_id dla kompletnego oddzielenia między organizacjami:

  - Migracja: dodanie org_id NOT NULL do wszystkich tabel biznesowych
  - Update wszystkich INSERT/UPDATE queries aby automatycznie używały org_id z sesji
  - Weryfikacja RLS policies: wszystkie SELECT/UPDATE/DELETE filtrują po org_id
  - Testy: weryfikacja że dane z jednej organizacji nie są widoczne dla drugiej

Szacowany łączny czas sekcji 1.4.6: 8.5 dnia

**Status: ✅ Podstawy multi-tenant zaimplementowane, pełne zarządzanie organizacją pending**

## 2.0 Technical Module - BOM Management

### 2.1 Product Catalog

  - ⬜ 2.1.1 Product taxonomy (MEAT/DRYGOODS/COMPOSITE) done
  - ⬜ 2.1.2 Product groups and types done
  - ⬜ 2.1.3 Allergen tagging (many-to-many) done
  - ⬜ 2.1.4 Tax codes integration dziedziczony po supplayer done
  - ⬜ 2.1.5 Supplier products (per-supplier pricing) done
  - ⬜ 2.1.6 Product archiving (is_active flag) zostawionaa dla single usunieta dla composite

**Status: ✅ Complete**

Nowe akcje / walidacje (P0):

Product → dziedziczy po Supplier/Currency (MVP 1:1): produkt ma supplier_id; waluta/ceny brane z Supplier;

Allergen chips: oznacz „inherited” (z BOM) jako szare, „direct” jako kolor — tylko wizualizacja.

Jednostki miary: products.uom tylko informacyjne, BOM jest źródłem prawdy (patrz sekcja 2.2). (METER, EACH, KG, LITER)

Audit (P1): log zmian (create/update/archive) z polem „reason”. not done.

### 2.2 BOM Management

  - ⬜ 2.2.1 BOM structure (product_id, version, status) done
  - ⬜ 2.2.2 BOM items (materials, quantities, scrap %) brakuje niktorych pol jak scrap? Single produck tez powinien miec widoczna wersje. logika zmian powinna jak w composit minor, major powinno byc po przekroczeniu .9. 
  - ⬜ 2.2.3 BOM versioning (X.Y format, auto-bump) done
  - ⬜ 2.2.4 BOM lifecycle (draft → active → archived) done
  - ⬜ 2.2.5 Single active BOM per product (unique constraint) done?
  - ⬜ 2.2.7 BOM snapshot on WO creation (trigger) done? 
  - ⬜ 2.2.8 Allergen inheritance from componentssporaw done?
  - ⬜ 2.2.9 Circular BOM reference detection 🟡 P1
  - ⬜ 2.2.10 BOM depth limit validation 🟡 P1
  - ⬜ 2.2.11 Product version 🟢 P0 nor done
  - ⬜ 2.2.12 BOM version con be only edit in draft status, active all field noactive 🟢 P0 nor done
  - ⬜ 2.2.12 BOM version check logic (small/big change) big change is only change item, rest any field will be small change 🟢 P0 nor done

**Status: ✅ Core BOM system complete, advanced validation pending**

### 2.2 BOM — P0 doprecyzowania (NOWE)

  - ⬜ 2.2.11 Product version (wersjonowanie produktu) — minimal 🟢 P0 — 1.0 dnia

Pole product_version (X.Y).

Minor bump: zmiany meta-pól produktu/BOM (nie itemów).

Major bump: ręcznie z UI (przycisk).

  - ⬜ 2.2.12 BOM editable tylko w draft; active read-only 🟢 P0 — 0.75 dnia

active → pola zablokowane; dostępne akcje: Clone as Draft, Archive.

Próba edycji aktywnego → BUSINESS_RULE_ERROR.

  - ⬜ 2.2.13 BOM version change logic (small vs big) 🟢 P0 — 0.75 dnia

Big change = tylko zmiana material_id.

Small change = zmiany qty, scrap% lub meta.

Auto-detekcja: zmiana material_id → wymuś Big (major bump + nowy draft).

Zmiana qty/scrap → minor (small) w tym samym draft.

2.2.WO Snapshot & Line

2.2.S1 WO-Snapshot pinning — „wersja użyta do WO jest niezmienna” 🟢 P0 — 0.75 dnia

Przy tworzeniu WO: snapshot BOM vX.Y + product_version; WO zawsze korzysta z tej wersji, nawet jeśli BOM zmieni się później.

WO released lub in_progress nie reaguje na zmiany BOM.

AC: zmiana aktywnego BOM po release WO nie zmienia kalkulacji materiałów ani trace.

2.2.S2 „Production line” w BOM i WO 🟢 P0 — 1.0 dnia

DB: dodaj line_id (FK → production_lines) do BOM (optional default) oraz do WO (required).

UI: BOM modal — „Preferred Line”, CreateWorkOrderModal — domyślny line_id z BOM (można nadpisać).

Scanner/Production: filtry po line_id.

### 2.2 Taxes & Meta

2.2.S3 Usuń tax_code z BOM 🟢 P0 — 0.25 dnia

BOM nie trzyma podatków; podatki/waluta z dostawcy/PO.

UI: usuń sekcję „Tax code”.

Migracje: drop kolumnę jeśli istnieje.

### 2.2 Jednostki miary (UoM) — źródło prawdy

Zasada główna (final)
BOM jest jedynym źródłem prawdy dla jednostek (UoM).
Każdy WO przy tworzeniu dziedziczy UoM 1:1 z BOM (w snapshotcie) i zawsze używa tych jednostek – nawet jeśli BOM zostanie później zmieniony.
W jednym COMPOSITE mogą współistnieć komponenty w KG, EACH, METER, LITER — WO tworzy materiały dokładnie w tych jednostkach, które są w BOM.

2.2.U1 BOM UoM = source of truth (KG/EACH/METER/LITER) 🟢 P0 — 0.5 dnia

bom_items.uom (enum: 'KG' | 'EACH' | 'METER' | 'LITER') NOT NULL.

WO snapshot zapisuje uom dla każdej pozycji i nie zmienia go po starcie WO.

Brak konwersji między jednostkami w MVP.

2.2.U2 UI walidacje UoM 🟢 P0 — 0.5 dnia

W AddItemModal wyświetl/wybierz uom z BOM; komunikat: „UoM z BOM zostanie użyty w WO (brak konwersji)”.

W CompositeProductModal dopuszczone mieszane UoM per pozycja.

2.2.U3 Eksport BOM (xlsx) z UoM 🟢 P0 — 0.25 dnia

Dodaj kolumnę uom do eksportu.

### 2.2 Snapshot fidelity

2.2.S5 Snapshot WO/BOM pełny 🟢 P0 — 0.5 dnia

Snapshot zawiera: material_id, qty, scrap%, 1:1 flag, uom, alergeny, komentarze, product_version, bom_version, line_id.

### 2.2 Testy (P0)

Constraint single active.

Blokada edycji active.

Big/small bump działa zgodnie z regułami.

Snapshot pinning działa (BOM update ≠ WO snapshot).

Line_id zapisany i dziedziczony do WO.

Walidacje UoM działają (mixed units ok).

### 2.3 Routing Management

  - ⬜ 2.3.1 Routing definition (operations sequence)
  - ⬜ 2.3.2 Routing operations (operation_id, sequence, machine_id) add field machine?
  - ⬜ 2.3.3 Multi-choice routing requirements (Smoke, Roast, Dice, Mix) (possible o change that names)?
  - ⬜ 2.3.4 Yield per phase tracking
  - ⬜ 2.3.5 Per-phase expiry adjustments ⚪ P2

**Status: ✅ Core routing done, advanced features pending**

### 2.3 Routing — P0 doprecyzowania (NOWE)

  - ⬜ 2.3.2 routing_operations.machine_id — migracja + UI 🟢 P0 — 1.0 dnia

Dodaj machine_id (FK) i selektor w wierszu operacji.

Walidacja sekwencji (rosnąca, unikalna).

  - ⬜ 2.3.3 Słownik nazw operacji w Settings (Decyzja #4) 🟢 P0 — 0.5 dnia

Dodaj Settings → Routing Operations Dictionary (lista nazw i aliasów).

RoutingBuilder używa słownika; można ręcznie dodawać/korygować.

Startowy zestaw: Smoke, Roast, Dice, Mix.

2.3.S1 Expected yield % per operacja (storage-only) 🟢 P0 — 0.25 dnia

Przechowywanie expected_yield% per operacja; raportowanie w Production.

### 2.4 UI Components

  - ⬜ 2.4.1 BomCatalogClient (MEAT/DRYGOODS/COMPOSITE/ARCHIVE tabs)
  - ⬜ 2.4.2 SingleProductModal (MEAT/DRYGOODS editing)
  - ⬜ 2.4.3 CompositeProductModal (BOM editing with versioning)
  - ⬜ 2.4.4 AddItemModal enhancement (wider, more sections)
  - ⬜ 2.4.5 RoutingBuilder component
  - ⬜ 2.4.6 AllergenChips component
  - ⬜ 2.4.7 ProductSelect component
  - ⬜ 2.4.8 BomHistoryModal component

**Status: ✅ Complete - but check that components**

Sanity pass + rozszerzenia (P0):

BomCatalogClient: filtry group, has_active_bom, has_allergens, supplier; kolumny: active BOM version, line, supplier, allergens.

Single/CompositeProductModal: banner DRAFT vs ACTIVE; sekcja Product Version (X.Y) + przyciski Bump minor/major.

AddItemModal: wybór uom; ostrzeżenie „Big change → new draft/major bump” przy zmianie material_id.

RoutingBuilder: kolumna Machine, kolejność, słownik nazw z Settings.

BomHistoryModal: mini-diff draft↔active (+/−/~); link Export to .xlsx.

Trace (Technical & Production, wspólny komponent)

TraceTab (grid) 🟢 P0 — 0.75 dnia

Kolumny: LP, Product, Batch, Level/Depth, Relation, operation_seq, pallet_id, qa_status.

Akcje: Export to .xlsx, link do szczegółów LP/WO/GRN.

Ten sam komponent w Technical i Production (różne entry-pointy).

Eksporty

Export BOM (.xlsx) 🟢 P0 — 0.5 dnia

Kolumny: material_code, name, qty, scrap%, 1:1 flag, UoM, Allergen (inherited), notes.

Export Products (.xlsx) 🟢 P0 — 0.25 dnia

Kolumny: part_number, name, group, active_bom_version, supplier, is_active.

Migracje (P0)

M1: alter table bom add column line_id int null; (FK → production_lines)

M2: alter table work_orders add column line_id int not null; (FK → production_lines)

M3: alter table bom drop column tax_code; (jeśli istnieje)

M4: create table production_lines (id pk, code text unique, name text, status text, warehouse_id int fk, is_active bool);

M5: alter table products add column product_version text;

M6: indeksy pod trace/wo snapshot.

M7: alter table bom_items add column uom text not null check (uom in ('KG','EACH','METER','LITER'));

M8: alter table license_plates add column uom text not null default 'KG' check (uom in ('KG','EACH','METER','LITER'));

M9: update danych: mięsa → KG, weby/pudełka → EACH, folie → METER, płyny → LITER.

Testy i AC (P0)

T-01: WO snapshot utrwala BOM i UoM; zmiana BOM po starcie nie wpływa na WO.

T-02: Scanner blokuje LP w innej jednostce niż BOM.

T-03: GRN i produkcja tworzą LP z prawidłowym uom.

T-04: Eksport BOM zawiera poprawne uom.

T-05: Blokada edycji aktywnego BOM działa.

T-06: Big/small change logic poprawna.

T-07: Line_id poprawnie dziedziczone do WO i filtrowane.

Acceptance Criteria:

BOM to źródło prawdy dla UoM (KG/EACH/METER/LITER).

WO snapshot przypina wersję BOM i UoM 1:1.

Mieszane jednostki w BOM dozwolone.

Scanner egzekwuje zgodność jednostek (LP ≠ BOM → blokada).

Snapshot, trace i eksport zawierają UoM i line_id.

AddItemModal/CompositeProductModal jasno komunikują jednostki i bump logic.

Małe doprecyzowania implementacyjne (dla devów)

API: create_wo_bom_snapshot(wo_id, bom_id, bom_version, product_version, line_id) — transakcyjny zapis snapshotu.

Guardy: przy release WO → walidacja, że snapshot istnieje i jest kompletny.

Diff logic: tylko zmiana material_id = Big; qty/scrap = Small.

Settings → Routing Dictionary: CRUD, powiązany z RoutingBuilder.

UI copy: bannery i toasty: „Aktywny BOM tylko do odczytu”, „Zmiana materiału = Big change (nowy draft)”.

UoM enforcement: brak konwersji między jednostkami; mieszane jednostki per BOM akceptowane.

## 3.0 Planning Module - Orders

📊 DETAILED ANALYSIS: See docs/PLANNING_MODULE_FILES_FOR_EXTERNAL_ANALYSIS.md (2025-11-03)
✅ PHASE 1-3 COMPLETE: Transfer Orders (TO), Purchase Orders (PO), and Work Orders (WO) modules fully implemented with all critical features:

Phase 1 (TO): Shipping/receiving dates, markShipped/markReceived methods, LP/batch tracking

Phase 2 (PO): Payment due date, currency, exchange rate, total amount calculations

Phase 3 (WO): Source demand tracking, actual start/end dates, BOM selection

Documentation: API_REFERENCE.md, DATABASE_SCHEMA.md, PLANNING_MODULE_GUIDE.md updated

Unit Tests: transferOrders.test.ts, purchaseOrders.test.ts, workOrders.test.ts created

### 3.1 Work Orders (WO)

**Status: 🔄 ~95% ukończone – Rdzeń funkcjonalności zaimplementowany (tabela WO, tworzenie/edycja/anulowanie zleceń, snapshot BOM), pozostały drobne uzupełnienia w UI oraz testy. Brakuje głównie widoczności postępu produkcji i braków materiałowych w UI oraz funkcji aktualizacji receptury.**

UI (Frontend)

WorkOrdersTable – Wyświetlanie wszystkich kluczowych kolumn: numer WO, produkt, ilość, status, linia produkcyjna, priorytet – zaimplementowano (wymaga jedynie drobnej synchronizacji kolumn z aktualnym schematem) 🟢 P0 — 0.5 dnia

WorkOrdersTable – Dodanie kolumn Made (wyprodukowana ilość) oraz Progress (procent ukończenia) wyliczanych na podstawie zapisów w production_outputs – do zaimplementowania 🟢 P0 — 0.75 dnia

WorkOrdersTable – Kalkulacja i wyświetlanie braków materiałowych (Shortages) dla WO na podstawie zapotrzebowania z wo_materials vs dostępny stan magazynowy – do doprecyzowania i wdrożenia 🟢 P0 — 0.5 dnia

WorkOrdersTable – Kolumny Actual Start / Actual End (rzeczywiste czasy rozpoczęcia i zakończenia zlecenia) – zaimplementowano w UI (widoczne dane z pól actual_start / actual_end w tabeli)

WorkOrdersTable – Wskaźnik Source Demand dla WO (źródło zapotrzebowania: Manual/TO/PO/SO) – zaimplementowano w UI (pole source_demand_type wyświetlane)

WorkOrdersTable – Wyświetlanie ID i wersji BOM użytego w WO – zaimplementowano (BOM ID oraz version są widoczne np. w szczegółach zlecenia)

Akcja Cancel WO – Możliwość anulowania zlecenia produkcyjnego z poziomu UI (przycisk Cancel na liście/szczegółach WO, niedostępny dla statusów completed/cancelled) – zaimplementowano (wraz z walidacją statusu przed anulowaniem)

Akcja Edit WO – Możliwość edycji zlecenia w UI (ograniczona do pola ilości, tylko gdy WO jest w statusie in_progress) – zaimplementowano (formularz EditWorkOrderModal z walidacją statusu)

Filtrowanie WO – Filtry na liście zleceń (po liniach produkcyjnych, dacie, statusie, statusie QA, zakresie KPI) – zaimplementowano (filtry w UI zgodne z parametrami API)

WorkOrderDetailsModal – Modal z szczegółami WO, zawierający kafelki KPI, podgląd snapshotu BOM itp. – zaimplementowano (należy upewnić się, że snapshot BOM wyświetla wszystkie informacje z oryginalnego BOM)

CreateWorkOrderModal – Modal tworzenia WO z wyborem BOM (tworzenie snapshotu BOM), wyborem źródła zapotrzebowania (Source dropdown) oraz przypisaniem linii produkcyjnej – zaimplementowano (trigger snapshotu BOM działa)

Śledzenie użytkownika – Wyświetlanie informacji kto utworzył (created_by) zlecenie produkcyjne – zaimplementowano w UI (pole Utworzył widoczne)

Aktualizacja “formuły” (BOM) w WO – Dodanie możliwości zaktualizowania receptury/BOM w już utworzonym WO (np. w razie zmiany składu produktu w trakcie realizacji). Wymagane dodanie przycisku/akcji w UI (np. Update Formula w szczegółach WO), który wywoła odpowiedni endpoint API do przepisania materiałów z aktualnego BOM – do zaimplementowania 🟢 P0 — 1.0 dnia

API (Endpoints & Logika)

WorkOrdersAPI – Endpoint listujący WO z filtrami (getAll z opcjami filtrowania po linii, statusie, itp.) – zaimplementowano (zwrot listy WO zgodnie z filtrami)

WorkOrdersAPI.getById – Pobieranie pojedynczego WO po ID (do wyświetlania szczegółów) – działa (zwraca pełne dane WO wraz z powiązaniami)

WorkOrdersAPI.create – Tworzenie nowego WO – zaimplementowano (tworzy rekord w work_orders, generuje numer WO, oraz inicjuje snapshot BOM materiałów poprzez trigger)

WorkOrdersAPI.update – Aktualizacja istniejącego WO – zaimplementowano (edytuje dozwolone pola, np. quantity dla in_progress WO)

WorkOrdersAPI.cancel – Anulowanie WO (cancel_work_order(wo_id, ...) RPC) – zaimplementowano (waliduje status ≠ completed/cancelled, usuwa powiązane operacje, zwalnia rezerwacje LP; operacja transakcyjna)

Logika BOM Snapshot – Tworzenie migawki BOM dla WO – zaimplementowano (trigger wo_bom_snapshots i zapis materiałów do wo_materials podczas tworzenia WO)

WorkOrdersAPI.getProductionStats – Metoda do obliczania progresu produkcji (zwraca madeQty, plannedQty, progressPct na podstawie production_outputs) – zaimplementowano (wykorzystywane do kolumn Made/Progress)

Endpoint aktualizacji BOM w WO – NOWY: Dodanie obsługi aktualizacji receptury zlecenia. Należy umożliwić w API podmianę przypisanej listy materiałów (np. poprzez wywołanie procedury ponownego snapshotu aktualnego BOM produktu). To wymaga dodania metody (np. WorkOrdersAPI.refreshBOM(woId)) lub rozszerzenia istniejącego update – do zaimplementowania wraz z odpowiednimi zabezpieczeniami 🟢 P0 (backend logic)

Walidacja Source Demand – Logika w API upewniająca się, że pola source_demand_type/source_demand_id są poprawnie ustawione (np. gdy WO utworzone z zapotrzebowania PO/TO/SO) – zaimplementowano (reguły biznesowe spójne z powiązaniami)

Uwzględnienie pól użytkownika – Upewnienie się, że API zwraca pola created_by (oraz approved_by jeśli dotyczy) przy odczycie WO. W razie potrzeby rozszerzenie odpowiednich select w API – do weryfikacji/implementacji (małe dostosowanie, jeśli brakuje)

Database (Schemat & Dane)

Tabela work_orders – Wszystkie wymagane kolumny są obecne: m.in. actual_start, actual_end (rzeczywiste daty), pola źródła source_demand_type/id, pola śledzenia (created_by, approved_by) – OK (schema aktualna)

Tabela wo_materials – Struktura do przechowywania materiałów WO (snapshot BOM) jest zaimplementowana i powiązana (trigger dodający wpisy w momencie tworzenia WO) – OK

Indeksy – Indeksy wspomagające wyszukiwanie/filtrowanie WO (np. po statusie, dacie, linii, itp.) są utworzone – OK (wg schematu, np. idx_work_orders_status_date, idx_work_orders_line_id, idx_work_orders_kpi_scope)

Migracje dla nowych funkcji – Jeśli potrzebne: brak konieczności dodawania nowych kolumn. Ewentualna migracja może dotyczyć audytu zmian BOM (np. tabela work_orders_audit już istnieje) lub innych drobnych poprawek. (Do rozważenia przy implementacji aktualizacji BOM – czy logować zmiany receptury?)

Testy (Jednostkowe & Integracyjne)

Testy jednostkowe WO API – Przygotować zestaw testów dla kluczowych scenariuszy WorkOrdersAPI: tworzenie WO (czy poprawnie zapisuje BOM snapshot i pola), edycja ilości, anulowanie WO (czy niedozwolone po zakończeniu, czy zwalnia rezerwacje), oraz obliczenie progresu (Made/Progress) – do implementacji 🟢 P0 (1 dzień)

Testy integracyjne WO – Scenariusz end-to-end: utworzenie WO z określonym BOM, symulacja dodania production_outputs, sprawdzenie obliczeń progresu, następnie anulowanie WO – do implementacji 🟢 P0 (1 dzień)

Testy UI (opcjonalnie) – Sprawdzić poprawność renderowania kolumn w WorkOrdersTable (np. czy pojawiają się Actual Start/End, Made, Progress po dodaniu) oraz działania akcji (Cancel, Edit) w komponentach – do rozważenia (można pokryć testami integracyjnymi)

### 3.2 Purchase Orders (PO)

**Status: 🔄 ~90% ukończone – Większość funkcjonalności zakupów jest gotowa (tabela PO, tworzenie/edycja, kalkulacje płatności), wprowadzone zostały kluczowe pola finansowe (termin płatności, waluta, kwoty). Wymagane są korekty zgodnie ze zmianami założeń (automatyzacja waluty/podatku, usunięcie exchange rate) oraz dodanie kilku usprawnień (śledzenie użytkownika, import z Excel, integracja ASN).**

UI (Frontend)

PurchaseOrdersTable – Tabela listy PO z kolumnami: numer PO, dostawca, magazyn docelowy, kupiec (buyer), status – zaimplementowano (kolumny obecne, wymagane upewnienie się że pokrywają się z aktualnym schematem, np. czy kolumna Buyer jest właściwie wypełniana) 🟢 P0 — 0.5 dnia

Daty dostawy w tabeli PO – Wyświetlanie kolumn Request Delivery Date oraz Expected Delivery Date – zaimplementowano (daty widoczne na liście) – do synchronizacji nazewnictwa/znaczenia jeśli wymagane 🟢 P0 — 0.25 dnia

Line Items w PO – Obsługa pozycji zamówienia (produkty, ilości, cena jednostkowa, wartość) – zaimplementowano (w ramach modalu szczegółów i tworzenia PO; tabela główna wyświetla podsumowanie liczby pozycji i total)

Payment Due Date – Kolumna Termin Płatności widoczna w tabeli PO – zaimplementowano (pole due_date wypełniane i pokazywane)

Currency & Exchange Rate – Pola Waluta oraz Kurs w UI (formularz tworzenia/edycji PO oraz szczegóły) – zaimplementowano. Zmiana: pole Exchange Rate zostanie usunięte z UI (nie jest już używane) 🟢 P0 — 0.5 dnia. Pole Currency pozostaje tylko do odczytu (automatycznie ustawiane na domyślną walutę dostawcy).

Total Amount – Kolumna Suma (łączna wartość zamówienia) wyliczana i wyświetlana – zaimplementowano (UI kalkuluje sumę na podstawie pozycji)

Upload ASN – Przycisk “Upload ASN” przy zamówieniu (umożliwia dodanie awiza dostawy do PO) – zaimplementowano (otwiera modal UploadASNModal powiązany z danym PO)

Akcja Cancel PO – Możliwość anulowania zamówienia (przycisk Cancel na liście/ szczegółach PO) z weryfikacją czy nie ma już powiązanego GRN – zaimplementowano (akcja niedostępna lub komunikat jeśli do PO jest wystawiony GRN)

PurchaseOrderDetailsModal – Modal ze szczegółami PO, zawiera sekcję Financial Information (m.in. waluta, kurs, terminy, sumy) oraz listę pozycji – zaimplementowano (należy uaktualnić według zmian logiki: np. usunięto edycję waluty/kursu jeżeli teraz są stałe)

CreatePurchaseOrderModal / EditPurchaseOrderModal – Formularze tworzenia i edycji PO z polami: dostawca, magazyn, lista pozycji (produkty, ilości, ceny), termin płatności, waluta, kurs – zaimplementowano. Zmiana: pola Currency i Tax nie są już wybierane ręcznie – UI powinien je ustawiać automatycznie na podstawie wybranego dostawcy (waluta z suppliers.currency, domyślny kod podatku z suppliers.default_tax_code_id). Pole Exchange Rate usunąć z formularza.

Śledzenie użytkownika – Wyświetlanie w UI informacji kto utworzył zamówienie (created_by) oraz kto zatwierdził (approved_by) – do zaimplementowania (np. w szczegółach PO pokazać “Utworzył: X, Zatwierdził: Y”) 🟢 P0 — 0.5 dnia (priorytet zwiększony, ważne dla audytu)

Zarządzanie załącznikami – Możliwość dodawania i podglądu załączników do zamówienia (np. skany umów, ofert) – funkcjonalność planowana 🟡 P1 (niekrytyczne na MVP)

Bulk upload z Excel (pozycje PO) – Dodanie opcji importu pozycji zamówienia z pliku Excel/CSV w CreatePurchaseOrderModal/EditPurchaseOrderModal. Użytkownik powinien móc wczytać listę produktów i ilości z pliku – do zaimplementowania 🟢 P0 — 1.0 dnia. Uwaga: Wymaga walidacji poprawności danych z pliku i integracji z istniejącym formularzem pozycji.

Usprawnienia wyboru dostawcy/produktu – (Opcjonalnie) Ograniczenie listy produktów do tych powiązanych z wybranym dostawcą. Ponieważ każdy produkt ma przypisanego dostawcę 1:1, UI może filtrować listę produktów w modalu po wyborze dostawcy, aby zapobiec dodaniu pozycji spoza oferty dostawcy – do rozważenia podczas implementacji (zapewnienie spójności danych).

API (Endpoints & Logika)

PurchaseOrdersAPI.getAll – Pobieranie listy PO – zaimplementowano (zwraca listę zamówień z podstawowymi polami)

PurchaseOrdersAPI.getById – Pobieranie szczegółów PO – zaimplementowano (zwraca nagłówek PO + pozycje)

PurchaseOrdersAPI.create – Tworzenie nowego PO – zaimplementowano (obsługuje tworzenie rekordu purchase_orders i powiązanych purchase_order_items). Aktualizacja logiki: przy tworzeniu zamówienia:

Automatycznie ustawiaj supplier_id na dostawcę powiązanego z produktem (lub sprawdzaj zgodność dostawcy wybranego w formularzu z dostawcami produktów). System zakłada relację 1:1 produkt→dostawca, więc wszystkie pozycje muszą mieć tego samego dostawcę co nagłówek PO – weryfikuj to w walidacji.

Automatycznie ustawiaj currency na domyślną walutę dostawcy (suppliers.currency – np. USD, EUR). Nie przyjmuj od klienta innej waluty – ignoruj lub nadpisuj pole jeśli przesłane.

Tax: jeśli wymagane, ustawiaj domyślny kod podatku na podstawie dostawcy (default_tax_code_id) lub produktów (systemowo każdy produkt ma tax_code). Uwaga: Ręczny wybór kodu podatku został wyłączony – upewnij się, że API poprawnie ustawia/uwzględnia podatek zgodnie z danymi dostawcy/produktu.

Exchange Rate: nie wymagaj i nie używaj tego pola (w bieżącej fazie zakładamy brak wielowalutowości lub stały kurs=1). Jeżeli waluta dostawcy różni się od bazowej, można pobrać kurs z innego źródła w przyszłości – na razie API może ustawiać exchange_rate domyślnie (np. 1.0) lub pozostawić null. (Możliwe usunięcie kolumny z DB w migracji – patrz DB)

order_date: ustawiaj zawsze na bieżącą datę (np. today()). Nie pozwalaj nadpisywać daty wystawienia – wykorzystuj timestamp utworzenia rekordu (created_at) jako datę zamówienia. Jeśli w kodzie istniał parametr order_date, zignoruj go lub ustaw na NOW() wewnątrz API.

PurchaseOrdersAPI.cancel – Anulowanie PO – zaimplementowano (cancel_purchase_order() RPC) z walidacją: można anulować tylko gdy brak powiązanych przyjęć (GRN) dla danego PO. Upewnij się, że ta walidacja działa (sprawdza brak rekordów w grns dla po_id danego zamówienia) zanim zmieni status na cancelled.

PurchaseOrdersAPI.close – Finalizacja PO – zaimplementowano (zamyka PO ze statusem closed, generuje numer GRN jeśli wszystkie pozycje zostały przyjęte). Uwaga: Ten endpoint jest częścią przepływu przyjęcia dostawy – patrz integracja ASN/GRN.

PurchaseOrdersAPI.getDefaultUnitPrice(productId, supplierId) – Logika pobierania domyślnej ceny zakupu dla produktu – zaimplementowano (wykorzystuje relację produkt-dostawca, np. tabelę supplier_products). Uwaga: Ponieważ zakładamy 1:1 produkt→dostawca, metoda może ignorować parametr supplierId lub traktować go jako dodatkową weryfikację.

Uwzględnienie pól użytkownika – Zapewnić, że API zwraca pola created_by i approved_by przy pobieraniu PO. W razie potrzeby zmodyfikować zapytania (JOIN z tabelą users lub pobieranie ID, do ewentualnego wyświetlenia nazw w UI). Analogicznie dla logiki zatwierdzania PO (jeśli approval workflow istnieje lub będzie dodany).

Obsługa załączników – (Po stronie API) przygotować endpointy lub rozszerzenia PurchaseOrdersAPI.update do dodawania/usuwania załączników (np. pliki PDF z ofertami). To może wymagać storage w Supabase (bucket) lub dodatkowej tabeli na metadata załączników. – Do zaplanowania jako P1 (po MVP).

Walidacja Bulk Upload – Jeżeli implementujemy import z Excel w UI, upewnić się że API potrafi przyjąć wiele pozycji naraz (co już robi, bo create akceptuje tablicę items) i że błędy w danych (nieistniejący produkt, brak ceny) są odpowiednio komunikowane. Można rozszerzyć walidacje po stronie API dla danych wczytywanych hurtowo z pliku – do wprowadzenia razem z funkcją importu.

Database (Schemat & Dane)

Tabela purchase_orders – Zawiera wymagane kolumny: m.in. supplier_id, warehouse_id, status, daty request_delivery_date i expected_delivery_date, due_date (termin płatności), currency (waluta), exchange_rate (kurs), buyer_id, pola użytkownika created_by, approved_by – schemat jest zgodny.

Tabela purchase_order_items – Zawiera pola pozycji: product_id, quantity, unit_price itp. – OK (relacje do produktów i nagłówka PO).

Tabela suppliers – Zawiera pola domyślne wykorzystywane w logice PO: default_tax_code_id (domyślny kod podatku dostawcy) oraz currency (domyślna waluta dostawcy). Założenie: Każdy produkt ma przypisanego dostawcę (pole products.preferred_supplier_id), co w modelu 1:1 oznacza głównego dostawcę produktu. Nie stosujemy już tabeli pośredniej do wyboru różnych dostawców – jeśli istnieje supplier_products, nie będzie używana przy tworzeniu PO (ew. pozostaje dla cen historycznych).

Modyfikacja kolumn (waluta/kurs) – Rozważyć migrację usuwającą lub dezaktywującą pole exchange_rate z purchase_orders, jeśli nie będzie wykorzystywane w MVP (zapobiegnie to niepotrzebnemu przechowywaniu danych). Alternatywnie, pozostawić kolumnę z domyślnym NULL/1.0 i ewentualnie użyć w przyszłości przy obsłudze wielowalutowej – do decyzji (jeśli usunięcie – migracja P0).

Integracja z ASN/GRN – Upewnić się, że schemat bazy obsługuje powiązanie PO -> ASN -> GRN:

Pole purchase_orders.status: powinno mieć wartości pozwalające oznaczyć PO jako received/closed po przyjęciu towaru. (Już ma, np. status received, closed – do użycia).

Tabela grns (Goods Receipt Notes) ma kolumnę po_id do powiązania z zamówieniem. Tabela asns ma kolumnę po_id? (W schemacie asns jest supplier_id, expected_delivery, nie uwzględniono po_id – ale API create pozwala opcjonalnie przekazać po_id. Jeśli asns.po_id nie istnieje, należy rozważyć dodanie kolumny po_id do ASN w migracji, aby trwale powiązać ASN z zamówieniem.)

Jeśli planowane jest śledzenie wielu dostaw (partii) do jednego PO, schema powinna pozwolić na wiele ASN/GRN powiązanych z jednym PO. Obecny model wspiera to przez relację w grns (wiele GRN może mieć ten sam po_id). Dla ASN, dodanie po_id również by to umożliwiło. – Do weryfikacji i ewentualnej migracji.

Domyślne wartości – Upewnić się, że domyślne wartości w kolumnach są poprawne: purchase_orders.currency ma DEFAULT 'USD' – może zostać, choć teraz i tak nadpisujemy z dostawcy. purchase_orders.status – default powinien być 'draft' lub inny początkowy. Sprawdzić czy preferred_supplier_id w products nie ma constraint wymuszających istnienie (logika preferowanego dostawcy i tak pominięta w kodzie).

Testy (Jednostkowe & Integracyjne)

Testy jednostkowe PO API – Przygotować testy dla PurchaseOrdersAPI:

Tworzenie PO: sprawdzenie czy zawsze ustawia się poprawny supplier_id (zgodny z produktem), czy waluta currency jest ustawiana automatycznie na walutę dostawcy, a exchange_rate pomijany/ustawiany default.

Tworzenie PO z niezgodnym produktem/dostawcą: upewnij się, że API odrzuci lub poprawi dane (np. dwa produkty od różnych dostawców w jednym PO – powinno zgłosić błąd).

Anulowanie PO: spróbuj anulować PO bez i z powiązanym GRN – oczekuj odpowiednio: sukces vs. błąd/odmowa (walidacja GRN).

Metoda close(): utwórz PO, powiąż testowo dane GRN (może wymagać utworzenia GRN w testach lub mock) i wywołaj close – sprawdź czy status PO zmienia się na closed i czy otrzymujemy numer GRN w odpowiedzi (jeśli logicznie generowany).

Uwagi: Można wykorzystać mock obiektu bazy (Supabase) lub in-memory DB dla testów.

Testy integracyjne – cykl PO->ASN->GRN – Zaimplementować scenariusz end-to-end: utworzenie PO → wystawienie ASN → przyjęcie GRN:

Create PO (z kilkoma pozycjami) przez API.

Create ASN do tego PO (API ASN) z ilościami np. mniejszymi niż zamówione dla testu różnic. Sprawdź, czy ASN zapisuje się ze statusem submitted i poprawnymi danymi.

Create GRN na podstawie PO (lub ASN) – wywołaj API GRN, przekazując po_id i odebrane ilości (częściowo zgodne z ASN).

Sprawdź w rezultacie: status PO zmienia się na received/closed zgodnie z implementacją, ASN ma status received/closed, GRN utworzył rekordy grn_items z właściwymi ilościami, a różnice (jeśli były) są odnotowane (np. PO pozostało z niedostarczonymi pozycjami? – oczekujemy, że PO closed nawet przy partial, o ile tak zdecydowano).

Sprawdź, czy nie można anulować PO po wystawieniu GRN.

Testy integracyjne UI/UX – (Opcjonalnie w ramach QA) Scenariusze użytkownika: utworzenie nowego PO przez formularz (walidacja automatycznego uzupełniania waluty/podatku), import pozycji z pliku (jeśli zaimplementowany – sprawdzenie, że poprawnie dodaje wiele pozycji), anulowanie PO z listy (przed i po GRN), itd. – Manualne testy akceptacyjne lub E2E automatyczne (Selenium/Playwright) po stronie klienta.

### 3.3 Transfer Orders (TO)

**Status: 🔄 ~90% ukończone – Moduł transferów materiałów między magazynami prawie gotowy: podstawowe operacje (tworzenie, edycja, realizacja wysyłki/odbioru) działają. Dodano śledzenie przesyłek (daty wysyłki/odbioru planowane i rzeczywiste) oraz identyfikację partii/LP w pozycjach. Do dopracowania pozostały drobne usprawnienia: przywrócenie funkcji anulowania transferu, poprawa wyświetlania lokalizacji, oraz opcja importu z Excel.**

UI (Frontend)

TransferOrdersTable – Tabela TO z kolumnami: numer TO, lokalizacja From → To, status, liczba pozycji – zaimplementowano (kolumny podstawowe wyświetlane poprawnie)

Akcja Cancel TO – (Aktualnie wyłączona) Anulowanie transferu – do ponownego wdrożenia. Poprzednio funkcja anulowania została usunięta lub ukryta, należy przywrócić przycisk Cancel w UI i obsługę jego stanu (np. niedostępny jeśli TO jest już wysłany/odebrany). Wymaga to również wsparcia w API/DB (patrz niżej) 🟢 P0 — 0.5 dnia

TransferOrderDetailsModal – Modal ze szczegółami transferu, zawiera sekcje wysyłki i odbioru (daty planowane/rzeczywiste, przyciski akcji do oznaczania Ship/Receive) – zaimplementowano (działa zgodnie z logiką, pokazuje informacje o przesyłce)

CreateTransferOrderModal / EditTransferOrderModal – Formularze tworzenia/edycji TO z polami: magazyn/lokalizacja źródłowa (From), docelowa (To), oraz daty planowane wysyłki i odbioru – zaimplementowano (daty planowane można wprowadzać)

Ship/Receive Dates – Wyświetlanie planowanych i rzeczywistych dat wysyłki (Ship) i odbioru (Receive) w UI (4 daty: planned_ship, actual_ship, planned_receive, actual_receive) – zaimplementowano (daty planowane wprowadzane w formularzu, daty rzeczywiste ustawiane poprzez akcje Mark as Shipped/Received, widoczne w szczegółach)

Wyświetlanie lokalizacji – Błąd do naprawy: UI pokazuje nazwę magazynu zamiast konkretnych lokalizacji From/To. Należy zmienić wyświetlanie, by uwzględniało pełną nazwę lokalizacji (lub co najmniej odróżnić, jeśli używamy sub-locations). Przykładowo: jeśli from_location to Warehouse A - Sekcja 1, obecnie może pokazywać tylko Warehouse A. Poprawka polega na pobraniu nazwy lokalizacji z tabeli locations i zaprezentowaniu jej w tabeli TO – do poprawy 🟡 P1.

Tracking ilości – Wyświetlanie w szczegółach pozycji TO planowanej ilości vs rzeczywistej przeniesionej (pola qty_planned / qty_moved) – zaimplementowano (po oznaczeniu odbioru, pokazuje ile faktycznie przeniesiono)

LP ID & Batch – Wyświetlanie w pozycjach TO identyfikatorów palet/LP i numerów partii – zaimplementowano (w modalu szczegółów transferu widać kolumny LP ID oraz Batch dla każdej pozycji)

Śledzenie użytkownika – Wyświetlenie kto utworzył transfer (created_by) oraz kto odebrał (received_by) – do zaimplementowania (np. w szczegółach TransferOrderDetailsModal dodać “Utworzył: ...”, “Odebrał: ...”) 🟡 P1.

Bulk upload z Excel (pozycje TO) – Dodanie możliwości importu pozycji transferu z pliku Excel/CSV (podobnie jak w PO). W CreateTransferOrderModal/EditTransferOrderModal dodać opcję wczytania listy produktów i ilości do przeniesienia z pliku – do zaimplementowania 🟢 P0 — 1.0 dnia.

API (Endpoints & Logika)

TransferOrdersAPI.getAll/getById – Pobieranie listy oraz szczegółów TO – zaimplementowano (zwraca TO z polami łącznie z datami i pozycjami)

TransferOrdersAPI.create – Tworzenie nowego transferu – zaimplementowano (tworzy wpis w transfer_orders oraz pozycje w transfer_order_items). Logika uwzględnia sprawdzenie dostępności stanów magazynowych (jeśli była zaimplementowana reguła Inventory Check).

TransferOrdersAPI.update – Edycja transferu – zaimplementowano (pozwala zmieniać planowane daty lub ewentualnie dodawać/usuwać pozycje w wersji draft, zgodnie z regułami biznesowymi)

TransferOrdersAPI.cancel – (Wymaga weryfikacji) Funkcja anulowania transferu istniała (RPC cancel_transfer_order()), ale została wyłączona. Należy ponownie umożliwić anulowanie TO:

DB/Status: Upewnij się, że status cancelled jest dopuszczalny (schema transfer_orders.status już zawiera 'cancelled').

API: Przywróć endpoint cancel(id) analogicznie do PO/WO (ustawia status na cancelled, anuluje powiązane ruchy). Skorzystaj z istniejącej procedury cancel_transfer_order() – do aktywacji 🟢 P0 (0.5 dnia).

Walidacja: Można anulować tylko gdy transfer nie jest ukończony (np. status draft/submitted, nie in_transit/received).

Akcje Ship/Receive – Oznaczanie wysyłki i odbioru:

Mark as Shipped – zaimplementowano (np. oddzielny endpoint lub poprzez TransferOrdersAPI.update(status=‘in_transit’, actual_ship_date=now) – metoda dostępna, choć nie jawnie wylistowana w dokumentacji, jest obsługiwane w warstwie API/DB).

Mark as Received – zaimplementowano (ustawia status received, wpisuje actual_receive_date=now, wypełnia quantity_actual w pozycjach na podstawie przesłanych/odebranych danych). Prawdopodobnie zrealizowane w API (metoda TransferOrdersAPI.close lub poprzez update statusu na received).

Upewnić się, że te akcje poprawnie aktualizują stan pozycji (ustawiają quantity_actual w transfer_order_items oraz pole received_by w nagłówku).

Inventory Check – (Jeśli zaimplementowano) sprawdzanie stanów magazynu przed utworzeniem transferu – działa (reguła biznesowa: ilość dostępna w from_location musi być ≥ transferowana).

Bulk import handling – API już przyjmuje wiele pozycji przy tworzeniu (items array). Dla importu z Excel nie trzeba zmieniać backend, ale:

Walidacja: dodać sprawdzenie formatów/zakresów jeśli import w UI ma minimalną walidację.

Błędy: upewnij się, że jeśli jedna z wielu pozycji jest nieprawidłowa, API zwróci czytelny komunikat które pozycje błędne (np. rozszerzyć walidację i komunikaty o indeks pozycji).

Uwzględnienie pól użytkownika – Zaktualizować API aby zwracało created_by oraz received_by dla transferu. Te pola są w schemacie, ale trzeba sprawdzić czy są dołączane w odpowiedzi (jeśli nie, zmodyfikować zapytanie lub dołączyć powiązane nazwy użytkowników gdy będzie to wykorzystywane w UI).

Database (Schemat & Dane)

Tabela transfer_orders – Zawiera wymagane pola: from_location_id, to_location_id (źródło/cel), status (obsługujący m.in. draft, submitted, in_transit, received, cancelled), daty planned_ship_date, actual_ship_date, planned_receive_date, actual_receive_date, pola created_by, received_by – schemat jest aktualny.

Tabela transfer_order_items – Zawiera pozycje transferu: product_id, quantity_planned, quantity_actual, opcjonalnie lp_id (jeśli śledzimy konkretne palety) i batch – OK (relacje powiązane z TO i produktami).

Tabela locations – Przechowuje lokalizacje (magazyny/strefy); from_location_id i to_location_id odnoszą się do locations.id. Uwaga: Ponieważ UI wymaga nazwy magazynu/lokalizacji, warto sprawdzić czy w tabeli locations jest kolumna np. name oraz czy jest powiązanie z warehouses. Z indeksu idx_transfer_orders_warehouses wynika, że istniały pola from_warehouse_id/to_warehouse_id – zostały zastąpione przez location.

Do zrobienia (niski priorytet): zaktualizować nazwy indeksów dla spójności (obecnie indeks na from_location_id, to_location_id można przemianować, ale nie ma to wpływu na funkcje – czysto porządkowe).

Przywrócenie Cancel w DB – Sprawdzić, czy procedura cancel_transfer_order() istnieje i działa (zapewne tak, patrz RPC). Upewnić się, że zmiana statusu na cancelled nie koliduje z integritami (np. czy nie ma constraint, że received_by wymagany jeśli received – nie dotyczy cancelled). W razie potrzeby, dopisać migrację korygującą takie zależności.

Dane testowe – (Pomocniczo) Upewnić się, że w środowisku deweloperskim są przykładowe lokalizacje i magazyny, by testować poprawność wyświetlania (np. locations z nazwami i przypisaniem do warehouses jeśli takie relacje istnieją).

Testy (Jednostkowe & Integracyjne)

Testy jednostkowe TO API – Stworzyć testy dla kluczowych operacji TransferOrdersAPI:

Tworzenie TO: czy zapisuje poprawnie nagłówek i pozycje, czy odrzuca żądanie gdy brakuje dostępnego stanu (jeśli walidacja inventory włączona – można zasymulować brak stanu).

Anulowanie TO: spróbować anulować draft TO – oczekiwany sukces (status = cancelled), spróbować anulować TO w statusie in_transit lub received – oczekiwana odmowa/błąd.

Operacja Mark as Shipped: wywołać (bezpośrednio lub poprzez update statusu) – sprawdzić czy ustawia actual_ship_date oraz zmienia status na in_transit.

Operacja Mark as Received: wywołać – sprawdzić czy ustawia actual_receive_date, status na received, a pola quantity_actual w pozycjach są wypełnione (np. równe quantity_planned w prostym przypadku).

Sprawdzenie pól użytkownika: utworzyć TO poprzez API (symulując zalogowanego usera), następnie oznaczyć jako odebrany – sprawdzić czy pole received_by zostało ustawione.

Testy integracyjne TO – Scenariusz: transfer między dwoma magazynami:

Utwórz TO (draft) API -> sprawdź status = draft.

Submit (jeśli istnieje etap zmiany statusu, ewentualnie pomiń jeśli od razu in_transit) -> Mark as Shipped -> sprawdź status zmieniony na in_transit, actual_ship_date ustawione.

Mark as Received -> sprawdź status = received, actual_receive_date ustawione, quantity_actual wypełnione.

Spróbuj anulować po odbiorze -> powinno być niedozwolone.

Nowy transfer, spróbuj anulować na etapie draft -> powinno się udać, status = cancelled.

Testy importu z Excel – Jeśli zaimplementowany import, przygotować plik Excel z kilkoma pozycjami i zasymulować jego przetworzenie w ramach testów integracyjnych UI lub jednostkowo logikę parsowania (np. funkcja pomocnicza). Sprawdzić, czy dodane zostaną właściwe pozycje i czy API przyjmie je bez błędów.

Testy interfejsu użytkownika – (Opcjonalne manualne) Zweryfikować w aplikacji:

Poprawność wyświetlania lokalizacji po wprowadzeniu fixu (czy pokazuje dokładnie zdefiniowaną lokalizację).

Działanie przycisków Cancel (ponownie dodanego) – czy rzeczywiście usuwa transfer z listy i zmienia status.

Działanie całego flow: utworzenie transferu -> oznaczenie wysyłki -> oznaczenie odbioru, obserwując zmiany statusów i dat w UI.

### 3.4 ASN Management (Advanced Shipping Notice)

**Status: 🔄 ~30% ukończone – Podstawy obsługi ASN są zaczęte (modal dodawania ASN i zapis danych), jednak pełna integracja z przepływem przyjęcia dostawy (GRN) i obsługa wyjątków ilościowych jest w toku. Należy dokończyć walidacje i powiązania, aby moduł ASN sprawnie łączył zamówienia zakupu z przyjęciami.**

UI (Frontend)

UploadASNModal – Modal dodawania ASN (Awiza Dostawy) – zaimplementowano (formularz z polami: numer ASN, oczekiwana data dostawy, pozycje – produkt/ilość, ewentualnie załączniki). Wymaga przetestowania UX, czy poprawnie przekazuje po_id bieżącego zamówienia do API.

Integracja z PO – Przycisk Upload ASN przy zamówieniu zakupu otwiera modal ASN z powiązaniem do danego PO – działa (po dodaniu ASN można w logice backend powiązać go z PO poprzez po_id).

Wskaźniki ASN w UI – (Opcjonalnie) Po dodaniu ASN dla danego PO, można rozważyć dodanie oznaczenia w tabeli PO (np. ikonka/state “ASN submitted”) – do rozważenia jako ulepszenie UX (niekonieczne na MVP).

Obsługa wyjątków w UI – Jeśli wystąpią różnice ilości (ASN vs PO), UI (np. w szczegółach PO lub podczas tworzenia GRN) powinien to zasygnalizować. Na MVP można ograniczyć się do komunikatów w momencie zamykania PO/przyjęcia dostawy.

API (Endpoints & Logika)

ASNsAPI.create – Tworzenie ASN – zaimplementowano częściowo (zapisuje ASN z pozycjami do tabel asns i asn_items). Należy rozszerzyć logikę o powiązanie z PO i walidacje:

Jeśli po_id jest podane przy tworzeniu ASN, sprawdź czy wskazane PO istnieje i jest w statusie pozwalającym na dodanie ASN (np. confirmed). Zapisz powiązanie (jeśli dodamy kolumnę po_id do ASN – patrz DB).

Waliduj, że wszystkie pozycje ASN (asn_items) odpowiadają pozycjom w danym PO: tzn. każdy product_id z ASN musi być zamówiony w PO, a quantity ASN nie może przekraczać zamówionej ilości tego produktu. W razie naruszenia – zwróć błąd (np. “ASN contains item not in PO” lub “ASN quantity exceeds ordered amount”).

ASNsAPI.getAll/getById – Pobieranie ASN – zaimplementowano podstawowo (zwraca listę wszystkich ASN lub pojedynczy ASN). Można rozszerzyć, by np. filtrować ASN po dostawcy lub po powiązanym PO.

Logika statusów ASN – Ustalić i zaimplementować przejścia statusów dla ASN: draft → submitted → confirmed → received → closed. Aktualnie tworzony ASN może domyślnie być submitted (jeśli od razu traktujemy zgłoszone). Gdy powstanie powiązany GRN, ASN powinno przejść na received/closed. Należy:

Dodać mechanizm aktualizacji statusu ASN na received w momencie utworzenia GRN powiązanego z tym ASN (np. w procedurze tworzenia GRN sprawdzić, czy istnieje ASN z danym po_id i zmienić jego status).

Jeśli dopuszczamy wiele ASN na jedno PO, status ASN zmieniamy indywidualnie gdy dany ASN zostanie w całości zrealizowany (np. jedna dostawa).

Integracja ASN → GRN – Po zaimplementowaniu ASN, dostosować tworzenie GRN tak, aby wykorzystywało dane ASN:

CreateGRN (GRNsAPI.create): jeżeli dla danego PO istnieje ASN ze statusem submitted/confirmed, w procesie tworzenia GRN pobierz pozycje z ASN jako domyślne ilości do przyjęcia. Zapewnij, że GRN tworzony zawiera referencję do ASN lub przynajmniej do PO. (Można rozważyć rozszerzenie grns o asn_id – patrz DB.)

Podczas tworzenia GRN, porównaj ilości przyjęte z ilościami ASN: jeśli quantity_received > quantity (ASN) dla pozycji, oznacz to jako over-shipment (można zwrócić ostrzeżenie lub błąd – decyzja: prawdopodobnie nie pozwalamy przyjąć więcej niż awizowano lub więcej niż zamówiono).

Po utworzeniu GRN, automatycznie:

Zmień status powiązanego PO na received lub closed w zależności od tego, czy uznajemy zamówienie za kompletne. Jeśli przyjęto pełne ilości ze wszystkich pozycji (lub dopuszczamy częściowe zamknięcie), ustaw closed. W przypadku częściowych dostaw, można pozostawić PO w statusie confirmed oczekujące na resztę – jednak dla MVP zakładamy jedna dostawa na PO, więc możemy zamknąć.

Zaktualizuj status ASN na received/closed.

Wygeneruj powiązane License Plates (LP) dla każdej pozycji (to już się dzieje w CreateGRNModal/GRNsAPI – tworzy wpisy w license_plates dla odebranych partii).

Obsługa różnic ilości (Quantity differences) – Zaimplementować logikę obsługi rozbieżności między zamówioną a odebraną ilością dla pozycji (short shipment / over shipment):

Undershipment (short): Jeśli dostawca wysłał mniej (ASN/GRN quantity < PO quantity), decyzja biznesowa: czy PO zamykamy z brakującą ilością (traktujemy jako anulowaną część zamówienia), czy pozostawiamy PO otwarte na brakującą ilość? Propozycja: Dla MVP, jeśli jakakolwiek pozycja nie została w pełni dostarczona, mimo to pozwalamy zamknąć PO (oznaczając niedostarczone ilości jako anulowane). Można ewentualnie dodać wpis do log (np. tabeli po_correction lub purchase_orders.notes) że zamówienie zrealizowano częściowo.

Overshipment: Jeśli dostarczono więcej niż zamówiono (nie powinno mieć miejsca przy prawidłowym ASN), API GRN powinno obciąć do zamówionej ilości lub zablokować taką operację. Najlepiej: nie pozwolić przyjąć >100% zamówienia – zwrócić błąd w walidacji GRN.

Po przetworzeniu GRN, upewnij się, że pole quantity_received w grn_items odzwierciedla faktycznie odebrane ilości, a quantity_ordered jest dla odniesienia. Różnica może być wyliczona i zapisana gdzieś (np. w grn_items dodatkowo można dodać pole quantity_diff dla wygody, ale niekonieczne).

Notifications/Alerts – (Rozszerzenie) Można przewidzieć mechanizm powiadomienia użytkownika o dostawie: np. gdy ASN zmieni status na received (dostawa w drodze) – ale to już poza MVP, ewentualnie do Rozszerzeń.

Database (Schemat & Dane)

Tabela asns – Zawiera podstawowe pola: asn_number, supplier_id, expected_delivery (data oczekiwana), status – jest (ale brakuje po_id). Migracja: dodać kolumnę po_id INTEGER REFERENCES purchase_orders(id) do tabeli asns aby powiązać ASN z zamówieniem (optional, ale ułatwi zapytania i integralność). Jeśli nie dodajemy kolumny, powiązanie istnieje tylko w asn_items -> product_id -> purchase_order_items -> po_id, co jest pośrednie i mniej efektywne.

Tabela asn_items – Zawiera pozycje ASN: asn_id powiązany z ASN, product_id, quantity – jest (schema wspiera listę pozycji).

Tabela grns – Zawiera po_id (powiązanie do zamówienia) i supplier_id – jest, umożliwia powiązanie przyjęcia z zamówieniem.

Tabela grn_items – Ma kolumny quantity_ordered i quantity_received – jest, służy do odnotowania ile zamówiono vs ile przyszło dla danej pozycji. To wspiera naszą logikę różnic – różnicę można obliczyć na podstawie tych dwóch pól.

Relacje – Sprawdzić spójność kluczy obcych:

asn_items.asn_id → asns.id – OK.

asn_items.product_id → products.id – OK.

(Po dodaniu asns.po_id) asns.po_id → purchase_orders.id.

grns.po_id → purchase_orders.id – OK.

Brak direct grn_items → asn_items relacji, co zrozumiałe – powiązanie jest przez produkt i po.

Statusy w słownikach – Upewnić się, że jeśli są zdefiniowane enumeracje/statusy na poziomie bazy (np. poprzez status text + constraint lub enum type), to dodano wartości dla ASN (np. 'submitted', 'received'). Jeśli nie – można opierać się na konwencji w aplikacji.

Cleanup – Jeśli w kodzie usunięto logikę “preferred supplier” (wspomniane preferred_supplier_id w products, czy tabela supplier_products), można docelowo oczyścić schemat z nieużywanych elementów po stabilizacji MVP. Np. tabela supplier_products jeśli nie jest używana do niczego (tylko referencyjnie była dla cen), może zostać pominięta na razie.

Testy (Jednostkowe & Integracyjne)

Testy jednostkowe ASN API – Napisać testy dla tworzenia ASN:

Utworzenie ASN dla prawidłowego PO: sprawdź że zapisuje ASN i pozycje, status początkowy jest prawidłowy (submitted), a po_id został powiązany jeśli kolumna istnieje.

Walidacja pozycji: spróbuj utworzyć ASN z pozycją, która nie należy do PO – oczekuj błąd. ASN z nadmiarem ilości – oczekuj błąd.

Wielokrotne ASN: utwórz dwa ASN dla tego samego PO (jeśli dozwolone) z rozdzielonymi pozycjami – upewnij się, że oba się zapisują (lub jeśli zdecydowaliśmy 1 PO = 1 ASN, to drugi powinien być zablokowany).

Testy integracyjne ASN/GRN – (Częściowo pokryte w scenariuszu PO->ASN->GRN wyżej, ale tutaj skup na logice różnic):

Stwórz PO z jedną pozycją, ilość 100.

Wystaw ASN na 80 – sprawdź, że ASN powstało.

Wystaw GRN na 80 – sprawdź: PO zamknięte, quantity_ordered=100, quantity_received=80 w grn_items, różnica 20 zapisana (pośrednio). PO status closed lub received (zgodnie z implementacją).

Sprawdź, że ASN status zmienił się na received/closed.

Spróbuj wystawić kolejny GRN na pozostałe 20 (jeśli wspieramy multi-GRN) – jeśli nie wspieramy, API powinno to uniemożliwić bo PO już zamknięte.

Stwórz drugi PO, ASN=100 (pełna zgodność), GRN=110 (nadwyżka) – oczekuj, że GRN API odrzuci nadwyżkę (test powinien dostać błąd).

Testy integracyjne anulowania – Upewnić się, że można anulować PO z ASN:

Stwórz PO, dodaj ASN, następnie spróbuj anulować PO – powinno być niedozwolone, ponieważ istnieje ASN/oczekująca dostawa (o ile taka logika ma być wprowadzona – do rozważenia: obecnie anulacja PO blokowana jest przy istnieniu GRN, ASN niekoniecznie blokuje anulację, ale może powinna). W razie potrzeby zaimplementować: test będzie wskazówką czy dodać walidację “jeśli jest ASN, nie anuluj PO bez usunięcia ASN”.

Testy integracyjne – pełny flow z różnicą – Połączyć wszystko: utworzyć PO, ASN (mniej), GRN (więcej niż ASN, ale ≤ PO) – spodziewany wynik: powinno przyjąć tylko do zamówionej ilości. Sprawdzić finalne statusy i dane.

Testy manualne – Po wdrożeniu, przetestować ręcznie scenariusze w UI:

Dodanie ASN do PO, sprawdzenie czy pojawia się w bazie.

Przyjęcie dostawy (GRN) dla PO z ASN: czy modal GRN domyślnie pokazuje ilości z ASN, czy trzeba przepisywać.

Czy po przyjęciu, statusy się zmieniają (PO zamknięte, ASN zakończone) i czy nie ma błędów typu pozostawione draft ASN itp.

Rozszerzenia na później (Post-MVP Enhancements)

(Poniższe funkcjonalności nie są krytyczne dla pierwszego wdrożenia MVP modułu Planning, ale zostały zidentyfikowane jako potencjalne rozszerzenia usprawniające system w przyszłości):

GRN & LP pełna integracja – Rozbudowa obsługi przyjęć towaru (GRN) i powiązanych etykiet logistycznych (License Plates) poza minimalny zakres. Np. obsługa wielu GRN na jedno PO, możliwość edycji GRN, powiązanie wielu LP z pojedynczym ASN/GRN. Dodatkowo, rozważenie automatycznej rejestracji LP już na etapie ASN (jeśli dostawca przekazuje numery palet).

Traceability (Śledzenie partii) – Integracja modułu Planning z modułem Traceability. Np. powiązanie dostaw (ASN/GRN) z genealogią partii: automatyczne tworzenie wpisów trace dla otrzymanych surowców (skąd przyszły, od jakiego dostawcy – co już częściowo wynika z danych). Rozszerzenie UI o możliwość przejścia z PO/GRN do widoku genealogii (trace forward/backward) materiałów.

Bulk Validation – Funkcjonalność masowego zatwierdzania/walidacji dokumentów. Np. możliwość jednoczesnego zatwierdzenia wielu zamówień zakupu lub wielu zleceń produkcyjnych. Przydatne przy operacjach hurtowych – wymaga dodania akcji grupowych w UI i odpowiednich endpointów (lub rozszerzenia istniejących na batch).

Automatyczne ASN – W przyszłości integracja z dostawcami lub system EDI umożliwiający automatyczne generowanie ASN. Np. kiedy użytkownik zatwierdzi zamówienie zakupu, system mógłby automatycznie wygenerować szkic ASN na pełną zamówioną ilość, oczekując potwierdzenia od dostawcy. Alternatywnie, import ASN z pliku od dostawcy. Ta funkcjonalność usprawni proces, ale wymaga integracji z zewnętrznymi danymi.

Workflow zatwierdzania – Wprowadzenie formalnego procesu akceptacji dla PO/WO (jeśli wymagane): np. status approved_by faktycznie używany – dodanie mechanizmu wysyłania do akceptacji, akceptowania przez uprawnionego użytkownika, z logowaniem czasu i osoby (wspierane przez kolumny w DB, wymaga logiki w API/UI).

Raporty i analizy Planning – Po dopięciu MVP, można dodać raporty: np. On-Time Delivery (terminowość dostaw od dostawców, porównując expected_delivery vs rzeczywiste daty GRN), analiza poziomu realizacji zamówień (ile % pozycji dostarczono pełnych, ile anulowano). To wymaga zebrania danych z PO, ASN, GRN i przedstawienia w formie tabel/wykresów.

Testy E2E i wydajnościowe – Po ustabilizowaniu funkcjonalności, rozszerzyć testy o scenariusze end-to-end (np. z użyciem narzędzi typu Cypress/Playwright do testowania całej aplikacji z poziomu UI) oraz testy wydajnościowe (np. jak system zachowuje się przy 1000+ WO/PO jednocześnie – czy filtry i paginacja działają wydajnie).

**Status: 🔄 ~30% complete - Modal done, full flow pending**

## 4.0 Production Module - Work Orders

⚠️ CRITICAL: Production Module jest tylko PODSTAWĄ - istnieją tabele, NIE kompletny moduł!

### 4.1 Work Order Execution (Schema & Basic API)

  - ⬜ 4.1.1 WO operations tracking (wo_operations table)

  - ⬜ 4.1.2 WO materials snapshot (wo_materials table)

  - ⬜ 4.1.3 Production outputs tracking (production_outputs table)

  - ⬜ 4.1.4 Stage status calculation (API level)

  - ⬜ 4.1.5 Sequential routing enforcement (API level)

  - ⬜ 4.1.6 Hard 1:1 rule (consume_whole_lp flag)

  - ⬜ 4.1.7 Cross-WO PR validation (API level)

  - ⬜ 4.1.8 Reservation-safe operations (API level)

**Status: 🔄 ~60% - Schema & API exist, UI incomplete**

### 4.2 Yield Tracking (Basic Tables ONLY)

  - ⬜ 4.2.1 PR yield API (with time bucket filtering)

  - ⬜ 4.2.2 FG yield API (with time bucket filtering)

[~] 4.2.3 YieldReportTab component (only basic table, NO charts) 🟢 P0

  - ⬜ 4.2.4 Yield calculations per operation (API only)

  - ⬜ 4.2.5 Time bucket selection (day/week/month)

  - ⬜ 4.2.6 Visual charts and analytics 🟢 P0

  - ⬜ 4.2.7 Trend analysis dashboard 🟢 P0

  - ⬜ 4.2.8 Yield export to Excel 🟢 P0

**Status: 🔄 ~50% - Basic API & table, NO dashboard/charts**

### 4.3 Consumption Tracking (Basic Tables ONLY)

  - ⬜ 4.3.1 Consume API (variance calculations)

[~] 4.3.2 ConsumeReportTab component (only basic table) 🟢 P0

[~] 4.3.3 Variance tracking (color-coded in table only) 🟢 P0

  - ⬜ 4.3.4 Material consumption per WO (API only)

  - ⬜ 4.3.5 ManualConsumeModal component

  - ⬜ 4.3.6 Visual consumption dashboard 🟢 P0

  - ⬜ 4.3.7 Variance analysis charts 🟢 P0

  - ⬜ 4.3.8 Consumption export to Excel 🟢 P0

**Status: 🔄 ~50% - Basic API & table, NO dashboard**

### 4.4 Operations Management (Basic Table ONLY)

[~] 4.4.1 OperationsTab component (only list, NO workflow) 🟢 P0

  - ⬜ 4.4.2 Per-operation weight tracking (API level)

  - ⬜ 4.4.3 RecordWeightsModal component

  - ⬜ 4.4.4 Operation completion workflow (API level)

  - ⬜ 4.4.5 1:1 validation in weight recording

  - ⬜ 4.4.6 Visual operations workflow 🟢 P0

  - ⬜ 4.4.7 Real-time operation status 🟢 P0

  - ⬜ 4.4.8 Operations dashboard 🟢 P0

**Status: 🔄 ~50% - Basic components, NO visual workflow**

### 4.5 Production Dashboard & Analytics

  - ⬜ 4.5.1 Production overview dashboard 🟢 P0

  - ⬜ 4.5.2 Real-time monitoring 🟢 P0

  - ⬜ 4.5.3 Resource utilization charts 🟢 P0

  - ⬜ 4.5.4 Production KPIs visualization 🟢 P0

  - ⬜ 4.5.5 Production planning interface 🟢 P0

  - ⬜ 4.5.6 Performance analytics 🟢 P0

**Status: ⬜ Not started - Critical for production management**

## 4.0 Moduł Produkcji – Plan Implementacji (tłumaczenie)

Uwaga: Moduł Produkcji będzie integrowany z istniejącym systemem (nie jako osobna wtyczka), aby uwzględnić szeroki zakres zmian i aktualizacji. Przygotuj ewentualne aktualizacje schematu bazy poprzez migracje (np. dodanie pól) tak, by wspierały nową funkcjonalność.

### 4.1 Realizacja Zleceń Produkcyjnych (rozszerzenia schematu i API)

Śledzenie operacji WO i materiałów: Wykorzystaj istniejące tabele wo_operations i wo_materials jako fundament wykonania zleceń. Zaimplementuj UI (np. OperationsTab w szczegółach WO), który listuje wszystkie operacje (wo_operations) z ich sekwencją, statusem i zarejestrowanymi wynikami. Upewnij się też, że szczegóły WO wyświetlają wymagania materiałowe z wo_materials (snapshot BOM: ilości wymagane oraz wystagowane), by użytkownik widział alokacje materiałów. To zapewnia widoczność każdej operacji i jej potrzeb materiałowych.

Obliczanie statusu etapów: Wykorzystaj metody API (np. WorkOrdersAPI.getWorkOrderStageStatus) do wyliczania statusu ukończenia każdego etapu/operacji w WO. Jeśli brak implementacji, utwórz logikę zwracającą operację bieżącą, ukończone i postęp całości. Będzie to użyte do pokazywania statusu w czasie zbliżonym do rzeczywistego w UI (np. pasek postępu lub lista etapów). API ma bazować na statusach wo_operations oraz ewentualnie zapisach w production_outputs, by ocenić, czy operacja ma zarejestrowane wyjście (oznaka ukończenia).

Wymuszanie sekwencyjnego routingu: Wymuś, aby operacje były kończone w zdefiniowanej kolejności. Na poziomie API zabezpiecz endpoint kończenia operacji (np. completeOperation), aby operacja o sekwencji n nie mogła zostać ukończona, zanim n-1 będzie ukończona. Próby „poza kolejką” zwracają błąd/ostrzeżenie. To egzekwuje regułę biznesową Sequential Processing.

Twarda zasada 1:1 (consume_whole_lp): Zaimplementuj regułę consume_whole_lp dla komponentów wymagających konsumpcji całej jednostki/LP. Flaga na poziomie składnika BOM lub wpisu wo_materials powinna oznaczać, że dany materiał musi być zużyty w całości (np. całe LP). Zaktualizuj logikę konsumpcji: jeśli flaga jest ustawiona, system pozwala użyć tylko jednego, całego LP na jedną operację wyjściową – bez konsumpcji częściowej. Jeśli operacja daje wiele wyjść, każde powinno mieć własne pojedyncze wejście LP (bez mieszania). Niespełnienie → błąd.

Walidacja między-WO (Cross-WO): Dodaj kontrole zapobiegające mieszaniu materiałów pomiędzy różnymi WO. Upewnij się, że materiały/wyroby pośrednie zarezerwowane/wyprodukowane dla jednego WO nie są konsumowane w innym bez jawnego powiązania. Przy rejestracji konsumpcji/ukończenia operacji waliduj, że wejściowe LP należą do rezerwacji tego WO lub są nieprzypisanym stanem. Zachowuje to integralność genealogii i unika niezamierzonego mieszania.

Operacje bezpieczne względem rezerwacji: Zanim pozwolisz rozpocząć/ukończyć operację, zweryfikuj, że wymagane materiały są wystagowane/zarezerwowane. Użyj lp_reservations, by sprawdzić, czy WO i dana operacja mają zarezerwowane LP. API powinno odmawiać startu/ukończenia, jeśli brakuje rezerwacji lub są niewystarczające. To egzekwuje Reservation System i zapobiega niespójnościom stanów.

Integracja z terminalem/skanerem: Większość funkcji będzie wywoływana z terminala produkcyjnego. Upewnij się, że metody WorkOrdersAPI (np. recordWeights, completeOperation) są dostępne i przetestowane z UI skanera. Operator powinien móc skanować i uruchamiać te akcje. UI musi być uproszczone (duże przyciski, minimum wprowadzania) dla terminali – dedykowane formularze/modale w StageBoard lub pokrewnych.

Rejestrowanie wyników (outputs): Kontynuuj użycie production_outputs do logowania wyników i odpadu dla każdej operacji. Przy ukończeniu operacji zapisuj wo_id, sekwencję, output_qty, waste_qty. To zasili obliczenia wydajności (yield). API ma uzupełniać tę tabelę przy YieldAPI.recordYield lub completeOperation z danymi o wydajności. Zaktualizuj też wo_operations.status na „completed” i przechowuj metryki yield dla szybkiego dostępu.

Ostrzeżenia przy zamknięciu WO: Przy finalizacji WO (status completed po ostatniej operacji) waliduj bilans. Jeśli sumaryczne wyjście vs plan różni się albo nie wszystkie materiały zużyto, pokaż ostrzeżenie. Pozwalamy zakończyć, ale sygnalizujemy i umożliwiamy wpis przyczyn lub korektę przez manualne zużycie. To zasili późniejsze raporty niezgodności.

### 4.2 Śledzenie Wydajności (Yield – raportowanie wyników)

Endpointy Yield API: Rozszerz YieldAPI o raportowanie na dwóch poziomach: (a) PR yield (operacje/wyroby pośrednie) i (b) FG yield (wyrobów gotowych) – oba z filtrowaniem czasowym (dzień/tydzień/miesiąc). PR yield raportuje procenty na poszczególnych etapach/operacjach; FG yield – finalną wydajność WO/produktu. Agreguj sumy/średnie dla okresów.

Obliczenia yield per operacja: Przy zapisie yield licz procent i procent odpadu na etapie. Yield% = (Output Qty / Required Qty) × 100. „Required” to oczekiwany wynik/wejście dla operacji (wg BOM/routingu). Przy recordYield/completeOperation oblicz i zapisz (np. w production_outputs lub wo_operations.yield_data). Oblicz yield skumulowany dla finalnego FG: iloczyn yieldów operacji. Udostępnij w FG yield API.

Komponent YieldReportTab (tabela): Zakończ YieldReportTab jako prostą tabelę. Widoki:

Lista WO z finalnym yield% (oraz output/waste).

Opcjonalny breakdown per operacja dla wybranego WO lub przekrojowo.

Kolumny: WO, produkt, data zakończenia, output, waste, yield%.

Filtrowanie po okresie (przełącznik dzień/tydzień/miesiąc), paginacja/grupowanie wg potrzeb.

Wybór kubełków czasu: Dodaj w UI przełącznik/selector: Dzienny, Tygodniowy, Miesięczny, lub zakres niestandardowy. API przyjmuje typ kubełka lub zakres i agreguje. Na start wystarczą dzienny i miesięczny. API może zwracać też metryki podsumowujące (średni yield, całkowity waste) do nagłówka tabeli.

Prosty wykres Yield: Dodaj co najmniej jeden prosty wykres (np. linia trendu yield% w czasie dla zakresu) lub słupek/pie good vs waste. Minimalny, bez rozbudowanej analityki – zdefiniuj typy TS dla danych wykresu.

Eksport do Excel (Yield): (Później) Dodaj przycisk „Export to Excel”. Zaprojektuj API tak, by łatwo produkowało CSV/XLSX (rekordy z jednoznacznymi polami).

Przyszła analityka Yield: Post-MVP rozbuduj do pełnego dashboardu:

Trend Analysis: długie okresy, porównania per produkt/linia.

Straty per operacja: słupki waste% per etap.

Dystrybucja yield: histogram zmienności.

Wymaga bibliotek wykresów i typów TS (zgodnie z wymaganiami type-safety). Na teraz kluczowe jest poprawne gromadzenie danych.

### 4.3 Śledzenie Konsumpcji (zużycie materiałów i odchylenia)

Implementacja Consume API: Rozszerz ConsumeAPI o obsługę zdarzeń konsumpcji i wyliczenie odchyleń. Po ukończeniu operacji (lub zapisie yield) system automatycznie rejestruje zużycie materiałów tej operacji:

Zmniejsz ilości na LP lub oznacz LP jako skonsumowane (dla 1:1 – do 0).

Przy konsumpcji częściowej (tam gdzie dozwolone) zaktualizuj LP z ilością pozostałą.

Utwórz zapisy genealogii łączące wejściowe LP z wyjściowym LP (tabela typu lp_genealogy).

Rozważ dodanie consumed_qty w wo_materials (migracja) dla łatwiejszego raportowania. W przeciwnym razie konsumpcja może być wnioskowana po pozostałościach – ale jawne pole upraszcza raporty.

Oblicz natychmiast odchylenie dla każdego materiału: variance = consumed_qty – required_qty. Konsoliduj przy zamknięciu WO lub inkrementalnie.

ManualConsumeModal (korekty): Zbuduj ManualConsumeModal do ręcznego dopisania zużycia (na końcu WO lub w trakcie). Przykłady:

BOM wymagał 100 kg, użyto +5 kg ekstra → wpis 5 kg.

Materiał zniszczony → dopisz do zużycia/odpadu.

Modal listuje materiały BOM z required vs consumed i pozwala edytować consumed lub dodać waste. Po zapisie ConsumeAPI aktualizuje rejestry i odchylenia.

Dla 1:1: jeśli otwarto LP i nie zużyto w pełni – czy reszta to waste czy nowy LP resztkowy? Do decyzji biznesowej. Na teraz załóż: pozostałość dla 1:1 traktujemy jako waste (jeśli reguła zabrania częściowego użycia).

ConsumeReportTab (tabela odchyleń): Zbuduj ConsumeReportTab jako tabelę zużycia vs plan z wyróżnieniem odchyleń:

Wiersze per materiał w WO (grupowanie wg WO) lub płaskie – wybierz czytelniejszy wariant.

Kolumny przykładowe: WO, Materiał, Required, Consumed, Variance.

Koloruj variance: nadkonsumpcja (dodatnie) czerwony, niedokonsumpcja (ujemne) zielony/niebieski, zero neutralnie.

Pokaż output WO jako kontekst (korelacja z yield).

Filtrowanie po czasie (dzień/tydzień/miesiąc); paginacja.

Logika odchyleń: Backend:

Material Variance: dla każdego wpisu wo_materials licz consumed_qty - required_qty. Możesz zapisać lub wyliczać „on-the-fly” do raportu.

Yield Variance: odchylenie wyjścia (actual vs plan) uzupełnia obraz; yield w raporcie yield.

Upewnij się, że waste (odpady) jest wliczony do consumed (bo to materiał zużyty, choć nie „good”).

Aktualizacje stanów i traceability: Po konsumpcji:

Aktualizuj license_plates (ilości/stan).

Dla nowych LP wyjściowych (z completeOperation) zapewnij wpisy i genealogie wejście→wyjście.

Operacje konsumpcji + output + inwentarz transakcyjnie (all-or-nothing).

Raporty czasowe konsumpcji: Podobnie jak yield, filtruj po czasie:

Dzienny: zużycie dziś vs plan dla dzisiejszych ukończonych WO.

Tygodniowy/Miesięczny: sumy required i consumed w oknie czasu.

Dodaj wiersz sumaryczny: „Total variance w okresie: …”.

Eksport Excel (Consumption): (Później) Dodaj eksport tabeli konsumpcji do Excel/CSV.

Przyszła analityka konsumpcji: Post-MVP Consumption Dashboard:

Top materiały z największym odchyleniem.

Serie czasowe zużycia vs plan.

Wpływ kosztowy (jeśli dostępne koszty).

Tagowanie przyczyn odchyleń (scrap, rework itp.) – spójne z raportami niezgodności.

### 4.4 Zarządzanie Operacjami (workflow i UI)

Komponent OperationsTab: W szczegółach WO wyświetl listę operacji (wo_operations) – prosta tabela (brak „workflow graficznego” na start). Kolumny: nazwa operacji (ze słownika/routingu), sekwencja, maszyna (jeśli przypisana), status (planned/in_progress/completed), metryki (np. output/yield%). Wyróżnij operację bieżącą.

Start/Complete Operation: Zaimplementuj uruchamianie i kończenie operacji:

Start może ustawiać wo_operations.status = in_progress (jeśli śledzimy jawnie). Waliduj rezerwacje materiałów (staged).

Complete = WorkOrdersAPI.completeOperation(woId, seq, data):

Sprawdź sekwencję (poprzednia ukończona).

Sprawdź ewentualny QA (przyszłe rozszerzenie – na razie pomiń lub ostrzegaj).

Konsumuj wejścia (ConsumeAPI) i rejestruj wyjścia (YieldAPI).

Zapisz wagi/ilości, ustaw „completed”, przejdź do następnej.

UI: operator wyzwala „Complete” (skaner/przycisk). RecordWeightsModal (niżej) przechwytuje dane.

Śledzenie wag per operacja: Dla procesów wagowych:

Rozszerz zapis yield o wagę (gdy jednostką produktu jest waga). output_qty reprezentuje odpowiednią jednostkę (szt./kg). UI czytelnie opisuje jednostkę.

RecordWeightsModal: modal do wpisu wagi/ilości oraz odpadu. Pokazuje oczekiwane i pozwala wprowadzić faktyczne. Po zatwierdzeniu wywołuje YieldAPI.recordYield lub completeOperation z danymi. Może pokazać wejściowe materiały do potwierdzenia.

Walidacje 1:1 w ważeniu: W modalu/ API egzekwuj 1:1:

Dla komponentu 1:1 użycie więcej niż jednego wejściowego LP dla jednego wyjścia – błąd.

Sprawdzenie bilansu masy: output_qty + waste_qty ≤ suma wejść. Przekroczenie → błąd.

Przy wielu wyjściach z jednego LP (w 1:1 najlepiej niedozwolone) – pilnuj sum.

Aktualizacja statusów w (quasi)-RT: Po ukończeniu operacji odśwież stan w UI (refetch/polling). WebSocket/SSE później; na MVP wystarczy odświeżanie ręczne/okresowe. Supervisor zobaczy zmiany bez przeładowań ręcznych (np. auto-refresh).

Prosta wizualizacja postępu: Lista + wyróżnienie bieżącej operacji; opcjonalnie pasek postępu („2/5 zakończone”). Wykorzystaj API „stage status”.

Przyszłe rozszerzenia workflow: Post-MVP:

Interaktywny workflow (diagram/kanban).

Real-time monitoring zbiorczy.

Operations Dashboard: czasy cykli, wąskie gardła; potrzebne znaczniki started_at/completed_at w wo_operations.

Punkty QA: blokady i akceptacje (dodatkowy stan „pending QA”).

### 4.5 Dashboard Produkcji i Analityka

Production Overview Dashboard: Zaprojektuj ekran przeglądowy:

Karty KPI: „WO w toku: X”, „Wyprodukowane dziś: N”, „Yield dziś: Y%”, „Waste dziś: Z%”.

Lista aktywnych WO: produkt, ilość, bieżąca operacja, ETA (opcjonalnie).

Odświeżanie okresowe (np. co 1 min).

Monitoring przybliżony do RT:

Wykorzystanie maszyn: jeśli machine_id w WO, pokaż które maszyny są zajęte vs wolne.

Throughput: ile WO zakończono dziś/tydzień.

Alerty: WO po terminie, operacja zbyt długo w toku (na razie proste progi).

Wykresy wykorzystania zasobów: Prosty słupek/wskaźnik dla zajętości maszyn (np. % maszyn z aktywnym WO). Na start liczba/tekst też wystarczy.

Wizualizacja KPI produkcji: Priorytetowe wskaźniki:

Yield, Throughput, On-time Delivery, Waste.

Na MVP – wartości liczbowe; później sparklines/strzałki trendu. Aktualizowane wraz z danymi (odświeżanie okresowe).

Link do planowania: Szybkie przejście do modułu Planning / tworzenia WO. Ewentualna podstawowa edycja z Dashboardu w przyszłości.

Zbieranie danych pod analitykę: Loguj kluczowe znaczniki czasu:

actual_start/actual_end w work_orders (jeśli brak – dodać).

started_at/completed_at w wo_operations.

To umożliwi KPI i wydajnościowe analizy w następnych etapach.

Przyszła analityka produkcji: Post-MVP rozbudowa:

Zaawansowane wykresy (produkcja w czasie, per produkt/maszyna/zmiana).

Trendy KPI (week-over-week vs cele).

Drill-down z KPI do raportów Yield/Consume.

Personalizowane panele. Projektuj teraz elastyczny layout.

Dodatkowe uwagi

Migracje & schema: W trakcie implementacji mogą być potrzebne zmiany w DB (np. consumed_qty w wo_materials, flaga consume_whole_lp na poziomie BOM; actual_start/actual_end w work_orders). Migracje muszą być kompatybilne wstecz i udokumentowane.

Integracja z istniejącymi modułami:

BOM z Planning → snapshot do wo_materials przy tworzeniu WO.

Stany magazynowe – aktualizacje poprzez LP; unikaj podwójnych odjęć gdzie indziej.

Traceability – zapisuj genealogie przy konsumpcji/produkcji, by TraceabilityAPI miał dane.

Jakość – odpady/odchylenia będą zasilały raporty jakości; flaguj scrap/waste jednoznacznie.

Walidacje i komunikaty:

Brak rezerwacji → błąd („Materials not staged/reserved…”).

Yield > 100% lub dane nierealne → ostrzeżenie/odrzucenie.

Zamknięcie WO przy niewykorzystanych rezerwacjach → prompt do zwrotu na stan lub oznaczenia jako waste (ManualConsumeModal).

To poprawia jakość danych i redukuje potrzebę „pełnej weryfikacji” później.

Wydajność: Indeksy pod filtry czasowe/statusy; paginacja w UI dla dużych zakresów. Konsumpcja/yield/inwentarz – transakcyjnie. Uwaga na konflikty rezerwacji.

Testy:

Yield workflow: API poprawnie tworzy production_outputs, liczy yield, aktualizuje statusy; przypadki brzegowe (0 output, 100% yield).

Consumption & variance: konsumpcja po operacji aktualizuje consumed i variance; nadkonsumpcja zaznaczona.

Sekwencja: kończenie poza kolejnością – blokowane.

1:1: użycie >1 LP dla 1:1 – błąd.

Testy regresji przy rozszerzeniach.

Dokumentacja & szkolenia: Zaktualizuj przewodnik modułu Produkcji o nowe API/UI. Opisz korzystanie z raportów Yield/Consume i interpretację odchyleń. Rozważ krótki manual dla operatorów (start/complete, ważenie, błędy). Dodaj typy TS dla danych wykresów/raportów (wymogi type-safety).

Plan funkcji post-MVP: Utrzymuj listę TODO (w TODO2.md/tracker) dla przyszłych rozszerzeń (dashboardy, analityka, QA). Ten plan pokrywa krytyczne P0 (egzekucja, podstawowe yield & consumption). KPI/analizy/trace wizualny – następne fazy. Projektuj teraz z myślą o łatwym rozszerzaniu.

Pytania otwarte (doprecyzowanie)

Szczegóły walidacji Cross-WO: Czy chodzi o blokadę zużycia zarezerwowanych surowców/PR z jednego WO w innym bez jawnego powiązania? Potwierdź, aby poprawnie ustawić kontrole.

„G/A” przy zamknięciu WO: Czy „G/A” = Good/Accepted vs waste? Rejestrujemy output_qty i waste_qty per operacja. Czy na zamknięciu WO potrzebny dodatkowy krok potwierdzenia sumarycznego Good/Waste? Czym różni się to od sumy operacji? Może to związać z akceptacją jakościową – proszę o doprecyzowanie.

Obsługa nadstagingu: Jeśli wystagowano więcej niż finalnie zużyto (np. 110 vs 100), czy system ma proponować zwrot na stan (consumed=100, variance=0, 10 wraca) czy liczyć niezużyte jako niedokonsumpcja (variance ujemne)? Czy pozostałość tworzy nowy LP resztkowy, czy pozostaje na tym samym LP? Jasne reguły są kluczowe dla inventory i raportów.

Zakres wymuszania consume_whole_lp: Czy reguła dotyczy wybranych pozycji BOM (flaga per pozycja) czy klas materiałów? Gdzie definiujemy flagę (BOM vs produkt)? Jeśli LP zawiera więcej niż potrzeba, a reguła wymaga całości – czy nadwyżka automatycznie staje się waste? (domyślnie tak, jeśli częściowe użycie jest zabronione).

Mechanizm „real-time”: Czy na Dashboardzie wymagamy push (WebSocket/SSE) już teraz, czy wystarczy odświeżanie okresowe na MVP? Push wymaga dodatkowej infrastruktury – preferujemy polling, o ile nie ma twardego wymagania RT.

Interfejs planowania produkcji: W Dashboardzie Produkcji wystarczy link do modułu Planning, czy przewidujemy tworzenie/planowanie WO bezpośrednio stąd? To zdeterminuje, czy potrzebujemy elementów planowania w tym module.

Priorytety KPI: Które KPI są najważniejsze na start (yield, waste, on-time, wykorzystanie maszyn…)? Proszę o ranking – ułatwi to priorytetyzację elementów Dashboardu.

## 5.0 Moduł Warehouse – Gospodarka Magazynowa

Moduł Warehouse (magazyn) odpowiada za pełne zarządzanie ruchem towarów: przyjęcia (GRN), wydania i przesunięcia (Stock Moves, Transfer Orders), śledzenie stanów magazynowych przy pomocy License Plates (LP), obsługę lokalizacji, oraz integrację z terminalami skanującymi.
Poniżej znajduje się kompletny plan implementacyjny, opracowany w oparciu o Twoje odpowiedzi, z priorytetami i zakresem prac dla każdej funkcji.

### 5.1 Goods Receipt Notes (GRN) — Przyjęcia Towaru

  - ⬜ 5.1.1 Tabela GRN — utworzyć tabelę w bazie danych do przechowywania nagłówków przyjęć:
  Kolumny: grn_number, po_id, status, created_by, created_at.

  - ⬜ 5.1.2 Tabela pozycji GRN (GRN items) — przechowuje szczegóły każdej pozycji dokumentu przyjęcia:
  Kolumny: grn_id, product_id, qty_ordered, qty_received, uom, batch_number.

  - ⬜ 5.1.3 Komponent GRNTable — tabela w UI listująca wszystkie GRN, z informacjami o numerze, powiązanym PO, statusie i dacie utworzenia.
  Wymaga dopracowania (🟢 P0 — 0.5 dnia).

  - ⬜ 5.1.4 Komponent GRNDetailsModal — okno z detalami GRN (linie, ilości, statusy, użytkownik).
  Należy sprawdzić i uzupełnić brakujące dane (🟢 P0 — 0.5 dnia).

  - ⬜ 5.1.5 Komponent CreateGRNModal — formularz do tworzenia GRN powiązanego z PO lub TO, z listą produktów i ilościami.
  Weryfikacja pól, walidacja ilości i zapisu (🟢 P0 — 0.5 dnia).

  - ⬜ 5.1.6 Integracja przepływu ASN → GRN — umożliwić automatyczne tworzenie GRN na podstawie przychodzącego ASN (Advanced Shipping Notice) zarówno od dostawcy (PO), jak i z innego magazynu (TO).
  Przyjęcie ASN powinno generować GRN z wszystkimi oczekiwanymi pozycjami i ilościami.
(🟢 P0 — kluczowe dla MVP).

  - ⬜ 5.1.7 Automatyczne generowanie LP przy GRN — w momencie przyjęcia (zatwierdzenia GRN) system automatycznie tworzy License Plate (LP) dla każdej unikalnej partii lub palety.
  Każda pozycja GRN powinna otrzymać unikalny numer LP zgodny z przyjętym formatem (np. WOnnnnSS) (🟢 P0).

  - ⬜ 5.1.8 Przypisanie lokacji podczas GRN — po utworzeniu LP, system automatycznie przypisuje im lokację magazynową na podstawie reguł z 5.4.4.
  Operator ma możliwość potwierdzenia lub zmiany lokacji w terminalu (🟢 P0).

📍 Status: 🔄 ~60% ukończone — podstawowe tabele i komponenty istnieją, brakuje pełnego przepływu ASN/TO → GRN oraz automatycznego przypisania LP i lokacji.

### 5.2 License Plates (LP) — Jednostki Magazynowe

  - ⬜ 5.2.1 Tabela License Plates — zawiera informacje o każdej jednostce magazynowej:
  lp_number, product_id, quantity, uom, qa_status, location_id, parent_lp_id, created_from (GRN, TO, WO itp.).

  - ⬜ 5.2.2 Numeracja 8-cyfrowa LP (format WOnnnnSS) — każda jednostka ma unikalny numer LP z możliwością zeskanowania (barcode).

  - ⬜ 5.2.3 Relacje parent–child LP — system przechowuje relację między LP nadrzędnym (np. paletą) a podrzędnymi (np. kartonami).

  - ⬜ 5.2.4 Śledzenie składów LP (lp_compositions) — tabela do rejestrowania łączenia i rozdzielania LP (np. scalanie palet lub rozdział paczek).

  - ⬜ 5.2.5 Genealogia LP (lp_genealogy) — pełna historia pochodzenia LP: z jakiego GRN lub LP nadrzędnego powstało, jak było dzielone, łączone, przesuwane.

  - ⬜ 5.2.6 LPOperationsTable — komponent UI listujący operacje i historię LP.

  - ⬜ 5.2.7 AmendLPModal — okno do edycji LP (korekta ilości, zmiana QA statusu).

  - ⬜ 5.2.8 SplitLPModal — interfejs do podziału LP:

operator skanuje LP,

wpisuje ilość do przeniesienia,

skanuje nową lokalizację,

system tworzy nowe LP (dziecko) z wprowadzoną ilością,

drukuje etykietę dla nowego LP (🟢 P0).

  - ⬜ 5.2.9 TraceLPModal — interfejs do wyświetlania drzewa genealogicznego LP:
  pokazuje powiązania parent–child, lokalizacje, źródło (GRN, TO, WO) oraz daty zmian.

  - ⬜ 5.2.6–5.2.9 Przegląd UI LP (completeness pass) — dopracować szczegóły wszystkich komponentów LP, zwłaszcza Split i Trace:

potwierdzić pełny zapis parent–child,

automatyczny druk etykiety po split,

dopasować layout pod terminal (mobile view).
(🟢 P0 — 1.0 dnia).

📍 Status: ✅ ukończona logika bazowa, wymaga dopracowania UI i testów trace oraz split.

Dodatkowe uwagi:
Etykieta LP powinna zawierać:

nazwę produktu,

ilość, jednostkę,

numer LP (z kodem kreskowym),

informację o alergenach,

numer LP nadrzędnego lub źródło (np. GRN),

składniki (jeśli LP dotyczy produktu złożonego).

### 5.3 Stock Moves — Przesunięcia Magazynowe

  - ⬜ 5.3.1 Tabela stock_moves — zapisuje każde przesunięcie LP:
  lp_id, from_location_id, to_location_id, moved_by, status, timestamp.

  - ⬜ 5.3.2 Komponent StockMoveTable — tabela UI z listą przesunięć (filtry: oczekujące, zakończone, użytkownik, data).

  - ⬜ 5.3.3 StockMoveDetailsModal — szczegóły przesunięcia: kto, kiedy, z/do jakiej lokacji, powiązane LP.

  - ⬜ 5.3.4 CreateStockMoveModal — formularz do utworzenia ręcznego przesunięcia LP.

  - ⬜ 5.3.5 Interfejs mobilny Pick/Putaway (terminal) — zoptymalizowany pod skaner:

Pick: operator skanuje LP do pobrania,

Putaway: operator skanuje lokalizację docelową,

system aktualizuje location_id LP i zapisuje przesunięcie,

komunikaty w czasie rzeczywistym („Przeniesiono pomyślnie”, „Błąd: lokalizacja nieznana”).
(🟢 P0 — kluczowy element).

📍 Status: 🔄 ~80% ukończone — backend gotowy, interfejs mobilny w trakcie.

Uwagi:

Stock Move ≠ Transfer Order (TO):

Stock Move = przesunięcie wewnętrzne w jednym magazynie.

Transfer Order (TO) = przesunięcie między magazynami.
Przy wysyłce do innego magazynu system tworzy TO, a magazyn docelowy tworzy GRN na podstawie tego TO.

Jeśli przesuwamy tylko część ilości LP → wywołujemy proces Split LP (tworzenie nowego dziecka LP dla przesuwanej ilości).

### 5.4 Location Management — Zarządzanie Lokacjami

  - ⬜ 5.4.1 Tabela locations — kolumny: id, code, name, warehouse_id, type, parent_id, is_active.

  - ⬜ 5.4.2 Hierarchia magazynu — struktura stref → regałów → półek → pozycji.
  Relacja self-join (parent_id → locations.id).

  - ⬜ 5.4.3 LocationsTable (UI) — zarządzanie lokacjami (lista, edycja, hierarchia).

  - ⬜ 5.4.4 Reguły automatycznego przypisywania lokacji — logika systemowa (🟢 P0):

reguły przypisywania domyślnych lokacji wg typu produktu (np. mięso → Chiller, FG → FG-Out),

zapis reguł w tabeli settings,

przy GRN, TO, Split LP – automatyczne podpowiedzi lokalizacji,

możliwość nadpisania przez użytkownika,

walidacja pojemności i zgodności (np. alergenów lub materiałów niekompatybilnych).

📍 Status: 🔄 ~70% ukończone — CRUD gotowy, brakuje auto-reguł przypisania.

Integracja terminalowa (Mobile Scanner Flow)

Terminal będzie obsługiwał następujące procesy:

Przyjęcie GRN (z PO lub TO) – skan LP, zatwierdzenie ilości, przypisanie lokacji.

Przyjęcie TO (Transfer Order) – odbiór z innego magazynu, tworzenie LP.

Podział palet (Split LP) – skan LP → wprowadzenie ilości → skan lokacji docelowej → druk etykiety nowego LP.

Przesunięcia (Stock Move) – skan LP → skan lokacji → zatwierdzenie → aktualizacja.

Proces terminalowy QA (w przyszłości) – skan LP, weryfikacja statusu jakości, akceptacja lub blokada.

Pytanie otwarte

🔸 Integracja QA z magazynem:
Czy LP o statusie „QA Pending” mają być blokowane do momentu akceptacji?
Rekomendacja: przy GRN oznaczać nowe LP jako „Pending”, następnie dopuszczać do użytku po pozytywnej kontroli (QA Approved).
Pozwoli to powiązać przyszły moduł QA z Warehouse.

Propozycje rozszerzeń (P1–P2)

🟡 Integracja z drukarkami etykiet (ZPL/PDF) — automatyczne drukowanie LP po GRN i Split LP.

🟡 Raporty traceability (TraceTree) — wizualne drzewo genealogiczne LP: od GRN → Split → Transfer → zużycie.

🟡 Moduł QA w magazynie — kontrola jakości i blokady LP do momentu zatwierdzenia.

⚪ Reguły pojemności i stref bezpieczeństwa — ograniczenia ilościowe i przestrzenne dla lokacji (np. „max 20 LP w strefie Chiller”).

⚪ Raport „Inventory Aging” — raport starzenia się zapasów wg LP i dat GRN.

Podsumowanie

✅ Gotowe: struktury GRN, LP, Stock Moves, Locations, większość komponentów UI.
🔄 Do wykonania (P0):

Integracja ASN → GRN,

Automatyczne LP + przypisanie lokacji,

Interfejs mobilny terminala (Pick/Putaway/Split),

Reguły auto-lokacji,

Finalizacja UI LP (Split, Trace).

Plan integracji drukarek sieciowych i terminala skanującego w systemie MES
Integracja drukarek sieciowych (punkt 1)

Architektura druku etykiet: Wszystkie drukarki etykiet będą podłączone sieciowo w kluczowych punktach procesu (np. na stanowisku przyjęcia towaru, produkcji, pakowania). Dzięki temu aplikacja webowa będzie mogła wysyłać zadania drukowania bezpośrednio do drukarek przez sieć (np. adres IP drukarki lub centralny serwer druku). Planujemy wdrożyć system kolejkowania wydruków z mechanizmem ponawiania nieudanych prób, aby zapewnić niezawodność (jeśli drukarka jest chwilowo niedostępna, zadanie będzie ponawiane). Dodatkowo przewidziana jest integracja z drukarkami etykiet na poziomie aplikacji – np. wykorzystanie sterowników/SDK lub wysyłanie poleceń w języku ZPL/ESC do drukarek termicznych.

Szablony etykiet: Stworzymy uniwersalne szablony etykiet zawierające wszystkie wymagane informacje. Etykieta dla License Plate (LP) będzie zawierać m.in. numer LP, nazwę produktu, ilość, jednostkę oraz ewentualnie datę ważności partii. Na etykiecie znajdzie się kod kreskowy 1D (np. Code 128) reprezentujący kluczowy identyfikator – typowo numer LP lub numer partii. Szablony będą projektowane z myślą o spójności i czytelności. W przyszłości, jeśli zajdzie potrzeba, szablon może zostać rozszerzony o kod 2D (QR/DataMatrix) zawierający więcej danych (szczegóły w pkt 5).

Scenariusze drukowania:

Przyjęcie dostawy (GRN): Po zarejestrowaniu Goods Receipt Note i automatycznym wygenerowaniu nowych LP dla otrzymanych partii, system od razu wydrukuje etykiety dla tych LP. Każda paleta/partia otrzyma fizyczną etykietę z kodem.

Zakończenie operacji produkcyjnej: Gdy na terminalu produkcyjnym operator utworzy nowy LP (np. po ukończeniu etapu produkcji lub zapełnieniu pojemnika półproduktu), aplikacja umożliwi wydruk etykiety dla tego nowo powstałego LP.

Paletyzacja i wysyłka: Na stanowisku pakowania, po skompletowaniu palety (zebraniu wielu LP w paletę), będzie opcja wydruku etykiety paletowej z unikalnym numerem palety i kodem kreskowym/QR.

Każdy z tych punktów będzie miał przypisaną domyślną drukarkę sieciową. Użytkownik (lub konfiguracja systemu) określi, która drukarka obsługuje dane stanowisko. Aplikacja może oferować wybór drukarki lub automatycznie kierować wydruk na właściwe urządzenie według lokalizacji/stanowiska.

Automatyczne sugestie FIFO/FEFO (punkt 2)

Zasada FIFO/FEFO: W systemie zostanie zaimplementowana funkcja automatycznego sugerowania, które partie/LP użyć w pierwszej kolejności na podstawie zasady FIFO lub FEFO. FIFO (First In, First Out) oznacza rotację wg kolejności przyjęcia – najstarsze zapasy schodzą pierwsze. FEFO (First Expire, First Out) uwzględnia daty ważności – system sugeruje zużycie partii z najbliższym terminem przydatności do spożycia jako pierwszych. Możliwość wyboru strategii (FIFO vs FEFO) będzie konfigurowalna w ustawieniach systemu lub nawet per produkt, zależnie od wymagań.

Śledzenie dat i partii: Każdy License Plate (lub partia) w systemie powinien mieć przypisaną datę przyjęcia oraz (opcjonalnie) datę ważności przydatności. Jeśli te dane nie są obecnie przechowywane, rozszerzymy schemat bazy o pole daty ważności dla partii. Dzięki temu system może sortować dostępne zapasy według najstarszej daty przyjęcia lub najbliższej daty ważności.

Sugestie w procesach:

Pobieranie surowców do produkcji: Gdy operator na terminalu produkcyjnym wybiera surowiec do pobrania, interfejs może automatycznie podpowiedzieć konkretny LP (partię) – np. wyświetlając listę dostępnych partii danego surowca posortowaną rosnąco wg daty przyjęcia/ważności i oznaczając sugerowaną pozycję.

Kompletacja zamówienia/transferu: Analogicznie, przy realizacji zamówienia magazynowego lub transferu między magazynami, system wskaże które jednostki magazynowe (LP) należy wydać najpierw. Pracownik otrzyma informację, że np. LP1234 (przyjęty 01.09, ważny do 01.12) powinien zostać pobrany przed LP5678 (przyjęty później lub z dłuższą datą).

Alerty o dacie ważności: System może generować ostrzeżenia, jeśli jakaś partia zbliża się do upływu terminu – np. podświetlać ją na liście na czerwono lub wysyłać notyfikacje, aby zachęcić do jej wykorzystania (to rozszerzenie, które można wprowadzić).

Wdrożenie tej funkcjonalności wymaga, by aplikacja znała ilości dostępne w poszczególnych LP oraz ich parametry (daty). Moduł magazynowy już teraz śledzi stany poprzez obiekty LP i ruchy stockowe – dodanie logiki FEFO to głównie warstwa rekomendacji w interfejsie. Funkcja będzie podpowiedzią, a nie wymuszeniem – operator nadal będzie mógł wybrać inną partię w razie potrzeby (np. gdy sugerowana partia jest trudno dostępna fizycznie), jednak system może wymagać potwierdzenia odstępstwa. Dzięki temu zachowamy balans między automatyzacją a elastycznością.

Pełny zakres funkcjonalności systemu (punkt 3)

Projekt zakłada implementację wszystkich kluczowych funkcji związanych z obsługą drukowania etykiet, skanowania i zarządzania magazynowo-produkcyjnego – żadna istotna funkcja nie zostanie pominięta. Poniżej lista najważniejszych elementów, które obejmuje plan:

Przyjęcia towarów (GRN) z automatycznym nadawaniem LP: Umożliwimy tworzenie Goods Receipt Notes powiązanych z zamówieniami (PO/ASN) oraz automatyczne generowanie unikalnych numerów License Plate dla odebranych partii materiałów. Każdy LP utworzony przy przyjęciu zostanie przypisany do lokalizacji magazynowej (docelowo z auto-sugestią lokalizacji wg ustalonych reguł). Bezpośrednio po utworzeniu LP nastąpi wydruk etykiety (jak opisano w sekcji druku).

Zarządzanie etykietami LP: System umożliwi edycję i podział etykiet LP. Dostępne będą funkcje edycyjne (zmiana atrybutów LP, np. korekta ilości przez Amend LP), dzielenie partii na mniejsze jednostki (Split LP), łączenie/komponowanie (kompozycja LP) oraz śledzenie powiązań partii (genealogia). Te funkcje są w dużej mierze zaimplementowane w module magazynowym (status LP jest kompletny według aktualnej dokumentacji).

Lokalizacje magazynowe i przemieszczenia: Każdy LP jest przypisany do lokalizacji w magazynie. System posiada zarządzanie lokalizacjami i hierarchią magazynów (regały, strefy itp.). Planujemy wdrożyć ruchy magazynowe (Stock Moves) z pełną obsługą na urządzeniach mobilnych – np. pracownik skanuje LP i wskazuje docelową lokalizację przy odkładaniu towaru lub kompletacji zamówienia. Istnieje już tabela i podstawowy interfejs do ruchów magazynowych, a do zrobienia pozostaje przyjazny interfejs mobilny typu „Pick/Putaway” usprawniający pobieranie i odkładanie towarów. Funkcje automatycznego przypisywania lokalizacji (np. sugerowanie miejsca składowania według reguł ABC czy typu produktu) również są przewidziane.

Terminal produkcyjny (Process Terminal): To dedykowany interfejs (część modułu Scanner) dla operatora na hali produkcyjnej. Umożliwia on realizację operacji produkcyjnych w oparciu o zlecenie produkcyjne (Work Order). W ramach terminala produkcyjnego operator może:

Staging (pobranie materiałów): Skanować kody LP surowców, aby zarejestrować ich pobranie z magazynu na stanowisko produkcyjne (system sprawdza przy tym m.in. czy materiały są poprawnie przypisane do zlecenia i czy nie przekroczono dostępnych ilości).

Rejestracja wag i wyników: Po wykonaniu operacji, operator wprowadza lub skanuje wagę zużytego surowca i uzyskanego produktu. Terminal umożliwi wpisanie tych danych, a system może automatycznie obliczyć wydajność, straty itp. na podstawie różnicy wag.

Zakończenie operacji: Operator zatwierdza zakończenie etapu (co zmienia status operacji w systemie). System wymusi, by wszystkie wymagane czynności były wykonane – np. odczytana waga, spełnione reguły 1:1 dla komponentów (czyli jeśli operacja wymaga dokładnie jednego LP surowca na jeden LP produktu, system sprawdzi czy nie zużyto częściowo LP – ta walidacja jest zaimplementowana). Po zamknięciu operacji może nastąpić utworzenie nowego LP dla półproduktu/produktu powstałego na danym etapie (jeśli operacja coś wytwarza) – operator otrzyma wtedy nowy numer LP, który można wydrukować i oznaczyć fizycznie pojemnik.

Terminal produkcyjny będzie obsługiwał skanowanie kodów kreskowych dla usprawnienia pracy – planowana jest integracja odczytu kodów, tak aby zeskanowanie kodu LP automatycznie wybierało dany surowiec lub potwierdzało operację (implementacja obsługi skanera jest priorytetem P0). Obecnie rdzeń logiki terminala procesowego jest gotowy (~60%), pozostało dopracowanie obsługi błędów i interfejsu użytkownika.

Terminal pakowania (Pack Terminal): Drugi tryb modułu Scanner, przeznaczony do obsługi pakowania i paletyzacji na końcu procesu. Pozwala on operatorowi na:

Tworzenie palety: Gdy zebrana zostanie określona liczba opakowań lub pojemników (każdy z własnym LP) gotowych produktów, operator może utworzyć nową paletę i przypisać do niej te jednostki. Terminal poprosi o nadanie numeru palety (lub zrobi to automatycznie) oraz o zeskanowanie kolejno wszystkich LP, które mają trafić na paletę.

Zarządzanie składnikami palety: Każde zeskanowane LP zostanie dodane do składu palety (relacja wiele-do-wielu w tabeli pallet_items). Jeśli zajdzie potrzeba, można usunąć LP z palety lub dodać dodatkowe przed zamknięciem. System śledzi powiązania LP z paletą w celu zapewnienia traceability (genealogia).

Finalizacja i etykieta palety: Po skompletowaniu, paleta zostaje zamknięta w systemie – otrzymuje swój identyfikator i etykietę do wydruku. Etykieta palety będzie zawierać kod (prawdopodobnie 1D lub QR) pozwalający zidentyfikować całą paletę przy wysyłce lub składowaniu.

Terminal pakowania również wykorzysta skanowanie kodów dla sprawnej pracy (skan LP aby dodać go do palety, skan palety aby wywołać jej szczegóły itp.). Podobnie jak w przypadku terminala procesowego, interfejs jest w fazie dostosowywania do urządzeń mobilnych (rdzeń jest zrealizowany w ~60%).

Kontrola jakości i identyfikowalność: System będzie egzekwował zasady QA podczas operacji. Przykładowo, jeśli dana partia (LP) ma status Failed lub Quarantine w systemie jakości, terminal zablokuje możliwość jej użycia w produkcji. Jest to tzw. QA gate enforcement – zostało to już zaimplementowane w module skanera dla procesu produkcji (StageBoard i terminal). Dodatkowo istnieje możliwość wykonania override QA przez uprawnionego nadzorcę (PIN Supervisora), co również uwzględniono w systemie. Wszystkie działania (pobrania, zużycia, paletyzacja) są zapisywane, co zapewnia pełną traceability – na poziomie bazy danym mamy tabele śledzące genealogie LP i ich kompozycje, a planujemy także rozbudować interfejs do prezentacji tych powiązań (drzewa genealogii partii itp.).

Eksporty i raporty: Choć nie jest to bezpośrednio część obsługi skanera czy druku, warto zaznaczyć, że system posiada mechanizmy eksportu danych (np. do Excela) dla różnych modułów – w tym raporty z produkcji, ruchów magazynowych, list LP, itp. Na liście mamy także eksporty związane z traceability oraz dokumenty wysyłkowe. W kontekście naszego projektu, możemy rozważyć dodanie raportu np. „Lista partii z datami ważności” by łatwo monitorować FIFO/FEFO, lub raport wydajności produkcji zebrany z terminala.

(Powyższa lista nie pomija żadnej kluczowej funkcjonalności zaplanowanej w ramach systemu – zgodnie z prośbą ujęto wszystkie istotne elementy.)

Terminal skanujący – aplikacja webowa dostosowana do urządzeń mobilnych (punkt 4)

Terminal skanujący (obejmujący tryb Process i Pack) będzie zrealizowany jako część aplikacji webowej, ale zoptymalizowana pod urządzenia mobilne (tablety przemysłowe, kolektory danych). Oznacza to, że interfejs w przeglądarce na urządzeniu skanującym będzie uproszczony i dostosowany do pracy dotykowej oraz przy użyciu skanera kodów. Kilka aspektów tego dostosowania:

Responsywny design: Strona /scanner będzie przełączac się w tryb mobilny z prostym układem, dużymi przyciskami i czytelną czcionką. Elementy interaktywne (przyciski, listy) zostaną zaprojektowane jako „duże cele dotykowe” – tak, aby osoba w rękawicach roboczych mogła łatwo obsługiwać ekran. Planowany jest nawet specjalny tryb „grubej rękawicy” zwiększający rozmiar elementów interfejsu. Bierzemy też pod uwagę używanie urządzeń w orientacji poziomej (landscape), więc interfejs będzie to wspierał.

Obsługa skanera kodów: Urządzenia typu kolektor zazwyczaj mają wbudowany skaner kodów kreskowych działający jak klawiatura (wprowadzający odczytany ciąg znaków). Nasza aplikacja to wykorzysta – w polach wprowadzania będzie możliwość skanowania zamiast pisania. Dodatkowo, zaimplementujemy mechanizmy nasłuchujące zdarzeń skanera: np. focus automatycznie ustawi się na właściwym polu gdy oczekiwany jest skan; po zeskanowaniu kodu aplikacja może od razu wywołać odpowiednią akcję (np. dodanie surowca do operacji). Ta integracja skanera jest traktowana priorytetowo. Rozważamy także użycie kamery urządzenia jako skanera (przez API getUserMedia) dla ewentualnych urządzeń bez dedykowanego skanera – to może być funkcja opcjonalna.

Tryb offline: Jako że to web-aplikacja, domyślnie wymaga połączenia sieciowego (do komunikacji z backendem w Supabase). Zdajemy sobie sprawę, że na halach produkcyjnych zasięg WiFi bywa zawodny, dlatego planujemy w przyszłości tryb offline (PWA) pozwalający na buforowanie operacji w razie utraty łączności. Na ten moment jest to funkcja oznaczona jako przyszłe usprawnienie (priorytet P2), więc nie wchodzi do bieżącego scope – jednak struktura aplikacji (Next.js + Supabase) pozwoli w przyszłości na implementację mechanizmów offline (ServiceWorker, cache lokalny danych).

Bezpieczeństwo i dostęp: Terminal będzie częścią aplikacji, więc obowiązują te same mechanizmy autentykacji. Pracownik loguje się swoim kontem (możemy rozważyć logowanie PIN-em lub kartą RFID, aby uprościć na terminalu – to ewentualne usprawnienie). System uprawnień (Role-Based Access Control) jest w trakcie rozbudowy, docelowo pozwoli ograniczyć dostęp np. tylko do modułu Scanner dla operatorów produkcji. Interfejs terminala może po zalogowaniu od razu przełączać na ekran skanera (bez pokazywania całego menu modułów), co ułatwi obsługę.

Podsumowując, terminal = web-aplikacja dostosowana do użycia na mobilnym skanerze. Zachowujemy wszelkie zalety centralnej aplikacji (jednolita baza danych, brak konieczności synchronizacji, łatwa aktualizacja oprogramowania), jednocześnie czyniąc UI wygodnym w warunkach produkcyjnych. Implementacja wymaga dopracowania UX (co jest w toku) oraz testów na docelowych urządzeniach, by upewnić się że dotyk i skanowanie działają płynnie (to uwzględnimy w harmonogramie prac).

Wykorzystanie kodów kreskowych 1D vs kodów 2D (punkt 5)

Na start skupimy się na standardowych kodach kreskowych 1D (jednowymiarowych) do identyfikacji obiektów, z możliwością rozszerzenia o kody 2D (dwuwymiarowe, np. QR) w przyszłości dla bardziej złożonych zastosowań.

Kody kreskowe 1D (np. Code 128): Będą głównym nośnikiem identyfikatorów w systemie – proste, niezawodne i powszechnie obsługiwane przez skanery. Code 128 pozwala zakodować zarówno cyfry, jak i litery, więc bez problemu zmieścimy np. alfanumeryczny numer LP lub numer palety. Każda wygenerowana etykieta LP będzie zawierała taki kod 1D, co umożliwi szybkie skanowanie i odnalezienie rekordu w systemie. Generowanie tych kodów zostanie zaimplementowane po stronie aplikacji (np. biblioteka do generowania kodów lub renderowanie w canvas/svg) – ten element jest przewidziany w planie prac.

Kody 2D (QR/DataMatrix): Kody dwuwymiarowe mają tę zaletę, że mogą pomieścić dużo więcej informacji na mniejszej etykiecie. Rozważamy ich użycie w przyszłości do bardziej złożonych operacji. Przykładowy scenariusz: kod QR zawierający zakodowane szczegóły partii, np. numer produktu, numer partii, ilość, datę produkcji i datę ważności – wszystko w jednym skanie. To mogłoby przyspieszyć np. przyjęcie dostawy od dostawcy, który umieszcza QR na palecie: skanując taki kod, system mógłby automatycznie odczytać wszystkie potrzebne dane i utworzyć odpowiedni rekord (zamiast skanować kilka różnych kodów lub wpisywać dane ręcznie). Innym zastosowaniem może być przypisanie linku lub identyfikatora do dokumentacji jakościowej – skan QR mógłby np. otworzyć od razu kartę produktu z atestami.

W pierwszej fazie nie planujemy jeszcze masowego użycia kodów 2D, ponieważ wymaga to szerszego przygotowania (standaryzacji zawartości kodu, doposażenia drukarek w tę funkcję, zapewnienia, że wszyscy użytkownicy mają skanery 2D). Jednak już na etapie projektowania uwzględniamy tę możliwość. Funkcja generowania kodów QR również jest na liście rzeczy do zrobienia (priorytet P0) obok generowania kodów 1D, co oznacza że w ramach prac nad drukowaniem etykiet stworzymy moduł pozwalający na wygenerowanie i umieszczenie na etykiecie także kodu 2D. Być może początkowo nie będzie on wykorzystywany na wszystkich etykietach, ale podstawa technologiczna będzie gotowa. W ten sposób przyszłe rozszerzenia (np. wprowadzenie QR dla wybranych procesów) będą łatwe do wdrożenia.

Podsumowanie 1D vs 2D: Na dzień dzisiejszy priorytetem jest niezawodność i prostota – dlatego 1D. Kody 1D w zupełności wystarczają do identyfikacji jednostek (LP, produkty, lokalizacje itp.), zwłaszcza że system przechowuje szczegóły w bazie, a kod służy jako klucz. Natomiast kody 2D traktujemy jako pole do innowacji w przyszłości – otwierają one możliwość przekazywania większej ilości danych w terenie (poza bazą danych). Będziemy obserwować potrzeby procesu: jeśli pojawi się sytuacja, gdzie QR zdecydowanie usprawni pracę (np. zmniejszy liczbę skanów z kilku do jednego), wdrożymy go pilotażowo w danym obszarze.

Otwarte pytania do wyjaśnienia

Model drukarek i protokół komunikacji: Jakie dokładnie drukarki etykiet będą używane (marka/model)? Czy obsługują one druk po IP (protokoły typu LPR/IPP lub API producenta)? To wpłynie na sposób integracji – czy możemy drukować wysyłając strumień ZPL, czy potrzebujemy dodatkowego serwera wydruku.

Format etykiet i informacje: Czy są określone standardy co do informacji na etykiecie? Np. czy na etykiecie surowca musi być kod produktu, nazwa dostawcy, numer partii dostawcy itp. poza naszym numerem LP? Ustalenie tego wpłynie na projekt szablonu.

Dane o dacie ważności: Czy dla wszystkich surowców/produktów są znane daty ważności lub przydatności? Jeśli tak, czy będą wprowadzane ręcznie przy przyjęciu, czy importowane z ASN/dokumentów dostawcy? Upewnienie się, że posiadamy te dane, jest krytyczne dla poprawnego działania FEFO. Jeśli nie, czy będziemy wymagać od użytkownika wprowadzania daty przy tworzeniu LP?

Strategia FIFO/FEFO – globalnie czy per produkt: Czy zasada rotacji ma być globalna (jedna ustawiona w systemie dla wszystkiego), czy zależna od klasy produktu? Np. żywność wg FEFO (data ważności), a komponenty techniczne wg FIFO. Możliwość konfiguracji per kategoria produktu może być potrzebna – warto to potwierdzić.

Sposób prezentacji sugestii FIFO/FEFO: Jak użytkownik ma otrzymywać te sugestie? Czy wystarczy posortowana lista z wyróżnieniem pierwszej pozycji, czy potrzebny jest osobny komunikat „Użyj najpierw LP XYZ”? Czy w razie pomyłki (użycia niewłaściwej partii) system ma ostrzegać lub blokować? Te szczegóły UX wpłyną na implementację.

Urządzenia mobilne do terminala: Jakie konkretnie urządzenia będą używane przez operatorów (np. Zebra TC21/TC26 z Androidem, Honeywell, czy może tablety + skanery Bluetooth)? Ważne dla testów – musimy sprawdzić kompatybilność przeglądarki, rozdzielczości ekranu, ewentualnie czy urządzenia mają tryb kiosk (żeby przeglądarka była jedyną aplikacją).

Integracja z wagami przemysłowymi: Czy planujemy podłączenie wag elektronicznych do systemu, aby automatycznie zaczytywać masę (np. surowca przed i po, produktu) zamiast wpisywać ręcznie? Wspomniano ręczne wprowadzanie wagi, ale integracja wag poprzez porty COM/USB lub protokół sieciowy mogłaby wyeliminować błąd ludzki. Jeśli to pożądane, trzeba uwzględnić dodatkowy interfejs do odczytu wag.

Tryb offline vs ciągła łączność: Na ile krytyczne jest działanie terminala w trybie offline? Mamy to w planach P2, ale jeżeli zakład produkcyjny ma słaby internet lub WiFi, może warto priorytetyzować przynajmniej podstawowy bufor offline wcześniej. To pytanie do ustalenia z zespołem IT na miejscu.

Szkolenie i interfejs użytkownika: Czy docelowi użytkownicy (magazynierzy, operatorzy) mieli już doświadczenie z podobnymi systemami? To może wpłynąć na projekt UI (np. użycie ikon i terminologii zrozumiałej dla nich). Czy przewidujemy tryb „demo” lub testowy do szkolenia? Warto zaplanować.

(Odpowiedzi na powyższe pytania pozwolą doprecyzować wymagania i uniknąć błędnych założeń przed finalizacją implementacji.)

Dodatkowe sugestie i pomysły do rozważenia

Integracja z systemem ERP/WMS: Jeśli istnieje nadrzędny system (np. ERP) zarządzający zamówieniami lub stanami, warto rozważyć dwukierunkową integrację. Np. wysyłanie informacji o zużyciu materiałów, o wyprodukowaniu partii czy o wysyłce do ERP. MES MonoPilot może działać autonomicznie, ale synchronizacja z innymi systemami zapewni spójność danych w całej firmie.

Wykorzystanie RFID w przyszłości: Kody kreskowe/QR to jedno rozwiązanie, ale warto pamiętać o technologii RFID. Etykiety z chipem RFID pozwalają skanować (odczytywać) wiele naraz i na odległość. Może w przyszłości pojawić się potrzeba, by niektóre palety czy pojemniki miały tag RFID dla automatycznej identyfikacji np. przy wyjeździe przez bramę. Nasz system mógłby zostać rozbudowany o moduł odczytu RFID (czytniki bramowe lub handheld), jeśli zajdzie taka potrzeba.

Automatyzacja wydruków etykiet QA/raportów: Skoro przewidujemy generowanie PDF (np. Certificate of Analysis, raporty jakości), można pomyśleć o automatycznym dołączaniu ich do partii. Np. po zakończeniu produkcji partii system generuje PDF z podsumowaniem (ilość, jakość, wyniki testów) i umożliwia wydruk wraz z etykietą lub wpięcie do bazy danych. To zwiększa kompletność dokumentacji.

Monitorowanie i alerty w czasie rzeczywistym: Warto dodać mechanizmy alertujące na bieżąco o ewentualnych odchyleniach. Przykłady: jeśli operator zeskanuje nieodpowiedni LP (niezgodny z WO), aplikacja natychmiast sygnalizuje błąd (dźwiękowo i komunikatem). Albo – jeśli jakaś partia jest już po terminie ważności, przy próbie skanowania jej pojawi się ostrzeżenie i wymóg potwierdzenia przez kierownika. Takie funkcje usprawnią bezpieczeństwo i zgodność procesów.

Ulepszona ergonomia interfejsu skanera: Poza „dużymi przyciskami” można wdrożyć funkcje typu skróty klawiszowe lub przyciski sprzętowe urządzenia. Wiele kolektorów ma boczne przyciski, którym można przypisać akcje – np. jeden przycisk mógłby zatwierdzać operację (odpowiadać „Enter”), inny usuwać ostatni skan. Jeśli oprogramowanie urządzenia pozwala, można to wykorzystać by przyspieszyć obsługę bez dotykania ekranu.

Progressive Web App (PWA): Wspomniany tryb offline można połączyć z ideą PWA – aplikacja mogłaby działać jak zainstalowana na urządzeniu, z własną ikonką, pełnym ekranem bez adresu URL, a nawet z pewnymi danymi offline. Rozważamy przygotowanie MonoPilot Scanner jako PWA, co użytkownikom uprości dostęp (klikają ikonę zamiast wpisywać adres) i pozwoli wykorzystać pewne API przeglądarki (cache, powiadomienia push w przyszłości).

Analiza danych i optymalizacje: Gdy już system będzie zbierał dane o wszystkich operacjach (czasy operacji, zużycia, ruchy magazynowe), można pomyśleć o ich analizie. Np. które etapy produkcji najczęściej się opóźniają – może da się je usprawnić; które produkty najczęściej mają braki (shortages) – może warto zwiększyć zapasy bezpieczeństwa. Takie analizy można robić w modułach raportowych lub eksportując dane do narzędzi BI. Chociaż to poza bezpośrednim zakresem bieżącej implementacji, jest to potencjalna wartość dodana z zebranych danych.

Wszystkie powyższe sugestie mogą zostać zrealizowane etapowo, po wdrożeniu podstawowych funkcji. Najpierw koncentrujemy się na stabilnym uruchomieniu pełnej zaplanowanej funkcjonalności (drukarki, FIFO/FEFO, terminal) zgodnie z powyższym planem, aby użytkownicy końcowi otrzymali działające narzędzie spełniające ich wymagania. Następnie, wraz z ich feedbackiem, możemy iteracyjnie wprowadzać kolejne usprawnienia i innowacje.

## 7.0 Quality & Traceability — plan wdrożenia (kompletny, gotowy do TODO2.md)

Poniżej masz pełny, rozbity plan dla modułu Quality & Traceability, zgodny z Twoją listą 7.1–7.2. Trzymam się istniejących założeń technicznych (QA gate, TraceabilityAPI, LP genealogy/compositions, eksporty), wskazuję migracje DB, endpointy API, komponenty UI, testy E2E oraz doprecyzowania UX. W miejscach, gdzie w dokumentach mamy już logikę/warstwy API, cytuję je, aby było jasne, na czym się opieramy.
Statusy bazowe: QA ~50% (COA pending), Traceability ~40% (API jest, brak UI).

### 7.1 QA Status Management

Cel: kompletna kontrola jakości na poziomie LP: statusy, bramki QA (gate), override z PIN, wyniki testów, załączniki oraz COA PDF.

Stan źródłowy / kontekst:

W regułach biznesowych istnieje QA gate enforcement (blokada operacji przy failed QA + override z PIN + audyt), już używane w produkcji/skanerze.

Szybka referencja modułów/warstw potwierdza QA status enum i QA gate jako reguły systemu.

  - ⬜ 7.1.1 QA status enum (Pending/Passed/Failed/Quarantine) — 🟢 P0

DB / migracje:

Potwierdź pole license_plates.qa_status (enum/constraint) + indeks do filtrowania.

Dodać: license_plates.qa_comment, qa_changed_by, qa_changed_at (audyt ostatniej zmiany).
API: PATCH /api/quality/lp/[lpId]/status (walidacja ról, audyt).
UI: w szczegółach LP (oraz Trace/LP modals) wyświetl status i historię zmian.
Reguły: status domyślny Pending przy GRN/utworzeniu LP; Quarantine dostępny dla QA.
Powiązanie ze Scannerem: blokady w Process/Pack/Stage (istnieją).

  - ⬜ 7.1.2 QA gate enforcement (blocks failed LPs) — 🟢 P0

Logika (już jest): blokada użycia LP w operacjach przy statusie Failed; opcja override.
Wzmocnienia: wspólna usługa walidacji QA (importowana w API/Scanner/Warehouse), ujednolicone kody błędów (BUSINESS_RULE_ERROR).

  - ⬜ 7.1.3 Supervisor override capability — 🟢 P0

DB: tabela qa_audit_trail (lp_id, old_status, new_status, reason, supervisor_id, pin_hash, changed_at).
API: POST /api/quality/lp/[lpId]/override (PIN + reason).
UI: QAOverrideModal (istnieje), poprawki: czytelny opis ryzyka, obowiązkowy reason.

  - ⬜ 7.1.4 ChangeQAStatusModal component — 🟢 P0

UI: modal dla QA (bez PIN) do zwykłych zmian (Pending→Passed).
Walidacje: blokada downgrade bez powodu; log w qa_audit_trail.

  - ⬜ 7.1.5 COA PDF generation — 🟢 P0

Cel: Certyfikat Analizy dla LP/partii. Status w TODO: pending → robimy.
Zawartość COA: produkt (part_number/nazwa), LP/batch, daty, wyniki testów (tabela), spec min/max, wynik PASS/FAIL, podpis QA, QR (opcjonalnie).
API: GET /api/quality/coa/[lpId].pdf (+ pakiety zbiorcze: paleta/TO).
Generator: wspólna infrastruktura eksportów (PDF/Excel jest gotowa; dodajemy szablon COA).

  - ⬜ 7.1.6 QA results table per LP — 🟢 P0

DB: qa_results (lp_id, test_code, name, unit, spec_min, spec_max, measured, result, tester_id, tested_at).
UI: QAResultsTable w szczegółach LP, filtr wg zakresu czasu/partii; kolory PASS/FAIL.

  - ⬜ 7.1.7 QA test results storage — 🟢 P0

Wejście danych: ręcznie (formularz), upload CSV/XLSX (mapowanie kolumn), API integracyjne.
Walidacje: kompletność spec, typy, zakresy; audyt importu (plik, kto, kiedy).

  - ⬜ 7.1.8 Attachments (photos, docs) — 🟢 P0

DB: qa_attachments (lp_id, file_url, kind: photo/doc, notes, uploaded_by, uploaded_at).
Storage: S3 (zgodnie z polityką exportów/plików).
UI: galeria/sekcja plików; miniatury zdjęć; podgląd PDF.

Testy / E2E (QA):

Blokada na QA gate w Process/Pack/Stage; override z PIN i audytem.

COA PDF zawiera kompletną tabelę wyników; numerowane strony; watermark Quarantine dla statusów ≠ Passed.

Import wyników z CSV (walidacja spec, błędne linie → raport).

Uprawnienia ról (QA, Supervisor, Operator).

### 7.2 Traceability

Cel: od pełnego API forward/backward do używalnego UI: tabela, widok drzewa, genealogia, matrix kompozycji, eksporty i raporty.

Stan źródłowy / kontekst:

TraceabilityAPI (forward/backward) istnieje; LP genealogy/compositions w schemacie; view’y do trace są w planie/enhancements. UI jest w formie skromnej listy (TraceTab text).

  - ⬜ 7.2.1 Forward trace API (backend only) — ✅

Już istnieje; potwierdzić zwracany model (LP → children).

  - ⬜ 7.2.2 Backward trace API (backend only) — ✅

Już istnieje; LP → parent chain.

  - ⬜ 7.2.3 LP composition chains (database level) — ✅

lp_compositions, lp_genealogy są w schemacie; indeksy do zapytań rekursywnych.

  - ⬜ 7.2.4 Multi-level traceability (API level) — ✅

Rekursywne przejście drzewa, budowa struktury wynikowej.

  - ⬜ 7.2.5 TraceTab component (only text list, NO table/tree) — 🟢 P0

Doprecyzowanie: rozszerzamy TraceTab:

Pole LP number, kierunek (forward/backward), zakres dat, głębokość.

Wynik najpierw jako tabela + akcja „Pokaż drzewo”.

Lazy-load/stronicowanie przy dużych drzewach.

  - ⬜ 7.2.6 Trace to GRN/PO (API level) — ✅

W API jest powiązanie do GRN/PO; w UI dodajemy linki do dokumentów źródłowych (GRN, PO).

  - ⬜ 7.2.7 Visual table/grid for trace results — 🟢 P0

Spec tabeli: LP, produkt, ilość, źródło (GRN/TO/WO), lokacja, QA, daty; kolumny z filtrami.
Akcje: „detale LP”, „przejdź do GRN/PO/WO”, „eksport zaznaczonych”.

  - ⬜ 7.2.8 Tree diagram visualization — 🟢 P0

UI: wykres drzewa (rozsuwane węzły), wyróżnienie ścieżki do bieżącego LP, ikony źródeł (GRN/WO/Pack/Pallet), kolory QA.
Dane: z TraceabilityAPI (multi-level). CTE/widoki mogu przyspieszyć odpowiedzi.

  - ⬜ 7.2.9 Trace export to Excel — 🟢 P0

API: /api/exports/trace.xlsx (w planie/istnieje), uzupełniamy kolumny (ścieżka, poziom, QA).

  - ⬜ 7.2.10 Traceability reports — 🟢 P0

Szablony raportów:

Backward Recall Report (co trafiło do FG z danego RM),

Forward Impact Report (które FG/palety zawierają dany LP),

LP Movement Story (czasowa sekwencja: GRN→…→FG/paleta).
Eksport PDF/XLSX (reuse infra).

  - ⬜ 7.2.11 LP genealogy visualization — 🟢 P0

UI: zakładka Genealogy w szczegółach LP: drzewo parent↔child, ze skokiem do TraceTab.
Dane: lp_genealogy + lp_compositions.

  - ⬜ 7.2.12 Composition matrix view — 🟢 P0

UI: macierz input LP (wiersze) vs output LP/palety (kolumny); w komórce: ilość/udział, QA.
Zastosowanie: szybki audyt kompozycji dla audytora jakości/klienta.
Źródło: lp_compositions (join z produktami/LP).

Testy / E2E (Trace):

Głębokie drzewo (GRN→PR→FG→Paleta) — poprawny forward/backward i UI drzewa.

Eksport trace.xlsx — komplet danych; duże wolumeny (wydajność).

Linki do GRN/PO/WO — poprawnie nawigują do dokumentów.

Integralność łańcucha (brak cykli; walidacja podczas insert do lp_genealogy).

Architektura / migracje / wydajność

Migracje (QA/Trace uzupełnienia):

026_qa_results.sql — tabela wyników.

027_qa_attachments.sql — załączniki QA (LP-level).

028_qa_audit_trail.sql — audyt zmian/override.

(opcjonalnie) 029_trace_views.sql — materializowane widoki vw_trace_forward/backward dla dużych drzew.

API — konsolidacja:

QualityAPI: /quality/lp/:id/status, /quality/lp/:id/override, /quality/lp/:id/results, /quality/lp/:id/attachments, /quality/coa/:id.pdf.

TraceabilityAPI: istnieje (forward/backward), rozszerzamy parametry (depth, time window).

Wydajność:

Indeksy: idx_lp_genealogy_parent, idx_lp_genealogy_child, idx_lp_compositions_lp, idx_lp_status, idx_qa_results_lp_time.

CTE/materialized views dla drzewa; lazy expansion po stronie UI.

Integracje (powiązania z innymi modułami):

Scanner/Production: QA gate przy staging/weights/complete-op (już enforced).

Warehouse: GRN→LP ustawia qa_status=Pending; Trace łączy do GRN/PO.

Exports: korzystamy z istniejącej infrastruktury XLSX (SheetJS + endpoints).

Testy i jakość

Unit / Integration:

Walidacje QA (gate, override, role-based access).

API Trace (forward/backward) — głębokość, kierunek, zakres czasu.

COA generator (pełne pokrycie szablonu).
E2E (Playwright):

GRN→LP(Pending)→QA Passed→Process→COA PDF,

Failed + Override z PIN + audyt,

Forward trace od GRN do palety FG (drzewo + eksport),

Backward trace od palety do RM (tabela + linki do GRN/PO).

Harmonogram P0 (szacunki)

  - ⬜ 7.1.1–7.1.4 statusy/override/modale: 1.5 dnia

  - ⬜ 7.1.5 COA PDF: 2.0 dni

  - ⬜ 7.1.6–7.1.8 wyniki/załączniki: 1.5 dnia

  - ⬜ 7.2.5–7.2.12 UI Trace (tabela, drzewo, matrix, eksporty, raporty): 5–7 dni
  (API i DB bazowe dla trace już są — skupiamy się na UI i wydajności).

Pytania (żeby domknąć szczegóły i uniknąć reworku)

COA format: czy mamy wzór firmowy (logo, układ, podpisy) i minimalny zestaw testów/spec? Czy COA generujemy per LP czy zbiorczo per paleta/TO?

Katalog testów QA: czy testy i specyfikacje są per produkt (np. tłuszcz, białko, wilgotność), czy globalne? Potrzebny master qa_test_catalog?

Quarantine workflow: czy Quarantine blokuje wydania i wymaga dwustopniowej akceptacji? Czy COA ma watermark „Quarantine”?

Retencja załączników: jak długo trzymamy zdjęcia/dokumenty? Jakie limity (rozmiar/typ)?

Trace głębokość: czy UI ma limit domyślny (np. 6 poziomów)? Czy pozwalamy użytkownikowi pogłębiać ad hoc?

Wydajność trace: expected scale — rzędu setek tysięcy LP? Jeśli tak, priorytet dla materialized views i paginacji.

Uprawnienia: kto może zmieniać status QA, dodawać wyniki, wykonywać override? Role: QA, QA Supervisor, Operator — potwierdzić.

Eksporty trace: Excel tylko, czy także PDF raportów dla audytora/klienta (brandowane)?

Integracja z klientem/audytorem: czy przewidujemy nadanie linku (read-only) do widoku Trace/COA dla reklamacji/inspekcji?

Propozycje rozbudowy (po P0)

SPC / statystyka jakości: karty kontrolne, out-of-trend (OOT/OOC), alarmy.

Recall workflow: kreator akcji wycofania (Backward trace → lista odbiorców/FG → dokumentacja).

QA sampling plans: AQL, auto-losowanie próbek; checklisty na terminalu.

COA + QR: QR na COA z deep-linkiem do LP/Trace (read-only).

Automatyzacja spec: dziedziczenie spec z produktu/BOM i wersjonowanie spec QA.

Data Lake / BI: dzienne snapshoty genealogii i jakości do analityki.

Guardy anty-cykl: funkcje DB wykrywające cykle w lp_genealogy przed insertem.

Podsumowanie

QA (7.1): domykamy statusy, override z audytem, COA PDF, wyniki testów i załączniki — spójne z bramkami QA w produkcji/skanerze.

Traceability (7.2): API już jest; dostarczamy pełny UI (tabela, drzewo, genealogia, matrix), eksporty i raporty + poprawki wydajności.

Wszystkie punkty 7.1.1–7.1.8 oraz 7.2.1–7.2.12 zostały uwzględnione, z planem migracji, API, UI, testami oraz rozbudową. Jeśli zatwierdzisz pytania / wybory UX (COA, role, głębokość trace), wprowadzę to od razu do harmonogramu P0 i checklisty wdrożeniowej.

## 8.0 Exports & Reporting — plan wdrożenia (TODO2.md)

### 8.1 Excel Exports Infrastructure — Status: ✅ Complete

Co już jest i co utrwalamy (audyt + standardy):

SheetJS (xlsx) podłączone; mamy utilsy do generowania CSV/XLSX oraz wspólne formattery/nagłówki. Utrwalamy konwencje formatowania: daty (ISO + lokalne), liczby (separatory), UoM, waluty.

Eksporty działają na endpointach /api/exports/*.xlsx (strumieniowanie/attachment). Wykorzystujemy istniejącą infrastrukturę exportów z modułów produkcji i trace.

Checklist (stabilizacja P0):

 Formattery wspólne: formatNumber, formatQty, formatMoney, formatDate — używane w każdym eksporcie.

 Nagłówki standardowe: org_code, generated_at_utc, filters_applied (JSON), export_version.

 I18n w CSV/XLSX: separatory dziesiętne i daty zgodnie z locale; fallback do ISO w surowych kolumnach.

 RLS / bezpieczeństwo: każdy eksport honoruje RLS na tabelach (Supabase policies).

 Testy snapshot: jednostkowe porównanie nagłówków i przykładowych wierszy (stabilność schematu plików).

### 8.2 Export Endpoints — Status: 🔄 ~70% (część gotowa, część P0)

Standard dla wszystkich endpointów (P0):

Parametry zapytań (query): date_from, date_to, warehouse_id, product_id, supplier_id, status[], line_id, depth (dla trace), format=csv|xlsx (domyślnie xlsx).

Paginacja i duże zbiory: stronicowanie w DB + scalanie na strumieniu (unikamy OOM).

Nazewnictwo plików: export_<type>_<org>_<YYYYMMDD_HHMM>.<ext>.

Ścieżki/role: wszystkie /api/exports/* wymagają auth; tylko rólki uprawnione do danych (RBAC + RLS).

  - ⬜ 8.2.1 Yield reports export (PR/FG) — ✅

Endpointy (istnieją):

GET /api/exports/yield-pr.xlsx

GET /api/exports/yield-fg.xlsx

Źródła: widoki vw_yield_pr_*, vw_yield_fg_* (day/week/month).

Kolumny: WO, produkt, operacja, plan vs actual, PR/FG Yield%, linia, okres.

  - ⬜ 8.2.2 Consumption reports export — ✅

Endpoint: GET /api/exports/consume.xlsx (istnieje).

Źródło: vw_consume + korekta na filtrach.

Kolumny: WO, materiał (RM/DG), ilość plan/zużyta, variance.

  - ⬜ 8.2.3 Work orders export — ✅

Endpoint: GET /api/exports/work-orders.xlsx (istnieje).

Kolumny: WO#, produkt, qty, status, linia, daty (planned/actual), KPI scope.

  - ⬜ 8.2.4 License plates export — ✅

Endpoint: GET /api/exports/license-plates.xlsx (istnieje).

Kolumny: LP#, produkt, ilość, qa_status, lokacja, parent_lp, batch, genealogy depth.

  - ⬜ 8.2.5 Stock moves export — ✅

Endpoint: GET /api/exports/stock-moves.xlsx (istnieje).

Kolumny: move#, LP, z/na lokację, typ, status, znacznik czasu, user.

  - ⬜ 8.2.6 Traceability reports export — 🟢 P0

Endpoint: GET /api/exports/trace.xlsx (jest w spisie — rozbudować).

Parametry: lp_id, direction=forward|backward, depth, date_from, date_to, include_grn_po=true|false.

Źródła: vw_trace_forward/backward (+ joins do GRN/PO/WO).

Kolumny: level, relation, LP, produkt, qty, źródło (GRN/WO/Pack/TO), QA, lokacja, daty, linki-id.

 Wydajność: lazy flatten + stronicowanie; ostrzeżenie przy dużych drzewach.

  - ⬜ 8.2.7 GRN export — 🟢 P0 (NOWE)

Endpoint: GET /api/exports/grn.xlsx

Parametry: date_from, date_to, supplier_id, warehouse_id, status[].

Źródła: grns, grn_items, purchase_orders (nagłówki/relacje).

Kolumny: GRN#, data, PO#, supplier, status, produkt, qty ordered/received, różnice, lokacja.

  - ⬜ 8.2.8 PO export — 🟢 P0 (NOWE)

Endpoint: GET /api/exports/po.xlsx

Parametry: date_from, date_to, supplier_id, status[].

Źródła: purchase_orders, purchase_order_items, suppliers.

Kolumny: PO#, supplier, waluta (z supplier), due date, kwoty (net/total), pozycje, status.

Uwaga: Waluta/podatki zdefiniowane po stronie supplier (nie wybierane w PO ręcznie) — confirm w danych. (Zbieżne z Twoim wymaganiem integracji supplier→currency/tax).

Testy E2E (eksporty):

 Filtry działają (zakres dat, organizacja, magazyn).

 Pliki otwierają się w Excel/LibreOffice; poprawne typy kolumn.

 RLS: użytkownik widzi tylko swoje dane.

 Duże zbiory: strumień bez timeoutów; rozmiar pliku <limit.

### 8.3 Label Printing — Status: ⬜ Not started (wszystko P0)

Założenia (uzgodnione): drukarki sieciowe w punktach procesu; na start etykiety PDF (fallback), docelowo bezpośrednio do drukarki (ZPL/ESC/PDF). Kody 1D (Code 128) jako standard; 2D (QR) przygotowane do wprowadzenia później.

  - ⬜ 8.3.1 Label template design — 🟢 P0

DB (NOWE):

label_templates (id, code, name, mime_type: pdf/zpl, body (z placeholderami), is_active).

label_bindings (template_id, entity_type: LP/PALLET/GRN/TO, default_printer_id).

Placeholders (MVP):

LP: {lp_number}, {product_code}, {product_name}, {qty}, {uom}, {batch}, {qa_status}, {parent_lp}, {created_at}, {allergen}, {components_list}, {barcode_1d}, {qrcode_2d}.

Paleta: {pallet_id}, {lp_list}, {qty_total}, {uom}, {warehouse}.

Projekt: 100×150 mm (4×6"), czcionka czytelna, układ z dużym kodem 1D; QR opcjonalny (flaga template).

Preview: podgląd w UI (render HTML→PDF).

  - ⬜ 8.3.2 Print queue system — 🟢 P0

DB (NOWE):

printer_profiles (id, name, host, protocol: IPP/LPR/RAW, model, is_active).

print_jobs (id, template_id, payload_json, target_printer_id, status: queued|printing|failed|done, attempts, last_error, created_at, started_at, finished_at).

Serwis: worker kolejki (cron/edge worker) wysyła joby; logika retry (exponential backoff).

Bezpieczeństwo: log kto wygenerował job (user_id), RLS na org.

  - ⬜ 8.3.3 Retry logic for failed prints — 🟢 P0

Stany i eskalacje: 3 próby → failed; UI z przyciskiem „Retry”; alert do admina strefy.

Monitoring: metryki jobs/min, fail_rate, czasy.

  - ⬜ 8.3.4 Label printer integration — 🟢 P0

Tryby:

PDF → stacja druku (MVP),

RAW ZPL do drukarki (szybsze, mniejsze),

IPP/LPR dla uniwersalności.

Mapowanie: label_templates.mime_type decyduje o sposobie renderu.

Testy sprzętowe: jedna drukarka pilotażowa w każdym punkcie (GRN, Process, Pack).

  - ⬜ 8.3.5 Barcode generation (Code 128, QR) — 🟢 P0

Biblioteka: generator 1D/QR (SVG/Canvas), embed w PDF lub generacja ZPL (^BC, ^BQN).

Konwencja: 1D = klucz (LP/paleta/GRN); 2D = bogatsze dane (opcjonalnie).

Zgodność: rozmiary i kontrast pod skanery mobilne (Scanner Module). (Spójne z dotychczasową integracją skanera.)

Integracje (Label ↔ reszta):

GRN: auto-druk etykiet LP po przyjęciu (if configured).

Process/Pack: druk etykiety wyjściowej LP/palety na zakończeniu operacji/paletyzacji.

Trace/QA: możliwość dodruku etykiety z aktualnym QA (znak wodny „Quarantine” jeśli ≠ Passed).

Testy E2E (druk):

 Utworzenie LP → utworzenie joba druku → status done → fizyczny wydruk.

 Błąd drukarki → 3 retrysy → failed → ręczny „Retry” działa.

 Szablon z QR i 1D — oba skanowalne w Scanner Module.

Architektura/Bezpieczeństwo/Wydajność

API ↔ Tabele (mapa): eksporty korzystają z API/Views modułów: Yield/Consume/Trace/LP/WO/Stock Moves; spis API klas i mapowań w AI Quick Reference (przegląd).

RLS: eksporty i druk honorują RLS i RBAC; audyt generowań i print jobów (kto, kiedy, jakie filtry).

Wydajność: indeksy pod widoki (vw_yield_*, vw_trace_*), paginacja, strumieniowanie; nie ładujemy całości do RAM.

Retencja plików: przyjmujemy politykę: link do pobrania ważny X godzin (signed URL) + ewentualny zapis do S3 dla historii (P1).

Testy (Unit / Integration / E2E)

Unit: formattery, nagłówki, generator CSV/XLSX, renderer etykiet (snapshot PDF/ZPL).

Integration: każdy endpoint eksportu z realnym filtrowaniem i RLS.

E2E:

Yield/Consume/WO/LP/StockMoves — export → otwarcie w Excel, weryfikacja danych,

Trace (forward/backward) z różnymi depth i datami,

GRN/PO export z filtrami supplier/warehouse,

Label: GRN→LP→print job→wydruk/Retry.

Harmonogram P0 (szacunki)

  - ⬜ 8.2.6 Trace export: 0.75–1.0 dnia (widoki + paginacja + kolumny).

  - ⬜ 8.2.7 GRN export: 0.75 dnia.

  - ⬜ 8.2.8 PO export: 0.5–0.75 dnia.

### 8.3 Label printing (cały blok): 3–4 dni (szablony, kolejka, retry, 1 drukarka pilota).

Pytania doprecyzowujące (żeby zamknąć P0 bez reworku)

Szablony etykiet: jakie pola są obowiązkowe na etykiecie LP/palety/GRN? (loga, alergeny, data ważności, partia dostawcy, numer PO/GRN?)

Domyślne drukarki: czy przypisujemy je per proces (GRN/Process/Pack) czy per lokacja/stanowisko?

Retencja eksportów: trzymamy pliki w S3 (historia) czy tylko generujemy do pobrania ad-hoc? Jaki czas ważności linków?

Rozmiary i limit XLSX: czy potrzebny export „streamed CSV” dla bardzo dużych datasetów (powyżej np. 200k wierszy)?

Waluta/Tax w PO: potwierdź, że w eksporcie PO waluta i stawka podatku zawsze pochodzą z Supplier, nie z UI PO (logika już została przez Ciebie zmieniona).

Trace export: czy dorzucamy drzewo jako flattened path (LP1 > LP2 > PALLET) w dodatkowej kolumnie, żeby Excel miał „ścieżkę”?

Język etykiet i eksportów: PL/EN — czy potrzebujemy przełącznik języka w pliku/etykiecie?

Propozycje rozbudowy (po P0)

Planowane/schedulowane eksporty (cron): dzienne/tygodniowe raporty na mail, S3, Teams/Slack webhook.

Eksporty PDF: gotowe raporty (Yield/Consume/Trace) w PDF z brandowaniem i podpisami.

Self-service „Report Builder” (P1): UI do budowy własnych zestawień z predefiniowanych widoków + kolumn.

Data Lake / BI: zrzuty dzienne do S3/Parquet, podpięcie do PowerBI/Metabase.

Kompresja/ZIP: paczkowanie wielu eksportów w jeden ZIP (np. trace + COA + LP list).

Kody 2D w etykietach LP/palety: embed metadanych (produkt, batch, expiry) → przyspieszenie przyjęć/trace.

Bilety błędów druku: automatyczne zgłoszenie, jeśli fail_rate > próg (obieg do IT).

Wersjonowanie szablonów etykiet: vX.Y, porównywarka różnic, sandbox do testu na próbkach.

Podsumowanie

### 8.1 mamy kompletne — standaryzujemy i testujemy.

### 8.2 domykamy Trace/GRN/PO i wzmacniamy wydajność + RLS. turn1file17

### 8.3 uruchamiamy druk z kolejką + retry + szablony + kody 1D/QR (MVP: PDF, docelowo ZPL/IPP).

Całość spójna z istniejącymi modułami (Production, Warehouse, Scanner, QA/Trace)

## 9.0 Testing & Quality Assurance — plan wdrożenia (TODO2.md)

Zasady ogólne (cross-cutting)

Piramida testów: Unit (70%) → Integration (20%) → E2E (10%).

Narzędzia:

Unit/Integration: Vitest (szybkość, TS), Supertest (API), MSW (mock HTTP), Testcontainers (opcjonalnie Postgres/kolejka).

E2E: Playwright (desktop + tryb „mobile” dla Scanner), Lighthouse CI (responsywność).

Performance: k6 (API), Lighthouse CI (UI), pg_stat_statements (SQL).

Izolacja danych: testy integracyjne/E2E uruchamiane na tymczasowym schemacie lub tymczasowej bazie (migruj → test → rollback/drop). Brak stałych seedów (zgodne z Twoją preferencją).

Fabryki danych: lekkie factory utils (np. createSupplier(), createPO(), createGRN(), createLP()), minimalny insert pod dany case testowy.

Konwencje: describe/[module]/[feature].test.ts + tagi (@slow, @e2e, @flaky).

Raportowanie: JUnit/HTML report + artefakty screenów i filmów (Playwright).

Gate w CI: pre-push uruchamia smoke tests; gałąź główna wymaga przejścia wszystkich suitów + type-check.

### 9.1 Unit Tests — Status: ⬜ Minimal (tylko auth)

  - ⬜ 9.1.1 API layer tests (only auth exists currently) — 🟢 P0

Zakres: testy handlerów/serwisów bez IO (mock repo/HTTP).

Co dodać: autoryzacja ról (RBAC), walidacja wejścia (zod), poprawne kody HTTP i payload błędów.

Przykłady: /work-orders/*, /purchase-orders/*, /transfer-orders/*, /trace/*, /quality/*.

  - ⬜ 9.1.2 Business logic tests — 🟢 P0

Zakres:

logika QA gate (blokady/override),

routing operacji (kolejność stage),

biling/wyliczenia kwot PO (jeśli dotyczy),

reguły auto-lokacji (Warehouse).

Technika: czyste funkcje, bez bazy; property-based testing dla reguł.

  - ⬜ 9.1.3 Validation tests — 🟢 P0

Zakres: walidacja modeli (zod/DTO), poprawne komunikaty, edge-cases (puste, typy, zakresy).

Automaty: test generowany z definicji schematu (tabela → DTO).

  - ⬜ 9.1.4 Calculation tests (yield, variance) — 🟢 P0

Zakres: yield PR/FG, variance consumption (plan vs actual), KPI.

Wejścia: kombinacje + tolerancje (zaokrąglenia, ułamki, 0/NaN guardy).

Progi: minimalny coverage dla modułów obliczeniowych ≥ 90%.

Deliverables 9.1

Konfiguracja Vitest + ts-node + aliasy.

Raport coverage (nyc/c8) – progi: Lines/Branches/Funcs ≥ 80% (P0), 90% (P1).

### 9.2 Integration Tests — Status: ⬜ Not started

Testy na prawdziwej bazie (tymczasowe schema/DB), z wywołaniem API (Supertest) i minimalną warstwą IO.

  - ⬜ 9.2.1 PO → ASN → GRN → LP flow — 🟢 P0

Scenariusz: utwórz PO → przyjmij ASN → wygeneruj GRN → auto-LP + przypisanie lokacji → eksport GRN.

Assercje: statusy, ilości, powiązania, trace do GRN/PO, blokada QA Pending w Scanner (gate).

  - ⬜ 9.2.2 WO → Operations → Output flow — 🟢 P0

Scenariusz: WO z BOM → staging LP → waga → output → powstaje LP FG → Pack palety.

Assercje: sequential routing, consume_whole_lp (1:1), qa gate, output zapisany w production_outputs.

  - ⬜ 9.2.3 Trace integration tests — 🟢 P0

Scenariusz: multi-level genealogy (GRN→PR→FG→Paleta), forward/backward API.

Assercje: kompletność drzewa, brak cykli, linki do GRN/PO/WO.

  - ⬜ 9.2.4 Supplier decision logic — 🟢 P0

Scenariusz: PO dziedziczy currency/tax z Supplier (bez wyboru w UI).

Assercje: poprawne kwoty w eksporcie, brak override w PO.

Infra 9.2

Skrypt tworzący tymczasowy schemat (np. test_schema_YYYYMMDDhhmm), wykonujący migracje i autodelete po sesji.

Alternatywa: Testcontainers (Postgres) – czysty kontener per run.

MSW na integracje z zewnętrznymi usługami (email/drukarka).

### 9.3 E2E Tests — Status: ⬜ Not started

Playwright + user-flow. Minimalne dane tworzone przez UI (bez seedów).

  - ⬜ 9.3.1 Full production workflow — 🟢 P0

Flow: WO → Scanner Process (staging/weight/complete) → Pack → QA COA → Trace check → Export.

Assercje: KPI tiles, status WO, QA gate, COA PDF otwiera się, trace działa.

  - ⬜ 9.3.2 Warehouse operations workflow — 🟢 P0

Flow: ASN→GRN→LP→Putaway (Pick/Putaway UI) → Stock Move → Split LP → Trace (drzewo) → Export LP.

Assercje: lokacje, parent/child LP, retry flows, wydruk etykiety (PDF).

  - ⬜ 9.3.3 Scanner operations workflow — 🟢 P0

Flow: mobilny StageBoard → Process Terminal (błędy + retry toast) → Pack Terminal (paleta + label).

Assercje: tryb „gruba rękawica”, duże przyciski, barcode input, landscape.

Setup 9.3

Device profiles:

Desktop (Chromium).

Android-like viewport dla Scanner (np. Zebra TC).

Artefakty: wideo, screeny, trace.zip; upload do CI artefaktów.

### 9.4 Performance Testing — Status: ⬜ Not started

  - ⬜ 9.4.1 Large dataset testing — 🟢 P0

Generator: skrypt budujący duże zbiory: 100k LP, 1M stock_moves, złożone genealogie.

Cel: sprawdzić ładowanie tabel (virtualization), filtry, eksporty XLSX (stream).

  - ⬜ 9.4.2 Query performance verification

Narzędzia: EXPLAIN ANALYZE, pg_stat_statements, indeksy.

Progi: kluczowe zapytania < 300 ms p95 (P0); < 150 ms p95 (P1).

  - ⬜ 9.4.3 API response time monitoring

Metryki: p50/p95/p99, error rate, timeouts.

Budżet: większość endpointów < 500 ms p95 (P0).

Alerting: CI performance gate (k6 thresholds), dashboard w CI.

  - ⬜ 9.4.4 UI responsiveness with large datasets

Narzędzia: Lighthouse CI + React Profiler.

Budżet: TTI < 3 s (p95) na widokach list; pagination + infinite scroll, memoizacja, Suspense.

### 9.5 Type Safety & Deployment Prevention — Status: ✅ core strict; pre-push pending

  - ⬜ 9.5.1 Pre-commit Type Checking — 🟢 P0

  - ⬜ 9.5.1.1 Husky pre-commit ✅ (wg SETUP_TYPE_CHECKING.md).

  - ⬜ 9.5.1.2 pnpm type-check w hooku (frontend+backend).

  - ⬜ 9.5.1.3 ESLint w hooku: pnpm lint (no-warnings-as-errors dla CI).

  - ⬜ 9.5.1.4 Prettier auto-format (pnpm format:check + --write local).

  - ⬜ 9.5.1.5 Import validation: eslint-plugin-import (no unresolved).

  - ⬜ 9.5.1.6 Pre-push: pnpm test (unit+integration smoke) + pnpm build (szybki dry-run).

  - ⬜ 9.5.2 TypeScript Configuration — ✅ core strict

  - ⬜ 9.5.2.1 "strict": true

  - ⬜ 9.5.2.2 "noImplicitAny": true

  - ⬜ 9.5.2.3 "strictNullChecks": true

  - ⬜ 9.5.2.4 "incremental": true

  - ⬜ 9.5.2.5 "noUnusedLocals": true — 🟡 P1

  - ⬜ 9.5.2.6 "noUnusedParameters": true — 🟡 P1

  - ⬜ 9.5.3 Common Deployment Error Prevention — 🟢 P0

  - ⬜ 9.5.3.1 Audyt props komponentów (niepełne typy) — wprowadzić Required<>, Partial<>, Omit<> zgodnie z kontraktem.

  - ⬜ 9.5.3.2 Weryfikacja enum statusów (centralne typy z generowanych definicji, zero „string-literalów” w kodzie).

  - ⬜ 9.5.3.3 Naprawa starych importów i aliasów (tsconfig paths, eslint-import resolver).

Lista z DEPLOYMENT_ERRORS_ANALYSIS.md jako checklista w CI (komentarz w PR).

  - ⬜ 9.5.4 Type Check Commands (referencja)
  # Full project
pnpm type-check

# Frontend only
cd apps/frontend && pnpm type-check

# Backend only
cd apps/backend && pnpm type-check

# Pre-commit simulation (all checks)
pnpm pre-commit

  - ⬜ 9.5.5 Deployment Checklist — 🟢 P0 (egzekwowane automatem)

Przed KAŻDYM commit/deploy:

pnpm type-check MUST PASS (hook).

Brak błędów TS w build logu.

Importy poprawne, typy pełne, enumy zdefiniowane.

Podgląd Vercel preview bez błędów konsoli.

Najczęstsze wpadki: brak wymaganych pól w mapowaniach, złe statusy, złe ścieżki importu, typ number vs string w formularzach, opcjonalne vs wymagane — zabezpieczyć regułami ESLint + zod.

CI/CD (skrót)

Macierze zadań: unit (Vitest), integration (Supertest + DB schema tmp), e2e (Playwright, nightly/cron), perf (k6, on-demand), type-check, lint.

Artefakty: raporty testów, screeny, PDF/CSV eksportów (dla reproducibility).

Flaky tests: auto-retry 1x (Playwright), quarantine tag + ticket.

Czas wykonania: równoległość, cache pnpm + cache Playwright.

Pytania doprecyzowujące (żeby domknąć P0 bez reworku)

Środowisko integracyjne: preferujesz tymczasowe schematy w jednej bazie, czy oddzielny kontener DB per run (Testcontainers)?

Zakres E2E: które flow obowiązkowo codziennie, a które nightly (dłuższe)?

Budżety wydajności: potwierdzasz progi (API p95 < 500 ms; zapytania < 300 ms p95)? Inne krytyczne endpointy do osobnych SLO?

Docelowe urządzenia do testu mobilnego (Scanner): profil przeglądarki (Chromium Mobile) wystarczy, czy chcesz pipeline z Android WebView?

Retencja artefaktów (wideo/screeny/raporty): ile dni trzymać?

Raporty dla biznesu: czy generujemy cyklicznie (cron) „Health of Tests” (liczba testów, flaki, czas) na mail/Teams?

Propozycje rozbudowy (po P0)

Mutation testing (Stryker) dla krytycznych funkcji (yield, variance, QA gate).

Contract testing (Pact/Prism) FE↔BE i BE↔zewnętrzne usługi (drukarka/ERP).

Security checks: skan zależności (OWASP/Dependabot), sekretów (gitleaks), analiza SAST (ESLint security rules).

Synthetic monitoring: proste sondy po wdrożeniu (healthcheck API, tworzenie i odczyt przykładowego WO/LP w środowisku preview).

Dash testów: metryki w CI (Grafana/Datadog) – trend czasu, flakiness, najwolniejsze testy.

A/B w E2E: losowe dane (fuzz) w E2E do wykrywania ukrytych edge-cases.

Playwright Component Testing dla krytycznych komponentów tabel/modali (szybsze niż pełne E2E).

Podsumowanie

Domykamy Unit/Integration/E2E/Perf z jasnymi narzędziami, izolacją danych i progami jakości.

Wzmacniamy type-safety gates (pre-commit, pre-push, strict TS) oraz checklisty wdrożeniowe.

Zapewniamy powtarzalność (fabryki danych, brak seedów stałych), metryki, i ścieżki rozbudowy (mutation/contract/perf-monitoring).

## 10.0 Documentation & Deployment — plan wdrożenia (TODO2.md)

Zasady ogólne

Styl i standard: jedna konwencja dla całej dokumentacji (Markdown + MDX opcjonalnie).

Jakość: linting (markdownlint, prettier), sprawdzanie linków (link-checker), pisownia (cspell – słownik PL/EN), walidacja fragmentów kodu/JSON.

Automatyzacja: skrypty generujące fragmenty docs z kodu (Zod/OpenAPI/typy Supabase), pre-commit na format + linki, CI na budowę docsa i żywe linki.

Wersjonowanie: numerowanie rozdziałów, CHANGELOG per moduł, sekcja „Co nowego” w każdym przewodniku.

Obrazki/diagramy: Mermaid (ERD/sequence/flow), zrzuty ekranu z UI, panele “Before/After” w Delta Guide.

Dwujęzyczność (opcjonalnie P1): PL (domyślnie), EN w kolejnej iteracji.

### 10.1 Documentation Updates — Status: 🔄 ~80% (guidy do domknięcia)

Celem jest spójny pakiet: referencje, przewodniki modułowe, przewodnik produkcyjnych różnic (Delta), integracja skanera, podręcznik użytkownika.

  - ⬜ 10.1.1 API_REFERENCE.md (updated 2025-11-03) — P0 audyt + auto-generacja

Zakres / Plan:

 Źródło prawdy: automaty z kodu → docs (Zod/OpenAPI z komentarzy JSDoc).

 Struktura: Auth & Roles, Endpoints by domain (Planning/Warehouse/Production/Scanner/QA/Trace/Exports).

 Kontrakty: request/response, kody błędów, przykłady 200/4xx/5xx, ograniczenia (rate/size).

 Stabilność: wersje API (x-api-version), znaczniki Breaking change.
DoD/AC: CI generuje referencję bez błędów; linki do komponentów UI i modeli DB.

  - ⬜ 10.1.2 SYSTEM_OVERVIEW.md (updated 2025-11-03) — P0 aktualizacja mapy systemu

 Architektura logiczna: moduły (Planning/Warehouse/Production/Scanner/QA/Trace/Exports).

 Integracje (drukarki sieciowe, mail, future ERP), przepływy danych (diagam sequence).

 Tabela ról i uprawnień (RBAC) + główne reguły RLS.
DoD: komplet map + słownik pojęć (LP, GRN, WO, TO, QA, COA).

  - ⬜ 10.1.3 PAGE_REFERENCE.md (updated 2025-11-03) — P0 odświeżenie i powiązania

 Spis wszystkich stron widoków (tabele / modale / szczegóły / terminale).

 Linki krzyżowe do COMPONENT_REFERENCE.md i Module Guides.

 „User Journeys” (np. GRN→LP→Putaway).
DoD: każda strona ma właściciela i status (MVP/Polish/Backlog).

  - ⬜ 10.1.4 COMPONENT_REFERENCE.md (updated 2025-11-03) — P0 kompletacja props + stany

 Dla każdego komponentu: props, kontrakty, zdarzenia, stany ładowania/błędu, testy.

 Tabela mapowania komponent ↔ strona ↔ endpoint.
DoD: brak „niekompletnego typu” (align z 9.5.3).

  - ⬜ 10.1.5 DATABASE_SCHEMA.md (reviewed 2025-11-03) — P0 ERD + indeksy + RLS

 ERD Mermaid (LP/GRN/WO/Trace/QA/PrintQueue), klucze, indeksy.

 Sekcja RLS: polityki by role/tenant (przykłady SQL).

 Checklista migracji (kolejność, zależności).
DoD: diagram zgodny z rzeczywistym schematem po migracjach.

  - ⬜ 10.1.6 MODULE_GUIDES (warehouse, production, planning, technical) — P0 rozszerzenie

 Każdy przewodnik: Cel, Modele danych, API, UI widoki, Terminal (jeśli dotyczy), Scenariusze krok-po-kroku, Błędy i recovery, FAQ.

 Sekcja „KPI & raporty” + „Integracje” + „Uprawnienia”.
DoD: scenariusze E2E zrzutami ekranu; spójne nazewnictwo.

  - ⬜ 10.1.7 AI_QUICK_REFERENCE.md (updated 2025-11-03) — P0

 Szybkie skróty do API, enumów, nazw pól; makra snippetów.

 „Gotowe prompt-y” do generowania fragmentów kodu/testów.
DoD: skróty zgodne z bieżącymi nazwami i endpointami.

  - ⬜ 10.1.8 AI_CONTEXT_GUIDE.md (updated 2025-11-03) — P0

 Kontekst projektowy, słownik realiów biznesowych (mięso/FG/DG/LP/QA).

 Wytyczne jak pytać model o kod/testy/dokumentację.
DoD: brak sprzeczności z Module Guides.

  - ⬜ 10.1.9 Production Delta Guide — 🟢 P0 (NOWE)

 „Delta” między stanem Plan vs Real: różnice funkcji, ograniczenia, workarounds, plan konwergencji.

 Tabele Before/After, zagrożenia (risks), rollback.
DoD: gotowa checklista do Go-Live.

  - ⬜ 10.1.10 Scanner Integration Guide — 🟢 P0 (NOWE)

 Profile urządzeń (Zebra etc.), tryb „gruba rękawica”, skanery (1D/2D), drukarki sieciowe.

 Mapy akcji: Stage, Process, Pack, błędy i retry.

 Konfiguracja drukarek (IPP/LPR/RAW), kolejka i retry.
DoD: kompletna instrukcja dla wdrożeniowca IT i brygadzisty.

  - ⬜ 10.1.11 User Manual — 🟡 P1

 Podręcznik rolowany: Operator, Magazynier, Planista, QA, Supervisor.

 Scenariusze: GRN, Putaway, Split LP, Pack, Trace, COA, raporty.
DoD: PDF/WWW z indeksami i wyszukiwaniem.

### 10.2 Seed Data — Status: ⬜ Not started (DEV/TEST only; nie na PROD)

Seed będzie idempotentny i izolowany: uruchamiany w dev/test, w CI na tymczasowym schemacie. Zero trwałych seedów w środowisku produkcyjnym.

  - ⬜ 10.2.1 Update seed script with realistic data — 🟢 P0

 Skrypt pnpm db:seed --env=dev|test --size=small|medium|large.

 Realistyczni suppliers, products (RM/DG/FG), warehouses/locations, strefy, KPI.

 Zgodność walut/podatków z Supplier (bez ręcznej waluty w PO).

  - ⬜ 10.2.2 1:1 flags in BOM items — 🟢 P0

 Ustawianie consume_whole_lp=true/false na pozycjach BOM (dla testów 1:1).

 Scenariusze: operacje z twardą 1:1 i bez.

  - ⬜ 10.2.3 Reservations test data — 🟢 P0

 Przykładowe WO/TO z rezerwacjami LP, kolizje rezerwacji.

 Sprawdzenie „reservation-safe operations” (API).

  - ⬜ 10.2.4 Compositions test data — 🟢 P0

 Łączenie/split LP (parent/child), lp_compositions i lp_genealogy.

 Palety mieszane i jednorodne.

  - ⬜ 10.2.5 Cross-WO scenarios — 🟢 P0

 Zużycie LP z jednego WO w innym (walidacje), trace „cross-WO”.

 Raport niezgodności (do QA/Trace testów).

  - ⬜ 10.2.6 Traceability chains — 🟢 P0

 Głębokie łańcuchy: GRN→PR→FG→Paleta→TO; forward/backward.

 Weryfikacja eksportów trace/raportów.

DoD/AC Seed:

Komenda seed działa wielokrotnie (idempotent), czyści po sobie w trybie --ephemeral.

Testy integracyjne/E2E wykorzystują seed w izolowanych schematach.

### 10.3 Supabase Deployment — P0 Go-Live checklist

  - ⬜ 10.3.1 Apply all migrations (001–009) — 🟢 P0

 Pre-flight: backup, search_path, rozszerzenia (UUID, pgcrypto), statement_timeout.

 Kolejność migracji + idempotencja (IF NOT EXISTS).

 Po migracji: ANALYZE, reindeksacja jeśli potrzeba.

  - ⬜ 10.3.2 Verify schema integrity — 🟢 P0

 Diff check: deklaracje vs rzeczywista DB (skrypt porównujący).

 ERD z DB i porównanie do DATABASE_SCHEMA.md.

 Spójność kluczy obcych, on delete/update.

  - ⬜ 10.3.3 Test RPC functions — 🟢 P0

 Smoke dla każdej RPC (parametry edge-case, null/empty, auth).

 Czas odpowiedzi p95 < 300 ms (logi pg_stat_statements).

  - ⬜ 10.3.4 Verify RLS policies — 🟢 P0

 Testy ról (Operator/QA/Supervisor/Admin), próby niedozwolone → 403.

 Multi-tenant: dane izolowane (tenant_id w kluczowych tabelach).

 Audyt SELECT/INSERT/UPDATE/DELETE (policy coverage).

  - ⬜ 10.3.5 Multi-tenant smoke-test — 🟢 P0

 2 fikcyjne tenanty; pełne flows: PO→ASN→GRN→LP, WO→Output, Trace, Exports.

 Eksporty honorują RLS; brak wycieków danych.

 Metryki: p95 API < 500 ms; błędy < 1%.

Dodatkowo (Deployment hygiene):

 supabase gen types → aktualizacja typów w repo przed deploy.

 Environment matrix: DEV/TEST/STAGE/PROD (klucze, URL-e, profile drukarek).

 Rollbacks: plan przywrócenia (ostatni backup + re-apply migracji).

 Observability: logi DB/API, dashboard podstawowych metryk (p50/p95, error rate).

Propozycje nowych funkcji / rozszerzeń (po P0)

Docsite (np. Docusaurus/Next): wersjonowana dokumentacja z wyszukiwarką, automatyczne publikacje z CI.

„Docs as Code” pipelines: build linków, sprawdzanie obrazków, ostrzeżenia o osieroconych stronach.

Słownik danych (Data Dictionary): wygenerowany z DB (kolumny, typy, RLS, indeksy) + opisy biznesowe.

ADR (Architecture Decision Records): zwięzłe decyzje architektoniczne (np. 1:1 LP, FEFO, kolejka wydruków).

Runbooki operacyjne: szybkie procedury incident response (drukarki, kolejka print, trace out-of-memory, „brudna” migracja).

Release Notes automation: automatyczny changelog z etykiet PR (docs/dev/breaking/feature).

Katalog scenariuszy szkoleniowych: PDF/MP4 z walkthrough dla ról (Operator/Magazynier/QA).

„Single Source of Truth” dla statusów/enumów: generator wyprowadza tabele w docs + typy TS + walidacje Zod.

Pytania doprecyzowujące (żeby zamknąć P0 bez reworku)

Hosting dokumentacji: publikujemy docsa jako statyczną stronę (np. Docusaurus/Next) czy zostaje tylko w repo?

Języki: czy na P0 trzymamy wyłącznie PL, a EN dopiero na P1 (User Manual + API excerpt)?

Poziom szczegółowości User Manual: „krok-po-kroku” z ekranami i ikonami (dłuższy), czy skrócone cheat-sheety per rola?

Seed: potwierdzasz, że seed jest wyłącznie dla dev/test/CI, a na PROD zero automatycznego zasilania?

Okno migracyjne: czy mamy z góry ustalone sloty na migracje prod (np. niedziela 02:00 UTC) i maksymalny downtime?

Backup i retencja: jak często snapshot DB i jak długo trzymamy (30/90 dni)?

Multi-tenant: czy w PROD startujemy od 1 czy od razu kilku tenantów? (wpływa na smoke-testy po deploy).

Szablony w Delta/Scanner Guide: czy dostarczamy gotowe „checklisty laminowane” dla hal (druk A4, PL)?

Wymogi zgodności (np. HACCP/IFS/BRC): czy COA/User Manual powinny zawierać konkretne klauzule?

Harmonogram P0 (szacunki łączne)

10.1: audyt + uzupełnienia referencji/guidów (w tym Delta/Scanner) — 3–4 dni.

10.2: seed (idempotentny + łańcuchy trace/cross-WO) — 1.5–2 dni.

10.3: deploy Supabase (migracje, RLS, RPC, multi-tenant smoke) — 1–1.5 dnia.

Efekt P0: kompletne, spójne dokumenty operacyjne + przewodniki wdrożeniowe, realistyczne dane testowe (dev/test/CI), bezpieczny i powtarzalny deploy z kontrolą jakości i gotowymi runbookami.

**Status: ⬜ Not started**

Przyszłe ulepszenia — szczegółowa analiza

### 11.1 Zaawansowane funkcje zestawienia komponentów (faza 19)

Zaawansowane funkcje zestawienia komponentów koncentrują się na poprawie integralności danych, kontroli zmian i współpracy w zarządzaniu zestawieniami komponentów. Te ulepszenia zapewniają, że BOM są dokładne, dobrze ustrukturyzowane i odpowiednio zarządzane, co z kolei przynosi korzyści produkcji, zapobiegając błędom i usprawniając procesy zmian. Najważniejsze funkcje obejmują:

  - ⬜ 11.1.1 Wykrywanie cyklicznych odwołań do BOM (🟡 P1):
  Ta funkcja automatycznie sprawdza odwołania cykliczne w BOM (gdzie produkt jest błędnie wymieniony jako osobny komponent, bezpośrednio lub pośrednio) i uniemożliwia użytkownikom zapisywanie takich BOM-ów. Cykliczne BOM mogą prowadzić do poważnych problemów w planowaniu produkcji – na przykład systemy MRP (Material Requirements Planning) mogą wpadać w nieskończone pętle, próbując rozbić okrągły BOM, powodując awarie lub zawieszanie się systemu. Skutkują one również niedokładnym planowaniem (nieudane planowanie zapotrzebowania materiałowego) i zniekształconymi agregacjami kosztów. Wykrywając i blokując odwołania cykliczne, system zachowuje integralność danych i zapewnia, że BOM pozostaje właściwą hierarchią (skierowany graf acykliczny).
Korzyści: Planiści i planiści produkcji mogą ufać, że dane BOM są prawidłowe, unikając opóźnień lub awarii systemu. Zapobiega katastrofalnym błędom w planowaniu, zapewnia prawidłowe obliczenia wymagań materiałowych i oszczędza czas, który zostałby zmarnowany na rozwiązywanie problemów z błędami BOM.

  - ⬜ 11.1.2 Walidacja formatu wersji (wyrażenie regularne):
  wymusza spójny schemat przechowywania wersji dla zestawień komponentów lub wersji produktu przy użyciu wyrażeń regularnych. Na przykład system może wymagać, aby identyfikatory wersji były zgodne ze wzorcem (np. v1.0 lub formatem wersji semantycznej). Ta walidacja ma miejsce, gdy użytkownicy tworzą lub korygują zestawienia komponentów, upewniając się, że wpisy, takie jak numery wersji, kody wersji lub identyfikatory części, są zgodne ze zdefiniowanym formatem.
Korzyści: Standaryzacja formatów wersji zapobiega nieporozumieniom i błędom wynikającym z niespójnego nazewnictwa. Ułatwia to również sortowanie i porównywanie wersji BOM. Dzięki wczesnemu wykrywaniu błędów formatu zespoły produkcyjne i zaopatrzeniowe zawsze będą odwoływać się do właściwych wersji projektu, co zmniejsza ryzyko użycia nieaktualnych lub nieprawidłowych zestawień komponentów. Spójne wersjonowanie jest szczególnie ważne, gdy wiele działów (inżynieria, produkcja, zakupy) koordynuje zmiany, ponieważ pozwala uniknąć nieporozumień spowodowanych literówkami lub numeracją ad hoc.

  - ⬜ 11.1.3 Walidacja materiału typu produktu:
  Implementuje reguły, które weryfikują zawartość BOM na podstawie typu lub kategorii produktu. Na przykład, jeśli produkt jest typu "Produkt spożywczy", BOM może zezwalać tylko na składniki z zatwierdzonych kategorii, a jeśli produkt to "Elektronika", muszą być obecne określone kody materiałów. System może sprawdzić krzyżowo każdy komponent pod kątem dozwolonych list materiałów lub specyfikacji dla tego typu produktu.
Korzyści: Zapewnia to zgodność z zasadami projektowania i normami branżowymi. W produkcji taka walidacja zapobiega niewłaściwemu wykorzystaniu materiałów (np. użyciu materiału nieprzeznaczonego do kontaktu z żywnością w BOM produktu spożywczego), które może prowadzić do problemów z jakością lub niezgodności z przepisami. Skutecznie służy jako brama jakości na etapie projektowania – zanim BOM dotrze do fabryki, wszystkie wymienione komponenty są potwierdzane jako odpowiednie dla tego produktu, zmniejszając niespodzianki na hali produkcyjnej i zapewniając płynność procesów produkcyjnych.
• 1 2 2 3 2 3 • • 1

  - ⬜ 11.1.4 Maksymalny limit głębokości zestawienia komponentów:
  Narzuca górny limit głębokości (poziomów hierarchicznych) zestawień komponentów. Na przykład system może ograniczyć zagnieżdżanie BOM do, powiedzmy, 10 poziomów. Jeśli użytkownik spróbuje dodać podkomponent poza dozwoloną głębokość, system zablokuje go lub wyświetli ostrzeżenie.
Korzyści: Ograniczenie głębokości BOM sprawia, że struktura produktu jest łatwa do opanowania i optymalizuje wydajność systemu. Bardzo szczegółowe zestawienia komponentów mogą być oznaką błędów (takich jak niezamierzona rekurencja) lub mogą komplikować planowanie produkcji i prowadzić do wolniejszych obliczeń. Ograniczając głębokość, zapewniamy, że struktury BOM pozostają wydajne i łatwiejsze w nawigacji dla personelu produkcyjnego. Wymusza również modularyzację złożonych produktów w rozsądny sposób. Z punktu widzenia produkcji kontrolowana hierarchia zestawienia komponentów sprawia, że śledzenie etapów montażu i miejsca, w którym każdy podzespół wchodzi w grę, ułatwia w ten sposób komunikację i zmniejsza liczbę błędów montażu.

  - ⬜ 11.1.5 Narzędzie do porównywania zestawień komponentów (różnica wizualna):
  Narzędzie do porównywania dwóch zestawień komponentów (lub dwóch wersji tego samego zestawienia komponentów) obok siebie, podkreślając różnice. Ta funkcja przedstawiałaby wizualną różnicę – np. listę komponentów, z kodowaniem kolorami lub znacznikami dodanych, usuniętych lub zmienionych elementów (zmiany ilości itp.). Użytkownicy mogą wybrać dowolne dwie wersje zestawienia komponentów i szybko dostrzec nowe komponenty, usunięte części lub zmiany ilości lub atrybutów.
Korzyści: Jest to niezwykle przydatne w zarządzaniu zmianami inżynieryjnymi oraz dla planistów produkcji podczas oceny zmian. Zapewnia, że każda aktualizacja projektu produktu jest jasno zrozumiała: zespół zakupowy może zobaczyć, jakie nowe części kupić, zespół produkcyjny widzi, które etapy montażu mogą ulec zmianie itp. Identyfikując rozbieżności na pierwszy rzut oka, narzędzie zmniejsza nieporozumienia. Ogólnie rzecz biorąc, skraca to proces przeglądu zmian BOM i pomaga zachować dokładność – produkcja może kontynuować produkcję na podstawie najnowszych informacji, mając pewność, że wszystkie różnice w stosunku do poprzednich wersji zostały uwzględnione.

  - ⬜ 11.1.6 Przeglądarka historii BOM (oś czasu):
  Widok osi czasu zmian BOM w czasie, zasadniczo historia wersji dla każdego BOM. Może to być przedstawione jako chronologiczna lista wersji (ze znacznikami czasu, autorami i podsumowaniami zmian) lub nawet interaktywny interfejs użytkownika osi czasu. Użytkownicy (zwłaszcza inżynierowie lub menedżerowie) mogą kliknąć punkt w czasie, aby zobaczyć stan BOM w tej wersji i ewentualnie porównać go z innymi wersjami (łącząc się z narzędziem do porównywania). Wiodące systemy PLM kładą nacisk na taką historię osi czasu, aby śledzić, kto, co, kiedy zmienia BOM.
Korzyści: Ta funkcja zapewnia identyfikowalność i odpowiedzialność za zmiany w projekcie produktu. W przypadku produkcji posiadanie historii BOM oznacza, że jeśli pojawią się jakiekolwiek problemy (np. problem produkcyjny lub problem z jakością), można prześledzić wstecz przez wersje BOM, aby zobaczyć, kiedy dany komponent został wprowadzony lub zmieniony. Pomaga to w analizie przyczyn źródłowych – na przykład: "Zaczęliśmy dostrzegać awarie w jednostkach zbudowanych w zeszłym tygodniu; co ostatnio zmieniło się w BOM?" Ponadto w branżach regulowanych lub w każdej firmie z formalnym procesem kontroli zmian, historia BOM (z zatwierdzeniami i przyczynami) ma kluczowe znaczenie dla zgodności. Przeglądarka osi czasu wspiera w ten sposób wymagania audytu i zapewnia, że wszyscy pracują nad prawidłową wersją BOM w dowolnym momencie.

  - ⬜ 11.1.7 Przepływ pracy zatwierdzania BOM:
  Ustanawia formalny przepływ pracy służący do przeglądania i zatwierdzania BOM lub zmian BOM przed ich zwolnieniem do produkcji. Zamiast zezwalać na natychmiastowe, niezweryfikowane zmiany BOM, zmiany przechodziłyby przez etapy (np. Wersja robocza → Przesłana do zatwierdzenia → Zatwierdzona). Określone role (inżynierowie, kierownicy projektów, właściciele produktu itp.) musieliby być zatwierdzani na każdym etapie, a tylko zatwierdzone BOM-y mogą być używane do produkcji. Rozwiązuje to problem nieodpowiedniego nadzoru obserwowany w wielu organizacjach – gdzie wiele osób edytujących BOM-y bez nadzoru może wprowadzać błędy.
Korzyści: Przepływ pracy zatwierdzania zapewnia dokładność i spójność zestawienia komponentów. Zapobiega to przedostawaniu się nieautoryzowanych lub przypadkowych zmian do hali produkcyjnej. Jak zauważono w analizie branżowej, brak formalnego procesu przeglądu/zatwierdzania może prowadzić do błędów BOM, a nawet prześlizgiwania się cyklicznych odniesień. Wymagając zatwierdzeń, firma wymusza kontrole międzydziałowe (np. inżynieria weryfikuje projekt, zaopatrzenie sprawdza dostępność/koszt komponentów, inżynieria produkcji potwierdza możliwość wyprodukowania). To • • 4 4 5 4 • 6 • 7 7 2 znacznie zmniejsza ryzyko niespodzianek produkcyjnych – takich jak montaż z niewłaściwymi lub nieistniejącymi częściami – unikając w ten sposób przestojów w produkcji i braków produkcyjnych spowodowanych błędami BOM. Zwiększa to również odpowiedzialność: każda zmiana jest dokumentowana i zatwierdzana przez osobę odpowiedzialną, co motywuje zespoły do ostrożnego obchodzenia się z danymi. Podsumowując, chroni proces produkcyjny przed kosztownymi błędami i dostosowuje zmiany BOM do biznesowych przepływów pracy (takich jak zlecenia zmian inżynieryjnych).

  - ⬜ 11.1.8 Śledzenie przyczyn zmian:
  Nakłada obowiązek podania przyczyny lub opisu za każdym razem, gdy wprowadzana jest istotna zmiana w zestawieniu komponentów lub powiązanych danych podstawowych. System doda pole "Przyczyna zmiany" w formularzu rewizji BOM lub żądania zmiany, a informacje te zostaną zarejestrowane (prawdopodobnie w ścieżce audytu lub historii BOM). Praktyka ta jest powszechna w regulowanych systemach elektronicznej dokumentacji – na przykład wytyczne FDA dotyczące zapisów elektronicznych wymagają odnotowania przyczyny krytycznych zmian.
Korzyści: Wymaganie podania przyczyny zmian dodaje kontekst do edycji zestawienia komponentów, co jest nieocenione dla zespołów niższego szczebla. Pracownicy produkcji i inżynierowie ds. jakości mogą zrozumieć, dlaczego komponent został wymieniony lub zmieniono ilość – np. "Zmieniono kondensator C1 z 10 uF na 22 uF, aby rozwiązać problem ze spadkiem napięcia". Ten kontekst pomaga w rozwiązywaniu problemów i zapewnia, że wszyscy rozumieją intencje stojące za zmianami. Zniechęca również do niepoważnych edycji lub prób i błędów, ponieważ inżynier musi zarejestrować uzasadnienie. Jeśli chodzi o zgodność i ciągłe doskonalenie, posiadanie repozytorium przyczyn zmian pozwala firmie analizować najczęstsze przyczyny aktualizacji BOM (błędy projektowe, problemy z dostawcami, optymalizacje kosztów itp.) i usprawniać proceses na wczesnym etapie. Co więcej, w połączeniu z przepływem pracy zatwierdzania, tworzy solidny system kontroli zmian: osoby zatwierdzające widzą podany powód i mogą ocenić, czy jest on prawidłowy przed zatwierdzeniem. Ogólnie rzecz biorąc, śledzenie przyczyn zmian przyczynia się do przejrzystości i jest podstawą systemu gotowego do audytu, zapewniając, że produkcja przebiega na odpowiednio sprawdzonych i uzasadnionych konfiguracjach BOM.
(Stan: Nie uruchomiono — zestaw funkcji po MVP. Te ulepszenia BOM znacznie poprawiłyby niezawodność produkcji i zarządzanie danymi po wdrożeniu).

### 11.2 Ulepszenia zleceń pracy (faza 20)

Ulepszenia zlecenia pracy (WO) są ukierunkowane na fazę realizacji produkcji, w której zlecenia produkcyjne są zarządzane i aktualizowane. Funkcje te mają na celu poprawę sposobu obsługi zmian w zamówieniach pracy (zwłaszcza gdy zmieniają się definicje produktów lub wymagania), wychwytywanie konfliktów lub błędów w czasie rzeczywistym (często poprzez skanowanie kodów kreskowych na hali produkcyjnej) oraz usprawnienie cyklu życia zleceń roboczych dzięki lepszym zatwierdzeniom i integracji z zakupami. Łącznie sprawią, że operacje na hali produkcyjnej będą bardziej odporne na zmiany i zmniejszą liczbę błędów podczas realizacji zamówień. Najważniejsze ulepszenia obejmują:

  - ⬜ 11.2.1 Interfejs API aktualizacji migawek WO:
  Wprowadza interfejs API (i prawdopodobną logikę zaplecza) w celu zaktualizowania migawki BOM lub instrukcji zlecenia pracy. W wielu systemach, gdy tworzone jest zlecenie pracy, wykonuje ono "migawkę" BOM produktu i marszruty w tym czasie – tak, że nawet jeśli główny BOM zmieni się później, WO kontynuuje z pierwotnie zaplanowanymi komponentami (chyba że zostanie zaktualizowany ręcznie). Ta funkcja umożliwiłaby programowe lub systematyczne aktualizowanie migawki WO do najnowszego BOM/wersji w razie potrzeby. Na przykład, jeśli nastąpi zmiana inżynieryjna (aktualizacja BOM) w trakcie WO (lub przed jego rozpoczęciem), system może zastosować te zmiany do otwartego WO za pośrednictwem tego interfejsu API.
Korzyści: Zapewnia elastyczność w synchronizowaniu zleceń pracy ze zmianami w projekcie. Bez takiego mechanizmu aktualizacji wszelkie zmiany BOM miałyby zastosowanie tylko do nowych WO, a istniejące zamówienia mogą albo produkować przestarzałe wersje produktów, albo wymagać ręcznej przeróbki. Aktualizując migawkę za pomocą interfejsu API, można to zrobić w kontrolowany, audytowany sposób – prawdopodobnie wiążąc się z przepływem pracy zatwierdzania (patrz 11.2.4). Dla produkcji oznacza to, że • 8 8 9 8 • 3 bieżące zlecenia pracy można dostosować do zmian (użyć odpowiednich części) bez konieczności anulowania i ponownego tworzenia zleceń przez planistów. Zmniejsza to ilość odpadów i zapewnia, że produkt końcowy nie jest zbudowany zgodnie z przestarzałą specyfikacją. Co więcej, posiadanie tego jako interfejsu API oznacza, że systemy zewnętrzne lub zautomatyzowane skrypty mogą uruchamiać aktualizacje w ramach procesu zmian inżynieryjnych, zapewniając, że nic nie zostanie pominięte.

  - ⬜ 11.2.2 Podgląd migawki z różnicą:
  Przed zaktualizowaniem migawki WO ta funkcja pokaże podgląd zmian – zasadniczo różnicę między bieżącym planem WO a nowym proponowanym BOM/routingiem. Jest to podobne w duchu do wizualnego porównania BOM (11.1.5), ale koncentruje się na określonym zleceniu pracy. Interfejs użytkownika może wskazać, które składniki zostaną dodane, usunięte lub dostosowane pod względem ilości, jeśli migawka zostanie odświeżona.
Korzyści: Zapewnia planistom i kierownikom produkcji przejrzystość w zakresie tego, co dokładnie zmieni się w zamówieniu w trakcie procesu. Ma to kluczowe znaczenie dla podejmowania decyzji: na przykład, jeśli zmiana BOM dodaje nowy komponent, planista może upewnić się, że komponent jest dostępny przed zatwierdzeniem aktualizacji. Lub jeśli zmiana usunie komponent, który został już częściowo użyty, mogą zaplanować, jak sobie z tym poradzić (na przykład złomować lub przerobić). Podgląd różnic zapobiega ślepym aktualizacjom – użytkownicy nie zostaną zaskoczeni niezamierzonymi konsekwencjami. W ten sposób działa jako zabezpieczenie utrzymania stabilności produkcji. Podsumowując, pomaga uniknąć konfliktów i błędów produkcyjnych, umożliwiając dokładny przegląd zmian przed ich zastosowaniem w rzeczywistym zamówieniu.

  - ⬜ 11.2.3 Wykrywanie konfliktów:
  Ta funkcja prawdopodobnie odnosi się do automatycznego wykrywania konfliktów podczas aktualizowania zlecenia pracy lub podczas jego wykonywania. Konflikty mogą obejmować scenariusze, takie jak: BOM zlecenia pracy jest aktualizowany, podczas gdy dane z hali produkcyjnej (takie jak zużycie komponentów lub skanowanie) są już zarejestrowane, co prowadzi do niezgodności; lub dwie różne aktualizacje/zmiany, które mają wpływ na to samo zlecenie pracy; lub niezgodność między zleceniem pracy a innymi dokumentami (takimi jak zamówienie zakupu lub alokacja zapasów). System sprawdzi warunki, takie jak "komponent X w nowym BOM nie jest w magazynie, ale zamówienie zostało rozpoczęte" lub "zamówienie jest w połowie wykonane, a zmiana spowoduje usunięcie części, która jest już używana".
Korzyści: Wczesne wykrywanie konfliktów zapobiega sytuacjom, w których zmiany zakłócają produkcję w połowie. Zapewnia, że każda modyfikacja zlecenia pracy jest wykonalna i bezpieczna. Na przykład, jeśli zostanie wykryty konflikt (na przykład próba usunięcia części, która jest już zużyta), system może ostrzec użytkownika i zablokować zmianę lub zasugerować środki zaradcze (takie jak anulowanie zużycia tej części lub podzielenie zamówienia). Dzięki temu produkcja nie jest zamylona na linii produkcyjnej – pracownicy nie otrzymają nagle zaktualizowanej instrukcji, która jest sprzeczna z tym, co robili do tej pory. Skutecznie działa jako warstwa walidacji, aby utrzymać spójność zleceń pracy. Proaktywnie rozwiązując konflikty, unikamy przestojów w produkcji, przeróbek lub problemów z jakością, które wynikałyby z niespójnych instrukcji.

  - ⬜ 11.2.4 Zatwierdzanie aktualizacji migawki:
  Wiąże aktualizację migawki (11.2.1) z przepływem pracy zatwierdzania. Zamiast automatycznie aktualizować zlecenie pracy do nowej wersji BOM, zmiana może wymagać zatwierdzenia przez niektóre role (kierownik produkcji, inżynieria, dział jakości itp.), zanim zacznie obowiązywać. System może wysłać powiadomienie, że "Zlecenie pracy #1001 ma dostępną aktualizację BOM – proszę zatwierdzić lub odrzucić". Osoby zatwierdzające mogą zapoznać się z różnicami (11.2.2) i wszelkimi ostrzeżeniami o konflikcie (11.2.3) przed potwierdzeniem aktualizacji.
Korzyści: Zapewnia to kontrolę i nadzór podczas zmiany aktywnych zleceń produkcyjnych. Zlecenia pracy są często umowami wykonawczymi z produkcją – ich zmiana w locie może mieć wpływ na koszty, czas i jakość. Wymagając zatwierdzenia, firma zapewnia, że takie zmiany są celowe i uzgodnione. Zmniejsza to chaos w hali produkcyjnej: operatorzy zobaczą zmiany wprowadzone dopiero po odpowiedniej autoryzacji, której prawdopodobnie towarzyszy komunikacja lub zmienione instrukcje. Dla produkcji oznacza to płynniejsze przejścia, gdy konieczne są zmiany, oraz unikanie nieautoryzowanego majstrowania przy zamówieniach (co w przeciwnym razie mogłoby prowadzić do błędnych kompilacji). Zasadniczo formalizuje proces modyfikowania bieżącego zamówienia, dodając odpowiedzialność. Uzupełnia to również przepływ pracy zatwierdzania BOM – zmiana inżynieryjna • • • 4 jest zatwierdzana na poziomie projektu, a następnie rzeczywiste aktualizacje zamówienia są również zatwierdzane na poziomie realizacji, co zapewnia podwójną kontrolę, czy produkcja rzeczywiście wdroży zamierzoną zmianę.

  - ⬜ 11.2.5 Tabela reguł walidacji skanera:
  Prawdopodobnie tabela konfiguracyjna, która definiuje reguły wprowadzania i walidacji skanera kodów kreskowych w systemie produkcyjnym. W praktyce podczas operacji produkcyjnych pracownicy często skanują kody kreskowe materiałów, partii, numerów zleceń itp. Ta funkcja pozwoliłaby administratorom skonfigurować określone reguły walidacji – na przykład: "Podczas skanowania komponentu pod kątem zlecenia pracy upewnij się, że zeskanowany element należy do BOM tego zamówienia" lub "Sprawdź, czy data ważności numeru partii nie jest przeterminowana". Tabela reguł może zawierać listę różnych kontekstów skanowania i kontroli do wykonania (takich jak format wyrażenia regularnego, istnienie w bazie danych, sprawdzanie stanu itp.).
Korzyści: Zapewnia elastyczność i solidność korzystania ze skanowania kodów kreskowych na hali produkcyjnej. Dzięki zewnętrznej konfiguracji reguł (bez kodowania na stałe), system może łatwo dostosować się do nowych wymagań lub formatów kodów kreskowych. W przypadku produkcji walidacja skanera oznacza, że błędy, takie jak skanowanie niewłaściwego przedmiotu lub niewłaściwej partii, mogą być natychmiast wychwycone. Na przykład, jeśli operator przypadkowo zeskanuje komponent, który nie należy do zamówienia, system odrzuci go zgodnie z regułami – zapobiegając potencjalnemu pomyłce. Zmniejsza to błędy ludzkie przy wyborze i użytkowaniu materiałów, które są częstym źródłem problemów z jakością. Ponadto może egzekwować reguły biznesowe (np. używać tylko materiałów, które przeszły kontrolę jakości, za pomocą reguły). Ogólnie rzecz biorąc, ustrukturyzowane podejście do walidacji skanera zwiększa dokładność i wskazówki dla operatora, zapewniając wykorzystanie odpowiednich części i danych w produkcji.

  - ⬜ 11.2.6 Informacja zwrotna o walidacji w czasie rzeczywistym:
  Gdy operator skanuje kod kreskowy lub wprowadza dane do zlecenia pracy, system natychmiast przekazuje informację zwrotną, jeśli coś jest nie tak. Idzie to w parze z wersją 11.2.5 – w miarę stosowania reguł każde niepowodzenie walidacji natychmiast ostrzega użytkownika (np. dźwięk brzęczyka i błąd na ekranie w przypadku korzystania z urządzenia przenośnego lub podświetlony komunikat o błędzie na terminalu). Informacje zwrotne w czasie rzeczywistym mogą mieć również zastosowanie do innych funkcji wprowadzania danych w WO (takich jak wprowadzanie ilości przekraczających dozwolone limity lub pomijanie wymaganego kroku).
Korzyści: Natychmiastowa informacja zwrotna ma kluczowe znaczenie na linii produkcyjnej. Dzięki temu pracownicy mogą na miejscu korygować problemy – na przykład, jeśli zeskanowano niewłaściwy komponent, mogą natychmiast wymienić go na właściwy przed kontynuowaniem. Zapobiega to rozprzestrzenianiu się błędów w dół linii (wyłapywaniu ich u źródła). Przyspiesza to również szkolenie nowych operatorów: system skutecznie "szkoli" ich, wskazując błędy w momencie ich wystąpienia, co pomaga im szybciej nauczyć się prawidłowych procesów. Ponadto walidacja w czasie rzeczywistym zmniejsza potrzebę przeprowadzania kontroli jakości po fakcie w celu wychwycenia błędów danych, ponieważ błędy zostały już wychwycone podczas realizacji. Podsumowując, funkcja ta poprawia wydajność pierwszego przejścia i zmniejsza liczbę poprawek, zapewniając, że każdy krok jest wykonywany prawidłowo, poprawiając w ten sposób ogólną jakość i wydajność produkcji (ponieważ błędy są natychmiast wykrywane i usuwane, co skutkuje mniejszą ilością odpadów i wyższą jakością produkcji).

  - ⬜ 11.2.7 Rejestrowanie błędów skanera:
  Rejestruje wszystkie działania związane ze skanowaniem oraz wszelkie błędy lub nieprawidłowe skanowania, które wystąpiły. Za każdym razem, gdy walidacja skanowania nie powiedzie się (zgodnie z 11.2.5/11.2.6), system rejestruje zdarzenie – w tym szczegóły, takie jak znacznik czasu, użytkownik, to, co zostało skanowane i jaka reguła została naruszona lub komunikat o błędzie. Może również rejestrować udane skanowania w celu śledzenia. Dziennik błędów może być przeglądany przez przełożonych lub dział IT w celu zidentyfikowania wzorców (np. czy niektóre stacje lub niektóre elementy często powodują błędy skanowania).
Korzyści: Rejestrowanie błędów skanera pozwala na ciągłe doskonalenie zarówno systemu, jak i procesu. W przypadku zarządzania produkcją dzienniki te mogą wskazywać problemy ze szkoleniem lub wady procesów. Na przykład, jeśli wielu operatorów próbuje zeskanować konkretny stary kod kreskowy, który nie jest już ważny, być może potrzebne jest lepsze szkolenie lub bardziej przejrzyste etykietowanie. Jeśli określona reguła sprawdzania poprawności jest wyzwalana bardzo często i spowalnia pracę, być może reguła wymaga dostosowania. Z technicznego punktu widzenia dzienniki pomagają debugować problemy z integracją (na przykład jeśli format kodu kreskowego nie jest rozpoznawany). Ponadto prowadzenie historii wszystkich zeskanowanych danych wejściowych jest przydatne dla identyfikowalności – jest to część • • 10 10 • 5 ścieżki audytu dotyczącej tego, kto co zrobił w zleceniu pracy. W branżach regulowanych może to być ważne, aby pokazać, że użyto właściwych przedmiotów. Ogólnie rzecz biorąc, ta funkcja wspiera produkcję, zapewniając, że wszelkie problemy ze skanowaniem nie pozostaną niezauważone – można je naprawić, zmniejszając w ten sposób powtarzające się błędy i przestoje spowodowane problemami ze skanerem.

  - ⬜ 11.2.8 Ulepszenie wstępnego wypełniania zamówienia:
  "wstępne wypełnianie zamówienia" prawdopodobnie odnosi się do automatycznego wypełniania niektórych pól zamówienia zakupu lub powiązanych formularzy w oparciu o kontekst, aby zaoszczędzić użytkownikowi wysiłku i zapewnić spójność danych. W środowiskach produkcyjnych powszechne jest tworzenie zamówień zakupu materiałów lub usług podwykonawczych. To ulepszenie może oznaczać, że gdy użytkownik tworzy zamówienie zakupu na podstawie zlecenia pracy lub wymagania BOM, system wstępnie wypełnia je znanymi informacjami (np. listą wymaganych komponentów, które wymagają zakupu, preferowanym dostawcą z pozycji głównej, potrzebną ilością na podstawie WO itp.). Może to również dotyczyć wypełniania planowanych dat dostaw na podstawie harmonogramu produkcji lub kopiowania kodów projektu.
Korzyści: Usprawnia to interfejs między planowaniem produkcji a zaopatrzeniem. Gdy planowane jest zlecenie produkcyjne i staje się jasne, że niektóre komponenty są krótkie, generowanie zamówienia zakupu staje się szybsze i mniej podatne na błędy dzięki automatycznemu wstępnemu wypełnianiu. Zapewnia to, że zamówienie zakupu idealnie dopasowuje się do potrzeb produkcji (prawidłowe kody artykułów, ilości i daty przydatności do spożycia), zmniejszając problemy z komunikacją między działami. Ograniczając ręczne wprowadzanie danych, zapobiega to również literówkom lub pominięciom, które mogłyby opóźnić dotarcie materiału. Krótko mówiąc, przyspiesza cykl zaopatrzenia w materiały produkcyjne. Jest to szczególnie przydatne w przypadku operacji just-in-time, w których szybkość i dokładność zamówień zakupu może mieć wpływ na ciągłość produkcji. Ulepszenie może również obejmować wstępne wypełnianie danych w zleceniach pracy z powiązanych danych, ale biorąc pod uwagę termin "wstępne wypełnianie zamówień", prawdopodobnie dotyczy to formularzy zaopatrzenia. Z korzyścią dla produkcji oznacza to, że potrzebne zasoby są zamawiane z minimalnym opóźnieniem i prawidłowo, co wspiera terminową produkcję przy mniejszej liczbie braków magazynowych.
(Status: Nie rozpoczęto – po MVP. Te ulepszenia zleceń pracy, po wdrożeniu, zredukują przestoje w produkcji i błędy, sprawiając, że zlecenia pracy będą bardziej adaptacyjne i niezawodne w obliczu zmian oraz poprawią interakcje operatora z systemem).

### 11.3 Zaawansowane funkcje produkcyjne (Faza 21)

Zaawansowane funkcje produkcyjne mają na celu wzbogacenie podstawowego modułu produkcyjnego o możliwości często spotykane w bardziej zaawansowanych systemach realizacji produkcji (MES) lub systemach planowania produkcji. Funkcje te będą wspierać złożone scenariusze produkcyjne (takie jak proceses wieloetapowe), zapewnią lepszą jakość produktu i identyfikowalność oraz poprawią szybkość reakcji i wydajność na hali produkcyjnej, nawet w trudnych warunkach, takich jak awarie sieci lub operacje o wysokiej przepustowości. Każdy z poniższych elementów przyniesie wymierne korzyści w zakresie zarządzania produkcją i jej realizacji:

  - ⬜ 11.3.1 Ulepszenia routingu wielofazowego:
  Zwiększa możliwości routingu produkcji w celu bardziej elastycznej obsługi proceses wielofazowych lub wieloetapowych. W produkcji marszruta to sekwencja operacji (faz) potrzebnych do zbudowania produktu. Ulepszenia routingu wielofazowego mogą obejmować obsługę operacji równoległych, warunkowe rozgałęzianie procesów lub po prostu lepszą obsługę podzespołów, które same przechodzą przez oddzielne mini-trasy przed dołączeniem do głównej linii. Może to również obejmować powiązanie wielu zleceń pracy lub zadań w spójny, wieloetapowy przepływ pracy (na przykład faza 1 wytwarza półprodukt, który jest następnie wykorzystywany w fazie 2).
Korzyści: Dzięki temu system może dokładniej modelować złożone procesy produkcyjne. Dla zespołu produkcyjnego oznacza to, że oprogramowanie może obsługiwać rzeczywiste procesy bez żadnych obejść – np. jeśli dwa etapy mogą przebiegać równolegle (powlekanie jednej części podczas montażu innej), system może to odzwierciedlić, umożliwiając lepsze planowanie i wykorzystanie zasobów. Może również usprawnić obliczanie czasu realizacji, uwzględniając nakładające się na siebie fazy lub identyfikując • • 6 wąskich gardeł między fazami. Usprawniając wieloetapowe wyznaczanie tras, zapewniamy, że planowanie produkcji jest bardziej precyzyjne, a instrukcje wykonania dla pracowników są jasne dla każdej fazy. Zasadniczo produkcja może być zoptymalizowana, ponieważ czas i wymagania każdej fazy są znane, a system może je zsynchronizować. Skraca to czas bezczynności między fazami, poprawia przepustowość i zapewnia lepszy wgląd w pracę w toku na każdym etapie tworzenia produktu. Pomaga również w identyfikowalności i jakości – na przykład, jeśli produkt wymaga fazy kontroli po określonej operacji, routing może wymusić tę fazę, zapewniając, że żaden produkt nie pominie wymaganych kroków kontroli jakości.

  - ⬜ 11.3.2 Polityka trwałości (wielopoziomowa):
  Wprowadza zaawansowaną obsługę materiałów z ograniczeniami dotyczącymi terminu ważności lub okresu przydatności do spożycia, przy użyciu podejścia opartego na polityce wielopoziomowej. Wielopoziomowa polityka trwałości może oznaczać ustanowienie wielu reguł lub statusów czasowych dla zapasów. Na przykład poziom 1: gdy do wygaśnięcia przedmiotu pozostało 30 dni, oznacz go jako "Zbliża się wygaśnięcie" (do użytku, ale wymaga priorytetu); Poziom 2: gdy w ciągu 7 dni od wygaśnięcia wymagają zgody organu nadzoru na użycie; Poziom 3: jeśli wygasł, całkowicie zablokuj użycie. Może również odnosić się do obchodzenia się z okresem przydatności do spożycia na różnych poziomach – e.g. raw materiały kontra produkty gotowe, z których każdy rządzi się własnymi prawami. Dodatkowo, wielopoziomowość może obejmować zarówno strategie FIFO, jak i FEFO w zależności od potrzeb (First-In-First-Out vs First-Expired-First-Out).
Korzyści: Pomaga to bezpośrednio w utrzymaniu jakości produktu i zgodności z normami bezpieczeństwa. W przypadku produkcji polityka trwałości zapewnia, że materiały są używane w optymalnej kolejności – zwykle FEFO ma kluczowe znaczenie: najpierw należy użyć najstarszego lub najwcześniej przeterminowanego materiału, aby zapobiec marnotrawstwu. Wielopoziomowe powiadomienia i reguły oznaczają, że system może proaktywnie podpowiadać użycie zapasów, które w przeciwnym razie straciłyby ważność, zmniejszając w ten sposób ilość odpadów z powodu przeterminowanych zapasów. Zapobiega również przypadkowemu użyciu przeterminowanych składników, co w branżach takich jak żywność czy farmacja ma kluczowe znaczenie dla bezpieczeństwa konsumentów i zgodności z przepisami. Wdrażając to na poziomie systemu, zmniejsza zależność od ręcznych kontroli przeprowadzanych przez pracowników. Planowanie produkcji można dostosować, jeśli wykryte zostaną zapasy bliskie wygaśnięcia – na przykład zaplanuj partię tak, aby wcześniej zużyć partię bliską wygaśnięcia (priorytetowe traktowanie zamówień na użycie rzeczy, które wygasają za 5 dni, zanim wygaśnie za 20 dni). Ostatecznie ta cecha prowadzi do zmniejszenia ilości odpadów, lepszego bezpieczeństwa produktu i prawdopodobnych oszczędności kosztów dzięki unikaniu utylizacji przeterminowanych materiałów. Może również zautomatyzować zgodność z normami, takimi jak FIFO/FEFO w magazynach, które są wymagane przez niektórych klientów lub audyty (np. BRC, FDA) w celu zapewnienia identyfikowalności.

  - ⬜ 11.3.3 Zaawansowana identyfikowalność (drzewo LP viz):
  Zapewnia wizualizację drzewa tablic rejestracyjnych (LP) na potrzeby genealogii produktów i identyfikowalności. W tym przypadku "tablica rejestracyjna" odnosi się do unikalnych identyfikatorów (kodów kreskowych) przypisywanych do pojemników, palet lub partii materiałów – powszechna praktyka w magazynach i produkcji przy śledzeniu partii. Funkcja ta graficznie pokazywałaby relacje tych identyfikatorów od surowców do produktu końcowego w strukturze drzewa. Na przykład, możesz wybrać numer seryjny lub numer partii produktu końcowego i zobaczyć jego "drzewo genealogiczne": które podzespoły i partie weszły w jego skład, a niżej, które partie surowców trafiły do tych podzespołów itp., wszystkie zidentyfikowane przez ich kody LP lub partii. Zasadniczo jest to budowanie widoku genealogii produktu , w którym każdy węzeł w drzewie jest wejściem lub wyjściem etapu produkcyjnego.
Korzyści: To znacznie zwiększa możliwość śledzenia partii, co ma kluczowe znaczenie w przypadku problemów z jakością lub wycofania produktów z rynku. Jeśli wada zostanie znaleziona w partii wyrobów gotowych, drzewo LP pozwala szybko prześledzić wstecz do wszystkich podejrzanych partii surowców lub etapów procesu i odwrotnie, zidentyfikować wszystkie inne produkty, w których wykorzystano tę samą partię surowca. Jak opisuje Parsec Automation, dokładne śledzenie genealogii zapewnia kompleksową historię każdego elementu, wyszczególniając surowce, sprzęt i procesy, umożliwiając weryfikację każdego komponentu i szybką izolację defektów. W przypadku zarządzania produkcją wizualizacja ta sprawia, że złożone dane są zrozumiałe na pierwszy rzut oka – zwłaszcza w przypadku wielopoziomowych BOM-ów i ponownego wykorzystania partii pośrednich. Pomaga odpowiedzieć na pytania takie jak: "Jeśli ta część dostawcy była uszkodzona, których produktów końcowych to dotyczy?" lub "Jakie komponenty zostały użyte w tej konkretnej wysłanej jednostce?". Jest to nie tylko cenne dla wewnętrznej kontroli jakości, ale często jest niezbędne do zapewnienia zgodności z przepisami w branżach takich jak lotnictwo, motoryzacja, żywność, farmacja itp., gdzie • 11 12 13 • 14 15 7 musisz udowodnić identyfikowalność. Dzięki łatwemu w obsłudze narzędziu wizualnemu reagowanie na problemy staje się szybsze i bardziej precyzyjne, co potencjalnie minimalizuje zakres wycofań lub dochodzeń. Co więcej, zwiększa zaufanie klientów – firma może wykazać się solidną identyfikowalnością podczas audytów lub zapytań klientów. W codziennym użytkowaniu może również uwypuklić nieefektywność procesu poprzez analizę drzewa (na przykład zbyt wiele rozbieżnych podpartii może wskazywać na nieefektywność grupowania). Podsumowując, wizualizacja drzewa LP wzmacnia zapewnienie jakości i zgodność, przekształcając surowe dane dotyczące identyfikowalności w przydatne informacje.

  - ⬜ 11.3.4 Monitorowanie w czasie rzeczywistym (WebSocket):
  Implementuje aktualizacje danych produkcyjnych w czasie rzeczywistym za pośrednictwem WebSockets (lub podobnej technologii wypychania). Oznacza to, że pulpity nawigacyjne produkcji, interfejsy użytkownika operatorów i ekrany nadzorcy mogą wyświetlać informacje z dokładnością do sekundy bez ręcznego odświeżania. Dane, takie jak statusy maszyn, liczba produkcji, przestoje, poziomy zapasów itp., mogą być przesyłane w czasie rzeczywistym. Na przykład, jeśli maszyna ulegnie awarii lub zakończy zadanie, ta zmiana stanu zostanie natychmiast odzwierciedlona na pulpicie nawigacyjnym monitorowania dla wszystkich przeglądających.
Korzyści: Widoczność w czasie rzeczywistym jest niezbędnym narzędziem w nowoczesnej produkcji. Umożliwia szybsze podejmowanie decyzji i reagowanie. Jeśli pojawi się problem (błąd maszyny, wada jakościowa, niedobór materiału), wszyscy natychmiast go widzą i mogą zareagować – to znacznie skraca czas reakcji w porównaniu z aktualizacjami wsadowymi lub ręcznymi. Na przykład przełożeni mogą być powiadamiani o zatrzymaniu linii produkcyjnej i mogą wysyłać konserwację lub przekierowywać prace przed utratą godzin. Monitorowanie w czasie rzeczywistym pozwala również na lepszą koordynację: dalsze procesy mogą się przygotować, jeśli widzą, że upstream jest prawie gotowy, konserwacja może zostać wprowadzona, gdy zauważą lukę itp. Z perspektywy ciągłego doskonalenia, strumieniowe przesyłanie danych w czasie rzeczywistym oznacza, że możliwe jest śledzenie OEE (Overall Equipment Effectiveness) na żywo, znajdowanie wąskich gardeł w miarę ich występowania i skuteczniejsze utrzymywanie produkcji zgodnie z harmonogramem. Usprawnia również komunikację – zamiast konieczności zgłaszania statusu przez pracowników lub chodzenia po podłodze w celu zebrania informacji, system zapewnia jedno źródło prawdy widoczne dla wszystkich interesariuszy (w tym zdalnych menedżerów, jeśli ma to zastosowanie). Korzystanie z WebSockets zapewnia aktualizacje o niskich opóźnieniach, co jest kluczowe dla każdego rodzaju systemu andon lub mechanizmu alertów na hali produkcyjnej. Ostatecznie monitorowanie w czasie rzeczywistym zwiększa elastyczność: błędy są szybko wykrywane i rozwiązywane, a produkcja staje się bardziej proaktywna, a nie reaktywna, co prowadzi do mniejszej ilości odpadów, wyższej jakości i lepszego przestrzegania harmonogramów.

  - ⬜ 11.3.5 Operacje wsadowe:
  Ta funkcja prawdopodobnie pozwala na wykonywanie niektórych działań produkcyjnych zbiorczo (na partii przedmiotów/zamówień), a nie pojedynczo. Może to oznaczać możliwość wyboru wielu zleceń pracy i ich zwolnienia/zakończenia/zamknięcia za jednym razem lub przypisania tego samego statusu/aktualizacji do grupy partii produkcyjnych jednocześnie. Inną interpretacją w przemyśle przetwórczym jest obsługa produkcji w partiach (w przeciwieństwie do ciągłego przepływu) ze specyficznym śledzeniem partii – jednak ponieważ identyfikowalność i okres przydatności do spożycia są omówione gdzie indziej, tutaj bardziej prawdopodobne jest, że odnosi się to do masowych operacji użytkownika w oprogramowaniu.
Korzyści: Planiści produkcji i kierownicy hal produkcyjni mogą oszczędzać czas i wymuszać spójność. Na przykład na koniec dnia może zajść potrzeba wykonania wszystkich zleceń pracy, które zostały zakończone — wykonanie tej czynności jako pojedynczej akcji dla 20 zamówień, a nie 20 oddzielnych akcji, zmniejsza obciążenie administracyjne. Zmniejsza to również ryzyko zapomnienia jednego lub dokonania niespójnych wpisów. W przypadku wdrażania wielu podobnych zleceń pracy planista może je duplikować lub edytować zbiorczo (jeśli jest to objęte zakresem tej funkcji), przyspieszając tworzenie harmonogramu. W przypadku przesunięć magazynowych możliwe może być zbiorcze wydawanie materiałów do wielu zamówień. Podsumowując, każda operacja masowa oznacza mniej klikania i większą automatyzację powtarzalnych zadań. Poprawia to wydajność i może skrócić czas spędzony w systemach, dając więcej czasu na faktyczny nadzór nad produkcją. Jeśli interpretacja dotyczy procesów produkcji wsadowej, korzyścią jest to, że system lepiej je modeluje (np. tworzenie rekordu partii, łączenie wielu numerów seryjnych z partią itp.), co wspierałoby branże takie jak farmaceutyczna lub chemiczna, w których śledzenie partii jest normą. W takim przypadku korzyści obejmują zgodność z wymaganiami dotyczącymi ewidencji partii i łatwiejszą identyfikowalność partii. Tak czy inaczej, celem tej funkcji 16 15 • 17 10 18 10 • 8 jest płynna obsługa wolumenu: w miarę rozwoju firmy i posiadania wielu zleceń lub produktów do zarządzania, operacje wsadowe zapewniają skalowalność, dzięki czemu wysiłek związany z zarządzaniem produkcją nie rośnie liniowo wraz z liczbą zamówień.

  - ⬜ 11.3.6 Możliwość kolejki offline:
  umożliwia kontynuowanie działania systemu produkcyjnego nawet wtedy, gdy nie jest podłączony do serwera centralnego lub Internetu - poprzez kolejkowanie transakcji w trybie offline i synchronizację później po powrocie do trybu online. W praktyce oznacza to, że urządzenia na hali produkcyjnej (tablety, skanery, komputery) będą miały tryb offline, w którym użytkownicy mogą nadal wykonywać krytyczne czynności (takie jak tworzenie dzienników, skanowanie zużytych materiałów, wykonywanie kroków), a działania te są przechowywane lokalnie. Po przywróceniu łączności dane w kolejce są przesyłane na serwer i przetwarzane w kolejności.
Korzyści: Jest to duży wzmacniacz niezawodności i ciągłości działania. Linie produkcyjne nie zawsze mogą się zatrzymać tylko z powodu awarii sieci lub konserwacji serwera. Możliwość pracy w trybie offline zapewnia, że przechwytywanie danych i egzekwowanie procesów może być kontynuowane podczas przestojów, dzięki czemu produkcja nie jest blokowana. Zapobiega to utracie danych – bez tego, jeśli sieć ulegnie awarii, operatorzy mogą uciekać się do śledzenia na papierze, a później ręcznego wprowadzania danych, co jest podatne na błędy i czasochłonne. W przypadku kolejek offline system w przejrzysty sposób radzi sobie z zakłóceniami: operatorzy mogą nawet nie być tego świadomi (lub lekko powiadomieni) i kontynuują skanowanie lub wprowadzanie danych, mając pewność, że zostaną one później zsynchronizowane. Skraca to przestoje i frustrację. Jest to szczególnie przydatne dla firm w lokalizacjach, w których sieć Wi-Fi na hali produkcyjnej jest niestabilna lub jeśli działają w lokalizacjach o różnej niezawodności IT. Ponadto kolejka offline może obejmować scenariusze, takie jak zdalny magazyn lub operacja w terenie, która od czasu do czasu synchronizuje się z centralą. Gdy połączenie zostanie przywrócone i nastąpi synchronizacja, mogą istnieć reguły uzgadniające wszelkie konflikty, ale zazwyczaj zapewnia to, że żadne zdarzenia produkcyjne nie zostaną pominięte w systemie. Zasadniczo produkcja nie musi czekać na dział IT – może dalej pracować, a później prowadzenie dokumentacji automatycznie nadrabia zaległości. Ta funkcja podkreśla również niezawodność systemu, co jest kluczowym problemem dla IT w produkcji — obsługując scenariusze offline, łagodzimy klasę potencjalnych przyczyn przestojów w produkcji.

  - ⬜ 11.3.7 Zaawansowane przepływy pracy zapewniania jakości:
  Wprowadza bardziej zaawansowane integracje procesów zapewniania jakości w systemie produkcyjnym. Może to obejmować takie funkcje, jak: punkty kontroli jakości w trakcie procesu (np. obowiązkowa kontrola jakości po określonych operacjach lub w określonych odstępach czasu), zgłaszanie niezgodności i postępowanie bezpośrednio w przepływie pracy produkcji, integracja ze statystyczną kontrolą procesu lub planami pobierania próbek oraz ewentualnie śledzenie CAPA (działań korygujących i zapobiegawczych) w przypadku wszelkich problemów. Może to również obejmować zamknięte przepływy pracy, w których osoba odpowiedzialna za kontrolę jakości musi wylogować się na określonych krokach (cyfrowo), zanim produkcja będzie mogła być kontynuowana, lub automatyczną kwarantannę produktów, które nie przejdą testów. Innym elementem może być umożliwienie użytkownikom kontroli jakości tworzenia żądań wstrzymania jakości, przeprowadzania inspekcji i rejestrowania wyników w systemie, łącząc je ze zleceniem pracy lub partią.
Korzyści: Dzięki głębokiemu osadzeniu kontroli jakości w przepływach pracy produkcji, system zapewnia systematyczne utrzymywanie jakości produktu, a nie bycie jego dodatkiem. Dla operatorów produkcyjnych oznacza to, że będą proszeni o przeprowadzanie kontroli jakości we właściwym czasie i będą mieli jasną metodę rejestrowania wyników lub sygnalizowania problemów. Zmniejsza to prawdopodobieństwo, że wadliwe produkty zostaną przekazane do przodu bez kontroli. Jeśli zostanie znaleziony problem, zaawansowane przepływy pracy mogą automatycznie zatrzymać dalsze przetwarzanie tej partii (zapobiegając marnowaniu wysiłku na znany zły produkt) i powiadomić odpowiedni personel. Z biegiem czasu rejestrowanie szczegółowych danych dotyczących kontroli jakości umożliwia analizę trendów, przyczyn i częstotliwości defektów, co napędza ciągłe wysiłki na rzecz doskonalenia. Co więcej, zaawansowane przepływy pracy QA pomagają w przestrzeganiu norm (ISO 9001, GMP specyficzne dla branży itp.), pokazując, że kontrole jakości są zintegrowane i rejestrowane. Na przykład, jeśli określony pomiar jest niezgodny ze specyfikacją, przepływ pracy może wymagać przeglądu przez przełożonego, a nawet wygenerowania elementu CAPA. Ta ścisła integracja zapewnia, że nie ma drogi na skróty: komuś trudniej jest ominąć wymagany test, ponieważ system go wyegzekwuje (lub nie pozwoli na zamknięcie WO bez zatwierdzenia przez QA). Zwiększa również identyfikowalność, ponieważ wyniki jakości są powiązane z rejestrami produkcji. Ostatecznie lepsze procesy kontroli jakości prowadzą do wyższej wydajności pierwszego przejścia, mniejszej liczby przeróbek i odpadów oraz większego zaufania do spójności produktu.
(Status: Nie rozpoczęto – po MVP. Te zaawansowane funkcje podniosą poziom modułu produkcyjnego, aby poradzić sobie ze złożonością i zapewnić wysoką jakość, co jest szczególnie ważne, gdy system jest skalowany do większej liczby użytkowników i bardziej wymagających środowisk produkcyjnych).

### 11.4 NPD / Zarządzanie pomysłami (Tydz. 9–16)

Ten zestaw funkcji obraca się wokół rozwoju nowych produktów (NPD) i zarządzania pomysłami. Wprowadza dedykowaną przestrzeń w systemie do przechwytywania pomysłów na produkty, zarządzania ich cyklem rozwoju i ostatecznie przekształcania ich w rzeczywiste dane produktu (takie jak BOM-y), jeśli zostaną zatwierdzone. Zasadniczo jest to moduł zarządzania innowacjami zintegrowany z systemem produkcyjnym, zapewniający rejestrowanie koncepcji produktów na wczesnym etapie, współpracę nad nimi i systematyczne rozwijanie ich przez kolejne etapy rozwoju. Odniesienie do osi czasu (tygodnie 9–16) sugeruje, że mogą one być zaplanowane na konkretny kwartał lub fazę rozwoju. Następujące funkcje przyniosą korzyści organizacji poprzez stworzenie potoku od koncepcji do produkcji, usprawnienie współpracy między działami (R&D, techniczne, finansowe, produkcyjne) i utrzymanie przejrzystego rejestru tego, jak produkty ewoluują od pomysłów do rzeczywistości:

  - ⬜ 11.4.1 /npd strona i modal pomysłu (🟡 P1):
  Udostępnia nową sekcję w aplikacji (być może na trasie /npd), która służy jako główny pulpit nawigacyjny lub widok listy dla projektów Ideas/NPD. Modalny pomysł odnosi się do okna dialogowego lub formularza, który pojawia się w celu przesłania nowego pomysłu. Prawdopodobnie obejmuje to takie pola, jak tytuł pomysłu, opis, kategoria, załączniki, imię i nazwisko wnioskodawcy itp., w przyjaznej dla użytkownika formie. Jako priorytet P1, jest to podstawowa funkcja umożliwiająca rozpoczęcie zarządzania pomysłami.
Korzyści: Posiadanie dedykowanej strony NPD oznacza, że wszyscy interesariusze mogą łatwo uzyskać dostęp i zapoznać się z pomysłami na nowe produkty w jednym miejscu – to centralizuje innowacje. Modalny pomysł sprawia, że uchwycenie pomysłu jest proste; Pracownicy z dowolnego działu mogli zgłaszać pomysły (np. pracownik produkcji może zasugerować ulepszenie produktu) za pomocą ustandaryzowanej formy. Obniża to barierę wejścia dla wkładów i zapewnia, że do każdego pomysłu dostarczane są kluczowe informacje. Korzyścią dla firmy jest wzrost uczestnictwa i przejrzystość we wczesnym cyklu życia produktu. Zamiast gubić pomysły w e-mailach lub rozmowach, są one rejestrowane w systemie. W przypadku produkcji (ostatecznie) oznacza to, że zanim coś stanie się projektem, dostępnych jest wiele kontekstów – dlaczego zostało zaproponowane, jaki problem rozwiązuje – które mogą informować o tym, jak produkcja może podejść do jego tworzenia. Zasadniczo kładzie on podwaliny pod ustrukturyzowany łańcuch innowacji, który może skrócić czas wprowadzania produktów na rynek, ponieważ mniej dobrych pomysłów wpada przez szczeliny.

  - ⬜ 11.4.2 Łączenie wersji roboczej pomysłu → BOM:
  Ta funkcja łączy zatwierdzony lub opracowywany pomysł z wersją roboczą BOM w systemie. Oznacza to, że gdy pomysł przejdzie do określonego etapu (na przykład zdecyduje się go realizować jako projekt), system może wygenerować wersję roboczą BOM dla nowego produktu lub koncepcji albo połączyć wpis pomysłu z istniejącym wpisem BOM. Praktycznie rzecz biorąc, użytkownik może kliknąć "Utwórz wersję roboczą BOM na podstawie pomysłu", co spowoduje utworzenie nowego elementu/produktu w module BOM z odniesieniem do pomysłu.
Korzyści: Wypełnia to lukę między pomysłami a rzeczywistymi danymi produktu. Zapewnia to ciągłość – cała dyskusja i informacje na etapie pomysłu przenoszą się na etap rozwoju produktu. Szkic BOM może być następnie iteracyjnie dopracowywany w miarę projektowania produktu przez dział badawczo-rozwojowy. Dla zespołów produkcyjnych i inżynieryjnych oznacza to mniej zduplikowanych danych (informacje o pomyśle są inicjatorem BOM) i utrzymują one wątek kontekstu. Zawsze mogą prześledzić, z którego pomysłu pochodzi ten BOM i zobaczyć pierwotne wymagania lub zamierzone korzyści z wprowadzenia pomysłu. Może to pomóc w podejmowaniu decyzji projektowych, które są zgodne z pierwotną intencją pomysłu. Ponadto powiązanie pomysłów z wersjami roboczymi zestawień komponentów gwarantuje, że żaden BOM dla nowego produktu nie zostanie utworzony bez pomysłu lub żądania, co dodaje trochę nadzoru (zapobiegając przypadkowym zestawieniom materiałów bez uzasadnienia). To również pomaga w śledzeniu portfolio: możesz później ocenić, które pomysły faktycznie trafiły do produkcji (coś w rodzaju KPI innowacji). Podsumowując, ta funkcja pomaga bezproblemowo przekształcać koncepcje w namacalne wyniki rozwoju, przyspieszając proces rozwoju i zachowując wiedzę w różnych fazach.

  - ⬜ 11.4.3 Przepływ pracy statusu (Pomysł → Deweloper → Przegląd → Zatwierdzony):
  Implementuje zdefiniowany przepływ pracy dla statusu pomysłu, prawdopodobnie obejmujący etapy, takie jak: Pomysł (złożony), W fazie rozwoju (lub projektowania), W trakcie przeglądu i Zatwierdzony (lub może dalej, np. Zrealizowany). Podane strzałki (Idea → Dev → Review → Approved) wskazują co najmniej te cztery etapy. System pozwoli na przenoszenie pomysłu przez te statusy, prawdopodobnie z określonymi uprawnieniami przy każdym przejściu (np. menedżerowie produktu mogą przenieść pomysł do działu rozwoju, komisja oceniająca może oznaczyć go jako zatwierdzony itp.).
Korzyści: Formalny przepływ pracy statusu zapewnia, że każdy pomysł jest śledzony przez ten sam lejek i żaden krok nie jest pomijany. Zapewnia przejrzystość i spójność postępów w realizacji nowych inicjatyw produktowych. Dla organizacji oznacza to większą skuteczność w weryfikowaniu pomysłów – wszyscy wiedzą, że pomysł w "Dev" oznacza, że zespół techniczny pracuje nad koncepcją lub prototypem, "Przegląd" może oznaczać przegląd interdyscyplinarny (w tym finanse, marketing itp.), a "Zatwierdzony" oznacza, że jest zatwierdzony do wdrożenia (być może uruchamia tworzenie BOM lub rozpoczęcie projektu). Pomaga to koordynować działania działów: produkcja może nie być mocno zaangażowana na etapie "pomysłu", ale dzięki "przeglądowi" lub "zatwierdzeniu" wiedzą, że nadchodzi nowy produkt i mogą zacząć rozważać implikacje produkcyjne. Pozwala to również uniknąć powszechnego problemu polegającego na tym, że dobre pomysły popadają w stagnację bez jasności – tutaj, jeśli pomysł utknął w etapie, jest widoczny i ktoś może go popchnąć lub formalnie uśmiercić. Dzięki temu, że mamy odrębne etapy, zespoły mogą ustalać kryteria wejścia/wyjścia dla każdego z nich (na przykład, aby przejść do "Dev", potrzebujesz przybliżonego uzasadnienia biznesowego; aby przejść do "Review", potrzebujesz prototypu i kosztorysu; aby przejść do "Approved", potrzebujesz zgody wszystkich działów). To ustrukturyzowane podejście zmniejsza szansę na wprowadzenie na rynek produktów, które nie zostały przemyślane pod każdym kątem, zwiększając w ten sposób wskaźnik sukcesu i zapewniając, że produkcja jest gotowa, gdy nadejdzie czas (ponieważ przez "Zatwierdzony" przypuszczalnie wykonalność produkcji została sprawdzona).

  - ⬜ 11.4.4 Widoczność oparta na rolach (NPD/Techniczne/Finanse):
  Implementuje kontrolę uprawnień, dzięki czemu różne role lub działy widzą różne podzbiory lub aspekty modułu NPD. Na przykład do pomysłu mogą być dołączone wrażliwe dane finansowe (szacowane koszty, przewidywane marże), które są widoczne tylko dla działu finansowego lub kierownictwa. Zespoły techniczne mogą widzieć szczegóły inżynieryjne, ale być może nie początkowe docelowe koszty, jeśli są one poufne, lub odwrotnie. Pomysły mogą być też szeroko widoczne, ale tylko niektóre role mogą widzieć te oznaczone jako poufne lub mogą je edytować.
Korzyści: Zapewnia to właściwą równowagę między współpracą a bezpieczeństwem. NPD często wiąże się ze strategicznymi decyzjami, które nie wszyscy w firmie powinni zobaczyć, dopóki nie zostaną sfinalizowane (np. radykalny pomysł na nowy produkt lub taki, który wiąże się z tajemnicami własności intelektualnej). Zapewniając widoczność opartą na rolach, firma może zachęcać do szerokiego wkładu w pomysły (każdy może je przesyłać i komentować), jednocześnie ograniczając poufne informacje. Na przykład dział finansowy może dodawać oceny kosztów (patrz 11.4.5), które początkowo widzą tylko dział finansowy i menedżerowie, aby nie ujawniać informacji ani stronniczości. Inny scenariusz: być może istnieje pomysł związany z konkretnym działem, którego inni nie muszą widzieć (aby uniknąć bałaganu lub utrzymać zaskoczenie na rynku). Korzyści dla produkcji są tutaj pośrednie, ale ważne – gdy pracownicy produkcji korzystają z modułu NPD, zobaczą istotne dla nich informacje (takie jak oceny możliwości produkcyjnych, szczegóły techniczne), ale być może nie analizę rynku na wczesnym etapie, która nie jest tak istotna. Dzięki temu interfejs jest czystszy i zapewnia ostrość. Kontrola oparta na rolach pozwala również na bezpieczniejszą współpracę z zewnętrznymi interesariuszami lub innymi działami bez ujawniania wszystkiego – np. użytkownik finansowy może się zalogować, aby zobaczyć tylko ogólne podsumowania pomysłów i dane dotyczące kosztów, a nie całą dyskusję techniczną. Ostatecznie pomaga zachować poufność tam, gdzie jest to potrzebne (ochrona informacji o konkurencji), a także może zapobiec przeciążeniu informacjami poprzez dostosowanie tego, co widzi każda rola. Płynna współpraca wymaga, aby każdy dział czuł się bezpiecznie, dzieląc się istotnymi dla niego informacjami, co ułatwia.

  - ⬜ 11.4.5 Szacowanie kosztów i kalkulacja kosztów zestawienia komponentów:
  Dodaje funkcję umożliwiającą ocenę wpływu pomysłu na koszty i ostatecznie tworzenie szczegółowych zestawień kosztów na podstawie zestawienia komponentów. Na wczesnych etapach pomysłu może to być proste pole lub formularz, w którym menedżerowie ds. finansów lub produktu szacują koszt docelowy lub oczekiwany budżet. Po istnieniu wersji roboczej BOM (od 11.4.2) system może obliczyć kalkulację BOM – sumując koszty komponentów (z bazy danych) w celu uzyskania szacunkowego kosztu produktu. Ewentualnie można go zintegrować z ofertami lub informacjami o dostawcach w celu uściślenia kosztów.
Korzyści: Ta funkcja ma kluczowe znaczenie dla decyzji o zwróceniu lub odrzuceniu pomysłów na nowe produkty. Dzięki wczesnej ocenie kosztów (nawet w przybliżeniu) firma może odfiltrować pomysły, które nie są finansowo wykonalne i skupić się na tych, które mają potencjał. Po połączeniu z BOM zapewnia bardziej oparty na danych wgląd: gdy inżynierowie wybierają komponenty w BOM, agregacja kosztów na żywo może pokazać, czy produkt mieści się w docelowym koszcie, czy nie, umożliwiając korekty, zanim sprawy zajdą za daleko. Dla działów produkcji i zakupów wczesne kalkulacje kosztów BOM oznaczają, że szybciej się angażują – doradzając, czy niektóre części są zbyt drogie, sugerując tańsze alternatywy itp. Pomaga również w strategii cenowej; Znajomość kosztu BOM pomaga ustalić cenę lub zobaczyć marżę zysku. Posiadanie tego w module NPD gwarantuje, że kwestie kosztowe są uwzględniane w procesie rozwoju, a nie dołączane później. Może to skrócić cykl iteracji: zamiast przeprowadzać analizę kosztów w trybie offline w arkuszach kalkulacyjnych, zespół może zobaczyć w systemie, w jaki sposób zmiana komponentu z aluminium na stal, na przykład, może obniżyć koszty. Ponadto, jeśli system obsługuje wiele wersji, można przeprowadzić analizy warunkowe (np. zarządzanie wersjami w wersji 11.4.6 w połączeniu z oceną kosztów: porównaj koszt wersji A i wersji B projektu). Prowadzi to do bardziej zoptymalizowanych ekonomicznie produktów i mniej nieprzyjemnych niespodzianek, gdy produkt jest gotowy do wprowadzenia na rynek, a następnie okazuje się zbyt kosztowny do wyprodukowania. Zasadniczo sprzyja to dyscyplinie od projektowania do kosztów na wczesnym etapie, przynosząc korzyści firmie i zapewniając, że produkcja jest zgodna z celami finansowymi.

  - ⬜ 11.4.6 Zarządzanie wersjami i klonowanie:
  Wprowadza możliwość zarządzania wieloma iteracjami lub wersjami pomysłu lub projektu NPD oraz klonowania pomysłów. Jest to analogiczne do kontroli wersji w zestawieniach materiałowych lub kodzie, ale stosowane do rekordów pomysłów i być może powiązanych z nimi wersji roboczych. Zespoły mogą stworzyć "Wersję 2" pomysłu, aby odzwierciedlić zmiany po otrzymaniu informacji zwrotnych, zachowując oryginał jako historię. Klonowanie pozwoliłoby na stworzenie nowego wpisu pomysłu poprzez skopiowanie istniejącego (przydatne, jeśli chcesz zaproponować wariant lub podobną koncepcję bez zaczynania od zera).
Korzyści: Innowacja jest procesem iteracyjnym – ta funkcja to potwierdza. Zachowując wersje, zespół nie utraci wcześniejszych informacji po wprowadzeniu zmian; Zawsze mogą powrócić lub odwołać się do wcześniejszych koncepcji. Pozwala również na równoległą eksplorację: np. Idea 5 v1 może mieć jedno podejście, a ktoś może sklonować ją do Idea 5 v2 (lub osobnego wpisu pomysłu), aby wypróbować inne podejście, i oba można porównać. Klonowanie oszczędza czas, gdy wiele szczegółów jest podobnych. Na przykład nowy pomysł na produkt dla "Gadget Pro" można sklonować, aby szybko stworzyć pomysł na "Gadget Lite", a następnie dostosować kilka parametrów. Sprzyja to kulturze eksperymentowania, ponieważ łatwo jest rozgałęziać pomysły. Z punktu widzenia produkcji, jeśli wiele wersji przechodzi do prototypowania, produkcja może przygotować się na różne możliwości lub uruchomić linie pilotażowe dla każdej z nich – wiedząc, że każda wersja jest śledzona. Jeśli niektóre wersje zostaną zezłomowane, posiadanie ich w historii jest nadal przydatne do nauki (być może wersja została odrzucona z powodu problemów z produkcją, więc produkcja wie, co zostało wypróbowane). Podsumowując, zarządzanie wersjami zmniejsza zamieszanie (wszyscy wiedzą, która specyfikacja jest najnowszym pomysłem), a klonowanie zmniejsza powielanie się wysiłku, co przyspiesza cykl NPD. Zapewnia również retencję wiedzy: nic nie jest tak naprawdę stracone, co jest świetne dla bazy wiedzy i do audytu, dlaczego podjęto pewne decyzje.

  - ⬜ 11.4.7 Współpraca (komentarze, @mentions):
  Implementuje funkcje społecznościowe w module NPD – użytkownicy mogą komentować pomysły, prowadzić dyskusje w wątkach i oznaczać konkretnych współpracowników (za pomocą @mentions), aby przyciągnąć ich uwagę lub poprosić o opinię. Podobnie jak współpraca w narzędziach takich jak Jira, Confluence czy MS Teams, pozwoliłoby to na rozmowę w kontekście każdego pomysłu.
Korzyści: To znacznie usprawnia wielofunkcyjną pracę zespołową. Zamiast odizolowanych dyskusji na spotkaniach lub e-mailach, wszystkie dane wejściowe dotyczące pomysłu są centralnie widoczne dla każdego, kto ma dostęp. @mentions zapewnić, że odpowiednie osoby będą powiadamiane, gdy potrzebny jest ich wkład lub zatwierdzenie, zapobiegając blokowaniu pomysłów z powodu braku informacji zwrotnych. Na przykład inżynier może @mention kierownika produkcji do sprawdzenia, czy pomysł jest możliwy do wyprodukowania; komentarze kierownika produkcji są następnie rejestrowane, aby wszyscy mogli je zobaczyć i być może oznaczają potencjalne problemy (np. "nie mamy możliwości X dla tego materiału"). Może to skłonić do wczesnych modyfikacji, zamiast wykrywania problemów na końcu. Tworzy żywy zapis ewolucji pomysłu i decyzji podjętych po drodze, co jest nieocenione przy późniejszym przeglądzie lub wdrażaniu nowych członków zespołu do projektu. Funkcje współpracy zwiększają również zaangażowanie – pracownicy są bardziej skłonni do wnoszenia wkładu, gdy jest to tak proste, jak skomentowanie posta, a uznanie (takie jak "@design lead, świetny pomysł!") motywuje zespoły. Ostatecznie lepsza współpraca prowadzi do lepszych wyników: pomysły są weryfikowane z wielu perspektyw (technicznej, produkcyjnej, finansowej, marketingowej) w czasie zbliżonym do rzeczywistego, co prowadzi do dobrze opracowanych koncepcji produktów, które cieszą się akceptacją wszystkich stron. Przełamuje bariery działowe, dając wspólną platformę dialogu skoncentrowaną na pomyśle na produkt. Dodatkowo może przyspieszyć rozwiązywanie problemów – zamiast formalnych spotkań, szybki tag i odpowiedź mogą wyjaśnić problem w ciągu kilku godzin, a nie dni.

  - ⬜ 11.4.8 Pulpit nawigacyjny NPD:
  Dedykowany pulpit nawigacyjny zapewniający przegląd całego procesu NPD i odpowiednich wskaźników. Może to obejmować wizualne wykresy i tabele pokazujące: liczbę pomysłów na każdym etapie (pomysł, rozwój, recenzja, zatwierdzony), być może oś czasu każdego pomysłu (jak długo trwa każdy etap), nadchodzące kamienie milowe lub spotkania przeglądowe, a być może wskaźniki KPI dotyczące innowacji (takie jak współczynnik konwersji pomysłów na zatwierdzone projekty, średni czas od pomysłu do zatwierdzenia itp.). Może również wyróżnić najważniejsze pomysły (według głosów lub wyniku strategicznego) i ewentualnie wyświetlić listę ostatnio zaktualizowanych pomysłów w celu szybkiego dostępu.
Korzyści: Dla kadry zarządzającej jest to spojrzenie z lotu ptaka na innowacje w firmie. Pomaga w zarządzaniu portfelem nowych produktów – umożliwiając priorytetyzację zasobów do najbardziej obiecujących projektów i zapewniając zrównoważony potok (na przykład, jeśli zbyt wiele pomysłów utknęło w Przeglądzie, można interweniować). Zapewnia widoczność: kadra kierownicza może dostrzec postęp i wyczuć puls prac badawczo-rozwojowych bez zagłębiania się w szczegóły. Dla członków zespołu pulpit nawigacyjny może być motywujący, pokazując, że ich pomysły są śledzone i brane pod uwagę. Może również służyć jako kompleksowy raport o stanie – na spotkaniu dotyczącym rozwoju produktu mogą po prostu odwołać się do pulpitu nawigacyjnego, zamiast przygotowywać slajdy. Wskaźniki, takie jak koszt pomysłów w przygotowaniu lub potencjalne przychody (jeśli są zintegrowane), mogą być wyświetlane, co pomaga w strategicznym dostosowaniu do celów firmy. Dodatkowo może pomóc w zidentyfikowaniu wąskich gardeł – np. jeśli wiele pomysłów jest w Dev od > 6 miesięcy, być może występuje problem z zasobami lub paraliż decyzyjny. Dzięki temu, że dane te są przejrzyste, firma może usprawnić swój proces NPD. Wreszcie, powiązanie z produkcją: pulpit nawigacyjny może pokazywać, jak szybko spodziewane są nowe produkty (jeśli pomysł zostanie zatwierdzony, produkcja może przewidzieć nadejście nowego BOM). Zasadniczo zamyka pętlę, ostatecznie łącząc się z głównym harmonogramem produkcji (np. "Produkt X (z Pomysłu #123) przeznaczony do produkcji pilotażowej w trzecim kwartale"). Posiadanie dobrze zarządzanego pulpitu nawigacyjnego NPD wyróżnia zdolność firmy do ciągłego wprowadzania innowacji w kontrolowany, mierzalny sposób – to duża przewaga konkurencyjna.
(Status: Nie rozpoczęto – po MVP, planowane na tygodnie 9–16. Te funkcje NPD, po wdrożeniu, stworzą ustrukturyzowany potok od pomysłu do produkcji, zapewniając, że zanim koncepcja produktu trafi do produkcji, zostanie dokładnie sprawdzona, wyceniona i zatwierdzona z pełnym kontekstem).

### 11.5 Inżynieria / CMMS-lite (Tydz. 12–16)

W tej sekcji przedstawiono funkcje modułu inżynieryjnego lub lekkiego systemu CMMS (Computerized Maintenance Management System). Zasadniczo rozszerza system o wsparcie utrzymania ruchu maszyn i urządzeń, podstawowe zapasy części do konserwacji oraz śledzenie zasobów produkcyjnych i przestojów. "Śledzenie w dwóch trybach (NONE vs LP)" i inne terminy wskazują na to, że system jest elastyczny dla • 13 różnych trybów pracy. Bycie wersją "lite" sugeruje skupienie się na podstawowych potrzebach w zakresie utrzymania ruchu bez pełnej złożoności dedykowanego systemu CMMS, który prawdopodobnie obejmuje najważniejsze funkcje wspierające niezawodność produkcji i utrzymanie sprzętu. Funkcje te, zaplanowane na tygodnie 12–16, mają na celu zapewnienie skutecznego monitorowania i konserwacji sprzętu i procesów produkcyjnych, zapobieganie przestojom i integrację konserwacji z planowaniem produkcji:

  - ⬜ 11.5.1 Śledzenie w dwóch trybach (NONE vs LP) (🟡 P1):
  Wprowadza elastyczność w sposobie śledzenia zapasów i produkcji: w trybie NONE (brak śledzenia tablic rejestracyjnych, tylko zliczanie zbiorcze) lub w trybie LP (śledzenie tablic rejestracyjnych z unikalnymi identyfikatorami dla kontenerów/partii). Zasadniczo system może działać w dwóch trybach w zależności od firmy, a nawet procesu – prostszy dla tych, którzy nie potrzebują szczegółowej identyfikowalności, i tryb szczegółowy dla tych, którzy to robią.
Korzyści: Jest to bardzo ważne, aby produkt był odpowiedni zarówno dla małych, jak i dużych firm. Mniejsze firmy lub te, które mają proste operacje, mogą nie chcieć narzutu związanego z generowaniem i skanowaniem tablic rejestracyjnych dla wszystkiego; Mogą po prostu śledzić materiał według ilości. Tymczasem większe lub regulowane firmy mogą wymagać, aby każda paleta lub partia miała identyfikator w celu zapewnienia identyfikowalności. Obsługując oba te elementy, system staje się bardziej uniwersalny i może zaspokoić różne potrzeby klientów bez konieczności stosowania jednego uniwersalnego rozwiązania. W przypadku produkcji, jeśli działa w trybie NONE, operacje mogą być szybsze i prostsze (mniej skanów, mniej szkoleń, bardziej jak tradycyjne arkusze kalkulacyjne, ale pod kontrolą systemu). W trybie LP produkcja korzysta z pełnej identyfikowalności i kontroli (jak opisano w 11.3.3). Uczynienie go podwójnym trybem oznacza, że firma może zacząć w trybie NONE (dla uproszczenia w MVP), a następnie przejść na tryb LP w miarę rozwoju lub bardziej rygorystycznych wymagań – lub obsługiwać części swojego procesu w jednym trybie zamiast drugiego (np. magazyn używa LP, linia produkcyjna używa NONE, jeśli jest to proces ciągły). Ta elastyczność zapewnia, że wprowadzenie systemu nie wymusza na kliencie niepotrzebnej złożoności, ułatwiając w ten sposób adopcję. Jest to prawdopodobnie priorytet P1, ponieważ wpływa na podstawowy model danych i musi zostać wcześnie rozwiązany. Korzyścią jest szersza atrakcyjność rynkowa (zarówno małe, jak i duże firmy mogą z niego korzystać) i łatwość konserwacji – zamiast oddzielnych systemów, jeden system przełącza tryb. Ponadto, przygotowując się do pracy w dwóch trybach, faza 12 (wielofirmowa) staje się wykonalna, ponieważ ta sama baza kodu może obsługiwać obie warstwy klientów (ze śledzeniem LP lub bez niego).

  - ⬜ 11.5.2 Proste salda zapasów (qty_quarantine):
  Dodaje podstawowe funkcje zarządzania zapasami zorientowane na stan jakości. W szczególności wprowadzamy pole takie jak qty_quarantine, aby śledzić, jaka część elementu magazynowego znajduje się w "kwarantannie" lub jest wstrzymana. Jako "proste" saldo zapasów sugeruje, że oprócz ilości dostępnych zapasów, system będzie teraz rejestrował ilość poddaną kwarantannie (przechowywaną) i ewentualnie dostępną ilość = dostępne zapasy minus poddane kwarantannie. Może to również obejmować inne proste statusy zapasów, takie jak "qty_available" vs "qty_damaged", ale wspomina się o kwarantannie, która jest powszechna w kontroli jakości.
Korzyści: W przypadku zarządzania produkcją i magazynem ma to kluczowe znaczenie, aby przedmioty, które nie powinny być używane, nie zostały przypadkowo zużyte. Stado poddane kwarantannie to zazwyczaj te, które oczekują na inspekcję lub nie spełniają niektórych kryteriów i nie mogą być wykorzystane w produkcji, dopóki nie zostaną usunięte. Dzięki jawnemu modelowaniu system może wymusić, że takie zapasy nie są przydzielane do zlecenia pracy lub kompletowane (podobnie jak w przypadku prawidłowego WMS/ERP, który by je zablokował). Jest to "uproszczona" funkcja inwentaryzacji, ponieważ może uniknąć pełnego asortymentu w wielu lokalizacjach, ale przynajmniej obejmuje wymagany status. Obecność qty_quarantine oznacza, że na przykład, jeśli 100 sztuk jest w magazynie, a 20 jest w trakcie kontroli jakości, MRP lub planiści zobaczą tylko 80 dostępnych jednostek, co zapobiega nadmiernemu zaangażowaniu. Wiąże się to z przepływami pracy wysokiej jakości (jeśli partia się nie powiedzie, ustawiasz jej qty_quarantine = wszystko, co pozostało, dzięki czemu jest skutecznie usuwana z użytecznego inwentarza do czasu podjęcia decyzji). Z punktu widzenia konserwacji/inżynierii, jeśli jest to również używane do części zamiennych, można poddać kwarantannie części zamienne, które są wadliwe lub nieprzetestowane. Ogólnie rzecz biorąc, poprawia dokładność inwentaryzacji i zapewnienie jakości. Przygotowuje to również grunt pod przyszłą rozbudowę: jest to krok w kierunku mini-systemu WMS. Korzyścią produkcyjną jest unikanie używania lub wysyłania materiałów niezgodnych z wymaganiami, co chroni jakość produktu i bezpieczeństwo klienta. Usprawnia zgodność z normami, które wymagają wyraźnej segregacji materiałów niewydanych. Ta funkcja prawdopodobnie oznacza również jakiś interfejs użytkownika do oznaczania przedmiotów jako poddanych kwarantannie/zwolnionym i prawdopodobnie podstawowe inwentaryzacje, aby pokazać te liczby.

  - ⬜ 11.5.3 Planowanie konserwacji maszyny:
  Wprowadza możliwość planowania zadań konserwacji sprzętu (maszyn). Jest to podstawowa funkcja CMMS – prawdopodobnie umożliwiająca tworzenie zleceń prac konserwacyjnych lub wpisów w kalendarzu dla każdej maszyny, takich jak rutynowe zadania konserwacji zapobiegawczej (PM) (np. "Sprawdzaj i smaruj przenośnik #3 co 1 miesiąc"). System może umożliwiać definiowanie planów konserwacji z częstotliwością (wyzwalacze oparte na czasie lub użyciu), a następnie generowanie przypomnień lub zadań w odpowiednim czasie.
Korzyści: Prawidłowo zaplanowana konserwacja zapewnia płynną pracę maszyn i minimalizuje awarie. System pomoże zespołowi inżynieryjnemu/konserwacyjnemu nie polegać na pamięci ani oddzielnych arkuszach kalkulacyjnych – zamiast tego poinformuje ich o terminie wykonania czynności konserwacyjnej. Może to znacznie skrócić nieplanowane przestoje, ponieważ sprzęt jest regularnie serwisowany (dzięki czemu problemy są wcześnie wykrywane lub można im zapobiec). W przypadku produkcji mniej awarii oznacza dłuższy czas pracy bez przestojów i bardziej stałą wydajność. Planowanie konserwacji pomaga również w planowaniu zasobów: jeśli maszyna będzie nieczynna z powodu PM w piątek, produkcja może planować wokół tego (na przykład zaplanować inny produkt lub przesunąć pracę na inną maszynę). Z biegiem czasu przyczynia się to do wydłużenia żywotności sprzętu i zapewnienia bezpieczeństwa. Dodatkowo, posiadanie go w systemie oznacza, że rejestrowana jest historia konserwacji – przydatna do zapewnienia zgodności (niektóre branże wymagają dowodu konserwacji) oraz do podejmowania decyzji o inwestycjach kapitałowych (znajomość częstotliwości/kosztów konserwacji). Krótko mówiąc, ta funkcja przybliża aplikację do zintegrowanego MES+CMMS, dając pełniejszy obraz operacji dzięki uwzględnieniu opieki nad zasobami. Prawdopodobnie jest "lity", ponieważ może nie mieć wszystkich zaawansowanych funkcji (takich jak automatyczne wyzwalanie czujników lub obszerne śledzenie części na początku), ale nawet podstawowe planowanie i śledzenie przynosi wiele korzyści: płynniejsze operacje i mniej awaryjnych poprawek.

  - ⬜ 11.5.4 Śledzenie przestojów:
  Umożliwia przechwytywanie i analizowanie zdarzeń przestoju maszyny lub linii. Prawdopodobnie oznacza to, że gdy maszyna się zatrzyma (z powodu awarii, konfiguracji lub z innych powodów), użytkownicy mogą zarejestrować zdarzenie w systemie: określając czas, czas trwania i powód (np. awaria, przezbrojenie, brak materiału itp.). Z biegiem czasu system może generować raporty dotyczące przestojów w podziale na maszyny, przyczyny itp. Może to być najpierw rejestrowanie ręczne (wprowadza je operator lub przełożony) lub ewentualnie automatyczne, jeśli w przyszłości zostanie zintegrowane z sygnałami maszyny.
Korzyści: Śledzenie przestojów jest niezbędne do obliczania OEE (całkowitej efektywności sprzętu) i identyfikowania ulepszeń wydajności. Rejestrując każdy przypadek i przyczynę przestoju, zespół produkcyjny może zobaczyć, skąd pochodzi najwięcej strat – np. maszyna A ma częste 5-minutowe przestoje (może wymagać konserwacji lub przeprojektowania) lub dana zmiana ma więcej przestojów (może to być problem ze szkoleniem). Przekształca to, co kiedyś było anegdotycznymi dowodami, w twarde dane. Prowadzi to do ukierunkowanych działań: jeśli "konserwacja" jest główną przyczyną, zainwestuj więcej w konserwację zapobiegawczą; jeśli przyczyną jest "Brak operatora", napraw obsadę personelu; jeśli "wymiana narzędzia" trwa zbyt długo, być może usprawnij ten proces. Ostatecznie zwiększa to wydajność – skrócenie przestojów bezpośrednio zwiększa dostępny czas produkcji. Dla operatorów konieczność rejestrowania przestojów wpaja również świadomość i dyscyplinę (wiedzą, że czas przestoju jest mierzony, więc mogą pracować nad jego zminimalizowaniem lub przynajmniej szybko go rozwiązać). Jeśli chodzi o komunikację, dzienniki przestojów mogą ostrzegać zespoły wsparcia w czasie rzeczywistym – np. w momencie rozpoczęcia przestoju można powiadomić konserwację (powiązanie z funkcją monitorowania w czasie rzeczywistym). Ponadto w ciągu miesięcy i lat dane te pomagają uzasadnić ulepszenia lub inwestycje w nowe maszyny (np. "Ta linia straciła 40 godzin w zeszłym kwartale z powodu X – naprawa X mogłaby zaoszczędzić tyle wydajności"). Śledzenie przestojów jest krokiem w kierunku bardziej zaawansowanych praktyk Lean Manufacturing i zarządzania opartego na wskaźnikach KPI na hali produkcyjnej. Umożliwia również tworzenie pulpitów nawigacyjnych czasu pracy/przestojów, dając kierownictwu bieżący puls na temat stanu produkcji.

  - ⬜ 11.5.5 Konserwacja zapobiegawcza:
  Rozszerzając harmonogram konserwacji, funkcja ta prawdopodobnie odnosi się do ustanowienia programu konserwacji zapobiegawczej w systemie. Może to obejmować zarządzanie listami kontrolnymi PM, łączenie ich z zasobami, śledzenie daty ostatniego wykonania, następnego terminu i upewnianie się, że zadania są wykonywane. Być może nawet uchwycenie procedur konserwacyjnych i oznaczenie ich jako zakończonych za pomocą notatek. Pokrywa się to z planowaniem, ale podkreśla prewencyjny charakter (w przeciwieństwie do konserwacji reaktywnej po awarii).
Korzyści: Udowodniono, że konserwacja zapobiegawcza (PM) zmniejsza liczbę kosztownych awarii i wydłuża żywotność sprzętu. Formalnie wdrażając PM w systemie, firma dba o to, aby utrzymanie ruchu nie było zaniedbywane. System może egzekwować, że pewne PM muszą być wykonane (a nawet może ostrzegać, jeśli PM maszyny jest zaległy i ktoś próbuje zaplanować na niej produkcję). Skutkuje to większą niezawodnością maszyn, co prowadzi do stałej wydajności produkcji. Zwiększa to również bezpieczeństwo – sprzęt, który jest regularnie sprawdzany, jest mniej podatny na katastrofalne awarie lub w sposób, który mógłby zaszkodzić operatorom. Dodatkowo, rejestrowanie zadań PM i ich wyników może pomóc w identyfikacji maszyn, które są problematyczne (jeśli pomimo PM często się psują) wskazując na konieczność wymiany lub remontu. W przypadku planowania zadania PM mogą wymagać przestoju; Planując je za pomocą systemu, planiści produkcji mogą dostosować harmonogramy produkcji do konserwacji (np. wykonać PM w okresie niskiego zapotrzebowania). Wszystko to ogranicza nieplanowane przerwy. Konserwacja prewencyjna jest zwykle częścią zgodności z przepisami w branżach takich jak spożywcza lub farmaceutyczna (zapewnienie czyszczenia i kalibracji sprzętu), więc jej integracja oznacza łatwiejsze raportowanie zgodności. Podsumowując, solidny program PM zarządzany w systemie zapewnia większą dostępność sprzętu, niższe koszty napraw i lepszą jakość produktu (ponieważ maszyny w dobrym stanie wytwarzają bardziej stałą wydajność). Ta funkcja jest prawdopodobnie uważana za "uproszczoną", ponieważ koncentruje się na PM w oparciu o czas – niemniej jednak zapewnia znaczącą wartość, zmieniając kulturę konserwacji z reaktywnego gaszenia pożarów na proaktywną opiekę.

  - ⬜ 11.5.6 Zarządzanie częściami zamiennymi:
  Wprowadza śledzenie zapasów i zużycia części zamiennych, w szczególności na potrzeby działań konserwacyjnych. Może to obejmować posiadanie katalogu części zamiennych (z numerami części, opisami), ilościami magazynowymi każdej z nich i ewentualnie powiązaniem części z maszynami lub zadaniami konserwacyjnymi, do których są używane. Na przykład, jeśli zadanie konserwacyjne polega na wymianie filtra, system może zmniejszyć zapas tego filtra i być może ostrzec, jeśli zapasy są niskie. Może również śledzić, gdzie przechowywane są części zamienne (jeśli jest to proste, może to tylko pole lokalizacji, a nie pełne zarządzanie magazynem).
Korzyści: Zarządzanie częściami zamiennymi zapewnia, że gdy potrzebna jest konserwacja lub naprawa, wymagane części są pod ręką, skracając w ten sposób czas przestoju sprzętu w oczekiwaniu na części. Jeśli maszyna nie działa i odkryjesz, że zapasowego paska nie ma w magazynie, czas przestoju znacznie się wydłuża. Dzięki zarządzaniu częściami zamiennymi zespół może proaktywnie ponownie zamawiać części, zanim się wyczerpią, kierując się poziomami ponownego zamawiania. Skraca to przestoje i przyspiesza naprawy. Pozwala również uniknąć nadmiernych kosztów zapasów poprzez optymalizację poziomów zapasów. Zarządzanie częściami zamiennymi wiąże się również z zarządzaniem kosztami – śledzenie kosztów konserwacji może obejmować używane części. Co więcej, jeśli niektóre części są używane bardzo często, może to sygnalizować głębszy problem (być może podstawową przyczynę, która sprawia, że ta część często ulega awarii). Z drugiej strony, jeśli niektóre części zamienne nigdy nie zostaną użyte, być może są one nadmiernie zaopatrzone. Posiadanie danych pozwala na taką analizę. Z punktu widzenia księgowości ważna jest również znajomość wartości zapasów części zamiennych; Ta funkcja daje temu widoczność. Dodatkowo, powiązanie części z wyposażeniem (zasadniczo zestawienie materiałów dla sprzętu) oznacza, że po utworzeniu zlecenia pracy na konserwację system może sporządzić listę zalecanych części i upewnić się, że są one dostępne. Ogólnie rzecz biorąc, skuteczne zarządzanie częściami zamiennymi zapobiega przedłużającym się przestojom, zapewniając szybki dostęp do części, oszczędza pieniądze, unikając nagłych wysyłek lub pilnych zamówień, a także zwiększa wydajność operacyjną. Jest to kluczowy element doskonałości w zakresie konserwacji. Wdrażając to jako część systemu (nawet jeśli w podstawowej formie), zespoły produkcyjne i konserwacyjne zyskują znacznie lepszą kontrolę nad łańcuchem dostaw utrzymania ruchu, który wspiera ciągłą produkcję bez przykrych niespodzianek.
(Status: Nie rozpoczęto – po MVP, planowane na tygodnie 12–16. Te funkcje inżynieryjne/CMMS-lite zintegrują zarządzanie konserwacją i sprzętem z systemem, poprawiając niezawodność produkcji i czas pracy sprzętu, jednocześnie czyniąc platformę bardziej atrakcyjną dla klientów, którzy chcą kompleksowego rozwiązania dla produkcji i konserwacji).

### 11.6 System ścieżki audytu

System ścieżki audytu polega na wdrażaniu kompleksowego rejestrowania zmian w systemie w celu wspierania odpowiedzialności, identyfikowalności i zgodności. Oznacza to, że każda krytyczna akcja (tworzenie, edytowanie, usuwanie kluczowych rekordów, takich jak BOM-y, zlecenia pracy, korekty zapasów itp.) będzie rejestrowana ze szczegółowymi informacjami o tym, co się zmieniło, kto to zrobił, kiedy i opcjonalnie dlaczego (zobacz śledzenie przyczyn zmian w 11.1.8). Dziennik audytu ma kluczowe znaczenie w branżach regulowanych i ogólnie jest dobrą praktyką w zakresie kontroli wewnętrznych. Przedstawione funkcje zapewniają, że system ma solidny szkielet do śledzenia historii danych, co przynosi korzyści nie tylko zgodności, ale także debugowaniu i odpowiedzialności użytkownika:

  - ⬜ 11.6.1 audit_log tworzenie tabeli (🟡 P1):
  Wprowadza dedykowaną tabelę bazy danych (często nazywaną audit_log lub podobną), w której będą przechowywane wpisy audytu. Ta tabela prawdopodobnie będzie zawierać kolumny, takie jak: sygnatura czasowa, identyfikator użytkownika, typ akcji (wstawianie/aktualizowanie/usuwanie), typ obiektu (np. "WorkOrder"), identyfikator obiektu, być może zmienione pola, stare wartości, nowe wartości i ewentualnie powód zmiany lub komentarz. Jako priorytet P1 utworzenie tej tabeli ma fundamentalne znaczenie, ponieważ konfiguruje schemat w celu przechwytywania zmian w przyszłości.
Korzyści: Zapewnia to centralne repozytorium wszystkich zmian, dzięki czemu można prześledzić, kto co zrobił. Jeśli pojawi się problem – np. BOM nagle ma nieprawidłowy komponent – administratorzy mogą wysłać zapytanie do audit_log, aby sprawdzić, kiedy nastąpiła zmiana i przez kogo, zamiast zgadywać lub ręcznie przeczesywać rekordy. W celu zapewnienia zgodności z przepisami wiele przepisów (takich jak FDA 21 CFR część 11 dotycząca dokumentacji elektronicznej) wymaga, aby systemy posiadały bezpieczne, generowane komputerowo ścieżki audytu, które rejestrują działania użytkownika. Tak więc ta funkcja kładzie podwaliny pod zgodność z przepisami na wypadek, gdyby klienci jej potrzebowali. Nawet jeśli nie znajduje się w regulowanym kontekście, jest to niezwykle przydatne w rozwiązywaniu problemów i rozliczaniu. Może również odstraszać od złośliwych lub nieostrożnych zachowań, ponieważ użytkownicy wiedzą, że ich zmiany są rejestrowane. W programowaniu i testowaniu pomaga programistom zobaczyć sekwencję działań, które doprowadziły do określonego stanu. Ogólnie rzecz biorąc, tabela ta stanowi podstawę dla wszystkich kolejnych funkcji audytu – po jej wdrożeniu system może zacząć ją wypełniać w miarę konfigurowania wyzwalaczy (11.6.2). Jest to jednorazowa konfiguracja, która będzie stale dodawać wartość, zachowując historię zmian potencjalnie w nieskończoność.

  - ⬜ 11.6.2 Wyzwalacze rejestrowania audytu:
  Implementuje wyzwalacze bazy danych (lub interceptory na poziomie aplikacji) w odpowiednich tabelach, aby automatycznie tworzyć wpisy dziennika inspekcji za każdym razem, gdy dane są zmieniane. Na przykład wyzwalacz w tabeli BOM po wstawieniu/zaktualizowaniu/usunięciu zapisze wpis w audit_log przechwycenia zmiany. Wyzwalacze zapewniają, że nawet jeśli zmiana jest wprowadzana za pośrednictwem dowolnego interfejsu (interfejsu użytkownika aplikacji, interfejsu API itp.), jest ona rejestrowana na poziomie bazy danych, co zmniejsza ryzyko obejścia.
Korzyści: Automatyzacja rejestrowania audytów oznacza, że żadna zmiana nie pozostaje niezarejestrowana. Eliminuje to konieczność polegania na programistach, którzy pamiętają o ręcznym rejestrowaniu każdego zdarzenia w kodzie — baza danych je przechwyci. Zwiększa to integralność systemu audytu, ponieważ jest on spójny i trudny do obejścia (zwłaszcza w przypadku korzystania z wyzwalaczy na poziomie bazy danych, które nawet rejestrują zmiany wprowadzone przez administratorów systemów lub migracje). Dla administratorów i audytorów jest to spokój ducha, że dziennik jest kompletny. Zapewnia również standaryzację wpisów w audit_log (wyzwalacz może wypełniać spójny format). Implementacja wyzwalaczy we wszystkich krytycznych tabelach (BOM, WO, PO, inwentarz, konta użytkowników itp.) zapewniłaby całościowy obraz. Jeśli chodzi o wydajność, dobrze zaprojektowane wyzwalacze powinny być lekkie (wystarczy wstawić małą płytę), więc kompromis jest minimalny dla korzyści w zakresie identyfikowalności. Jeśli pojawi się jakikolwiek spór lub pytanie (np. "dlaczego w tej ilości zamówienia jest napisane 50, myślałem, że to 100?"), wpis wywołany dziennikiem audytu może pokazać, że użytkownik X zmienił go ze 100 na 50 w określonym dniu. Sprzyja to • 31 32 • 17 kulturze odpowiedzialności i przejrzystości. Może to również pomóc w szkoleniu użytkowników: jeśli użytkownik konsekwentnie popełnia błędy (znalezione za pomocą dziennika audytu), może potrzebować więcej szkoleń. Ponadto wyzwalacze mogą czasami rejestrować obrazy danych przed i po w celu pełnego śledzenia (np. starej i nowej wartości). To prowadzi do następnego punktu dotyczącego przechwytywania pól przyczyn i tym podobnych.

  - ⬜ 11.6.3 Pole przyczyny zmiany (wymagane w przypadku głównych zmian):
  Integruje się ze ścieżką audytu poprzez dodanie mechanizmu, który w przypadku niektórych "głównych" zmian użytkownik musi podać powód, który następnie jest przechowywany (prawdopodobnie zarówno w głównym rekordzie, jak i/lub we wpisie w dzienniku audytu). Główne zmiany można zdefiniować jako: zmianę BOM, usunięcie zlecenia pracy, korektę ilości zapasów itp. System przedstawi obowiązkowe dane wejściowe (np. wyskakujące okienko "Proszę podać powód tej zmiany") przy próbie wykonania takiego działania. Przyczyna wprowadzenia danych jest następnie zapisywana.
Korzyści: Jak omówiono w punkcie 11.1.8, uchwycenie przyczyny zapewnia kontekst i często jest wymagane w celu zapewnienia zgodności. Wiele norm jakościowych i przepisów zakłada, że krytyczne zmiany mają udokumentowane uzasadnienie (pomyśl o GMP w farmacji lub procedurach ISO – zawsze odpowiadasz "dlaczego to zostało zrobione?"). Ustawiając go jako wymagany, system zapewnia, że ten krok nie zostanie pominięty z wygody. W przypadku audytów i przeglądów podanie przyczyny wraz ze zmianą w dzienniku audytu oznacza, że audytor nie musi szukać oddzielnej dokumentacji – wszystko znajduje się w rejestrze elektronicznym. Przyspiesza to audyty i zwiększa zaufanie do systemu jako źródła rzetelnych informacji. Korzyści wewnętrzne: podczas rozwiązywania problemów lub przeglądania zmian historycznych znajomość przyczyny może wyjaśnić, czy było to działanie korygujące, korekta literówki, prośba klienta itp. Może to zapobiec zabawom w obwinianie (powodem może być "Za ECO #123 zatwierdzone przez QA" – więc był to formalny proces, a nie nieuczciwa edycja). Jeśli pewne powody występują stale (np. "Poprawiona literówka" pojawia się zbyt często w elementach BOM), może to wskazywać na potrzebę poprawy początkowej jakości danych. Po stronie użytkownika, wymaganie powodu sprawi, że będzie on bardziej przemyślany przy wprowadzaniu zmian, być może redukując trywialne lub źle przemyślane edycje. Komunikuje im również, że zmiany są poważne, zarejestrowane i powinny być uzasadnione – zgodne z kulturą jakości. Podsumowując, ta funkcja zwiększa identyfikowalność i odpowiedzialność oraz jest kluczowym elementem uczynienia ścieżki audytu użyteczną i zgodną z przepisami (ponieważ rejestrowanie kto/kiedy/co plus dlaczego jest złotym standardem dla dzienników audytu).

  - ⬜ 11.6.4 Interfejs użytkownika przeglądarki ścieżki audytu (panel administracyjny):
  Opracowuje interfejs użytkownika (prawdopodobnie w sekcji administratora lub audytu aplikacji) do przeglądania i wyszukiwania danych dziennika audytu. Zamiast wymagać zapytań do bazy danych, administrator (z odpowiednimi uprawnieniami) może przejść do ekranu "Ścieżka audytu", filtrować według zakresu dat, użytkownika, typu rekordu, identyfikatora rekordu itp., i zobaczyć zarejestrowane zdarzenia. Może zawierać wpisy takie jak: "2025-11-05 10:30 – Użytkownik A – Zaktualizowane zlecenie robocze #1001 – Status pola: 'Planowane' → 'Zwolnione'". Ewentualnie z rozwinięciem/zwinięciem, aby pokazać wszystkie zmienione pola.
Korzyści: Dzięki temu ścieżka audytu jest dostępna i możliwa do wykorzystania. Dziennik, który jest ukryty w bazie danych, jest przydatny tylko dla deweloperów lub administratorów baz danych; Interfejs użytkownika udostępnia go kierownikom nietechnicznym, audytorom i personelowi pomocy technicznej. Na przykład, jeśli kierownik produkcji zastanawia się "kto zmienił ten BOM w zeszłym tygodniu?", może skorzystać z przeglądarki, aby dowiedzieć się bez konieczności korzystania z działu IT. Oszczędza to czas i umożliwia użytkownikom samodzielną obsługę informacji. Jest to również przydatne w przypadku przeglądów bezpieczeństwa – np. administrator może regularnie skanować, jeśli były jakieś nieautoryzowane próby lub nietypowe wzorce (np. ktoś edytuje rekord, którego zwykle by nie robił). Jeśli system jest wielodostępny, administrator każdego najemcy może mieć własną przeglądarkę audytów, co może być punktem sprzedaży dla większych klientów (często chcą sami przeprowadzać inspekcję zmian). Dodatkowo, podczas audytu zewnętrznego (np. ISO lub audytu klienta), firma może łatwo pokazać audytorowi historię zmian za pomocą interfejsu użytkownika, ewentualnie eksportując dane w razie potrzeby. Świadczy to o profesjonalizmie systemu. Ten interfejs użytkownika może również zawierać funkcję eksportu (11.6.5) lub przynajmniej zintegrować się z nią. Wdrożenie dobrego wyszukiwania (według obiektu, użytkownika itp.) jest kluczowe do przesiewania tego, co może być tysiącami wpisów. Ogólnie rzecz biorąc, przeglądarka zapewnia, że ścieżka audytu nie istnieje tylko w celu zapewnienia zgodności, ale służy do usprawnienia operacji — niezależnie od tego, czy chodzi o badanie problemu, czy weryfikację procesu. Jest to część dobrego zarządzania w korzystaniu z systemu.

  - ⬜ 11.6.5 Eksport dziennika audytu do programu Excel:
  umożliwia eksportowanie danych dziennika audytu do pliku CSV/Excel (prawdopodobnie przefiltrowanego według określonych kryteriów lub daty). Audytorzy lub administratorzy mogą być zmuszeni do wyodrębnienia dzienników w celu analizy w trybie offline lub prowadzenia rejestrów.
Korzyści: Podczas gdy interfejs użytkownika przeglądarki doskonale nadaje się do szybkich kontroli, eksport do Excela umożliwia głębszą analizę i archiwizację. Audytorzy zewnętrzni często lubią dane w programie Excel, ponieważ mogą sortować, filtrować i próbkować zgodnie z potrzebami. Jeśli firma musi spełnić wymóg audytu, aby dostarczyć dzienniki zmian za dany okres, może to łatwo zrobić poprzez eksport. Może być również używany do integracji z innymi narzędziami do raportowania: na przykład eksportowaniem, a następnie tworzeniem tabeli przestawnej, aby zobaczyć, którzy użytkownicy dokonali najwięcej zmian lub w jakich porach dnia zachodzi najwięcej zmian itp., co może ujawnić interesujące wzorce. Eksport jest również siatką bezpieczeństwa, jeśli na przykład polityka zakłada przechowywanie w trybie online tylko X lat danych audytowych – starsze mogą zostać zarchiwizowane za pomocą eksportu. Pomaga więc w strategiach przechowywania danych. Jeśli chodzi o wpływ na produkcję: wyobraźmy sobie, że wykryto problem w produkcie wyprodukowanym 6 miesięcy temu; Inżynier może wyeksportować dziennik audytu w tym czasie dla wszystkich istotnych rekordów, aby przeprowadzić dokładną analizę kryminalistyczną tego, co się zmieniło, co może mieć związek z problemem. Excel sprawia, że jest to wykonalne. Dodatkowo, czasami podczas incydentów lub wycofań, firmy są proszone o dostarczenie dowodów właściwej kontroli zmian – te dzienniki w Excelu służą jako ten dowód. W ten sposób wzmacnia gwarancję jakości i identyfikowalność, które ostatecznie chronią produkcję przed wytwarzaniem wadliwego produktu z powodu niekontrolowanych zmian. Jest to prosta funkcja, ale uzupełnia system audytu, sprawiając, że dane są przenośne i można je analizować za pomocą znanych narzędzi.
(Status: Nie rozpoczęto – po MVP. Po wdrożeniu system ścieżki audytu znacznie zwiększy odpowiedzialność, umożliwi analizę kryminalistyczną problemów i spełni wymagania dotyczące zgodności w zakresie kontroli zmian. Jest to szczególnie ważne, ponieważ system ma być gotowy do użycia w przedsiębiorstwie dla większych firm i potencjalnie regulowanych branż).

### 11.7 Raportowanie i analityka

W tej sekcji omówiono ulepszone możliwości raportowania i analizy, w tym zaawansowane metryki potencjalnie obsługiwane przez uczenie maszynowe (ML), analizy trendów i różne operacyjne pulpity nawigacyjne. Te funkcje są bardziej przyszłościowe (zauważ, że jedna z nich jest oznaczona jako P2, prawdopodobnie niższy priorytet, dopóki podstawowe funkcje nie zostaną wykonane). Celem jest przekształcenie danych zgromadzonych przez system (dane produkcyjne, dane dotyczące jakości, dane dotyczące wydajności, dane dotyczące kosztów) w wnikliwe informacje, które mogą pomóc w podejmowaniu lepszych decyzji. Dzięki ich wdrożeniu platforma z systemu transakcyjnego staje się również narzędziem analitycznym, pomagającym menedżerom przewidywać problemy i optymalizować działania. Oto zestawienie wymienionych funkcji i ich zalet:

  - ⬜ 11.7.1 Zaawansowane wskaźniki KPI (przewidywania oparte na uczeniu maszynowym) (⚪ P2):
  Wiąże się to z dodaniem kluczowych wskaźników wydajności, które obejmują analizę predykcyjną. Na przykład wykorzystanie historycznych danych produkcyjnych i ewentualnie czynników zewnętrznych do przewidywania przyszłych wyników, takich jak: przewidywanie wielkości produkcji w przyszłym miesiącu, przewidywanie awarii maszyn (konserwacja predykcyjna) lub prognozowanie wydajności za pomocą modeli ML. Może to również dotyczyć wykrywania anomalii – np. modelu uczenia maszynowego, który uczy się, jak wygląda normalna produkcja i sygnalizuje, gdy metryki odbiegają nienormalnie (może przewidywać problem). Ponieważ jest oznaczony jako P2, prawdopodobnie jest to coś, co należy zbadać, gdy pojawi się podstawowa analiza.
Korzyści: Przewidywania oparte na uczeniu maszynowym mogą dostarczać proaktywnych szczegółowych informacji, a nie reaktywnych. Na przykład przewidywanie awarii sprzętu oznacza, że konserwację można zaplanować dokładnie na czas, aby jej zapobiec, co stanowi ogromną oszczędność czasu pracy (zgodnie z trendami konserwacji predykcyjnej). Przewidywanie wskaźników KPI, takich jak przepustowość czy czas realizacji zamówień, pozwala na lepsze planowanie mocy produkcyjnych – jeśli system przewiduje, że dany produkt będzie opóźniony w oparciu o aktualne trendy, menedżerowie mogą działać już teraz (dodawać nadgodziny, przyspieszać materiały itp.). Jeśli chodzi o jakość, model uczenia maszynowego może przewidywać wskaźniki defektów lub identyfikować, które partie mogą być zagrożone, umożliwiając prewencyjne kontrole jakości. Ogólnie rzecz biorąc, prowadzi to do podejmowania decyzji w fabryce w oparciu o dane. Zwiększa wartość wszystkich zebranych danych przy użyciu wzorców wykraczających poza ludzkie oko. Na przykład korzyść: system wykorzystujący uczenie maszynowe może zauważyć, że wzorce drgań maszyny i nieznaczne wydłużenie czasu cyklu zwykle poprzedzają awarię o 2 tygodnie – ostrzegając w ten sposób konserwację o konieczności naprawienia następnego planowanego przestoju, unikając nagłej awarii. Inny przykład: przewidywanie czasów realizacji zamówień dokładniej niż proste średnie, co poprawia terminy obietnic dla klientów. Te zaawansowane wskaźniki KPI wyróżniają oprogramowanie, zapewniając rodzaj wbudowanej analizy eksperckiej. Może zwiększyć wydajność i znacznie skrócić przestoje/defekty, co zostało zbadane w kontekście inteligentnej produkcji. Dla pracowników produkcyjnych może to wyglądać jak proste wskaźniki: np. wskaźnik na pulpicie nawigacyjnym "Prawdopodobieństwo osiągnięcia celu miesięcznego: 90%" lub "Przewidywany OEE jutro biorąc pod uwagę obecne trendy: 75%, czyli poniżej celu, zbadaj teraz". Chociaż wdrożenie uczenia maszynowego wymaga danych i dostrajania, korzyścią jest inteligentniejsza operacja, która przewiduje problemy i możliwości, zanim w pełni się ujawnią.

  - ⬜ 11.7.2 Analiza i prognozowanie trendów:
  Zapewnia narzędzia i raporty do analizy trendów historycznych (w tempie produkcji, jakości, wykorzystaniu zapasów itp.) oraz do wykonywania podstawowych prognoz. Różni się to nieco od prognoz opartych na uczeniu maszynowym, ponieważ może obejmować tradycyjne prognozowanie statystyczne lub nawet tylko wizualizację, która pozwala ludziom zobaczyć trendy. Na przykład wykres liniowy miesięcznej produkcji z linią trendu i prognozą na najbliższe 3 miesiące w oparciu o średnią ruchomą lub sezonowość. Może również obejmować analizy trendów, takie jak "wskaźnik defektów w czasie" lub "trend czasu realizacji".
Korzyści: Analiza trendów pomaga w identyfikacji wzorców i zmian. Jeśli wskaźnik złomu powoli rośnie przez miesiące, prosty wykres trendu sprawia, że jest to oczywiste i skłania do działania. Prognozowanie pomaga w planowaniu zasobów: na przykład prognozowanie popytu na surowce na podstawie trendów produkcyjnych zapobiega niedoborom (lub nadmiernym zapasom). Może to wiązać się z zakupami, aby zasugerować, co kupić. W przypadku siły roboczej obserwowanie trendu godzin pracy w stosunku do wydajności może mieć wpływ na zatrudnienie lub zmiany. W przeciwieństwie do monitorowania w czasie rzeczywistym, które jest natychmiastowe, analiza trendów ma charakter strategiczny – może wpływać na projekty ciągłego doskonalenia. Na przykład analiza trendów może ujawnić, że w każdy piątek po południu produktywność spada (być może z powodu zmęczenia lub problemów z konserwacją), czemu można następnie zaradzić, zmieniając harmonogramy lub dodając przerwę. Prognozowanie może pomóc w lepszym dopasowaniu sprzedaży i produkcji: produkcja może przewidzieć, czy będzie miała trudności z sprostaniem nadchodzącym szczytom sezonowym i przygotować się. Możliwości te przenoszą dane z samego rejestrowania przeszłości do informowania o przyszłości. Uzupełniają one przewidywania uczenia maszynowego; nawet prosta prognoza liniowa może być cenna, jeśli dane są ograniczone lub wzorzec jest oczywisty (a czasami łatwiej jest wyjaśnić użytkownikom niż uczenie maszynowe z czarną skrzynką). Podsumowując, dostarczając trendy i prognozy, system staje się narzędziem do planowania strategicznego i optymalizacji, a nie tylko do codziennego zarządzania. Firmy mogą obniżyć koszty i poprawić obsługę klienta, przewidując potrzeby (np. zwiększając produkcję przed przewidywanym popytem itp.), łagodząc w ten sposób obciążenie produkcją i unikając gaszenia pożarów w ostatniej chwili.

  - ⬜ 11.7.3 Analiza kosztów na operację:
  Wprowadza szczegółowe raportowanie kosztów dla procesów produkcyjnych – z podziałem kosztów na operacje lub gniazdo robocze. Może to wymagać przechwytywania danych, takich jak czas pracy na operację, czas pracy maszyny i powiązanie ze stawkami kosztów (robocizna $/godzinę, koszt maszyny, alokacja kosztów ogólnych itp.). Rezultatem mogą być raporty pokazujące, dla danego produktu lub zamówienia, jak koszt rozkłada się na poszczególne etapy operacji lub która operacja jest najdroższa. Lub na poziomie zagregowanym, porównaj koszt operacji dla różnych produktów lub zmian.
Korzyści: Daje to wgląd w strukturę kosztów produkcji. Znajomość kosztu operacji pomaga określić, na czym należy się skupić, na ulepszeniach lub negocjacjach. Na przykład, jeśli 50% kosztów przypada na operację powlekania, być może ten krok jest kandydatem do ulepszenia procesu lub automatyzacji w celu obniżenia kosztów. Może również ujawnić, czy dana operacja stała się wąskim gardłem nie tylko pod względem czasu, ale także kosztów (być może z powodu nadgodzin lub nieefektywnych metod). W przypadku zintegrowania z rachunkami BOM (z NPD) i rzeczywistymi, można porównać szacowany i rzeczywisty koszt operacji, aby uzyskać informacje zwrotne w wycenie i NPD w celu uzyskania większej dokładności. Pomaga również w podejmowaniu decyzji cenowych – zobaczenie prawdziwego rozkładu kosztów gwarantuje, że ceny pokryją kosztowne części procesu. W przypadku menedżerów operacyjnych może to napędzać lean inicjatyw; Na przykład: "Operacja A ma bardzo wysokie koszty złomu w porównaniu z innymi, popracujmy nad tym procesem". Może też zwrócić uwagę na problemy ze szkoleniem (koszt operacji montażowej na jednej zmianie jest wyższy, jeśli trwa dłużej – być może potrzebne jest szkolenie lub lepsze narzędzia). Na wyższym poziomie, jeśli pewne operacje są zbyt kosztowne wewnętrznie, kierownictwo może rozważyć outsourcing lub inwestycję w nowy sprzęt – teraz, gdy mamy dane, które to uzasadniają. Zasadniczo, analiza kosztów poszczególnych operacji umożliwia ukierunkowane działania na rzecz redukcji kosztów i pomaga utrzymać rentowność poprzez monitorowanie każdego elementu układanki produkcyjnej, a nie tylko całkowitego kosztu produktu.

  - ⬜ 11.7.4 Pulpit wskaźników jakości:
  Pulpit nawigacyjny poświęcony wskaźnikom związanym z jakością. Może to pokazać kluczowe wskaźniki KPI jakości, takie jak wydajność pierwszego przejścia, wskaźnik odpadów, defekty na milion (DPM), wskaźnik przeróbek i być może podziały według przyczyny lub linii produktów. Może zawierać wykresy wskaźników trendu jakości (powiązane z analizą trendów) i być może wykresy Pareto przedstawiające najważniejsze typy defektów lub obszary problemowe. Możliwe jest również wyświetlanie informacji o stanie jakości w czasie rzeczywistym, takim jak bieżąca przepustowość partii itp.
Korzyści: Zwrócenie uwagi na jakość wykonania pomaga zapewnić, że pozostaje ona w centrum uwagi (to, co jest mierzone, jest zarządzane). Pulpit nawigacyjny jakości umożliwia inżynierom ds. jakości i kierownikom produkcji monitorowanie jakości na pierwszy rzut oka. Jeśli wskaźnik złomowania gwałtownie wzrośnie, natychmiast to zauważą i mogą zareagować (np. zatrzymać linię, aby naprawić problem). Zachęca do analizy przyczyn źródłowych poprzez podkreślanie głównych czynników przyczyniających się do wad (zasada Pareto: zwykle kilka przyczyn odpowiada za większość problemów). Z biegiem czasu śledzenie tych wskaźników napędza ciągłe wysiłki na rzecz poprawy w celu zmniejszenia ilości odpadów i przeróbek, co bezpośrednio oszczędza pieniądze i czas. Na przykład, jeśli pulpit nawigacyjny pokazuje niską wydajność pierwszego przejścia dla określonego produktu w porównaniu z innymi, zespół może to zbadać i rozwiązać ten problem. Pomaga również w osiąganiu zewnętrznych celów jakościowych – jeśli klienci wymagają określonych poziomów jakości, dostarcza to dowodów i kontroli. Dla pracowników wyświetlanie wskaźników jakości może zwiększyć świadomość i być może dumę z ich poprawy (niektóre fabryki wyświetlają statystyki jakości na monitorach, aby wszyscy mogli zobaczyć postępy). Dzięki integracji wysokiej jakości danych w tym samym systemie nie ma potrzeby tworzenia oddzielnych arkuszy kalkulacyjnych; Wszystkie zespoły odwołują się do jednego źródła. Ulepszone wskaźniki jakości korelują z wyższym zadowoleniem klientów i niższymi kosztami gwarancji/zwrotu, nie wspominając o płynniejszej produkcji (mniej przeróbek oznacza, że przepływ nie jest przerywany). Dodatkowo, jeśli ubiegasz się o certyfikaty, takie jak ISO 9001 lub BRC (dla bezpieczeństwa żywności), pokazanie, że aktywnie śledzisz i reagujesz na wskaźniki jakości, jest często wymogiem lub przynajmniej najlepszą pracą – pulpit nawigacyjny w tym pomaga. Krótko mówiąc, pulpit wskaźników jakości utrzymuje jakość na pierwszym miejscu i wprowadza ulepszenia, które przynoszą korzyści zarówno wynikom finansowym firmy, jak i jej reputacji.

  - ⬜ 11.7.5 Raporty dotyczące efektywności produkcji:
  Prawdopodobnie obejmowałyby one różne wskaźniki wydajności i produktywności, takie jak wykorzystanie maszyn, wydajność pracy, przestrzeganie harmonogramu, przepustowość w stosunku do celu oraz raporty OEE (Całkowita Efektywność Sprzętu) łączące dostępność, wydajność i jakość. Może również obejmować takie rzeczy, jak czas instalacji w stosunku do czasu wykonywania, podsumowanie przyczyn przestojów (powiązanie z danymi 11.5.4) itp. Raporty te mogą mieć charakter okresowy (codzienny/tygodniowy) podsumowujący efektywność wykorzystania zasobów.
Korzyści: Analizując efektywność, menedżerowie mogą zidentyfikować, gdzie dochodzi do utraty mocy produkcyjnych, a gdzie można wprowadzić ulepszenia. Na przykład OEE jest złotym standardem w produkcji, określającym, jak dobrze maszyna lub linia działa w stosunku do jej maksymalnej wydajności. Raport wydajności może ujawnić, że dana linia działa tylko na poziomie 60% OEE, przy czym większość strat wynika z wydajności (może działać wolniej niż idealny czas cyklu). Sugeruje to, że potrzebna jest albo konserwacja, albo optymalizacja procesów. Raporty wydajności pomagają również w analizie porównawczej – między różnymi zmianami, maszynami lub zakładami. Na przykład, jeśli jedna zmiana ma stale lepszą wydajność, co robią inaczej? Jeśli maszyna B osiąga lepsze wyniki niż maszyna A, być może maszyna A wymaga konserwacji lub modernizacji. Te spostrzeżenia prowadzą do wyższej produkcji przy tych samych zasobach, co zasadniczo przekłada się na wyższą rentowność. Wiąże się to również z wydajnością i szkoleniem pracowników – jeśli niektóre zespoły są bardziej wydajne, mogą szkolić inne. Co więcej, poprawa wydajności często idzie w parze z poprawą jakości i bezpieczeństwa (ponieważ nieefektywność może wynikać z małych przestojów lub niezrównoważonej pracy, które, jeśli zostaną rozwiązane, mogą sprawić, że miejsce pracy stanie się płynniejsze i prawdopodobnie bezpieczniejsze). Z punktu widzenia planowania, znajomość prawdziwej wydajności pomaga w realistycznym planowaniu. Bez pomiaru ludzie mogą założyć, że 8 godzin pracy = 8 godzin wydajności, ale mając dane dotyczące wydajności, mogą zaplanować, że 8 godzin zmiany daje tylko 6,5 godziny produktywnego czasu, co jest dokładniejsze. Pozwala to uniknąć przesadnych obietnic i niedotrzymywania wyników. Dodatkowo, takie raporty z biegiem czasu pokazują wpływ inicjatyw doskonalących – widać wzrost efektywności po zmianach, co motywuje do dalszych inwestycji w tych obszarach. Podsumowując, raporty dotyczące wydajności produkcji są kluczem do ciągłego doskonalenia (Kaizen/Lean) – określają ilościowo sukces i wskazują możliwości, popychając zakład w kierunku światowej klasy wydajności.
(Status: Nie rozpoczęto – oznaczone jako "Przyszłość". Te funkcje analityczne zostaną prawdopodobnie wdrożone, gdy system zgromadzi wystarczającą ilość danych i po zaspokojeniu pilniejszych potrzeb funkcjonalnych. Po ich zrealizowaniu przekształcą system z narzędzia operacyjnego w system wspomagania decyzji strategicznych, dostarczając firmom informacji, które poprawią wydajność produkcji, obniżą koszty i utrzymają wysoką jakość).

Dodatkowe rozważania na przyszłość (poza fazą 11)

Wdrażanie w wielu środowiskach i wielu dzierżawcach:
Jak wspomniano w dyskusjach planistycznych, system zostanie skonfigurowany z wieloma środowiskami – w tym środowiskiem testowym do bezpiecznego eksperymentowania i co najmniej dwoma środowiskami produkcyjnymi na żywo ukierunkowanymi na różne skale klientów (jedno dla mniejszych firm i jedno dla większych firm z dedykowanymi opcjami). W nadchodzącej fazie 12 planowana jest gruntowna refaktoryzacja w celu uogólnienia projektu do użytku przez wiele firm. Oznacza to, że moduły są bardziej konfigurowalne i uniwersalne bez utraty funkcjonalności, tak aby ten sam podstawowy system mógł służyć potrzebom różnych firm. Na przykład funkcje takie jak "Śledzenie w dwóch trybach (NONE vs LP)" (od wersji 11.5.1) są krokiem w kierunku konfigurowalności, umożliwiając małym firmom działanie w prostszym trybie, podczas gdy dużym korzystanie z pełnej identyfikowalności. Korzyścią jest skalowalny produkt, który można wdrożyć jako pojedynczy system z wieloma dzierżawcami lub oddzielne instancje na klienta, w zależności od potrzeb. Będzie to obejmowało audyt modułów w celu usunięcia wszelkich zakodowanych na stałe założeń i wprowadzenie ustawień konfiguracyjnych (lub flag funkcji), aby każdy klient mógł włączać/wyłączać zaawansowane funkcje w zależności od swoich wymagań. Rezultatem będzie szerszy zasięg rynkowy i łatwiejsze utrzymanie (jedna baza kodu służąca wielu). Produkcja nadal będzie miała solidną funkcjonalność, ale opakowaną w elastyczny sposób – np. mała piekarnia może w ogóle nie widzieć modułu "Konserwacja maszyny", podczas gdy duży producent tak.

Przepływy pracy i zatwierdzenia między działami:
Kolejne przyszłe rozszerzenie obejmuje integrację innych działów poza produkcją z przepływami pracy systemu. Na przykład angażowanie finansów, jakości, badań i rozwoju oraz łańcucha dostaw w niektóre procesy zatwierdzania lub wymiany danych. Jednym z konkretnych pomysłów jest opracowanie ścieżki zatwierdzania (ścieżka do zatwierdzania), która obejmuje działy – na przykład w przypadku wprowadzenia nowego produktu (połączenie NPD z zatwierdzeniami marketingu/finansów) lub zleceń zmian inżynieryjnych, które wymagają zatwierdzenia przez wiele działów (Techniczny, Produkcyjny, Jakościowy zatwierdzający zmianę). Może to być dostarczone jako samodzielny moduł lub głęboko zintegrowane, ale jest to przewidywane jako plan długoterminowy (horyzont ~2-letni), gdy podstawowa funkcjonalność będzie solidna. Zaletą wielodziałowych przepływów pracy jest to, że przełamują one silosy i automatyzują procesy w całej firmie. W przypadku produkcji oznacza to, że zmiany lub nowe inicjatywy przechodzą przez ustrukturyzowany potok ze wszystkimi niezbędnymi zatwierdzeniami, co zmniejsza liczbę niespodzianek lub konfliktów między działami w ostatniej chwili. Poprawi to również zgodność i możliwość kontroli dzięki rejestrowi osób, kto, co i kiedy zatwierdził we wszystkich działach.

Najpierw wewnętrzny system raportowania, później integracje:
Plan raportowania (jak pokazano w wersji 11.7) polega na zbudowaniu najpierw wewnętrznego systemu raportowania z pulpitami nawigacyjnymi i analizami natywnymi dla aplikacji. Dzięki temu użytkownicy mają gotowe do użycia szczegółowe informacje i nie są od razu zależni od zewnętrznych narzędzi do analizy biznesowej. Strategia pozostaje jednak otwarta na przyszłe integracje – dla klientów, którzy posiadają istniejące ekosystemy Business Intelligence lub muszą łączyć dane z innymi systemami, ważne będzie zapewnienie eksportu danych, interfejsów API czy konektorów. Sekwencja jest zamierzona: dostarczaj podstawową wartość za pośrednictwem wbudowanych raportów do wszystkich użytkowników (zapewniając, że każdy otrzymuje podstawowy poziom wglądu), a następnie, w razie potrzeby, integruj się z zaawansowanymi narzędziami (takimi jak PowerBI, Tableau lub niestandardowe hurtownie danych) w celu głębszej analizy lub raportowania w przedsiębiorstwie. Na przykład większy klient może chcieć połączyć dane produkcyjne z danymi sprzedażowymi – integracja pozwoliłaby na to, gdy już będziemy mieli własne raportowanie. Utrzymanie środowiska nie "zamkniętego" oznacza, że będziemy przygotowywać się do integracji, ale dopiero wtedy, gdy nasze natywne rozwiązania będą solidne. To dwuetapowe podejście zapewnia równowagę między zapewnieniem natychmiastowej wartości a długoterminową elastycznością. Zespoły produkcyjne czerpią korzyści z szybkiego uzyskiwania potrzebnych raportów w aplikacji (krótka krzywa uczenia się), a później, w miarę dojrzewania analityki organizacji, mogą wykorzystać integrację, aby uniknąć podwójnej pracy (brak codziennego ręcznego eksportu — być może bezpośrednie źródło danych do korporacyjnej analizy biznesowej). Jest to również zgodne z architekturą wielofirmową: mniejsi klienci mogą nigdy nie potrzebować zewnętrznej analizy biznesowej (więc polegają na naszych wewnętrznych raportach), podczas gdy więksi mogą ostatecznie podłączyć system do większej platformy analitycznej.

Zgodność z przepisami i wyróżniki niszowe (np. wsparcie BRC):
Patrząc dalej w przyszłość, pojawił się pomysł dodania modułów pomagających w przestrzeganiu określonych standardów zgodności, takich jak wsparcie certyfikacyjne BRC (British Retail Consortium) dla klientów z branży spożywczej. BRC to standard bezpieczeństwa i jakości żywności; Moduł, który ma pomóc firmom przygotować się do audytów BRC, może obejmować zarządzanie dokumentami, audyty list kontrolnych, ćwiczenia w zakresie identyfikowalności i śledzenie działań naprawczych specjalnie odwzorowanych zgodnie z wymogami BRC. Chociaż taka funkcja jest bardziej "wsparciem operacyjnym" niż produkcja podstawowa, może znacznie wyróżnić aplikację na niektórych rynkach. Na przykład klient z branży spożywczej doceniłby aplikację, która nie tylko prowadzi produkcję, ale także pomaga mu przejść audyty certyfikacyjne BRC. Może to obejmować tworzenie bibliotek zadań związanych z przestrzeganiem przepisów, planowanie audytów wewnętrznych i generowanie wymaganych raportów. Korzyść jest dwojaka: zapewnia klientom dodatkową wartość (pomagając im w zakresie obowiązkowej zgodności w ustrukturyzowany sposób) i odróżnia produkt od ogólnego MES, zaspokajając potrzeby specyficzne dla branży. Chociaż jest to prawdopodobnie osobny moduł lub dodatek (aby nie zaśmiecać systemu podstawowego dla tych, którzy go nie potrzebują), pokazuje przyszłościowe podejście do integracji doskonałości operacyjnej i zarządzania zgodnością. Planując to, upewniamy się, że dane i projekt systemu (takie jak ścieżka audytu, identyfikowalność, przepływy pracy QA) są zgodne z ostateczną możliwością takich certyfikatów – zasadniczo są gotowe do audytu z założenia. Ogólnie rzecz biorąc, niezależnie od tego, czy jest to BRC, ISO 9001, czy inne standardy, możliwość dostosowania systemu do zadań związanych z przestrzeganiem przepisów sprawi, że będzie to bardziej wszechstronna platforma operacyjna. Działy produkcyjne mają wtedy wszystko w jednym miejscu – realizują, a jednocześnie system pomaga utrzymać je w zgodzie, zamiast potrzebować do tego oddzielnych narzędzi lub ręcznych procesów.

Wniosek:
Pozycje w wersji 11.0 (od 11.1 do 11.7) wraz z powyższymi rozważaniami malują wizję solidnego, skalowalnego i inteligentnego systemu zarządzania produkcją. Wczesne fazy koncentrują się na wypełnianiu luk funkcjonalnych (kontrola BOM, elastyczność zleceń pracy, śledzenie produkcji, konserwacja, ścieżki audytu), aby zapewnić solidne podstawy. W związku z tym nacisk przesuwa się na wykorzystanie danych (poprzez analitykę i ewentualnie sztuczną inteligencję) oraz rozszerzenie możliwości adaptacyjnych systemu (obsługa wielu dzierżawców, między działami, zapewnienie zgodności). Efektem końcowym będzie platforma, która nie tylko spełnia bieżące potrzeby operacyjne w zakresie planowania, produkcji i inżynierii, ale jest również gotowa do rozwoju wraz z biznesem – zapewniając głębszy wgląd i integrując wszystkie aspekty produkcji i zarządzania jakością. To kompleksowe podejście przyniesie wiele korzyści: zapobieganie problemom produkcyjnym przed ich wystąpieniem, zmniejszenie ilości odpadów i przestojów dzięki terminowej konserwacji, zapewnienie, że każda zmiana jest odpowiedzialna i możliwa do skontrolowania, wspieranie innowacji dzięki ustrukturyzowanym przepływom pracy NPD i ostatecznie dostarczanie produktów o wysokiej jakości przy niższych kosztach dzięki ciągłemu doskonaleniu opartemu na danych. Każda zaawansowana funkcja jest inwestycją w doskonałość produkcyjną, a razem przyniosą znaczącą przewagę konkurencyjną firmom, które wdrażają system.

Okólnik Zestawienia Materiałów Business Central Detection & Solutions
https://businessvalori.com/circular-bill-of-material-business-central-detection-solutions/

Usługa porównywania BOM – Biblioteka szkoleniowa OpenBOM
https://help.openbom.com/my-openbom/bom-compare/

Co to jest zestawienie materiałów (BOM)? | Zarządzanie zestawieniami komponentów | Wymagania dotyczące ścieżki audytu
PTC
https://www.ptc.com/en/technologies/plm/bill-of-materials

w elektronicznych systemach GxP: krótki przewodnik
https://www.thefdagroup.com/blog/audit-trail-requirements-in-electronic-gxp-systems-a-quick-guide

korzyściach płynących z monitorowania produkcji i procesów w czasie rzeczywistym
https://plantstar.com/blog/the-benefits-of-real-time-production-process-monitoring

pierwsze wygasł, pierwsze wyszło: co to jest FEFO i jak nim zarządzać?
https://www.mrpeasy.com/blog/fefo-first-expired-first-out/

Poprawa identyfikowalności łańcucha dostaw i genealogii produktów dzięki TrakSYS | Parsec Automation, LLC
https://parsec-corp.com/blog/supply-chain-traceability-and-genealogy/

Kwarantanna – Status utrzymania jakości | SG Systems Global
https://sgsystemsglobal.com/glossary/quarantine-quality-hold-status/

Guide to Maintenance Scheduling + 7 kluczowych korzyści - Limble CMMS
https://limblecmms.com/learn/maintenance-operations/scheduling/

Co to jest planowanie konserwacji? Przykłady, korzyści i procesy
https://ezo.io/ezo-cmms/blog/what-is-maintenance-scheduling/

Kluczowa rola planowania konserwacji: zapewnienie płynnych operacji i długowieczności
https://upkeep.com/blog/the-crucial-role-of-maintenance-scheduling-ensuring-smooth-operations-and-longevi/

Śledzenie przestojów maszyn: co to jest i dlaczego jest ważne
https://rzsoftware.com/downtime-tracking/

7 najważniejszych korzyści z konserwacji zapobiegawczej - FMX
https://www.gofmx.com/blog/benefits-of-preventive-maintenance/

Zrozumienie części zamiennych: znaczenie, korzyści i kontrola budżetu - Postęp w materiałach
https://www.thermofisher.com/blog/materials/understanding-spare-parts-importance-benefits-and-budget-control/

Dlaczego inteligentne zarządzanie częściami zamiennymi ma kluczowe znaczenie dla Twojej firmy
https://blogs.sw.siemens.com/service-lifecycle-management/2025/08/26/why-smart-spare-parts-management-is-critical-foryour-business/

przytłaczającej Potrzeba zarządzania częściami zamiennymi
https://www.dxpe.com/benefits-need-spare-parts-management-plan/

analityki predykcyjnej w produkcji: przyszłość produkcji | GoodData
https://www.gooddata.com/blog/predictive-analytics-in-manufacturing-what-it-means-for-the-future-of-production/

Modele AI do analizy porównawczej KPI w produkcji - Querio

## 12.0 Plan Transformacji Systemu na Model Multi-Tenant SaaS

### 12.1 Architektura Wielośrodowiskowa (LIVE, TEST, On-Premise)

Aby obsłużyć zróżnicowane potrzeby firm małych i dużych, plan zakłada rozdzielenie systemu na kilka
środowisk: - Dwa środowiska produkcyjne (LIVE) – osobne instancje dla małych/średnich firm oraz dla
dużych przedsiębiorstw. Dzięki temu mniejsze organizacje mogą działać we wspólnym, wydajnym
środowisku o zoptymalizowanych kosztach, zaś duzi klienci otrzymają dedykowane zasoby zapewniające
wysoką wydajność i izolację obciążeń. - Osobne środowisko testowo-demonstracyjne (TEST) –
instancja przeznaczona do celów demo, szkoleń i testów nowych funkcjonalności. Nowo rejestrujące się
firmy domyślnie trafiają do środowiska demo, gdzie mogą bezpiecznie eksplorować system z wstępnie
załadowanymi przykładowymi danymi. - Współdzielony kod, odseparowane konfiguracje – wszystkie
środowiska będą działać na jednolitym kodzie aplikacji, lecz z osobnymi bazami danych i konfiguracją
(np. osobne projekty Supabase dla LIVE-SMB, LIVE-Enterprise i TEST). Ułatwi to zarządzanie wersjami i
wdrażanie aktualizacji – zmiany testowane w środowisku TEST będą następnie promowane na
produkcyjne instancje. - Wsparcie on-premise – architektura zostanie zaprojektowana tak, aby instancje
systemu można było również instalować lokalnie u klienta. Wymaga to opracowania konteneryzacji (np.
obrazy Docker zawierające frontend i bazę danych) oraz udostępnienia skryptów instalacyjnych.
Konfiguracja połączeń (do bazy, usług zewnętrznych) będzie oparta o zmienne środowiskowe, co
umożliwi łatwe przełączenie między trybem chmurowym (Supabase, Vercel) a instalacją on-premise bez
modyfikacji kodu. - CI/CD i migracje – wprowadzenie wielośrodowiskowości wiąże się z dopracowaniem
procesu CI/CD. Należy ustalić pipeline automatycznego wdrażania: zmiany przechodzą przez środowisko
testowe, gdzie są weryfikowane, następnie osobno deployowane na LIVE. Baza danych będzie
migrowana oddzielnie w każdym środowisku, gwarantując spójność schematu.
Taki podział środowisk zwiększy skalowalność i niezawodność: awaria lub obciążenie na środowisku
małych firm nie wpłynie na instancje dla dużych klientów. Ponadto łatwiej będzie oferować różne
poziomy SLA – np. środowisko Enterprise z wyższą gwarancją dostępności i wydajności, a środowisko
SMB zoptymalizowane kosztowo.

### 12.2 Baza Danych Multi-Tenant i Izolacja Danych

Kluczowym krokiem transformacji jest przystosowanie warstwy danych do modelu multi-tenant, tak aby
wiele organizacji mogło bezpiecznie współdzielić system z pełną separacją danych. Plan działań: - Tabela
organizacji – wprowadzenie nowej tabeli organizations przechowującej informacje o firmach (ID,
nazwa, plan taryfowy, data utworzenia, itp.). Każda zarejestrowana firma otrzyma własny unikalny
identyfikator organizacji, wykorzystywany do oznaczania rekordów w innych tabelach. - Dodanie
org_id do wszystkich tabel biznesowych – wszystkie istniejące tabele powiązane z danymi
operacyjnymi zostaną zmodyfikowane o kolumnę org_id typu UUID/integer wskazującą właściciela
(organizację). Będzie to dotyczyć m.in. products , boms , work_orders , wo_operations ,
purchase_orders , grns , locations , license_plates i pozostałych modułów. Każdy rekord
zostanie trwale przypisany do danej organizacji. Migracja danych uwzględni uzupełnienie tej kolumny
dla dotychczasowych wpisów (np. przypisanie wszystkich istniejących danych do jednej domyślnej
organizacji reprezentującej obecnego klienta jednofirmowego). To zapewni pełną separację danych –
audyt bazy musi potwierdzić, że każda tabela posiada klucz org_id . - Polityki RLS (Row-Level
Security) – wykorzystamy mechanizmy RLS PostgreSQL (obsługiwane w Supabase) do egzekwowania
izolacji na poziomie bazy. Dla każdej tabeli zostaną zdefiniowane polityki dostępu, które zezwalają
użytkownikowi na operacje tylko na rekordach z odpowiadającym jego organizacji org_id .
1
2
1
Oznacza to, że zapytania SELECT/UPDATE/DELETE automatycznie odfiltrują dane obcych organizacji –
nawet jeśli programista zapomni jawnie dodać warunku, RLS zapobiegnie ujawnieniu cudzych danych. -
Claim org_id w sesji użytkownika – integracja z mechanizmem autoryzacji Supabase będzie
rozszerzona tak, by po zalogowaniu w tokenie JWT użytkownika umieszczać atrybut org_id . RLS
będzie wykorzystywać go do sprawdzania przynależności wierszy. Dzięki temu każdy zapytanie do bazy
„wie”, z kontekstu sesji, jaką organizację ma obsługiwać. Jeżeli użytkownik należy do wielu organizacji,
wprowadzone zostanie przełączanie kontekstu organizacji (np. wybór aktywnej organizacji po
zalogowaniu lub w interfejsie, co spowoduje zaktualizowanie claimu org_id w tokenie). Alternatywnie
można rozważyć wymuszenie odrębnego logowania per organizacja dla uproszczenia (w modelu
podstawowym jedno konto użytkownika jest związane z jedną organizacją). - Modyfikacja zapytań i
API – wszystkie wywołania API i zapytania bazy danych muszą uwzględniać org_id . W warstwie API
(Next.js + Supabase) należy zapewnić, że przy każdym insert/update przekazywany jest właściwy org_id
(np. poprzez funkcje Supabase wykorzystujące kontekst użytkownika lub jawne ustawianie pola).
Istniejące metody API (np. ProductsAPI.create , WorkOrdersAPI.create ) zostaną zmienione
tak, by automatycznie dołączać org_id do nowo tworzonych rekordów, np. na podstawie aktualnej sesji
użytkownika. Zapytania odczytujące dane też zostaną zrefaktoryzowane, choć główną ochronę zapewni
RLS. - Indeksy i klucze obce – dodanie kolumn org_id pociąga za sobą utworzenie indeksów złożonych
(org_id + główne pola wyszukiwań) na dużych tabelach, aby zapytania filtrowane po organizacji były
wydajne. Każda tabela posiadać będzie indeks na org_id (oraz ewentualnie w kombinacji z często
filtrowanym atrybutem, np. data) w celu zachowania wydajności przy izolacji danych. Klucze obce
między tabelami zostaną również rozbudowane o org_id tam, gdzie to sensowne, aby uniemożliwić
powiązanie rekordów z różnych organizacji (np. work_orders.org_id musi odpowiadać
products.org_id dla relacji zamówienie-produkt). - Testy izolacji – po wprowadzeniu zmian
zostanie przygotowany skrypt testowy RLS, który utworzy przykładowe dane dla dwóch fikcyjnych
organizacji i spróbuje odczytać/modyfikować je na przemian różnymi kontami. Celem jest
potwierdzenie, że system skutecznie blokuje dostęp krzyżowy (np. użytkownik Org A nie widzi danych
Org B) . Dopiero pozytywny wynik takich testów potwierdzi pełną izolację tenantów. - Skalowanie
bazy dla dużych tenantów – w przypadku bardzo dużych klientów (Enterprise) rozważymy dodatkowe
mechanizmy podniesienia wydajności i izolacji: - Dedykowane instancje bazy: możliwość przeniesienia
organizacji Enterprise na osobny klaster bazy danych (oddzielny projekt Supabase lub własny
PostgreSQL). Taka organizacja nadal korzystałaby z tej samej aplikacji, ale pod spodem jej dane byłyby
trzymane osobno, co eliminuje ryzyko dzielenia zasobów z innymi i pozwala na indywidualne skalowanie
(to podejście można zastosować dla bardzo dużych klientów, zgodnie z praktyką niektórych SaaS). -
Partycjonowanie danych: jeżeli wiele organizacji pozostaje w jednej bazie, można wykorzystać partycje
PostgreSQL, np. partycjonowanie tabel po org_id lub po dacie (z podziałem per rok/kwartał). Zapewni
to mniejsze indeksy cząstkowe i potencjalnie lepszą wydajność zapytań, zwłaszcza historycznych danych
. - Optymalizacje zapytań: upewnimy się, że wszystkie zapytania są zoptymalizowane pod kątem
filtrowania po org_id – wykorzystują indeksy, pobierają tylko niezbędne kolumny i implementują
paginację dla dużych zbiorów danych . W razie potrzeby, dla kosztownych operacji (np. generowanie
rozległych raportów traceability) wprowadzimy mechanizmy asynchroniczne lub cache’owanie wyników,
by nie blokować bieżącej pracy użytkowników.
Po wdrożeniu powyższych zmian, dane każdej firmy będą całkowicie odizolowane na poziomie bazy i
aplikacji. Użytkownicy będą mieli dostęp wyłącznie do informacji swojej organizacji, co zostanie
wymuszone zarówno przez logikę aplikacji, jak i przez same mechanizmy bazy (RLS) . To fundament
transformacji MonoPilot MES w system multi-tenant.

### 12.3 Konfigurowalność i Modułowość per Organizacja

Aby system był uniwersalny dla różnych firm, konieczne jest wprowadzenie elastycznej konfiguracji na
poziomie organizacji. Każda firma powinna mieć możliwość dostosowania, które funkcje i zasady
3
4
5
2
2
biznesowe są aktywne. Plan zakłada zaprojektowanie uniwersalnego systemu ustawień
konfiguracyjnych: - Wybór aktywnych modułów – dodamy mechanizm pozwalający włączać/wyłączać
całe moduły aplikacji dla danej organizacji. Może to być realizowane poprzez tabelę mapującą moduły
na organizację (np. organization_modules z polami org_id , module_code , is_enabled ) lub
pole konfiguracyjne (np. lista aktywnych modułów) w tabeli organizations . Przy starcie sesji
użytkownika aplikacja odczyta, które moduły są dostępne i odpowiednio zbuduje menu oraz zakres
funkcjonalności. Wyłączone moduły nie będą widoczne w interfejsie ani dostępne poprzez API, a próba
ich użycia zostanie zablokowana. Np. mała firma może wyłączyć moduł Planowania zakupu czy
zaawansowane Raporty, jeśli ich nie potrzebuje, co uprości interfejs. - Reguły jakości (QA) i produkcji –
system konfiguracji umożliwi definiowanie reguł kontroli jakości i wydajności specyficznych dla
organizacji. Przykłady: - Tryb QA: opcja, czy po zakończeniu produkcji partia trafia w status „Quality
Hold” wymagający zwolnienia przez dział jakości. W firmach bez dedykowanego działu QA można tę
funkcję dezaktywować, by nie blokować automatycznie przepływu materiału. - Śledzenie traceability:
konfiguracja, czy system wymusza pełną rejestrację genealogię wszystkich surowców. Np. w branżach
objętych standardem BRC/ISO należy zawsze rejestrować numery partii dostaw i powiązania (co będzie
domyślne), ale mały zakład może opcjonalnie działać w trybie uproszczonym (traceability minimalne, np.
jedna partia produkcyjna dziennie bez rozróżnienia dostaw). System pozwoli adminowi organizacji
wybrać poziom szczegółowości śledzenia. - Reguły BOM: parametry walidacji struktury produktu. Np.
można włączyć ostrzeżenia lub blokady dla cyrkularnych referencji w BOM (produkt nie może sam
zawierać siebie – funkcja planowana jako P1) lub ograniczyć maksymalną zagnieżdżoną głębokość BOM
(np. do 2–3 poziomów) . Firmy z prostszymi wyrobami mogą nie potrzebować wielopoziomowych
BOM, więc ta kontrola może być opcjonalna. Inna reguła: czy system automatycznie zamyka edycję BOM
po aktywowaniu – większość będzie tego wymagać (tylko wersje draft można edytować), ale można
pozwolić na inne tryby pracy zależnie od polityki firmy. - Reguły wydajności (yield): możliwość
zdefiniowania, jakie miary wydajności są stosowane i jakie są tolerancje. Np. czy śledzimy osobno
przyrost marynaty i ubytek termiczny (cecha ważna w branży mięsnej), czy wystarczy ogólny yield. Dla
uproszczenia małe firmy mogą wyłączyć szczegółowe parametry (pole marinade_gain_weight itp.),
podczas gdy duże zakłady mogą je aktywować, aby dokładnie bilansować masy. Można też ustawić
reguły, że yield finalny nie może przekroczyć X% lub poniżej Y% w danym procesie – przekroczenie
generuje alert QA. - Drukarki i etykiety – w ustawieniach organizacji będzie można skonfigurować
drukarki i formaty etykiet. Dodamy tabelę printers (org_id, nazwa, adres/URI, typ) przechowującą
zarejestrowane urządzenia drukujące danej firmy. Administrator wybierze domyślną drukarkę dla
etykiet produkcyjnych czy wysyłkowych. Ponadto planujemy wprowadzić konfigurowalne szablony
etykiet – np. firma może załadować własne logo, wybrać które pola (numer partii, data ważności, kod
kreskowy itp.) mają się pojawić. Te szablony będą przypisane do organizacji i wykorzystywane przez
moduł wydruku. - Jednostki miary i waluty – każda organizacja określi domyślne jednostki i walutę.
Domyślnie system operuje w jednostkach metrycznych (kg, sztuki, litry, itp.) – w konfiguracji będzie
można ograniczyć listę jednostek wykorzystywanych w danej firmie lub ustawić preferowaną (np.
domyślna jednostka w BOM). Przykładowo, firma w USA może chcieć używać funtów (lb) – system
pozwoli dodać jednostki imperialne do jej konfiguracji. Podobnie z walutą: w tabeli organizations
dodamy pole default_currency (np. "USD", "PLN") określające walutę dla zamówień zakupu,
kosztów itp., tak aby pola cenowe i raporty finansowe były spójne z lokalnymi standardami. - Podatki i
kody podatkowe – tabela settings_tax_codes prawdopodobnie zostanie przerobiona na
wielotenantową. Każda organizacja powinna mieć możliwość zdefiniowania własnych stawek VAT/
podatku (np. VAT 23%, 8%, zw, lub inne stawki w zależności od kraju). Rozwiązaniem jest dodanie
kolumny org_id do settings_tax_codes (z możliwością org_id = NULL dla ewentualnych kodów
globalnych) lub stworzenie nowej tabeli organization_tax_codes . Administrator w panelu
ustawień zdefiniuje obowiązujące stawki i domyślną stawkę dla produktów. Wówczas pola
tax_code_id w products czy bom_items będą odnosić się tylko do wpisów tej organizacji. -
RBAC i uprawnienia – konfiguracja ról i uprawnień jest omawiana osobno (sekcja 12.4), ale stanowi
również element ustawień organizacji. Będzie istniał panel pozwalający zdefiniować użytkowników i
6
3
przypisać im role oraz ewentualnie dostosować pewne uprawnienia (np. nadawanie roli Quality Manager
dodatkowych możliwości zatwierdzania partii). - Implementacja panelu ustawień – powstanie
dedykowana strona /settings/organization, dostępna dla administratorów organizacji, gdzie możliwa
będzie edycja wszystkich powyższych parametrów. Strona ta wyświetli m.in. nazwę i dane firmy, listę
modułów z przełącznikami on/off, formularze do konfiguracji drukarek, jednostek, waluty, reguł QA/
trace, itp. (zgodnie z zakresem zadań w planie P0) . Zmiany dokonane w tym panelu będą
zapisywane w odpowiednich tabelach konfiguracyjnych i od razu odzwierciedlane w działaniu systemu
(np. wyłączenie modułu natychmiast ukryje jego funkcje dla użytkowników tej organizacji).
Dzięki takiemu systemowi ustawień MonoPilot MES stanie się narzędziem elastycznym, możliwym do
dostosowania zarówno do prostych procesów małego warsztatu, jak i rozbudowanych procedur dużej
fabryki. Każda organizacja będzie mogła skonfigurować swój „MES w chmurze” pod własne potrzeby
bez konieczności forka kodu – wszystko za pomocą opcji konfiguracyjnych.

### 12.4 Zarządzanie Użytkownikami i RBAC (Role-Based Access Control)

Aby obsłużyć model multi-tenant w kontekście wielu użytkowników z różnymi uprawnieniami,
rozbudujemy system autentykacji o wielopoziomowy model ról per organizacja: - Struktura ról –
wprowadzony zostanie zestaw domyślnych ról organizacyjnych: np. Admin, Manager, Operator,
Viewer (obserwator) . Każda rola będzie powiązana z określonym zestawem uprawnień do modułów
i akcji. Przykładowo: - Admin – pełny dostęp do wszystkich modułów i ustawień (m.in. zarządzanie
organizacją, użytkownikami, konfiguracją, usuwanie danych). - Manager – dostęp do modułów
operacyjnych (produkcja, planowanie, magazyn, raporty) z możliwością edycji, ale bez dostępu do
ustawień systemowych i zarządzania użytkownikami. - Operator – dostęp ograniczony do funkcji
operacyjnych na produkcji/skanerach (realizacja produkcji, rejestrowanie zużyć i wykonania, druk
etykiet), bez wglądu w sekcje administracyjne czy finansowe. - Viewer – dostęp tylko do odczytu
wybranych modułów (np. podgląd stanów magazynowych, podgląd zamówień) bez możliwości
dokonywania zmian. - Tabela ról i uprawnień – utworzymy tabele roles (definicje ról per org) oraz
role_permissions (powiązanie ról z modułami/akcjami, ewentualnie w formie bitowego pola
uprawnień). Domyślnie każda nowa organizacja otrzyma predefiniowany zestaw ról jak wyżej, ale
architektura będzie pozwalała na dalszą konfigurację. Docelowo w planie post-MVP możliwe będzie
dostosowanie istniejących ról lub dodawanie własnych przez administratora (np. rola Quality Officer z
prawami tylko do modułu QA/Traceability). Na MVP jednak cztery podstawowe role mogą być na stałe
zdefiniowane w kodzie dla uproszczenia, a ich uprawnienia zaszyte lub konfigurowalne przez
programistę. - Powiązanie użytkownika z organizacją i rolą – w systemie pojawi się relacja wiele-dowielu
między użytkownikami a organizacjami (jeśli planujemy obsługę wielu organizacji przez jedno
konto). Zrealizuje to tabela łącząca, np. user_organizations (user_id, org_id, role). Alternatywnie,
jeśli ograniczymy, że użytkownik należy tylko do jednej organizacji, wtedy kolumny org_id i role
mogą znajdować się bezpośrednio w tabeli users . Jednak ze względu na potencjalne scenariusze (np.
konsultant pracujący dla kilku firm) bardziej elastyczny będzie model z tabelą pośrednią i możliwością
wielu przypisań. - Zapraszanie użytkowników (self-service) – administrator organizacji z poziomu
panelu będzie mógł dodawać nowych użytkowników. Planowane jest wdrożenie mechanizmu invite by
email: admin wpisuje adres e-mail, wybiera rolę, a system wysyła zaproszenie (link rejestracyjny) do tej
osoby. Po akceptacji zaproszenia konto użytkownika zostaje powiązane z organizacją. Dla uproszczenia,
jeśli użytkownik już istnieje w systemie (np. brał udział w innej organizacji), może zostać dodany od razu
na podstawie email (system wykryje istniejący account i doda nowe powiązanie organizacyjne). -
Zarządzanie użytkownikami – strona ustawień organizacji będzie zawierać sekcję z listą członków.
Admin może zmieniać role użytkowników, deaktywować konta (co odbiera dostęp, np. przy odejściu
pracownika) oraz usuwać użytkowników z organizacji. Wszelkie takie operacje będą odpowiednio
zabezpieczone (tylko admin może to robić w swojej org) oraz logowane w audycie (patrz 12.7). -
Egzekwowanie uprawnień w aplikacji – interfejs użytkownika zostanie dostosowany w zależności od
7 8
9
4
roli: - Osoby o ograniczonych rolach nie zobaczą w menu modułów, do których nie mają dostępu (np.
Operator nie będzie miał zakładki Ustawienia czy Raporty). - Przy próbie akcji wymagającej wyższych
uprawnień (np. usunięcie zamówienia zakupu) aplikacja wyświetli komunikat odmowy, o ile użytkownik
nie ma odpowiedniej roli. - Na poziomie API również wprowadzimy weryfikację ról: metody API mogą
sprawdzać rolę bieżącego użytkownika (np. token JWT może zawierać claim roli lub odczyt z bazy) i
zwracać błąd, jeśli uprawnienia są niewystarczające. Dodatkowo RLS w Supabase może uwzględniać role
– np. polityka dla tabeli work_orders może pozwalać na UPDATE status tylko jeśli użytkownik ma
rolę Manager lub wyższą (realizuje się to poprzez funkcje auth.role() lub dostosowane policy). -
Bezpieczeństwo i separacja – dzięki RBAC uzyskamy kontrolę dostępu w ramach organizacji. Nawet
wewnątrz firmy wrażliwe operacje (np. zatwierdzanie QA, kasowanie danych produkcyjnych, eksporty)
mogą być ograniczone do określonych ról. Wszystkie operacje administracyjne (zarządzanie userami,
konfiguracją) będą zastrzeżone dla roli Admin. - Audyt dostępu – w ramach wzmocnienia
bezpieczeństwa planuje się logowanie zdarzeń związanych z uprawnieniami, np. próby wykonania
niedozwolonej akcji przez danego użytkownika (co może wskazać na nadużycie lub konieczność
przydzielenia dodatkowych szkoleń).
Realizacja powyższego zakłada przygotowanie interfejsu administracyjnego dla każdej organizacji (co
zostało przewidziane jako zadanie P0) . Finalnie, system będzie umożliwiał samodzielne
zarządzanie użytkownikami i rolami przez klientów, zwiększając autonomię organizacji i odciążając
wsparcie techniczne.

### 12.5 Dostosowanie UI do Wielkości Firmy (Prosty vs Zaawansowany)

Interfejs użytkownika MonoPilot MES zostanie uczyniony adaptowalnym w zależności od potrzeb i
stopnia zaawansowania klienta. Celem jest, aby małe firmy nie były przytłoczone nadmiarem funkcji, a
duże otrzymały pełen wachlarz możliwości. Planowane działania: - Dynamiczne menu modułów – na
podstawie konfiguracji aktywnych modułów (patrz 12.3) aplikacja będzie generować menu nawigacyjne.
W efekcie użytkownik małej firmy zobaczy tylko te sekcje, z których korzysta, np. może mieć tylko
„Produkcja” i „Magazyn”, bez pustych zakładek typu „Planowanie” czy „Raporty” jeśli są wyłączone. Dzięki
temu interfejs stanie się prostszy i bardziej przejrzysty dla mniejszych zastosowań. W przypadku dużych
klientów menu będzie pełne, ale zorganizowane w logiczne grupy (jak obecnie Core Modules: Technical,
Production, Planning...). - Tryb uproszczony vs ekspercki – wprowadzimy możliwość przełączenia UI w
tryb uproszczony. W trybie uproszczonym: - Mniej pól na ekranach: formularze ukrywają
zaawansowane opcje. Np. podczas tworzenia produktu można schować mniej używane pola (allergeny,
kod podatkowy, szczegółowe opcje routingu) i pokazać tylko podstawowe minimum (nazwę, numer,
jednostkę). Użytkownik początkujący szybciej wprowadzi dane, a interfejs jest mniej zatłoczony. -
Domyślne wartości: wiele ustawień będzie wypełnianych domyślnie na podstawie konfiguracji
organizacji, aby ograniczyć decyzje użytkownika. Przykład: jeśli firma ma tylko jedno magazynowe
miejsce składowania, to przy przyjęciu dostawy pole lokalizacja może być domyślnie ustawione i w ogóle
niewidoczne, zamiast wymagać wyboru. - Wizardy i podpowiedzi: zamiast ręcznej konfiguracji
złożonych obiektów w jednym widoku, tryb uproszczony może oferować kreatory krok-po-kroku (np.
Kreator produktu i BOM – patrz dodatkowe funkcje). To sprawi, że nawet mniej doświadczony
użytkownik poprowadzony jest przez proces konfiguracji bez pominięcia ważnych elementów. -
Możliwość ukrycia sekcji: administrator małej organizacji może zdecydować, że pewne zakładki w
ogóle są dla nich zbędne (np. panel Traceability czy Zaawansowane Raporty) i odznaczyć ich
wyświetlanie. System zapamięta preferencje UI na poziomie organizacji, dzięki czemu interfejs staje się
szyty na miarę. - Personalizacja na poziomie użytkownika – oprócz ustawień globalnych org,
pozwolimy użytkownikom na pewne personalne preferencje, jak np. wybór języka interfejsu, motywu
kolorystycznego, rozmiaru czcionki czy układu dashboardu. To zwiększy komfort pracy, zwłaszcza w
dużych firmach, gdzie np. menedżer może chcieć widzieć od razu wskaźniki KPI na stronie głównej, a
operator tylko listę zadań. Takie personalne ustawienia będą przechowywane w profilu użytkownika
7
5
(tabela user_settings z powiązaniem do user_id). - Responsywność i urządzenia mobilne – małe
zakłady często korzystają z tabletów czy telefonów zamiast stanowisk PC. UI zostanie dopracowane pod
kątem responsywności, szczególnie moduły skanerowe/operacyjne będą wygodne w obsłudze na
ekranach mobilnych. Dla uproszczenia może powstać dedykowany widok „mobile” dla Operatora
produkcji (duże przyciski Start/Stop operacji, skanowanie kodów QR) w ramach modułu Scanner. -
Konfigurowalne dashboardy – planowane jest umożliwienie firmom ustawienia własnego układu
strony głównej. Np. mała firma może chcieć widzieć proste podsumowanie: ile zleceń w toku, ile
surowca na stanie. Duża korporacja może mieć rozbudowany panel z wykresami wydajności, statusami
linii produkcyjnych, alertami jakości. Administrator będzie mógł wybrać spośród predefiniowanych
widżetów i zbudować dashboard dla swojej organizacji. - Testy użyteczności – plan transformacji
uwzględnia przeprowadzenie testów UX z użytkownikami kluczowych grup (np. pracownik małej firmy vs
kierownik produkcji w dużej firmie) celem dostosowania interfejsu. Z zebranych opinii wynikną dalsze
usprawnienia, np. możliwość masowego ukrywania kolumn w tabelach, zapisywanie filtrów jako
domyślnych itp., aby każdy użytkownik widział w tabelach tylko potrzebne informacje.
Rezultatem będzie interfejs, który skaluje się z użytkownikiem: prosty i klarowny dla początkujących i
małych organizacji, ale z opcją odkrycia pełnej złożoności i funkcjonalności dla zaawansowanych
użytkowników i dużych przedsiębiorstw. To zwiększy satysfakcję klientów z różnych segmentów i obniży
barierę wejścia dla nowych, mniejszych klientów.

### 12.6 Skalowalność i Wydajność dla Dużych Organizacji

MonoPilot MES ma docelowo obsługiwać duże wolumeny danych, wiele równoległych procesów
produkcyjnych oraz skomplikowane strukturą operacje. Transformacja musi zagwarantować, że
system wydajnie skalujący się poziomo i pionowo: - Skalowanie aplikacji frontend/API – dzięki
architekturze Next.js aplikacja frontendowa jest stateless i może być łatwo skalowana poziomo (np.
poprzez Vercel czy kontenery Kubernetes). Dla rosnącej liczby użytkowników instancji Enterprise
zapewnimy autoskalowanie liczby serwerów frontend/API, aby utrzymać krótki czas odpowiedzi. Wąskie
gardła będą monitorowane – np. jeśli zapytania do pewnych API są ciężkie, można rozważyć wydzielenie
mikroserwisu dla tych zadań (np. osobny serwis do generowania dużych raportów, aby odciążyć główne
API). - Wydajność bazy danych – zastosowanie RLS oznacza, że wiele zapytań będzie filtrowanych po
org_id. Na dużych tabelach (setki tysięcy czy miliony rekordów) kluczowe jest zapewnienie
odpowiednich indeksów . Po dodaniu org_id zadbamy o indeksy złożone, jak wspomniano (np.
index work_orders on (org_id, status) dla częstych zapytań o zlecenia po statusie w danej
firmie). Ponadto inne indeksy (na kolumnach dat, kluczach obcych) zostaną zweryfikowane pod kątem
wydajności. - Dla bardzo dużych organizacji rozważymy partycjonowanie danych historycznych – np.
stół production_outputs czy stock_moves można partycjonować miesięcznie lub rocznie. Dzięki
temu operacje na bieżących danych (bieżący rok) są szybsze, a archiwalne dane nadal dostępne (np. do
audytu) lecz nie spowalniają codziennych operacji. - W przypadku intensywnego logowania danych (np.
logi audytowe, genealogia) – te tabele mogą rosnąć najszybciej – zastosujemy mechanizmy
housekeepingu: archiwizacja lub agregacja starych logów. Np. logi starsze niż 2 lata można przenosić do
tańszej pamięci (export do plików lub osobnej bazy archiwum) w formie tylko-do-odczytu. - Obsługa
wielu linii produkcyjnych i skomplikowanych routingów – architektura modułu produkcji już zakłada
obsługę routingów (sekwencji operacji) i wielu maszyn . Przy dużej skali (np. dziesiątki
równoległych zleceń na wielu liniach) upewnimy się, że: - Aplikacja Scanner (dla operatorów na liniach)
korzysta z lekkich zapytań w trybie realtime – np. subskrypcja Supabase na zmiany statusów operacji
pozwoli operatorom widzieć postępy bez ciągłego polling. Mechanizm realtime Supabase jest
skalowalny, ale będziemy monitorować opóźnienia przy setkach jednoczesnych klientów. - Batch
processing – pewne operacje zbiorcze (np. księgowanie zużyć dla całego zlecenia) mogą być
intensywne. Jeżeli duzi klienci będą wykonywać np. zamknięcie 1000 operacji jednocześnie, warto
zaimplementować batch API (jedna transakcja zamykająca wiele rekordów) zamiast pojedynczych
10
11 12
6
wywołań dla każdej operacji. Pozwoli to zredukować narzut komunikacji i lepiej wykorzystać
transakcyjność bazy. - Asynchroniczne kolejki zadań – wprowadzimy mechanizm kolejek (np.
wykorzystując Supabase Functions lub zewnętrzny worker) do obsługi zadań, które nie muszą być
wykonywane w ramach żądania HTTP użytkownika. Np. generowanie skomplikowanego raportu
traceability dla audytu BRC może trwać kilka minut – zamiast blokować przeglądarkę, zadanie zostanie
zlecone w tle, a użytkownik otrzyma powiadomienie lub plik do pobrania po ukończeniu. Taka
architektura CQRS (Command Query Responsibility Segregation) poprawi responsywność systemu przy
dużym obciążeniu. - Testy wydajnościowe i profilowanie – przed wdrożeniem wersji multi-tenant do
produkcji przeprowadzone zostaną testy wydajnościowe symulujące pracę dużej organizacji: np. 100
jednoczesnych użytkowników, 10 linii produkcyjnych uruchamiających operacje, dziesiątki tysięcy
rekordów w kluczowych tabelach. Zmierzymy czasy odpowiedzi dla krytycznych operacji (tworzenie
zlecenia, rejestracja produkcji, wyszukiwanie genealogii) i zidentyfikujemy wąskie gardła. Na tej
podstawie wprowadzimy optymalizacje, np. dodamy brakujące indeksy, zdenormalizujemy niektóre
dane do odczytu (materialized views) lub poprawimy algorytmy. - Separacja tenantów dla wydajności
– jeśli zauważymy, że jedna organizacja (Enterprise) konsumuje lwią część zasobów i wpływa to na
innych (w środowisku współdzielonym SMB), będziemy gotowi przenieść ją na dedykowaną instancję
(jak wspomniano). Alternatywnie można stosować limitowanie zasobów per tenant w ramach jednej
bazy (PostgreSQL nie ma native quotas, ale można monitorować zużycie i ewentualnie egzekwować
ograniczenia na poziomie aplikacji). - Skalowanie pionowe – korzystając z zarządzanej bazy (Supabase)
mamy możliwość zwiększenia mocy obliczeniowej i pamięci wraz ze wzrostem danych. Będziemy
monitorować kluczowe wskaźniki (CPU, I/O, rozmiar bazy) i w razie potrzeby podnosić tier bazy danych.
Ważne jest również zapewnienie regularnych backupów i replikacji, zwłaszcza dla klientów Enterprise
wymagających wysokiej dostępności (możliwa konfiguracja bazy w trybie HA, np. z repliką read-only dla
odciążenia zapytań analitycznych). - Wykorzystanie cache – na poziomie aplikacji Next.js można
wykorzystać mechanizmy ISR (Incremental Static Regeneration) lub SWR (stale-while-revalidate) dla
danych, które nie muszą być świeże co do sekundy. Np. dashboard z dziennymi statystykami może być
odświeżany co kilka minut zamiast przy każdym wejściu. To znacznie zmniejszy ilość zapytań do bazy
przy wielu użytkownikach. - Mechanizmy ochrony przed dużym ruchem – w przypadku bardzo dużych
wdrożeń przygotujemy mechanizmy takie jak rate limiting dla API (aby zapobiec przeciążeniu np.
wskutek błędnej integracji próbującej wyciągać dane zbyt często) oraz connection pooling. Supabase
domyślnie korzysta z poolera połączeń, co ułatwia obsługę tysięcy połączeń od wielu użytkowników bez
wyczerpania zasobów.
Podsumowując, system zostanie przygotowany na wzrost – zarówno pod kątem ilości użytkowników i
operacji, jak i wolumenu danych historycznych. Zapewnimy, że dodanie nowych klientów nie liniowo
obciąża system, a duże korporacje nie „zapachem” bazy czy serwera aplikacji kosztem mniejszych
tenantów. Zastosujemy najlepsze praktyki SaaS w zakresie skalowania oraz ciągłe monitorowanie
wydajności po wdrożeniu.

### 12.7 Warstwa Audytu, Jakość i Zgodność (BRC, Traceability)

W środowisku produkcyjnym szczególnego znaczenia nabiera audytowalność działań oraz spełnianie
norm jakości (np. BRC, HACCP). Transformacja MonoPilot MES uwzględnia wzmocnienie tych obszarów: -
Rozszerzony system logów audytowych – obecnie system śledzi historię zmian BOM (BOM History)
oraz posiada podstawowe logi (np. audit_log , work_orders_audit ). Rozbudujemy ten
mechanizm, tak by każda istotna akcja użytkownika była rejestrowana. Oznacza to: - Dodanie
wpisów do logu przy tworzeniu, modyfikacji lub usunięciu kluczowych encji (produktów, zleceń, dostaw,
itp.), z odnotowaniem kto (user), kiedy (timestamp) i jaki był charakter zmiany. Np. zmiana statusu
zlecenia produkcyjnego lub override jakości będzie zapisana. - Logowanie akcji administracyjnych:
zmiany w konfiguracji organizacji (np. zmieniono domyślną walutę), zarządzanie użytkownikami
(dodanie/usunięcie kogoś, zmiana roli), włączenie/wyłączenie modułu – to wszystko również trafi do
7
audytu, aby managerowie mieli pełen obraz ingerencji w system. - Utrzymanie logów w modelu
append-only (niezmienialne). Wpisy audytowe nie będą podlegały edycji ani kasowaniu przez
użytkowników. Nawet administrator nie powinien móc ich usuwać z poziomu aplikacji – ewentualne
czyszczenie nastąpi tylko według globalnej polityki retencji (np. logi starsze niż X lat archiwizowane, ale
dostępne na żądanie). - Przechowywanie dodatkowych meta-danych, np. powód zmiany (jeśli
użytkownik musi podać komentarz przy krytycznej operacji, jak anulowanie zamówienia – to pole
reason trafi do logu) oraz źródło operacji (np. przez UI czy przez API zewnętrzne). - Raporty
audytowe – dla każdej organizacji powstanie moduł raportowania audytowego, gdzie uprawnieni
użytkownicy (np. Admin lub Audytor) mogą przeglądać logi. Będą dostępne filtry po typie zdarzenia,
użytkowniku, zakresie dat. Np. można wygenerować raport „kto w ostatnim miesiącu modyfikował
receptury” albo „historii zmian statusów dla konkretnego zlecenia”. Takie raporty będzie można
eksportować (CSV/PDF) np. na potrzeby kontroli wewnętrznej lub zewnętrznego audytu. - Traceability i
genealogia partii – system już posiada mechanizmy traceability (tabele license_plates ,
lp_compositions , lp_genealogy , API Traceability) do śledzenia powiązań surowców i produktów.
W transformacji skupimy się na tym, by w pełni spełniał on standardy jakości: - Upewnimy się, że każdy
ruch materiałowy i produkcyjny jest rejestrowany z przypisaniem partii (dla surowców – partia
dostawy, dla wyrobów – numer partii produkcyjnej). Dzięki temu możliwe jest wykonanie zarówno
traceability wstecznego (ustalenie z jakich dostaw i surowców powstał dany produkt), jak i traceability do
przodu (ustalenie, które produkty zostały wytworzone z danej partii surowca). System będzie w stanie w
kilka sekund wygenerować pełną genealogię – np. po podaniu numeru partii surowca znajdzie wszystkie
związane z nią partie półproduktów i produktów finalnych . - Szybkie raporty recall – zgodnie z
wymaganiami standardu BRCGS, firma musi móc wykazać pełną identyfikowalność w czasie krótszym
niż 4 godziny . MonoPilot MES zapewni to praktycznie w czasie rzeczywistym: zostanie przygotowana
funkcja generująca raport „Recall” – wskazujemy np. konkretny numer partii produktu finalnego, a
system automatycznie zbiera wszystkie powiązane numery partii surowców, dostawców tych surowców,
daty produkcji itp., i prezentuje to w czytelnym raporcie. Taki raport będzie gotowy natychmiast,
spełniając rygorystyczne wymagania audytorów. - Kontrola alergenów i jakości – moduł traceability
powiążemy z danymi o alergenach i kontroli jakości. Skoro w BOMach oznaczamy alergeny składników,
system będzie mógł automatycznie wykazać, jakie alergeny są obecne w danej partii produktu (poprzez
dziedziczenie – co już jest implementowane w BOM). W raportach trace znajdzie się sekcja „Allergeny/
Quality”, co jest istotne dla norm BRC (wymóg śledzenia alergenów i zapobiegania zanieczyszczeniom
krzyżowym) . - Logowanie decyzji jakościowych – wprowadzimy QA Override Log (co częściowo
istnieje, np. tabela qa_override_log ) rozbudowany o podpis elektroniczny. Jeśli partia jest
wstrzymana przez QA, a kierownik jakości ją zwalnia, system odnotuje kto i kiedy podjął decyzję i jaki
test to umożliwił. W standardach pokrewnych BRC (np. 21 CFR Part 11 dla zapisów elektronicznych)
wymaga się elektronicznych podpisów i atrybutów jak użytkownik, znacznik czasu, powód decyzji .
MonoPilot spełni te wymagania poprzez wymuszenie podania hasła/prywatnego PIN przy krytycznych
akcjach (potwierdzenie tożsamości) oraz zapisywanie decyzji w logach z unikalnym identyfikatorem
użytkownika. - Niezmienność zapisów – aby spełnić wymagania audytorów (zapisy muszą być trwałe i
odporne na manipulacje ), zabezpieczymy newralgiczne tabele przed modyfikacją. Przykładowo, po
zatwierdzeniu partii do wysyłki, jej skład (genealogia) nie będzie już mógł być zmieniony – każda korekta
musi być zarejestrowana jako nowy wpis (np. poprzez mechanizm wersjonowania). Być może
wykorzystamy cechę PostgreSQL jak immutable tables lub prostszą – nie dając w aplikacji możliwości
edycji, jedynie dodawanie korekt z logiem. - Wsparcie dla audytów zewnętrznych (BRC, ISO) –
przygotujemy zestaw funkcji ułatwiających przeprowadzenie audytu: - Tryb Audytora: możliwość
nadania użytkownikowi zewnętrznemu (np. audytor certyfikujący) tymczasowego dostępu typu Viewer
do wybranych danych. Taki użytkownik mógłby np. sam przeglądać logi traceability pod nadzorem, z
pewnością że nic nie zmieni. Alternatywnie, administrator może korzystając z systemu łatwo wyciągnąć
potrzebne informacje i przekazać audytorowi. - Predefiniowane raporty zgodności: np. raport Mass
Balance (bilans surowców vs produkt – ważne w BRC), raport Vertical Audit (śledzenie konkretnego dnia
produkcji i partii w głąb i w przód). System wygeneruje takie raporty automatycznie na żądanie, co
13
13
14
15
16
8
pokaże dojrzałość systemu przed audytorem. - Eksport danych: na potrzeby klientów, którzy muszą
przechowywać zapisy poza systemem (np. w archiwum papierowym lub innym systemie), dodamy
funkcje eksportu (CSV, PDF) dla kluczowych danych z podpisem czasowym. Np. listę wszystkich
surowców użytych w partii wraz z dostawcami, albo historię zmian receptury produktu X z podpisami. -
Zgodność z wymaganiami 21 CFR Part 11 – choć to bardziej farmacja, warto wspomnieć, że system ma
unikalne loginy użytkowników, loguje podpisy elektroniczne i zapobiega nieautoryzowanym zmianom –
co pokrywa znaczną część wymogów również w kontekście BRC i FDA. - Moduł Quality / BRC –
rozważamy wprowadzenie oddzielnego modułu Jakość, który integrowałby powyższe funkcje w jedną
całość. W module tym można by zarządzać dokumentami kontroli jakości (np. karty testów dla partii),
monitorować wyniki kontroli (np. wyniki badań laboratoryjnych przypięte do partii – poprzez dodawanie
załączników), zarządzać niezgodnościami (rejestracja incydentów jakościowych i działań korygujących).
Taki moduł mógłby być częścią planu Enterprise dla firm z rygorystycznymi standardami. - Allergen
management i HACCP – poza BRC, system wspiera już zarządzanie alergenami (tagowanie produktów i
komponentów). Rozbudujemy to o funkcje typu: automatyczne oznaczanie partii jako „zawiera alergen
X”, ostrzeżenia przy produkcji (jeśli poprzednio na linii był inny alergen – potrzeba czyszczenia, tzw. line
clearance). Dane o alergenach będą uwzględniane w traceability raportach (np. „partia zawiera alergen:
gluten, soja”). To bezpośrednio wspiera spełnienie klauzul BRC/IFS dotyczących kontroli alergenów. -
Pełna identyfikowalność personelu – logi operacji będą łączyć się z tożsamością operatorów
( wo_operations.operator_id już to przechowuje). Każdy wydruk etykiety czy ważenie może
wymagać zalogowania operatora, co zapewni że zapisy są atrybuowalne (wymóg audytowy: wiadomo
który pracownik wykonał daną czynność) . W systemie będzie można w każdej chwili sprawdzić, kto
był odpowiedzialny za dany krok procesu. - Integracja z BMS/ERP – dla compliance ważna jest spójność
danych w całym łańcuchu. Planujemy umożliwić integrację (patrz Public API w sekcji 12.10) np. z
systemami ERP w celu przekazywania informacji o partiach i dostawach. Dzięki temu dane traceability
mogą być połączone z szerszym kontekstem (np. numerami dostawców w ERP), co ułatwi
przeprowadzenie audytu łańcucha dostaw (BRC wymaga również śledzenia dostawców surowców). -
Szkolenia i sandbox – by zapewnić, że personel prawidłowo korzysta z systemu w kontekście jakości, w
środowisku demo lub odrębnej sandbox QA (sekcja 12.10) udostępnimy realistyczne scenariusze
testowe. Pozwoli to firmom przećwiczyć procedury recall, traceability i audytu w bezpiecznym
środowisku, tak aby w realnej sytuacji byli przygotowani.
Ogółem, moduły audytu i traceability po transformacji mają stać się mocną stroną MonoPilot MES,
wyróżniającą go na rynku. System będzie dostarczał cyfrowych dowodów zgodności z normami (BRCGS,
ISO 22000 itd.) i aktywnie wspierał użytkowników w utrzymaniu jakości oraz szybkiej identyfikowalności
każdej partii produktu .

### 12.8 Self-Onboarding i Tryb Demo (Migracja do Produkcji)

Aby zwiększyć adoptowalność produktu, plan zakłada maksymalne uproszczenie procesu wdrażania
nowych firm: - Rejestracja online (self-service) – wdrożymy funkcjonalność samodzielnego zakładania
kont przez zainteresowane firmy. Na stronie głównej pojawi się opcja „Zarejestruj swoją firmę/Demo za
darmo”. Proces rejestracji poprosi o podstawowe dane: nazwa organizacji, email administratora, hasło.
Po weryfikacji email (lub innej minimalnej weryfikacji) system automatycznie utworzy nową organizację
w bazie oraz konto użytkownika z rolą Admin w tej organizacji. - Automatyczne przygotowanie danych
demo – nowo utworzone konto trafia domyślnie do trybu demo. Oznacza to, że jego organizacja
otrzyma pewien zestaw domyślnych konfiguracji i danych początkowych, aby ułatwić eksplorację
systemu. Planowane działania: - Wstawienie przykładowych produktów i BOM (np. 2–3 przykładowe
produkty z różnymi strukturami: prosty wyrób z jednym surowcem, złożony wyrób z kilkoma
komponentami, itp.). - Utworzenie przykładowych zamówień produkcyjnych, kilka pozycji
magazynowych, przykładowa dostawa od fikcyjnego dostawcy – to wszystko pozwoli nowemu
użytkownikowi od razu zobaczyć działające ekrany (listy zleceń, stany magazynowe). - Ustawienie
16
13 14
9
sensownych domyślnych konfiguracji: włączenie najważniejszych modułów (Produkcja, Magazyn, BOM),
wyłączenie tych mniej potrzebnych na start (np. Skaner osobno, jeśli nie jest wymagany), domyślna
jednostka = sztuka/kg, waluta = lokalna na podstawie kraju użytkownika (jeśli wykryjemy). - Opcjonalnie,
dodanie fikcyjnego użytkownika Operatora (aby admin mógł zobaczyć jak działają różne role – np. może
zalogować się drugim kontem testowym). - Oznaczenie danych demo – dane podstawione będą
oznaczone np. tagiem „DEMO” albo poprzez osobną tabelę z ich ID, co umożliwi późniejsze ich łatwe
usunięcie lub odróżnienie od właściwych danych w przypadku migracji. - Ograniczenia trybu demo – w
środowisku demo można wprowadzić pewne ograniczenia, aby zapobiec nadużyciom i zachować
zasoby: - Limitowana skala – np. maksymalnie 100 rekordów w każdej głównej tabeli (100 produktów,
100 zleceń itp.) aby zapobiec wykorzystaniu darmowego konta do realnej produkcji. - Brak możliwości
integracji API (chyba że w celach testowych) i brak gwarancji SLA/poufności, wyraźne oznaczenie „Tryb
demonstracyjny”. - Okres ważności – można ustawić, że konto demo wygasa po np. 30 dniach, chyba że
użytkownik przejdzie na plan płatny (ale z zachowaniem możliwości migracji danych – patrz poniżej). -
Migracja z demo do produkcji – kluczowe jest umożliwienie płynnego przejścia firmy z fazy testowej do
normalnej pracy: - Upgrade jednym kliknięciem – w panelu admina lub na koncie rozliczeniowym
użytkownik wybiera plan (Free/Pro/Enterprise) i dokonuje ewentualnej płatności. System wtedy oznacza
organizację jako aktywną produkcyjnie. Jeśli środowisko testowe jest fizycznie oddzielone od
produkcyjnego, migracja może polegać na skopiowaniu danych. - Kopiowanie danych: opracujemy
skrypty migracyjne, które przeniosą wszystkie istotne rekordy organizacji z bazy demo do bazy
produkcyjnej. Dotyczy to tabel biznesowych (produkty, BOMy, zlecenia, itp.) oraz konfiguracji. Dane
demonstracyjne (fikcyjne) mogą zostać pominięte lub usunięte w trakcie migracji, w zależności od
wyboru klienta. Ważne, by rzeczywiste dane, które klient wprowadził testując system (np. stworzył
własny BOM) zostały zachowane. - Bezobsługowość – proces migracji będzie zautomatyzowany, aby nie
wymagał ręcznej interwencji zespołu IT. Może to być realizowane np. jako procedura SQL kopiująca
dane między schematami lub eksport/import poprzez API. Użytkownik po upgrade otrzyma
powiadomienie, gdy jego dane zostaną przeniesione i będzie mógł zalogować się do nowego
środowiska (być może inna domena lub instancja) ze wszystkimi poprzednimi ustawieniami. - Ciągłość
dostępu – aby uniknąć przestojów, możliwe podejście to utrzymywanie danych demo w tej samej bazie,
a przełączenie polega tylko na zmianie flagi (np. organization.status z „demo” na „active”). Wtedy
migracja jest tylko logiczna – dane pozostają, a znika ograniczenie i ewentualnie demodane są
czyszczone. To wymaga jednak by środowisko testowe i produkcyjne były jednym, co może rodzić inne
ryzyka. Bardziej prawdopodobny scenariusz to osobny klaster dla demo – wtedy migracja to
przeniesienie do innego klastera (co trwa krótko dla małych danych). - Wsparcie w onboarding –
chociaż celem jest self-service, planujemy dodać mechanizmy in-app, które pokierują nowego
użytkownika: - Interaktywny samouczek – przy pierwszym logowaniu użytkownik demo zobaczy serię
podpowiedzi (tooltipy) np. „Tu jest menu produkcji – kliknij, aby zobaczyć swoje zlecenia. Teraz spróbuj
utworzyć nowe zlecenie...”. Taki tutorial znacząco zwiększy szansę, że użytkownik faktycznie przetestuje
kluczowe funkcje i dostrzeże wartość systemu. - Baza wiedzy / FAQ – w systemie (lub na stronie
wsparcia) dostępne będą artykuły typu „Pierwsze kroki”, „Jak skonfigurować własne dane”. Dobrze
widziany jest też kreator konfiguracji na start – np. po rejestracji wyświetlić formularz „Podaj
podstawowe dane swojej firmy: jednostki, domyślne ustawienia, itp.” żeby od razu ustawić config
zamiast edytować go ręcznie później. - Tryb demo a rzeczywistość – zasygnalizujemy wyraźnie w UI
(np. baner „Demo Mode”), że to jest środowisko testowe. Po migracji baner zniknie. Jeśli klient
wprowadził sporo własnych danych w demo, może chcieć je zachować – stąd migracja, ale jeśli traktował
demo czysto edukacyjnie, można dać opcję „zacznij od zera” podczas przejścia do płatnego planu (wtedy
zamiast migrować demo-data, tworzymy świeżą organizację produkcyjną). - Oddzielenie testów od
produkcji w trakcie używania – nawet już aktywni klienci mogą potrzebować środowiska testowego
do symulacji (np. przed wprowadzeniem dużej zmiany w procesie). Zastanowimy się nad umożliwieniem
każdej organizacji posiadania klonu testowego jej instancji. Mogłoby to działać tak: na żądanie tworzymy
duplikat danych (lub wybrane podzbiory danych) danej firmy w środowisku testowym, do którego firma
ma dostęp np. na 7 dni. Tam mogą eksperymentować (np. import dużego nowego cennika, test
10
integracji API) bez ryzyka dla produkcji. Po testach klon jest usuwany. Takie narzędzie może być
oferowane w planie Enterprise lub jako dodatkowo płatne, ale zwiększy zaufanie dużych klientów do
wdrażania zmian.
Dzięki mechanizmom self-onboarding i trybu demo, czas od rejestracji do uzyskania wartości ze
strony użytkownika drastycznie się skróci – klient sam założy konto i w ciągu kilkunastu minut może
zobaczyć działający MES z własnymi danymi. Z kolei płynna migracja do trybu produkcyjnego zapewni,
że nie utraci on efektów swojej konfiguracji z fazy testowej, co zwiększa konwersję zainteresowanych
klientów na płacących użytkowników.

### 12.9 Warianty SaaS: FREE vs PRO vs ENTERPRISE

Aby móc obsłużyć zarówno mikro firmy, jak i korporacje, MonoPilot MES będzie oferowany w różnych
planach cenowych z odpowiednim zakresem funkcji: - Plan FREE (freemium) – darmowa wersja o
ograniczonej skali i funkcjonalności, przeznaczona dla bardzo małych zakładów lub klientów testujących
system na dłużej. Cechy: - Ograniczenia ilościowe: np. maksymalnie 1–2 użytkowników, jedna linia
produkcyjna (jedna maszyna aktywna), ograniczona liczba rekordów (np. 50 aktywnych produktów, 50
zleceń miesięcznie) – tak by wystarczyło to do podstawowego działania mikro firmy, ale zachęcało do
upgrade przy rozwoju. - Dostęp tylko do podstawowych modułów: np. Produkcja i Magazyn są
dostępne, ale moduł Planowanie Zakupów czy Raporty zaawansowane są wyłączone w free.
Traceability może działać w podstawowym zakresie (np. genealogia wsteczna, ale brak
zaawansowanych raportów). - Brak niektórych funkcji premium: np. brak dostępu do API publicznego,
brak integracji z systemami zewnętrznymi, brak modułu jakości (QA). RBAC może być uproszczony – w
darmowym planie wszyscy użytkownicy mają tę samą rolę (Admin/Operator), aby nie komplikować
zarządzania. - Community Support: wsparcie techniczne ograniczone do dokumentacji i forum
społeczności, brak gwarantowanych czasów reakcji. - Free plan może służyć również jako nieograniczony
czasowo „plan demo” dla małych podmiotów – pozwalając korzystać z systemu za darmo w zamian za
ograniczenia. - Plan PRO (Standard) – płatny plan dla większości małych i średnich firm: - Pełna
funkcjonalność wszystkich modułów core: BOM/Technical, Production, Planning, Warehouse,
Traceability, Reports – wszystko dostępne. Możliwe, że niektóre zaawansowane opcje konfiguracji QA
są zastrzeżone dla Enterprise, ale ogólnie Pro daje komplet narzędzi MES. - Zwiększone limity:
nielimitowana liczba użytkowników (lub wysoki limit, np. 50), większa pojemność danych (praktycznie
brak limitu zapisów, choć możemy monitorować bardzo duże wykorzystanie), wiele linii/miejsc
produkcji. - Wsparcie techniczne standard: pomoc email z określonym SLA (np. odpowiedź w 48h),
dostęp do aktualizacji i szkoleń online. - API i integracje: plan Pro zawiera dostęp do publicznego API,
co pozwala klientom integrować MES z ich ERP/księgowością. Ograniczenia mogą dotyczyć liczby calli na
minutę, ale generalnie integracja jest możliwa. - Branding i personalizacja: dla płacących klientów
można umożliwić podstawowy white-labeling, np. wgranie własnego logo w UI, konfiguracja własnych
szablonów wydruku z logotypem – to będzie dostępne od planu Pro wzwyż. - Plan ENTERPRISE – oferta
dla dużych klientów przemysłowych wymagających dodatkowych gwarancji, funkcji i wsparcia: -
Dedykowana infrastruktura: możliwość wdrożenia na osobnym środowisku (w chmurze prywatnej lub
on-premise u klienta) dla pełnej kontroli. Enterprise klienci mogą mieć własną bazę danych, co zapewnia
im izolację i możliwość niestandardowych rozszerzeń. - Funkcje premium: w planie Enterprise
odblokowane będą wszystkie zaawansowane opcje: - Moduł Quality/BRC z pełnym audytem, kontrolą
jakości, obsługą niezgodności. - Sandbox testowy – instancja testowa dla organizacji (jak opisano w
12.8) dostępna na żądanie. - Zaawansowane analizy i dashboardy KPI (np. integracja z BI, lub
wbudowane wykresy wydajności, OEE). - Możliwość dostosowań na zamówienie – np. customowe pola
w systemie, dodatkowe workflowy – oczywiście w ramach osobnych ustaleń, ale plan Enterprise zakłada
elastyczność do rozszerzeń. - Bezpieczeństwo klasy korporacyjnej: integracja SSO (Single Sign-On) z
Azure AD/LDAP, wymuszanie dwuskładnikowego uwierzytelniania, zaawansowane logowanie zdarzeń
bezpieczeństwa. Również opcje typu szyfrowanie danych w spoczynku własnym kluczem (customer-
11
managed encryption keys) itp. - Wsparcie Premium: dedykowany opiekun klienta, gwarantowany krótki
czas reakcji (np. 4h), pomoc przy onboarding większej liczby użytkowników, szkolenia na miejscu,
migracja danych historycznych z poprzednich systemów itp. Ten plan jest bardziej usługą, obok samego
produktu. - Licencjonowanie: Enterprise może być wyceniane indywidualnie (np. na bazie liczby linii
produkcyjnych, liczby transakcji miesięcznie albo stała opłata za instancję). Możliwa opcja licencji
wieczystej z utrzymaniem, jeśli klient chce on-premise. - Wymuszanie różnic funkcjonalnych –
implementacja planów w systemie: - Dodamy pole plan_type w tabeli organizations (np.
wartości: FREE, PRO, ENT). W kodzie aplikacji kluczowe miejsca będą sprawdzać typ planu, by
zdecydować o dostępności funkcji. Np. jeśli plan=FREE, nie pokażemy zakładki „API Keys” w ustawieniach
(bo API niedostępne), a próba wejścia na endpoint integracyjny zwróci błąd „Upgrade required”. -
Mechanizm feature flags może zostać powiązany z planem – np. moduł Quality dostępny tylko jeśli
org.plan_type == 'ENT' . - Limity ilościowe mogą być egzekwowane na poziomie aplikacji (np.
przed utworzeniem nowego użytkownika sprawdzamy count i blokujemy, informując o konieczności
upgrade) oraz dodatkowo monitorowane poprzez statystyki bazy. - Ważne, by komunikaty dla
użytkownika jasno wskazywały, że dana funkcja jest premium. Np. przy próbie użycia niedostępnej opcji
– modal z informacją „Dostępne w planie Pro/Enterprise. Skontaktuj się z nami aby rozszerzyć swój
plan.” i ewentualnie link do strony upgradu. - Ścieżka upgradu/downgrade – system będzie pozwalał w
miarę płynnie zmieniać plan: - Upgrade z Free do Pro/Ent: odblokowanie natychmiast funkcji po
opłaceniu/subskrypcji. Ewentualnie migracja infrastruktury (jeśli przejście z multi-tenant SMB do
dedykowanej Enterprise, to zaplanujemy minimalny downtime na przeniesienie danych). - Downgrade z
Pro do Free: trudniejsze (bo np. co z nadmiarowymi użytkownikami czy danymi?). Raczej nie będziemy
wspierać automatycznego obniżenia planu jeśli klient wprowadził więcej danych niż free pozwala – to
będzie rozwiązywane indywidualnie. Free może być raczej trialem niż docelowym planem produkcyjnym.
  - W ramach Pro->Ent: prawdopodobnie migracja do nowej infrastruktury, zaplanowana i wykonana
  przez zespół (usługa migracji w pakiecie Enterprise).
Dzięki segmentacji na plany będziemy mogli monetyzować system adekwatnie do wartości
dostarczanej różnym klientom, jednocześnie nie odrzucając najmniejszych podmiotów (darmowa
wersja) i spełniając wysokie wymagania największych (Enterprise). Dla użytkowników będzie jasne, jakie
korzyści daje wyższy plan, co ułatwi upselling – np. firma zaczynająca na Free, jeśli się rozwinie, przejdzie
na Pro, a bardzo wymagający klient od razu wybierze Enterprise widząc dostępność np. funkcji
audytowych, sandbox czy integracji.

### 12.10 Dodatkowe Funkcje Wyróżniające System

Aby MonoPilot MES wybił się na tle konkurencji i sprostał nowoczesnym wymaganiom, planujemy
wdrożyć szereg innowacyjnych lub bardzo praktycznych funkcji jako uzupełnienie transformacji:
Sandbox QA / Środowisko Piaskownicy – funkcja ta pozwoli organizacjom na bezpieczne
testowanie zmian przed wprowadzeniem ich na produkcję. W praktyce może to działać dwojako:
Sandbox dla konfiguracji – np. planowane większe zmiany (import 100 nowych produktów,
zmiana struktury BOM wielu wyrobów) można wykonać w trybie sandbox: system tworzy
tymczasową kopię bazy organizacji lub izoluje zmiany, które użytkownik wykonuje, a następnie
umożliwia ich zweryfikowanie. Jeśli wszystko jest OK, zmiany mogą zostać zatwierdzone i
zastosowane do właściwych danych. Jeśli nie – sandbox można odrzucić bez wpływu na bieżącą
produkcję.
Sandbox szkoleniowy – podobnie jak tryb demo, ale już dla istniejącej firmy: np. nowo
zatrudnieni pracownicy mogą ćwiczyć w kopii systemu z rzeczywistymi danymi (przeniesionymi,
ale np. z anonimizacją wrażliwych informacji). Ta piaskownica nie wpływa na rzeczywiste stany
magazynowe czy zlecenia. Po zakończeniu szkolenia jest czyszczona.
•
•
•
12
Oba warianty zwiększają pewność użytkowników przy wprowadzaniu zmian i ułatwiają onboarding
nowych pracowników. Sandbox QA będzie szczególnie atrakcyjny dla klientów Enterprise (można go
oferować jako element premium).
Kreator BOM (Product/BOM Wizard) – funkcja upraszczająca konfigurację nowych produktów.
Zamiast ręcznie dodawać produkt, potem BOM, potem routing osobno, kreator przeprowadzi
użytkownika krok po kroku:
Podaj podstawowe dane produktu (nazwa, kod, typ).
Dodaj składniki – kreator pozwoli wyszukać istniejące surowce lub dodać nowe „w locie”, określić
ilości, jednostki, procent odpadu itd. na jednej stronie.
Zdefiniuj routing – wybierz z listy standardowych operacji (możemy mieć bibliotekę typowych
operacji, np. Mieszanie, Pakowanie), przypisz maszyny i sekwencję.
Ustal parametry jakości (ew. powiąż z testami QA, określ czy wymagane ważenie, etykieta itp.).
Na koniec kreator podsumuje i jednym kliknięciem tworzy wszystkie powiązane rekordy (product, bom,
bom_items, routing, routing_ops). To przyspieszy konfigurację i zmniejszy ryzyko błędów, szczególnie
dla mniej obeznanych użytkowników. Dodatkowo można przewidzieć szablony BOM – np. produkt typu
„Pakowany świeży wyrób” zawsze ma operacje Chłodzenie i Pakowanie – kreator od razu je zasugeruje.
Taka inteligentna podpowiedź oparta o typ produktu (taxonomy już jest zaimplementowane: MEAT/
DRYGOODS/COMPOSITE) zwiększy wygodę.
Konfigurowalne etykiety i integracja z drukowaniem – w ramach modułu drukarek (12.3)
rozbudujemy generowanie etykiet:
Udostępnimy prosty edytor szablonów etykiet (np. drag&drop pola na wzór, wybór czcionek,
kodów kreskowych). Być może integracja z istniejącym open-source narzędziem do etykiet.
Etykiety będą mogły być wielojęzyczne i zawierać np. kody QR z linkiem do traceability (np. klient
skanując kod na produkcie mógłby trafić na stronę z informacją o partii – to przyszłościowa
funkcja, ale warta rozważenia).
Wiele firm potrzebuje różnych formatów etykiet dla różnych produktów lub klientów –
umożliwimy tworzenie wielu szablonów i przypisywanie ich np. do typu produktu lub do
konkretnego klienta (w przypadku etykiet wysyłkowych).
Wydruki będą kolejkowane i monitorowane (czy druk poszedł, czy urządzenie online).
Ewentualnie integracja z systemem typu PrintNode lub bezpośrednie sieciowe wysłanie na adres
drukarki.
Ta funkcjonalność wyróżni system, bo wiele rozwiązań MES ma bardzo statyczne generowanie
etykiet, a tu damy klientom swobodę dostosowania.
Publiczne API i integracje – otworzymy system na zewnątrz poprzez dobrze udokumentowane
API publiczne:
Udostępnione zostaną endpointy REST (lub GraphQL) do wszystkich głównych zasobów:
produkty, zlecenia, stany magazynowe, itp. Z zachowaniem bezpieczeństwa (klucze API per
organizacja, ograniczenia zakresu dostępu). Pozwoli to klientom automatyzować wymianę
danych – np. automatyczne tworzenie zleceń produkcyjnych na podstawie zamówień ze sklepu
internetowego, czy eksport aktualnych stanów magazynowych do systemu finansowego.
Wykorzystamy możliwości Supabase – potencjalnie Supabase może generować tzw. PostgREST
endpoints automatycznie do tabel z RLS. Możemy to wykorzystać, a do bardziej złożonych
operacji (np. wywołanie produkcji, akcje skanera) stworzymy dedykowane funkcje RPC w bazie i
udostępnimy je przez API.
•
•
•
•
•
•
•
•
•
•
•
•
•
•
13
Dokumentacja API (OpenAPI/Swagger) będzie dostępna, wraz z przykładami kodu w różnych
językach – to ułatwi deweloperom stron trzecich integrację.
Planowane są gotowe pluginy/integracje z popularnymi systemami: np. integracja z Shopify lub
innym e-commerce (przekazywanie zamówień do produkcji), integracja z ERP (NetSuite, SAP via
API) – by system mógł działać jako ogniwo wykonawcze w większym ekosystemie IT klienta.
W kontekście IoT: publiczne API może pozwolić urządzeniom (np. czujnikom linii) na wysyłanie
danych do MES (np. automatyczne zaksięgowanie wagi produktu z wagi przemysłowej). Dla
klientów Enterprise możemy zrobić dedykowany MQTT broker lub protokół OPC-UA do
integracji ze sterownikami PLC – to jednak dalsza perspektywa.
„Inteligentne” traceability i analityka – chcemy wzbogacić system o elementy analityczne i AI,
które dadzą wartość dodaną z zebranych danych:
Smart Trace: zaawansowane zapytania genealogiczne z logiką biznesową. Np. funkcja „Znajdź
wszystkie produkty potencjalnie zagrożone zanieczyszczeniem X” – system przeszuka genealogię,
by wskazać nie tylko bezpośrednie powiązania partii, ale i partie wyprodukowane na tej samej
linii wkrótce po produkcie alergennym (co mogło skutkować skażeniem krzyżowym). To wymaga
połączenia danych trace z kalendarzem produkcji i może być bardzo cennym narzędziem
prewencji.
Wykrywanie anomalii: zaimplementujemy monitoring kluczowych parametrów (czasy operacji,
wydajność, straty surowca) z użyciem prostych algorytmów ML lub reguł. Gdy system wykryje
nietypową odchyłkę (np. nagle spadek yield o 10% na danej zmianie, albo operacja trwa
dwukrotnie dłużej niż zwykle), wyśle alert menedżerom. To umożliwi szybszą reakcję na problemy
(predykcyjne utrzymanie ruchu, wykrycie błędów pracowników, itp.).
Dashboard KPI: w ramach modułu raportów pojawi się interaktywny dashboard prezentujący
kluczowe wskaźniki (OEE – efektywność wyposażenia, % wykonania planu, liczba przestojów,
compliance w QA). Użytkownicy Enterprise będą mogli definiować własne KPI do śledzenia.
System może też oferować benchmark – porównanie wskaźników z uśrednionymi danymi innych
(anonimowo) podobnych zakładów, co motywuje do poprawy.
Asystent AI: rozważamy dodanie chatbota lub asystenta opartego o AI (np. integracja z GPT),
który mógłby odpowiadać na pytania użytkownika w kontekście danych z systemu. Np. pytanie
„Pokaż mi wszystkie zlecenia, które przekroczyły planowany termin w tym miesiącu” – system
generuje odpowiedź z listą takich zleceń i przyczynami. Taka funkcja na razie eksperymentalna,
ale mogłaby wyróżnić produkt dla decydentów poszukujących „inteligentnych” rozwiązań.
Wielofirmowość i instancje nadrzędne – dla grup kapitałowych posiadających wiele zakładów
(wiele organizacji), możemy w przyszłości zaoferować konsolę multi-org. Pozwoli ona
holdingowi zarządzać kilkoma fabrykami (org) z poziomu jednego panelu nadrzędnego – np.
agregować dane, porównywać wydajności zakładów, przenosić konfiguracje między nimi
(replikacja ustawień) itd. To już wykracza poza standard multi-tenant (gdzie tenanty są
odseparowane), ale dla Enterprise klienta możemy zaproponować utworzenie meta-poziomu (np.
powiązać organizacje przez pole group_id). Taka funkcja może być unikalna w kontekście
skalowania rozwiązania na korporacje z wieloma zakładami.
Każda z powyższych propozycji ma na celu zwiększenie atrakcyjności MonoPilot MES na rynku: -
Sandbox QA i kreatory upraszczają użytkowanie i budują zaufanie do systemu. - Konfigurowalne etykiety
i API zwiększają możliwości integracji z istniejącymi procesami. - Inteligentne traceability i analityka
przenoszą system z poziomu rejestrującego dane do poziomu doradzającego i ostrzegającego, co jest
trendem w nowoczesnych systemach (Industry 4.0).
•
•
•
•
•
•
•
•
•
14

### 12.11 Plan Wdrożenia i Podsumowanie

Powyższy plan transformacji MonoPilot MES w kierunku platformy modułowej, multi-tenant SaaS
obejmuje zarówno zmiany architektoniczne, jak i nowe funkcjonalności biznesowe. Realizacja
powinna być przeprowadzona etapami:
Migracja multi-tenant (Org ID) – najpierw wprowadzenie organizacji i RLS, ponieważ to wpływa
na całą strukturę danych. Należy wykonać migracje bazy, dostosować API i przetestować izolację
(sekcje 12.2, 12.4 częściowo). To odblokuje możliwość bezpiecznego hostowania wielu firm.
System konfiguracji org. i RBAC – zaimplementowanie modułu ustawień organizacji, tablic
konfiguracyjnych oraz pełnego RBAC (sekcje 12.3 i 12.4). To zapewni różnym firmom
dostosowanie systemu do swoich potrzeb i kontrolę dostępu. Równolegle można wprowadzać
zmiany w UI (12.5) związane z ukrywaniem modułów wg konfiguracji.
Wielośrodowiskowość i migracje – przygotowanie infrastruktury dla środowiska demo i drugiej
instancji produkcyjnej, przetestowanie mechanizmu rejestracji i migracji (12.1, 12.8). Na tym
etapie można zacząć pozyskiwać użytkowników Free/Demo i zbierać ich feedback.
Skalowanie i wydajność – przed wdrożeniem większych klientów, skupić się na optymalizacjach
z sekcji 12.6. Wprowadzić monitoring i tunele wydajnościowe, by system był gotów na obciążenie.
Warstwa jakości i audytu – zaimplementować rozszerzenia dotyczące traceability, logów
audytowych i raportów jakości (12.7). To ważne dla klientów Enterprise, więc powinno być
ukończone przed agresywnym marketingiem do dużych firm.
Obsługa planów Free/Pro/Ent – dopracować ograniczenia planów (12.9), przetestować, że
system poprawnie załącza/wyłącza funkcje. Przygotować też komunikację marketingową, strony
z porównaniem planów, itp.
Dodatkowe innowacje – równolegle z powyższymi krokami (zwłaszcza jeśli inne zespoły mogą to
robić) rozwijać funkcje z 12.10: np. kreator BOM mógłby powstać stosunkowo szybko i od razu
poprawić UX nowych użytkowników; API publiczne również może być priorytetem, bo integracje
są często wymogiem u klientów.
Testy końcowe i wdrożenie – gruntowne testy integracyjne całego systemu po zmianach.
Migracja istniejącego klienta (pierwotnego single-tenant) na nową wersję multi-tenant (zapewne
jako oddzielny tenant). Stopniowe przenoszenie kolejnych klientów na nową architekturę lub
zachęcanie ich do rejestracji w nowym systemie (jeśli dotychczasowy był prototypem).
Po realizacji planu MonoPilot MES stanie się nowoczesnym, skalowalnym systemem klasy MES w
modelu SaaS, zdolnym obsłużyć zróżnicowaną bazę klientów. Będzie oferować: - Pełną separację i
bezpieczeństwo danych dla wielu klientów jednocześnie . - Możliwość samodzielnego startu i
konfiguracji przez klienta, bez długotrwałych wdrożeń. - Elastyczność konfiguracji procesów
produkcyjnych i jakościowych pod specyfikę każdego zakładu. - Spełnienie wysokich standardów jakości
(BRC, traceability) dzięki rozbudowanym funkcjom audytu . - Ciągłe unowocześnianie – otwartość na
integracje, IoT, analitykę – co wyróżni produkt na tle konkurencji.
Realizacja tego planu pozwoli MonoPilot MES wejść na rynek jako uniwersalne rozwiązanie dla
produkcji – od małych firm, które potrzebują prostego narzędzia dostępnego od ręki, po duże
przedsiębiorstwa wymagające personalizacji, integracji i najwyższej niezawodności. Wszystko to
zbudowane na jednej bazie kodu, co ułatwi rozwój i utrzymanie w dłuższej perspektywie.
TODO2.md
file://file-UwEvKn1pDq2mnqhPaxqBVC
1.
2.
3.
4.
5.
6.
7.
8.
2
13
1 3 7 8 9
15
SYSTEM_OVERVIEW.md
file://file-SUBB6ie9BkyGy9YmoxKn7X
Partition Tables and RLS - Supabase - Answer Overflow
https://www.answeroverflow.com/m/1378044938595598356
TODO.md
file://file-2BNgykc2BmLtg5u6TeRWcg
BUSINESS_FLOWS.md
file://file-A765e7WqYVBhVyK5xvQzXP
BRC Traceability Requirements – Digital Compliance with V5 Software
https://sgsystemsglobal.com/brc-traceability-requirements/
BRCGS Clause 3.9 – Traceability Requirements - SG Systems Global
https://sgsystemsglobal.com/glossary/brcgs-clause-3-9-traceability-requirements/

Summary Statistics
Overall Progress by Module
Module Progress Status

## 1.0 Foundation ~85% 🔄 Core done, multi-tenant foundation done, org management pending

## 2.0 Technical ~95% ✅ Nearly complete

## 3.0 Planning ~77% 🔄 Core done, schema→UI gap (dates, currency)

## 4.0 Production ~50% 🔄 API done, UI incomplete (only tables)

## 5.0 Warehouse ~70% 🔄 Core done, ASN flow pending

## 6.0 Scanner ~60% 🔄 Core done, mobile UX pending

## 7.0 Quality ~45% 🔄 QA basics, NO trace visualization

## 8.0 Exports ~70% 🔄 Core exports done

## 9.0 Testing ~10% ⬜ Only auth tests exist

### 9.5 Type Safety ~80% ✅ Pre-commit hooks active, audit pending

## 10.0 Documentation ~85% 🔄 Core docs updated + type safety

## 11.0 Future ~0% ⬜ Post-MVP

Priority Breakdown

🟢 P0 (Critical for MVP): ~65% complete

🟡 P1 (Post-MVP): ~5% complete

⚪ P2 (Future): ~0% complete

Key Findings from Code Audit

Foundation & Technical solid - ~95% complete

✅ Type Safety implemented - ~80% complete

✅ Multi-tenant foundation implemented - basic infrastructure done, full org management pending

Pre-commit hooks operational (SETUP_TYPE_CHECKING.md)

100% deployment failures were TypeScript errors (DEPLOYMENT_ERRORS_ANALYSIS.md)

Automated type-check, ESLint, Prettier in pre-commit

Audit of existing code for type issues pending

🟡 Planning module - ~77% (Schema→UI gap: actual dates, currency, ship/receive dates)

WO ~85%: Brakuje actual_start/end, source_demand, BOM tracking w UI

PO ~80%: Brakuje due_date, currency, exchange_rate, total_amount w UI

TO ~65%: Brakuje 4 daty (planned/actual ship/receive), location fix, line items details

🔴 Production module - ~50% (ONLY basic tables, NO dashboard/analytics)

🔴 Traceability - ~40% (API exists, NO visualization/tables)

Testing is minimal - Only auth tests exist; need comprehensive test suite

Mobile UX pending - Scanner module needs mobile optimization

ASN → GRN → LP flow - Core logic exists but full integration pending

Label printing - Not started, critical for MVP

Documentation - Core docs updated 2025-11-04, Type safety integration in progress

Next Steps (Priority Order)

Phase 1: Complete Planning Module (Zamknięcie modułu Planning - 8-9 dni)

🟢 WO: Actual dates, source demand, BOM tracking - 3 dni

🟢 PO: Due date, currency, exchange rate, total amount - 2 dni

🟢 TO: Ship/receive dates, location fix, line items - 3-4 dni

🟢 ASN → GRN → LP flow integration - 2-3 dni (parallel z powyższymi)

🟢 Multi-tenant RLS testing - 1 dzień
  🟢 Organization Settings page & user management - 3.5 dni
  🟢 RBAC implementation per organization - 2 dni
  🟢 Complete org_id migration across all tables - 3 dni

Phase 2: Production Module (Po Planning, wymaga przeprojektowania) 4. 🔴 Production Dashboard - design & implementation - 5-7 days 5. 🔴 Yield Analytics & Charts - visual dashboard - 3-4 days 6. 🔴 Consumption Dashboard - visual analytics - 3-4 days 7. 🔴 Operations Workflow - visual workflow UI - 4-5 days 8. 🔴 Real-time Monitoring - production status - 3-4 days

Phase 3: Traceability (Po Planning, wymaga przeprojektowania) 9. 🔴 Traceability Table/Grid - visual results - 3-4 days 10. 🔴 LP Tree Visualization - tree diagram - 4-5 days 11. 🔴 Trace Reports & Export - Excel/PDF - 2-3 days 12. 🔴 Genealogy Matrix - composition view - 3-4 days

Phase 4: Supporting Features 13. 🟢 Label printing system - 3-4 days 14. 🟢 Mobile Scanner UX - 2-3 days 15. 🟢 COA PDF generation - 2 days 16. 🟢 E2E test suite - 3-4 days

Phase 5: Advanced Automation (Future Enhancements) 17. ⚪ Schema-to-UI comparison auditor - Detect missing fields in components vs database schema 18. ⚪ Automated form field generation - Generate form fields from table metadata 19. ⚪ Migration tagging and versioning system - Automated migration categorization and tracking 20. ⚪ Pre-merge documentation diff checker - Validate documentation changes before merge 21. ⚪ Automated API endpoint discovery and testing - Generate test cases from API definitions 22. ⚪ Database seed data management - Test data only, no production seeds

---

**Last audit**: 2025-01-XX  
**Audited by**: Documentation Team  
**Verified against**: Code, migrations, components, API classes, documentation  
**Type Safety**: Pre-commit hooks active, deployment error prevention implemented (see DEPLOYMENT_ERRORS_ANALYSIS.md)  
**Multi-tenant**: Podstawy rozdzielenia na organizacje zaimplementowane. Wymagane: strona ustawień organizacji, zarządzanie użytkownikami, RBAC, kompletna migracja org_id na wszystkie tabele.
