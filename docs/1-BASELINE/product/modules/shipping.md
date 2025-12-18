# Shipping Module PRD

**Module ID:** 7
**Status:** Planned
**Owner:** Product Team
**Last Updated:** 2025-12-10

## 1. Overview

The Shipping Module manages the complete order-to-delivery cycle for finished goods, including customer management, sales order processing, picking operations, packing, carrier integration, and returns processing. Ensures food safety compliance through allergen separation and FIFO/FEFO enforcement.

**Key Capabilities:**
- Customer and contact management with multiple shipping addresses
- Sales order creation, allocation, and fulfillment tracking
- Wave picking with scanner support and pick optimization
- GS1-compliant shipping labels (SSCC) and BOL generation
- Multi-carrier integration (DHL, UPS, DPD)
- Returns and RMA processing
- Dock scheduling and load optimization

---

## 2. Functional Requirements

### 2.1 Summary Table

| FR-ID | Feature Name | Priority | Phase | Module |
|-------|--------------|----------|-------|--------|
| **CUSTOMERS** |
| FR-7.1 | Customer CRUD Operations | P0 | 1 | Customers |
| FR-7.2 | Customer Contacts Management | P0 | 1 | Customers |
| FR-7.3 | Multiple Shipping Addresses | P0 | 1 | Customers |
| FR-7.4 | Customer Credit Limits | P1 | 2 | Customers |
| FR-7.5 | Customer Categories/Groups | P2 | 2 | Customers |
| FR-7.6 | Customer Payment Terms | P1 | 2 | Customers |
| FR-7.7 | Customer Allergen Restrictions | P0 | 1 | Customers |
| FR-7.8 | Customer Pricing Agreements | P2 | 3 | Customers |
| **SALES ORDERS** |
| FR-7.9 | Sales Order Creation (Manual) | P0 | 1 | Sales Orders |
| FR-7.10 | Sales Order Lines Management | P0 | 1 | Sales Orders |
| FR-7.11 | SO Status Workflow | P0 | 1 | Sales Orders |
| FR-7.12 | Inventory Allocation (Auto/Manual) | P0 | 1 | Sales Orders |
| FR-7.13 | SO Confirmation/Hold | P0 | 1 | Sales Orders |
| FR-7.14 | SO Clone/Template | P2 | 2 | Sales Orders |
| FR-7.15 | Partial Fulfillment | P1 | 1 | Sales Orders |
| FR-7.16 | Backorder Management | P1 | 2 | Sales Orders |
| FR-7.17 | SO Cancellation | P0 | 1 | Sales Orders |
| FR-7.18 | Reserved Inventory Tracking | P0 | 1 | Sales Orders |
| FR-7.19 | Promised Ship Date | P1 | 1 | Sales Orders |
| FR-7.20 | SO Import (CSV/API) | P2 | 3 | Sales Orders |
| **PICK LISTS** |
| FR-7.21 | Pick List Generation | P0 | 1 | Picking |
| FR-7.22 | Wave Picking (Multi-Order) | P0 | 1 | Picking |
| FR-7.23 | Pick List Assignment (User) | P0 | 1 | Picking |
| FR-7.24 | Pick Confirmation (Desktop) | P0 | 1 | Picking |
| FR-7.25 | Pick Confirmation (Scanner) | P0 | 1 | Picking |
| FR-7.26 | FIFO Pick Suggestions | P0 | 1 | Picking |
| FR-7.27 | FEFO Pick Suggestions (BBD) | P0 | 1 | Picking |
| FR-7.28 | Allergen Separation Alerts | P0 | 1 | Picking |
| FR-7.29 | Pick List Optimization (Zone/Route) | P1 | 2 | Picking |
| FR-7.30 | Short Pick Handling | P1 | 1 | Picking |
| FR-7.31 | Pick List Cancellation | P1 | 1 | Picking |
| FR-7.32 | Batch Picking Support | P2 | 2 | Picking |
| FR-7.33 | Pick Performance Metrics | P2 | 3 | Picking |
| **PACKING & SHIPPING** |
| FR-7.34 | Packing Station Workflow | P0 | 1 | Packing |
| FR-7.35 | Pack Confirmation (Desktop) | P0 | 1 | Packing |
| FR-7.36 | Pack Confirmation (Scanner) | P0 | 1 | Packing |
| FR-7.37 | Multi-Box Shipments | P1 | 1 | Packing |
| FR-7.38 | GS1 SSCC Label Generation | P0 | 1 | Packing |
| FR-7.39 | Shipping Label Print | P0 | 1 | Packing |
| FR-7.40 | Packing Slip Generation | P0 | 1 | Packing |
| FR-7.41 | BOL Generation | P0 | 1 | Packing |
| FR-7.42 | Weight/Dimensions Capture | P1 | 1 | Packing |
| FR-7.43 | Shipment Quality Checks | P1 | 2 | Packing |
| FR-7.44 | Hazmat Declaration | P2 | 3 | Packing |
| **CARRIER INTEGRATION** |
| FR-7.45 | Carrier Configuration (DHL/UPS/DPD) | P1 | 2 | Carriers |
| FR-7.46 | Rate Shopping | P2 | 3 | Carriers |
| FR-7.47 | Shipment Booking API | P1 | 2 | Carriers |
| FR-7.48 | Tracking Number Import | P1 | 2 | Carriers |
| FR-7.49 | Shipment Tracking (Webhook) | P2 | 3 | Carriers |
| FR-7.50 | Carrier Label Print (API) | P1 | 2 | Carriers |
| FR-7.51 | Proof of Delivery Capture | P2 | 3 | Carriers |
| **DOCK & LOADING** |
| FR-7.52 | Dock Door Configuration | P1 | 2 | Dock |
| FR-7.53 | Dock Appointment Scheduling | P1 | 2 | Dock |
| FR-7.54 | Load Planning (Pallet/Box) | P1 | 2 | Dock |
| FR-7.55 | Staging Location Assignment | P1 | 2 | Dock |
| FR-7.56 | Load Confirmation | P1 | 2 | Dock |
| FR-7.57 | Truck Capacity Management | P2 | 3 | Dock |
| FR-7.58 | Temperature Zone Validation | P1 | 2 | Dock |
| **RETURNS & RMA** |
| FR-7.59 | RMA Creation | P1 | 2 | Returns |
| FR-7.60 | Return Receiving (Desktop) | P1 | 2 | Returns |
| FR-7.61 | Return Receiving (Scanner) | P1 | 2 | Returns |
| FR-7.62 | Return Disposition (Restock/Scrap) | P1 | 2 | Returns |
| FR-7.63 | Quality Hold on Returns | P1 | 2 | Returns |
| FR-7.64 | Credit Memo Generation | P2 | 3 | Returns |
| FR-7.65 | Return Reason Codes | P1 | 2 | Returns |
| **DASHBOARDS & REPORTS** |
| FR-7.66 | Shipping Dashboard | P1 | 1 | Dashboard |
| FR-7.67 | Orders by Status Report | P1 | 1 | Reports |
| FR-7.68 | Pick Performance Report | P2 | 2 | Reports |
| FR-7.69 | On-Time Delivery Report | P1 | 2 | Reports |
| FR-7.70 | Backorder Report | P1 | 2 | Reports |
| FR-7.71 | Carrier Performance Report | P2 | 3 | Reports |
| FR-7.72 | Returns Analysis Report | P2 | 3 | Reports |

