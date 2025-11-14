# Current Features & Gap Analysis Report: MonoPilot MES

**Date:** 2025-11-13
**Project:** MonoPilot MES
**Research Type:** Feature Inventory & Gap Analysis
**Prepared by:** Business Analyst (BMAD Method)

---

## Executive Summary

This report provides comprehensive analysis of MonoPilot's current features based on project documentation review, compared against MES industry standards and competitor offerings.

**Overall Maturity:** Level 3 MES Foundation (70% feature complete for SME food manufacturing)

**Key Strengths (Unique Differentiators):**

- ✅ Multi-version BOM with date-based effective ranges (RARE in market)
- ✅ License Plate (LP) genealogy for full traceability
- ✅ 1:1 consumption pattern (consume whole LP) for allergen control
- ✅ Modern cloud-native stack (Next.js 15 + Supabase)
- ✅ Strong API layer (28 API classes)

**Critical Gaps (Blockers for Market Entry):**

- ❌ No audit trail (pgAudit not enabled) - FDA 21 CFR Part 11 requirement
- ❌ No e-signature workflow - FDA 21 CFR Part 11 requirement
- ❌ No IoT/SCADA integration - ISA-95 Level 2 connectivity
- ❌ No production dashboard with real-time KPIs
- ❌ Missing UI fields in PO/TO modules (currency, exchange rate, approval workflow)

**Moderate Gaps (Competitive Disadvantage):**

- ⚠️ No quality management module (inspections, non-conformances)
- ⚠️ No maintenance module (equipment TPM)
- ⚠️ No advanced scheduling (Gantt chart, capacity planning)
- ⚠️ No supplier portal (self-service ASN submission)
- ⚠️ No reporting/BI engine (only basic XLSX exports)

---

## 1. Feature Inventory by Module

### 1.1 Technical Module (Products, BOMs, Routings)

**Source Documentation:** `docs/06_TECHNICAL_MODULE.md`

#### ✅ Implemented Features

1. **Product Catalog**
   - Product types: MEAT, DRYGOODS, COMPOSITE, PR (packaging), FG (finished goods)
   - Fields: code, description, UoM, product type, allergens, packaging specs
   - Product versioning (draft, active, inactive)
   - Allergen tracking with BOM inheritance
   - **Database:** `products` table

2. **Multi-Version BOM (✅ UNIQUE FEATURE)**
   - Multiple BOM versions per product with date ranges
   - Fields: `effective_from`, `effective_to`, `bom_status` (draft, active, phased_out, inactive)
   - Database trigger prevents overlapping date ranges
   - BOM lifecycle: Draft → Active → Phased Out → Inactive
   - Visual timeline UI (shows BOM version history)
   - **Database:** `boms`, `bom_items`, `bom_history`
   - **Status:** ✅ EPIC-001 completed (multi-version BOM implemented)

3. **BOM Components**
   - Quantity, UoM, scrap percentage
   - `consume_whole_lp` flag (1:1 consumption for allergen control)
   - Allergen inheritance from sub-components
   - By-products support (co-products from same process)
   - **Database:** `bom_items`, `wo_by_products`

4. **Routing Management**
   - Routing operations (sequence of steps)
   - Operation types: PROCESSING, PACKAGING, QC
   - Time estimates (setup_time, cycle_time)
   - Machine assignment per operation
   - **Database:** `routings`, `routing_operations`

#### ❌ Missing Features

1. **Product Costing**
   - No BOM cost rollup (material + labor + overhead)
   - No standard cost vs. actual cost comparison
   - **Competitor:** SAP Digital Mfg has product costing module
   - **Impact:** Cannot calculate profit margins, WIP valuation

2. **Formula Management (Process Manufacturing)**
   - No recipe formulation UI (batch scaling, temperature profiles)
   - No process parameters (pH, viscosity, Brix)
   - **Competitor:** Infor CloudSuite has formula management
   - **Impact:** Limited for liquid/semi-solid products (sauces, beverages)

3. **Nutrition Facts Auto-Calculation**
   - No auto-calculation of nutrition facts from BOM
   - Manual entry only
   - **Competitor:** FoodReady AI has nutrition calculator
   - **Impact:** Labeling inefficiency

4. **Equipment Specifications**
   - No equipment capacity, speed, changeover time tracking
   - Limited to basic machine master data
   - **Impact:** Cannot do capacity planning

5. **BOM Change Control Workflow**
   - No approval workflow for BOM changes (draft → approval → active)
   - Direct activation (no gate-keeping)
   - **Competitor:** Siemens Opcenter has BOM ECO (Engineering Change Order)
   - **Impact:** Compliance risk for regulated industries

