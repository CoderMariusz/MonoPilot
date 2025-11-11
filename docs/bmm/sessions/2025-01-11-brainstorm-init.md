# Brainstorm Session: MonoPilot Project Initialization

**Date**: 2025-01-11  
**Session Type**: Workflow-Init + Brainstorm  
**Project**: MonoPilot (Unreal)  
**Project Type**: Brownfield MES System  
**Path Chosen**: Standard (with documentation)

---

## 📊 Project Overview

### What is MonoPilot?
**Complex Manufacturing Execution System (MES)** - comprehensive management from project inception through production planning, warehouse management, production management, production lines, to shipping. Future plans include financial tools integration.

### Scope & Vision
- **Scalable & Modular**: From small firms (warehouse control only) to large enterprises (complete solution)
- **Target Market**: Small to large manufacturing companies
- **Domains**: Food processing, meat products, composite manufacturing

---

## ✅ Current State (Built)

### Settings Module ✅ COMPLETE
- Suppliers management
- Machines registry
- Allergens database
- Tax codes configuration
- Product catalog (RM_MEAT, DG_*, PR, FG types)

### BOM Module ✅ COMPLETE
- Bill of Materials (BOMs) with versioning
- BOM Items with component rules:
  - `is_optional` - optional components
  - `is_phantom` - not tracked as separate LP
  - `consume_whole_lp` - 1:1 LP relationship
- Product tree structure
- BOM status lifecycle (draft → active → archived)

### Planning Module 🟡 IN PROGRESS
- **Transfer Orders (TO)**: Warehouse-to-warehouse transfers
  - Status: draft → submitted → in_transit → received → closed
  - Planned/actual ship & receive dates
  - Recent fixes: TO flow corrected (warehouse→warehouse, not location→location)
- **Purchase Orders (PO)**: Procurement management
  - Status: draft → confirmed → shipped → received → closed
  - Quick PO Entry feature (auto-split by supplier/currency)
  - Payment tracking
- **Work Orders (WO)**: Production orders
  - Status: draft → released → in_progress → completed → closed
  - BOM snapshot at creation

---

## ❌ Missing Modules (Planned)

### Production Module ❌ NOT STARTED
- License Plate (LP) tracking
- Scanner integration (real-time sync)
- Work Order execution
- Operation stage tracking
- Material consumption
- Output recording

### Warehouse Module ❌ NOT STARTED
- Stock moves (GRN_IN, WO_ISSUE, TRANSFER, ADJUST, WO_OUTPUT)
- Goods Receipt Notes (GRN)
- Inventory management
- Location tracking
- LP reservations

### QA & Traceability ❌ NOT STARTED
- Quality gates
- Batch tracking
- LP genealogy (parent-child relationships)
- Recall reports
- Compliance tracking

### Reporting & Analytics ❌ FUTURE
- Production reports
- KPI dashboards
- OEE (Overall Equipment Effectiveness)
- Yield analysis
- Order analytics
- ML-assisted production planning

---

## 🎯 Top 4 Identified Challenges

### 1. Traceability (PRIORITY 2)
**Problem**: Track products from raw material → process → finished goods → shipping
- Parent-child LP relationships
- Batch tracking for recall scenarios
- Compliance (FDA/USDA)

**Current State**:
- ✅ `license_plates` has `parent_lp_id`, `parent_lp_number`, `origin_type`, `origin_ref`
- ❌ Missing: LP genealogy view/query system
- ❌ Missing: Recursive traceability reports

**Recommended Approach**:
- **Phase 1**: Simple parent-child (HAVE)
- **Phase 2**: Recursive CTE in Postgres for genealogy tree
- **Phase 3**: Materialized view for fast recall reports

---

### 2. Scanner Integration (Identified, not prioritized yet)
**Problem**: Real-time sync between scanner terminals and portal
- Offline scanner capability
- Conflict resolution (concurrent edits)
- Performance (1000+ scans/hour)

**Current State**:
- ❌ No `/api/scanner/*` endpoints
- ❌ No `scanner_sessions` or `scanner_queue` tables
- ❌ No offline-first architecture

**Recommended Approach**:
- **Phase 1**: HTTP API (scanner → Supabase REST)
- **Phase 2**: Supabase Realtime (WebSocket) for live updates
- **Phase 3**: Offline-first (local cache + sync queue)
- **Risk**: Optimistic locking needed (`version` column in LP)

---

### 3. BOM Complexity (PRIORITY 1) 🔥
**Problem**: Complex product trees with special rules
- **Phantom items**: Components not tracked as separate LP (e.g., spices in mix)
- **By-products**: Multiple outputs from one WO (e.g., bones from meat)
- **Conditional BOM**: Different BOMs for same FG (seasonal, supply chain variations)

