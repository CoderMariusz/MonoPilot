# Epic 7: Shipping Module (Enhanced) - Phase 2

**Status:** PLANNED
**Priority:** P1 - Critical dla zamkniecia luk konkurencyjnych
**Stories:** 38 (rozbudowane z 28)
**Estimated Effort:** 10-12 tygodni
**Dependencies:** Epic 1 (Settings), Epic 5 (Warehouse), Epic 6 (Quality)

---

## 1. Overview

### 1.1 Cel Epica
Rozbudowany modul Shipping zarzadza logistyka wychodzaca, wlaczajac:
- Sales Order management
- **FEFO picking** (First Expired, First Out) - krytyczne dla food
- Pick list optimization i grouping
- Packing workflow ze stacja pakowania
- Carrier integration basics
- Shipping documents (packing slip, labels, BOL)
- Scanner picking/packing workflows

### 1.2 Luki Konkurencyjne Zamykane
| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| FEFO Picking | 4/4 maja | Implementowane w tym epicu |
| Shelf Life Management | 4/4 maja | Implementowane w tym epicu |
| Shipping Labels & Tracking | 4/4 maja | Implementowane w tym epicu |
| Pick List Optimization | 3/4 maja | Implementowane w tym epicu |

### 1.3 Business Value
- **Redukcja przeterminiowania:** FEFO minimalizuje straty
- **Efektywnosc picking:** Zoptymalizowane trasy, batch picking
- **Pelna traceability:** LP tracking od produkcji do dostawy
- **Customer satisfaction:** Dokumentacja, tracking, on-time delivery

---

## 2. User Stories

### 2.1 Sales Order Management

#### Story 7.1: SO Creation
**Jako** Shipping Manager
**Chce** tworzyc zamowienia sprzedazy
**Aby** planowac wysylki do klientow

**Acceptance Criteria:**
- [ ] Formularz: wybor klienta, data zamowienia
- [ ] Requested date (oczekiwana dostawa)
- [ ] Ship-to address (moze roznic sie od klienta)
- [ ] Wybor warehouse wysylkowego
- [ ] Priority: low, normal, high, urgent
- [ ] Automatyczny numer SO-YYYY-NNNN

**Technical Notes:**
- Tabela so_header (juz w 07-shipping.md)
- Wymaga tabeli customers (lub rozszerzenie suppliers)

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.2: SO Lines Management
**Jako** Shipping Manager
**Chce** dodawac produkty do SO
**Aby** okreslic co ma byc wyslane

**Acceptance Criteria:**
- [ ] Dodaj produkt, ilosc, UoM
- [ ] Cena jednostkowa (opcjonalnie)
- [ ] Line notes
- [ ] Edit/delete linii
- [ ] Line status tracking (pending, picking, shipped)

**Technical Notes:**
- Tabela so_line (juz w 07-shipping.md)
- Walidacja: produkt musi istniec

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.3: SO Status Tracking
**Jako** Shipping Manager
**Chce** sledzic status SO przez caly proces
**Aby** wiedziec gdzie jest zamowienie

**Acceptance Criteria:**
- [ ] Status: draft, confirmed, picking, packed, shipped, delivered, cancelled
- [ ] Status transitions kontrolowane
- [ ] Timeline zmian statusu
- [ ] Status widoczny na liscie i detail

**Technical Notes:**
- State machine w service layer
- Audit log dla zmian statusu

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.4: SO Confirmation
**Jako** Shipping Manager
**Chce** potwierdzac SO przed picking
**Aby** zablokowac zmiany i rozpoczac realizacje

**Acceptance Criteria:**
- [ ] Przycisk "Confirm" na SO
- [ ] Sprawdzenie inventory availability (warning, nie block)
- [ ] Status: draft -> confirmed
- [ ] Po confirmation: edycja linii zablokowana
- [ ] Cancel jeszcze mozliwy

**Technical Notes:**
- Availability check: SUM(LP qty) WHERE product, warehouse, qa_status=passed

**Priority:** Must Have
**Estimate:** S

---

#### Story 7.5: SO Available-to-Promise (ATP)
**Jako** Shipping Manager
**Chce** widziec dostepnosc produktow przy tworzeniu SO
**Aby** obiecac realistyczne daty