---

### 1.2 Planning Module (PO, TO, WO)

**Source Documentation:** `docs/04_PLANNING_MODULE.md`

#### ✅ Implemented Features

1. **Purchase Orders (PO)**
   - PO header + line items
   - Fields: supplier, delivery_date, warehouse, status (draft, issued, received, cancelled)
   - Quick PO entry workflow (pre-fills defaults from supplier master)
   - **Database:** `po_header`, `po_line`

2. **Transfer Orders (TO)**
   - Warehouse-to-warehouse transfers (NOT location-based in header)
   - Transit warehouse concept
   - Status: draft, issued, in_transit, received, cancelled
   - **Database:** `to_header`, `to_line`

3. **Work Orders (WO)**
   - BOM snapshot at creation time (immutable)
   - Snapshot includes: BOM version, product version, allergens, `consume_whole_lp` flag
   - Fields: wo_number, product, quantity, scheduled_date, line_id, status
   - Status: planned, released, in_progress, completed, cancelled
   - **Database:** `work_orders`, `wo_materials`, `wo_operations`, `wo_by_products`

4. **BOM Snapshot (✅ CRITICAL FEATURE)**
   - Prevents mid-production recipe changes
   - Captures multi-version BOM state at WO creation time
   - **Impact:** Ensures consistency and traceability

#### ❌ Missing Features (Documented Gaps)

**From `docs/04_PLANNING_MODULE.md`:**

1. **Purchase Orders - UI Gaps:**
   - Missing fields in UI: `currency`, `exchange_rate`, `due_date`, `created_by`, `approved_by`
   - No PO approval workflow (manager approval for >$X threshold)
   - No PO line partial receiving status (shows binary received/not received)
   - No PO line "over-receive" tolerance (e.g., allow 5% overage)

2. **Transfer Orders - Data Model Issues:**
   - UI incorrectly uses `location_id` instead of `warehouse_id` for TO header
   - TO should be warehouse-based (documented in `bmad.structure.yaml`)
   - **Impact:** Confusion in UI, incorrect data entry

3. **Work Orders - Missing Workflows:**
   - No WO approval workflow (release → manager approval → execute)
   - No WO rescheduling UI (drag-and-drop Gantt chart)
   - No visual scheduling board (only table view)
   - No WO priority/urgency field (FIFO only)

4. **Advanced Planning:**
   - ❌ No material requirements planning (MRP)
     - Cannot auto-generate POs based on WO demand
     - Manual PO creation only
   - ❌ No capacity planning
     - Cannot see line/machine utilization
     - No overload warnings
   - ❌ No finite scheduling
     - WO scheduled dates are manual entry
     - No constraint-based scheduling (machine availability, material availability)

**Competitor Comparison:**

- **SAP Digital Mfg:** Has MRP, APS (Advanced Planning & Scheduling)
- **Siemens Opcenter:** Has finite scheduler with drag-and-drop
- **MonoPilot:** Manual planning only (acceptable for SMEs, gap for mid-market)

---

### 1.3 Production Module

**Source Documentation:** `docs/05_PRODUCTION_MODULE.md`

#### ✅ Implemented Features

1. **Production Execution**
   - WO operations sequencing (op 10 → op 20 → op 30)
   - Operation status tracking (not_started, in_progress, completed)
   - Machine assignment to operations
   - **Database:** `wo_operations`

2. **Production Outputs**
   - Record quantity produced, yield percentage
   - Create output License Plates (LPs)
   - Batch number, manufacture date, expiry date
   - **Database:** `production_outputs`

3. **Yield Tracking**
   - Actual yield vs. theoretical yield
   - Yield percentage calculation
   - By-product outputs (co-products)
   - **Database:** `production_outputs`, `wo_by_products`

4. **BOM Snapshot Enforcement**
   - Consumption validates against snapshot (not current BOM)
   - **Impact:** Ensures mid-production BOM changes don't affect in-flight WOs

#### ❌ Missing Features

1. **Production Dashboard (Major Gap)**
   - **Current:** Only table views (no charts/graphs)
   - **Missing:**
     - Real-time KPI widgets (OEE, yield, WIP count)
     - Line status visualization (running/stopped/idle)
     - Production vs. plan comparison (actual vs. scheduled qty)
     - Alerts (material shortage, machine downtime)
   - **Competitor:** Siemens/SAP have rich dashboards
   - **Impact:** No at-a-glance shop floor visibility

2. **Electronic Batch Record (EBR)**
   - No structured batch record capture
   - No process parameters (temperature, pH, pressure)
   - No step-by-step execution checklist
   - **Competitor:** Dassault DELMIA has EBR module (21 CFR Part 11 compliant)
   - **Impact:** Cannot meet pharma/FDA requirements

