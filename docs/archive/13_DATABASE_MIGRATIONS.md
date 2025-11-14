# Dokumentacja Migracji Bazy Danych

Ten dokument zawiera szczegółowy opis wszystkich migracji w projekcie MonoPilot.

**Ostatnia aktualizacja**: 2025-01-11  
**Projekt Supabase**: pgroxddbtaevdegnidaz  
**Lokalizacja migracji**: `apps/frontend/lib/supabase/migrations/`

---

## 📋 Przegląd

System migracji MonoPilot składa się z **44 uporządkowanych migracji**:

- **1 migracja** dla typów ENUM (000)
- **38 migracji** dla tabel (001-037, 043)
- **1 migracja** dla foreign key constraints (038)
- **1 migracja** dla funkcji RPC (039)
- **1 migracja** dla polityk RLS (040)
- **1 migracja** dla triggerów (041)
- **1 migracja** dla danych seed (042)

---

## 🔢 Lista Migracji

### 000 - Typy ENUM

**Plik**: `000_enums.sql`  
**Cel**: Definicja niestandardowych typów ENUM  
**Zależności**: Brak

#### Typy ENUM:

- `product_group`: MEAT, DRYGOODS, COMPOSITE
- `product_type`: RM_MEAT, PR, FG, DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE
- `bom_status`: draft, active, archived

---

### 001-037 - Tabele Bazy Danych

#### Master Data (001-008)

| #   | Plik                         | Tabela               | Cel                       | Zależności |
| --- | ---------------------------- | -------------------- | ------------------------- | ---------- |
| 001 | `001_users.sql`              | `users`              | Zarządzanie użytkownikami | auth.users |
| 002 | `002_suppliers.sql`          | `suppliers`          | Dane dostawców            | -          |
| 003 | `003_warehouses.sql`         | `warehouses`         | Magazyny                  | -          |
| 004 | `004_locations.sql`          | `locations`          | Lokalizacje w magazynach  | 003        |
| 005 | `005_settings_tax_codes.sql` | `settings_tax_codes` | Kody podatkowe            | -          |
| 006 | `006_allergens.sql`          | `allergens`          | Alergeny                  | -          |
| 007 | `007_machines.sql`           | `machines`           | Maszyny produkcyjne       | 004        |
| 008 | `008_production_lines.sql`   | `production_lines`   | Linie produkcyjne         | 001, 003   |

#### Product Data (009-012)

| #   | Plik                  | Tabela        | Cel                                              | Zależności         |
| --- | --------------------- | ------------- | ------------------------------------------------ | ------------------ |
| 009 | `009_products.sql`    | `products`    | Produkty (materiały, półprodukty, wyroby gotowe) | 000, 001, 002, 005 |
| 010 | `010_boms.sql`        | `boms`        | Bill of Materials                                | 000, 009           |
| 011 | `011_bom_items.sql`   | `bom_items`   | Pozycje BOM                                      | 005, 009, 010      |
| 012 | `012_bom_history.sql` | `bom_history` | Historia zmian BOM                               | 001, 010           |

#### Routing Data (013-015)

| #   | Plik                              | Tabela                    | Cel                   | Zależności |
| --- | --------------------------------- | ------------------------- | --------------------- | ---------- |
| 013 | `013_routings.sql`                | `routings`                | Routy produkcyjne     | 001, 009   |
| 014 | `014_routing_operations.sql`      | `routing_operations`      | Operacje w routingu   | 007, 013   |
| 015 | `015_routing_operation_names.sql` | `routing_operation_names` | Słownik nazw operacji | 001        |

#### Planning Module - Purchase Orders (016-018)

| #   | Plik                    | Tabela          | Cel                            | Zależności    |
| --- | ----------------------- | --------------- | ------------------------------ | ------------- |
| 016 | `016_po_header.sql`     | `po_header`     | Nagłówek zamówienia zakupowego | 001, 002      |
| 017 | `017_po_line.sql`       | `po_line`       | Linie PO                       | 004, 009, 016 |
| 018 | `018_po_correction.sql` | `po_correction` | Korekty PO                     | 001, 016, 017 |

#### Planning Module - Transfer Orders (019-020)

| #   | Plik                | Tabela      | Cel                                               | Zależności |
| --- | ------------------- | ----------- | ------------------------------------------------- | ---------- |
| 019 | `019_to_header.sql` | `to_header` | Nagłówek zlecenia transferowego (magazyn→magazyn) | 001, 003   |
| 020 | `020_to_line.sql`   | `to_line`   | Linie TO (bez lokacji, tylko magazyny)            | 009, 019   |