**Acceptance Criteria:**
- [ ] Przy dodawaniu linii: pokaz available qty
- [ ] Warning jezeli requested > available
- [ ] Include pending receipts (opcjonalnie)
- [ ] Exclude reserved for other SO

**Technical Notes:**
- ATP calculation: stock - reserved + incoming
- Tabela so_reservations lub soft reservation

**Priority:** Should Have
**Estimate:** M

---

### 2.2 FEFO Picking (First Expired First Out)

#### Story 7.6: FEFO Strategy Implementation
**Jako** System
**Chce** wybierac LP z najkrotszym shelf life
**Aby** minimalizowac przeterminowanie

**Acceptance Criteria:**
- [ ] Pick list sugeruje LP w kolejnosci: najblizsza expiry_date
- [ ] LP z expiry_date = null na koncu
- [ ] Uwzglednia tylko LP z qa_status = passed
- [ ] Uwzglednia tylko LP z qty >= requested
- [ ] Setting: default_picking_strategy = 'fefo'

**Technical Notes:**
```sql
SELECT lp.* FROM license_plates lp
WHERE lp.product_id = :product_id
  AND lp.warehouse_id = :warehouse_id
  AND lp.qa_status = 'passed'
  AND lp.status = 'available'
  AND lp.quantity >= :required_qty
ORDER BY lp.expiry_date ASC NULLS LAST, lp.created_at ASC
LIMIT 1;
```

**Priority:** Must Have
**Estimate:** L

---

#### Story 7.7: FIFO Strategy Implementation
**Jako** System
**Chce** wybierac LP w kolejnosci przyjecia
**Aby** stosowac standardowe FIFO

**Acceptance Criteria:**
- [ ] Pick list sugeruje LP w kolejnosci created_at (oldest first)
- [ ] Uwzglednia tylko LP z qa_status = passed
- [ ] Setting: default_picking_strategy = 'fifo'

**Technical Notes:**
- ORDER BY created_at ASC

**Priority:** Must Have
**Estimate:** S

---

#### Story 7.8: Expiry Date Display
**Jako** Picker
**Chce** widziec expiry date na pick list
**Aby** weryfikowac czy produkt jest wazny

**Acceptance Criteria:**
- [ ] Kolumna Expiry Date na pick list
- [ ] Warning color dla LP blisko expiry (< X dni)
- [ ] Block picking expired LP (expiry_date < today)
- [ ] Setting: days_before_expiry_warning (default: 7)

**Technical Notes:**
- Rozszerzyc pick_items o expiry_date z LP
- UI: color coding

**Priority:** Must Have
**Estimate:** S

---

#### Story 7.9: Minimum Remaining Shelf Life
**Jako** Admin
**Chce** konfigurowac minimalny shelf life dla wysylki
**Aby** nie wysylac produktow bliskich przeterminowaniu

**Acceptance Criteria:**
- [ ] Setting per product lub global: min_remaining_shelf_life_days
- [ ] Pick list wyklucza LP z remaining shelf life < minimum
- [ ] Override dla managera z logowaniem
- [ ] Alert jezeli brak LP spelniajacych kryterium

**Technical Notes:**
- Pole min_shelf_life_days na product lub shipping_settings
- Check w pick list generation

**Priority:** Should Have
**Estimate:** M

---

### 2.3 Pick List Optimization

#### Story 7.10: Pick List Generation
**Jako** Shipping Manager
**Chce** generowac pick list z SO lub shipment
**Aby** przekazac pickersowi co pobrac

**Acceptance Criteria:**
- [ ] Przycisk "Generate Pick List" na SO/Shipment
- [ ] Pick list zawiera: product, qty, location, suggested LP
- [ ] Sortowanie po location (optymalizacja trasy)
- [ ] Automatyczny numer PK-YYYY-NNNN
- [ ] Status: pending

**Technical Notes:**
- Service: generatePickList(soId | shipmentId)
- Tabele: pick_lists, pick_items

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.11: Pick List Location Grouping
**Jako** Picker
**Chce** miec pick list pogrupowany po lokalizacji
**Aby** minimalizowac chodzenie

**Acceptance Criteria:**
- [ ] Grupowanie items po from_location_id
- [ ] Sortowanie grup: zone -> aisle -> rack -> level
- [ ] Opcja: print per location group

**Technical Notes:**
- ORDER BY location.zone, location.aisle, location.rack, location.level