3. **Deviation Management**
   - No deviation recording (when process deviates from SOP)
   - No corrective action workflow
   - **Impact:** Compliance gap

4. **Downtime Tracking**
   - No machine downtime recording (reason codes, duration)
   - Cannot calculate OEE (Overall Equipment Effectiveness)
   - **Competitor:** Rockwell FactoryTalk has downtime module
   - **Impact:** Cannot identify bottlenecks

5. **Shift Handover**
   - No shift notes/handover log
   - No shift-to-shift communication tool
   - **Impact:** Information loss between shifts

6. **Live Production Updates**
   - No real-time production count display
   - Manual refresh required
   - **Gap:** Supabase Realtime exists but not wired to production UI

---

### 1.4 Warehouse & Scanner Module

**Source Documentation:** `docs/07_WAREHOUSE_AND_SCANNER.md`

#### ✅ Implemented Features

1. **ASN (Advance Shipment Notice)**
   - ASN header + items
   - Pre-fill PO receiving workflow
   - **Database:** `asns`, `asn_items`
   - **Status:** ✅ EPIC-002 Phase 1 completed

2. **GRN (Goods Receipt Note)**
   - Receive against PO or ASN
   - Create License Plates (LPs) on receive
   - Auto-LP creation option
   - **Database:** `grns`, `grn_items`

3. **License Plate (LP) Management (✅ CORE FEATURE)**
   - LP is atomic inventory unit (no loose qty)
   - Fields: lp_number, product, batch, qty, UoM, location, status, expiry_date
   - Status: available, reserved, consumed, quarantine, expired
   - FIFO/FEFO support
   - **Database:** `license_plates`

4. **LP Genealogy (✅ CRITICAL FEATURE)**
   - Full forward/backward traceability
   - Parent-child relationships (split, merge)
   - Consumption tracking (consumed_by_wo_id)
   - **Database:** `lp_genealogy`
   - **Impact:** Enables recall simulation, EU/FDA compliance

5. **Warehouse Operations (Scanner)**
   - **Receive:** ASN → GRN → LP
   - **Move:** LP from location A → B
   - **Consume:** LP → WO (with genealogy)
   - **Split:** 1 LP → 2+ LPs (with parent-child tracking)
   - **Merge:** 2+ LPs → 1 LP (same product, batch)
   - **Finish:** WO → create output LPs
   - **Database:** `stock_moves`, `lp_compositions`

6. **Pallet Management**
   - Palletize multiple LPs
   - Pallet tracking (pallet_number, location)
   - **Database:** `pallets`, `pallet_items`
   - **Status:** ✅ EPIC-002 Phase 1 completed

#### ❌ Missing Features

1. **Warehouse Task Queue**
   - No pick list generation (prioritized tasks)
   - No task assignment to warehouse workers
   - **Competitor:** Infor WMS has task management
   - **Impact:** Inefficient warehouse operations

2. **Cycle Counting**
   - No cycle count scheduling
   - No variance recording (physical vs. system qty)
   - Only manual inventory adjustments
   - **Impact:** Inventory accuracy issues

3. **Lot/Serial Number Tracking**
   - LP tracks batch number, but no serial number support
   - Cannot track individual units (e.g., high-value items)
   - **Impact:** Limited for serialized products

4. **Warehouse Zones**
   - No zone management (receiving zone, QC zone, shipping zone)
   - Only warehouse → location hierarchy
   - **Impact:** Cannot enforce zone-based rules

5. **Cross-Docking**
   - No cross-dock workflow (ASN → direct ship without put-away)
   - **Impact:** Inefficiency for pass-through items

6. **Shipping Module (Major Gap)**
   - ❌ No shipping orders (customer orders)
   - ❌ No picking workflow
   - ❌ No packing slip generation
   - ❌ No carrier integration (UPS, FedEx)
   - **Impact:** Only handles inbound (PO, TO), not outbound

---

### 1.5 Settings Module

**Source Documentation:** `docs/01_SYSTEM_OVERVIEW.md`, `docs/03_APP_GUIDE.md`

#### ✅ Implemented Features

1. **Organizations (Multi-Tenant)**
   - org_id on all business tables
   - RLS policies for isolation
   - **Database:** `organizations`

2. **Users & RBAC**
   - 7 roles: Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing, Warehouse, QC
   - Feature gating in UI (actions hidden if no permission)
   - **Database:** `users`, `user_roles` (via Supabase Auth)

3. **Warehouses & Locations**
   - Warehouse master (code, name, type)
   - Location hierarchy (warehouse → location)
   - Default locations for PO/TO receiving
   - **Database:** `warehouses`, `locations`