#### Production Module (021-024)

| #   | Plik                         | Tabela               | Cel                             | Zależności         |
| --- | ---------------------------- | -------------------- | ------------------------------- | ------------------ |
| 021 | `021_work_orders.sql`        | `work_orders`        | Zlecenia produkcyjne            | 007, 008, 009, 010 |
| 022 | `022_wo_materials.sql`       | `wo_materials`       | Materiały dla WO (snapshot BOM) | 009, 021           |
| 023 | `023_wo_operations.sql`      | `wo_operations`      | Operacje w WO                   | 001, 014, 021      |
| 024 | `024_production_outputs.sql` | `production_outputs` | Wyjścia produkcyjne             | 009, 021           |

#### Warehouse Module - License Plates (025-028)

| #   | Plik                      | Tabela            | Cel                                 | Zależności    |
| --- | ------------------------- | ----------------- | ----------------------------------- | ------------- |
| 025 | `025_license_plates.sql`  | `license_plates`  | Jednostki magazynowe z traceability | 004, 009, 021 |
| 026 | `026_lp_reservations.sql` | `lp_reservations` | Rezerwacje LP dla WO                | 021, 025      |
| 027 | `027_lp_compositions.sql` | `lp_compositions` | Relacje wejście-wyjście LP          | 025           |
| 028 | `028_lp_genealogy.sql`    | `lp_genealogy`    | Genealogia LP (rodzic-dziecko)      | 021, 025      |

#### Warehouse Module - Pallets (029-030)

| #   | Plik                   | Tabela         | Cel                    | Zależności |
| --- | ---------------------- | -------------- | ---------------------- | ---------- |
| 029 | `029_pallets.sql`      | `pallets`      | Zarządzanie paletami   | 021        |
| 030 | `030_pallet_items.sql` | `pallet_items` | Przedmioty na paletach | 029        |

#### Warehouse Module - Goods Receipt (031-032)

| #   | Plik                | Tabela      | Cel                 | Zależności    |
| --- | ------------------- | ----------- | ------------------- | ------------- |
| 031 | `031_grns.sql`      | `grns`      | Goods Receipt Notes | 002, 016      |
| 032 | `032_grn_items.sql` | `grn_items` | Linie GRN           | 004, 009, 031 |

#### Warehouse Module - ASN (033-034)

| #   | Plik                | Tabela      | Cel                       | Zależności |
| --- | ------------------- | ----------- | ------------------------- | ---------- |
| 033 | `033_asns.sql`      | `asns`      | Advanced Shipping Notices | 002, 016   |
| 034 | `034_asn_items.sql` | `asn_items` | Linie ASN                 | 009, 033   |

#### Warehouse Module - Stock Moves (035)

| #   | Plik                  | Tabela        | Cel              | Zależności |
| --- | --------------------- | ------------- | ---------------- | ---------- |
| 035 | `035_stock_moves.sql` | `stock_moves` | Ruchy magazynowe | 004, 009   |

#### Junction Tables & System (036-037, 043)

| #   | Plik                         | Tabela               | Cel                                      | Zależności |
| --- | ---------------------------- | -------------------- | ---------------------------------------- | ---------- |
| 036 | `036_product_allergens.sql`  | `product_allergens`  | Relacje produkt-alergen                  | 006, 009   |
| 037 | `037_audit_log.sql`          | `audit_log`          | Log audytu systemu                       | 001        |
| 043 | `043_warehouse_settings.sql` | `warehouse_settings` | Ustawienia magazynów (default locations) | 003, 004   |

---

### 038 - Foreign Key Constraints

**Plik**: `038_foreign_keys.sql`  
**Cel**: Dodanie kluczy obcych, które nie mogły być dodane wcześniej ze względu na zależności cykliczne  
**Zależności**: Wszystkie tabele

#### Dodane constraints:

- `products.default_routing_id` → `routings.id`
- `boms.default_routing_id` → `routings.id`
- `to_line.lp_id` → `license_plates.id`

---

### 039 - RPC Functions

**Plik**: `039_rpc_functions.sql`  
**Cel**: Funkcje biznesowe dla złożonych operacji  
**Zależności**: Wszystkie tabele

#### Funkcje:

1. **`generate_to_number()`**
   - Generuje kolejny numer TO w formacie `TO-YYYY-NNN`
   - Używane przy tworzeniu nowych Transfer Orders

2. **`mark_to_shipped(p_to_id, p_ship_date, p_user_id)`**
   - Oznacza TO jako wysłane
   - Aktualizuje status na 'in_transit'
   - Rejestruje w audit_log

