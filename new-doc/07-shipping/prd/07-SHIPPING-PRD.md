# PRD M07-Shipping — MonoPilot MES
**Wersja**: 3.1 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul Shipping (M07) obsluguje pelny cykl zamowienie-do-dostawy (order-to-ship) dla wyrobow gotowych w srodowisku produkcji zywnosci SMB. Zakres obejmuje: zarzadzanie klientami, przetwarzanie zamowien sprzedazy (SO), alokacje zapasow LP-based z FIFO/FEFO, pick listy (wave picking, scanner), pakowanie (multi-box, SSCC-18, BOL, packing slip), wysylke (manifest, carrier), zwroty (RMA), dock management, dashboard operacyjny i raporty.

**Pozycja w systemie**: M07 jest downstream od M03 Warehouse (LP, lokalizacje) i M08 Quality (QA status). Upstream dla M10 Finance (fakturowanie) i M13 Integrations (EDI ASN 856).

**Kluczowe wyrozniki**:
- Alokacja wylacznie LP-based (ADR-001) — brak luznych ilosci
- FIFO/FEFO picking z audit trail na override (ADR-005)
- GS1 SSCC-18 na paczki/palety (ADR-004)
- Walidacja alergenow przed potwierdzeniem SO
- Scanner-first UX dla pick/pack/return (ADR-006)
- Multi-tenancy RLS z `org_id` na kazdej tabeli (ADR-003/013)
- Catch weight i pack_quantity na liniach SO (PRD-UPDATE-LIST)

---

## 2. Objectives

### Cel glowny
Umozliwienie pelnego cyklu order-to-ship dla producentow zywnosci SMB z zachowaniem trasowalnosci, bezpieczenstwa zywnosci (alergeny) i zgodnosci GS1.

### Cele szczegolowe
1. **End-to-end fulfillment**: SO -> alokacja -> pick -> pack -> ship w jednym module
2. **Food safety compliance**: walidacja alergenow, separacja w pakowaniu, trasowalnosc lot-level
3. **Efektywnosc operacyjna**: wave picking, scanner workflows, FIFO/FEFO automatyczne sugestie
4. **Skalowalnosc**: carrier integration, dock management, zaawansowane raporty w Phase 2

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Order Fulfillment Time | < 24h (draft -> shipped) | Avg time per SO |
| Pick Accuracy | > 99% | Correct product/lot/qty |
| On-Time Delivery | > 95% | Shipped by promised_ship_date |
| Allergen Compliance | 100% | SO z conflict -> blocked or overridden with audit |
| Scanner Operation Time | < 30s per pick line | APM |
| SSCC Label Print Success | > 99.5% | Valid labels / total generated |

---

## 3. Personas

| Persona | Rola w Shipping | Kluczowe workflow |
|---------|----------------|-------------------|
| **Operator magazynu** | Picking, packing, loading | Scanner: pick -> pack -> dock load |
| **Kierownik magazynu** | Nadzor pick/pack, wave picking, alokacja | Desktop: SO allocation, wave builder, dashboard |
| **Sprzedawca / Sales** | Tworzenie SO, zarzadzanie klientami | Desktop: customer CRUD, SO creation, status tracking |
| **Kierownik jakosci** | Walidacja alergenow, QA holds na zwrotach | Desktop: allergen review, RMA disposition |
| **Dyrektor zakladu** | Monitoring KPI, OTD%, fulfillment rate | Dashboard: read-only KPIs |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Obszar | Zakres | Priorytet |
|--------|--------|-----------|
| Klienci | CRUD, kontakty, adresy (billing/shipping), ograniczenia alergenowe | Must Have |
| Zamowienia sprzedazy | SO CRUD, linie, status workflow, allergen validation, partial fulfillment, cancellation | Must Have |
| [7.3] Delivery address | `shipping_address_id` per order (ship-to) | Must Have |
| Alokacja | LP-based auto/manual allocation, FIFO/FEFO suggestions, reserved inventory tracking | Must Have |
| Picking | Pick list generation, wave picking basic, FIFO/FEFO, scanner + desktop, short pick, allergen alerts | Must Have |
| Pakowanie | Packing station (desktop + scanner), multi-box, weight/dimensions | Must Have |
| Etykiety/Dokumenty | GS1 SSCC-18 labels, BOL, packing slip, ZPL print | Must Have |
| Wysylka | Shipment manifest, ship confirmation, LP status -> shipped | Must Have |
| Zwroty (RMA) | RMA creation, receiving (desktop + scanner), disposition, reason codes | Should Have |
| Dashboard | KPI cards, orders by status report | Should Have |