**Priority:** Should Have
**Estimate:** S

---

#### Story 7.12: Batch Picking (Multiple Orders)
**Jako** Picker
**Chce** zbierac produkty dla wielu zamowien naraz
**Aby** zwiekszyc efektywnosc

**Acceptance Criteria:**
- [ ] Grupuj items z wielu SO po produkcie
- [ ] Pick raz, sort later
- [ ] Setting: enable_batch_picking
- [ ] Batch pick list z source orders

**Technical Notes:**
- Aggregacja pick_items po product_id
- Dodatkowe pole: source_so_ids

**Priority:** Could Have
**Estimate:** L

---

#### Story 7.13: Pick Assignment
**Jako** Warehouse Supervisor
**Chce** przypisac pick list do pickera
**Aby** rozdzielic prace

**Acceptance Criteria:**
- [ ] Pole assigned_to na pick list
- [ ] Picker widzi tylko swoje pick listy
- [ ] Supervisor widzi wszystkie
- [ ] Reassignment mozliwy

**Technical Notes:**
- Filter w API: ?assigned_to=me

**Priority:** Should Have
**Estimate:** S

---

#### Story 7.14: Pick Short Handling
**Jako** Picker
**Chce** zglosic brak towaru (short)
**Aby** kontynuowac picking mimo brakow

**Acceptance Criteria:**
- [ ] Oznacz item jako "short" z reason
- [ ] Partial pick mozliwy (picked_qty < required_qty)
- [ ] Notification do supervisora
- [ ] SO line updated z actual picked
- [ ] Backorder creation (opcjonalnie)

**Technical Notes:**
- Status: pending, picked, short
- Trigger notyfikacji

**Priority:** Must Have
**Estimate:** M

---

### 2.4 Packing Workflow

#### Story 7.15: Pack Station UI
**Jako** Packer
**Chce** miec dedykowany ekran pakowania
**Aby** efektywnie pakowac zamowienia

**Acceptance Criteria:**
- [ ] Wybor shipment do pakowania
- [ ] Lista items do spakowania
- [ ] Tworzenie packages
- [ ] Scan items do package
- [ ] Close package

**Technical Notes:**
- Route: /shipping/pack-station
- Komponent PackStation

**Priority:** Should Have
**Estimate:** L

---

#### Story 7.16: Package Creation
**Jako** Packer
**Chce** tworzyc paczki dla wysylki
**Aby** grupowac produkty logicznie

**Acceptance Criteria:**
- [ ] Przycisk "New Package"
- [ ] Package type (box, pallet, etc.)
- [ ] Automatyczny numer PCK-YYYY-NNNN
- [ ] Status: packing

**Technical Notes:**
- Tabela packages (juz w 07-shipping.md)

**Priority:** Should Have
**Estimate:** S

---

#### Story 7.17: Package Item Tracking
**Jako** Packer
**Chce** rejestrowac co jest w kazdej paczce
**Aby** miec pelna traceability

**Acceptance Criteria:**
- [ ] Scan LP -> dodaj do package
- [ ] Walidacja: LP jest w shipment
- [ ] Walidacja: LP jeszcze nie packed
- [ ] Lista items in package
- [ ] Remove item from package

**Technical Notes:**
- Tabela package_items
- Check: lp_id IN (shipment_items WHERE shipment_id = X)

**Priority:** Should Have
**Estimate:** M

---

#### Story 7.18: Package Weight Recording
**Jako** Packer
**Chce** zapisac wage paczki
**Aby** ulatwic wysylke

**Acceptance Criteria:**
- [ ] Pole weight_kg na package
- [ ] Input manualny lub z wagi (future)
- [ ] Dimensions (L x W x H) opcjonalnie
- [ ] Total shipment weight calculated

**Technical Notes:**
- Pola weight_kg, dimensions na packages

**Priority:** Should Have
**Estimate:** S

---

#### Story 7.19: Package Complete
**Jako** Packer
**Chce** zamknac paczke
**Aby** oznaczyc jako gotowa do wysylki

**Acceptance Criteria:**
- [ ] Przycisk "Close Package"
- [ ] Status: packing -> packed
- [ ] packed_by, packed_at zapisane
- [ ] Cannot add more items after close
- [ ] Can reopen if needed (supervisor only)

