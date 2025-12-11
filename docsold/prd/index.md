# MonoPilot PRD - Module Index

## Overview

MonoPilot is a Manufacturing Execution System (MES) for food manufacturing. This document provides the index and map of all PRD modules, their dependencies, and development phases.

---

## Module Map

### Core Modules (Phase 1-3)

| Module | Purpose | Dependencies | Status |
|--------|---------|--------------|--------|
| [Settings](./modules/settings.md) | Organization setup, users, warehouses, configurations | None (foundation) | ✅ DONE (19 stories) |
| [Technical](./modules/technical.md) | Products, BOMs, Routings, Allergens, Tracing | Settings | ✅ DONE (28 stories) |
| [Planning](./modules/planning.md) | Purchase Orders, Transfer Orders, Work Orders, MRP | Settings, Technical | ✅ DONE (30 stories) |
| [Production](./modules/production.md) | WO execution, consumption, outputs, yield | Settings, Technical, Planning | 🚧 Track A DONE (5 stories), Track B/C IN PROGRESS |
| [Warehouse](./modules/warehouse.md) | License Plates, ASN, GRN, Stock Movements, Scanner | Settings, Technical, Planning | Draft |
| [Quality](./modules/quality.md) | QA status, holds, specifications, NCR, CoA | Settings, Technical, Warehouse | Draft |
| [Shipping](./modules/shipping.md) | Sales Orders, picking, packing, delivery | Settings, Warehouse, Quality | Draft |

### Premium Modules (Phase 4)

| Module | Purpose | Dependencies | Status |
|--------|---------|--------------|--------|
| [NPD](./modules/npd.md) | New Product Development, Stage-Gate, formulations | Technical, Planning | Draft |
| [Finance](./modules/finance.md) | Costing, budgeting, financial reporting | All modules | Placeholder |

---

## Development Phases

### Phase 1: Foundation (MVP)
**Goal**: Basic manufacturing operations

- **Settings Module**: Organization, users, warehouses, locations
- **Technical Module**: Products, basic BOMs
- **Planning Module**: PO, TO, WO creation
- **Production Module**: Basic WO execution
- **Warehouse Module**: LP, GRN, stock moves

### Phase 2: Full Operations
**Goal**: Complete production workflow

- **Technical Module**: BOM versioning, routings, allergens
- **Planning Module**: Bulk import, configurable statuses
- **Production Module**: By-products, yield tracking
- **Warehouse Module**: ASN, pallets, split/merge
- **Quality Module**: Full QA management

### Phase 3: Advanced Features
**Goal**: Optimization and shipping

- **Shipping Module**: Full sales order fulfillment
- **Quality Module**: Specifications, testing
- All modules: Reports and analytics

### Phase 4: Premium Add-ons
**Goal**: Advanced capabilities

- **NPD Module**: Product development workflow
- **Finance Module**: Costing and budgeting

---

## Module Dependencies

```
Settings (Foundation)
    │
    ├── Technical
    │       │
    │       ├── Planning
    │       │       │
    │       │       ├── Production
    │       │       │       │
    │       │       │       └── Warehouse
    │       │       │               │
    │       │       │               ├── Quality
    │       │       │               │       │
    │       │       │               │       └── Shipping
    │       │       │               │
    │       │       │               └── NPD (Premium)
    │       │       │
    │       │       └── Finance (Premium) - connects to all
    │       │
    │       └── NPD (Premium)
    │
    └── All Modules
```

---

## Functional Requirements Summary

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
- **Warehouse**: Receive, Move, Split, Merge, Pack
- **Production**: Consume, Output
- **Quality**: QA Pass/Fail
- **Shipping**: Pick, Pack, Ship

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

### 4. Configurable Fields
- Enable/disable via Settings
- Per-organization customization
- Toggle-driven features

### 5. Inheritance
- Currency/Tax from Supplier
- Price/UoM from Product
- Allergens from ingredients

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

## Document Structure

Each module PRD follows this structure:

1. **Overview** - Purpose, dependencies, key concepts
2. **Settings** - Configuration toggles
3. **Core Entities** - Fields, status flows, UI
4. **Workflows** - Desktop and Scanner
5. **Database Tables** - Schema with indexes
6. **API Endpoints** - REST endpoints
7. **Functional Requirements** - Numbered FRs
8. **Integration Points** - Module connections
9. **Status** - Version, progress

---

## Reading Order

For new team members:

1. **Start**: [Settings](./modules/settings.md) - Foundation
2. **Core Data**: [Technical](./modules/technical.md) - Products/BOMs
3. **Operations**: [Planning](./modules/planning.md) → [Production](./modules/production.md)
4. **Inventory**: [Warehouse](./modules/warehouse.md)
5. **Quality**: [Quality](./modules/quality.md)
6. **Outbound**: [Shipping](./modules/shipping.md)
7. **Advanced**: [NPD](./modules/npd.md) - Premium

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-19 | Initial modular PRD structure |

---

## Status Summary

- **Total Modules**: 9
- **Completed**: 3 (Settings, Technical, Planning)
- **In Progress**: 1 (Production - Track A done, B/C in progress)
- **Planned**: 5 (Warehouse, Quality, Shipping, NPD, Finance)
- **Overall Progress**: ~65% (82 stories DONE out of ~140 total MVP stories)

---

_This modular PRD structure enables parallel development by 3-4 developers with clear module boundaries and defined interfaces._