### 4.2 Out of Scope — Phase 2

| Obszar | Zakres |
|--------|--------|
| [7.1] CW na SO lines | `cw_quantity DECIMAL(15,4)`, `cw_unit TEXT` na `sales_order_lines` |
| [7.2] Pack quantity | `pack_quantity DECIMAL(15,4)` na `sales_order_lines` |
| [7.4] Mode of delivery | `mode_of_delivery TEXT` enum (road/rail/air/sea/courier) |
| [7.5] Order charges | `order_charges JSONB` ({delivery_fee, surcharges[]}) |
| [7.6] Delivery type | `delivery_type TEXT` enum (stock/direct) |
| Klienci zaawansowani | Credit limits (warning), categories, payment terms, pricing agreements |
| SO zaawansowane | Backorder mgmt, SO clone/template, CSV/API import |
| Picking zaawansowany | Zone/route optimization, batch picking, pick performance metrics |
| Carrier integration | DHL/UPS/DPD API, rate shopping, tracking webhooks, POD |
| Dock management | Dock doors, appointments, load planning, staging, temperature zone |
| Raporty zaawansowane | Pick performance, OTD, backorder, carrier, returns analysis |

### 4.3 Exclusions (Nigdy w M07)

- Pelna ksiegowosc / fakturowanie (-> M10 Finance / integracja)
- Customer portal / self-service tracking (-> M13 Integrations)
- Drop-shipping (direct from supplier)
- Multi-warehouse shipping w Phase 1 (single warehouse MVP)

---

## 5. Constraints

### Techniczne
- **LP-only**: Brak luznych ilosci — kazda operacja na atomowych LP (ADR-001)
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach; RLS enforced (ADR-003/013)
- **Service layer**: Logika w `lib/services/*-service.ts`, walidacja Zod, NIGDY bezposrednio DB (ADR-015/016/018)
- **site_id NULL**: Kolumna `site_id` na tabelach od poczatku (przygotowanie na M11 Multi-Site)

### Biznesowe
- Waluta startowa: GBP; multi-currency w Phase 2
- GS1 Company Prefix wymagany od organizacji (`organizations.gs1_company_prefix`)
- Carrier API keys wymagaja kont developerskich — Phase 2

### Regulacyjne
- Trasowalnosc forward/backward < 30 s (lot -> shipment -> customer)
- Alergeny EU-14: walidacja przed potwierdzeniem SO
- GS1 SSCC-18 compliance na etykietach shipping
- Audit trail na: status changes SO, allocation/deallocation, pick/pack, RMA approvals

---

## 6. Decisions

### D-SHP-1. LP-Based Allocation (ADR-001)
Alokacja zapasow wylacznie przez LP. Kazde LP ma `status` (available -> reserved -> shipped). Brak luznych ilosci. `inventory_allocations` laczy `sales_order_line_id` z `license_plate_id`. Przy ship confirmation: LP.status -> 'shipped'. Race condition protection: `SELECT ... FOR UPDATE` na LP przy alokacji (DB transaction).

### D-SHP-2. FIFO/FEFO Picking (ADR-005)
Domyslnie FEFO (najwczesniejsza data waznosci) dla produktow z `expiry_date`. FIFO fallback (najwczesniejszy `received_date`) dla produktow bez daty waznosci. Override z audit trail (`pick_overrides` table). Enforcement: suggest -> warn -> block (konfigurowalny). Expired LP: hard block (z opcja supervisor override).

### D-SHP-3. Shelf-Life per Product
Shelf life jest per produkt, NIE per dostawca. Kazdy produkt ma `shelf_life_days` (M02 Technical). FEFO sorting bazuje na `expiry_date` per LP, obliczana z `manufacturing_date + product.shelf_life_days` lub wpisywana recznie przy GRN.

### D-SHP-4. GS1 SSCC Compliance (ADR-004)
SSCC-18 na kazda paczke/palete: Extension(1) + GS1 Prefix(7-10) + Serial(6-8) + Check(1). Sekwencja per org (`next_sscc_sequence`). GS1-128 barcode na etykietach. GS1 Company Prefix konfigurowany w M01 Settings.