**Technical Notes:**
- Status update w packages
- Permission check dla reopen

**Priority:** Should Have
**Estimate:** S

---

### 2.5 Carrier Integration Basics

#### Story 7.20: Carrier Configuration
**Jako** Admin
**Chce** konfigurowac przewoznikow
**Aby** miec ich dostepnych przy wysylce

**Acceptance Criteria:**
- [ ] Lista carriers: name, code, tracking_url_template
- [ ] Default carrier w settings
- [ ] Active/inactive status
- [ ] Basic CRUD

**Technical Notes:**
```sql
CREATE TABLE carriers (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    tracking_url_template VARCHAR(500),
    is_active BOOLEAN DEFAULT true
);
```

**Priority:** Should Have
**Estimate:** M

---

#### Story 7.21: Tracking Number Entry
**Jako** Shipping Manager
**Chce** wpisac tracking number dla wysylki
**Aby** udostepnic go klientowi

**Acceptance Criteria:**
- [ ] Pole tracking_number na shipment
- [ ] Pole carrier na shipment
- [ ] Tracking URL generated z template
- [ ] Link do tracking page

**Technical Notes:**
- tracking_url = template.replace('{tracking}', tracking_number)

**Priority:** Must Have
**Estimate:** S

---

#### Story 7.22: Ship Confirmation
**Jako** Shipping Manager
**Chce** potwierdzic wyslanie shipmentu
**Aby** oznaczyc jako wyslane

**Acceptance Criteria:**
- [ ] Przycisk "Ship" na shipment
- [ ] Wymagane: tracking number (lub override)
- [ ] Status: packed -> shipped
- [ ] SO status update: shipped
- [ ] LP status: consumed/shipped
- [ ] Timestamp: shipped_at

**Technical Notes:**
- Transakcja: update shipment, SO, LPs
- Email notification (opcjonalnie)

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.23: Delivery Confirmation (POD)
**Jako** Shipping Manager
**Chce** potwierdzic dostarczenie
**Aby** zamknac cykl wysylki

**Acceptance Criteria:**
- [ ] Status: shipped -> delivered
- [ ] pod_date, pod_signature (opcjonalnie)
- [ ] SO status: delivered
- [ ] Completion timestamp

**Technical Notes:**
- Pola pod_date, pod_signature na shipments
- Optional signature capture (future)

**Priority:** Should Have
**Estimate:** S

---

### 2.6 Shipping Documents

#### Story 7.24: Pick List Document
**Jako** Picker
**Chce** wydrukowac pick list
**Aby** miec papierowa wersje do zbierania

**Acceptance Criteria:**
- [ ] Print button na pick list
- [ ] Format: header + items table
- [ ] Zawiera: product, qty, location, LP
- [ ] Miejsce na podpis pickera
- [ ] QR code do pick list ID

**Technical Notes:**
- PDF generation lub print CSS
- Route: /api/shipping/pick-lists/:id/print

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.25: Packing Slip Document
**Jako** Packer
**Chce** generowac packing slip
**Aby** wlozyc do paczki dla klienta

**Acceptance Criteria:**
- [ ] Dane shipment: number, date
- [ ] Customer info, ship-to address
- [ ] Lista produktow: name, qty, lot/batch
- [ ] Packages count, total weight
- [ ] Company logo/header

**Technical Notes:**
- PDF generation
- Template w settings (future)

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.26: Shipping Label (ZPL)
**Jako** Packer
**Chce** drukowac etykiety wysylkowe
**Aby** nakleic na paczki

**Acceptance Criteria:**
- [ ] Print button per package
- [ ] Format ZPL dla Zebra
- [ ] Zawiera: ship-to address, tracking barcode
- [ ] From address
- [ ] Package number, weight

**Technical Notes:**
- ZPL template generation
- Integration z print service (BUG-001/002)

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.27: GS1-128 Shipping Label (SSCC)
**Jako** Shipping Manager
**Chce** generowac etykiety zgodne z GS1-128
**Aby** spelniac wymagania sieci handlowych

**Acceptance Criteria:**
- [ ] SSCC (Serial Shipping Container Code) generation
- [ ] GS1-128 barcode na etykiecie
- [ ] AI codes: 00 (SSCC), 02 (GTIN), 37 (qty), 10 (lot)
- [ ] Human-readable + barcode