3. **`mark_to_received(p_to_id, p_receive_date, p_user_id)`**
   - Oznacza TO jako odebrane
   - Aktualizuje status na 'received'
   - Rejestruje w audit_log

4. **`quick_create_pos(p_product_entries, p_user_id, p_warehouse_id)`**
   - Szybkie tworzenie PO z kodów produktów
   - Automatyczne grupowanie po dostawcy i walucie
   - Agregacja ilości dla duplikatów
   - Kalkulacja sum netto/VAT/brutto
   - Weryfikacja uprawnień użytkownika

---

### 040 - RLS Policies

**Plik**: `040_rls_policies.sql`  
**Cel**: Polityki Row Level Security  
**Zależności**: Wszystkie tabele

#### Polityki:

- RLS włączone dla **wszystkich tabel** oprócz `routing_operation_names`
- Podstawowa polityka: pełny dostęp dla użytkowników `authenticated`
- Polityki mogą być rozszerzone o bardziej szczegółową kontrolę opartą na rolach

**Wyjątek**: `routing_operation_names` - tabela referencyjna bez RLS

---

### 041 - Triggers

**Plik**: `041_triggers.sql`  
**Cel**: Automatyczne aktualizacje i triggery  
**Zależności**: Wszystkie tabele

#### Funkcja:

- `update_updated_at_column()` - Automatycznie aktualizuje `updated_at` przy modyfikacji wiersza

#### Triggery `updated_at`:

Zastosowane dla wszystkich tabel z kolumną `updated_at`:

- users, suppliers, warehouses, locations, settings_tax_codes
- allergens, machines, production_lines
- products, boms, bom_items
- routings, routing_operations, routing_operation_names
- po_header, po_line
- to_header, to_line
- work_orders, license_plates
- grns, grn_items, asns
- product_allergens

---

### 042 - Seed Data

**Plik**: `042_seed_data.sql`  
**Cel**: Dane początkowe dla testowania i rozwoju  
**Zależności**: Wszystkie tabele

#### Dane seed:

1. **Tax Codes (3)**:
   - VAT_23 (23%)
   - VAT_8 (8%)
   - VAT_0 (0%)

2. **Allergens (3)**:
   - GLUTEN
   - SOYA
   - DAIRY

3. **Warehouses (3)**:
   - WH-001 (Main Warehouse)
   - WH-002 (Forza)
   - PROD-001 (Production Area)

4. **Locations (3)**:
   - DG-001, DG-002 (Dry Goods Zones)
   - PROD-001 (Production Floor)

5. **Suppliers (2)**:
   - BXS Supplier (PLN, Net 30)
   - Packaging Co (PLN, Net 15)

6. **Machines (3)**:
   - MIX-001 (Mixer 1)
   - PACK-001 (Packer 1)
   - GRIND-001 (Grinder 1)

7. **Production Lines (3)**:
   - LINE-4 (active)
   - LINE-5 (active)
   - LINE-6 (inactive)

8. **Routing Operation Names (8)**:
   - Mixing, Grinding, Forming, Cooking
   - Cooling, Packing, Quality Check, Labeling

---

### 043 - Warehouse Settings

**Plik**: `043_warehouse_settings.sql`  
**Cel**: Ustawienia magazynów - domyślne lokacje dla TO i PO  
**Zależności**: 003_warehouses, 004_locations

#### Pola:

- `warehouse_id` - ID magazynu (unique)
- `default_to_receive_location_id` - Domyślna lokacja dla odbioru Transfer Orders
- `default_po_receive_location_id` - Domyślna lokacja dla odbioru Purchase Orders
- `default_transit_location_id` - Lokacja/strefa Transit (opcjonalna wirtualna lokacja)

#### Flow Transfer Order:

1. **Planning**: Tworzy TO z magazynu DG-01 do DG-02 dla produktu A
2. **Picking**: Operator skanuje LP (np. LP-123) w magazynie źródłowym → status "shipped"
3. **Transit**: LP jest w stanie "transit" (sztuczna lokacja lub brak lokacji)
4. **Receiving**: Operator skanuje LP w magazynie docelowym → trafia na `default_to_receive_location_id`
5. **Putaway**: LP przenoszony na docelową lokację (np. B12) przez operację stock move

**Uwaga**: TO to transfer **między magazynami**, nie między lokacjami. Lokacje są przypisywane dopiero podczas receiving i putaway.

---

## 🔄 Kolejność Wykonania Migracji

Migracje muszą być wykonane w następującej kolejności:

```
000 (ENUMs)
  ↓
001-008 (Master Data)
  ↓
009-012 (Products & BOMs)
  ↓
013-015 (Routings)
  ↓
016-020 (Planning Module)
  ↓
021-024 (Production Module)
  ↓
025-028 (License Plates)
  ↓
029-030 (Pallets)
  ↓
031-035 (Warehouse Operations)
  ↓
036-037 (Junction & System)
  ↓
038 (Foreign Keys)
  ↓
039 (RPC Functions)
  ↓
040 (RLS Policies)
  ↓
041 (Triggers)
  ↓
042 (Seed Data)
  ↓
043 (Warehouse Settings)
```

---

## 📊 Zależności Między Tabelami

### Hierarchia zależności:

#### Poziom 1 - Bazowe (brak zależności):

- `users` (referencja do auth.users)
- `suppliers`
- `warehouses`
- `settings_tax_codes`
- `allergens`
- ENUMs

#### Poziom 2 - Zależne od Poziomu 1:

- `locations` (→ warehouses)
- `machines` (→ locations)
- `production_lines` (→ users, warehouses)

#### Poziom 3 - Produkty:

- `products` (→ users, suppliers, settings_tax_codes, ENUMs)

#### Poziom 4 - BOMs & Routings:

- `boms` (→ products, ENUMs)
- `bom_items` (→ boms, products, settings_tax_codes)
- `bom_history` (→ boms, users)
- `routings` (→ users, products)
- `routing_operations` (→ routings, machines)
- `routing_operation_names` (→ users)

#### Poziom 5 - Planning:

- `po_header` (→ suppliers, users)
- `po_line` (→ po_header, products, locations)
- `po_correction` (→ po_header, po_line, users)
- `to_header` (→ warehouses, users)
- `to_line` (→ to_header, products, locations)

#### Poziom 6 - Production:

- `work_orders` (→ products, boms, machines, production_lines)
- `wo_materials` (→ work_orders, products)
- `wo_operations` (→ work_orders, routing_operations, users)
- `production_outputs` (→ work_orders, products)

#### Poziom 7 - License Plates & Warehouse:

- `license_plates` (→ products, locations, work_orders)
- `lp_reservations` (→ license_plates, work_orders)
- `lp_compositions` (→ license_plates)
- `lp_genealogy` (→ license_plates, work_orders)
- `pallets` (→ work_orders)
- `pallet_items` (→ pallets)
- `grns` (→ po_header, suppliers)
- `grn_items` (→ grns, products, locations)
- `asns` (→ suppliers, po_header)
- `asn_items` (→ asns, products)
- `stock_moves` (→ products, locations)

#### Poziom 8 - Junction & System:

- `product_allergens` (→ products, allergens)
- `audit_log` (→ users)

---

## 🔧 Utrzymanie

### Dodawanie nowych migracji:

1. **Numeracja**: Kontynuuj od `043_xxx.sql`
2. **Nazewnictwo**: `{numer}_{opisowa_nazwa}.sql`
3. **Zawartość**:
   - Komentarz nagłówkowy z numerem, celem i datą
   - Sekcje z nagłówkami
   - Komentarze wyjaśniające
   - Sprawdzenie zależności

### Rollback:

Migracje są jednokierunkowe. W razie potrzeby rollbacku:

1. Użyj migracji `038_reset_drop_all_tables.sql` (jeśli istnieje w starych migracjach)
2. Wykonaj ponownie migracje 000-042

### Testowanie:

```bash
# Lokalne testowanie z Supabase CLI
supabase db reset

# Zastosuj migracje
supabase db push
```

---

## 📝 Notatki

- Wszystkie migracje używają **`TIMESTAMPTZ`** dla dat (timezone-aware)
- **RLS** jest włączone dla wszystkich tabel oprócz `routing_operation_names`
- **Triggery** `updated_at` działają automatycznie
- **Seed data** używa `ON CONFLICT DO NOTHING` dla idempotentności
- **Foreign keys** są dodawane na końcu (migracja 038) ze względu na zależności cykliczne
- **Transfer Orders** to transfer między magazynami (warehouse→warehouse), nie między lokacjami
- **Lokacje** dla TO są przypisywane dopiero podczas receiving (default_to_receive_location_id) i putaway
- **Transit** - LP w trakcie transferu może być w stanie "transit" lub na sztucznej lokacji transit

---

**Wygenerowano**: 2025-01-11  
**Źródło**: Reorganizacja migracji MonoPilot  
**Projekt**: MonoPilot ERP System