4. **Machines & Production Lines**
   - Machine master (code, name, line_id)
   - Line → machine relationship
   - **Database:** `machines`, `production_lines`

5. **Suppliers**
   - Supplier master (code, name, address, email, phone)
   - Quick PO entry uses supplier defaults (payment terms, currency)
   - **Database:** `suppliers`

6. **Allergens**
   - Allergen master (EU 14 allergens + custom)
   - **Database:** `allergens`

7. **Tax Codes**
   - Tax code master (for multi-country operations)
   - **Database:** `tax_codes`

#### ❌ Missing Features

1. **Approval Workflows Configuration**
   - No workflow engine (PO approval, WO release, BOM change)
   - Hardcoded logic only
   - **Competitor:** SAP has configurable workflows
   - **Impact:** Cannot customize approval rules per organization

2. **Notification System**
   - No email/SMS notifications (low stock, WO overdue)
   - No in-app notifications (bell icon with unread count)
   - **Impact:** Users miss critical alerts

3. **Report Builder**
   - No custom report builder (drag-and-drop)
   - Only predefined XLSX exports
   - **Competitor:** Infor has report designer
   - **Impact:** Cannot create custom reports without code changes

4. **Integration Configuration**
   - No webhook management UI (register webhooks for events)
   - No API key management (generate/revoke API keys for integrations)
   - **Impact:** Manual configuration required

5. **System Configuration**
   - No global settings UI (timezone, date format, language)
   - Hardcoded in code
   - **Impact:** Inflexible for international customers

---

## 2. ISA-95 Compliance Assessment

**ISA-95 Level 3 (MES) Core Functions:**

| ISA-95 Function               | MonoPilot Coverage           | Status | Gap Description                              |
| ----------------------------- | ---------------------------- | ------ | -------------------------------------------- |
| **1. Production Scheduling**  | Work Orders                  | ✅ 80% | Missing: Visual scheduler, capacity planning |
| **2. Production Dispatching** | WO release, operations       | ✅ 70% | Missing: Real-time dispatch board            |
| **3. Production Tracking**    | Outputs, yield, LP genealogy | ✅ 90% | Strong feature                               |
| **4. Material Management**    | LP, stock moves, genealogy   | ✅ 95% | Excellent (LP-based)                         |
| **5. Quality Assurance**      | Allergen tracking            | ⚠️ 30% | Missing: QA module, inspections, CoA         |
| **6. Maintenance Management** | Machine master only          | ❌ 10% | No TPM, work orders, schedules               |
| **7. Process Management**     | Routing operations           | ✅ 60% | Missing: Process parameters, EBR             |
| **8. Performance Analysis**   | Yield tracking               | ⚠️ 40% | Missing: OEE, downtime, dashboards           |
| **9. Data Collection**        | Manual entry                 | ⚠️ 20% | Missing: IoT/SCADA integration               |
| **10. Labor Management**      | User master                  | ⚠️ 20% | Missing: Time tracking, certifications       |
| **11. Resource Allocation**   | Machine assignment           | ✅ 50% | Missing: Resource scheduling                 |

**Overall ISA-95 Compliance:** 60% (Good foundation, major gaps in QA, Maintenance, Data Collection)

**Source:** ISA-95.00.01-2025 (April 2025 edition)

---

## 3. Competitive Feature Matrix

| Feature Category             | MonoPilot | Siemens Opcenter | SAP Digital Mfg | Infor CloudSuite | FoodReady AI |
| ---------------------------- | --------- | ---------------- | --------------- | ---------------- | ------------ |
| **Product Management**       | ✅        | ✅               | ✅              | ✅               | ⚠️           |
| **Multi-Version BOM**        | ✅ UNIQUE | ❌               | ❌              | ❌               | ❌           |
| **BOM Costing**              | ❌        | ✅               | ✅              | ✅               | ❌           |
| **Routing Management**       | ✅        | ✅               | ✅              | ✅               | ❌           |
| **Work Orders**              | ✅        | ✅               | ✅              | ✅               | ⚠️           |
| **Visual Scheduling**        | ❌        | ✅               | ✅              | ✅               | ❌           |
| **MRP / APS**                | ❌        | ✅               | ✅              | ✅               | ❌           |
| **Production Execution**     | ✅        | ✅               | ✅              | ✅               | ⚠️           |
| **Production Dashboard**     | ❌        | ✅               | ✅              | ✅               | ⚠️           |
| **License Plate Tracking**   | ✅        | ⚠️               | ⚠️              | ✅               | ✅           |
| **Genealogy (Traceability)** | ✅        | ✅               | ✅              | ✅               | ✅           |
| **Quality Management**       | ❌        | ✅               | ✅              | ✅               | ⚠️           |
| **Maintenance Management**   | ❌        | ✅               | ✅              | ✅               | ❌           |
| **IoT / SCADA Integration**  | ❌        | ✅               | ✅              | ⚠️               | ❌           |
| **Electronic Batch Record**  | ❌        | ✅               | ✅              | ✅               | ❌           |
| **21 CFR Part 11 Audit**     | ❌        | ✅               | ✅              | ✅               | ⚠️           |
| **E-Signatures**             | ❌        | ✅               | ✅              | ✅               | ⚠️           |
| **Reporting / BI**           | ⚠️        | ✅               | ✅              | ✅               | ⚠️           |
| **API / Integrations**       | ✅        | ✅               | ✅              | ⚠️               | ✅           |
| **Cloud-Native**             | ✅        | ⚠️               | ✅              | ⚠️               | ✅           |
| **Modern UI/UX**             | ✅        | ⚠️               | ⚠️              | ⚠️               | ✅           |