**Priority Definitions:**
- **P0:** Core functionality, required for MVP
- **P1:** Important, required for full deployment
- **P2:** Nice-to-have, can be deferred

**Phase Definitions:**
- **Phase 1:** Core Operations (Customers, Orders, Basic Picking/Packing)
- **Phase 2:** Advanced Features (Wave Picking, Carrier Integration, Dock Management, Returns)
- **Phase 3:** Optimization & Analytics (Advanced Reporting, Rate Shopping, Performance Metrics)

---

## 3. Database Schema

### 3.1 Core Tables

#### customers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| customer_code | text | Unique per org |
| name | text | Required |
| email | text | Optional |
| phone | text | Optional |
| tax_id | text | VAT/EIN |
| credit_limit | decimal | Optional |
| payment_terms_days | int | Default 30 |
| category | text | Enum: retail, wholesale, distributor |
| allergen_restrictions | jsonb | Array of allergen IDs |
| is_active | boolean | Default true |
| notes | text | Optional |
| created_at | timestamptz | Auto |
| created_by | uuid | FK users |
| updated_at | timestamptz | Auto |

#### customer_contacts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| customer_id | uuid | FK customers |
| name | text | Required |
| title | text | Optional |
| email | text | Optional |
| phone | text | Optional |
| is_primary | boolean | Default false |
| created_at | timestamptz | Auto |

#### customer_addresses
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| customer_id | uuid | FK customers |
| address_type | text | Enum: billing, shipping |
| is_default | boolean | Default false |
| address_line1 | text | Required |
| address_line2 | text | Optional |
| city | text | Required |
| state | text | Optional |
| postal_code | text | Required |
| country | text | Required |
| dock_hours | jsonb | {mon: "8-17", ...} |
| notes | text | Delivery instructions |
| created_at | timestamptz | Auto |

#### sales_orders
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| order_number | text | Auto-generated, unique |
| customer_id | uuid | FK customers |
| customer_po | text | Customer's PO number |
| shipping_address_id | uuid | FK customer_addresses |
| order_date | date | Required |
| promised_ship_date | date | Optional |
| required_delivery_date | date | Optional |
| status | text | Enum: draft, confirmed, allocated, picking, packing, shipped, delivered, cancelled |
| total_amount | decimal | Calculated |
| notes | text | Optional |
| allergen_validated | boolean | Default false |
| created_at | timestamptz | Auto |
| created_by | uuid | FK users |
| updated_at | timestamptz | Auto |
| confirmed_at | timestamptz | Optional |
| shipped_at | timestamptz | Optional |

#### sales_order_lines
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| sales_order_id | uuid | FK sales_orders |
| line_number | int | Auto-increment per order |
| product_id | uuid | FK products |
| quantity_ordered | decimal | Required |
| quantity_allocated | decimal | Default 0 |
| quantity_picked | decimal | Default 0 |
| quantity_packed | decimal | Default 0 |
| quantity_shipped | decimal | Default 0 |
| unit_price | decimal | Required |
| line_total | decimal | Calculated |
| requested_lot | text | Optional, specific lot request |
| notes | text | Optional |
| created_at | timestamptz | Auto |

#### inventory_allocations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| sales_order_line_id | uuid | FK sales_order_lines |
| license_plate_id | uuid | FK license_plates |
| quantity_allocated | decimal | Required |
| quantity_picked | decimal | Default 0 |
| allocated_at | timestamptz | Auto |
| allocated_by | uuid | FK users |
| released_at | timestamptz | Null if active |

#### pick_lists
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| pick_list_number | text | Auto-generated |
| pick_type | text | Enum: single_order, wave |
| status | text | Enum: pending, assigned, in_progress, completed, cancelled |
| priority | text | Enum: low, normal, high, urgent |
| assigned_to | uuid | FK users, nullable |
| wave_id | uuid | Optional grouping |
| created_at | timestamptz | Auto |
| created_by | uuid | FK users |
| started_at | timestamptz | Optional |
| completed_at | timestamptz | Optional |

#### pick_list_lines
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| pick_list_id | uuid | FK pick_lists |
| sales_order_line_id | uuid | FK sales_order_lines |
| license_plate_id | uuid | FK license_plates (suggested) |
| location_id | uuid | FK locations |
| product_id | uuid | FK products |
| lot_number | text | From license plate |
| quantity_to_pick | decimal | Required |
| quantity_picked | decimal | Default 0 |
| pick_sequence | int | Route optimization |
| status | text | Enum: pending, picked, short |
| picked_license_plate_id | uuid | FK license_plates (actual) |
| picked_at | timestamptz | Optional |
| picked_by | uuid | FK users |

