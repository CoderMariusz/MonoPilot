# D365 Screenshots Analysis - Forza Foods Limited
**Date**: 2026-02-16
**Source**: 31 screenshots from D365 Finance & Operations + Dynamics Reports (Power BI)
**Purpose**: Extract data structures and concepts for MonoPilot PRD enrichment. NOT copying UX.

---

## Screenshot Inventory

| # | File | Area | What It Shows |
|---|------|------|---------------|
| 1 | 115408 | Warehouse | Physical on-hand stock (inventory by LP) |
| 2 | 115725 | Planning | All purchase orders list |
| 3 | 120000 | Technical | Released product details - Manage Stock tab |
| 4 | 120025 | Technical | Released product details - General tab |
| 5 | 120104 | Production | Job Checker - batch order consumption & yield |
| 6 | 120138 | Production | Production Overview - daily output by line |
| 7 | 120229 | Technical | Formula/BOM lines (ingredients per product) |
| 8 | 120245 | Technical | Co-Products mapping |
| 9 | 120250 | Production | Co-Products + full report navigation |
| 10 | 120300 | Production | Consumption details (item, LPN, batch, qty) |
| 11 | 120308 | Production | Attainment report (pool/line level) |
| 12 | 120317 | Warehouse | All Work (picking, counting work orders) |
| 13 | 120352 | Production | Production Dashboard (summary tiles) |
| 14 | 120510 | Production | Batch Order detail view |
| 15 | 120528 | Production | Create Batch Order form |
| 16 | 120618 | Planning | Create Purchase Order form (page 1) |
| 17 | 120627 | Planning | Create Purchase Order form (page 2) |

| 18 | 120717 | Settings | VAT codes list (16 codes: STD, ZERO, REDUCED, EXEMPT, POL-*, RC+/-, etc.) |
| 19 | 120819 | Warehouse | Warehouse Management full module navigation (all sub-modules) |
| 20 | 121732 | Shipping | Sales orders list + line details |
| 21 | 121810 | Shipping | Sales order detail (FFSO-0671967: Company Shop Ltd) |
| 22 | 121900 | Planning | GRN/EDI processing records (Processed/Failed/Validation error) |
| 23 | 121933 | Warehouse | Item Arrival Journal - GRN detail (Froch Foods, 36 lines) |
| 24 | 121938 | Warehouse | Open Item Arrivals list |
| 25 | 122029 | Warehouse | Transfer order creation form |
| 26 | 122045 | Warehouse | Transfer orders list (inter-warehouse: MVE→ForzDG, etc.) |
| 27 | 122057 | Warehouse | Transfer order detail (FZTO-009355: Mini Satay Chicken Skewers) |
| 28 | 122320 | Production | Routes detail (FA1915-L03, versions, approval) |
| 29 | 122341 | Production | Routes list with search (all route numbers) |
| 30 | 122415 | Technical | Formula Details + Audit report (Power BI - change tracking) |
| 31 | 122509 | Technical | Product detail - Purchase tab (pricing, tolerances, suppliers) |

---

## Key Data Structures Extracted

### 1. PRODUCT (Released Product Details)

**From screenshots 3 & 4 - Product FA5022 "Premium Finely Sliced Honeyroast Ham 9 x 400g"**

#### Fields We Already Have in MonoPilot:
- Product type, subtype, number, name, description
- Unit of measure
- Batch tracking

#### Fields We Should ADD to MonoPilot:

| Field | D365 Section | MonoPilot Relevance | Priority |
|-------|-------------|---------------------|----------|
| **Net weight** | Weight Measurements | Essential for yield calc | HIGH |
| **Tare weight** | Weight Measurements | Pack weight deduction | HIGH |
| **Gross weight** | Weight Measurements | Shipping/logistics | HIGH |
| **Shelf life period (days)** | Manage Stock | Expiry date calculation | HIGH |
| **Best before period (days)** | Manage Stock | FEFO picking | HIGH |
| **Batch merge date calculation** | Manage Stock | Batch consolidation rules | MEDIUM |
| **Yield percent** | Manage Stock | Expected yield (100% default) | HIGH |
| **Catch weight item** (toggle) | Catch Weight | Variable weight products | HIGH |
| **CW unit** | Catch Weight | Catch weight UOM | HIGH |
| **Nominal/Min/Max quantity** | Catch Weight | CW tolerance range | HIGH |
| **Packing group** | Packaging | Pack type classification | MEDIUM |
| **Packing quantity** | Packaging | Units per pack | HIGH |
| **Shelf advice period (days)** | Item Data | Customer-facing shelf life | MEDIUM |
| **Batch number group** | Tracking | Batch ID format template | MEDIUM |
| **Storage dimension group** | Administration | Site/Warehouse/Location rules | LOW (we use simpler model) |
| **Reservation hierarchy** | Administration | How stock is reserved | LOW |
| **Item model group** | Administration | Costing method (FIFO etc) | MEDIUM |
| **Search name** | Identification | Quick search alias | LOW |
| **Regulated product** | Compliance | Regulatory flag | MEDIUM |
| **Arrival handling time** | Shipping | Lead time for GRN | MEDIUM |

### 2. FORMULA / BOM (Bill of Materials)

**From screenshots 7, 8, 9 - Formula lines and Co-Products**

#### Structure in D365:
```
Formula Header:
  - FormulaID (versioned: FA1832A, FA1838A)
  - Formula Active? (Y/N)
  - Formula Approved? (Y/N)
  - Item Made (finished product)

Formula Lines:
  - Item Number (component)
  - Quantity (per batch)
  - Plan Group
  - Priority
  - Variable Scrap %
  - Flush Principle (BACKFLUSH = auto-consume)

Co-Products:
  - FormulaID → Item Made → Co-product Item Number
  - Quantity (ratio, e.g. 0.10)
```

#### What MonoPilot Needs to ADD:

| Concept | Current State | What to Add | Priority |
|---------|--------------|-------------|----------|
| **Formula versioning** | We have BOM but no versions | Add version ID (A, B, C), active/approved flags | HIGH |
| **Co-Products** | NOT in PRD | Separate table: batch can produce main + co-products | HIGH |
| **Variable scrap %** | NOT in PRD | Expected waste per ingredient line | HIGH |
| **Flush principle** | NOT in PRD | Auto-backflush vs manual consumption | HIGH |
| **Plan group** | NOT in PRD | Grouping for MRP planning | MEDIUM |
| **Priority on BOM line** | NOT in PRD | Which ingredient to pick first | LOW |

### 3. BATCH ORDER (Production/Work Order)

**From screenshots 14, 15 - Batch order detail and creation**

#### D365 Batch Order Structure:
```
Identification:
  - Batch order number (auto: 251210-L15-FA4777 = date-line-item)
  - Item number + Name

Production:
  - Type: Process
  - Quantity (planned)
  - Delivery date + Time
  - Planning priority
  - CW quantity / CW unit

Status:
  - Status (Started, Ended, Report As Finished)
  - Scheduling status (Job scheduled, etc.)
  - Remain status (Material consumption)

Groupings:
  - Pool (= production line: Line15)
  - Production group

Scheduling:
  - Start date/time
  - End date/time

Other:
  - Rework batch (Y/N toggle)
  - Yield % (default 100)
  - Formula number + date
  - Route number
  - Colour (visual batch identifier!)
  - Reservation method
  - Release to warehouse
```

#### MonoPilot Comparison:

| D365 Field | MonoPilot Status | Action | Priority |
|-----------|-----------------|--------|----------|
| Batch order number | We have WO number | OK - keep our format | - |
| Pool (=Line) | We have machine_id | OK - equivalent | - |
| Production type | NOT explicit | Add: Process vs Discrete | LOW |
| CW quantity | NOT in PRD | Add for catch weight | HIGH |
| Rework batch flag | NOT in PRD | Add: marks batch as rework | MEDIUM |
| Colour code | NOT in PRD | Visual identifier for line scheduling | LOW |
| Scheduling status | We have basic status | Add: scheduling sub-status | MEDIUM |
| Remain status | NOT in PRD | Track what's left to do | MEDIUM |
| Planning priority | NOT in PRD | Numeric priority for scheduling | MEDIUM |
| Release to warehouse | NOT in PRD | Trigger warehouse work creation | HIGH |