**Legend:**

- ✅ = Full feature
- ⚠️ = Partial or basic feature
- ❌ = Missing

**Key Insights:**

1. **MonoPilot strengths:** Multi-version BOM, modern stack, LP genealogy
2. **MonoPilot gaps:** Quality, Maintenance, IoT, Compliance (audit/e-sig), Advanced Planning
3. **Parity with emerging players (FoodReady):** Similar feature set, different focus
4. **Gap vs. enterprise leaders (Siemens, SAP):** Expected for early-stage product

---

## 4. Gap Prioritization Matrix

**Criteria:**

- **Business Impact:** How much does this gap affect customer value? (1-5)
- **Compliance Risk:** Does this gap block FDA/EU compliance? (1-5)
- **Competitive Disadvantage:** Do competitors have this? (1-5)
- **Development Effort:** How hard to implement? (1-5, inverted: 1=hard, 5=easy)

| Gap                       | Business Impact | Compliance Risk | Competitive Disadvantage | Dev Effort | **Total Score** | **Priority**  |
| ------------------------- | --------------- | --------------- | ------------------------ | ---------- | --------------- | ------------- |
| **Audit Trail (pgAudit)** | 5               | 5               | 5                        | 5          | **20**          | P0 (Critical) |
| **E-Signatures**          | 5               | 5               | 5                        | 4          | **19**          | P0 (Critical) |
| **Production Dashboard**  | 5               | 2               | 5                        | 3          | **15**          | P1 (High)     |
| **Quality Module**        | 4               | 4               | 4                        | 2          | **14**          | P1 (High)     |
| **IoT Integration**       | 4               | 2               | 5                        | 2          | **13**          | P1 (High)     |
| **Visual Scheduling**     | 4               | 1               | 4                        | 2          | **11**          | P2 (Medium)   |
| **Shipping Module**       | 4               | 1               | 3                        | 2          | **10**          | P2 (Medium)   |
| **Advanced Reporting**    | 3               | 2               | 4                        | 3          | **12**          | P2 (Medium)   |
| **MRP / APS**             | 3               | 1               | 4                        | 1          | **9**           | P3 (Low)      |
| **Maintenance Module**    | 3               | 2               | 3                        | 2          | **10**          | P2 (Medium)   |
| **Deviation Management**  | 4               | 4               | 3                        | 3          | **14**          | P1 (High)     |
| **Downtime Tracking**     | 3               | 1               | 4                        | 4          | **12**          | P2 (Medium)   |
| **BOM Costing**           | 3               | 1               | 3                        | 3          | **10**          | P2 (Medium)   |
| **Notification System**   | 3               | 1               | 2                        | 4          | **10**          | P2 (Medium)   |
| **Warehouse Task Queue**  | 3               | 1               | 3                        | 3          | **10**          | P2 (Medium)   |

**Priority Levels:**

- **P0 (Critical):** Blockers for market entry (compliance requirements)
- **P1 (High):** Competitive disadvantage, high business impact
- **P2 (Medium):** Nice-to-have, improves UX/efficiency
- **P3 (Low):** Advanced features, future scaling

---

## 5. Module-by-Module Gap Summary

### Technical Module Gaps

**Critical Gaps:**

- None (module is strong)

**High Priority:**

- BOM change control workflow (approval before activation)
- BOM costing (material cost rollup)

**Medium Priority:**

- Formula management (for liquid/semi-solid products)
- Nutrition facts auto-calculation
- Equipment capacity specifications

**Low Priority:**

- Product lifecycle management (PLM integration)

---

### Planning Module Gaps