### D-SHP-5. Allergen Separation
Walidacja alergenow OBOWIAZKOWA przed potwierdzeniem SO. Sprawdzenie: `customer.allergen_restrictions` vs `product.allergens` dla kazdej linii SO. Konflikt -> blokada confirmation (chyba ze override z audit trail). Alerty alergenowe w pick/pack workflows. Separacja produktow alergenowych w osobnych boxach (warning).

### D-SHP-6. Scanner-First UX (ADR-006)
Dedykowane strony `/scanner/shipping/pick`, `/scanner/shipping/pack`, `/scanner/shipping/return`. 48px touch targets, scan-first input, liniowy flow. Hardware scanner (Zebra/Honeywell) + camera fallback. Offline: Phase 2 (IndexedDB queue).

### D-SHP-7. RLS / org_id (ADR-003/013)
`org_id UUID NOT NULL` na WSZYSTKICH tabelach Shipping. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Dodatkowe polityki: pick_lists (assigned_to check), carrier_configs (admin only).

### D-SHP-8. SO Status Machine
```
draft -> confirmed -> allocated -> picking -> packing -> shipped -> delivered
          |
       cancelled
```
Guards: allergen_validated przed confirmed, has_allocations przed picking, all_picked przed packing, all_packed przed shipped.

### D-SHP-9. SO Pricing
Unit price na SO line pobierany z `products.default_sell_price` (domyslnie). Pole `products.default_sell_price` zdefiniowane w M02 Technical (`02-technical/prd/02-TECHNICAL-PRD.md`) — M07 odczytuje jako default unit_price przy tworzeniu SO line. W Phase 2: pricing agreements per customer nadpisuja default. Manual override z audit trail.

### D-SHP-10. Backorder Handling
Dual approach: partial allocation -> SO flagowany jako `status = 'partial'`. Opcjonalnie auto-create backorder record. Konfigurowalny per org: flag-only (domyslnie) lub flag + auto-backorder.

### D-SHP-11. Audit Trail (ADR-008)
PG triggers + app context na: `sales_orders`, `sales_order_lines`, `inventory_allocations`, `pick_lists`, `shipments`, `rma_requests`. Logowanie: old_data/new_data, user_id, ip_address, action_reason.

### D-SHP-12. Decyzje biznesowe (bez ADR)
- Partial shipments: TAK — jeden SO moze miec wiele shipments
- Multi-warehouse: NIE w Phase 1 (single warehouse MVP)
- Auto-allocation on confirm: konfigurowalny (domyslnie TAK)
- LTL freight: manual BOL w Phase 1, API w Phase 2
- SO numeracja: `SO-YYYY-NNNNN` (auto-generated, unique per org)
- Credit limit w Phase 2: warning only, NIE block

---

## 7. Module Map

```
M07 Shipping
|-- E07.1 -- Customer Management [Phase 1]
|   |-- Customers CRUD, contacts, addresses
|   |-- Allergen restrictions
|   +-- Customer order history
|-- E07.2 -- Sales Orders Core [Phase 1]
|   |-- SO CRUD, lines, status workflow
|   |-- Allergen validation (mandatory)
|   |-- [7.3] Delivery address per order
|   +-- Partial fulfillment, cancellation
|-- E07.3 -- Allocation & Picking [Phase 1]
|   |-- LP-based allocation (FIFO/FEFO)
|   |-- Pick list generation + wave picking basic
|   |-- Scanner + desktop confirmation
|   +-- Short pick handling, allergen alerts
|-- E07.4 -- Packing & Shipping [Phase 1]
|   |-- Packing station (desktop + scanner)
|   |-- Multi-box, SSCC-18, BOL, packing slip
|   |-- Shipment manifest, ship confirmation
|   +-- ZPL/PDF label print
|-- E07.5 -- Returns / RMA [Phase 1]
|   |-- RMA CRUD, receiving (desktop + scanner)
|   +-- Disposition (restock/scrap/QA hold)
|-- E07.6 -- Dashboard & Reports [Phase 1]
|   +-- KPI cards, orders by status
|-- E07.7 -- SO & Customer Advanced [Phase 2]
|   |-- [7.1] CW na SO lines, [7.2] pack_quantity
|   |-- [7.4] mode_of_delivery, [7.5] order charges, [7.6] delivery_type
|   |-- Credit limits, categories, payment terms
|   +-- SO clone, backorder mgmt, CSV import
|-- E07.8 -- Carrier Integration [Phase 2]
|   +-- DHL/UPS/DPD API, rate shopping, tracking
|-- E07.9 -- Dock & Loading [Phase 2]
|   +-- Dock doors, appointments, load planning
+-- E07.10 -- Reports Advanced [Phase 2]
    +-- Pick performance, OTD, carrier, returns analysis
```

