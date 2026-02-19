# MonoPilot PRD - Module Index

## Overview

MonoPilot is a Manufacturing Execution System (MES) for food manufacturing. This document provides the index and map of all PRD modules, their dependencies, and development phases.

**Target Market**: Small-to-medium food manufacturers (5-100 employees)
**Positioning**: Cloud-native, easy-deploy MES - between Excel and enterprise ERP

---

## Module Map

### Core Modules (Epic 1-7)

| Epic | Module | Purpose | Lines | Status |
|------|--------|---------|-------|--------|
| 1 | [Settings](./modules/settings.md) | Organization, users, warehouses, configurations | 703 | ✅ PRD Ready |
| 2 | [Technical](./modules/technical.md) | Products, BOMs, Routings, Allergens, Tracing | 772 | ✅ PRD Ready |
| 3 | [Planning](./modules/planning.md) | POs, TOs, WOs, MRP/MPS, Demand Forecasting | 2,793 | ✅ PRD Ready |
| 4 | [Production](./modules/production.md) | WO execution, consumption, outputs, OEE | 1,328 | ✅ PRD Ready |
| 5 | [Warehouse](./modules/warehouse.md) | License Plates, ASN/GRN, Stock, FIFO/FEFO | 1,147 | ✅ PRD Ready |
| 6 | [Quality](./modules/quality.md) | QA, Holds, HACCP/CCP, NCR, CoA, CAPA | 731 | ✅ PRD Ready |
| 7 | [Shipping](./modules/shipping.md) | Sales Orders, Picking, Packing, Carriers | 1,345 | ✅ PRD Ready |

### Premium Modules (Epic 8-9)

| Epic | Module | Purpose | Lines | Status |
|------|--------|---------|-------|--------|
| 8 | [NPD](./modules/npd.md) | New Product Development, Stage-Gate, Trials | 1,004 | ✅ PRD Ready |
| 9 | [Finance](./modules/finance.md) | Costing, Variance, Margins, Budget (NOT full ERP) | 892 | ✅ PRD Ready |

### New Modules (Epic 10-11)

| Epic | Module | Purpose | Lines | Status |
|------|--------|---------|-------|--------|
| 10 | [OEE](./modules/oee.md) | OEE Calculation, Machine Dashboard, Downtime, Energy | 914 | ✅ PRD Ready |
| 11 | [Integrations](./modules/integrations.md) | Comarch Optima, EDI, Portals, Webhooks, API | 1,647 | ✅ PRD Ready |

---

## PRD Statistics

| Metric | Value |
|--------|-------|
| **Total Modules** | 11 |
| **Total PRD Lines** | ~13,276 |
| **PRD Status** | All Ready |
| **Estimated FRs** | 400+ |

---

## Development Phases

### Phase 1: Foundation (MVP) - Weeks 1-16
**Goal**: Basic manufacturing operations for first customers

| Module | Key Features |
|--------|--------------|
| Settings | Organization, Users (10 roles), Warehouses, Locations, Machines |
| Technical | Products, BOMs (basic), Allergens (14 EU) |
| Planning | PO, TO, WO creation and management |
| Production | WO execution (start/pause/complete), Material consumption |
| Warehouse | License Plates, GRN, Basic stock movements |

### Phase 2: Full Operations - Weeks 17-32
**Goal**: Complete production workflow with quality

| Module | Key Features |
|--------|--------------|
| Technical | BOM versioning, Routings, Traceability |
| Planning | Bulk import, MRP basic, Supplier management |
| Production | By-products, Yield tracking, Operation tracking |
| Warehouse | ASN, FIFO/FEFO, Cycle counting, GS1 barcodes |
| Quality | QA Status, Holds, Inspections, NCR |
| Shipping | Sales Orders, Pick lists, Basic shipping |

### Phase 3: Advanced Features - Weeks 33-48
**Goal**: Optimization, analytics, shipping

| Module | Key Features |
|--------|--------------|
| Quality | HACCP/CCP, CAPA, Supplier Quality, CoA |
| Shipping | Wave picking, Carrier integration, GS1 labels |
| OEE | Real-time OEE, Downtime tracking, Energy monitoring |
| Finance | Production costing, Variance analysis, Margins |

### Phase 4: Premium & Integrations - Weeks 49+
**Goal**: Advanced capabilities and ecosystem

| Module | Key Features |
|--------|--------------|
| NPD | Stage-gate workflow, Trial BOMs, Sample management |
| Integrations | Comarch Optima, EDI, Supplier/Customer portals |
| Planning | MRP/MPS advanced, Demand forecasting, Capacity planning |

---

## Module Dependencies