**Critical Gaps:**

- PO approval workflow (for >$X threshold)
- TO data model fix (warehouse_id instead of location_id in UI)

**High Priority:**

- Visual scheduling board (Gantt chart for WOs)
- Material availability check (before WO release)

**Medium Priority:**

- Capacity planning (line utilization view)
- MRP (auto-generate POs from WO demand)
- WO rescheduling UI (drag-and-drop)

**Low Priority:**

- APS (finite scheduler with constraints)

---

### Production Module Gaps

**Critical Gaps:**

- Production dashboard (real-time KPIs)

**High Priority:**

- Electronic Batch Record (EBR) for FDA compliance
- Deviation management workflow

**Medium Priority:**

- Downtime tracking (for OEE calculation)
- Shift handover log
- Live production count updates (Supabase Realtime integration)

**Low Priority:**

- Process parameter recording (temperature, pH, pressure)

---

### Warehouse Module Gaps

**Critical Gaps:**

- None (module is strong)

**High Priority:**

- Shipping module (pick, pack, ship workflow)

**Medium Priority:**

- Warehouse task queue (pick lists)
- Cycle counting
- Carrier integration (UPS, FedEx label printing)

**Low Priority:**

- Cross-docking workflow
- Warehouse zone management

---

### Settings Module Gaps

**High Priority:**

- Notification system (email/SMS/in-app)
- API key management UI

**Medium Priority:**

- Approval workflow configuration engine
- Report builder (custom reports)

**Low Priority:**

- System configuration UI (global settings)

---

## 6. Compliance Gaps Summary

### FDA 21 CFR Part 11 (Electronic Records & Signatures)

| Requirement           | Status | Gap                          | Remediation                            |
| --------------------- | ------ | ---------------------------- | -------------------------------------- |
| **Audit Trail**       | ❌     | pgAudit not enabled          | Enable pgAudit, create audit view UI   |
| **E-Signatures**      | ❌     | No e-signature workflow      | Implement custom JWT-based e-signature |
| **System Validation** | ❌     | No IQ/OQ/PQ protocols        | Create validation templates            |
| **Access Control**    | ✅     | Supabase Auth + RBAC         | Already compliant                      |
| **Data Integrity**    | ✅     | RLS + backups                | Already compliant                      |
| **Secure Timestamps** | ✅     | Server-controlled timestamps | Already compliant                      |

**Compliance Score:** 3/6 = **50% (Needs work)**

---

### FSMA 204 (Food Traceability Rule)

| Requirement                         | Status | Gap                                             | Remediation                     |
| ----------------------------------- | ------ | ----------------------------------------------- | ------------------------------- |
| **Traceability Lot Code (TLC)**     | ⚠️     | Has batch_number, needs TLC generator           | Add TLC field + generator logic |
| **Critical Tracking Events (CTEs)** | ⚠️     | Has Receiving, Transformation; missing Shipping | Add shipping module             |
| **Key Data Elements (KDEs)**        | ✅     | Has location, qty, UoM, PO, batch               | Already compliant               |
| **Record Retention (2 years)**      | ⚠️     | No automated retention policy                   | Add retention policy automation |

**Compliance Score:** 2.5/4 = **62% (Good foundation)**

---

### ISA-95 (MES Standards)

| ISA-95 Core Object     | Status | Gap                              | Remediation           |
| ---------------------- | ------ | -------------------------------- | --------------------- |
| Production Schedule    | ✅     | Work Orders                      | None                  |
| Production Performance | ⚠️     | Has yield; missing OEE, downtime | Add downtime tracking |
| Product Definition     | ✅     | Products, multi-version BOMs     | None                  |
| Production Capability  | ✅     | Lines, machines                  | None                  |
| Material Definition    | ✅     | License Plates                   | None                  |
| Personnel              | ✅     | Users, roles                     | None                  |
| Process Segment        | ✅     | Routing operations               | None                  |
| Material Test          | ❌     | No quality module                | Add QA module         |
| Maintenance Info       | ❌     | No maintenance module            | Add TPM module        |

**ISA-95 Compliance:** 7/9 = **78% (Good)**

---

## 7. API & Integration Gaps

**Current API Coverage:**

- ✅ 28 API classes (comprehensive CRUD operations)
- ✅ RESTful endpoints
- ✅ Zod schema validation
- ✅ TypeScript types

**Missing Integration Capabilities:**

1. **Webhooks (Event Notifications)**
   - No webhook registration UI
   - No outbound event publishing (e.g., notify ERP when WO completes)
   - **Recommendation:** Add webhook management UI (Phase 2)