**Current State**:
- ✅ `bom_items` has: `is_optional`, `is_phantom`, `consume_whole_lp`
- ❌ Missing: By-products support (only single `output_quantity` in WO)
- ❌ Missing: Multi-version BOM with `effective_date`

**Recommended Approach**:
- **Phase 1**: Simple BOM (1 FG, N materials) - **HAVE**
- **Phase 2**: By-products → `wo_by_products(wo_id, product_id, qty, lp_id)` table
- **Phase 3**: Multi-version BOM → `boms.version`, `boms.effective_date`, conditional rules

---

### 4. Status Workflows (Identified, not prioritized yet)
**Problem**: Status transitions must be validated and audited
- TO: draft → submitted → in_transit → received → closed
- PO: draft → confirmed → shipped → received → closed
- WO: draft → released → in_progress → completed → closed
- **Questions**: Who can change status? Can transitions be reversed?

**Current State**:
- ✅ Check constraints for valid statuses (e.g., `to_header_status_check`)
- ❌ Missing: Postgres triggers for transition validation
- ❌ Missing: Audit log (`status_history` table)

**Recommended Approach**:
- **Phase 1**: Simple check constraints (HAVE)
- **Phase 2**: Triggers like `validate_to_status_transition()` (similar to `validate_bom_status_transition`)
- **Phase 3**: Audit log with role-based permissions

---

## 📋 Strategic Roadmap (Based on Priorities)

### Phase 1: BOM Complexity Enhancement 🔥 PRIORITY 1
**Why First?**: BOM is the foundation of MES. Without proper BOM:
- Can't create correct Work Orders
- Can't reserve materials properly
- Can't model complex products

**Deliverables**:
1. By-products support (`wo_by_products` table)
2. Multi-version BOM (versioning, effective dates)
3. Conditional components (seasonal variants)
4. BOM validation improvements

**Epic**: "BOM Complexity v2"

---

### Phase 2: Traceability System 🔗 PRIORITY 2
**Why After BOM?**: Traceability needs production data (LP parent-child)
- BOM defines "what comes from what"
- Traceability tracks "which specific LP was used"

**Deliverables**:
1. LP genealogy system (recursive queries)
2. Batch tracking across production stages
3. Recall reports ("show all FG from this RM LP")
4. Compliance dashboards

**Epic**: "Traceability & Compliance"

---

### Phase 3: Scanner Integration 📱
**Why After Traceability?**: Scanner needs stable LP/traceability model

**Deliverables**:
1. Scanner API endpoints
2. Real-time sync (WebSocket)
3. Offline mode with conflict resolution
4. Performance optimization

**Epic**: "Scanner Integration & Real-time Sync"

---

### Phase 4: Status Workflow Guards 🔒
**Why Last?**: Can incrementally improve as other modules mature

**Deliverables**:
1. Status transition triggers
2. Audit log system
3. Role-based permissions
4. Status change notifications

**Epic**: "Workflow Governance"

---

## 🗂️ Database Architecture (Current)

### Tables Count: 34 (as of migration 043)

**Module Breakdown**:
- **Settings**: 7 tables (users, suppliers, machines, tax_codes, allergens, etc.)
- **Products & BOM**: 4 tables (products, boms, bom_items, product_allergens)
- **Planning**: 6 tables (po_header, po_line, to_header, to_line, work_orders, wo_materials)
- **Warehouse**: 3 tables (warehouses, locations, warehouse_settings)
- **Production**: 9 tables (license_plates, stock_moves, grns, production_outputs, etc.)
- **Routings**: 3 tables (routings, routing_operations, operation_names)
- **Audit**: 2 tables (audit_log, notifications)

**Recent Migration Changes** (043_warehouse_settings.sql):
- Added `warehouse_settings` table for default receiving locations
- `default_to_receive_location_id` - for Transfer Orders
- `default_po_receive_location_id` - for Purchase Orders
- `default_transit_location_id` - for goods in transit

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Filament-style UI)
- **State**: React hooks + custom `clientState.ts`
- **Testing**: Vitest (unit), Playwright (E2E)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **RLS**: Row Level Security enabled on all tables
- **RPC**: Postgres functions for complex logic
  - `generate_to_number()` - TO number generation
  - `mark_to_shipped()`, `mark_to_received()` - TO status updates
  - `quick_create_pos()` - Auto-split POs by supplier/currency