#### shipments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| shipment_number | text | Auto-generated |
| sales_order_id | uuid | FK sales_orders |
| customer_id | uuid | FK customers |
| shipping_address_id | uuid | FK customer_addresses |
| status | text | Enum: pending, packing, packed, manifested, shipped, delivered, exception |
| carrier | text | Enum: dhl, ups, dpd, fedex, other |
| service_level | text | Ground, Express, etc. |
| tracking_number | text | Optional |
| sscc | text | GS1 SSCC barcode |
| total_weight | decimal | kg |
| total_boxes | int | Count |
| dock_door_id | uuid | FK dock_doors |
| staged_location_id | uuid | FK locations |
| packed_at | timestamptz | Optional |
| packed_by | uuid | FK users |
| shipped_at | timestamptz | Optional |
| delivered_at | timestamptz | Optional |
| created_at | timestamptz | Auto |

#### shipment_boxes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| shipment_id | uuid | FK shipments |
| box_number | int | Sequential per shipment |
| sscc | text | Unique SSCC per box |
| weight | decimal | kg |
| length | decimal | cm |
| width | decimal | cm |
| height | decimal | cm |
| tracking_number | text | Optional |
| created_at | timestamptz | Auto |

#### shipment_box_contents
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| shipment_box_id | uuid | FK shipment_boxes |
| sales_order_line_id | uuid | FK sales_order_lines |
| product_id | uuid | FK products |
| license_plate_id | uuid | FK license_plates |
| lot_number | text | Traceability |
| quantity | decimal | Required |
| created_at | timestamptz | Auto |

#### dock_doors
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| door_code | text | Unique per org |
| door_name | text | Required |
| door_type | text | Enum: shipping, receiving, both |
| temperature_zone | text | Enum: ambient, chilled, frozen |
| is_active | boolean | Default true |
| created_at | timestamptz | Auto |

#### dock_appointments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| dock_door_id | uuid | FK dock_doors |
| appointment_type | text | Enum: shipping, receiving |
| shipment_id | uuid | FK shipments, nullable |
| scheduled_start | timestamptz | Required |
| scheduled_end | timestamptz | Required |
| actual_start | timestamptz | Optional |
| actual_end | timestamptz | Optional |
| carrier | text | Optional |
| truck_number | text | Optional |
| driver_name | text | Optional |
| status | text | Enum: scheduled, in_progress, completed, cancelled |
| notes | text | Optional |
| created_at | timestamptz | Auto |

#### rma_requests
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| rma_number | text | Auto-generated |
| customer_id | uuid | FK customers |
| sales_order_id | uuid | FK sales_orders, nullable |
| reason_code | text | Enum: damaged, expired, wrong_product, quality_issue, other |
| status | text | Enum: pending, approved, receiving, received, processed, closed |
| total_value | decimal | Calculated |
| disposition | text | Enum: restock, scrap, quality_hold |
| notes | text | Optional |
| created_at | timestamptz | Auto |
| created_by | uuid | FK users |
| approved_at | timestamptz | Optional |
| approved_by | uuid | FK users |

#### rma_lines
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| rma_request_id | uuid | FK rma_requests |
| product_id | uuid | FK products |
| quantity_expected | decimal | Required |
| quantity_received | decimal | Default 0 |
| lot_number | text | Optional |
| reason_notes | text | Optional |
| disposition | text | Override RMA-level |
| created_at | timestamptz | Auto |

#### carrier_configs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK organizations |
| carrier | text | Enum: dhl, ups, dpd, fedex |
| is_active | boolean | Default true |
| api_endpoint | text | Required |
| api_key | text | Encrypted |
| account_number | text | Required |
| config_json | jsonb | Carrier-specific settings |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### 3.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_customers_org_code ON customers(org_id, customer_code);
CREATE INDEX idx_customers_org_active ON customers(org_id, is_active);
CREATE INDEX idx_sales_orders_org_status ON sales_orders(org_id, status);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_promised_date ON sales_orders(promised_ship_date);
CREATE INDEX idx_pick_lists_org_status ON pick_lists(org_id, status);
CREATE INDEX idx_pick_lists_assigned ON pick_lists(assigned_to);
CREATE INDEX idx_shipments_org_status ON shipments(org_id, status);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_sscc ON shipments(sscc);
CREATE INDEX idx_inventory_allocations_so_line ON inventory_allocations(sales_order_line_id);
CREATE INDEX idx_inventory_allocations_lp ON inventory_allocations(license_plate_id);
```

---

## 4. API Endpoints

### 4.1 Customers

```
GET    /api/shipping/customers
GET    /api/shipping/customers/:id
POST   /api/shipping/customers
PUT    /api/shipping/customers/:id
DELETE /api/shipping/customers/:id

GET    /api/shipping/customers/:id/contacts
POST   /api/shipping/customers/:id/contacts
PUT    /api/shipping/customers/:id/contacts/:contactId
DELETE /api/shipping/customers/:id/contacts/:contactId

GET    /api/shipping/customers/:id/addresses
POST   /api/shipping/customers/:id/addresses
PUT    /api/shipping/customers/:id/addresses/:addressId
DELETE /api/shipping/customers/:id/addresses/:addressId
PUT    /api/shipping/customers/:id/addresses/:addressId/set-default

GET    /api/shipping/customers/:id/orders
GET    /api/shipping/customers/:id/allergen-validation
```

### 4.2 Sales Orders

```
GET    /api/shipping/sales-orders
GET    /api/shipping/sales-orders/:id
POST   /api/shipping/sales-orders
PUT    /api/shipping/sales-orders/:id
DELETE /api/shipping/sales-orders/:id

