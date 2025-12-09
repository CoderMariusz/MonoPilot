# Shipping Module PRD

**Status:** PLANNED (Epic 7 - Phase 2)
**Priority:** P1 - Important Module
**Epic:** 7
**Stories:** 28 (estimated)
**Phase:** MVP Phase 2

---

## 1. Overview

### 1.1 Cel Modulu
Modul Shipping odpowiada za logistyke wychodzaca - planowanie wysylek, picking, packing i dostawy. Obsluguje zamowienia sprzedazy, integracje z przewoznikami i dokumentacje wysylkowa.

### 1.2 Value Proposition
- **Problem:** Brak zintegrowanego systemu wysylkowego z traceability LP
- **Rozwiazanie:** SO-based shipping z FIFO/FEFO picking, pack station i dokumentacja
- **Korzysc:** Efektywna realizacja zamowien, pelna traceability od produkcji do klienta

### 1.3 Key Concepts
- **Sales Order (SO):** Zamowienie klienta do realizacji
- **Shipment:** Grupa pozycji do wyslania razem
- **Pick List:** Lista pozycji do pobrania z magazynu
- **Package:** Paczka do wyslania
- **Picking Strategy:** FIFO, FEFO, Zone, Batch

### 1.4 Dependencies
- **Wymaga:** Settings (warehouses, locations), Technical (products), Warehouse (LP), Quality (QA status)
- **Wymagany przez:** (zewnetrzne systemy ERP/e-commerce)

---

## 2. User Roles & Permissions

| Rola | Uprawnienia |
|------|-------------|
| **Picker** | View pick lists, Execute picks, Handle shorts |
| **Packer** | Pack items, Print labels, Close packages |
| **Shipping Manager** | + Create SO, Create shipments, Ship, View reports |
| **Admin** | + Configure shipping settings |

---

## 3. Settings Configuration

**Route:** `/settings/shipping`

### 3.1 General Settings

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `enable_shipping_module` | toggle | On | Wlacz modul shipping |
| `shipping_mode` | enum | sales_order | sales_order (use SO), direct_ship (bez SO) |
| `require_qa_passed` | toggle | On | Tylko LP z QA passed moga byc wysylane |
| `enable_partial_shipment` | toggle | On | Pozwol na czesciowe wysylki |
| `enable_backorder` | toggle | On | Tworz backorder dla brakow |

### 3.2 Picking Settings

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `default_picking_strategy` | enum | fifo | fifo, fefo, zone, batch, manual |
| `enable_wave_picking` | toggle | Off | Grupuj picks w wave |
| `enable_zone_picking` | toggle | Off | Pick by warehouse zone |
| `enable_batch_picking` | toggle | Off | Batch similar items |

### 3.3 Packing Settings

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `enable_pack_station` | toggle | On | Wlacz workflow pakowania |
| `enable_shipping_labels` | toggle | On | Drukuj etykiety wysylkowe |
| `enable_packing_slip` | toggle | On | Drukuj packing slip |
| `enable_bill_of_lading` | toggle | Off | Generuj BOL |

### 3.4 Carrier Settings

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `enable_carrier_integration` | toggle | Off | Integracja z przewoznikami (Phase 3) |
| `default_carrier` | string | null | Domyslny przewoznik |
| `auto_generate_tracking` | toggle | Off | Auto-generuj tracking numbers |
| `enable_proof_of_delivery` | toggle | Off | POD signature capture |

---

## 4. Core Entities

### 4.1 Sales Order (SO) Header

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `so_number` | string | Yes | Unikalny identyfikator SO |
| `customer_id` | FK | Yes | Referencja klienta |
| `order_date` | date | Yes | Data zamowienia |
| `requested_date` | date | Yes | Oczekiwana data dostawy |
| `promised_date` | date | No | Obiecana data dostawy |
| `ship_to_address` | text | Yes | Adres dostawy |
| `warehouse_id` | FK | Yes | Magazyn wysylkowy |
| `status` | enum | Yes | draft, confirmed, picking, packed, shipped, delivered, cancelled |
| `priority` | enum | No | low, normal, high, urgent |
| `shipping_method` | string | No | Metoda wysylki |
| `carrier` | string | No | Przewoznik |
| `notes` | text | No | Notatki |
| `total_value` | decimal | No | Wartosc zamowienia |

