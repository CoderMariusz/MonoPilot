# MonoPilot - Master Product Requirements Document (PRD)

## Document Info
- **Version:** 1.0
- **Created:** 2025-12-09
- **Author:** PM Agent (John)
- **Status:** Approved
- **Project Brief:** @docs/1-BASELINE/product/project-brief.md
- **Discovery Ref:** @docs/0-DISCOVERY/DISCOVERY-REPORT.md

---

## Executive Summary

MonoPilot to Manufacturing Execution System (MES) dla przemyslu spozywczego, zbudowany na nowoczesnym stosie technologicznym (Next.js 15, React 19, Supabase). System targetuje male i srednie firmy produkcyjne (5-100 pracownikow), wypelniajac luke miedzy Excel-based chaos a niedostepnymi enterprise ERP (D365, SAP).

**Kluczowe metryki:**
- **Status MVP:** 95% complete (5 z 5 epicow, Epic 5 na 92%)
- **Total Stories:** ~228 (132 MVP, 56 Phase 2, 40 Phase 3)
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
| **New Product Development** | Stage-gate, trial BOMs, costing | Phase 3 |
| **Performance Analytics** | Dashboards, OEE, optimization | Phase 3 |

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

### 2.1 Epic Overview

| Epic | Module | Stories | Priority | Status | Dependencies |
|------|--------|---------|----------|--------|--------------|
| 1 | Settings | ~20 | P0 | DONE | None (foundation) |
| 2 | Technical | ~25 | P0 | DONE | Epic 1 |
| 3 | Planning | ~30 | P0 | DONE | Epic 1, 2 |
| 4 | Production | ~21 | P0 | DONE | Epic 1, 2, 3 |
| 5 | Warehouse | 36 | P0 | 92% | Epic 1, 2, 3 |
| 6 | Quality | 28 | P1 | Planned | Epic 1, 5 |
| 7 | Shipping | 28 | P1 | Planned | Epic 1, 5, 6 |
| 8 | NPD | TBD | P2 | Planned | Epic 2 |
| 9 | Performance | TBD | P2 | Planned | All |

### 2.2 Module Dependency Graph