### 4. PRODUCTION REPORTING (Job Checker / Overview)

**From screenshots 5, 6, 10, 11, 13 - Production reports**

#### Key Metrics D365 Tracks:

**Per Batch Order:**
- Qty Planned vs Qty Made → Qty Made %
- Wgt Consumed vs Wgt Made → Wgt Yield %
- Wgt Diff (variance)
- Fat Waste, Floor Waste, Giveaway (waste categories!)
- Wgt Made Co-product
- Total Meat Usage
- Meat Yield %

**Per Production Line (Attainment):**
- Sum of Fat Waste
- Sum of Floor Waste
- Sum of Giveaway
- Average of Target Yield

**Consumption Tracking:**
- Item Consumed + Item Group (RawMeat, Packaging)
- LPN (License Plate Number) - they track which LP was consumed!
- Batch ID of consumed material
- Qty Consumed + Wgt Consumed
- Consumed Date/Time
- Linked to Batch Order + Line

#### What MonoPilot Should ADD:

| Concept | Priority | Notes |
|---------|----------|-------|
| **Waste categories** (fat, floor, giveaway) | HIGH | We only have generic waste. Food mfg needs specific types |
| **Weight-based yield** (not just qty) | HIGH | Wgt Consumed vs Wgt Made is the real yield |
| **Meat yield %** | HIGH | Industry-specific KPI |
| **Target yield per product** | HIGH | Expected yield to compare against |
| **LP-level consumption tracking** | HIGH | Which specific LP was consumed (we have LP but need consumption link) |
| **Consumption by Item Group** | MEDIUM | RawMeat vs Packaging breakdown |
| **Co-product output tracking** | HIGH | Track main + co-product output |

### 5. PURCHASE ORDERS

**From screenshots 2, 16, 17 - PO list and creation**

#### D365 Create PO Form (TOO MANY FIELDS!):
```
Required: Supplier account, Currency, Language
Auto-filled: PO number, Accounting date, Orderer

Page 1 (Header):
  - Supplier account → auto-fills Name, Contact, Address
  - Delivery address
  - Purchase type
  - Invoice account
  - Site + Warehouse
  - Dates (Accounting, Requested receipt)

Page 2 (More header):
  - Project ID, Purchase agreement
  - Intercompany toggle
  - Currency, VAT number
  - Buyer group, Pool
  - Orderer, Requestor
  - Language
  - Change management toggle
  - Unplanned purchases section
```

#### MonoPilot Simplified PO (User-Friendly Approach):

**Step 1 - User picks supplier:**
→ Auto-fill: name, contact, address, currency, payment terms, default warehouse

**Step 2 - User adds lines (items + qty):**
→ Auto-fill: unit price (from last PO or trade agreement), UOM, tax code, delivery address

**Step 3 - Review & Submit:**
→ System calculates: totals, tax, expected delivery date

**Fields we DON'T need:**
- Intercompany (single-company for now)
- Buyer group, Pool (over-engineering)
- Project ID (no project accounting)
- Purchase agreement (future feature)
- Language (system language)
- Unplanned purchases section

### 6. WAREHOUSE / INVENTORY

**From screenshots 1, 12 - On-hand stock and work orders**

#### On-Hand Stock View:
- Grouped by Location → shows items at each location
- Columns: Item number, Product name, Batch number, Location, Stock status, Licence plate, Physical stock, Unit, Warehouse
- Filters: Site, Warehouse, Item number

#### Warehouse Work Types:
- **Cycle counting** (Dry Goods Counting template)
- **Raw material picking** (RM Picking template)
- Work ID, User ID, Work creation number, Work status, Order number