### 4.2 SO Line

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `product_id` | FK | Yes | Produkt |
| `quantity` | decimal | Yes | Zamowiona ilosc |
| `uom` | string | Yes | Jednostka |
| `picked_qty` | decimal | Yes | Ilosc pobrana |
| `shipped_qty` | decimal | Yes | Ilosc wyslana |
| `unit_price` | decimal | No | Cena jednostkowa |
| `line_status` | enum | Yes | pending, picking, packed, shipped |
| `notes` | text | No | Notatki |

### 4.3 SO Status Lifecycle

```
draft --> confirmed (potwierdzenie klienta)
      --> picking (start picking)
      --> packed (gotowe do wysylki)
      --> shipped (wyslane)
      --> delivered (POD received)
      --> cancelled

Partial: Jesli czesciowa wysylka, tworzy backorder SO
```

### 4.4 Shipment

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `shipment_number` | string | Yes | Unikalny identyfikator |
| `warehouse_id` | FK | Yes | Magazyn |
| `ship_date` | datetime | Yes | Planowana data wysylki |
| `status` | enum | Yes | draft, picking, packed, shipped, delivered |
| `carrier` | string | No | Przewoznik |
| `tracking_number` | string | No | Nr sledzenia |
| `weight_kg` | decimal | No | Waga calkowita |
| `package_count` | integer | No | Liczba paczek |
| `shipping_cost` | decimal | No | Koszt wysylki |
| `pod_date` | datetime | No | Data POD |
| `pod_signature` | string | No | Podpis POD |

### 4.5 Pick List

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `pick_number` | string | Yes | Unikalny identyfikator |
| `shipment_id` | FK | No | Powiazana wysylka |
| `so_id` | FK | No | Powiazane SO |
| `warehouse_id` | FK | Yes | Magazyn |
| `status` | enum | Yes | pending, in_progress, completed, cancelled |
| `assigned_to` | FK | No | Przypisany picker |
| `priority` | enum | No | Priorytet |
| `started_at` | datetime | No | Kiedy rozpoczeto |
| `completed_at` | datetime | No | Kiedy zakonczono |

### 4.6 Pick Item

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `pick_id` | FK | Yes | Parent pick |
| `so_line_id` | FK | Yes | Linia SO |
| `product_id` | FK | Yes | Produkt |
| `required_qty` | decimal | Yes | Ilosc do pobrania |
| `picked_qty` | decimal | Yes | Ilosc pobrana |
| `from_location_id` | FK | Yes | Lokalizacja pobrania |
| `lp_id` | FK | No | Sugerowane LP |
| `status` | enum | Yes | pending, picked, short |

### 4.7 Package

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `pack_number` | string | Yes | Unikalny identyfikator |
| `shipment_id` | FK | Yes | Powiazana wysylka |
| `package_type` | string | No | Typ opakowania |
| `weight_kg` | decimal | No | Waga paczki |
| `dimensions` | string | No | L x W x H |
| `tracking_number` | string | No | Nr sledzenia paczki |
| `status` | enum | Yes | packing, packed, shipped |
| `packed_by` | FK | Yes | Kto pakowal |
| `packed_at` | datetime | No | Kiedy zapakowano |

---

## 5. Workflows

### 5.1 Sales Order Workflow

```
1. Create SO
   - Select customer
   - Add lines (product, qty, price)
   - Set requested date
   - Set priority

2. Confirm SO
   - Validate inventory availability (warning)
   - Status --> confirmed

3. Create Shipment
   - Group SO lines into shipment
   - Schedule ship date

4. Generate Pick List
   - Calculate suggested LPs (FIFO/FEFO)
   - Group by location

5. Execute Pick
   - Assign picker
   - Pick items (scanner)
   - Handle shorts

6. Pack
   - Scan items into packages
   - Weigh packages
   - Print labels

7. Ship
   - Enter tracking number
   - Mark as shipped
   - Send notification

8. Deliver
   - Capture POD (optional)
   - Mark as delivered
```

### 5.2 Picking Strategies

| Strategy | Opis | Use Case |
|----------|------|----------|
| **FIFO** | First In First Out | Standard inventory |
| **FEFO** | First Expiry First Out | Perishables |
| **Zone** | Pick by warehouse zone | Large warehouse |
| **Batch** | Group similar items | High volume |
| **Manual** | User selects LP | Special requirements |