**Technical Notes:**
- SSCC: 18 digits (extension + company prefix + serial + check)
- GS1-128 encoding library

**Priority:** Should Have (Epic 10)
**Estimate:** L

---

#### Story 7.28: Bill of Lading (BOL)
**Jako** Shipping Manager
**Chce** generowac Bill of Lading
**Aby** miec dokument przewozowy

**Acceptance Criteria:**
- [ ] Shipper, consignee, carrier info
- [ ] Lista items z qty i weight
- [ ] Terms and conditions
- [ ] Signature lines
- [ ] Print/PDF

**Technical Notes:**
- Setting: enable_bill_of_lading (default: false)
- PDF template

**Priority:** Could Have
**Estimate:** M

---

### 2.7 Scanner Picking Workflow

#### Story 7.29: Scanner Pick List Selection
**Jako** Picker
**Chce** wybrac pick list na scannerze
**Aby** rozpoczac picking

**Acceptance Criteria:**
- [ ] Scan pick list barcode LUB
- [ ] Lista assigned pick lists
- [ ] Pokaz: SO number, items count, priority
- [ ] Start picking button

**Technical Notes:**
- Route: /scanner/shipping/pick
- Filter: assigned_to = current_user

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.30: Scanner Pick Item
**Jako** Picker
**Chce** skanowac items podczas pickingu
**Aby** potwierdzac pobranie

**Acceptance Criteria:**
- [ ] Pokaz: product, qty, location, suggested LP
- [ ] Navigate to location
- [ ] Scan LP barcode
- [ ] Validate: product match, QA passed, sufficient qty
- [ ] Confirm picked qty
- [ ] Next item lub complete

**Technical Notes:**
- Krok po kroku workflow
- Validation errors z clear message

**Priority:** Must Have
**Estimate:** L

---

#### Story 7.31: Scanner Pick Validation
**Jako** Picker
**Chce** aby scanner walidowal moje picks
**Aby** uniknac bledow

**Acceptance Criteria:**
- [ ] Product mismatch: error + sound
- [ ] QA status != passed: error
- [ ] Expiry date < today: error
- [ ] Qty insufficient: warning, partial pick option
- [ ] Wrong location: warning (allow override)

**Technical Notes:**
- Validation rules w service layer
- Audio feedback (beep)

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.32: Scanner Pick Alternative LP
**Jako** Picker
**Chce** wybrac inny LP niz sugerowany
**Aby** obsluzyc sytuacje gdy sugerowany niedostepny

**Acceptance Criteria:**
- [ ] Przycisk "Select Alternative"
- [ ] Lista dostepnych LP dla produktu
- [ ] Sortowanie FEFO/FIFO
- [ ] Wybor i scan
- [ ] Log odchylenia od sugestii

**Technical Notes:**
- Query available LPs
- Audit log: suggested vs actual

**Priority:** Should Have
**Estimate:** M

---

#### Story 7.33: Scanner Pick Complete
**Jako** Picker
**Chce** zakonczyc pick list
**Aby** przekazac do pakowania

**Acceptance Criteria:**
- [ ] Summary: picked items, shorts
- [ ] Confirm completion
- [ ] Status: pending -> completed
- [ ] Notification do packing
- [ ] Print summary (opcjonalnie)

**Technical Notes:**
- Update pick_lists.status, completed_at
- Trigger notification

**Priority:** Must Have
**Estimate:** S

---

### 2.8 Scanner Packing Workflow

#### Story 7.34: Scanner Pack Station
**Jako** Packer
**Chce** pakowac na scannerze
**Aby** pracowac mobilnie

**Acceptance Criteria:**
- [ ] Scan shipment number
- [ ] Pokaz items do spakowania
- [ ] Create package button
- [ ] Scan items do package
- [ ] Complete package

**Technical Notes:**
- Route: /scanner/shipping/pack
- Similar to desktop pack station

**Priority:** Should Have
**Estimate:** L

---

#### Story 7.35: Scanner Pack Validation
**Jako** Packer
**Chce** aby scanner walidowal pakowanie
**Aby** uniknac bledow

**Acceptance Criteria:**
- [ ] LP not in shipment: error
- [ ] LP already packed: error
- [ ] QA status != passed: error
- [ ] Success: add to package, sound