#### MonoPilot Already Has Most of This:
- LP-based inventory ✓
- Location hierarchy ✓
- Batch tracking ✓
- Stock status could be added (Available, On Hold, QC Hold, Expired)

### 7. PRODUCTION DASHBOARD

**From screenshot 13 - Summary tiles**

#### D365 Production Dashboard Tiles:
1. Open Batch Orders (count)
2. Line 01-10 Started
3. Line 11-23 Started
4. Process Started
5. Conti Line Started
6. Chicken Line Started
7. Ended Batch Orders
8. Consumption Unposted
9. Unstarted BO's Past Dates (overdue!)
10. RAF End Orders

#### MonoPilot Dashboard Design (Simplified):
Instead of 10+ tiles, we should have:
1. **Active Batches** (total running now)
2. **Today's Schedule** (planned vs started)
3. **Overdue Orders** (not started, past due)
4. **Pending Consumption** (need posting)
5. **Today's Yield** (actual vs target)
6. **Alerts** (quality holds, low stock, equipment issues)

---

## SUMMARY: What to Add to MonoPilot PRD

### HIGH Priority (must add to PRD)

1. **Catch Weight support** - Products can be variable weight. Track nominal, min, max. CW unit separate from inventory unit.

2. **Co-Products** - A batch order can produce main product + co-products (e.g., trim, offcuts). Need co-product table linked to formula.

3. **Waste Categories** - Not just "waste %" but: Fat Waste, Floor Waste, Giveaway, Rework. Configurable per org.

4. **Weight-Based Yield** - Track Wgt Consumed vs Wgt Made, not just quantity. Meat Yield % is key KPI.

5. **Formula Versioning** - BOM/Formula needs version control with Active/Approved flags. Multiple versions can exist, only one active.

6. **Variable Scrap & Backflush** - Per BOM line: expected scrap %. Flush principle: manual vs auto-backflush on batch completion.

7. **Product Weight Fields** - Net weight, tare weight, gross weight on product master.

8. **Shelf Life Fields** - Shelf life period, best before period, shelf advice period (all in days). Auto-calculate expiry dates.

9. **LP Consumption Tracking** - Record which specific LPs were consumed in each batch order (full traceability).

10. **Release to Warehouse** - Batch order → triggers pick list / warehouse work for raw materials.

### MEDIUM Priority (enhance PRD)

11. **Stock Status** - Add status dimension: Available, QC Hold, Blocked, Expired
12. **Target Yield per Product** - Expected yield % stored on product, compared to actual
13. **Rework Batch Flag** - Mark work orders as rework (different costing, tracking)
14. **Batch Merge Date Calculation** - Rules for combining batches (Manual, Earliest, Latest)
15. **Planning Priority** - Numeric priority on work orders for scheduling
16. **Consumption by Item Group** - Classify consumption as RawMeat, Packaging, Consumables
17. **Batch Number Format** - Configurable batch number templates per product group

### LOW Priority (future consideration)

18. **Production Type** (Process vs Discrete) - For now we're Process only
19. **Colour Code on Batch** - Visual identifier for line scheduling
20. **Reservation Hierarchy** - Complex D365 concept, we use simpler model

---

## WHAT WE DO BETTER THAN D365

MonoPilot advantages to maintain:

1. **Simplified PO Creation** - Pick supplier → add items+qty → done. No 30-field forms.
2. **Modern Dashboard** - 6 meaningful tiles, not 10+ confusing ones
3. **Mobile-First** - Scanner/PWA for production floor, not desktop-only
4. **Smart Defaults** - System fills everything it can from master data
5. **Clean Navigation** - Module-based, not the D365 "everything in favourites" mess
6. **Real-time Updates** - Supabase realtime, not batch posting
7. **Intuitive Yield View** - Visual charts, not just numbers in tables

---

## SCREENSHOTS NEEDED (Request to User)

To complete the analysis, these additional screenshots would be helpful:

### HIGH Value:
1. **Sales Order creation** - How shipping/customer orders look
2. **Quality/Inspection** - Any QC forms, test results, batch release
3. **Item arrival / GRN** - How goods receipt works
4. **BOM/Formula Designer** - The tree view of a formula (not just the flat list)

### MEDIUM Value:
5. **Routing/Route** - Production routing (operations per product)
6. **Supplier master** - What fields are on a supplier record
7. **Customer master** - What fields are on a customer record
8. **Costing** - Standard cost calculation or variance reports

### LOW Value (nice to have):
9. **Warehouse mobile device menus** - What scanner options exist ← RECEIVED (120819 shows menu structure)
10. **Transfer orders** - Inter-warehouse movements ← RECEIVED (122029, 122045, 122057)
11. **Cycle counting** - How physical counts work

---

## BATCH 2 ANALYSIS (14 New Screenshots)

### 8. VAT / TAX CODES

**From screenshot 120717 - VAT codes**

D365 has 16 tax codes for Forza Foods:
```
ENT        - Entertainment (12.5%)
EU-STD     - EU Standard rated
EU-ZERO    - EU Zero rated
EXEMPT     - Exempt
GROUP      - Group
MILEAGE    - Mileage
POL-EXEMPT - Poland Exempt
POL-RED    - Poland Reduced rated
POL-STD    - Poland Standard rated
POL-ZERO   - Poland Zero rated
RC-        - Reverse charge -
RC+        - Reverse charge +
REDUCED    - Reduced rated
STD        - Standard rated
VATONLY    - VAT only
ZERO       - Zero rated
```

Detail fields per code: Settlement period, Ledger posting group, VAT currency, Conditional VAT, Packing Duty, Invoicing print codes.

**MonoPilot Impact**: We already have tax_codes table. Key additions:
- Multi-country tax codes (POL-* for Poland operations) → supports multi-site
- Reverse charge mechanism (RC+/RC-) → important for B2B cross-border
- Packing duty / levy → relevant for food packaging compliance

### 9. SALES ORDERS

**From screenshots 121732, 121810 - Sales order list and detail**

#### Sales Order Header:
```
- Sales order number (FFSO-0671967, auto-generated)
- Customer account (SCS006) → Customer name (Company Shop Ltd)
- Order type: Sales order
- Status: Open order / Invoiced
- Created by, Date/time created
- Mode of delivery
```

#### Sales Order Lines:
```
- Item number (FH6319)
- Product name (DELI CUISING COOKED CHICKEN)
- Variant number
- Sales category
- CW quantity / CW unit (catch weight!)
- Quantity: 70.000000
- Unit: each
- Pack quantity
- Delivery type: Stock
- Unit price, Price unit, Net amount
- Discount %, Discount amount
- Ship date
- Delivery name (COMPBARNSL = delivery location)
- Source code
```

#### Tabs on Sales Order:
- Lines / Ship-to info / Charges
- Sub-tabs: Notes, Continuity schedule, Reservation
- Ribbon: Sales order, Sell, Manage, Pick and pack, Invoice, Commerce, General, Warehouse, Transportation, Credit management

**MonoPilot Impact**:

| D365 Field | MonoPilot Status | Action | Priority |
|-----------|-----------------|--------|----------|
| Sales order number | We have it | OK | - |
| CW quantity on SO line | NOT in PRD | Add for catch weight products | HIGH |
| Pack quantity | NOT in PRD | How many packs (vs units) | HIGH |
| Delivery type (Stock) | NOT explicit | Add: Stock vs Direct delivery | MEDIUM |
| Mode of delivery | NOT in PRD | Carrier/delivery method | MEDIUM |
| Ship-to info tab | Partial | We need delivery address per order | HIGH |
| Charges tab | NOT in PRD | Extra charges per order (delivery fee etc.) | MEDIUM |
| Credit management | NOT in PRD | Credit limit check before order confirm | MEDIUM |
| Continuity schedule | NOT needed | D365-specific, skip | - |

### 10. GRN / ITEM ARRIVAL