### 5.3 Scanner Pick Workflow

```
Step 1: Select Pick List
        - Scan pick number OR
        - Select from assigned list
        - Show pick summary

Step 2: Pick Items (repeat for each)
        - Show: Product, Qty, Location
        - Navigate to location
        - Scan LP barcode
        - Validate: Product, QA Status, Qty
        - Enter picked qty (default: required)
        - Confirm

Step 3: Handle Shorts
        - If LP not available
        - Mark as short OR
        - Select alternative LP
        - Continue

Step 4: Complete Pick
        - Review picked items
        - Confirm completion
        - Print summary
        - Ready for packing
```

### 5.4 Scanner Pack Workflow

```
Step 1: Select Shipment
        - Scan shipment number
        - Show items to pack

Step 2: Create Package
        - Select package type
        - Start scanning items

Step 3: Scan Items
        - Scan LP
        - Validate against shipment
        - Add to package
        - Continue until complete

Step 4: Complete Package
        - Enter weight
        - Print shipping label
        - Close package

Step 5: Complete Shipment
        - All packages done
        - Print packing slip
        - Mark as shipped
        - Enter tracking number
```

---

## 6. Database Tables

### 6.1 so_header
```sql
CREATE TABLE so_header (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    so_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    requested_date DATE NOT NULL,
    promised_date DATE,
    ship_to_address TEXT NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'normal',
    shipping_method VARCHAR(50),
    carrier VARCHAR(100),
    notes TEXT,
    total_value NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, so_number)
);
```

### 6.2 so_line
```sql
CREATE TABLE so_line (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    so_id UUID NOT NULL REFERENCES so_header(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    picked_qty NUMERIC(15,4) DEFAULT 0,
    shipped_qty NUMERIC(15,4) DEFAULT 0,
    unit_price NUMERIC(15,4),
    line_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT
);
```

### 6.3 shipments
```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    shipment_number VARCHAR(50) NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    ship_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    weight_kg NUMERIC(10,2),
    package_count INTEGER,
    shipping_cost NUMERIC(15,2),
    pod_date TIMESTAMPTZ,
    pod_signature VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, shipment_number)
);
```

### 6.4 shipment_items
```sql
CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    so_line_id UUID NOT NULL REFERENCES so_line(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(15,4) NOT NULL,
    lp_id UUID REFERENCES license_plates(id),
    pallet_id UUID REFERENCES pallets(id)
);
```

### 6.5 pick_lists
```sql
CREATE TABLE pick_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    pick_number VARCHAR(50) NOT NULL,
    shipment_id UUID REFERENCES shipments(id),
    so_id UUID REFERENCES so_header(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES auth.users(id),
    priority VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(org_id, pick_number)
);
```

### 6.6 pick_items
```sql
CREATE TABLE pick_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pick_id UUID NOT NULL REFERENCES pick_lists(id),
    so_line_id UUID NOT NULL REFERENCES so_line(id),
    product_id UUID NOT NULL REFERENCES products(id),
    required_qty NUMERIC(15,4) NOT NULL,
    picked_qty NUMERIC(15,4) DEFAULT 0,
    from_location_id UUID NOT NULL REFERENCES locations(id),
    lp_id UUID REFERENCES license_plates(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
);
```

### 6.7 packages
```sql
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    pack_number VARCHAR(50) NOT NULL,
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    package_type VARCHAR(50),
    weight_kg NUMERIC(10,2),
    dimensions VARCHAR(50),
    tracking_number VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'packing',
    packed_by UUID REFERENCES auth.users(id),
    packed_at TIMESTAMPTZ,
    UNIQUE(org_id, pack_number)
);
```

### 6.8 package_items
```sql
CREATE TABLE package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id UUID NOT NULL REFERENCES packages(id),
    lp_id UUID NOT NULL REFERENCES license_plates(id),
    quantity NUMERIC(15,4) NOT NULL
);
```