**Technical Notes:**
- Validation w service layer

**Priority:** Should Have
**Estimate:** M

---

### 2.9 Shipping Reports & Dashboard

#### Story 7.36: Open Orders Report
**Jako** Shipping Manager
**Chce** widziec liste otwartych zamowien
**Aby** planowac prace

**Acceptance Criteria:**
- [ ] Lista SO: confirmed, picking, packed (not shipped)
- [ ] Filtry: date range, priority, customer
- [ ] Sortowanie: requested_date, priority
- [ ] Export: Excel, PDF

**Technical Notes:**
- Route: /shipping/reports/open-orders
- API: /api/shipping/reports/open-orders

**Priority:** Must Have
**Estimate:** M

---

#### Story 7.37: Shipping Performance Report
**Jako** Shipping Manager
**Chce** analizowac wydajnosc wysylek
**Aby** identyfikowac problemy

**Acceptance Criteria:**
- [ ] On-time delivery rate (%)
- [ ] Average fulfillment time (order to ship)
- [ ] Pick accuracy (%)
- [ ] Backorder rate (%)
- [ ] Trend charts

**Technical Notes:**
- Agregacje z so_header, shipments, pick_shorts

**Priority:** Should Have
**Estimate:** M

---

#### Story 7.38: Backorder Management
**Jako** Shipping Manager
**Chce** zarzadzac backorderami
**Aby** sledzic niezrealizowane zamowienia

**Acceptance Criteria:**
- [ ] Lista SO z niezrealizowanymi liniami
- [ ] Link do oryginalnego SO
- [ ] Priority flag
- [ ] Release when stock available

**Technical Notes:**
- Backorder = SO line z shipped_qty < quantity
- Lub osobna tabela backorders

**Priority:** Should Have
**Estimate:** M

---

### 2.10 Shipping Settings

#### Story 7.39: Shipping Settings Page
**Jako** Admin
**Chce** konfigurowac ustawienia shipping
**Aby** dostosowac do procesow firmy

**Acceptance Criteria:**
- [ ] Strona /settings/shipping
- [ ] Wszystkie settings z tabeli shipping_settings
- [ ] Save z walidacja
- [ ] Reset to defaults

**Technical Notes:**
- Route i komponent SettingsShipping
- API GET/PUT /api/shipping/settings

**Priority:** Must Have
**Estimate:** M

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 7.1 | SO Creation | Must | M | PLANNED |
| 7.2 | SO Lines Management | Must | M | PLANNED |
| 7.3 | SO Status Tracking | Must | M | PLANNED |
| 7.4 | SO Confirmation | Must | S | PLANNED |
| 7.5 | SO ATP | Should | M | PLANNED |
| 7.6 | FEFO Strategy | Must | L | PLANNED |
| 7.7 | FIFO Strategy | Must | S | PLANNED |
| 7.8 | Expiry Date Display | Must | S | PLANNED |
| 7.9 | Min Remaining Shelf Life | Should | M | PLANNED |
| 7.10 | Pick List Generation | Must | M | PLANNED |
| 7.11 | Pick List Location Grouping | Should | S | PLANNED |
| 7.12 | Batch Picking | Could | L | PLANNED |
| 7.13 | Pick Assignment | Should | S | PLANNED |
| 7.14 | Pick Short Handling | Must | M | PLANNED |
| 7.15 | Pack Station UI | Should | L | PLANNED |
| 7.16 | Package Creation | Should | S | PLANNED |
| 7.17 | Package Item Tracking | Should | M | PLANNED |
| 7.18 | Package Weight | Should | S | PLANNED |
| 7.19 | Package Complete | Should | S | PLANNED |
| 7.20 | Carrier Configuration | Should | M | PLANNED |
| 7.21 | Tracking Number Entry | Must | S | PLANNED |
| 7.22 | Ship Confirmation | Must | M | PLANNED |
| 7.23 | Delivery Confirmation | Should | S | PLANNED |
| 7.24 | Pick List Document | Must | M | PLANNED |
| 7.25 | Packing Slip Document | Must | M | PLANNED |
| 7.26 | Shipping Label (ZPL) | Must | M | PLANNED |
| 7.27 | GS1-128 Shipping Label | Should | L | PLANNED |
| 7.28 | Bill of Lading | Could | M | PLANNED |
| 7.29 | Scanner Pick List Selection | Must | M | PLANNED |
| 7.30 | Scanner Pick Item | Must | L | PLANNED |
| 7.31 | Scanner Pick Validation | Must | M | PLANNED |
| 7.32 | Scanner Pick Alternative LP | Should | M | PLANNED |
| 7.33 | Scanner Pick Complete | Must | S | PLANNED |
| 7.34 | Scanner Pack Station | Should | L | PLANNED |
| 7.35 | Scanner Pack Validation | Should | M | PLANNED |
| 7.36 | Open Orders Report | Must | M | PLANNED |
| 7.37 | Shipping Performance Report | Should | M | PLANNED |
| 7.38 | Backorder Management | Should | M | PLANNED |
| 7.39 | Shipping Settings Page | Must | M | PLANNED |