### Monorepo Structure
```
MonoPilot/
├── apps/
│   ├── frontend/         # Next.js app
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/
│   │   │   ├── api/      # API clients
│   │   │   ├── hooks/    # Custom React hooks
│   │   │   ├── supabase/ # DB schema & migrations
│   │   │   └── types.ts  # TypeScript interfaces
│   │   └── __tests__/    # Unit & integration tests
│   └── backend/          # (placeholder)
├── docs/                 # Documentation
│   ├── bmm/             # BMad Method artifacts
│   ├── plan/            # Feature plans
│   └── *.md             # System documentation
└── packages/
    └── shared/          # Shared utilities
```

---

## ⚠️ Known Risks & Technical Debt

### 1. Performance Concerns
- **BOM Complexity**: Recursive queries for deep product trees may be slow
- **Traceability**: LP genealogy queries could be expensive for large datasets
- **Scanner**: 1000+ scans/hour requires optimization

**Mitigation**: Materialized views, proper indexing, caching strategies

---

### 2. Data Migration Challenges
- **Traceability**: If LPs already exist in production, need backfill strategy for parent-child relationships
- **BOM Versioning**: Existing BOMs need migration to versioned schema

**Mitigation**: Phased rollout, migration scripts with rollback capability

---

### 3. Concurrent Edit Conflicts
- **Scanner vs Portal**: Operators scanning LP while planner edits same LP
- **Multi-user**: Multiple operators working on same WO

**Mitigation**: Optimistic locking (`version` column), conflict resolution UI

---

### 4. Compliance & Audit Trail
- **Status Changes**: Need full audit trail (who, when, why)
- **BOM Changes**: Track all modifications for compliance

**Mitigation**: `status_history` table, `bom_history` table, immutable audit logs

---

## 📚 Documentation Status

### ✅ Complete
- `01_system_overview.md` - High-level system description
- `11_PROJECT_STRUCTURE.md` - Directory & file structure
- `12_DATABASE_TABLES.md` - Database schema (34 tables)
- `13_DATABASE_MIGRATIONS.md` - Migration history (000-043)
- `14_NIESPOJNOSCI_FIX_CHECKLIST.md` - Inconsistencies tracker
- `15_DOCUMENTATION_AUDIT.md` - Documentation quality audit

### 🟡 In Progress
- Feature plans in `docs/plan/` (TO/PO/WO plans)

### ❌ Missing
- API documentation (endpoints, contracts)
- Component documentation (UI/UX patterns)
- Test coverage reports
- Deployment guide

---

## 🎯 Next Steps (Immediate Actions)

1. ✅ **Complete Workflow-Init** - DONE
2. 🔄 **Document-Project** - IN PROGRESS (this file)
3. 📝 **Create Tech-Spec** - Generate `docs/bmm/artifacts/tech-spec.md`
4. 🎯 **Plan Epic: BOM Complexity v2** - Define features & tasks
5. 💻 **Implement Priority 1** - Start coding

---

## 📊 Success Metrics

### For BOM Complexity Epic:
- ✅ By-products supported (multiple outputs per WO)
- ✅ Multi-version BOM with effective dates
- ✅ Conditional components working
- ✅ All tests green (unit + integration + E2E)
- ✅ Performance: BOM tree query < 500ms for 50-level depth

### For Traceability Epic:
- ✅ LP genealogy working (parent-child queries)
- ✅ Recall report: "Find all FG from RM batch" < 2 seconds
- ✅ Batch tracking across all production stages
- ✅ Compliance dashboard functional

---

## 📝 Notes & Observations

### Strengths of Current Implementation
- ✅ Clean monorepo structure (Next.js + Supabase)
- ✅ TypeScript everywhere (type safety)
- ✅ RLS enabled on all tables (security)
- ✅ Migration system organized (000-043, one per table)
- ✅ Filament-style UI (consistent design)

### Areas for Improvement
- ⚠️ Some components still use `clientState` (should use API directly)
- ⚠️ Missing comprehensive API documentation
- ⚠️ Test coverage incomplete (need more E2E tests)
- ⚠️ No CI/CD pipeline yet

---

## 🔗 Related Documents

- [Project Structure](../11_PROJECT_STRUCTURE.md)
- [Database Tables](../12_DATABASE_TABLES.md)
- [Database Migrations](../13_DATABASE_MIGRATIONS.md)
- [Inconsistencies Checklist](../14_NIESPOJNOSCI_FIX_CHECKLIST.md)
- [Documentation Audit](../15_DOCUMENTATION_AUDIT.md)

---

**Session End**: 2025-01-11  
**Next Session**: Tech-Spec generation → Epic planning