### Zaleznosci modulowe

| Upstream | Dane wymagane |
|----------|---------------|
| M01 Settings | organizations (gs1_company_prefix), users, roles, warehouses, allergens EU-14 |
| M02 Technical | products (GTIN, allergens, shelf_life_days, catch_weight, default_sell_price) |
| M03 Warehouse | license_plates, locations, inventory_moves |
| M08 Quality | LP QA status (only pick 'passed') |

| Downstream | Dane dostarczane |
|------------|------------------|
| M10 Finance | Shipped SO -> fakturowanie |
| M13 Integrations | EDI ASN 856, tracking webhooks |
| M05 Scanner | Pick/Pack/Return workflows (M05-E2, M05-E5) |

---

## 8. Requirements

### E07.1 — Customer Management [Phase 1 / MVP]

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `customers` | org_id, site_id NULL, customer_code (unique/org), name, email, phone, tax_id, category (retail/wholesale/distributor), allergen_restrictions JSONB, is_active | org_id isolation | ADR-013 |
| `customer_contacts` | org_id, customer_id FK, name, title, email, phone, is_primary | org_id isolation | CASCADE on delete customer |
| `customer_addresses` | org_id, customer_id FK, address_type (billing/shipping), is_default, address_line1/2, city, state, postal_code, country, dock_hours JSONB, notes | org_id isolation | dock_hours = godziny dostaw |

**API Endpoints:**
- `GET/POST/PUT/DELETE /api/shipping/customers` — Customer CRUD
- `GET/POST/PUT/DELETE /api/shipping/customers/:id/contacts` — Contacts CRUD
- `GET/POST/PUT/DELETE /api/shipping/customers/:id/addresses` — Addresses CRUD
- `PUT /api/shipping/customers/:id/addresses/:addressId/set-default` — Default address
- `GET /api/shipping/customers/:id/orders` — Customer order history
- `GET /api/shipping/customers/:id/allergen-validation` — Validate products vs restrictions

**Validation (Zod):** `customerSchema` (name 2-100, customer_code unique/org), `contactSchema`, `addressSchema` (address_type enum, allergen_restrictions array UUID)

**Frontend/UX:** Customer list z filtrami (active, category, search). Customer detail: tabs (Details, Contacts, Addresses, Orders). Allergen picker (checkbox EU-14 + org extensions).

**FR:** FR-7.1 (Customer CRUD), FR-7.2 (Contacts), FR-7.3 (Addresses), FR-7.7 (Allergen Restrictions)

---

### E07.2 — Sales Orders Core [Phase 1 / MVP]

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `sales_orders` | org_id, site_id NULL, order_number (SO-YYYY-NNNNN), customer_id FK, customer_po, **shipping_address_id UUID NOT NULL** [7.3], order_date, promised_ship_date, required_delivery_date, status (enum), total_amount, allergen_validated BOOLEAN, confirmed_at, shipped_at | Status machine: D-SHP-8 |
| `sales_order_lines` | org_id, sales_order_id FK, line_number, product_id FK, quantity_ordered, quantity_allocated/picked/packed/shipped, unit_price, line_total, requested_lot, notes | unit_price default z products.default_sell_price (patrz: cross-ref poniżej) |

**Cross-reference — cena sprzedaży**: Pole `unit_price` na linii SO pobiera domyślną wartość z `products.default_sell_price`. Pole `products.default_sell_price` jest **zdefiniowane i zarządzane w M02 Technical** (`02-TECHNICAL-PRD.md`, tabela `products`) — analogicznie do pola `default_purchase_price`. M07 Shipping **wyłącznie odczytuje** tę wartość jako punkt startowy dla `unit_price`. M07 nie definiuje ani nie zarządza ceną sprzedaży. W Phase 2: pricing agreements per customer (E07.7) nadpiszą tę wartość domyślną.