```
Epic 1 (Settings) <- Foundation
    |
    v
Epic 2 (Technical) <- Products, BOMs
    |
    v
Epic 3 (Planning) <- PO, TO, Suppliers
    |
    +------------------+
    |                  |
    v                  v
Epic 4 (Production)    Epic 8 (NPD) [Phase 3]
    |
    v
Epic 5 (Warehouse) <- CURRENT (92%)
    |
    v
Epic 6 (Quality) [Phase 2]
    |
    v
Epic 7 (Shipping) [Phase 2]
    |
    v
Epic 9 (Performance) [Phase 3]
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
- Product specifications & test results
- NCR lifecycle + root cause + CAPA
- Certificate of Analysis (CoA) upload
- Quality dashboard & reports

**Database Tables (planned):**
- `quality_holds`, `hold_investigation_notes`
- `product_specifications`, `test_results`
- `non_conformance_reports`, `ncr_links`
- `certificates_of_analysis`
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

#### Epic 9: Performance (Phase 3 - PLANNED)
**Purpose:** Optimization, offline support, analytics

**Key Features:**
- Query optimization
- Caching strategy enhancements
- Offline support (PWA)
- Analytics & BI dashboards
- Advanced reporting
- OEE tracking

---

## 3. Phase Breakdown

### 3.1 Phase 1: MVP (Core Manufacturing)

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

### 3.2 Phase 2: Quality & Shipping

**Goal:** Complete outbound logistics and quality compliance

| Epic | Name | Stories | Priority | Dependency |
|------|------|---------|----------|------------|
| 6 | Quality | 28 | HIGH | Epic 5 |
| 7 | Shipping | 28 | HIGH | Epic 5, 6 |

**Phase 2 Exit Criteria:**
- [ ] All Epic 6 stories DONE
- [ ] All Epic 7 stories DONE
- [ ] QA blocking shipping works
- [ ] Full order-to-ship workflow tested
- [ ] Customer can receive CoA with shipment

**Target:** Q2-Q3 2025

---

### 3.3 Phase 3: NPD & Performance

**Goal:** New Product Development and system optimization

| Epic | Name | Stories | Priority | Dependency |
|------|------|---------|----------|------------|
| 8 | NPD | TBD | MEDIUM | Epic 2 |
| 9 | Performance | TBD | MEDIUM | All |

**Phase 3 Exit Criteria:**
- [ ] NPD workflow complete
- [ ] Page load <2s (P95)
- [ ] Offline scanner working (PWA)
- [ ] Dashboard analytics live
- [ ] OEE tracking operational

**Target:** Q4 2025

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
| Packing Slips | Shipping | Phase 2 |
| CoA | Quality | Phase 2 |
| Shipping Labels | Shipping | Phase 2 |

**ZPL Format Example:**
```zpl
^XA
^FO50,50^ADN,36,20^FDLP-2024-001^FS
^FO50,100^ADN,24,12^FDProduct: Chocolate Powder^FS
^FO50,140^ADN,24,12^FDQty: 500 kg^FS
^FO50,180^BQN,2,6^FDMA,LP-2024-001^FS
^XZ
```

**Required Implementation:**
- ZPL generation for Zebra
- IPP protocol support (network)
- Print queue management
- Browser fallback (PDF)

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

**Field Visibility Pattern:**
```json
{
  "product_field_config": {
    "category": { "visible": true, "mandatory": false },
    "cost_per_unit": { "visible": true, "mandatory": false },
    "shelf_life_days": { "visible": true, "mandatory": false }
  }
}
```

**Feature Toggles:**
- `use_conditional_flags` - conditional BOM items
- `allow_consume_pending` - consume before QA
- `require_hold_release_approval` - manager approval for QA release

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

### 5.3 Configurable Fields Pattern

**Implementation:**
- Enable/disable via Settings
- Per-organization customization
- Toggle-driven features
- Inheritance where applicable

**Inheritance Examples:**
- Currency/Tax from Supplier
- Price/UoM from Product
- Allergens from ingredients (BOM)

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
| Quality | 26 | 18 | 8 |
| Shipping | 26 | 18 | 8 |
| NPD | 74 | 55 | 19 |
| **Total** | **216** | **160** | **56** |

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
| NFR-021 | Multi-site | Planned Phase 3 | Architecture ready |

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

**GS1 Compliance (Phase 2 consideration):**

| Standard | Use Case | Priority |
|----------|----------|----------|
| GTIN-13/14 | Product identification | P2 |
| GS1-128 | Shipping labels (SSCC) | P2 |
| GS1 DataMatrix | Traceability (lot, expiry) | P2 |

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
| HACCP Support (CCP) | Partial (Phase 2) | P1 |
| Electronic Signatures (21 CFR 11) | Not implemented | P2 |
| Supplier QM | Not implemented | P2 |

### 11.2 Regulatory Coverage

**Polish/EU Requirements:**
- Sanepid audits: Traceability, allergens, lot tracking (COVERED)
- RASFF (Rapid Alert): Quick recall capability (COVERED)
- EU 1169/2011: Allergen labeling (COVERED)

**Export/Large Client Requirements:**
- FSSC 22000: May need HACCP enhancements (Phase 2)
- BRC/IFS: May need additional documentation (Phase 2)
- FDA (US): 21 CFR Part 11 (NOT COVERED)

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
| Webhook Outbound | Event notifications | P2 |
| Email/Calendar | Notifications | P2 |
| EDI (EDIFACT) | Retail chain orders | P3 |
| Scales/PLC | Auto-capture weights | P3 |
| BI Tools | Power BI, Tableau | P3 |

### 12.3 Integration Strategy

- **API-First:** All features via REST API
- **Webhook Events:** Key state changes (planned)
- **Import/Export:** CSV/Excel for migration
- **Partner Connectors:** Polish accounting systems (planned)

---

## 13. Out of Scope

### 13.1 Explicitly Excluded (All Phases)

| Item | Reason |
|------|--------|
| **Finance/Accounting Module** | Stay in MES lane, integrate with external |
| **CRM Module** | Not core to manufacturing |
| **HR Module** | Not core to manufacturing |
| **Full GL/Accounting** | Complexity, regulatory requirements |
| **On-premise deployment** | Cloud-only for MVP |
| **Multi-currency (full)** | Polish market first |

### 13.2 Deferred to Future

| Item | Deferred To | Reason |
|------|-------------|--------|
| GS1 barcode compliance | Phase 2/3 | SMB target first |
| HACCP CCP features | Phase 2 | QA module scope |
| 21 CFR Part 11 | Maybe never | US export specific |
| Offline scanner (PWA) | Phase 3 | Network available in staging |
| Multi-site standardization | Phase 3 | Single-site focus first |
| AI/ML features | Phase 4+ | Competitors don't have edge |

---

## 14. Risks & Dependencies

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS security gap | Medium | HIGH | Security audit (DEBT-002) |
| Print integration delay | High | HIGH | Prioritize BUG-001/002 |
| Performance at scale | Low | Medium | Load testing |
| Test coverage gaps | Medium | Medium | Coverage target >70% |

### 14.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SMB prefers Excel | Medium | HIGH | ROI demonstration, pilot |
| Competition SMB tier | Medium | Medium | Speed to market |
| No budget for software | Medium | HIGH | Freemium tier consideration |

### 14.3 Dependencies

| Dependency | Type | Owner | Status | Risk |
|------------|------|-------|--------|------|
| Supabase platform | External | Supabase | Stable | Low |
| Vercel hosting | External | Vercel | Stable | Low |
| Zebra printer drivers | External | Zebra | Available | Low |
| Print integration | Internal | Dev Team | Blocked | High |
| RLS audit | Internal | Security | Pending | High |

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
| Quality | TBD | Planned (Phase 2) |
| Shipping | TBD | Planned (Phase 2) |
| NPD | TBD | Planned (Phase 3) |
| Performance | TBD | Planned (Phase 3) |

### 15.3 Supporting Documents

| Document | Path |
|----------|------|
| Project Brief | @docs/1-BASELINE/product/project-brief.md |
| Discovery Report | @docs/0-DISCOVERY/DISCOVERY-REPORT.md |
| Market Analysis | @docs/0-DISCOVERY/DISCOVERY-MARKET-REPORT.md |
| Bug Tracker | @docs/BUGS.md |
| MVP Phases | @docs/MVP-PHASES.md |
| Database Schema | @docs-old/1-BASELINE/reference/database-schema.md |
| Code Architecture | @docs-old/1-BASELINE/reference/code-architecture.md |

---

## Appendix A: Story Count Summary

| Phase | Epics | Est. Stories | Status |
|-------|-------|--------------|--------|
| MVP | 1-5 | ~132 | 95% |
| Phase 2 | 6-7 | ~56 | 0% |
| Phase 3 | 8-9 | ~40 | 0% |
| **Total** | **1-9** | **~228** | **~55%** |

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
| finance | Financial analyst | Finance module (future) |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM Agent | Initial Master PRD |

---

**Document End**

**Status:** Approved
**Next Steps:**
1. Complete MVP (BUG-001/002/003/004/005)
2. RLS Security Audit (DEBT-002)
3. Performance Baseline (DEBT-001)
4. Begin Phase 2 Planning (Epic 6: Quality)

**Handoff:** ARCHITECT-AGENT for technical design validation