POST   /api/shipping/sales-orders/:id/lines
PUT    /api/shipping/sales-orders/:id/lines/:lineId
DELETE /api/shipping/sales-orders/:id/lines/:lineId

POST   /api/shipping/sales-orders/:id/confirm
POST   /api/shipping/sales-orders/:id/hold
POST   /api/shipping/sales-orders/:id/cancel
POST   /api/shipping/sales-orders/:id/clone

POST   /api/shipping/sales-orders/:id/allocate
POST   /api/shipping/sales-orders/:id/release-allocation
GET    /api/shipping/sales-orders/:id/allocations

POST   /api/shipping/sales-orders/import
POST   /api/shipping/sales-orders/:id/validate-allergens
```

### 4.3 Pick Lists

```
GET    /api/shipping/pick-lists
GET    /api/shipping/pick-lists/:id
POST   /api/shipping/pick-lists
DELETE /api/shipping/pick-lists/:id

POST   /api/shipping/pick-lists/:id/assign
POST   /api/shipping/pick-lists/:id/start
POST   /api/shipping/pick-lists/:id/complete
POST   /api/shipping/pick-lists/:id/cancel

GET    /api/shipping/pick-lists/:id/lines
PUT    /api/shipping/pick-lists/:id/lines/:lineId/pick
POST   /api/shipping/pick-lists/:id/lines/:lineId/short-pick

POST   /api/shipping/pick-lists/wave
POST   /api/shipping/pick-lists/:id/optimize-route

GET    /api/shipping/pick-lists/my-picks
```

### 4.4 Shipments

```
GET    /api/shipping/shipments
GET    /api/shipping/shipments/:id
POST   /api/shipping/shipments
PUT    /api/shipping/shipments/:id
DELETE /api/shipping/shipments/:id

POST   /api/shipping/shipments/:id/boxes
PUT    /api/shipping/shipments/:id/boxes/:boxId
DELETE /api/shipping/shipments/:id/boxes/:boxId

POST   /api/shipping/shipments/:id/boxes/:boxId/contents
DELETE /api/shipping/shipments/:id/boxes/:boxId/contents/:contentId

POST   /api/shipping/shipments/:id/generate-sscc
POST   /api/shipping/shipments/:id/generate-bol
POST   /api/shipping/shipments/:id/print-labels
POST   /api/shipping/shipments/:id/print-packing-slip

POST   /api/shipping/shipments/:id/manifest
POST   /api/shipping/shipments/:id/ship
POST   /api/shipping/shipments/:id/mark-delivered

GET    /api/shipping/shipments/:id/tracking
```

### 4.5 Dock Management

```
GET    /api/shipping/dock-doors
POST   /api/shipping/dock-doors
PUT    /api/shipping/dock-doors/:id
DELETE /api/shipping/dock-doors/:id

GET    /api/shipping/dock-appointments
POST   /api/shipping/dock-appointments
PUT    /api/shipping/dock-appointments/:id
DELETE /api/shipping/dock-appointments/:id

POST   /api/shipping/dock-appointments/:id/start
POST   /api/shipping/dock-appointments/:id/complete

GET    /api/shipping/dock-appointments/schedule
```

### 4.6 Returns (RMA)

```
GET    /api/shipping/rma
GET    /api/shipping/rma/:id
POST   /api/shipping/rma
PUT    /api/shipping/rma/:id
DELETE /api/shipping/rma/:id

POST   /api/shipping/rma/:id/lines
PUT    /api/shipping/rma/:id/lines/:lineId
DELETE /api/shipping/rma/:id/lines/:lineId

POST   /api/shipping/rma/:id/approve
POST   /api/shipping/rma/:id/receive-line
POST   /api/shipping/rma/:id/process
POST   /api/shipping/rma/:id/close
```

### 4.7 Carrier Integration

```
GET    /api/shipping/carriers
POST   /api/shipping/carriers
PUT    /api/shipping/carriers/:id
DELETE /api/shipping/carriers/:id

POST   /api/shipping/carriers/:carrier/rate-quote
POST   /api/shipping/carriers/:carrier/book-shipment
POST   /api/shipping/carriers/:carrier/get-label
GET    /api/shipping/carriers/:carrier/track/:trackingNumber