**From screenshots 121900, 121933, 121938 - GRN processing**

#### EDI/GRN Processing (121900):
```
Record ID: R0312-000055604 (auto)
Company: FORZ
PO number: FFPO-0570776
Supplier order ref: OK8260 / OKB235886
Supplier account: VN-01492 / VN-00604 etc.
Status: Processed / Failed / Validation error
GRN file: GRN_031250k.xlsx
```

#### Item Arrival Journal (121933):
```
Header:
  - Journal number: 010671
  - Journal type: Item arrival
  - Description: Item Arrivals Journal
  - From Supplier: Froch Foods
  - Reference: Transfer order receive
  - Load ID: L000843
  - Delivery note

Lines:
  - Log, GS1-128 (barcode field!)
  - Item number: FRM1850
  - Quantity: 81, 294, 322, 312, 318, 324 (multiple lines same item = different pallets/LPs)
```

#### Open Item Arrivals List (121938):
```
- Journal, Name (IAJ)
- Description, Lines count (36)
- Posted (Y/N)
- Arrival Date: 09/01/2026
- From Supplier: Froch Foods
- Load ID: L000843
- Transfer order number: FZTO-009431
```

**MonoPilot Impact**:

| Concept | MonoPilot Status | Action | Priority |
|---------|-----------------|--------|----------|
| GRN linked to PO | We have GRN concept | Ensure PO→GRN linkage is solid | HIGH |
| GS1-128 barcode on arrival | We have GS1 concept | Ensure GRN capture scans GS1-128 | HIGH |
| Multiple lines per item (=pallets) | LP-based already | Good - each line becomes an LP | - |
| EDI processing status | NOT in PRD | Future: EDI integration for GRN | LOW |
| Load ID concept | NOT in PRD | Group multiple PO arrivals into one "load" | MEDIUM |
| Item arrival journal | We use GRN | Our GRN is equivalent, simpler | - |
| Validation errors on GRN | NOT explicit | Add GRN validation (qty vs PO, item match) | HIGH |

### 11. TRANSFER ORDERS (Inter-Warehouse)

**From screenshots 122029, 122045, 122057 - Transfer orders**

#### Transfer Order Structure:
```
Header:
  - Transfer number: FZTO-009461 (auto)
  - From warehouse (dropdown)
  - To warehouse* (required)
  - Ship date, Receipt date
  - Transfer status: Created → Shipped → Received

Lines:
  - Item number
  - Location
  - Transfer quantity
  - CW transfer qty (catch weight!)
  - Ship date, Receipt date
  - Product name
  - Reserve items (checkbox)
  - Packing quantity
```

#### Real Warehouse Names (from list):
- **MVE** - external supplier warehouse?
- **ForzDG** - Forza Dry Goods warehouse
- **OAKK** - Oakfield warehouse
- **IBLL** - another location

**MonoPilot Impact**:

| Concept | MonoPilot Status | Action | Priority |
|---------|-----------------|--------|----------|
| Transfer orders | In Warehouse PRD (basic) | Enrich: header+lines model, statuses | HIGH |
| Multi-warehouse | Module 11 (multi-site) planned | Transfer orders are the bridge | HIGH |
| CW transfer qty | NOT in PRD | Catch weight on transfers too | HIGH |
| Ship date vs Receipt date | NOT explicit | 2-date model for in-transit tracking | MEDIUM |
| Reserve items on transfer | NOT in PRD | Reserve stock at source before ship | MEDIUM |

### 12. ROUTES (Production Routing)

**From screenshots 122320, 122341 - Production routes**

#### Route Structure:
```
Header:
  - Route number: FA1915-L03 (item-line format)
  - Name
  - Item group: FinGoods
  - Approved by: FOR10262
  - Approved: Yes/No toggle

Versions:
  - Item number, Site
  - From date, To date (effectivity)
  - From qty (minimum batch size)
  - Active, Approved by, Approved

Route naming pattern: FA{item}-L{line_number}
  FA1832-L16, FA1838-L16, FA2443-L08, FA2601-L02/L03/L13
  → Each product can have different routes per production line!
```