**API Endpoints:**
- `GET/POST/PUT/DELETE /api/shipping/sales-orders` — SO CRUD (PUT/DELETE only draft)
- `POST/PUT/DELETE /api/shipping/sales-orders/:id/lines` — Lines CRUD
- `POST /api/shipping/sales-orders/:id/confirm` — Confirm (triggers allergen check + optional auto-allocation)
- `POST /api/shipping/sales-orders/:id/hold` — Put on hold
- `POST /api/shipping/sales-orders/:id/cancel` — Cancel (release allocations)
- `POST /api/shipping/sales-orders/:id/validate-allergens` — Allergen check

**Validation (Zod):** `salesOrderSchema` (customer_id required, shipping_address_id required, order_date required), `soLineSchema` (quantity > 0, product_id exists)

**Allergen validation**: OBOWIAZKOWA przed confirmed. customer.allergen_restrictions vs product.allergens per line. Override z audit trail.

**Frontend/UX:** SO list z filtrami (status, date, customer). SO create wizard: Select customer -> Add lines (auto-price) -> Review allergens -> Confirm. Allergen alert banner (red).

**FR:** FR-7.9 (SO Creation), FR-7.10 (Lines), FR-7.11 (Status), FR-7.13 (Confirm/Hold), FR-7.15 (Partial), FR-7.17 (Cancel), FR-7.19 (Promised Ship Date)

---

### E07.3 — Allocation & Picking [Phase 1 / MVP]

**Backend — Allocation:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `inventory_allocations` | org_id, sales_order_line_id FK, license_plate_id FK, quantity_allocated, quantity_picked, allocated_at, allocated_by, released_at | LP-based; FOR UPDATE lock |

**API:** `POST /sales-orders/:id/allocate`, `POST /release-allocation`, `GET /allocations`

**Logika FIFO/FEFO (ADR-005):**
```sql
SELECT lp.* FROM license_plates lp
WHERE product_id = $1 AND status = 'available' AND current_qty > 0
  AND (qa_status = 'passed' OR qa_status IS NULL)
  AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
ORDER BY expiry_date ASC NULLS LAST, received_date ASC
FOR UPDATE
```

**Backend — Picking:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `pick_lists` | org_id, pick_list_number (PL-YYYY-NNNNN), pick_type (single_order/wave), status, priority, assigned_to FK, wave_id, started_at, completed_at | Status: pending/assigned/in_progress/completed/cancelled |
| `pick_list_lines` | org_id, pick_list_id FK, sales_order_line_id FK, license_plate_id (suggested), location_id FK, product_id FK, lot_number, quantity_to_pick, quantity_picked, pick_sequence, status (pending/picked/short), picked_license_plate_id (actual), picked_at, picked_by | Route: zone -> aisle -> bin |

**API:** CRUD pick lists, `/assign`, `/start`, `/complete`, `/cancel`, lines `/pick`, `/short-pick`, `/wave`, `/my-picks`

**Scanner API:** `POST /scanner/pick`, `GET /scanner/suggest-pick/:lineId`

**Short pick:** Capture reason code, adjust allocation, flag SO as partial.

**Wave picking — Phase 1 (basic):** Max 50 linii SO per wave (konfigurowalny per org via `organization_settings.max_orders_per_wave`, domyslnie 50). Enforced w service layer przed generowaniem pick listy. Operator wybiera manualnie SO do wave → system generuje skonsolidowaną pick listę (FIFO/FEFO sorting). Brak auto-wave-creation w Phase 1 — wave tworzy użytkownik z poziomu UI (Wave Builder). Auto-wave-creation (np. na podstawie harmonogramu lub priorytetu) planowane w Phase 2 (E07.7 / E07.10).

**Frontend/UX:** Allocation wizard (auto/manual, LP suggestions z FIFO/FEFO). Pick list table. Wave picking builder. Desktop picking: location -> LP -> confirm. Scanner picking: scan location -> scan LP -> enter qty -> confirm (48px targets, linear flow).

**FR:** FR-7.12, FR-7.18 (Allocation), FR-7.21-FR-7.28, FR-7.30, FR-7.31 (Picking)

---

### E07.4 — Packing & Shipping [Phase 1 / MVP]

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `shipments` | org_id, shipment_number (SH-YYYY-NNNNN), sales_order_id FK, customer_id FK, shipping_address_id FK, status, carrier, service_level, tracking_number, sscc, total_weight, total_boxes, dock_door_id, staged_location_id, packed_at/by, shipped_at, delivered_at | Status: pending/packing/packed/manifested/shipped/delivered/exception |
| `shipment_boxes` | org_id, shipment_id FK, box_number, sscc (UNIQUE), weight, length, width, height, tracking_number | SSCC-18 per box (ADR-004) |
| `shipment_box_contents` | org_id, shipment_box_id FK, sales_order_line_id FK, product_id FK, license_plate_id FK, lot_number, quantity | Trasowalnosc lot-level |