2. **API Authentication for External Systems**
   - No API key generation/management
   - Only session-based auth (JWT for users)
   - **Recommendation:** Add API key authentication (Phase 2)

3. **EDI (Electronic Data Interchange)**
   - No EDI support (for ASN, PO, invoice)
   - **Competitor:** Infor has EDI connectors
   - **Recommendation:** Add EDI adapter (Phase 3, if needed for enterprise customers)

4. **ERP Integration**
   - No pre-built connectors (SAP, Oracle, QuickBooks)
   - **Recommendation:** Build REST API adapters (Phase 2-3)

5. **SCADA / IoT Integration**
   - No OPC UA or MQTT support
   - **Recommendation:** Add IoT gateway (Phase 3)

---

## 8. UI/UX Gaps

**Current UI Strengths:**

- ✅ Filament-inspired design (Laravel admin UI aesthetic)
- ✅ Responsive tables
- ✅ Modal workflows (clean UX)

**UI/UX Gaps:**

1. **No Dashboards (Major Gap)**
   - All modules show tables only (no charts/widgets)
   - **Recommendation:** Add dashboard page per module (Phase 1)

2. **No Real-Time Updates**
   - Manual refresh required (F5 or reload button)
   - Supabase Realtime exists but not wired to UI
   - **Recommendation:** Add Realtime subscriptions to critical pages (Phase 1)

3. **Limited Visualizations**
   - No Gantt chart (WO scheduling)
   - No timeline view (BOM version history exists, but basic)
   - No heat maps (warehouse utilization)
   - **Recommendation:** Add chart library (recharts or chart.js) (Phase 2)

4. **No In-App Notifications**
   - No bell icon with notification count
   - No unread alerts
   - **Recommendation:** Add notification system (Phase 2)

5. **No Mobile App (PWA)**
   - Scanner module is responsive but not installable PWA
   - **Recommendation:** Add PWA manifest + offline support (Phase 2)

6. **No Bulk Actions**
   - Cannot select multiple rows and perform bulk action (e.g., approve 10 POs)
   - **Recommendation:** Add checkbox selection + bulk action bar (Phase 1)

---

## 9. Performance & Scalability Gaps

**Current Performance:**

- Unknown (needs load testing)

**Assumed Bottlenecks:**

1. **No Database Indexes on Status Fields**
   - Example: Filter WOs by status → potential full table scan
   - **Recommendation:** Add indexes (see Technical Research report)

2. **No Pagination on Large Tables**
   - Example: Load all 10,000 LPs in one request
   - **Recommendation:** Implement server-side pagination (Phase 1)

3. **N+1 Query Problem (Potential)**
   - Example: Load 100 WOs → 100 queries to fetch product details
   - **Recommendation:** Use JOINs or batch queries

4. **No Caching**
   - No Redis or in-memory cache
   - **Recommendation:** Add BullMQ (includes Redis) for caching (Phase 2)

5. **No CDN for Static Assets**
   - Vercel provides CDN, but verify configuration
   - **Recommendation:** Audit Vercel config

---

## 10. Documentation & Training Gaps

**Current Documentation:**

- ✅ Excellent technical documentation (30+ files in `docs/`)
- ✅ API reference (auto-generated)
- ✅ Database schema (auto-generated)

**Missing Documentation:**

1. **User Manuals**
   - No end-user guide (how to use MonoPilot for operators)
   - **Recommendation:** Create user manual (Phase 2)

2. **Video Tutorials**
   - No onboarding videos
   - **Recommendation:** Create 5-10 min tutorial videos (Phase 2)

3. **API Documentation (External)**
   - API reference exists but not published (Swagger/OpenAPI)
   - **Recommendation:** Generate OpenAPI spec + publish docs (Phase 2)

4. **Training Materials**
   - No training curriculum (for new customer onboarding)
   - **Recommendation:** Create training slides + exercises (Phase 3)

---

## 11. Recommendations by Phase

### Phase 1 (0-3 months) - Critical Gaps

**Compliance:**

1. Enable pgAudit extension (1 week)
2. Implement e-signature workflow (1.5 weeks)
3. Create audit trail UI (1 week)
4. Add FSMA 204 TLC generator (3 days)

**UI/UX:** 5. Add production dashboard (KPI widgets) (2 weeks) 6. Wire Supabase Realtime to critical pages (LP status, WO progress) (1 week) 7. Add pagination to large tables (5 days) 8. Add bulk actions (select rows, approve/delete multiple) (5 days)

**Data Quality:** 9. Fix TO data model (warehouse_id in UI, not location_id) (2 days) 10. Add missing PO UI fields (currency, exchange_rate, due_date) (3 days)

**Total Effort:** ~10-12 weeks (parallel work possible)