```
Settings (Foundation - Epic 1)
    │
    ├── Technical (Epic 2)
    │       │
    │       ├── Planning (Epic 3)
    │       │       │
    │       │       ├── Production (Epic 4)
    │       │       │       │
    │       │       │       └── OEE (Epic 10)
    │       │       │
    │       │       └── Warehouse (Epic 5)
    │       │               │
    │       │               ├── Quality (Epic 6)
    │       │               │       │
    │       │               │       └── Shipping (Epic 7)
    │       │               │
    │       │               └── Finance (Epic 9)
    │       │
    │       └── NPD (Epic 8)
    │
    └── Integrations (Epic 11) - connects to all modules
```

---

## Cross-Module Features

### Multi-Tenancy (All Modules)
- `org_id` on all tables
- Row Level Security (RLS)
- Tenant isolation

### Audit Trail (All Modules)
- `created_by`, `updated_by`, `created_at`, `updated_at`
- Action logging
- User tracking

### Scanner Interface
| Module | Scanner Workflows |
|--------|-------------------|
| Warehouse | Receive, Move, Split, Merge, Putaway, Pick |
| Production | Start WO, Consume Material, Register Output |
| Quality | QA Pass/Fail, Inspection |
| Shipping | Pick Confirm, Pack, Ship |

### Configurable via Settings
- Every module has Settings section
- Toggle features on/off
- Configurable statuses
- Field enable/disable

---

## Key Patterns

### 1. License Plate (LP)
- Atomic unit of inventory
- No loose quantity tracking
- Full genealogy

### 2. BOM Snapshot
- WO captures BOM at creation
- Immutable during production
- Version tracking

### 3. Date-Based Versioning
- BOM versions with effective dates
- Formulation versions (NPD)
- Overlap prevention

### 4. GS1 Compliance
- GTIN-14 for products
- GS1-128 for lot/expiry
- SSCC-18 for pallets/shipments

### 5. FIFO/FEFO
- Pick suggestions based on receipt date or expiry
- Configurable per warehouse/product
- Enforcement levels (suggest/warn/block)

---

## API Patterns

### REST Endpoints
- `GET /api/{resource}` - List with filters
- `GET /api/{resource}/:id` - Get details
- `POST /api/{resource}` - Create
- `PUT /api/{resource}/:id` - Update
- `DELETE /api/{resource}/:id` - Delete/Archive

### Common Actions
- `POST /api/{resource}/:id/{action}` - State transitions
- Examples: `/approve`, `/complete`, `/cancel`

### Settings Endpoints
- `GET /api/{module}-settings`
- `PUT /api/{module}-settings`

---

## Competitive Positioning

Based on competitive analysis (see `docs/0-DISCOVERY/FEATURE-GAP-ANALYSIS.md`):

| Differentiator | MonoPilot | Competitors |
|----------------|-----------|-------------|
| **Ease of Use** | 95% | 60-70% |
| **Deployment Speed** | Weeks | Months |
| **SMB Affordability** | $50/user/mo | $500-2000/user/mo |
| **Cloud-Native** | 100% | 50-80% |
| **Food-Specific** | 100% | 60-80% |

### Competitive Feature Coverage
- MonoPilot: 82% (Phase 1+2)
- AVEVA MES: 81%
- Plex: 88%
- Aptean: 81%
- CSB-System: 80%

---

## Reading Order

For new team members:

1. **Start**: [Settings](./modules/settings.md) - Foundation
2. **Core Data**: [Technical](./modules/technical.md) - Products/BOMs
3. **Operations**: [Planning](./modules/planning.md) → [Production](./modules/production.md)
4. **Inventory**: [Warehouse](./modules/warehouse.md)
5. **Quality**: [Quality](./modules/quality.md)
6. **Outbound**: [Shipping](./modules/shipping.md)
7. **Analytics**: [OEE](./modules/oee.md) - Performance
8. **Premium**: [NPD](./modules/npd.md), [Finance](./modules/finance.md)
9. **Ecosystem**: [Integrations](./modules/integrations.md)

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-19 | Initial modular PRD structure |
| 2.0 | 2025-12-10 | Complete rewrite - all 11 modules, competitive gaps included |

---

## Document Structure

Each module PRD follows this structure:

1. **Overview** - Purpose, dependencies, key concepts
2. **Functional Requirements** - Table format (ID, name, priority, phase)
3. **Database Tables** - Name + key columns
4. **API Endpoints** - List format
5. **Scanner Workflows** - Step-by-step (where applicable)
6. **Phase Roadmap** - Summary table
7. **Integration Points** - Module connections

---

_Total PRD: 11 modules, ~13,276 lines, 400+ functional requirements_
_Last updated: 2025-12-10_