**API:**
- Shipment CRUD, box CRUD, box contents CRUD
- `POST /shipments/:id/generate-sscc` — Generate SSCC codes
- `POST /shipments/:id/generate-bol` — Generate BOL PDF
- `POST /shipments/:id/print-labels` — Print SSCC labels (ZPL/PDF)
- `POST /shipments/:id/print-packing-slip` — Packing slip
- `POST /shipments/:id/manifest` — Manifest with carrier
- `POST /shipments/:id/ship` — Mark as shipped (LP.status -> shipped, SO.status -> shipped)
- `POST /shipments/:id/mark-delivered` — POD confirmation

**SSCC Generation (ADR-004):** GS1 SSCC-18, sequential per org (`next_sscc_sequence`), check digit, `FOR UPDATE` atomic increment. Wymaga `organizations.gs1_company_prefix`.

**BOL:** PDF z Ship From, Ship To, Carrier, Pro Number, box count, weight, SSCC list, signature fields.

**Frontend/UX:** Packing workbench: 3-column (Available LPs, Box Builder, Summary). Scanner packing: scan LP -> verify -> add to box -> close box -> print SSCC. BOL/packing slip preview + print.

**FR:** FR-7.34-FR-7.42 (Packing), shipment manifest, ship confirmation

---

### E07.5 — Returns / RMA [Phase 1 / MVP]

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `rma_requests` | org_id, rma_number (RMA-YYYY-NNNNN), customer_id FK, sales_order_id FK (nullable), reason_code (enum), status, total_value, disposition (restock/scrap/quality_hold), approved_at/by | Status: pending/approved/receiving/received/processed/closed |
| `rma_lines` | org_id, rma_request_id FK, product_id FK, quantity_expected, quantity_received, lot_number, reason_notes, disposition (line-level override) | |

**API:** RMA CRUD, lines CRUD, `/approve`, `/receive-line`, `/process`, `/close`

**Scanner API:** `POST /scanner/receive-return` (scan RMA -> scan product -> enter qty -> disposition)

**Disposition:** restock (new LP created), scrap (waste record), quality_hold (QC workflow M08).

**FR:** FR-7.59-FR-7.63, FR-7.65

---

### E07.6 — Dashboard & Reports [Phase 1 / MVP]

**Backend:**
- `GET /shipping/dashboard` — KPIs: today's shipments, pending picks, backorders count, fulfillment rate
- `GET /shipping/dashboard/alerts` — Overdue picks, backorders, allergen warnings
- `GET /shipping/reports/orders-by-status` — Aggregation by status
- Cache: Redis 1 min TTL na dashboard KPIs

**Frontend/UX:** KPI cards, charts (orders by status pie, daily shipments trend). Quick actions: Create SO, Create pick list.

**FR:** FR-7.66 (Dashboard), FR-7.67 (Orders by Status)

---

### E07.7 — SO & Customer Advanced [Phase 2]

**Zadania z PRD-UPDATE-LIST:**

| ID | Zadanie | Priorytet | Tabela | Kolumna |
|----|---------|-----------|--------|---------|
| **7.1** | CW quantity na SO lines | HIGH | `sales_order_lines` | `cw_quantity DECIMAL(15,4)`, `cw_unit TEXT` |
| **7.2** | Pack quantity na SO lines | HIGH | `sales_order_lines` | `pack_quantity DECIMAL(15,4)` |
| **7.4** | Mode of delivery | MEDIUM | `sales_orders` | `mode_of_delivery TEXT` (road/rail/air/sea/courier) |
| **7.5** | Order charges | MEDIUM | `sales_orders` | `order_charges JSONB` |
| **7.6** | Delivery type | MEDIUM | `sales_orders` | `delivery_type TEXT` (stock/direct) |

**Pozostale FR Phase 2:** SO Clone (FR-7.14), Backorder Mgmt (FR-7.16), SO Import CSV (FR-7.20), Credit Limits warning (FR-7.4), Categories (FR-7.5), Payment Terms (FR-7.6), Pricing Agreements (FR-7.8), Pick Optimization (FR-7.29, FR-7.32, FR-7.33), Shipment Quality Checks (FR-7.43), Hazmat (FR-7.44).

