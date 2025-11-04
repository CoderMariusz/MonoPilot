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

1.0 Foundation & Architecture
1.1 Database Schema

1.1.1 Core tables (products, boms, bom_items)

1.1.2 Planning tables (work_orders, purchase_orders, transfer_orders)

1.1.3 Warehouse tables (grns, license_plates, stock_moves, locations)

1.1.4 Production tables (wo_operations, wo_materials, production_outputs)

1.1.5 Traceability tables (lp_reservations, lp_compositions, lp_genealogy) only table

1.1.6 Master data (suppliers, warehouses, machines, routings) ???

1.1.7 Settings & configuration (location, machines, allergens, warehouses, tax_codes, routing settings)

Status: ✅ Core schema complete (migrations 001-009)

1.1 Database Schema — doprecyzowania P0 (NOWE)

1.1.6 Master data (suppliers, warehouses, machines, routings) — schema audit & align 🟢 P0 — 0.5 dnia
Potwierdź FK, unikalności, indeksy; ujednolić nazwy kolumn z API.

1.1.7 Settings & configuration — zakres finalny 🟢 P0 — 0.25 dnia
Settings obejmuje: locations, machines, allergens, warehouses, tax_codes, routing settings (potwierdzenie i opis w docs).

1.2 API Layer

1.2.1 Dual-mode pattern (mock vs Supabase) - not exsist any more to remove

1.2.2 ProductsAPI (CRUD operations)

1.2.3 WorkOrdersAPI (with filters and stage status)

1.2.4 PurchaseOrdersAPI (with cancel method)

1.2.5 TransferOrdersAPI (with cancel method)

1.2.6 SuppliersAPI (CRUD operations)

1.2.7 WarehousesAPI (CRUD operations)

1.2.8 LicensePlatesAPI (with composition tracking)

1.2.9 YieldAPI (PR/FG yield calculations)

1.2.10 ConsumeAPI (consumption tracking)

1.2.11 TraceabilityAPI (forward/backward trace)

1.2.12 RoutingsAPI (routing management)

1.2.13 AllergensAPI (allergen management)

1.2.14 TaxCodesAPI (tax code management)

1.2.15 LocationsAPI (location management)

1.2.16 MachinesAPI (machine management)

Status: ✅ Core APIs complete

1.3 RPC Functions & Business Logic (zastępuje poprzednie, pełna logika)

1.3.1 cancel_work_order(wo_id, user_id, reason, source) 🟢 P0 — 0.75 dnia
Reguły: WO !∈ {completed,cancelled}; brak production_outputs; zamyka wo_operations; zwalnia lp_reservations; transakcja + advisory lock; idempotencja.
Output: { success, note? }

1.3.2 cancel_purchase_order(po_id, user_id, reason, source) 🟢 P0 — 0.5 dnia
Reguły: PO !∈ {received,closed,cancelled}; brak GRN powiązanych; transakcja + lock; idempotencja.

1.3.3 cancel_transfer_order(to_id, user_id, reason, source) 🟢 P0 — 0.5 dnia
Reguły: TO ∈ {draft,submitted}; actual_ship_date IS NULL; brak stock_moves wysyłkowych; transakcja + lock; idempotencja.

1.3.4 get_material_std_cost(product_id, as_of_date?, currency?) 🟢 P0 — 0.25 dnia
Źródło: products.unit_price (MVP: 1 produkt = 1 cena); opcjonalnie przelicz wg Settings currency/exchange_rate.

1.3.5 set_po_buyer_snapshot(po_id, buyer_id, buyer_name, snapshot_ts?) 🟢 P0 — 0.25 dnia
Snapshot danych kupca do kolumn PO; wołane przy create/update; audyt kompatybilny.

1.3.6 Multi-tenant RLS smoke-test (CI) 🟢 P0 — 0.75 dnia
Skrypt SQL: 2 orgi, 2 userów; insert danych; verify SELECT/UPDATE blokowane cross-tenant; run w CI po migracjach.

Szacowany łączny czas sekcji 1.3: 3,0 dnia

Status: 🔄 Core RPC functions done, RLS testing pending

1.4 Authentication & Security

1.4.1 Basic RLS policies (read/write)

1.4.2 Supabase Auth integration

1.4.3 User sessions management

1.4.4 Role-based access control (RBAC) 🟡 P1

1.4.5 Multi-tenant data isolation testing 🟢 P0

1.4.6 Multi-tenant foundation (basic implementation) ✅ Completed
Podstawy rozdzielenia na różne organizacje zostały zaimplementowane. System obsługuje podstawową infrastrukturę multi-tenant.

Status: 🔄 Basic auth done, multi-tenant foundation implemented, RBAC and org management pending

1.4 Multi-tenant & Organization Management — P0 doprecyzowania (NOWE)

1.4.6.1 Organization Settings page 🟢 P0 — 2.0 dnia
Strona /settings/organization z pełnym zarządzaniem organizacją:

- Wyświetlanie informacji o organizacji (nazwa, status, data utworzenia)
- Edycja podstawowych danych organizacji
- Lista członków organizacji
- Zarządzanie użytkownikami (dodawanie, usuwanie, przypisywanie ról)

  1.4.6.2 User management in organization 🟢 P0 — 1.5 dnia

- Dodawanie użytkowników do organizacji (przez email/invite)
- Przypisywanie ról per użytkownik per organizacja
- Usuwanie/deaktywacja użytkowników
- Zarządzanie uprawnieniami na poziomie organizacji

  1.4.6.3 Role-based access control (RBAC) per organization 🟢 P0 — 2.0 dnia

- System ról: Admin, Manager, Operator, Viewer
- Definicja uprawnień per rola per moduł
- UI do zarządzania rolami w organizacji
- Enforce uprawnień w API i RLS policies

  1.4.6.4 Complete org_id migration across all tables 🟢 P0 — 3.0 dnia
  AUDYT: Każda tabela musi mieć org_id dla kompletnego oddzielenia między organizacjami:

- Migracja: dodanie org_id NOT NULL do wszystkich tabel biznesowych
- Update wszystkich INSERT/UPDATE queries aby automatycznie używały org_id z sesji
- Weryfikacja RLS policies: wszystkie SELECT/UPDATE/DELETE filtrują po org_id
- Testy: weryfikacja że dane z jednej organizacji nie są widoczne dla drugiej

Szacowany łączny czas sekcji 1.4.6: 8.5 dnia

Status: ✅ Podstawy multi-tenant zaimplementowane, pełne zarządzanie organizacją pending

2.0 Technical Module - BOM Management
2.1 Product Catalog

2.1.1 Product taxonomy (MEAT/DRYGOODS/COMPOSITE)
2.1.2 Product groups and types
2.1.3 Allergen tagging (many-to-many)
2.1.4 Tax codes integration
2.1.5 Supplier products (per-supplier pricing)
2.1.6 Product archiving (is_active flag)

Status: ✅ Complete

Nowe akcje / walidacje (P0):

Product → Supplier/Currency (MVP 1:1): produkt ma supplier_id; waluta/ceny brane z produktu/PO; brak logiki wyboru dostawcy.

Allergen chips: oznacz „inherited” (z BOM) jako szare, „direct” jako kolor — tylko wizualizacja.

Jednostki miary: products.uom tylko informacyjne, BOM jest źródłem prawdy (patrz sekcja 2.2).

Audit (P1): log zmian (create/update/archive) z polem „reason”.

2.2 BOM Management

2.2.1 BOM structure (product_id, version, status)
2.2.2 BOM items (materials, quantities, scrap %)
2.2.3 BOM versioning (X.Y format, auto-bump)
2.2.4 BOM lifecycle (draft → active → archived)
2.2.5 Single active BOM per product (unique constraint)
2.2.6 Clone-on-edit pattern
2.2.7 BOM snapshot on WO creation (trigger)
2.2.8 Allergen inheritance from components
2.2.9 Circular BOM reference detection 🟡 P1
2.2.10 BOM depth limit validation 🟡 P1
2.2.11 Product version 🟢 P0 nor done
2.2.12 BOM version con be only edit in draft status, active all field noactive 🟢 P0 nor done
2.2.12 BOM version check logic (small/big change) big change is only change item, rest any field will be small change 🟢 P0 nor done

Status: ✅ Core BOM system complete, advanced validation pending

2.2 BOM — P0 doprecyzowania (NOWE)

2.2.11 Product version (wersjonowanie produktu) — minimal 🟢 P0 — 1.0 dnia

Pole product_version (X.Y).

Minor bump: zmiany meta-pól produktu/BOM (nie itemów).

Major bump: ręcznie z UI (przycisk).

2.2.12 BOM editable tylko w draft; active read-only 🟢 P0 — 0.75 dnia

active → pola zablokowane; dostępne akcje: Clone as Draft, Archive.

Próba edycji aktywnego → BUSINESS_RULE_ERROR.

2.2.13 BOM version change logic (small vs big) 🟢 P0 — 0.75 dnia

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

2.2 Taxes & Meta

2.2.S3 Usuń tax_code z BOM 🟢 P0 — 0.25 dnia

BOM nie trzyma podatków; podatki/waluta z dostawcy/PO.

UI: usuń sekcję „Tax code”.

Migracje: drop kolumnę jeśli istnieje.

2.2 Jednostki miary (UoM) — źródło prawdy

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

2.2 Snapshot fidelity

2.2.S5 Snapshot WO/BOM pełny 🟢 P0 — 0.5 dnia

Snapshot zawiera: material_id, qty, scrap%, 1:1 flag, uom, alergeny, komentarze, product_version, bom_version, line_id.

2.2 Testy (P0)

Constraint single active.

Blokada edycji active.

Big/small bump działa zgodnie z regułami.

Snapshot pinning działa (BOM update ≠ WO snapshot).

Line_id zapisany i dziedziczony do WO.

Walidacje UoM działają (mixed units ok).

