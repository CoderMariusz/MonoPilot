# MonoPilot - Master Product Requirements Document (PRD)

## Document Info
- **Version:** 2.0
- **Created:** 2025-12-09
- **Updated:** 2025-12-09
- **Author:** PM Agent (John)
- **Status:** Approved
- **Project Brief:** @docs/1-BASELINE/product/project-brief.md
- **Discovery Ref:** @docs/0-DISCOVERY/DISCOVERY-REPORT.md

---

## Executive Summary

MonoPilot to Manufacturing Execution System (MES) dla przemyslu spozywczego, zbudowany na nowoczesnym stosie technologicznym (Next.js 15, React 19, Supabase). System targetuje male i srednie firmy produkcyjne (5-100 pracownikow), wypelniajac luke miedzy Excel-based chaos a niedostepnymi enterprise ERP (D365, SAP).

**Kluczowe metryki:**
- **Status MVP:** 95% complete (5 z 5 epicow, Epic 5 na 92%)
- **Total Stories:** ~350+ (132 MVP, 140 Phase 2, 90+ Phase 3)
- **Clarity Score:** 85% (Excellent)
- **Target Launch:** Q1 2025

**Core Value:** "D365 for SMB with Notion UX" - wdrozenie w tygodnie, cena dostepna dla SMB, self-service konfiguracja.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Module Map](#2-module-map)
3. [Phase Breakdown](#3-phase-breakdown)
4. [Cross-Module Features](#4-cross-module-features)
5. [Key Patterns](#5-key-patterns)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [API Patterns](#8-api-patterns)
9. [Scanner & Mobile](#9-scanner--mobile)
10. [Print Integration](#10-print-integration)
11. [Compliance & Food Safety](#11-compliance--food-safety)
12. [Integration Architecture](#12-integration-architecture)
13. [Out of Scope](#13-out-of-scope)
14. [Risks & Dependencies](#14-risks--dependencies)
15. [Module PRD References](#15-module-prd-references)

---

## 1. Product Overview

### 1.1 Product Vision
Manufacturing Execution System dla producentow spozywczych, ktorzy wyrosli z Excela ale nie potrzebuja wielkich systemow. Wdrozenie w tygodnie, cena dostepna dla malych firm.

### 1.2 Core Capabilities

| Capability | Description | Status |
|------------|-------------|--------|
| **Organization Management** | Multi-tenant, users, roles, warehouses | DONE |
| **Product Data Management** | Products, BOMs, Routings, Allergens | DONE |
| **Planning & Procurement** | PO, TO, MRP basics, Suppliers | DONE |
| **Production Execution** | WO lifecycle, consumption, output, yield | DONE |
| **Warehouse Management** | LP-based inventory, GRN, movements | 92% |
| **Quality Control** | QA status, holds, NCR, CoA | Phase 2 |
| **Shipping & Fulfillment** | SO, picking, packing, delivery | Phase 2 |
| **GS1 Barcode Compliance** | GTIN, GS1-128, SSCC, DataMatrix, Digital Link | Phase 2 |
| **Catch Weight** | Variable weight products for meat/fish | Phase 2 |
| **Finance Basics** | Cost tracking, margin analysis | Phase 2 |
| **Supplier Quality** | SQM basics, supplier rating | Phase 2 |
| **New Product Development** | Stage-gate, trial BOMs, costing | Phase 3 |
| **OEE & Performance** | Real-time OEE, dashboards | Phase 3 |
| **Advanced Planning/MRP** | Full MRP, capacity planning | Phase 3 |
| **AI & Digital Twin** | Predictive, simulation, optimization | Phase 3 (end) |
| **Full Compliance** | 21 CFR Part 11, certifications | Phase 4 |
| **Advanced Analytics** | BI, multi-site, market expansion | Phase 4 |

### 1.3 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 15 |
| UI Framework | React | 19 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 3.4 |
| Components | shadcn/ui (Radix) | - |
| Backend | Next.js API Routes | 15 |
| Database | PostgreSQL via Supabase | - |
| Auth | Supabase Auth (JWT) | - |
| Storage | Supabase Storage | - |
| Caching | Upstash Redis | - |
| Email | SendGrid | - |
| Hosting | Vercel (planned) | - |

---

## 2. Module Map

### 2.1 Complete Epic Index

| Epic | Module | Stories | Phase | Priority | Status | Dependencies |
|------|--------|---------|-------|----------|--------|--------------|
| 1 | Settings | ~20 | Phase 1 | P0 | DONE | None (foundation) |
| 2 | Technical | ~25 | Phase 1 | P0 | DONE | Epic 1 |
| 3 | Planning | ~30 | Phase 1 | P0 | DONE | Epic 1, 2 |
| 4 | Production | ~21 | Phase 1 | P0 | DONE | Epic 1, 2, 3 |
| 5 | Warehouse | 36 | Phase 1 | P0 | 92% | Epic 1, 2, 3 |
| 6 | Quality | 33 | Phase 2 | P1 | Planned | Epic 1, 5 |
| 7 | Shipping | 39 | Phase 2 | P1 | Planned | Epic 5, 6, 10 |
| 8 | NPD | ~35 | Phase 3 | P2 | Planned | Epic 2 |
| 9 | OEE & Performance | ~30 | Phase 3 | P2 | Planned | Epic 4, 5 |
| 10 | GS1 & Barcodes (FULL) | 34 | Phase 2 | P1 | Planned | Epic 2, 5 |
| 11 | Catch Weight | 22 | Phase 2 | P1 | Planned | Epic 2, 4, 5 |
| 12 | Finance Basics | ~18 | Phase 2 | P1 | Planned | Epic 3, 4 |
| 13 | Advanced Planning/MRP | ~40 | Phase 3 | P2 | Planned | Epic 3, 4, 5 |
| 14 | Supplier Quality | ~15 | Phase 2 | P1 | Planned | Epic 3 |
| 15 | AI & ML | ~40 | Phase 3 | P2 | Planned | All Phase 2 |
| 16 | Digital Twin | ~35 | Phase 3 | P2 | Planned | Epic 15 |
| 17 | Full Compliance | ~25 | Phase 4 | P3 | Future | All |
| 18 | Advanced Analytics | ~30 | Phase 4 | P3 | Future | All |
| 19 | Multi-Site | ~25 | Phase 4 | P3 | Future | All |

### 2.2 Module Dependency Graph

```
Epic 1 (Settings) <- Foundation
    |
    v
Epic 2 (Technical) <- Products, BOMs
    |
    +------------------+-------------------+
    |                  |                   |
    v                  v                   v
Epic 3 (Planning)    Epic 8 (NPD)       Epic 10 (GS1)
    |               [Phase 3]            [Phase 2]
    |
    +------------------+
    |                  |
    v                  v
Epic 4 (Production)  Epic 12 (Finance)
    |                [Phase 2]
    |
    v
Epic 5 (Warehouse) <- CURRENT (92%)
    |
    +------------------+-------------------+
    |                  |                   |
    v                  v                   v
Epic 6 (Quality)    Epic 11 (Catch Weight)  Epic 14 (Supplier QM)
[Phase 2]           [Phase 2 - early]        [Phase 2]
    |
    v
Epic 7 (Shipping) [Phase 2]
    |
    v
Epic 9 (OEE & Performance) [Phase 3]
    |
    v
Epic 13 (Advanced Planning) [Phase 3]
    |
    +------------------+
    |                  |
    v                  v
Epic 15 (AI/ML)    Epic 16 (Digital Twin)
[Phase 3 - end]    [Phase 3 - end]
```

### 2.3 Module Summary

#### Epic 1: Settings (DONE)
**Purpose:** Organization setup, users, warehouses, configurations

**Key Features:**
- Organization CRUD + wizard
- User management + invitations
- Warehouse & Location management
- Machine & Production Line configuration
- Allergen management (EU14 + custom)
- Tax code configuration
- Module activation/deactivation
- Dashboard + activity feed

**Database Tables:**
- `organizations`, `users`, `user_invitations`, `user_sessions`
- `warehouses`, `locations`, `machines`, `production_lines`
- `allergens`, `tax_codes`, `activity_logs`

---

#### Epic 2: Technical (DONE)
**Purpose:** Products, BOMs, Routings, Allergens, Tracing

**Key Features:**
- Product CRUD with types (RM, WIP, FG, PKG, BP, CUSTOM)
- Product versioning + history
- BOM management with date-based versions
- BOM cloning + overlap validation
- Conditional BOM items (flags: organic, vegan)
- By-products support
- Routing management (operations, machines, lines)
- LP genealogy (traceability)
- Forward/backward tracing
- Recall simulation

**Database Tables:**
- `products`, `product_version_history`, `product_allergens`, `product_type_config`
- `boms`, `bom_items`
- `routings`, `routing_operations`, `product_routings`
- `license_plates` (stub), `lp_genealogy`, `traceability_links`, `recall_simulations`
- `technical_settings`

---

#### Epic 3: Planning (DONE)
**Purpose:** Purchase Orders, Transfer Orders, Work Orders, MRP

**Key Features:**
- Supplier CRUD + default supplier per product
- Purchase Order CRUD + line management
- PO approval workflow
- PO status tracking (draft -> submitted -> approved -> receiving -> closed)
- Transfer Order CRUD + line management
- TO status tracking (draft -> released -> in_transit -> completed)
- Work Order creation (STUB)
- MRP basics (future enhancement)

**Database Tables:**
- `suppliers`, `supplier_products`
- `purchase_orders`, `po_lines`, `po_approvals`
- `work_orders` (stub)
- `transfer_orders`, `to_lines`, `to_line_lps`
- `planning_settings`

---

#### Epic 4: Production (DONE)
**Purpose:** WO execution, consumption, outputs, yield

**Key Features:**
- Work Order lifecycle (draft -> released -> in_progress -> completed -> closed)
- BOM snapshot on WO creation (immutable)
- Material consumption (LP-based)
- Production output (LP creation)
- By-product handling
- Yield tracking (planned vs actual)
- Scanner production entry
- Real-time WO status updates

**Database Tables:**
- `work_orders` (full implementation)
- `wo_materials_consumed`, `wo_outputs`
- `wo_by_products`

---

#### Epic 5: Warehouse (92% DONE)
**Purpose:** License Plates, ASN, GRN, Stock Movements, Scanner

**Key Features:**
- License Plate CRUD + numbering (LP-YYYY-NNNN)
- LP split/merge
- LP genealogy (parent-child)
- ASN (Advanced Shipping Notice)
- GRN (Goods Receipt Note) + LP creation
- Auto-print labels on receive (BROKEN - BUG-001/002)
- Stock movements (location transfers)
- Scanner receive/pick/putaway/move workflows
- Warehouse settings (MISSING UI - BUG-005)

**Database Tables:**
- `license_plates`, `lp_genealogy`
- `asns`, `asn_lines`
- `grns`, `grn_items`
- `stock_movements`
- `warehouse_settings`

**Open Bugs:**
- BUG-001: Print integration incomplete
- BUG-002: Print API stub only
- BUG-003: GRN LP navigation missing
- BUG-004: Scanner PO barcode workflow
- BUG-005: Warehouse Settings UI missing

---

#### Epic 6: Quality (Phase 2 - PLANNED)
**Purpose:** QA status, holds, specifications, NCR, CoA

**Key Features:**
- LP QA Status (pending, passed, failed, quarantine)
- QA status transition rules (state machine)
- Prevent shipping non-passed LPs
- Quality holds + investigation
- HACCP/CCP definition per routing
- CCP monitoring during production
- Product specifications z tolerancjami
- Test results recording
- NCR workflow z CAPA
- CoA management
- Quality dashboard & reports

**Database Tables (planned):**
- `quality_holds`, `hold_investigation_notes`
- `product_specifications`, `test_results`
- `non_conformance_reports`, `ncr_links`
- `certificates_of_analysis`
- `haccp_plans`, `ccp_definitions`, `ccp_records`
- `quality_settings`

---

#### Epic 7: Shipping (Phase 2 - PLANNED)
**Purpose:** Sales Orders, picking, packing, delivery

**Key Features:**
- Sales Order CRUD + lifecycle
- SO status (draft -> confirmed -> picking -> packed -> shipped -> delivered)
- Shipment creation from SOs
- Pick lists (FIFO/FEFO)
- Packing & package tracking
- Carrier + tracking info
- Packing slips + shipping labels (ZPL)
- Scanner picking/packing workflows

**Database Tables (planned):**
- `sales_orders`, `so_lines`
- `shipments`, `shipment_orders`
- `pick_lists`, `pick_shorts`
- `packages`, `package_items`
- `shipping_settings`

---

#### Epic 8: NPD (Phase 3 - PLANNED)
**Purpose:** New Product Development, Stage-Gate, formulations

**Key Features:**
- Product development workflow
- Trial BOMs + routings
- Costing analysis
- Stage-Gate process
- Approval workflow
- Launch to production

---

#### Epic 9: OEE & Performance (Phase 3 - PLANNED)
**Purpose:** Real-time OEE, performance analytics

**Key Features:**
- Real-time OEE tracking per machine/line
- Availability, Performance, Quality metrics
- Downtime tracking + categorization
- Performance dashboards
- Shift reporting
- Historical trend analysis

---

#### Epic 10: GS1 & Barcodes - FULL SCOPE (Phase 2 - PLANNED)
**Purpose:** Full GS1 compliance for retail chains

**Scope (10 tygodni):**
- GTIN-13/14 support na produktach
- GTIN validation i check digit calculation
- GS1-128 barcode generation (full AI support)
- SSCC generation dla wysylek
- GS1 DataMatrix (2D barcodes)
- GS1 Digital Link - URL-based product info
- GS1 barcode parser dla skanowania
- Label templates z GS1
- GS1 settings (company prefix)
- Batch/Lot + Expiry in barcodes

**Database Tables (planned):**
- `gs1_settings` (company prefix, check digits)
- `product_gtin` (GTIN per product)
- `sscc_sequences`
- `gs1_digital_links`

---

#### Epic 11: Catch Weight (Phase 2 - EARLY)
**Purpose:** Variable weight products (meat/fish customers)

**Key Features:**
- Catch weight product configuration
- Weight recording at receive
- Weight recording in production
- Weight in shipping (SO, pick, pack)
- Catch weight pricing (per kg vs per unit)
- Weight tolerance validation
- Inventory by weight reports
- Scale integration ready (API)

---

#### Epic 12: Finance Basics (Phase 2 - PLANNED)
**Purpose:** Cost tracking, margin analysis

**Key Features:**
- Product costing (material, labor, overhead)
- WO actual vs standard cost
- Margin analysis per product
- Cost variance reports
- Simple P&L by product line

---

#### Epic 13: Advanced Planning/MRP (Phase 3 - PLANNED)
**Purpose:** Full MRP, capacity planning

**Key Features:**
- Full MRP explosion
- Capacity planning
- Demand forecasting integration
- What-if scenarios
- Scheduling optimization
- Resource leveling

---

#### Epic 14: Supplier Quality (Phase 2 - PLANNED)
**Purpose:** SQM basics, supplier rating

**Key Features:**
- Supplier quality rating
- Incoming quality inspection
- Supplier NCR tracking
- Supplier document management
- Approved supplier list

---

#### Epic 15: AI & ML (Phase 3 - END)
**Purpose:** Predictive analytics, optimization

**Priority:** 50/50 with Digital Twin

**Key Features:**
- Predictive maintenance
- Demand forecasting
- Quality prediction
- Anomaly detection
- AI-optimized scheduling

---

#### Epic 16: Digital Twin (Phase 3 - END)
**Purpose:** Virtual simulation, process modeling

**Priority:** 50/50 with AI

**Key Features:**
- Process modeling
- BOM simulation (what-if)
- Routing simulation
- Predictive quality modeling
- Energy optimization

---

## 3. Phase Breakdown

### 3.1 Phase 1: MVP (Core Manufacturing) - 95% DONE

**Goal:** Complete manufacturing workflow from planning to warehouse

| Epic | Name | Stories | Status |
|------|------|---------|--------|
| 1 | Settings | ~20 | DONE |
| 2 | Technical | ~25 | DONE |
| 3 | Planning | ~30 | DONE |
| 4 | Production | ~21 | DONE |
| 5 | Warehouse | 36 | 92% |

**MVP Exit Criteria:**
- [ ] All Epic 1-5 stories DONE
- [ ] Print integration working (BUG-001/002)
- [ ] Warehouse Settings UI complete (BUG-005)
- [ ] Bug fixes: BUG-003, BUG-004
- [ ] RLS security audit passed
- [ ] Performance baseline established
- [ ] Test coverage >70%

**Target:** Q1 2025

---

### 3.2 Phase 2: Quality, Shipping & Food-Specific

**Goal:** Complete outbound logistics, quality compliance, GS1, catch weight

**Timeline:** Q2-Q3 2025 (8-10 miesiecy)

| Order | Epic | Name | Stories | Priority | Effort |
|-------|------|------|---------|----------|--------|
| 1 | 6 | Quality Enhanced | 33 | HIGH | 10-12 tyg |
| 2 | 11 | Catch Weight | 22 | HIGH | 6 tyg |
| 3 | 10 | GS1 & Barcodes (FULL) | 34 | HIGH | 10 tyg |
| 4 | 7 | Shipping Enhanced | 39 | HIGH | 10-12 tyg |
| 5 | 12 | Finance Basics | ~18 | MEDIUM | 4-6 tyg |
| 6 | 14 | Supplier Quality | ~15 | MEDIUM | 4 tyg |

**Total Phase 2:** ~161 stories, 44-50 tygodni

**Phase 2 Exit Criteria:**
- [ ] QA workflow complete, CCP monitoring working
- [ ] Catch weight products fully supported
- [ ] GS1 labels printing (GTIN, GS1-128, SSCC, DataMatrix, Digital Link)
- [ ] SO-to-ship workflow complete, FEFO picking working
- [ ] Basic cost tracking and margin analysis
- [ ] Supplier quality rating implemented

**Execution Order Rationale:**
1. Quality FIRST - blocks shipping, regulatory requirement
2. Catch Weight EARLY - meat/fish customers need it
3. GS1 FULL SCOPE - 10 weeks, enables Shipping labels
4. Shipping - depends on Quality + GS1
5. Finance + Supplier Quality - can parallel

---

### 3.3 Phase 3: NPD, OEE, Advanced Planning, AI/Digital Twin

**Goal:** Advanced features, optimization, AI capabilities

**Timeline:** Q4 2025 - Q2 2026 (6-8 miesiecy)

| Order | Epic | Name | Stories | Priority | Effort |
|-------|------|------|---------|----------|--------|
| 1 | 8 | NPD | ~35 | MEDIUM | 8 tyg |
| 2 | 9 | OEE & Performance | ~30 | MEDIUM | 8 tyg |
| 3 | 13 | Advanced Planning/MRP | ~40 | MEDIUM | 10 tyg |
| 4 | 15 | AI & ML | ~40 | MEDIUM | 12 tyg (end) |
| 5 | 16 | Digital Twin | ~35 | MEDIUM | 10 tyg (end) |

**Total Phase 3:** ~180 stories

**Phase 3 Exit Criteria:**
- [ ] NPD workflow complete
- [ ] Real-time OEE tracking operational
- [ ] Full MRP explosion working
- [ ] AI predictions available (predictive maintenance, demand)
- [ ] Digital Twin simulation for process modeling

**AI/Digital Twin Placement:**
- Moved to END of Phase 3 (per user decision)
- 50/50 priority between Epic 15 and Epic 16
- Can parallel if resources allow
- Builds on all Phase 2 data

---

### 3.4 Phase 4: Enterprise Features

**Goal:** Full compliance, advanced analytics, market expansion

**Timeline:** H2 2026+

| Epic | Name | Stories | Priority |
|------|------|---------|----------|
| 17 | Full Compliance (21 CFR 11) | ~25 | P3 |
| 18 | Advanced Analytics | ~30 | P3 |
| 19 | Multi-Site Operations | ~25 | P3 |

**Total Phase 4:** ~80 stories

---

## 4. Cross-Module Features

### 4.1 Multi-Tenancy

**Implementation:**
- `org_id` column on ALL tables
- Row Level Security (RLS) enabled on ALL public tables
- Tenant isolation via JWT claims

**RLS Policy Pattern:**
```sql
CREATE POLICY "tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

**Service Role Pattern:**
- Admin client (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
- Services use manual `org_id` filtering: `.eq('org_id', orgId)`
- Required: Security audit (DEBT-002) before production

---

### 4.2 Audit Trail

**Standard Columns (all tables):**

| Column | Type | Purpose |
|--------|------|---------|
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Last modification time |
| `created_by` | uuid | User who created |
| `updated_by` | uuid | User who last modified |

**Activity Logging:**
- `activity_logs` table for significant events
- User tracking for all mutations
- Action logging for compliance

---

### 4.3 Scanner Interface

**Hardware Support:**
- Dedicated scanners: Zebra, Honeywell
- Mobile devices: Samsung Galaxy, Android phones
- Camera-based scanning (fallback)

**Barcode Types:**
- 1D barcodes: Product codes, PO numbers, WO numbers
- QR codes: LP numbers, location barcodes
- GS1-128: Shipping labels (Phase 2)
- GS1 DataMatrix: Full product info (Phase 2)

**Scanner Workflows by Module:**

| Module | Workflow | Status |
|--------|----------|--------|
| Warehouse | Receive, Move, Split, Merge | 90% |
| Production | Consume, Output | DONE |
| Quality | QA Pass/Fail | Phase 2 |
| Shipping | Pick, Pack, Ship | Phase 2 |

---

### 4.4 Print Integration

**Hardware:**
- Zebra printers (ZPL format)
- Network + USB printers

**Print Types:**

| Document | Module | Status |
|----------|--------|--------|
| LP Labels | Warehouse | Blocked (BUG-002) |
| GS1-128 Labels | Shipping | Phase 2 |
| Packing Slips | Shipping | Phase 2 |
| CoA | Quality | Phase 2 |
| Shipping Labels | Shipping | Phase 2 |

---

### 4.5 Configurable Settings

**Per-Module Settings Tables:**

| Module | Settings Table | Status |
|--------|---------------|--------|
| Technical | `technical_settings` | DONE |
| Planning | `planning_settings` | DONE |
| Warehouse | `warehouse_settings` | API only (BUG-005) |
| Quality | `quality_settings` | Phase 2 |
| Shipping | `shipping_settings` | Phase 2 |
| GS1 | `gs1_settings` | Phase 2 |

---

## 5. Key Patterns

### 5.1 LP-Based Inventory

**Principle:** License Plate (LP) as atomic unit of inventory

**Rules:**
- No loose quantity tracking
- Every stock movement = LP movement
- Full genealogy (parent-child relationships)
- Traceability: forward + backward

**LP Lifecycle:**
```
Created (receive/production)
    |
    v
Available (in stock)
    |
    +--------+--------+
    |        |        |
    v        v        v
Consumed  Shipped  Split/Merge
    |        |        |
    v        v        v
Inactive (historical record)
```

**LP Numbering:** `LP-YYYY-NNNN` (configurable per org)

---

### 5.2 BOM Snapshot Pattern

**Principle:** Immutable BOM on WO creation

**Rules:**
- WO created -> captures current BOM version
- BOM stored in WO (snapshot)
- Changes to BOM don't affect existing WOs
- Ensures production consistency

**Date-Based Versioning:**
- Versions: 1.0, 1.1, 2.0
- `effective_from` and `effective_to` dates
- Overlap validation (trigger prevents conflicts)
- Status: Draft -> Active -> Phased Out -> Inactive

---

### 5.3 Catch Weight Pattern (Phase 2)

**Principle:** Variable weight products tracked by actual weight

**Rules:**
- Product flag: `is_catch_weight = true`
- LP stores both `quantity` (units) and `actual_weight` (kg)
- Pricing can be per unit or per kg
- Weight tolerance validation (min/max per product)
- Full weight audit trail

---

## 6. Functional Requirements

### 6.1 Requirements Summary by Module

| Module | FR Count | Must Have | Should Have |
|--------|----------|-----------|-------------|
| Settings | 11 | 9 | 2 |
| Technical | 18 | 14 | 4 |
| Planning | 16 | 12 | 4 |
| Production | 15 | 11 | 4 |
| Warehouse | 30 | 23 | 7 |
| Quality | 33 | 20 | 13 |
| Shipping | 39 | 22 | 17 |
| GS1 | 34 | 18 | 16 |
| Catch Weight | 22 | 11 | 11 |
| Finance | 18 | 10 | 8 |
| NPD | 35 | 20 | 15 |
| OEE | 30 | 18 | 12 |
| **Total** | **301** | **188** | **113** |

### 6.2 MVP Critical Requirements

| ID | Requirement | Priority | Status | Traces To |
|----|-------------|----------|--------|-----------|
| FR-001 | Multi-tenant organization setup | Must | DONE | Epic 1 |
| FR-002 | User management with roles | Must | DONE | Epic 1 |
| FR-003 | Warehouse & location configuration | Must | DONE | Epic 1 |
| FR-004 | Product CRUD with types | Must | DONE | Epic 2 |
| FR-005 | BOM management with versioning | Must | DONE | Epic 2 |
| FR-006 | Routing definition | Must | DONE | Epic 2 |
| FR-007 | Allergen tracking (EU14) | Must | DONE | Epic 2 |
| FR-008 | Full traceability (forward/backward) | Must | DONE | Epic 2 |
| FR-009 | Purchase Order lifecycle | Must | DONE | Epic 3 |
| FR-010 | Transfer Order management | Must | DONE | Epic 3 |
| FR-011 | Supplier management | Must | DONE | Epic 3 |
| FR-012 | Work Order lifecycle | Must | DONE | Epic 4 |
| FR-013 | Material consumption (LP-based) | Must | DONE | Epic 4 |
| FR-014 | Production output (LP creation) | Must | DONE | Epic 4 |
| FR-015 | Yield tracking | Must | DONE | Epic 4 |
| FR-016 | License Plate management | Must | 92% | Epic 5 |
| FR-017 | GRN + LP creation | Must | DONE | Epic 5 |
| FR-018 | Stock movements | Must | DONE | Epic 5 |
| FR-019 | Scanner workflows | Must | 90% | Epic 5 |
| FR-020 | Print integration (labels) | Must | Blocked | Epic 5, BUG-001/002 |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-001 | Page load time | P95 < 2s | Analytics |
| NFR-002 | Traceability query | < 30 sec | Timer |
| NFR-003 | Scanner response | < 500ms | Timer |
| NFR-004 | API response | P95 < 1s | Monitoring |
| NFR-005 | Database query | P95 < 500ms | Query logs |

### 7.2 Security

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-006 | RLS on all tables | 100% | Audit needed |
| NFR-007 | Multi-tenant isolation | Zero cross-tenant leaks | Audit needed |
| NFR-008 | JWT authentication | All API routes | DONE |
| NFR-009 | Penetration test | Pass | TBD |
| NFR-010 | Data encryption (at rest) | AES-256 | Supabase managed |

### 7.3 Availability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-011 | Uptime | 99.5%+ | Monitoring |
| NFR-012 | MTTR | < 30 min | Incident tracking |
| NFR-013 | RTO | < 4 hours | DR testing |
| NFR-014 | RPO | < 1 hour | Backup verification |

### 7.4 Usability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-015 | Onboarding time | < 1 day (self-service) | User feedback |
| NFR-016 | Scanner UX | < 30s per operation | Time tracking |
| NFR-017 | Mobile responsive | All scanner pages | Visual testing |
| NFR-018 | Accessibility | WCAG 2.1 AA | Audit |

### 7.5 Scalability

| ID | Requirement | Target | Notes |
|----|-------------|--------|-------|
| NFR-019 | Concurrent users | 100+ per org | Load testing needed |
| NFR-020 | Data volume | 1M+ LPs per org | Index optimization |
| NFR-021 | Multi-site | Phase 4 | Architecture ready |

---

## 8. API Patterns

### 8.1 REST Endpoints

**Standard CRUD:**
```
GET    /api/{resource}         - List with filters
GET    /api/{resource}/:id     - Get details
POST   /api/{resource}         - Create
PUT    /api/{resource}/:id     - Update
DELETE /api/{resource}/:id     - Delete/Archive
```

**State Transitions:**
```
POST   /api/{resource}/:id/{action}
```
Examples: `/approve`, `/complete`, `/cancel`, `/release`

**Settings:**
```
GET    /api/{module}-settings
PUT    /api/{module}-settings
```

### 8.2 Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 8.3 Service Layer Pattern

```typescript
// lib/services/{resource}-service.ts

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCode
}

export async function create(input: CreateInput): Promise<ServiceResult> {
  // 1. Get org_id
  // 2. Validate
  // 3. Insert with admin client
  // 4. Invalidate cache
  // 5. Return result
}
```

---

## 9. Scanner & Mobile

### 9.1 Scanner Mode Architecture

**Entry Point:** `/scanner/*` routes
**Layout:** Dedicated scanner layout (simplified UI)
**Navigation:** Back button, minimal menu

### 9.2 Scanner Workflows (MVP)

| Workflow | Route | Status |
|----------|-------|--------|
| Receive | `/scanner/warehouse/receive` | 90% (BUG-004) |
| Move | `/scanner/warehouse/move` | DONE |
| Pick | `/scanner/warehouse/pick` | Phase 2 |
| Putaway | `/scanner/warehouse/putaway` | DONE |
| Production Consume | `/scanner/production/consume` | DONE |
| Production Output | `/scanner/production/output` | DONE |

### 9.3 Barcode Standards

**Current:**
- Internal LP: `LP-YYYY-NNNN`
- Internal product codes: Custom per org
- PO/WO barcodes: Document numbers

**GS1 Compliance (Phase 2 - FULL SCOPE):**

| Standard | Use Case | Priority | Phase 2 |
|----------|----------|----------|---------|
| GTIN-13/14 | Product identification | P1 | YES |
| GS1-128 | Shipping labels | P1 | YES |
| SSCC | Pallet/container ID | P1 | YES |
| GS1 DataMatrix | 2D with lot/expiry | P1 | YES |
| GS1 Digital Link | URL-based product info | P2 | YES |

### 9.4 Session Management

**Current Issues:**
- BUG-006: No session timeout
- Security risk on shared devices

**Planned Fix:**
- Configurable timeout (default: 15 min)
- Auto-logout + return to login
- Active sessions view

---

## 10. Print Integration

### 10.1 Current State

**Status:** Blocked (BUG-001, BUG-002)

**Issues:**
- Auto-print on receive: TODO stub
- Print API: Simulation only, no ZPL/IPP

### 10.2 Required Implementation

**Print Service:**
- ZPL generation (Zebra printers)
- IPP protocol (network printers)
- Print queue management
- Browser fallback (PDF)

**Label Types:**

| Label | Content | Module |
|-------|---------|--------|
| LP Label | LP#, Product, Qty, Date, QR | Warehouse |
| GS1-128 Label | GTIN, Lot, Expiry, SSCC | Shipping (Phase 2) |
| Shipping Label | Carrier format, tracking | Shipping |
| CoA | Certificate data | Quality |
| Packing Slip | SO items, customer | Shipping |

---

## 11. Compliance & Food Safety

### 11.1 Current Compliance Status

| Requirement | Status | Priority |
|-------------|--------|----------|
| Traceability (30 sec) | DONE | P0 |
| Lot Tracking (LP-based) | DONE | P0 |
| Allergen Management (EU14) | DONE | P0 |
| Audit Trail | DONE | P0 |
| HACCP Support (CCP) | Phase 2 (Epic 6) | P1 |
| GS1 Compliance | Phase 2 (Epic 10) | P1 |
| Electronic Signatures (21 CFR 11) | Phase 4 | P3 |
| Supplier QM | Phase 2 (Epic 14) | P1 |

### 11.2 Regulatory Coverage

**Polish/EU Requirements:**
- Sanepid audits: Traceability, allergens, lot tracking (COVERED)
- RASFF (Rapid Alert): Quick recall capability (COVERED)
- EU 1169/2011: Allergen labeling (COVERED)
- GS1 for retail: Phase 2

**Export/Large Client Requirements:**
- FSSC 22000: HACCP enhancements (Phase 2)
- BRC/IFS: Documentation (Phase 2)
- FDA (US): 21 CFR Part 11 (Phase 4)

---

## 12. Integration Architecture

### 12.1 Current Integrations

| Integration | Type | Status |
|-------------|------|--------|
| Supabase Auth | JWT authentication | DONE |
| Supabase Storage | File storage (CoA) | DONE |
| Upstash Redis | Caching | DONE |
| SendGrid | Email notifications | DONE |

### 12.2 Planned Integrations (Phase 2/3)

| Integration | Use Case | Priority |
|-------------|----------|----------|
| Polish Accounting (Comarch, Sage) | PO costs, invoices | P1 |
| GS1 Standards | Barcode compliance | P1 (Phase 2) |
| Webhook Outbound | Event notifications | P2 |
| Email/Calendar | Notifications | P2 |
| EDI (EDIFACT) | Retail chain orders | P3 |
| Scales/PLC | Auto-capture weights | P2 (Catch Weight) |
| BI Tools | Power BI, Tableau | P3 |

### 12.3 Integration Strategy

- **API-First:** All features via REST API
- **Webhook Events:** Key state changes (planned)
- **Import/Export:** CSV/Excel for migration
- **Partner Connectors:** Polish accounting systems (planned)
- **GS1 Standards:** Full compliance Phase 2

---

## 13. Out of Scope

### 13.1 Explicitly Excluded (All Phases)

| Item | Reason |
|------|--------|
| **Full Finance/Accounting Module** | Stay in MES lane, integrate with external |
| **CRM Module** | Not core to manufacturing |
| **HR Module** | Not core to manufacturing |
| **Full GL/Accounting** | Complexity, regulatory requirements |
| **On-premise deployment** | Cloud-only for MVP |
| **Multi-currency (full)** | Polish market first |

### 13.2 Deferred to Future

| Item | Deferred To | Reason |
|------|-------------|--------|
| ~~GS1 barcode compliance~~ | ~~Phase 2/3~~ | **NOW Phase 2 - FULL SCOPE** |
| HACCP CCP features | Phase 2 | QA module scope |
| 21 CFR Part 11 | Phase 4 | US export specific |
| Offline scanner (PWA) | Phase 3 | Network available in staging |
| Multi-site standardization | Phase 4 | Single-site focus first |
| ~~AI/ML features~~ | ~~Phase 4+~~ | **NOW Phase 3 (end)** |

---

## 14. Risks & Dependencies

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS security gap | Medium | HIGH | Security audit (DEBT-002) |
| Print integration delay | High | HIGH | Prioritize BUG-001/002 |
| GS1 complexity (full scope) | Medium | MEDIUM | 10-week timeline, incremental |
| Performance at scale | Low | Medium | Load testing |
| Test coverage gaps | Medium | Medium | Coverage target >70% |

### 14.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SMB prefers Excel | Medium | HIGH | ROI demonstration, pilot |
| Competition SMB tier | Medium | Medium | Speed to market |
| No budget for software | Medium | HIGH | Freemium tier consideration |
| Catch weight complexity | Low | Medium | Start with meat/fish pilot |

### 14.3 Dependencies

| Dependency | Type | Owner | Status | Risk |
|------------|------|-------|--------|------|
| Supabase platform | External | Supabase | Stable | Low |
| Vercel hosting | External | Vercel | Stable | Low |
| Zebra printer drivers | External | Zebra | Available | Low |
| Print integration | Internal | Dev Team | Blocked | High |
| RLS audit | Internal | Security | Pending | High |
| GS1 library (bwip-js) | External | Open Source | Available | Low |

---

## 15. Module PRD References

### 15.1 Completed Module PRDs

| Module | Location | Status |
|--------|----------|--------|
| Settings | TBD | Stories complete |
| Technical | TBD | Stories complete |
| Planning | TBD | Stories complete |
| Production | TBD | Stories complete |
| Warehouse | TBD | Stories 92% |

### 15.2 Planned Module PRDs

| Module | Location | Status |
|--------|----------|--------|
| Quality | @docs/2-MANAGEMENT/epics/06-quality-enhanced.md | Planned (Phase 2) |
| Shipping | @docs/2-MANAGEMENT/epics/07-shipping-enhanced.md | Planned (Phase 2) |
| GS1 Barcodes | @docs/2-MANAGEMENT/epics/10-gs1-barcodes.md | Planned (Phase 2) |
| Catch Weight | @docs/2-MANAGEMENT/epics/11-catch-weight.md | Planned (Phase 2) |
| NPD | TBD | Planned (Phase 3) |
| OEE & Performance | TBD | Planned (Phase 3) |

### 15.3 Supporting Documents

| Document | Path |
|----------|------|
| Project Brief | @docs/1-BASELINE/product/project-brief.md |
| Discovery Report | @docs/0-DISCOVERY/DISCOVERY-REPORT.md |
| Market Analysis | @docs/0-DISCOVERY/DISCOVERY-MARKET-REPORT.md |
| Bug Tracker | @docs/BUGS.md |
| MVP Phases | @docs/MVP-PHASES.md |
| Phase 2 Roadmap | @docs/2-MANAGEMENT/PHASE-2-ROADMAP.md |
| Phase 3 Roadmap | @docs/2-MANAGEMENT/PHASE-3-ROADMAP.md |
| Complete Epic Index | @docs/2-MANAGEMENT/COMPLETE-EPIC-INDEX.md |

---

## Appendix A: Story Count Summary

| Phase | Epics | Est. Stories | Status |
|-------|-------|--------------|--------|
| MVP | 1-5 | ~132 | 95% |
| Phase 2 | 6, 7, 10, 11, 12, 14 | ~161 | 0% |
| Phase 3 | 8, 9, 13, 15, 16 | ~180 | 0% |
| Phase 4 | 17, 18, 19 | ~80 | 0% |
| **Total** | **1-19** | **~553** | **~23%** |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| LP | License Plate - atomic unit of inventory |
| BOM | Bill of Materials - recipe/formulation |
| WO | Work Order - production order |
| PO | Purchase Order - order to supplier |
| TO | Transfer Order - internal transfer |
| SO | Sales Order - customer order |
| GRN | Goods Receipt Note - receiving document |
| ASN | Advanced Shipping Notice |
| NCR | Non-Conformance Report |
| CoA | Certificate of Analysis |
| FIFO | First In, First Out |
| FEFO | First Expired, First Out |
| RLS | Row Level Security |
| MES | Manufacturing Execution System |
| MOM | Manufacturing Operations Management |
| HACCP | Hazard Analysis Critical Control Points |
| GS1 | Global Standards Organization |
| SSCC | Serial Shipping Container Code |
| GTIN | Global Trade Item Number |
| OEE | Overall Equipment Effectiveness |
| CW | Catch Weight - variable weight products |
| SQM | Supplier Quality Management |
| NPD | New Product Development |
| MRP | Material Requirements Planning |

---

## Appendix C: Role Definitions

| Role | Purpose | Access Level |
|------|---------|--------------|
| admin | Full access | All modules, all settings |
| manager | Supervisor | Approvals, reports, monitoring |
| operator | Production worker | Production, scanner, basic warehouse |
| viewer | Read-only | Dashboard, reports (no edit) |
| planner | Planning specialist | Planning module |
| technical | Product/BOM manager | Technical module |
| purchasing | Procurement | Planning (PO, suppliers) |
| warehouse | Warehouse worker | Warehouse module |
| qc | Quality inspector | Quality module |
| finance | Financial analyst | Finance module (Phase 2) |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM Agent | Initial Master PRD |
| 2.0 | 2025-12-09 | PM Agent | Added Epics 8-19, GS1 FULL scope, Catch Weight early, AI/DT end Phase 3 |

---

**Document End**

**Status:** Approved
**Next Steps:**
1. Complete MVP (BUG-001/002/003/004/005)
2. RLS Security Audit (DEBT-002)
3. Performance Baseline (DEBT-001)
4. Begin Phase 2 Planning (Epic 6: Quality -> Epic 11: Catch Weight)

**Handoff:** ARCHITECT-AGENT for technical design validation