---

### E07.8 — Carrier Integration [Phase 2]

- **DB:** `carrier_configs` z encrypted API keys (Supabase Vault), `org_id`, carrier enum, account_number, config_json JSONB
- **API:** Carrier CRUD (admin only), rate-quote, book-shipment, get-label, track, webhook
- **Service:** `carrier-service.ts` — adapter interface, DHL/UPS/DPD implementations
- **FR:** FR-7.45-FR-7.51

---

### E07.9 — Dock & Loading [Phase 2]

- **DB:** `dock_doors` (door_code, door_type, temperature_zone), `dock_appointments` (scheduled_start/end, shipment_id, carrier, truck_number, status)
- **API:** Dock doors CRUD, appointments CRUD, schedule calendar, start/complete
- **Temperature zone validation:** frozen -> frozen truck, chilled -> chilled/frozen
- **FR:** FR-7.52-FR-7.58

---

### E07.10 — Reports Advanced [Phase 2]

- Pick Performance (FR-7.68), On-Time Delivery (FR-7.69), Backorder (FR-7.70)
- Carrier Performance (FR-7.71), Returns Analysis (FR-7.72)
- Materialized views z 1-3 min latency

---

## 9. KPIs

### Phase 1 (MVP)

| KPI | Target | Pomiar |
|-----|--------|--------|
| Order Fulfillment Time | < 24h (draft -> shipped) | Avg time per SO |
| Pick Accuracy | > 99% | Correct product/lot/qty vs pick list |
| On-Time Delivery (OTD) | > 95% | Shipped by promised_ship_date |
| SSCC Label Print Success | > 99.5% | Valid labels / total generated |
| Scanner Operation Time | < 30s per pick line | APM |
| Allergen Compliance | 100% | SO z conflict -> blocked or overridden with audit |
| Fulfillment Rate | > 95% | qty_shipped / qty_ordered |
| Pack Time per Box | < 5 min | Avg time per shipment_box |

### Phase 2

| KPI | Target | Pomiar |
|-----|--------|--------|
| Wave Picking Efficiency | > 80 lines/h | Picks per picker per hour |
| Dock Utilization | > 70% | Scheduled / available hours |
| Return Processing Time | < 48h (RMA -> restocked) | Avg time per RMA |
| Carrier Cost Savings | > 10% | Rate shopping vs manual |
| Return Rate | < 3% | RMA lines / shipped lines |
| Carrier On-Time | > 95% | Delivered by carrier SLA |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| Zlozonosc wave picking | Srednie | Sredni | Phase 1 = basic wave, Phase 2 = route optimization |
| Bledy allergen validation | Niskie | Wysoki | Mandatory validation + audit trail; E2E testy |
| Carrier API instability | Srednie | Sredni | Adapter pattern; fallback manual; retry logic |
| SSCC generation errors | Niskie | Wysoki | Atomic sequence (FOR UPDATE), check digit validation |
| Short picks / stock-outs | Srednie | Sredni | Backorder auto-creation; dashboard alerts |
| Dock scheduling conflicts | Niskie | Niski | Calendar z overlap detection; Phase 2 |
| LP allocation race conditions | Srednie | Wysoki | DB transaction z FOR UPDATE; optimistic locking |
| Scanner device compatibility | Srednie | Sredni | Testy 3+ modeli Zebra/Honeywell; PWA fallback |
| RLS bypass | Niskie | Krytyczny | Automated org_id testy; security audit |
| Performance wave picks | Niskie | Sredni | Batch insert; limit 50 orders per wave |

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] SO -> allocation -> pick -> pack -> ship dziala end-to-end
- [ ] FIFO/FEFO picking suggestions poprawne (unit testy + E2E)
- [ ] SSCC-18 labels generowane i drukowane (ZPL + PDF)
- [ ] Allergen validation blokuje SO confirmation przy konflikcie
- [ ] Scanner workflows: pick, pack, return — dzialaja na Zebra TC52
- [ ] Wave picking: 3+ SO -> consolidated pick list -> complete -> distribute
- [ ] Short pick -> SO flagged as partial + opcjonalny backorder
- [ ] RMA: create -> approve -> receive -> disposition (restock/scrap)
- [ ] Dashboard: KPI cards + orders by status chart
- [ ] Delivery address per order (ship-to) [7.3]
- [ ] Partial fulfillment (multiple shipments per SO)
- [ ] Audit trail na: SO status changes, allocation, pick/pack, RMA