### 6.9 shipping_settings
```sql
CREATE TABLE shipping_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    enable_shipping_module BOOLEAN DEFAULT true,
    shipping_mode VARCHAR(20) DEFAULT 'sales_order',
    require_qa_passed BOOLEAN DEFAULT true,
    enable_partial_shipment BOOLEAN DEFAULT true,
    enable_backorder BOOLEAN DEFAULT true,
    default_picking_strategy VARCHAR(20) DEFAULT 'fifo',
    enable_wave_picking BOOLEAN DEFAULT false,
    enable_zone_picking BOOLEAN DEFAULT false,
    enable_batch_picking BOOLEAN DEFAULT false,
    enable_pack_station BOOLEAN DEFAULT true,
    enable_shipping_labels BOOLEAN DEFAULT true,
    enable_packing_slip BOOLEAN DEFAULT true,
    enable_bill_of_lading BOOLEAN DEFAULT false,
    enable_carrier_integration BOOLEAN DEFAULT false,
    default_carrier VARCHAR(100),
    auto_generate_tracking BOOLEAN DEFAULT false,
    enable_proof_of_delivery BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. API Endpoints

### 7.1 Sales Orders
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/shipping/sales-orders` | Lista SO z filtrami |
| GET | `/api/shipping/sales-orders/:id` | Szczegoly SO |
| POST | `/api/shipping/sales-orders` | Utworz SO |
| PUT | `/api/shipping/sales-orders/:id` | Aktualizuj SO |
| POST | `/api/shipping/sales-orders/:id/confirm` | Potwierdz SO |
| POST | `/api/shipping/sales-orders/:id/cancel` | Anuluj SO |

### 7.2 Shipments
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/shipping/shipments` | Lista wysylek |
| GET | `/api/shipping/shipments/:id` | Szczegoly wysylki |
| POST | `/api/shipping/shipments` | Utworz wysylke |
| PUT | `/api/shipping/shipments/:id` | Aktualizuj wysylke |
| POST | `/api/shipping/shipments/:id/ship` | Oznacz jako wyslane |
| POST | `/api/shipping/shipments/:id/deliver` | Oznacz jako dostarczone |

### 7.3 Pick Lists
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/shipping/pick-lists` | Lista pick lists |
| GET | `/api/shipping/pick-lists/:id` | Szczegoly pick |
| POST | `/api/shipping/pick-lists` | Generuj pick list |
| PUT | `/api/shipping/pick-lists/:id/assign` | Przypisz pickera |
| PUT | `/api/shipping/pick-lists/:id/start` | Start picking |
| PUT | `/api/shipping/pick-items/:id` | Aktualizuj picked qty |
| POST | `/api/shipping/pick-lists/:id/complete` | Zakoncz pick |

### 7.4 Packages
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/shipping/packages` | Lista paczek |
| POST | `/api/shipping/packages` | Utworz paczke |
| POST | `/api/shipping/packages/:id/items` | Dodaj item do paczki |
| POST | `/api/shipping/packages/:id/complete` | Zakoncz paczke |

### 7.5 Documents
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/shipping/shipments/:id/packing-slip` | Generuj packing slip |
| GET | `/api/shipping/packages/:id/label` | Generuj etykiete |
| GET | `/api/shipping/shipments/:id/bol` | Generuj BOL |