POST   /api/shipping/carriers/webhook/:carrier
```

### 4.8 Reports & Dashboards

```
GET    /api/shipping/dashboard
GET    /api/shipping/reports/orders-by-status
GET    /api/shipping/reports/pick-performance
GET    /api/shipping/reports/on-time-delivery
GET    /api/shipping/reports/backorders
GET    /api/shipping/reports/carrier-performance
GET    /api/shipping/reports/returns-analysis
```

---

## 5. Scanner Workflows

### 5.1 Pick Confirmation (Scanner)

**Entry Point:** Scan pick list barcode or select from assigned list

**Steps:**
1. Scan pick list barcode → Load pick list details
2. Display next pick line (product, location, quantity)
3. Navigate to location (show zone/aisle/bin)
4. Scan location barcode → Validate correct location
5. Scan license plate barcode → Validate product match
6. Enter quantity picked (default to full quantity)
7. If quantity < requested → Prompt for short pick reason
8. Confirm pick → Update pick_list_lines.quantity_picked
9. Show next pick line or completion status
10. Complete all lines → Auto-set pick_list.status = 'completed'

**Validations:**
- Location must match expected pick location
- License plate must contain correct product
- FIFO/FEFO enforcement: warn if not picking oldest lot
- Allergen alert: display if customer has allergen restrictions
- Cannot pick more than available in license plate

**Error Handling:**
- Wrong location: Show error, allow override with supervisor code
- Wrong product: Reject, require correct LP scan
- Short pick: Capture reason code, allow completion

---

### 5.2 Pack Confirmation (Scanner)

**Entry Point:** Scan sales order barcode or shipment barcode

**Steps:**
1. Scan sales order/shipment barcode → Load order details
2. Create or select active shipment
3. Scan/create shipment box (generate SSCC)
4. Scan picked license plate → Validate against SO lines
5. Enter quantity to pack into current box
6. Confirm → Update shipment_box_contents
7. Repeat step 4-6 for all items in box
8. Close box → Enter weight/dimensions (optional)
9. Print GS1 SSCC label
10. Start new box or complete shipment
11. Complete shipment → Print BOL, packing slip

**Validations:**
- License plate must be allocated to this sales order
- Cannot pack more than quantity picked
- Weight/dimension warnings if exceeds carrier limits
- Allergen cross-contamination check (if multi-product box)

**Label Generation:**
- GS1 SSCC format: (00) SSCC barcode
- Include: Customer name, Order #, Box X of Y, Weight
- Optional: Product list, Lot numbers, BBD

---

### 5.3 Return Receiving (Scanner)

**Entry Point:** Scan RMA barcode or select from pending list

**Steps:**
1. Scan RMA barcode → Load RMA details
2. Display expected return lines
3. Scan product barcode → Match to RMA line
4. Scan/enter lot number (if applicable)
5. Enter quantity received
6. Inspect product → Select disposition:
   - Restock (generate new LP, put to warehouse)
   - Quality Hold (move to QC location)
   - Scrap (record waste)
7. Confirm receipt → Update rma_lines.quantity_received
8. If disposition = Restock → Print new license plate label
9. Complete all lines → Set rma_requests.status = 'received'

**Validations:**
- Product must match expected RMA line
- Cannot receive more than quantity_expected
- Quality hold items → Create QC workflow (future)
- Restock items → Validate product still active

---

### 5.4 Wave Picking (Multi-Order)

**Entry Point:** Create wave pick list from multiple sales orders

**Desktop Steps:**
1. Select multiple sales orders (filter by: ship date, customer, zone)
2. Click "Create Wave Pick List"
3. System consolidates all lines by location/product
4. Generate optimized pick route (zone → aisle → bin)
5. Assign to picker
6. Print pick list or send to scanner

**Scanner Steps:**
1. Scan wave pick list barcode
2. Display consolidated pick lines (Product A: 150 units from Location X)
3. Scan location → Scan LP → Enter total quantity
4. System auto-distributes quantity across sales orders (FIFO allocation)
5. Move to next consolidated pick line
6. Complete wave → Return to staging area
7. Desktop: Sort picked items into individual sales orders

**Optimization Logic:**
- Group by zone (Chilled → Frozen → Dry)
- Sort by aisle/bin sequence within zone
- Allergen separation: Flag if wave contains allergen conflicts

---

### 5.5 Dock Loading Confirmation

**Entry Point:** Scan dock appointment or truck number

**Steps:**
1. Scan dock appointment barcode → Load scheduled shipments
2. Display staged shipments for this dock door
3. Scan shipment SSCC → Validate against appointment
4. Confirm load sequence (back of truck → front)
5. Scan all boxes for shipment → Mark shipment as loaded
6. Repeat for all shipments
7. Close truck → Complete dock appointment
8. Print load manifest

**Validations:**
- Temperature zone match (frozen shipments → frozen truck)
- Weight capacity warnings
- Allergen separation validation (if multi-customer load)
- Verify all boxes scanned before marking shipment loaded

---

## 6. Business Rules

### 6.1 Allocation Rules

**Auto-Allocation (on SO Confirmation):**
1. For each SO line, query available inventory (license_plates):
   - Same product_id
   - status = 'available'
   - on_hand_quantity > 0
   - Exclude quality holds
2. Apply picking strategy:
   - **FIFO:** oldest manufacturing_date first
   - **FEFO:** earliest best_before_date first
   - **Lot-specific:** If SO line requests specific lot, filter to that lot
3. Allocate quantities, create inventory_allocations records
4. Update license_plates.allocated_quantity
5. If insufficient inventory → Create backorder, set SO status = 'partial'

**Allergen Validation:**
- Check customer.allergen_restrictions (array of allergen IDs)
- For each SO line product, check products.allergens
- If conflict detected:
  - Set sales_orders.allergen_validated = false
  - Create alert/task for manual review
  - Block shipment until override

**Allocation Release:**
- On SO cancellation or line deletion → Release allocations
- Update license_plates.allocated_quantity -= released amount
- Delete inventory_allocations records

---

### 6.2 Status Workflows

**Sales Order Status:**
```
draft → confirmed → allocated → picking → packing → shipped → delivered
         ↓
      cancelled
```

- **draft:** Editable, no allocation
- **confirmed:** Locked for editing, triggers allocation
- **allocated:** Inventory reserved, ready to pick
- **picking:** Pick list generated, picking in progress
- **packing:** All picked, packing in progress
- **shipped:** Manifested with carrier, tracking number assigned
- **delivered:** POD received (webhook or manual)
- **cancelled:** Released allocations, order voided

**Pick List Status:**
```
pending → assigned → in_progress → completed
           ↓
        cancelled
```

**Shipment Status:**
```
pending → packing → packed → manifested → shipped → delivered
                                           ↓
                                       exception