2.3 Routing Management

2.3.1 Routing definition (operations sequence)
2.3.2 Routing operations (operation_id, sequence, machine_id) add field machine?
2.3.3 Multi-choice routing requirements (Smoke, Roast, Dice, Mix) (possible o change that names)?
2.3.4 Yield per phase tracking
2.3.5 Per-phase expiry adjustments ⚪ P2

Status: ✅ Core routing done, advanced features pending

2.3 Routing — P0 doprecyzowania (NOWE)

2.3.2 routing_operations.machine_id — migracja + UI 🟢 P0 — 1.0 dnia

Dodaj machine_id (FK) i selektor w wierszu operacji.

Walidacja sekwencji (rosnąca, unikalna).

2.3.3 Słownik nazw operacji w Settings (Decyzja #4) 🟢 P0 — 0.5 dnia

Dodaj Settings → Routing Operations Dictionary (lista nazw i aliasów).

RoutingBuilder używa słownika; można ręcznie dodawać/korygować.

Startowy zestaw: Smoke, Roast, Dice, Mix.

2.3.S1 Expected yield % per operacja (storage-only) 🟢 P0 — 0.25 dnia

Przechowywanie expected_yield% per operacja; raportowanie w Production.

2.4 UI Components

2.4.1 BomCatalogClient (MEAT/DRYGOODS/COMPOSITE/ARCHIVE tabs)
2.4.2 SingleProductModal (MEAT/DRYGOODS editing)
2.4.3 CompositeProductModal (BOM editing with versioning)
2.4.4 AddItemModal enhancement (wider, more sections)
2.4.5 RoutingBuilder component
2.4.6 AllergenChips component
2.4.7 ProductSelect component
2.4.8 BomHistoryModal component

Status: ✅ Complete - but check that components

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

3.0 Planning Module - Orders

📊 DETAILED ANALYSIS: See docs/PLANNING_MODULE_FILES_FOR_EXTERNAL_ANALYSIS.md (2025-11-03)
✅ PHASE 1-3 COMPLETE: Transfer Orders (TO), Purchase Orders (PO), and Work Orders (WO) modules fully implemented with all critical features:

Phase 1 (TO): Shipping/receiving dates, markShipped/markReceived methods, LP/batch tracking

Phase 2 (PO): Payment due date, currency, exchange rate, total amount calculations

Phase 3 (WO): Source demand tracking, actual start/end dates, BOM selection

Documentation: API_REFERENCE.md, DATABASE_SCHEMA.md, PLANNING_MODULE_GUIDE.md updated

Unit Tests: transferOrders.test.ts, purchaseOrders.test.ts, workOrders.test.ts created

3.1 Work Orders (WO)

Status: 🔄 ~95% ukończone – Rdzeń funkcjonalności zaimplementowany (tabela WO, tworzenie/edycja/anulowanie zleceń, snapshot BOM), pozostały drobne uzupełnienia w UI oraz testy. Brakuje głównie widoczności postępu produkcji i braków materiałowych w UI oraz funkcji aktualizacji receptury.

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

3.2 Purchase Orders (PO)

Status: 🔄 ~90% ukończone – Większość funkcjonalności zakupów jest gotowa (tabela PO, tworzenie/edycja, kalkulacje płatności), wprowadzone zostały kluczowe pola finansowe (termin płatności, waluta, kwoty). Wymagane są korekty zgodnie ze zmianami założeń (automatyzacja waluty/podatku, usunięcie exchange rate) oraz dodanie kilku usprawnień (śledzenie użytkownika, import z Excel, integracja ASN).

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

3.3 Transfer Orders (TO)

Status: 🔄 ~90% ukończone – Moduł transferów materiałów między magazynami prawie gotowy: podstawowe operacje (tworzenie, edycja, realizacja wysyłki/odbioru) działają. Dodano śledzenie przesyłek (daty wysyłki/odbioru planowane i rzeczywiste) oraz identyfikację partii/LP w pozycjach. Do dopracowania pozostały drobne usprawnienia: przywrócenie funkcji anulowania transferu, poprawa wyświetlania lokalizacji, oraz opcja importu z Excel.

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

3.4 ASN Management (Advanced Shipping Notice)

Status: 🔄 ~30% ukończone – Podstawy obsługi ASN są zaczęte (modal dodawania ASN i zapis danych), jednak pełna integracja z przepływem przyjęcia dostawy (GRN) i obsługa wyjątków ilościowych jest w toku. Należy dokończyć walidacje i powiązania, aby moduł ASN sprawnie łączył zamówienia zakupu z przyjęciami.

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

Status: 🔄 ~30% complete - Modal done, full flow pending

4.0 Production Module - Work Orders

⚠️ CRITICAL: Production Module jest tylko PODSTAWĄ - istnieją tabele, NIE kompletny moduł!

4.1 Work Order Execution (Schema & Basic API)

4.1.1 WO operations tracking (wo_operations table)

4.1.2 WO materials snapshot (wo_materials table)

4.1.3 Production outputs tracking (production_outputs table)

4.1.4 Stage status calculation (API level)

4.1.5 Sequential routing enforcement (API level)

4.1.6 Hard 1:1 rule (consume_whole_lp flag)

4.1.7 Cross-WO PR validation (API level)

4.1.8 Reservation-safe operations (API level)

Status: 🔄 ~60% - Schema & API exist, UI incomplete

4.2 Yield Tracking (Basic Tables ONLY)

4.2.1 PR yield API (with time bucket filtering)

4.2.2 FG yield API (with time bucket filtering)

[~] 4.2.3 YieldReportTab component (only basic table, NO charts) 🟢 P0

4.2.4 Yield calculations per operation (API only)

4.2.5 Time bucket selection (day/week/month)

4.2.6 Visual charts and analytics 🟢 P0

4.2.7 Trend analysis dashboard 🟢 P0

4.2.8 Yield export to Excel 🟢 P0

Status: 🔄 ~50% - Basic API & table, NO dashboard/charts

4.3 Consumption Tracking (Basic Tables ONLY)

4.3.1 Consume API (variance calculations)

[~] 4.3.2 ConsumeReportTab component (only basic table) 🟢 P0

[~] 4.3.3 Variance tracking (color-coded in table only) 🟢 P0

4.3.4 Material consumption per WO (API only)

4.3.5 ManualConsumeModal component

4.3.6 Visual consumption dashboard 🟢 P0

4.3.7 Variance analysis charts 🟢 P0

4.3.8 Consumption export to Excel 🟢 P0

Status: 🔄 ~50% - Basic API & table, NO dashboard

4.4 Operations Management (Basic Table ONLY)

[~] 4.4.1 OperationsTab component (only list, NO workflow) 🟢 P0

4.4.2 Per-operation weight tracking (API level)

4.4.3 RecordWeightsModal component

4.4.4 Operation completion workflow (API level)

4.4.5 1:1 validation in weight recording

4.4.6 Visual operations workflow 🟢 P0

4.4.7 Real-time operation status 🟢 P0

4.4.8 Operations dashboard 🟢 P0

Status: 🔄 ~50% - Basic components, NO visual workflow

4.5 Production Dashboard & Analytics

4.5.1 Production overview dashboard 🟢 P0

4.5.2 Real-time monitoring 🟢 P0

4.5.3 Resource utilization charts 🟢 P0

4.5.4 Production KPIs visualization 🟢 P0

4.5.5 Production planning interface 🟢 P0

4.5.6 Performance analytics 🟢 P0

Status: ⬜ Not started - Critical for production management

4.0 Moduł Produkcji – Plan Implementacji (tłumaczenie)

Uwaga: Moduł Produkcji będzie integrowany z istniejącym systemem (nie jako osobna wtyczka), aby uwzględnić szeroki zakres zmian i aktualizacji. Przygotuj ewentualne aktualizacje schematu bazy poprzez migracje (np. dodanie pól) tak, by wspierały nową funkcjonalność.

4.1 Realizacja Zleceń Produkcyjnych (rozszerzenia schematu i API)

Śledzenie operacji WO i materiałów: Wykorzystaj istniejące tabele wo_operations i wo_materials jako fundament wykonania zleceń. Zaimplementuj UI (np. OperationsTab w szczegółach WO), który listuje wszystkie operacje (wo_operations) z ich sekwencją, statusem i zarejestrowanymi wynikami. Upewnij się też, że szczegóły WO wyświetlają wymagania materiałowe z wo_materials (snapshot BOM: ilości wymagane oraz wystagowane), by użytkownik widział alokacje materiałów. To zapewnia widoczność każdej operacji i jej potrzeb materiałowych.

Obliczanie statusu etapów: Wykorzystaj metody API (np. WorkOrdersAPI.getWorkOrderStageStatus) do wyliczania statusu ukończenia każdego etapu/operacji w WO. Jeśli brak implementacji, utwórz logikę zwracającą operację bieżącą, ukończone i postęp całości. Będzie to użyte do pokazywania statusu w czasie zbliżonym do rzeczywistego w UI (np. pasek postępu lub lista etapów). API ma bazować na statusach wo_operations oraz ewentualnie zapisach w production_outputs, by ocenić, czy operacja ma zarejestrowane wyjście (oznaka ukończenia).

Wymuszanie sekwencyjnego routingu: Wymuś, aby operacje były kończone w zdefiniowanej kolejności. Na poziomie API zabezpiecz endpoint kończenia operacji (np. completeOperation), aby operacja o sekwencji n nie mogła zostać ukończona, zanim n-1 będzie ukończona. Próby „poza kolejką” zwracają błąd/ostrzeżenie. To egzekwuje regułę biznesową Sequential Processing.

Twarda zasada 1:1 (consume_whole_lp): Zaimplementuj regułę consume_whole_lp dla komponentów wymagających konsumpcji całej jednostki/LP. Flaga na poziomie składnika BOM lub wpisu wo_materials powinna oznaczać, że dany materiał musi być zużyty w całości (np. całe LP). Zaktualizuj logikę konsumpcji: jeśli flaga jest ustawiona, system pozwala użyć tylko jednego, całego LP na jedną operację wyjściową – bez konsumpcji częściowej. Jeśli operacja daje wiele wyjść, każde powinno mieć własne pojedyncze wejście LP (bez mieszania). Niespełnienie → błąd.

Walidacja między-WO (Cross-WO): Dodaj kontrole zapobiegające mieszaniu materiałów pomiędzy różnymi WO. Upewnij się, że materiały/wyroby pośrednie zarezerwowane/wyprodukowane dla jednego WO nie są konsumowane w innym bez jawnego powiązania. Przy rejestracji konsumpcji/ukończenia operacji waliduj, że wejściowe LP należą do rezerwacji tego WO lub są nieprzypisanym stanem. Zachowuje to integralność genealogii i unika niezamierzonego mieszania.

Operacje bezpieczne względem rezerwacji: Zanim pozwolisz rozpocząć/ukończyć operację, zweryfikuj, że wymagane materiały są wystagowane/zarezerwowane. Użyj lp_reservations, by sprawdzić, czy WO i dana operacja mają zarezerwowane LP. API powinno odmawiać startu/ukończenia, jeśli brakuje rezerwacji lub są niewystarczające. To egzekwuje Reservation System i zapobiega niespójnościom stanów.

Integracja z terminalem/skanerem: Większość funkcji będzie wywoływana z terminala produkcyjnego. Upewnij się, że metody WorkOrdersAPI (np. recordWeights, completeOperation) są dostępne i przetestowane z UI skanera. Operator powinien móc skanować i uruchamiać te akcje. UI musi być uproszczone (duże przyciski, minimum wprowadzania) dla terminali – dedykowane formularze/modale w StageBoard lub pokrewnych.

Rejestrowanie wyników (outputs): Kontynuuj użycie production_outputs do logowania wyników i odpadu dla każdej operacji. Przy ukończeniu operacji zapisuj wo_id, sekwencję, output_qty, waste_qty. To zasili obliczenia wydajności (yield). API ma uzupełniać tę tabelę przy YieldAPI.recordYield lub completeOperation z danymi o wydajności. Zaktualizuj też wo_operations.status na „completed” i przechowuj metryki yield dla szybkiego dostępu.

Ostrzeżenia przy zamknięciu WO: Przy finalizacji WO (status completed po ostatniej operacji) waliduj bilans. Jeśli sumaryczne wyjście vs plan różni się albo nie wszystkie materiały zużyto, pokaż ostrzeżenie. Pozwalamy zakończyć, ale sygnalizujemy i umożliwiamy wpis przyczyn lub korektę przez manualne zużycie. To zasili późniejsze raporty niezgodności.

4.2 Śledzenie Wydajności (Yield – raportowanie wyników)

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

4.3 Śledzenie Konsumpcji (zużycie materiałów i odchylenia)

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

4.4 Zarządzanie Operacjami (workflow i UI)

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

4.5 Dashboard Produkcji i Analityka

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

5.0 Warehouse Module - Inventory
5.1 Goods Receipt Notes (GRN)

5.1.1 GRN table (grn_number, po_id, status)

5.1.2 GRN items (product, quantities ordered/received)

[?] 5.1.3 GRNTable component

[?] 5.1.4 GRNDetailsModal component

[?] 5.1.5 CreateGRNModal component

5.1.6 ASN → GRN flow integration 🟢 P0

5.1.7 Auto-generate LP on GRN 🟢 P0

5.1.8 Location assignment on GRN 🟢 P0

Status: 🔄 ~60% complete - Components done, ASN flow pending

5.1 GRN — P0 doprecyzowania (NOWE)

5.1.3 GRNTable — weryfikacja/uzupełnienie 🟢 P0 — 0.5 dnia

5.1.4 GRNDetailsModal — weryfikacja/uzupełnienie 🟢 P0 — 0.5 dnia

5.1.5 CreateGRNModal — weryfikacja/uzupełnienie 🟢 P0 — 0.5 dnia

5.2 License Plates (LP) (Stock)

5.2.1 License plates table (lp_number, product, quantity, qa_status)

5.2.2 8-digit LP numbering (WOnnnnSS format)

5.2.3 LP parent-child relationships

5.2.4 LP composition tracking (lp_compositions table)

5.2.5 LP genealogy (lp_genealogy table)

[?] 5.2.6 LPOperationsTable component

[?] 5.2.7 AmendLPModal component

[?] 5.2.8 SplitLPModal component

[?] 5.2.9 TraceLPModal component

Status: ✅ Complete

5.2 LP — P0 doprecyzowania (NOWE)

5.2.6–5.2.9 LP UI completeness pass 🟢 P0 — 1.0 dnia
LPOperationsTable / AmendLPModal / SplitLPModal / TraceLPModal — potwierdź i uzupełnij brakujące pola/akcje.

5.3 Stock Moves

5.3.1 Stock moves table (lp_id, from/to location, status)

5.3.2 StockMoveTable component

5.3.3 StockMoveDetailsModal component

5.3.4 CreateStockMoveModal component

5.3.5 Mobile-friendly Pick/Putaway UI 🟢 P0

Status: 🔄 ~80% complete - Desktop UI done, mobile pending

5.4 Location Management

5.4.1 Locations table (code, name, warehouse_id)

5.4.2 Warehouse hierarchy

5.4.3 LocationsTable component

5.4.4 Auto-location assignment rules 🟢 P0

Status: 🔄 ~70% complete - Basic location mgmt done, rules pending

6.0 Scanner Module - Mobile Operations
6.1 Stage Board

6.1.1 StageBoard component (real-time operation status)

[?] 6.1.2 Color coding (red/amber/green)

6.1.3 Stage metrics display

6.1.4 LP staging validation

6.1.5 QA gate enforcement

Status: ✅ Complete (desktop)

6.1 Stage Board — P0 doprecyzowania (NOWE)

6.1.2 Color coding (R/A/G) — finalize & document 🟢 P0 — 0.5 dnia
Legendy, progi, testy.

6.2 Process Terminal

6.2.1 Staging operations

6.2.2 Weight recording

6.2.3 Operation completion

6.2.4 1:1 validation enforcement

6.2.5 Error handling & retry logic 🟢 P0

6.2.6 Barcode scanning integration 🟢 P0

6.2.7 Mobile UX optimization 🟢 P0

6.2.8 🟢 P0

Status: 🔄 ~60% complete - Core logic done, UX needs work

6.2 Process Terminal — P0 doprecyzowania (NOWE)

6.2.8 Błąd/Recovery UX (toast + retry flow) 🟢 P0 — 0.5 dnia
Jednolity banner błędu, retry, logowanie przyczyn (front).

6.3 Pack Terminal

[?] 6.3.1 Pallet creation -> tworzy lejbe pomysl na poczatek pdf puki nie podlaczymy drukarki.

[?] 6.3.2 LP composition management -> musimy to rozpisac

[?] 6.3.3 Pallet items tracking -> musimy to rozpisac

6.3.4 Mobile UI optimization 🟢 P0

6.3.5 Barcode scanning integration 🟢 P0

Status: 🔄 ~60% complete - Core done, mobile UI pending

6.3 Pack Terminal — P0 doprecyzowania (NOWE)

6.3.1 Pallet label → PDF (MVP) 🟢 P0 — 0.75 dnia

6.3.2 LP composition management — spec + minimal UI 🟢 P0 — 0.75 dnia

6.3.3 Pallet items tracking — schema+UX 🟢 P0 — 0.75 dnia

6.4 QA Override

6.4.1 QAOverrideModal component 🟢 P0

6.4.2 Supervisor PIN validation 🟢 P0

6.4.3 QA status change (Pending/Passed/Failed/Quarantine)🟢 P0

6.4.4 Audit trail for QA changes 🟢 P0

Status: ✅ Complete

6.5 Mobile Optimization

6.5.1 "Gruba rękawica" mode 🟢 P0

6.5.2 Large touch targets 🟢 P0

6.5.3 Landscape orientation support 🟢 P0

6.5.4 Offline capability ⚪ P2

Status: ⬜ Not started

7.0 Quality & Traceability
7.1 QA Status Management

7.1.1 QA status enum (Pending/Passed/Failed/Quarantine)

7.1.2 QA gate enforcement (blocks failed LPs)

7.1.3 Supervisor override capability

7.1.4 ChangeQAStatusModal component

7.1.5 COA PDF generation 🟢 P0

7.1.6 QA results table per LP 🟢 P0

7.1.7 QA test results storage 🟢 P0

7.1.8 Attachments (photos, docs) 🟢 P0

Status: 🔄 ~50% complete - Basic QA done, COA pending

7.2 Traceability

⚠️ CRITICAL: Traceability ma tylko API - NIE MA tabelek ani wizualizacji!

7.2.1 Forward trace API (backend only)

7.2.2 Backward trace API (backend only)

7.2.3 LP composition chains (database level)

7.2.4 Multi-level traceability (API level)

[~] 7.2.5 TraceTab component (only text list, NO table/tree) 🟢 P0

7.2.6 Trace to GRN/PO (API level)

7.2.7 Visual table/grid for trace results 🟢 P0

7.2.8 Tree diagram visualization 🟢 P0

7.2.9 Trace export to Excel 🟢 P0

7.2.10 Traceability reports 🟢 P0

7.2.11 LP genealogy visualization 🟢 P0

7.2.12 Composition matrix view 🟢 P0

Status: 🔄 ~40% complete - API exists, NO proper UI/tables/visualization

8.0 Exports & Reporting
8.1 Excel Exports Infrastructure

8.1.1 SheetJS (xlsx) integration

8.1.2 CSV conversion utilities

8.1.3 XLSX conversion utilities

8.1.4 Export helpers (formatters, headers)

Status: ✅ Complete

8.2 Export Endpoints

8.2.1 Yield reports export (PR/FG)

8.2.2 Consumption reports export

8.2.3 Work orders export

8.2.4 License plates export

8.2.5 Stock moves export

8.2.6 Traceability reports export 🟢 P0

8.2.7 GRN export 🟢 P0

8.2.8 PO export 🟢 P0

Status: 🔄 ~70% complete - Core exports done, some pending

8.3 Label Printing

8.3.1 Label template design 🟢 P0

8.3.2 Print queue system 🟢 P0

8.3.3 Retry logic for failed prints 🟢 P0

8.3.4 Label printer integration 🟢 P0

8.3.5 Barcode generation (Code 128, QR) 🟢 P0

Status: ⬜ Not started

9.0 Testing & Quality Assurance
9.1 Unit Tests

9.1.1 API layer tests (only auth exists currently)

9.1.2 Business logic tests

9.1.3 Validation tests

9.1.4 Calculation tests (yield, variance)

Status: ⬜ Minimal - Only auth tests exist

9.2 Integration Tests

9.2.1 PO → ASN → GRN → LP flow 🟢 P0

9.2.2 WO → Operations → Output flow

9.2.3 Trace integration tests

9.2.4 Supplier decision logic

Status: ⬜ Not started

9.3 E2E Tests

9.3.1 Full production workflow 🟢 P0

9.3.2 Warehouse operations workflow 🟢 P0

9.3.3 Scanner operations workflow 🟢 P0

Status: ⬜ Not started

9.4 Performance Testing

9.4.1 Large dataset testing 🟢 P0

9.4.2 Query performance verification

9.4.3 API response time monitoring

9.4.4 UI responsiveness with large datasets

Status: ⬜ Not started

9.5 Type Safety & Deployment Prevention 🟢 P0

📋 Context: Analysis of 20 consecutive deployment failures revealed 100% were TypeScript errors
📄 Reference: See DEPLOYMENT_ERRORS_ANALYSIS.md for detailed patterns and solutions
✅ Setup Complete: Pre-commit hooks configured via SETUP_TYPE_CHECKING.md

9.5.1 Pre-commit Type Checking

9.5.1.1 Husky pre-commit hooks setup ✅ (see SETUP_TYPE_CHECKING.md)

9.5.1.2 Type-check command integration (pnpm type-check)

9.5.1.3 ESLint integration in pre-commit

9.5.1.4 Prettier auto-formatting in pre-commit

9.5.1.5 Import validation in pre-commit

9.5.1.6 Pre-push test execution 🟢 P0

Status: ✅ Pre-commit hooks operational, pre-push tests pending

9.5.2 TypeScript Configuration

9.5.2.1 Strict mode enabled in tsconfig.json

9.5.2.2 noImplicitAny enabled

9.5.2.3 strictNullChecks enabled

9.5.2.4 Incremental compilation for performance

9.5.2.5 noUnusedLocals enforcement 🟡 P1

9.5.2.6 noUnusedParameters enforcement 🟡 P1

Status: ✅ Core strict mode configured

9.5.3 Common Deployment Error Prevention

9.5.3.1 Audit all component props for incomplete types 🟢 P0

9.5.3.2 Verify all status enum usages 🟢 P0

9.5.3.3 Fix stale import references 🟢 P0

Status: ⬜ Audit needed - Use DEPLOYMENT_ERRORS_ANALYSIS.md as checklist

9.5.4 Type Check Commands

# Full project type check

pnpm type-check

# Frontend only

cd apps/frontend && pnpm type-check

# Backend only

cd apps/backend && pnpm type-check

# Pre-commit simulation (all checks)

pnpm pre-commit

9.5.5 Deployment Checklist 🟢 P0

Before Every Commit

Run pnpm type-check - MUST pass (automated via pre-commit)

Verify all imports exist and are correct

Check for incomplete type definitions

Validate enum/status values against generated types

Test changed components locally

Before Every Deploy

All pre-commit hooks passed

No TypeScript errors in build log

Verify Vercel deployment preview builds successfully

Check for console errors in deployment preview

Common Pitfalls (from DEPLOYMENT_ERRORS_ANALYSIS.md):

❌ Mapping objects without all required properties → Use Omit<> or Partial<>

❌ Using wrong status literals → Check enum definitions

❌ Importing non-existent components → Verify paths

❌ Number vs String in forms → Use parseFloat() or validation

❌ Optional vs Required properties → Match interface definitions

Status: 🔄 Checklist defined, enforcement via automation (pre-commit hooks ✅)

10.0 Documentation & Deployment
10.1 Documentation Updates

10.1.1 API_REFERENCE.md (updated 2025-11-03)

10.1.2 SYSTEM_OVERVIEW.md (updated 2025-11-03)

10.1.3 PAGE_REFERENCE.md (updated 2025-11-03)

10.1.4 COMPONENT_REFERENCE.md (updated 2025-11-03)

10.1.5 DATABASE_SCHEMA.md (reviewed 2025-11-03)

10.1.6 MODULE_GUIDES (warehouse, production, planning, technical)

10.1.7 AI_QUICK_REFERENCE.md (updated 2025-11-03)

10.1.8 AI_CONTEXT_GUIDE.md (updated 2025-11-03)

10.1.9 Production Delta Guide 🟢 P0

10.1.10 Scanner Integration Guide 🟢 P0

10.1.11 User Manual 🟡 P1

Status: 🔄 ~80% complete - Core docs updated, guides pending

10.2 Seed Data

10.2.1 Update seed script with realistic data 🟢 P0

10.2.2 1:1 flags in BOM items

10.2.3 Reservations test data

10.2.4 Compositions test data

10.2.5 Cross-WO scenarios

10.2.6 Traceability chains

Status: ⬜ Not started

10.3 Supabase Deployment

10.3.1 Apply all migrations (001-009) 🟢 P0

10.3.2 Verify schema integrity 🟢 P0

10.3.3 Test RPC functions 🟢 P0

10.3.4 Verify RLS policies 🟢 P0

10.3.5 Multi-tenant smoke-test 🟢 P0

Status: ⬜ Not started

11.0 Future Enhancements
11.1 Advanced BOM Features (Phase 19)

11.1.1 Circular BOM reference detection 🟡 P1

11.1.2 Version format validation (regex)

11.1.3 Product type material validation

11.1.4 Max BOM depth limit

11.1.5 BOM comparison tool (visual diff)

11.1.6 BOM history viewer (timeline)

11.1.7 BOM approval workflow

11.1.8 Change reason tracking

Status: ⬜ Not started - Post-MVP

11.2 Work Order Enhancements (Phase 20)

11.2.1 WO snapshot update API

11.2.2 Snapshot preview with diff

11.2.3 Conflict detection

11.2.4 Snapshot update approval

11.2.5 Scanner validation rules table

11.2.6 Real-time validation feedback

11.2.7 Scanner error logging

11.2.8 PO prefill enhancement

Status: ⬜ Not started - Post-MVP

11.3 Advanced Production Features (Phase 21)

11.3.1 Multi-phase routing enhancements

11.3.2 Shelf-life policy (multi-tier)

11.3.3 Advanced traceability (LP tree viz)

11.3.4 Real-time monitoring (WebSocket)

11.3.5 Batch operations

11.3.6 Offline queue capability

11.3.7 Advanced QA workflows

Status: ⬜ Not started - Post-MVP

11.4 NPD / Idea Management (Tydz. 9-16)

11.4.1 /npd page and idea modal 🟡 P1

11.4.2 Idea → BOM draft linking

11.4.3 Status workflow (Idea → Dev → Review → Approved)

11.4.4 Role-based visibility (NPD/Technical/Finance)

11.4.5 Cost evaluation & BOM costing

11.4.6 Version management & cloning

11.4.7 Collaboration (comments, @mentions)

11.4.8 NPD Dashboard

Status: ⬜ Not started - Post-MVP (Tydz. 9-16)

11.5 Engineering / CMMS-lite (Tydz. 12-16)

11.5.1 Dual-mode tracking (NONE vs LP) 🟡 P1

11.5.2 Simple inventory balances (qty_quarantine)

11.5.3 Machine maintenance scheduling

11.5.4 Downtime tracking

11.5.5 Preventive maintenance

11.5.6 Spare parts management

Status: ⬜ Not started - Post-MVP (Tydz. 12-16)

11.6 Audit Trail System

11.6.1 audit_log table creation 🟡 P1

11.6.2 Triggers for audit logging

11.6.3 Change reason field (required for major changes)

11.6.4 Audit trail viewer UI (admin panel)

11.6.5 Audit log export to Excel

Status: ⬜ Not started - Post-MVP

11.7 Reporting & Analytics

11.7.1 Advanced KPIs (ML-based predictions) ⚪ P2

11.7.2 Trend analysis & forecasting

11.7.3 Cost analysis per operation

11.7.4 Quality metrics dashboard

11.7.5 Production efficiency reports

Status: ⬜ Not started - Future

Summary Statistics
Overall Progress by Module
Module Progress Status
1.0 Foundation ~85% 🔄 Core done, multi-tenant foundation done, org management pending
2.0 Technical ~95% ✅ Nearly complete
3.0 Planning ~77% 🔄 Core done, schema→UI gap (dates, currency)
4.0 Production ~50% 🔄 API done, UI incomplete (only tables)
5.0 Warehouse ~70% 🔄 Core done, ASN flow pending
6.0 Scanner ~60% 🔄 Core done, mobile UX pending
7.0 Quality ~45% 🔄 QA basics, NO trace visualization
8.0 Exports ~70% 🔄 Core exports done
9.0 Testing ~10% ⬜ Only auth tests exist
9.5 Type Safety ~80% ✅ Pre-commit hooks active, audit pending
10.0 Documentation ~85% 🔄 Core docs updated + type safety
11.0 Future ~0% ⬜ Post-MVP
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