### 7.6 Settings
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/shipping/settings` | Pobierz ustawienia |
| PUT | `/api/shipping/settings` | Aktualizuj ustawienia |

---

## 8. Functional Requirements

### 8.1 Sales Orders
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-01 | Create sales orders with customer and items | Must |
| SH-FR-02 | Track SO status through fulfillment | Must |
| SH-FR-03 | Support SO line-level status | Must |
| SH-FR-04 | Calculate available inventory for SO | Should |

### 8.2 Shipments
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-05 | Create shipments from SOs | Must |
| SH-FR-06 | Consolidate multiple SOs into one shipment | Should |
| SH-FR-07 | Track shipment status | Must |
| SH-FR-08 | Record carrier and tracking | Must |

### 8.3 Picking
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-09 | Generate pick lists from SOs/shipments | Must |
| SH-FR-10 | Suggest LPs based on picking strategy | Must |
| SH-FR-11 | Support picker assignment | Should |
| SH-FR-12 | Handle pick shorts | Must |
| SH-FR-13 | Update SO qty picked | Must |
| SH-FR-14 | Only allow picking QA passed LPs | Must |

### 8.4 Packing
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-15 | Create packages for shipments | Should |
| SH-FR-16 | Track items in each package | Should |
| SH-FR-17 | Record package weight | Should |

### 8.5 Documents
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-18 | Generate pick lists (printable) | Must |
| SH-FR-19 | Generate packing slips | Must |
| SH-FR-20 | Generate shipping labels | Must |
| SH-FR-21 | Support label printing (ZPL) | Must |

### 8.6 Scanner
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-22 | Scanner picking workflow | Must |
| SH-FR-23 | Scanner packing workflow | Should |
| SH-FR-24 | Scanner validation (LP, product, QA) | Must |

### 8.7 Reports
| ID | Requirement | Priority |
|----|-------------|----------|
| SH-FR-25 | Open orders report | Must |
| SH-FR-26 | Shipping performance report | Should |
| SH-FR-27 | Picker productivity report | Should |
| SH-FR-28 | Backorder report | Should |

---

## 9. Integration Points

### 9.1 Z Warehouse Module
- Pick from LP inventory
- Update LP status on pick (reserved --> consumed)
- Move LP to shipping location

### 9.2 Z Quality Module
- Only pick/ship QA passed LPs
- Validate QA status during pick

### 9.3 Z Technical Module
- Product info for pick/pack

### 9.4 Z Planning Module (Phase 3)
- PO creates expected inventory
- WO produces shippable goods

### 9.5 Z Carrier Integration (Phase 3)
- FedEx, UPS, DHL API
- Rate shopping
- Label generation
- Tracking updates

---

## 10. Shipping Documents

### 10.1 Pick List
```
- Pick number
- Date
- Warehouse
- Items to pick:
  * Product
  * Qty
  * Location
  * Suggested LP
- Picker signature
```

### 10.2 Packing Slip
```
- Shipment number
- Customer info
- Ship-to address
- Line items:
  * Product
  * Qty
  * Lot/Batch
- Total packages and weight
- Shipping method
```

### 10.3 Shipping Label
```
- Carrier logo
- Tracking barcode
- Ship-to address
- Ship-from address
- Weight
- Service type
```

### 10.4 Bill of Lading (BOL)
```
- Shipper info
- Consignee info
- Carrier info
- Items list
- Weight
- Terms
- Signatures
```

---

## 11. Story Map

| Story | Tytul | Priority | Status |
|-------|-------|----------|--------|
| 7.1 | SO Creation | Must | PLANNED |
| 7.2 | SO Lines Management | Must | PLANNED |
| 7.3 | SO Status Tracking | Must | PLANNED |
| 7.4 | SO Confirmation | Must | PLANNED |
| 7.5 | Shipment Creation | Must | PLANNED |
| 7.6 | Shipment Consolidation | Should | PLANNED |
| 7.7 | Shipment Status | Must | PLANNED |
| 7.8 | Pick List Generation | Must | PLANNED |
| 7.9 | FIFO Picking Strategy | Must | PLANNED |
| 7.10 | FEFO Picking Strategy | Must | PLANNED |
| 7.11 | Pick Assignment | Should | PLANNED |
| 7.12 | Pick Short Handling | Must | PLANNED |
| 7.13 | Package Creation | Should | PLANNED |
| 7.14 | Package Item Tracking | Should | PLANNED |
| 7.15 | Package Weight | Should | PLANNED |
| 7.16 | Pick List Document | Must | PLANNED |
| 7.17 | Packing Slip Document | Must | PLANNED |
| 7.18 | Shipping Label Document | Must | PLANNED |
| 7.19 | Scanner Pick Workflow | Must | PLANNED |
| 7.20 | Scanner Pack Workflow | Should | PLANNED |
| 7.21 | Scanner LP Validation | Must | PLANNED |
| 7.22 | Ship Confirmation | Must | PLANNED |
| 7.23 | Tracking Number Entry | Must | PLANNED |
| 7.24 | POD Capture (optional) | Could | PLANNED |
| 7.25 | Shipping Settings Page | Must | PLANNED |
| 7.26 | Open Orders Report | Must | PLANNED |
| 7.27 | Shipping Performance Report | Should | PLANNED |
| 7.28 | Backorder Creation | Should | PLANNED |

**Summary:** 28 stories, 0% complete (Phase 2)

---

## 12. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial PRD for Phase 2 planning |