### Niefunkcjonalne
- [ ] Pick confirmation API < 500ms (P95)
- [ ] SO allocation < 2s dla 10 linii
- [ ] Wave pick list generation < 5s dla 50 zamowien
- [ ] RLS enforced na wszystkich tabelach Shipping (0 cross-tenant leaks)
- [ ] Unit test coverage > 80% na services
- [ ] E2E: happy path order-to-ship, allergen block, short pick, RMA

### Biznesowe
- [ ] 3+ klientow pilotazowych uzywa Shipping module
- [ ] Onboarding Shipping < 3 dni (po M01-M03 setup)
- [ ] Dokumentacja: user guides dla desktop + scanner workflows

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD: `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- PRD Shipping (oryginalny): `new-doc/07-shipping/prd/shipping.md`
- Shipping Architecture: `new-doc/07-shipping/decisions/shipping-arch.md`
- Analysis: `new-doc/07-shipping/ANALYSIS.md`
- PRD Update List: `new-doc/_meta/PRD-UPDATE-LIST.md`
- Design Guidelines: `new-doc/_meta/DESIGN-GUIDELINES.md`

### ADR (Shipping-relevant)
- ADR-001: LP Inventory -> `new-doc/00-foundation/decisions/ADR-001-license-plate-inventory.md`
- ADR-003/013: RLS Multi-Tenancy
- ADR-004: GS1 Compliance -> `new-doc/00-foundation/decisions/ADR-004-gs1-barcode-compliance.md`
- ADR-005: FIFO/FEFO -> `new-doc/00-foundation/decisions/ADR-005-fifo-fefo-picking-strategy.md`
- ADR-006: Scanner-First -> `new-doc/00-foundation/decisions/ADR-006-scanner-first-mobile-ux.md`
- ADR-008: Audit Trail
- ADR-015/016/018: Service Layer + Zod

### Tabele DB (16 tabel)
Phase 1: `customers`, `customer_contacts`, `customer_addresses`, `sales_orders`, `sales_order_lines`, `inventory_allocations`, `pick_lists`, `pick_list_lines`, `shipments`, `shipment_boxes`, `shipment_box_contents`, `rma_requests`, `rma_lines`
Phase 2: `dock_doors`, `dock_appointments`, `carrier_configs`

### Kluczowe reguly (checklist)
1. LP-based allocation — brak luznych ilosci
2. FIFO/FEFO pick suggestions z override audit trail
3. Allergen validation przed potwierdzeniem SO
4. QA gating na LP (only qa_status = 'passed')
5. GS1 SSCC-18 na paczki/palety
6. org_id/RLS na WSZYSTKICH tabelach
7. Audit trail na status changes, allocation, pick/pack, RMA
8. Scanner-first UX (48px targets, scan-first input, linear flow)
9. site_id NULL na tabelach (przygotowanie M11)
10. Shelf life per produkt (nie per dostawca)
11. Unit price z product master (default_sell_price)
12. Backorder: dual approach (flag + opcjonalny auto-backorder)
13. Credit limit Phase 2: warning only, nie block

---

_PRD M07-Shipping v3.1 — 10 epikow (6 MVP + 4 Phase 2), 72 FR, 6 zadan PRD-UPDATE-LIST, 16 tabel DB, 12 decyzji._
_Changelog v3.1: REC-L3: Wave picking Phase 1 doprecyzowany — max 50 linii SO, manualny wybor przez operatora, brak auto-wave-creation w Phase 1. REC-L4: Dodano cross-reference dla products.default_sell_price w E07.2 (tabela sales_order_lines) — M07 czyta wartosc z M02 Technical, nie definiuje._
_Changelog v3.0: Pelna restrukturyzacja wg wzorca M01. Backend-first na kazdym epiku. Explicit decisions D-SHP-1 do D-SHP-12. Tabele DB w requirements. Zod schemas. API endpoints per epik. Scanner workflows. PRD-UPDATE-LIST 7.1-7.6 zintegrowane. KPIs Phase 1 + Phase 2. Risks z prawdopodobienstwem i mitygacja. Success criteria funkcjonalne + niefunkcjonalne + biznesowe._
_Data: 2026-02-18_