**MonoPilot Impact**:

| Concept | MonoPilot Status | Action | Priority |
|---------|-----------------|--------|----------|
| Routes (operation sequence) | We have "routings" concept | Strengthen: route per product-line combo | HIGH |
| Route versioning | NOT in PRD | Version with effectivity dates + approval | MEDIUM |
| Product-Line specific routes | NOT explicit | Same product, different route per line | HIGH |
| Route approval workflow | NOT in PRD | Approval before route can be used | MEDIUM |
| Minimum batch qty per route | NOT in PRD | Route version valid from certain qty | MEDIUM |

### 13. FORMULA AUDIT TRAIL

**From screenshot 122415 - Formula Details and Audit (Power BI)**

#### Current Formula Details:
```
Columns: Formula ID, Formula Name, Line Rec ID, Item Made, Item Number,
         Quantity, Line Valid From/To Date, Priority, Variable Scrap,
         Formula Active?, Formula Approved?, Flushing Principle

Example: KB1300 "Back R'less Unsmk 12sl 16 x 500g Café"
  - KR001: qty 8.96, priority 1, scrap 0.11, MANUAL flush
  - KR002: qty 0.00, priority 2, scrap 0.01, MANUAL flush
  - KR003: qty 0.00, priority 3, scrap 0.01, MANUAL flush
```

#### Formula Audit (Change History):
```
Tracks per line: Snap Date, Before/After values for:
  - Item Number, Quantity, Variable Scrap
  - Line Valid dates
  - Priority, Formula Active/Approved
  - Flushing Principle

Red highlighting = changed fields!
```

Key observations:
- **BACKFLUSH** vs **MANUAL** flushing principle per ingredient
- **Variable scrap** ranges from 0.01 to 10.00 (1% to 1000%!)
- **Priority** determines picking/consumption order (1=first)
- Formula lines have **valid from/to dates** (effectivity)

**MonoPilot Impact**:

| Concept | MonoPilot Status | Action | Priority |
|---------|-----------------|--------|----------|
| Formula change audit trail | NOT in PRD | Track who changed what, when | HIGH |
| Line-level effectivity dates | NOT in BOM model | Add valid_from/valid_to per BOM line | MEDIUM |
| Flushing principle per line | NOT in PRD | BACKFLUSH (auto) vs MANUAL per ingredient | HIGH |
| Priority per BOM line | NOT in PRD | Consumption/picking order | MEDIUM |

### 14. PRODUCT PURCHASE TAB

**From screenshot 122509 - Product FA5022 Purchase settings**

#### Purchase-specific product fields:
```
PURCHASE ORDER:
  - Unit: Each
  - Over-delivery: 1,000.00 (max over-receive %)
  - Under-delivery: 99.00 (max under-receive %)
  - Intercompany stopped: No

ADMINISTRATION:
  - Buyer group
  - Item price tolerance group
  - Supplier (default/preferred)

TAXATION:
  - Item VAT group

PRICES:
  - Price: 0.00 (base purchase price)
  - Price quantity: 1.00
  - Incl. in unit price: No

CHARGES:
  - Price charges: 0.00
  - Charges quantity / group

DISCOUNTS:
  - Line discount group
  - Multiline discount
  - Total discount: Yes

SUPPLIER REBATE:
  - Supplier rebate item group

APPROVED SUPPLIER:
  - Check method: No check
  - Pricing precision
```

**MonoPilot Impact**:

| Field | MonoPilot Status | Action | Priority |
|-------|-----------------|--------|----------|
| Over/Under delivery tolerance | NOT in PRD | % tolerance for GRN vs PO qty | HIGH |
| Default supplier per product | NOT on product | Add preferred_supplier_id | HIGH |
| Item VAT group | We have tax_code on product | OK - equivalent | - |
| Purchase price on product | NOT explicit | Default purchase price per item | MEDIUM |
| Approved supplier check | NOT in PRD | Restrict which suppliers can supply item | MEDIUM |
| Price tolerance group | NOT needed | Over-engineering for SME | - |
| Rebates/discounts | NOT in PRD | Future: supplier rebate tracking | LOW |

