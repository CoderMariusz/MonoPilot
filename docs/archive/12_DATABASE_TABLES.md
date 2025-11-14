# Dokumentacja Tabel Bazy Danych

Ten dokument zawiera szczegółowy opis wszystkich tabel w bazie danych MonoPilot.

**Ostatnia aktualizacja**: 2025-01-11  
**Projekt Supabase**: pgroxddbtaevdegnidaz  
**Schemat**: public

---

## 📊 Statystyki

- **Łączna liczba tabel**: 34
- **Tabele z RLS włączonym**: 33
- **Tabele bez RLS**: 1 (`routing_operation_names`)

---

## 📋 Spis Treści

1. [Master Data](#master-data)
2. [Planning Module](#planning-module)
3. [Production Module](#production-module)
4. [Warehouse Module](#warehouse-module)
5. [Technical Module](#technical-module)
6. [System Tables](#system-tables)

---

## Master Data

### `users`

**RLS**: ✅ Włączone | **Wiersze**: 1

Tabela użytkowników systemu.

| Kolumna      | Typ         | Nullable | Domyślna | Opis                                                                 |
| ------------ | ----------- | -------- | -------- | -------------------------------------------------------------------- |
| `id`         | uuid        | ❌       | -        | Klucz główny (powiązany z auth.users)                                |
| `name`       | text        | ❌       | -        | Imię i nazwisko                                                      |
| `email`      | text        | ❌       | -        | Email                                                                |
| `role`       | text        | ❌       | -        | Rola: Operator, Planner, Technical, Purchasing, Warehouse, QC, Admin |
| `status`     | text        | ❌       | 'Active' | Status: Active, Inactive                                             |
| `avatar_url` | text        | ✅       | -        | URL awatara                                                          |
| `phone`      | text        | ✅       | -        | Telefon                                                              |
| `department` | text        | ✅       | -        | Dział                                                                |
| `created_at` | timestamptz | ✅       | now()    | Data utworzenia                                                      |
| `updated_at` | timestamptz | ✅       | now()    | Data aktualizacji                                                    |
| `last_login` | timestamptz | ✅       | -        | Ostatnie logowanie                                                   |
| `created_by` | uuid        | ✅       | -        | Utworzony przez                                                      |
| `updated_by` | uuid        | ✅       | -        | Zaktualizowany przez                                                 |

**Klucz główny**: `id`

**Relacje**:

- Wiele tabel referencuje `users.id` jako `created_by`, `updated_by`, `approved_by`, `operator_id`

---

### `suppliers`

**RLS**: ✅ Włączone | **Wiersze**: 2

Dostawcy produktów.

| Kolumna               | Typ         | Nullable | Domyślna  | Opis                   |
| --------------------- | ----------- | -------- | --------- | ---------------------- |
| `id`                  | integer     | ❌       | nextval() | Klucz główny           |
| `name`                | varchar     | ❌       | -         | Nazwa                  |
| `legal_name`          | varchar     | ✅       | -         | Nazwa prawna           |
| `vat_number`          | varchar     | ✅       | -         | NIP/VAT                |
| `tax_number`          | varchar     | ✅       | -         | Numer podatkowy        |
| `country`             | varchar     | ✅       | -         | Kraj                   |
| `currency`            | varchar     | ✅       | 'USD'     | Waluta                 |
| `payment_terms`       | varchar     | ✅       | -         | Warunki płatności      |
| `incoterms`           | varchar     | ✅       | -         | Incoterms              |
| `email`               | varchar     | ✅       | -         | Email                  |
| `phone`               | varchar     | ✅       | -         | Telefon                |
| `address`             | jsonb       | ✅       | -         | Adres (JSON)           |
| `default_tax_code_id` | integer     | ✅       | -         | Domyślny kod podatkowy |
| `lead_time_days`      | integer     | ✅       | -         | Czas realizacji (dni)  |
| `notes`               | text        | ✅       | -         | Notatki                |
| `is_active`           | boolean     | ✅       | true      | Czy aktywny            |
| `created_at`          | timestamptz | ✅       | now()     | Data utworzenia        |
| `updated_at`          | timestamptz | ✅       | now()     | Data aktualizacji      |

**Klucz główny**: `id`

**Relacje**:

- `products.supplier_id` → `suppliers.id`
- `po_header.supplier_id` → `suppliers.id`
- `grns.supplier_id` → `suppliers.id`
- `asns.supplier_id` → `suppliers.id`

---

### `warehouses`

**RLS**: ✅ Włączone | **Wiersze**: 3

Magazyny.

| Kolumna      | Typ         | Nullable | Domyślna  | Opis              |
| ------------ | ----------- | -------- | --------- | ----------------- |
| `id`         | integer     | ❌       | nextval() | Klucz główny      |
| `code`       | varchar     | ❌       | -         | Kod (unikalny)    |
| `name`       | varchar     | ❌       | -         | Nazwa             |
| `is_active`  | boolean     | ✅       | true      | Czy aktywny       |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia   |
| `updated_at` | timestamptz | ✅       | now()     | Data aktualizacji |

**Klucz główny**: `id`

**Relacje**:

- `locations.warehouse_id` → `warehouses.id`
- `to_header.from_wh_id` / `to_wh_id` → `warehouses.id`
- `production_lines.warehouse_id` → `warehouses.id`
- `warehouse_settings.warehouse_id` → `warehouses.id`

---

### `warehouse_settings`

**RLS**: ✅ Włączone | **Wiersze**: 0

Ustawienia magazynów - domyślne lokacje dla odbiorów TO i PO.

| Kolumna                          | Typ         | Nullable | Domyślna  | Opis                                                   |
| -------------------------------- | ----------- | -------- | --------- | ------------------------------------------------------ |
| `id`                             | integer     | ❌       | nextval() | Klucz główny                                           |
| `warehouse_id`                   | integer     | ❌       | -         | Magazyn (unique)                                       |
| `default_to_receive_location_id` | integer     | ✅       | -         | Domyślna lokacja dla odbioru Transfer Orders           |
| `default_po_receive_location_id` | integer     | ✅       | -         | Domyślna lokacja dla odbioru Purchase Orders           |
| `default_transit_location_id`    | integer     | ✅       | -         | Lokacja Transit (opcjonalna) dla towarów w transporcie |
| `notes`                          | text        | ✅       | -         | Notatki                                                |
| `created_at`                     | timestamptz | ✅       | now()     | Data utworzenia                                        |
| `updated_at`                     | timestamptz | ✅       | now()     | Data aktualizacji                                      |

**Klucz główny**: `id`

**Relacje**:

- `warehouse_settings.warehouse_id` → `warehouses.id` (UNIQUE)
- `warehouse_settings.default_to_receive_location_id` → `locations.id`
- `warehouse_settings.default_po_receive_location_id` → `locations.id`
- `warehouse_settings.default_transit_location_id` → `locations.id`

**Flow**:

1. Przy tworzeniu TO - wybierasz magazyn źródłowy i docelowy
2. Przy shipping TO - operator skanuje LP, zmienia status na "in_transit"
3. Przy receiving TO - operator skanuje LP w magazynie docelowym, LP trafia na `default_to_receive_location_id`
4. Putaway - LP przenoszony ręcznie na docelową lokację (np. B12)

---

### `locations`

**RLS**: ✅ Włączone | **Wiersze**: 3

Lokalizacje w magazynach.

| Kolumna        | Typ         | Nullable | Domyślna  | Opis              |
| -------------- | ----------- | -------- | --------- | ----------------- |
| `id`           | integer     | ❌       | nextval() | Klucz główny      |
| `warehouse_id` | integer     | ✅       | -         | Magazyn           |
| `code`         | varchar     | ❌       | -         | Kod (unikalny)    |
| `name`         | varchar     | ❌       | -         | Nazwa             |
| `type`         | varchar     | ✅       | -         | Typ lokalizacji   |
| `is_active`    | boolean     | ✅       | true      | Czy aktywna       |
| `created_at`   | timestamptz | ✅       | now()     | Data utworzenia   |
| `updated_at`   | timestamptz | ✅       | now()     | Data aktualizacji |

**Klucz główny**: `id`

**Relacje**:

- `license_plates.location_id` → `locations.id`
- `stock_moves.from_location_id` / `to_location_id` → `locations.id`
- `grn_items.location_id` → `locations.id`
- `po_line.default_location_id` → `locations.id`
- `to_line.from_location_id` / `to_location_id` → `locations.id`
- `machines.location_id` → `locations.id`

---

### `products`

**RLS**: ✅ Włączone | **Wiersze**: 11

Produkty (materiały, półprodukty, wyroby gotowe).

| Kolumna              | Typ           | Nullable | Domyślna    | Opis                             |
| -------------------- | ------------- | -------- | ----------- | -------------------------------- |
| `id`                 | integer       | ❌       | nextval()   | Klucz główny                     |
| `part_number`        | varchar       | ❌       | -           | Numer części (unikalny)          |
| `description`        | text          | ❌       | -           | Opis                             |
| `type`               | varchar       | ❌       | -           | Typ: RM, DG, PR, FG, WIP         |
| `subtype`            | varchar       | ✅       | -           | Podtyp                           |
| `uom`                | varchar       | ❌       | -           | Jednostka miary                  |
| `expiry_policy`      | varchar       | ✅       | -           | Polityka ważności                |
| `shelf_life_days`    | integer       | ✅       | -           | Okres przydatności (dni)         |
| `production_lines`   | text[]        | ✅       | -           | Linie produkcyjne                |
| `is_active`          | boolean       | ✅       | true        | Czy aktywny                      |
| `product_group`      | product_group | ❌       | 'COMPOSITE' | Grupa: MEAT, DRYGOODS, COMPOSITE |
| `product_type`       | product_type  | ❌       | 'FG'        | Typ: RM*MEAT, PR, FG, DG*\*      |
| `tax_code_id`        | integer       | ✅       | -           | Kod podatkowy                    |
| `lead_time_days`     | integer       | ✅       | -           | Czas realizacji (dni)            |
| `moq`                | numeric       | ✅       | -           | Minimalna ilość zamówienia       |
| `std_price`          | numeric       | ✅       | -           | Cena standardowa                 |
| `requires_routing`   | boolean       | ✅       | false       | Wymaga routingu                  |
| `default_routing_id` | integer       | ✅       | -           | Domyślny routing                 |
| `notes`              | text          | ✅       | -           | Notatki                          |
| `allergen_ids`       | integer[]     | ✅       | -           | ID alergenów                     |
| `created_at`         | timestamptz   | ✅       | now()       | Data utworzenia                  |
| `updated_at`         | timestamptz   | ✅       | now()       | Data aktualizacji                |
| `created_by`         | uuid          | ✅       | -           | Utworzony przez                  |
| `updated_by`         | uuid          | ✅       | -           | Zaktualizowany przez             |
| `boxes_per_pallet`   | integer       | ✅       | -           | Pudełek na palecie               |
| `packs_per_box`      | integer       | ✅       | -           | Opakowań w pudełku               |
| `supplier_id`        | integer       | ✅       | -           | Dostawca                         |
| `product_version`    | varchar       | ✅       | '1.0'       | Wersja produktu (X.Y)            |

**Klucz główny**: `id`

**Relacje**:

- Wiele tabel referencuje `products.id` jako `product_id`, `material_id`, `item_id`

---

### `settings_tax_codes`

**RLS**: ✅ Włączone | **Wiersze**: 3

Kody podatkowe (VAT).

| Kolumna      | Typ         | Nullable | Domyślna  | Opis              |
| ------------ | ----------- | -------- | --------- | ----------------- |
| `id`         | integer     | ❌       | nextval() | Klucz główny      |
| `code`       | varchar     | ❌       | -         | Kod (unikalny)    |
| `name`       | varchar     | ❌       | -         | Nazwa             |
| `rate`       | numeric     | ❌       | -         | Stawka (%)        |
| `is_active`  | boolean     | ✅       | true      | Czy aktywny       |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia   |
| `updated_at` | timestamptz | ✅       | now()     | Data aktualizacji |

**Klucz główny**: `id`

**Relacje**:

- `products.tax_code_id` → `settings_tax_codes.id`
- `bom_items.tax_code_id` → `settings_tax_codes.id`

---

### `allergens`

**RLS**: ✅ Włączone | **Wiersze**: 3

Alergeny.

| Kolumna       | Typ         | Nullable | Domyślna  | Opis              |
| ------------- | ----------- | -------- | --------- | ----------------- |
| `id`          | integer     | ❌       | nextval() | Klucz główny      |
| `code`        | varchar     | ❌       | -         | Kod (unikalny)    |
| `name`        | varchar     | ❌       | -         | Nazwa             |
| `description` | text        | ✅       | -         | Opis              |
| `icon`        | varchar     | ✅       | -         | Ikona             |
| `is_active`   | boolean     | ✅       | true      | Czy aktywny       |
| `created_at`  | timestamptz | ✅       | now()     | Data utworzenia   |
| `updated_at`  | timestamptz | ✅       | now()     | Data aktualizacji |

**Klucz główny**: `id`

**Relacje**:

- `product_allergens.allergen_id` → `allergens.id`

---

### `machines`

**RLS**: ✅ Włączone | **Wiersze**: 3

Maszyny produkcyjne.

| Kolumna       | Typ         | Nullable | Domyślna  | Opis              |
| ------------- | ----------- | -------- | --------- | ----------------- |
| `id`          | integer     | ❌       | nextval() | Klucz główny      |
| `name`        | varchar     | ❌       | -         | Nazwa             |
| `code`        | varchar     | ❌       | -         | Kod (unikalny)    |
| `type`        | varchar     | ✅       | -         | Typ maszyny       |
| `location_id` | integer     | ✅       | -         | Lokalizacja       |
| `is_active`   | boolean     | ✅       | true      | Czy aktywna       |
| `created_at`  | timestamptz | ✅       | now()     | Data utworzenia   |
| `updated_at`  | timestamptz | ✅       | now()     | Data aktualizacji |

**Klucz główny**: `id`

**Relacje**:

- `routing_operations.machine_id` → `machines.id`
- `work_orders.machine_id` → `machines.id`

---

### `production_lines`

**RLS**: ✅ Włączone | **Wiersze**: 3

Linie produkcyjne.

| Kolumna        | Typ         | Nullable | Domyślna  | Opis                       |
| -------------- | ----------- | -------- | --------- | -------------------------- |
| `id`           | integer     | ❌       | nextval() | Klucz główny               |
| `code`         | varchar     | ❌       | -         | Kod (unikalny, np. LINE-4) |
| `name`         | varchar     | ❌       | -         | Nazwa                      |
| `status`       | varchar     | ✅       | 'active'  | Status: active, inactive   |
| `warehouse_id` | integer     | ✅       | -         | Magazyn                    |
| `is_active`    | boolean     | ✅       | true      | Czy aktywna                |
| `created_at`   | timestamptz | ✅       | now()     | Data utworzenia            |
| `updated_at`   | timestamptz | ✅       | now()     | Data aktualizacji          |
| `created_by`   | uuid        | ✅       | -         | Utworzona przez            |
| `updated_by`   | uuid        | ✅       | -         | Zaktualizowana przez       |

**Klucz główny**: `id`

**Relacje**:

- `work_orders.line_id` → `production_lines.id`

---

## Planning Module

### `po_header`

**RLS**: ✅ Włączone | **Wiersze**: 3

Nagłówek zamówienia zakupowego (Purchase Order).

| Kolumna                     | Typ         | Nullable | Domyślna  | Opis                            |
| --------------------------- | ----------- | -------- | --------- | ------------------------------- |
| `id`                        | integer     | ❌       | nextval() | Klucz główny                    |
| `number`                    | varchar     | ❌       | -         | Numer PO (unikalny)             |
| `supplier_id`               | integer     | ✅       | -         | Dostawca                        |
| `status`                    | varchar     | ❌       | -         | Status: draft, approved, closed |
| `currency`                  | varchar     | ✅       | 'USD'     | Waluta                          |
| `exchange_rate`             | numeric     | ✅       | -         | Kurs wymiany                    |
| `order_date`                | timestamptz | ❌       | -         | Data zamówienia                 |
| `requested_delivery_date`   | timestamptz | ✅       | -         | Żądana data dostawy             |
| `promised_delivery_date`    | timestamptz | ✅       | -         | Obiecana data dostawy           |
| `snapshot_supplier_name`    | varchar     | ✅       | -         | Snapshot nazwy dostawcy         |
| `snapshot_supplier_vat`     | varchar     | ✅       | -         | Snapshot VAT dostawcy           |
| `snapshot_supplier_address` | text        | ✅       | -         | Snapshot adresu                 |
| `asn_ref`                   | varchar     | ✅       | -         | Referencja ASN                  |
| `net_total`                 | numeric     | ✅       | -         | Wartość netto                   |
| `vat_total`                 | numeric     | ✅       | -         | Wartość VAT                     |
| `gross_total`               | numeric     | ✅       | -         | Wartość brutto                  |
| `created_by`                | uuid        | ✅       | -         | Utworzony przez                 |
| `approved_by`               | uuid        | ✅       | -         | Zatwierdzony przez              |
| `created_at`                | timestamptz | ✅       | now()     | Data utworzenia                 |
| `updated_at`                | timestamptz | ✅       | now()     | Data aktualizacji               |
| `payment_due_date`          | timestamptz | ✅       | -         | Termin płatności (np. Net 30)   |
| `warehouse_id`              | integer     | ✅       | -         | Magazyn docelowy                |

**Klucz główny**: `id`

**Relacje**:

- `po_line.po_id` → `po_header.id`
- `grns.po_id` → `po_header.id`
- `asns.po_id` → `po_header.id`
- `po_correction.po_id` → `po_header.id`

---

### `po_line`

**RLS**: ✅ Włączone | **Wiersze**: 4

Linie zamówienia zakupowego.

| Kolumna                   | Typ         | Nullable | Domyślna  | Opis                  |
| ------------------------- | ----------- | -------- | --------- | --------------------- |
| `id`                      | integer     | ❌       | nextval() | Klucz główny          |
| `po_id`                   | integer     | ✅       | -         | Nagłówek PO           |
| `line_no`                 | integer     | ❌       | -         | Numer linii           |
| `item_id`                 | integer     | ✅       | -         | Produkt               |
| `uom`                     | varchar     | ❌       | -         | Jednostka miary       |
| `qty_ordered`             | numeric     | ❌       | -         | Ilość zamówiona       |
| `qty_received`            | numeric     | ✅       | 0         | Ilość otrzymana       |
| `unit_price`              | numeric     | ❌       | -         | Cena jednostkowa      |
| `vat_rate`                | numeric     | ✅       | 0         | Stawka VAT            |
| `requested_delivery_date` | timestamptz | ✅       | -         | Żądana data dostawy   |
| `promised_delivery_date`  | timestamptz | ✅       | -         | Obiecana data dostawy |
| `default_location_id`     | integer     | ✅       | -         | Domyślna lokalizacja  |
| `note`                    | text        | ✅       | -         | Notatka               |
| `created_at`              | timestamptz | ✅       | now()     | Data utworzenia       |
| `updated_at`              | timestamptz | ✅       | now()     | Data aktualizacji     |

**Klucz główny**: `id`

**Relacje**:

- `po_correction.po_line_id` → `po_line.id`

---

### `po_correction`

**RLS**: ✅ Włączone | **Wiersze**: 0

Korekty zamówień zakupowych.

| Kolumna        | Typ         | Nullable | Domyślna  | Opis            |
| -------------- | ----------- | -------- | --------- | --------------- |
| `id`           | integer     | ❌       | nextval() | Klucz główny    |
| `po_id`        | integer     | ✅       | -         | Nagłówek PO     |
| `po_line_id`   | integer     | ✅       | -         | Linia PO        |
| `reason`       | text        | ❌       | -         | Powód korekty   |
| `delta_amount` | numeric     | ❌       | -         | Różnica kwoty   |
| `created_by`   | uuid        | ✅       | -         | Utworzony przez |
| `created_at`   | timestamptz | ✅       | now()     | Data utworzenia |

**Klucz główny**: `id`

---

### `to_header`

**RLS**: ✅ Włączone | **Wiersze**: 1

Nagłówek zlecenia transferowego (Transfer Order).

| Kolumna                | Typ         | Nullable | Domyślna  | Opis                                                              |
| ---------------------- | ----------- | -------- | --------- | ----------------------------------------------------------------- |
| `id`                   | integer     | ❌       | nextval() | Klucz główny                                                      |
| `number`               | varchar     | ❌       | -         | Numer TO (unikalny)                                               |
| `status`               | varchar     | ❌       | -         | Status: draft, submitted, in_transit, received, closed, cancelled |
| `from_wh_id`           | integer     | ✅       | -         | Magazyn źródłowy                                                  |
| `to_wh_id`             | integer     | ✅       | -         | Magazyn docelowy                                                  |
| `requested_date`       | timestamptz | ✅       | -         | Data żądana                                                       |
| `created_by`           | uuid        | ✅       | -         | Utworzony przez                                                   |
| `approved_by`          | uuid        | ✅       | -         | Zatwierdzony przez                                                |
| `created_at`           | timestamptz | ✅       | now()     | Data utworzenia                                                   |
| `updated_at`           | timestamptz | ✅       | now()     | Data aktualizacji                                                 |
| `planned_ship_date`    | timestamptz | ✅       | -         | Planowana data wysyłki                                            |
| `actual_ship_date`     | timestamptz | ✅       | -         | Rzeczywista data wysyłki                                          |
| `planned_receive_date` | timestamptz | ✅       | -         | Planowana data odbioru                                            |
| `actual_receive_date`  | timestamptz | ✅       | -         | Rzeczywista data odbioru                                          |

**Klucz główny**: `id`

**Relacje**:

- `to_line.to_id` → `to_header.id`

---

### `to_line`

**RLS**: ✅ Włączone | **Wiersze**: 2

Linie zlecenia transferowego (transfer między magazynami, nie między lokacjami).

| Kolumna        | Typ         | Nullable | Domyślna  | Opis                                      |
| -------------- | ----------- | -------- | --------- | ----------------------------------------- |
| `id`           | integer     | ❌       | nextval() | Klucz główny                              |
| `to_id`        | integer     | ✅       | -         | Nagłówek TO                               |
| `line_no`      | integer     | ❌       | -         | Numer linii                               |
| `item_id`      | integer     | ✅       | -         | Produkt                                   |
| `uom`          | varchar     | ❌       | -         | Jednostka miary                           |
| `qty_planned`  | numeric     | ❌       | -         | Ilość planowana                           |
| `qty_shipped`  | numeric     | ✅       | 0         | Ilość wysłana z magazynu źródłowego       |
| `qty_received` | numeric     | ✅       | 0         | Ilość odebrana w magazynie docelowym      |
| `lp_id`        | integer     | ✅       | -         | License Plate skanowany podczas transferu |
| `batch`        | varchar     | ✅       | -         | Numer batch/lot                           |
| `notes`        | text        | ✅       | -         | Notatki                                   |
| `created_at`   | timestamptz | ✅       | now()     | Data utworzenia                           |
| `updated_at`   | timestamptz | ✅       | now()     | Data aktualizacji                         |

**Klucz główny**: `id`

**Relacje**:

- `to_line.to_id` → `to_header.id`
- `to_line.item_id` → `products.id`
- `to_line.lp_id` → `license_plates.id`

**⚠️ Uwaga**: TO to transfer **między magazynami** (np. DG-01 → DG-02), nie między lokacjami. Lokacje są przypisywane dopiero podczas receiving (→ default_to_receive_location_id z warehouse_settings) i putaway.

---

## Production Module

### `work_orders`

**RLS**: ✅ Włączone | **Wiersze**: 0

Zlecenia produkcyjne (Work Orders).

| Kolumna              | Typ         | Nullable | Domyślna  | Opis                       |
| -------------------- | ----------- | -------- | --------- | -------------------------- |
| `id`                 | integer     | ❌       | nextval() | Klucz główny               |
| `wo_number`          | varchar     | ❌       | -         | Numer WO (unikalny)        |
| `product_id`         | integer     | ✅       | -         | Produkt                    |
| `bom_id`             | integer     | ✅       | -         | BOM                        |
| `quantity`           | numeric     | ❌       | -         | Ilość                      |
| `uom`                | varchar     | ❌       | -         | Jednostka miary            |
| `priority`           | integer     | ✅       | 3         | Priorytet                  |
| `status`             | varchar     | ❌       | -         | Status                     |
| `scheduled_start`    | timestamptz | ✅       | -         | Planowany start            |
| `scheduled_end`      | timestamptz | ✅       | -         | Planowany koniec           |
| `actual_start`       | timestamptz | ✅       | -         | Rzeczywisty start          |
| `actual_end`         | timestamptz | ✅       | -         | Rzeczywisty koniec         |
| `machine_id`         | integer     | ✅       | -         | Maszyna                    |
| `source_demand_type` | varchar     | ✅       | -         | Typ źródła zapotrzebowania |
| `source_demand_id`   | integer     | ✅       | -         | ID źródła                  |
| `created_by`         | integer     | ✅       | -         | Utworzony przez            |
| `approved_by`        | integer     | ✅       | -         | Zatwierdzony przez         |
| `created_at`         | timestamptz | ✅       | now()     | Data utworzenia            |
| `updated_at`         | timestamptz | ✅       | now()     | Data aktualizacji          |
| `line_id`            | integer     | ❌       | -         | Linia produkcyjna          |

**Klucz główny**: `id`

**Relacje**:

- `wo_materials.wo_id` → `work_orders.id`
- `wo_operations.wo_id` → `work_orders.id`
- `production_outputs.wo_id` → `work_orders.id`
- `license_plates.consumed_by_wo_id` → `work_orders.id`
- `lp_reservations.wo_id` → `work_orders.id`
- `lp_genealogy.wo_id` → `work_orders.id`
- `pallets.wo_id` → `work_orders.id`

---

### `wo_materials`

**RLS**: ✅ Włączone | **Wiersze**: 0

Materiały dla zleceń produkcyjnych.

| Kolumna                        | Typ         | Nullable | Domyślna  | Opis                              |
| ------------------------------ | ----------- | -------- | --------- | --------------------------------- |
| `id`                           | integer     | ❌       | nextval() | Klucz główny                      |
| `wo_id`                        | integer     | ✅       | -         | Zlecenie produkcyjne              |
| `material_id`                  | integer     | ✅       | -         | Materiał                          |
| `qty_per_unit`                 | numeric     | ❌       | -         | Ilość na jednostkę                |
| `total_qty_needed`             | numeric     | ❌       | -         | Całkowita ilość potrzebna         |
| `uom`                          | varchar     | ❌       | -         | Jednostka: KG, EACH, METER, LITER |
| `production_line_restrictions` | text[]      | ✅       | '{}'      | Ograniczenia linii                |
| `consume_whole_lp`             | boolean     | ✅       | false     | Zasada 1:1 konsumpcji LP          |
| `created_at`                   | timestamptz | ✅       | now()     | Data utworzenia                   |

**Klucz główny**: `id`

---

### `wo_operations`

**RLS**: ✅ Włączone | **Wiersze**: 0

Operacje w zleceniach produkcyjnych.

| Kolumna                | Typ         | Nullable | Domyślna  | Opis                                             |
| ---------------------- | ----------- | -------- | --------- | ------------------------------------------------ |
| `id`                   | integer     | ❌       | nextval() | Klucz główny                                     |
| `wo_id`                | integer     | ❌       | -         | Zlecenie produkcyjne                             |
| `routing_operation_id` | integer     | ✅       | -         | Operacja routingu                                |
| `seq_no`               | integer     | ❌       | -         | Numer sekwencji                                  |
| `status`               | varchar     | ✅       | 'PENDING' | Status: PENDING, IN_PROGRESS, COMPLETED, SKIPPED |
| `operator_id`          | uuid        | ✅       | -         | Operator                                         |
| `device_id`            | integer     | ✅       | -         | Urządzenie                                       |
| `started_at`           | timestamptz | ✅       | -         | Rozpoczęto                                       |
| `finished_at`          | timestamptz | ✅       | -         | Zakończono                                       |
| `created_at`           | timestamptz | ✅       | now()     | Data utworzenia                                  |

**Klucz główny**: `id`

---

### `production_outputs`

**RLS**: ✅ Włączone | **Wiersze**: 0

Wyjścia produkcyjne.

| Kolumna      | Typ         | Nullable | Domyślna  | Opis                  |
| ------------ | ----------- | -------- | --------- | --------------------- |
| `id`         | integer     | ❌       | nextval() | Klucz główny          |
| `wo_id`      | integer     | ❌       | -         | Zlecenie produkcyjne  |
| `product_id` | integer     | ❌       | -         | Produkt               |
| `quantity`   | numeric     | ❌       | -         | Ilość                 |
| `uom`        | varchar     | ❌       | -         | Jednostka miary       |
| `lp_id`      | integer     | ✅       | -         | Tablica rejestracyjna |
| `created_by` | integer     | ✅       | -         | Utworzony przez       |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia       |

**Klucz główny**: `id`

---

## Warehouse Module

### `license_plates`

**RLS**: ✅ Włączone | **Wiersze**: 0

Tablice rejestracyjne (License Plates) - jednostki magazynowe.

| Kolumna             | Typ         | Nullable | Domyślna    | Opis                              |
| ------------------- | ----------- | -------- | ----------- | --------------------------------- |
| `id`                | integer     | ❌       | nextval()   | Klucz główny                      |
| `lp_number`         | varchar     | ❌       | -           | Numer LP (unikalny)               |
| `product_id`        | integer     | ✅       | -           | Produkt                           |
| `quantity`          | numeric     | ❌       | -           | Ilość                             |
| `uom`               | varchar     | ❌       | -           | Jednostka: KG, EACH, METER, LITER |
| `location_id`       | integer     | ✅       | -           | Lokalizacja                       |
| `status`            | varchar     | ✅       | 'available' | Status                            |
| `qa_status`         | varchar     | ✅       | 'pending'   | Status QA                         |
| `stage_suffix`      | varchar     | ✅       | -           | Sufiks etapu (2 litery)           |
| `batch_number`      | varchar     | ✅       | -           | Numer partii                      |
| `lp_type`           | varchar     | ✅       | -           | Typ: PR, FG, PALLET               |
| `consumed_by_wo_id` | integer     | ✅       | -           | Skonsumowane przez WO             |
| `consumed_at`       | timestamptz | ✅       | -           | Data konsumpcji                   |
| `parent_lp_id`      | integer     | ✅       | -           | Rodzic LP                         |
| `parent_lp_number`  | varchar     | ✅       | -           | Numer rodzica                     |
| `origin_type`       | varchar     | ✅       | -           | Typ pochodzenia                   |
| `origin_ref`        | jsonb       | ✅       | -           | Referencja pochodzenia            |
| `created_by`        | varchar     | ✅       | -           | Utworzony przez                   |
| `created_at`        | timestamptz | ✅       | now()       | Data utworzenia                   |
| `updated_at`        | timestamptz | ✅       | now()       | Data aktualizacji                 |

**Klucz główny**: `id`

**Relacje**:

- `lp_reservations.lp_id` → `license_plates.id`
- `lp_compositions.input_lp_id` / `output_lp_id` → `license_plates.id`
- `lp_genealogy.parent_lp_id` / `child_lp_id` → `license_plates.id`
- `to_line.lp_id` → `license_plates.id`

---

### `lp_reservations`

**RLS**: ✅ Włączone | **Wiersze**: 0

Rezerwacje tablic rejestracyjnych.

| Kolumna      | Typ         | Nullable | Domyślna  | Opis                                         |
| ------------ | ----------- | -------- | --------- | -------------------------------------------- |
| `id`         | integer     | ❌       | nextval() | Klucz główny                                 |
| `lp_id`      | integer     | ❌       | -         | Tablica rejestracyjna                        |
| `wo_id`      | integer     | ❌       | -         | Zlecenie produkcyjne                         |
| `qty`        | numeric     | ❌       | -         | Ilość (qty > 0)                              |
| `status`     | varchar     | ✅       | 'active'  | Status: active, consumed, expired, cancelled |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia                              |
| `expires_at` | timestamptz | ✅       | -         | Data wygaśnięcia                             |
| `created_by` | varchar     | ✅       | -         | Utworzony przez                              |

**Klucz główny**: `id`

---

### `lp_compositions`

**RLS**: ✅ Włączone | **Wiersze**: 0

Kompozycje tablic rejestracyjnych (wejścia/wyjścia).

| Kolumna        | Typ         | Nullable | Domyślna  | Opis               |
| -------------- | ----------- | -------- | --------- | ------------------ |
| `id`           | integer     | ❌       | nextval() | Klucz główny       |
| `output_lp_id` | integer     | ❌       | -         | Wyjściowa LP       |
| `input_lp_id`  | integer     | ❌       | -         | Wejściowa LP       |
| `qty`          | numeric     | ❌       | -         | Ilość              |
| `uom`          | varchar     | ❌       | -         | Jednostka miary    |
| `op_seq`       | integer     | ✅       | -         | Sekwencja operacji |
| `created_at`   | timestamptz | ✅       | now()     | Data utworzenia    |

**Klucz główny**: `id`

---

### `lp_genealogy`

**RLS**: ✅ Włączone | **Wiersze**: 0

Genealogia tablic rejestracyjnych (relacje rodzic-dziecko).

| Kolumna              | Typ         | Nullable | Domyślna  | Opis                 |
| -------------------- | ----------- | -------- | --------- | -------------------- |
| `id`                 | integer     | ❌       | nextval() | Klucz główny         |
| `child_lp_id`        | integer     | ❌       | -         | Dziecko LP           |
| `parent_lp_id`       | integer     | ✅       | -         | Rodzic LP            |
| `quantity_consumed`  | numeric     | ❌       | -         | Ilość skonsumowana   |
| `uom`                | varchar     | ❌       | -         | Jednostka miary      |
| `wo_id`              | integer     | ✅       | -         | Zlecenie produkcyjne |
| `operation_sequence` | integer     | ✅       | -         | Sekwencja operacji   |
| `created_at`         | timestamptz | ✅       | now()     | Data utworzenia      |

**Klucz główny**: `id`

---

### `pallets`

**RLS**: ✅ Włączone | **Wiersze**: 0

Palety.

| Kolumna        | Typ         | Nullable | Domyślna  | Opis                       |
| -------------- | ----------- | -------- | --------- | -------------------------- |
| `id`           | integer     | ❌       | nextval() | Klucz główny               |
| `wo_id`        | integer     | ❌       | -         | Zlecenie produkcyjne       |
| `line`         | varchar     | ✅       | -         | Linia                      |
| `code`         | varchar     | ❌       | -         | Kod (unikalny)             |
| `target_boxes` | integer     | ✅       | -         | Docelowa liczba pudełek    |
| `actual_boxes` | integer     | ✅       | -         | Rzeczywista liczba pudełek |
| `created_at`   | timestamptz | ✅       | now()     | Data utworzenia            |
| `created_by`   | varchar     | ✅       | -         | Utworzony przez            |

**Klucz główny**: `id`

**Relacje**:

- `pallet_items.pallet_id` → `pallets.id`

---

### `pallet_items`

**RLS**: ✅ Włączone | **Wiersze**: 0

Przedmioty na palecie.

| Kolumna             | Typ         | Nullable | Domyślna  | Opis                      |
| ------------------- | ----------- | -------- | --------- | ------------------------- |
| `id`                | integer     | ❌       | nextval() | Klucz główny              |
| `pallet_id`         | integer     | ❌       | -         | Paleta                    |
| `box_count`         | numeric     | ❌       | -         | Liczba pudełek            |
| `material_snapshot` | jsonb       | ✅       | -         | Snapshot materiału (JSON) |
| `sequence`          | integer     | ✅       | -         | Sekwencja                 |
| `created_at`        | timestamptz | ✅       | now()     | Data utworzenia           |

**Klucz główny**: `id`

---

### `grns`

**RLS**: ✅ Włączone | **Wiersze**: 0

Goods Receipt Notes (GRN) - przyjęcia towaru.

| Kolumna         | Typ         | Nullable | Domyślna  | Opis                 |
| --------------- | ----------- | -------- | --------- | -------------------- |
| `id`            | integer     | ❌       | nextval() | Klucz główny         |
| `grn_number`    | varchar     | ❌       | -         | Numer GRN (unikalny) |
| `po_id`         | integer     | ✅       | -         | Zamówienie zakupowe  |
| `status`        | varchar     | ❌       | -         | Status               |
| `received_date` | timestamptz | ❌       | -         | Data przyjęcia       |
| `received_by`   | integer     | ✅       | -         | Przyjęty przez       |
| `supplier_id`   | integer     | ✅       | -         | Dostawca             |
| `notes`         | text        | ✅       | -         | Notatki              |
| `created_at`    | timestamptz | ✅       | now()     | Data utworzenia      |
| `updated_at`    | timestamptz | ✅       | now()     | Data aktualizacji    |

**Klucz główny**: `id`

**Relacje**:

- `grn_items.grn_id` → `grns.id`

---

### `grn_items`

**RLS**: ✅ Włączone | **Wiersze**: 0

Linie GRN.

| Kolumna             | Typ         | Nullable | Domyślna  | Opis                |
| ------------------- | ----------- | -------- | --------- | ------------------- |
| `id`                | integer     | ❌       | nextval() | Klucz główny        |
| `grn_id`            | integer     | ✅       | -         | Nagłówek GRN        |
| `product_id`        | integer     | ✅       | -         | Produkt             |
| `quantity_ordered`  | numeric     | ❌       | -         | Ilość zamówiona     |
| `quantity_received` | numeric     | ❌       | -         | Ilość otrzymana     |
| `quantity_accepted` | numeric     | ✅       | -         | Ilość zaakceptowana |
| `location_id`       | integer     | ✅       | -         | Lokalizacja         |
| `unit_price`        | numeric     | ✅       | -         | Cena jednostkowa    |
| `batch`             | varchar     | ✅       | -         | Partia              |
| `batch_number`      | varchar     | ✅       | -         | Numer partii        |
| `mfg_date`          | timestamptz | ✅       | -         | Data produkcji      |
| `expiry_date`       | timestamptz | ✅       | -         | Data ważności       |
| `created_at`        | timestamptz | ✅       | now()     | Data utworzenia     |
| `updated_at`        | timestamptz | ✅       | now()     | Data aktualizacji   |

**Klucz główny**: `id`

---

### `asns`

**RLS**: ✅ Włączone | **Wiersze**: 0

Advanced Shipping Notices (ASN).

| Kolumna            | Typ         | Nullable | Domyślna  | Opis                 |
| ------------------ | ----------- | -------- | --------- | -------------------- |
| `id`               | integer     | ❌       | nextval() | Klucz główny         |
| `asn_number`       | varchar     | ❌       | -         | Numer ASN (unikalny) |
| `supplier_id`      | integer     | ✅       | -         | Dostawca             |
| `po_id`            | integer     | ✅       | -         | Zamówienie zakupowe  |
| `status`           | varchar     | ❌       | -         | Status               |
| `expected_arrival` | timestamptz | ❌       | -         | Oczekiwane przybycie |
| `attachments`      | jsonb       | ✅       | -         | Załączniki (JSON)    |
| `created_at`       | timestamptz | ✅       | now()     | Data utworzenia      |
| `updated_at`       | timestamptz | ✅       | now()     | Data aktualizacji    |

**Klucz główny**: `id`

**Relacje**:

- `asn_items.asn_id` → `asns.id`

---

### `asn_items`

**RLS**: ✅ Włączone | **Wiersze**: 0

Linie ASN.

| Kolumna      | Typ         | Nullable | Domyślna  | Opis              |
| ------------ | ----------- | -------- | --------- | ----------------- |
| `id`         | integer     | ❌       | nextval() | Klucz główny      |
| `asn_id`     | integer     | ✅       | -         | Nagłówek ASN      |
| `product_id` | integer     | ✅       | -         | Produkt           |
| `uom`        | varchar     | ❌       | -         | Jednostka miary   |
| `quantity`   | numeric     | ❌       | -         | Ilość             |
| `batch`      | varchar     | ✅       | -         | Partia            |
| `pack`       | jsonb       | ✅       | -         | Opakowanie (JSON) |
| `pallet`     | jsonb       | ✅       | -         | Paleta (JSON)     |
| `notes`      | text        | ✅       | -         | Notatki           |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia   |

**Klucz główny**: `id`

---

### `stock_moves`

**RLS**: ✅ Włączone | **Wiersze**: 0

Ruchy magazynowe.

| Kolumna            | Typ         | Nullable | Domyślna    | Opis                             |
| ------------------ | ----------- | -------- | ----------- | -------------------------------- |
| `id`               | integer     | ❌       | nextval()   | Klucz główny                     |
| `move_number`      | varchar     | ❌       | -           | Numer ruchu (unikalny)           |
| `product_id`       | integer     | ✅       | -           | Produkt                          |
| `from_location_id` | integer     | ✅       | -           | Lokalizacja źródłowa             |
| `to_location_id`   | integer     | ✅       | -           | Lokalizacja docelowa             |
| `quantity`         | numeric     | ❌       | -           | Ilość                            |
| `uom`              | varchar     | ❌       | -           | Jednostka miary                  |
| `move_type`        | varchar     | ❌       | -           | Typ ruchu                        |
| `move_source`      | varchar     | ✅       | 'portal'    | Źródło: portal, scanner, etc.    |
| `move_status`      | varchar     | ✅       | 'completed' | Status: completed, pending, etc. |
| `reference_type`   | varchar     | ✅       | -           | Typ referencji                   |
| `reference_id`     | integer     | ✅       | -           | ID referencji                    |
| `created_by`       | varchar     | ✅       | -           | Utworzony przez                  |
| `created_at`       | timestamptz | ✅       | now()       | Data utworzenia                  |

**Klucz główny**: `id`

---

## Technical Module

### `boms`

**RLS**: ✅ Włączone | **Wiersze**: 3

Bill of Materials (BOM) - karty materiałowe.

| Kolumna              | Typ         | Nullable | Domyślna  | Opis                                |
| -------------------- | ----------- | -------- | --------- | ----------------------------------- |
| `id`                 | integer     | ❌       | nextval() | Klucz główny                        |
| `product_id`         | integer     | ✅       | -         | Produkt                             |
| `version`            | varchar     | ❌       | -         | Wersja                              |
| `status`             | bom_status  | ❌       | 'draft'   | Status: draft, active, archived     |
| `archived_at`        | timestamptz | ✅       | -         | Data archiwizacji                   |
| `deleted_at`         | timestamptz | ✅       | -         | Data usunięcia                      |
| `requires_routing`   | boolean     | ✅       | false     | Wymaga routingu                     |
| `default_routing_id` | integer     | ✅       | -         | Domyślny routing                    |
| `notes`              | text        | ✅       | -         | Notatki                             |
| `effective_from`     | timestamptz | ✅       | -         | Obowiązuje od                       |
| `effective_to`       | timestamptz | ✅       | -         | Obowiązuje do                       |
| `boxes_per_pallet`   | integer     | ✅       | -         | Pudełek na palecie (FG)             |
| `created_at`         | timestamptz | ✅       | now()     | Data utworzenia                     |
| `updated_at`         | timestamptz | ✅       | now()     | Data aktualizacji                   |
| `line_id`            | integer[]   | ✅       | -         | Tablica ID linii (NULL = wszystkie) |

**Klucz główny**: `id`

**Relacje**:

- `bom_items.bom_id` → `boms.id`
- `bom_history.bom_id` → `boms.id`
- `work_orders.bom_id` → `boms.id`

---

### `bom_items`

**RLS**: ✅ Włączone | **Wiersze**: 3

Pozycje BOM (materiały).

| Kolumna                        | Typ         | Nullable | Domyślna  | Opis                                      |
| ------------------------------ | ----------- | -------- | --------- | ----------------------------------------- |
| `id`                           | integer     | ❌       | nextval() | Klucz główny                              |
| `bom_id`                       | integer     | ✅       | -         | BOM                                       |
| `material_id`                  | integer     | ✅       | -         | Materiał                                  |
| `uom`                          | varchar     | ❌       | -         | Jednostka: KG, EACH, METER, LITER         |
| `quantity`                     | numeric     | ❌       | -         | Ilość                                     |
| `production_line_restrictions` | text[]      | ✅       | '{}'      | Ograniczenia linii                        |
| `sequence`                     | integer     | ❌       | -         | Sekwencja                                 |
| `priority`                     | integer     | ✅       | -         | Priorytet                                 |
| `unit_cost_std`                | numeric     | ✅       | -         | Standardowy koszt jednostkowy             |
| `scrap_std_pct`                | numeric     | ✅       | 0         | Standardowy % odpadu                      |
| `is_optional`                  | boolean     | ✅       | false     | Czy opcjonalny                            |
| `is_phantom`                   | boolean     | ✅       | false     | Czy phantom                               |
| `consume_whole_lp`             | boolean     | ✅       | false     | Konsumuj całą LP                          |
| `production_lines`             | text[]      | ✅       | -         | Linie produkcyjne                         |
| `tax_code_id`                  | integer     | ✅       | -         | Kod podatkowy                             |
| `lead_time_days`               | integer     | ✅       | -         | Czas realizacji (dni, > 0)                |
| `moq`                          | numeric     | ✅       | -         | Minimalna ilość zamówienia (> 0)          |
| `packages_per_box`             | numeric     | ❌       | 1         | Opakowań w pudełku (> 0)                  |
| `created_at`                   | timestamptz | ✅       | now()     | Data utworzenia                           |
| `updated_at`                   | timestamptz | ✅       | now()     | Data aktualizacji                         |
| `line_id`                      | integer[]   | ✅       | -         | Tablica ID linii (NULL = wszystkie z BOM) |

**Klucz główny**: `id`

---

### `bom_history`

**RLS**: ✅ Włączone | **Wiersze**: 13

Historia zmian BOM.

| Kolumna       | Typ         | Nullable | Domyślna  | Opis            |
| ------------- | ----------- | -------- | --------- | --------------- |
| `id`          | integer     | ❌       | nextval() | Klucz główny    |
| `bom_id`      | integer     | ❌       | -         | BOM             |
| `version`     | varchar     | ❌       | -         | Wersja          |
| `changed_by`  | uuid        | ✅       | -         | Zmieniony przez |
| `changed_at`  | timestamptz | ✅       | now()     | Data zmiany     |
| `status_from` | varchar     | ✅       | -         | Status przed    |
| `status_to`   | varchar     | ✅       | -         | Status po       |
| `changes`     | jsonb       | ❌       | -         | Zmiany (JSON)   |
| `description` | text        | ✅       | -         | Opis            |

**Klucz główny**: `id`

---

### `routings`

**RLS**: ✅ Włączone | **Wiersze**: 5

Routy produkcyjne.

| Kolumna      | Typ         | Nullable | Domyślna  | Opis                 |
| ------------ | ----------- | -------- | --------- | -------------------- |
| `id`         | integer     | ❌       | nextval() | Klucz główny         |
| `name`       | varchar     | ❌       | -         | Nazwa                |
| `product_id` | integer     | ✅       | -         | Produkt              |
| `is_active`  | boolean     | ✅       | true      | Czy aktywny          |
| `notes`      | text        | ✅       | -         | Notatki              |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia      |
| `updated_at` | timestamptz | ✅       | now()     | Data aktualizacji    |
| `created_by` | uuid        | ✅       | -         | Utworzony przez      |
| `updated_by` | uuid        | ✅       | -         | Zaktualizowany przez |

**Klucz główny**: `id`

**Relacje**:

- `routing_operations.routing_id` → `routings.id`

---

### `routing_operations`

**RLS**: ✅ Włączone | **Wiersze**: 8

Operacje w routingu.

| Kolumna                      | Typ         | Nullable | Domyślna  | Opis                           |
| ---------------------------- | ----------- | -------- | --------- | ------------------------------ |
| `id`                         | integer     | ❌       | nextval() | Klucz główny                   |
| `routing_id`                 | integer     | ✅       | -         | Routing                        |
| `operation_name`             | varchar     | ❌       | -         | Nazwa operacji                 |
| `sequence_number`            | integer     | ❌       | -         | Numer sekwencji                |
| `machine_id`                 | integer     | ✅       | -         | Maszyna (opcjonalna)           |
| `estimated_duration_minutes` | integer     | ✅       | -         | Szacowany czas (min)           |
| `setup_time_minutes`         | integer     | ✅       | 0         | Czas setupu (min)              |
| `is_active`                  | boolean     | ✅       | true      | Czy aktywna                    |
| `created_at`                 | timestamptz | ✅       | now()     | Data utworzenia                |
| `updated_at`                 | timestamptz | ✅       | now()     | Data aktualizacji              |
| `requirements`               | text[]      | ✅       | '{}'      | Wymagania                      |
| `code`                       | varchar     | ✅       | -         | Kod                            |
| `description`                | text        | ✅       | -         | Opis                           |
| `expected_yield_pct`         | numeric     | ✅       | 100.0     | Oczekiwana wydajność % (0-100) |

**Klucz główny**: `id`

**Relacje**:

- `wo_operations.routing_operation_id` → `routing_operations.id`

---

### `routing_operation_names`

**RLS**: ❌ Wyłączone | **Wiersze**: 8

Słownik standardowych nazw operacji.

| Kolumna       | Typ         | Nullable | Domyślna  | Opis                      |
| ------------- | ----------- | -------- | --------- | ------------------------- |
| `id`          | integer     | ❌       | nextval() | Klucz główny              |
| `name`        | varchar     | ❌       | -         | Nazwa operacji (unikalna) |
| `alias`       | varchar     | ✅       | -         | Alias/krótki kod          |
| `description` | text        | ✅       | -         | Opis                      |
| `is_active`   | boolean     | ✅       | true      | Czy aktywny               |
| `created_at`  | timestamptz | ✅       | now()     | Data utworzenia           |
| `updated_at`  | timestamptz | ✅       | now()     | Data aktualizacji         |
| `created_by`  | uuid        | ✅       | -         | Utworzony przez           |
| `updated_by`  | uuid        | ✅       | -         | Zaktualizowany przez      |

**Klucz główny**: `id`

---

## System Tables

### `audit_log`

**RLS**: ✅ Włączone | **Wiersze**: 29

Log audytu zmian w systemie.

| Kolumna      | Typ         | Nullable | Domyślna  | Opis                           |
| ------------ | ----------- | -------- | --------- | ------------------------------ |
| `id`         | integer     | ❌       | nextval() | Klucz główny                   |
| `entity`     | varchar     | ❌       | -         | Nazwa encji                    |
| `entity_id`  | integer     | ❌       | -         | ID encji                       |
| `action`     | varchar     | ❌       | -         | Akcja (create, update, delete) |
| `before`     | jsonb       | ✅       | -         | Stan przed (JSON)              |
| `after`      | jsonb       | ✅       | -         | Stan po (JSON)                 |
| `actor_id`   | uuid        | ✅       | -         | Użytkownik wykonujący          |
| `created_at` | timestamptz | ✅       | now()     | Data utworzenia                |

**Klucz główny**: `id`

---

### `product_allergens`

**RLS**: ✅ Włączone | **Wiersze**: 7

Powiązania produktów z alergenami.

| Kolumna       | Typ         | Nullable | Domyślna  | Opis              |
| ------------- | ----------- | -------- | --------- | ----------------- |
| `id`          | integer     | ❌       | nextval() | Klucz główny      |
| `product_id`  | integer     | ❌       | -         | Produkt           |
| `allergen_id` | integer     | ❌       | -         | Alergen           |
| `contains`    | boolean     | ❌       | true      | Czy zawiera       |
| `created_at`  | timestamptz | ✅       | now()     | Data utworzenia   |
| `updated_at`  | timestamptz | ✅       | now()     | Data aktualizacji |

**Klucz główny**: `id`

---

## 📊 Podsumowanie Relacji

### Najważniejsze Relacje

1. **Produkty** (`products`) są centralną encją:
   - Używane w BOM (`bom_items.material_id`)
   - Używane w PO (`po_line.item_id`)
   - Używane w WO (`work_orders.product_id`)
   - Używane w LP (`license_plates.product_id`)

2. **Zlecenia Produkcyjne** (`work_orders`) łączą:
   - Produkty, BOM, Linie produkcyjne
   - Operacje (`wo_operations`)
   - Materiały (`wo_materials`)
   - Wyjścia (`production_outputs`)

3. **Tablice Rejestracyjne** (`license_plates`) śledzą:
   - Lokalizacje magazynowe
   - Genealogię (rodzic-dziecko)
   - Kompozycje (wejścia/wyjścia)
   - Rezerwacje dla WO

4. **Planowanie** (`po_header`, `to_header`):
   - PO → GRN → LP
   - TO → Stock Moves → LP

---

## 🔒 Row Level Security (RLS)

Wszystkie tabele mają włączone RLS oprócz:

- `routing_operation_names` (słownik referencyjny)

RLS zapewnia izolację danych na poziomie użytkownika/organizacji.

---

**Wygenerowano**: 2025-01-08  
**Źródło**: Supabase MCP API  
**Projekt**: MonoPilot