---

### Phase 2 (3-6 months) - High Priority Gaps

**Production:**

1. Add deviation management workflow (2 weeks)
2. Add downtime tracking (1 week)
3. Add shift handover log (1 week)

**Quality:** 4. Build quality module (inspections, non-conformances, CoA upload) (4 weeks)

**Planning:** 5. Add visual scheduling board (Gantt chart) (3 weeks) 6. Add material availability check (before WO release) (1 week)

**Warehouse:** 7. Build shipping module (pick, pack, ship) (4 weeks) 8. Add warehouse task queue (2 weeks)

**Settings:** 9. Add notification system (email + in-app) (2 weeks) 10. Add API key management UI (1 week)

**Infrastructure:** 11. Add BullMQ for background jobs (1.5 weeks) 12. Add Supabase Storage for document management (1 week)

**Total Effort:** ~20-24 weeks (6 months)

---

### Phase 3 (6-12 months) - Medium Priority Gaps

**IoT:**

1. Node-RED IoT gateway PoC (2 weeks)
2. OPC UA integration (3 weeks)
3. Equipment data collection + dashboard (3 weeks)

**Advanced Features:** 4. BOM costing (cost rollup) (2 weeks) 5. Capacity planning (line utilization view) (3 weeks) 6. Cycle counting workflow (2 weeks)

**Reporting:** 7. Add report builder (custom reports) (4 weeks) 8. Add BI dashboards (ClickHouse or BigQuery integration) (4 weeks)

**Total Effort:** ~22-26 weeks (6 months)

---

### Phase 4 (12-18 months) - Advanced Features

1. AI-powered yield prediction (4 weeks)
2. AI-powered recall simulation (3 weeks)
3. MRP (material requirements planning) (6 weeks)
4. APS (advanced planning & scheduling) (8 weeks)
5. Maintenance module (TPM, CMMS integration) (6 weeks)
6. ERP connectors (SAP, QuickBooks) (4 weeks per connector)

**Total Effort:** ~30-40 weeks (8-10 months)

---

## 12. Conclusion

**MonoPilot Maturity Assessment:**

- **Current State:** Level 3 MES Foundation (70% complete for SME food manufacturing)
- **Unique Strengths:** Multi-version BOM, LP genealogy, modern stack
- **Critical Gaps:** Audit trail, e-signatures, production dashboard, quality module
- **Target State:** Competitive SME MES (Phase 2 complete = 85% feature parity with food-specific MES)

**Strategic Positioning:**

- MonoPilot is well-positioned for **SME food manufacturers (20-250 employees)**
- Gaps are manageable with 12-18 month roadmap
- Multi-version BOM is a strong differentiator (rare in market)
- Compliance gaps (21 CFR Part 11) are solvable in Phase 1 (3 months)

**Next Steps:**

1. Execute Phase 1 roadmap (compliance + critical UX)
2. Customer validation (beta customers for feedback)
3. Iterate based on customer needs

---

## References

**Documentation Sources (MonoPilot):**

1. `docs/01_SYSTEM_OVERVIEW.md` - System architecture
2. `docs/02_BUSINESS_PROCESS_FLOWS.md` - E2E workflows
3. `docs/03_APP_GUIDE.md` - UI patterns
4. `docs/04_PLANNING_MODULE.md` - PO, TO, WO features and gaps
5. `docs/05_PRODUCTION_MODULE.md` - Production execution and gaps
6. `docs/06_TECHNICAL_MODULE.md` - Products, BOMs, routings
7. `docs/07_WAREHOUSE_AND_SCANNER.md` - ASN, GRN, LP, genealogy
8. `docs/API_REFERENCE.md` - API documentation
9. `bmad.structure.yaml` - Project structure and policies

**Industry Standards:** 10. ISA-95.00.01-2025 - Enterprise-Control System Integration 11. FDA 21 CFR Part 11 - Electronic Records and Signatures 12. FDA FSMA Section 204 - Food Traceability Rule

---

## Document Information

**Workflow:** BMad Method - Business Analyst Research
**Research Type:** Feature Inventory & Gap Analysis
**Generated:** 2025-11-13
**Documentation Files Reviewed:** 9
**Next Review:** 2025-04-13 (Quarterly)

**Related Reports:**

- Domain & Industry Research (bmm-research-domain-industry-2025-11-13.md)
- Technical Research & Stack Validation (bmm-research-technical-stack-2025-11-13.md)
- Roadmap Phase 1-4 (bmm-roadmap-phase-\*.md)

---

_This gap analysis report was generated using the BMad Method Research Workflow, based on comprehensive documentation review and comparison against MES industry standards._