### 15. WAREHOUSE MODULE STRUCTURE

**From screenshot 120819 - Full warehouse navigation**

#### D365 Warehouse Management Sub-modules:
```
OPERATIONS:
  - Loads (All/Active/Open/Waved/Picking/Ready to ship)
  - Inbound/Outbound load planning workbenches
  - Release to warehouse
  - Shipments
  - Outbound waves
  - Work (All work, details, line details, stock transactions)
  - Packing and containerization
  - Cycle counting
  - Replenishment

SETUP:
  - Warehouse mgmt parameters
  - Location directives (rules for where to put/pick)
  - Number sequences
  - Load posting methods
  - Worker setup
  - Work user access policies

MOBILE DEVICE:
  - Mobile device menu + menu items
  - Return item receiving policies
  - Disposition codes (what to do with returns)
  - Cluster profiles (group picks)
  - Field names/priority/brands/user settings/steps

WAREHOUSE CONFIG:
  - Sites, Warehouses, Warehouse groups
  - Locations (setup wizard, formats, stocking limits, profiles, types)
  - Dock management, Zone groups, Zones
  - Unit sequence groups, Pack size categories
  - Licence plates, Fixed locations

OTHER:
  - Containers, Packing, Cycle counting setup
  - GS1 setup
  - Release to warehouse config
  - Return items, Process mining
```

**MonoPilot Comparison**:
We have a simpler model which is GOOD for SME. Key concepts we should ensure we cover:
- **Location directives** → We need basic put-away rules (where to store by item type)
- **Disposition codes** → For returns: Accept, Reject, Quarantine, Scrap
- **Dock management** → Not needed for SME
- **Wave processing** → Not needed, we do direct picks
- **Load planning** → Simplified: just shipments, not complex load building

---

## UPDATED SUMMARY: Complete PRD Enhancement List

### HIGH Priority Additions (from all 31 screenshots)

**Product Master:**
1. Net/Tare/Gross weight fields
2. Shelf life / Best before / Shelf advice periods (days)
3. Catch weight support (toggle, CW unit, nominal/min/max qty)
4. Yield percent (expected)
5. Default/preferred supplier
6. Over/Under delivery tolerance %
7. Purchase price (default)

**Formula/BOM:**
8. Formula versioning (active/approved flags)
9. Co-Products table
10. Variable scrap % per line
11. Flushing principle per line (BACKFLUSH/MANUAL)
12. Priority per line
13. Line effectivity dates (valid from/to)
14. Formula change audit trail

**Production:**
15. Waste categories (fat, floor, giveaway + configurable)
16. Weight-based yield tracking (wgt consumed vs wgt made)
17. Target yield per product
18. Rework batch flag
19. Release to warehouse (trigger pick lists)
20. Route per product-line combination
21. Route versioning + approval

**Sales Orders:**
22. CW quantity on SO lines
23. Pack quantity on SO lines
24. Delivery address per order (ship-to)
25. Mode of delivery
26. Order charges

**Warehouse:**
27. Transfer orders (header+lines, multi-status)
28. GRN validation (qty vs PO matching)
29. Stock status dimension (Available/QC Hold/Blocked/Expired)
30. Basic put-away rules (location directives simplified)
31. Disposition codes for returns

**Settings:**
32. Multi-country tax codes (supports multi-site)
33. Reverse charge VAT mechanism

### MEDIUM Priority (25 items - see individual sections above)

### What We Intentionally SKIP from D365:
- Complex load planning / wave processing
- Intercompany transactions
- Buyer groups / Purchase agreements
- Dock management
- Cluster pick profiles
- Price tolerance groups
- Supplier rebates (future)
- Reservation hierarchies (we use simpler model)
- Configuration routes / Configuration trees
- Revenue recognition
- Transportation management