```

**RMA Status:**
```
pending → approved → receiving → received → processed → closed
```

---

### 6.3 Picking Strategy

**FIFO (First In, First Out):**
- Sort license plates by manufacturing_date ASC
- Allocate oldest stock first
- Default for stable products

**FEFO (First Expired, First Out):**
- Sort license plates by best_before_date ASC
- Allocate shortest shelf life first
- Default for perishable products (dairy, fresh)

**Allergen Separation:**
- If customer has allergen restrictions:
  - Highlight allergen products in pick list
  - Suggest separate box/pallet
  - Require confirmation before packing together

**Zone-Based Routing:**
- Pick sequence: Chilled → Frozen → Dry
- Within zone: Sort by aisle/bin location
- Minimize backtracking

---

### 6.4 GS1 SSCC Generation

**Format:** (00) SSCC (18 digits)

**Structure:**
- Extension Digit (1): Fixed '0'
- GS1 Company Prefix (7-10): From org configuration
- Serial Reference (8-6): Unique sequential number
- Check Digit (1): Calculated per GS1 standard

**Example:** `000123456789012345`

**Implementation:**
```sql
-- Next SSCC sequence per org
SELECT next_sscc_sequence FROM organizations WHERE id = :org_id FOR UPDATE;
UPDATE organizations SET next_sscc_sequence = next_sscc_sequence + 1;
```

**Label Content:**
- SSCC barcode (GS1-128)
- Human-readable SSCC
- Ship To: Customer name, address
- Ship From: Warehouse address
- Order #, Box X of Y
- Weight, Dimensions
- Handling instructions (if refrigerated/frozen)

---

### 6.5 BOL (Bill of Lading) Requirements

**Header:**
- BOL Number (unique per shipment)
- Shipment Date
- Carrier Name, Pro Number (tracking)
- Ship From: Warehouse name, address
- Ship To: Customer name, address

**Line Items:**
- Box count, pallet count
- Total weight (gross)
- Freight class (LTL shipments)
- NMFC code (if applicable)

**Certifications:**
- Shipper signature, date
- Carrier signature, date
- Special instructions (temperature control, hazmat)

**Traceability:**
- List all SSCC numbers
- Optional: Product list with lot numbers

---

## 7. Integration Points

### 7.1 Warehouse Module (Epic 5)

**Dependencies:**
- `license_plates` table (inventory source for allocation)
- `locations` table (pick locations)
- `inventory_moves` (create move on pick confirmation)

**Triggers:**
- Pick confirmation → Create inventory move (license_plate → staging location)
- RMA restock → Create putaway move

---

### 7.2 Production Module (Epic 4)

**Dependencies:**
- `products` table (finished goods to sell)
- `production_orders` (link to stock availability)

**Triggers:**
- Backorder creation → Notify production planning (future MRP)
- Sales forecast → Feed into production scheduling (future)

---

### 7.3 Quality Module (Epic 6) - Future

**Dependencies:**
- Quality holds on returns
- QC approval before shipment (if enabled)

**Triggers:**
- RMA disposition = 'quality_hold' → Create QC task
- Product release → Update inventory status to 'available'

---

### 7.4 External Systems

**ERP Integration (Phase 3):**
- Sales order import via CSV/API
- Invoice export after shipment confirmation
- Customer master sync (bidirectional)

**Carrier APIs:**
- **DHL:** Rate quote, shipment booking, label generation, tracking
- **UPS:** Same as DHL
- **DPD:** Same as DHL
- Webhook for tracking updates (delivered, exception)

**EDI (Future):**
- 850 (Purchase Order) inbound
- 856 (ASN) outbound
- 810 (Invoice) outbound

---

## 8. UI/UX Requirements

### 8.1 Key Pages

| Page | Route | Key Components |
|------|-------|----------------|
| Customer List | /shipping/customers | Table, search, filters, create button |
| Customer Detail | /shipping/customers/:id | Tabs: Details, Contacts, Addresses, Orders, Stats |
| Sales Order List | /shipping/sales-orders | Table, status filters, date range, bulk actions |
| Sales Order Detail | /shipping/sales-orders/:id | Header, lines table, allocation view, status timeline |
| Sales Order Create | /shipping/sales-orders/new | Wizard: Select customer → Add lines → Confirm |
| Pick List | /shipping/pick-lists/:id | Pick lines table, assign picker, print button |
| Wave Picking | /shipping/pick-lists/wave | Multi-select SO, create wave, route optimization |
| Packing Station | /shipping/packing/:shipmentId | SO summary, scan LP, box builder, label print |
| Shipment List | /shipping/shipments | Table, status filters, tracking links |
| Dock Schedule | /shipping/dock | Calendar view, drag-drop appointments, door filter |
| RMA List | /shipping/rma | Table, status filters, approval workflow |
| Dashboard | /shipping | KPI cards, charts (orders by status, OTD%, backorders) |

### 8.2 Common UI Patterns

**Tables:**
- ShadCN DataTable with sorting, filtering, pagination
- Bulk actions: Select multiple → Allocate, Create pick list, Print
- Row actions: Edit, Delete, View details
- Status badges (color-coded)

**Forms:**
- Multi-step wizards for complex workflows (SO creation, wave picking)
- Auto-save drafts
- Inline validation with Zod
- Confirmation dialogs for destructive actions

**Dashboards:**
- KPI cards (Today's shipments, Pending picks, Backorders, OTD%)
- Charts: Orders by status (pie), Daily shipments trend (line), Top customers (bar)
- Quick actions: Create SO, Create pick list, View dock schedule

**Scanner Views:**
- Large touch targets (min 44px)
- High-contrast UI
- Haptic feedback on scan
- Audio cues (success beep, error buzz)
- Offline support (sync on reconnect)

---

## 9. Phase Roadmap

### Phase 1: Core Operations (8-10 weeks)

**Goal:** Enable basic order-to-ship workflow

**Epics:**
- 7A: Customer Management
  - FR-7.1 to FR-7.3, FR-7.7 (Customers, Contacts, Addresses, Allergen restrictions)
  - 2 weeks

- 7B: Sales Orders (Core)
  - FR-7.9 to FR-7.13, FR-7.15, FR-7.17 to FR-7.19 (SO CRUD, Allocation, Status workflow)
  - 3 weeks

- 7C: Picking & Packing
  - FR-7.21 to FR-7.28, FR-7.30 to FR-7.31 (Pick lists, FIFO/FEFO, Scanner workflows)
  - FR-7.34 to FR-7.42 (Packing, SSCC, BOL, Labels)
  - 3 weeks

- 7D: Dashboard
  - FR-7.66 to FR-7.67 (Basic dashboard, order reports)
  - 1 week

**Deliverables:**
- Desktop UI for customer/SO management
- Scanner app for pick/pack confirmation
- SSCC label generation (PDF)
- Basic BOL template
- RLS policies for all tables

---

### Phase 2: Advanced Features (6-8 weeks)

**Goal:** Add wave picking, dock management, returns, carrier integration

**Epics:**
- 7E: Wave Picking & Optimization
  - FR-7.22, FR-7.29, FR-7.32 (Wave picking, route optimization, batch picking)
  - 2 weeks

- 7F: Dock & Loading
  - FR-7.52 to FR-7.58 (Dock doors, appointments, staging, load optimization)
  - 2 weeks

- 7G: Returns (RMA)
  - FR-7.59 to FR-7.65 (RMA creation, receiving, disposition, scanner workflow)
  - 2 weeks

- 7H: Carrier Integration (Basic)
  - FR-7.45 to FR-7.48, FR-7.50 (Carrier config, booking API, label print)
  - DHL/UPS/DPD adapters
  - 2 weeks

**Deliverables:**
- Wave picking UI (desktop + scanner)
- Dock scheduling calendar
- RMA processing workflow
- Carrier API integrations (rate quote, booking, tracking)
- Reports: Pick performance, Backorders, OTD%

---

### Phase 3: Optimization & Analytics (4-6 weeks)

**Goal:** Advanced reporting, rate shopping, performance metrics

**Epics:**
- 7I: Advanced Features
  - FR-7.4 to FR-7.6, FR-7.8 (Credit limits, pricing agreements, payment terms)
  - FR-7.14, FR-7.16, FR-7.20 (SO clone, backorder mgmt, CSV import)
  - 2 weeks

- 7J: Carrier Optimization
  - FR-7.46, FR-7.49, FR-7.51 (Rate shopping, webhook tracking, POD)
  - 1 week

- 7K: Analytics & Reporting
  - FR-7.33, FR-7.68 to FR-7.72 (Pick performance, Carrier performance, Returns analysis)
  - Advanced dashboards (heatmaps, predictive analytics)
  - 2 weeks

**Deliverables:**
- Customer pricing/credit management
- SO import wizard (CSV)
- Multi-carrier rate shopping
- Advanced reports (carrier performance, returns root cause)
- Predictive backorder alerts

---

## 10. Testing Requirements

### 10.1 Unit Tests (Vitest)

**Coverage Targets:** 80%+ for services, 60%+ for API routes

**Key Test Suites:**
- `customer-service.test.ts`: CRUD, validation, allergen checks
- `sales-order-service.test.ts`: Allocation logic, status transitions, backorder creation
- `pick-list-service.test.ts`: FIFO/FEFO sorting, wave consolidation, route optimization
- `shipment-service.test.ts`: SSCC generation, BOL generation, packing logic
- `carrier-service.test.ts`: Rate quote, booking, tracking (mock external API)

**Mock Data:**
- Factory functions for customers, sales orders, pick lists
- Shared fixtures for test orgs, users, products

---

### 10.2 E2E Tests (Playwright)

**Critical Paths:**
1. **Happy Path: Order to Ship**
   - Create customer → Create SO → Allocate → Generate pick list → Pick (scanner) → Pack (scanner) → Print labels → Ship
   - Verify inventory moves, status updates, traceability

2. **Wave Picking**
   - Create 3 sales orders → Create wave pick list → Assign picker → Complete picks → Verify distribution

3. **Short Pick Handling**
   - Allocate SO → Generate pick list → Scan LP with insufficient qty → Capture short pick → Verify backorder creation

4. **RMA Processing**
   - Create RMA → Receive return (scanner) → Disposition: Restock → Verify new LP created → Putaway

5. **Allergen Validation**
   - Create customer with allergen restriction → Create SO with allergen product → Verify alert → Override

6. **Carrier Integration**
   - Configure DHL → Create shipment → Book shipment (API) → Generate label → Verify tracking number

**Test Data:**
- Seed script: 10 customers, 50 sales orders (various statuses), 100 license plates
- Teardown: Clean up test orgs after each run

---

### 10.3 Performance Tests

**Load Scenarios:**
- 100 concurrent pick confirmations (scanner)
- 1000 sales orders with allocation (batch job)
- 50 concurrent BOL generations (PDF render)

**Benchmarks:**
- Pick confirmation: < 500ms (p95)
- Sales order allocation: < 2s for 10 lines
- Wave pick list generation: < 5s for 50 orders

---

## 11. Security & Compliance

### 11.1 RLS Policies

**All tables:** `org_id` filter on SELECT/INSERT/UPDATE/DELETE

**Additional policies:**
- `sales_orders`: Users can only view orders for their org
- `pick_lists`: Pickers can only update assigned pick lists
- `shipments`: Restrict tracking number visibility (role-based)
- `carrier_configs`: Admin-only access to API keys

**Encryption:**
- `carrier_configs.api_key`: Encrypted at rest (Supabase Vault)
- `customer.tax_id`: Encrypted at rest

---

### 11.2 Audit Trail

**Tracked Events:**
- Sales order status changes
- Allocation/deallocation
- Pick/pack confirmations
- Shipment manifesting
- RMA approvals

**Implementation:**
- `audit_logs` table: entity_type, entity_id, action, old_value, new_value, user_id, timestamp
- Triggers on critical tables

---

### 11.3 Food Safety Compliance

**Allergen Management:**
- Validate customer restrictions vs. product allergens
- Prevent cross-contamination in multi-product shipments
- Audit trail for allergen override approvals

**Traceability:**
- Full lot genealogy: Raw material → Finished good → Customer shipment
- Recall simulation: Identify all affected shipments within seconds

**Temperature Control:**
- Dock door temperature zone validation
- Flag shipments requiring refrigerated transport
- Capture temperature logs (future: IoT integration)

---

## 12. Dependencies & Prerequisites

### 12.1 Prerequisite Modules

| Module | Requirement | Reason |
|--------|-------------|--------|
| Settings (Epic 1) | Complete | Organization, users, roles |
| Technical (Epic 2) | Complete | Products, allergens |
| Warehouse (Epic 5) | 80% complete | License plates, locations, inventory moves |
| Production (Epic 4) | 60% complete | Finished goods availability |

### 12.2 External Dependencies

- **Supabase:** Database, Auth, Edge Functions (already in use)
- **Carrier APIs:** DHL, UPS, DPD developer accounts + API keys
- **GS1 Company Prefix:** Organization must register for SSCC generation
- **Label Printer:** Zebra ZPL or generic PDF printer

---

## 13. Open Questions & Decisions

### 13.1 Open Questions

1. **Multi-warehouse shipping:** Do we support shipping from multiple warehouses in Phase 1?
   - **Decision Needed:** Single warehouse (MVP) vs. multi-warehouse (Phase 2)

2. **Partial shipments:** Can one SO have multiple shipments?
   - **Recommendation:** Yes, allow partial shipments (common in food manufacturing)

3. **Customer portals:** Do customers need self-service order tracking?
   - **Decision Needed:** Phase 3 feature or external integration?

4. **LTL vs. Parcel:** Do we support LTL freight (pallet shipments) or only parcel?
   - **Recommendation:** Both, but LTL = manual BOL entry (Phase 1), API integration (Phase 3)

5. **Drop-shipping:** Can we create SO without inventory (direct from supplier)?
   - **Decision Needed:** Out of scope for MVP, consider in Phase 3

### 13.2 Technical Decisions

1. **SSCC Storage:**
   - **Decision:** Store SSCC in `shipments.sscc` and `shipment_boxes.sscc`
   - **Rationale:** Enables query by SSCC for recalls, supports multi-box shipments

2. **Pick List Optimization Algorithm:**
   - **Decision:** Phase 1 = simple zone/aisle sort, Phase 2 = TSP/route optimization
   - **Rationale:** Avoid over-engineering for MVP

3. **Carrier API Abstraction:**
   - **Decision:** Create `carrier-adapter` interface, implement DHL/UPS/DPD adapters
   - **Rationale:** Easy to add new carriers, testable with mocks

4. **Scanner App Architecture:**
   - **Decision:** Progressive Web App (PWA) with offline support
   - **Rationale:** Cross-platform, no app store, works on Zebra/Honeywell scanners

5. **Label Format:**
   - **Decision:** Generate ZPL for Zebra printers, fallback to PDF
   - **Rationale:** ZPL = faster printing, PDF = universal compatibility

---

## 14. Success Metrics

### 14.1 KPIs (Phase 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Order Fulfillment Time | < 24 hours (draft → shipped) | Avg time per SO |
| Pick Accuracy | > 99% | Correct product/lot/qty |
| On-Time Delivery | > 95% | Shipped by promised date |
| SSCC Label Print Success | > 99.5% | Valid labels generated |
| Scanner Uptime | > 99% | PWA availability |

### 14.2 KPIs (Phase 2+)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Wave Picking Efficiency | > 80 lines/hour | Picks per picker per hour |
| Dock Utilization | > 70% | Scheduled hours / available hours |
| Return Processing Time | < 48 hours (RMA → restocked) | Avg time per RMA |
| Carrier Cost Savings | > 10% (vs. manual rate selection) | Rate shopping impact |

---

## 15. Migration & Rollout Plan

### 15.1 Data Migration (if migrating from existing system)

**Customer Data:**
1. Export customers, contacts, addresses from legacy system
2. Map to MonoPilot schema (customer_code, allergen_restrictions)
3. Import via CSV → API endpoint `/api/shipping/customers/import`
4. Validate: Unique customer codes, valid addresses

**Open Sales Orders:**
1. Export open orders (status != shipped/cancelled)
2. Import as 'draft' status
3. Manual review → Confirm → Allocate
4. Legacy order reference → Store in `sales_orders.notes`

**No Migration:**
- Historical shipments (keep in legacy system for traceability)
- Pick/pack history (start fresh)

### 15.2 Rollout Strategy

**Phase 1 Rollout (Pilot):**
1. Week 1-2: Internal testing (dev team)
2. Week 3-4: Pilot with 1 customer (low volume)
3. Week 5-6: Expand to 5 customers
4. Week 7-8: Full rollout (all customers)

**Training:**
- Desktop users: 2-hour workshop (SO creation, allocation, reports)
- Warehouse pickers: 1-hour scanner training (pick/pack workflows)
- Shipping clerks: 1-hour label/BOL printing training

**Cutover:**
- Hard cutover on Monday (week 7)
- Legacy system read-only for 30 days (reference only)
- Parallel run: First week, verify MonoPilot outputs vs. legacy

---

## 16. Appendix

### 16.1 Glossary

| Term | Definition |
|------|------------|
| SSCC | Serial Shipping Container Code (GS1 standard for pallet/box identification) |
| BOL | Bill of Lading (shipping document for freight carriers) |
| FIFO | First In, First Out (inventory rotation strategy) |
| FEFO | First Expired, First Out (pick shortest shelf life first) |
| Wave Picking | Consolidate multiple orders into a single pick list |
| RMA | Return Merchandise Authorization |
| LTL | Less Than Truckload (freight shipping mode) |
| POD | Proof of Delivery |
| TSP | Traveling Salesman Problem (route optimization algorithm) |

### 16.2 References

- GS1 General Specifications: https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications
- DHL API Documentation: https://developer.dhl.com/
- UPS API Documentation: https://www.ups.com/upsdeveloperkit
- FDA Food Traceability Rule: https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods

### 16.3 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-10 | 1.0 | Initial PRD (Phases 1-3 scope) | Product Team |

---

**END OF DOCUMENT**

Total Lines: ~1,450