**Totals:**
- Must Have: 19 stories
- Should Have: 17 stories
- Could Have: 3 stories
- **Total:** 39 stories

---

## 4. Database Schema (Additional)

### 4.1 customers (new table)
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    customer_number VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, customer_number)
);
```

### 4.2 carriers
```sql
CREATE TABLE carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    tracking_url_template VARCHAR(500),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);
```

### 4.3 pick_list_shorts (tracking shorts)
```sql
CREATE TABLE pick_shorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    pick_item_id UUID NOT NULL REFERENCES pick_items(id),
    short_qty NUMERIC(15,4) NOT NULL,
    reason VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

### 4.4 so_reservations (soft reservation for ATP)
```sql
CREATE TABLE so_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    so_line_id UUID NOT NULL REFERENCES so_line(id),
    lp_id UUID NOT NULL REFERENCES license_plates(id),
    reserved_qty NUMERIC(15,4) NOT NULL,
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' -- active, picked, released
);
```

---

## 5. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| SH-FR-01: Create sales orders | 7.1, 7.2 | Order management |
| SH-FR-02: Track SO status | 7.3, 7.4 | Visibility |
| SH-FR-03: ATP calculation | 7.5 | Promise accuracy |
| FEFO-01: FEFO picking strategy | 7.6, 7.8 | Minimize waste |
| FEFO-02: Min shelf life check | 7.9 | Customer satisfaction |
| PICK-01: Generate pick lists | 7.10, 7.11 | Efficient picking |
| PICK-02: Handle shorts | 7.14 | Exception handling |
| PACK-01: Pack station workflow | 7.15-7.19 | Efficient packing |
| CARRIER-01: Carrier management | 7.20, 7.21 | Shipping logistics |
| SHIP-01: Ship confirmation | 7.22, 7.23 | Process completion |
| DOC-01: Shipping documents | 7.24-7.28 | Documentation |
| SCAN-01: Scanner picking | 7.29-7.33 | Mobile efficiency |
| SCAN-02: Scanner packing | 7.34-7.35 | Mobile efficiency |
| REPORT-01: Shipping reports | 7.36-7.38 | Analytics |

---

## 6. Dependencies

### 6.1 From Other Modules
- **Epic 1 (Settings):** Warehouses, locations, users
- **Epic 5 (Warehouse):** LP table, stock data
- **Epic 6 (Quality):** QA status validation
- **Epic 2 (Technical):** Products

### 6.2 To Other Modules
- **Epic 10 (GS1):** GS1-128 label generation

---

## 7. Picking Strategies Comparison

| Strategy | Use Case | Algorithm | When to Use |
|----------|----------|-----------|-------------|
| **FEFO** | Perishables | Sort by expiry_date ASC | Food, pharma |
| **FIFO** | Standard | Sort by created_at ASC | Non-perishable |
| **Zone** | Large warehouse | Group by zone first | Multi-zone warehouse |
| **Batch** | High volume | Group by product | Many similar orders |
| **Manual** | Special cases | User selects LP | Customer-specific lot |

---

## 8. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FEFO complexity | Medium | Medium | Start with basic, iterate |
| Pick accuracy | Medium | High | Scanner validation, training |
| Label printing (BUG-001/002) | High | High | Must fix before shipping |
| Backorder management | Low | Medium | Clear UI, alerts |

---

## 9. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Shipping PRD |
| 2.0 | 2025-12-09 | PM-Agent | Enhanced with FEFO, pick optimization |
